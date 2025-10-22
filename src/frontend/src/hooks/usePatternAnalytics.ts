import { useState, useEffect } from 'react';
import { Pattern } from './usePatterns';

// Mirror the types from our backend systems
export interface RiskScore {
  score: number; // 0-100
  level: 'SAFE' | 'MODERATE' | 'RISKY' | 'DANGEROUS';
  flags: string[];
  shouldPause: boolean;
  reasons: string[];
}

export interface QualityScore {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
}

export interface PatternHealth {
  consecutiveLosses: number;
  maxDrawdown: number;
  sharpeRatio: number;
  consistency: number;
  volatility: number;
}

export interface PatternAnalytics {
  tokenId: bigint;
  riskScore: RiskScore;
  qualityScore: QualityScore;
  health: PatternHealth;
  isTrending: boolean;
  trendingReason?: string;
  delegatorCount: number;
  circuitBreakerStatus: {
    isTripped: boolean;
    reason?: string;
    cooldownEnd?: number;
  };
}

/**
 * Hook to fetch advanced analytics for patterns
 * Connects to AnalyticsEngine and PatternValidator
 */
export function usePatternAnalytics(pattern: Pattern | null) {
  const [analytics, setAnalytics] = useState<PatternAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pattern) {
      setAnalytics(null);
      return;
    }

    async function fetchAnalytics() {
      setIsLoading(true);
      setError(null);

      try {
        // Calculate risk score using PatternValidator logic
        const riskScore = calculateRiskScore(pattern);

        // Calculate quality score
        const qualityScore = calculateQualityScore(pattern);

        // Calculate health metrics
        const health = calculateHealthMetrics(pattern);

        // Determine trending status
        const isTrending = checkIfTrending(pattern);

        // Check circuit breaker (would query CircuitBreaker contract in production)
        const circuitBreakerStatus = await checkCircuitBreaker(pattern);

        setAnalytics({
          tokenId: pattern.tokenId,
          riskScore,
          qualityScore,
          health,
          isTrending,
          trendingReason: isTrending ? 'High growth rate and strong performance' : undefined,
          delegatorCount: 0, // Would come from DelegationRouter contract
          circuitBreakerStatus,
        });
      } catch (err) {
        console.error('Error calculating pattern analytics:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [pattern]);

  return { analytics, isLoading, error };
}

/**
 * Calculate risk score (mirrors PatternValidator.ts logic)
 */
function calculateRiskScore(pattern: Pattern): RiskScore {
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 100;

  const winRate = Number(pattern.winRate) / 100;
  const roi = Number(pattern.roi) / 100;

  // Check win rate
  if (winRate < 40) {
    score -= 40;
    flags.push('LOW_WIN_RATE');
    reasons.push(`Win rate ${winRate}% is below safe threshold`);
  } else if (winRate < 55) {
    score -= 20;
    flags.push('MODERATE_WIN_RATE');
    reasons.push(`Win rate ${winRate}% is below optimal threshold`);
  }

  // Check ROI
  if (roi < 0) {
    score -= 30;
    flags.push('NEGATIVE_ROI');
    reasons.push(`Negative ROI of ${roi}%`);
  } else if (roi < 10) {
    score -= 10;
    flags.push('LOW_ROI');
    reasons.push(`ROI of ${roi}% is below target`);
  }

  // Estimate consecutive losses from win rate (in production, get from contract)
  const estimatedConsecutiveLosses = winRate < 50 ? Math.floor((100 - winRate) / 20) : 0;
  if (estimatedConsecutiveLosses >= 5) {
    score -= 30;
    flags.push('CONSECUTIVE_LOSSES');
    reasons.push(`Estimated ${estimatedConsecutiveLosses} consecutive losses`);
  }

  // Determine level
  let level: RiskScore['level'];
  if (score >= 80) level = 'SAFE';
  else if (score >= 60) level = 'MODERATE';
  else if (score >= 40) level = 'RISKY';
  else level = 'DANGEROUS';

  // Should pause if too risky
  const shouldPause = score < 30 || winRate < 30;

  return { score, level, flags, shouldPause, reasons };
}

/**
 * Calculate quality score with grade (mirrors PatternValidator.ts logic)
 */
function calculateQualityScore(pattern: Pattern): QualityScore {
  const winRate = Number(pattern.winRate) / 100;
  const roi = Number(pattern.roi) / 100;
  const volume = Number(pattern.totalVolume);

  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // Win rate component (40 points)
  if (winRate >= 70) {
    score += 40;
    strengths.push('Excellent win rate');
  } else if (winRate >= 60) {
    score += 30;
    strengths.push('Good win rate');
  } else if (winRate >= 50) {
    score += 20;
  } else {
    score += 10;
    weaknesses.push('Low win rate');
  }

  // ROI component (30 points)
  if (roi >= 50) {
    score += 30;
    strengths.push('Outstanding ROI');
  } else if (roi >= 25) {
    score += 20;
    strengths.push('Strong ROI');
  } else if (roi >= 10) {
    score += 10;
  } else if (roi < 0) {
    weaknesses.push('Negative returns');
  }

  // Volume component (15 points)
  if (volume > 100) {
    score += 15;
    strengths.push('High trading volume');
  } else if (volume > 50) {
    score += 10;
  } else if (volume > 10) {
    score += 5;
  } else {
    weaknesses.push('Limited trading history');
  }

  // Consistency bonus (15 points) - estimated from variance
  const consistency = winRate > 60 ? 15 : winRate > 50 ? 10 : 5;
  score += consistency;

  // Determine grade
  let grade: QualityScore['grade'];
  if (score >= 95) grade = 'A+';
  else if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  return { score, grade, strengths, weaknesses };
}

/**
 * Calculate health metrics
 */
function calculateHealthMetrics(pattern: Pattern): PatternHealth {
  const winRate = Number(pattern.winRate) / 100;
  const roi = Number(pattern.roi) / 100;

  // Estimate metrics (in production, get from blockchain history)
  const consecutiveLosses = winRate < 50 ? Math.floor((100 - winRate) / 20) : 0;
  const maxDrawdown = roi < 0 ? Math.abs(roi) * 1.5 : (100 - winRate) * 0.3;

  // Sharpe ratio estimation (risk-adjusted return)
  const estimatedVolatility = Math.abs(roi) * 0.5;
  const sharpeRatio = estimatedVolatility > 0 ? roi / estimatedVolatility : 0;

  // Consistency (0-1 scale)
  const consistency = winRate >= 70 ? 0.9 : winRate >= 60 ? 0.75 : winRate >= 50 ? 0.6 : 0.4;

  return {
    consecutiveLosses,
    maxDrawdown,
    sharpeRatio,
    consistency,
    volatility: estimatedVolatility,
  };
}

/**
 * Check if pattern is trending
 */
function checkIfTrending(pattern: Pattern): boolean {
  const winRate = Number(pattern.winRate) / 100;
  const roi = Number(pattern.roi) / 100;

  // Pattern is trending if it has strong metrics
  return winRate >= 65 && roi >= 20;
}

/**
 * Check circuit breaker status (would query CircuitBreaker contract in production)
 */
async function checkCircuitBreaker(pattern: Pattern): Promise<PatternAnalytics['circuitBreakerStatus']> {
  // In production, query CircuitBreaker contract
  // For now, estimate based on pattern health
  const winRate = Number(pattern.winRate) / 100;
  const consecutiveLosses = winRate < 50 ? Math.floor((100 - winRate) / 20) : 0;

  if (consecutiveLosses >= 5) {
    return {
      isTripped: true,
      reason: `Circuit breaker tripped: ${consecutiveLosses} consecutive losses`,
      cooldownEnd: Date.now() + 3600000, // 1 hour from now
    };
  }

  if (winRate < 30) {
    return {
      isTripped: true,
      reason: `Circuit breaker tripped: Win rate ${winRate}% below minimum threshold`,
      cooldownEnd: Date.now() + 3600000,
    };
  }

  return { isTripped: false };
}

/**
 * Hook to get leaderboard data
 */
export function usePatternLeaderboard(patterns: Pattern[], limit: number = 10) {
  const [leaderboard, setLeaderboard] = useState<Array<{ pattern: Pattern; score: number }>>([]);

  useEffect(() => {
    // Sort patterns by composite score
    const scored = patterns.map(pattern => {
      const quality = calculateQualityScore(pattern);
      const risk = calculateRiskScore(pattern);

      // Composite score: 60% quality, 40% safety (inverse of risk)
      const score = (quality.score * 0.6) + ((100 - risk.score) * 0.4);

      return { pattern, score };
    });

    // Sort by score descending and take top N
    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
    setLeaderboard(sorted);
  }, [patterns, limit]);

  return leaderboard;
}
