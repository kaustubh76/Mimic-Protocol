/**
 * PositionAggregator — per-trader cumulative state.
 *
 * Source of truth for the perp leaderboard. Front-end queries rank traders
 * by `cumulativeRealizedPnlUsd` (the simplest leaderboard) or by funding-
 * adjusted PnL (joining FundingSnapshot rows at query time). The same
 * in-memory accumulator pattern from the PM template's UserAggregator
 * applies if you want per-epoch leaderboard snapshots; for this template
 * we keep the surface minimal.
 */

import type { handlerContext, PositionAggregator } from "generated";
import { PositionAggregatorId } from "../Constants";

function freshUser(args: {
  chainId: number;
  account: string;
  timestamp: bigint;
}): PositionAggregator {
  return {
    id: PositionAggregatorId(args.chainId, args.account),
    chainId: args.chainId,
    account: args.account.toLowerCase(),
    cumulativeSizeIncreaseUsd: 0n,
    cumulativeSizeDecreaseUsd: 0n,
    cumulativeRealizedPnlUsd: 0n,
    cumulativeCollateralIn: 0n,
    cumulativeCollateralOut: 0n,
    liquidationCount: 0,
    marketsTraded: 0,
    positionCount: 0,
    lastActiveTimestamp: args.timestamp,
  };
}

export async function upsertPositionAggregatorOnIncrease(
  context: handlerContext,
  existing: PositionAggregator | undefined,
  args: {
    chainId: number;
    account: string;
    sizeDeltaUsd: bigint;
    collateralDeltaAmount: bigint;
    isFirstPositionForTrader: boolean;
    isFirstPositionInMarket: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      account: args.account,
      timestamp: args.timestamp,
    });
  context.PositionAggregator.set({
    ...u,
    cumulativeSizeIncreaseUsd:
      u.cumulativeSizeIncreaseUsd + args.sizeDeltaUsd,
    cumulativeCollateralIn:
      u.cumulativeCollateralIn + args.collateralDeltaAmount,
    positionCount: u.positionCount + (args.isFirstPositionForTrader ? 1 : 0),
    marketsTraded:
      u.marketsTraded + (args.isFirstPositionInMarket ? 1 : 0),
    lastActiveTimestamp: args.timestamp,
  });
}

export async function upsertPositionAggregatorOnDecrease(
  context: handlerContext,
  existing: PositionAggregator | undefined,
  args: {
    chainId: number;
    account: string;
    sizeDeltaUsd: bigint;
    collateralDeltaAmount: bigint;
    realizedPnl: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      account: args.account,
      timestamp: args.timestamp,
    });
  context.PositionAggregator.set({
    ...u,
    cumulativeSizeDecreaseUsd:
      u.cumulativeSizeDecreaseUsd + args.sizeDeltaUsd,
    cumulativeCollateralOut:
      u.cumulativeCollateralOut + args.collateralDeltaAmount,
    cumulativeRealizedPnlUsd:
      u.cumulativeRealizedPnlUsd + args.realizedPnl,
    lastActiveTimestamp: args.timestamp,
  });
}

export async function upsertPositionAggregatorOnLiquidation(
  context: handlerContext,
  existing: PositionAggregator | undefined,
  args: {
    chainId: number;
    account: string;
    sizeUsd: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const u =
    existing ??
    freshUser({
      chainId: args.chainId,
      account: args.account,
      timestamp: args.timestamp,
    });
  context.PositionAggregator.set({
    ...u,
    liquidationCount: u.liquidationCount + 1,
    lastActiveTimestamp: args.timestamp,
  });
}
