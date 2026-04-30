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

## §3 The Money-Market Vertical Matrix

Anchor accounts (acquisition targets — vertical newly seeded): **Aave V3** (multi-chain TVL >$10B; mainnet, Polygon, Arbitrum, Base, Optimism, Avalanche), **Compound V3 (Comet)** (per-base-asset architecture on mainnet/L2s), **Spark** (Aave V3 fork), **Morpho** (multi-protocol consumer of Aave + Compound). Wave-2 outreach: ~10 money-market builders including Aave-fork protocols (Hyperdrive, dForce), Compound-fork protocols (Sonne, Moonwell), and L2-native money markets (Aurelius, Sturdy).

The PM vertical previously occupied this slot was dropped after [`enviodev/polymarket-v2-indexer`](https://github.com/enviodev/polymarket-v2-indexer) was identified as Envio's production-shipped reference for that vertical. Money market is the third of four DeFi shapes named in the playbook §3, and is structurally the strongest replacement: comparable analytics-as-product properties (risk dashboards = leaderboards in PM terms), no current Envio production indexer, and a cleaner candidate-team opportunity.

### Acquisition × Tech root cause — Money Market

**Pain.** Money-market protocol engineers don't see themselves in the indexing-infrastructure conversation. The marketing language is DeFi-default; "real-time data" doesn't speak to liquidator leaderboards or utilization curves.

**Proposed dual-fix.** Tech: a money-market indexer template with all six Aave V3 lifecycle events baked in (Supply, Withdraw, Borrow, Repay, LiquidationCall, ReserveDataUpdated). Business: a money-market-named landing page; content track Googled by Aave / Compound / Spark / Morpho engineers.

**Named accounts impacted.** Wave-2 (~10 protocols).

**Owning artifact.** [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md).

### Acquisition × Business root cause — Money Market

**Pain.** Money market is **invisible** as a target segment in current Envio marketing — even more so than PM was. No money-market protocols on the visible customer wall. Aave's TVL is multi-chain >$10B; the vertical is structurally major but unrepresented in customer-facing surfaces.

**Proposed dual-fix.** Tech: pin the money-market template + the [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md) pattern doc as anchor evidence on the new landing page. Business: name money market as a first-class vertical in customer-facing copy; ship a money-market-content track.

**Named accounts impacted.** Aave (acquisition target, TVL leader), Compound V3, Spark, Morpho, wave-2.

**Owning artifact.** [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md).

### Activation × Tech root cause — Money Market

**Pain.** Money markets have specific event shapes (per-(asset, user) state, dual-reserve liquidation handling, RAY-precision rate indexes) that don't show up in default templates. A builder hits the Greeter tutorial, sees a "transfer" event, and has to figure out LiquidationCall affecting both reserves and both users from scratch.

**Proposed dual-fix.** Tech: money-market indexer template + a liquidation-handler reference for the trickiest event in the vertical. Business: a 2-month Production trial offer attached to the template for wave-2 builders.

**Named accounts impacted.** Wave-2.

**Owning artifact.** [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md).

### Activation × Business root cause — Money Market

**Pain.** Generic onboarding doesn't acknowledge the vertical's distinct activation path (Pool-singleton + lazy reserve creation + dual-reserve liquidation handling).

**Proposed dual-fix.** Tech: route money-market prospects to the vertical template from the docs entry-point. Business: a money-market-shaped 2-month trial that converts to Production tier when utilization-curve query volume crosses a threshold.

**Named accounts impacted.** Wave-2.

**Owning artifact.** [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md).

### Monetization × Tech root cause — Money Market

**Pain.** Risk dashboards, liquidator leaderboards, utilization curves, and historical rate analysis are first-class product features in money markets — the analytics workload IS the product. The Postgres-backed default doesn't scale to per-reserve utilization-curve queries over 12-month windows or liquidator-leaderboard refresh times ([ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md)).

**Proposed dual-fix.** Tech: a risk-dashboard-grade query architecture pattern doc naming the analytical query patterns money markets actually run. Business: a Dedicated-tier conversation ("the risk-dashboard tier") triggered when the customer's product surface hits query-latency limits.

**Named accounts impacted.** Aave (mainnet utilization-curve volume), Compound V3, Spark, Morpho, wave-2 (post-launch).

**Owning artifact.** [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md).

### Monetization × Business root cause — Money Market

**Pain.** Tier-up case isn't made in the money-market builder's language. Dedicated tier sounds generic; "the risk-dashboard tier" sounds inevitable for a risk-monitoring product.

**Proposed dual-fix.** Tech: per-tier feature matrix called out for money-market workload (utilization curves, liquidator leaderboards, multi-asset reserve sprawl, time-bucketed rate history). Business: position Dedicated explicitly as the risk-dashboard tier in money-market-vertical copy.

**Named accounts impacted.** Aave (Dedicated upgrade conversation grounded in TVL leadership), Compound V3, Spark, Morpho, wave-2 (post-launch tier-up path).

**Owning artifact.** [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md).

### Retention × Tech root cause — Money Market

**Pain.** Liquidation event handling is the trickiest production concern in the vertical. `LiquidationCall` affects two reserves AND two users (victim + liquidator); naive handlers update one side and leave the data inconsistent. Mishandled liquidation = wrong risk dashboard = product bug visible to end users + governance teams. Customers leave.

**Proposed dual-fix.** Tech: a liquidation-handler reference that documents the dual-reserve + dual-user pattern cleanly. Business: an architectural check-in cadence with money-market accounts as their volume scales.

**Named accounts impacted.** Aave, Compound V3, Spark, Morpho, wave-2.

**Owning artifact.** [ENVIO_LIQUIDATION_HANDLER_REFERENCE.md](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md).

### Retention × Business root cause — Money Market

**Pain.** No structured money-market-specific check-in cadence — the vertical is being newly opened. Once anchor accounts are acquired, this becomes the highest-NRR-impact intervention.

**Proposed dual-fix.** Tech: per-account architectural health note covering liquidation correctness + utilization-query latency. Business: a quarterly architectural check-in with each anchor account (initially Aave + 2-3 secondary protocols).

**Named accounts impacted.** Aave (post-acquisition), Compound V3, Spark, Morpho.

**Owning artifact.** [ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md) sketches the health-note shape.

### Expansion × Tech root cause — Money Market

**Pain.** Money markets expand by adding chains continuously. Aave is on 6+ chains; expansion ARR per account is structurally significant. Without a one-config-change expansion path, customers defer chain #N.

**Proposed dual-fix.** Tech: the money-market template ships an `add-chain` CLI; Aave's deterministic deployment means most chains share the same Pool address (one config change). Business: name expansion as a one-afternoon task in the customer-facing copy; offer the runbook as a co-engineering session for Aave / Compound / Spark.

**Named accounts impacted.** Aave (6+ chains, every new L2 is potential expansion ARR), Compound V3, Spark, Morpho.

**Owning artifact.** [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md), [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md).

### Expansion × Business root cause — Money Market

**Pain.** No expansion playbook. Without a quarterly account roadmap, expansion happens by customer initiative not Envio's.

**Proposed dual-fix.** Tech: the runbook above. Business: a quarterly account roadmap that lists each anchor's pending chain expansions and queues the technical co-engineering offer ahead of their decision.

**Named accounts impacted.** Aave, Compound V3, Spark, Morpho.

**Owning artifact.** [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md), [ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md).

---

## §4 Cells With No Owning Artifact (The Honest Gap)

One cell in this matrix has no owning artifact in the artifact set:

- **DeFi · Activation × Business** — per-protocol-shape entry-point on the docs (DEX vs perp vs money market vs execution layer). The DeFi 60-min template covers DEX shape; the perp template covers perp; the money-market template covers money market — three of four DeFi shapes shipped. The execution-layer shape is flagged for Q2 follow-up; until then this cell isn't fully owned.

(The PM vertical previously had two entries in this list; both are removed since the PM vertical itself has been dropped from this package — see CHANGELOG.md and the §3 frame above for the rationale.)

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
> **Named accounts:** Sablier, Velodrome, Aerodrome, LI.FI, Beefy (DeFi DEX); Aave, Compound V3, Spark, Morpho (money market); plus DeFi wave-2 (~20 protocols) and money-market wave-2 (~10 builders).
> **Sibling artifacts:** All — this matrix is the index they cite back to.

— Kaustubh
