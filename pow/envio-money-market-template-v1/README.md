# envio-money-market-template-v1

> Money-market indexer template. Forkable scaffold with **Aave-V3-shaped event signatures**, full position lifecycle (supply / withdraw / borrow / repay / liquidation), and rate-snapshot time series — the analytical signal that distinguishes money-market indexers from spot-DEX or perp indexers.

This is the third template in the candidate package alongside [`envio-defi-template-v1`](../envio-defi-template-v1/) (DEX) and [`envio-perp-template-v1`](../envio-perp-template-v1/) (perp). Same three-layer architecture (EventHandlers → Aggregators → Snapshots), same chain-keyed Constants pattern, same `add-chain` CLI. Money-market-specific entities: `Reserve`, `UserReserve`, `Liquidation`, `ReserveAggregator`, `UserAggregator`, `ReserveRateSnapshot`.

Event signatures are taken **directly** from [`aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/interfaces/IPool.sol) — no adaptation needed; the Aave V3 Pool is a real, deployed, well-known contract.

---

## Why this template exists

§3 of the [vertical playbook](../../ENVIO_VERTICAL_PLAYBOOK.md) names four DeFi shapes the role's templates should cover: **DEX, perp, money market, execution layer**. The DEX shape is in [`envio-defi-template-v1/`](../envio-defi-template-v1/), the perp shape is in [`envio-perp-template-v1/`](../envio-perp-template-v1/), and this template covers the third — money market.

Money-market protocols have three indexer-tier requirements that DEX and perp templates don't:

1. **Per-(asset, user) state, not per-pool or per-trader-position.** A `UserReserve` keyed by `(chainId, asset, user)` is the source of truth — one user has one position per asset, not per pool. `UserAggregator` rolls up across reserves for the cross-asset leaderboard.
2. **Liquidation as a first-class event affecting two reserves and two users.** `LiquidationCall` carries `collateralAsset` + `debtAsset` + `user` (victim) + `liquidator`. The handler must update **all four** — see [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](../../ENVIO_LIQUIDATION_HANDLER_REFERENCE.md).
3. **Continuous interest-rate accrual via index updates.** `ReserveDataUpdated` fires every block (or close to it) with new rate + index values. Indexed as a `ReserveRateSnapshot` time series — the analytical primitive for utilization curves and yield-history dashboards.

---

## What this template gives you

- **Aave-V3-shaped events**: `Supply`, `Withdraw`, `Borrow`, `Repay`, `LiquidationCall`, `ReserveDataUpdated`. Field names match Aave V3 exactly.
- **Lifecycle handlers** that track cumulative supply/withdraw/borrow/repay per `UserReserve`.
- **Per-reserve aggregator** with totals across all users + latest rate state.
- **Per-user cross-reserve aggregator** — leaderboard source.
- **Liquidation entities** preserved per-event (keyed by `chainId-block-logIndex`), with both reserves' totals updated and both users' counters incremented.
- **Rate snapshots** — append-only time series powering utilization curves and historical APY queries.
- **Multi-chain CLI** — `pnpm add-chain` adds chain #N as a config-only change.
- **`pnpm install && pnpm codegen && pnpm test` clean** (5/5 vitest covering Supply, Borrow, Liquidation, Repay, ReserveDataUpdated).

---

## Why no health-factor entity

Aave's health factor (`HF = collateralUSD × liquidationThreshold / debtUSD`) requires **oracle prices**, which would need an Effect-API oracle reader for every supported asset. Computing live HF inside the indexer adds an RPC dependency and tightly couples the template to a specific price feed.

This template captures **everything needed to compute HF at query time**: scaled balances, latest indices, asset addresses. Front-end clients join Aave's Oracle (or Chainlink, or Pyth) and compute HF themselves — same approach Aave's own subgraph takes.

If you want HF inside the indexer, follow the [`ENVIO_EFFECT_API_PATTERN.md`](../../ENVIO_EFFECT_API_PATTERN.md) doc and add a `getAssetPrice` Effect to `src/Effects/`. Skipping it from v1 keeps the template self-contained.

---

## Why scaled balances and not aToken/debtToken balances

Aave V3 stores user balances as `scaledBalance × index / RAY` where:
- `scaledBalance` is **constant** once supplied (set on Supply, decreased on Withdraw)
- `index` updates **per block** to reflect interest accrual
- `RAY = 1e27` is the precision unit

This template stores both:
- The scaled balance (in `UserReserve.cumulativeSupplied` / `cumulativeBorrowed`)
- The latest index (in `ReserveAggregator.currentLiquidityIndex` / `currentVariableBorrowIndex`)

So the actual aToken balance for a user is computable at query time:
```graphql
query {
  UserReserve(where: { ... }) {
    cumulativeSupplied  # the scaled balance
  }
  ReserveAggregator(where: { ... }) {
    currentLiquidityIndex
  }
}
# Front-end: actualBalance = (scaledBalance × currentLiquidityIndex) / 1e27
```

Doing this inside the handler would require RAY math in BigInt — runs fine, but every Supply / Withdraw event would repeat the multiplication and the cached value would be stale by the next block. Storing raw + computing on-demand is the Aave subgraph convention; this template follows it.

---

## 60-minute walkthrough

| Minute | File | What you learn |
|---|---|---|
| 0–10 | `config.yaml` | Multi-chain config (Polygon, Arbitrum, Base); singleton Pool addresses; no factory pattern |
| 10–20 | `schema.graphql` | Three-layer entity model; `UserReserve` keyed by `(chain, asset, user)` |
| 20–35 | `src/EventHandlers/Pool.ts` | Six event handlers; the LiquidationCall handler updating both reserves + both users |
| 35–45 | `src/Aggregators/ReserveAggregator.ts` | Lazy reserve creation on first event; per-reserve totals + current rate state |
| 45–55 | `src/Aggregators/UserAggregator.ts` | Cross-reserve user totals; liquidationsAsBorrower + liquidationsAsLiquidator counters |
| 55–60 | Run | `pnpm install && pnpm codegen && pnpm test` → all green |

---

## Run it

```bash
pnpm install
cp .env.example .env
# Replace ENVIO_POLYGON_RPC_URL etc with your providers
pnpm codegen
pnpm test
pnpm dev   # runs the indexer against Polygon + Arbitrum + Base
```

GraphQL playground at `http://localhost:8080`:

```graphql
query Top10ReservesByTVL {
  ReserveAggregator(
    order_by: { totalSupplied: desc }
    limit: 10
  ) {
    asset
    totalSupplied
    totalBorrowed
    totalLiquidations
    currentLiquidityRate
    currentVariableBorrowRate
  }
}

query MostLiquidatedUsers {
  UserAggregator(
    order_by: { liquidationsAsBorrower: desc }
    limit: 20
  ) {
    user
    liquidationsAsBorrower
    totalSuppliedAcrossReserves
    totalBorrowedAcrossReserves
  }
}

query RateHistoryForUSDC($reserveId: String!) {
  ReserveRateSnapshot(
    where: { reserve_id: { _eq: $reserveId } }
    order_by: { blockNumber: desc }
    limit: 100
  ) {
    blockNumber
    timestamp
    liquidityRate
    variableBorrowRate
    liquidityIndex
  }
}
```

---

## What's next

- **Tier up to "the risk-dashboard tier"** — see [`ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md`](../../ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md). Liquidator leaderboards, time-bucketed utilization curves, and per-reserve health-factor distributions are the analytical workloads that hit Postgres limits at Aave-scale event volume; ClickHouse Sink Dedicated tier is the documented upgrade path.
- **Health-factor computation** — wire an oracle Effect (`src/Effects/getAssetPrice.ts`) reading Aave's PriceOracle, compute HF inline. Follow [`ENVIO_EFFECT_API_PATTERN.md`](../../ENVIO_EFFECT_API_PATTERN.md).
- **Multi-chain expansion** — same `add-chain` CLI as the DEX and perp templates. Adding chain #N is a config change.
- **Flash loan tracking** — out of scope for v1; Aave's `FlashLoan` event is on a different surface and serves different analytics needs.

---

## Provenance

Event signatures are taken from [`aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/interfaces/IPool.sol). Field names, semantics, and indexing conventions match Aave V3 1:1; this is the canonical money-market protocol on EVM. The Pool contract is a singleton per chain; deterministic deployment addresses on most L2s.

---

## License

MIT.
