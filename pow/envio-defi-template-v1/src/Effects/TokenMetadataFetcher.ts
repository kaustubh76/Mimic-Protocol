/**
 * TokenMetadataFetcher — the RPC body of the getTokenMetadata Effect.
 *
 * Lives in its own module so vitest can `vi.spyOn(TokenMetadataFetcherModule,
 * "fetchErc20Metadata")` and assert the Effect cache prevents duplicate RPC
 * calls. ESM module-resolution semantics mean a spy on the *importing*
 * module is what the consumer's runtime sees — see test/EffectCache.test.ts.
 *
 * Don't call this directly from handlers — go through
 * `context.effect(getTokenMetadata, ...)` so you get the cache + rate-limit
 * benefits.
 */

import { createPublicClient, http, parseAbi, type PublicClient } from "viem";
import { optimism, base } from "viem/chains";

const erc20Abi = parseAbi([
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

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

export async function fetchErc20Metadata(
  chainId: number,
  address: string,
): Promise<{ symbol: string; decimals: number }> {
  const client = getClient(chainId);
  if (!client) {
    return { symbol: "UNKNOWN", decimals: 18 };
  }
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "symbol",
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: "decimals",
      }),
    ]);
    return { symbol: symbol as string, decimals: Number(decimals) };
  } catch {
    // Sablier's `0`-alias optimisation: encode unknown tokens with a
    // sentinel and continue. The cache stores the sentinel so repeated
    // calls for the same broken token don't re-hit the RPC.
    return { symbol: "UNKNOWN", decimals: 18 };
  }
}
