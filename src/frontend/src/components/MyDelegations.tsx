import { useDelegations } from '../hooks/useDelegations';
import { useAccount } from 'wagmi';

export function MyDelegations() {
  const { delegations, isLoading, error, usingTestData } = useDelegations();
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">My Delegations</h2>
        <div className="glass-card p-12 text-center space-y-6">
          <div className="text-6xl">👛</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Wallet Not Connected</h3>
            <p className="text-secondary">
              Please connect your wallet to view your delegations
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">My Delegations</h2>

        {/* Loading Skeletons */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="loading-skeleton h-6 w-48"></div>
                <div className="loading-skeleton h-6 w-20"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
                <div className="loading-skeleton h-12 w-full"></div>
              </div>
              <div className="loading-skeleton h-10 w-full"></div>
            </div>
          ))}
        </div>

        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 glass-card px-6 py-4">
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
        <h2 className="text-3xl font-bold">My Delegations</h2>

        <div className="glass-card p-12 text-center space-y-6">
          <div className="text-6xl">❌</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-error">Error Loading Delegations</h3>
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

  if (delegations.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">My Delegations</h2>

        <div className="glass-card p-12 text-center space-y-6">
          <div className="text-6xl">📭</div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">No Active Delegations</h3>
            <p className="text-secondary">
              You haven't delegated to any trading patterns yet
            </p>
          </div>
          <button
            className="btn btn--primary"
            onClick={() => {
              const patternsTab = document.querySelector('[data-tab="patterns"]') as HTMLButtonElement;
              if (patternsTab) patternsTab.click();
            }}
          >
            <span>🔍 Browse Patterns</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">My Delegations</h2>
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
              <span>Real-time data from Monad testnet ({delegations.length} delegation{delegations.length !== 1 ? 's' : ''})</span>
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
      <div className="space-y-4 stagger-animation">
        {delegations.map((delegation) => {
          const allocation = Number(delegation.percentageAllocation) / 100;
          const createdDate = new Date(Number(delegation.createdAt) * 1000);
          const isRecent = Date.now() - createdDate.getTime() < 60000; // Less than 1 minute

          return (
            <div key={delegation.id} className="glass-card glass-card-hover p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">
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
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-gradient-primary mb-1">
                    {allocation}%
                  </div>
                  <div className="text-xs text-muted">Allocation</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-gradient-secondary mb-1">
                    0.00
                  </div>
                  <div className="text-xs text-muted">Earnings (MONAD)</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-gradient-accent mb-1">
                    {createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-muted">Created</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Delegation Utilization</span>
                  <span className="font-bold text-gradient-primary">{allocation}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(allocation, 100)}%`,
                      animation: 'slideRight 1s ease-out'
                    }}
                  ></div>
                </div>
              </div>

              {/* Account Info */}
              <div className="glass-card p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Smart Account</span>
                  <code className="hash-code-small">
                    {delegation.smartAccountAddress.slice(0, 6)}...{delegation.smartAccountAddress.slice(-4)}
                  </code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="btn btn--secondary"
                  disabled={!delegation.isActive}
                  title="Update allocation percentage"
                >
                  <span>📊 Update</span>
                </button>
                <button
                  className="btn btn--ghost border border-error/30 hover:bg-error/10 hover:border-error"
                  disabled={!delegation.isActive}
                  title="Revoke this delegation"
                >
                  <span className="text-error">❌ Revoke</span>
                </button>
              </div>

              {!delegation.isActive && (
                <div className="mt-4 text-xs text-center text-muted bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
                  This delegation has been revoked and is no longer active
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold mb-1">Total Active Delegations</h3>
            <p className="text-sm text-muted">
              You're delegating to {delegations.filter(d => d.isActive).length} trading pattern{delegations.filter(d => d.isActive).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gradient-primary">
              {delegations.filter(d => d.isActive).length}
            </div>
            <div className="text-xs text-muted">Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}
