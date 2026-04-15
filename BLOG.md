# Mirror Protocol: Real-Time Behavioral Trading Infrastructure Powered by Envio HyperSync

*By Kaustubh Agrawal*

![Mirror Protocol Live Dashboard](./docs/images/dashboard-hero.png)
*[Live Demo](https://mirror-protocol-nine.vercel.app) — 139+ real Uniswap V2 swaps, 7 strategy NFTs, sub-5ms indexing, all on Ethereum Sepolia.*

---

## What Is Mirror Protocol?

Mirror Protocol turns successful trading strategies into **delegatable NFTs** backed by real DEX execution.

> A trader mints their proven strategy as an ERC-721 with embedded performance metrics — win rate, ROI, volume. Other users delegate capital to that NFT with conditions like "only execute if win rate is above 80%." An executor bot watches Envio HyperSync indexed data and fires a real Uniswap V2 swap the moment conditions match. The entire flow is visible on the dashboard within seconds.

**This is not a simulation.** Every trade routes through real Uniswap V2 liquidity on Ethereum Sepolia. Click any transaction hash in the live feed — it opens on Sepolia Etherscan showing real token transfers.

---

## The Product Loop

```
Trader creates strategy → Mints as NFT → Others delegate capital →
Bot auto-executes via real Uniswap V2 → Profits accumulate →
Strategy metrics update on-chain → More users delegate → Cycle repeats
```

Every step is on-chain, indexed by Envio in <50ms, and rendered live on the dashboard.

---

## Live Numbers

| Metric | Value |
|---|---|
| **Successful trades** | 139+ |
| **Trade directions** | WETH → USDC and USDC → WETH |
| **Strategy patterns** | 7 active (Momentum, Mean Reversion, Arbitrage, Liquidity, Yield, Composite) |
| **Active delegations** | 7 |
| **Envio query latency** | 3-5ms |
| **Delegation depth** | Up to 3 layers |
| **Test coverage** | 149 tests (including forked Sepolia against real Uniswap V2) |

---

## How It Works

### Architecture

```
User mints pattern NFT (BehavioralNFT)
  ↓
PatternDetector validates: trades, win rate, volume, confidence
  → mints ERC-721 with on-chain metadata
  ↓
Other users create delegations (DelegationRouter)
  → allocation %, conditions, up to 3 layers deep
  ↓
Executor bot polls Envio GraphQL every 5s (<5ms response)
  → validates pattern metrics against delegation conditions
  ↓
ExecutionEngine calls UniswapV2Adapter.swap()
  → real Uniswap V2 Router02 → real WETH/USDC pool
  → real tokens move on-chain
  ↓
Envio HyperSync indexes TradeExecuted + Swap events (<50ms)
  → Frontend renders in LiveExecutionFeed with full DEX detail
```

### Smart Contracts

| Contract | Purpose |
|---|---|
| [**BehavioralNFT**](https://sepolia.etherscan.io/address/0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954) | ERC-721 minting for strategy patterns with on-chain performance metadata |
| [**PatternDetector**](https://sepolia.etherscan.io/address/0x4C122A516930a5E23f3c31Db53Ee008a2720527E) | Validates pattern quality against configurable thresholds before minting |
| [**DelegationRouter**](https://sepolia.etherscan.io/address/0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8) | Manages delegations with permissions, spend limits, and conditional requirements |
| [**ExecutionEngine**](https://sepolia.etherscan.io/address/0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A) | Orchestrates trade execution with 3-layer delegation chain support |
| [**UniswapV2Adapter**](https://sepolia.etherscan.io/address/0x5B59f315d4E2670446ed7B130584A326A0f7c2D3) | Thin wrapper around Uniswap V2 Router02 — handles approvals, encodes swap paths, emits indexable events |

### Why Envio Is the Core

The bot needs to decide every 5 seconds: *which delegations are active and should I execute?*

**Without Envio:** 21+ RPC calls per cycle (delegation state, pattern metrics, conditions for each). At 200ms per call = **4+ seconds** just to read the data.

**With Envio HyperSync:** One GraphQL query, **3-5ms** response:

```graphql
{
  Delegation(where: {isActive: {_eq: true}}) {
    delegationId patternTokenId percentageAllocation
    pattern { winRate roi totalVolume isActive patternType }
  }
}
```

The dashboard's `4ms` query latency badge is Envio's fingerprint. Every time the feed updates instantly, that's HyperSync working.

---

## Real DEX Execution

Every trade in the feed is a real Uniswap V2 swap:

- **Bidirectional:** WETH → USDC and USDC → WETH through the same [pool](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74)
- **Verifiable:** Click any tx hash → Sepolia Etherscan shows real token transfers
- **Indexed:** The adapter's `Swap` event is indexed by Envio and joined with `TradeExecuted` by tx hash — every feed row shows `5.00 USDC → 0.0007 WETH · Uniswap V2 · pool 0x72e46e…`
- **139+ swaps** executed through real on-chain liquidity

---

## User Flows

### Mint a Strategy Pattern

Connect MetaMask on Sepolia → Click **"+ Mint Pattern"** → Choose strategy type (Momentum, Arbitrage, etc.) → Enter trade stats → Sign transaction → Your strategy is now an on-chain NFT that others can delegate to.

### Delegate to a Pattern

Browse patterns → Click **"Delegate"** → Set allocation percentage → Sign → The bot will auto-execute trades matching that pattern's conditions.

### Watch It Execute

Open the **Live Trading** tab → The feed streams real swap executions with pattern names, DEX detail, and clickable Etherscan links. No wallet connection needed — just watch.

---

## Testing

**149 tests across two layers:**

**Layer 1 (143 tests, <1s):** Unit + integration tests with mock contracts covering every contract path.

**Layer 2 (6 tests, ~30s):** Forked Sepolia tests against **real Uniswap V2 liquidity** — creates delegations, executes swaps, asserts real balance changes. Includes a 3-layer delegation test proving the depth-3 chain works end-to-end.

```bash
./test/run-sepolia-harness.sh
# Layer 1: 143/143 passed
# Layer 2: 6/6 passed
```

---

## Try It

**[Live Dashboard](https://mirror-protocol-nine.vercel.app)** — open it, watch the feed for 10 seconds.

**[Envio GraphQL Playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)** — paste and run:

```graphql
{
  SystemMetrics { successfulExecutions averageQueryLatency }
  TradeExecution(where: {success: {_eq: true}}, order_by: {timestamp: desc}, limit: 5) {
    txHash
    pattern { patternType }
  }
  PoolSwap(order_by: {timestamp: desc}, limit: 5) {
    amountIn amountOut tokenIn tokenOut
  }
}
```

**[Source Code](https://github.com/kaustubh76/Mimic-Protocol)** — clone, run `./test/run-sepolia-harness.sh`, see 149 tests pass against real Sepolia state.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.20, Foundry |
| Indexing | Envio HyperSync + HyperIndex |
| DEX | Uniswap V2 Router02 (Sepolia) |
| Frontend | React, wagmi, viem, Framer Motion |
| Executor Bot | Node.js, viem, Envio GraphQL |
| Chain | Ethereum Sepolia (11155111) |

---

*Built with [Envio HyperSync](https://docs.envio.dev) on Ethereum Sepolia*

*Live at [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app) · Source on [GitHub](https://github.com/kaustubh76/Mimic-Protocol)*

**Tags:** `Envio` `HyperSync` `DeFi` `Uniswap V2` `NFT` `Ethereum` `Web3`
