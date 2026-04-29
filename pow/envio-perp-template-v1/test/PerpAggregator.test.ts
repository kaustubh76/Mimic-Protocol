/**
 * PerpAggregator + Position lifecycle tests.
 *
 * Drives the perp template's handlers through Envio's TestHelpers + MockDb.
 * Covers:
 * - PositionIncrease creates a Position + grows long open interest
 * - PositionDecrease shrinks open interest + accumulates realized PnL
 * - Liquidation latches isLiquidated and writes a Liquidation entity
 * - FundingFeeAmountPerSizeUpdated writes a FundingSnapshot
 *
 * Same MockDb pattern as the PM template's Settlement.test.ts.
 */

import { describe, expect, it } from "vitest";
import { TestHelpers } from "generated";

// Register handlers with the runtime before processEvent calls.
import "../src/EventHandlers/MarketFactory";
import "../src/EventHandlers/Market";

const CHAIN_ID = 42161; // Arbitrum
const MARKET = "0x1111111111111111111111111111111111111111";
const FACTORY = "0x2222222222222222222222222222222222222222";
const ALICE = "0xa11ce0000000000000000000000000000000a11c";
const BOB = "0xb0b00000000000000000000000000000000000b0";
const LIQUIDATOR = "0x11c1da70110000000000000000000000000c1da7";

const POSITION_KEY_ALICE_LONG = "0x" + "a1".repeat(32);
const POSITION_KEY_BOB_SHORT = "0x" + "b0".repeat(32);

function freshDb() {
  return TestHelpers.MockDb.createMockDb();
}

async function bootstrapMarket(mockDb: ReturnType<typeof freshDb>) {
  const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
    market: MARKET,
    salt: "0x" + "01".repeat(32),
    indexToken: "0x4200000000000000000000000000000000000006", // WETH-shape
    longToken: "0x4200000000000000000000000000000000000006",
    shortToken: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // USDC-shape
    mockEventData: { srcAddress: FACTORY, chainId: CHAIN_ID },
  });
  return await TestHelpers.MarketFactory.MarketCreated.processEvent({
    event: created,
    mockDb,
  });
}

describe("PerpMarket — position lifecycle", () => {
  it("PositionIncrease creates Position + grows long open interest", async () => {
    let mockDb = await bootstrapMarket(freshDb());

    const inc = TestHelpers.Market.PositionIncrease.createMockEvent({
      positionKey: POSITION_KEY_ALICE_LONG,
      account: ALICE,
      isLong: true,
      sizeDeltaUsd: 10_000n * 10n ** 30n, // 10k USD with GMX's 30-decimal convention
      collateralDeltaAmount: 1_000n * 10n ** 6n, // 1k USDC (6 decimals)
      executionPrice: 3_000n * 10n ** 30n,
      sizeInUsdAfter: 10_000n * 10n ** 30n,
      sizeInTokensAfter: 333n * 10n ** 16n, // ~3.33 ETH at $3k
      mockEventData: { srcAddress: MARKET, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.PositionIncrease.processEvent({
      event: inc,
      mockDb,
    });

    const position = mockDb.entities.Position.get(POSITION_KEY_ALICE_LONG.toLowerCase());
    expect(position?.account).toBe(ALICE.toLowerCase());
    expect(position?.isLong).toBe(true);
    expect(position?.sizeInUsd).toBe(10_000n * 10n ** 30n);
    expect(position?.cumulativeSizeIncreaseUsd).toBe(10_000n * 10n ** 30n);
    expect(position?.isLiquidated).toBe(false);

    const agg = mockDb.entities.PerpAggregator.get(`${CHAIN_ID}-${MARKET.toLowerCase()}`);
    expect(agg?.longOpenInterestUsd).toBe(10_000n * 10n ** 30n);
    expect(agg?.shortOpenInterestUsd).toBe(0n);
    expect(agg?.uniqueTraders).toBe(1);
  });

  it("PositionDecrease shrinks open interest + accumulates realized PnL", async () => {
    let mockDb = await bootstrapMarket(freshDb());

    // Open 10k.
    const inc = TestHelpers.Market.PositionIncrease.createMockEvent({
      positionKey: POSITION_KEY_ALICE_LONG,
      account: ALICE,
      isLong: true,
      sizeDeltaUsd: 10_000n * 10n ** 30n,
      collateralDeltaAmount: 1_000n * 10n ** 6n,
      executionPrice: 3_000n * 10n ** 30n,
      sizeInUsdAfter: 10_000n * 10n ** 30n,
      sizeInTokensAfter: 333n * 10n ** 16n,
      mockEventData: { srcAddress: MARKET, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.PositionIncrease.processEvent({ event: inc, mockDb });

    // Close half at +20% PnL = +1k USD profit.
    const dec = TestHelpers.Market.PositionDecrease.createMockEvent({
      positionKey: POSITION_KEY_ALICE_LONG,
      account: ALICE,
      isLong: true,
      sizeDeltaUsd: 5_000n * 10n ** 30n,
      collateralDeltaAmount: 500n * 10n ** 6n,
      executionPrice: 3_600n * 10n ** 30n,
      realizedPnl: 1_000n * 10n ** 30n, // +$1k
      sizeInUsdAfter: 5_000n * 10n ** 30n,
      mockEventData: { srcAddress: MARKET, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.PositionDecrease.processEvent({ event: dec, mockDb });

    const position = mockDb.entities.Position.get(POSITION_KEY_ALICE_LONG.toLowerCase());
    expect(position?.sizeInUsd).toBe(5_000n * 10n ** 30n);
    expect(position?.cumulativeSizeDecreaseUsd).toBe(5_000n * 10n ** 30n);
    expect(position?.cumulativeRealizedPnl).toBe(1_000n * 10n ** 30n);

    const agg = mockDb.entities.PerpAggregator.get(`${CHAIN_ID}-${MARKET.toLowerCase()}`);
    expect(agg?.longOpenInterestUsd).toBe(5_000n * 10n ** 30n);
    expect(agg?.totalRealizedPnlUsd).toBe(1_000n * 10n ** 30n); // signed accumulator
  });

  it("Liquidation latches isLiquidated + writes a separate Liquidation entity", async () => {
    let mockDb = await bootstrapMarket(freshDb());

    const inc = TestHelpers.Market.PositionIncrease.createMockEvent({
      positionKey: POSITION_KEY_BOB_SHORT,
      account: BOB,
      isLong: false,
      sizeDeltaUsd: 5_000n * 10n ** 30n,
      collateralDeltaAmount: 500n * 10n ** 6n,
      executionPrice: 3_000n * 10n ** 30n,
      sizeInUsdAfter: 5_000n * 10n ** 30n,
      sizeInTokensAfter: 166n * 10n ** 16n,
      mockEventData: { srcAddress: MARKET, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.PositionIncrease.processEvent({ event: inc, mockDb });

    const liq = TestHelpers.Market.Liquidation.createMockEvent({
      positionKey: POSITION_KEY_BOB_SHORT,
      account: BOB,
      liquidator: LIQUIDATOR,
      isLong: false,
      sizeUsd: 5_000n * 10n ** 30n,
      collateralAmount: 500n * 10n ** 6n,
      mockEventData: {
        srcAddress: MARKET,
        chainId: CHAIN_ID,
        block: { number: 100, timestamp: 1_700_000_000, hash: "0xabc" },
        logIndex: 7,
      },
    });
    mockDb = await TestHelpers.Market.Liquidation.processEvent({ event: liq, mockDb });

    const position = mockDb.entities.Position.get(POSITION_KEY_BOB_SHORT.toLowerCase());
    expect(position?.isLiquidated).toBe(true);
    expect(position?.liquidator).toBe(LIQUIDATOR.toLowerCase());

    const agg = mockDb.entities.PerpAggregator.get(`${CHAIN_ID}-${MARKET.toLowerCase()}`);
    expect(agg?.totalLiquidations).toBe(1);
    expect(agg?.shortOpenInterestUsd).toBe(0n); // liquidation closed all of Bob's 5k

    // The Liquidation entity uses positionKey-blocknumber-logIndex as id.
    const liqId = `${POSITION_KEY_BOB_SHORT.toLowerCase()}-100-7`;
    const liqEntity = mockDb.entities.Liquidation.get(liqId);
    expect(liqEntity?.account).toBe(BOB.toLowerCase());
    expect(liqEntity?.liquidator).toBe(LIQUIDATOR.toLowerCase());
    expect(liqEntity?.sizeUsd).toBe(5_000n * 10n ** 30n);
  });

  it("FundingFeeAmountPerSizeUpdated writes a FundingSnapshot", async () => {
    let mockDb = await bootstrapMarket(freshDb());

    const updatedAt = 1_700_001_000n;
    const fundingValue = 12_345_678n;

    const fundingEvent = TestHelpers.Market.FundingFeeAmountPerSizeUpdated.createMockEvent({
      isLong: true,
      fundingFeeAmountPerSize: fundingValue,
      updatedAt,
      mockEventData: {
        srcAddress: MARKET,
        chainId: CHAIN_ID,
        block: { number: 200, timestamp: 1_700_001_000, hash: "0xdef" },
      },
    });
    mockDb = await TestHelpers.Market.FundingFeeAmountPerSizeUpdated.processEvent({
      event: fundingEvent,
      mockDb,
    });

    const marketId = `${CHAIN_ID}-${MARKET.toLowerCase()}`;
    const snapshotId = `${marketId}-long-${updatedAt.toString()}`;
    const snapshot = mockDb.entities.FundingSnapshot.get(snapshotId);
    expect(snapshot?.fundingFeeAmountPerSize).toBe(fundingValue);
    expect(snapshot?.isLong).toBe(true);
    expect(snapshot?.updatedAt).toBe(updatedAt);
    expect(snapshot?.blockNumber).toBe(200n);
  });
});
