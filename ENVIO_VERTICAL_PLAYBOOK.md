# The Vertical Scaling Playbook — A Dual-Angle Approach to Growth at Envio

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) · [ENVIO_REVENUE_MATH.md](./ENVIO_REVENUE_MATH.md) · [ENVIO_REVENUE_MATH_V2.md](./ENVIO_REVENUE_MATH_V2.md) · [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) · [ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md)

> *This document is structurally different from everything else in the package. The earlier memos pitched specific plays and specific feature launches. This one steps back and answers a harder question: how does a Growth Engineer who has to think both technically and commercially actually take a vertical from "we have a few customers here" to "we own this segment"? The atomic unit here is the vertical, not the feature. Features plug in as instances. The dual angle — engineer + business operator — is the whole point.*
>
> *I'm deliberately leaving personal-stack examples out. The playbook needs to stand on industry-level evidence, not on any single builder's experience. The grounding comes from your customer wall, your existing case studies, and the architectural patterns visible in your customers' open-source code.*

---

## §0 Why Both Angles, Why Together

A Growth Engineer at this stage of Envio's life is a structurally unusual role. The job description nominally falls between Developer Relations and Solutions Engineering, but in practice it lives at the intersection of two different problem-spaces:

- **The technical angle.** Templates, schema patterns, handler architecture, docs friction, repository teardowns, working code customers can fork. The work that makes adoption *easy*.
- **The business angle.** Pricing positioning, sales-cycle compression, account expansion mechanics, partnership structures, pipeline attribution. The work that makes adoption *pay*.

Most candidates lean heavily on one side. A pure DevRel hire writes great content and ships templates but struggles to articulate where the next million in ARR comes from. A pure GTM hire understands the funnel and the ACVs but can't sit in a code review or read a customer's indexer to figure out why they're stuck. Envio's stage demands both, and the demand isn't 50/50 — it's roughly 55% business and 45% technical, because *the product already wins on the technical merits*. The next leverage point is converting that technical advantage into revenue.

The rest of this document is built around that 55/45 weighting. Tech work is treated as instrumental — a means to a revenue end. The revenue mechanism is named explicitly in every section that proposes work.

---

## §1 The Vertical-Scaling Framework

A vertical playbook isn't a list of marketing ideas. It's a structured five-stage motion that turns technical fit into account-by-account ARR.

**Stage 1 — Diagnose the funnel.** Map where customers in this vertical lose momentum: at acquisition, activation, monetization, retention, or expansion. The diagnosis must be specific to the vertical, not generic — DeFi (DEX) and money market lose momentum in different places, for different reasons.

**Stage 2 — Identify dual interventions.** Every pain point gets two interventions designed in parallel: a technical one (template, doc, code-grounded fix) and a business one (positioning, pricing, partnership, sales-motion change). Both must be costed and sequenced together. Engineering work without a business mechanism is shipping for shipping's sake.

**Stage 3 — Sequence by ARR-velocity.** Not by what's easiest, not by what's most fun, not by what would feel impressive. By which intervention turns into recognised revenue fastest, weighted by likelihood of success. This is where most "growth playbooks" go to die — they sequence by aesthetic neatness instead of by money.

**Stage 4 — Compound through case studies.** Each closed account in the vertical becomes the seed for the next two. Case studies are not marketing assets in this framing; they're *qualification mechanisms*. A well-shaped case study self-segments inbound — *"this is what an Envio customer looks like in this vertical"* — so the next sales call qualifies itself in 30 seconds instead of 30 minutes.

**Stage 5 — Productize into reusable assets.** What worked customer-by-customer becomes a template, a runbook, a sales-enablement card. The same playbook then runs again — faster — at the next account in the vertical. This is where the role's leverage compounds: the third customer in a vertical costs a fraction of what the first did to land.

A vertical fully run through this framework looks like: 2–3 anchor case studies, a pain-map doc, a positioning doc, a pricing-tier alignment, a templates library, and 5–10 named accounts moved end-to-end through the funnel in 12 months. That's a quantifiable bet, not a pile of activities.

---

## §2 The Universal Pain Map — Five Funnel Stages, Two Root Causes Each

Every Envio vertical has the same five funnel stages. The interesting question is *what fails at each stage* — and crucially, the failure is almost always *both* a tech root cause AND a business root cause.

| Funnel Stage | Tech root cause (typical) | Business root cause (typical) |
|---|---|---|
| **Acquisition** | The vertical doesn't see itself in the marketing — generic indexer positioning doesn't speak to their workload | No vertical-specific positioning, content, or partner channel; the vertical isn't actively named in any customer-facing surface |
| **Activation** | First-30-minutes friction — the Greeter tutorial doesn't model the vertical's actual schema/event patterns | No vertical-specific onboarding path; everyone gets the same generic flow regardless of use case |
| **Monetization** | Customers stay on free tier because Production-tier features don't obviously map to their needs | Pricing tier names ("Production Small/Medium/Large/Dedicated") don't carry vertical-specific value cues; the upgrade case isn't made in the customer's language |
| **Retention** | Production friction at scale — handlers run twice, cache files balloon, multi-chain configs sprawl — pushes customers to consider alternatives | No structured account check-in; technical health goes invisible until it's a churn risk |
| **Expansion** | Second-chain or second-product expansion requires re-architecting work the customer dreads | No expansion playbook, no template that makes "add chain #2" a one-day task; expansion happens by customer initiative, not Envio's |

This map is the diagnostic frame for every vertical conversation. The shape it drives in practice: *every Growth intervention must answer "which funnel stage, which root cause, what's the dual fix."* That sentence is the litmus test for any proposed play. If a play doesn't map to a specific cell in this matrix, it's not a play — it's an aspiration.

---

## §3 Worked Example — DeFi Vertical

DeFi is the largest visible vertical on Envio's customer wall. Sablier, Velodrome+Aerodrome, LI.FI, and Beefy alone represent serious indexed event volume. The vertical's defining workload is *real-time + multi-chain + analytics-heavy* — and that combination is structurally aligned with both Envio's technical strengths and the highest-tier ACV brackets.

### Pain points specific to DeFi

**Acquisition pain** — DeFi protocol teams searching for indexing solutions look for execution-grade speed, not generic "real-time data." The current top-of-funnel content speaks the language of indexing infrastructure, not the language of DeFi engineers worrying about millisecond-grade decision latency on automated execution flows.

**Activation pain** — DeFi indexers are non-trivial: they need multi-event handlers, factory contract patterns for dynamically-deployed pools, and Effect API usage from day one for token metadata reads. The default Greeter tutorial gets a developer to a single-event handler. The gap between that and a *production-shaped DeFi indexer* is the activation killer.

**Monetization pain** — DeFi protocols often run a free-tier indexer for months before realising their event volume crosses Production thresholds. By the time the conversation happens, they've under-architected for their actual scale and are reluctant to re-architect.

**Retention/expansion pain** — successful DeFi protocols expand to new chains continuously. If adding chain #2 is a one-week project, they defer it; if it's a one-afternoon project (with the right template), they do it the same week. The default state today is closer to the former than the latter.

### Tech interventions

- **A "Production-grade DeFi indexer in 60 minutes" template + tutorial** that bridges the gap between Greeter and what Velodrome's `Aggregators/` directory actually looks like. Should ship as a forkable repo + a Loom walkthrough + a written guide. Anchored to patterns visible in the indexer-teardown work.
- **A "multi-chain expansion in one afternoon" runbook**, anchored to the dynamic-contract registration pattern and the codegen approach Sablier uses across 27 deployments. The artifact reduces friction for Stage 5 (expansion).
- **A canonical Effect API + entity-cache-first preload pattern** documented as a first-class pattern, not an advanced footnote. This is the single highest-leverage technical intervention in the vertical because every production DeFi indexer ends up needing it.

### Business interventions

- **Reposition Dedicated tier as "the DeFi production tier"** in the customer-facing copy. Stop describing tiers in generic "Small/Medium/Large" language; start using "DeFi-shaped customer," "execution-grade customer," "analytics-product customer." Tier names that carry vertical-specific value cues convert better.
- **A direct-outreach campaign to the 20 DeFi protocols** that *aren't* yet on Envio but match the architectural profile (multi-chain DEX, perp protocol, money market, real-time execution layer). One-page custom outreach grounded in their actual on-chain footprint.
- **A structured quarterly check-in cadence with the existing DeFi customer base** — Sablier, Velodrome+Aerodrome, LI.FI, Beefy. Each check-in produces a one-page health note that surfaces upcoming chain expansions, scaling triggers, and feature requests. This is the highest-NRR-impact intervention in the vertical.
- **A co-marketing motion with execution-tier partners** — wallet infrastructure, intent solvers, MEV protection providers — where Envio is positioned as the "execution-grade indexing partner" inside their stack.

### Revenue mechanism

The DeFi vertical produces ARR through three mechanisms working in parallel: net-new acquisition into Production tiers via the activation-template path, tier-up from Production into Dedicated via the analytics-architecture path, and chain-by-chain expansion at existing accounts via the multi-chain runbook. Each mechanism has a distinct funnel shape and a distinct sales motion, but they share the same content and template assets — so the work compounds across all three.

### Named monetization plays for existing DeFi accounts

- **Sablier** — already runs three indexers in their monorepo, with a custom codegen toolchain. The expansion path is Dedicated tier + analytics-mirror infrastructure for their fee/volume reporting. ACV expansion: structurally significant.
- **Velodrome + Aerodrome** — 12-chain footprint with explicit Aggregators + Snapshots architecture. Their dashboard layer is the canonical Dedicated-tier upgrade target. The play here is a co-authored case study with a clean tier-up conversation as the tail.
- **LI.FI** — cross-chain bridge volume reporting is the analytics workload they're most likely already pushing against Postgres limits with. The play is a technical health check that surfaces the analytics ceiling before they hit it.

---

## §4 Worked Example — Money-Market Vertical

> **Note on vertical selection.** This memo previously held a Prediction Markets worked example as the second-anchor vertical. After surveying the customer base, [`enviodev/polymarket-v2-indexer`](https://github.com/enviodev/polymarket-v2-indexer) was identified as Envio's production-shipped reference for that vertical — Polymarket V2 (CTFExchange + PolyUSD + Rewards) is already indexed by Envio's team in production. Money market replaces PM as the second anchor: comparable analytics-as-product structure, no current Envio-team production indexer, and structurally a major DeFi vertical (Aave V3 multi-chain TVL >$10B). The PM customer-wall references (Polymarket, Limitless) remain factually accurate as customers; the vertical-strategy slot now belongs to money market.

Money market is structurally one of the highest-value DeFi shapes by TVL, and it's currently invisible on Envio's customer-facing surface — a wider gap than the PM vertical was. Aave V3 alone runs on six+ chains with multi-chain TVL well above $10B. Compound V3, Spark, and Morpho add further surface. The vertical has properties that make it a strong target for dedicated focus.

### Pain points specific to money market

**Acquisition pain** — money-market protocol engineers don't see themselves in the indexing-infrastructure conversation. The marketing language is DeFi-default; "real-time data" doesn't speak to liquidator leaderboards or utilization curves or risk-monitoring tooling.

**Activation pain** — money markets have specific event shapes (per-(asset, user) state, dual-reserve liquidation handling, RAY-precision interest rate indexes) that don't show up in default templates. A builder hits the Greeter tutorial, sees a "transfer" event, and has to figure out `LiquidationCall` affecting both reserves and both users from scratch.

**Monetization pain** — risk dashboards, liquidator leaderboards, utilization curves, and historical rate analysis are *first-class product features* in money markets, not internal dashboards. The analytics workload IS the product (same property the PM vertical had). This makes the Dedicated-tier conversation structurally easy — but only if the customer is shown that the tier exists for exactly this reason.

**Retention/expansion pain** — successful money markets expand by adding chains continuously. Aave is on 6+ chains; expansion ARR per account is structurally significant. Without a one-config-change expansion path, customers defer chain #N. The current playbook covers this via the multi-chain expansion runbook; the vertical's payoff to that runbook is concentrated here.

### Tech interventions

- **A money-market indexer template** with all six Aave V3 lifecycle events baked in: Supply, Withdraw, Borrow, Repay, LiquidationCall, ReserveDataUpdated. This template alone shrinks activation time for the vertical by a meaningful factor and ships the dual-reserve + dual-user liquidation pattern correct from day one.
- **A risk-dashboard-grade query architecture pattern** documented as a canonical pattern for money markets. Liquidator leaderboards, time-bucketed utilization curves, per-reserve TVL aggregation, user-cohort risk segmentation — the analytical query patterns money markets *actually* run.
- **A liquidation-handler reference** that shows how to handle the trickiest event in the vertical (dual-reserve + dual-user state updates, append-only `Liquidation` entity preservation, same-asset edge case) cleanly.

### Business interventions

- **Position money market as a named vertical on the customer-facing surface.** Today the vertical is invisible — no money-market protocols on the visible customer wall, no money-market-named landing page. A dedicated landing page or content track shifts the funnel.
- **A "money-market risk-monitoring" content track** — case studies, technical posts on liquidation architecture, utilization-curve query patterns. Content that money-market protocol engineers Google when they're about to start building.
- **A direct-outreach campaign to the money-market protocols** — Aave / Compound V3 / Spark / Morpho as anchor accounts, plus wave-2 (~10 money-market builders) including Aave-fork protocols, Compound-fork protocols, and L2-native money markets. Each gets custom outreach grounded in their actual on-chain footprint.
- **Position Dedicated tier explicitly as the "risk-dashboard tier"** for money markets — the conversion case is structurally easy because the customer's product *is* analytics (risk monitoring), and the Dedicated tier is the analytics tier.
- **Co-marketing motion with risk-monitoring tools** — Gauntlet, Chaos Labs, Llama Risk — where Envio is positioned as the indexing partner inside their stack.

### Revenue mechanism

Money market has the highest-TVL-weighted analytical-query density of any DeFi vertical. Every successful money-market protocol is a Dedicated-tier conversation in waiting (same reasoning as the prior PM analysis: analytics IS the product). The revenue mechanism is: ship the vertical-specific template + content track → attract money-market builders → activate them with the dual-reserve liquidation pattern from day one → land them on Production with a clear Dedicated upgrade path → upgrade them as their utilization-curve / liquidator-leaderboard volume scales.

The funnel-to-ACV velocity should be comparable to or better than the (departed) PM vertical's velocity, because money-market protocols have larger TVL and more chains per account, and the vertical is freshly opened (no production-shipped Envio indexer yet).

### Named monetization plays for money-market accounts (acquisition targets)

- **Aave (mainnet, Polygon, Arbitrum, Base, Optimism, Avalanche)** — 6+ chain footprint, governance-driven reserve config, first-class risk-monitoring products (Aave's own dashboard, Gauntlet's external one, Chaos Labs' integrations). The play is a co-authored case study of the Envio indexer + dual-write ClickHouse architecture, comparing favourably against The Graph's Aave subgraph (which Aave already runs).
- **Compound V3 (Comet)** — per-base-asset architecture means more `Pool`-equivalent contracts per chain but simpler aggregation. The play is a Compound-shape template variant (small fork of the money-market template) demonstrating the framework's flexibility.
- **Spark (Aave fork)** — same event surface; template runs on Spark with one config change. The play is a "look how easy" demonstration that becomes a Spark-internal asset for their analytics layer.
- **Morpho** — multi-protocol consumer (Aave + Compound). Demonstrates the framework's ability to aggregate events from multiple source protocols. Co-engineering opportunity around the multi-source pattern.
- **Net-new outreach to ~10 money-market builders** — Aave-fork protocols (Hyperdrive, dForce), Compound-fork protocols (Sonne, Moonwell), and L2-native money markets (Aurelius, Sturdy). Each gets a custom-shaped indexer template offer plus a 2-month Production trial.

---

## §5 How Features Plug Into Vertical Playbooks — The ClickHouse Sink Example

A specific feature launch — say, ClickHouse Sink — isn't a strategy on its own. It's an *amplifier* on whichever verticals it most strengthens. ClickHouse Sink amplifies both DeFi-DEX and money-market playbooks because both verticals have analytics-heavy customer profiles. In the DeFi-DEX playbook, it strengthens the tier-up path for protocols like Velodrome whose dashboards are scanning aggregator tables at scale. In the money-market playbook, it strengthens the risk-dashboard-as-product positioning by making the underlying analytical query layer obviously fit-for-purpose for utilization curves and liquidator leaderboards.

The point: features get absorbed into vertical playbooks, not the other way around. A feature without a vertical playbook to plug into is a launch announcement; a feature plugged into a strong vertical playbook is a tier-up engine.

---

## §6 The Business Operator's View — Where The Money Actually Moves

This is the section that the prior memos in this package skirted around. Where does new ARR enter Envio's system, and what's the role's contribution to each entry point?

**New ARR enters through three channels:** (1) net-new acquisition into Production tiers, (2) tier-up from Production into Dedicated, (3) expansion at existing accounts (more chains, more indexers, more entities). The role's contribution to each channel is structurally different.

For **net-new acquisition**, the role's leverage is in *vertical-specific top-of-funnel*. Generic content brings generic leads. Vertical-specific content (DeFi-execution-grade positioning; prediction-markets-analytics positioning) brings pre-qualified leads with higher conversion rates. The mechanism by which work becomes revenue: vertical positioning → vertical-specific organic discovery → activation with vertical-specific templates → Production-tier conversion. The role sits squarely in the top three steps of that chain.

For **tier-up to Dedicated**, the role's leverage is in *making the upgrade case in the customer's language*. A customer doesn't tier up because Dedicated is "more advanced"; they tier up because their workload outgrew their current tier and the Dedicated benefits map specifically to the pain they're feeling. The mechanism: technical health check surfaces the impending bottleneck → vertical-positioned content shows them the upgrade path is the standard one → trial offer removes the financial friction → upgrade conversation is closed in days, not months. The role drives the first three steps directly.

For **expansion**, the role's leverage is in *removing the friction that defers expansion decisions indefinitely*. Multi-chain expansion templates, structured account check-ins, account-by-account technical roadmap awareness — these are not glamorous interventions, but they are the highest-NRR-impact work the role can do. NRR compounds; one quarter of structured expansion work moves the year-2 number meaningfully.

**The role's revenue lever vs. the product's revenue lever** — this distinction matters and is rarely articulated. The product itself produces revenue every time a customer signs up unprompted, every time an existing customer scales naturally, every time an organic referral lands. The role's revenue lever is *additive* on top of that — it's the ARR that wouldn't have happened without the active intervention. The honest framing for measurement: the role should be evaluated on incremental ARR attributable to the function, with attribution measured against a no-Growth-function counterfactual baseline. That's a defensible commitment, and it's the right one.

---

## §7 The Technical Operator's View — Where The Engineering Leverage Lives

Engineering work in a Growth Engineer role splits cleanly into two categories: *pattern-level* and *point-level*.

**Point-level work** is the one-off — debugging a specific customer's handler, responding to a specific Discord question, helping one team ship one indexer. It's high-empathy and low-leverage. Done all day, it's a support engineer's job, not a Growth Engineer's. The instinct to do this work is healthy; the discipline is to do *enough* of it to stay grounded in customer reality, but not so much that the role's leverage collapses to N=1.

**Pattern-level work** is the codified-once, used-everywhere artifact. A vertical-specific indexer template that 50 prediction-market builders fork is leverage. A canonical Effect-API-plus-entity-cache-first pattern documented as the production default is leverage. A migration runbook that the next 5 customers follow without bespoke help is leverage. The discipline of the role is biasing aggressively toward pattern-level interventions and treating point-level work as the *signal* that tells me which patterns to build next.

The single most useful internal heuristic: when a customer asks for help with a thing, the instinct shouldn't be *"how do I help this customer"* — it should be *"if 10 customers asked the same question, what would the canonical answer be, and where would it live?"* That reframe converts every support touch into a potential reusable artifact. Most of them won't be worth productizing. A meaningful minority will, and those become the templates and patterns that scale the vertical.

The interplay of tech + business is sharpest here: the technical work that scales is the work that has a business mechanism behind it. A template without a vertical positioning doesn't get adopted. A pattern documented without a customer use-case to anchor it gets ignored. The engineering leverage compounds when the technical asset and the business positioning ship together as a unit.

---

## §8 What I'd Commit To In Week One

Two parallel diagnostics — one technical, one business — for each of the two anchor verticals.

**For DeFi**, the technical diagnostic is a one-page audit of where production DeFi indexers in the existing customer base are running into pattern-level friction (anchored to the indexer-teardown analysis). The business diagnostic is a one-page positioning audit of how DeFi customers see (or don't see) themselves in Envio's current marketing surface, with proposed messaging shifts.

**For Money Market**, the technical diagnostic is a similar one-page audit but anchored to the specific event shapes and query patterns money markets need (Pool-singleton dynamic registration, dual-reserve liquidation handling, RAY-precision rate indexes, utilization-curve query patterns). The business diagnostic is a positioning audit of whether money market is a named vertical in any customer-facing surface today, with proposed treatment as a first-class vertical going forward.

Four artifacts in week one. Two days each. By end of week one, we're not arguing about strategy in the abstract — we're arguing about specific cells in the pain-map matrix and which ones I'd own first. The conversation that produces is concrete: *"OK, of these 20 cells across two verticals, which 5 do we tackle in the first quarter, and what's the sequencing."*

By end of week two, that decision is made and one vertical is chosen as the primary 90-day owned cohort. I'd lean toward **Money Market** as the primary bet for the first 90 days because (a) the analytics-as-product overlap with the highest-tier ACV is structurally strongest (risk dashboards = the leaderboard-equivalent property the PM vertical had), (b) the vertical is currently invisible on the marketing surface so the leverage on positioning work is highest (an even larger gap than PM was), (c) the named-account list (Aave / Compound V3 / Spark / Morpho + ~10 wave-2 protocols) is short enough to actually move the needle in a quarter, and (d) Aave's multi-chain footprint means expansion ARR per anchor account is structurally significant. But I'd want the team's input on this — the opportunity-cost analysis depends on internal context I don't have yet.

---

## §9 Why This Playbook Is Real, Not Templated

The honest critique of any growth memo is: does it commit to anything specific, or does it hedge with a list of activities and call it strategy? Templated playbooks are recipes — they describe the work. Real playbooks are *bets* — they pick verticals, name accounts, and accept that the bet might be wrong.

The version of this document I would not write is the one that says *"we'll grow across DeFi, money market, and L2 analytics in parallel, each with their own playbook."* That's not a strategy; it's a refusal to pick. The version of the document I'm willing to defend is the one that says: *here are the two anchor verticals worth owning, here's the dual-angle framework that runs each one, here's the named-account math, and here's the one I'd pick to bet on first if you forced me to choose.*

The framework above is generalized — it works for any vertical. The bet is specific. That's the test of usefulness: a playbook that doesn't make a specific bet at the end isn't a playbook, it's a brochure.

---

## Closing

This document is the version of the package that addresses the most important question a 10-person all-technical founding team would ask: *"can this person actually scale a vertical end-to-end, in both the engineering and the commercial register, or are they better in one and pretending in the other?"*

The honest answer I'd want to give is: *I'd own one vertical end-to-end before claiming we can scale all three. The framework is general. The bet is specific. The role's first 90 days are about choosing which bet to make first, with your team's context — and then executing it on both sides simultaneously, because that's what the role demands and that's where the revenue actually lives.*

If we're aligned on that framing, the planning conversation gets concrete fast: which vertical, which named accounts, which week-one diagnostics, which 90-day commitments. That's the meeting I'd want to walk into.

— Kaustubh
