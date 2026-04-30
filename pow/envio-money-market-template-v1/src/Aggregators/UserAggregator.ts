/**
 * UserAggregator — per-user cross-reserve state.
 *
 * One entity per (chainId, user) tuple. Source for "top suppliers / top
 * borrowers / most-liquidated users" leaderboards. Also tracks how many
 * distinct reserves a user has touched.
 *
 * Same upsert pattern as the perp template's PositionAggregator — the
 * UserAggregator is created on first event, mutated incrementally on
 * subsequent events. No factory event in Aave; first sighting creates.
 */

import type { handlerContext, UserAggregator } from "generated";
import { UserAggregatorId } from "../Constants";

function freshUser(args: {
  chainId: number;
  user: string;
  timestamp: bigint;
}): UserAggregator {
  return {
    id: UserAggregatorId(args.chainId, args.user),
    chainId: args.chainId,
    user: args.user.toLowerCase(),
    reservesParticipated: 0,
    totalSuppliedAcrossReserves: 0n,
    totalBorrowedAcrossReserves: 0n,
    liquidationsAsBorrower: 0,
    liquidationsAsLiquidator: 0,
    lastActiveTimestamp: args.timestamp,
  };
}

export async function upsertOnSupply(
  context: handlerContext,
  args: {
    chainId: number;
    user: string;
    amount: bigint;
    isNewReserveForUser: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const id = UserAggregatorId(args.chainId, args.user);
  const existing = await context.UserAggregator.get(id);
  const u = existing ?? freshUser({ chainId: args.chainId, user: args.user, timestamp: args.timestamp });
  context.UserAggregator.set({
    ...u,
    totalSuppliedAcrossReserves: u.totalSuppliedAcrossReserves + args.amount,
    reservesParticipated: u.reservesParticipated + (args.isNewReserveForUser ? 1 : 0),
    lastActiveTimestamp: args.timestamp,
  });
}

export async function upsertOnBorrow(
  context: handlerContext,
  args: {
    chainId: number;
    user: string;
    amount: bigint;
    isNewReserveForUser: boolean;
    timestamp: bigint;
  },
): Promise<void> {
  const id = UserAggregatorId(args.chainId, args.user);
  const existing = await context.UserAggregator.get(id);
  const u = existing ?? freshUser({ chainId: args.chainId, user: args.user, timestamp: args.timestamp });
  context.UserAggregator.set({
    ...u,
    totalBorrowedAcrossReserves: u.totalBorrowedAcrossReserves + args.amount,
    reservesParticipated: u.reservesParticipated + (args.isNewReserveForUser ? 1 : 0),
    lastActiveTimestamp: args.timestamp,
  });
}

export async function upsertOnLiquidationAsBorrower(
  context: handlerContext,
  args: { chainId: number; user: string; timestamp: bigint },
): Promise<void> {
  const id = UserAggregatorId(args.chainId, args.user);
  const existing = await context.UserAggregator.get(id);
  const u = existing ?? freshUser({ chainId: args.chainId, user: args.user, timestamp: args.timestamp });
  context.UserAggregator.set({
    ...u,
    liquidationsAsBorrower: u.liquidationsAsBorrower + 1,
    lastActiveTimestamp: args.timestamp,
  });
}

export async function upsertOnLiquidationAsLiquidator(
  context: handlerContext,
  args: { chainId: number; user: string; timestamp: bigint },
): Promise<void> {
  const id = UserAggregatorId(args.chainId, args.user);
  const existing = await context.UserAggregator.get(id);
  const u = existing ?? freshUser({ chainId: args.chainId, user: args.user, timestamp: args.timestamp });
  context.UserAggregator.set({
    ...u,
    liquidationsAsLiquidator: u.liquidationsAsLiquidator + 1,
    lastActiveTimestamp: args.timestamp,
  });
}
