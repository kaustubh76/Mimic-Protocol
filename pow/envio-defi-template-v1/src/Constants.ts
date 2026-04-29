/**
 * Constants — chain-keyed configuration.
 *
 * This is the multi-chain expansion pattern documented in
 * ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md and used in production at
 * velodrome-finance/indexer/src/Constants.ts (chain-keyed: `10:
 * OPTIMISM_CONSTANTS, 8453: BASE_CONSTANTS`). Adding chain #3 is a single-
 * record addition to the CHAIN_CONFIG map plus a network entry in config.yaml.
 *
 * Handlers read constants by `event.chainId` — never branch on chain id with
 * if/else chains, that's the failure mode this pattern prevents.
 */

export type ChainConstants = {
  chainId: number;
  name: string;
  factoryAddress: string;
  // Default fee in basis points (Velodrome V2 stable / volatile).
  defaultStableFeeBps: number;
  defaultVolatileFeeBps: number;
  // RPC URL is read from env so the same image runs in dev and prod.
  rpcEnvVar: string;
};

export const OPTIMISM: ChainConstants = {
  chainId: 10,
  name: "optimism",
  factoryAddress: "0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a",
  defaultStableFeeBps: 5,
  defaultVolatileFeeBps: 30,
  rpcEnvVar: "ENVIO_OPTIMISM_RPC_URL",
};

export const BASE: ChainConstants = {
  chainId: 8453,
  name: "base",
  factoryAddress: "0x420DD381b31aEf6683db6B902084cB0FFECe40Da",
  defaultStableFeeBps: 5,
  defaultVolatileFeeBps: 30,
  rpcEnvVar: "ENVIO_BASE_RPC_URL",
};

export const CHAIN_CONFIG: Record<number, ChainConstants> = {
  10: OPTIMISM,
  8453: BASE,
};

/** Snapshot epoch interval in seconds. 3600 = hourly. */
export const SNAPSHOT_INTERVAL_SECONDS = 3600;

/** Entity id helpers — the documented `${chainId}-${address}` convention. */
export const TokenId = (chainId: number, address: string): string =>
  `${chainId}-${address.toLowerCase()}`;

export const PoolId = (chainId: number, address: string): string =>
  `${chainId}-${address.toLowerCase()}`;

export const SnapshotId = (poolId: string, hourEpoch: bigint): string =>
  `${poolId}-${hourEpoch.toString()}`;
