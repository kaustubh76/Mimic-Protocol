/**
 * Constants — chain-keyed config + entity-id helpers.
 *
 * Same multi-chain pattern as the DEX and PM templates. Adding chain #N is
 * a one-record addition to CHAIN_CONFIG plus a network entry in config.yaml.
 * The scripts/add-chain.ts CLI (Day 3 of the hardening pass) automates this.
 */

export type ChainConstants = {
  chainId: number;
  name: string;
  rpcEnvVar: string;
};

export const ARBITRUM: ChainConstants = {
  chainId: 42161,
  name: "arbitrum",
  rpcEnvVar: "ENVIO_ARBITRUM_RPC_URL",
};

export const CHAIN_CONFIG: Record<number, ChainConstants> = {
  42161: ARBITRUM,
};

/** Funding snapshot epoch interval. Production GMX-v2 funding updates
 *  roughly every hour; we snapshot per-update so the indexer captures
 *  every change without dropping any. */
export const FUNDING_SNAPSHOT_INTERVAL_SECONDS = 3600;

/** Entity id helpers — match the conventions in the DEX and PM templates. */
export const MarketId = (chainId: number, address: string): string =>
  `${chainId}-${address.toLowerCase()}`;

/** Position is keyed globally by its bytes32 positionKey (GMX v2 convention).
 *  Strip the 0x prefix to keep the id readable in URLs / logs. */
export const PositionEntityId = (positionKey: string): string =>
  positionKey.toLowerCase();

export const LiquidationId = (
  positionKey: string,
  blockNumber: bigint,
  logIndex: number,
): string => `${positionKey.toLowerCase()}-${blockNumber.toString()}-${logIndex}`;

export const PositionAggregatorId = (chainId: number, account: string): string =>
  `${chainId}-${account.toLowerCase()}`;

export const FundingSnapshotId = (
  marketId: string,
  isLong: boolean,
  updatedAt: bigint,
): string => `${marketId}-${isLong ? "long" : "short"}-${updatedAt.toString()}`;
