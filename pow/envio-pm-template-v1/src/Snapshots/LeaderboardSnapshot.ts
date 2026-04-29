/**
 * LeaderboardEpochSnapshot — top-N traders per epoch.
 *
 * This is the production-shape leaderboard described in
 * ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md. The snapshot writer is the
 * thing that makes leaderboard queries cheap: instead of running a
 * top-N scan over all UserAggregators on every page load, the front-end
 * reads the latest LeaderboardEpochSnapshot rows for the current epoch.
 *
 * IMPLEMENTATION NOTE — why an in-memory accumulator:
 *
 * Envio v2's handler context exposes per-entity get/set/getOrThrow but no
 * scan-all-entities API. So instead of asking the DB on every epoch
 * boundary "give me top-100 traders by realisedPnL", we maintain a
 * per-chain in-memory map of (trader → realisedPnL) updated incrementally
 * on every position-related event. At epoch boundary we sort the map and
 * emit the top-N rows.
 *
 * This works at Production-tier scale (thousands of active traders per
 * chain). Memory is O(active_traders × ~80 bytes/entry).
 *
 * For Polymarket-scale (4B events, hundreds of thousands of active
 * traders): switch to ClickHouse Sink Dedicated tier. The same per-event
 * trader updates flow into ClickHouse's append-only entity history table,
 * and the per-epoch top-N becomes a native sorted-aggregation query —
 * outperforming both this in-memory pass and Postgres ORDER BY by an
 * order of magnitude. See ENVIO_CLICKHOUSE_TEARDOWN.md.
 *
 * The data layout doesn't change between tiers; only the query layer does.
 */

import type { handlerContext } from "generated";
import {
  LEADERBOARD_EPOCH_SECONDS,
  LEADERBOARD_TOP_N,
  LeaderboardSnapshotId,
} from "../Constants";

// Minimal per-trader summary kept in memory. We track only the fields the
// snapshot row writes — keeping the entry small (≈80 bytes per trader).
type TraderSummary = {
  trader: string;
  realisedPnL: bigint;
  totalCollateralIn: bigint;
  marketsParticipated: number;
};

// Per-chain map: chainId → (trader address lowercased → summary).
const _userPnLByChain = new Map<number, Map<string, TraderSummary>>();

// Per-chain epoch tracker. Avoids redundant scans inside the same epoch.
const _lastWrittenEpochPerChain = new Map<number, bigint>();

function getChainMap(chainId: number): Map<string, TraderSummary> {
  let m = _userPnLByChain.get(chainId);
  if (!m) {
    m = new Map();
    _userPnLByChain.set(chainId, m);
  }
  return m;
}

/**
 * Update the in-memory accumulator on every relevant event. Called from
 * src/Aggregators/UserAggregator.ts after each upsertUserOn* runs, with
 * the *post-update* user totals.
 *
 * This is the price of using an in-memory accumulator: every user-event
 * site has to touch this. Cheap (Map.set, O(1)), but not free.
 */
export function recordTraderState(
  chainId: number,
  summary: TraderSummary,
): void {
  const m = getChainMap(chainId);
  m.set(summary.trader.toLowerCase(), summary);
}

/**
 * Round timestamp down to the nearest leaderboard epoch.
 */
function getLeaderboardEpoch(timestamp: bigint): bigint {
  const interval = BigInt(LEADERBOARD_EPOCH_SECONDS);
  return (timestamp / interval) * interval;
}

/**
 * On every event in src/EventHandlers/Market.ts, this is called. It checks
 * the epoch boundary and — at most once per epoch per chain — emits the
 * top-N snapshot rows.
 */
export async function maybeWriteLeaderboardSnapshot(
  context: handlerContext,
  chainId: number,
  timestamp: bigint,
): Promise<void> {
  const currentEpoch = getLeaderboardEpoch(timestamp);
  const lastWritten = _lastWrittenEpochPerChain.get(chainId) ?? -1n;

  if (currentEpoch <= lastWritten) {
    return; // same epoch — nothing to do
  }

  const chainMap = getChainMap(chainId);
  if (chainMap.size === 0) {
    _lastWrittenEpochPerChain.set(chainId, currentEpoch);
    return;
  }

  // Sort by realisedPnL descending and slice top-N. For chainMap.size up
  // to ~10k, the sort is sub-millisecond; above that the in-memory model
  // starts to creak and ClickHouse Sink Dedicated tier is the right
  // answer (see file-level comment).
  const ranked = Array.from(chainMap.values())
    .sort((a, b) => {
      // Comparator handles signed bigint without precision loss.
      if (a.realisedPnL > b.realisedPnL) return -1;
      if (a.realisedPnL < b.realisedPnL) return 1;
      return 0;
    })
    .slice(0, LEADERBOARD_TOP_N);

  // Write top-N rows for this epoch. The (chainId, hourEpoch, rank)
  // composite id makes the snapshot rows naturally idempotent — a re-run
  // of this writer for the same epoch overwrites the same rows.
  for (let i = 0; i < ranked.length; i++) {
    const u = ranked[i];
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

  _lastWrittenEpochPerChain.set(chainId, currentEpoch);
}

/**
 * Test-only reset hook. Vitest tests reset the accumulator between cases
 * so leaderboard state doesn't leak across tests.
 */
export function _resetLeaderboardAccumulator(): void {
  _userPnLByChain.clear();
  _lastWrittenEpochPerChain.clear();
}
