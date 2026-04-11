import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { useLiveExecutions } from '../hooks/useLiveExecutions';

const EXPLORER_URL = 'https://sepolia.etherscan.io';

function timeAgo(timestamp: string): string {
  const now = Math.floor(Date.now() / 1000);
  const then = parseInt(timestamp);
  const diff = now - then;
  if (diff < 0) return 'just now';
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function shortenHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr || '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Force re-render every second to keep "Xs ago" fresh
function useTimeRefresh() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
}

export function LiveExecutionFeed() {
  const { executions, isLoading, queryLatency } = useLiveExecutions(5000);
  useTimeRefresh();

  const successCount = executions.filter(e => e.success).length;
  const totalVolume = executions.reduce((sum, e) => sum + BigInt(e.amount || '0'), 0n);

  return (
    <div className="glass-card p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Live Execution Feed
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">{queryLatency}ms</span>
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-[10px]">
            LIVE
          </span>
        </div>
      </div>

      {/* Summary bar */}
      {executions.length > 0 && (
        <div className="flex items-center gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
            <span className="text-green-400 font-bold">{successCount}</span>
            <span className="text-muted">success</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
            <span className="text-purple-400 font-bold">{parseFloat(formatEther(totalVolume)).toFixed(4)}</span>
            <span className="text-muted">WETH vol</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5">
            <span className="text-blue-400 font-bold">{executions.length}</span>
            <span className="text-muted">trades</span>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="loading-skeleton h-14 w-full rounded-lg"></div>
            ))}
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">📡</div>
            <p className="text-sm text-muted">Waiting for trade executions...</p>
            <p className="text-xs text-muted mt-1">Run <code className="text-purple-400">npm run bot</code> to start</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            <AnimatePresence mode="popLayout">
              {executions.map((exec) => (
                <motion.div
                  key={exec.id}
                  layout
                  initial={exec.isNew ? { opacity: 0, x: -20, scale: 0.97 } : false}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 sm:p-3 rounded-lg border transition-all ${
                    exec.isNew
                      ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Left: Status + Info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      exec.success
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      <span className="text-sm">{exec.success ? '✓' : '✗'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-sm flex-wrap">
                        <span className="font-bold text-white">
                          D#{exec.delegationId}
                        </span>
                        <span className="text-muted text-xs">→</span>
                        <span className="text-purple-400 font-mono text-xs">
                          P#{exec.patternTokenId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5">
                        <span>{shortenAddress(exec.executor)}</span>
                        {exec.txHash && (
                          <a
                            href={`${EXPLORER_URL}/tx/${exec.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono hover:text-purple-400 transition-colors"
                            title="View on Sepolia Etherscan"
                          >
                            {shortenHash(exec.txHash)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount + Time */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pl-10 sm:pl-0">
                    <div className="sm:text-right">
                      <div className="text-sm font-bold text-white">
                        {parseFloat(formatEther(BigInt(exec.amount))).toFixed(4)}
                      </div>
                      <div className="text-[10px] text-muted">WETH</div>
                    </div>
                    <div className="text-right min-w-[55px]">
                      <div className={`text-[10px] font-bold uppercase ${
                        exec.success ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {exec.success ? 'success' : 'failed'}
                      </div>
                      <div className="text-[10px] text-muted">
                        {timeAgo(exec.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-muted">
        <div className="flex items-center gap-1">
          <span>⚡</span>
          <span>Indexed by Envio HyperSync</span>
        </div>
        <span>Auto-refresh 5s</span>
      </div>
    </div>
  );
}
