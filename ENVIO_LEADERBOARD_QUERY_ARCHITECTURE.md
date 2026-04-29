# Leaderboard-Grade Query Architecture — The Pattern Behind "The Leaderboard Tier"

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Architecture reference for the analytical query patterns prediction markets actually run: leaderboards, top-N queries, time-bucketed rollups, user-cohort segmentation. The Dedicated tier exists for this workload — this doc names the patterns and describes the data layout that makes them production-grade. Anchored to the ClickHouse teardown work; describes shape, not invented code.*

---

## §1 Why This Reference Exists

§4 of the playbook names the structural property of the prediction-markets vertical: **the analytics workload IS the product**. Leaderboards, market analytics, and historical reporting are first-class product features, not internal dashboards. This makes the Dedicated-tier conversation easier than in any other vertical — but only if the customer is shown that the tier exists for exactly this reason.

The §2 cells this reference closes:

- **Monetization × Tech [PM]** — leaderboard query patterns hit Postgres limits at scale; the reference names the patterns and the architecture (ClickHouse Sink + dual-write) that handles them.
- **Monetization × Business [PM]** (downstream) — the reference is the technical asset that anchors the "leaderboard tier" positioning proposed in [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md). When a PM customer reads "Dedicated tier" and asks "what does that actually buy me," this doc is the answer.

The funnel-velocity claim: this is a **tier-up engine**, not an activation asset. A customer reads it after they've shipped a working PM indexer and their leaderboard query latency starts climbing. The reference converts pain into an upgrade conversation.

---

## §2 Anatomy

### 2.1 The four canonical PM query patterns

From [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md), the analytical query shapes prediction markets actually run:

- **Leaderboards** — top-N addresses by *some metric* over *some window*. Examples: top 100 traders by 7-day P&L; top 50 markets by 24h volume; top 20 users by all-time fees paid.
- **Time-bucketed rollups** — `GROUP BY pool / market GROUP BY hour SUM(volume)`. Powers the historical-volume dashboards.
- **Aggregate scans** — sum across all markets, all users, all chains, for a single time window. Powers the protocol-level KPI displays.
- **User-cohort segmentation** — partition the user base into segments (whales, retail, new users) and run aggregates per segment. Powers the marketing-attribution layer.

All four shapes share the structural property that **they read across the entity history table, not the current-state table**. Postgres handles the current-state table fine; the analytical scans of history are where it falls over.

### 2.2 The dual-write architecture

The reference describes the dual-write architecture from [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md): every entity mutation writes to two targets atomically per batch — Postgres (transactional, current-state-as-view) and ClickHouse (analytical, append-only history). The four query patterns above all live on the ClickHouse side; the live application UI hits Postgres for current-state reads. Reorgs are handled by `DELETE FROM table WHERE checkpoint_id > reorg_checkpoint`.

### 2.3 The data layout

Three tables drive the analytics layer:

| Table | Role | Query patterns it serves |
|---|---|---|
| **Entity history** (append-only) | Every change recorded as `SET`/`DELETE` action with a checkpoint ID | Leaderboards, time-bucketed rollups, aggregate scans |
| **Checkpoints** | One row per block: block number, hash, chain ID, event count | Reorg-as-DELETE; time-travel queries |
| **Current-state-as-view** | Reconstructed from latest `SET` rows per entity ID | Live UI reads (Postgres-side) |

The pattern: **history lives in ClickHouse for cheap aggregation; current state is a view (or a Postgres-side projection) for live reads**. Time-travel queries become free because the history is already there.

### 2.4 The four canonical queries, by shape

The reference catalogues the four patterns as ClickHouse-shaped queries. Not full SQL — just the *shape* the reader needs to recognise:

- **Leaderboard query.** `SELECT user_id, SUM(metric) FROM entity_history WHERE timestamp > now() - INTERVAL 7 DAY AND action = 'SET' GROUP BY user_id ORDER BY 2 DESC LIMIT 100`. Refresh frequency: every minute (the prediction-markets norm).
- **Time-bucketed rollup.** `SELECT toStartOfHour(timestamp) AS hour, market_id, SUM(volume) FROM entity_history GROUP BY hour, market_id`. Refresh frequency: incremental on each batch.
- **Aggregate scan.** `SELECT SUM(volume), COUNT(DISTINCT user_id) FROM entity_history WHERE timestamp BETWEEN ? AND ?`. Refresh frequency: cached; recomputed on cohort definition change.
- **User-cohort segmentation.** Two-pass: first compute the cohort membership (e.g., `volume_30d > X`), then run the aggregate per cohort. Materialised views are the production shape.

---

## §3 Production Guardrails

The reference prevents three failure modes documented in the ClickHouse teardown:

- **Postgres alone melts at leaderboard scale.** The four query patterns above hit Postgres for full-history scans every minute and cause query-latency spikes that break the customer's product UX. Dual-write architecture moves the scan workload to ClickHouse where it belongs.
- **Reorg corrupts ClickHouse history.** Without checkpointing, naive append-only writes leave stale post-reorg history. The `DELETE FROM table WHERE checkpoint_id > reorg_checkpoint` pattern keeps history reorg-safe.
- **Materialised views drift from source.** ClickHouse materialised views can drift if the source table is mutated outside the indexer pipeline. The append-only-with-checkpoints pattern ensures the source is monotonic except for reorg-deletions, which materialised views handle natively.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **A docs page** in the prediction-markets section ("Patterns → Leaderboard Query Architecture") — sections mirror §2 above.
- **A 30-minute Loom** that walks the four query shapes against the prediction-markets template ([ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md)) with ClickHouse Sink enabled.
- **A reference repo branch** at the prediction-markets template slug showing the dual-write architecture against a fork of a public prediction-market test contract on Sepolia. The branch demonstrates the *shape*; the customer's protocol fills in the entity types.
- **A tier-up conversation script** that maps each query pattern to the Dedicated-tier feature that solves it. (Internal Envio asset, not customer-facing.)

---

## §5 Adoption Pathway

The reference succeeds when:

1. The docs page becomes the canonical link Envio team members share when a PM customer asks about leaderboard query latency.
2. New PM customers shipping the PM template understand the dual-write architecture exists from day one (even if they don't enable ClickHouse Sink immediately).
3. The reference is the technical anchor for the "leaderboard tier" Dedicated positioning — the customer reads the tier copy, clicks through to this doc, and the upgrade case is made.

The conversion mechanism: leaderboard pain → reference doc → ClickHouse Sink trial → Dedicated upgrade. From [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md) Lever 6: 3 net-new Dedicated customers × $40k incremental ACV = ~$120k year-1 ARR at placeholder values; sensitivity range $22.5k (half case) to $315k (2× case).

---

## §6 Named Account Plays

| Account | Driver | Leaderboard-architecture conversation |
|---|---|---|
| **Polymarket** | 4B events; market analytics, volume reports, top-trader leaderboards already in production | Co-authored architectural review; published case-study refresh names the leaderboard tier explicitly |
| **Limitless** | Daily prediction market on Base; leaderboards, market analytics, oracle price history | Quarterly architectural check-in; Dedicated-tier conversation queued for the moment leaderboard latency is visible |
| **Sablier** | (Cross-vertical) — third indexer in their monorepo is literally named "analytics"; monthly-active-user aggregation, custom-fee tracking | Cross-vertical play: same architecture, DeFi-shaped customer |
| **LI.FI** | (Cross-vertical) — cross-chain bridge volume reporting, high-cardinality, high-aggregation | Cross-vertical play: same architecture, DeFi-shaped customer |

---

## §7 What This Reference Doesn't Cover

- **Settlement event handling.** Settlement is upstream — see [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md).
- **Multi-chain expansion.** Cross-chain dashboards compose with this layer; the chain-side mechanics live in [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md).
- **Effect-API + entity-cache-first preload.** Upstream of the analytics layer; see [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md).

---

> **Cell:** Monetization × Tech [PM] (primary); Monetization × Business [PM] (the reference anchors "the leaderboard tier" positioning)
> **Revenue mechanism:** Tier-up to Dedicated ("the leaderboard tier"). Lever 6 in [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md): ~$120k year-1 ARR at placeholder values, $22.5k–$315k sensitivity band.
> **Named accounts:** Polymarket (4B events), Limitless (Base, daily-market leaderboards), Sablier (cross-vertical analytics tier), LI.FI (cross-vertical cross-chain analytics)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md)

— Kaustubh
