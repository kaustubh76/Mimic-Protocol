/**
 * Constants — chain-keyed config + entity-id helpers + RAY constant.
 *
 * Same multi-chain pattern as the DEX and perp templates. Adding chain #N
 * is a one-record addition to CHAIN_CONFIG plus a network entry in
 * config.yaml — automated by scripts/add-chain.ts.
 */

export type ChainConstants = {
  chainId: number;
  name: string;
  rpcEnvVar: string;
};

export const POLYGON: ChainConstants = {
  chainId: 137,
  name: "polygon",
  rpcEnvVar: "ENVIO_POLYGON_RPC_URL",
};

export const ARBITRUM: ChainConstants = {
  chainId: 42161,
  name: "arbitrum",
  rpcEnvVar: "ENVIO_ARBITRUM_RPC_URL",
};

export const BASE: ChainConstants = {
  chainId: 8453,
  name: "base",
  rpcEnvVar: "ENVIO_BASE_RPC_URL",
};

export const CHAIN_CONFIG: Record<number, ChainConstants> = {
  137: POLYGON,
  42161: ARBITRUM,
  8453: BASE,
};

/**
 * RAY = 1e27. Aave's fixed-point precision unit. Used to encode rates and
 * indices. Documented here so query-time consumers know how to scale.
 */
export const RAY: bigint = 10n ** 27n;

/** Entity id helpers — `${chainId}-${address}` convention shared across templates. */
export const ReserveId = (chainId: number, asset: string): string =>
  `${chainId}-${asset.toLowerCase()}`;

export const UserReserveId = (
  chainId: number,
  asset: string,
  user: string,
): string => `${chainId}-${asset.toLowerCase()}-${user.toLowerCase()}`;

export const UserAggregatorId = (chainId: number, user: string): string =>
  `${chainId}-${user.toLowerCase()}`;

/**
 * Liquidation id includes block + logIndex for global uniqueness — multiple
 * LiquidationCall events can fire at the same (chainId, user) tuple within
 * one block (cascading liquidations).
 */
export const LiquidationId = (
  chainId: number,
  blockNumber: bigint,
  logIndex: number,
): string => `${chainId}-${blockNumber.toString()}-${logIndex}`;

/**
 * Snapshot id pairs reserve with block number — one snapshot per
 * ReserveDataUpdated event, no epoch rounding (rate updates are sparse
 * enough that every update is a meaningful data point).
 */
export const RateSnapshotId = (reserveId: string, blockNumber: bigint): string =>
  `${reserveId}-${blockNumber.toString()}`;
