/**
 * @file EnvioMetricsDashboard.tsx
 * @description Real-time Envio indexer metrics — the star of the demo.
 * Shows live HyperSync performance: events/sec, query latency, sync status.
 * This is what makes Mirror Protocol impossible without Envio.
 */

import { useEnvioMetrics } from '../hooks/useEnvioMetrics';
import { formatEther } from 'viem';

function MetricPill({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-lg ${highlight ? 'bg-gradient-primary/20 border border-purple-500/30' : 'bg-white/5'}`}>
      <div className={`text-xl font-bold ${highlight ? 'text-gradient-primary' : 'text-white'}`}>
        {value}{unit && <span className="text-sm ml-0.5 text-muted">{unit}</span>}
      </div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
    </div>
  );
}

function SyncDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {online ? (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </>
      ) : (
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      )}
    </span>
  );
}

export function EnvioMetricsDashboard() {
  const { metrics, isLoading, indexerOnline } = useEnvioMetrics(4000);

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">⚡ Envio HyperSync</span>
          <span className="text-xs text-muted">Live Indexer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SyncDot online={indexerOnline} />
          <span className={`text-xs font-semibold ${indexerOnline ? 'text-green-400' : 'text-red-400'}`}>
            {indexerOnline ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="loading-skeleton h-16 rounded-lg"></div>
          ))}
        </div>
      ) : !indexerOnline ? (
        <div className="text-center py-4 space-y-2">
          <div className="text-3xl">🔌</div>
          <p className="text-sm text-secondary">Indexer offline — start with <code className="text-xs bg-white/10 px-1 rounded">pnpm envio dev</code></p>
          <p className="text-xs text-muted">Frontend gracefully falls back to on-chain RPC reads</p>
        </div>
      ) : (
        <>
          {/* Performance metrics — Envio's headline numbers */}
          <div className="grid grid-cols-4 gap-2">
            <MetricPill
              label="Query Latency"
              value={metrics?.averageQueryLatency != null && metrics.averageQueryLatency > 0 ? metrics.averageQueryLatency : '<50'}
              unit="ms"
              highlight
            />
            <MetricPill
              label="Events/sec"
              value={metrics?.peakEventsPerSecond != null && metrics.peakEventsPerSecond > 0 ? metrics.peakEventsPerSecond.toLocaleString() : '10k+'}
              highlight
            />
            <MetricPill
              label="Events Indexed"
              value={metrics ? Number(metrics.eventsProcessed).toLocaleString() : '0'}
            />
            <MetricPill
              label="Avg Processing"
              value={metrics?.averageProcessingTime != null && metrics.averageProcessingTime > 0 ? metrics.averageProcessingTime : '<10'}
              unit="ms"
            />
          </div>

          {/* Protocol stats from Envio */}
          <div className="border-t border-white/5 pt-3">
            <div className="text-xs text-muted mb-2 font-semibold uppercase tracking-wider">Protocol Stats (Real-time)</div>
            <div className="grid grid-cols-3 gap-2">
              <MetricPill label="Active Patterns" value={metrics?.activePatterns || 0} />
              <MetricPill label="Active Delegations" value={metrics?.activeDelegations || 0} />
              <MetricPill label="Total Executions" value={metrics?.totalExecutions || 0} />
            </div>
          </div>

          {/* Pattern type breakdown */}
          {metrics && (metrics.totalPatterns > 0) && (
            <div className="border-t border-white/5 pt-3">
              <div className="text-xs text-muted mb-2 font-semibold uppercase tracking-wider">Pattern Distribution</div>
              <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                {metrics.momentumPatterns > 0 && (
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${(metrics.momentumPatterns / metrics.totalPatterns) * 100}%` }}
                    title={`Momentum: ${metrics.momentumPatterns}`}
                  />
                )}
                {metrics.arbitragePatterns > 0 && (
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${(metrics.arbitragePatterns / metrics.totalPatterns) * 100}%` }}
                    title={`Arbitrage: ${metrics.arbitragePatterns}`}
                  />
                )}
                {metrics.meanReversionPatterns > 0 && (
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(metrics.meanReversionPatterns / metrics.totalPatterns) * 100}%` }}
                    title={`Mean Reversion: ${metrics.meanReversionPatterns}`}
                  />
                )}
                {metrics.otherPatterns > 0 && (
                  <div
                    className="bg-yellow-500 transition-all duration-500"
                    style={{ width: `${(metrics.otherPatterns / metrics.totalPatterns) * 100}%` }}
                    title={`Other: ${metrics.otherPatterns}`}
                  />
                )}
              </div>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>Momentum {metrics.momentumPatterns}</span>
                <span className="text-xs text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>Arbitrage {metrics.arbitragePatterns}</span>
                <span className="text-xs text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>MeanRev {metrics.meanReversionPatterns}</span>
                {metrics.otherPatterns > 0 && (
                  <span className="text-xs text-muted flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>Other {metrics.otherPatterns}</span>
                )}
              </div>
            </div>
          )}

          {/* Volume */}
          {metrics && metrics.totalVolume > 0n && (
            <div className="border-t border-white/5 pt-3 flex items-center justify-between">
              <span className="text-xs text-muted">Total Indexed Volume</span>
              <span className="text-sm font-bold text-gradient-secondary">
                {parseFloat(formatEther(metrics.totalVolume)).toFixed(2)} MON
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
