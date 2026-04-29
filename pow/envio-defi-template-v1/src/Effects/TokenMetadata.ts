/**
 * TokenMetadata — Effect-API-wrapped token metadata reader.
 *
 * This is the canonical Effect API pattern documented in
 * ENVIO_EFFECT_API_PATTERN.md. Effects deduplicate identical reads inside a
 * batch and cache results across batches on disk. Two contracts that share
 * a token will trigger one ERC-20 RPC call, not two.
 *
 * Production reference: velodrome-finance/indexer/src/Effects/Token.ts
 * Sablier's `0`-alias optimisation for unknown metadata is a one-line
 * extension of this pattern; documented in ENVIO_EFFECT_API_PATTERN.md §2.4.
 *
 * The RPC body lives in ./TokenMetadataFetcher so vitest can spy on it
 * via the module namespace — see test/EffectCache.test.ts.
 */

import { createEffect, S } from "envio";
import * as TokenMetadataFetcher from "./TokenMetadataFetcher";

/**
 * The Effect signature: input shape -> output shape.
 *
 * Inside a handler, you call:
 *   const meta = await context.effect(getTokenMetadata, { chainId, address });
 *
 * Envio will:
 *   1. Hash (chainId, address) and check the on-disk Effect cache.
 *   2. On miss, execute `handler` (which performs the RPC read).
 *   3. Cache the result for the next handler call with the same input.
 *
 * The cache file lives in the indexer's data directory and survives indexer
 * restarts — a fresh deploy doesn't refetch every token's metadata.
 */
export const getTokenMetadata = createEffect(
  {
    name: "getTokenMetadata",
    input: {
      chainId: S.number,
      address: S.string,
    },
    output: {
      symbol: S.string,
      decimals: S.number,
    },
    cache: true,
    // Rate-limit RPC calls to 50/sec across all chains. Tunable per provider
    // tier (free public RPCs typically rate-limit at 25/sec; paid endpoints
    // happily handle 1000+/sec).
    rateLimit: { calls: 50, per: "second" },
  },
  async ({ input, context }) => {
    context.log.debug(
      `getTokenMetadata: Effect dispatch for ${input.address} on chain ${input.chainId}`,
    );
    // Resolve through the module namespace so vitest can spy on
    // `TokenMetadataFetcher.fetchErc20Metadata`. Direct named-import calls
    // bypass the spy due to ESM closure semantics.
    return TokenMetadataFetcher.fetchErc20Metadata(input.chainId, input.address);
  },
);
