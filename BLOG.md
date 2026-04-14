# The Fastest Way to Sell Infrastructure Is to Make Users Feel It

### I built Mirror Protocol to prove one thing: that the best way to grow Envio HyperSync isn't another benchmark chart — it's a product users can touch, with real trades they can verify on-chain.

![Mirror Protocol Live Dashboard](./docs/images/dashboard-hero.png)
*[mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app) — 7 strategy NFTs, 7 active delegations, 139+ real Uniswap V2 swaps, bidirectional WETH/USDC trading, all live on Ethereum Sepolia.*

---

Open the site. Don't connect anything. Just wait three seconds.

The metrics count up. A green dot pulses in the corner. A new trade slides into the feed — `5.00 USDC → 0.0007 WETH · Uniswap V2 · pool 0x72e46e…` — timestamped "just now." Click the transaction hash. Sepolia Etherscan opens. You're looking at a real Uniswap V2 swap, confirmed on a real block, with real token transfers. Nothing you did triggered any of it — it's all happening because the chain is moving, Envio is indexing, and the page is listening.

That's the whole pitch. You didn't read it. You felt it.

---

## The Problem Every Infra Team Has

If you sell developer infrastructure, you know this sentence by heart:

> *"Our indexer is 50x faster than the alternative."*

It's true. It's also dead on arrival. Numbers on a landing page ask the reader to trust you, translate the claim into their own roadmap, and care enough to keep reading. Most people won't. They bounce, they forget, they pick whichever tool their friend mentioned last.

This isn't a product problem. It's a positioning problem. Infrastructure is inherently invisible — by the time a user benefits from a faster indexer, they're three abstractions away from knowing it exists. Your job as a growth engineer is to close that distance. To make the invisible tangible. To turn a latency chart into a heartbeat.

Mirror Protocol is my attempt to do exactly that.

---

## The Thesis

Here is the argument in one line:

**An infrastructure product grows fastest when a non-developer can experience what it unlocks in under ten seconds — without reading a single word of documentation.**

Everything else in Mirror Protocol is a consequence of that thesis. The demo is the homepage. The homepage has no tutorial, no "learn more" button, no marketing video. It just runs — live, on a real chain, with real data, reacting to real events the moment they happen. A visitor's first interaction isn't reading about the product; it's watching the product do something.

That single design choice changes the entire funnel. Instead of Docs → Tutorial → Hello World → Production (which only works on engineers who are already looking), you get Live Demo → "wait, what?" → GitHub → Envio (which works on anyone with an internet connection). One funnel is niche and slow. The other is organic and viral.

---

## What Mirror Protocol Actually Does

In one paragraph, so anyone can follow:

> *Mirror Protocol turns successful trading strategies into NFTs. A trader mints their proven strategy as an ERC-721 with embedded performance metrics — win rate, ROI, volume. Other users delegate capital to that NFT with conditions like "only execute if win rate is above 80%." A keeper bot watches the indexed data via Envio HyperSync and fires a real Uniswap V2 swap the moment the conditions match. The entire flow — minting, delegation, detection, execution, confirmation — is visible on the dashboard within seconds.*

---

## Not a Simulation — Real DEX Execution

This is the part most demos skip. Mirror Protocol doesn't simulate trades. It executes them.

Every trade the bot fires goes through a `UniswapV2Adapter` contract that wraps the real Uniswap V2 Router02 on Ethereum Sepolia. The adapter pulls tokens from the ExecutionEngine's float, calls `swapExactTokensForTokens` against the real WETH/USDC pair ([pool 0x72e46e15…](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74)), and delivers the output tokens back to the engine. The entire swap — from the adapter's `safeTransferFrom` to the pair's constant-product math to the token transfer — is one atomic on-chain transaction.

**Bidirectional trading:** The system trades both directions — WETH → USDC and USDC → WETH — using the same adapter contract and the same pool. The trade direction is configurable per deployment. This isn't a hardcoded one-way demo; it's a real trading engine that can execute any strategy the pattern defines.

The adapter emits a rich `Swap(sender, tokenIn, tokenOut, amountIn, amountOut, to)` event that Envio HyperSync indexes in real time. The frontend joins that event with the engine's `TradeExecuted` event by transaction hash, and every row in the Live Execution Feed renders the actual realized swap: `5.00 USDC → 0.0007 WETH · Uniswap V2 · pool 0x72e46e…`. Click the pool link and you land on Sepolia Etherscan, looking at a real Uniswap V2 pair with real reserves and real swap history.

As of this writing, **139 successful trades** have executed across 7 delegations spanning 7 distinct pattern strategies (Momentum, Mean Reversion, Arbitrage, Liquidity, Yield, Composite). The engine has processed both WETH→USDC and USDC→WETH swaps through real on-chain liquidity. Every swap is verifiable on Sepolia Etherscan — not because I'm claiming it, but because you can click any transaction hash in the feed and see it yourself.

---

## How It Works Under the Hood

### The Smart Contract Stack

```
┌─────────────────────────────────────────────────────────┐
│  User mints pattern NFT (BehavioralNFT)                 │
│  ↓                                                       │
│  PatternDetector validates: trades, win rate, volume,    │
│  confidence, cooldown → mints ERC-721 with metadata      │
│  ↓                                                       │
│  Other users create delegations (DelegationRouter)       │
│  → specify allocation %, smart account, conditions        │
│  → up to 3 layers of nested delegation (depth limit)     │
│  ↓                                                       │
│  Executor bot polls Envio GraphQL every 5s               │
│  → fetches active delegations + pattern metrics (<5ms)   │
│  → validates conditions (win rate, ROI, volume gates)    │
│  ↓                                                       │
│  ExecutionEngine.executeTrade()                          │
│  → validates delegation, applies % allocation            │
│  → calls UniswapV2Adapter.swap() via _externalCall       │
│  → adapter routes through real Uniswap V2 Router02       │
│  → real tokens move, real swap executes                  │
│  ↓                                                       │
│  TradeExecuted + Swap events emitted                     │
│  → Envio HyperSync indexes both in <50ms                 │
│  → Frontend polls GraphQL, renders in LiveExecutionFeed  │
└─────────────────────────────────────────────────────────┘
```

### Five Contracts, Each With a Clear Job

| Contract | Address (Sepolia) | Purpose |
|---|---|---|
| **BehavioralNFT** | [`0xCFa224…`](https://sepolia.etherscan.io/address/0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954) | ERC-721 minting for strategy patterns. Stores win rate, ROI, volume as on-chain metadata. |
| **PatternDetector** | [`0x4C122A…`](https://sepolia.etherscan.io/address/0x4C122A516930a5E23f3c31Db53Ee008a2720527E) | Validates pattern quality (min trades, win rate, volume, confidence) before minting. Owner-tunable thresholds. |
| **DelegationRouter** | [`0xD36fB1…`](https://sepolia.etherscan.io/address/0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8) | Manages delegations with permissions (spend limits, expiry, token whitelists) and conditional requirements (min win rate, ROI gates). |
| **ExecutionEngine** | [`0x1C1b05…`](https://sepolia.etherscan.io/address/0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A) | Orchestrates trade execution. Validates, allocates, calls the DEX adapter, records stats. Supports 3-layer delegation chains. |
| **UniswapV2Adapter** | [`0x5B59f3…`](https://sepolia.etherscan.io/address/0x5B59f315d4E2670446ed7B130584A326A0f7c2D3) | Thin wrapper around Uniswap V2 Router02. Handles approvals, encodes the swap path, emits a rich Swap event for Envio to index. |

### Why Envio Makes This Possible

The bot needs to make a decision every 5 seconds: "which delegations are active, what are their pattern metrics, and should I execute?" Without Envio, answering that question requires N on-chain reads per delegation — `getDelegation()`, `getPatternMetadata()`, `getWinRate()`, etc. At 7 delegations, that's 21+ RPC calls per cycle, each taking 200-500ms. Total decision latency: **1-2 seconds minimum**, assuming the RPC doesn't rate-limit you.

With Envio HyperSync, the same query is one GraphQL request:

```graphql
{
  Delegation(where: {isActive: {_eq: true}}) {
    delegationId
    patternTokenId
    percentageAllocation
    smartAccountAddress
    pattern {
      winRate roi totalVolume isActive patternType
    }
  }
}
```

Response time: **3-5ms**. Every field the bot needs — delegation state, pattern metrics, allocation percentages — in a single round-trip. The bot's total cycle time from "poll Envio" to "submit tx" is under 2 seconds, of which 1.5 seconds is the Sepolia RPC latency for broadcasting the transaction. Envio's contribution to the decision is measured in single-digit milliseconds.

This is the "invisible infrastructure" problem solved visually: the dashboard's `4ms` query latency badge is Envio's fingerprint. Every time a visitor notices how fast the feed updates, they're experiencing HyperSync without knowing it.

---

## The NFT Minting Flow

Users don't just browse pre-made patterns — they create their own. The frontend includes a full **Mint Pattern** modal where a trader enters:

- **Strategy type** (Momentum, Mean Reversion, Arbitrage, Liquidity, Yield, Composite)
- **Trade stats** (total trades, successful trades → auto-calculated win rate)
- **Volume and P&L** (in ETH)
- **Confidence score** (50-100%)

The form calls `PatternDetector.validateAndMintPattern()` which validates the data against on-chain thresholds, mints an ERC-721 via `BehavioralNFT.mintPattern()`, and writes the performance metrics. The result is a tradeable NFT that other users can delegate to.

This is the product loop:

```
Trader creates strategy → Mints as NFT → Others delegate capital →
Bot auto-executes → Real Uniswap V2 swap → Profits accumulate →
Strategy's metrics update → More users delegate → Cycle repeats
```

---

## Three Moments That Sell the Product For You

I designed the UI backward from three moments. Not features — moments. Things I wanted a user to feel in a specific order.

**Moment one: the metrics breathe.** The top of the page shows live counters — trades executed, query latency, events per second — next to a pulsing green "LIVE" dot. The counters tick up as new events come in. A visitor doesn't read the numbers. They notice the page *moving*. That's the signal that this isn't a mockup, and they scroll.

**Moment two: the feed streams.** Further down, the Live Execution Feed slides in a new trade every few seconds with a soft green highlight that fades after two seconds. Each row shows the pattern name (not just an ID — "Momentum", "Arbitrage"), the real swap detail (`5.00 USDC → 0.0007 WETH`), and a transaction hash that links straight to Sepolia Etherscan. The relative timestamp updates every second — `just now → 3s ago → 12s ago` — so even the static rows are alive. If a skeptic clicks the tx hash and lands on a real confirmed block showing a real Uniswap V2 swap, the skepticism ends there.

**Moment three: the data flow reveals.** Right next to the feed, an animated diagram shows the pipeline: User → Sepolia Event → **Envio HyperSync** → GraphQL → Bot → Dashboard. The Envio node pulses in purple, brighter than everything else. The moment a visitor is impressed, the diagram tells them *exactly* which piece made that impression possible. You don't have to sell Envio after that. The product already did.

These three moments compound. By the time a visitor has spent twenty seconds on the page, they've subconsciously decided the thing is real, the infrastructure is fast, and Envio is the reason. That's the entire funnel, collapsed into half a minute of ambient attention.

---

## Testing: 149 Tests, Including Forked Sepolia

The project ships with a two-layer test harness:

**Layer 1 — Unit + Integration (143 tests, <1 second):** Covers all contract logic using local MockDEX stubs. Pattern minting, delegation creation, execution, multi-layer chains, revocation, validation — every path tested.

**Layer 2 — Forked Sepolia (6 tests, ~30 seconds):** Snapshots live Sepolia state into an in-memory EVM and exercises the real adapter against real Uniswap V2 liquidity. Includes:
- Adapter wiring verification (router, tokens, allowances)
- Full flow: create delegation → fund smart account → execute swap → assert WETH decreases, USDC increases
- 3-layer delegation: 3 independent delegators on the same pattern, all executing real swaps
- Revert guard: engine underfunded → `executeTrade` returns `false` (not a revert — the engine's try/catch records the failure for bookkeeping)

Run it yourself:

```bash
./test/run-sepolia-harness.sh
# Layer 1: 143/143 passed
# Layer 2: 6/6 passed
# All Sepolia harness checks passed ✓
```

---

## The Split That Tells You Everything

Here is how the hours on this project actually broke down:

| Work | Share of Time |
|---|---|
| Smart contracts, indexer, executor bot | 30% |
| Frontend components and state | 25% |
| Copywriting, README, blog, narrative | 20% |
| Visual polish, animations, diagram | 15% |
| Deployment, CI, domain, env vars | 10% |

Nearly half the project was writing, design, and polish. That ratio isn't a mistake. It's a declaration.

The infrastructure did its job. Envio is genuinely fast, the bot genuinely executes trades, the contracts genuinely hold the state. My job was to make sure a person who doesn't know what HyperSync is can look at the screen for ten seconds and understand that something impressive is happening.

---

## What I'd Steal From This For Any Infra Team

If you run growth at an indexer, an L1, a wallet SDK, a keeper network, or any infrastructure product, here is the short version of the playbook:

**One.** Your flagship demo must be impossible without your product. If a visitor could imagine building it on a competitor's stack, the demo is proving the wrong thing.

**Two.** Put live data on the landing page. Not charts — *data in motion.* Counters that tick. Feeds that stream. Dots that pulse. Visitors make a "is this real?" judgment in three seconds, and a static page always loses that judgment.

**Three.** Name your product at the exact moment a visitor is impressed. Not in a sidebar logo, not in a footer. Inside the diagram they're already looking at. Attribution windows close fast.

**Four.** Make it real. Not "looks real." Actually real. Real contracts, real swaps, real liquidity, real tokens moving on real blocks. A demo that simulates trades will always feel hollow to anyone who knows what they're looking at.

**Five.** Design the funnel, not just the demo. Live demo → source code → blog → your product's docs. If any step is a dead end, you've dropped a visitor who was seconds away from becoming a user.

**Six.** Measure time-to-wow, not time-to-load. The number that matters is the seconds between "page opens" and "user audibly says *oh damn*." Optimize for that.

---

## Try It Yourself

**Live site:** [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app) — open it, don't connect your wallet, just watch the feed.

**Run a live query:** Open the [Envio GraphQL playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql) and paste:

```graphql
{
  SystemMetrics {
    totalPatterns
    totalDelegations
    successfulExecutions
    averageQueryLatency
  }
  TradeExecution(
    where: { success: { _eq: true } }
    order_by: { timestamp: desc }
    limit: 5
  ) {
    txHash
    amount
    timestamp
    pattern { patternType }
  }
  PoolSwap(order_by: { timestamp: desc }, limit: 5) {
    tokenIn
    tokenOut
    amountIn
    amountOut
  }
}
```

You'll see the sub-5ms response, real trade data, and the PoolSwap entity showing actual Uniswap V2 amountIn/amountOut. Every field comes from on-chain events indexed by Envio HyperSync.

**Source code:** [github.com/kaustubh76/Mimic-Protocol](https://github.com/kaustubh76/Mimic-Protocol) — the README walks you through the architecture in two minutes.

**Run the tests:** Clone the repo and run `./test/run-sepolia-harness.sh`. 149 tests, including forked Sepolia integration tests against real Uniswap V2 liquidity.

---

## The Line I Want You To Remember

Infrastructure sells when users can feel it.

That's the whole argument. Every sentence above is a footnote.

Mirror Protocol is the proof of work. 139 real trades. 5 smart contracts. Real Uniswap V2 liquidity. Sub-5ms Envio queries. One dashboard where you can watch it all happen live. The playbook is portable. I'm ready to ship the next one.

---

*By Kaustubh Agrawal · Built on Ethereum Sepolia with Envio HyperSync*

*Live at [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app)*

**Tags:** `Envio` `HyperSync` `DeFi` `NFT` `Uniswap V2` `Ethereum Sepolia` `Web3` `Growth Engineering` `Developer Experience`
