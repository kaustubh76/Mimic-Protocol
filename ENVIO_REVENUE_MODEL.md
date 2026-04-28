# Envio Growth Memo — A Builder's Playbook

**From:** Kaustubh Agrawal — incoming Growth Engineer
**Date:** April 2026
**Purpose:** Pre-start planning brief for our 1:1 discussion
**Companion document:** [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md)

---

## TL;DR

**Thesis.** Envio's product is winning on the specs that matter. The next bottleneck is the gap between *"developer is curious"* and *"developer is paying."* Closing that gap is a craft, and these are the first five plays I'd run to close it.

**What I bring as proof.** I shipped a real product (Mirror Protocol — live, open-source, indexed on Envio's hosted service) end-to-end as a customer first. I wrote and published the case study. Jordy reviewed it. I'm already distributing for Envio on X and LinkedIn unprompted.

**The five plays, named.**
1. **Compress time-to-first-working-indexer** — a 30-minute pillar artefact that becomes the gravitational centre of activation
2. **Own the migration moment** — a Migration Concierge practice with a translation guide, a script, and human-led white-glove delivery
3. **A case-study production engine** — five distribution units per customer interview, on a quarterly cadence
4. **Vertical-anchored content tracks** — DeFi execution, prediction markets, L2 analytics; depth over breadth
5. **Expansion at existing accounts** — quarterly technical health checks paired with multi-chain template paving

**Sequencing.** Week 1: listen, audit, replace assumptions with internal data. Weeks 2–4: ship the time-to-first-indexer artefact. Weeks 5–8: stand up Migration Concierge. Months 2–3: first case study under my watch. Months 4–12: all five plays in motion.

**What I want from this conversation.** Pressure-test the priorities, agree on what week 1 looks like, set joint measurement targets. The plan in this memo is a starting point, not a contract — I'd rather walk out of our discussion with a v1 we both feel good about than defend a first draft.

---

> *This is the pre-start brief I'd put in front of you for our planning conversation. It's a working draft, not a finished plan — the goal is to give us something concrete to react to and refine together.*
>
> *Some of what's below will be obvious to you, some will be wrong, and some you'll have already tried. I've worked from the public surface of Envio I had access to as a customer; you have all the context I don't. I'd rather show up with a real first draft and update it aggressively than walk in empty-handed.*

---

## Why This Memo Exists

Envio's product wins on the specs that matter. The hosted service is shipping. The case studies are real. The customer wall already includes household names in DeFi infrastructure. The technical bet has been made and it's paying off.

The next bottleneck isn't engineering. It's the gap between **"developer is curious"** and **"developer is paying."** Closing that gap is a craft, and it's the craft I want to bring to the team.

I've spent the last several months living the new-user journey at Envio — not as an evaluator, but as a developer who genuinely needed indexing infrastructure to ship a product. That product is Mirror Protocol. I built it on Sepolia, indexed it on Envio's hosted service, wrote the case study, got it reviewed by Jordy, and shipped it across X and LinkedIn. That whole arc is the grounding I'm bringing into the role: I am case study #1 of the role we've been talking about. I converted myself.

This memo turns that lived experience into five concrete plays I want to walk through with you.

---

## Part 1 — Mirror Protocol as Proof of Execution

Before any of the forward strategy lands, I want to anchor the conversation in what I've actually shipped, because every play in Part 2 is grounded in something I personally went through. Skip this section if we've already covered it; it's here so the document stands on its own for anyone else on the team reading it cold.

### The product
Mirror Protocol is a behavioural-DeFi product on Ethereum Sepolia. Trader strategies are minted as NFTs. Other users delegate capital to those NFTs through MetaMask Smart Accounts. An executor bot polls every 5 seconds, validates trigger conditions, and fires real Uniswap V2 swaps when patterns hit. It's live, it's open-source, and it has indexed real on-chain trades.

- Live demo (no wallet needed): https://mirror-protocol-nine.vercel.app
- Source: https://github.com/kaustubh76/Mimic-Protocol
- Published case study: [Medium](https://medium.com/@kaushtubhagrawal45/the-data-indexing-problem-that-almost-killed-mirror-protocol-and-how-envio-hyperindex-saved-it-80edab044c9e)

### The journey, mapped to your funnel

I'll walk it stage-by-stage because each stage is a place where I have specific, lived observations about what worked, what was friction, and what I'd want to fix. These observations are the raw material the rest of the memo is built on.

**Discovery.** I found Envio through a benchmark comparison while looking for a faster alternative to RPC polling. The independent benchmark numbers Envio cites were the hook; the speed of `npx envio init` was what made me try it.

**First indexer.** I was up and running locally faster than I expected. The mental model — `config.yaml` for chains and contracts, `schema.graphql` for entities, `EventHandlers.ts` for logic — was familiar in a way that other indexers I'd looked at weren't. AssemblyScript constraints elsewhere had been a non-starter. Plain TypeScript with full npm access let me ship in hours instead of days.

**Multi-event modelling.** Mirror Protocol's index ended up with seven entities — Pattern, Delegation, TradeExecution, PoolSwap, SystemMetrics, Delegator, Event — and two source contracts plus the underlying Uniswap V2 pair. The thing that mattered most here was being able to *join* the engine's `TradeExecuted` event with the adapter's `Swap` event by transaction hash, and present that joined view as a single GraphQL query to the frontend. That join is what made the live trade feed feel real instead of synthetic.

**Hosted deployment.** Pushed to a deploy branch, the service redeployed atomically. The endpoint URL embeds the build hash, which I appreciated for being able to pin the frontend to a known schema version. From config-edit to live endpoint took minutes.

**Production traffic.** The executor bot polls Envio every 5 seconds. Each poll returns the joined view of every active delegation and its pattern's metrics in single-digit milliseconds. The bot's full decision cycle — poll, validate, build tx, broadcast — runs under two seconds, and most of that two seconds is the actual blockchain transaction broadcast. The data layer stopped being the bottleneck.

**Case study and distribution.** I wrote a builder-honest blog about the journey, including the part where my first version of the bot used direct RPC calls and was effectively dead on arrival at four-second decision latency. Jordy reviewed it, flagged the HyperSync vs HyperIndex framing, the chain-count update, the "real-time" phrasing match, and suggested an external credibility anchor — all of which I incorporated. The piece is now live on Medium and I've distributed shorter versions on X and LinkedIn.

### What this gives me on day one

- **I've completed the full funnel as a customer** — sign-up to working indexer to production traffic to public case study. That's the experience I'd bring on day one, with very specific memories of where the friction was.
- **I know where the friction is**, because I lived it — I lost time on the wrong indexing pattern before finding the right one, and I have specific notes on what would have shortened that cycle.
- **I can produce case-study content at the bar Envio sets**, because Jordy already reviewed and approved the one I shipped.
- **I've already started distributing for Envio unprompted.** The X thread and LinkedIn post are live and generating top-of-funnel right now.

The rest of this memo turns those observations into a forward plan.

---

## Part 2 — Five Plays for the Next Twelve Months

Each play has the same shape: **the observation** (what I noticed, usually anchored in Mirror Protocol), **the mechanic** (what I'd build or do), **the customer profile it bites on**, and **how I'd know it's working**. No specific dollar projections — those depend on Envio's internal numbers, which I'd want to anchor in week one rather than guess at. The goal of going through these together is to converge on a v1 sequence we both feel good about by the end of our discussion.

### Play 1 — Compress Time-to-First-Working-Indexer

**The observation.** The single biggest predictor of whether a developer becomes a paying Envio customer is whether they shipped a working indexer in their first session. If they got stuck for an hour and walked away, they're not coming back. If they got something working in 30 minutes, they're going to push it further. I felt this myself: my first hour with Envio decided the next three months of my product.

The dev-tools playbooks I respect most — the Stripe and Postman canon — all point to the same mechanic: collapse the time between *sign-up* and *aha moment* into one short session. The benchmark cited everywhere is around 5–15 minutes for the core workflow. Indexing is more complex than payments or API testing, but the principle holds.

**The mechanic.**

A "First Indexer in 30 Minutes" pillar artefact. Three components, all owned by the Growth Engineer:

1. A short Loom-style video walking from `npx envio init` to a deployed hosted indexer with one real entity. Ideally re-shot every quarter so it never goes stale.
2. A companion repo that mirrors the video, line by line. Forkable. Deployable in two clicks.
3. A "what to do next" guide. The 30-minute version gets you to one entity; the next 30 minutes gets you to multi-event handlers, joins, and Effect API. That second guide is the upsell to mid-market.

This single asset becomes the thing every sales call links to, every Discord answer points at, every blog ends with. It's the gravitational centre of activation.

**Customer profile it bites on.** Hobbyists, hackathon teams, and self-serve mid-market protocols. People who sign up, click around, and either succeed or bounce. The activation lever is widest at the bottom of the funnel, which is exactly why it gets funded first.

**How I'd know it's working.** Free-trial → working-indexer rate within seven days of sign-up. I'd want to instrument this if it isn't already, baseline it in week one, and target a measurable lift by day 90.

### Play 2 — Own the Migration Moment

**The observation.** When a team is *migrating* indexers, they are *the most willing they will ever be* to switch vendors. They're already mid-rip-out. The question is who they land on. Envio has a structural advantage in migration moments because the framework speaks plain TypeScript and produces a Hasura-style GraphQL endpoint that any frontend already knows how to consume — but the *experience* of migrating still requires real human help, and that's where the Growth Engineer earns their keep.

I lived a version of this myself. Mirror Protocol started on Monad testnet. Monad wiped state. Every DEX I'd integrated against became a no-code address overnight. I had to migrate the entire stack to Sepolia, including the indexer, in about a week. The migration was painful in the contract layer; it was almost pleasant in the indexer layer. The reason it was pleasant is that Envio's config-driven model meant the indexer was a few file edits, not a re-architecture.

**The mechanic.**

A "Migration Concierge" practice, owned by Growth, with three layers:

1. **A self-serve translation guide.** Side-by-side mapping of common patterns from competing indexers into Envio's `config.yaml` + `schema.graphql` + `EventHandlers.ts`. Treat it like a translation dictionary. Mostly TypeScript-to-TypeScript at the handler layer, manifest-shape-to-config at the configuration layer.
2. **A migration script** that does the boring 80% automatically — manifest parsing, ABI ingestion, scaffolded handler stubs. The remaining 20% is the part where Growth steps in.
3. **A direct, human-led migration service** for high-value targets. Time-bound — a week of dedicated technical execution, paired with the existing white-glove and free-month offers, in exchange for a public case study at the end.

The script is the leverage. The script means one Growth Engineer can absorb 5× more migrations than they could doing each by hand. The case study at the end is the *output* that compounds — every migration becomes a sales asset that closes the next two.

**Customer profile it bites on.** Production teams who already have a working indexer somewhere else and a real reason to switch — speed, cost, framework constraints, or simply that their previous vendor sunset on them. These are the highest-intent customers in the funnel because the switching cost has already been paid mentally.

**How I'd know it's working.** Number of completed migrations per quarter, with each one producing a published case study within four weeks of go-live.

### Play 3 — A Case-Study Production Engine

**The observation.** The Polymarket case study is, structurally, Envio's most valuable sales asset. Four billion events synced in six days, eight subgraphs consolidated into one, real customer name on the page. Every prospect who reads it qualifies themselves: they either think *"oh, my volume is in that range"* or *"this is more serious than I need."* In both cases the case study has done the segmentation work for the sales motion.

The bottleneck isn't whether case studies work. It's whether they get *produced* on a consistent cadence. A case study every quarter is a different product than a case study every six months — the cadence creates the perception of momentum.

The pattern I'd borrow from the broader dev-tools world: case-study production should be *systemized*, not artisanal. Every customer who hits a defined milestone (e.g., production deployment with N events indexed, multi-chain expansion, migration completion) gets a Slack ping to my pipeline. Within 14 days they've been interviewed; within 30 they're published.

**The mechanic.**

A repeatable case-study factory. Five outputs per customer interview, not one:

1. A long-form technical write-up on the Envio blog
2. A condensed X thread with the headline numbers
3. A LinkedIn post from the customer's perspective (ghost-written, customer-approved, posted from their account if they're willing)
4. A 60-second Loom of the customer walking through their indexer
5. A short Discord pin in the relevant channel for ongoing reference

One customer interview, five distribution units. This is how a small team produces marketing leverage that looks like a much bigger team.

I'd add one piece of texture: every case study should include a "what I would have built without Envio" section. That's the section that lands with technical buyers, because it makes the alternative concrete. I wrote that section into my own Mirror Protocol case study and it was the part Jordy responded to most strongly during review.

**Customer profile it bites on.** Mid-market and enterprise. The signal a case study generates is *"this brand uses Envio for serious things"* — which is exactly the signal an enterprise procurement team is looking for. Hobbyists and self-serve users don't need case studies to convert; they need templates and docs.

**How I'd know it's working.** Pipeline attribution. Each case study should produce a measurable bump in inbound enterprise inquiries within 60 days of publication. If it doesn't, the case study wasn't sharp enough — that's a learning, not a failure.

### Play 4 — Vertical-Anchored Content Tracks

**The observation.** Envio's customer base spans multiple verticals — DeFi, prediction markets, cross-chain infrastructure, restaking, NFTs, gaming. Each vertical has its own technical idioms, its own buyer language, and its own search intent. A single piece of content tries to talk to all of them at once and lands with none of them.

The growth motion that separates breakout dev-tools companies from category-also-rans is *vertical concentration*. Pick three verticals, get genuinely fluent in each, and ship content that reads like it was written by someone in that vertical, not for them.

For Envio, the three I'd anchor on, in order:

- **DeFi (with a sub-focus on real-time execution dashboards)** — anchored to my own Mirror Protocol experience and to the Sablier / Velodrome / Aerodrome footprint already on the customer wall.
- **Prediction markets and onchain probability products** — anchored to the Polymarket and Limitless case studies that already exist.
- **L2 / rollup infrastructure analytics** — anchored to the Caldera + Bridgg-shape footprint, where multi-chain aggregation is the core use case rather than a nice-to-have.

**The mechanic.**

For each vertical: one canonical demo repo, one technical deep-dive blog, one comparison-style explainer (without naming competitors — instead framed as "indexing patterns we've seen in this vertical"), and one fortnightly technical post that lives somewhere between a tutorial and a field report. That's roughly twelve high-effort assets per vertical per year.

The demo repos do double duty as activation aids — a developer in the DeFi-execution vertical who finds my Mirror Protocol-shaped template can have something running locally in a single sitting.

**Customer profile it bites on.** Long-tail organic acquisition. This is the slowest-moving lever in the memo, but the one with the longest half-life. A blog post written well in 2026 will still be ranking for the right search terms in 2028.

**How I'd know it's working.** Content-attributed sign-ups, segmented by vertical. If after 6 months one vertical has produced 5× more sign-ups than the other two, that's a signal to double down on the winner rather than spread effort evenly.

### Play 5 — Expansion at Existing Accounts

**The observation.** The cheapest revenue any product ever earns is expansion revenue from a customer who already trusts the product. They're past the discovery phase, past the activation phase, past the trust-building phase. They just need a reason to buy more.

Envio's existing customer base has natural expansion paths. A protocol indexing one chain today will likely be on three chains in a year if their market expands. A protocol with one indexer today will likely have a second one as their product surface grows. A protocol on a Production Small tier will likely outgrow it as their event volume scales.

This is the lever where I'd be most embedded with the existing team — not generating my own pipeline, but supporting Customer Success on a structured cadence with existing accounts.

**The mechanic.**

A quarterly check-in cadence with each mid-market-and-above account, jointly with Customer Success. The check-in isn't a sales call — it's a *technical health check*. The Growth Engineer reviews the customer's indexer, suggests optimizations, flags upcoming features that would help them, and informally surfaces whether they're approaching a tier boundary or expanding to a new chain.

The output of these check-ins is a one-page internal note: how is the customer doing, what's their roadmap, where might they expand, what's blocking them. Over time these notes become the most accurate map of the customer base anyone at Envio has, and they make every renewal conversation one that the customer initiates rather than dreads.

I'd also build *expansion paving* into the templates — the multi-chain template should be the single easiest way to add chain #2 to an existing indexer, end-to-end. If the path from one chain to two is a single afternoon's work, expansion happens organically.

**Customer profile it bites on.** Existing paying accounts in the mid-market and enterprise tiers. This is where retention and expansion meet — the same effort serves both.

**How I'd know it's working.** Net revenue retention on the cohort I'm responsible for. The standard SaaS bar is 110%+; for a category leader with structural expansion paths, the realistic ceiling is closer to 130–150% NRR.

---

## Part 3 — Why These Five and Not Others

The five plays above were chosen because they share three properties:

1. **Each one is something I can personally execute on, end-to-end, in week one.** No play in the list requires hiring, requires another team's resources before it can ship, or requires the founders to redesign the product. The plays are leverage on what already exists.
2. **Each one has a measurable signal in less than 90 days.** I can be wrong about any of them, and the wrongness will be visible quickly. That's what makes them honest plays rather than aspirational ones.
3. **Each one compounds.** A migration becomes a case study becomes a vertical content asset becomes a template that drives activation that becomes a customer who eventually expands. The plays feed each other.

Things I deliberately excluded:

- **Bottom-of-funnel paid acquisition.** I don't think paid ads are the right move for an indexer at this stage. The buyer is too technical and the search intent too narrow. Better spend lives in case studies and templates.
- **Hackathon-circuit sponsorship as a primary play.** Web3 hackathons are useful for top-of-funnel exposure but the conversion rate from hackathon project to production customer is famously poor (industry conversion is in the single digits). Hackathons are something I'd participate in selectively — for the brand benefit and the live demos — not something I'd build the strategy around.
- **A grants program.** Grants programs work well for protocols with token incentives. Envio's economics are different. The team's energy is better spent on case studies and the Migration Concierge than on grant operations.
- **Conference circuit as a standalone play.** Conferences are useful for content production (live demo recordings) and for building the partner network, but they're not where revenue is closed. I'd treat them as content-engine inputs, not as a revenue lever.

I'd rather do five things well than nine things adequately, and I'd rather be honest about what I'm deprioritizing than hide it.

---

## Part 4 — How I'd Sequence This

When I start, the rough sequence I'd want to propose is:

**Week 1.** Listen mode. Shadow customer calls. Audit the existing onboarding funnel as a new user, with timing notes. Audit the existing template library — what's there, what's missing. Read every published case study end to end. Replace every assumption I've made in this memo with real internal data, and produce a v2 of this document grounded in actual numbers.

**Weeks 2–4.** Ship the "First Indexer in 30 Minutes" pillar artefact. This is the smallest piece of work that produces visible activation lift, and it earns me the right to do everything else.

**Weeks 5–8.** Stand up the Migration Concierge practice. Translation guide, migration script v0, named target list. Start direct outreach to high-priority migration prospects.

**Weeks 9–12.** Ship the first new case study under my watch. Doesn't have to be a Polymarket-sized whale; needs to be *crisp*. Use it to debug the case-study factory before scaling it.

**Months 4–6.** Vertical content tracks live. First multi-chain expansion playbook published. First completed migration case study live.

**Months 7–12.** All five plays in motion. Quarterly check-in cadence with mid-market accounts established. Second case study live. Migration Concierge producing on a regular cadence.

I've kept this honest about scope. A reasonable amount of work for a single Growth Engineer in the first quarter is one pillar artefact + one practice stood up + one case study shipped. Anything more is overpromising.

---

## Part 5 — How I'd Want To Be Measured

I'd rather be measured against numbers than against vibes. I'd want us to set the targets jointly in week one, but as a starting point for that conversation:

- Activation rate (sign-up → working indexer in seven days). Baseline in week 1, target a measurable lift by day 90.
- Sales-cycle compression on technical-eval deals. Baseline in week 1, target a meaningful reduction over the first half-year.
- Migrations completed and case-studied per quarter, with a credible cadence target.
- Net revenue retention on the cohort I'm responsible for, measured quarterly.
- Content-attributed sign-ups, segmented by vertical, with one vertical visibly winning by month six so we can double down on it.

If a quarter goes by and the targets are missed materially, I'd want that to be an explicit conversation. The point of measurable goals isn't to set up a fire-me trip-wire; it's to produce useful early signal so we can recalibrate together.

---

## Closing

Envio's product has done the hard part. The infrastructure works. The customers are real. The benchmark numbers are unreasonable in the right direction. What remains is the *craft* of converting interest into adoption and adoption into expansion — the quiet work that turns a category-leading product into a category-defining business.

That's the work I'm coming in to do. Mirror Protocol is proof I can execute the customer's side of it; this memo is the first cut at how I'd think about the team's side of it.

Now that we're talking about my first month, I'd want it to look more like listening and shipping than pitching. The plays in this memo are a starting point, not a contract. The right plan in month two is going to be different from this one because I'll have the internal data I'm currently missing — and I'd rather be the kind of hire who updates aggressively in the face of new information than one who defends their first draft.

Looking forward to the conversation.

— Kaustubh
