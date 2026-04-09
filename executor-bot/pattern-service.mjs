/**
 * Mirror Protocol — Automated Pattern Detection Service
 *
 * Queries Envio for aggregated trade history, detects behavioral patterns,
 * and auto-mints qualifying patterns via PatternDetector on Monad.
 *
 * This closes the Envio feedback loop:
 *   Execute → Envio indexes → Detect patterns → Mint → Envio indexes → Available for delegation
 *
 * Usage:
 *   node executor-bot/pattern-service.mjs
 *
 * Requirements:
 *   - .env with PRIVATE_KEY/DEPLOYER_PRIVATE_KEY, MONAD_RPC_URL
 *   - Envio indexer running with TradeExecution + Pattern data
 */

import { createWalletClient, createPublicClient, http, parseEther, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Environment ─────────────────────────────────────────────────────────────

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

const MONAD_CHAIN = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [ENV.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz'] } },
};

const GRAPHQL_ENDPOINT =
  ENV.ENVIO_GRAPHQL_URL || 'https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql';

const PATTERN_DETECTOR_ADDRESS =
  ENV.PATTERN_DETECTOR_ADDRESS || '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE';

const DETECTION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const LOOKBACK_HOURS = 24;

// ─── Contract ABIs ───────────────────────────────────────────────────────────

const PATTERN_DETECTOR_ABI = [
  {
    name: 'validateAndMintPattern',
    type: 'function',
    inputs: [{
      name: 'pattern',
      type: 'tuple',
      components: [
        { name: 'user', type: 'address' },
        { name: 'patternType', type: 'string' },
        { name: 'patternData', type: 'bytes' },
        { name: 'totalTrades', type: 'uint256' },
        { name: 'successfulTrades', type: 'uint256' },
        { name: 'totalVolume', type: 'uint256' },
        { name: 'totalPnL', type: 'int256' },
        { name: 'confidence', type: 'uint256' },
        { name: 'detectedAt', type: 'uint256' },
      ],
    }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'canUserMintPattern',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'canMint', type: 'bool' },
      { name: 'reason', type: 'string' },
    ],
    stateMutability: 'view',
  },
];

// ─── Detection Thresholds (matching PatternDetector.sol defaults) ────────────

const THRESHOLDS = {
  minTrades: 10,
  minWinRate: 6000,       // 60% in basis points
  minVolume: parseEther('1'), // 1 ETH
  minConfidence: 7000,    // 70% in basis points
};

// ─── Envio Queries ───────────────────────────────────────────────────────────

async function queryEnvio(query, variables = {}) {
  const startMs = Date.now();
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Envio HTTP ${res.status}`);
  const data = await res.json();
  const latency = Date.now() - startMs;
  if (data.errors) throw new Error(`Envio GraphQL: ${data.errors[0].message}`);
  return { data: data.data, latency };
}

async function fetchRecentActivity(sinceTimestamp) {
  const query = `
    query RecentActivity($since: numeric!) {
      TradeExecution(
        where: { timestamp: { _gt: $since } }
        order_by: { timestamp: desc }
        limit: 500
      ) {
        delegationId
        patternTokenId
        executor
        token
        amount
        timestamp
        success
      }
      Pattern(where: { isActive: { _eq: true } }) {
        tokenId
        creator_id
        winRate
        roi
        totalVolume
        patternType
        successfulExecutions
        failedExecutions
        createdAt
      }
      SystemMetrics(where: { id: { _eq: "1" } }) {
        totalExecutions
        successfulExecutions
        eventsProcessed
      }
    }
  `;

  return queryEnvio(query, { since: sinceTimestamp.toString() });
}

// ─── Pattern Detection Logic ─────────────────────────────────────────────────

function analyzeTradesForPatterns(trades, existingPatterns) {
  // Group trades by executor address
  const traderMap = new Map();

  for (const trade of trades) {
    const executor = trade.executor.toLowerCase();
    if (!traderMap.has(executor)) {
      traderMap.set(executor, {
        address: executor,
        trades: [],
        successfulTrades: 0,
        totalVolume: 0n,
        tokens: new Set(),
      });
    }
    const trader = traderMap.get(executor);
    trader.trades.push(trade);
    if (trade.success) trader.successfulTrades++;
    trader.totalVolume += BigInt(trade.amount || '0');
    trader.tokens.add(trade.token);
  }

  // Detect qualifying patterns
  const candidates = [];

  for (const [address, trader] of traderMap) {
    const totalTrades = trader.trades.length;
    if (totalTrades < THRESHOLDS.minTrades) continue;

    // Compute actual win rate from successful vs total trades
    const successfulTrades = trader.successfulTrades;
    const winRate = Math.floor((successfulTrades / totalTrades) * 10000);
    const totalVolume = trader.totalVolume;

    if (winRate < THRESHOLDS.minWinRate) continue;
    if (totalVolume < THRESHOLDS.minVolume) continue;

    // Check for duplicate — is there already an active pattern by this creator?
    const existingByCreator = existingPatterns.filter(
      p => p.creator_id.toLowerCase() === address
    );

    // Determine pattern type from trade characteristics
    const patternType = detectPatternType(trader.trades);

    // Check if this specific pattern type already exists for creator
    const duplicate = existingByCreator.find(
      p => p.patternType === patternType
    );
    if (duplicate) {
      console.log(`  [DETECT→SKIP] ${address.slice(0, 8)}...: already has ${patternType} pattern #${duplicate.tokenId}`);
      continue;
    }

    // Calculate confidence based on trade count + consistency
    const tradeCountScore = Math.min(totalTrades / 20, 1) * 6000; // max 60%
    const volumeScore = Number(totalVolume) > Number(parseEther('10')) ? 2000 : 1000; // 10-20%
    const consistencyScore = 2000; // base 20%
    const confidence = Math.min(Math.floor(tradeCountScore + volumeScore + consistencyScore), 10000);

    if (confidence < THRESHOLDS.minConfidence) continue;

    // Estimate PnL from win rate and volume
    const estimatedPnL = (totalVolume * BigInt(winRate - 5000)) / 10000n;

    candidates.push({
      user: address,
      patternType,
      totalTrades,
      successfulTrades,
      totalVolume,
      totalPnL: estimatedPnL,
      confidence,
    });
  }

  return candidates;
}

function detectPatternType(trades) {
  if (trades.length < 3) return 'momentum';

  // Sort by timestamp
  const sorted = [...trades].sort((a, b) =>
    Number(BigInt(a.timestamp) - BigInt(b.timestamp))
  );

  // Check for rapid consecutive trades (momentum indicator)
  let consecutiveCount = 0;
  let maxConsecutive = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = Number(BigInt(sorted[i].timestamp) - BigInt(sorted[i - 1].timestamp));
    if (gap < 3600) { // Within 1 hour
      consecutiveCount++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
    } else {
      consecutiveCount = 0;
    }
  }

  // Check for multi-token activity (arbitrage indicator)
  const uniqueTokens = new Set(trades.map(t => t.token?.toLowerCase())).size;

  if (uniqueTokens >= 3) return 'arbitrage';
  if (maxConsecutive >= 3) return 'momentum';
  return 'mean_reversion';
}

// ─── Pattern Minting ─────────────────────────────────────────────────────────

async function mintPattern(candidate, walletClient, publicClient) {
  // Pre-flight: check if user can mint
  try {
    const [canMint, reason] = await publicClient.readContract({
      address: PATTERN_DETECTOR_ADDRESS,
      abi: PATTERN_DETECTOR_ABI,
      functionName: 'canUserMintPattern',
      args: [candidate.user],
    });
    if (!canMint) {
      console.log(`  [DETECT→SKIP] ${candidate.user.slice(0, 8)}...: cannot mint — ${reason}`);
      return null;
    }
  } catch {
    // canUserMintPattern may not exist on older deployments — proceed with caution
    console.log(`  [DETECT→WARN] Could not check mint eligibility, attempting anyway...`);
  }

  const patternData = encodeAbiParameters(
    [{ type: 'string' }, { type: 'uint256' }, { type: 'uint256' }],
    [candidate.patternType, BigInt(candidate.totalTrades), candidate.totalVolume]
  );

  const now = BigInt(Math.floor(Date.now() / 1000));

  const pattern = {
    user: candidate.user,
    patternType: candidate.patternType,
    patternData,
    totalTrades: BigInt(candidate.totalTrades),
    successfulTrades: BigInt(candidate.successfulTrades),
    totalVolume: candidate.totalVolume,
    totalPnL: candidate.totalPnL,
    confidence: BigInt(candidate.confidence),
    detectedAt: now,
  };

  console.log(`  [DETECT→CHAIN] Minting ${candidate.patternType} pattern for ${candidate.user.slice(0, 8)}... (confidence: ${candidate.confidence / 100}%)`);

  try {
    const hash = await walletClient.writeContract({
      address: PATTERN_DETECTOR_ADDRESS,
      abi: PATTERN_DETECTOR_ABI,
      functionName: 'validateAndMintPattern',
      args: [pattern],
      gas: 500000n,
    });

    console.log(`  [DETECT→CHAIN] Mint tx: ${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 30000 });
    console.log(`  [CHAIN→ENVIO] Confirmed block ${receipt.blockNumber} (${receipt.status}) — PatternMinted event will be indexed`);

    return hash;
  } catch (err) {
    console.log(`  [DETECT→FAIL] Mint failed: ${err.shortMessage || err.message}`);
    return null;
  }
}

// ─── Detection Cycle ─────────────────────────────────────────────────────────

async function runDetectionCycle(walletClient, publicClient) {
  console.log(`\n${'─'.repeat(52)}`);
  console.log(`[${new Date().toISOString()}] Pattern detection cycle starting...`);

  const sinceTimestamp = BigInt(Math.floor(Date.now() / 1000) - LOOKBACK_HOURS * 3600);

  try {
    const { data, latency } = await fetchRecentActivity(sinceTimestamp);

    const trades = data.TradeExecution || [];
    const patterns = data.Pattern || [];
    const metrics = data.SystemMetrics?.[0];

    console.log(`  [ENVIO→DETECT] Queried ${trades.length} recent trades across ${patterns.length} active patterns (${latency}ms)`);

    if (metrics) {
      console.log(`  [ENVIO→STATS] System: ${metrics.totalExecutions} total executions | ${metrics.eventsProcessed} events indexed`);
    }

    if (trades.length === 0) {
      console.log('  [DETECT→IDLE] No recent trades to analyze. Waiting...');
      return;
    }

    // Analyze trades for new pattern opportunities
    const candidates = analyzeTradesForPatterns(trades, patterns);

    if (candidates.length === 0) {
      console.log('  [DETECT→IDLE] No new qualifying patterns detected');
      return;
    }

    console.log(`  [DETECT→ANALYZE] Found ${candidates.length} pattern candidate(s)`);

    for (const candidate of candidates) {
      console.log(`  [DETECT→ANALYZE] ${candidate.user.slice(0, 8)}...: ${candidate.totalTrades} trades, ${candidate.confidence / 100}% confidence, ${candidate.patternType}`);
      await mintPattern(candidate, walletClient, publicClient);
    }
  } catch (err) {
    console.error(`  [DETECT→ERROR] Cycle failed: ${err.message}`);
  }

  console.log('  Detection cycle complete.');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log('   Mirror Protocol — Pattern Detection Service        ');
  console.log('   Envio-Powered Automated Pattern Discovery          ');
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  if (!ENV.PRIVATE_KEY && !ENV.DEPLOYER_PRIVATE_KEY) {
    console.error('PRIVATE_KEY or DEPLOYER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  const privKey = (ENV.PRIVATE_KEY || ENV.DEPLOYER_PRIVATE_KEY);
  const account = privateKeyToAccount(`0x${privKey}`);

  const transport = http(ENV.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');

  const publicClient = createPublicClient({ chain: MONAD_CHAIN, transport });
  const walletClient = createWalletClient({ account, chain: MONAD_CHAIN, transport });

  console.log(`Detector address:    ${account.address}`);
  console.log(`PatternDetector:     ${PATTERN_DETECTOR_ADDRESS}`);
  console.log(`Envio GraphQL:       ${GRAPHQL_ENDPOINT}`);
  console.log(`Detection interval:  ${DETECTION_INTERVAL_MS / 1000}s`);
  console.log(`Lookback window:     ${LOOKBACK_HOURS}h`);
  console.log('');
  console.log('Detection thresholds:');
  console.log(`  Min trades:     ${THRESHOLDS.minTrades}`);
  console.log(`  Min win rate:   ${THRESHOLDS.minWinRate / 100}%`);
  console.log(`  Min volume:     1 ETH`);
  console.log(`  Min confidence: ${THRESHOLDS.minConfidence / 100}%`);
  console.log('');

  console.log('Starting detection loop...\n');

  // Run immediately, then on interval
  await runDetectionCycle(walletClient, publicClient);
  setInterval(
    () => runDetectionCycle(walletClient, publicClient),
    DETECTION_INTERVAL_MS,
  );
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
