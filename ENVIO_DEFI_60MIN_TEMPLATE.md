# Production-Grade DeFi Indexer In 60 Minutes — Template + Tutorial Spec

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) · [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Spec for the activation-stage flagship template named in §3 of the playbook. Bridges the Greeter-tutorial gap to a Velodrome-shaped Aggregators+Snapshots layout. Anchored to patterns visible in the indexer-teardown work; describes shape and location, not invented code.*

---

## §1 Why This Template Exists

The Greeter tutorial gets a developer to a single-event handler. A production-shaped DeFi indexer needs multi-event handlers, factory contract patterns for dynamically-deployed pools, the Effect API from day one for token metadata reads, and an entity-cache-first preload pattern. The gap between Greeter and Velodrome's `Aggregators/` directory is the activation killer for the DeFi vertical ([ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) §3).

The template closes the gap. The funnel-velocity claim: a forkable repo + Loom walkthrough + written guide that lands a DeFi prospect on a production-shape indexer in their first session, not their second month. The §2 cell this addresses is **Activation × Tech [DeFi]**, with downstream effect on **Acquisition × Tech [DeFi]** (the template is the call-to-action that converts vertical-positioning content into activation).

---

## §2 Anatomy

The template ships as a forkable repo at slug `envio-defi-template-v1` (proposed). The directory layout mirrors Velodrome+Aerodrome's three-layer architecture so customers reading the template see the path to production directly:

```
envio-defi-template-v1/
├── config.yaml                      # Multi-chain ready; codegen-friendly
├── schema.graphql                   # Pool, Swap, LiquidityPosition entities
├── src/
│   ├── EventHandlers/               # Ingestion only
│   │   ├── Factory.ts               # Dynamic contract registration via factory events
│   │   └── Pool.ts                  # Multi-event handler (Swap, Mint, Burn)
│   ├── Aggregators/                 # Derived state
│   │   └── PoolAggregator.ts        # Cumulative volume, TVL, fees per pool
│   ├── Snapshots/                   # Hourly time-series captures
│   │   └── PoolHourSnapshot.ts
│   ├── Effects/                     # External reads
│   │   └── TokenMetadata.ts         # Effect-wrapped token metadata read
│   ├── PriceOracle.ts               # Oracle reads with RPC fallback
│   ├── Helpers.ts                   # Shared utilities
│   └── Constants.ts                 # Chain-keyed config
└── README.md                        # The 60-minute walkthrough
```

Each directory exists in Velodrome's production indexer (cited in [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md)). The template is a **slimmed-down, forkable shape** of that production reference — not a re-invention.

The template ships with three patterns that aren't in Greeter:

1. **Dynamic contract registration** in `EventHandlers/Factory.ts` — empty `address:` array in `config.yaml`, runtime `addAddress()` calls in the factory event handler. Mirrors the dynamic-pool pattern Velodrome uses for new pool deployments.
2. **Effect API + entity-cache-first preload** in `EventHandlers/Pool.ts` — declarative `loaderPreload` followed by a synchronous handler. See [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md) for the canonical pattern.
3. **Aggregators + Snapshots split** — handlers don't compute aggregates directly; they emit events the aggregator consumes, which the snapshot reads on hourly epochs. This is the architecture that scales to the Dedicated tier without re-architecting.

---

## §3 The 60-Minute Walkthrough

The README walks the user from `git clone` to deployed indexer in 60 minutes, broken into six 10-minute beats. The Loom walkthrough mirrors the same beats. Per-beat content:

| Minute | Beat | What happens | Reference |
|---|---|---|---|
| 0–10 | **Setup** | Clone, install, env vars, Envio CLI version check | Replaces the Greeter "first install" beat |
| 10–20 | **Config tour** | Open `config.yaml`, walk the multi-chain config (start: 1 chain, comment-marked for adding chain #2 later), explain dynamic contracts | See [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md) for the chain #2 follow-up |
| 20–35 | **First handler** | Open `EventHandlers/Pool.ts`, walk the preload-first shape, show how the Effect-wrapped token metadata read returns from cache on the second event | [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md) |
| 35–45 | **Aggregator + snapshot** | Open `Aggregators/PoolAggregator.ts`, show how derived state is computed once (not in every handler), then `Snapshots/PoolHourSnapshot.ts` for the hourly epoch | Mirrors Velodrome production layout |
| 45–55 | **Run + query** | `pnpm dev`, deploy locally, point at Sepolia or a forked mainnet, hit the GraphQL playground, run a "top 10 pools by 24h volume" query | This is the moment the customer sees the product surface they're going to build on |
| 55–60 | **What's next** | Three follow-up paths: add chain #2 (links to multi-chain runbook), upgrade analytics layer (links to leaderboard architecture), join Discord | Each follow-up is the entry-point to a tier-up or expansion conversation |

The walkthrough has a **success indicator** at minute 55: the GraphQL query returns real pool data. ([ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) flags the absence of success indicators in the existing Greeter flow — this template fixes it.)

---

## §4 Production Guardrails

The template prevents three failure modes Greeter doesn't:

- **Adding chain #2 is a one-week project.** Default Greeter shape requires hand-written multi-chain config. Template ships codegen-friendly config; the multi-chain expansion runbook ([ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md)) takes the next chain from one-week to one-afternoon.
- **First production load surfaces unmodelled handler patterns.** Default Greeter shape has no Effect API, no entity-cache-first preload. Template ships both as the default, so production load doesn't trigger a re-architecture.
- **Aggregator state computed in handlers.** Default DeFi indexers compute pool TVL inside the swap handler, which doesn't compose with multi-event handlers (Mint + Burn also affect TVL). Template ships an Aggregator layer that consumes events from all three handlers — the Velodrome production shape.

---

## §5 Walkthrough Hooks

A productised version ships as:

- **The forkable repo** at `envio-defi-template-v1` (proposed slug).
- **A 60-minute Loom** — the canonical "first DeFi indexer" video, replacing the Greeter video for DeFi prospects.
- **A written guide** at the canonical docs slot (top of "Tutorials" section, named "Build a Production-Grade DeFi Indexer in 60 Minutes").
- **A "what next" page** that branches into the three follow-up paths above. The branch is the activation-to-tier-up conversion mechanism.

---

## §6 Adoption Pathway

The template succeeds when:

1. **Time-to-first-event** for new DeFi prospects drops to under 60 minutes (currently un-instrumented; placeholder until measured).
2. New customer indexer code reviews show the production-shape patterns (Effect API, dynamic contracts, Aggregators+Snapshots) as the default — not as month-2 retrofits.
3. The template becomes the canonical asset Envio team members link to when a DeFi prospect asks "where do I start?"

The conversion mechanism: the template is the call-to-action on the DeFi-vertical landing page proposed in [ENVIO_DEFI_POSITIONING_AUDIT.md](./ENVIO_DEFI_POSITIONING_AUDIT.md). Vertical positioning brings the prospect; the template activates them; the "what next" follow-ups queue the tier-up and expansion conversations.

---

## §7 What This Template Doesn't Cover

- **Per-protocol-shape variants.** The template is DEX-shaped. Perp, money market, and execution-layer variants are flagged for follow-up.
- **Analytics tier.** ClickHouse Sink + leaderboard architecture is downstream — see [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md).
- **Settlement events.** Settlement is a prediction-markets concern; see [ENVIO_SETTLEMENT_HANDLER_REFERENCE.md](./ENVIO_SETTLEMENT_HANDLER_REFERENCE.md).

---

> **Cell:** Activation × Tech [DeFi] (primary); Acquisition × Tech [DeFi] (call-to-action role)
> **Revenue mechanism:** Net-new acquisition into Production tier (template is the activation engine for the vertical-positioning campaign)
> **Named accounts:** Velodrome+Aerodrome (architectural reference); DeFi wave-2 (~20 protocols, the activation target)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md), [ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md), [ENVIO_DEFI_TECH_DIAGNOSTIC.md](./ENVIO_DEFI_TECH_DIAGNOSTIC.md)

— Kaustubh
