# Mirror Protocol: Turning Trading Strategies Into Executable, Delegatable NFTs

### A real-time DeFi product built on Envio HyperSync — with real Uniswap V2 execution, behavioral pattern detection, and a vision for what comes next.

*By Kaustubh Agrawal*

![Mirror Protocol Live Dashboard](./docs/images/dashboard-hero.png)

**[Open the live demo →](https://mirror-protocol-nine.vercel.app)**

---

## Open the Site. Watch for 10 Seconds.

You'll see numbers ticking up in real time. A green "LIVE" dot pulsing. A feed of trades sliding in — each one showing a real Uniswap V2 swap: `5.00 USDC → 0.0007 WETH`, with a clickable link to the actual transaction on Sepolia Etherscan.

Nothing is simulated. These are real tokens, moving through a real DEX, on a real blockchain, indexed in real time by Envio HyperSync. The dashboard isn't showing you cached data or a replay — it's showing you what's happening *right now*.

That's Mirror Protocol.

---

## The Product

Mirror Protocol is a new kind of DeFi infrastructure: **behavioral liquidity**.

The idea is simple. Good traders have patterns — momentum plays, mean reversion entries, arbitrage windows. Today, those patterns live in a trader's head or in a private script. Mirror Protocol makes them **on-chain, ownable, and delegatable**.

### How it works for users:

**For pattern creators:**
You connect your wallet, click **"+ Mint Pattern"**, describe your trading strategy (type, win rate, volume, confidence), and mint it as an ERC-721 NFT. Your strategy is now a permanent, verifiable on-chain asset with embedded performance metrics.

**For delegators:**
You browse the pattern marketplace, see each strategy's live win rate, ROI, and trade volume. You pick one, click **"Delegate"**, set your allocation percentage, and sign. Your capital is now linked to that pattern's execution conditions.

**For the protocol:**
An executor bot watches every active delegation through Envio's real-time index. Every 5 seconds, it checks: are conditions met? Is the win rate above the delegator's threshold? If yes — a real Uniswap V2 swap fires automatically. USDC goes in, WETH comes out (or vice versa). The trade is confirmed, indexed, and visible on the dashboard within seconds.

No manual intervention. No centralized matching. Just patterns, delegations, and automated execution — all on-chain.

---

## The Proof: Live on Ethereum Sepolia

This isn't a whitepaper. Everything described above is deployed, running, and verifiable:

| | |
|---|---|
| **Total successful trades** | **139+** real Uniswap V2 swaps |
| **Trading pairs** | WETH ↔ USDC (bidirectional) |
| **Strategy patterns** | 7 active — Momentum, Mean Reversion, Arbitrage, Liquidity, Yield, Composite |
| **Active delegations** | 7, each with distinct allocation percentages |
| **Delegation depth** | Up to 3 layers (delegator → sub-delegator → executor) |
| **Envio query latency** | **3-5ms** per decision cycle |
| **Test coverage** | 149 tests, including forked Sepolia integration against real Uniswap V2 |
| **DEX pool** | [WETH/USDC on Sepolia Uniswap V2](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74) |

Every trade in the feed links to Sepolia Etherscan. Click any transaction hash — you'll see real ERC-20 transfers, real Uniswap V2 swap events, real block confirmations. This is not a mockup.

---

## The Architecture

```
┌──────────────────────────────────────────────────┐
│                                                    │
│   User mints strategy pattern → ERC-721 NFT       │
│                    ↓                                │
│   Others delegate capital → DelegationRouter       │
│   (conditions: min win rate, min ROI, allocation)  │
│                    ↓                                │
│   Envio HyperSync indexes all events (<50ms)       │
│                    ↓                                │
│   Executor bot queries Envio (3-5ms response)      │
│   → "Should I trade? Yes — conditions met."        │
│                    ↓                                │
│   UniswapV2Adapter → real Uniswap V2 Router02     │
│   → real WETH/USDC swap on Sepolia                 │
│                    ↓                                │
│   Trade event indexed → dashboard updates live     │
│                                                    │
└──────────────────────────────────────────────────┘
```

Five smart contracts, each with a single responsibility:

- **BehavioralNFT** — mints strategy patterns as ERC-721 tokens with on-chain performance metadata
- **PatternDetector** — validates strategy quality before allowing a mint (configurable thresholds)
- **DelegationRouter** — manages who delegates to which pattern, with permissions and conditions
- **ExecutionEngine** — orchestrates the actual trade execution, supporting up to 3-layer delegation chains
- **UniswapV2Adapter** — wraps the real Uniswap V2 Router so the engine can swap through real DEX liquidity

All contracts are deployed on Ethereum Sepolia and verified on Etherscan. [View them all →](https://github.com/kaustubh76/Mimic-Protocol#contract-addresses)

---

## Why Envio HyperSync

Mirror Protocol's execution speed depends entirely on how fast the bot can read on-chain state. Every 5 seconds, it needs to know: which delegations are active, what's each pattern's current win rate, and should a trade fire?

Reading that from the blockchain directly would take **4+ seconds** per cycle — 21 RPC calls across 7 delegations. By the time the bot finishes reading, the data is already stale.

**Envio HyperSync delivers the same answer in 3-5 milliseconds.** One GraphQL query, one round-trip, every field the bot needs. That's what makes the dashboard feel alive — the indexer is so fast that the gap between "event happens on-chain" and "user sees it in the feed" is measured in seconds, not minutes.

The live dashboard's `4ms` query latency badge isn't marketing. It's the actual time Envio took to answer the last query. Every time a visitor notices how fast the feed updates, they're experiencing HyperSync — they just don't know it yet.

---

## What's Next: The Roadmap

Mirror Protocol today is a working proof of concept. Here's where it's going.

### Uniswap V3 Trade Engine

The current adapter routes through Uniswap V2 — one pool, one fee tier, basic `swapExactTokensForTokens`. The next major upgrade is a **V3-native trade engine** that unlocks:

- **Multi-fee-tier routing** — choose between 0.05%, 0.3%, and 1% fee pools based on which has the best liquidity for the trade size
- **Concentrated liquidity awareness** — route around price ranges where liquidity is thin, reducing slippage
- **Real slippage protection** — use Uniswap V3's `QuoterV2` to compute a real `amountOutMinimum` before every trade, instead of the current `minAmountOut = 0`
- **Multi-hop paths** — route USDC → WETH → DAI when the direct pair is thin, picking the path with the lowest price impact
- **Richer Envio telemetry** — V3 swaps carry fee tier, tick data, and sqrtPriceX96, giving the dashboard execution-quality metrics (slippage vs. quoted, fee-tier distribution charts, price impact per trade)

The V3 adapter is designed as a **drop-in replacement** for the V2 adapter. The ExecutionEngine doesn't change — it still calls `adapter.swap()`. The bot doesn't change — it still reads from Envio. Only the adapter contract swaps out. This means the upgrade can ship without redeploying the core protocol.

### TradingView Strategy Input → NFT Patterns

This is the feature that makes Mirror Protocol a real product, not just an infrastructure demo.

Today, minting a pattern requires manually entering trade stats (win rate, volume, P&L) through the frontend modal. That works for the proof of concept, but the real vision is:

**Connect your TradingView account → Mirror Protocol reads your strategy's backtest results → auto-populates the pattern data → one-click mint as an NFT.**

The flow:

```
TradingView Pine Script strategy
  → Export performance report (win rate, profit factor, max drawdown, trade count)
  → Mirror Protocol parses the report
  → PatternDetector validates against on-chain thresholds
  → BehavioralNFT mints with TradingView-verified metrics
  → Pattern appears in the marketplace with a "TradingView Verified" badge
```

This bridges the gap between **traditional trading** (where millions of traders already backtest strategies on TradingView) and **on-chain execution** (where those strategies can be delegated to and auto-executed through real DEX liquidity). The trader keeps ownership of their strategy as an NFT. Delegators get access to proven, verifiable performance data. The protocol handles execution.

### Beyond Sepolia

The current deployment is on Ethereum Sepolia (testnet). The path to production:

- **Mainnet deployment** — same contracts, real ETH, real USDC, real stakes. The architecture is chain-agnostic; only the contract addresses and RPC URLs change.
- **Multi-chain expansion** — Envio HyperSync supports 50+ chains. Mirror Protocol's indexer can be configured to watch contracts on Arbitrum, Base, Optimism, or Polygon with a config change. Cross-chain pattern aggregation becomes possible: a strategy that performs well on Arbitrum can be delegated to on Base.
- **Gasless delegation** — integrate ERC-4337 account abstraction so delegators don't need ETH to create delegations. The protocol sponsors the gas, funded by a fee on successful trade execution.

---

## The Numbers That Matter

| What you can verify | How |
|---|---|
| 139+ real Uniswap V2 swaps | Click any tx hash in the [live feed](https://mirror-protocol-nine.vercel.app) → opens on Sepolia Etherscan |
| Sub-5ms Envio indexing | Open the [GraphQL playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql), run any query, check the response time |
| 149 passing tests | Clone the [repo](https://github.com/kaustubh76/Mimic-Protocol), run `./test/run-sepolia-harness.sh` |
| Bidirectional trading | The feed shows both `WETH → USDC` and `USDC → WETH` swaps |
| Real pool liquidity | [WETH/USDC pair on Sepolia](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74) — ~40 WETH reserves |
| Pattern minting works | Connect MetaMask on Sepolia, click "+ Mint Pattern", fill the form, sign |

---

## Try It

**[Live Dashboard](https://mirror-protocol-nine.vercel.app)** — open it, watch the feed, browse patterns. No wallet needed.

**[Envio Playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)** — paste this and hit play:

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

**[Source Code](https://github.com/kaustubh76/Mimic-Protocol)** — everything is open source. Clone, explore, run the tests.

---

## Built With

**[Envio HyperSync](https://docs.envio.dev)** — real-time event indexing that makes sub-5ms pattern detection possible

**Ethereum Sepolia** — testnet deployment with real Uniswap V2 liquidity

**Solidity + Foundry** — 5 smart contracts, 149 tests, forked integration testing

**React + wagmi + viem** — live dashboard with real-time feed updates

---

*Mirror Protocol is built by Kaustubh Agrawal as a demonstration of what becomes possible when infrastructure is fast enough to be invisible.*

*The product runs. The trades are real. The code is open. [See for yourself →](https://mirror-protocol-nine.vercel.app)*

**Tags:** `Envio` `HyperSync` `DeFi` `Uniswap` `NFT` `Ethereum` `Web3` `TradingView`
