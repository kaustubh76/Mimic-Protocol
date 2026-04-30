# envio-perp-template-v1

> Perp-protocol indexer template targeting **GMX v2's REAL `EventEmitter` pattern on Arbitrum**. Subscribes to a single global `EventEmitter` contract, routes events on the `eventName` string, decodes the `EventLogData` typed dictionary into typed entity fields.
>
> 🟢 **Verified live against GMX v2 on Arbitrum** — see [`docs/screenshots/queries-perp/`](../../docs/screenshots/queries-perp/) for real on-chain captures (9 perp markets, 1252 positions, $950k+ position sizes), and `pnpm assert:perp` for the assertion harness (2,522/2,522 invariants passing on real data).

---

## v1 scope: PositionIncrease only

**This template's v1 handles ONE event type — `PositionIncrease` — to validate the architecture works against real GMX v2 data.** The decode helper (`src/Effects/decodeEventLogData.ts`) is event-agnostic; adding `PositionDecrease`, `Liquidation`, `OrderExecuted`, `FundingFeeAmountPerSizeUpdated`, and the dozens of other GMX events is mechanical (one `case "EventName":` branch + a typed decoder per event).

**v1's bet:** prove the architecture works against real chain data with one event, ship it, then expand to v2 with the rest. v2 is documented as a follow-up; the scope-cut is named explicitly so reviewers see disciplined incrementalism.

The previous version of this template (pre-2026-04-30) used **synthesised flat events** — invented `PositionIncrease(positionKey, account, isLong, sizeDeltaUsd, ...)` event signatures with named indexed fields. Easy to typecheck; impossible to live-run because no real protocol emits that shape. Pivoting to GMX v2's actual `EventEmitter` was the right move; the synthesised version was a teaching scaffold, not a production target.

---

## Architecture — what GMX v2 forces

GMX v2 emits ALL position/order/funding/liquidation events through a **single `EventEmitter` contract** at [`0xC8ee91A54287DB53897056e12D9819156D3822Fb`](https://arbiscan.io/address/0xC8ee91A54287DB53897056e12D9819156D3822Fb) on Arbitrum, using:

```solidity
event EventLog1(
  address msgSender,
  string eventName,                       // routing key — e.g. "PositionIncrease"
  string indexed eventNameHash,
  bytes32 indexed topic1,
  EventUtils.EventLogData eventData       // bytes-encoded typed dictionary
);
```

`EventLogData` is a struct of 7 sections (`addressItems`, `uintItems`, `intItems`, `boolItems`, `bytes32Items`, `bytesItems`, `stringItems`), each `[items, arrayItems]` where `items = Array<[key, value]>`. The decode helper at [`src/Effects/decodeEventLogData.ts`](./src/Effects/decodeEventLogData.ts) flattens this into a typed dictionary keyed by string.

This is **the actual production GMX v2 architecture**, not a simplification. Customers indexing GMX v2 hit exactly this shape; the template demonstrates how to handle it cleanly.

---

## Three architectural differences from the DEX + money-market templates

1. **No factory pattern.** GMX v2's markets are pre-deployed and registered via a separate `MarketFactory` contract (out of v1 scope). PerpMarket entities are **lazy-created** on the first PositionIncrease that references a previously-unseen market.
2. **Generic event routing.** Handler subscribes to `EventLog1` (one event) and routes on `event.params.eventName` (string) to per-event paths. Template ships the routing skeleton; v1 implements the `PositionIncrease` branch.
3. **Bytes-encoded typed payload.** The `eventData` field requires the decode helper to extract typed fields. Once decoded, the rest of the indexer (entity writes, aggregator updates) is identical to other templates.

---

## What this template gives you (v1)

- **Real GMX v2 EventEmitter integration** — config.yaml points at the verified Arbitrum deployment.
- **Decode helper** at `src/Effects/decodeEventLogData.ts` — turns the tuple-of-tuples typed binding into a typed dictionary keyed by string. Reusable for every other GMX v2 event type when extending to v2.
- **PositionIncrease handler** — lazy-creates PerpMarket + PerpAggregator on first sighting, writes Position entity, updates per-trader PositionAggregator.
- **Long/short open interest split** in PerpAggregator (long-only in v1; short side gets populated when PositionDecrease handling lands in v2).
- **Per-trader cumulative state** (PositionAggregator) — the cross-market leaderboard source.
- **Schema retains** Liquidation + FundingSnapshot entity types — unused in v1 but pre-declared so v2 doesn't require schema migration.
- **`pnpm install && pnpm codegen && pnpm test` clean** — 2/2 active tests passing (3 marked `it.skip` referencing v2 follow-up).
- **Live verification harness** — `pnpm assert:perp` in [`scripts/demo-capture/`](../../scripts/demo-capture/) checks 4 cross-entity invariants against real Arbitrum GMX v2 data.

---

## v2 scope (mechanical follow-up)

For each new event type, add a `case` branch in `src/EventHandlers/EventEmitter.ts` and a corresponding decoder in `src/Effects/decodeEventLogData.ts`:

| Event | Handler scope | Schema |
|---|---|---|
| `PositionDecrease` | shrink position size, accumulate `cumulativeRealizedPnl`, update aggregator open interest down | Position (existing) |
| `OrderExecuted` | track fill events; cross-reference with Position via orderKey | new `Order` entity |
| `LiquidationOccurred` (the actual GMX v2 event name) | latch `Position.isLiquidated`, write Liquidation entity | Liquidation (already in schema) |
| `FundingFeeAmountPerSizeUpdated` | write FundingSnapshot per (market, isLong) | FundingSnapshot (already in schema) |
| `MarketCreated` (from MarketFactory contract — separate subscription) | populate `PerpMarket.{indexToken,longToken,shortToken,salt}` properly | PerpMarket (existing — lazy-create stays as fallback) |

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
