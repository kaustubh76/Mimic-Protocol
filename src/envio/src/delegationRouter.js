/**
 * @file delegationRouter.ts
 * @description Event handlers for DelegationRouter contract
 * @author Mirror Protocol Team
 *
 * KEY FEATURES:
 * - Real-time delegation tracking
 * - Pattern popularity metrics
 * - Delegator statistics
 * - Execution performance tracking
 * - Sub-10ms handler execution
 *
 * ENVIO INTEGRATION:
 * - Processes delegation lifecycle events
 * - Tracks pattern performance via delegations
 * - Aggregates delegator statistics
 * - Monitors execution success rates
 *
 * PERFORMANCE:
 * - Target: <10ms handler execution
 * - Optimized database writes
 * - Efficient metric updates
 */
import { Logger } from './utils/logger.js';
import { MetricsCollector } from './utils/metrics.js';
const logger = Logger.create('DelegationRouter');
/**
 * Handler: DelegationCreated event
 *
 * Processes new delegation creation
 *
 * @param event - DelegationCreated event data
 * @param context - Database context
 *
 * Requirements:
 * - Create Delegation entity
 * - Update Pattern delegation count
 * - Create or update Delegator entity
 * - Update system metrics
 *
 * Performance Target: <10ms execution time
 */
export async function handleDelegationCreated(event, context) {
    const timer = MetricsCollector.startTimer('handler_delegation_created');
    try {
        const { delegationId, delegator, patternTokenId, percentageAllocation, smartAccountAddress, timestamp, blockNumber, transactionHash, } = event;
        logger.info('🤝 Processing DelegationCreated event', {
            delegationId: delegationId.toString(),
            delegator,
            patternTokenId: patternTokenId.toString(),
            allocation: percentageAllocation.toString(),
        });
        // Create Delegation entity
        const delegationEntity = {
            id: delegationId.toString(),
            delegationId,
            delegator: delegator.toLowerCase(),
            pattern: patternTokenId.toString(),
            patternTokenId,
            percentageAllocation,
            smartAccountAddress: smartAccountAddress.toLowerCase(),
            createdAt: timestamp,
            createdAtBlock: blockNumber,
            createdTxHash: transactionHash,
            isActive: true,
            revokedAt: null,
            revokedTxHash: null,
            lastUpdatedAt: timestamp,
            // Execution statistics
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            totalAmountTraded: 0n,
            totalEarnings: 0n,
            lastExecutionAt: null,
            // Performance metrics
            winRate: 0,
            avgExecutionTime: 0,
            successRate: 0,
        };
        await context.Delegation.set(delegationEntity);
        logger.debug('✅ Delegation entity created', {
            delegationId: delegationId.toString(),
        });
        // Update Pattern entity
        const pattern = await context.Pattern.get(patternTokenId.toString());
        if (pattern) {
            pattern.delegationCount += 1;
            pattern.lastUpdatedAt = timestamp;
            await context.Pattern.set(pattern);
            logger.debug('✅ Pattern delegation count updated', {
                patternId: patternTokenId.toString(),
                delegationCount: pattern.delegationCount,
            });
        }
        else {
            logger.warn('⚠️ Pattern not found for delegation', {
                patternId: patternTokenId.toString(),
            });
        }
        // Update or create Delegator entity
        const delegatorId = delegator.toLowerCase();
        let delegatorEntity = await context.Delegator.get(delegatorId);
        if (!delegatorEntity) {
            // New delegator
            delegatorEntity = {
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
                firstDelegationAt: timestamp,
                lastDelegationAt: timestamp,
                isActive: true,
                reputationScore: 5000, // Start at 50% (0-10000 scale)
            };
        }
        else {
            // Existing delegator - increment counters
            delegatorEntity.totalDelegations += 1;
            delegatorEntity.activeDelegations += 1;
            delegatorEntity.lastDelegationAt = timestamp;
            // Recalculate average allocation
            const totalAllocation = delegatorEntity.averageAllocation * (delegatorEntity.totalDelegations - 1) +
                Number(percentageAllocation);
            delegatorEntity.averageAllocation = Math.floor(totalAllocation / delegatorEntity.totalDelegations);
        }
        await context.Delegator.set(delegatorEntity);
        logger.debug('✅ Delegator entity updated', {
            delegator: delegatorId,
            totalDelegations: delegatorEntity.totalDelegations,
        });
        // Update system metrics
        let systemMetrics = await context.SystemMetrics.get('1');
        if (systemMetrics) {
            systemMetrics.totalDelegations = (systemMetrics.totalDelegations || 0) + 1;
            systemMetrics.activeDelegations = (systemMetrics.activeDelegations || 0) + 1;
            systemMetrics.totalDelegators = (systemMetrics.totalDelegators || 0) + (delegatorEntity.totalDelegations === 1 ? 1 : 0);
            systemMetrics.eventsProcessed += 1n;
            systemMetrics.lastUpdatedAt = timestamp;
            await context.SystemMetrics.set(systemMetrics);
        }
        // Record performance metrics
        MetricsCollector.incrementCounter('delegations_created_total');
        MetricsCollector.setGauge('active_delegations', systemMetrics?.activeDelegations || 0);
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `DelegationCreated handler for #${delegationId}`);
        logger.info(`✅ Delegation #${delegationId} created`, {
            delegationId: delegationId.toString(),
            delegator,
            patternId: patternTokenId.toString(),
            allocation: `${Number(percentageAllocation) / 100}%`,
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in DelegationCreated handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'DelegationCreated',
        });
        throw error;
    }
}
/**
 * Handler: DelegationRevoked event
 *
 * Processes delegation revocation
 *
 * @param event - DelegationRevoked event data
 * @param context - Database context
 *
 * Performance Target: <10ms execution time
 */
export async function handleDelegationRevoked(event, context) {
    const timer = MetricsCollector.startTimer('handler_delegation_revoked');
    try {
        const { delegationId, delegator, patternTokenId, timestamp, transactionHash } = event;
        logger.info('🔴 Processing DelegationRevoked event', {
            delegationId: delegationId.toString(),
            delegator,
        });
        // Get and update delegation
        const delegation = await context.Delegation.get(delegationId.toString());
        if (!delegation) {
            logger.warn('⚠️ Delegation not found for revocation', {
                delegationId: delegationId.toString(),
            });
            timer.stop();
            return;
        }
        delegation.isActive = false;
        delegation.revokedAt = timestamp;
        delegation.revokedTxHash = transactionHash;
        delegation.lastUpdatedAt = timestamp;
        await context.Delegation.set(delegation);
        // Update Pattern entity
        const pattern = await context.Pattern.get(patternTokenId.toString());
        if (pattern) {
            pattern.delegationCount = Math.max(0, pattern.delegationCount - 1);
            pattern.lastUpdatedAt = timestamp;
            await context.Pattern.set(pattern);
        }
        // Update Delegator entity
        const delegatorEntity = await context.Delegator.get(delegator.toLowerCase());
        if (delegatorEntity) {
            delegatorEntity.activeDelegations = Math.max(0, delegatorEntity.activeDelegations - 1);
            delegatorEntity.revokedDelegations += 1;
            await context.Delegator.set(delegatorEntity);
        }
        // Update system metrics
        const systemMetrics = await context.SystemMetrics.get('1');
        if (systemMetrics) {
            systemMetrics.activeDelegations = Math.max(0, (systemMetrics.activeDelegations || 1) - 1);
            systemMetrics.eventsProcessed += 1n;
            await context.SystemMetrics.set(systemMetrics);
        }
        // Record metrics
        MetricsCollector.incrementCounter('delegations_revoked_total');
        MetricsCollector.setGauge('active_delegations', systemMetrics?.activeDelegations || 0);
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `DelegationRevoked handler for #${delegationId}`);
        logger.info(`✅ Delegation #${delegationId} revoked`, {
            delegationId: delegationId.toString(),
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in DelegationRevoked handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'DelegationRevoked',
        });
        throw error;
    }
}
/**
 * Handler: DelegationUpdated event
 *
 * Processes delegation permission/allocation updates
 *
 * @param event - DelegationUpdated event data
 * @param context - Database context
 *
 * Performance Target: <10ms execution time
 */
export async function handleDelegationUpdated(event, context) {
    const timer = MetricsCollector.startTimer('handler_delegation_updated');
    try {
        const { delegationId, percentageAllocation, timestamp } = event;
        logger.info('📝 Processing DelegationUpdated event', {
            delegationId: delegationId.toString(),
            newAllocation: percentageAllocation.toString(),
        });
        // Get and update delegation
        const delegation = await context.Delegation.get(delegationId.toString());
        if (!delegation) {
            logger.warn('⚠️ Delegation not found for update', {
                delegationId: delegationId.toString(),
            });
            timer.stop();
            return;
        }
        const oldAllocation = delegation.percentageAllocation;
        delegation.percentageAllocation = percentageAllocation;
        delegation.lastUpdatedAt = timestamp;
        await context.Delegation.set(delegation);
        // Record metrics
        MetricsCollector.incrementCounter('delegations_updated_total');
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `DelegationUpdated handler for #${delegationId}`);
        logger.info(`✅ Delegation #${delegationId} updated`, {
            delegationId: delegationId.toString(),
            oldAllocation: oldAllocation.toString(),
            newAllocation: percentageAllocation.toString(),
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in DelegationUpdated handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'DelegationUpdated',
        });
        throw error;
    }
}
/**
 * Handler: TradeExecuted event
 *
 * Processes trade executions via delegations
 *
 * @param event - TradeExecuted event data
 * @param context - Database context
 *
 * Performance Target: <10ms execution time
 */
export async function handleTradeExecuted(event, context) {
    const timer = MetricsCollector.startTimer('handler_trade_executed');
    try {
        const { delegationId, patternTokenId, executor, token, amount, success, timestamp, blockNumber, transactionHash, } = event;
        logger.info('💱 Processing TradeExecuted event', {
            delegationId: delegationId.toString(),
            success,
            amount: amount.toString(),
        });
        // Create TradeExecution entity
        const executionId = `${delegationId}-${timestamp}-${blockNumber}`;
        const tradeExecution = {
            id: executionId,
            delegation: delegationId.toString(),
            delegationId,
            pattern: patternTokenId.toString(),
            patternTokenId,
            executor: executor.toLowerCase(),
            token: token.toLowerCase(),
            amount,
            success,
            timestamp,
            blockNumber,
            txHash: transactionHash,
        };
        await context.TradeExecution.set(tradeExecution);
        // Update Delegation entity
        const delegation = await context.Delegation.get(delegationId.toString());
        if (delegation) {
            delegation.totalExecutions += 1;
            if (success) {
                delegation.successfulExecutions += 1;
                delegation.totalAmountTraded += amount;
            }
            else {
                delegation.failedExecutions += 1;
            }
            delegation.lastExecutionAt = timestamp;
            delegation.lastUpdatedAt = timestamp;
            // Calculate success rate
            delegation.successRate = Math.floor((delegation.successfulExecutions / delegation.totalExecutions) * 10000);
            await context.Delegation.set(delegation);
        }
        // Update Pattern entity
        const pattern = await context.Pattern.get(patternTokenId.toString());
        if (pattern) {
            if (success) {
                pattern.successfulExecutions += 1;
            }
            else {
                pattern.failedExecutions += 1;
            }
            pattern.lastUpdatedAt = timestamp;
            await context.Pattern.set(pattern);
        }
        // Update Delegator entity
        if (delegation) {
            const delegator = await context.Delegator.get(delegation.delegator);
            if (delegator) {
                delegator.totalExecutions += 1;
                if (success) {
                    delegator.successfulExecutions += 1;
                }
                else {
                    delegator.failedExecutions += 1;
                }
                await context.Delegator.set(delegator);
            }
        }
        // Update system metrics
        const systemMetrics = await context.SystemMetrics.get('1');
        if (systemMetrics) {
            systemMetrics.totalExecutions = (systemMetrics.totalExecutions || 0) + 1;
            if (success) {
                systemMetrics.successfulExecutions = (systemMetrics.successfulExecutions || 0) + 1;
                systemMetrics.totalVolume += amount;
            }
            else {
                systemMetrics.failedExecutions = (systemMetrics.failedExecutions || 0) + 1;
            }
            systemMetrics.eventsProcessed += 1n;
            await context.SystemMetrics.set(systemMetrics);
        }
        // Record metrics
        MetricsCollector.incrementCounter('trades_executed_total', 1, { success: success.toString() });
        MetricsCollector.incrementCounter(success ? 'trades_successful_total' : 'trades_failed_total');
        if (success) {
            MetricsCollector.observeHistogram('trade_amount', Number(amount));
        }
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `TradeExecuted handler for #${delegationId}`);
        logger.info(`✅ Trade execution recorded`, {
            delegationId: delegationId.toString(),
            success,
            amount: amount.toString(),
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in TradeExecuted handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'TradeExecuted',
        });
        throw error;
    }
}
