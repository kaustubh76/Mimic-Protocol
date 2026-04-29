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

import { createEffect, S } from "envio";
import { createPublicClient, http, parseAbi, type PublicClient } from "viem";
import { optimism, base } from "viem/chains";

// Minimal ERC-20 ABI for the two reads we care about. parseAbi is viem's
// human-readable ABI parser — same hashes as the canonical JSON ABI but
// drastically less code.
const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

// One viem client per supported chain. Created lazily on first use and
// memoised; the Envio runtime keeps the indexer process long-lived, so
// client construction is amortised across the entire indexing session.
//
// The Map is typed as `PublicClient` (the unparameterised base type) so
// instantiations for Optimism and Base — which produce structurally
// different generic types — can coexist. We only call .readContract() on
// these, which is on the base type, so this widening is sound.
const _clientCache = new Map<number, PublicClient>();

function getClient(chainId: number): PublicClient | undefined {
  const cached = _clientCache.get(chainId);
  if (cached) return cached;

  let client: PublicClient | undefined;
  if (chainId === 10) {
    client = createPublicClient({
      chain: optimism,
      transport: http(process.env.ENVIO_OPTIMISM_RPC_URL),
    }) as PublicClient;
  } else if (chainId === 8453) {
    client = createPublicClient({
      chain: base,
      transport: http(process.env.ENVIO_BASE_RPC_URL),
    }) as PublicClient;
  }
  if (client) _clientCache.set(chainId, client);
  return client;
}

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
    const client = getClient(input.chainId);

    if (!client) {
      // Chain not configured — surface a debug log and fall back to safe
      // defaults rather than failing the handler. The defaults match
      // Sablier's `0`-alias pattern: unknown metadata encoded as a known
      // sentinel ("UNKNOWN", 18 decimals) that downstream entities can
      // detect and special-case if needed.
      context.log.debug(
        `getTokenMetadata: no viem client configured for chain ${input.chainId}; returning fallback metadata.`,
      );
      return { symbol: "UNKNOWN", decimals: 18 };
    }

    try {
      // Parallel multicall-style reads. viem batches these automatically
      // when the underlying transport supports it.
      const [symbol, decimals] = await Promise.all([
        client.readContract({
          address: input.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        client.readContract({
          address: input.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

      return {
        symbol: symbol as string,
        decimals: Number(decimals),
      };
    } catch (err) {
      // Some tokens don't implement symbol() (notably MKR, which returns a
      // bytes32 instead of a string), or are deployed at addresses that
      // aren't valid ERC-20s (proxy contracts mid-upgrade, etc). Sablier's
      // `0`-alias optimisation handles this: encode unknown tokens with a
      // sentinel value and continue. The cache stores the sentinel so the
      // next handler doesn't re-hit the RPC for the same broken token.
      context.log.debug(
        `getTokenMetadata: RPC read failed for ${input.address} on chain ${input.chainId}: ${err instanceof Error ? err.message : String(err)}. Returning fallback.`,
      );
      return { symbol: "UNKNOWN", decimals: 18 };
    }
  },
);
