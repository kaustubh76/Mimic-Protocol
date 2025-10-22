import { RiskScore, QualityScore } from '../hooks/usePatternAnalytics';

interface RiskScoreBadgeProps {
  riskScore: RiskScore;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskScoreBadge({ riskScore, size = 'md' }: RiskScoreBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const levelConfig = {
    SAFE: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/40',
      text: 'text-green-400',
      icon: '✅',
      label: 'SAFE',
    },
    MODERATE: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/40',
      text: 'text-yellow-400',
      icon: '⚠️',
      label: 'MODERATE',
    },
    RISKY: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/40',
      text: 'text-orange-400',
      icon: '⚡',
      label: 'RISKY',
    },
    DANGEROUS: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
      icon: '🛑',
      label: 'DANGER',
    },
  };

  const config = levelConfig[riskScore.level];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border font-bold ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]}`}
      title={`Risk Score: ${riskScore.score}/100 - ${riskScore.reasons.join(', ') || 'No issues detected'}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      <span className="font-mono">{riskScore.score}</span>
    </div>
  );
}

interface QualityGradeBadgeProps {
  qualityScore: QualityScore;
  size?: 'sm' | 'md' | 'lg';
}

export function QualityGradeBadge({ qualityScore, size = 'md' }: QualityGradeBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const gradeConfig: Record<QualityScore['grade'], { color: string; label: string }> = {
    'A+': { color: 'text-green-400', label: 'Elite' },
    'A': { color: 'text-green-400', label: 'Excellent' },
    'B': { color: 'text-blue-400', label: 'Good' },
    'C': { color: 'text-yellow-400', label: 'Fair' },
    'D': { color: 'text-orange-400', label: 'Poor' },
    'F': { color: 'text-red-400', label: 'Failing' },
  };

  const config = gradeConfig[qualityScore.grade];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 font-bold ${sizeClasses[size]}`}
      title={`Quality Score: ${qualityScore.score}/100\nStrengths: ${qualityScore.strengths.join(', ') || 'None'}\nWeaknesses: ${qualityScore.weaknesses.join(', ') || 'None'}`}
    >
      <span className={config.color}>Grade {qualityScore.grade}</span>
      <span className="text-muted">•</span>
      <span className="text-gradient-primary">{qualityScore.score}</span>
    </div>
  );
}

interface CircuitBreakerAlertProps {
  isTripped: boolean;
  reason?: string;
  cooldownEnd?: number;
}

export function CircuitBreakerAlert({ isTripped, reason, cooldownEnd }: CircuitBreakerAlertProps) {
  if (!isTripped) return null;

  const timeRemaining = cooldownEnd ? Math.max(0, cooldownEnd - Date.now()) : 0;
  const hoursRemaining = Math.floor(timeRemaining / 3600000);
  const minutesRemaining = Math.floor((timeRemaining % 3600000) / 60000);

  return (
    <div className="glass-card p-4 border-2 border-red-500/50 bg-red-500/10 space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🛑</span>
        <div className="flex-1">
          <div className="font-bold text-red-400 mb-1">Circuit Breaker Activated</div>
          <p className="text-sm text-red-300">{reason || 'Pattern has been automatically paused for safety'}</p>
          {cooldownEnd && timeRemaining > 0 && (
            <div className="mt-2 text-xs text-red-300/80">
              Cooldown: {hoursRemaining}h {minutesRemaining}m remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrendingBadgeProps {
  isTrending: boolean;
  reason?: string;
}

export function TrendingBadge({ isTrending, reason }: TrendingBadgeProps) {
  if (!isTrending) return null;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold animate-pulse"
      title={reason || 'This pattern is trending'}
    >
      <span>🔥</span>
      <span>TRENDING</span>
    </div>
  );
}

interface HealthMetricsProps {
  consecutiveLosses: number;
  maxDrawdown: number;
  sharpeRatio: number;
  consistency: number;
}

export function HealthMetrics({ consecutiveLosses, maxDrawdown, sharpeRatio, consistency }: HealthMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {/* Consecutive Losses */}
      <div className="glass-card p-2 space-y-1">
        <div className="text-muted">Consecutive Losses</div>
        <div className={`font-bold ${consecutiveLosses >= 5 ? 'text-error' : consecutiveLosses >= 3 ? 'text-warning' : 'text-success'}`}>
          {consecutiveLosses}
          {consecutiveLosses >= 5 && ' ⚠️'}
        </div>
      </div>

      {/* Max Drawdown */}
      <div className="glass-card p-2 space-y-1">
        <div className="text-muted">Max Drawdown</div>
        <div className={`font-bold ${maxDrawdown >= 30 ? 'text-error' : maxDrawdown >= 20 ? 'text-warning' : 'text-success'}`}>
          {maxDrawdown.toFixed(1)}%
        </div>
      </div>

      {/* Sharpe Ratio */}
      <div className="glass-card p-2 space-y-1">
        <div className="text-muted">Sharpe Ratio</div>
        <div className={`font-bold ${sharpeRatio >= 2 ? 'text-success' : sharpeRatio >= 1 ? 'text-warning' : 'text-error'}`}>
          {sharpeRatio.toFixed(2)}
        </div>
      </div>

      {/* Consistency */}
      <div className="glass-card p-2 space-y-1">
        <div className="text-muted">Consistency</div>
        <div className="font-bold text-gradient-primary">
          {(consistency * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
