/**
 * UserAggregator — per-user totals. The leaderboard source.
 *
 * Every leaderboard query reads from here and ranks. Keeping per-user
 * totals here (vs computing them at query time across all positions) is
 * what makes top-N queries cheap. See ENVIO_LEADERBOARD_QUERY_ARCHITECTURE.md
 * for the analytical query patterns this entity feeds.
 */

import type { handlerContext, UserAggregator } from "generated";
import { UserId } from "../Constants";
import { recordTraderState } from "../Snapshots/LeaderboardSnapshot";

function freshUser(args: {
  chainId: number;
  trader: string;
  timestamp: bigint;
}): UserAggregator {
  return {
    id: UserId(args.chainId, args.trader),
    chainId: args.chainId,
    trader: args.trader.toLowerCase(),
    totalCollateralIn: 0n,
    totalCollateralOut: 0n,
    totalPayouts: 0n,
    realisedPnL: 0n,
    marketsParticipated: 0,
    positionCount: 0,
    lastActiveTimestamp: args.timestamp,
  };
}

function recomputePnL(u: UserAggregator): bigint {
  // realisedPnL = (collateralOut + payouts) - collateralIn
  // Signed BigInt — winners are positive, losers are negative.
  return u.totalCollateralOut + u.totalPayouts - u.totalCollateralIn;
}

export async function upsertUserOnPosition(
  context: handlerContext,
  existing: UserAggregator | undefined,
  args: {
    chainId: number;
    trader: string;
    collateralIn: bigint;
    isNewMarketForTrader: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      trader: args.trader,
      timestamp: args.timestamp,
    });
  const updated: UserAggregator = {
    ...u,
    totalCollateralIn: u.totalCollateralIn + args.collateralIn,
    marketsParticipated:
      u.marketsParticipated + (args.isNewMarketForTrader ? 1 : 0),
    positionCount: u.positionCount + 1,
    lastActiveTimestamp: args.timestamp,
  };
  const finalUser = { ...updated, realisedPnL: recomputePnL(updated) };
  context.UserAggregator.set(finalUser);
  // Mirror into the in-memory leaderboard accumulator so the next epoch
  // boundary can sort + emit top-N without a DB scan.
  recordTraderState(args.chainId, {
    trader: finalUser.trader,
    realisedPnL: finalUser.realisedPnL,
    totalCollateralIn: finalUser.totalCollateralIn,
    marketsParticipated: finalUser.marketsParticipated,
  });
}

export async function upsertUserOnClose(
  context: handlerContext,
  existing: UserAggregator | undefined,
  args: {
    chainId: number;
    trader: string;
    collateralOut: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  if (!existing) {
    context.log.warn(
      `UserAggregator missing for close on ${args.trader} chain ${args.chainId}; creating.`,
    );
  }
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      trader: args.trader,
      timestamp: args.timestamp,
    });
  const updated: UserAggregator = {
    ...u,
    totalCollateralOut: u.totalCollateralOut + args.collateralOut,
    lastActiveTimestamp: args.timestamp,
  };
  const finalUser = { ...updated, realisedPnL: recomputePnL(updated) };
  context.UserAggregator.set(finalUser);
  recordTraderState(args.chainId, {
    trader: finalUser.trader,
    realisedPnL: finalUser.realisedPnL,
    totalCollateralIn: finalUser.totalCollateralIn,
    marketsParticipated: finalUser.marketsParticipated,
  });
}

export async function upsertUserOnPayout(
  context: handlerContext,
  existing: UserAggregator | undefined,
  args: {
    chainId: number;
    trader: string;
    payout: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      trader: args.trader,
      timestamp: args.timestamp,
    });
  const updated: UserAggregator = {
    ...u,
    totalPayouts: u.totalPayouts + args.payout,
    lastActiveTimestamp: args.timestamp,
  };
  const finalUser = { ...updated, realisedPnL: recomputePnL(updated) };
  context.UserAggregator.set(finalUser);
  recordTraderState(args.chainId, {
    trader: finalUser.trader,
    realisedPnL: finalUser.realisedPnL,
    totalCollateralIn: finalUser.totalCollateralIn,
    marketsParticipated: finalUser.marketsParticipated,
  });
}
