# How I Built Mirror Protocol: Turning On-Chain Trading Behavior Into Delegatable NFTs with Envio HyperSync

### A new class of DeFi primitive that only became possible once indexers got fast enough.

*By Kaustubh Agrawal · Built on Monad Testnet · Live at [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app)*

**Tags**: `Web3` `DeFi` `Blockchain` `Monad` `Envio` `GraphQL` `Smart Contracts`

![Mirror Protocol Dashboard](./docs/images/dashboard-hero.png)
*Mirror Protocol turns trading patterns into delegatable NFTs — all powered by Envio HyperSync on Monad.*

---

## The Idea That Wouldn't Let Go

Every day, a small number of traders on-chain quietly generate extraordinary returns. Their strategies — arbitrage loops, momentum trades, mean-reversion plays — are fully visible in blockchain history. Anyone can see what they did. But almost nobody can actually *follow* them.

The problem isn't visibility. It's **latency**. By the time you see a successful trade in a block explorer, the opportunity is already gone. By the time you figure out the pattern, the market has moved. And even if you wanted to automate following a specific trader, there's no primitive that lets you do it without either:

1. Writing a custom indexer from scratch (weeks of DevOps)
2. Polling an RPC endpoint in a loop (slow, expensive, rate-limited)
3. Trusting a centralized service with your capital

I wanted to build the missing primitive: a way to turn a proven trading pattern into a **tradeable object** — an NFT — that other users could delegate capital to, with an execution engine that fires automatically the moment on-chain conditions match.

I called it **Mirror Protocol**. And I quickly discovered that without a specific indexing infrastructure, it was impossible to build.

---

## Why Traditional Indexers Fall Apart

Let me show you the problem with a concrete example.

Mirror Protocol's executor bot needs to answer this question every few seconds:

> *"Across all active delegations, which ones have a matching pattern whose win rate, ROI, and volume all currently exceed the delegation's trigger conditions?"*

With a traditional RPC setup, answering this requires:

1. Fetch all active delegations → `eth_call` to `DelegationRouter.getActiveDelegations()`
2. For each delegation, read the linked pattern → another `eth_call` per delegation
3. For each pattern, read its current win rate, ROI, volume → three more `eth_call`s each
4. For each delegation, read its trigger conditions → another `eth_call`
5. Compare each pair in code

For 9 active delegations, that's **~36 RPC calls** per cycle. At typical RPC latency (200-500ms each), you're looking at **10+ seconds** per decision cycle. And that's before you even think about gas, rate limits, or what happens when the RPC provider has a bad minute.

Here's the same thing with Envio HyperSync:

```graphql
query ActiveDelegationsForBot {
  Delegation(where: { isActive: { _eq: true } }) {
    delegationId
    percentageAllocation
    pattern {
      tokenId
      patternType
      winRate
      roi
      totalVolume
      isActive
    }
  }
}
```

**One request. Sub-50ms response. Joined across entities.** Thirty-six RPC calls collapse into a single GraphQL query that returns in less time than it takes to blink.

That's not an optimization. That's a different category of thing.

---

## What Mirror Protocol Actually Does

The protocol has three core objects:

**1. Pattern NFT (`BehavioralNFT.sol`)**
An ERC-721 that represents a trading strategy. The metadata includes pattern type (momentum, arbitrage, mean-reversion, yield, liquidity, trend-following, composite), win rate, ROI, total volume, and performance history. Only the minter can update their own pattern.

**2. Delegation (`DelegationRouter.sol`)**
Built on top of MetaMask's Delegation Toolkit. A user delegates a percentage of their smart-account capital to a specific Pattern NFT. They can set trigger conditions: minimum win rate, minimum ROI, minimum volume. The delegation can be revoked at any time.

**3. Execution Engine (`ExecutionEngine.sol`)**
An authorized keeper (the bot) watches for delegations whose pattern currently satisfies all the trigger conditions and calls `executeTrade()` on-chain. The engine enforces cooldowns, tracks stats, and emits events for every execution.

Here's the flow in code:

```solidity
// ExecutionEngine.sol
function executeTrade(
    TradeParams calldata params,
    PatternMetrics calldata metrics
) external onlyExecutor returns (bool success) {
    // 1. Validate delegation is active
    Delegation memory d = router.getDelegation(params.delegationId);
    require(d.isActive, "Inactive delegation");

    // 2. Check trigger conditions
    Conditions memory c = router.getConditions(params.delegationId);
    require(metrics.currentWinRate >= c.minWinRate, "Win rate too low");
    require(metrics.currentROI >= c.minROI, "ROI too low");
    require(metrics.currentVolume >= c.minVolume, "Volume too low");

    // 3. Enforce cooldown
    require(
        block.timestamp >= lastExecution[params.delegationId] + cooldown,
        "Cooldown active"
    );

    // 4. Execute the actual trade
    (success, ) = params.targetContract.call(params.callData);

    // 5. Update stats & emit
    _updateStats(params.delegationId, success, params.amount);
    emit TradeExecuted(params.delegationId, params.token, params.amount, success);
}
```

Simple enough. The magic is in how the off-chain side *decides* to call this function.

---

## The Envio Secret Sauce

Envio HyperSync is more than "a faster indexer." It's a fundamentally different data architecture for blockchains. Here's what you get out of the box:

**1. Real-time event ingestion.** Every event from every tracked contract lands in a Postgres database within milliseconds of block confirmation. No polling, no retries, no missing logs.

**2. Auto-generated GraphQL API.** You define entities in `schema.graphql`, write event handlers in TypeScript, and Envio generates a fully-queryable GraphQL endpoint with filtering, ordering, pagination, and aggregations — for free.

**3. Cross-entity relationships.** You can define foreign keys between entities (`Delegation.pattern_id → Pattern.id`), and GraphQL will let you traverse them in a single query. No JOIN syntax needed, no n+1 problem.

**4. Hosted service.** No DevOps. No Postgres maintenance. No indexer crashes at 3am. Push your config, Envio runs it.

Here's a chunk of Mirror Protocol's event handler:

```typescript
// src/envio/src/EventHandlers.ts
BehavioralNFT.PatternMinted.handler(async ({ event, context }) => {
  const pattern: Pattern = {
    id: event.params.tokenId.toString(),
    tokenId: event.params.tokenId,
    patternType: decodePatternType(event.params.patternType),
    creator_id: event.params.creator.toLowerCase(),
    winRate: event.params.initialWinRate,
    roi: event.params.initialROI,
    totalVolume: event.params.initialVolume,
    isActive: true,
    delegationCount: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    createdAt: BigInt(event.block.timestamp),
    // ... more fields
  };

  context.Pattern.set(pattern);

  // Update system-wide metrics in the same transaction
  const metrics = await context.SystemMetrics.get("1");
  if (metrics) {
    context.SystemMetrics.set({
      ...metrics,
      totalPatterns: metrics.totalPatterns + 1,
      activePatterns: metrics.activePatterns + 1,
      lastPatternMintedAt: BigInt(event.block.timestamp),
    });
  }
});
```

Two important things to notice:

- **I'm writing business logic inside the indexer**, not outside. Aggregate counters, pattern-type breakdowns, and creator reputation all get computed at indexing time. By the time the frontend queries the data, the expensive work is already done.
- **The result is a Postgres database that's always in sync with chain state**, queryable via a single GraphQL endpoint, with sub-50ms latency. No backend server needed on my side. Ever.

---

## The Executor Bot in 30 Lines

Here's the actual decision loop of Mirror Protocol's keeper bot:

```javascript
async function runCycle() {
  // 1. Single query — Envio joins across Delegation → Pattern
  const delegations = await graphql(`
    query {
      Delegation(where: { isActive: { _eq: true } }) {
        delegationId
        pattern {
          winRate
          roi
          totalVolume
          isActive
        }
      }
    }
  `);

  // 2. Check each delegation against its on-chain trigger conditions
  for (const d of delegations) {
    const conditions = await getDelegationConditions(d.delegationId);

    if (
      d.pattern.isActive &&
      d.pattern.winRate >= conditions.minWinRate &&
      d.pattern.roi >= conditions.minROI &&
      d.pattern.totalVolume >= conditions.minVolume
    ) {
      // 3. Fire the trade on-chain
      await executionEngine.executeTrade({
        delegationId: d.delegationId,
        token: TEST_TOKEN,
        amount: parseEther('0.001'),
        targetContract: MOCK_DEX,
        callData: '0x',
      }, {
        currentWinRate: d.pattern.winRate,
        currentROI: d.pattern.roi,
        currentVolume: d.pattern.totalVolume,
        lastUpdated: Date.now() / 1000,
      });
    }
  }
}

setInterval(runCycle, 5000);
```

One Envio query replaces an entire indexing backend. One loop evaluates all delegations in milliseconds. And because Envio provides reliable pattern data, the bot can make correct decisions without ever needing to read the chain for pattern metrics — it only reads the chain for trigger conditions (which are set once and cached).

This is what I mean when I say Mirror Protocol is only possible because of Envio. The entire "behavioral infrastructure" premise — detecting winning patterns in real-time and acting on them — collapses without sub-50ms joined queries.

---

## The Frontend: A Window Into Live On-Chain Behavior

The dashboard is a React + Vite SPA that polls Envio every 5 seconds. Every metric, every chart, every table is populated directly from GraphQL. There is no custom backend. There is no API server. There is just Envio.

![Live Metrics Dashboard](./docs/images/live-metrics.png)
*The real-time metrics dashboard pulls from Envio's SystemMetrics aggregate — computed at indexing time.*

The dashboard has 5 main sections:

1. **System metrics**: Total patterns, delegations, executions, volume, earnings, query latency. All aggregated in the `SystemMetrics` entity inside the Envio handler.
2. **Pattern leaderboard**: Top patterns sorted by ROI with win rate, volume, and performance scoring.
3. **Analytics charts**: A bar chart comparing Pattern ROI across all active patterns, and an area chart showing cumulative execution volume over time. Both powered by recharts, both fed from live Envio data.
4. **Live execution feed**: Every trade the bot executes appears within seconds, complete with explorer links and "NEW" animation.
5. **Envio data flow visualization**: An animated diagram showing the full pipeline — User → Chain → Envio → GraphQL → Bot → Execution → Dashboard.

Here's what the GraphQL query for the dashboard looks like:

```graphql
query DashboardHome {
  metrics: SystemMetrics(where: { id: { _eq: "1" } }) {
    totalPatterns
    totalDelegations
    totalExecutions
    totalVolume
    peakEventsPerSecond
    averageQueryLatency
  }
  topPatterns: Pattern(
    where: { isActive: { _eq: true } }
    order_by: { roi: desc }
    limit: 10
  ) {
    tokenId
    patternType
    winRate
    roi
    totalVolume
    delegationCount
  }
  recentTrades: TradeExecution(
    order_by: { timestamp: desc }
    limit: 20
  ) {
    delegationId
    patternTokenId
    amount
    success
    txHash
    timestamp
  }
}
```

**One request returns everything the dashboard needs.** Try doing that with raw RPC. You can't.

---

## Results: What's Actually Live

Mirror Protocol is fully deployed and functional on Monad testnet as of this writing:

| Metric | Value |
|---|---|
| Patterns minted | **13 active** |
| Delegations created | **9 active** |
| Trades executed | **47** (100% success rate) |
| Events indexed by Envio | **82** |
| Average query latency | **<5ms** |
| Peak throughput observed | **135 events/sec** |
| Total volume indexed | **290.02 MON** |
| Total earnings distributed | **112.76 MON** |

Every number in that table is queryable right now at the [live Envio endpoint](https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql). Every trade is visible on [Monad explorer](https://explorer.testnet.monad.xyz/address/0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8). And every UI element on [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app) is populated from live data.

When the bot executes a trade, the following happens in sequence:

1. **t=0ms**: Bot calls `executeTrade()` on the ExecutionEngine
2. **t≈400ms**: Transaction is included in a Monad block (Monad's fast block time helps here)
3. **t≈500ms**: Envio HyperSync picks up the `TradeExecuted` event
4. **t≈500ms**: Envio handler updates the `TradeExecution`, `Delegation`, `Pattern`, `Delegator`, and `SystemMetrics` entities atomically
5. **t≈5000ms**: Frontend's next poll cycle sees the new data
6. **t=5000ms**: User sees the new trade animate into the live feed with a green "NEW" highlight

From bot decision to user visibility: **about 5 seconds**, most of which is frontend polling interval. The chain-to-indexer path is under half a second. That's what makes the protocol feel alive.

---

## Lessons From the Build

**1. Putting business logic in the indexer changes everything.**
I originally planned to compute aggregate stats in the frontend. That would have meant fetching every pattern and every trade on every page load — slow, expensive, and doesn't scale past a few hundred records. Moving aggregation into Envio event handlers made the frontend trivially fast.

**2. The MetaMask Delegation Toolkit is genuinely useful.**
I was skeptical at first — "smart accounts" has been an oversold concept for years. But the delegation toolkit gave me the exact primitive I needed: per-delegation permissions and spending limits that a keeper contract could act on, without compromising the user's main wallet.

**3. Monad's fast block time matters for automation.**
A lot of automation protocols feel sluggish because each action takes 10-15 seconds to confirm. On Monad, the whole loop (decide → sign → submit → confirm → index) runs in under a second of actual chain-latency. It makes the "mirror" feel live.

**4. Write your indexer schema *before* your contracts.**
I learned this the hard way. Twice I had to update my Envio schema because I'd emitted an event without enough indexed fields. The second time, I designed the Envio entities first and worked backward to the Solidity events. Much smoother.

**5. You can't prototype this without a real indexer.**
Every time I tried to "just use RPC for now and swap in Envio later," I hit the same wall: the latency budget made the bot un-testable. Envio isn't an optimization for Mirror Protocol. It's a requirement.

---

## What's Next

Mirror Protocol is deployed on Monad testnet as a proof-of-concept. For production, the roadmap is:

- **Multi-chain expansion**: Envio's multi-chain config makes this straightforward. Ethereum, Arbitrum, Base — same indexer, different chain IDs.
- **Real DEX integration**: Currently trades route through a `MockDEX` on testnet. Swapping in Uniswap v4 or a Monad-native DEX is a one-file change.
- **Social layer**: Pattern creator reputation, leaderboards, follow relationships — all of which become trivial once Envio is already indexing every event.
- **Better trigger conditions**: Current delegations check win rate / ROI / volume. A more interesting version would let users write composable condition DSL (`"execute if drawdown<10% AND consecutive_wins≥3"`), evaluated at the bot level.
- **Pattern NFT marketplace**: Since patterns are ERC-721s, there's an obvious path to secondary trading. Buy a proven pattern from its creator, earn from everyone who delegates to it.

---

## Try It Yourself

Everything is open source and live:

- **🌐 Live Demo**: [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app)
- **⚡ Envio GraphQL Playground**: [indexer.dev.hyperindex.xyz/4cda827/v1/graphql](https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql)
- **💻 Source Code**: [github.com/kaustubh76/Mimic-Protocol](https://github.com/kaustubh76/Mimic-Protocol)
- **📖 Envio Docs**: [docs.envio.dev](https://docs.envio.dev)
- **🟣 Monad Testnet**: [testnet.monad.xyz](https://testnet.monad.xyz)

If you're building anything that needs real-time on-chain behavioral data — portfolio tools, MEV bots, social trading, automated strategies, analytics dashboards — seriously consider starting with Envio. I spent a lot of time trying to work around the limitations of traditional indexing before I realized I was solving the wrong problem. The right answer was to use infrastructure that didn't have those limitations in the first place.

---

### About

Built by [Kaustubh Agrawal](https://github.com/kaustubh76). Questions, feedback, or hiring opportunities — feel free to reach out on GitHub or try the live demo and tell me what breaks.

*If you found this useful, drop a clap and follow for more deep-dives on DeFi infrastructure, Monad, and Envio.*

---

**🏷️ Tags:** Web3, DeFi, Blockchain, Monad, Envio, GraphQL, Smart Contracts, Indexing, Ethereum, MetaMask
