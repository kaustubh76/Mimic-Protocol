# envio-defi-template-v1

> Production-grade DeFi indexer template. Forkable starting point for a multi-chain DEX indexer with Aggregators+Snapshots architecture, dynamic contract registration, and Effect-API-ready external reads. Mirrors the architecture used in production at [velodrome-finance/indexer](https://github.com/velodrome-finance/indexer).

This template ships configured for **Velodrome V2 on Optimism (chain 10)** and **Aerodrome on Base (chain 8453)**. Both factory addresses are real, the ABIs (`abis/PoolFactory.json`, `abis/Pool.json`) are copied from Velodrome's public indexer.

---

## What this template gives you

A **production-shape** indexer scaffold — meaning the patterns visible in the production reference repo are baked in as defaults, not retrofitted later:

- **Three-layer entity model** — `EventHandlers/` ingestion → `Aggregators/` derived state → `Snapshots/` time-series. Every layer maps to a directory; nothing is mixed in a single file.
- **Dynamic contract registration** — `PoolFactory.PoolCreated.contractRegister(...)` registers each new pool at runtime. `address: []` for Pool in `config.yaml` is intentional; you do not hardcode pool addresses.
- **Effect API + entity-cache-first preload** — `Promise.all` of entity reads + Effect reads at the top of every handler. See `src/Effects/TokenMetadata.ts`.
- **Chain-keyed constants** — adding chain #3 means one record in `src/Constants.ts` and one network entry in `config.yaml`. No `if (chainId === ...)` branches in handlers.
- **Hourly snapshots** — epoch-aligned, append-only, reorg-safe via Envio's checkpoint deletion.

---

## 60-minute walkthrough

The repository is sized to be readable end-to-end in one session. Per-file budget:

| Minute | File | What you learn |
|---|---|---|
| 0–10 | `config.yaml` | Multi-chain config; dynamic contract pattern; ABI references |
| 10–20 | `schema.graphql` | Three-layer entity model; entity-id-as-string idiom |
| 20–35 | `src/EventHandlers/PoolFactory.ts` | Two-stage registration + handler; Promise.all preload; Effect API call |
| 35–45 | `src/Aggregators/PoolAggregator.ts` | Pure derived-state functions; aggregation without race conditions |
| 45–55 | `src/Snapshots/PoolHourSnapshot.ts` | Epoch-aligned hourly snapshots; append-only time-series |
| 55–60 | Run + query | `pnpm install && pnpm dev` → GraphQL playground at `http://localhost:8080` |

---

## Run it

```bash
pnpm install
cp .env.example .env
# Add your Optimism RPC URL to .env (Alchemy, QuickNode, or public)
pnpm codegen
pnpm dev
```

Then hit `http://localhost:8080` for the GraphQL playground. Try:

```graphql
query TopPoolsByVolume {
  PoolAggregator(
    order_by: { cumulativeVolume0: desc }
    limit: 10
  ) {
    id
    poolAddress
    cumulativeVolume0
    cumulativeVolume1
    swapCount
    lastUpdatedTimestamp
  }
}
```

---

## What's next

Three follow-up paths from this template:

1. **Add chain #3** — see [`ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md`](../../ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md). One-afternoon task with the codegen-friendly config + chain-keyed constants already in place.
2. **Upgrade the analytics layer** — see [`ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md`](../../ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md). The Aggregator+Snapshot architecture flips to ClickHouse Sink with no schema changes.
3. **Effect API patterns at scale** — see [`ENVIO_EFFECT_API_PATTERN.md`](../../ENVIO_EFFECT_API_PATTERN.md). The token-metadata Effect in this template is the canonical shape; cache optimisation tricks (Sablier's `0`-alias) are the next layer.

---

## Provenance

This template is **adapted** from `velodrome-finance/indexer`, not a fork. The directory layout, the dynamic-registration pattern, the Aggregator+Snapshot split, and the chain-keyed constants idiom are all visible in their public repo. The handler bodies here are slim reference shapes — production indexers add liquidity tracking, votes, emissions, fee splits across staked/unstaked LPs, and CL pool state on top of this base.

Cite line: see [`ENVIO_INDEXER_TEARDOWN.md`](../../ENVIO_INDEXER_TEARDOWN.md) for the architectural teardown that informed this scaffold.

---

## License

MIT.
