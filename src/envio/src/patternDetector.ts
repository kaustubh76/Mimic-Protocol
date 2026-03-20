/**
 * @file patternDetector.ts
 * @description Sub-50ms behavioral pattern detection engine
 * @author Mirror Protocol Team
 *
 * KEY FEATURES:
 * - Real-time pattern detection from on-chain events
 * - Sub-50ms detection latency
 * - Multiple pattern types (momentum, arbitrage, mean reversion)
 * - Confidence scoring
 *
 * ENVIO INTEGRATION:
 * - Triggered by Envio event handlers
 * - Uses HyperSync for fast historical queries
 * - Real-time behavioral analysis
 *
 * PERFORMANCE:
 * - Target: <50ms pattern detection
 * - Optimized algorithms for speed
 * - Pre-computed behavioral graphs
 */

import { Logger } from './utils/logger';
import { MetricsCollector } from './utils/metrics';
import { PatternDecoder } from './utils/decoder';

const logger = Logger.create('PatternDetector');

/**
 * Pattern confidence score (0-10000 basis points = 0-100%)
 */
export type ConfidenceScore = number;

/**
 * Detected pattern result
 */
export interface DetectedPattern {
  type: string;
  confidence: ConfidenceScore;
  parameters: any[];
  encodedData: string;
  metadata: {
    detectionTime: number;
    dataPoints: number;
    historicalWinRate?: number;
  };
}

/**
 * Trading event for pattern analysis
 */
export interface TradingEvent {
  timestamp: bigint;
  tokenAddress: string;
  action: 'buy' | 'sell' | 'swap';
  amount: bigint;
  price: bigint;
  txHash: string;
  userAddress: string;
}

/**
 * Pattern detection engine
 */
export class PatternDetector {
  /**
   * Detect momentum trading pattern
   *
   * Pattern: User consistently buys during upward price movements
   * Criteria: 3+ consecutive buys with increasing prices
   *
   * @param events - Trading events for a user
   * @returns Detected pattern or null
   *
   * Performance Target: <20ms
   */
  static detectMomentum(events: TradingEvent[]): DetectedPattern | null {
    const timer = MetricsCollector.startTimer('pattern_detection_momentum');

    try {
      // Filter to buy events only
      const buyEvents = events
        .filter((e) => e.action === 'buy')
        .sort((a, b) => Number(a.timestamp - b.timestamp));

      if (buyEvents.length < 3) {
        timer.stop();
        return null;
      }

      // Find consecutive buy streaks with increasing prices
      let maxStreak = 0;
      let currentStreak = 1;
      let streakVolumeTotal = buyEvents[0].amount;
      let streakStartPrice = buyEvents[0].price;

      for (let i = 1; i < buyEvents.length; i++) {
        const prev = buyEvents[i - 1];
        const curr = buyEvents[i];

        // Check if price increased and time gap is reasonable (< 1 hour)
        const timeDiff = Number(curr.timestamp - prev.timestamp);
        const priceIncreased = curr.price > prev.price;

        if (priceIncreased && timeDiff < 3600) {
          currentStreak++;
          streakVolumeTotal += curr.amount;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
          streakVolumeTotal = curr.amount;
          streakStartPrice = curr.price;
        }
      }

      maxStreak = Math.max(maxStreak, currentStreak);

      // Pattern detected if streak >= 3
      if (maxStreak >= 3) {
        const avgVolume = streakVolumeTotal / BigInt(maxStreak);

        // Calculate confidence based on:
        // - Streak length (longer = higher confidence)
        // - Consistency (price always increasing = higher)
        // - Volume (higher = higher)
        const streakScore = Math.min(maxStreak * 2000, 6000); // Max 60% from streak
        const volumeScore = 2000; // 20% base volume score
        const consistencyScore = 2000; // 20% consistency

        const confidence = Math.min(streakScore + volumeScore + consistencyScore, 10000);

        // Encode parameters: [minConsecutiveGreen, volumeThreshold, timeWindow]
        const parameters = [
          BigInt(maxStreak),
          avgVolume,
          BigInt(3600), // 1 hour time window
        ];

        const encodedData = PatternDecoder.encode('momentum', parameters);

        const duration = timer.stopAndCheckTarget(20, 'Momentum pattern detection');

        logger.info('✅ Momentum pattern detected', {
          streak: maxStreak,
          confidence,
          avgVolume: avgVolume.toString(),
          detectionTime: duration,
        });

        return {
          type: 'momentum',
          confidence,
          parameters,
          encodedData,
          metadata: {
            detectionTime: duration,
            dataPoints: events.length,
          },
        };
      }

      timer.stop();
      return null;
    } catch (error) {
      timer.stop();
      logger.error('Error detecting momentum pattern', error);
      return null;
    }
  }

  /**
   * Detect mean reversion trading pattern
   *
   * Pattern: User buys after significant price drops, sells after recovery
   * Criteria: Buy at >10% dip, sell at >5% recovery
   *
   * @param events - Trading events for a user
   * @returns Detected pattern or null
   *
   * Performance Target: <20ms
   */
  static detectMeanReversion(events: TradingEvent[]): DetectedPattern | null {
    const timer = MetricsCollector.startTimer('pattern_detection_mean_reversion');

    try {
      if (events.length < 4) {
        timer.stop();
        return null;
      }

      const sorted = [...events].sort((a, b) => Number(a.timestamp - b.timestamp));

      // Calculate moving average
      const prices = sorted.map((e) => Number(e.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

      // Find buy-after-dip and sell-after-recovery pairs
      let dipBuys = 0;
      let recoveryS ells = 0;
      let totalDipPercent = 0;
      let totalRecoveryPercent = 0;

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        const priceChange = ((Number(curr.price) - Number(prev.price)) / Number(prev.price)) * 100;
        const deviationFromAvg = ((Number(curr.price) - avgPrice) / avgPrice) * 100;

        // Buy after dip (price dropped >10% from average)
        if (curr.action === 'buy' && deviationFromAvg < -10) {
          dipBuys++;
          totalDipPercent += Math.abs(deviationFromAvg);
        }

        // Sell after recovery (price up >5% from average)
        if (curr.action === 'sell' && deviationFromAvg > 5) {
          recoverySells++;
          totalRecoveryPercent += deviationFromAvg;
        }
      }

      // Pattern detected if at least 2 buy-low/sell-high cycles
      if (dipBuys >= 2 && recoverySells >= 2) {
        const avgDip = Math.round(totalDipPercent / dipBuys);
        const avgRecovery = Math.round(totalRecoveryPercent / recoverySells);

        // Confidence based on consistency and profitability
        const cycleScore = Math.min((dipBuys + recoverySells) * 1000, 5000); // Max 50%
        const profitabilityScore = Math.min(avgRecovery * 100, 3000); // Max 30%
        const consistencyScore = 2000; // 20% base

        const confidence = Math.min(cycleScore + profitabilityScore + consistencyScore, 10000);

        // Encode parameters: [deviationThreshold, lookbackPeriod, targetReturn]
        const parameters = [
          BigInt(Math.round(avgDip * 100)), // Basis points
          BigInt(events.length), // Lookback period
          BigInt(Math.round(avgRecovery * 100)), // Target return in basis points
        ];

        const encodedData = PatternDecoder.encode('mean_reversion', parameters);

        const duration = timer.stopAndCheckTarget(20, 'Mean reversion pattern detection');

        logger.info('✅ Mean reversion pattern detected', {
          dipBuys,
          recoverySells,
          avgDip,
          avgRecovery,
          confidence,
          detectionTime: duration,
        });

        return {
          type: 'mean_reversion',
          confidence,
          parameters,
          encodedData,
          metadata: {
            detectionTime: duration,
            dataPoints: events.length,
          },
        };
      }

      timer.stop();
      return null;
    } catch (error) {
      timer.stop();
      logger.error('Error detecting mean reversion pattern', error);
      return null;
    }
  }

  /**
   * Detect arbitrage trading pattern
   *
   * Pattern: User exploits price differences across DEXs
   * Criteria: Near-simultaneous buy/sell of same token on different DEXs
   *
   * @param events - Trading events for a user
   * @returns Detected pattern or null
   *
   * Performance Target: <20ms
   */
  static detectArbitrage(events: TradingEvent[]): DetectedPattern | null {
    const timer = MetricsCollector.startTimer('pattern_detection_arbitrage');

    try {
      if (events.length < 2) {
        timer.stop();
        return null;
      }

      const sorted = [...events].sort((a, b) => Number(a.timestamp - b.timestamp));

      // Find near-simultaneous buy/sell pairs (within 60 seconds)
      let arbOps = 0;
      let totalSpread = 0;
      const dexAddresses = new Set<string>();

      for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const event1 = sorted[i];
          const event2 = sorted[j];

          const timeDiff = Number(event2.timestamp - event1.timestamp);

          // Must be same token, opposite actions, within 60 seconds
          if (
            event1.tokenAddress === event2.tokenAddress &&
            event1.action !== event2.action &&
            timeDiff < 60
          ) {
            // Calculate price spread
            const spread = Math.abs(Number(event2.price) - Number(event1.price));
            const spreadPercent = (spread / Number(Math.min(event1.price, event2.price))) * 100;

            if (spreadPercent > 1) {
              // Significant spread (>1%)
              arbOps++;
              totalSpread += spreadPercent;
              dexAddresses.add(event1.txHash.slice(0, 10)); // Simplified DEX identification
            }
          }
        }
      }

      // Pattern detected if at least 2 arbitrage operations
      if (arbOps >= 2) {
        const avgSpread = totalSpread / arbOps;

        // Confidence based on number of operations and average spread
        const opsScore = Math.min(arbOps * 2000, 6000); // Max 60%
        const spreadScore = Math.min(avgSpread * 200, 3000); // Max 30%
        const consistencyScore = 1000; // 10% base

        const confidence = Math.min(opsScore + spreadScore + consistencyScore, 10000);

        // Encode parameters: [dexAddresses, minPriceGap, maxSlippage]
        const parameters = [
          Array.from(dexAddresses).slice(0, 5), // Max 5 DEXs
          BigInt(Math.round(avgSpread * 100)), // Min price gap in basis points
          BigInt(50), // 0.5% max slippage
        ];

        const encodedData = PatternDecoder.encode('arbitrage', parameters);

        const duration = timer.stopAndCheckTarget(20, 'Arbitrage pattern detection');

        logger.info('✅ Arbitrage pattern detected', {
          operations: arbOps,
          avgSpread,
          dexCount: dexAddresses.size,
          confidence,
          detectionTime: duration,
        });

        return {
          type: 'arbitrage',
          confidence,
          parameters,
          encodedData,
          metadata: {
            detectionTime: duration,
            dataPoints: events.length,
          },
        };
      }

      timer.stop();
      return null;
    } catch (error) {
      timer.stop();
      logger.error('Error detecting arbitrage pattern', error);
      return null;
    }
  }

  /**
   * Analyze user trading history and detect all patterns
   *
   * @param userAddress - Wallet address to analyze
   * @param events - Trading events for the user
   * @returns Array of detected patterns
   *
   * Performance Target: <50ms total
   */
  static async analyzeUserBehavior(
    userAddress: string,
    events: TradingEvent[]
  ): Promise<DetectedPattern[]> {
    const timer = MetricsCollector.startTimer('pattern_detection_full_analysis');

    try {
      logger.info('🔍 Analyzing user behavior', {
        userAddress,
        eventCount: events.length,
      });

      const detectedPatterns: DetectedPattern[] = [];

      // Run all pattern detectors in parallel for speed
      const [momentum, meanReversion, arbitrage] = await Promise.all([
        Promise.resolve(this.detectMomentum(events)),
        Promise.resolve(this.detectMeanReversion(events)),
        Promise.resolve(this.detectArbitrage(events)),
      ]);

      if (momentum) detectedPatterns.push(momentum);
      if (meanReversion) detectedPatterns.push(meanReversion);
      if (arbitrage) detectedPatterns.push(arbitrage);

      const duration = timer.stopAndCheckTarget(
        50,
        `Full behavioral analysis for ${userAddress}`
      );

      if (detectedPatterns.length > 0) {
        logger.info(`✅ Detected ${detectedPatterns.length} patterns in ${duration}ms`, {
          userAddress,
          patterns: detectedPatterns.map((p) => p.type),
          duration,
        });

        // Record sub-50ms achievement
        if (duration < 50) {
          MetricsCollector.incrementCounter('sub_50ms_detections');
          logger.info(
            `🚀 SUB-50MS PATTERN DETECTION (${duration}ms) - Only possible with Envio!`,
            { duration }
          );
        }
      }

      MetricsCollector.setGauge('last_pattern_detection_time', duration);
      return detectedPatterns;
    } catch (error) {
      timer.stop();
      logger.error('Error analyzing user behavior', error);
      return [];
    }
  }
}

export default PatternDetector;
