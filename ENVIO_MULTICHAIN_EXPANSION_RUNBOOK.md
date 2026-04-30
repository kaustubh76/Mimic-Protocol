# Multi-Chain Expansion In One Afternoon — Runbook

**From:** Kaustubh Agrawal — Growth Engineer candidate
**Companion docs:** [ENVIO_VERTICAL_PLAYBOOK.md](./ENVIO_VERTICAL_PLAYBOOK.md) · [ENVIO_INDEXER_TEARDOWN.md](./ENVIO_INDEXER_TEARDOWN.md) · [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md) · [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md)

> *Runbook spec for the expansion-stage tech artifact named in §3 of the playbook. Anchored to Sablier's `@sablier/devkit` codegen approach (27 contract deployments) and Velodrome+Aerodrome's 12-chain footprint. The atomic claim: with this runbook, adding chain #2 is a one-afternoon task instead of a one-week project.*
>
> **Live reference code:** [`pow/envio-defi-template-v1/src/Constants.ts`](./pow/envio-defi-template-v1/src/Constants.ts) shows the chain-keyed `CHAIN_CONFIG: Record<number, ChainConstants>` pattern (lines 28–46). [`pow/envio-defi-template-v1/config.yaml`](./pow/envio-defi-template-v1/config.yaml) shows the chain-list shape — adding chain #3 is one record in `CHAIN_CONFIG` plus one `networks:` entry in `config.yaml`. Handlers in [`src/EventHandlers/PoolFactory.ts`](./pow/envio-defi-template-v1/src/EventHandlers/PoolFactory.ts) read constants by `event.chainId` — there are no `if/else` chains across event handlers.

---

## §1 Why This Runbook Exists

§3 of the playbook names the failure mode: "If adding chain #2 is a one-week project, they defer it; if it's a one-afternoon project (with the right template), they do it the same week." The default Envio shape — hand-written multi-chain config, hand-written contract addresses per chain, hand-written network configurations — is the one-week shape. The Sablier+Velodrome shape — codegen-driven config, dynamic contract registration, chain-keyed constants — is the one-afternoon shape. The runbook's job is moving the one-afternoon shape from "production reference at two customers" to "documented default for the next 20."

This closes two §2 cells:

- **Expansion × Tech [DeFi]** — the documented default removes the technical friction that defers expansion.
- **Expansion × Business [DeFi]** — the runbook is the artifact a Growth Engineer hands to an anchor account ahead of their next chain expansion as a co-engineering offer.

---

## §2 Anatomy

The runbook is a single markdown doc + a reference repo at slug `envio-multichain-expansion` (proposed). The doc walks four phases. Each phase cites a customer reference rather than re-implementing the pattern.

### Phase 1 — Pre-flight (15 minutes)

A checklist the customer runs before touching any code:

- Confirm the indexer follows the Aggregators+Snapshots layout (if not, the runbook recommends running [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md) first; multi-chain expansion atop a flat-handler shape is the one-week version, not the one-afternoon version).
- Confirm dynamic contract registration is in use for any per-pool / per-vault contracts. (Hard-coded address arrays per chain are the failure mode.)
- Confirm Effect-wrapped reads exist for any cross-chain external lookup — token metadata, oracle prices, forex.
- Confirm a codegen pipeline exists (or is willing to be added). Sablier ships `@sablier/devkit`; Velodrome ships `justfile` recipes (`codegen-config`, `codegen-bindings`, `codegen-schema`). The runbook recommends one of those two shapes.

### Phase 2 — Add chain #2 to config (45 minutes)

The customer adds the new chain to their codegen source-of-truth, then re-runs codegen. The diff that lands in `config.yaml` is generated, not hand-written.

Reference: Sablier's `@sablier/devkit` source-of-truth for chain enumeration drives the `config.yaml` for all three of their indexers (streams, airdrops, analytics) across 27 deployments. The runbook documents the *shape* of that source-of-truth — chain ID, RPC endpoint, factory contract addresses, start block — without re-implementing it.

Velodrome's `justfile` is the alternate reference — recipe-driven codegen that's lighter than a full devkit but still avoids hand-written multi-chain config.

### Phase 3 — Chain-keyed constants + handlers (60 minutes)

Anything hard-coded per chain — block-time, gas-price defaults, oracle addresses — moves into `Constants.ts` keyed by chain ID. Handlers read constants by `event.chainId`. No `if/else` chains across event handlers.

Reference: Velodrome's `Constants.ts` is the production shape — chain-keyed constants used by the PriceOracle, the Aggregators, and the Snapshots layer.

### Phase 4 — Verify + ship (30 minutes)

The customer runs the local indexer against chain #2's RPC, checks that GraphQL queries return data, and pushes to the hosted service. The hosted-service redeploy is automatic — no infra work.

Total: ~2.5 hours of hands-on work. The "one afternoon" claim holds when phases 1–3 are pre-set up by the runbook (codegen pipeline, dynamic contracts, Effects). When they aren't, expansion lands closer to one week and the runbook flags this as the activation prerequisite.

---

## §3 Production Guardrails

The runbook prevents three failure modes documented in the indexer teardown:

- **Multi-chain config sprawl.** Without codegen, a 12-chain indexer has 12× the config maintenance. The codegen step keeps it 1×.
- **Per-chain handler forks.** Without chain-keyed constants, handlers grow `if (event.chainId === 8453) { ... }` branches. The constants pattern keeps handlers chain-agnostic.
- **Hard-coded contract address per chain.** Without dynamic contract registration, every new chain requires hand-listing its factory deployments. Dynamic registration via factory events keeps the config empty (`address: []`) and the runtime self-registers.

---

## §4 Walkthrough Hooks

A productised version ships as:

- **The runbook doc** at the canonical docs slot ("Tutorials → Multi-Chain Expansion").
- **A 30-minute Loom** that walks the four phases against a fork of the DeFi 60-min template.
- **The reference repo** with two example chains pre-configured and a third left as the exercise.
- **A co-engineering session offer** for anchor accounts — Velodrome (next chain), Sablier (next deployment), LI.FI (next bridge route). The session is 90 minutes; the runbook is the asset the customer keeps.

---

## §5 Adoption Pathway

The runbook succeeds when:

1. Anchor DeFi customers expand to a new chain inside one week of the conversation, not one quarter.
2. New customers shipping the DeFi 60-min template add chain #2 inside their first month.
3. The runbook becomes the asset Envio team members link to when an account roadmap surfaces a pending chain expansion.

The expansion conversion mechanism: each successful chain expansion at an anchor account is incremental ARR (more events indexed, often crossing tier thresholds). The §3 playbook names the highest-NRR-impact intervention as removing this friction; the runbook is the operationalisation.

---

## §6 Named Account Plays

| Account | Pending expansion (illustrative) | Runbook offer |
|---|---|---|
| **Sablier** | Next supported network in their codegen surface | Co-author the runbook using their `@sablier/devkit` as the canonical reference |
| **Velodrome+Aerodrome** | 13th chain | 90-minute co-engineering session; the chain ships the same week |
| **LI.FI** | Next bridge route | Co-engineering session; expansion ARR direct |

---

## §7 What This Runbook Doesn't Cover

- **Money-market multi-chain shape** — see [ENVIO_MONEY_MARKET_TEMPLATE.md](./ENVIO_MONEY_MARKET_TEMPLATE.md). Aave V3's deterministic deployment means most chains share the same Pool address; the runbook applies but the address-discovery step is trivial.
- **Cross-chain analytical queries** — analytics-tier concern; see [ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md) for the query layer.

---

> **Cell:** Expansion × Tech [DeFi]; Expansion × Business [DeFi]
> **Revenue mechanism:** Expansion ARR (more chains × existing accounts; the §3 playbook names this as the highest-NRR-impact intervention)
> **Named accounts:** Sablier (27 deployments, devkit codegen reference), Velodrome+Aerodrome (12-chain footprint, justfile codegen reference), LI.FI
> **Sibling artifacts:** [ENVIO_PAIN_MAP_MATRIX.md](./ENVIO_PAIN_MAP_MATRIX.md), [ENVIO_DEFI_60MIN_TEMPLATE.md](./ENVIO_DEFI_60MIN_TEMPLATE.md), [ENVIO_DEFI_TECH_DIAGNOSTIC.md](./ENVIO_DEFI_TECH_DIAGNOSTIC.md)

— Kaustubh
