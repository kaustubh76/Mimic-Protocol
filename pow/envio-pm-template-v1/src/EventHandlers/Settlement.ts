/**
 * Settlement — the four-state machine.
 *
 * This is the canonical artifact named in §4 of ENVIO_VERTICAL_PLAYBOOK.md
 * as the trickiest event in the prediction-markets vertical:
 *
 *     OPEN → RESOLVING → SETTLED → CORRECTED
 *
 * Mishandled settlement = wrong leaderboard = product bug visible to end
 * users. This file is the documented reference for the pattern; see
 * ENVIO_SETTLEMENT_HANDLER_REFERENCE.md for the prose walkthrough.
 *
 * Three production guardrails are baked in:
 *
 *   1. Reorg-safe state. Each state transition records the block number
 *      it occurred at (lastResolutionBlock). On reorg, Envio's checkpoint
 *      deletion cleans the entity history; the next pass replays cleanly.
 *
 *   2. Race-safe corrections. The MarketCorrected handler verifies that
 *      lastResolutionBlock < event.block.number before applying the
 *      correction. If it isn't, the correction event is the indexer
 *      catching up to a chain reorg, and the prior SETTLED state is
 *      already gone.
 *
 *   3. Effect-cached oracle reads. A market with N winning positions
 *      triggers ONE oracle read, not N. See src/Effects/OracleRead.ts.
 */

import { Market } from "generated";
import { MarketId } from "../Constants";
import { getOracleResolution } from "../Effects/OracleRead";
import { applyResolution, applyCorrection } from "../Aggregators/MarketAggregator";

// -----------------------------------------------------------------
// State 1 → 2: OPEN → RESOLVING
//
// MarketLockedForResolution fires when the market deadline passes.
// No more positions can be taken; we're waiting on the oracle.
// -----------------------------------------------------------------
Market.MarketLockedForResolution.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const market = await context.Market.get(marketId);

  if (!market) {
    context.log.error(
      `MarketLockedForResolution on unknown market ${marketId}. MarketFactory handler may have failed.`,
    );
    return;
  }

  if (market.state !== "OPEN") {
    // Defensive — this shouldn't happen in practice. A re-emission of
    // MarketLockedForResolution after we've already moved past OPEN
    // means the chain re-ordered; let the reorg machinery deal with it.
    context.log.warn(
      `MarketLockedForResolution on market ${marketId} in state ${market.state}; skipping (reorg replay?).`,
    );
    return;
  }

  context.Market.set({
    ...market,
    state: "RESOLVING",
    lastResolutionBlock: BigInt(event.block.number),
  });
});

// -----------------------------------------------------------------
// State 2 → 3: RESOLVING → SETTLED
//
// OracleResolved fires when the oracle reports the winning outcome.
// We:
//   - update the Market entity with the winning outcome
//   - kick the MarketAggregator into payout-mode
//   - the per-position payout state is updated lazily on PayoutClaimed
// -----------------------------------------------------------------
Market.OracleResolved.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);

  // Preload-first: market entity + Effect-cached oracle read in parallel.
  // The oracle read returns from cache for every subsequent settlement on
  // this same resolution.
  const [market, oracle] = await Promise.all([
    context.Market.get(marketId),
    context.effect(getOracleResolution, {
      chainId: event.chainId,
      marketAddress: event.srcAddress,
      oracleResolutionId: event.params.oracleResolutionId,
    }),
  ]);

  if (!market) {
    context.log.error(`OracleResolved on unknown market ${marketId}.`);
    return;
  }

  // Allow OPEN → SETTLED directly for protocols that skip the
  // explicit lock event. Defensive guard: don't move backward.
  if (market.state === "SETTLED" || market.state === "CORRECTED") {
    context.log.warn(
      `OracleResolved on market ${marketId} already in state ${market.state}; skipping.`,
    );
    return;
  }

  // Solidity uint8 maps to bigint in generated bindings; cast to number
  // for schema fields typed as Int! (winningOutcome, previousWinningOutcome).
  // Outcome indexes are bounded by outcomeCount (small), so Number() is safe.
  const winningOutcomeNum = Number(event.params.winningOutcome);

  context.Market.set({
    ...market,
    state: "SETTLED",
    winningOutcome: winningOutcomeNum,
    oracleResolutionId: event.params.oracleResolutionId,
    resolvedAt: BigInt(event.params.resolvedAt),
    lastResolutionBlock: BigInt(event.block.number),
  });

  // Aggregator updates — open interest closes, payout pool tracked.
  await applyResolution(context, marketId, {
    winningOutcome: winningOutcomeNum,
    timestamp: BigInt(event.block.timestamp),
  });

  context.log.info(
    `Market ${marketId} SETTLED with outcome ${event.params.winningOutcome} (oracle ${oracle.confirmedOutcome}).`,
  );
});

// -----------------------------------------------------------------
// State 3 → 4: SETTLED → CORRECTED
//
// MarketCorrected fires when the oracle (or a dispute resolution)
// changes the winning outcome AFTER initial settlement. This is the
// race-prone state: a correction event arriving while the indexer is
// mid-batch on the original settlement.
//
// The guardrail: we check lastResolutionBlock < event.block.number.
// If the prior settlement landed at a block >= this correction's block,
// the chain is in a reorg and we skip the correction (the reorg will
// replay cleanly).
// -----------------------------------------------------------------
Market.MarketCorrected.handler(async ({ event, context }) => {
  const marketId = MarketId(event.chainId, event.srcAddress);
  const market = await context.Market.get(marketId);

  if (!market) {
    context.log.error(`MarketCorrected on unknown market ${marketId}.`);
    return;
  }

  if (market.state !== "SETTLED") {
    context.log.warn(
      `MarketCorrected on market ${marketId} in state ${market.state}; expected SETTLED. Skipping (reorg or out-of-order).`,
    );
    return;
  }

  // The race-safe guardrail.
  if (market.lastResolutionBlock >= BigInt(event.block.number)) {
    context.log.warn(
      `MarketCorrected on market ${marketId} at block ${event.block.number} but lastResolutionBlock is ${market.lastResolutionBlock}. Reorg suspected; skipping.`,
    );
    return;
  }

  const previousOutcomeNum = Number(event.params.previousWinningOutcome);
  const correctedOutcomeNum = Number(event.params.correctedWinningOutcome);

  context.Market.set({
    ...market,
    state: "CORRECTED",
    previousWinningOutcome: previousOutcomeNum,
    winningOutcome: correctedOutcomeNum,
    correctedAt: BigInt(event.params.correctedAt),
    lastResolutionBlock: BigInt(event.block.number),
  });

  // Aggregator: reverse the prior settlement, apply the corrected one.
  // The unsettlement-then-resettlement pattern is intentional — user-
  // facing leaderboards SHOULD update twice on a correction, so the
  // correction is visible to end users. See
  // ENVIO_SETTLEMENT_HANDLER_REFERENCE.md §2 (State 4).
  await applyCorrection(context, marketId, {
    previousWinningOutcome: previousOutcomeNum,
    correctedWinningOutcome: correctedOutcomeNum,
    timestamp: BigInt(event.block.timestamp),
  });

  context.log.info(
    `Market ${marketId} CORRECTED: ${event.params.previousWinningOutcome} → ${event.params.correctedWinningOutcome}.`,
  );
});
