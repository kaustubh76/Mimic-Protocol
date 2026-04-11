import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDelegations, type Delegation } from '../hooks/useDelegations';
import { useAccount } from 'wagmi';
import { useRevokeDelegation } from '../hooks/useRevokeDelegation';
import { UpdateDelegationModal } from './UpdateDelegationModal';
import { DelegationExecutionStats } from './DelegationExecutionStats';
import { ExecutionIndicator } from './ExecutionStats';
import { DelegationEarningsDisplay } from './DelegationEarningsDisplay';
import { EmptyState } from './EmptyState';
import { usePortfolioStats } from '../hooks/usePortfolioStats';
import { formatEther } from 'viem';

export function MyDelegations() {
  const { delegations, isLoading, error, usingTestData } = useDelegations();
  const { address, isConnected } = useAccount();
  const { revokeDelegation, isWriting: isRevoking } = useRevokeDelegation();
  const portfolioStats = usePortfolioStats(delegations);

  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const handleUpdateClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateModalClose = () => {
    setIsUpdateModalOpen(false);
    setSelectedDelegation(null);
  };

  const handleUpdateSuccess = () => {
    // Polling (every 12s) will pick up the updated delegation automatically.
    // Close modal — the user sees the change on next poll cycle.
    setIsUpdateModalOpen(false);
    setSelectedDelegation(null);
  };

  const handleRevokeClick = async (delegation: Delegation) => {
    const confirmed = window.confirm(
      `Are you sure you want to revoke your delegation to ${delegation.patternName}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setRevokingId(delegation.id);
      await revokeDelegation(delegation.delegationId);
      // Polling (every 12s) will pick up the revocation automatically.
    } catch (err) {
      console.error('Failed to revoke delegation:', err);
      setRevokingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Delegations</h2>
        <EmptyState
          icon="👛"
          title="Wallet Not Connected"
          description="Please connect your wallet to view your delegations"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Delegations</h2>

        {/* Loading Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="loading-skeleton h-6 w-48"></div>
                <div className="loading-skeleton h-6 w-20"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
              </div>
              <div className="loading-skeleton h-10 w-full"></div>
            </div>
          ))}
        </div>

        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 glass-card px-4 sm:px-6 py-4">
            <div className="spinner-small"></div>
            <span className="text-secondary">Loading your delegations from blockchain...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Delegations</h2>
        <EmptyState
          icon="❌"
          title="Error Loading Delegations"
          description={error.message}
          action={{ label: '🔄 Retry', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  if (delegations.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Delegations</h2>
        <EmptyState
          icon="📭"
          title="No Active Delegations"
          description="You haven't delegated to any trading patterns yet. Browse patterns to get started!"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">My Delegations</h2>
          {usingTestData ? (
            <p className="text-sm text-warning mt-1 flex items-center gap-2">
              <span>📊</span>
              <span>Showing demo data ({delegations.length} delegation{delegations.length !== 1 ? 's' : ''})</span>
            </p>
          ) : (
            <p className="text-sm text-muted mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Real-time data from Ethereum Sepolia ({delegations.length} delegation{delegations.length !== 1 ? 's' : ''})</span>
            </p>
          )}
        </div>

        <div className="glass-card px-4 py-2">
          <span className="text-sm font-semibold text-gradient-primary">
            {delegations.filter(d => d.isActive).length} Active
          </span>
        </div>
      </div>

      {/* Delegations List */}
      <div className="space-y-4">
        {delegations.map((delegation, index) => {
          const allocation = Number(delegation.percentageAllocation) / 100;
          const createdDate = new Date(Number(delegation.createdAt) * 1000);
          const isRecent = Date.now() - createdDate.getTime() < 60000; // Less than 1 minute

          return (
            <motion.div
              key={delegation.id}
              className="glass-card glass-card-hover p-4 sm:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.06, 0.3), duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">
                      {delegation.patternName}
                    </h3>
                    {isRecent && (
                      <span className="px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold animate-pulse">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    Pattern #{Number(delegation.patternTokenId)} · Delegation #{delegation.id}
                  </p>
                </div>

                {delegation.isActive ? (
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

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-gradient-primary mb-1">
                    {allocation}%
                  </div>
                  <div className="text-xs text-muted">Allocation</div>
                </div>

                {/* Real earnings from blockchain/Envio */}
                <DelegationEarningsDisplay
                  delegationId={delegation.delegationId}
                  isActive={delegation.isActive}
                  patternROI={delegation.patternROI || BigInt(0)}
                />

                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-gradient-accent mb-1">
                    {createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted">Created</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <span className="text-muted">Delegation Utilization</span>
                  <span className="font-bold text-gradient-primary">{allocation}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(allocation, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* ExecutionEngine Stats - REAL DATA from Envio/Blockchain */}
              <div className="mb-6">
                <DelegationExecutionStats
                  delegationId={delegation.delegationId}
                  isActive={delegation.isActive}
                />
              </div>

              {/* Account Info */}
              <div className="glass-card p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <span className="text-muted">Smart Account</span>
                  <code className="hash-code-small">
                    {delegation.smartAccountAddress.slice(0, 6)}...{delegation.smartAccountAddress.slice(-4)}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  className="btn btn--secondary"
                  disabled={!delegation.isActive || isRevoking}
                  title="Update allocation percentage"
                  onClick={() => handleUpdateClick(delegation)}
                >
                  <span>📊 Update</span>
                </button>
                <button
                  className="btn btn--ghost border border-error/30 hover:bg-error/10 hover:border-error"
                  disabled={!delegation.isActive || revokingId === delegation.id}
                  title="Revoke this delegation"
                  onClick={() => handleRevokeClick(delegation)}
                >
                  {revokingId === delegation.id ? (
                    <>
                      <div className="spinner-small"></div>
                      <span className="text-error">Revoking...</span>
                    </>
                  ) : (
                    <span className="text-error">❌ Revoke</span>
                  )}
                </button>
              </div>

              {!delegation.isActive && (
                <div className="mt-4 text-xs text-center text-muted bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
                  This delegation has been revoked and is no longer active
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Portfolio Summary Dashboard */}
      <div className="glass-card p-4 sm:p-6">
        <h3 className="font-bold mb-4 text-lg">Portfolio Summary</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Delegations */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient-primary mb-1">
              {delegations.filter(d => d.isActive).length}
            </div>
            <div className="text-xs text-muted">Active Delegations</div>
          </div>

          {/* Total Volume */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient-secondary mb-1">
              {portfolioStats.totalVolume > 0
                ? parseFloat(formatEther(portfolioStats.totalVolume)).toFixed(2)
                : '0.00'}
            </div>
            <div className="text-xs text-muted">Total Volume (WETH)</div>
          </div>

          {/* Total Earnings */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gradient-accent mb-1">
              {portfolioStats.totalEarnings > 0
                ? parseFloat(formatEther(portfolioStats.totalEarnings)).toFixed(4)
                : '0.00'}
            </div>
            <div className="text-xs text-muted">Total Earnings (WETH)</div>
          </div>

          {/* Total Executions */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-300 mb-1">
              {portfolioStats.totalExecutions}
            </div>
            <div className="text-xs text-muted">
              Total Executions
              {portfolioStats.totalExecutions > 0 && (
                <div className="text-[10px] text-green-400 mt-0.5">
                  {portfolioStats.successfulExecutions} successful
                </div>
              )}
            </div>
          </div>
        </div>

        {portfolioStats.totalExecutions === 0 && (
          <div className="mt-4 text-center text-sm text-muted bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            Trades will execute automatically when pattern conditions match. Stats will update in real-time via Envio.
          </div>
        )}
      </div>

      {/* Update Delegation Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && (
          <UpdateDelegationModal
            isOpen={isUpdateModalOpen}
            onClose={handleUpdateModalClose}
            delegation={selectedDelegation}
            onSuccess={handleUpdateSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
