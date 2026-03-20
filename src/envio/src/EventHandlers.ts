/**
 * @file EventHandlers.ts
 * @description Main event handlers for Envio indexer — Mirror Protocol
 * @author Mirror Protocol Team
 *
 * Registers all 8 event handlers using Envio v2 registration API:
 * - BehavioralNFT: PatternMinted, PatternPerformanceUpdated, PatternDeactivated, Transfer
 * - DelegationRouter: DelegationCreated, DelegationRevoked, DelegationUpdated, TradeExecuted
 */

import { BehavioralNFT, DelegationRouter } from "../generated";

// ─── Performance tracking ───────────────────────────────────────────────────
// Tracks real handler processing times for the Envio metrics dashboard
let lastEventTimestamp = Date.now();
let eventCountWindow = 0;
let windowStart = Date.now();

function computePerformanceUpdates(processingTimeMs: number, existing: {
  averageProcessingTime: number;
  averageQueryLatency: number;
  peakEventsPerSecond: number;
  currentEventsPerSecond: number;
  eventsProcessed: bigint;
}) {
  const now = Date.now();
  eventCountWindow++;
  const windowElapsed = (now - windowStart) / 1000; // seconds

  // Reset window every 60 seconds
  if (windowElapsed > 60) {
    eventCountWindow = 1;
    windowStart = now;
  }

  const currentEps = windowElapsed > 0 ? Math.round(eventCountWindow / windowElapsed) : 0;
  const totalProcessed = Number(existing.eventsProcessed) + 1;

  // Running average: ((old_avg * (n-1)) + new_value) / n
  const newAvgProcessing = totalProcessed > 1
    ? Math.round(((existing.averageProcessingTime * (totalProcessed - 1)) + processingTimeMs) / totalProcessed)
    : processingTimeMs;

  // Query latency approximated from processing time (Envio adds ~2-5ms overhead)
  const queryLatency = Math.max(1, Math.round(processingTimeMs * 0.8 + 2));
  const newAvgLatency = totalProcessed > 1
    ? Math.round(((existing.averageQueryLatency * (totalProcessed - 1)) + queryLatency) / totalProcessed)
    : queryLatency;

  lastEventTimestamp = now;

  return {
    averageProcessingTime: newAvgProcessing,
    averageQueryLatency: newAvgLatency,
    peakEventsPerSecond: Math.max(existing.peakEventsPerSecond, currentEps),
    currentEventsPerSecond: currentEps,
  };
}

// ==========================================
// BehavioralNFT: PatternMinted
// ==========================================
BehavioralNFT.PatternMinted.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { tokenId, creator, patternType, patternData, timestamp } = event.params;
  const blockNumber = BigInt(event.block.number);
  const blockTimestamp = BigInt(event.block.timestamp);
  const txHash = event.transaction.hash;

  const ts = timestamp > 0n ? timestamp : blockTimestamp;

  // Decode pattern type
  const decodedType = patternType.toLowerCase().includes("momentum")
    ? "momentum"
    : patternType.toLowerCase().includes("arbitrage")
      ? "arbitrage"
      : patternType.toLowerCase().includes("mean") || patternType.toLowerCase().includes("reversion")
        ? "mean_reversion"
        : patternType.toLowerCase();

  // Create Pattern entity
  context.Pattern.set({
    id: tokenId.toString(),
    tokenId,
    creator_id: creator.toLowerCase(),
    owner: creator.toLowerCase(),
    patternType: decodedType,
    patternData,
    patternDataDecoded: undefined,
    createdAt: ts,
    createdAtBlock: blockNumber,
    mintTxHash: txHash,
    winRate: 0n,
    totalVolume: 0n,
    roi: 0n,
    isActive: true,
    deactivationReason: undefined,
    deactivatedAt: undefined,
    delegationCount: 0,
    totalEarnings: 0n,
    successfulExecutions: 0,
    failedExecutions: 0,
    lastUpdatedAt: ts,
    winRateRank: undefined,
    roiRank: undefined,
    volumeRank: undefined,
  });

  // Update or create Creator entity
  const creatorId = creator.toLowerCase();
  const existingCreator = await context.Creator.get(creatorId);

  if (!existingCreator) {
    context.Creator.set({
      id: creatorId,
      address: creator,
      totalPatterns: 1,
      activePatterns: 1,
      deactivatedPatterns: 0,
      totalVolume: 0n,
      averageWinRate: 0n,
      averageROI: 0n,
      totalEarnings: 0n,
      reputationScore: 5000,
      firstPatternAt: ts,
      lastPatternAt: ts,
      creatorRank: undefined,
    });
  } else {
    context.Creator.set({
      ...existingCreator,
      totalPatterns: existingCreator.totalPatterns + 1,
      activePatterns: existingCreator.activePatterns + 1,
      lastPatternAt: ts,
    });
  }

  // Update system metrics
  const isNewCreator = !existingCreator;
  const systemMetrics = await context.SystemMetrics.get("1");

  const processingTime = Date.now() - handlerStart;

  if (!systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, {
      averageProcessingTime: 0, averageQueryLatency: 0,
      peakEventsPerSecond: 0, currentEventsPerSecond: 0, eventsProcessed: 0n,
    });
    context.SystemMetrics.set({
      id: "1",
      totalPatterns: 1,
      activePatterns: 1,
      last24hPatterns: 1,
      last7dPatterns: 1,
      totalCreators: 1,
      activeCreators: 1,
      averageWinRate: 0n,
      medianWinRate: 0n,
      totalVolume: 0n,
      totalEarnings: 0n,
      totalDelegations: 0,
      activeDelegations: 0,
      totalDelegators: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      eventsProcessed: 1n,
      eventsLastHour: 0,
      ...perf,
      momentumPatterns: decodedType === "momentum" ? 1 : 0,
      arbitragePatterns: decodedType === "arbitrage" ? 1 : 0,
      meanReversionPatterns: decodedType === "mean_reversion" ? 1 : 0,
      otherPatterns: !["momentum", "arbitrage", "mean_reversion"].includes(decodedType) ? 1 : 0,
      lastPatternMintedAt: ts,
      lastPerformanceUpdateAt: 0n,
      lastUpdatedAt: ts,
    });
  } else {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      totalPatterns: systemMetrics.totalPatterns + 1,
      activePatterns: systemMetrics.activePatterns + 1,
      last24hPatterns: systemMetrics.last24hPatterns + 1,
      last7dPatterns: systemMetrics.last7dPatterns + 1,
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastPatternMintedAt: ts,
      lastUpdatedAt: ts,
      totalCreators: systemMetrics.totalCreators + (isNewCreator ? 1 : 0),
      activeCreators: systemMetrics.activeCreators + (isNewCreator ? 1 : 0),
      momentumPatterns: systemMetrics.momentumPatterns + (decodedType === "momentum" ? 1 : 0),
      arbitragePatterns: systemMetrics.arbitragePatterns + (decodedType === "arbitrage" ? 1 : 0),
      meanReversionPatterns: systemMetrics.meanReversionPatterns + (decodedType === "mean_reversion" ? 1 : 0),
      otherPatterns: systemMetrics.otherPatterns + (!["momentum", "arbitrage", "mean_reversion"].includes(decodedType) ? 1 : 0),
    });
  }

  context.log.info(`Pattern #${tokenId} minted by ${creator} (${decodedType})`);
});

// ==========================================
// BehavioralNFT: PatternPerformanceUpdated
// ==========================================
BehavioralNFT.PatternPerformanceUpdated.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { tokenId, winRate, totalVolume, roi } = event.params;
  const blockNumber = BigInt(event.block.number);
  const blockTimestamp = BigInt(event.block.timestamp);
  const txHash = event.transaction.hash;

  const pattern = await context.Pattern.get(tokenId.toString());

  if (!pattern) {
    context.log.warn(`Pattern #${tokenId} not found for performance update`);
    return;
  }

  // Calculate deltas
  const winRateDelta = winRate - pattern.winRate;
  const volumeDelta = totalVolume - pattern.totalVolume;
  const roiDelta = roi - pattern.roi;

  // Update pattern
  context.Pattern.set({
    ...pattern,
    winRate,
    totalVolume,
    roi,
    lastUpdatedAt: blockTimestamp,
  });

  // Create PerformanceUpdate entity for historical tracking
  const updateId = `${tokenId}-${blockTimestamp}`;
  context.PerformanceUpdate.set({
    id: updateId,
    pattern_id: tokenId.toString(),
    winRate,
    totalVolume,
    roi,
    timestamp: blockTimestamp,
    blockNumber,
    txHash,
    winRateDelta,
    volumeDelta,
    roiDelta,
  });

  // Update system metrics with performance tracking
  const processingTime = Date.now() - handlerStart;
  const systemMetrics = await context.SystemMetrics.get("1");
  if (systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      lastPerformanceUpdateAt: blockTimestamp,
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastUpdatedAt: blockTimestamp,
    });
  }

  context.log.info(`Pattern #${tokenId} performance updated: winRate=${winRate}, roi=${roi}`);
});

// ==========================================
// BehavioralNFT: PatternDeactivated
// ==========================================
BehavioralNFT.PatternDeactivated.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { tokenId, reason } = event.params;
  const blockTimestamp = BigInt(event.block.timestamp);

  const pattern = await context.Pattern.get(tokenId.toString());

  if (!pattern) {
    context.log.warn(`Pattern #${tokenId} not found for deactivation`);
    return;
  }

  // Update pattern
  context.Pattern.set({
    ...pattern,
    isActive: false,
    deactivationReason: reason,
    deactivatedAt: blockTimestamp,
    lastUpdatedAt: blockTimestamp,
  });

  // Update creator stats
  const creator = await context.Creator.get(pattern.creator_id);
  if (creator) {
    context.Creator.set({
      ...creator,
      activePatterns: Math.max(0, creator.activePatterns - 1),
      deactivatedPatterns: creator.deactivatedPatterns + 1,
    });
  }

  // Update system metrics with performance tracking
  const processingTime = Date.now() - handlerStart;
  const systemMetrics = await context.SystemMetrics.get("1");
  if (systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      activePatterns: Math.max(0, systemMetrics.activePatterns - 1),
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastUpdatedAt: blockTimestamp,
    });
  }

  context.log.info(`Pattern #${tokenId} deactivated: ${reason}`);
});

// ==========================================
// BehavioralNFT: Transfer
// ==========================================
BehavioralNFT.Transfer.handler(async ({ event, context }) => {
  const { from, to, tokenId } = event.params;

  // Skip mint events (handled by PatternMinted)
  if (from === "0x0000000000000000000000000000000000000000") return;
  // Skip burn events (handled by PatternDeactivated)
  if (to === "0x0000000000000000000000000000000000000000") return;

  const pattern = await context.Pattern.get(tokenId.toString());
  if (pattern) {
    context.Pattern.set({
      ...pattern,
      owner: to.toLowerCase(),
    });
    context.log.info(`Pattern #${tokenId} transferred: ${from} -> ${to}`);
  }
});

// ==========================================
// DelegationRouter: DelegationCreated
// ==========================================
DelegationRouter.DelegationCreated.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { delegationId, delegator, patternTokenId, percentageAllocation, smartAccountAddress, timestamp } = event.params;
  const blockNumber = BigInt(event.block.number);
  const blockTimestamp = BigInt(event.block.timestamp);
  const txHash = event.transaction.hash;

  const ts = timestamp > 0n ? timestamp : blockTimestamp;

  // Create Delegation entity
  context.Delegation.set({
    id: delegationId.toString(),
    delegationId,
    delegator: delegator.toLowerCase(),
    pattern_id: patternTokenId.toString(),
    patternTokenId,
    percentageAllocation,
    smartAccountAddress: smartAccountAddress.toLowerCase(),
    createdAt: ts,
    createdAtBlock: blockNumber,
    createdTxHash: txHash,
    isActive: true,
    revokedAt: undefined,
    revokedTxHash: undefined,
    lastUpdatedAt: ts,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalAmountTraded: 0n,
    totalEarnings: 0n,
    lastExecutionAt: undefined,
    winRate: 0,
    avgExecutionTime: 0,
    successRate: 0,
  });

  // Update Pattern delegation count
  const pattern = await context.Pattern.get(patternTokenId.toString());
  if (pattern) {
    context.Pattern.set({
      ...pattern,
      delegationCount: pattern.delegationCount + 1,
      lastUpdatedAt: ts,
    });
  }

  // Update or create Delegator entity
  const delegatorId = delegator.toLowerCase();
  const existingDelegator = await context.Delegator.get(delegatorId);

  if (!existingDelegator) {
    context.Delegator.set({
      id: delegatorId,
      address: delegator,
      totalDelegations: 1,
      activeDelegations: 1,
      revokedDelegations: 0,
      totalPatternsFollowed: 1,
      totalCapitalDelegated: 0n,
      totalEarnings: 0n,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageAllocation: Number(percentageAllocation),
      firstDelegationAt: ts,
      lastDelegationAt: ts,
      isActive: true,
      reputationScore: 5000,
    });
  } else {
    const totalAllocation =
      existingDelegator.averageAllocation * existingDelegator.totalDelegations +
      Number(percentageAllocation);
    const newTotal = existingDelegator.totalDelegations + 1;

    context.Delegator.set({
      ...existingDelegator,
      totalDelegations: newTotal,
      activeDelegations: existingDelegator.activeDelegations + 1,
      lastDelegationAt: ts,
      averageAllocation: Math.floor(totalAllocation / newTotal),
    });
  }

  // Update system metrics with performance tracking
  const processingTime = Date.now() - handlerStart;
  const isNewDelegator = !existingDelegator;
  const systemMetrics = await context.SystemMetrics.get("1");
  if (systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      totalDelegations: systemMetrics.totalDelegations + 1,
      activeDelegations: systemMetrics.activeDelegations + 1,
      totalDelegators: systemMetrics.totalDelegators + (isNewDelegator ? 1 : 0),
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastUpdatedAt: ts,
    });
  }

  context.log.info(`Delegation #${delegationId} created: ${delegator} -> Pattern #${patternTokenId}`);
});

// ==========================================
// DelegationRouter: DelegationRevoked
// ==========================================
DelegationRouter.DelegationRevoked.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { delegationId, delegator, patternTokenId, timestamp } = event.params;
  const blockTimestamp = BigInt(event.block.timestamp);
  const txHash = event.transaction.hash;

  const ts = timestamp > 0n ? timestamp : blockTimestamp;

  const delegation = await context.Delegation.get(delegationId.toString());
  if (!delegation) {
    context.log.warn(`Delegation #${delegationId} not found for revocation`);
    return;
  }

  context.Delegation.set({
    ...delegation,
    isActive: false,
    revokedAt: ts,
    revokedTxHash: txHash,
    lastUpdatedAt: ts,
  });

  // Update Pattern delegation count
  const pattern = await context.Pattern.get(patternTokenId.toString());
  if (pattern) {
    context.Pattern.set({
      ...pattern,
      delegationCount: Math.max(0, pattern.delegationCount - 1),
      lastUpdatedAt: ts,
    });
  }

  // Update Delegator entity
  const delegatorEntity = await context.Delegator.get(delegator.toLowerCase());
  if (delegatorEntity) {
    context.Delegator.set({
      ...delegatorEntity,
      activeDelegations: Math.max(0, delegatorEntity.activeDelegations - 1),
      revokedDelegations: delegatorEntity.revokedDelegations + 1,
    });
  }

  // Update system metrics with performance tracking
  const processingTime = Date.now() - handlerStart;
  const systemMetrics = await context.SystemMetrics.get("1");
  if (systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      activeDelegations: Math.max(0, systemMetrics.activeDelegations - 1),
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastUpdatedAt: ts,
    });
  }

  context.log.info(`Delegation #${delegationId} revoked`);
});

// ==========================================
// DelegationRouter: DelegationUpdated
// ==========================================
DelegationRouter.DelegationUpdated.handler(async ({ event, context }) => {
  const { delegationId, percentageAllocation, timestamp } = event.params;
  const blockTimestamp = BigInt(event.block.timestamp);

  const ts = timestamp > 0n ? timestamp : blockTimestamp;

  const delegation = await context.Delegation.get(delegationId.toString());
  if (!delegation) {
    context.log.warn(`Delegation #${delegationId} not found for update`);
    return;
  }

  context.Delegation.set({
    ...delegation,
    percentageAllocation,
    lastUpdatedAt: ts,
  });

  context.log.info(`Delegation #${delegationId} updated: allocation=${Number(percentageAllocation) / 100}%`);
});

// ==========================================
// DelegationRouter: TradeExecuted
// ==========================================
DelegationRouter.TradeExecuted.handler(async ({ event, context }) => {
  const handlerStart = Date.now();
  const { delegationId, patternTokenId, executor, token, amount, success, timestamp } = event.params;
  const blockNumber = BigInt(event.block.number);
  const blockTimestamp = BigInt(event.block.timestamp);
  const txHash = event.transaction.hash;

  const ts = timestamp > 0n ? timestamp : blockTimestamp;

  // Create TradeExecution entity
  const executionId = `${delegationId}-${ts}-${blockNumber}`;
  context.TradeExecution.set({
    id: executionId,
    delegation_id: delegationId.toString(),
    delegationId,
    pattern_id: patternTokenId.toString(),
    patternTokenId,
    executor: executor.toLowerCase(),
    token: token.toLowerCase(),
    amount,
    success,
    timestamp: ts,
    blockNumber,
    txHash,
  });

  // Update Delegation entity
  const delegation = await context.Delegation.get(delegationId.toString());
  if (delegation) {
    const newTotalExecutions = delegation.totalExecutions + 1;
    const newSuccessful = delegation.successfulExecutions + (success ? 1 : 0);
    const newFailed = delegation.failedExecutions + (success ? 0 : 1);

    context.Delegation.set({
      ...delegation,
      totalExecutions: newTotalExecutions,
      successfulExecutions: newSuccessful,
      failedExecutions: newFailed,
      totalAmountTraded: success ? delegation.totalAmountTraded + amount : delegation.totalAmountTraded,
      lastExecutionAt: ts,
      lastUpdatedAt: ts,
      successRate: Math.floor((newSuccessful / newTotalExecutions) * 10000),
    });
  }

  // Update Pattern entity
  const pattern = await context.Pattern.get(patternTokenId.toString());
  if (pattern) {
    context.Pattern.set({
      ...pattern,
      successfulExecutions: pattern.successfulExecutions + (success ? 1 : 0),
      failedExecutions: pattern.failedExecutions + (success ? 0 : 1),
      lastUpdatedAt: ts,
    });
  }

  // Update Delegator entity
  if (delegation) {
    const delegatorEntity = await context.Delegator.get(delegation.delegator);
    if (delegatorEntity) {
      context.Delegator.set({
        ...delegatorEntity,
        totalExecutions: delegatorEntity.totalExecutions + 1,
        successfulExecutions: delegatorEntity.successfulExecutions + (success ? 1 : 0),
        failedExecutions: delegatorEntity.failedExecutions + (success ? 0 : 1),
      });
    }
  }

  // Update system metrics with performance tracking
  const processingTime = Date.now() - handlerStart;
  const systemMetrics = await context.SystemMetrics.get("1");
  if (systemMetrics) {
    const perf = computePerformanceUpdates(processingTime, systemMetrics);
    context.SystemMetrics.set({
      ...systemMetrics,
      ...perf,
      totalExecutions: systemMetrics.totalExecutions + 1,
      successfulExecutions: systemMetrics.successfulExecutions + (success ? 1 : 0),
      failedExecutions: systemMetrics.failedExecutions + (success ? 0 : 1),
      totalVolume: success ? systemMetrics.totalVolume + amount : systemMetrics.totalVolume,
      eventsProcessed: systemMetrics.eventsProcessed + 1n,
      lastUpdatedAt: ts,
    });
  }

  context.log.info(`Trade executed on Delegation #${delegationId}: success=${success}, amount=${amount}`);
});
