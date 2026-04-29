# The Effect API + Entity-Cache-First Preload Pattern — Production Default For DeFi Indexers

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *This is a pattern reference, not a finished tutorial. The pattern is real and load-bearing in production at Sablier and Velodrome+Aerodrome — it is documented in Envio's docs, but only as an advanced footnote on the first-30-minutes path. The Growth-Engineering play is **promoting it to canonical production default** so the next customer inherits it instead of rediscovering it.*
>
> **Live reference code:** [`pow/envio-defi-template-v1/src/Effects/TokenMetadata.ts`](./pow/envio-defi-template-v1/src/Effects/TokenMetadata.ts) (the Effect definition) and [`pow/envio-defi-template-v1/src/EventHandlers/PoolFactory.ts`](./pow/envio-defi-template-v1/src/EventHandlers/PoolFactory.ts) (the `Promise.all`-of-entity-and-Effect-reads at the top of the handler). The PM template has the same pattern at [`pow/envio-pm-template-v1/src/Effects/OracleRead.ts`](./pow/envio-pm-template-v1/src/Effects/OracleRead.ts) and [`pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts`](./pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts).

---

## §1 Why This Pattern Exists

A naive Envio handler reads entities serially: load entity A, await, load entity B, await, mutate, store. Under production event volume on a multi-chain DeFi indexer, this serial RPC + entity-load shape is the dominant latency contributor. Velodrome+Aerodrome's `src/PriceOracle.ts` and Sablier's `envio/streams/mappings/lockup/common/preload.ts` both replace this with a **cache-first, parallel preload** at the top of every handler — entities and external reads dispatched in one go, awaited as a batch, mutated in memory, stored at the end.

This pattern closes two §2 cells:

- **Activation × Tech (DeFi)** — production-shape patterns absent from the first-30-minutes path. ([ENVIO_ONBOARDING_FORENSIC.md](./ENVIO_ONBOARDING_FORENSIC.md): "production patterns documented but not on first-30-minutes path".)
- **Retention × Tech (DeFi)** — at scale, the absence of this pattern shows up as handlers running twice (re-fetching entities), cache file balloon (no Effect-result deduplication), and slow throughput on multi-event handlers.

The funnel-velocity claim: documenting this as the production default turns a month-2 friction discovery into a day-1 default — meaningfully shifting net-new activation conversion and reducing the in-production friction that triggers tier-up conversations to be reactive rather than proactive.

---

## §2 Anatomy

The pattern has four moving parts. Each is visible in customer repos cited below; the doc here describes their interaction, not their re-implementation.

### 2.1 The preload function

A handler exports two halves: a `loaderPreload` that declares everything the handler will need, and a `handler` that runs the mutation. The loader runs first and returns a typed payload of entities and Effect results; the handler receives that payload and is purely synchronous over already-loaded data.

Customer repo references:
- Sablier: `envio/streams/mappings/lockup/common/preload.ts` shows the canonical shape — declarative, sortable by entity, no `await` inside business logic.
- Velodrome: `src/PriceOracle.ts` uses the same shape for the priciest reads (oracle prices + token metadata).

### 2.2 Effect API for external reads

Anything outside the indexer's storage — token metadata, forex rates, Coingecko prices, Pyth oracle reads — is wrapped in an Effect. Effects deduplicate identical reads inside a batch and cache results across batches, written to a cache file on disk.

Customer repo references:
- Sablier: `envio/common/effects/token-metadata.ts` defines the canonical token-metadata Effect; reused across all three indexers in their monorepo.
- Velodrome: `src/Effects/` directory shows Effect-shaped wrappers for oracle reads + token reads.

### 2.3 Entity-cache-first preload

Inside the loader, entity reads are dispatched in parallel using a cache-first strategy: if the entity is in the in-memory cache for this batch, return immediately; otherwise dispatch a parallel storage read. The storage layer batches the reads underneath. Net effect: a handler that needs 10 entities runs in roughly the time of a single entity read, not 10×.

Customer repo references:
- Velodrome: the Aggregators layer (`src/Aggregators/LiquidityPoolAggregator.ts`, ~24KB) is the production reference for cache-first entity preload at scale.

### 2.4 Cache-size optimisation

Effect-result caches grow without bound by default. Sablier's `0` alias trick encodes "unknown token metadata" as a single byte alias (`0`) instead of a full token-metadata blob, keeping the on-disk cache file size manageable across the 27-deployment surface. ([ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md))

Customer repo references:
- Sablier: the `0` alias convention is visible in their effect-cache layer; the implementation pattern is the documentation hook.

---

## §3 Production Guardrails

The pattern prevents three failure modes documented in the indexer teardown:

- **Handlers running twice.** The serial-await shape inside a handler can cause a re-execution if the runtime detects an unresolved entity dependency mid-flight. The preload-first shape eliminates this — every dependency is resolved before mutation begins.
- **Cache file balloon.** Without the `0`-alias-style optimisation, Effect caches grow indefinitely, eventually causing slow startup on indexer redeploy. The pattern documents the optimisation as part of the default, not as a debugging step.
- **Multi-chain config sprawl.** The pattern composes with the codegen pipelines used by Sablier and Velodrome — preload functions are codegen-friendly because they're declarative, so a 12-chain indexer doesn't require 12 hand-written preload functions.

---

## §4 Walkthrough Hooks (Not Full Code)

A productised version of this pattern should ship as:

- **A docs page** that lives at the *top* of the production-patterns section, not buried under "advanced." The page has the shape: 3-paragraph framing → annotated reference to the Sablier preload file (cited, not copy-pasted) → annotated reference to the Velodrome PriceOracle file → guardrails section.
- **A Loom walkthrough** (10–12 min) where the presenter forks Velodrome's repo, walks through `src/PriceOracle.ts` + `src/Aggregators/LiquidityPoolAggregator.ts`, shows the preload shape, then shows the equivalent in the Sablier repo. Pause-points: each anatomy sub-section above.
- **A forkable starter** that ships *only* the preload pattern (not a full DeFi indexer) — minimum viable shape, two events, two entities, Effect API for one external read. Lives at a `envio-effect-api-pattern` repo slug. (This is a candidate-time-permitting deliverable, hedged.)

---

## §5 Adoption Pathway

The artifact succeeds when:

1. The docs page becomes the canonical link Envio team members share when a customer asks "how do I make my handler faster?"
2. The DeFi 60-min template ([ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md)) cites it as the default — not as an upgrade.
3. New DeFi customers ship the pattern from day one, not month two.

The conversion event is qualitative for #1 (link share frequency in support), measurable for #2 (template uses the pattern) and #3 (new-customer indexer code review shows the pattern present).

---

## §6 What This Doc Doesn't Cover

ClickHouse Sink, leaderboard query architecture, settlement handlers — all out of scope. The Effect API pattern is the pre-Postgres optimization; the analytics-tier patterns are downstream. See [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md) for the analytics layer.

---

> **Cell:** Activation × Tech [DeFi]; Retention × Tech [DeFi]
> **Revenue mechanism:** Net-new acquisition (Activation) + tier-up to Dedicated (Retention enables tier-up by removing the friction that triggers reactive churn)
> **Named accounts:** Sablier (preload + 0-alias caching), Velodrome+Aerodrome (PriceOracle + Aggregators), LI.FI, Beefy
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md), [ENVIO_DEFI_TECH_DIAGNOSTIC.md](./ENVIO_DEFI_TECH_DIAGNOSTIC.md)

— Kaustubh
