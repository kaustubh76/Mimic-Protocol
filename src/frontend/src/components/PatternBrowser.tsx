import { useState } from 'react';
import { usePatterns, Pattern } from '../hooks/usePatterns';
import { formatEther } from 'viem';
import { CreateDelegationModal } from './CreateDelegationModal';

export function PatternBrowser() {
  const { patterns, isLoading, error, usingTestData, refetch } = usePatterns();
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelegateClick = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPattern(null);
  };

  const handleDelegationSuccess = () => {
    // Refetch patterns to update any delegation counts
    if (refetch) refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Available Trading Patterns</h2>
        </div>

        {/* Loading Skeletons */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="loading-skeleton h-6 w-3/4"></div>
              <div className="loading-skeleton h-20 w-full"></div>
              <div className="loading-skeleton h-10 w-full"></div>
            </div>
          ))}
        </div>

        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 glass-card px-6 py-4">
            <div className="spinner-small"></div>
            <span className="text-secondary">Loading patterns from blockchain...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Available Trading Patterns</h2>

        <div className="glass-card p-12 text-center space-y-6">
          <div className="text-6xl">❌</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-error">Error Loading Patterns</h3>
            <p className="text-secondary">{error.message}</p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            <span>🔄 Retry</span>
          </button>
        </div>
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Available Trading Patterns</h2>

        <div className="glass-card p-12 text-center space-y-6">
          <div className="text-6xl">🔍</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No Patterns Found</h3>
            <p className="text-secondary">
              Trading patterns will appear here once they are minted on-chain
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Available Trading Patterns</h2>
          {usingTestData ? (
            <p className="text-sm text-warning mt-1 flex items-center gap-2">
              <span>📊</span>
              <span>Showing demo data (RPC unavailable or no patterns on-chain)</span>
            </p>
          ) : (
            <p className="text-sm text-muted mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Real-time data from Monad testnet</span>
            </p>
          )}
        </div>

        <div className="glass-card px-4 py-2">
          <span className="text-sm font-semibold text-muted">{patterns.length} Patterns</span>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation">
        {patterns.map((pattern) => {
          const winRate = Number(pattern.winRate) / 100;
          const volume = formatEther(pattern.totalVolume);
          const roi = Number(pattern.roi) / 100;

          return (
            <div key={pattern.id} className="pattern-card">
              {/* Card Header */}
              <div className="pattern-header">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`pattern-badge pattern-badge--${pattern.patternType}`}>
                        {pattern.patternType.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">
                      Pattern #{pattern.id}
                    </h3>
                  </div>

                  {pattern.isActive ? (
                    <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </span>
                      ACTIVE
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs font-bold">
                      INACTIVE
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
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
                  <span className="font-bold text-gradient-primary">{winRate}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(winRate, 100)}%`,
                      animation: 'slideRight 1s ease-out'
                    }}
                  ></div>
                </div>
              </div>

              {/* Creator Info */}
              <div className="glass-card p-3 space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Creator</span>
                  <code className="hash-code-small">
                    {pattern.creator.slice(0, 6)}...{pattern.creator.slice(-4)}
                  </code>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Token ID</span>
                  <span className="font-bold text-gradient-secondary">#{pattern.id}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`btn ${pattern.isActive ? 'btn--primary' : 'btn--secondary'} btn--block`}
                disabled={!pattern.isActive}
                onClick={() => handleDelegateClick(pattern)}
              >
                <span>{pattern.isActive ? '🤝 Delegate to Pattern' : '⏸ Pattern Inactive'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Delegation Modal */}
      {selectedPattern && (
        <CreateDelegationModal
          pattern={selectedPattern}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleDelegationSuccess}
        />
      )}
    </div>
  );
}

// Add slideRight animation to CSS if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes slideRight {
    from {
      width: 0;
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
if (!document.querySelector('style[data-pattern-animations]')) {
  style.setAttribute('data-pattern-animations', 'true');
  document.head.appendChild(style);
}
