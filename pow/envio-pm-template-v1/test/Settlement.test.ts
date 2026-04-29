/**
 * Settlement four-state machine tests.
 *
 * Uses Envio's generated TestHelpers + MockDb to drive handlers in
 * isolation, without spinning up the indexer process. Verifies the state
 * transitions documented in src/EventHandlers/Settlement.ts:
 *
 *   OPEN → RESOLVING → SETTLED → CORRECTED
 *
 * plus the guards (out-of-order events, reorg races).
 *
 * The indexer's handler bodies must be imported (registers the event
 * handlers) before the TestHelpers.*.processEvent calls run, otherwise
 * processEvent has nothing to dispatch to.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { TestHelpers } from "generated";

// Import the handler modules so they register with the runtime.
// MUST happen before processEvent calls.
import "../src/EventHandlers/MarketFactory";
import "../src/EventHandlers/Market";
import "../src/EventHandlers/Settlement";

import { _resetLeaderboardAccumulator } from "../src/Snapshots/LeaderboardSnapshot";

const CHAIN_ID = 137; // Polygon, matching Constants.ts POLYGON config
const MARKET_ADDR = "0x1111111111111111111111111111111111111111";
const FACTORY_ADDR = "0x2222222222222222222222222222222222222222";
const ALICE = "0xa11ce0000000000000000000000000000000a11c";
const BOB = "0xb0b00000000000000000000000000000000000b0";

const QUESTION_ID = "0x" + "ab".repeat(32);
const ORACLE_RESOLUTION_ID = "0x" + "cd".repeat(32);

function freshMockDb() {
  _resetLeaderboardAccumulator();
  return TestHelpers.MockDb.createMockDb();
}

describe("PMMarket — four-state settlement machine", () => {
  beforeEach(() => {
    _resetLeaderboardAccumulator();
  });

  it("OPEN → RESOLVING transition records lastResolutionBlock", async () => {
    let mockDb = freshMockDb();

    // 1. Factory emits MarketCreated → handler creates Market in OPEN state.
    const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
      market: MARKET_ADDR,
      questionId: QUESTION_ID,
      endTime: 1_700_000_000n,
      outcomeCount: 2,
      category: "binary",
      mockEventData: { srcAddress: FACTORY_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.MarketFactory.MarketCreated.processEvent({
      event: created,
      mockDb,
    });

    const market0 = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market0?.state).toBe("OPEN");

    // 2. MarketLockedForResolution → state moves to RESOLVING.
    const locked = TestHelpers.Market.MarketLockedForResolution.createMockEvent({
      lockedAt: 1_700_000_001n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 100, timestamp: 1_700_000_001, hash: "0xabc" } },
    });
    mockDb = await TestHelpers.Market.MarketLockedForResolution.processEvent({
      event: locked,
      mockDb,
    });

    const market1 = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market1?.state).toBe("RESOLVING");
    expect(market1?.lastResolutionBlock).toBe(100n);
  });

  it("RESOLVING → SETTLED records winningOutcome + oracleResolutionId", async () => {
    let mockDb = freshMockDb();

    // Setup: market in RESOLVING state.
    const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
      market: MARKET_ADDR,
      questionId: QUESTION_ID,
      endTime: 1_700_000_000n,
      outcomeCount: 2,
      category: "binary",
      mockEventData: { srcAddress: FACTORY_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.MarketFactory.MarketCreated.processEvent({
      event: created,
      mockDb,
    });

    const locked = TestHelpers.Market.MarketLockedForResolution.createMockEvent({
      lockedAt: 1_700_000_001n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.MarketLockedForResolution.processEvent({
      event: locked,
      mockDb,
    });

    // Now resolve.
    const resolved = TestHelpers.Market.OracleResolved.createMockEvent({
      winningOutcome: 1,
      resolvedAt: 1_700_000_002n,
      oracleResolutionId: ORACLE_RESOLUTION_ID,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 200, timestamp: 1_700_000_002, hash: "0xdef" } },
    });
    mockDb = await TestHelpers.Market.OracleResolved.processEvent({
      event: resolved,
      mockDb,
    });

    const market = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market?.state).toBe("SETTLED");
    expect(market?.winningOutcome).toBe(1);
    expect(market?.oracleResolutionId).toBe(ORACLE_RESOLUTION_ID);
    expect(market?.resolvedAt).toBe(1_700_000_002n);
    expect(market?.lastResolutionBlock).toBe(200n);
  });

  it("SETTLED → CORRECTED records previousWinningOutcome + flips winner", async () => {
    let mockDb = freshMockDb();

    // Drive through OPEN → RESOLVING → SETTLED.
    const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
      market: MARKET_ADDR,
      questionId: QUESTION_ID,
      endTime: 1_700_000_000n,
      outcomeCount: 2,
      category: "binary",
      mockEventData: { srcAddress: FACTORY_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.MarketFactory.MarketCreated.processEvent({ event: created, mockDb });

    const locked = TestHelpers.Market.MarketLockedForResolution.createMockEvent({
      lockedAt: 1_700_000_001n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.MarketLockedForResolution.processEvent({ event: locked, mockDb });

    const resolved = TestHelpers.Market.OracleResolved.createMockEvent({
      winningOutcome: 0,
      resolvedAt: 1_700_000_002n,
      oracleResolutionId: ORACLE_RESOLUTION_ID,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 200, timestamp: 1_700_000_002, hash: "0xdef" } },
    });
    mockDb = await TestHelpers.Market.OracleResolved.processEvent({ event: resolved, mockDb });

    // Correction at a later block.
    const corrected = TestHelpers.Market.MarketCorrected.createMockEvent({
      previousWinningOutcome: 0,
      correctedWinningOutcome: 1,
      correctedAt: 1_700_000_010n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 300, timestamp: 1_700_000_010, hash: "0x999" } },
    });
    mockDb = await TestHelpers.Market.MarketCorrected.processEvent({ event: corrected, mockDb });

    const market = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market?.state).toBe("CORRECTED");
    expect(market?.previousWinningOutcome).toBe(0);
    expect(market?.winningOutcome).toBe(1);
    expect(market?.correctedAt).toBe(1_700_000_010n);
    expect(market?.lastResolutionBlock).toBe(300n);
  });

  it("MarketCorrected on OPEN market is skipped (out-of-order guard)", async () => {
    let mockDb = freshMockDb();

    const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
      market: MARKET_ADDR,
      questionId: QUESTION_ID,
      endTime: 1_700_000_000n,
      outcomeCount: 2,
      category: "binary",
      mockEventData: { srcAddress: FACTORY_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.MarketFactory.MarketCreated.processEvent({ event: created, mockDb });

    // Premature correction without prior settlement.
    const corrected = TestHelpers.Market.MarketCorrected.createMockEvent({
      previousWinningOutcome: 0,
      correctedWinningOutcome: 1,
      correctedAt: 1_700_000_010n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 50, timestamp: 1_700_000_010, hash: "0x999" } },
    });
    mockDb = await TestHelpers.Market.MarketCorrected.processEvent({ event: corrected, mockDb });

    // State should still be OPEN — handler emits a warn log and returns.
    const market = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market?.state).toBe("OPEN");
    expect(market?.previousWinningOutcome).toBeUndefined();
  });

  it("MarketCorrected with lastResolutionBlock >= correction block is skipped (reorg guard)", async () => {
    let mockDb = freshMockDb();

    // Set up SETTLED at block 200.
    const created = TestHelpers.MarketFactory.MarketCreated.createMockEvent({
      market: MARKET_ADDR,
      questionId: QUESTION_ID,
      endTime: 1_700_000_000n,
      outcomeCount: 2,
      category: "binary",
      mockEventData: { srcAddress: FACTORY_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.MarketFactory.MarketCreated.processEvent({ event: created, mockDb });

    const locked = TestHelpers.Market.MarketLockedForResolution.createMockEvent({
      lockedAt: 1_700_000_001n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID },
    });
    mockDb = await TestHelpers.Market.MarketLockedForResolution.processEvent({ event: locked, mockDb });

    const resolved = TestHelpers.Market.OracleResolved.createMockEvent({
      winningOutcome: 0,
      resolvedAt: 1_700_000_002n,
      oracleResolutionId: ORACLE_RESOLUTION_ID,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 200, timestamp: 1_700_000_002, hash: "0xdef" } },
    });
    mockDb = await TestHelpers.Market.OracleResolved.processEvent({ event: resolved, mockDb });

    // Now fire MarketCorrected at the SAME block — race with settlement.
    // The race-safe guardrail is `lastResolutionBlock >= correction.block.number`
    // → correction is skipped, prior SETTLED state preserved.
    const corrected = TestHelpers.Market.MarketCorrected.createMockEvent({
      previousWinningOutcome: 0,
      correctedWinningOutcome: 1,
      correctedAt: 1_700_000_010n,
      mockEventData: { srcAddress: MARKET_ADDR, chainId: CHAIN_ID, block: { number: 200, timestamp: 1_700_000_010, hash: "0x999" } },
    });
    mockDb = await TestHelpers.Market.MarketCorrected.processEvent({ event: corrected, mockDb });

    const market = mockDb.entities.Market.get(`${CHAIN_ID}-${MARKET_ADDR.toLowerCase()}`);
    expect(market?.state).toBe("SETTLED"); // not CORRECTED — guard tripped
    expect(market?.winningOutcome).toBe(0); // original outcome preserved
  });
});
