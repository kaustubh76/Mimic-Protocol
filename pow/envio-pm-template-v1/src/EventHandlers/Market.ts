/**
 * Market event handler — position lifecycle.
 *
 * Handles PositionTaken, PositionClosed, PayoutClaimed. Settlement-related
 * events (MarketLockedForResolution, OracleResolved, MarketCorrected) live
 * in src/EventHandlers/Settlement.ts because they're the trickiest part
 * of the indexer and benefit from being read together.
 */

import { Market } from "generated";
import { MarketId, PositionId, UserId } from "../Constants";
import {
  applyPositionTaken,
  applyPositionClosed,
  applyPayoutClaimed,
} from "../Aggregators/MarketAggregator";
import {
  upsertUserOnPosition,
  upsertUserOnClose,
  upsertUserOnPayout,
} from "../Aggregators/UserAggregator";
import { maybeWriteLeaderboardSnapshot } from "../Snapshots/LeaderboardSnapshot";

// -----------------------------------------------------------------
// PositionTaken — trader buys shares of an outcome.
// -----------------------------------------------------------------
Market.PositionTaken.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const positionId = PositionId(
    marketId,
    event.params.trader,
    Number(event.params.outcomeIndex),
  );
  const userId = UserId(event.chainId, event.params.trader);

  // Preload everything we'll need in one parallel batch.
  const [market, position, user] = await Promise.all([
    context.Market.get(marketId),
    context.Position.get(positionId),
    context.UserAggregator.get(userId),
  ]);

  if (!market || market.state !== "OPEN") {
    context.log.warn(
      `PositionTaken on market ${marketId} in state ${market?.state ?? "missing"}; ignoring.`,
    );
    return;
  }

  const newSharesTotal =
    (position?.shares ?? 0n) + event.params.shares;
  const newCollateralIn =
    (position?.cumulativeCollateralIn ?? 0n) + event.params.collateralIn;

  context.Position.set({
    id: positionId,
    market_id: marketId,
    trader: event.params.trader.toLowerCase(),
    outcomeIndex: Number(event.params.outcomeIndex),
    shares: newSharesTotal,
    cumulativeCollateralIn: newCollateralIn,
    cumulativeCollateralOut: position?.cumulativeCollateralOut ?? 0n,
    realisedPnL:
      (position?.cumulativeCollateralOut ?? 0n) - newCollateralIn,
    payout: position?.payout ?? 0n,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyPositionTaken(context, marketId, {
    trader: event.params.trader,
    collateralIn: event.params.collateralIn,
    isFirstPositionForTrader: !position,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertUserOnPosition(context, user, {
    chainId: event.chainId,
    trader: event.params.trader,
    collateralIn: event.params.collateralIn,
    isNewMarketForTrader: !position,
    timestamp: BigInt(event.block.timestamp),
  });

  await maybeWriteLeaderboardSnapshot(
    context,
    event.chainId,
    BigInt(event.block.timestamp),
  );
});

// -----------------------------------------------------------------
// PositionClosed — trader sells shares of an outcome (pre-settlement).
// -----------------------------------------------------------------
Market.PositionClosed.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const positionId = PositionId(
    marketId,
    event.params.trader,
    Number(event.params.outcomeIndex),
  );
  const userId = UserId(event.chainId, event.params.trader);

  const [position, user] = await Promise.all([
    context.Position.get(positionId),
    context.UserAggregator.get(userId),
  ]);

  if (!position) {
    context.log.warn(
      `PositionClosed on unknown position ${positionId}; ignoring.`,
    );
    return;
  }

  const newSharesTotal = position.shares - event.params.shares;
  const newCollateralOut =
    position.cumulativeCollateralOut + event.params.collateralOut;

  context.Position.set({
    ...position,
    shares: newSharesTotal,
    cumulativeCollateralOut: newCollateralOut,
    realisedPnL: newCollateralOut - position.cumulativeCollateralIn,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyPositionClosed(context, marketId, {
    collateralOut: event.params.collateralOut,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertUserOnClose(context, user, {
    chainId: event.chainId,
    trader: event.params.trader,
    collateralOut: event.params.collateralOut,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// PayoutClaimed — winning trader claims payout post-settlement.
// -----------------------------------------------------------------
Market.PayoutClaimed.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const userId = UserId(event.chainId, event.params.trader);
  const market = await context.Market.get(marketId);

  if (!market) return;
  if (market.state !== "SETTLED" && market.state !== "CORRECTED") {
    context.log.warn(
      `PayoutClaimed on market ${marketId} in state ${market.state}; expected SETTLED or CORRECTED.`,
    );
    return;
  }

  // Update the winning position's payout field (one read + one write).
  const winningPositionId = PositionId(
    marketId,
    event.params.trader,
    market.winningOutcome ?? 0,
  );
  const [position, user] = await Promise.all([
    context.Position.get(winningPositionId),
    context.UserAggregator.get(userId),
  ]);

  if (position) {
    context.Position.set({
      ...position,
      payout: position.payout + event.params.payout,
      lastUpdatedTimestamp: BigInt(event.block.timestamp),
    });
  }

  await applyPayoutClaimed(context, marketId, {
    payout: event.params.payout,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertUserOnPayout(context, user, {
    chainId: event.chainId,
    trader: event.params.trader,
    payout: event.params.payout,
    timestamp: BigInt(event.block.timestamp),
  });
});
