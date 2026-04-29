/**
 * LeaderboardEpochSnapshot — top-N traders per epoch.
 *
 * This is the production-shape leaderboard described in
 * ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md. The snapshot writer is the
 * thing that makes leaderboard queries cheap: instead of running a
 * top-N scan over all UserAggregators on every page load, the front-end
 * reads the latest LeaderboardEpochSnapshot rows for the current epoch.
 *
 * Postgres handles modest N (<10,000 active users). For high-cardinality
 * leaderboards (Polymarket-scale: 4B events, ~hundreds of thousands of
 * active traders), the same snapshot writes flip to ClickHouse Sink in
 * the Dedicated tier — schema and writes don't change, only the
 * destination. This is the "leaderboard tier" tier-up positioning
 * proposed in ENVIO_PREDICTION_MARKETS_POSITIONING_AUDIT.md.
 *
 * Production note: the in-line scan-and-sort below is fine for small N
 * and short epochs but is NOT what production deploys at scale. For
 * production, this is the moment ClickHouse Sink earns its keep — a
 * native sorted-aggregation query on append-only history outperforms
 * Postgres ORDER BY by an order of magnitude. See
 * ENVIO_CLICKHOUSE_TEARDOWN.md.
 */

import type { handlerContext } from "generated";
import {
  LEADERBOARD_EPOCH_SECONDS,
  LEADERBOARD_TOP_N,
  LeaderboardSnapshotId,
} from "../Constants";

/**
 * Round timestamp down to the nearest leaderboard epoch.
 */
function getLeaderboardEpoch(timestamp: bigint): bigint {
  const interval = BigInt(LEADERBOARD_EPOCH_SECONDS);
  return (timestamp / interval) * interval;
}

// In-memory tracking of last epoch written per chain. Avoids a redundant
// full scan on every event in the same epoch. Reset on indexer restart;
// the next event after restart will detect the boundary and write.
const lastWrittenEpochPerChain: Record<number, bigint> = {};

export async function maybeWriteLeaderboardSnapshot(
  context: handlerContext,
  chainId: number,
  timestamp: bigint,
): Promise<void> {
  const currentEpoch = getLeaderboardEpoch(timestamp);
  const lastWritten = lastWrittenEpochPerChain[chainId] ?? 0n;

  if (currentEpoch <= lastWritten) {
    return;  // Same epoch — already written.
  }

  // Production fallback: at scale, this scan moves to ClickHouse Sink
  // and becomes a native sorted-aggregation query. The Postgres-on-
  // Production-tier path is the entry-level shape; the
  // ClickHouse-on-Dedicated-tier path is the production target.
  //
  // The exact API for "scan all UserAggregator rows for this chain and
  // return top-N by realisedPnL" depends on Envio's runtime context
  // surface. The shape below assumes a `getAllForChain`-like reader; in
  // practice you'd use a typed aggregator or flip to ClickHouse Sink.
  //
  // This is intentionally a shape-not-implementation — the production
  // leaderboard architecture is the cited doc, not this stub.
  const topN = await scanTopUsersByPnL(context, chainId, LEADERBOARD_TOP_N);

  // Write top-N rows for this epoch. The (chainId, hourEpoch, rank)
  // composite id makes the snapshot rows naturally idempotent — a re-run
  // of this writer for the same epoch overwrites the same rows.
  for (let i = 0; i < topN.length; i++) {
    const u = topN[i];
    context.LeaderboardEpochSnapshot.set({
      id: LeaderboardSnapshotId(chainId, currentEpoch, i + 1),
      chainId,
      hourEpoch: currentEpoch,
      rank: i + 1,
      trader: u.trader,
      realisedPnL: u.realisedPnL,
      totalCollateralIn: u.totalCollateralIn,
      marketsParticipated: u.marketsParticipated,
    });
  }

  lastWrittenEpochPerChain[chainId] = currentEpoch;
}

/**
 * scanTopUsersByPnL — placeholder for the production query shape.
 *
 * In a real Envio indexer, you would:
 *   - For Production tier: rely on a periodic scan job emitting the snapshot,
 *     not a per-event scan (this is what the per-epoch interval enforces).
 *   - For Dedicated tier with ClickHouse Sink: this becomes a sorted query
 *     against the entity-history table — see ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md
 *     for the canonical query shapes (top-N, time-bucketed rollups,
 *     aggregate scans, user-cohort segmentation).
 *
 * This function is intentionally a shape-only stub so the template
 * compiles; the real implementation depends on which tier the customer
 * deploys on.
 */
async function scanTopUsersByPnL(
  context: handlerContext,
  chainId: number,
  topN: number,
): Promise<
  Array<{
    trader: string;
    realisedPnL: bigint;
    totalCollateralIn: bigint;
    marketsParticipated: number;
  }>
> {
  context.log.debug(
    `Leaderboard scan for chain ${chainId} top-${topN} — shape stub. Replace with ClickHouse query at Dedicated tier.`,
  );
  return [];
}
