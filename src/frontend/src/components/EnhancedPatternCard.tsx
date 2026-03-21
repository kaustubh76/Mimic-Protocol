import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Pattern } from '../hooks/usePatterns';
import { usePatternAnalytics } from '../hooks/usePatternAnalytics';
import { formatEther } from 'viem';
import {
  RiskScoreBadge,
  QualityGradeBadge,
  CircuitBreakerAlert,
  TrendingBadge,
  HealthMetrics,
} from './RiskScoreBadge';
import { ExecutionIndicator } from './ExecutionStats';

interface EnhancedPatternCardProps {
  pattern: Pattern;
  onDelegateClick: (pattern: Pattern) => void;
}

export function EnhancedPatternCard({ pattern, onDelegateClick }: EnhancedPatternCardProps) {
  const { analytics, isLoading: analyticsLoading } = usePatternAnalytics(pattern);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { address } = useAccount();
  const isOwner = address && pattern.creator.toLowerCase() === address.toLowerCase();

  const winRate = Number(pattern.winRate || 0) / 100;
  const volume = formatEther(pattern.totalVolume || BigInt(0));
  const roi = Number(pattern.roi || 0) / 100;

  return (
    <div className="pattern-card relative overflow-hidden">
      {/* Trending Indicator */}
      {analytics?.isTrending && (
        <div className="absolute top-0 right-0 z-10">
          <TrendingBadge
            isTrending={analytics.isTrending}
            reason={analytics.trendingReason}
          />
        </div>
      )}

      {/* Card Header */}
      <div className="pattern-header">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`pattern-badge pattern-badge--${pattern.patternType}`}>
                {pattern.patternType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              {pattern.isActive ? (
                <div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  ACTIVE
                </div>
              ) : (
                <div className="px-2 py-0.5 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs font-bold">
                  INACTIVE
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold">Pattern #{pattern.id}</h3>
          </div>
        </div>

        {/* Safety Badges */}
        {analytics && !analyticsLoading && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <RiskScoreBadge riskScore={analytics.riskScore} size="sm" />
            <QualityGradeBadge qualityScore={analytics.qualityScore} size="sm" />
          </div>
        )}

        {analyticsLoading && (
          <div className="flex items-center gap-2 mb-3">
            <div className="loading-skeleton h-6 w-24"></div>
            <div className="loading-skeleton h-6 w-24"></div>
          </div>
        )}
      </div>

      {/* Circuit Breaker Alert */}
      {analytics?.circuitBreakerStatus.isTripped && (
        <div className="mb-4">
          <CircuitBreakerAlert
            isTripped={analytics.circuitBreakerStatus.isTripped}
            reason={analytics.circuitBreakerStatus.reason}
            cooldownEnd={analytics.circuitBreakerStatus.cooldownEnd}
          />
        </div>
      )}

      {/* Core Stats Grid */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="stat-inline flex-col items-start">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value text-lg">{winRate}%</span>
        </div>
        <div className="stat-inline flex-col items-start">
          <span className="stat-label">Volume</span>
          <span className="stat-value text-lg">{parseFloat(volume).toFixed(0)}</span>
        </div>
        <div className="stat-inline flex-col items-start">
          <span className="stat-label">ROI</span>
          <span className={`stat-value text-lg ${roi >= 0 ? 'text-success' : 'text-error'}`}>
            {roi > 0 ? '+' : ''}{roi}%
          </span>
        </div>
      </div>

      {/* Performance Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Performance Score</span>
          <span className="font-bold text-gradient-primary">
            {analytics ? `${analytics.qualityScore.score}/100` : `${winRate}%`}
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
            style={{
              width: `${analytics ? analytics.qualityScore.score : Math.min(winRate, 100)}%`,
              animation: 'slideRight 1s ease-out',
            }}
          ></div>
        </div>
      </div>

      {/* Advanced Stats Toggle */}
      {analytics && (
        <div className="mb-4">
          <button
            className="text-xs text-primary hover:text-primary-light transition-colors flex items-center gap-1"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>{showAdvanced ? '▼' : '▶'}</span>
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Stats</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3 animate-fadeIn">
              {/* Health Metrics */}
              <HealthMetrics
                consecutiveLosses={analytics.health.consecutiveLosses}
                maxDrawdown={analytics.health.maxDrawdown}
                sharpeRatio={analytics.health.sharpeRatio}
                consistency={analytics.health.consistency}
              />

              {/* Quality Details */}
              {analytics.qualityScore.strengths.length > 0 && (
                <div className="glass-card p-3 space-y-2">
                  <div className="text-xs font-bold text-success flex items-center gap-1">
                    <span>✓</span>
                    <span>Strengths</span>
                  </div>
                  <ul className="text-xs text-muted space-y-1">
                    {analytics.qualityScore.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analytics.qualityScore.weaknesses.length > 0 && (
                <div className="glass-card p-3 space-y-2">
                  <div className="text-xs font-bold text-warning flex items-center gap-1">
                    <span>⚠</span>
                    <span>Weaknesses</span>
                  </div>
                  <ul className="text-xs text-muted space-y-1">
                    {analytics.qualityScore.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Flags */}
              {analytics.riskScore.flags.length > 0 && (
                <div className="glass-card p-3 space-y-2 border border-orange-500/30">
                  <div className="text-xs font-bold text-orange-400 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Risk Alerts</span>
                  </div>
                  <ul className="text-xs text-orange-300/80 space-y-1">
                    {analytics.riskScore.reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Creator Info */}
      <div className="glass-card p-3 space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Creator</span>
          <code className="hash-code-small">
            {isOwner ? (
              <span className="text-gradient-primary font-bold">You</span>
            ) : (
              <>{pattern.creator.slice(0, 6)}...{pattern.creator.slice(-4)}</>
            )}
          </code>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Token ID</span>
          <span className="font-bold text-gradient-secondary">#{pattern.id}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        className={`btn ${
          pattern.isActive && !analytics?.circuitBreakerStatus.isTripped
            ? 'btn--primary'
            : 'btn--secondary'
        } btn--block`}
        disabled={!pattern.isActive || analytics?.circuitBreakerStatus.isTripped}
        onClick={() => onDelegateClick(pattern)}
      >
        <span>
          {analytics?.circuitBreakerStatus.isTripped
            ? '🛑 Circuit Breaker Active'
            : pattern.isActive
            ? '🤝 Delegate to Pattern'
            : '⏸ Pattern Inactive'}
        </span>
      </button>

      {/* ExecutionEngine Indicator */}
      {pattern.isActive && (
        <div className="mt-3">
          <ExecutionIndicator
            isActive={pattern.isActive && !analytics?.circuitBreakerStatus.isTripped}
            executionCount={(pattern.successfulExecutions || 0) + (pattern.failedExecutions || 0)}
            successRate={analytics ? analytics.riskScore.score : winRate}
          />
        </div>
      )}

      {/* Envio Badge */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-1 text-xs text-muted">
          <span>⚡</span>
          <span>Real-time analytics via Envio</span>
        </div>
      </div>
    </div>
  );
}
