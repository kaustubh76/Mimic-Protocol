# The Envio Pain Map Matrix — Five Funnel Stages × Two Root Causes, Populated for Two Verticals

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) · [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md) · [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) · [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md)

> *This is the diagnostic frame the rest of the artifact set hangs off. The vertical playbook (§2) sketched the matrix at the abstract level; this doc populates the cells for both anchor verticals with named accounts, named code patterns, and the specific revenue mechanism each cell unlocks. Every other doc in this set has a footer that names the cell(s) it owns. The matrix is the index.*

---

## §1 How To Read This Doc

The matrix has 20 cells: 5 funnel stages × 2 root causes (tech, business) × 2 verticals (DeFi, Prediction Markets). Each cell is named with a one-line pain statement, a one-line proposed dual-fix, the named accounts the cell concerns, and the artifact in this set that operationalises the fix. A cell with no owning artifact is an aspiration, not a play — flagged explicitly so the team can decide whether to staff it.

---

## §2 The DeFi Vertical Matrix

Anchor accounts on the customer wall: Sablier (3 indexers, 27 deployments, `@sablier/devkit` codegen), Velodrome + Aerodrome (12 chains, `Aggregators/` + `Snapshots/` architecture), LI.FI (cross-chain bridge volume reporting), Beefy. Wave-2 outreach: 20 protocols matching the multi-chain DEX / perp / money-market / real-time-execution profile.

### Acquisition × Tech root cause — DeFi

**Pain.** DeFi protocol teams searching for indexing solutions look for execution-grade speed and multi-chain footprint, not generic real-time-data positioning. The current top-of-funnel content reads as infrastructure-first, not workload-first.

**Proposed dual-fix.** Tech: ship a "production-grade DeFi indexer in 60 minutes" template that bridges Greeter to a Velodrome-shaped Aggregators+Snapshots layout. Business: a vertical-specific landing page that names "execution-grade indexing" as the workload, not "real-time data" as the feature.

**Named accounts impacted.** Wave-2 outreach list (20 protocols).

**Owning artifact.** [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md) (tech), [ENVIO_DEFI_POSITIONING_AUDIT.md](./ENVIO_DEFI_POSITIONING_AUDIT.md) (business).

### Acquisition × Business root cause — DeFi

**Pain.** No vertical-specific positioning, no DeFi-named partner channel, no DeFi-shaped customer-wall framing. The vertical is implicit in customer logos but not explicit anywhere a DeFi engineer would search.

**Proposed dual-fix.** Tech: anchor each marketing surface to a forkable indexer the prospect can fork in their first session. Business: name "DeFi-shaped customer," "execution-grade customer," and "analytics-product customer" explicitly in the customer-facing copy; reposition Dedicated tier as the DeFi production tier.

**Named accounts impacted.** All 4 anchor accounts (existing) + wave-2 (new).

**Owning artifact.** [ENVIO_DEFI_POSITIONING_AUDIT.md](./ENVIO_DEFI_POSITIONING_AUDIT.md).

### Activation × Tech root cause — DeFi

**Pain.** The Greeter tutorial gets a developer to a single-event handler. A production-shaped DeFi indexer needs multi-event handlers, factory contract patterns for dynamically-deployed pools, the Effect API from day one for token metadata reads, and an entity-cache-first preload pattern. The gap is the activation killer. ([ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md): "production patterns documented but not on first-30-minutes path".)

**Proposed dual-fix.** Tech: a forkable DeFi template + Loom walkthrough + written guide that ships these patterns as the default, not the advanced footnote. Business: track activation conversion uplift (industry benchmark 2× tutorial completion when production patterns are surfaced early; placeholder until measured).

**Named accounts impacted.** Velodrome, Aerodrome, Sablier (the patterns are visible in their repos); the funnel benefit is to wave-2.

**Owning artifact.** [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md).

### Activation × Business root cause — DeFi

**Pain.** Every prospect gets the same generic onboarding flow regardless of whether they're a DEX, a perp protocol, a money market, or an execution-layer product. No vertical-specific path.

**Proposed dual-fix.** Tech: vertical-shaped templates branched off a single shared base. Business: a "what kind of protocol are you building?" entry-point on the docs that routes to the matching template — DeFi DEX, perp, money market, execution layer. Removes the "is this for me?" friction at first read.

**Named accounts impacted.** Wave-2.

**Owning artifact.** [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md) operationalises the DEX path; sibling per-shape templates are out of scope for this artifact set and flagged for follow-up.

### Monetization × Tech root cause — DeFi

**Pain.** Customers stay on free tier because Production-tier features don't obviously map to their needs. Production friction at scale (cache file balloon, multi-chain config sprawl, handlers running twice) is the actual signal that the upgrade conversation should happen — but it shows up as customer pain, not as a sales trigger.

**Proposed dual-fix.** Tech: surface scale-thresholds in the docs ("when your event volume crosses X, you should be on Y tier") with the Effect-API + entity-cache-first pattern as the production baseline. Business: a quarterly technical health check that converts pain signals into upgrade conversations before they become churn risks.

**Named accounts impacted.** LI.FI (cross-chain bridge volume nearing analytics ceiling), Velodrome (12-chain dashboard layer).

**Owning artifact.** [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md), [ENVIO_DEFI_TECH_DIAGNOSTIC.md](./ENVIO_DEFI_TECH_DIAGNOSTIC.md).

### Monetization × Business root cause — DeFi

**Pain.** Tier names ("Production Small / Medium / Large / Dedicated") don't carry vertical-specific value cues. The upgrade case isn't made in the customer's language.

**Proposed dual-fix.** Tech: per-tier feature matrix that calls out DeFi-specific value (multi-chain, analytics-mirror, dedicated infra). Business: rename tiers in customer-facing copy so the value lands — "execution-grade tier," "analytics-product tier," "dedicated DeFi infra tier."

**Named accounts impacted.** Velodrome+Aerodrome (Dedicated upgrade target — dashboard layer); Sablier (Dedicated + analytics-mirror for fee/volume reporting).

**Owning artifact.** [ENVIO_DEFI_POSITIONING_AUDIT.md](./ENVIO_DEFI_POSITIONING_AUDIT.md).

### Retention × Tech root cause — DeFi

**Pain.** Production friction at scale — handlers running twice, cache files balloon, multi-chain configs sprawl — pushes customers toward considering alternatives.

**Proposed dual-fix.** Tech: a documented "Envio production playbook" that codifies the Effect-API + entity-cache-first + codegen patterns Sablier and Velodrome already run, so new production accounts inherit the patterns instead of rediscovering them. Business: incident-driven outreach when an account hits a documented friction point — turn the support ticket into a check-in.

**Named accounts impacted.** All 4 anchor DeFi accounts.

**Owning artifact.** [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md).

### Retention × Business root cause — DeFi

**Pain.** No structured account check-in. Technical health goes invisible until it's a churn risk.

**Proposed dual-fix.** Tech: an internal account dashboard that surfaces event-volume trend, cache-file size, chain count, and Effect-API hit rate per account. Business: a quarterly check-in cadence with the existing DeFi base — Sablier, Velodrome+Aerodrome, LI.FI, Beefy — producing a one-page health note per account.

**Named accounts impacted.** All 4 anchor DeFi accounts.

**Owning artifact.** [ENVIO_DEFI_TECH_DIAGNOSTIC.md](./ENVIO_DEFI_TECH_DIAGNOSTIC.md) sketches the per-account health-note shape; the cadence itself is sales-motion work outside this artifact set.

### Expansion × Tech root cause — DeFi

**Pain.** Adding chain #2 to an existing indexer is a one-week project under the default architecture. Customers defer expansion.

**Proposed dual-fix.** Tech: a multi-chain expansion runbook anchored to Sablier's `@sablier/devkit` codegen approach (27 deployments) and the dynamic contract registration pattern. Business: position expansion as a one-afternoon task in the customer-facing copy; offer the runbook as a co-engineering session for anchor accounts.

**Named accounts impacted.** Velodrome+Aerodrome (12-chain footprint, every new chain is potential expansion ARR), Sablier (existing pattern; co-author the runbook), LI.FI.

**Owning artifact.** [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md).

### Expansion × Business root cause — DeFi

**Pain.** No expansion playbook. Expansion happens by customer initiative, not by Envio's.

**Proposed dual-fix.** Tech: the runbook above. Business: a quarterly account roadmap that lists each anchor's pending chain expansions and queues the technical co-engineering offer ahead of their decision.

**Named accounts impacted.** Velodrome+Aerodrome, Sablier, LI.FI, Beefy.

**Owning artifact.** [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md), [ENVIO_DEFI_POSITIONING_AUDIT.md](./ENVIO_DEFI_POSITIONING_AUDIT.md).

---

## §3 The Prediction Markets Vertical Matrix

Anchor accounts on the customer wall: Polymarket (4B events on Polygon — the largest single indexed event volume Envio publicly cites), Limitless (daily prediction market on Base). Wave-2: ~10 prediction-market builders identified from publicly visible deployments — daily-market platforms, sports-prediction protocols, opinion markets, governance markets.

### Acquisition × Tech root cause — Prediction Markets

**Pain.** Prediction-market builders don't see themselves in the indexing-infrastructure conversation. The marketing language is DeFi-default.

**Proposed dual-fix.** Tech: a prediction-markets indexer template with the right event shapes baked in (market creation, position taking, settlement, oracle resolution, payout, leaderboard rollups). Business: a prediction-markets-named landing page; a content track Googled by builders about to start building.

**Named accounts impacted.** Wave-2 (10 builders).

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md).

### Acquisition × Business root cause — Prediction Markets

**Pain.** Prediction Markets is implicitly visible (Polymarket on the wall, Limitless case study) but not explicitly named as a target segment.

**Proposed dual-fix.** Tech: pin the Polymarket case study + Limitless case study as anchor evidence on the new landing page. Business: name prediction markets as a first-class vertical in customer-facing copy; ship a prediction-markets-content track.

**Named accounts impacted.** Polymarket (case study leverage), Limitless (case study leverage), wave-2 (acquisition target).

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md).

### Activation × Tech root cause — Prediction Markets

**Pain.** Prediction markets have specific event shapes (settlement, oracle resolution, payout, market creation) that don't show up in default templates. A builder hits the Greeter tutorial, sees a "transfer" event, and has to figure out market resolution from scratch.

**Proposed dual-fix.** Tech: prediction-markets indexer template + a settlement-event handler reference for the trickiest event in the vertical. Business: a 2-month Production trial offer attached to the template for wave-2 builders.

**Named accounts impacted.** Wave-2.

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md).

### Activation × Business root cause — Prediction Markets

**Pain.** Generic onboarding doesn't acknowledge the vertical's distinct activation path (market shape modelling).

**Proposed dual-fix.** Tech: route prediction-markets prospects to the vertical template from the docs entry-point. Business: a prediction-markets-shaped 2-month trial structure that converts to Production tier when leaderboard volume crosses a threshold.

**Named accounts impacted.** Wave-2.

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md).

### Monetization × Tech root cause — Prediction Markets

**Pain.** Leaderboards, market analytics, and historical reporting are first-class product features in prediction markets — the analytics workload IS the product. The Postgres-backed default doesn't scale to leaderboard refresh-every-minute and top-N-by-7-day-fees query patterns ([ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md)).

**Proposed dual-fix.** Tech: a leaderboard-grade query architecture pattern doc that names the analytical query patterns prediction markets actually run. Business: a Dedicated-tier conversation ("the leaderboard tier") triggered when the customer's product surface starts hitting query-latency limits.

**Named accounts impacted.** Polymarket (4B events; market analytics + top-trader leaderboards already running), Limitless (daily-market leaderboards), wave-2 (post-launch).

**Owning artifact.** [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md).

### Monetization × Business root cause — Prediction Markets

**Pain.** Tier-up case isn't made in the prediction-market builder's language. Dedicated tier sounds generic; "leaderboard tier" sounds inevitable.

**Proposed dual-fix.** Tech: per-tier feature matrix called out for prediction-markets workload (leaderboards, settlement-corrections, oracle history). Business: position Dedicated explicitly as the leaderboard tier in PM-vertical copy.

**Named accounts impacted.** Polymarket (Dedicated upgrade conversation grounded in the published 4B-events case study), Limitless (Dedicated queued for the moment leaderboard latency becomes visible), wave-2 (post-launch tier-up path).

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md](./ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md).

### Retention × Tech root cause — Prediction Markets

**Pain.** Settlement event handling is the trickiest production concern in the vertical (multi-step settlement with potential oracle corrections). Mishandled settlement = wrong leaderboard = product bug visible to end users. Customers leave.

**Proposed dual-fix.** Tech: a settlement-event handler reference that documents correction-handling cleanly. Business: an architectural check-in cadence with PM accounts as their volume scales.

**Named accounts impacted.** Polymarket, Limitless, wave-2.

**Owning artifact.** [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md).

### Retention × Business root cause — Prediction Markets

**Pain.** No structured PM-specific check-in. Polymarket case study exists; Limitless has no published quarterly architectural review.

**Proposed dual-fix.** Tech: per-account architectural health note covering settlement integrity + leaderboard query latency. Business: a quarterly architectural check-in with Polymarket and Limitless; published case-study refresh on Polymarket once a year.

**Named accounts impacted.** Polymarket, Limitless.

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md](./ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md) sketches the health-note shape.

### Expansion × Tech root cause — Prediction Markets

**Pain.** Successful prediction markets expand by adding new market types (sports → politics → crypto-prices → custom), not by adding chains. The default playbook models multi-chain expansion, not intra-product expansion.

**Proposed dual-fix.** Tech: the prediction-markets template ships with a market-type taxonomy already; expansion is "add a market type" not "add a chain." Business: name the intra-product expansion path in the customer-facing copy and the account roadmap.

**Named accounts impacted.** Polymarket (politics → crypto-prices → custom), Limitless (daily-market type expansion), wave-2.

**Owning artifact.** [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md).

### Expansion × Business root cause — Prediction Markets

**Pain.** No PM expansion playbook. Default playbook is multi-chain shaped, not intra-product shaped.

**Proposed dual-fix.** Tech: the template above. Business: an intra-product expansion runbook for PM accounts (analogous to the multi-chain runbook for DeFi). Out of scope for this set; flagged for follow-up.

**Named accounts impacted.** Polymarket, Limitless, wave-2.

**Owning artifact.** Not yet — flagged. The PM template covers the *shape* of intra-product expansion; a dedicated runbook is a follow-up artifact.

---

## §4 Cells With No Owning Artifact (The Honest Gap)

Two cells in this matrix have no owning artifact in the 11-doc set:

- **DeFi · Activation × Business** — per-protocol-shape entry-point on the docs (DEX vs perp vs money market vs execution layer). The DeFi 60-min template covers DEX shape; sibling per-shape templates would close the cell. Flagged for Q2 follow-up.
- **PM · Expansion × Business** — intra-product expansion runbook for prediction markets. The PM template sketches the shape; a dedicated runbook would close the cell. Flagged for Q2 follow-up.

Naming the gaps is the point. A matrix that pretends every cell has a play is dishonest. The two unowned cells are where the next two artifacts go after the first 11 ship.

---

## §5 How To Use This Matrix In A Planning Conversation

The §8 commitment in the playbook ("By end of week one, we're not arguing about strategy in the abstract — we're arguing about specific cells in the pain-map matrix and which ones I'd own first") is operationalised here. The conversation runs:

1. Open this doc.
2. Read each populated cell in §2 and §3.
3. Pick 5 cells out of the 18 populated to own in Q1.
4. Sequence the corresponding artifacts (this set's 11 commits) and the corresponding sales motions (out of scope for this set) in priority order.
5. Commit to a 90-day cohort owned end-to-end.

The matrix is the conversation-shaping tool. The 10 derivative artifacts are the executions. The honest answer to "can this person scale a vertical end-to-end" lives in whether the matrix-to-executions mapping holds together — which is what the rest of this artifact set is for.

---

> **Cell:** All 20 cells (10 per vertical) — this is the index doc for the rest of the set.
> **Revenue mechanism:** All three (net-new acquisition, tier-up to Dedicated, expansion at existing accounts).
> **Named accounts:** Sablier, Velodrome, Aerodrome, LI.FI, Beefy, Polymarket, Limitless, plus DeFi wave-2 (20 protocols) and PM wave-2 (~10 builders).
> **Sibling artifacts:** All 10 — this matrix is the index they cite back to.

— Kaustubh
