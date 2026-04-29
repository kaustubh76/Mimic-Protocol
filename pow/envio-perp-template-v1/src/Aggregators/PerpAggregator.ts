/**
 * PerpAggregator — derived per-market state.
 *
 * Tracks open interest split by side (long/short), realised PnL (signed),
 * collateral on each side, position counts, liquidation count, and unique
 * trader count. Updated by every position-event handler in
 * src/EventHandlers/Market.ts.
 *
 * Same shape as the DEX template's PoolAggregator and the PM template's
 * MarketAggregator — each event-handler calls a function here that
 * mutates the entity through context.PerpAggregator.set.
 */

import type { handlerContext } from "generated";
import { MarketId } from "../Constants";

export function createPerpAggregator(
  context: handlerContext,
  args: { chainId: number; marketAddress: string; timestamp: bigint },
): void {
  const id = MarketId(args.chainId, args.marketAddress);
  context.PerpAggregator.set({
    id,
    chainId: args.chainId,
    marketAddress: args.marketAddress.toLowerCase(),
    longOpenInterestUsd: 0n,
    shortOpenInterestUsd: 0n,
    totalRealizedPnlUsd: 0n,
    totalCollateralLong: 0n,
    totalCollateralShort: 0n,
    totalPositions: 0,
    totalLiquidations: 0,
    uniqueTraders: 0,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyPositionIncrease(
  context: handlerContext,
  marketId: string,
  args: {
    account: string;
    isLong: boolean;
    sizeDeltaUsd: bigint;
    collateralDeltaAmount: bigint;
    isFirstPositionInMarket: boolean;
    isFirstPositionForTraderInMarket: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const agg = await context.PerpAggregator.get(marketId);
  if (!agg) return;

  if (args.isLong) {
    context.PerpAggregator.set({
      ...agg,
      longOpenInterestUsd: agg.longOpenInterestUsd + args.sizeDeltaUsd,
      totalCollateralLong: agg.totalCollateralLong + args.collateralDeltaAmount,
      totalPositions: agg.totalPositions + (args.isFirstPositionInMarket ? 1 : 0),
      uniqueTraders:
        agg.uniqueTraders + (args.isFirstPositionForTraderInMarket ? 1 : 0),
      lastUpdatedTimestamp: args.timestamp,
    });
  } else {
    context.PerpAggregator.set({
      ...agg,
      shortOpenInterestUsd: agg.shortOpenInterestUsd + args.sizeDeltaUsd,
      totalCollateralShort: agg.totalCollateralShort + args.collateralDeltaAmount,
      totalPositions: agg.totalPositions + (args.isFirstPositionInMarket ? 1 : 0),
      uniqueTraders:
        agg.uniqueTraders + (args.isFirstPositionForTraderInMarket ? 1 : 0),
      lastUpdatedTimestamp: args.timestamp,
    });
  }
}

export async function applyPositionDecrease(
  context: handlerContext,
  marketId: string,
  args: {
    isLong: boolean;
    sizeDeltaUsd: bigint;
    collateralDeltaAmount: bigint;
    realizedPnl: bigint; // signed
    timestamp: bigint;
  },
): Promise<void> {
  const agg = await context.PerpAggregator.get(marketId);
  if (!agg) return;

  if (args.isLong) {
    const newLongOI =
      agg.longOpenInterestUsd > args.sizeDeltaUsd
        ? agg.longOpenInterestUsd - args.sizeDeltaUsd
        : 0n;
    const newCollateralLong =
      agg.totalCollateralLong > args.collateralDeltaAmount
        ? agg.totalCollateralLong - args.collateralDeltaAmount
        : 0n;
    context.PerpAggregator.set({
      ...agg,
      longOpenInterestUsd: newLongOI,
      totalCollateralLong: newCollateralLong,
      totalRealizedPnlUsd: agg.totalRealizedPnlUsd + args.realizedPnl,
      lastUpdatedTimestamp: args.timestamp,
    });
  } else {
    const newShortOI =
      agg.shortOpenInterestUsd > args.sizeDeltaUsd
        ? agg.shortOpenInterestUsd - args.sizeDeltaUsd
        : 0n;
    const newCollateralShort =
      agg.totalCollateralShort > args.collateralDeltaAmount
        ? agg.totalCollateralShort - args.collateralDeltaAmount
        : 0n;
    context.PerpAggregator.set({
      ...agg,
      shortOpenInterestUsd: newShortOI,
      totalCollateralShort: newCollateralShort,
      totalRealizedPnlUsd: agg.totalRealizedPnlUsd + args.realizedPnl,
      lastUpdatedTimestamp: args.timestamp,
    });
  }
}

export async function applyLiquidation(
  context: handlerContext,
  marketId: string,
  args: {
    isLong: boolean;
    sizeUsd: bigint;
    collateralAmount: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const agg = await context.PerpAggregator.get(marketId);
  if (!agg) return;

  // Liquidation removes the full position size from open interest. Realized
  // PnL change is captured separately by the PositionDecrease that
  // accompanies a liquidation in the protocol's normal flow.
  if (args.isLong) {
    const newLongOI =
      agg.longOpenInterestUsd > args.sizeUsd
        ? agg.longOpenInterestUsd - args.sizeUsd
        : 0n;
    context.PerpAggregator.set({
      ...agg,
      longOpenInterestUsd: newLongOI,
      totalLiquidations: agg.totalLiquidations + 1,
      lastUpdatedTimestamp: args.timestamp,
    });
  } else {
    const newShortOI =
      agg.shortOpenInterestUsd > args.sizeUsd
        ? agg.shortOpenInterestUsd - args.sizeUsd
        : 0n;
    context.PerpAggregator.set({
      ...agg,
      shortOpenInterestUsd: newShortOI,
      totalLiquidations: agg.totalLiquidations + 1,
      lastUpdatedTimestamp: args.timestamp,
    });
  }
}
