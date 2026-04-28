# Envio Growth Engineer — 90-Day Operating Plan

**From:** Kaustubh Agrawal — incoming Growth Engineer
**Role:** Growth Engineer (Remote, Full-time)
**Date:** 2026-04-29
**Purpose:** Operational companion to the [strategy memo](./ENVIO_REVENUE_MODEL.md) — what I'd actually do in the first 90 days, day by day
**Companion document:** [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md)

> *This is the operating plan that sits underneath the strategy memo. The memo argues the "why" and the five plays; this document argues the "when" and "in what order." Read it as a draft for our 1:1 to react to and refine, not a finished commitment.*

---

## 0. The Frame

Envio sells **fast indexing infrastructure**. Revenue grows when more developers ship production indexers on the hosted service and stay long enough to upgrade. So the Growth Engineer's revenue lever is not marketing — it's **time-to-first-working-indexer** and **time-to-production-confidence**.

Every initiative below is judged against one of three numbers:

1. **Activation rate** — % of new sign-ups that ship a working indexer within 7 days
2. **Conversion rate** — % of activated developers whose indexer reaches production traffic
3. **Retention/expansion** — % of production users who add a second chain, second indexer, or upgrade tier

If a piece of work doesn't move one of those, I won't propose it.

---

## 1. What I'm Bringing In On Day One

I've effectively done the unpaid version of this job for the last several months as a customer. The grounding I'm bringing in:

- **Built a real production-grade indexer on HyperIndex** ([Mirror Protocol](https://mirror-protocol-nine.vercel.app)) — 7 entities, multi-event handlers, real Sepolia traffic, ~140+ indexed trades, deployed via the hosted service on `envio-deploy-sepolia`
- **Wrote a public technical blog** that Jordy reviewed and approved — the article frames the data-indexing problem and HyperIndex's solution in builder-honest language, not marketing copy. [Live on Medium](https://medium.com/@kaushtubhagrawal45/the-data-indexing-problem-that-almost-killed-mirror-protocol-and-how-envio-hyperindex-saved-it-80edab044c9e)
- **Promoted Envio across X and LinkedIn** with thread/post versions of that story — already exposed Envio's value prop to my technical network
- **Pivoted from Monad to Sepolia** when the Monad testnet wiped state — exactly the kind of "client unblocks themselves with a config change" story that's worth telling on prospect calls

I am, in effect, **case study #1 of the role we've been talking about**: a developer who came to Envio with a real product, hit friction, got unstuck, shipped, and now evangelises. Every plan below is informed by that lived experience.

---

## 2. The Three Revenue Levers — and Where I Plug In

| Lever | What grows it | My contribution |
|---|---|---|
| **Acquisition** | More developers discover and try Envio | Public proof-of-concepts, conference demos, thought-leadership content, partner co-builds |
| **Activation** | More trials become working indexers | Boilerplate templates, "first 30 minutes" docs, white-glove onboarding for top prospects |
| **Expansion** | Production users grow account value | Multi-chain migration playbooks, performance audit service, partner integration kits |

The first 90 days are heavily weighted toward **activation** because that's where I'd have the most leverage coming in fresh — I just lived the new-user journey, I know exactly which steps lost me time, and the fixes are concrete and ownable.

---

## 3. The 90-Day Revenue Plan

### Days 1–30: Listen, Audit, Ship One Win

**Goal:** Establish credibility internally and ship one user-visible win that measurably moves activation.

**What I do:**

1. **Shadow 5 sales/customer calls in week 1.** Take notes on the *specific* technical questions prospects ask, the points where they hesitate, and the moments they say "wait, can it do X?" These are gold for content prioritization.
2. **Audit the current onboarding funnel end-to-end.** Sign up as a new user with a fresh email. Time every step. Document every friction point. Compare against my Mirror Protocol onboarding memory — what's improved, what's the same, what's worse.
3. **Audit the existing template/example library.** Which templates exist? Which use cases are *missing* templates? (My bet: there's no good "trading-bot-style indexer" template — the kind I'd built. There's likely no good "real-time dashboard" template either.)
4. **Ship one new boilerplate template.** Most likely candidate: a **"DeFi execution + analytics" template** modeled on Mirror Protocol — TradeExecution + PoolSwap entities joined by txHash, a SystemMetrics aggregator, a working executor-bot reference. Reusable for any team building automated DeFi infrastructure.
5. **Ghostwrite or co-write one technical blog from a current customer's perspective.** Pick a customer who's shipped recently, interview them for 30 minutes, write the case study. Customer gets free distribution; Envio gets a credible third-party voice.

**Metrics I'd commit to by day 30:**
- Onboarding audit doc shipped to product/sales
- 1 new template merged into the example repo
- 1 customer case study published
- Notes from ≥5 sales calls turned into a "frequently-blocked-on" prioritization list

---

### Days 31–60: Build the Distribution Engine

**Goal:** Turn the activation work into a repeatable system, not a one-off.

**What I build:**

1. **The "First Indexer in 30 Minutes" speed-run.** A literal Loom video + companion repo + step-by-step doc that takes a developer from `npx envio init` to a deployed hosted indexer with one real entity in under 30 minutes. This becomes the **single artifact every sales call links to**. I'd version this every quarter.

2. **A "framework migration" playbook.** Migration moments are when teams are most willing to switch indexers — they're already mid-rip-out. The independent benchmark numbers Envio cites are a marketing weapon, but most prospective migrators don't move because they don't know *how*. I'd build:
   - A side-by-side translation guide: legacy subgraph manifest → `config.yaml`, AssemblyScript handler → TypeScript handler, schema mapping
   - A migration script that does 80% of the conversion automatically
   - A "we'll migrate it for you" white-glove offer for the highest-priority migration prospects, paired with the existing 2-months-free hosted-service offer

3. **A "stuck developer" rapid-response playbook.** Audit Discord and GitHub issues. Identify the top 10 recurring issues. Write a canonical fix for each, link them in pinned messages. Fewer support tickets, faster unblocks, happier prospects. **This directly compounds — every fix written today saves time forever.**

4. **The "performance audit" service.** Pitch internally: any prospect on the fence gets a free 1-hour performance audit of their current indexing setup, where I show them the projected speedup on Envio. Concrete numbers from their data, not abstract benchmarks. This converts the "is it really faster for *my* use case" objection into a closed deal.

**Metrics I'd commit to by day 60:**
- Speed-run artifact live, shared in every sales call
- ≥3 Graph migrations completed (or in progress) with measured query latency improvement
- Top 10 recurring issues documented with canonical fixes
- ≥5 performance audits delivered to active prospects

---

### Days 61–90: Compound the Inputs

**Goal:** Turn the work from days 1–60 into a flywheel that other people on the team can run.

**What I scale:**

1. **The case study factory.** By day 90 I want a repeatable process where every customer who ships a working production indexer gets a case-study interview within 2 weeks. Each case study lives as: a blog post, a Twitter/X thread, a LinkedIn post, a Discord pinned showcase, and a 60-second Loom. **One customer = five distribution units.**

2. **The "Envio for [vertical]" content tracks.** Three content tracks targeting three high-value verticals:
   - **DeFi** (trading bots, analytics dashboards, protocol monitoring) — I have lived experience here
   - **Prediction markets and onchain probability products** — anchored to existing case studies on the customer wall
   - **L2 / rollup infrastructure analytics** — multi-chain aggregation as the core use case rather than a nice-to-have
   Each track gets one canonical demo repo + one technical deep-dive + one fortnightly field report.

3. **The partner-integration kit.** Pre-built integrations with the top 5 frontend frameworks and SDKs developers are already using — wagmi, viem, RainbowKit, Reown/AppKit, and one major chain SDK. Each is a 30-line example that drops Envio's GraphQL endpoint into a familiar wagmi/viem flow. This kills the "but how does it fit my stack?" objection at the source.

4. **A "growth dashboard" I run weekly.** Single Notion page tracking: new sign-ups → activation → first deploy → production traffic → expansion. Public to the team. Forces the org to look at the funnel every week.

**Metrics I'd commit to by day 90:**
- Case study factory producing ≥1 published study/week
- 3 vertical content tracks with at least one canonical asset each
- 5 partner-integration examples shipped
- Weekly growth dashboard live with the full team subscribed

---

## 4. The Big Bets (Months 4–12)

These are higher-risk, higher-leverage moves I'd want to propose once the first-90-day work is producing signal. Listed here so they're on your radar from the start, not because I'd commit to them on day one.

### Bet 1: The Conference Demo Circuit

Do 4–6 hackathon and conference demos in 2026. At each one, I ship a *new* live demo built end-to-end on Envio in front of the audience. Recorded. Re-distributed. The model is "watch me build a working indexer from `envio init` to deployed in 25 minutes, on stage." This converts more dev mindshare than any blog post.

### Bet 2: The "Indexer-as-a-Product" Bundle

Most Envio customers build their indexer + their frontend separately. What if Envio shipped **opinionated full-stack starters** — indexer + Next.js dashboard + auth + deploy — that get a team from zero to a live monitoring dashboard in an hour? I'd build the first one (DeFi execution dashboard, modeled on Mirror Protocol), measure adoption, and propose this as a productized service line.

### Bet 3: The Migration-as-a-Service Pricing Tier

If the migration playbook works, productize it. A "we migrate your indexer in 5 days, you keep the speedup" offering with a fixed price. This is direct revenue, and it captures the long tail of prospective migrators who'd switch but don't have the engineering hours to do it themselves.

### Bet 4: The Partner Co-Marketing Playbook

I'd build co-branded content with chains and L2s where Envio is the canonical indexer. "Indexing on [Chain X] in 10 minutes" with the chain team's logo on it. Cheap content for them, qualified leads for us, more chains on the supported list.

---

## 5. How I'd Want To Be Measured

I'd rather be measured against numbers than against vibes. The targets below are a starting point for our discussion — I'd want us to set them jointly in week one once I have access to Envio's actual baselines.

| Quarter | KPI | Starting target |
|---|---|---|
| Q1 (days 1–90) | Onboarding activation rate (sign-up → working indexer in 7 days) | measurable lift vs. day-1 baseline |
| Q1 | Sales-cycle length on technical-eval deals | measurable reduction vs. day-1 baseline |
| Q1 | Discord/GitHub support response time on integration issues | <4 hours median |
| Q2 | Net-new production indexers shipped (attribution: Growth) | credible cadence target set jointly |
| Q2 | Migrations completed and case-studied | credible cadence target set jointly |
| Q3 | Customer-attributed revenue from case studies, demos, and content | tracked + reported monthly |
| Q4 | Vertical-track-attributed pipeline | each of the three tracks contributing measurable pipeline |

If a quarter goes by and the targets are missed materially, I'd want that to be an explicit conversation. The point of measurable goals isn't a fire-me trip-wire; it's to produce useful early signal so we can recalibrate together.

---

## 6. The Stack I'm Coming In With

A quick reference for the team — what I can do unsupervised from day one, and what I'd want to ramp on.

**Already fluent in (no ramp needed):**
- TypeScript across the full stack — Envio handlers, frontend, executor-bot patterns
- Solidity contracts; Foundry and Hardhat tooling
- viem / ethers / wagmi for wallet and chain integration
- MetaMask Delegation Toolkit, Smart Accounts, real-DEX integration (Uniswap V2 on Sepolia)
- Envio HyperIndex itself — config, schema, event handlers, hosted-service deploy flow
- Builder-voice technical writing — the Medium piece is the bar, Jordy reviewed it
- Distribution on X and LinkedIn to a technical audience
- Docker and GitHub Actions, used in the Mirror Protocol stack

**Things I'd actively ramp on in month one:**
- Enterprise sales motion — I've never run a 6-month enterprise cycle and I want to shadow the team relentlessly here
- Multi-team coordination at scale — solo-builder muscle is different from cross-functional product/sales/CS choreography
- Internal data: customer-by-customer health, ARR by tier, real free-tier sign-up volume, the actual conversion-rate baselines I've been triangulating from the outside

The case is simple: **I am the customer Envio wants to attract, and I converted myself.** Now I want to do that for hundreds of others.

---

## 7. What I'd Want From The Team

Three things, in priority order, that would let me move fastest in the first 90 days:

1. **Clear ownership of the activation funnel.** Templates, the speed-run artefact, the "stuck developer" rapid-response playbook — these all need a single owner, and I'd like to be it.
2. **A quarterly review against the KPIs in section 5.** Not as a fire-me trip-wire, but as a structured forum where we look at the numbers together and decide what to double down on, what to drop, what's missing.
3. **A seat in product conversations.** I'll be gathering field signal from prospects and customers daily; that signal is most valuable when it actually shapes what gets shipped. I don't need to drive the roadmap — I just want a reliable path for the most important field observations to land in front of whoever does.

In return: I'd hit the ground building from week one because I already speak both languages — I can walk a sales call through a technical evaluation, and I can write the GraphQL handler that closes it the next day. I'd be honest about what I don't know yet (specifically: enterprise sales motion, multi-team coordination at scale), and I'd ramp on those by shadowing the team in month one rather than pretending otherwise.

---

## 8. The Companion Strategy Memo

The "why" behind the operating plan in this document — the strategic frame, the five-play playbook, the proof-of-execution narrative — lives in its own file:

➡️ **[ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md)**

It's deliberately Envio-only — no competitor comparisons, no dollar projections at Envio's business — and grounded in lived experience as a customer rather than abstract strategy. It uses Mirror Protocol as the proof-of-execution case and proposes five plays: time-to-first-indexer compression, a Migration Concierge practice, a case-study production engine, vertical-anchored content tracks, and a structured expansion cadence on existing accounts.

This document is the operational layer underneath that strategy: the day-by-day, week-by-week version. Read together, the two documents give a complete picture of how I'd think about the role and how I'd actually spend the first 90 days.

---

## 9. Appendix — What's Ready On Day One

These are already built, sitting on my disk, ready to ship from week one:

1. **The Mirror Protocol case study** — written, published, reviewed by Jordy. Ready to be repackaged as Envio's first DeFi-execution case study.
2. **The Mirror Protocol indexer config** — open-source, can be cleaned up into a "DeFi execution dashboard" template within a week.
3. **My X / LinkedIn distribution network** — a few thousand technical followers, mostly builders. Free top-of-funnel for any case study or demo I publish.
4. **A list of 20+ DeFi / infra teams** I've been talking to or am aware of who aren't yet on Envio. This becomes my warm-outbound list in week one.

---

**GitHub:** https://github.com/kaustubh76
**Mirror Protocol (live):** https://mirror-protocol-nine.vercel.app
**Blog:** https://medium.com/@kaushtubhagrawal45/the-data-indexing-problem-that-almost-killed-mirror-protocol-and-how-envio-hyperindex-saved-it-80edab044c9e

Looking forward to the conversation.

— Kaustubh
