import { useState } from 'react';
import { usePatterns, Pattern } from '../hooks/usePatterns';
import { CreateDelegationModal } from './CreateDelegationModal';
import { EnhancedPatternCard } from './EnhancedPatternCard';

export function PatternBrowser() {
  const { patterns, isLoading, error, usingTestData, isSyncing, refetch } = usePatterns();
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
              <span>⚠️</span>
              <span>Showing test data - Connect wallet for live data</span>
            </p>
          ) : isSyncing ? (
            <p className="text-sm text-blue-400 mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Envio indexer syncing - Using blockchain data</span>
            </p>
          ) : (
            <p className="text-sm text-muted mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>⚡ Real-time data from Envio GraphQL</span>
            </p>
          )}
        </div>

        <div className="glass-card px-4 py-2">
          <span className="text-sm font-semibold text-muted">{patterns.length} Patterns</span>
        </div>
      </div>

      {/* Pattern Grid - Now with Enhanced Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-animation">
        {patterns.map((pattern) => (
          <EnhancedPatternCard
            key={pattern.id}
            pattern={pattern}
            onDelegateClick={handleDelegateClick}
          />
        ))}
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
