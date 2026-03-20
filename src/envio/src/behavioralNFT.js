/**
 * @file behavioralNFT.ts
 * @description Event handlers for BehavioralNFT contract
 * @author Mirror Protocol Team
 *
 * KEY FEATURES:
 * - Real-time pattern minting detection
 * - Performance metrics tracking
 * - Pattern lifecycle management
 * - Sub-10ms handler execution
 *
 * ENVIO INTEGRATION:
 * - Processes events from Envio HyperSync
 * - Updates entities in PostgreSQL
 * - Triggers pattern detection pipeline
 *
 * PERFORMANCE:
 * - Target: <10ms handler execution
 * - Actual: Measured per event
 * - Optimized database writes
 */
import { Logger } from './utils/logger.js';
import { MetricsCollector } from './utils/metrics.js';
import { PatternDecoder } from './utils/decoder.js';
const logger = Logger.create('BehavioralNFT');
/**
 * Handler: PatternMinted event
 *
 * Processes new pattern creation events from BehavioralNFT contract
 *
 * @param event - PatternMinted event data
 * @param context - Database context
 *
 * Requirements:
 * - Decode pattern data from bytes
 * - Create Pattern entity
 * - Update or create Creator entity
 * - Update system metrics
 * - Record performance metrics
 *
 * Performance Target: <10ms execution time
 */
export async function handlePatternMinted(event, context) {
    const timer = MetricsCollector.startTimer('handler_pattern_minted');
    try {
        const { tokenId, creator, patternType, patternData, timestamp, blockNumber, transactionHash } = event;
        logger.info('🎨 Processing PatternMinted event', {
            tokenId: tokenId.toString(),
            creator,
            patternType,
            blockNumber: blockNumber.toString(),
        });
        // Decode pattern data
        const decoded = PatternDecoder.decode(patternType, patternData);
        const patternDataJSON = PatternDecoder.toJSON(decoded);
        const description = PatternDecoder.describe(decoded);
        if (!decoded.valid) {
            logger.warn('⚠️ Invalid pattern data, storing as-is', {
                tokenId: tokenId.toString(),
                error: decoded.error,
            });
        }
        // Create Pattern entity
        const patternEntity = {
            id: tokenId.toString(),
            tokenId,
            creator: creator.toLowerCase(), // Reference to Creator entity
            owner: creator.toLowerCase(),
            patternType: decoded.type,
            patternData,
            patternDataDecoded: patternDataJSON,
            createdAt: timestamp,
            createdAtBlock: blockNumber,
            mintTxHash: transactionHash,
            // Initial performance metrics
            winRate: 0n,
            totalVolume: 0n,
            roi: 0n,
            isActive: true,
            deactivationReason: null,
            deactivatedAt: null,
            // Derived metrics (initial values)
            delegationCount: 0,
            totalEarnings: 0n,
            successfulExecutions: 0,
            failedExecutions: 0,
            lastUpdatedAt: timestamp,
            // Rankings (will be computed later)
            winRateRank: null,
            roiRank: null,
            volumeRank: null,
        };
        await context.Pattern.set(patternEntity);
        logger.debug('✅ Pattern entity created', {
            tokenId: tokenId.toString(),
            description,
        });
        // Update or create Creator entity
        const creatorId = creator.toLowerCase();
        let creatorEntity = await context.Creator.get(creatorId);
        if (!creatorEntity) {
            // New creator
            creatorEntity = {
                id: creatorId,
                address: creator,
                totalPatterns: 1,
                activePatterns: 1,
                deactivatedPatterns: 0,
                totalVolume: 0n,
                averageWinRate: 0n,
                averageROI: 0n,
                totalEarnings: 0n,
                reputationScore: 5000, // Start at 50% (0-10000 scale)
                firstPatternAt: timestamp,
                lastPatternAt: timestamp,
                creatorRank: null,
            };
        }
        else {
            // Existing creator - increment counters
            creatorEntity.totalPatterns += 1;
            creatorEntity.activePatterns += 1;
            creatorEntity.lastPatternAt = timestamp;
        }
        await context.Creator.set(creatorEntity);
        logger.debug('✅ Creator entity updated', {
            creator: creatorId,
            totalPatterns: creatorEntity.totalPatterns,
        });
        // Update system metrics
        let systemMetrics = await context.SystemMetrics.get('1');
        if (!systemMetrics) {
            // Initialize system metrics
            systemMetrics = {
                id: '1',
                totalPatterns: 0,
                activePatterns: 0,
                last24hPatterns: 0,
                last7dPatterns: 0,
                totalCreators: 0,
                activeCreators: 0,
                averageWinRate: 0n,
                medianWinRate: 0n,
                totalVolume: 0n,
                totalEarnings: 0n,
                eventsProcessed: 0n,
                eventsLastHour: 0,
                averageProcessingTime: 0,
                averageQueryLatency: 0,
                peakEventsPerSecond: 0,
                currentEventsPerSecond: 0,
                momentumPatterns: 0,
                arbitragePatterns: 0,
                meanReversionPatterns: 0,
                otherPatterns: 0,
                lastPatternMintedAt: timestamp,
                lastPerformanceUpdateAt: 0n,
                lastUpdatedAt: timestamp,
            };
        }
        systemMetrics.totalPatterns += 1;
        systemMetrics.activePatterns += 1;
        systemMetrics.last24hPatterns += 1;
        systemMetrics.last7dPatterns += 1;
        systemMetrics.eventsProcessed += 1n;
        systemMetrics.lastPatternMintedAt = timestamp;
        systemMetrics.lastUpdatedAt = timestamp;
        // Update pattern type counters
        switch (decoded.type) {
            case 'momentum':
                systemMetrics.momentumPatterns += 1;
                break;
            case 'arbitrage':
                systemMetrics.arbitragePatterns += 1;
                break;
            case 'mean_reversion':
                systemMetrics.meanReversionPatterns += 1;
                break;
            default:
                systemMetrics.otherPatterns += 1;
        }
        // Check if new creator
        const isNewCreator = creatorEntity.totalPatterns === 1;
        if (isNewCreator) {
            systemMetrics.totalCreators += 1;
            systemMetrics.activeCreators += 1;
        }
        await context.SystemMetrics.set(systemMetrics);
        // Record performance metrics
        MetricsCollector.incrementCounter('patterns_minted_total');
        MetricsCollector.incrementCounter('patterns_by_type', 1, { type: decoded.type });
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `PatternMinted handler for #${tokenId}`);
        logger.info(`✅ Pattern #${tokenId} minted - ${description}`, {
            tokenId: tokenId.toString(),
            creator,
            patternType: decoded.type,
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in PatternMinted handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'PatternMinted',
        });
        // Re-throw to let Envio handle retry logic
        throw error;
    }
}
/**
 * Handler: PatternPerformanceUpdated event
 *
 * Processes performance metric updates for existing patterns
 *
 * @param event - PatternPerformanceUpdated event data
 * @param context - Database context
 *
 * Performance Target: <10ms execution time
 */
export async function handlePatternPerformanceUpdated(event, context) {
    const timer = MetricsCollector.startTimer('handler_performance_updated');
    try {
        const { tokenId, winRate, totalVolume, roi, timestamp, blockNumber, transactionHash } = event;
        logger.info('📊 Processing PatternPerformanceUpdated event', {
            tokenId: tokenId.toString(),
            winRate: winRate.toString(),
            roi: roi.toString(),
        });
        // Get existing pattern
        const pattern = await context.Pattern.get(tokenId.toString());
        if (!pattern) {
            logger.warn('⚠️ Pattern not found for performance update', {
                tokenId: tokenId.toString(),
            });
            timer.stop();
            return;
        }
        // Calculate deltas
        const winRateDelta = winRate - pattern.winRate;
        const volumeDelta = totalVolume - pattern.totalVolume;
        const roiDelta = roi - pattern.roi;
        // Update pattern entity
        pattern.winRate = winRate;
        pattern.totalVolume = totalVolume;
        pattern.roi = roi;
        pattern.lastUpdatedAt = timestamp;
        await context.Pattern.set(pattern);
        // Create PerformanceUpdate entity for historical tracking
        const updateId = `${tokenId}-${timestamp}`;
        const performanceUpdate = {
            id: updateId,
            pattern: tokenId.toString(),
            winRate,
            totalVolume,
            roi,
            timestamp,
            blockNumber,
            txHash: transactionHash,
            winRateDelta,
            volumeDelta,
            roiDelta,
        };
        await context.PerformanceUpdate.set(performanceUpdate);
        // Update creator's aggregate metrics
        const creator = await context.Creator.get(pattern.creator);
        if (creator) {
            // Recalculate average win rate and ROI across all creator's active patterns
            // (This is simplified - in production, would query all patterns)
            await context.Creator.set(creator);
        }
        // Update system metrics
        const systemMetrics = await context.SystemMetrics.get('1');
        if (systemMetrics) {
            systemMetrics.lastPerformanceUpdateAt = timestamp;
            systemMetrics.eventsProcessed += 1n;
            await context.SystemMetrics.set(systemMetrics);
        }
        // Record metrics
        MetricsCollector.incrementCounter('performance_updates_total');
        MetricsCollector.setGauge('latest_win_rate', Number(winRate), {
            tokenId: tokenId.toString(),
        });
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `PerformanceUpdated handler for #${tokenId}`);
        logger.info(`✅ Pattern #${tokenId} performance updated`, {
            tokenId: tokenId.toString(),
            winRate: winRate.toString(),
            totalVolume: totalVolume.toString(),
            roi: roi.toString(),
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in PatternPerformanceUpdated handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'PatternPerformanceUpdated',
        });
        throw error;
    }
}
/**
 * Handler: PatternDeactivated event
 *
 * Processes pattern deactivation events
 *
 * @param event - PatternDeactivated event data
 * @param context - Database context
 *
 * Performance Target: <10ms execution time
 */
export async function handlePatternDeactivated(event, context) {
    const timer = MetricsCollector.startTimer('handler_pattern_deactivated');
    try {
        const { tokenId, reason, timestamp } = event;
        logger.info('🔴 Processing PatternDeactivated event', {
            tokenId: tokenId.toString(),
            reason,
        });
        // Get existing pattern
        const pattern = await context.Pattern.get(tokenId.toString());
        if (!pattern) {
            logger.warn('⚠️ Pattern not found for deactivation', {
                tokenId: tokenId.toString(),
            });
            timer.stop();
            return;
        }
        // Update pattern entity
        pattern.isActive = false;
        pattern.deactivationReason = reason;
        pattern.deactivatedAt = timestamp;
        pattern.lastUpdatedAt = timestamp;
        await context.Pattern.set(pattern);
        // Update creator stats
        const creator = await context.Creator.get(pattern.creator);
        if (creator) {
            creator.activePatterns = Math.max(0, creator.activePatterns - 1);
            creator.deactivatedPatterns += 1;
            await context.Creator.set(creator);
        }
        // Update system metrics
        const systemMetrics = await context.SystemMetrics.get('1');
        if (systemMetrics) {
            systemMetrics.activePatterns = Math.max(0, systemMetrics.activePatterns - 1);
            systemMetrics.eventsProcessed += 1n;
            await context.SystemMetrics.set(systemMetrics);
        }
        // Record metrics
        MetricsCollector.incrementCounter('patterns_deactivated_total');
        MetricsCollector.incrementCounter('deactivation_reasons', 1, { reason });
        MetricsCollector.recordEvent();
        const duration = timer.stopAndCheckTarget(10, `PatternDeactivated handler for #${tokenId}`);
        logger.info(`✅ Pattern #${tokenId} deactivated: ${reason}`, {
            tokenId: tokenId.toString(),
            reason,
            handlerDuration: duration,
        });
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in PatternDeactivated handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'PatternDeactivated',
        });
        throw error;
    }
}
/**
 * Handler: Transfer event (ERC721)
 *
 * Tracks NFT ownership changes
 *
 * @param event - Transfer event data
 * @param context - Database context
 */
export async function handleTransfer(event, context) {
    const timer = MetricsCollector.startTimer('handler_transfer');
    try {
        const { from, to, tokenId } = event;
        // Skip mint events (handled by PatternMinted)
        if (from === '0x0000000000000000000000000000000000000000') {
            timer.stop();
            return;
        }
        // Skip burn events (handled by PatternDeactivated)
        if (to === '0x0000000000000000000000000000000000000000') {
            timer.stop();
            return;
        }
        logger.info('🔄 Processing Transfer event', {
            tokenId: tokenId.toString(),
            from,
            to,
        });
        // Update pattern owner
        const pattern = await context.Pattern.get(tokenId.toString());
        if (pattern) {
            pattern.owner = to.toLowerCase();
            await context.Pattern.set(pattern);
            logger.debug('✅ Pattern owner updated', {
                tokenId: tokenId.toString(),
                newOwner: to,
            });
        }
        MetricsCollector.incrementCounter('transfers_total');
        MetricsCollector.recordEvent();
        const duration = timer.stop();
        logger.debug(`Transfer handler completed in ${duration}ms`);
    }
    catch (error) {
        const duration = timer.stop();
        logger.error('❌ Error in Transfer handler', {
            error: error instanceof Error ? error.message : 'Unknown error',
            event,
            duration,
        });
        MetricsCollector.incrementCounter('handler_errors_total', 1, {
            handler: 'Transfer',
        });
        throw error;
    }
}
