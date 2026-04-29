# envio-pm-template-v1

> Production-grade prediction-markets indexer template. Forkable starting point with **the four-state settlement machine baked in as the default**, a leaderboard-tier-ready aggregator architecture, and a market-type taxonomy for intra-product expansion.

The five PM event shapes named in §4 of the [vertical playbook](../../ENVIO_VERTICAL_PLAYBOOK.md) — **market creation, position taking, market locking, oracle resolution, correction handling, payout claiming** — are all baked in. Settlement specifically is implemented as a documented four-state machine: see [`src/EventHandlers/Settlement.ts`](./src/EventHandlers/Settlement.ts) and the prose reference in [`ENVIO_SETTLEMENT_HANDLER_REFERENCE.md`](../../ENVIO_SETTLEMENT_HANDLER_REFERENCE.md).

This template uses a generic prediction-market ABI shape that maps to the event semantics common across Polymarket, Limitless, Augur, SX Bet, and similar protocols. Plug in your own MarketFactory address and the indexer runs.

---

## What this template gives you

- **Four-state settlement machine** — `OPEN → RESOLVING → SETTLED → CORRECTED`, with reorg-safe state transitions and race-safe correction handling. The trickiest event in the vertical, documented and runnable.
- **Effect-cached oracle reads** — a market with N winning positions triggers ONE oracle RPC call, not N. See [`src/Effects/OracleRead.ts`](./src/Effects/OracleRead.ts).
- **Per-user leaderboard source** — `UserAggregator` tracks `realisedPnL`, ready for top-N queries. See [`src/Aggregators/UserAggregator.ts`](./src/Aggregators/UserAggregator.ts).
- **Per-epoch leaderboard snapshot** — `LeaderboardEpochSnapshot` writes top-N rows on epoch boundary. Postgres at small N; ClickHouse Sink at scale (the "leaderboard tier").
- **Market-type taxonomy** — `MarketCategory` enum + `parseMarketCategory()` parser. Adding sports → politics → crypto-prices → custom is a one-line addition. This is the **intra-product expansion** mechanism §4 of the playbook names as the PM-specific expansion shape (vs DeFi's multi-chain).
- **Dynamic market registration** — `MarketFactory.MarketCreated.contractRegister()` registers each new market at runtime. `address: []` for Market in `config.yaml` is intentional.

---

## 90-minute walkthrough

The repository is sized to be readable end-to-end in one ~90-minute session. Per-file budget:

| Minute | File | What you learn |
|---|---|---|
| 0–10 | `config.yaml` | Multi-chain config; dynamic market registration |
| 10–20 | `schema.graphql` | Three-layer entity model; market state enum; market-type taxonomy |
| 20–30 | `src/EventHandlers/MarketFactory.ts` + `Market.ts` | Position lifecycle handlers |
| 30–45 | `src/EventHandlers/Settlement.ts` | **The four-state machine.** OPEN→RESOLVING→SETTLED→CORRECTED |
| 45–55 | `src/Aggregators/MarketAggregator.ts` + `UserAggregator.ts` | Per-market open interest; per-user realisedPnL |
| 55–65 | `src/Snapshots/LeaderboardSnapshot.ts` | Per-epoch top-N snapshot; ClickHouse-Sink-ready |
| 65–75 | Run + query | `pnpm install && pnpm dev` → GraphQL playground |
| 75–85 | Add a market category | One-line addition to the taxonomy |
| 85–90 | What's next | Three follow-up paths (below) |

---

## Run it

```bash
pnpm install
cp .env.example .env
# Add your Polygon and/or Base RPC URLs to .env
pnpm codegen
pnpm dev
```

Then hit `http://localhost:8080` for the GraphQL playground. Try:

```graphql
query Top10TradersByPnL {
  UserAggregator(
    order_by: { realisedPnL: desc }
    limit: 10
  ) {
    trader
    realisedPnL
    totalCollateralIn
    marketsParticipated
    positionCount
  }
}

query MarketsAwaitingSettlement {
  Market(where: { state: { _eq: RESOLVING } }) {
    address
    questionId
    endTime
    category
  }
}

query CorrectedMarkets {
  Market(where: { state: { _eq: CORRECTED } }) {
    address
    previousWinningOutcome
    winningOutcome
    correctedAt
  }
}
```

---

## What's next

Three follow-up paths from this template:

1. **Tier up to "the leaderboard tier"** — see [`ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md`](../../ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md). The leaderboard snapshot writer in this template is shape-compatible with ClickHouse Sink: at scale, the same writes flip to the Dedicated tier with no schema changes.
2. **Settlement deep-dive** — see [`ENVIO_SETTLEMENT_HANDLER_REFERENCE.md`](../../ENVIO_SETTLEMENT_HANDLER_REFERENCE.md). The four-state machine in `src/EventHandlers/Settlement.ts` is the canonical reference; production extensions cover scalar markets, conditional markets, and exotic settlement schemes.
3. **Effect API for oracle reads at scale** — see [`ENVIO_EFFECT_API_PATTERN.md`](../../ENVIO_EFFECT_API_PATTERN.md). Cache-key design for the oracle Effect is the difference between 10,000 RPC calls per settled market and 1.

---

## Provenance

This template is a **synthesised reference** — the ABI shape is generic but maps to event semantics common across published prediction-market protocols (Polymarket's CTF + UMA optimistic oracle, Limitless daily markets, Augur). The four-state settlement machine, the leaderboard architecture, and the market-type taxonomy are all derived from the architectural patterns named in [`ENVIO_VERTICAL_PLAYBOOK.md`](../../ENVIO_VERTICAL_PLAYBOOK.md) §4 and the analytical query shapes catalogued in [`ENVIO_CLICKHOUSE_TEARDOWN.md`](../../ENVIO_CLICKHOUSE_TEARDOWN.md).

To plug in a real protocol: replace the placeholder MarketFactory addresses in `config.yaml` with your protocol's deployed factory, and adapt `abis/Market.json` to your protocol's exact event signatures (the names in this template — `PositionTaken`, `OracleResolved`, `MarketCorrected` — are the standard shape; your protocol may rename them).

---

## License

MIT.
