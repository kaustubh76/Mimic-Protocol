/**
 * @file PatternValidator.ts
 * @description Advanced pattern validation and risk scoring system
 * @author Mirror Protocol Team
 *
 * FEATURES:
 * - Real-time pattern health monitoring
 * - Risk scoring based on historical performance
 * - Circuit breaker detection
 * - Anomaly detection without ML
 * - Pattern quality metrics
 */

export interface PatternMetrics {
  tokenId: bigint;
  totalTrades: number;
  successfulTrades: number;
  winRate: number;
  totalVolume: bigint;
  averageProfit: bigint;
  maxDrawdown: bigint;
  sharpeRatio: number;
  consistency: number;
  lastExecutionTime: bigint;
  consecutiveLosses: number;
  consecutiveWins: number;
}

export interface RiskScore {
  score: number; // 0-100, higher is safer
  level: 'SAFE' | 'MODERATE' | 'RISKY' | 'DANGEROUS';
  flags: string[];
  shouldPause: boolean;
  reasons: string[];
}

export interface PatternHealth {
  isHealthy: boolean;
  riskScore: RiskScore;
  metrics: PatternMetrics;
  warnings: string[];
  lastUpdated: bigint;
}

export class PatternValidator {
  // Risk thresholds
  private static readonly MIN_SAFE_WIN_RATE = 55; // 55%
  private static readonly MAX_CONSECUTIVE_LOSSES = 5;
  private static readonly MAX_DRAWDOWN_PERCENT = 30; // 30%
  private static readonly MIN_TRADE_COUNT = 10; // Minimum trades for reliable scoring
  private static readonly CONSISTENCY_THRESHOLD = 0.7; // 70% consistency
  private static readonly STALE_PATTERN_HOURS = 48; // Pattern not executed in 48 hours

  /**
   * Calculate comprehensive risk score for a pattern
   */
  static calculateRiskScore(metrics: PatternMetrics, currentTime: bigint): RiskScore {
    const flags: string[] = [];
    const reasons: string[] = [];
    let score = 100; // Start with perfect score

    // Check win rate
    if (metrics.totalTrades >= this.MIN_TRADE_COUNT) {
      if (metrics.winRate < 40) {
        score -= 40;
        flags.push('LOW_WIN_RATE');
        reasons.push(`Win rate ${metrics.winRate.toFixed(1)}% is below safe threshold`);
      } else if (metrics.winRate < this.MIN_SAFE_WIN_RATE) {
        score -= 20;
        flags.push('MODERATE_WIN_RATE');
        reasons.push(`Win rate ${metrics.winRate.toFixed(1)}% is below optimal`);
      }
    } else {
      score -= 15;
      flags.push('INSUFFICIENT_DATA');
      reasons.push(`Only ${metrics.totalTrades} trades executed, need ${this.MIN_TRADE_COUNT} minimum`);
    }

    // Check consecutive losses
    if (metrics.consecutiveLosses >= this.MAX_CONSECUTIVE_LOSSES) {
      score -= 30;
      flags.push('CONSECUTIVE_LOSSES');
      reasons.push(`${metrics.consecutiveLosses} consecutive losses detected`);
    } else if (metrics.consecutiveLosses >= 3) {
      score -= 10;
      flags.push('RECENT_LOSSES');
      reasons.push(`${metrics.consecutiveLosses} recent losses`);
    }

    // Check consistency
    if (metrics.consistency < this.CONSISTENCY_THRESHOLD) {
      score -= 15;
      flags.push('LOW_CONSISTENCY');
      reasons.push(`Consistency ${(metrics.consistency * 100).toFixed(1)}% is below threshold`);
    }

    // Check if pattern is stale
    const hoursSinceExecution = Number(currentTime - metrics.lastExecutionTime) / 3600;
    if (hoursSinceExecution > this.STALE_PATTERN_HOURS) {
      score -= 10;
      flags.push('STALE_PATTERN');
      reasons.push(`No execution in ${hoursSinceExecution.toFixed(1)} hours`);
    }

    // Check average profit trend
    if (metrics.averageProfit < 0n) {
      score -= 35;
      flags.push('NEGATIVE_RETURNS');
      reasons.push('Pattern showing negative average returns');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let level: RiskScore['level'];
    if (score >= 80) level = 'SAFE';
    else if (score >= 60) level = 'MODERATE';
    else if (score >= 40) level = 'RISKY';
    else level = 'DANGEROUS';

    // Determine if pattern should be paused
    const shouldPause =
      metrics.consecutiveLosses >= this.MAX_CONSECUTIVE_LOSSES ||
      (metrics.winRate < 30 && metrics.totalTrades >= this.MIN_TRADE_COUNT) ||
      score < 30;

    if (shouldPause) {
      flags.push('AUTO_PAUSE_RECOMMENDED');
      reasons.push('Pattern should be paused to prevent further losses');
    }

    return {
      score,
      level,
      flags,
      shouldPause,
      reasons,
    };
  }

  /**
   * Calculate Sharpe Ratio (simplified version without ML)
   * Measures risk-adjusted returns
   */
  static calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0
  ): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    return (avgReturn - riskFreeRate) / stdDev;
  }

  /**
   * Calculate pattern consistency score
   * Measures how reliably a pattern performs
   */
  static calculateConsistency(returns: number[]): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const deviations = returns.map(r => Math.abs(r - avgReturn));
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

    // Lower deviation = higher consistency
    // Scale to 0-1 range (assuming max deviation of 100%)
    const consistency = Math.max(0, 1 - (avgDeviation / 100));

    return consistency;
  }

  /**
   * Validate pattern health comprehensively
   */
  static validatePatternHealth(
    metrics: PatternMetrics,
    currentTime: bigint
  ): PatternHealth {
    const riskScore = this.calculateRiskScore(metrics, currentTime);
    const warnings: string[] = [];

    // Generate warnings based on risk flags
    if (riskScore.flags.includes('LOW_WIN_RATE')) {
      warnings.push('Win rate is critically low - consider deactivating pattern');
    }
    if (riskScore.flags.includes('CONSECUTIVE_LOSSES')) {
      warnings.push('Multiple consecutive losses detected - pattern may be broken');
    }
    if (riskScore.flags.includes('STALE_PATTERN')) {
      warnings.push('Pattern has not been executed recently - may be inactive');
    }
    if (riskScore.flags.includes('NEGATIVE_RETURNS')) {
      warnings.push('Pattern showing negative returns - immediate review needed');
    }

    const isHealthy = riskScore.level === 'SAFE' || riskScore.level === 'MODERATE';

    return {
      isHealthy,
      riskScore,
      metrics,
      warnings,
      lastUpdated: currentTime,
    };
  }

  /**
   * Detect circuit breaker conditions
   * Returns true if pattern should be immediately halted
   */
  static shouldTriggerCircuitBreaker(metrics: PatternMetrics): {
    shouldTrigger: boolean;
    reason: string;
  } {
    // Circuit breaker 1: Too many consecutive losses
    if (metrics.consecutiveLosses >= this.MAX_CONSECUTIVE_LOSSES) {
      return {
        shouldTrigger: true,
        reason: `Circuit breaker: ${metrics.consecutiveLosses} consecutive losses`,
      };
    }

    // Circuit breaker 2: Win rate collapse
    if (metrics.totalTrades >= this.MIN_TRADE_COUNT && metrics.winRate < 25) {
      return {
        shouldTrigger: true,
        reason: `Circuit breaker: Win rate collapsed to ${metrics.winRate.toFixed(1)}%`,
      };
    }

    // Circuit breaker 3: Extreme drawdown
    const drawdownPercent = Number(metrics.maxDrawdown) / Number(metrics.totalVolume) * 100;
    if (drawdownPercent > this.MAX_DRAWDOWN_PERCENT) {
      return {
        shouldTrigger: true,
        reason: `Circuit breaker: Drawdown ${drawdownPercent.toFixed(1)}% exceeds ${this.MAX_DRAWDOWN_PERCENT}%`,
      };
    }

    return {
      shouldTrigger: false,
      reason: '',
    };
  }

  /**
   * Calculate pattern quality score (0-100)
   * Comprehensive quality metric combining multiple factors
   */
  static calculateQualityScore(metrics: PatternMetrics): number {
    let score = 0;

    // Win rate contribution (40 points max)
    const winRateScore = Math.min(40, (metrics.winRate / 100) * 40);
    score += winRateScore;

    // Trade volume contribution (20 points max)
    const volumeScore = Math.min(20, Math.log10(Number(metrics.totalVolume)) * 2);
    score += volumeScore;

    // Consistency contribution (20 points max)
    const consistencyScore = metrics.consistency * 20;
    score += consistencyScore;

    // Trade count contribution (10 points max)
    const tradeCountScore = Math.min(10, (metrics.totalTrades / 100) * 10);
    score += tradeCountScore;

    // Sharpe ratio contribution (10 points max)
    const sharpeScore = Math.min(10, Math.max(0, metrics.sharpeRatio * 5));
    score += sharpeScore;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate pattern performance report
   */
  static generatePerformanceReport(metrics: PatternMetrics, currentTime: bigint): {
    summary: string;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  } {
    const qualityScore = this.calculateQualityScore(metrics);
    const riskScore = this.calculateRiskScore(metrics, currentTime);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze strengths
    if (metrics.winRate >= 70) strengths.push('Exceptional win rate');
    else if (metrics.winRate >= this.MIN_SAFE_WIN_RATE) strengths.push('Solid win rate');

    if (metrics.consistency >= 0.8) strengths.push('Highly consistent performance');
    if (metrics.sharpeRatio >= 2) strengths.push('Excellent risk-adjusted returns');
    if (metrics.totalTrades >= 50) strengths.push('Well-tested pattern');
    if (metrics.consecutiveWins >= 5) strengths.push('Strong recent performance');

    // Analyze weaknesses
    if (metrics.winRate < this.MIN_SAFE_WIN_RATE) weaknesses.push('Below optimal win rate');
    if (metrics.consistency < this.CONSISTENCY_THRESHOLD) weaknesses.push('Inconsistent performance');
    if (metrics.totalTrades < this.MIN_TRADE_COUNT) weaknesses.push('Insufficient trading history');
    if (metrics.consecutiveLosses >= 3) weaknesses.push('Recent losing streak');
    if (metrics.sharpeRatio < 1) weaknesses.push('Poor risk-adjusted returns');

    // Determine grade
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (qualityScore >= 90) grade = 'A+';
    else if (qualityScore >= 80) grade = 'A';
    else if (qualityScore >= 70) grade = 'B';
    else if (qualityScore >= 60) grade = 'C';
    else if (qualityScore >= 50) grade = 'D';
    else grade = 'F';

    // Generate recommendation
    let recommendation: string;
    if (riskScore.shouldPause) {
      recommendation = 'PAUSE IMMEDIATELY - Pattern shows critical risk signals';
    } else if (riskScore.level === 'SAFE') {
      recommendation = 'APPROVED - Pattern is safe for delegation';
    } else if (riskScore.level === 'MODERATE') {
      recommendation = 'CAUTION - Monitor closely, reduce allocation';
    } else if (riskScore.level === 'RISKY') {
      recommendation = 'WARNING - High risk, consider alternative patterns';
    } else {
      recommendation = 'AVOID - Pattern shows dangerous performance characteristics';
    }

    const summary = `Pattern quality: ${qualityScore.toFixed(1)}/100 | Risk level: ${riskScore.level} | Grade: ${grade}`;

    return {
      summary,
      grade,
      strengths,
      weaknesses,
      recommendation,
    };
  }
}
