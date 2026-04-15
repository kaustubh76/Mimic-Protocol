# I Built a DeFi Product That Executes Real Trades on Uniswap — Here's What I Learned About Selling Infrastructure

*By Kaustubh Agrawal*

![Mirror Protocol Live Dashboard](./docs/images/dashboard-hero.png)

I spent the last few weeks building [Mirror Protocol](https://mirror-protocol-nine.vercel.app), a DeFi application that turns on-chain trading strategies into mintable NFTs and auto-executes real Uniswap V2 swaps when delegation conditions match. It runs on Ethereum Sepolia with [Envio HyperSync](https://docs.envio.dev) powering the real-time indexing.

**The numbers as of today:** 139 successful trades executed through real Uniswap V2 liquidity, 5 smart contracts deployed, 7 strategy patterns active, bidirectional WETH/USDC trading, sub-5ms Envio query latency, and a [live dashboard](https://mirror-protocol-nine.vercel.app) where you can watch it all happen.

This post isn't about the code (that's on [GitHub](https://github.com/kaustubh76/Mimic-Protocol)). It's about what I learned building a product on top of developer infrastructure — and why I think the approach I stumbled into might be useful for anyone trying to grow an infra product.

---

## The Idea That Started It

I kept seeing the same pattern at every blockchain infrastructure company: incredible technology, terrible demos. An indexer that processes 10,000 events per second gets sold with a latency chart and a migration guide. A delegation toolkit gets sold with API documentation and a quickstart. Both are technically correct. Neither makes a non-engineer care.

I wanted to flip that. What if the demo wasn't a tutorial — it was a working product? What if instead of showing people *numbers about speed*, I showed them *speed itself*?

That's how Mirror Protocol started: as a bet that I could take Envio's indexing infrastructure and build something on top of it that would make the speed *visible* to anyone who opened the page.

---

## What Mirror Protocol Does (the Short Version)

> A trader mints their proven strategy as an ERC-721 NFT with embedded performance metrics. Other users delegate capital to that NFT with conditions like "only execute if win rate is above 80%." An executor bot watches Envio's indexed data and fires a real Uniswap V2 swap the moment the conditions match. Everything — minting, delegating, executing, confirming — shows up on the dashboard within seconds.

That paragraph took me ages to get right. The first version was three paragraphs long and started with "ERC-6551 token-bound accounts." I lost 90% of potential readers in the first sentence. The lesson: **your one-paragraph pitch is your most important deliverable.** If a PM, an investor, and an engineer can all understand it in one read, you've won.

---

## The Part Most Demos Skip: It's Actually Real

This is the thing I'm most proud of, and it's the thing that changed how I think about demos.

Mirror Protocol doesn't simulate trades. Every single swap goes through a real smart contract ([UniswapV2Adapter](https://sepolia.etherscan.io/address/0x5B59f315d4E2670446ed7B130584A326A0f7c2D3)) that wraps the actual Uniswap V2 Router02 on Sepolia. When the bot fires a trade, real USDC gets pulled from the ExecutionEngine, goes through real constant-product math in a real [WETH/USDC pool](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74), and real WETH comes back. You can click any transaction hash in the feed and verify it yourself on Etherscan.

I didn't start with real execution. The first version used a `MockDEX.sol` contract that returned 98% of the input regardless of pool state. It worked for testing. But during a demo run-through, I clicked a transaction hash in the feed, landed on the block explorer, and realized the swap was... nothing. Just an empty function call that emitted an event. The "trade" was a lie the UI was telling.

That bothered me enough to spend three days integrating real Uniswap V2. It was painful — I had to:

- Deploy a `UniswapV2Adapter` that handles approvals, encodes swap paths, and emits rich events
- Add `approveToken()` to the ExecutionEngine so it could authorize the adapter to spend its float
- Fund the engine with real WETH (wrapped from Sepolia ETH)
- Modify the executor bot to encode real `swapExactTokensForTokens` callData
- Add a `PoolSwap` entity to the Envio indexer so the frontend could show actual amountIn/amountOut

But now when someone clicks a tx hash, they see real token transfers. That changes the conversation from "nice demo" to "wait, this actually works."

**Lesson I didn't expect:** making it real didn't just improve the demo. It improved the *code*. Fake execution hides bugs. Real execution surfaces them immediately. I found three contract issues during the Uniswap integration that the mock path never triggered.

---

## The Pivot I Didn't Plan

The original plan was to build on Monad testnet. I deployed everything, set up the Envio indexer, got the bot running — and then discovered that every DEX on Monad testnet had been wiped in a chain reset.

I spent a full day verifying this. I probed every address in the official [`monad-crypto/protocols`](https://github.com/monad-crypto/protocols) registry on GitHub — Bean Exchange, Ambient, Uniswap V2, Uniswap V3, LFJ, Monorail, Kuru, iZUMi. Every single one returned `eth_getCode == "0x"`. No code. No router. No factory. No pools.

Two-line proof anyone can reproduce:

```bash
# LFJ Router V1 — official registry says it's at this address
curl -s -X POST https://testnet-rpc.monad.xyz -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0x4faCe5b0EF2757Ceb9151D14C036A1135931C70E","latest"]}'
# → {"result":"0x"}  ← no code
```

I had two choices: deploy my own AMM on Monad, or pivot to a chain with working DEX infrastructure. I chose Ethereum Sepolia, where Uniswap V2 is deployed, verified, and has real liquidity in the WETH/USDC pool.

The pivot took a full day — redeploying all five contracts, reconfiguring the Envio indexer, updating the frontend, rewiring the bot. But the result is a product that runs against *real, existing* DEX infrastructure instead of a homemade pool, which is a stronger proof point.

**Lesson:** Don't get attached to your chain choice. The product's value is in the behavior it demonstrates, not the network it runs on. If the infrastructure you need doesn't exist where you are, move.

---

## Why Envio Is the Load-Bearing Piece

The executor bot needs to answer a question every 5 seconds: "which delegations are active, and should I execute any of them?" Without Envio, answering that means 21+ on-chain reads per cycle (one for each delegation's state, pattern metrics, and conditions). At 200ms per RPC call, that's a 4-second decision window before the bot can even submit a transaction.

With Envio HyperSync, it's one GraphQL query:

```graphql
{
  Delegation(where: {isActive: {_eq: true}}) {
    delegationId patternTokenId percentageAllocation
    smartAccountAddress
    pattern { winRate roi totalVolume isActive patternType }
  }
}
```

Response time: **3-5ms**. Everything the bot needs in a single round-trip. The dashboard's `4ms` query latency badge isn't decoration — it's literally the time Envio took to answer the last query.

This is why I think live dashboards are the best way to sell indexer infrastructure. You don't have to *explain* that Envio is fast. Visitors *see* it every time the feed updates.

---

## Things I Built and What They Cost

| What | Stack | Lines | Time |
|---|---|---|---|
| **5 Smart contracts** | Solidity 0.8.20, Foundry | ~2,500 | 30% |
| **Envio indexer** | TypeScript, HyperSync, GraphQL | ~700 | 10% |
| **Executor bot** | Node.js, viem, Envio GraphQL | ~600 | 15% |
| **Frontend** | React, wagmi, viem, Framer Motion | ~3,000 | 25% |
| **Docs, blog, README** | Markdown | ~1,500 | 15% |
| **Deploy scripts, tests, CI** | Foundry, bash | ~800 | 5% |

The split that surprised me: **nearly half the project is writing and UI polish.** The smart contracts were honestly the "easy" part. Making the dashboard feel alive — the pulsing dots, the sliding animations, the relative timestamps that tick every second, the animated data-flow diagram — that took longer than the delegation router.

I think that's the right ratio for a growth project. The infrastructure has to work. But if the presentation doesn't make someone stop scrolling, the infrastructure never gets a chance to prove itself.

---

## The Test Suite I'm Actually Proud Of

149 tests. Two layers:

**Layer 1 (143 tests, <1 second):** Standard Foundry unit and integration tests with mock contracts. Every contract path covered — minting, delegation, execution, revocation, multi-layer chains, validation failures.

**Layer 2 (6 tests, ~30 seconds):** This is the interesting one. These tests use `vm.createSelectFork()` to snapshot live Sepolia state into an in-memory EVM, then exercise the real adapter against real Uniswap V2 liquidity. The full-flow test creates a fresh delegation, funds a smart account, executes a trade, and asserts the engine's WETH decreased and USDC increased — all against the real on-chain pool.

The forked test caught two assumption bugs in my own thinking:
1. I thought `percentageAllocation` would scale the adapter's swap amount. It doesn't — it only scales the bookkeeping. The full `TRADE_AMOUNT` hits the pool regardless of allocation.
2. I expected `executeTrade` to revert when the engine was underfunded. It doesn't — the engine's `try/catch` wrapper swallows the adapter revert and records `success=false`. That's a design feature, not a bug.

Both of those would have been invisible with mock tests.

```bash
./test/run-sepolia-harness.sh
# Layer 1: 143/143 passed
# Layer 2: 6/6 passed
# All Sepolia harness checks passed
```

---

## Three Design Decisions That Mattered

**1. The feed shows pattern names, not IDs.** The old version showed `P#1 → D#3`. The new version shows `Momentum → D#3`. That one change made the feed readable by someone who doesn't know what a pattern token ID is.

**2. Every trade row shows the actual swap.** `5.00 USDC → 0.0007 WETH · Uniswap V2 · pool 0x72e46e…` — the real amountIn, the real amountOut, and a clickable link to the pool on Etherscan. This is indexed from the adapter's `Swap` event via Envio and joined to the `TradeExecuted` event by transaction hash on the frontend.

**3. The data flow diagram names Envio at the peak moment.** Right when a visitor is watching the feed and thinking "how is this updating so fast?", the animated diagram next to it shows: User → Sepolia Event → **Envio HyperSync** → GraphQL → Bot → Dashboard. The Envio node pulses brighter than everything else. That's not an accident — it's the attribution window.

---

## Try It

- **[Live dashboard](https://mirror-protocol-nine.vercel.app)** — open it, don't connect anything, just watch for 10 seconds.
- **[Envio GraphQL playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)** — paste this query and hit play:

```graphql
{
  SystemMetrics {
    successfulExecutions
    averageQueryLatency
  }
  TradeExecution(where: {success: {_eq: true}}, order_by: {timestamp: desc}, limit: 3) {
    txHash
    pattern { patternType }
  }
  PoolSwap(order_by: {timestamp: desc}, limit: 3) {
    amountIn amountOut tokenIn tokenOut
  }
}
```

- **[Source code](https://github.com/kaustubh76/Mimic-Protocol)** — clone it, run `./test/run-sepolia-harness.sh`, see 149 tests pass against real Sepolia state.

---

## What I'd Do Differently

**Start with real execution from day one.** I wasted time on MockDEX when I should have gone straight to Uniswap V2. The mock taught me nothing that the real integration didn't teach better and faster.

**Don't fall in love with your chain.** I spent a day debugging why every DEX on Monad testnet had no code. I should have probed the chain in the first hour and pivoted immediately.

**Write the blog while you build.** Every bug is a story. The EIP-7702 delegation designator that broke my deploy, the rate-limit race condition in the bot, the CORS regression when the Vercel env var pointed at a dead indexer — those are the interesting parts, and I almost forgot them because I wrote this post after the code was done.

---

## The Takeaway

Infrastructure sells when users can feel it. Not when they read about it. Not when they see a benchmark chart. When they open a page and something is already happening — live, real, verified on-chain — and they can tell within three seconds that the thing is fast.

I built Mirror Protocol as a proof of this idea. 139 real trades. 5 contracts. Real Uniswap V2 swaps. Sub-5ms Envio queries. A live dashboard that runs whether or not you connect a wallet. Everything clickable, everything verifiable, everything real.

If you're building developer infrastructure and you don't have a demo like this yet — something that makes your speed *visible* to non-engineers in under ten seconds — you should build one. Not a tutorial. Not a quickstart. A product that runs in front of people and lets the infrastructure speak for itself.

---

*Kaustubh Agrawal — [GitHub](https://github.com/kaustubh76) · [Mirror Protocol](https://mirror-protocol-nine.vercel.app)*

*Built with [Envio HyperSync](https://docs.envio.dev) on Ethereum Sepolia*

**Tags:** `Envio` `HyperSync` `DeFi` `Uniswap V2` `NFT` `Growth Engineering` `Web3` `Ethereum`
