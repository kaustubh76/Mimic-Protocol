/**
 * PerpAggregator — derived per-market state.
 *
 * Tracks open interest split by side (long/short), realised PnL (signed),
 * collateral on each side, position counts, liquidation count, and unique
 * trader count. Updated by every position-event handler in
 * src/EventHandlers/EventEmitter.ts.
 *
 * Same shape as the DEX template's PoolAggregator and the PM template's
 * MarketAggregator — each event-handler calls a function here that
 * mutates the entity through context.PerpAggregator.set.
 *
 * GMX v2 difference: there's no MarketCreated event in the EventEmitter
 * surface (markets are pre-deployed and registered via a separate
 * MarketFactory contract we don't index in v1). So PerpMarket and
 * PerpAggregator entities are LAZY-CREATED on the first PositionIncrease
 * that references a previously-unseen market.
 */

import type { handlerContext } from "generated";
import { MarketId } from "../Constants";

/**
 * Lazy-create the PerpMarket + PerpAggregator entities on first sighting.
 * Idempotent: if either exists, leaves it alone.
 *
 * GMX v2's EventEmitter doesn't fire a MarketCreated event in the surface
 * we index; markets are introduced into our entity model the first time
 * a PositionIncrease references them. We populate sentinel zero values
 * for indexToken/longToken/shortToken — these would be filled by indexing
 * GMX's MarketFactory.MarketCreated event, which is out of v1 scope.
 */
export async function ensurePerpMarket(
  context: handlerContext,
  args: {
    chainId: number;
    marketAddress: string;
    blockNumber: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const id = MarketId(args.chainId, args.marketAddress);
  const existing = await context.PerpMarket.get(id);
  if (existing) return;

  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  context.PerpMarket.set({
    id,
    chainId: args.chainId,
    address: args.marketAddress.toLowerCase(),
    salt: "0x" + "00".repeat(32),
    indexToken: ZERO_ADDR,
    longToken: ZERO_ADDR,
    shortToken: ZERO_ADDR,
    createdAtBlock: args.blockNumber,
    createdAtTimestamp: args.timestamp,
  });

  // Aggregator initialised in lockstep with the market entity.
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
