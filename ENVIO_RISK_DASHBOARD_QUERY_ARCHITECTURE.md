# Risk-Dashboard-Grade Query Architecture — The Pattern Behind "The Risk-Dashboard Tier"

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Architecture reference for the analytical query patterns money-market protocols actually run: liquidator leaderboards, time-bucketed utilization curves, per-reserve TVL aggregation, user-cohort risk segmentation. The Dedicated tier exists for this workload — this doc names the patterns and describes the data layout that makes them production-grade.*
>
> **Live reference code:** [`pow/envio-money-market-template-v1/src/Aggregators/UserAggregator.ts`](./pow/envio-money-market-template-v1/src/Aggregators/UserAggregator.ts) is the leaderboard source (per-user liquidationsAsBorrower / liquidationsAsLiquidator / totalSupplied). [`pow/envio-money-market-template-v1/schema.graphql`](./pow/envio-money-market-template-v1/schema.graphql) defines `ReserveRateSnapshot` for time-bucketed historical queries — Postgres-backed at small scale, ClickHouse-Sink-ready at the Dedicated "risk-dashboard tier".

---

## §1 Why This Reference Exists

§4 of the playbook (in its money-market worked example) names the structural property of the vertical: **the analytics workload IS the product** for risk-monitoring tooling. Liquidation alerts, utilization-curve dashboards, liquidator-leaderboard products, and risk-cohort segmentation are first-class products at money-market protocols — not internal dashboards.

The §2 cells this reference closes:

- **Monetization × Tech [DeFi/money-market]** — risk-dashboard query patterns hit Postgres limits at scale; the reference names the patterns and the architecture (ClickHouse Sink + dual-write) that handles them.
- **Monetization × Business [DeFi/money-market]** (downstream) — anchors the "risk-dashboard tier" positioning. When a money-market customer reads "Dedicated tier" and asks "what does that buy me," this doc is the answer.

The funnel-velocity claim: this is a **tier-up engine**, not an activation asset. A customer reads it after they've shipped a working money-market indexer and their utilization-curve query latency starts climbing.

---

## §2 Anatomy

### 2.1 The four canonical money-market query patterns

From [`ENVIO_CLICKHOUSE_TEARDOWN.md`](./ENVIO_CLICKHOUSE_TEARDOWN.md), the analytical query shapes money-market protocols actually run:

- **Liquidator leaderboards** — top-N addresses by liquidation count or seized-collateral-USD over a time window. The `UserAggregator.liquidationsAsLiquidator` field is the primary source; cross-joined to `Liquidation.liquidatedCollateralAmount` for USD volume.
- **Time-bucketed utilization curves** — `GROUP BY reserve GROUP BY hour AVG(utilizationRate)`. Powers the historical-utilization dashboards every Aave-shape protocol ships. `ReserveRateSnapshot` is the source.
- **Per-reserve TVL aggregation** — sum across all suppliers, filtered by reserve, computed at the latest block. `ReserveAggregator.totalSupplied - totalWithdrawn` is the trivial query; the harder version joins `currentLiquidityIndex` to compute interest-accrued TVL.
- **User-cohort risk segmentation** — partition users into risk buckets (`netSupplyPosition` × `liquidationsAsBorrower` × external HF data), run aggregates per cohort. Powers the risk-monitoring tooling.

All four shapes share the structural property that **they read across the entity history table, not just current state**. Postgres handles the current-state table fine; the historical / time-bucketed scans are where it falls over.

### 2.2 The dual-write architecture

Same pattern as the DEX template's snapshot architecture and the (departed) PM template's leaderboard architecture. From [`ENVIO_CLICKHOUSE_TEARDOWN.md`](./ENVIO_CLICKHOUSE_TEARDOWN.md): every entity mutation writes to two targets atomically per batch — Postgres (transactional, current-state-as-view) and ClickHouse (analytical, append-only history). The four query patterns above all live on the ClickHouse side; the live application UI hits Postgres for current-state reads. Reorgs are handled by `DELETE FROM table WHERE checkpoint_id > reorg_checkpoint`.

### 2.3 The data layout

Three tables drive the analytics layer:

| Table | Role | Query patterns it serves |
|---|---|---|
| **Entity history** (append-only) | Every change recorded as `SET`/`DELETE` action with a checkpoint ID | Leaderboards, time-bucketed rollups, aggregate scans, risk segmentation |
| **Checkpoints** | One row per block: block number, hash, chain ID, event count | Reorg-as-DELETE; time-travel queries |
| **Current-state-as-view** | Reconstructed from latest `SET` rows per entity ID | Live UI reads (Postgres-side) |

The pattern: **history lives in ClickHouse for cheap aggregation; current state is a view (or a Postgres-side projection) for live reads**.

### 2.4 Money-market-specific extensions

Three things money-market query architecture needs that DEX / perp don't:

- **Index-adjusted balance reconstruction at query time.** `actualBalance = scaledBalance × liquidityIndex / RAY`. The query joins `UserReserve.cumulativeSupplied` (raw scaled) against `ReserveRateSnapshot.liquidityIndex` at the appropriate timestamp.
- **Joined `LiquidationCall` lookup for risk segmentation.** Cohort segmentation often needs "users who have been liquidated in the last 30 days" — a `WHERE` clause on the history-table join.
- **Cross-asset health-factor approximation.** Without live oracle prices, indexers can compute "would-be-liquidatable-at-stale-prices" with a stored asset-price-snapshot table. This is a future extension; not in v1.

---

## §3 Production Guardrails

The reference prevents three failure modes:

- **Postgres melts at utilization-curve scale.** A 12-month history of `ReserveDataUpdated` events at one update per block × 200 reserves × 4 chains is hundreds of millions of rows. `GROUP BY hour AVG(rate)` over that scan kills Postgres at SLA-grade response times. Dual-write to ClickHouse moves the scan workload to native sorted-aggregation queries.
- **Reorg corrupts ClickHouse history.** Without checkpointing, naive append-only writes leave stale post-reorg history. The `DELETE FROM table WHERE checkpoint_id > reorg_checkpoint` pattern keeps history reorg-safe.
- **Liquidator-leaderboard staleness.** Naive `UserAggregator` queries miss liquidators who've been most active in the last hour but inactive earlier. Time-windowed top-N requires the history-table scan, not just current-state.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **A docs page** at "Patterns → Risk-Dashboard Query Architecture" — sections mirror §2 above.
- **A 30-minute Loom** that walks the four query shapes against the money-market template with ClickHouse Sink enabled.
- **A reference repo branch** at the money-market template slug showing the dual-write architecture against an Aave V3 deployment on Polygon. Live data; not synthetic.
- **A tier-up conversation script** mapping each query pattern to the Dedicated-tier feature that solves it. (Internal Envio asset, not customer-facing.)

---

## §5 Adoption Pathway

The reference succeeds when:

1. The docs page becomes the canonical link Envio team members share when a money-market customer asks about utilization-curve query latency.
2. New money-market customers shipping the template understand the dual-write architecture exists from day one (even if they don't enable ClickHouse Sink immediately).
3. The reference is the technical anchor for the "risk-dashboard tier" Dedicated positioning — the customer reads the tier copy, clicks through to this doc, and the upgrade case is made.

The conversion mechanism: utilization-curve pain → reference doc → ClickHouse Sink trial → Dedicated upgrade. From [`ENVIO_REVENUE_MATH_V2.md`](./ENVIO_REVENUE_MATH_V2.md) Lever 6: 3 net-new Dedicated customers × $40k incremental ACV = ~$120k year-1 ARR at placeholder values; sensitivity range $22.5k (half case) to $315k (2× case).

---

## §6 Named Account Plays

| Account | Driver | Risk-dashboard conversation |
|---|---|---|
| **Aave (mainnet/L2s)** | Largest TVL on Aave V3 across mainnet + Polygon + Arbitrum + Base; risk dashboards are first-class community + governance products | Co-authored architectural review; published case-study refresh names the risk-dashboard tier explicitly |
| **Compound V3 (Comet)** | Per-base-asset architecture; utilization curves are governance-input | Quarterly architectural check-in; Dedicated tier queued for the moment utilization-query latency becomes visible |
| **Spark** | Aave fork; same event surface; smaller TVL means smaller volume, but risk dashboards are still product features | Cross-vertical play: same architecture, smaller scale |
| **Morpho** | Built on top of Aave + Compound; aggregates events from BOTH protocols' Pool contracts | Multi-protocol indexing demonstration on top of the template |

---

## §7 What This Reference Doesn't Cover

- **Liquidation event handling itself** — see [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md).
- **Multi-chain expansion** — cross-chain dashboards compose with this layer; the chain-side mechanics live in [`ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md`](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md).
- **Effect API for oracle prices** — upstream of the analytics layer; see [`ENVIO_EFFECT_API_PATTERN.md`](./ENVIO_EFFECT_API_PATTERN.md).

---

> **Cell:** Monetization × Tech [DeFi/money-market] (primary); Monetization × Business [DeFi/money-market] (anchors "risk-dashboard tier")
> **Revenue mechanism:** Tier-up to Dedicated ("the risk-dashboard tier"). Lever 6 in [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md): ~$120k year-1 ARR at placeholder values, $22.5k–$315k sensitivity band.
> **Named accounts:** Aave (TVL leader), Compound V3, Spark (Aave fork), Morpho (multi-protocol consumer)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md)

— Kaustubh
