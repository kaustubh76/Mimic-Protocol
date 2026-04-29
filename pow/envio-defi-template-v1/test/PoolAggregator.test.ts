/**
 * DeFi PoolAggregator + Snapshot tests.
 *
 * Tests the pure derived-state functions in src/Aggregators/PoolAggregator.ts
 * directly — they're pure, no I/O, so we don't need a MockDb for these.
 * The snapshot tests use MockDb to verify epoch boundary detection.
 */

import { describe, expect, it } from "vitest";
import {
  applySwap,
  applyMint,
  applyBurn,
  applySync,
  applyFees,
} from "../src/Aggregators/PoolAggregator";
import { getSnapshotEpoch } from "../src/Snapshots/PoolHourSnapshot";
import { SNAPSHOT_INTERVAL_SECONDS } from "../src/Constants";

const baseAggregator = {
  id: "10-0xabc",
  chainId: 10,
  poolAddress: "0xabc",
  reserve0: 0n,
  reserve1: 0n,
  cumulativeVolume0: 0n,
  cumulativeVolume1: 0n,
  cumulativeFees0: 0n,
  cumulativeFees1: 0n,
  swapCount: 0n,
  lastUpdatedTimestamp: 0n,
  lastSnapshotTimestamp: 0n,
};

describe("PoolAggregator pure transformations", () => {
  it("applySwap accumulates volume on both sides + increments swapCount", () => {
    const after = applySwap(baseAggregator, {
      amount0In: 100n,
      amount1In: 0n,
      amount0Out: 0n,
      amount1Out: 250n,
      timestamp: 1_700_000_000n,
    });
    expect(after.cumulativeVolume0).toBe(100n);
    expect(after.cumulativeVolume1).toBe(250n);
    expect(after.swapCount).toBe(1n);
    expect(after.lastUpdatedTimestamp).toBe(1_700_000_000n);
  });

  it("applySwap is monotonic — 3 successive swaps accumulate", () => {
    let agg = baseAggregator;
    for (let i = 0; i < 3; i++) {
      agg = applySwap(agg, {
        amount0In: 100n,
        amount1In: 50n,
        amount0Out: 25n,
        amount1Out: 75n,
        timestamp: BigInt(1_700_000_000 + i),
      });
    }
    expect(agg.cumulativeVolume0).toBe(375n); // (100+25)*3
    expect(agg.cumulativeVolume1).toBe(375n); // (50+75)*3
    expect(agg.swapCount).toBe(3n);
  });

  it("applyMint and applyBurn touch only the timestamp", () => {
    const minted = applyMint(baseAggregator, {
      amount0: 1000n,
      amount1: 2000n,
      timestamp: 1_700_000_001n,
    });
    expect(minted.lastUpdatedTimestamp).toBe(1_700_000_001n);
    // Volume + reserves unchanged — Sync is the source of truth for those.
    expect(minted.cumulativeVolume0).toBe(0n);
    expect(minted.reserve0).toBe(0n);

    const burned = applyBurn(minted, {
      amount0: 500n,
      amount1: 1000n,
      timestamp: 1_700_000_002n,
    });
    expect(burned.lastUpdatedTimestamp).toBe(1_700_000_002n);
    expect(burned.cumulativeVolume0).toBe(0n);
  });

  it("applySync overwrites reserves with latest values", () => {
    const synced = applySync(baseAggregator, {
      reserve0: 500_000n,
      reserve1: 1_500_000n,
      timestamp: 1_700_000_003n,
    });
    expect(synced.reserve0).toBe(500_000n);
    expect(synced.reserve1).toBe(1_500_000n);

    // Subsequent Sync overwrites, not accumulates.
    const synced2 = applySync(synced, {
      reserve0: 600_000n,
      reserve1: 1_400_000n,
      timestamp: 1_700_000_004n,
    });
    expect(synced2.reserve0).toBe(600_000n);
    expect(synced2.reserve1).toBe(1_400_000n);
  });

  it("applyFees accumulates cumulative fees on both sides", () => {
    let agg = baseAggregator;
    agg = applyFees(agg, { fees0: 10n, fees1: 20n, timestamp: 1_700_000_000n });
    agg = applyFees(agg, { fees0: 5n, fees1: 8n, timestamp: 1_700_000_001n });
    expect(agg.cumulativeFees0).toBe(15n);
    expect(agg.cumulativeFees1).toBe(28n);
  });
});

describe("Snapshot epoch boundary logic", () => {
  it("getSnapshotEpoch rounds down to SNAPSHOT_INTERVAL_SECONDS multiple", () => {
    const interval = BigInt(SNAPSHOT_INTERVAL_SECONDS);
    expect(getSnapshotEpoch(interval - 1n)).toBe(0n);
    expect(getSnapshotEpoch(interval)).toBe(interval);
    expect(getSnapshotEpoch(interval + 1n)).toBe(interval);
    expect(getSnapshotEpoch(interval * 5n + 100n)).toBe(interval * 5n);
  });

  it("getSnapshotEpoch is idempotent — applying twice yields the same value", () => {
    const t = 1_700_001_234n;
    const e1 = getSnapshotEpoch(t);
    const e2 = getSnapshotEpoch(e1);
    expect(e1).toBe(e2);
  });
});
