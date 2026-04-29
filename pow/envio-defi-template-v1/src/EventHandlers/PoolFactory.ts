/**
 * PoolFactory event handler.
 *
 * The two-stage shape below — `contractRegister` followed by `handler` — is
 * the dynamic contract registration pattern documented in
 * ENVIO_INDEXER_TEARDOWN.md and used in production at
 * velodrome-finance/indexer/src/EventHandlers/PoolFactory.ts.
 *
 * 1. contractRegister: tells Envio "this address is a Pool contract, start
 *    indexing its events from this block forward". The runtime registration
 *    is what lets us leave `address: []` for the Pool contract in
 *    config.yaml — pools are deployed continuously, hardcoding addresses is
 *    the failure mode this pattern prevents.
 *
 * 2. handler: writes the Pool + Token entities, kicks off Effect-wrapped
 *    token metadata reads, and creates the matching PoolAggregator entity
 *    so subsequent Swap/Mint/Burn events have a target to write into.
 */

import { PoolFactory } from "generated";
import { CHAIN_CONFIG, PoolId, TokenId } from "../Constants";
import { getTokenMetadata } from "../Effects/TokenMetadata";
import { createPoolAggregator } from "../Aggregators/PoolAggregator";

// Stage 1 — dynamic contract registration. Runs first, BEFORE handler bodies
// fire, so by the time the next block's Pool.Swap event arrives, Envio
// already knows to index it. This is what makes "add chain #2" a config
// change rather than a code change.
PoolFactory.PoolCreated.contractRegister(({ event, context }) => {
  context.addPool(event.params.pool);
});

PoolFactory.PoolCreated.handler(async ({ event, context }) => {
  const { chainId } = event;
  const { token0, token1, stable, pool } = event.params;

  // -----------------------------------------------------------------
  // Preload-first pattern: dispatch every read in parallel, await as a
  // batch, then mutate. See ENVIO_EFFECT_API_PATTERN.md §2.1.
  //
  // Dispatching the four reads in parallel (rather than awaiting each in
  // sequence) is the difference between ~150ms and ~600ms per
  // PoolCreated event under typical RPC latency.
  // -----------------------------------------------------------------
  const [existingToken0, existingToken1, meta0, meta1] = await Promise.all([
    context.Token.get(TokenId(chainId, token0)),
    context.Token.get(TokenId(chainId, token1)),
    context.effect(getTokenMetadata, { chainId, address: token0 }),
    context.effect(getTokenMetadata, { chainId, address: token1 }),
  ]);

  // Token entities are created lazily — only when first encountered.
  // The Effect cache means meta0/meta1 are free on the second pool that
  // uses the same token.
  if (!existingToken0) {
    context.Token.set({
      id: TokenId(chainId, token0),
      chainId,
      address: token0.toLowerCase(),
      symbol: meta0.symbol,
      decimals: meta0.decimals,
    });
  }
  if (!existingToken1) {
    context.Token.set({
      id: TokenId(chainId, token1),
      chainId,
      address: token1.toLowerCase(),
      symbol: meta1.symbol,
      decimals: meta1.decimals,
    });
  }

  // Pool entity — raw event data plus the chain-keyed factory address.
  const poolId = PoolId(chainId, pool);
  context.Pool.set({
    id: poolId,
    chainId,
    address: pool.toLowerCase(),
    token0_id: TokenId(chainId, token0),
    token1_id: TokenId(chainId, token1),
    isStable: stable,
    factoryAddress: event.srcAddress.toLowerCase(),
    createdAtBlock: BigInt(event.block.number),
    createdAtTimestamp: BigInt(event.block.timestamp),
  });

  // PoolAggregator initialised here. Subsequent Pool.Swap / Pool.Mint /
  // Pool.Burn handlers update it via the Aggregator helper functions.
  // The Aggregator-as-separate-entity pattern is what lets Mint+Burn+Swap
  // all contribute without race conditions; documented in
  // ENVIO_INDEXER_TEARDOWN.md.
  createPoolAggregator(context, {
    chainId,
    poolAddress: pool,
    timestamp: BigInt(event.block.timestamp),
  });

  // Sanity check on chain config — alerts the user if they added a network
  // to config.yaml but forgot to add chain constants. This is the
  // failure-mode-as-friendly-error pattern.
  if (!CHAIN_CONFIG[chainId]) {
    context.log.warn(
      `PoolCreated on unknown chain ${chainId}. Add chain constants to src/Constants.ts. See ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md.`,
    );
  }
});
