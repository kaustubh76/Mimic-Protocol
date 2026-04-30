/**
 * ReserveAggregator + Liquidation lifecycle tests.
 *
 * Drives the money-market template's handlers through Envio's TestHelpers
 * + MockDb. Covers:
 * - Supply creates a Reserve + ReserveAggregator on first sighting
 * - Borrow accumulates totalBorrowed, increments uniqueBorrowers
 * - LiquidationCall writes a Liquidation entity, updates BOTH affected
 *   reserves (collateral + debt), increments BOTH user counters (victim
 *   + liquidator)
 * - ReserveDataUpdated writes a ReserveRateSnapshot + updates the
 *   aggregator's "current" rate state
 *
 * Same MockDb pattern as the DeFi and perp templates' tests.
 */

import { describe, expect, it } from "vitest";
import { TestHelpers } from "generated";

// Register handlers with the runtime before processEvent calls.
import "../src/EventHandlers/Pool";

const CHAIN_ID = 137; // Polygon, matching Constants.ts POLYGON
const POOL_ADDR = "0x794a61358D6845594F94dc1DB02A252b5b4814aD"; // Aave V3 Pool on Polygon
const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // Polygon USDC.e address (illustrative)
const WMATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
const ALICE = "0xa11ce0000000000000000000000000000000a11c";
const BOB = "0xb0b00000000000000000000000000000000000b0";
const LIQUIDATOR = "0x11c1da70110000000000000000000000000c1da7";

function freshDb() {
  return TestHelpers.MockDb.createMockDb();
}

describe("ReserveAggregator — Aave V3 lifecycle", () => {
  it("Supply creates Reserve + ReserveAggregator + UserReserve on first sighting", async () => {
    let mockDb = freshDb();

    const supply = TestHelpers.Pool.Supply.createMockEvent({
      reserve: USDC,
      user: ALICE,
      onBehalfOf: ALICE,
      amount: 1_000_000_000n, // 1000 USDC (6 decimals)
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Supply.processEvent({ event: supply, mockDb });

    const reserveId = `${CHAIN_ID}-${USDC.toLowerCase()}`;

    const reserve = mockDb.entities.Reserve.get(reserveId);
    expect(reserve?.asset).toBe(USDC.toLowerCase());

    const agg = mockDb.entities.ReserveAggregator.get(reserveId);
    expect(agg?.totalSupplied).toBe(1_000_000_000n);
    expect(agg?.totalBorrowed).toBe(0n);
    expect(agg?.uniqueSuppliers).toBe(1);

    const userReserve = mockDb.entities.UserReserve.get(
      `${CHAIN_ID}-${USDC.toLowerCase()}-${ALICE.toLowerCase()}`,
    );
    expect(userReserve?.cumulativeSupplied).toBe(1_000_000_000n);
    expect(userReserve?.netSupplyPosition).toBe(1_000_000_000n);
    expect(userReserve?.netDebtPosition).toBe(0n);

    const userAgg = mockDb.entities.UserAggregator.get(`${CHAIN_ID}-${ALICE.toLowerCase()}`);
    expect(userAgg?.totalSuppliedAcrossReserves).toBe(1_000_000_000n);
    expect(userAgg?.reservesParticipated).toBe(1);
    expect(userAgg?.liquidationsAsBorrower).toBe(0);
  });

  it("Borrow accumulates totalBorrowed + increments uniqueBorrowers", async () => {
    let mockDb = freshDb();

    // Bootstrap: Alice supplies USDC.
    const supply = TestHelpers.Pool.Supply.createMockEvent({
      reserve: USDC,
      user: ALICE,
      onBehalfOf: ALICE,
      amount: 10_000_000_000n,
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Supply.processEvent({ event: supply, mockDb });

    // Alice borrows WMATIC against her USDC collateral.
    const borrow = TestHelpers.Pool.Borrow.createMockEvent({
      reserve: WMATIC,
      user: ALICE,
      onBehalfOf: ALICE,
      amount: 100n * 10n ** 18n, // 100 WMATIC
      interestRateMode: 2, // variable
      borrowRate: 50_000_000_000_000_000_000_000_000n, // ~5% APY in RAY
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Borrow.processEvent({ event: borrow, mockDb });

    const wmaticReserveId = `${CHAIN_ID}-${WMATIC.toLowerCase()}`;
    const wmaticAgg = mockDb.entities.ReserveAggregator.get(wmaticReserveId);
    expect(wmaticAgg?.totalBorrowed).toBe(100n * 10n ** 18n);
    expect(wmaticAgg?.uniqueBorrowers).toBe(1);
    expect(wmaticAgg?.totalSupplied).toBe(0n); // borrow-only on this reserve

    const aliceWmatic = mockDb.entities.UserReserve.get(
      `${CHAIN_ID}-${WMATIC.toLowerCase()}-${ALICE.toLowerCase()}`,
    );
    expect(aliceWmatic?.cumulativeBorrowed).toBe(100n * 10n ** 18n);
    expect(aliceWmatic?.netDebtPosition).toBe(100n * 10n ** 18n);

    // Alice's UserAggregator now spans 2 reserves (USDC + WMATIC).
    const aliceAgg = mockDb.entities.UserAggregator.get(`${CHAIN_ID}-${ALICE.toLowerCase()}`);
    expect(aliceAgg?.reservesParticipated).toBe(2);
    expect(aliceAgg?.totalSuppliedAcrossReserves).toBe(10_000_000_000n);
    expect(aliceAgg?.totalBorrowedAcrossReserves).toBe(100n * 10n ** 18n);
  });

  it("LiquidationCall writes Liquidation entity + updates both reserves + both users", async () => {
    let mockDb = freshDb();

    // Bootstrap: Bob supplies USDC, borrows WMATIC.
    let event = TestHelpers.Pool.Supply.createMockEvent({
      reserve: USDC,
      user: BOB,
      onBehalfOf: BOB,
      amount: 1000n * 10n ** 6n,
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Supply.processEvent({ event, mockDb });

    event = TestHelpers.Pool.Borrow.createMockEvent({
      reserve: WMATIC,
      user: BOB,
      onBehalfOf: BOB,
      amount: 500n * 10n ** 18n,
      interestRateMode: 2,
      borrowRate: 50_000_000_000_000_000_000_000_000n,
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Borrow.processEvent({ event, mockDb });

    // Liquidation: Bob's USDC collateral seized; debt was WMATIC.
    const liq = TestHelpers.Pool.LiquidationCall.createMockEvent({
      collateralAsset: USDC,
      debtAsset: WMATIC,
      user: BOB,
      debtToCover: 100n * 10n ** 18n,
      liquidatedCollateralAmount: 200n * 10n ** 6n,
      liquidator: LIQUIDATOR,
      receiveAToken: false,
      mockEventData: {
        srcAddress: POOL_ADDR,
        chainId: CHAIN_ID,
        block: { number: 50_000_000, timestamp: 1_700_000_000, hash: "0xabc" },
        logIndex: 5,
      },
    });
    mockDb = await TestHelpers.Pool.LiquidationCall.processEvent({ event: liq, mockDb });

    // Liquidation entity exists with correct fields.
    const liqId = `${CHAIN_ID}-50000000-5`;
    const liqEntity = mockDb.entities.Liquidation.get(liqId);
    expect(liqEntity?.user).toBe(BOB.toLowerCase());
    expect(liqEntity?.liquidator).toBe(LIQUIDATOR.toLowerCase());
    expect(liqEntity?.debtToCover).toBe(100n * 10n ** 18n);
    expect(liqEntity?.liquidatedCollateralAmount).toBe(200n * 10n ** 6n);
    expect(liqEntity?.receiveAToken).toBe(false);

    // Both reserves' liquidation count incremented.
    const usdcAgg = mockDb.entities.ReserveAggregator.get(`${CHAIN_ID}-${USDC.toLowerCase()}`);
    const wmaticAgg = mockDb.entities.ReserveAggregator.get(`${CHAIN_ID}-${WMATIC.toLowerCase()}`);
    expect(usdcAgg?.totalLiquidations).toBe(1);
    expect(wmaticAgg?.totalLiquidations).toBe(1);

    // Bob's UserAggregator: liquidationsAsBorrower incremented.
    const bobAgg = mockDb.entities.UserAggregator.get(`${CHAIN_ID}-${BOB.toLowerCase()}`);
    expect(bobAgg?.liquidationsAsBorrower).toBe(1);
    expect(bobAgg?.liquidationsAsLiquidator).toBe(0);

    // Liquidator's UserAggregator: liquidationsAsLiquidator incremented.
    const liquidatorAgg = mockDb.entities.UserAggregator.get(`${CHAIN_ID}-${LIQUIDATOR.toLowerCase()}`);
    expect(liquidatorAgg?.liquidationsAsLiquidator).toBe(1);
    expect(liquidatorAgg?.liquidationsAsBorrower).toBe(0);
  });

  it("ReserveDataUpdated writes a ReserveRateSnapshot + updates aggregator current rates", async () => {
    let mockDb = freshDb();

    const liquidityRate = 30_000_000_000_000_000_000_000_000n; // 3% APY
    const variableBorrowRate = 50_000_000_000_000_000_000_000_000n; // 5% APY
    const liquidityIndex = 1_050_000_000_000_000_000_000_000_000n; // 1.05 in RAY
    const variableBorrowIndex = 1_080_000_000_000_000_000_000_000_000n; // 1.08 in RAY

    const update = TestHelpers.Pool.ReserveDataUpdated.createMockEvent({
      reserve: USDC,
      liquidityRate,
      stableBorrowRate: 0n,
      variableBorrowRate,
      liquidityIndex,
      variableBorrowIndex,
      mockEventData: {
        srcAddress: POOL_ADDR,
        chainId: CHAIN_ID,
        block: { number: 50_000_000, timestamp: 1_700_000_000, hash: "0xdef" },
      },
    });
    mockDb = await TestHelpers.Pool.ReserveDataUpdated.processEvent({ event: update, mockDb });

    // Snapshot row written.
    const reserveId = `${CHAIN_ID}-${USDC.toLowerCase()}`;
    const snapshotId = `${reserveId}-50000000`;
    const snap = mockDb.entities.ReserveRateSnapshot.get(snapshotId);
    expect(snap?.liquidityRate).toBe(liquidityRate);
    expect(snap?.variableBorrowRate).toBe(variableBorrowRate);
    expect(snap?.liquidityIndex).toBe(liquidityIndex);
    expect(snap?.variableBorrowIndex).toBe(variableBorrowIndex);

    // Aggregator's "current" state updated.
    const agg = mockDb.entities.ReserveAggregator.get(reserveId);
    expect(agg?.currentLiquidityRate).toBe(liquidityRate);
    expect(agg?.currentVariableBorrowRate).toBe(variableBorrowRate);
    expect(agg?.currentLiquidityIndex).toBe(liquidityIndex);
    expect(agg?.currentVariableBorrowIndex).toBe(variableBorrowIndex);
  });

  it("Repay reduces netDebtPosition", async () => {
    let mockDb = freshDb();

    // Setup: Alice supplies, then borrows.
    let event = TestHelpers.Pool.Supply.createMockEvent({
      reserve: USDC,
      user: ALICE,
      onBehalfOf: ALICE,
      amount: 10_000n * 10n ** 6n,
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Supply.processEvent({ event, mockDb });

    event = TestHelpers.Pool.Borrow.createMockEvent({
      reserve: WMATIC,
      user: ALICE,
      onBehalfOf: ALICE,
      amount: 1000n * 10n ** 18n,
      interestRateMode: 2,
      borrowRate: 50_000_000_000_000_000_000_000_000n,
      referralCode: 0,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Borrow.processEvent({ event, mockDb });

    // Alice repays half.
    const repay = TestHelpers.Pool.Repay.createMockEvent({
      reserve: WMATIC,
      user: ALICE,
      repayer: ALICE,
      amount: 500n * 10n ** 18n,
      useATokens: false,
      mockEventData: { srcAddress: POOL_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Pool.Repay.processEvent({ event: repay, mockDb });

    const userReserve = mockDb.entities.UserReserve.get(
      `${CHAIN_ID}-${WMATIC.toLowerCase()}-${ALICE.toLowerCase()}`,
    );
    expect(userReserve?.cumulativeBorrowed).toBe(1000n * 10n ** 18n);
    expect(userReserve?.cumulativeRepaid).toBe(500n * 10n ** 18n);
    expect(userReserve?.netDebtPosition).toBe(500n * 10n ** 18n);

    const wmaticAgg = mockDb.entities.ReserveAggregator.get(`${CHAIN_ID}-${WMATIC.toLowerCase()}`);
    expect(wmaticAgg?.totalBorrowed).toBe(1000n * 10n ** 18n);
    expect(wmaticAgg?.totalRepaid).toBe(500n * 10n ** 18n);
  });
});
