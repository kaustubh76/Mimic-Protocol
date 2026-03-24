import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePatterns, Pattern } from '../hooks/usePatterns';
import { CreateDelegationModal } from './CreateDelegationModal';
import { EnhancedPatternCard } from './EnhancedPatternCard';
import { EmptyState } from './EmptyState';

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

        {/* Loading Skeletons — match card structure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className="glass-card p-6 space-y-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            >
              {/* Badge + title */}
              <div className="flex items-center gap-2">
                <div className="loading-skeleton h-6 w-24 rounded-full"></div>
                <div className="loading-skeleton h-5 w-16 rounded-full"></div>
              </div>
              <div className="loading-skeleton h-6 w-40"></div>
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
              </div>
              {/* Progress bar */}
              <div className="loading-skeleton h-2 w-full rounded-full"></div>
              {/* Button */}
              <div className="loading-skeleton h-10 w-full rounded-lg"></div>
            </motion.div>
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
        <EmptyState
          icon="❌"
          title="Error Loading Patterns"
          description={error.message}
          action={{ label: '🔄 Retry', onClick: () => refetch() }}
        />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Available Trading Patterns</h2>
        <EmptyState
          icon="🔍"
          title="No Patterns Found"
          description="Trading patterns will appear here once they are minted on-chain"
        />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {patterns.map((pattern, index) => (
          <motion.div
            key={pattern.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.3 }}
          >
            <EnhancedPatternCard
              pattern={pattern}
              onDelegateClick={handleDelegateClick}
            />
          </motion.div>
        ))}
      </div>

      {/* Delegation Modal */}
      <AnimatePresence>
        {selectedPattern && isModalOpen && (
          <CreateDelegationModal
            pattern={selectedPattern}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            onSuccess={handleDelegationSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
