/**
 * Pool event handler — Aave V3 lifecycle events.
 *
 * Six events covered, all on the singleton Pool contract:
 *
 *   Supply              → user adds collateral
 *   Withdraw            → user removes collateral
 *   Borrow              → user opens debt
 *   Repay               → user closes debt
 *   LiquidationCall     → forced liquidation (the trickiest event in the
 *                         vertical — see ENVIO_LIQUIDATION_HANDLER_REFERENCE.md)
 *   ReserveDataUpdated  → interest rate + index update (write a snapshot)
 *
 * Adapted from aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol —
 * event signatures and field names match Aave V3 exactly.
 */

import { Pool } from "generated";
import {
  UserReserveId,
  ReserveId,
  LiquidationId,
  RateSnapshotId,
} from "../Constants";
import {
  applySupply,
  applyWithdraw,
  applyBorrow,
  applyRepay,
  applyLiquidationToReserve,
  applyRateUpdate,
} from "../Aggregators/ReserveAggregator";
import {
  upsertOnSupply,
  upsertOnBorrow,
  upsertOnLiquidationAsBorrower,
  upsertOnLiquidationAsLiquidator,
} from "../Aggregators/UserAggregator";

// -----------------------------------------------------------------
// Supply — user deposits collateral
// -----------------------------------------------------------------
Pool.Supply.handler(async ({ event, context }) => {
  const userReserveId = UserReserveId(event.chainId, event.params.reserve, event.params.onBehalfOf);
  const existingUR = await context.UserReserve.get(userReserveId);

  const isFirstSupplyForUserInReserve = !existingUR;
  // "isFirstSupply for the reserve" is harder — we'd need to count distinct
  // suppliers, but that's expensive without a separate index. Approximate
  // with: this is the user's first event in this reserve.
  const isFirstSupply = !existingUR;
  const isNewReserveForUser = !existingUR;

  const newCumulativeSupplied = (existingUR?.cumulativeSupplied ?? 0n) + event.params.amount;
  const newNetSupply = newCumulativeSupplied - (existingUR?.cumulativeWithdrawn ?? 0n);

  context.UserReserve.set({
    id: userReserveId,
    chainId: event.chainId,
    asset: event.params.reserve.toLowerCase(),
    user: event.params.onBehalfOf.toLowerCase(),
    cumulativeSupplied: newCumulativeSupplied,
    cumulativeWithdrawn: existingUR?.cumulativeWithdrawn ?? 0n,
    cumulativeBorrowed: existingUR?.cumulativeBorrowed ?? 0n,
    cumulativeRepaid: existingUR?.cumulativeRepaid ?? 0n,
    netSupplyPosition: newNetSupply,
    netDebtPosition: (existingUR?.cumulativeBorrowed ?? 0n) - (existingUR?.cumulativeRepaid ?? 0n),
    positionCount: (existingUR?.positionCount ?? 0) + 1,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applySupply(context, {
    chainId: event.chainId,
    asset: event.params.reserve,
    user: event.params.onBehalfOf,
    amount: event.params.amount,
    isFirstSupply,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
  });

  await upsertOnSupply(context, {
    chainId: event.chainId,
    user: event.params.onBehalfOf,
    amount: event.params.amount,
    isNewReserveForUser,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// Withdraw — user removes collateral
// -----------------------------------------------------------------
Pool.Withdraw.handler(async ({ event, context }) => {
  const userReserveId = UserReserveId(event.chainId, event.params.reserve, event.params.user);
  const existingUR = await context.UserReserve.get(userReserveId);

  if (!existingUR) {
    // Possible if the user received aTokens from someone else (transfer).
    // Initialize with zero supply but record the withdrawal.
    context.UserReserve.set({
      id: userReserveId,
      chainId: event.chainId,
      asset: event.params.reserve.toLowerCase(),
      user: event.params.user.toLowerCase(),
      cumulativeSupplied: 0n,
      cumulativeWithdrawn: event.params.amount,
      cumulativeBorrowed: 0n,
      cumulativeRepaid: 0n,
      netSupplyPosition: -(event.params.amount),
      netDebtPosition: 0n,
      positionCount: 1,
      lastUpdatedTimestamp: BigInt(event.block.timestamp),
    });
  } else {
    const newCumulativeWithdrawn = existingUR.cumulativeWithdrawn + event.params.amount;
    context.UserReserve.set({
      ...existingUR,
      cumulativeWithdrawn: newCumulativeWithdrawn,
      netSupplyPosition: existingUR.cumulativeSupplied - newCumulativeWithdrawn,
      lastUpdatedTimestamp: BigInt(event.block.timestamp),
    });
  }

  await applyWithdraw(context, {
    chainId: event.chainId,
    asset: event.params.reserve,
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// Borrow — user opens debt
// -----------------------------------------------------------------
Pool.Borrow.handler(async ({ event, context }) => {
  const userReserveId = UserReserveId(event.chainId, event.params.reserve, event.params.onBehalfOf);
  const existingUR = await context.UserReserve.get(userReserveId);

  const isFirstBorrow = !existingUR;
  const isNewReserveForUser = !existingUR;

  const newCumulativeBorrowed = (existingUR?.cumulativeBorrowed ?? 0n) + event.params.amount;
  const newNetDebt = newCumulativeBorrowed - (existingUR?.cumulativeRepaid ?? 0n);

  context.UserReserve.set({
    id: userReserveId,
    chainId: event.chainId,
    asset: event.params.reserve.toLowerCase(),
    user: event.params.onBehalfOf.toLowerCase(),
    cumulativeSupplied: existingUR?.cumulativeSupplied ?? 0n,
    cumulativeWithdrawn: existingUR?.cumulativeWithdrawn ?? 0n,
    cumulativeBorrowed: newCumulativeBorrowed,
    cumulativeRepaid: existingUR?.cumulativeRepaid ?? 0n,
    netSupplyPosition: (existingUR?.cumulativeSupplied ?? 0n) - (existingUR?.cumulativeWithdrawn ?? 0n),
    netDebtPosition: newNetDebt,
    positionCount: (existingUR?.positionCount ?? 0) + 1,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyBorrow(context, {
    chainId: event.chainId,
    asset: event.params.reserve,
    user: event.params.onBehalfOf,
    amount: event.params.amount,
    isFirstBorrow,
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
  });

  await upsertOnBorrow(context, {
    chainId: event.chainId,
    user: event.params.onBehalfOf,
    amount: event.params.amount,
    isNewReserveForUser,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// Repay — user closes debt (or aToken-self-repay)
// -----------------------------------------------------------------
Pool.Repay.handler(async ({ event, context }) => {
  const userReserveId = UserReserveId(event.chainId, event.params.reserve, event.params.user);
  const existingUR = await context.UserReserve.get(userReserveId);

  if (!existingUR) {
    context.log.warn(
      `Repay on unknown UserReserve ${userReserveId}; reserve event may have arrived out of order.`,
    );
    return;
  }

  const newCumulativeRepaid = existingUR.cumulativeRepaid + event.params.amount;
  context.UserReserve.set({
    ...existingUR,
    cumulativeRepaid: newCumulativeRepaid,
    netDebtPosition: existingUR.cumulativeBorrowed - newCumulativeRepaid,
    lastUpdatedTimestamp: BigInt(event.block.timestamp),
  });

  await applyRepay(context, {
    chainId: event.chainId,
    asset: event.params.reserve,
    amount: event.params.amount,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// LiquidationCall — the trickiest event in the vertical
// -----------------------------------------------------------------
//
// Affects TWO reserves (collateral + debt) and TWO users (victim +
// liquidator). The handler must update all four. See
// ENVIO_LIQUIDATION_HANDLER_REFERENCE.md for the prose walkthrough.
//
Pool.LiquidationCall.handler(async ({ event, context }) => {
  // 1. Persist the Liquidation entity (append-only).
  context.Liquidation.set({
    id: LiquidationId(event.chainId, BigInt(event.block.number), event.logIndex),
    chainId: event.chainId,
    collateralAsset: event.params.collateralAsset.toLowerCase(),
    debtAsset: event.params.debtAsset.toLowerCase(),
    user: event.params.user.toLowerCase(),
    liquidator: event.params.liquidator.toLowerCase(),
    debtToCover: event.params.debtToCover,
    liquidatedCollateralAmount: event.params.liquidatedCollateralAmount,
    receiveAToken: event.params.receiveAToken,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });

  // 2. Increment liquidation count on BOTH affected reserves. Aave's
  // LiquidationCall touches collateralAsset (collateral seized) and
  // debtAsset (debt repaid by liquidator) — both are affected.
  await applyLiquidationToReserve(context, {
    chainId: event.chainId,
    asset: event.params.collateralAsset,
    timestamp: BigInt(event.block.timestamp),
  });
  if (event.params.collateralAsset.toLowerCase() !== event.params.debtAsset.toLowerCase()) {
    await applyLiquidationToReserve(context, {
      chainId: event.chainId,
      asset: event.params.debtAsset,
      timestamp: BigInt(event.block.timestamp),
    });
  }

  // 3. Update both users (victim + liquidator).
  await upsertOnLiquidationAsBorrower(context, {
    chainId: event.chainId,
    user: event.params.user,
    timestamp: BigInt(event.block.timestamp),
  });
  await upsertOnLiquidationAsLiquidator(context, {
    chainId: event.chainId,
    user: event.params.liquidator,
    timestamp: BigInt(event.block.timestamp),
  });
});

// -----------------------------------------------------------------
// ReserveDataUpdated — interest rate + index update
// -----------------------------------------------------------------
Pool.ReserveDataUpdated.handler(async ({ event, context }) => {
  const reserveId = ReserveId(event.chainId, event.params.reserve);

  // Write the rate snapshot (append-only time series).
  context.ReserveRateSnapshot.set({
    id: RateSnapshotId(reserveId, BigInt(event.block.number)),
    reserve_id: reserveId,
    chainId: event.chainId,
    liquidityRate: event.params.liquidityRate,
    stableBorrowRate: event.params.stableBorrowRate,
    variableBorrowRate: event.params.variableBorrowRate,
    liquidityIndex: event.params.liquidityIndex,
    variableBorrowIndex: event.params.variableBorrowIndex,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
  });

  // Update the aggregator's "current" rate state.
  await applyRateUpdate(context, {
    chainId: event.chainId,
    asset: event.params.reserve,
    liquidityRate: event.params.liquidityRate,
    variableBorrowRate: event.params.variableBorrowRate,
    liquidityIndex: event.params.liquidityIndex,
    variableBorrowIndex: event.params.variableBorrowIndex,
    timestamp: BigInt(event.block.timestamp),
  });
});
