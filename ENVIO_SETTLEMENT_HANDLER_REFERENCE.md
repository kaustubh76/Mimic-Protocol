# Settlement-Event Handler Reference — Multi-Step Settlement With Correction Handling

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Reference for the trickiest event shape in the prediction-markets vertical: settlement, with multi-step state machine and correction handling for late or disputed oracle resolutions.*
>
> **Live reference code:** [`pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts`](./pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts) is the runnable four-state machine — `OPEN → RESOLVING → SETTLED → CORRECTED` with reorg-safe state transitions and race-safe correction handling via `lastResolutionBlock` block-pointer comparison. The schema-level `MarketState` enum lives at [`pow/envio-pm-template-v1/schema.graphql`](./pow/envio-pm-template-v1/schema.graphql). The Effect-cached oracle read pattern (1 RPC call per market, not N per holder) is at [`src/Effects/OracleRead.ts`](./pow/envio-pm-template-v1/src/Effects/OracleRead.ts).

---

## §1 Why This Reference Exists

§4 of the playbook names settlement explicitly: *"a settlement-event handler reference that shows how to handle the trickiest event in the vertical (multi-step settlement with potential corrections) cleanly."* Settlement is where prediction-market indexers fail visibly — the leaderboard updates with the wrong winner, the payout assignment is off, the historical record diverges from on-chain truth. End users see the bug. Customers churn.

This closes one §2 cell directly:

- **Activation × Tech [PM]** — settlement is the most common reason a PM builder gets stuck during the first month. A documented reference on the canonical first-30-minutes path keeps them moving.

And touches one indirectly:

- **Retention × Tech [PM]** — settlement bugs are visible-to-end-users bugs, the highest-churn-risk technical category in the vertical.

The funnel-velocity claim: settlement is the *most-Googled* search term among PM builders mid-implementation. A reference doc that ranks for "prediction market settlement Envio" + "oracle resolution late correction handler" is acquisition leverage as well as activation leverage.

---

## §2 Anatomy

Settlement is a state machine, not a single event. The reference walks the four states a market passes through and the events that drive each transition.

### State 1 — Open

Market is taking positions. Events fire: `MarketCreated`, `PositionTaken`, `PositionClosed`. Handler logic is straightforward — entity-cache-first preload of the market entity, mutate position counts, update aggregator.

### State 2 — Resolving

Market deadline has passed; oracle reads are pending. Events fire: `MarketLockedForResolution`, then (eventually) `OracleResolved`. The reference's first non-trivial pattern: **the market enters a `RESOLVING` state but is not yet settled**. Handler must mark the market as resolving, reject any further `PositionTaken` events at this market (or treat them as errors, depending on the protocol's behaviour), and start awaiting oracle reads.

### State 3 — Settled

`OracleResolved` fires with the winning outcome. The reference's second non-trivial pattern: **payout calculation must be deterministic and auditable**. Common pattern: mutate the market entity into `SETTLED` state, emit derived `PositionSettled` events into the aggregator layer (one per holder of the winning outcome), update leaderboards on the next snapshot epoch.

### State 4 — Corrected

Oracle disputes happen. A `MarketCorrected` event (or equivalent — protocol-specific) fires hours or days after `OracleResolved`. The reference's third non-trivial pattern: **correction handling must reverse the prior settlement deterministically**. Common pattern: mutate the market entity into `CORRECTED` state, emit `PositionUnsettled` events that reverse the prior payouts, then re-emit `PositionSettled` events under the corrected outcome. Aggregator and leaderboard layers consume the unsettlement-then-resettlement sequence; user-facing leaderboard updates twice (which is the right shape — users *should* see the correction surface).

The four-state reference is sufficient for most prediction-market protocols. Customers running more exotic settlement schemes (multi-outcome scalar markets, conditional markets) need additional state extensions; the reference flags the extension points.

---

## §3 Production Guardrails

The reference prevents three failure modes:

- **Settlement state lost on reorg.** If the indexer is mid-resolution when a chain reorg happens, naive handlers may retain stale `RESOLVING` state and never re-process the corrected resolution. Pattern: mark settlement state with the block hash of the `OracleResolved` event; on reorg, the dual-write/checkpoint architecture ([ENVIO_CLICKHOUSE_TEARDOWN.md](./ENVIO_CLICKHOUSE_TEARDOWN.md): "DELETE FROM table WHERE checkpoint_id > reorg_checkpoint") cleans the stale state automatically.
- **Oracle read fetched per position.** Naive handlers read the oracle once per position-holder during settlement. Pattern: Effect-wrap the oracle read so all position holders share a single cached read for the market resolution. See [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md).
- **Correction handler races settlement handler.** If a `MarketCorrected` event arrives while `OracleResolved` is still mid-batch, naive handlers race. Pattern: settlement state stored with a monotonic `lastResolutionEvent` block-pointer; correction handler checks that the prior settlement landed cleanly before reversing.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **A docs page** in the prediction-markets section ("Patterns → Settlement Events"). Sections mirror the four-state walkthrough above. Each section has a stub code reference (TypeScript handler signature, no implementation) and a guard rail callout.
- **A 20-minute Loom** that walks the four states against a fork of the prediction-markets template ([ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md)).
- **A reference repo branch** at the prediction-markets template slug (`envio-pm-template-v1`) showing a working four-state settlement handler against a public prediction-market test contract on Sepolia.

The reference is intentionally **not a full sample protocol**. The Growth-Engineering value is in the *pattern*, which composes with whatever protocol the customer is shipping. Inventing a sample protocol would distract.

---

## §5 Adoption Pathway

The reference succeeds when:

1. The docs page becomes the canonical link Envio team members share when a PM builder asks about settlement.
2. The PM template ships with the four-state machine baked in as the default.
3. New PM customers ship correction handling from day one, not as a month-3 retrofit when the first oracle dispute hits.
4. The reference ranks for "prediction market settlement indexer" + adjacent search terms — acquisition leverage on top of activation leverage.

The conversion mechanism: settlement-shaped Google traffic → docs page → PM template fork → 2-month Production trial → Production tier (and eventually Dedicated as leaderboard volume scales).

---

## §6 What This Reference Doesn't Cover

- **Leaderboard query patterns.** Settlement updates leaderboards; the leaderboard query layer is downstream — see [ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md](./ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md).
- **Market creation factory pattern.** Standard dynamic-contract registration; see the DeFi 60-min template for the canonical shape.
- **Conditional / scalar markets.** Flagged as extension points; the four-state reference covers the binary-outcome majority shape.

---

> **Cell:** Activation × Tech [PM] (primary); Retention × Tech [PM] (secondary, settlement bugs are highest churn risk)
> **Revenue mechanism:** Net-new acquisition (settlement is highest-Google-traffic search term among PM builders mid-implementation; reference is acquisition leverage)
> **Named accounts:** Polymarket (settlement at 4B-events scale), Limitless (daily-market settlement cadence), PM wave-2 (sports-prediction protocols are settlement-heavy)
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_PREDICTION_MARKETS_TEMPLATE.md](./ENVIO_PREDICTION_MARKETS_TEMPLATE.md), [ENVIO_EFFECT_API_PATTERN.md](./ENVIO_EFFECT_API_PATTERN.md)

— Kaustubh
