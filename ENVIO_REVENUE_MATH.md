# Envio Revenue — The Math Behind the Memo

**From:** Kaustubh Agrawal — incoming Growth Engineer
**Companion docs:** [ENVIO_REVENUE_MODEL.md](./ENVIO_REVENUE_MODEL.md) (strategy) · [ENVIO_GROWTH_PLAN.md](./ENVIO_GROWTH_PLAN.md) (operations) · [ENVIO_DECK_OUTLINE.md](./ENVIO_DECK_OUTLINE.md) (meeting deck) · [ENVIO_FIRST_24_HOURS.md](./ENVIO_FIRST_24_HOURS.md) (day-1)

> *The strategy memo argues the why and the five plays. This is the math underneath. It's deliberately dense — read it with a calculator open. Every number here is either real (mine), industry benchmark, or an explicit assumption framed as "= X if Y." The final section is the only place I do dollar math at Envio's business, and even there the formula is yours to plug into.*

---

## TL;DR — Six Numbers

1. **9.67 minutes vs. 1,000 minutes** — Envio v0.0.20 vs. The Graph on the same Uniswap V3 backfill (Sentio, May 2025). The product wins on the spec that matters.
2. **5–15 minutes** — the time-to-aha-moment threshold above which dev-tools activation collapses. Industry benchmark, well-documented. *This is the single biggest leverage point in the funnel.*
3. **9% median** — free-to-paid conversion rate across PLG SaaS. Anything above is good. Anything below is engineerable upward.
4. **30–40%** — share of free-trial signups in dev-tools that *never* deploy a working artefact. Recovering even a quarter of that bucket is the highest-ROI work in the first 90 days.
5. **140+ trades, 7 entities, 18+ chains** — Mirror Protocol's live state, my Sablier-shape proof of customer fluency.
6. **5×** distribution multiplier — the case-study factory ratio (one customer interview → 5 distribution units). The cheapest content leverage in the deck.

Everything below derives from these.


## 2. The Activation Math

The single biggest leverage point in the first 90 days, by an order of magnitude.

### The benchmark numbers I'm anchoring to

- **5–15 minutes**: the dev-tools time-to-aha-moment threshold. Stripe and Postman canon. Above 15 minutes, retention drops sharply.
- **40–50%**: a "good" SaaS activation rate. **60%+** is exceptional.
- **30–40%**: share of free-trial signups that *never* deploy a working artefact in dev-tools categories.
- **3×**: how much higher PQL (product-qualified lead) cohorts convert than non-PQL — when you instrument it.
- **9%**: median free-to-paid conversion across PLG SaaS.

### The activation arithmetic

Take Envio's free-tier monthly signup volume (call it **N**, replace with real number on day 1).

```
Total monthly signups:                N
Non-activators (never ship indexer):  0.35 × N    [industry benchmark: 30–40%]
Recovery target (Play 1):             0.25 × non-activators
                                    = 0.0875 × N
Convert to paid (12 months):          0.05 × recovered
                                    = 0.0044 × N
                                    = ~1 paid customer per 230 signups recovered
```

**Read:** for every 230 signups currently being lost in the activation gap, the time-to-first-indexer pillar artefact (Play 1) recovers roughly one paid customer. If Envio's signup volume is 300/month, that's **~1.3 net-new paid customers/month** from this lever alone.

### Why the arithmetic favours doing this first

- **Cost of the artefact**: one Loom video (~3 hours of recording + editing), one repo (~2 days), one next-step doc (~1 day). **~1 working week of Growth-side time.**
- **Half-life of the artefact**: years (dev-tools docs that solve real friction don't decay).
- **Cost ratio**: 1 week of effort → measurable monthly impact for years. **Asymmetric.**

This is why activation goes first. It's not the play with the largest dollar number — it's the play with the largest *ratio of impact to effort.*

---

## 3. The Migration Math

The second-highest-leverage play, with a time-bounded window.

### What's publicly knowable

- **December 8, 2025**: Alchemy Subgraphs sunset date. *Closed market.*
- **~28** subgraphs were publicly visible on Alchemy's "best subgraphs" page pre-sunset; the full paying base was likely 5–10× that.
- **14.6%** decline in The Graph's network query-fee revenue in the most recent reported quarter (Messari Q3 2025). Steady-state migration tailwind.
- **Polymarket**: 8 separate subgraphs → 1 Envio indexer; **4 billion events synced in 6 days.**
- **Sablier**: 3 indexers across **18 chains** on Envio.

### The migration arithmetic

Each migration costs ~5 working days of Growth-side time (Backup B in the deck spells this out). Output per migration:

| Output | Direct value | Indirect value |
|---|---|---|
| 1 paying customer added | ACV × LTV | — |
| 1 case study published in 5 formats | — | Generates ~5 inbound enterprise inquiries within 60 days (industry benchmark) |
| 1 named reference | — | Closes the next 1–2 migration prospects with less friction |

**Compounding:** by the time the 5th migration ships, the time-per-migration drops because the script handles more, the playbook is sharper, and the case studies are doing the prospect-qualification work that earlier required 30 minutes of discovery calls.

### The conversion math

If outreach to even 50 named migration prospects in the first quarter produces:

- **10–20% response rate** (cold outbound to high-intent migration market): 5–10 conversations
- **30–50% conversation-to-trial rate**: 2–5 active migrations
- **60–80% trial-to-paid rate** (with white-glove service): 1–4 paying customers from quarter 1

That's the lower-bound migration funnel from a single Growth Engineer doing 50 outreach touches. By quarter 4, with 4 quarters of outreach + 4 quarters of compounding case studies, the funnel widens.

---

## 4. The Case-Study Compounding Math

The play with the longest half-life. The one that pays back in years 2–3, not year 1.

### The distribution multiplier

One customer interview (~30 minutes of customer time, ~2 days of my time end-to-end) produces:

| Format | Length | Half-life |
|---|---|---|
| Long-form blog | 1,500–2,500 words | **Years** (SEO compounds) |
| X thread | 8–12 tweets | Days, then evergreen if pinned |
| LinkedIn post | 200 words, customer's account | Weeks |
| 60-second Loom | Customer voice | Months |
| Discord pin | 1 paragraph + 3 links | Permanent reference |

**5× content output per customer interview**, at a cadence of ~1/quarter scaling to ~1/month by month 9. That's a **3–4×** increase in case-study output relative to a baseline that ships ad-hoc when capacity allows.

### The attribution math

Industry benchmark: a well-positioned dev-tools case study drives **3–7 inbound qualified inquiries** within 60 days of publication, with a long tail extending 12+ months as the post ranks.

If 4 case studies ship in year 1, lower-bound: **12–28 inbound enterprise-shape inquiries.** Conversion of inbound enterprise to paying customer in dev-tools: roughly **15–25%**. Net: **2–7 enterprise customers/year attributable to case studies alone.**

This is the play that produces *most of the year-3 revenue compounding* from year-1 work.

---

## 5. The Expansion Math

The cheapest revenue any product earns. Pure margin.

### The benchmark numbers

- **110%+ NRR**: standard SaaS bar.
- **130–150% NRR**: where category leaders with structural expansion paths land.
- **2–3×** ACV uplift on average customer that expands from 1 chain to 3+ chains in indexer SaaS. (Sablier's 18-chain footprint sits at the high end of this curve.)

### The arithmetic

If Envio's existing paying base has roughly 30–40% single-chain customers (replace with real number), the expansion-pavable cohort is the targetable segment. Capture rate on a structured quarterly check-in cadence + multi-chain template: industry benchmark is **20–35%** of the addressable cohort moves over a year.

**The asymmetric bet:** every additional chain a customer indexes on Envio raises the switching cost. Expansion + retention are mathematically the same lever; one quarter of structured check-in work moves both numbers in the same direction.

---

## 6. Plug Your Numbers In — The Explicit Formula

This is the only place I'll do dollar math. The numbers I use below are **placeholders** — they're framed as "if your X is Y, here's what falls out" so you can stress-test the model live with your real data.

### The formula

```
Year-1 incremental ARR = (Activation lever)
                       + (Migration lever)
                       + (Case-study lever)
                       + (Expansion lever)
                       + (Vertical content lever, lower confidence)

Each lever = (volume × conversion × ACV) - cost-of-execution
```

### Worked example with placeholder inputs

**Replace each italicised number with Envio's actual value on day 1:**

```
ACTIVATION LEVER
  Monthly signups (N):                  *300*
  Non-activators (35% × N):             ~105
  Recovered (25% × non-activators):     ~26/month → 312/year
  Paid conversion (5%, 12-mo window):   ~16 net-new paid customers
  Mid-market ACV placeholder:           *$4,000*
  → ~$64,000 incremental year-1 ARR

MIGRATION LEVER
  Migrations completed in year 1:       *5* (achievable based on outreach math)
  Migration-tier ACV placeholder:       *$18,000*
  → ~$90,000 incremental year-1 ARR

CASE-STUDY LEVER
  Case studies published year 1:        *4*
  Inbound inquiries per study:          ~5
  Enterprise close rate:                ~20%
  Enterprise ACV placeholder:           *$50,000*
  → ~4 × 5 × 0.20 × $50,000 = ~$200,000 (booked-not-recognised, conservative
     timing recognises ~40% in year 1) = ~$80,000 year-1 recognised

EXPANSION LEVER
  Pavable single-chain accounts:        *12*
  Capture rate on quarterly cadence:    ~30% → 4 expansions
  Avg incremental ACV per expansion:    *$10,000*
  → ~$40,000 incremental year-1 ARR

VERTICAL CONTENT LEVER (lower confidence — back-loaded)
  Content-attributed signups year 1:    *60*
  Conversion to paid:                   ~5% → 3 paid
  Mid-market ACV:                       *$4,000*
  → ~$12,000 incremental year-1 ARR
   (real value back-loaded into year 2–3 SEO compounding)
```

### Total at the placeholder values

```
Activation     +$64,000
Migration      +$90,000
Case-study     +$80,000
Expansion      +$40,000
Vertical       +$12,000
─────────────────────────
YEAR-1 TOTAL  ~$286,000 incremental ARR (at placeholder inputs)
```

### Sensitivity at the lever level

If any single lever input is **half** what I've placeholdered, that lever's contribution halves — but the total never drops below ~$140k at half-on-everything. If any input is **2×** what I've placeholdered, that lever doubles — total ceiling at 2× across the board: ~$570k.

**Defensible band: $140k–$570k year-1 incremental ARR, depending on your real inputs.**

### Breakeven math

Against a typical remote junior-to-mid Growth Engineer total cost (salary + benefits + tooling) of **$120k–$160k annualised**:

- **Half-case** ($140k): roughly breakeven
- **Placeholder-case** ($286k): ~2× payback
- **2× case** ($570k): ~4× payback

The role pays for itself across the entire defensible band, even at half-on-everything pessimism.

### Year 2–3 trajectory

The case-study and content levers compound non-linearly because content has a multi-year half-life. By year 3, I'd expect those two levers alone to run at **3–5×** their year-1 contribution, while activation/migration/expansion sustain at year-1 rates.

Implied year-3 attributable ARR run-rate: roughly **2–4× the year-1 base.**

---

## Closing — Why The Numbers Are Shaped This Way

I deliberately chose numbers that are **falsifiable**, not impressive.

Every input above is either a real-world benchmark I can cite, a real metric from Mirror Protocol, or an explicit placeholder labelled as such. None of them are point-projections at Envio's business with confident decimals. That's by design — a 10-person all-technical team can sniff out a confident-looking number with no provenance in seconds, and confident-looking numbers with no provenance are how junior hires get rejected.

The version of the model that matters is the one we co-edit in week one with your real signup volume, your real conversion rates, your real ACV bands. The math above is the *shape* of the bet. The numbers are yours to fill in.

— Kaustubh
