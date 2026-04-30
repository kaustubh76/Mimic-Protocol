/**
 * EventEmitter handler — routes GMX v2's generic EventLog1 events on the
 * `eventName` field to per-event-type code paths.
 *
 * GMX v2 emits ALL position/order/funding/liquidation events through a
 * single `EventEmitter` contract using `EventLog1(string eventName, ...,
 * EventLogData eventData)` — completely different from the factory +
 * per-Market pattern this template originally used. The trade-off:
 *
 *   - Pro: one contract subscription covers the entire protocol surface
 *   - Con: payload is a bytes-encoded dictionary, not typed event params
 *
 * The decode helper at src/Effects/decodeEventLogData.ts turns the
 * tuple-of-tuples typed binding into a typed dictionary keyed by string.
 *
 * v1 scope: only PositionIncrease is processed. PositionDecrease,
 * Liquidation, OrderExecuted, FundingFeeAmountPerSizeUpdated, and the
 * dozens of other GMX events get their own routing branches in v2 — the
 * pattern is mechanical (add a `case "EventName":` branch + a
 * `decode<EventName>` helper).
 *
 * Adapted from gmx-io/gmx-synthetics/contracts/event/EventEmitter.sol
 * + PositionEventUtils.sol's emitPositionIncrease.
 */

import { EventEmitter } from "generated";
import { MarketId, PositionEntityId, PositionAggregatorId } from "../Constants";
import { ensurePerpMarket, applyPositionIncrease } from "../Aggregators/PerpAggregator";
import { upsertPositionAggregatorOnIncrease } from "../Aggregators/PositionAggregator";
import { decodePositionIncrease } from "../Effects/decodeEventLogData";

EventEmitter.EventLog1.handler(async ({ event, context }) => {
  const eventName = event.params.eventName;

  // Route on eventName. v1 only handles PositionIncrease; everything else
  // is logged at debug level and skipped. This matches the minimal-scope
  // documented in config.yaml's header comment.
  switch (eventName) {
    case "PositionIncrease":
      await handlePositionIncrease(event, context);
      break;
    default:
      // GMX emits ~80+ event types through this contract. Logging each at
      // info level would drown the indexer log; debug-only.
      context.log.debug(`EventLog1: skipping eventName="${eventName}" (v1 scope: PositionIncrease only)`);
  }
});

// -----------------------------------------------------------------
// PositionIncrease — open or grow a position
// -----------------------------------------------------------------
async function handlePositionIncrease(
  event: Parameters<Parameters<typeof EventEmitter.EventLog1.handler>[0]>[0]["event"],
  context: Parameters<Parameters<typeof EventEmitter.EventLog1.handler>[0]>[0]["context"],
) {
  const decoded = decodePositionIncrease(event.params.eventData);

  // Required fields. If any are missing, the event isn't actually a
  // PositionIncrease in the shape we expect (could be a GMX schema change
  // or an event with a misleading eventName) — log warn and skip.
  if (!decoded.positionKey || !decoded.account || !decoded.market || decoded.isLong === undefined) {
    context.log.warn(
      `PositionIncrease missing required fields (positionKey/account/market/isLong); skipping. ` +
        `eventNameHash=${event.params.eventNameHash}`,
    );
    return;
  }

  const marketAddr = decoded.market;
  const accountAddr = decoded.account;
  const marketId = MarketId(event.chainId, marketAddr);
  const positionId = PositionEntityId(decoded.positionKey);
  const userId = PositionAggregatorId(event.chainId, accountAddr);

  // Preload existing entities in parallel (entity-cache-first preload pattern).
  const [position, user] = await Promise.all([
    context.Position.get(positionId),
    context.PositionAggregator.get(userId),
  ]);

  const isFirstPositionForTrader = !position;
  const isFirstPositionInMarket = !position || position.market_id !== marketId;

  // GMX v2 doesn't fire a separate market-creation event in the EventEmitter
  // surface (markets are pre-deployed and registered through MarketFactory,
  // a different contract we don't index in v1). So we lazy-create
  // `PerpMarket` on the first PositionIncrease that references it.
  await ensurePerpMarket(context, {
    chainId: event.chainId,
    marketAddress: marketAddr,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });

  // Default-fill optional uint fields with 0n if missing — GMX may not set
  // every key on every event (e.g. older GMX versions had fewer fields).
  const sizeInUsd = decoded.sizeInUsd ?? 0n;
  const sizeInTokens = decoded.sizeInTokens ?? 0n;
  const collateralAmount = decoded.collateralAmount ?? 0n;
  const sizeDeltaUsd = decoded.sizeDeltaUsd ?? 0n;
  const collateralDeltaAmount = decoded.collateralDeltaAmount ?? 0n;
  const fundingFeeAmountPerSize = decoded.fundingFeeAmountPerSize ?? 0n;

  context.Position.set({
    id: positionId,
    market_id: marketId,
    account: accountAddr.toLowerCase(),
    isLong: decoded.isLong,
    sizeInUsd,
    sizeInTokens,
    collateralAmount,
    cumulativeSizeIncreaseUsd:
      (position?.cumulativeSizeIncreaseUsd ?? 0n) + sizeDeltaUsd,
    cumulativeSizeDecreaseUsd: position?.cumulativeSizeDecreaseUsd ?? 0n,
    cumulativeRealizedPnl: position?.cumulativeRealizedPnl ?? 0n,
    fundingFeeAmountPerSizeAtEntry:
      position?.fundingFeeAmountPerSizeAtEntry ?? fundingFeeAmountPerSize,
    isLiquidated: position?.isLiquidated ?? false,
    liquidator: position?.liquidator,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyPositionIncrease(context, marketId, {
    account: accountAddr,
    isLong: decoded.isLong,
    sizeDeltaUsd,
    collateralDeltaAmount,
    isFirstPositionInMarket,
    isFirstPositionForTraderInMarket: isFirstPositionForTrader,
    timestamp: BigInt(event.block.timestamp),
  });

  await upsertPositionAggregatorOnIncrease(context, user, {
    chainId: event.chainId,
    account: accountAddr,
    sizeDeltaUsd,
    collateralDeltaAmount,
    isFirstPositionForTrader,
    isFirstPositionInMarket,
    timestamp: BigInt(event.block.timestamp),
  });
}
