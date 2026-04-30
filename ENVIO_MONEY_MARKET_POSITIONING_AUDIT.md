# Money-Market Positioning Audit — Whether Money Market Is A Named Vertical Anywhere Customer-Facing Today

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) · [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Week-One commitment from §8 of the playbook (extended to the money-market vertical): a one-page positioning audit on whether money market is a named vertical in any customer-facing surface today, with proposed treatment as a first-class vertical going forward. Paired with [`ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md`](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md).*

---

## §1 Frame

Money market is the third of four DeFi shapes named in §3 of the playbook ("DEX, perp, money market, execution layer"). Aave V3 alone has multi-chain TVL well above $10B — it's structurally a major vertical. Yet money market is **even less explicit on Envio's customer-facing surface** than prediction markets was — there's no money-market-named landing page, no money-market-content track, no Aave / Compound / Spark / Morpho on the customer wall (visible). This audit names the gap, attributes it to §2 pain-map cells, and proposes the dual-fix sketch.

---

## §2 What's There Now

- **Customer wall.** No money-market protocols visible. The closest signals are LI.FI (cross-chain bridge volume reporting) and Beefy (yield aggregator), both DeFi-adjacent but not money-market-native.
- **Tier names.** "Production Small / Medium / Large / Dedicated" — generic. Money-market protocol engineers reading the tier matrix have to translate "Dedicated" into "for our risk-dashboard, liquidator-leaderboard, utilization-curve workload" mentally.
- **Top-of-funnel content.** No money-market-named landing page. No money-market-content track. Aave / Compound / Spark / Morpho engineers Googling for indexing infrastructure don't encounter Envio-specific positioning for their workload.
- **Partner channels.** No co-marketing with risk-monitoring tools (Gauntlet, Chaos Labs, Llama Risk), with money-market governance teams, or with the BD layer of the protocols themselves.
- **Case studies.** None. Money market is the most under-marketed major vertical relative to its TVL — bigger gap than the prediction-markets gap was prior to Envio's polymarket-v2-indexer ship.

---

## §3 What's Missing / Friction (Mapped to §2 Cells)

- **Acquisition × Business root cause.** Money market is **invisible** as a target segment in current Envio marketing. A money-market protocol engineer searching for indexing infrastructure encounters DeFi-default messaging and assumes the product is for someone else.
- **Acquisition × Tech root cause.** No money-market-shaped onboarding path. Generic indexer marketing speaks to "real-time data" rather than "liquidator leaderboards" or "utilization curves."
- **Monetization × Business root cause.** Tier-up case for money-market workload isn't made in the customer's language. "Dedicated tier" sounds generic; "the risk-dashboard tier" sounds inevitable for a risk-monitoring product.
- **Activation × Business root cause.** Generic onboarding doesn't acknowledge the vertical's distinct activation path (Pool-singleton + lazy reserve creation + dual-reserve liquidation handling).
- **Retention × Business root cause.** No money-market-specific check-in cadence — yet to be built since there are no anchor accounts.

---

## §4 Proposed Shifts (Dual-Fix Per Cell)

| §2 Cell | Tech move | Business move |
|---|---|---|
| Acquisition × Business | Money-market template ([`ENVIO_MONEY_MARKET_TEMPLATE.md`](./ENVIO_MONEY_MARKET_TEMPLATE.md)) is the call-to-action on a new money-market-vertical landing page | Name money market as a first-class vertical in customer-facing copy. Ship a money-market-content track |
| Acquisition × Tech | Vertical landing page anchored to the template + the [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md) docs | Co-marketing motion with risk-monitoring tools (Gauntlet, Chaos Labs, Llama Risk) — Envio positioned as the indexing partner for their workload |
| Monetization × Business | Per-tier feature matrix called out for money-market workload (utilization-curve scale, liquidator leaderboards, multi-asset reserve sprawl) | Position Dedicated explicitly as **the risk-dashboard tier** in money-market-vertical copy |
| Activation × Business | Route money-market prospects from the vertical landing page to the template directly | A 2-month Production trial structure attached to the template; converts to Production tier when utilization-curve volume crosses a threshold |
| Retention × Business | Per-account architectural health note (post-acquisition) covering utilization-query latency + liquidator-leaderboard freshness | Quarterly architectural check-in cadence with money-market anchor accounts (initially: 2-3 protocols brought in via Acquisition shifts above) |

---

## §5 Direct-Outreach Campaign — Money-Market Builder Wave-1 (~10 Protocols)

The §3 playbook (rewritten with money market as the §4 worked example) names "a direct-outreach campaign to the money-market protocols." The shape of that list:

- **Aave-fork protocols** — Spark, Hyperdrive, dForce. Same event surface as Aave; template runs on each with a config change.
- **Compound-fork protocols** — Sonne, Moonwell. Different per-base-asset shape but same primitives.
- **Hybrid / aggregator protocols** — Morpho (Aave + Compound), Yearn V3 (multi-protocol). Demonstrates multi-source indexing.
- **L2-native money markets** — Aurelius (Mode), Sturdy (Sonic). Smaller TVL but high engagement.

Each gets one-page custom outreach grounded in their actual on-chain footprint: their reserve count, their liquidation volume estimate, the specific Envio capability that solves their hardest indexing problem.

---

## §6 Why Money Market Is The Strongest Replacement Vertical For PM

The §4 playbook (rewritten) makes the structural claim: **money market has higher TVL-weighted analytical-query density than any other DeFi vertical**, including DEX volume aggregation. Reasons:

1. **Risk dashboards are first-class products.** Every Aave-shape protocol ships at least one risk-monitoring product (Aave's own dashboard, Gauntlet's external one, Chaos Labs' integrations). The analytics workload IS the product.
2. **Liquidator leaderboards are governance-relevant.** Liquidator efficiency directly affects protocol health; protocols pay attention to the leaderboard data quality.
3. **Multi-chain footprint maxes out.** Aave is on 6+ chains; expansion ARR per account is structurally significant.
4. **Polymarket-vertical was lost** — Envio ships polymarket-v2-indexer in production, so the PM vertical is owned. Money market fills the gap with a comparable analytics-as-product structure but no current Envio-team production indexer.

The funnel-to-ACV velocity should be comparable to (or better than) PM was, and the candidate-team opportunity is greater because the vertical is freshly opened.

---

## §7 What This Audit Doesn't Address

The technical patterns — Pool-singleton dynamic-registration, scaled-balance convention, dual-reserve liquidation handling — live in the paired audit: [`ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md`](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md).

---

> **Cell:** Acquisition × Business [DeFi/money-market]; Acquisition × Tech [DeFi/money-market]; Monetization × Business [DeFi/money-market]; Activation × Business [DeFi/money-market]; Retention × Business [DeFi/money-market]
> **Revenue mechanism:** Net-new acquisition (Acquisition + Activation cells) + tier-up to Dedicated as "the risk-dashboard tier" (Monetization × Business)
> **Named accounts:** Aave (mainnet/L2s, TVL leader), Compound V3, Spark (Aave fork), Morpho (multi-protocol consumer), money-market wave-2 (~10 protocols)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md), [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md), [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md)

— Kaustubh
