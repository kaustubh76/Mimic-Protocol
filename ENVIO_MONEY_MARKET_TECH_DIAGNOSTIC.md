# Money-Market Tech Diagnostic — Pattern-Level Friction In Production Aave-Shape Indexers

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md) · [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md)

> *Week-One commitment from §8 of the playbook (extended to the money-market vertical): a one-page audit of pattern-level friction in production money-market indexers. Anchored to Aave V3 — the canonical money-market protocol on EVM — and the patterns visible in the Aave subgraph and forks.*

---

## §1 Frame

Money market is the third DeFi shape named in §3 of the playbook. The vertical's defining technical property is that **liquidation handling is the highest-leverage correctness problem** — every money-market indexer eventually has a customer-facing bug rooted in mishandled `LiquidationCall` events. Aave V3 is the canonical reference; Compound V3, Spark, and Morpho all share the same event-shape primitives.

This audit names the pattern-level friction shapes a Growth Engineer would observe across the customer base, attributes each to a §2 pain-map cell, and proposes the dual-fix sketch.

---

## §2 What's There Now

The vertical's reference protocols (no Envio-specific customer wall here yet, since the vertical is being newly seeded):

- **Aave V3** — singleton `Pool` contract per chain (mainnet, Polygon, Arbitrum, Base, Optimism, Avalanche, Scroll, ...). Six lifecycle events covered in [`pow/envio-money-market-template-v1/`](./pow/envio-money-market-template-v1/). The Aave subgraph (TheGraph) is the public reference indexer; [`pow/envio-money-market-template-v1/`](./pow/envio-money-market-template-v1/) demonstrates the Envio-shaped equivalent.
- **Compound V3 (Comet)** — per-base-asset architecture (one contract per supported borrowed asset). Different shape; same primitives (Supply, Withdraw, Borrow, Repay, etc).
- **Spark** — Aave V3 fork; same event surface.
- **Morpho** — built on top of Aave + Compound; would consume both protocols' events.

The friction this audit names is friction **in the work needed to build production indexers for these protocols** — not friction in existing customer indexers (the customer base is to-be-acquired).

---

## §3 What's Missing / Friction (Mapped to §2 Cells)

- **Activation × Tech root cause.** Aave's event surface is documented but not as an indexer-specific tutorial. New money-market customers spend weeks getting `LiquidationCall` handling correct — the §2 trickiest event in the vertical. The template ships the dual-reserve + dual-user pattern as the default, eliminating the most common indexer-tier bug.
- **Retention × Tech root cause.** At scale, Postgres-backed `ReserveRateSnapshot` queries hit O(N²) performance for utilization curves over 12-month windows. The friction shape Aave's subgraph customers report. ClickHouse Sink is the upgrade path.
- **Monetization × Tech root cause.** The Dedicated-tier conversation should be triggered by utilization-query latency or liquidator-leaderboard refresh times. Today the signal lives in customer pain; surface it in an internal account-health view.
- **Expansion × Tech root cause.** Aave's deterministic deployment means `Pool` addresses are stable across L2s — adding chain #N is genuinely a one-line config change with the template's `add-chain` CLI.

---

## §4 Proposed Shifts (Dual-Fix Per Cell)

| §2 Cell | Tech move | Business move |
|---|---|---|
| Activation × Tech | Money-market template ([`ENVIO_MONEY_MARKET_TEMPLATE.md`](./ENVIO_MONEY_MARKET_TEMPLATE.md)) ships LiquidationCall handler correct from day one | A 60-min walkthrough Loom + written guide as the activation entry point |
| Retention × Tech | Document the rate-snapshot + ClickHouse-Sink path as the production default — see [`ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md`](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md) | Quarterly technical health check produces a one-page health note per anchor account |
| Monetization × Tech | Internal account-health dashboard surfacing utilization-query latency, liquidator-leaderboard refresh time, snapshot-table size | Dedicated-tier upgrade conversation triggered by health-note thresholds |
| Expansion × Tech | `add-chain` CLI in the template — one config change adds chain #N | Co-engineering offer: Envio sends the runbook as a co-authored play to anchor accounts before their next chain expansion |

All four shifts have an owning artifact in this set.

---

## §5 Per-Account Pattern-Friction Notes (Acquisition Targets)

- **Aave (mainnet, Polygon, Arbitrum, Base, Optimism, Avalanche)** — 6+ chain footprint, per-asset ConditionalToken-style risk modelling, governance-driven reserve config. The play is a co-authored case study of the Envio indexer + dual-write ClickHouse architecture for risk dashboards. Compares directly against The Graph's Aave subgraph (which Aave already runs).
- **Compound V3** — Per-base-asset architecture means more `Pool`-equivalent contracts but simpler aggregation. The play is a Compound-specific template variant cloned from this one with a different `Pool` shape; demonstrates the framework's flexibility.
- **Spark** — Aave V3 fork. The template runs on Spark with one config change (Pool address). The play is "look how easy this was" — multi-protocol indexing as a Spark-internal asset.
- **Morpho** — Multi-protocol; consumes Aave + Compound events. Demonstrates the framework's multi-source aggregation. Co-engineering opportunity.

---

## §6 What This Audit Doesn't Address

This is a tech diagnostic, not a positioning audit. The business-side questions — how money-market customers see (or don't see) themselves in Envio's marketing, where the tier-up conversations should land, how the named-account list is sequenced — live in the paired audit: [`ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md`](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md). The §8 commitment is **two parallel diagnostics** for a reason.

---

> **Cell:** Activation × Tech [DeFi/money-market]; Retention × Tech [DeFi/money-market]; Monetization × Tech [DeFi/money-market]; Expansion × Tech [DeFi/money-market]
> **Revenue mechanism:** Net-new acquisition (Activation), tier-up to Dedicated (Monetization), expansion ARR (Retention + Expansion)
> **Named accounts:** Aave (multi-chain), Compound V3, Spark, Morpho — wave-2 outreach (~10 protocols)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md), [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md), [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md)

— Kaustubh
