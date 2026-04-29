/**
 * MarketFactory event handler — dynamic market registration.
 *
 * Same two-stage pattern as the DeFi template's PoolFactory (see
 * envio-defi-template-v1/src/EventHandlers/PoolFactory.ts):
 *   1. contractRegister tells Envio "this address is a Market contract"
 *   2. handler creates the Market entity in OPEN state + initialises
 *      the MarketAggregator
 */

import { MarketFactory } from "generated";
import { CHAIN_CONFIG, MarketId, parseMarketCategory } from "../Constants";
import { createMarketAggregator } from "../Aggregators/MarketAggregator";

MarketFactory.MarketCreated.contractRegister(({ event, context }) => {
  context.addMarket(event.params.market);
});

MarketFactory.MarketCreated.handler(async ({ event, context }) => {
  const { chainId } = event;
  const { market, questionId, endTime, outcomeCount, category } = event.params;

  const marketId = MarketId(chainId, market);

  context.Market.set({
    id: marketId,
    chainId,
    address: market.toLowerCase(),
    questionId,
    endTime: BigInt(endTime),
    outcomeCount: Number(outcomeCount),
    category: parseMarketCategory(category),
    state: "OPEN",
    winningOutcome: undefined,
    oracleResolutionId: undefined,
    resolvedAt: undefined,
    correctedAt: undefined,
    previousWinningOutcome: undefined,
    lastResolutionBlock: 0n,
    createdAtBlock: BigInt(event.block.number),
    createdAtTimestamp: BigInt(event.block.timestamp),
  });

  createMarketAggregator(context, {
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
