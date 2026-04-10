# Mirror Protocol — Architecture

## Overview

Mirror Protocol is a behavioral liquidity infrastructure built on four principles:

1. **Patterns are NFTs.** Successful trading strategies are minted as ERC-721s with on-chain metadata.
2. **Capital is delegated.** Users delegate a percentage of their smart-account capital to a Pattern NFT via MetaMask Delegation Toolkit.
3. **Execution is automatic.** An authorized keeper bot watches for matching conditions and executes trades on behalf of delegators.
4. **Envio is the source of truth.** All off-chain decisions are made from Envio-indexed data, not direct RPC calls.

---

## System Components

### 1. Smart Contracts (Monad Testnet — Chain ID 10143)

| Contract | Purpose |
|---|---|
| **BehavioralNFT** | ERC-721 minting Pattern NFTs with win rate, ROI, volume, and performance history |
| **PatternDetector** | On-chain pattern detection helpers (type classification, performance updates) |
| **DelegationRouter** | Wraps MetaMask Delegation Toolkit; stores per-delegation trigger conditions |
| **ExecutionEngine** | Authorized keeper interface; enforces cooldowns; tracks execution stats |
| **MockDEX** / **TestToken** | Test-mode trade target and ERC-20 for demo flows |

### 2. Envio HyperSync Indexer

Envio watches every event emitted by the four core contracts and writes to a normalized, queryable Postgres database behind a GraphQL API.

**Entities indexed:**

- `Pattern` — one per Pattern NFT, with denormalized aggregate stats (`delegationCount`, `successfulExecutions`, `failedExecutions`)
- `Delegation` — one per active delegation, with a foreign key to its `Pattern`
- `TradeExecution` — one per on-chain `TradeExecuted` event, with success flag and tx hash
- `PerformanceUpdate` — time-series of pattern metric changes
- `Delegator` — per-user aggregates (total delegations, earnings, reputation)
- `Creator` — per-pattern-creator stats
- `SystemMetrics` — single-row aggregate of the entire protocol state
- `Event` — raw event log for debugging / analytics

Event handlers live in [`src/envio/src/EventHandlers.ts`](../src/envio/src/EventHandlers.ts). Schema is in [`schema.graphql`](../schema.graphql).

### 3. Executor Bot (Node.js)

Location: [`executor-bot/bot.mjs`](../executor-bot/bot.mjs)

**Run loop** (every 5 seconds):

1. Query Envio for all active delegations with joined Pattern data (single GraphQL request)
2. For each delegation, read its trigger conditions from `DelegationRouter` (cached after first read)
3. If `pattern.winRate >= minWinRate && pattern.roi >= minROI && pattern.volume >= minVolume`, call `executionEngine.executeTrade()`
4. Emit logs; Envio picks up the resulting `TradeExecuted` event within ~500ms

**Why this is only possible with Envio:**
The bot needs joined `Delegation.pattern` data in real-time. An RPC-only equivalent would require separate reads for every delegation and every pattern, multiplying call count and latency. Envio collapses this into one request.

### 4. Frontend (React + Vite)

Location: [`src/frontend/`](../src/frontend/)

- **Wagmi v2 + Viem** for wallet connection and contract writes
- **React Query** for GraphQL data fetching and cache management
- **Custom hooks** under `src/hooks/` — one per entity (`usePatterns`, `useDelegations`, `useEnvioMetrics`, `useLiveExecutions`, `useAnalyticsData`, etc.)
- **recharts** for Pattern ROI bar chart and Execution Volume timeline
- **Framer Motion** for all animations
- **Tailwind CSS** with custom glassmorphism design system in `src/globals.css`

The frontend never calls an RPC for reads — all read data comes from Envio. The only RPC calls are for wallet-initiated writes (delegate, revoke, update).

---

## Data Flow

```
┌──────────────┐
│  User wallet │
└──────┬───────┘
       │ createDelegation(patternId, percentage, conditions)
       ▼
┌───────────────────────────────────┐
│    DelegationRouter (Monad)       │
│    + ExecutionEngine (Monad)      │
└──────┬────────────────────────────┘
       │ DelegationCreated event
       │ TradeExecuted event
       ▼
┌───────────────────────────────────┐
│   Envio HyperSync Indexer         │  ← Real-time, <50ms
│   Updates Pattern, Delegation,    │
│   TradeExecution, SystemMetrics   │
└──────┬────────────────────────────┘
       │ GraphQL query
       │
       ├────────────────┬────────────────┐
       ▼                ▼                ▼
┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│  Frontend   │ │ Executor Bot │ │  Analytics  │
│  Dashboard  │ │  (decision   │ │  Tools      │
│             │ │   loop)      │ │             │
└─────────────┘ └──────┬───────┘ └─────────────┘
                       │ executeTrade()
                       ▼
                 (back to chain)
```

---

## Design Decisions

### Why ERC-721 for patterns (not ERC-1155 or SBT)?

Patterns are *tradeable* by design. A successful creator should be able to sell their pattern NFT on a secondary market, giving them an ongoing incentive to produce good strategies. ERC-721 makes this the default behavior. Soulbound would prevent this use case entirely.

### Why MetaMask Delegation Toolkit (not a custom permission system)?

The Delegation Toolkit gives us per-permission spending limits enforced at the smart-account level, with standardized revocation and audit trails. Writing that from scratch would be weeks of security-critical work and add no differentiation.

### Why aggregate stats inside Envio handlers (not in the frontend)?

Aggregating in the frontend means fetching every pattern and every trade on every page load. At scale this is unbounded. Computing aggregates inside event handlers means the expensive work is done once, at indexing time, and queries remain O(1) regardless of data volume.

### Why a dedicated keeper bot (not on-chain autonomy)?

Pure on-chain autonomy would require every delegation check to run as an EVM transaction, which is expensive and bounded by gas. Off-chain keepers can evaluate thousands of delegations per cycle with zero gas cost, then submit only the transactions that need to fire.

### Why Monad specifically?

- **Fast block time** (<1s) makes the execution loop feel instant
- **EVM compatibility** means we use standard Solidity tooling (Foundry, OpenZeppelin)
- **Envio native support** for Monad via HyperSync — no custom indexer setup needed
- **Low gas** makes frequent executions economically viable

---

## Performance Characteristics

| Metric | Target | Measured |
|---|---|---|
| Pattern detection latency | <50ms | **<5ms** average Envio query |
| Bot cycle time | 5s | 5s (configurable) |
| Chain → Envio indexing delay | <1s | **~500ms** |
| Chain → UI visibility | <10s | **~5s** (polling interval bound) |
| Trade execution latency | <1s | **~400ms** (Monad block time) |
| Frontend page load | <2s | **<1.5s** (Vite + gzip) |

---

## Security Model

- **Executor whitelist**: Only addresses in `ExecutionEngine.isExecutor` can call `executeTrade`. Currently the deployer wallet; in production this would be a multi-sig or governance address.
- **Delegation revocation**: Users can revoke at any time. Revoked delegations are immediately skipped by the bot.
- **Per-delegation conditions**: Bot refuses to execute if current metrics don't satisfy the user's trigger thresholds. Conditions are stored on-chain and cannot be changed by anyone except the delegator.
- **Cooldown enforcement**: `ExecutionEngine` reverts if a delegation was executed within the cooldown window, preventing spam.
- **Smart-account delegation**: Capital stays in the user's smart account. The executor can only move it within the bounds of the MetaMask delegation grant, which includes a spending cap and permission scope.

---

## Scaling Considerations

**Horizontal scaling:**
- Envio hosted service scales automatically with throughput — no action needed
- Frontend is a static SPA, scales via Vercel's CDN
- Executor bot is stateless and can run in multiple regions with simple de-duplication (the `executedThisRun` set)

**Multi-chain expansion:**
- Envio supports multi-chain config natively; adding a chain is a schema update
- Frontend config is a single constant (`MONAD_CHAIN_ID`); add more chain IDs and switch-chain UI
- Bot needs per-chain wallet clients (trivial with viem's chain object pattern)

**Event volume:**
- Envio HyperSync is designed for millions of events per chain. Current usage is ~100 events total, i.e. ~0.0001% of capacity.
- Postgres backing store handles millions of rows per entity with indexed queries under 10ms

---

## Tech Stack Summary

| Layer | Stack |
|---|---|
| Chain | Monad Testnet (Chain ID 10143) |
| Contracts | Solidity 0.8.20+, Foundry, OpenZeppelin |
| Indexer | Envio HyperSync (hosted) |
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS, Framer Motion, recharts |
| Web3 | Wagmi v2, Viem, MetaMask Delegation Toolkit |
| Bot | Node.js (ES modules), Viem |
| Hosting | Vercel (frontend), Envio Hosted Service (indexer) |
