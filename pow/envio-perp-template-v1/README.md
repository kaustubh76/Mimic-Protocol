# envio-perp-template-v1

> Perp-protocol indexer template. Forkable scaffold with **GMX-v2-shaped event signatures**, full position lifecycle (open / decrease / liquidation), and funding-rate snapshots — the analytical signal that distinguishes perp indexers from spot DEX indexers.

This is the perp variant of the [DeFi 60-min template](../envio-defi-template-v1/). Same three-layer architecture (EventHandlers → Aggregators → Snapshots), same dynamic-contract registration pattern, but with perp-specific entities: `PerpMarket`, `Position`, `Liquidation`, `FundingSnapshot`.

Event signatures are adapted from [`gmx-io/gmx-synthetics`](https://github.com/gmx-io/gmx-synthetics) — the canonical perp protocol on Arbitrum. Field naming (`positionKey`, `sizeDeltaUsd`, `fundingFeeAmountPerSize`, etc) matches GMX v2 semantics so a reviewer familiar with the protocol can read this template fluently.

---

## Why this template exists

§3 of the [vertical playbook](../../ENVIO_VERTICAL_PLAYBOOK.md) names four DeFi shapes the role's templates should cover: **DEX, perp, money market, execution layer**. The DEX shape lives in [`envio-defi-template-v1/`](../envio-defi-template-v1/); this template proves the framework generalises by shipping the perp shape with the same architecture.

Perp protocols have three indexer-tier requirements that spot DEXes don't:

1. **Position state is per-trader, not per-pool.** A `Position` entity keyed by `positionKey` (bytes32) is the source of truth; `PositionAggregator` rolls up per-trader cumulative state for the leaderboard.
2. **Funding rate continuously affects open positions.** `FundingSnapshot` captures every `FundingFeeAmountPerSizeUpdated` event so front-end queries can compute pending funding by joining (Position.fundingFeeAmountPerSizeAtEntry, latest FundingSnapshot for the market+side).
3. **Liquidations are first-class events.** A separate `Liquidation` entity per liquidation event lets risk dashboards scan liquidation history independently of position state.

---

## What this template gives you

- **GMX-v2-shaped events**: `MarketCreated`, `PositionIncrease`, `PositionDecrease`, `Liquidation`, `FundingFeeAmountPerSizeUpdated`. Field names match GMX v2 conventions.
- **Position lifecycle handlers** that track size, collateral, and signed realized PnL per position.
- **Long/short open interest split** in the per-market aggregator — the front-end's primary risk display.
- **Per-trader cumulative state** (`PositionAggregator`) — leaderboard source.
- **Funding-rate snapshots** — the analytical signal that distinguishes perp from spot.
- **Liquidation entities** keyed by `positionKey-blockNumber-logIndex` — every liquidation queryable independently.
- **Dynamic market registration** via factory pattern (same as DEX + PM templates).
- **`pnpm install && pnpm codegen && pnpm test` clean** — 4/4 vitest passing, full lifecycle covered.

---

## Simplification from canonical GMX v2

GMX v2's `EventEmitter` uses a generic `EventLogData` bytes-encoded shape (efficient on-chain, opaque to typed indexers). This template uses **flat typed events** with the same field names — so the indexer's generated bindings get strongly-typed `event.params.sizeDeltaUsd` etc, instead of having to decode `bytes` payloads at runtime. Field semantics are unchanged; the wire format is simpler.

For a real production indexer wrapping GMX v2 itself, you'd use Envio's raw-events mode + a decode helper for the `EventLog1`/`EventLog2` bytes payloads. That's a different architecture than this template demonstrates; flagged here so reviewers know I considered both.

---

## 60-minute walkthrough

| Minute | File | What you learn |
|---|---|---|
| 0–10 | `config.yaml` | Arbitrum config, dynamic Market registration |
| 10–20 | `schema.graphql` | Three-layer entity model — Position keyed by bytes32 positionKey |
| 20–35 | `src/EventHandlers/Market.ts` | PositionIncrease, PositionDecrease, Liquidation, funding |
| 35–45 | `src/Aggregators/PerpAggregator.ts` | Long/short open interest split + signed PnL |
| 45–55 | `src/Aggregators/PositionAggregator.ts` | Per-trader leaderboard source |
| 55–60 | Run | `pnpm install && pnpm codegen && pnpm test` → all green |

---

## Run it

```bash
pnpm install
cp .env.example .env
# Replace ENVIO_ARBITRUM_RPC_URL with your provider
pnpm codegen
pnpm test
pnpm dev   # runs the indexer against the configured network
```

GraphQL playground at `http://localhost:8080`:

```graphql
query Top10TradersByRealisedPnL {
  PositionAggregator(
    order_by: { cumulativeRealizedPnlUsd: desc }
    limit: 10
  ) {
    account
    cumulativeRealizedPnlUsd
    cumulativeSizeIncreaseUsd
    liquidationCount
    marketsTraded
  }
}

query OpenInterestByMarket {
  PerpAggregator {
    marketAddress
    longOpenInterestUsd
    shortOpenInterestUsd
    totalLiquidations
    uniqueTraders
  }
}

query LatestFundingPerSide($marketId: String!) {
  FundingSnapshot(
    where: { market_id: { _eq: $marketId } }
    order_by: { updatedAt: desc }
    limit: 2  # one per side
  ) {
    isLong
    fundingFeeAmountPerSize
    updatedAt
  }
}
```

---

## What's next

- **Tier up to "the leaderboard tier"** — see [`ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md`](../../ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md). The same per-user accumulator pattern from the PM template applies to perp leaderboards; ClickHouse Sink Dedicated tier handles funding-adjusted PnL queries at GMX-scale event volume.
- **Multi-chain expansion** — same `add-chain` CLI as the DEX and PM templates. Adding chain #N is a config change, not a code change.
- **Full GMX v2 integration** — replace the flat-event ABIs in `abis/` with GMX v2's `EventLog1`/`EventLog2` raw events + a decode helper, point at the real `EventEmitter` address on Arbitrum.

---

## Provenance

Event signatures are adapted from [`gmx-io/gmx-synthetics/contracts/event/EventEmitter.sol`](https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/event/EventEmitter.sol) and [`PositionEventUtils.sol`](https://github.com/gmx-io/gmx-synthetics/blob/main/contracts/position/PositionEventUtils.sol). Field naming, semantics, and indexing conventions match GMX v2; the wire format is simplified to flat typed events. Protocol-specific math (oracle pricing, ADL, fee splits) stays out — this is an indexing template, not a protocol implementation.

---

## License

MIT.
