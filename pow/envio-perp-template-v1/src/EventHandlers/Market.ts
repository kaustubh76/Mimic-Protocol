/**
 * Market event handler — position lifecycle events.
 *
 * Adapted from gmx-io/gmx-synthetics/contracts/position/{IncreasePositionUtils,DecreasePositionUtils}.sol
 * and PositionEventUtils.sol. We use flat typed events (positionKey, account,
 * sizeDeltaUsd, ...) instead of GMX v2's bytes-encoded EventLogData pattern
 * — see config.yaml for the rationale.
 */

import { Market } from "generated";
import {
  MarketId,
  PositionEntityId,
  LiquidationId,
  PositionAggregatorId,
} from "../Constants";
import {
  applyPositionIncrease,
  applyPositionDecrease,
  applyLiquidation,
} from "../Aggregators/PerpAggregator";
import {
  upsertPositionAggregatorOnIncrease,
  upsertPositionAggregatorOnDecrease,
  upsertPositionAggregatorOnLiquidation,
} from "../Aggregators/PositionAggregator";

// -----------------------------------------------------------------
// PositionIncrease — open or grow a position
// -----------------------------------------------------------------
Market.PositionIncrease.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const positionId = PositionEntityId(event.params.positionKey);
  const userId = PositionAggregatorId(event.chainId, event.params.account);

  // Preload-first: position + market aggregator + user aggregator in parallel.
  const [position, user] = await Promise.all([
    context.Position.get(positionId),
    context.PositionAggregator.get(userId),
  ]);

  const isFirstPositionForTrader = !position;
  const isFirstPositionInMarket =
    !position || position.market_id !== marketId;

  context.Position.set({
    id: positionId,
    market_id: marketId,
    account: event.params.account.toLowerCase(),
    isLong: event.params.isLong,
    sizeInUsd: event.params.sizeInUsdAfter,
    sizeInTokens: event.params.sizeInTokensAfter,
    collateralAmount:
      (position?.collateralAmount ?? 0n) + event.params.collateralDeltaAmount,
    cumulativeSizeIncreaseUsd:
      (position?.cumulativeSizeIncreaseUsd ?? 0n) + event.params.sizeDeltaUsd,
    cumulativeSizeDecreaseUsd: position?.cumulativeSizeDecreaseUsd ?? 0n,
    cumulativeRealizedPnl: position?.cumulativeRealizedPnl ?? 0n,
    fundingFeeAmountPerSizeAtEntry:
      // Snapshotted on entry; refreshed by FundingFeeAmountPerSizeUpdated.
      // For the template, we initialise to 0n; production indexers wire this
      // to the latest FundingSnapshot for the market+side.
      position?.fundingFeeAmountPerSizeAtEntry ?? 0n,
    isLiquidated: position?.isLiquidated ?? false,
    liquidator: position?.liquidator,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyPositionIncrease(context, marketId, {
    account: event.params.account,
    isLong: event.params.isLong,
    sizeDeltaUsd: event.params.sizeDeltaUsd,
    collateralDeltaAmount: event.params.collateralDeltaAmount,
    isFirstPositionInMarket,
    isFirstPositionForTraderInMarket: isFirstPositionForTrader,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertPositionAggregatorOnIncrease(context, user, {
    chainId: event.chainId,
    account: event.params.account,
    sizeDeltaUsd: event.params.sizeDeltaUsd,
    collateralDeltaAmount: event.params.collateralDeltaAmount,
    isFirstPositionForTrader,
    isFirstPositionInMarket,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// PositionDecrease — close or shrink a position; carries realizedPnl
// -----------------------------------------------------------------
Market.PositionDecrease.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const positionId = PositionEntityId(event.params.positionKey);
  const userId = PositionAggregatorId(event.chainId, event.params.account);

  const [position, user] = await Promise.all([
    context.Position.get(positionId),
    context.PositionAggregator.get(userId),
  ]);

  if (!position) {
    context.log.warn(
      `PositionDecrease on unknown position ${positionId}; ignoring.`,
    );
    return;
  }

  context.Position.set({
    ...position,
    sizeInUsd: event.params.sizeInUsdAfter,
    collateralAmount:
      position.collateralAmount > event.params.collateralDeltaAmount
        ? position.collateralAmount - event.params.collateralDeltaAmount
        : 0n,
    cumulativeSizeDecreaseUsd:
      position.cumulativeSizeDecreaseUsd + event.params.sizeDeltaUsd,
    cumulativeRealizedPnl:
      position.cumulativeRealizedPnl + event.params.realizedPnl,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyPositionDecrease(context, marketId, {
    isLong: event.params.isLong,
    sizeDeltaUsd: event.params.sizeDeltaUsd,
    collateralDeltaAmount: event.params.collateralDeltaAmount,
    realizedPnl: event.params.realizedPnl,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertPositionAggregatorOnDecrease(context, user, {
    chainId: event.chainId,
    account: event.params.account,
    sizeDeltaUsd: event.params.sizeDeltaUsd,
    collateralDeltaAmount: event.params.collateralDeltaAmount,
    realizedPnl: event.params.realizedPnl,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// Liquidation — position closed forcibly by liquidator
// -----------------------------------------------------------------
Market.Liquidation.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const positionId = PositionEntityId(event.params.positionKey);
  const userId = PositionAggregatorId(event.chainId, event.params.account);

  const [position, user] = await Promise.all([
    context.Position.get(positionId),
    context.PositionAggregator.get(userId),
  ]);

  if (!position) {
    context.log.warn(
      `Liquidation on unknown position ${positionId}; ignoring.`,
    );
    return;
  }

  // Latch the liquidation flag on the Position entity.
  context.Position.set({
    ...position,
    isLiquidated: true,
    liquidator: event.params.liquidator.toLowerCase(),
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  // Persist a separate Liquidation record so the leaderboard / risk
  // dashboards can scan liquidations independently of position state.
  context.Liquidation.set({
    id: LiquidationId(event.params.positionKey, BigInt(event.block.number), event.logIndex),
    position_id: positionId,
    market_id: marketId,
    account: event.params.account.toLowerCase(),
    liquidator: event.params.liquidator.toLowerCase(),
    isLong: event.params.isLong,
    sizeUsd: event.params.sizeUsd,
    collateralAmount: event.params.collateralAmount,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });

  await applyLiquidation(context, marketId, {
    isLong: event.params.isLong,
    sizeUsd: event.params.sizeUsd,
    collateralAmount: event.params.collateralAmount,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertPositionAggregatorOnLiquidation(context, user, {
    chainId: event.chainId,
    account: event.params.account,
    sizeUsd: event.params.sizeUsd,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// FundingFeeAmountPerSizeUpdated — periodic funding-rate update
// -----------------------------------------------------------------
import { FundingSnapshotId } from "../Constants";

Market.FundingFeeAmountPerSizeUpdated.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);

  // Snapshot every funding update — this is the primary analytical signal
  // that distinguishes perp indexers from spot-DEX indexers. Open positions'
  // pending funding can be computed by joining (Position.fundingFeeAmountPerSizeAtEntry,
  // latest FundingSnapshot for the market+side) at query time.
  context.FundingSnapshot.set({
    id: FundingSnapshotId(marketId, event.params.isLong, event.params.updatedAt),
    market_id: marketId,
    isLong: event.params.isLong,
    fundingFeeAmountPerSize: event.params.fundingFeeAmountPerSize,
    updatedAt: event.params.updatedAt,
    blockNumber: BigInt(event.block.number),
  });
});
