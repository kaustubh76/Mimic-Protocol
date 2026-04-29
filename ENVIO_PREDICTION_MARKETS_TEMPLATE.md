# Prediction Markets Indexer Template — All Five Event Shapes Baked In

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md) · [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Capstone artifact for the Prediction Markets vertical. Spec for a forkable indexer template with all five PM event shapes baked in: market creation, position taking, settlement, oracle resolution, payout, leaderboard rollups. Pulls in the settlement handler reference and the leaderboard query architecture as composable pieces.*
>
> **Live reference code:** [`pow/envio-pm-template-v1/`](./pow/envio-pm-template-v1/) — the runnable scaffold with the four-state settlement machine in [`src/EventHandlers/Settlement.ts`](./pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts), market-type taxonomy in [`schema.graphql`](./pow/envio-pm-template-v1/schema.graphql) (`MarketCategory` enum + `parseMarketCategory()` parser in [`src/Constants.ts`](./pow/envio-pm-template-v1/src/Constants.ts)), per-user leaderboard source in [`src/Aggregators/UserAggregator.ts`](./pow/envio-pm-template-v1/src/Aggregators/UserAggregator.ts), and per-epoch top-N writer in [`src/Snapshots/LeaderboardSnapshot.ts`](./pow/envio-pm-template-v1/src/Snapshots/LeaderboardSnapshot.ts).

---

## §1 Why This Template Exists

§4 of the playbook names the activation gap: prediction-market builders hit Greeter, see a `Transfer` event handler, and have to figure out market resolution from scratch. The default template library is DeFi-default; nothing in it speaks to the prediction-market workload.

This template closes the gap and is the **acquisition + activation engine** for the vertical:

- **Acquisition × Tech [PM]** — the template is the call-to-action on the prediction-markets-vertical landing page proposed in [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md). Vertical positioning brings the prospect; the template activates them.
- **Activation × Tech [PM]** — the template ships with all five PM event shapes baked in, so a builder forking it has a working market-state model on day one.
- **Expansion × Tech [PM] (intra-product)** — the template ships with a market-type taxonomy; new market types ship as a config change, not a re-architecture. This is the §4 distinguishing property of the PM vertical: expansion is intra-product, not multi-chain.

The funnel-velocity claim: §4 of the playbook names PM as the *highest-conversion-velocity vertical on the customer wall* because the customer's product workload is structurally analytics. The template is the activation door that opens the entire conversion path through to Dedicated tier-up.

---

## §2 Anatomy

The template ships as a forkable repo at slug `envio-pm-template-v1` (proposed). The directory layout reuses the Aggregators+Snapshots architecture from the DeFi 60-min template (Velodrome-shaped), but the entity model and event handlers are PM-specific:

```
envio-pm-template-v1/
├── config.yaml                      # Single chain to start; codegen-friendly for multi-chain expansion
├── schema.graphql                   # Market, Position, Settlement, OracleResolution, Leaderboard entities
├── src/
│   ├── EventHandlers/
│   │   ├── MarketFactory.ts         # Dynamic market registration via factory events
│   │   ├── Market.ts                # Multi-event handler (PositionTaken, PositionClosed, MarketLockedForResolution)
│   │   ├── Oracle.ts                # OracleResolved + MarketCorrected handlers
│   │   └── Settlement.ts            # Four-state settlement handler (see settlement reference)
│   ├── Aggregators/
│   │   ├── MarketAggregator.ts      # Open interest, volume, position counts per market
│   │   └── UserAggregator.ts        # P&L, position count, volume per user (the leaderboard source)
│   ├── Snapshots/
│   │   ├── MarketHourSnapshot.ts    # Per-market hourly snapshot
│   │   └── LeaderboardEpochSnapshot.ts  # Top-N per epoch (refreshed per minute in production)
│   ├── Effects/
│   │   ├── OracleRead.ts            # Effect-wrapped oracle read; one cached read per market resolution
│   │   └── TokenMetadata.ts         # Effect-wrapped token metadata for collateral tokens
│   ├── MarketTypes.ts               # The market-type taxonomy (binary, scalar, conditional)
│   ├── Helpers.ts                   # Shared utilities
│   └── Constants.ts                 # Chain-keyed config
└── README.md                        # The activation walkthrough
```

The five baked-in event shapes:

| Event | Handler | Maps to |
|---|---|---|
| `MarketCreated` | `MarketFactory.ts` | Dynamic contract registration; new market = new entity |
| `PositionTaken` / `PositionClosed` | `Market.ts` | Multi-event handler with shared preload |
| `MarketLockedForResolution` | `Market.ts` | State transition Open → Resolving |
| `OracleResolved` | `Oracle.ts` + `Settlement.ts` | State transition Resolving → Settled (see settlement reference) |
| `MarketCorrected` | `Oracle.ts` + `Settlement.ts` | State transition Settled → Corrected (see settlement reference) |

The `Settlement.ts` handler implements the four-state machine documented in [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md). The `LeaderboardEpochSnapshot.ts` writes the top-N rows that power the leaderboard query patterns documented in [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md). The template *composes* the two reference docs — it doesn't re-implement them.

---

## §3 Production Guardrails

The template prevents four failure modes:

- **Settlement bugs visible to end users.** The four-state settlement handler ([ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md)) is the default, not the retrofit.
- **Leaderboard refresh latency.** Aggregator + epoch-snapshot architecture is built to be ClickHouse-Sink-ready ([ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md)). Postgres-backed builds work for early stages; the upgrade path is config-shaped, not architecture-shaped.
- **Market-type sprawl.** The `MarketTypes.ts` taxonomy means adding a new market category (sports → politics → custom) is a config change, not a handler rewrite. Intra-product expansion at the speed of one PR.
- **Oracle read fan-out.** Effect-wrapped oracle reads ([ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md)) mean a 10,000-position market settles with one oracle read, not 10,000.

---

## §4 The 90-Minute Activation Walkthrough

The README walks the user from `git clone` to deployed indexer in 90 minutes, broken into nine 10-minute beats. The Loom walkthrough mirrors the same beats. Per-beat content:

| Minute | Beat | What happens | Reference |
|---|---|---|---|
| 0–10 | Setup | Clone, install, env vars, Envio CLI version check | Identical to DeFi template |
| 10–20 | Schema tour | `schema.graphql` walk: Market, Position, Settlement, OracleResolution entities | PM-specific |
| 20–30 | Market lifecycle | `EventHandlers/Market.ts` walk: position taking, market-lock-for-resolution | PM-specific |
| 30–45 | Settlement four-state machine | `EventHandlers/Settlement.ts` walk: Open → Resolving → Settled → Corrected | [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md) |
| 45–55 | Aggregators + leaderboard | `Aggregators/UserAggregator.ts` + `Snapshots/LeaderboardEpochSnapshot.ts` | [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md) |
| 55–65 | Run + query | `pnpm dev`, deploy locally, point at Sepolia or a forked test contract, hit GraphQL playground, run "top 10 traders by 7-day P&L" | The success-indicator moment — the leaderboard query returns data |
| 65–75 | Add a market type | Walk the `MarketTypes.ts` taxonomy; add a "sports" market type as a 5-line PR | Demonstrates intra-product expansion |
| 75–85 | Tier upgrade preview | Show the dual-write configuration that flips the analytics layer to ClickHouse Sink | The tier-up call-to-action |
| 85–90 | What's next | Three follow-up paths: 2-month Production trial, ClickHouse Sink Dedicated trial, join Discord | Each follow-up is a tier-up or expansion conversation entry-point |

The walkthrough's success indicator is at minute 65: the leaderboard query returns real data. ([ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) flags the absence of success indicators in the existing Greeter flow — this template fixes it for the PM vertical.)

---

## §5 Walkthrough Hooks

A productised version ships as:

- **The forkable repo** at `envio-pm-template-v1` (proposed slug).
- **A 90-minute Loom** — the canonical "first prediction-market indexer" video.
- **A written guide** at the canonical docs slot (top of "Tutorials" section, named "Build a Production-Grade Prediction Market Indexer in 90 Minutes").
- **A "what next" page** branching into the three tier-up / expansion paths.
- **A 2-month Production trial offer** structured around the template — trial converts to Production tier when leaderboard volume crosses a threshold.

---

## §6 Adoption Pathway

The template succeeds when:

1. **Time-to-first-leaderboard** for new PM prospects drops to under 90 minutes (currently un-instrumented).
2. New PM customer indexer code reviews show the four-state settlement handler and the leaderboard architecture as defaults — not month-3 retrofits.
3. The template becomes the canonical asset Envio team members link to when a PM prospect arrives.
4. The vertical's funnel-to-ACV velocity (§4 of the playbook: "the highest-conversion-velocity vertical on the customer wall") shows up in measurable ACV outcomes — the activation-to-Dedicated path is the conversion mechanism.

The conversion mechanism: PM-vertical positioning → template fork → 2-month Production trial → Production tier → Dedicated tier-up as leaderboard volume scales. From [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md): wave-2 (~10 builders) × ~50% trial conversion × ~60% trial-to-paid × $40k incremental Dedicated ACV is the structural Lever-6 path; this template is the activation door of that path.

---

## §7 Named Account Plays

| Account | Driver | Template-led conversation |
|---|---|---|
| **Polymarket** | 4B events; case study exists | Co-author a published refresh of the case study where the template is positioned as "what we'd build today" |
| **Limitless** | Daily-market on Base | Quarterly architectural check-in uses the template as the comparative reference point |
| **PM wave-2 (~10 builders)** | Daily-market platforms, sports, opinion, governance markets | Custom-shaped outreach grounded in their event-shape; template + 2-month trial is the attachment |

---

## §8 What This Template Doesn't Cover

- **Multi-chain expansion.** PM expansion is primarily intra-product, not multi-chain. The multi-chain runbook ([ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md)) applies if a PM protocol decides to deploy on a second chain.
- **Per-protocol-shape variants.** The template covers binary-outcome markets — the majority shape. Scalar markets, conditional markets, and exotic settlement schemes are extension points named in the template's docs but not bundled.
- **Intra-product expansion runbook.** The template *enables* market-type expansion via `MarketTypes.ts`; a dedicated runbook documenting the sequencing (when to add a market type, how to migrate existing data) is flagged as the Q2 follow-up artifact in [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md) §4 (honest-gap section).

---

> **Cell:** Activation × Tech [PM] (primary); Acquisition × Tech [PM] (CTA role); Expansion × Tech [PM] (intra-product market-type taxonomy)
> **Revenue mechanism:** Net-new acquisition into Production tier (template is the activation engine for vertical-positioning campaign); downstream tier-up to Dedicated as leaderboard volume scales — Lever 6 in [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md)
> **Named accounts:** Polymarket (case-study refresh anchor), Limitless (architectural check-in reference), PM wave-2 (~10 builders, the activation target)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md), [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md), [ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md](./ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md), [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md)

— Kaustubh
