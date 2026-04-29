# Prediction Markets Tech Diagnostic — Event Shapes And Query Patterns The Vertical Actually Needs

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Week-One commitment from §8 of the playbook: a one-page audit of the specific event shapes and query patterns prediction markets need (settlement, oracle resolution, leaderboard rollups). Paired with [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md) to complete the §8 four-artifact frame for PM.*

---

## §1 Frame

Prediction markets is structurally one of the highest-value verticals on Envio's customer wall. Polymarket alone represents 4 billion indexed events on Polygon — the largest single indexed event volume Envio publicly cites. Limitless represents the next generation of the same shape — daily prediction markets with leaderboards-as-product, on Base. The vertical's defining technical property is that **the analytics workload IS the product** — leaderboards, market analytics, historical reporting are first-class product features, not internal dashboards. This audit names the technical event shapes and query patterns the vertical depends on, attributes each to a §2 pain-map cell, and proposes the dual-fix sketch.

---

## §2 What's There Now

The vertical's two named accounts run production-grade indexers; the technical patterns they rely on are visible but un-productised:

- **Polymarket** — 4B events on Polygon. Market analytics, volume reports, top-trader leaderboards are all in production. Surfaced in [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) as a Dedicated-tier candidate with the analytics workload as the driver. The case study exists; the next step is converting it into a tier-positioning asset that anchors the entire vertical's marketing.
- **Limitless** — daily-market product on Base. Leaderboards, market analytics, oracle price history are all first-class surfaces. Quarterly architectural check-in is the named monetization play in §4 of the playbook.
- **Generic templates / docs.** The Greeter tutorial and the existing template library are DeFi-default — they model `Transfer`, `Swap`, `Mint` events. None of the prediction-market event shapes (settlement, oracle resolution, payout, market creation) appear as first-class examples.

The patterns are real and at scale. The friction is that nothing in the public-facing surface tells the next prediction-markets prospect "Envio knows how to model your product."

---

## §3 What's Missing / Friction (Mapped to §2 Cells)

- **Activation × Tech [PM] — event shape gap.** Prediction markets have specific event shapes that don't show up in default templates: market creation, position taking, settlement, oracle resolution, payout, leaderboard rollups. A prediction-market builder hits Greeter, sees a `Transfer` event, and has to figure out market resolution from scratch. ([ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) §4.)
- **Activation × Tech [PM] — settlement complexity.** Settlement is the trickiest event in the vertical: multi-step (escrow lock → oracle reads → payout calculation → distribution), with potential corrections (oracle disputes, late resolution). Mishandled settlement = wrong leaderboard = product bug visible to end users. The pattern needs a documented reference handler.
- **Monetization × Tech [PM] — leaderboard query patterns.** The analytical query patterns prediction markets actually run (top-N by 7-day fees, time-bucketed rollups, user-cohort segmentation, leaderboard refresh every minute) are documented in [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) as Dedicated-tier-candidate workloads. Today the upgrade conversation is reactive — triggered when the customer hits Postgres limits — instead of proactive.
- **Expansion × Tech [PM] — intra-product, not multi-chain.** Successful prediction markets expand by adding new market types (sports → politics → crypto-prices → custom), not by adding chains. The default Envio expansion playbook is multi-chain shaped, not intra-product shaped — there is no documented pattern for the market-type taxonomy that lets a new market category ship as a config change.

---

## §4 Proposed Shifts (Dual-Fix Per Cell)

| §2 Cell | Tech move | Business move |
|---|---|---|
| Activation × Tech [PM] (event shapes) | Prediction-markets indexer template with all five event shapes baked in — see [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md) | A 2-month Production trial offer attached to the template for wave-2 builders |
| Activation × Tech [PM] (settlement) | Settlement-event handler reference covering multi-step settlement + correction handling — see [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md) | The reference is the call-to-action on the PM-vertical landing page |
| Monetization × Tech [PM] | Leaderboard-grade query architecture pattern doc — see [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md) | Position Dedicated tier explicitly as "the leaderboard tier" in PM-vertical copy |
| Expansion × Tech [PM] | Template ships with a market-type taxonomy already; new market types ship as a config change, not a re-architecture | An intra-product expansion runbook (analogous to multi-chain runbook for DeFi) — flagged for follow-up; not in this 11-artifact set |

Three of four shifts have an owning artifact in this set. The fourth (intra-product expansion runbook) is flagged for Q2 follow-up — see [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md) §4 (honest-gap section).

---

## §5 Per-Account Pattern-Friction Notes

- **Polymarket** — 4B events; the case study is the marketing leverage. The play is converting the existing case study into a tier-positioning asset that anchors the entire vertical's content track. Technical health check should establish the published architecture as the canonical PM reference.
- **Limitless** — daily-market product on Base. Quarterly architectural check-in is the named play; the Dedicated-tier conversation is queued for the moment leaderboard query latency becomes visible.
- **Wave-2 (~10 builders).** Daily-market platforms, sports-prediction protocols, opinion markets, governance markets. Each gets the template + 2-month Production trial as the activation offer.

---

## §6 Why This Vertical Is The Highest-Conversion-Velocity Bet

§4 of the playbook names the structural reason: prediction markets is the highest-conversion-velocity vertical on the customer wall *because the customer's product workload is structurally analytics*. Every successful prediction market is a Dedicated-tier conversation in waiting. The funnel-to-ACV velocity is meaningfully higher than in DeFi because the tier-up motivation is built into the customer's product surface — leaderboards, market analytics, historical reporting are *first-class product features*, not internal dashboards. The technical work in this vertical converts into ACV faster than in DeFi for that reason.

---

## §7 What This Audit Doesn't Address

The business-side questions — whether Prediction Markets is a named vertical anywhere customer-facing today, how Polymarket's case study is or isn't doing positioning work, how the wave-2 outreach is shaped — live in the paired audit: [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md). Together they close the §8 four-artifact frame for PM.

---

> **Cell:** Activation × Tech [PM]; Monetization × Tech [PM]; Expansion × Tech [PM]; Retention × Tech [PM]
> **Revenue mechanism:** Net-new acquisition (Activation), tier-up to Dedicated (Monetization — "leaderboard tier"), expansion ARR via intra-product market-type expansion (Expansion)
> **Named accounts:** Polymarket (4B events on Polygon), Limitless (Base), PM wave-2 (~10 builders)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md), [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md)

— Kaustubh
