/**
 * Mirror Protocol — Executor Bot (Sepolia)
 *
 * Watches Envio GraphQL for active delegations and automatically executes
 * real Uniswap V2 swaps through the UniswapV2Adapter on Ethereum Sepolia
 * whenever on-chain conditions match.
 *
 * Flow:
 *   1. Poll Envio (Sepolia indexer) for active delegations + pattern metrics
 *   2. Check per-delegation conditions (min win rate / ROI / volume)
 *   3. Call ExecutionEngine.executeTrade with callData =
 *      UniswapV2Adapter.swap(WETH, amount, minOut, ExecutionEngine)
 *   4. UniswapV2Adapter pulls WETH from the ExecutionEngine, swaps via the
 *      real Sepolia Uniswap V2 Router02, sends USDC back to the engine
 *   5. TradeExecuted event fires, Envio indexes it, frontend feed renders it
 *
 * Usage:
 *   node executor-bot/bot.mjs
 *
 * Requirements:
 *   - .env with DEPLOYER_PRIVATE_KEY (must be the executor on the engine)
 *   - .env with SEPOLIA_RPC_URL (defaults to publicnode)
 *   - .env with VITE_ENVIO_GRAPHQL_URL_SEPOLIA (the live Sepolia indexer URL)
 */

import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency required)
function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  const lines = readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key) env[key.trim()] = rest.join('=').trim();
  }
  return env;
}

const ENV = loadEnv();

const SEPOLIA_CHAIN = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [ENV.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
};

const GRAPHQL_ENDPOINT =
  ENV.VITE_ENVIO_GRAPHQL_URL_SEPOLIA ||
  ENV.ENVIO_GRAPHQL_URL ||
  'https://indexer.dev.hyperindex.xyz/009ef9b/v1/graphql';

const CONTRACTS = {
  // Mirror Protocol on Sepolia (gate 7 deploy)
  EXECUTION_ENGINE: (ENV.SEPOLIA_EXECUTION_ENGINE_ADDRESS || '0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A'),
  DELEGATION_ROUTER: (ENV.SEPOLIA_DELEGATION_ROUTER_ADDRESS || '0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8'),
  BEHAVIORAL_NFT: (ENV.SEPOLIA_BEHAVIORAL_NFT_ADDRESS || '0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954'),
  // UniswapV2Adapter — wraps the real Sepolia Uniswap V2 Router02
  UNISWAP_V2_ADAPTER: (ENV.SEPOLIA_UNISWAP_ADAPTER_ADDRESS || '0x5B59f315d4E2670446ed7B130584A326A0f7c2D3'),
  // Sepolia Uniswap V2 infrastructure (verified live)
  WETH: (ENV.SEPOLIA_WETH || '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14'),
  USDC: (ENV.SEPOLIA_TOKEN_B || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'),
};

// ─── Trade direction configuration ──────────────────────────────────────────
// TRADE_TOKEN: the input token for each swap. Currently USDC (the engine
// accumulated USDC from prior WETH→USDC swaps, so we flip the direction to
// swap USDC→WETH). To switch back to WETH→USDC, change TRADE_TOKEN to
// CONTRACTS.WETH and TRADE_AMOUNT to parseEther('0.005').
//
// TRADE_AMOUNT: 5 USDC (6 decimals = 5_000_000). At ~$8200/ETH implied by
// the Sepolia pool, this produces ~0.0006 WETH per swap. The engine holds
// ~2300 USDC from prior swaps, so this supports ~460 trades before topping up.
//
// The engine's balance check at ExecutionEngine.sol line 504-507 reads
// IERC20(token).balanceOf(smartAccount) — so the delegation's smart account
// (= executor EOA) must also hold some USDC. The SetupUSDCTrades script
// recovers 100 USDC from the engine to the executor for this purpose.
const TRADE_TOKEN = CONTRACTS.USDC;
const TRADE_AMOUNT = 5_000_000n; // 5 USDC (6 decimals)

// UniswapV2Adapter.swap(IERC20 tokenIn, uint256 amountIn, uint256 minAmountOut, address to)
const UNISWAP_V2_ADAPTER_ABI = [{
  name: 'swap',
  type: 'function',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'tokenIn', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'minAmountOut', type: 'uint256' },
    { name: 'to', type: 'address' },
  ],
  outputs: [{ name: 'amountOut', type: 'uint256' }],
}];

// Minimal WETH9 ABI — just the three calls the top-up helper needs.
const WETH9_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

/**
 * Ensure a delegation's smart account holds at least `amountNeeded` WETH.
 *
 * Why this exists:
 *   ExecutionEngine._validateExecution calls IERC20(token).balanceOf(smartAccount)
 *   and reverts if it's below the trade amount. A freshly-created delegation's
 *   smart account starts with zero WETH. Without this helper, the very first
 *   bot execution against any new delegation would always revert.
 *
 * Strategy:
 *   1. Read smartAccount's current WETH balance via the WETH9 contract.
 *   2. If sufficient, return early (no-op).
 *   3. Otherwise wrap `amountNeeded` ETH into WETH (executor EOA calls
 *      WETH.deposit{value: amountNeeded}).
 *   4. Transfer that WETH to the smart account.
 *
 * The executor EOA only needs enough native ETH to cover gas + the topup
 * amounts. At 0.001 WETH per trade, 0.05 ETH funds ~50 top-ups with room
 * to spare for gas.
 */
async function ensureSmartAccountFunded(smartAccount, amountNeeded, walletClient, publicClient) {
  const currentBalance = await publicClient.readContract({
    address: CONTRACTS.WETH,
    abi: WETH9_ABI,
    functionName: 'balanceOf',
    args: [smartAccount],
  });

  if (currentBalance >= amountNeeded) {
    console.log(`    [FUND→SKIP] smart account ${smartAccount.slice(0, 10)}… holds ${currentBalance} wei WETH (>= ${amountNeeded})`);
    return;
  }

  const topUpAmount = amountNeeded - currentBalance;
  console.log(`    [FUND→WRAP] wrapping ${topUpAmount} wei ETH → WETH for smart account ${smartAccount.slice(0, 10)}…`);

  // 1) Wrap ETH into WETH on the executor EOA.
  const depositHash = await walletClient.writeContract({
    address: CONTRACTS.WETH,
    abi: WETH9_ABI,
    functionName: 'deposit',
    args: [],
    value: topUpAmount,
    gas: 100000n,
  });
  await publicClient.waitForTransactionReceipt({ hash: depositHash, timeout: 30000 });

  // 2) Transfer the wrapped WETH from executor EOA → smart account.
  const transferHash = await walletClient.writeContract({
    address: CONTRACTS.WETH,
    abi: WETH9_ABI,
    functionName: 'transfer',
    args: [smartAccount, topUpAmount],
    gas: 80000n,
  });
  await publicClient.waitForTransactionReceipt({ hash: transferHash, timeout: 30000 });

  console.log(`    [FUND→OK] smart account now holds ${amountNeeded} wei WETH (tx: ${transferHash.slice(0, 10)}…)`);
}

// ─── Delegation Conditions Cache ────────────────────────────────────────────
const conditionsCache = new Map();

const DELEGATION_ROUTER_CONDITIONS_ABI = [{
  name: 'getDelegationConditions',
  type: 'function',
  inputs: [{ name: 'delegationId', type: 'uint256' }],
  outputs: [
    { name: 'minWinRate', type: 'uint256' },
    { name: 'minROI', type: 'int256' },
    { name: 'minVolume', type: 'uint256' },
    { name: 'isActive', type: 'bool' },
  ],
  stateMutability: 'view',
}];

async function getDelegationConditions(delegationId, publicClient) {
  const key = delegationId.toString();
  if (conditionsCache.has(key)) return conditionsCache.get(key);

  try {
    const [minWinRate, minROI, minVolume, isActive] = await publicClient.readContract({
      address: CONTRACTS.DELEGATION_ROUTER,
      abi: DELEGATION_ROUTER_CONDITIONS_ABI,
      functionName: 'getDelegationConditions',
      args: [delegationId],
    });
    const conditions = { minWinRate, minROI, minVolume, isActive };
    conditionsCache.set(key, conditions);
    return conditions;
  } catch {
    // Default: no conditions (simple delegation)
    const defaults = { minWinRate: 0n, minROI: 0n, minVolume: 0n, isActive: true };
    conditionsCache.set(key, defaults);
    return defaults;
  }
}

const EXECUTION_ENGINE_ABI = [
  {
    name: 'executeTrade',
    type: 'function',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'delegationId', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'targetContract', type: 'address' },
          { name: 'callData', type: 'bytes' },
        ],
      },
      {
        name: 'metrics',
        type: 'tuple',
        components: [
          { name: 'currentWinRate', type: 'uint256' },
          { name: 'currentROI', type: 'int256' },
          { name: 'currentVolume', type: 'uint256' },
          { name: 'lastUpdated', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'isExecutor',
    type: 'function',
    inputs: [{ name: 'executor', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    name: 'executionStats',
    type: 'function',
    inputs: [{ name: 'delegationId', type: 'uint256' }],
    outputs: [
      { name: 'totalExecutions', type: 'uint256' },
      { name: 'successfulExecutions', type: 'uint256' },
      { name: 'failedExecutions', type: 'uint256' },
      { name: 'totalVolumeExecuted', type: 'uint256' },
      { name: 'totalGasUsed', type: 'uint256' },
      { name: 'lastExecutionTime', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'minExecutionInterval',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
];

// ─── Envio Queries ───────────────────────────────────────────────────────────

async function fetchActiveDelegations() {
  const query = `
    query GetActiveDelegations {
      Delegation(where: {isActive: {_eq: true}}, order_by: {createdAt: asc}) {
        id
        delegationId
        delegator
        patternTokenId
        percentageAllocation
        smartAccountAddress
        successRate
        totalExecutions
        totalAmountTraded
        pattern {
          tokenId winRate roi totalVolume isActive patternType
          delegationCount successfulExecutions failedExecutions
        }
      }
    }
  `;

  try {
    const startMs = Date.now();
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const latency = Date.now() - startMs;
    const delegations = data.data?.Delegation || [];
    console.log(`  [ENVIO→QUERY] Fetched ${delegations.length} delegations with pattern data (${latency}ms)`);
    return delegations;
  } catch (err) {
    console.warn('  [ENVIO→OFFLINE] GraphQL unavailable — skipping cycle');
    return null; // signal fallback
  }
}

async function fetchSystemMetrics() {
  const query = `
    query GetMetrics {
      SystemMetrics(where: {id: {_eq: "1"}}) {
        totalPatterns activePatterns totalDelegations activeDelegations
        totalExecutions successfulExecutions eventsProcessed averageQueryLatency
      }
    }
  `;
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.SystemMetrics?.[0] || null;
  } catch {
    return null;
  }
}

// ─── Bot Logic ───────────────────────────────────────────────────────────────

let executedThisRun = new Set();

// Cache for the engine's minExecutionInterval — read once per bot process.
let cachedMinExecutionInterval = null;

async function getMinExecutionInterval(publicClient) {
  if (cachedMinExecutionInterval !== null) return cachedMinExecutionInterval;
  try {
    cachedMinExecutionInterval = await publicClient.readContract({
      address: CONTRACTS.EXECUTION_ENGINE,
      abi: EXECUTION_ENGINE_ABI,
      functionName: 'minExecutionInterval',
    });
  } catch {
    // Default to 60s (the engine's constructor default) if the read fails.
    cachedMinExecutionInterval = 60n;
  }
  return cachedMinExecutionInterval;
}

async function processExecution(delegation, walletClient, publicClient, executorAddress) {
  const delegationId = BigInt(delegation.delegationId);
  const patternId = BigInt(delegation.patternTokenId);

  // Skip if already executed this run
  if (executedThisRun.has(delegation.id)) return;

  // Rate limit: the engine enforces a minimum interval between successive
  // executions on the same delegation (ExecutionEngine._validateExecution at
  // contracts/ExecutionEngine.sol:458-463). Skip this cycle if we're still
  // inside the cooldown window — otherwise the tx would just revert on-chain
  // with ExecutionIntervalNotMet and waste gas.
  try {
    const stats = await publicClient.readContract({
      address: CONTRACTS.EXECUTION_ENGINE,
      abi: EXECUTION_ENGINE_ABI,
      functionName: 'executionStats',
      args: [delegationId],
    });
    const lastExecutionTime = stats[5]; // 6th field in the tuple
    if (lastExecutionTime > 0n) {
      const interval = await getMinExecutionInterval(publicClient);
      const now = BigInt(Math.floor(Date.now() / 1000));
      const nextAllowed = lastExecutionTime + interval;
      if (now < nextAllowed) {
        const remaining = nextAllowed - now;
        console.log(`  [RATE→SKIP] Delegation #${delegationId}: cooldown ${remaining}s remaining`);
        return;
      }
    }
  } catch (err) {
    // If the chain read fails, let the tx go through — the engine will
    // reject it with a clear revert if we're still rate-limited.
    console.warn(`  [RATE→WARN] executionStats read failed: ${err.shortMessage || err.message}`);
  }

  // Float check: every trade drains the engine's TRADE_TOKEN float by
  // TRADE_AMOUNT. Skip the cycle if the engine doesn't have enough to avoid
  // burning gas on guaranteed-to-fail adapter safeTransferFrom calls.
  try {
    const engineFloat = await publicClient.readContract({
      address: TRADE_TOKEN,
      abi: WETH9_ABI, // balanceOf is ERC20-compatible
      functionName: 'balanceOf',
      args: [CONTRACTS.EXECUTION_ENGINE],
    });
    if (engineFloat < TRADE_AMOUNT) {
      const tokenLabel = TRADE_TOKEN === CONTRACTS.USDC ? 'USDC' : 'WETH';
      const refundCmd = TRADE_TOKEN === CONTRACTS.USDC
        ? 'forge script script/SetupUSDCTrades.s.sol --rpc-url sepolia --broadcast --legacy'
        : 'forge script script/RefundEngineWETH.s.sol --rpc-url sepolia --broadcast --legacy';
      console.log(
        `  [FUND→LOW] engine ${tokenLabel} float ${engineFloat} < TRADE_AMOUNT ${TRADE_AMOUNT} — ` +
        `top up with: ${refundCmd}`
      );
      return;
    }
  } catch (err) {
    console.warn(`  [FUND→WARN] engine float read failed: ${err.shortMessage || err.message}`);
  }

  // Get pattern metrics from Envio (joined in GraphQL query — zero chain reads)
  const envioPattern = delegation.pattern;
  if (!envioPattern) {
    console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern not yet indexed`);
    return;
  }

  const patternMetrics = {
    winRate: BigInt(envioPattern.winRate || '0'),
    roi: BigInt(envioPattern.roi || '0'),
    totalVolume: BigInt(envioPattern.totalVolume || '0'),
    isActive: envioPattern.isActive,
  };

  if (!patternMetrics.isActive) {
    console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: pattern #${patternId} inactive`);
    return;
  }

  // Validate against per-delegation conditions (from chain, cached after first call)
  const conditions = await getDelegationConditions(delegationId, publicClient);

  if (conditions.minWinRate > 0n && patternMetrics.winRate < conditions.minWinRate) {
    console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: winRate ${patternMetrics.winRate} < min ${conditions.minWinRate}`);
    return;
  }
  if (conditions.minROI !== 0n && patternMetrics.roi < conditions.minROI) {
    console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: ROI ${patternMetrics.roi} < min ${conditions.minROI}`);
    return;
  }
  if (conditions.minVolume > 0n && patternMetrics.totalVolume < conditions.minVolume) {
    console.log(`  [ENVIO→SKIP] Delegation #${delegationId}: volume ${patternMetrics.totalVolume} < min ${conditions.minVolume}`);
    return;
  }

  console.log(`  [ENVIO→DECIDE] Delegation #${delegationId}: pattern #${patternId} (${envioPattern.patternType})`);
  console.log(`    Envio metrics: winRate=${patternMetrics.winRate} roi=${patternMetrics.roi} volume=${patternMetrics.totalVolume}`);
  console.log(`    Conditions: minWR=${conditions.minWinRate} minROI=${conditions.minROI} → EXECUTING`);

  const tradeAmount = TRADE_AMOUNT;

  // Ensure the delegation's smart account holds enough of the trade token
  // (USDC or WETH) for the engine's balanceOf(smartAccount) check. When
  // smartAccount == executor (our current delegation setup), the executor
  // already holds the token after running the setup script. We just verify
  // the balance is sufficient; if not, there's nothing we can auto-mint
  // (USDC has no faucet), so we skip with a message.
  const smartAccount = delegation.smartAccountAddress;
  if (!smartAccount) {
    console.log(`  [FUND→SKIP] Delegation #${delegationId}: no smartAccountAddress on Envio record`);
    return;
  }

  // For WETH trades, the old ensureSmartAccountFunded wraps ETH automatically.
  // For USDC trades, we just check the balance — the SetupUSDCTrades script
  // pre-funded the executor with USDC via engine.recoverTokens.
  if (TRADE_TOKEN === CONTRACTS.WETH) {
    try {
      await ensureSmartAccountFunded(smartAccount, tradeAmount, walletClient, publicClient);
    } catch (err) {
      console.log(`  ❌ Top-up failed: ${err.shortMessage || err.message}`);
      return;
    }
  } else {
    // For non-WETH tokens (USDC), just check balance
    try {
      const bal = await publicClient.readContract({
        address: TRADE_TOKEN,
        abi: WETH9_ABI, // balanceOf is ERC20-compatible
        functionName: 'balanceOf',
        args: [smartAccount],
      });
      if (bal < tradeAmount) {
        console.log(`  [FUND→LOW] smart account ${TRADE_TOKEN === CONTRACTS.USDC ? 'USDC' : 'token'} balance ${bal} < ${tradeAmount} — run SetupUSDCTrades script`);
        return;
      }
      console.log(`    [FUND→OK] smart account holds ${bal} of trade token (>= ${tradeAmount})`);
    } catch (err) {
      console.warn(`  [FUND→WARN] smart account balance read failed: ${err.shortMessage || err.message}`);
    }
  }

  // Real swap through UniswapV2Adapter.
  // The adapter pulls TRADE_AMOUNT of TRADE_TOKEN from the ExecutionEngine
  // (msg.sender during _externalCall), routes it through the real Sepolia
  // Uniswap V2 Router, and sends the output token back to the engine.
  // Engine approvals: WETH set during gate 7, USDC set by SetupUSDCTrades.
  const swapCallData = encodeFunctionData({
    abi: UNISWAP_V2_ADAPTER_ABI,
    functionName: 'swap',
    args: [
      TRADE_TOKEN,                    // tokenIn (USDC or WETH)
      tradeAmount,                    // amountIn
      0n,                             // minAmountOut = 0 for demo
      CONTRACTS.EXECUTION_ENGINE,     // to — output token accumulates in the engine
    ],
  });

  const tradeParams = {
    delegationId,
    token: TRADE_TOKEN,               // what we're trading in
    amount: tradeAmount,
    targetContract: CONTRACTS.UNISWAP_V2_ADAPTER,
    callData: swapCallData,
  };

  const metrics = {
    currentWinRate: patternMetrics.winRate,
    currentROI: patternMetrics.roi,
    currentVolume: patternMetrics.totalVolume,
    lastUpdated: BigInt(Math.floor(Date.now() / 1000)),
  };

  console.log(`  [EXECUTE→CHAIN] Delegation #${delegationId} | Pattern #${patternId}`);
  console.log(`    WinRate: ${Number(patternMetrics.winRate) / 100}% | ROI: ${Number(patternMetrics.roi) / 100}%`);

  const startMs = Date.now();
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.EXECUTION_ENGINE,
      abi: EXECUTION_ENGINE_ABI,
      functionName: 'executeTrade',
      args: [tradeParams, metrics],
      gas: 2000000n,
    });

    const latency = Date.now() - startMs;
    console.log(`  [EXECUTE→CHAIN] Trade tx: ${hash} (${latency}ms)`);
    executedThisRun.add(delegation.id);

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30000 });
    console.log(`  [CHAIN→ENVIO] Confirmed block ${receipt.blockNumber} (${receipt.status}) — TradeExecuted event will be indexed`);
  } catch (err) {
    console.log(`  ❌ Execution failed: ${err.shortMessage || err.message}`);
  }
}

async function runBotCycle(walletClient, publicClient, executorAddress) {
  executedThisRun.clear(); // Reset per-cycle dedup
  console.log(`\n${'─'.repeat(52)}`);
  console.log(`[${new Date().toISOString()}] Bot cycle starting...`);

  // 1. Show Envio metrics
  const metrics = await fetchSystemMetrics();
  if (metrics) {
    console.log(`📊 Envio: ${metrics.activeDelegations} active delegations | ${metrics.eventsProcessed} events indexed | ${metrics.averageQueryLatency}ms latency`);
  }

  // 2. Fetch active delegations (Envio primary, chain fallback)
  let delegations = await fetchActiveDelegations();

  if (delegations === null) {
    // Envio offline — skip execution
    console.log('  Envio offline, waiting...');
    return;
  }

  if (delegations.length === 0) {
    console.log('  No active delegations yet. Waiting for on-chain activity...');
    return;
  }

  console.log(`  Found ${delegations.length} active delegations via Envio`);

  // 3. Execute trades for qualifying delegations
  for (const delegation of delegations) {
    await processExecution(delegation, walletClient, publicClient, executorAddress);
  }

  console.log('  Cycle complete.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const POLL_INTERVAL_MS = 5000; // Check every 5s — Envio's sub-50ms queries make this efficient

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('   Mirror Protocol — Executor Bot                     ');
  console.log('   Powered by Envio HyperSync on Ethereum Sepolia     ');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  if (!ENV.PRIVATE_KEY && !ENV.DEPLOYER_PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  // Accept keys with or without the 0x prefix.
  const rawKey = (ENV.PRIVATE_KEY || ENV.DEPLOYER_PRIVATE_KEY);
  const privKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
  const account = privateKeyToAccount(privKey);

  const transport = http(ENV.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');

  const publicClient = createPublicClient({ chain: SEPOLIA_CHAIN, transport });
  const walletClient = createWalletClient({ account, chain: SEPOLIA_CHAIN, transport });

  console.log(`Executor address: ${account.address}`);
  console.log(`ExecutionEngine:  ${CONTRACTS.EXECUTION_ENGINE}`);
  console.log(`DelegationRouter: ${CONTRACTS.DELEGATION_ROUTER}`);
  console.log(`Envio GraphQL:    ${GRAPHQL_ENDPOINT}`);
  console.log(`Poll interval:    ${POLL_INTERVAL_MS / 1000}s`);
  console.log('');

  // Verify executor permission
  try {
    const isExec = await publicClient.readContract({
      address: CONTRACTS.EXECUTION_ENGINE,
      abi: EXECUTION_ENGINE_ABI,
      functionName: 'isExecutor',
      args: [account.address],
    });
    console.log(`Executor permission: ${isExec ? '✅ granted' : '❌ NOT granted — run: engine.addExecutor(deployer)'}`);
    if (!isExec) {
      console.warn('⚠️  Bot will run but executions will fail until permission is granted.');
    }
  } catch (err) {
    console.warn(`⚠️  Could not verify executor permission: ${err.shortMessage || err.message}`);
    console.warn('   (Contract may not be deployed yet — fund wallet and redeploy)');
  }

  console.log('\nStarting execution loop...\n');

  // Run immediately, then poll
  await runBotCycle(walletClient, publicClient, account.address);
  setInterval(
    () => runBotCycle(walletClient, publicClient, account.address),
    POLL_INTERVAL_MS,
  );
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
