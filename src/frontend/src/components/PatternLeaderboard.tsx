import { usePatterns } from '../hooks/usePatterns';
import { usePatternLeaderboard } from '../hooks/usePatternAnalytics';
import { formatEther } from 'viem';

export function PatternLeaderboard() {
  const { patterns, isLoading } = usePatterns();
  const leaderboard = usePatternLeaderboard(patterns, 10);

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🏆</span>
          <span>Top Performing Patterns</span>
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-skeleton h-16 w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🏆</span>
          <span>Top Performing Patterns</span>
        </h3>
        <div className="text-center py-8 text-muted">
          <div className="text-4xl mb-2">📊</div>
          <p>No patterns available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span>🏆</span>
          <span>Top Performing Patterns</span>
        </h3>
        <div className="text-xs text-muted">
          Powered by Envio Analytics
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map(({ pattern, score }, index) => {
          const winRate = Number(pattern.winRate) / 100;
          const roi = Number(pattern.roi) / 100;
          const volume = formatEther(pattern.totalVolume || BigInt(0));

          // Medal emojis for top 3
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

          return (
            <div
              key={pattern.id}
              className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">
                  {medal}
                </div>

                {/* Pattern Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Pattern #{pattern.id}</span>
                      <span className={`pattern-badge pattern-badge--${pattern.patternType} text-xs`}>
                        {pattern.patternType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-gradient-primary">
                      Score: {score.toFixed(0)}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted">Win:</span>
                      <span className="font-bold text-success">{winRate}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted">ROI:</span>
                      <span className={`font-bold ${roi >= 0 ? 'text-success' : 'text-error'}`}>
                        {roi > 0 ? '+' : ''}{roi}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted">Vol:</span>
                      <span className="font-bold">{parseFloat(volume).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* View Arrow */}
                <div className="text-muted group-hover:text-primary transition-colors">
                  →
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {leaderboard.length >= 10 && (
        <div className="mt-4 text-center">
          <button className="btn btn--secondary btn--sm">
            View All Patterns →
          </button>
        </div>
      )}
    </div>
  );
}
