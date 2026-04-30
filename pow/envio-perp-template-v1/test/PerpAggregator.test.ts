/**
 * EventEmitter handler tests — GMX v2 PositionIncrease v1 scope.
 *
 * The previous version of this test suite covered 4 event types
 * (PositionIncrease, PositionDecrease, Liquidation, FundingFeeAmountPerSizeUpdated)
 * against a synthesised flat-event ABI shape.
 *
 * After the GMX v2 pivot (April 2026), the perp template subscribes to a
 * single `EventEmitter.EventLog1(string eventName, ..., EventLogData eventData)`
 * generic event and routes on `eventName`. v1 scope is `PositionIncrease` only;
 * the other 3 tests are kept as `it.skip` referencing the v2 follow-up.
 *
 * The active test mocks an EventLog1 with:
 *   - eventName = "PositionIncrease"
 *   - eventData containing the typed dictionary fields the
 *     decodePositionIncrease helper expects (positionKey, account, market,
 *     isLong, sizeDeltaUsd, etc)
 * and asserts the handler:
 *   - lazy-creates the PerpMarket entity
 *   - lazy-creates the PerpAggregator
 *   - creates the Position entity with correct fields
 *   - increments PerpAggregator.longOpenInterestUsd / uniqueTraders
 *   - upserts the per-trader PositionAggregator
 */

import { describe, expect, it } from "vitest";
import { TestHelpers } from "generated";

import "../src/EventHandlers/EventEmitter";

const CHAIN_ID = 42161; // Arbitrum
const EVENT_EMITTER = "0xC8ee91A54287DB53897056e12D9819156D3822Fb";
const MARKET_ETH_USD = "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336";
const ALICE = "0xa11ce0000000000000000000000000000000a11c";
const POSITION_KEY_ALICE_LONG = "0x" + "a1".repeat(32);

function freshDb() {
  return TestHelpers.MockDb.createMockDb();
}

/**
 * Build a synthetic EventLogData payload for PositionIncrease.
 *
 * Shape: tuple of 7 sections (Address, Uint, Int, Bool, Bytes32, Bytes, String),
 * each [items, arrayItems] where items = Array<[key, value]>.
 *
 * Field values populated here mirror what GMX v2 actually emits via
 * PositionEventUtils.emitPositionIncrease — see the decode helper at
 * src/Effects/decodeEventLogData.ts for the full key inventory.
 */
function buildPositionIncreaseEventData(opts: {
  positionKey: string;
  account: string;
  market: string;
  isLong: boolean;
  sizeInUsd: bigint;
  sizeInTokens: bigint;
  collateralAmount: bigint;
  sizeDeltaUsd: bigint;
  collateralDeltaAmount: bigint;
}) {
  return [
    // addressItems: { items, arrayItems }
    [
      [
        ["account", opts.account],
        ["market", opts.market],
      ] as Array<[string, string]>,
      [] as Array<[string, string[]]>,
    ],
    // uintItems
    [
      [
        ["sizeInUsd", opts.sizeInUsd],
        ["sizeInTokens", opts.sizeInTokens],
        ["collateralAmount", opts.collateralAmount],
        ["sizeDeltaUsd", opts.sizeDeltaUsd],
        ["collateralDeltaAmount", opts.collateralDeltaAmount],
      ] as Array<[string, bigint]>,
      [] as Array<[string, bigint[]]>,
    ],
    // intItems
    [[] as Array<[string, bigint]>, [] as Array<[string, bigint[]]>],
    // boolItems
    [
      [["isLong", opts.isLong]] as Array<[string, boolean]>,
      [] as Array<[string, boolean[]]>,
    ],
    // bytes32Items
    [
      [["positionKey", opts.positionKey]] as Array<[string, string]>,
      [] as Array<[string, string[]]>,
    ],
    // bytesItems
    [[] as Array<[string, string]>, [] as Array<[string, string[]]>],
    // stringItems
    [[] as Array<[string, string]>, [] as Array<[string, string[]]>],
  ];
}

describe("EventEmitter — PositionIncrease v1", () => {
  it("lazy-creates PerpMarket + PerpAggregator + Position on first sighting", async () => {
    const mockDb = freshDb();

    const eventData = buildPositionIncreaseEventData({
      positionKey: POSITION_KEY_ALICE_LONG,
      account: ALICE,
      market: MARKET_ETH_USD,
      isLong: true,
      sizeInUsd: 10_000n * 10n ** 30n, // 10k USD with GMX v2's 30-decimal convention
      sizeInTokens: 333n * 10n ** 16n, // ~3.33 ETH at $3k
      collateralAmount: 1_000n * 10n ** 6n, // 1k USDC (6 decimals)
      sizeDeltaUsd: 10_000n * 10n ** 30n,
      collateralDeltaAmount: 1_000n * 10n ** 6n,
    });

    const event = TestHelpers.EventEmitter.EventLog1.createMockEvent({
      msgSender: EVENT_EMITTER,
      eventName: "PositionIncrease",
      eventNameHash: "PositionIncrease",
      topic1: "0x" + "00".repeat(32),
      // biome-ignore lint/suspicious/noExplicitAny: deeply-nested tuple type from codegen
      eventData: eventData as any,
      mockEventData: { srcAddress: EVENT_EMITTER, chainId: CHAIN_ID },
    });

    const result = await TestHelpers.EventEmitter.EventLog1.processEvent({
      event,
      mockDb,
    });

    const marketId = `${CHAIN_ID}-${MARKET_ETH_USD.toLowerCase()}`;

    // Lazy-create: PerpMarket + PerpAggregator both exist.
    const perpMarket = result.entities.PerpMarket.get(marketId);
    expect(perpMarket?.address).toBe(MARKET_ETH_USD.toLowerCase());

    const agg = result.entities.PerpAggregator.get(marketId);
    expect(agg?.longOpenInterestUsd).toBe(10_000n * 10n ** 30n);
    expect(agg?.shortOpenInterestUsd).toBe(0n);
    expect(agg?.totalCollateralLong).toBe(1_000n * 10n ** 6n);
    expect(agg?.uniqueTraders).toBe(1);
    expect(agg?.totalPositions).toBe(1);

    // Position entity created.
    const position = result.entities.Position.get(POSITION_KEY_ALICE_LONG.toLowerCase());
    expect(position?.account).toBe(ALICE.toLowerCase());
    expect(position?.market_id).toBe(marketId);
    expect(position?.isLong).toBe(true);
    expect(position?.sizeInUsd).toBe(10_000n * 10n ** 30n);
    expect(position?.cumulativeSizeIncreaseUsd).toBe(10_000n * 10n ** 30n);

    // PositionAggregator (per-trader, cross-market).
    const userAgg = result.entities.PositionAggregator.get(`${CHAIN_ID}-${ALICE.toLowerCase()}`);
    expect(userAgg?.cumulativeSizeIncreaseUsd).toBe(10_000n * 10n ** 30n);
    expect(userAgg?.cumulativeCollateralIn).toBe(1_000n * 10n ** 6n);
    expect(userAgg?.positionCount).toBe(1);
    expect(userAgg?.marketsTraded).toBe(1);
  });

  it("ignores EventLog1 with non-PositionIncrease eventName (v1 scope)", async () => {
    const mockDb = freshDb();

    const event = TestHelpers.EventEmitter.EventLog1.createMockEvent({
      msgSender: EVENT_EMITTER,
      eventName: "OrderExecuted", // not PositionIncrease — should be skipped
      eventNameHash: "OrderExecuted",
      topic1: "0x" + "00".repeat(32),
      // biome-ignore lint/suspicious/noExplicitAny: deeply-nested tuple type from codegen
      eventData: [
        [[], []],
        [[], []],
        [[], []],
        [[], []],
        [[], []],
        [[], []],
        [[], []],
      ] as any,
      mockEventData: { srcAddress: EVENT_EMITTER, chainId: CHAIN_ID },
    });

    const result = await TestHelpers.EventEmitter.EventLog1.processEvent({
      event,
      mockDb,
    });

    // No entities should be created.
    const marketId = `${CHAIN_ID}-${MARKET_ETH_USD.toLowerCase()}`;
    expect(result.entities.PerpMarket.get(marketId)).toBeUndefined();
    expect(result.entities.Position.get(POSITION_KEY_ALICE_LONG.toLowerCase())).toBeUndefined();
  });

  // -----------------------------------------------------------------
  // Pre-pivot tests (v1 scope deferred): the 4 original tests covered
  // PositionDecrease, Liquidation, FundingFeeAmountPerSizeUpdated. These
  // events DO exist in GMX v2's EventEmitter — adding them is mechanical
  // (route on eventName, decode the payload, update entities). They're
  // marked it.skip pending v2 follow-up.
  // -----------------------------------------------------------------
  it.skip("PositionDecrease shrinks open interest + accumulates realized PnL — TODO v2", () => {});
  it.skip("Liquidation event marks Position liquidated + writes Liquidation entity — TODO v2", () => {});
  it.skip("FundingFeeAmountPerSizeUpdated writes a FundingSnapshot — TODO v2", () => {});
});
