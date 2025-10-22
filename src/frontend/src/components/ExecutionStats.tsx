import { useEffect, useState } from 'react';

/**
 * Execution statistics for a delegation
 * Mirrors ExecutionEngine.sol ExecutionStats struct
 */
export interface ExecutionStats {
  delegationId: bigint;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalVolumeExecuted: bigint;
  totalGasUsed: bigint;
  lastExecutionTime: number;
}

interface ExecutionStatsDisplayProps {
  delegationId: bigint;
  stats?: ExecutionStats;
  isLoading?: boolean;
}

/**
 * Display execution statistics for a delegation
 * Shows automation metrics from ExecutionEngine
 */
export function ExecutionStatsDisplay({ delegationId, stats, isLoading }: ExecutionStatsDisplayProps) {
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago display
  useEffect(() => {
    if (!stats?.lastExecutionTime) return;

    const updateTimeAgo = () => {
      const now = Date.now();
      const lastExecution = stats.lastExecutionTime * 1000;
      const diffMs = now - lastExecution;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) setTimeAgo('just now');
      else if (diffMins < 60) setTimeAgo(`${diffMins}m ago`);
      else if (diffHours < 24) setTimeAgo(`${diffHours}h ago`);
      else setTimeAgo(`${diffDays}d ago`);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [stats?.lastExecutionTime]);

  if (isLoading) {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="spinner-small"></div>
          <span className="text-sm text-muted">Loading execution stats...</span>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalExecutions === 0) {
    return (
      <div className="glass-card p-4 text-center space-y-2">
        <div className="text-3xl">⏳</div>
        <div className="text-sm text-muted">No executions yet</div>
        <div className="text-xs text-muted">Pattern will execute automatically when conditions match</div>
      </div>
    );
  }

  const successRate = stats.totalExecutions > 0
    ? (stats.successfulExecutions / stats.totalExecutions) * 100
    : 0;

  const avgGasPerExecution = stats.totalExecutions > 0
    ? Number(stats.totalGasUsed) / stats.totalExecutions
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <span>⚡</span>
          <span>Execution Statistics</span>
        </h4>
        {stats.lastExecutionTime > 0 && (
          <div className="text-xs text-muted">
            Last: {timeAgo}
          </div>
        )}
      </div>

      {/* Success Rate Ring */}
      <div className="flex items-center justify-center py-4">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Success rate arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={successRate >= 75 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${successRate * 2.51} 251.2`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-bold ${successRate >= 75 ? 'text-success' : successRate >= 50 ? 'text-warning' : 'text-error'}`}>
              {successRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Executions */}
        <div className="glass-card p-3 space-y-1">
          <div className="text-xs text-muted">Total Executions</div>
          <div className="text-xl font-bold text-gradient-primary">
            {stats.totalExecutions}
          </div>
        </div>

        {/* Successful */}
        <div className="glass-card p-3 space-y-1">
          <div className="text-xs text-muted">Successful</div>
          <div className="text-xl font-bold text-success">
            {stats.successfulExecutions}
          </div>
        </div>

        {/* Failed */}
        <div className="glass-card p-3 space-y-1">
          <div className="text-xs text-muted">Failed</div>
          <div className="text-xl font-bold text-error">
            {stats.failedExecutions}
          </div>
        </div>

        {/* Volume */}
        <div className="glass-card p-3 space-y-1">
          <div className="text-xs text-muted">Volume Executed</div>
          <div className="text-xl font-bold text-gradient-secondary">
            {(Number(stats.totalVolumeExecuted) / 1e18).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Gas Efficiency */}
      <div className="glass-card p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Avg Gas per Execution</span>
          <span className="font-bold text-gradient-accent">
            {avgGasPerExecution.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Total Gas Used</span>
          <span className="font-mono text-muted">
            {Number(stats.totalGasUsed).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Envio Badge */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1 text-xs text-muted">
          <span>⚡</span>
          <span>Automated via ExecutionEngine</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact execution indicator for pattern cards
 */
interface ExecutionIndicatorProps {
  isActive: boolean;
  executionCount: number;
  successRate: number;
}

export function ExecutionIndicator({ isActive, executionCount, successRate }: ExecutionIndicatorProps) {
  if (!isActive) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs">
        <span>⏸</span>
        <span>Automation Paused</span>
      </div>
    );
  }

  if (executionCount === 0) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
        </span>
        <span>Awaiting Execution</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${
      successRate >= 75
        ? 'bg-green-500/20 border-green-500/30 text-green-400'
        : successRate >= 50
        ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
        : 'bg-red-500/20 border-red-500/30 text-red-400'
    }`}>
      <span>⚡</span>
      <span>{executionCount} executions</span>
      <span>•</span>
      <span>{successRate.toFixed(0)}% success</span>
    </div>
  );
}

/**
 * Live execution log
 */
interface ExecutionLogEntry {
  timestamp: number;
  success: boolean;
  volume: bigint;
  gasUsed: bigint;
}

interface ExecutionLogProps {
  logs: ExecutionLogEntry[];
  maxEntries?: number;
}

export function ExecutionLog({ logs, maxEntries = 10 }: ExecutionLogProps) {
  const displayLogs = logs.slice(0, maxEntries);

  if (displayLogs.length === 0) {
    return (
      <div className="glass-card p-6 text-center space-y-2">
        <div className="text-3xl">📋</div>
        <div className="text-sm text-muted">No execution history</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <h4 className="text-sm font-bold flex items-center gap-2">
        <span>📋</span>
        <span>Recent Executions</span>
      </h4>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {displayLogs.map((log, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            {/* Status Icon */}
            <div className={`text-lg ${log.success ? 'text-success' : 'text-error'}`}>
              {log.success ? '✅' : '❌'}
            </div>

            {/* Info */}
            <div className="flex-1 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted">
                  {new Date(log.timestamp * 1000).toLocaleTimeString()}
                </span>
                <span className="font-bold">
                  {(Number(log.volume) / 1e18).toFixed(4)} VOL
                </span>
              </div>
              <div className="text-muted">
                Gas: {Number(log.gasUsed).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
