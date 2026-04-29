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
  context.UserAggregator.set({
    ...updated,
    realisedPnL: recomputePnL(updated),
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
  context.UserAggregator.set({
    ...updated,
    realisedPnL: recomputePnL(updated),
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
  context.UserAggregator.set({
    ...updated,
    realisedPnL: recomputePnL(updated),
  });
}
