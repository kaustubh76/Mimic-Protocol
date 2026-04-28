# First 24 Hours — How I'd Spend Day One

**From:** Kaustubh Agrawal
**Companion docs:** [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) · [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) · [ENVIO_DECK_OUTLINE.md](./ENVIO_DECK_OUTLINE.md)

> *This is what I'd do in my first working day if you handed me a laptop tomorrow. It's deliberately tactical — the strategy lives in the other docs. This is the operator's-log version: hour by hour, what I'd actually be doing.*
>
> *Caveat: your existing onboarding flow takes precedence. If you have a structured day-1 — HR setup, security training, intro calls — I follow yours, not this. This doc describes what I'd do in the gaps, and what I'd produce by end-of-day on top of whatever you already had planned.*

---

## The Premise

Day 1 is not a shipping day. Day 1 is **the day I extract enough internal context to make the rest of week 1 useful.**

Everything in [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) and [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) is built on triangulations from public data. Day 1 is when I start replacing those triangulations with internal numbers. The goal is to walk into day 2 with a v2 of my mental model that's grounded in reality, not in what I could see from outside.

The artifact I'd commit to producing by end of day 1 is a **single internal Notion (or equivalent) doc** with three things: my baseline questions and the answers I got, an updated version of the strategy memo with real numbers replacing my triangulations, and a prioritized list of the next two weeks of work that the team can react to.

That's the bar. Not deploying templates, not writing content. Listening, synthesizing, and producing a tight artifact that proves I'm actively assimilating, not just absorbing.

---

## The Night Before (Pre-Day-1 Prep)

Before I even show up, I'd want to do the unglamorous prep work so day 1 is about extracting context, not orienting:

- **Re-read both companion docs** ([strategy memo](./ENVIO_REVENUE_MODEL.md), [operating plan](./ENVIO_GROWTH_PLAN.md)) — I want them fresh in my head so when the team references something, I know exactly which section.
- **Re-deploy my Mirror Protocol stack locally** — make sure the indexer is running cleanly, the demo is live, in case I'm asked to demo it.
- **Skim the Envio docs end-to-end one more time** — particularly the [hosted-service billing](https://docs.envio.dev/docs/HyperIndex/hosted-service-billing) and the [HyperIndex overview](https://docs.envio.dev/docs/HyperIndex/overview). I want to walk in already fluent in the vocabulary.
- **Pull the public customer list** from the homepage. Annotate which I've personally interacted with vs. which are name-recognition only.
- **Write a 10-question "things I want to find out on day 1" list** — see appendix A below for the actual list.

This is roughly 90 minutes of evening prep. Worth every minute.

---

## Morning Block — First 3 Hours

**The goal of the morning is to do the team's onboarding, then layer my own context-extraction on top of it.**

### Whatever your standard onboarding is (~1–2 hours)

Tools, accounts, Slack, GitHub access, Notion access, the customer dashboard, the hosted-service admin panel, the analytics tooling. I'd defer entirely to your process here.

While doing this, I'd silently note three things in my own notebook:

- Which tools the team actually uses day-to-day vs. which exist on paper
- Whose names show up first as the people I'd loop in for X / Y / Z (this becomes my mental org chart)
- Any tool gap I notice that Growth might benefit from later

### My own additions (~1 hour)

If I have any unstructured time in the morning before scheduled calls or meetings:

- **Read the 10 most recent customer support tickets / Discord threads** on integration issues. This is the fastest way to internalize where the friction actually is, and which team members are answering what kinds of questions today.
- **Review the most recent customer signups in the admin tool.** Who's signing up? What's the rough volume? What % of signups in the last 30 days deployed an indexer? This is the activation-rate baseline I've been triangulating from outside; now I get the real number.
- **Read the last 4 weeks of internal Slack** in any growth-related, sales-related, or product channels. Just lurking. I want to absorb the team's voice and current priorities before I open my mouth in any of those channels.

---

## Midday Block — The First Customer Call

**The single most important thing I'd want to lock in for day 1: shadow at least one real customer interaction.**

Whether that's a sales call, a support escalation, a customer success check-in, or even just sitting in on a Discord office-hours session — I want to hear a real customer voice on day 1. Not a recording. Live.

What I'd be listening for:

- **What language the customer uses to describe their problem** (this becomes content material)
- **Where in the call they hesitate or get confused** (this becomes activation-fix material)
- **Which feature or fact about Envio is the one that lands hardest** (this becomes positioning material)
- **What the team member doing the call has to repeat or re-explain** (this is friction that should be in docs, not in calls)

After the call, I'd spend 15 minutes writing up my notes — not as a deliverable for anyone else, but as raw material for week 1.

If no customer call is happening on my first day, I'd ask to listen to a recording of the most recent one, or read the most recent 5 customer success notes. Worse than live, better than nothing.

---

## Afternoon Block — Replace My Triangulations

This is the most important deliverable-producing block of the day. Roughly 3 hours.

The strategy memo and the operating plan are built on triangulations — I assumed industry-standard activation rates, I anchored ACVs to a competitor comp, I estimated free-tier signup volume. Day 1 afternoon is when I get the real numbers.

I'd run a focused information-gathering pass with the relevant team members (or whoever has access to the data):

### The 7 numbers I want to leave day 1 with

1. **Real free-tier signup volume per month** (last 90 days, monthly cadence)
2. **Real free-trial → working-indexer conversion rate** (the activation rate)
3. **Real working-indexer → paid conversion rate** (within 30 / 60 / 90 days)
4. **Average ACV by tier** — Production Small / Medium / Large / Dedicated
5. **Current paying customer count** (rough, by tier)
6. **Net revenue retention** on existing paying base, last 4 quarters
7. **Top 3 reasons free-trial users give for not converting** — pulled from any post-trial survey data, support tickets, or anecdotal team knowledge

If any of these aren't tracked, that itself is an output — those become things I'd propose instrumenting in week 2.

### What I'd do with those 7 numbers

I'd pull up [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) and replace every triangulation with the actual number, line by line. This produces my **v2 strategy memo** — the version that's grounded in real internal data rather than public-source guesses.

Where the real numbers contradict my assumptions, I'd flag it in red. Those contradictions are the most valuable signal I'll get on day 1, because they tell me where my outside view of Envio was wrong — and where I need to recalibrate before doing any week-2 work.

---

## End-of-Day Block — Synthesize and Send

Roughly 60–90 minutes at the end of the day. The deliverable is **one Notion (or equivalent) doc** with three sections:

### Section 1 — "Day 1 baselines"
The 7 numbers from the afternoon block, laid out plainly. No commentary, no spin — just the data. This becomes the baseline I'll measure against for the rest of the quarter.

### Section 2 — "v2 of my mental model"
A short summary of where my outside-in assumptions in the strategy memo were wrong, where they were right, and what the v2 framing is. Bullet form. Maybe 300 words.

### Section 3 — "Proposed week 1 (revised)"
Given what I now know, here's what I'd actually do for the rest of week 1. This will likely look different from the original [operating plan](./ENVIO_GROWTH_PLAN.md) — and that's the *point*. The plan was a starting hypothesis; week 1 turns it into something testable.

I'd post this doc to whichever Slack channel the team uses for Growth-adjacent work, with a brief message: *"Day 1 baseline doc. Sharing rough — please push back on anything that looks wrong. I'd rather get corrected on day 2 than miscalibrate further."*

That message is doing two things deliberately: it produces a written artifact that proves day 1 was active synthesis, and it invites the team to correct me before I wander deeper into wrong assumptions.

---

## What I Would NOT Do on Day 1

A few things I'd deliberately *not* do, because they're things junior hires often try and they signal the wrong instinct:

- **Ship a template, doc, or content piece.** Day 1 is too early. I haven't earned the right to publish under Envio's name yet.
- **Schedule meetings with multiple team members for "intro chats."** Inefficient. I'd rather lurk in Slack and shadow a real call than do five 30-minute hello calls that produce no signal.
- **Pitch the team on plays they haven't asked about yet.** The deck and the docs already covered that. Day 1 is the day I *learn*, not the day I re-pitch.
- **Make any commitments about week-1 deliverables before I see the real numbers.** The operating plan is a hypothesis; it gets revised in the afternoon block, not before.
- **Touch the production hosted-service infrastructure.** Even if I have access. Read-only on day 1.
- **Write any external-facing content** (X, LinkedIn, blog drafts). I'd want at least 5 days of internal context before I represent Envio publicly in any way I haven't already.

The discipline of *not* doing these things is itself a signal. A Growth Engineer who ships templates on day 1 hasn't yet learned the product they're trying to grow.

---

## Appendix A — The 10 Questions I'd Walk In With

Day 1 won't answer all of these, but the act of writing them down gives me a sharper extraction goal. In rough priority order:

1. What's the actual current free-trial → paid conversion rate? Has it moved over the last 6 months?
2. What's the single most common reason a free-trial deployment fails to make it to production?
3. Which case study on the wall produced the most attributable inbound, and why?
4. Of the customer accounts visible publicly, which are the highest-ARR? Which are highest-engagement? Are they the same accounts?
5. What's the team's current view on the migration market — is it the priority I've been assuming it is?
6. Where is product roadmap most blocked by Growth-side asks (templates, docs, examples), and where is Growth most blocked by product?
7. What's the current case-study production cadence, and what's the bottleneck — interview time, customer permission, write-up time, or distribution?
8. Who currently owns Discord support? Has that role been formalized or is it ad-hoc?
9. What's the existing relationship with chains and L2s — co-marketing happening? Partner integrations? Where would Growth plug in?
10. What does the team think the *biggest* strategic risk is right now — and is it on my radar?

Question 10 is the one I'd ask last, after I've spent the day building enough context for the team's answer to actually mean something to me.

---

## Why This Doc Exists

Most candidates think onboarding is something the company does *to* them. The version of me you're hiring thinks onboarding is something I do, with the company's help, in the first week — and day 1 is the most leverage-dense day of the entire quarter, because it's the day where my outside-in assumptions get replaced with reality.

This doc is the proof I've thought about that. It's a draft, not a contract — your existing process takes precedence everywhere, and the artifact at the end of day 1 will be co-shaped by what you actually have me doing. But the *shape* of the day — listen, shadow, replace assumptions, synthesize, send — is how I'd want to start.

— Kaustubh
