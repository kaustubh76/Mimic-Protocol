/**
 * Pool event handler — Swap, Mint, Burn, Sync, Fees.
 *
 * Each event delegates aggregation to src/Aggregators/PoolAggregator.ts
 * and snapshot creation to src/Snapshots/PoolHourSnapshot.ts. The handler
 * itself is intentionally thin — it does the preload, calls the aggregator,
 * and returns. This is the "EventHandlers as ingestion only" separation
 * documented in ENVIO_INDEXER_TEARDOWN.md.
 *
 * Reference: velodrome-finance/indexer/src/EventHandlers/Pool/PoolSwapLogic.ts
 * (their per-event logic is split across multiple files; we keep one file
 * for the 60-minute template's readability budget).
 */

import { Pool } from "generated";
import { PoolId } from "../Constants";
import {
  applySwap,
  applyMint,
  applyBurn,
  applySync,
  applyFees,
} from "../Aggregators/PoolAggregator";
import { maybeWriteHourSnapshot } from "../Snapshots/PoolHourSnapshot";

// -----------------------------------------------------------------
// Swap — the highest-frequency event. Volumes accumulate here.
// -----------------------------------------------------------------
Pool.Swap.handler(async ({ event, context }) => {
  const poolId = PoolId(event.chainId, event.srcAddress);

  // Preload first: aggregator is the only entity this handler needs to
  // mutate, but reading it inside the await for snapshot lookups would
  // serialise reads. Promise.all keeps them parallel — the documented
  // entity-cache-first preload pattern.
  const [aggregator] = await Promise.all([
    context.PoolAggregator.get(poolId),
  ]);

  if (!aggregator) {
    // Should be unreachable in practice — PoolFactory.PoolCreated runs
    // before any of the pool's events. If we hit this, the indexer is in
    // an inconsistent state and the operator needs to know.
    context.log.error(
      `Swap on pool ${poolId} but no PoolAggregator. PoolFactory handler may have failed.`,
    );
    return;
  }

  const updated = applySwap(aggregator, {
    amount0In: event.params.amount0In,
    amount1In: event.params.amount1In,
    amount0Out: event.params.amount0Out,
    amount1Out: event.params.amount1Out,
    timestamp: BigInt(event.block.timestamp),
  });
  context.PoolAggregator.set(updated);

  // Snapshot helper checks epoch boundary internally — no-op if we're
  // still in the same hour as the last snapshot.
  await maybeWriteHourSnapshot(context, updated, BigInt(event.block.timestamp));
});

// -----------------------------------------------------------------
// Mint — liquidity added.
// -----------------------------------------------------------------
Pool.Mint.handler(async ({ event, context }) => {
  const poolId = PoolId(event.chainId, event.srcAddress);
  const aggregator = await context.PoolAggregator.get(poolId);
  if (!aggregator) return;

  const updated = applyMint(aggregator, {
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    timestamp: BigInt(event.block.timestamp),
  });
  context.PoolAggregator.set(updated);
});

// -----------------------------------------------------------------
// Burn — liquidity removed.
// -----------------------------------------------------------------
Pool.Burn.handler(async ({ event, context }) => {
  const poolId = PoolId(event.chainId, event.srcAddress);
  const aggregator = await context.PoolAggregator.get(poolId);
  if (!aggregator) return;

  const updated = applyBurn(aggregator, {
    amount0: event.params.amount0,
    amount1: event.params.amount1,
    timestamp: BigInt(event.block.timestamp),
  });
  context.PoolAggregator.set(updated);
});

// -----------------------------------------------------------------
// Sync — reserves updated. Fires after every Mint/Burn/Swap.
// -----------------------------------------------------------------
Pool.Sync.handler(async ({ event, context }) => {
  const poolId = PoolId(event.chainId, event.srcAddress);
  const aggregator = await context.PoolAggregator.get(poolId);
  if (!aggregator) return;

  const updated = applySync(aggregator, {
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
    timestamp: BigInt(event.block.timestamp),
  });
  context.PoolAggregator.set(updated);
});

// -----------------------------------------------------------------
// Fees — protocol fees claimed. Cumulative.
// -----------------------------------------------------------------
Pool.Fees.handler(async ({ event, context }) => {
  const poolId = PoolId(event.chainId, event.srcAddress);
  const aggregator = await context.PoolAggregator.get(poolId);
  if (!aggregator) return;

  const updated = applyFees(aggregator, {
    fees0: event.params.amount0,
    fees1: event.params.amount1,
    timestamp: BigInt(event.block.timestamp),
  });
  context.PoolAggregator.set(updated);
});
