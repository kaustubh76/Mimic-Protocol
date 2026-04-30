# Money-Market Indexer Template — Aave-V3-Shaped, All Six Lifecycle Events Baked In

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md) · [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Capstone artifact for the money-market vertical. Spec for a forkable indexer template with all six Aave V3 lifecycle events baked in: supply, withdraw, borrow, repay, liquidation, reserve-data-update. Pulls in the liquidation handler reference and the risk-dashboard query architecture as composable pieces.*
>
> **Live reference code:** [`pow/envio-money-market-template-v1/`](./pow/envio-money-market-template-v1/) — runnable scaffold with the LiquidationCall handler in [`src/EventHandlers/Pool.ts`](./pow/envio-money-market-template-v1/src/EventHandlers/Pool.ts), per-reserve aggregator in [`src/Aggregators/ReserveAggregator.ts`](./pow/envio-money-market-template-v1/src/Aggregators/ReserveAggregator.ts), per-user cross-reserve aggregator in [`src/Aggregators/UserAggregator.ts`](./pow/envio-money-market-template-v1/src/Aggregators/UserAggregator.ts), and time-series rate captures in the schema. Configured for Polygon, Arbitrum, Base.

---

## §1 Why This Template Exists

§3 of the playbook names four DeFi shapes: DEX, perp, money market, execution layer. The DEX template covers DEX, the perp template covers perp, this template covers **money market** — the third shape. The execution-layer template is parked for follow-up.

Money-market protocols have three indexer-tier requirements that DEX and perp templates don't:

1. **Per-(asset, user) state, not per-pool or per-position.** A `UserReserve` keyed by `(chainId, asset, user)` is the source of truth — one user has one position per asset (collateral or debt), not per pool. `UserAggregator` rolls up across reserves for the cross-asset leaderboard.
2. **Liquidation as a first-class event affecting two reserves and two users.** `LiquidationCall` carries `collateralAsset` + `debtAsset` + `user` (victim) + `liquidator`. The handler must update **all four**. See [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md).
3. **Continuous interest-rate accrual via index updates.** `ReserveDataUpdated` fires on every state change with new rate + index values. Indexed as a `ReserveRateSnapshot` time series — the analytical primitive for utilization curves and yield-history dashboards.

This template closes:

- **Activation × Tech [DeFi/money-market]** — money market is the third DeFi shape and needs its own template; without one, the playbook's "DEX, perp, money market, execution layer" claim is incomplete.
- **Acquisition × Tech [DeFi/money-market]** — outreach to Aave / Compound / Spark / Morpho (named in the audit memos) lands on a template the customer can fork.
- **Monetization × Tech [DeFi/money-market]** (downstream) — risk-dashboard tier-up positioning, anchored in [`ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md`](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md).

---

## §2 Anatomy

The template ships as a forkable repo with six Aave V3 events on the singleton `Pool` contract — no factory pattern (Aave's Pool is a singleton per chain).

### 2.1 The six events

| Event | Purpose | Indexer effect |
|---|---|---|
| `Supply` | LP deposit | TVL aggregation, per-user supply, lazy `Reserve` creation |
| `Withdraw` | LP withdraw | TVL aggregation, per-user supply position decrement |
| `Borrow` | New debt | Total borrow aggregation, per-user debt growth, `interestRateMode` recorded |
| `Repay` | Debt repaid | Total repay, per-user `netDebtPosition` reduction |
| `LiquidationCall` | Forced liquidation | `Liquidation` entity preserved; both reserves' liquidation count incremented; both users' counters incremented |
| `ReserveDataUpdated` | Interest rate + index update | `ReserveRateSnapshot` written; `ReserveAggregator` "current" rates updated |

Skipped intentionally: admin events (`InitReserve`, `RoleGranted`), flash loans (separate analytical surface), reserve-config updates (governance-only).

### 2.2 Three-layer entity model

**Layer 1 (raw):** `Reserve(id, chainId, asset)`, `UserReserve(id, asset, user, cumulative*)`, `Liquidation(id, ...)`. The Liquidation entity is **append-only**, keyed by `chainId-blockNumber-logIndex` so cascading liquidations within one block don't collide.

**Layer 2 (aggregates):** `ReserveAggregator(id, totalSupplied, totalBorrowed, totalLiquidations, currentLiquidityRate, currentLiquidityIndex, ...)` and `UserAggregator(id, reservesParticipated, totalSuppliedAcrossReserves, liquidationsAsBorrower, liquidationsAsLiquidator, ...)`.

**Layer 3 (snapshots):** `ReserveRateSnapshot(id, liquidityRate, variableBorrowRate, liquidityIndex, variableBorrowIndex, ...)` — append-only, keyed by `(reserveId, blockNumber)`.

### 2.3 Scaled balances, not aToken balances

Aave V3 stores user balances as `scaledBalance × index / RAY` where `RAY = 1e27` and the index updates per block. This template stores **the scaled balance** (constant once supplied) and the **latest index** (from `ReserveAggregator.currentLiquidityIndex`). The actual aToken balance is derived at query time.

This is the Aave subgraph convention. Doing the multiplication inside handlers would require re-running RAY math on every event; storing raw + computing on demand is more correct and more efficient. See `pow/envio-money-market-template-v1/README.md` §Scaled-balance-convention for the full rationale.

### 2.4 No health-factor entity (deliberate)

Aave's HF formula needs oracle prices. Computing live HF inside the handler would require an Effect-API oracle reader for every supported asset (and asset prices change per block in practice). The template captures everything needed to compute HF at query time (scaled balances, latest indices, asset addresses) but doesn't compute HF inline. Front-end clients join Aave's PriceOracle feed and compute HF themselves — same approach Aave's official subgraph takes.

If the customer wants HF inside the indexer, the [`ENVIO_EFFECT_API_PATTERN.md`](./ENVIO_EFFECT_API_PATTERN.md) doc shows how to wire a `getAssetPrice` Effect.

---

## §3 Production Guardrails

The template prevents three failure modes characteristic of money-market indexers:

- **LiquidationCall touching one reserve only.** Naive handlers update only the `collateralAsset` aggregator, missing the `debtAsset` side. The template's handler updates both, and only once if `collateralAsset == debtAsset` (rare, but possible in same-asset liquidations like aUSDC liquidated against vUSDC).
- **Repay arriving before Supply** (out-of-order edge case at indexer cold-start). Defensive: the `Repay` handler logs a warn if no `UserReserve` exists and returns rather than crashing. Production reorg machinery should make this rare.
- **Reserve created from `ReserveDataUpdated` only.** Aave's `ReserveDataUpdated` fires at protocol initialization before any user-facing event. The template handles this case by creating a stub `Reserve` + `ReserveAggregator` from `ReserveDataUpdated` so subsequent Supply/Borrow events have something to update — rather than dropping the rate update on the floor.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **The forkable repo** at [`pow/envio-money-market-template-v1/`](./pow/envio-money-market-template-v1/) — runnable now.
- **A 60-minute Loom** — replicate the DEX 60-min template's walkthrough but for money-market shape.
- **A written guide** at the canonical docs slot ("Tutorials → Build a Money-Market Indexer in 60 Minutes").
- **A "what next" page** branching into three follow-ups: tier-up to Risk-Dashboard tier (ClickHouse Sink), wire health-factor Effect, multi-chain expansion.

---

## §5 Adoption Pathway

The template succeeds when:

1. **Time-to-first-event** for new money-market prospects drops to under 60 minutes.
2. New money-market customer indexer code reviews show `LiquidationCall` handling both affected reserves + both users — not just one side.
3. The template becomes the canonical asset Envio team members link to when an Aave / Compound / Spark / Morpho prospect arrives.

The conversion mechanism: money-market-vertical positioning → template fork → trial → Production tier → Dedicated tier-up as risk-dashboard / liquidator-leaderboard volume scales. See [`ENVIO_REVENUE_MATH_V2.md`](./ENVIO_REVENUE_MATH_V2.md) Lever 6 for the structural ARR math (the specific numbers from the prior PM-template Lever 6 carry across to money market with similar conversion velocity — money-market protocols have analytics-as-product properties analogous to PM leaderboards).

---

## §6 What This Template Doesn't Cover

- **Health-factor computation** — flagged as Effect API follow-up.
- **Flash loan tracking** — separate event surface; different analytics need.
- **Liquidator-bot economics** (gas paid vs collateral seized) — needs viem integration; out of scope.
- **Cross-protocol comparison** (Aave vs Compound vs Spark) — same indexer pattern works for all; one chain-keyed `protocol` field per `Reserve` would close it. Out of v1.

---

> **Cell:** Activation × Tech [DeFi/money-market] (primary); Acquisition × Tech [DeFi/money-market] (CTA role)
> **Revenue mechanism:** Net-new acquisition into Production tier; downstream tier-up to Dedicated as risk-dashboard volume scales — Lever 6 in [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md)
> **Named accounts:** Aave (mainnet/L2s), Compound V3 (mainnet/L2s), Spark, Morpho, money-market-vertical wave-2 (~10 builders)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md), [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md), [ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md), [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md)

— Kaustubh
