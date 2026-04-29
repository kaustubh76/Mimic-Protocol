/**
 * PoolAggregator — pure derived-state functions.
 *
 * Reference: velodrome-finance/indexer/src/Aggregators/LiquidityPoolAggregator.ts
 * (their production version is ~850 lines and tracks liquidity, votes,
 * emissions, CL state, and fee splits across staked/unstaked LPs. This
 * template version is the slim shape — a one-screen-readable starting point
 * that scales by adding fields, not by re-architecting.)
 *
 * The pattern: every Apply* function takes the current aggregator + a
 * payload, returns a new aggregator. No I/O, no entity reads. The handlers
 * in src/EventHandlers/Pool.ts do the read; the aggregator does the math.
 * This separation is what makes the aggregator unit-testable in isolation.
 */

import type { handlerContext, PoolAggregator } from "generated";
import { PoolId } from "../Constants";

// -----------------------------------------------------------------
// Constructor — called once per pool from the PoolFactory handler.
// -----------------------------------------------------------------
export function createPoolAggregator(
  context: handlerContext,
  args: { chainId: number; poolAddress: string; timestamp: bigint },
): void {
  const id = PoolId(args.chainId, args.poolAddress);
  context.PoolAggregator.set({
    id,
    chainId: args.chainId,
    poolAddress: args.poolAddress.toLowerCase(),
    reserve0: 0n,
    reserve1: 0n,
    cumulativeVolume0: 0n,
    cumulativeVolume1: 0n,
    cumulativeFees0: 0n,
    cumulativeFees1: 0n,
    swapCount: 0n,
    lastUpdatedTimestamp: args.timestamp,
    lastSnapshotTimestamp: 0n,  // sentinel — no snapshot yet
  });
}

// -----------------------------------------------------------------
// Apply* — pure transformations. Handler reads, calls these, writes.
// -----------------------------------------------------------------

export function applySwap(
  agg: PoolAggregator,
  s: {
    amount0In: bigint;
    amount1In: bigint;
    amount0Out: bigint;
    amount1Out: bigint;
    timestamp: bigint;
  },
): PoolAggregator {
  // Volume convention: total absolute flow per side = in + out. The
  // alternative (in - out) would zero out for symmetric routes, hiding
  // real volume. Velodrome uses the same convention in PoolSwapLogic.
  return {
    ...agg,
    cumulativeVolume0: agg.cumulativeVolume0 + s.amount0In + s.amount0Out,
    cumulativeVolume1: agg.cumulativeVolume1 + s.amount1In + s.amount1Out,
    swapCount: agg.swapCount + 1n,
    lastUpdatedTimestamp: s.timestamp,
  };
}

export function applyMint(
  agg: PoolAggregator,
  m: { amount0: bigint; amount1: bigint; timestamp: bigint },
): PoolAggregator {
  // Mint doesn't change volume — it changes liquidity, which is reflected
  // in the next Sync event. We track the timestamp so the snapshot logic
  // sees activity, but no metric shifts here.
  return { ...agg, lastUpdatedTimestamp: m.timestamp };
}

export function applyBurn(
  agg: PoolAggregator,
  b: { amount0: bigint; amount1: bigint; timestamp: bigint },
): PoolAggregator {
  return { ...agg, lastUpdatedTimestamp: b.timestamp };
}

export function applySync(
  agg: PoolAggregator,
  s: { reserve0: bigint; reserve1: bigint; timestamp: bigint },
): PoolAggregator {
  // Sync is the source of truth for current reserves. Every Mint/Burn/Swap
  // is followed by a Sync; we just take the latest.
  return {
    ...agg,
    reserve0: s.reserve0,
    reserve1: s.reserve1,
    lastUpdatedTimestamp: s.timestamp,
  };
}

export function applyFees(
  agg: PoolAggregator,
  f: { fees0: bigint; fees1: bigint; timestamp: bigint },
): PoolAggregator {
  return {
    ...agg,
    cumulativeFees0: agg.cumulativeFees0 + f.fees0,
    cumulativeFees1: agg.cumulativeFees1 + f.fees1,
    lastUpdatedTimestamp: f.timestamp,
  };
}
