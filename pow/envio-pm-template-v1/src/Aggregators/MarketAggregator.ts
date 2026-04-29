/**
 * MarketAggregator — derived state for a single market.
 *
 * Tracks open interest, total positions, and payout pool. Updated by
 * every position-related event in src/EventHandlers/Market.ts and by
 * settlement events in src/EventHandlers/Settlement.ts.
 *
 * The pattern (constructor + per-event apply functions) mirrors the DeFi
 * template's PoolAggregator. Differences:
 *   - settlement-aware (resolution + correction transitions)
 *   - tracks unique-trader count (used by the leaderboard snapshot writer
 *     to short-circuit on markets that wouldn't move the leaderboard)
 */

import type { handlerContext } from "generated";
import { MarketId } from "../Constants";

export function createMarketAggregator(
  context: handlerContext,
  args: { chainId: number; marketAddress: string; timestamp: bigint },
): void {
  const id = MarketId(args.chainId, args.marketAddress);
  context.MarketAggregator.set({
    id,
    chainId: args.chainId,
    marketAddress: args.marketAddress.toLowerCase(),
    totalCollateralIn: 0n,
    totalCollateralOut: 0n,
    openInterest: 0n,
    totalPositions: 0n,
    totalPayouts: 0n,
    uniqueTraders: 0,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyPositionTaken(
  context: handlerContext,
  marketId: string,
  args: {
    trader: string;
    collateralIn: bigint;
    isFirstPositionForTrader: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const agg = await context.MarketAggregator.get(marketId);
  if (!agg) return;

  context.MarketAggregator.set({
    ...agg,
    totalCollateralIn: agg.totalCollateralIn + args.collateralIn,
    openInterest: agg.openInterest + args.collateralIn,
    totalPositions: agg.totalPositions + 1n,
    uniqueTraders:
      agg.uniqueTraders + (args.isFirstPositionForTrader ? 1 : 0),
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyPositionClosed(
  context: handlerContext,
  marketId: string,
  args: { collateralOut: bigint; timestamp: bigint },
): Promise<void> {
  const agg = await context.MarketAggregator.get(marketId);
  if (!agg) return;

  context.MarketAggregator.set({
    ...agg,
    totalCollateralOut: agg.totalCollateralOut + args.collateralOut,
    openInterest: agg.openInterest - args.collateralOut,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyPayoutClaimed(
  context: handlerContext,
  marketId: string,
  args: { payout: bigint; timestamp: bigint },
): Promise<void> {
  const agg = await context.MarketAggregator.get(marketId);
  if (!agg) return;

  context.MarketAggregator.set({
    ...agg,
    totalPayouts: agg.totalPayouts + args.payout,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyResolution(
  context: handlerContext,
  marketId: string,
  args: { winningOutcome: number; timestamp: bigint },
): Promise<void> {
  const agg = await context.MarketAggregator.get(marketId);
  if (!agg) return;

  // Resolution closes open interest — the protocol stops accepting new
  // positions. Open interest doesn't change here; payouts are tracked
  // as PayoutClaimed events fire.
  context.MarketAggregator.set({
    ...agg,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyCorrection(
  context: handlerContext,
  marketId: string,
  args: {
    previousWinningOutcome: number;
    correctedWinningOutcome: number;
    timestamp: bigint;
  },
): Promise<void> {
  const agg = await context.MarketAggregator.get(marketId);
  if (!agg) return;

  // Correction in itself doesn't change market-level totals (collateral
  // in/out has already happened). The user-level reversal happens
  // lazily on the next PayoutClaimed event for the corrected outcome,
  // at which point the user aggregator's realisedPnL re-balances.
  //
  // The leaderboard snapshot writer is what makes the correction visible
  // to end users — see src/Snapshots/LeaderboardSnapshot.ts.
  context.MarketAggregator.set({
    ...agg,
    lastUpdatedTimestamp: args.timestamp,
  });
}
