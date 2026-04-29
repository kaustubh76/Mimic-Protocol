/**
 * MarketFactory event handler — dynamic market registration.
 *
 * Same two-stage pattern as the DEX and PM templates:
 *   1. contractRegister tells Envio "this address is a Market contract"
 *   2. handler creates the PerpMarket entity + initialises the PerpAggregator
 *
 * Adapted from gmx-io/gmx-synthetics/contracts/event/EventEmitter.sol —
 * MarketCreated naming and field semantics match GMX v2.
 */

import { MarketFactory } from "generated";
import { CHAIN_CONFIG, MarketId } from "../Constants";
import { createPerpAggregator } from "../Aggregators/PerpAggregator";

MarketFactory.MarketCreated.contractRegister(({ event, context }) => {
  context.addMarket(event.params.market);
});

MarketFactory.MarketCreated.handler(async ({ event, context }) => {
  const { chainId } = event;
  const { market, salt, indexToken, longToken, shortToken } = event.params;

  const id = MarketId(chainId, market);
  context.PerpMarket.set({
    id,
    chainId,
    address: market.toLowerCase(),
    salt,
    indexToken: indexToken.toLowerCase(),
    longToken: longToken.toLowerCase(),
    shortToken: shortToken.toLowerCase(),
    createdAtBlock: BigInt(event.block.number),
    createdAtTimestamp: BigInt(event.block.timestamp),
  });

  createPerpAggregator(context, {
    chainId,
    marketAddress: market,
    timestamp: BigInt(event.block.timestamp),
  });

  if (!CHAIN_CONFIG[chainId]) {
    context.log.warn(
      `MarketCreated on unknown chain ${chainId}. Add chain constants to src/Constants.ts.`,
    );
  }
});
