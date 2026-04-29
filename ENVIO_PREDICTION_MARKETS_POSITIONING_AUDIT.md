# Prediction Markets Positioning Audit — Whether The Vertical Is A Named Segment Anywhere Customer-Facing Today

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) · [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Week-One commitment from §8 of the playbook: a one-page positioning audit on whether prediction markets is a named vertical in any customer-facing surface today, with proposed treatment as a first-class vertical going forward. Paired with [ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md](./ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md). Together they close the §8 four-artifact frame for PM.*

---

## §1 Frame

Prediction markets is structurally one of the highest-value verticals on Envio's customer wall — Polymarket alone represents 4B indexed events on Polygon, and Limitless represents the next generation of the same shape. Yet the vertical is **implicitly visible** (Polymarket on the wall, Limitless has a case study) but **not explicitly named** anywhere a prediction-market builder would search for it. This audit names the gap, attributes it to §2 pain-map cells, and proposes the dual-fix sketch.

---

## §2 What's There Now

- **Customer wall.** Polymarket and Limitless logos are present. They appear alongside DeFi protocols (Sablier, Velodrome, etc.) without segment labelling. A prediction-market builder looking at the wall sees logos; they don't see "prediction-markets-shaped customers run Envio at this scale."
- **Polymarket case study.** Exists. Names the 4B-events scale. Surfaces the analytics workload. Today it functions as a credibility asset — *"look at the volume Envio handles"* — but not as a vertical-positioning asset that says *"if you're building a prediction market, here's the architecture."* The same study could carry both jobs; today it carries the first only.
- **Limitless treatment.** Mentioned in playbook §4 as a daily-market product on Base; no published architectural review. Quarterly architectural check-in is the named play to surface a Dedicated-tier conversation when leaderboard query latency becomes visible.
- **Top-of-funnel content.** No prediction-markets-named landing page. No prediction-markets-content track. No "what kind of protocol are you building?" entry-point that routes prediction-market prospects to the matching template (the template doesn't exist yet — see [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md)).
- **Tier names.** "Dedicated tier" is generic. For a prediction-market builder whose product *is* leaderboards + market analytics + historical reporting, the upgrade case is structurally easy — but the tier-positioning copy doesn't speak the customer's language.
- **Growth plan reference.** [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) names prediction markets as one of three vertical content tracks. The intent is set; the execution is not yet shipped.

---

## §3 What's Missing / Friction (Mapped to §2 Cells)

- **Acquisition × Business [PM].** Prediction Markets is implicitly visible but not explicitly named as a target segment. A prediction-market builder Googling for indexing infrastructure does not encounter PM-shaped marketing.
- **Acquisition × Tech [PM].** The marketing language is DeFi-default. The prediction-market builder reads it and assumes the product is for someone else, even when the architectural fit is excellent. ([ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) §4.)
- **Monetization × Business [PM].** Tier-up case isn't made in the prediction-market builder's language. "Dedicated tier" sounds generic; "leaderboard tier" sounds inevitable.
- **Activation × Business [PM].** Generic onboarding doesn't acknowledge the vertical's distinct activation path (market shape modelling). All prospects get the same flow regardless of whether they're building DEX volume aggregation or prediction-market settlement.
- **Retention × Business [PM].** No structured PM-specific check-in cadence. The Polymarket case study could be refreshed annually; the Limitless quarterly check-in isn't yet running.

---

## §4 Proposed Shifts (Dual-Fix Per Cell)

| §2 Cell | Tech move | Business move |
|---|---|---|
| Acquisition × Business [PM] | Pin Polymarket case study + Limitless quarterly review as anchor evidence on a new prediction-markets landing page | Name prediction markets as a first-class vertical in customer-facing copy. Ship a prediction-markets-content track |
| Acquisition × Tech [PM] | Prediction-markets indexer template ([ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md)) is the call-to-action on the new landing page | Content that prediction-market builders Google when they're about to start building — settlement architecture, leaderboard design patterns, oracle resolution. SEO-shaped, not feature-shaped |
| Monetization × Business [PM] | Per-tier feature matrix for the PM workload — leaderboard refresh-every-minute, settlement-correction handling, oracle history retention | Position Dedicated explicitly as **the leaderboard tier** in PM-vertical copy. The tier name carries the value cue |
| Activation × Business [PM] | Route PM prospects from the vertical landing page to the PM template directly | A 2-month Production trial structure attached to the template. Trial converts to Production tier when leaderboard volume crosses a threshold |
| Retention × Business [PM] | Per-account architectural health note covering settlement integrity + leaderboard query latency | Quarterly architectural check-in cadence with Polymarket and Limitless. Annual case-study refresh on Polymarket |

---

## §5 Direct-Outreach Campaign — Wave-2 PM Builders (~10)

The §4 playbook names a "direct-outreach campaign to the next wave of prediction-market builders — the daily-market platforms, sports-prediction protocols, opinion markets, governance-markets-on-protocols." The shape of that list:

- **Daily-market platforms** — wave-2 alongside Limitless.
- **Sports-prediction protocols** — settlement-heavy, oracle-heavy.
- **Opinion markets** — high market-creation rate, intra-product expansion.
- **Governance markets** — protocol-DAO native, embed inside existing DeFi protocols.

Each gets custom outreach grounded in the specific event-shape they need to index. The PM template + 2-month Production trial is the attachment.

---

## §6 Named Monetization Plays — Existing PM Accounts

(From [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) §4, restated here for the audit's record:)

- **Polymarket** — 4B events on Polygon. The play is converting the existing case study into a vertical-positioning anchor. Dedicated-tier conversation grounded in the published architecture.
- **Limitless** — daily-market product on Base. The play is a quarterly architectural check-in as their volume scales, with the Dedicated tier conversation queued for the moment leaderboard query latency becomes visible.
- **Net-new wave-2 (~10 builders)** — custom-shaped indexer template offer + a 2-month Production trial.

---

## §7 Why This Vertical Has Highest Funnel-To-ACV Velocity

The §4 playbook makes a structural claim worth restating: **prediction markets has the highest funnel-to-ACV velocity of any vertical on the customer wall** because the customer's product workload is structurally analytics. Every successful prediction market is a Dedicated-tier conversation in waiting. The mechanism: ship the vertical-specific template + content track → attract the next generation of PM builders → activate them with the analytics-grade architecture from day one → land them on Production with a clear Dedicated upgrade path → upgrade them as their leaderboard volume scales. That's why this vertical is the proposed primary 90-day cohort in §8 of the playbook.

---

## §8 What This Audit Doesn't Address

The technical event shapes and query patterns — settlement, oracle resolution, payout, leaderboard rollups — live in the paired audit: [ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md](./ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md).

---

> **Cell:** Acquisition × Business [PM]; Acquisition × Tech [PM]; Monetization × Business [PM]; Activation × Business [PM]; Retention × Business [PM]
> **Revenue mechanism:** Net-new acquisition (Acquisition + Activation cells) + tier-up to Dedicated as "the leaderboard tier" (Monetization × Business) + retention/expansion via structured cadence (Retention × Business)
> **Named accounts:** Polymarket (4B events; case-study leverage), Limitless (Base, quarterly check-in target), PM wave-2 (~10 builders)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md](./ENVIO_PREDICTION_MARKETS_TECH_DIAGNOSTIC.md), [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md)

— Kaustubh
