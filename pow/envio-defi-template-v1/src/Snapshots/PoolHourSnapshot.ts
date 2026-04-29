/**
 * PoolHourSnapshot — hourly time-series captures.
 *
 * Reference: velodrome-finance/indexer/src/Snapshots/Shared.ts
 * (their `getSnapshotEpoch` function rounds timestamps down to a snapshot
 * interval — same pattern, generalised across multiple entity types).
 *
 * The Snapshot layer is what makes time-series queries efficient. Without
 * it, "volume per hour for the last 30 days" requires scanning every Swap
 * event. With it, the query is a 30-row read.
 *
 * Snapshots are append-only. On reorg, Envio's checkpoint-based deletion
 * (documented in ENVIO_CLICKHOUSE_TEARDOWN.md) cleans them automatically.
 *
 * Tier-up note: this template's snapshots live in Postgres. For
 * leaderboard-grade query latency, the same snapshot writes flip to
 * ClickHouse Sink in the Dedicated tier — see
 * ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md.
 */

import type { handlerContext, PoolAggregator } from "generated";
import { SNAPSHOT_INTERVAL_SECONDS, SnapshotId } from "../Constants";

/**
 * Round a timestamp down to the nearest snapshot epoch boundary.
 * Pure function — same input, same output, no I/O.
 */
export function getSnapshotEpoch(timestamp: bigint): bigint {
  const interval = BigInt(SNAPSHOT_INTERVAL_SECONDS);
  return (timestamp / interval) * interval;
}

/**
 * Write a snapshot iff we've crossed an epoch boundary since the last one.
 * This is the "snapshot on event, not on schedule" pattern — the indexer
 * doesn't run cron jobs, the data does.
 */
export async function maybeWriteHourSnapshot(
  context: handlerContext,
  aggregator: PoolAggregator,
  timestamp: bigint,
): Promise<void> {
  const currentEpoch = getSnapshotEpoch(timestamp);
  const lastEpoch = getSnapshotEpoch(aggregator.lastSnapshotTimestamp);

  // Same epoch — no new snapshot needed.
  if (currentEpoch <= lastEpoch && aggregator.lastSnapshotTimestamp !== 0n) {
    return;
  }

  // Compute delta from previous snapshot (if any). The "if any" branch is
  // the only place this needs a read — and it's an entity read, not an
  // RPC call, so it's cheap.
  let prevSnapshot = null;
  if (aggregator.lastSnapshotTimestamp !== 0n) {
    prevSnapshot = await context.PoolHourSnapshot.get(
      SnapshotId(aggregator.id, lastEpoch),
    );
  }

  const hourlyVolume0 = prevSnapshot
    ? aggregator.cumulativeVolume0 - prevSnapshot.cumulativeVolume0
    : aggregator.cumulativeVolume0;
  const hourlyVolume1 = prevSnapshot
    ? aggregator.cumulativeVolume1 - prevSnapshot.cumulativeVolume1
    : aggregator.cumulativeVolume1;

  context.PoolHourSnapshot.set({
    id: SnapshotId(aggregator.id, currentEpoch),
    pool_id: aggregator.id,
    chainId: aggregator.chainId,
    hourEpoch: currentEpoch,
    reserve0: aggregator.reserve0,
    reserve1: aggregator.reserve1,
    cumulativeVolume0: aggregator.cumulativeVolume0,
    cumulativeVolume1: aggregator.cumulativeVolume1,
    hourlyVolume0,
    hourlyVolume1,
    swapCount: aggregator.swapCount,
  });

  // Update the aggregator's lastSnapshotTimestamp so the next event in
  // the same hour skips this whole function.
  context.PoolAggregator.set({
    ...aggregator,
    lastSnapshotTimestamp: currentEpoch,
  });
}
