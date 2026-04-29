/**
 * Constants — chain-keyed configuration + market-type taxonomy.
 *
 * Same multi-chain pattern as envio-defi-template-v1 (chain-keyed map,
 * no if/else branches in handlers). PM-specific addition: the
 * MarketCategory taxonomy is the intra-product expansion mechanism
 * documented in ENVIO_VERTICAL_PLAYBOOK.md §4. Adding a new category is
 * one enum value here + one entry in this file's category-string parser.
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

export const BASE: ChainConstants = {
  chainId: 8453,
  name: "base",
  rpcEnvVar: "ENVIO_BASE_RPC_URL",
};

export const CHAIN_CONFIG: Record<number, ChainConstants> = {
  137: POLYGON,
  8453: BASE,
};

/** Snapshot epoch interval in seconds. 60 = per-minute leaderboard refresh. */
export const LEADERBOARD_EPOCH_SECONDS = 60;

/**
 * Top-N leaderboard size. The leaderboard architecture is shape-agnostic
 * here — change this and the snapshot writer adapts. Production PM
 * leaderboards typically run N=100 (top traders) or N=1000 (full
 * paginated leaderboard).
 */
export const LEADERBOARD_TOP_N = 100;

/** Market category parser — extend by adding cases here + enum values in schema.graphql. */
export function parseMarketCategory(
  raw: string,
): "BINARY_GENERIC" | "POLITICS" | "SPORTS" | "CRYPTO_PRICES" | "CUSTOM" {
  const normalised = raw.toLowerCase().trim();
  if (normalised === "politics" || normalised === "election") return "POLITICS";
  if (normalised === "sports" || normalised === "sport") return "SPORTS";
  if (normalised === "crypto" || normalised === "crypto_prices") {
    return "CRYPTO_PRICES";
  }
  if (normalised === "" || normalised === "binary") return "BINARY_GENERIC";
  return "CUSTOM";
}

/** Entity id helpers. */
export const MarketId = (chainId: number, address: string): string =>
  `${chainId}-${address.toLowerCase()}`;

export const PositionId = (
  marketId: string,
  trader: string,
  outcomeIndex: number,
): string => `${marketId}-${trader.toLowerCase()}-${outcomeIndex}`;

export const UserId = (chainId: number, trader: string): string =>
  `${chainId}-${trader.toLowerCase()}`;

export const LeaderboardSnapshotId = (
  chainId: number,
  hourEpoch: bigint,
  rank: number,
): string => `${chainId}-${hourEpoch.toString()}-${rank}`;
