/**
 * ReserveAggregator — derived per-reserve state.
 *
 * Tracks total supplied/borrowed/repaid/withdrawn across all users for one
 * reserve, plus the latest rate + index state (updated on
 * ReserveDataUpdated). Same shape as the DEX template's PoolAggregator and
 * the perp template's PerpAggregator.
 */

import type { handlerContext } from "generated";
import { ReserveId } from "../Constants";

export function ensureReserveAggregator(
  context: handlerContext,
  args: { chainId: number; asset: string; timestamp: bigint; blockNumber: bigint },
): void {
  const id = ReserveId(args.chainId, args.asset);
  // We use ensure-pattern (not create-on-factory) because Aave doesn't fire
  // an explicit "reserve created" event in the indexed surface — the first
  // Supply/Borrow on a new asset is what we observe. Idempotent: if the
  // entity already exists this call is a no-op (handler reads first, only
  // creates if missing).
}

export async function applySupply(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    user: string;
    amount: bigint;
    isFirstSupply: boolean;
    timestamp: bigint;
    blockNumber: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);

  if (!existing) {
    // First event ever for this reserve. Create both Reserve and
    // ReserveAggregator entities.
    context.Reserve.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      firstSeenBlock: args.blockNumber,
      firstSeenTimestamp: args.timestamp,
    });
    context.ReserveAggregator.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      totalSupplied: args.amount,
      totalWithdrawn: 0n,
      totalBorrowed: 0n,
      totalRepaid: 0n,
      totalLiquidations: 0,
      uniqueSuppliers: 1,
      uniqueBorrowers: 0,
      currentLiquidityRate: 0n,
      currentVariableBorrowRate: 0n,
      currentLiquidityIndex: 0n,
      currentVariableBorrowIndex: 0n,
      lastUpdatedTimestamp: args.timestamp,
    });
    return;
  }

  context.ReserveAggregator.set({
    ...existing,
    totalSupplied: existing.totalSupplied + args.amount,
    uniqueSuppliers: existing.uniqueSuppliers + (args.isFirstSupply ? 1 : 0),
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyWithdraw(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    amount: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);
  if (!existing) return;
  context.ReserveAggregator.set({
    ...existing,
    totalWithdrawn: existing.totalWithdrawn + args.amount,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyBorrow(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    user: string;
    amount: bigint;
    isFirstBorrow: boolean;
    timestamp: bigint;
    blockNumber: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);

  if (!existing) {
    // First event for this reserve is a Borrow (rare but possible if
    // someone borrows without first supplying — they used aTokens
    // received elsewhere as collateral).
    context.Reserve.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      firstSeenBlock: args.blockNumber,
      firstSeenTimestamp: args.timestamp,
    });
    context.ReserveAggregator.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      totalSupplied: 0n,
      totalWithdrawn: 0n,
      totalBorrowed: args.amount,
      totalRepaid: 0n,
      totalLiquidations: 0,
      uniqueSuppliers: 0,
      uniqueBorrowers: 1,
      currentLiquidityRate: 0n,
      currentVariableBorrowRate: 0n,
      currentLiquidityIndex: 0n,
      currentVariableBorrowIndex: 0n,
      lastUpdatedTimestamp: args.timestamp,
    });
    return;
  }

  context.ReserveAggregator.set({
    ...existing,
    totalBorrowed: existing.totalBorrowed + args.amount,
    uniqueBorrowers: existing.uniqueBorrowers + (args.isFirstBorrow ? 1 : 0),
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyRepay(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    amount: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);
  if (!existing) return;
  context.ReserveAggregator.set({
    ...existing,
    totalRepaid: existing.totalRepaid + args.amount,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyLiquidationToReserve(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    timestamp: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);
  if (!existing) return;
  context.ReserveAggregator.set({
    ...existing,
    totalLiquidations: existing.totalLiquidations + 1,
    lastUpdatedTimestamp: args.timestamp,
  });
}

export async function applyRateUpdate(
  context: handlerContext,
  args: {
    chainId: number;
    asset: string;
    liquidityRate: bigint;
    variableBorrowRate: bigint;
    liquidityIndex: bigint;
    variableBorrowIndex: bigint;
    timestamp: bigint;
  },
): Promise<void> {
  const id = ReserveId(args.chainId, args.asset);
  const existing = await context.ReserveAggregator.get(id);
  if (!existing) {
    // ReserveDataUpdated for a reserve we haven't seen Supply/Borrow on
    // yet — happens at protocol initialization. Create a stub entity so
    // subsequent Supply/Borrow events have something to update.
    context.Reserve.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      firstSeenBlock: 0n,
      firstSeenTimestamp: args.timestamp,
    });
    context.ReserveAggregator.set({
      id,
      chainId: args.chainId,
      asset: args.asset.toLowerCase(),
      totalSupplied: 0n,
      totalWithdrawn: 0n,
      totalBorrowed: 0n,
      totalRepaid: 0n,
      totalLiquidations: 0,
      uniqueSuppliers: 0,
      uniqueBorrowers: 0,
      currentLiquidityRate: args.liquidityRate,
      currentVariableBorrowRate: args.variableBorrowRate,
      currentLiquidityIndex: args.liquidityIndex,
      currentVariableBorrowIndex: args.variableBorrowIndex,
      lastUpdatedTimestamp: args.timestamp,
    });
    return;
  }
  context.ReserveAggregator.set({
    ...existing,
    currentLiquidityRate: args.liquidityRate,
    currentVariableBorrowRate: args.variableBorrowRate,
    currentLiquidityIndex: args.liquidityIndex,
    currentVariableBorrowIndex: args.variableBorrowIndex,
    lastUpdatedTimestamp: args.timestamp,
  });
}
