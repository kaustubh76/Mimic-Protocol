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
 */

import { experimental_createEffect, S } from "envio";

/**
 * The Effect signature: input shape -> output shape.
 *
 * Inside the handler, you call:
 *   const meta = await context.effect(getTokenMetadata, { chainId, address });
 *
 * Envio will:
 *   1. Hash (chainId, address) and check the on-disk Effect cache.
 *   2. On miss, execute `handler` (which performs the RPC read).
 *   3. Cache the result for the next handler call with the same input.
 *
 * The cache file lives in the indexer's data directory and survives
 * indexer restarts — a fresh deploy doesn't refetch every token's metadata.
 */
export const getTokenMetadata = experimental_createEffect(
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
  },
  async ({ input, context }) => {
    // In a production indexer, this body performs an `eth_call` against the
    // ERC-20 contract via viem or web3. The pattern is shape-only here so
    // the template runs without RPC credentials in the codegen step.
    //
    // The reference implementation in velodrome-finance/indexer wraps the
    // RPC call in an RpcGateway with retry + fallback URLs (see
    // src/Effects/RpcGateway.ts in their repo). For a 60-min template,
    // a direct viem call is the right starting shape.
    context.log.debug(
      `Effect: fetching token metadata for ${input.address} on chain ${input.chainId}`,
    );

    // Stub return — real impl: viem multicall with `symbol()` + `decimals()`.
    // Replace this body with a viem call against `input.address` to ship.
    return {
      symbol: "UNKNOWN",
      decimals: 18,
    };
  },
);
