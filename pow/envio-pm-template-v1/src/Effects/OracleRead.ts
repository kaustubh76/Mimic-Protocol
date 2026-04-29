/**
 * OracleRead — Effect-API-wrapped oracle read.
 *
 * For prediction markets, the oracle read on settlement is the most
 * expensive single RPC call in the indexer. A market with 10,000 winning
 * positions naively triggers 10,000 oracle reads (one per holder). The
 * Effect API pattern reduces this to ONE: the first read populates the
 * cache, the next 9,999 hit the cache.
 *
 * Key insight: cache key is `(chainId, marketAddress, oracleResolutionId)`.
 * Two settlements at the same market with the same resolution id are the
 * same read; two settlements with different resolution ids (i.e. a
 * correction) are different reads. The cache key naturally separates
 * pre-correction and post-correction state.
 *
 * See ENVIO_EFFECT_API_PATTERN.md for the canonical pattern.
 * See velodrome-finance/indexer/src/PriceOracle.ts for the production-shape
 * reference.
 */

import { experimental_createEffect, S } from "envio";

export const getOracleResolution = experimental_createEffect(
  {
    name: "getOracleResolution",
    input: {
      chainId: S.number,
      marketAddress: S.string,
      oracleResolutionId: S.string,
    },
    output: {
      // The disputable window for this resolution. Used by the correction
      // handler to decide whether a late MarketCorrected event is plausible
      // or indicates indexer state corruption.
      disputableUntil: S.bigint,
      // Outcome confirmed by the oracle. May differ from
      // event.params.winningOutcome if the chain saw the OracleResolved
      // event before the oracle's full disputable window expired.
      confirmedOutcome: S.number,
    },
    cache: true,
  },
  async ({ input, context }) => {
    context.log.debug(
      `Effect: oracle read for market ${input.marketAddress} resolution ${input.oracleResolutionId} on chain ${input.chainId}`,
    );

    // Real implementation: viem call against the oracle contract for the
    // market at `input.marketAddress`. Replace this stub with a viem call
    // that reads the resolution metadata from the oracle contract (e.g.
    // UMA's optimistic oracle for Polymarket).
    return {
      disputableUntil: 0n,
      confirmedOutcome: 0,
    };
  },
);
