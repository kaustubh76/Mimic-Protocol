# Envio 1:1 Deck — 5 Slides, ~20 Minutes

**For:** the planning conversation with the Envio team
**Companion docs:** [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) · [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md)
**Goal of the deck:** *not* to present the documents — to give us shared visual scaffolding for a conversation. Five slides, ~20 minutes total, with the rest of the meeting reserved for the team's reactions and pressure-testing.

---

## Voice and design notes for the whole deck

- **Each slide does one thing.** No multi-purpose slides. If a slide tries to make two points, split it.
- **Numbers > prose.** Where a chart or a single big number can replace a paragraph, use the number.
- **One image / artefact per slide where possible.** Mirror Protocol screenshot, the Envio playground response time, a screenshot of the live trade feed, a customer logo wall — these earn the audience's attention in a way bullet points don't.
- **No more than 30 words on any slide.** The slide is the anchor; the words come from your mouth.
- **Use the team's design language.** Envio's homepage uses ship 🚢 emojis, dark-mode aesthetics, and benchmark-comparison visuals. Match that. Don't show up in stock-template-PowerPoint mode.
- **End every slide with one explicit ask of the room.** Either a question to the team or a "where I want your input" pointer. This keeps the meeting *conversational*, not presentational.

---

## Slide 1 — "I'm already case study #1"

**Time budget:** ~3 minutes

**What's on the slide:**

- **Title (large):** *Case Study #1*
- **Subtitle:** "I converted myself before we ever talked."
- **Single image, full bleed:** screenshot of the live Mirror Protocol dashboard ([mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app)) — feed updating, real tx hashes visible
- **Three small text anchors at the bottom (logos / icons + 1-line each):**
  - 🚢 **Built on Envio** — 7 entities, multi-event handlers, live Sepolia traffic
  - ✍️ **Published case study** — Jordy reviewed, live on Medium
  - 📣 **Already distributing** — X thread + LinkedIn post, unprompted

**Talk track (verbatim-ish, 90 seconds max):**

> "Before we dig into the plan, I want to ground us in what I've actually shipped. Mirror Protocol is a behavioural-DeFi product — trader strategies become NFTs, other users delegate capital to them, and an executor bot fires real Uniswap V2 swaps when conditions hit. It's live, open-source, indexed on Envio's hosted service, and has indexed real on-chain trades end-to-end.
>
> The product is the proof of one thing: I've been through the entire Envio adoption funnel as a customer. Sign-up. First indexer. Multi-event modelling. Hosted deploy. Production traffic. Public case study. Distribution.
>
> Every play in the rest of this deck is grounded in something I personally went through during that journey. So when I talk about activation friction or migration moments, I'm not theorizing — I'm reporting."

**Ask of the room (one line):**

> "Anything in this journey you'd want me to dig into now, before we move on?"

**Why this slide first:** establishes credibility before any forward strategy lands. If the team buys this slide, the rest of the deck has gravity. If they push back here, you'd rather know now than after spending 15 minutes on plays they haven't bought into the premise of.

---

## Slide 2 — "The bottleneck isn't engineering"

**Time budget:** ~3 minutes

**What's on the slide:**

- **Title (large):** *The next bottleneck.*
- **Three-column visual, top-to-bottom:**
  - **Column 1 — "Product"** ✅ Shipping. Real customer wall. Benchmark-leading speed.
  - **Column 2 — "Awareness"** ✅ Discoverable. Inbound exists. Hackathon presence.
  - **Column 3 — "Conversion"** ❓ This is the gap.
- **Single sentence underneath:** "Closing the gap between *'developer is curious'* and *'developer is paying'* is a craft. That's the craft I want to bring."

**Talk track (90 seconds):**

> "Here's the thesis in one slide. Envio's product has done the hard part — the speed, the case studies, the customer wall. The next bottleneck isn't engineering. It's the craft of converting interest into adoption and adoption into expansion. That's a different skill than building an indexer.
>
> The whole rest of this deck is five plays for closing that conversion gap, and a sequence for which ones to ship first. Each play is informed by what I lived through as a customer. None of them require new product surface area — they're leverage on what's already there."

**Ask of the room:**

> "Is conversion the gap *you* see, or is the bigger pain somewhere else? I'd rather hear that now than ship the wrong play first."

**Why this slide here:** sets the strategic frame. The team needs to either nod at "conversion is the gap" or correct it. If they correct it, the next three slides need to flex around their answer. Better to surface the diagnosis disagreement now than 15 minutes in.

---

## Slide 3 — "The five plays"

**Time budget:** ~6 minutes (most expensive slide — give it room)

**What's on the slide:**

A 5-row table or 5-card grid. Each row/card has the play name, a one-line mechanic, and a one-line "how I'd know it's working." Keep it visually balanced.

| # | Play | Mechanic | Signal |
|---|---|---|---|
| 1 | **Compress time-to-first-indexer** | "First Indexer in 30 Min" pillar artefact (video + repo + next-step doc) | Sign-up → working-indexer rate within 7 days |
| 2 | **Own the migration moment** | Translation guide + automated migration script + white-glove for top targets | Migrations completed + case-studied per quarter |
| 3 | **Case-study production engine** | 5 distribution units per customer interview, on a quarterly cadence | Inbound enterprise inquiries within 60 days of each |
| 4 | **Vertical-anchored content tracks** | DeFi (DEX + perp) / money market / L2 analytics — depth not breadth | Content-attributed sign-ups per vertical |
| 5 | **Expansion at existing accounts** | Quarterly technical health checks + multi-chain template paving | Net revenue retention on owned cohort |

**Talk track (3 minutes):**

> "Five plays. Each one is something I can personally execute end-to-end in week one — none of them require hiring or product redesign. Each has a measurable signal in less than 90 days, so we'll know quickly if any of them is wrong. And each one compounds with the others — a migration becomes a case study becomes a vertical asset becomes a template that drives activation.
>
> I'd happily go deeper on any of them, but the version that matters most for *this* conversation is which order we run them in. So I'm going to skip the deep dives unless you stop me, and go straight to sequencing."

**Ask of the room:**

> "If you had to pick one of these five to ship first based on what *you* know about the business right now, which one would it be? Then tell me why."

**Why this slide is structured this way:** the table is meant to be glanceable. Resist the temptation to put bullet points under each play — that turns this into the document. The deck's job here is to give a 30-second mental map, then hand the floor to the team. If they pick a play to drill into, you can talk to it from memory; the doc has the deep-dive material if they want it later.

---

## Slide 4 — "Sequencing — what week 1 actually looks like"

**Time budget:** ~4 minutes

**What's on the slide:**

A horizontal timeline, four blocks, each labelled:

```
[ Week 1 ]    [ Weeks 2–4 ]    [ Weeks 5–8 ]    [ Months 2–3 ]
   ↓               ↓                 ↓                 ↓
LISTEN          SHIP THE          STAND UP          FIRST CASE
+ AUDIT         PILLAR            MIGRATION         STUDY UNDER
                ARTEFACT          CONCIERGE         MY WATCH
   ↓               ↓                 ↓                 ↓
Replace         "First            Translation       Interview
my outside      Indexer           guide +           a real
assumptions     in 30 Min"        migration         Envio
with real       video +           script +          customer.
internal        forkable          named             Ship in 5
data.           repo.             target list.      formats.
```

Underneath the timeline, in smaller text:

> "After month 3: all five plays in motion. Quarterly check-in cadence on existing accounts. Second case study live."

**Talk track (90 seconds):**

> "Here's how the first quarter would actually run. Week 1 is listening — shadowing customer calls, auditing the existing onboarding funnel as a fresh user, replacing every assumption I've made from the outside with real internal data. By the end of week 1, the version of this deck I'd present back to you would have actual numbers in it, not estimates.
>
> Weeks 2 through 4: I ship the time-to-first-indexer pillar artefact. It's the smallest piece of work that produces visible activation lift, and it earns the right to do everything else.
>
> Weeks 5–8: Migration Concierge. Translation guide, migration script v0, named target list, first outreach.
>
> By month 3, the first case study under my watch is live. Doesn't need to be a whale — needs to be sharp. Use it to debug the case-study factory before scaling it.
>
> The honest scope check: a reasonable amount of work for one Growth Engineer in the first quarter is one pillar artefact + one practice stood up + one case study shipped. Anything more is overpromising."

**Ask of the room:**

> "Is this sequence wrong somewhere? In particular, is week 5 too early to start migration outreach, or too late?"

**Why this slide here:** the team's natural follow-up to slide 3 is *"OK, but in what order."* This slide answers that, and the question at the end is the most concrete piece of input you can extract from them. Their answer to "is week 5 too early" tells you a lot about how they think about the migration market right now.

---

## Slide 5 — "How I'd want to be measured + what I want from you"

**Time budget:** ~3 minutes

**What's on the slide:**

Two-column layout.

**Left column header:** *Measurement (joint targets, set in week 1)*
- Activation rate (sign-up → working indexer in 7 days) — measurable lift vs. baseline
- Sales-cycle compression on technical-eval deals — measurable reduction
- Migrations completed and case-studied per quarter — credible cadence
- Net revenue retention on owned cohort — quarterly
- Content-attributed sign-ups by vertical — month 6 winner identified

**Right column header:** *What I'd want from the team*
1. **Clear ownership of the activation funnel.** Templates, the pillar artefact, the rapid-response playbook — single owner.
2. **Quarterly review** against the joint targets. Not a fire-me trip-wire; a structured forum to recalibrate.
3. **A seat in product conversations.** Field signal flows to whoever owns the roadmap.

**Talk track (90 seconds):**

> "Two things on this slide. On the left: how I'd want to be measured. None of these are commitments yet — they're a starting point we'd set jointly in week one once I have access to your real baselines. The point of measurable goals isn't a fire-me trip-wire; it's to produce useful early signal so we can recalibrate together.
>
> On the right: what I'd want from you. Three things. Clear ownership of the activation funnel — I want to be the single person responsible for whether sign-ups become customers. A quarterly review where we look at the numbers together. And a path for field signal I gather to actually shape what gets built — I don't need to drive the roadmap, I just need a reliable way for the most important customer observations to land in front of whoever does."

**Ask of the room (this is the meeting's closing question):**

> "What did I miss? What's the play I should be more worried about than I am, or the metric you'd want me chasing that isn't on this slide?"

**Why this slide last:** measurement is the contract; "what I want from you" is the negotiation; the final question hands the meeting back to the team to close. The closing question is deliberately open-ended — it invites them to surface anything the deck didn't cover, and gives you signal on what they're actually worried about.

---

## After the deck — the next 30 minutes

The deck is 20 minutes max. The meeting should be 50–60. Reserve the back half for:

1. **Their reactions and pushback.** Take notes — every objection is a v2 input.
2. **What week 1 specifically looks like together.** First day, who introduces me to whom, what tools I get access to, who I shadow first.
3. **One thing they'd want me to commit to thinking about between now and start day.** This converts the meeting from "presentation" to "kickoff."

If the deck does its job, by the end of the meeting you'll have:

- A specific play they think should ship first (might agree with yours, might not — useful either way)
- Real internal numbers verbally shared, even if not yet in writing
- One named customer they want as the first case study
- A start date and a week-1 plan that's been co-edited live

That's a successful meeting. The deck is just the scaffolding that gets you there.

---

## Quick build instructions

If you want to turn this into actual slides in 20 minutes:

- **Slide 1.** Black or dark-mode background. Full-bleed Mirror Protocol dashboard screenshot. Three small icons + one-liner each at the bottom.
- **Slide 2.** Three columns, two with green check marks, one with a question mark. Big sentence under it.
- **Slide 3.** A 5-row table or 5-card grid. Equal weight to each row. No bullet points under any of them.
- **Slide 4.** Horizontal timeline. Four equal blocks. Short labels.
- **Slide 5.** Two columns side by side. Left = measurement. Right = the three asks. One closing question in big text under both.

Use Pitch, Keynote, Figma, or Slides — whichever you're fastest in. Don't over-design; the team is technical and will respect clarity over polish.

---

**Last note.** The deck and the docs serve different purposes. The deck guides the *meeting*. The docs are what they read after the meeting (or before, if they're prep-readers). Don't try to make the deck self-contained — it's deliberately incomplete so the team has reason to read the full memos.
