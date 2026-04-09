import { motion } from 'framer-motion';

interface EnvioDataFlowProps {
  queryLatency?: number;
  eventsPerSecond?: number;
  isLive?: boolean;
}

const topRow = [
  { id: 'delegate', label: 'User Delegates', icon: '👤', sub: 'On-chain tx' },
  { id: 'onchain', label: 'Monad Event', icon: '⛓', sub: 'Block confirmed' },
  { id: 'envio', label: 'Envio HyperSync', icon: '⚡', sub: '', highlight: true },
  { id: 'graphql', label: 'GraphQL API', icon: '📊', sub: 'Queryable' },
];

const bottomRow = [
  { id: 'frontend', label: 'Live Dashboard', icon: '📱', sub: 'UI updates' },
  { id: 'detect', label: 'Pattern Detect', icon: '🔍', sub: 'Auto-detect' },
  { id: 'execute', label: 'Execute Trade', icon: '🔄', sub: 'On-chain tx' },
  { id: 'bot', label: 'Executor Bot', icon: '🤖', sub: 'Envio-driven' },
];

function FlowArrow({ direction, delay = 0 }: { direction: 'right' | 'left' | 'down'; delay?: number }) {
  const char = direction === 'right' ? '→' : direction === 'left' ? '←' : '↓';
  return (
    <motion.span
      className="text-purple-400/60 text-xs font-bold"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.2, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      {char}
    </motion.span>
  );
}

function FlowNode({ node, index, isLive, queryLatency }: {
  node: typeof topRow[0];
  index: number;
  isLive: boolean;
  queryLatency: number;
}) {
  const isHighlight = 'highlight' in node && node.highlight;

  return (
    <motion.div
      className={`relative p-2 sm:p-3 rounded-lg border text-center ${
        isHighlight
          ? 'bg-purple-500/15 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
          : 'bg-white/[0.03] border-white/10'
      }`}
      animate={isLive ? {
        borderColor: [
          isHighlight ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)',
          isHighlight ? 'rgba(168,85,247,0.8)' : 'rgba(255,255,255,0.25)',
          isHighlight ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)',
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3, ease: 'easeInOut' }}
    >
      <div className="text-base sm:text-lg mb-0.5">{node.icon}</div>
      <div className="text-[9px] sm:text-[10px] font-bold text-white leading-tight">{node.label}</div>
      {node.id === 'envio' ? (
        <div className="text-[8px] sm:text-[9px] text-purple-300 mt-0.5 font-mono">&lt;{queryLatency}ms</div>
      ) : node.sub ? (
        <div className="text-[8px] sm:text-[9px] text-muted mt-0.5">{node.sub}</div>
      ) : null}
    </motion.div>
  );
}

export function EnvioDataFlow({ queryLatency = 7, eventsPerSecond = 0, isLive = true }: EnvioDataFlowProps) {
  return (
    <div className="glass-card p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <span>🔄</span>
          <span>Envio Feedback Loop</span>
        </h4>
        {isLive && (
          <motion.span
            className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-bold"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ACTIVE
          </motion.span>
        )}
      </div>

      {/* Top Row: Indexing flow → */}
      <div className="mb-1">
        <div className="text-[9px] text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1">
          <span>Indexing Flow</span>
          <FlowArrow direction="right" />
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {topRow.map((node, i) => (
            <FlowNode key={node.id} node={node} index={i} isLive={isLive} queryLatency={queryLatency} />
          ))}
        </div>
      </div>

      {/* Connection arrows ↓ */}
      <div className="flex justify-between px-4 py-1.5">
        <FlowArrow direction="down" delay={1.2} />
        <FlowArrow direction="down" delay={0} />
      </div>

      {/* Bottom Row: Execution feedback ← */}
      <div className="mb-4">
        <div className="text-[9px] text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1">
          <FlowArrow direction="left" delay={0.6} />
          <span>Execution Feedback</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {bottomRow.map((node, i) => (
            <FlowNode key={node.id} node={node} index={i + 4} isLive={isLive} queryLatency={queryLatency} />
          ))}
        </div>
      </div>

      {/* Performance comparison */}
      <div className="mt-auto pt-3 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-muted">Index:</span>
              <span className="font-bold text-purple-400">&lt;50ms</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <span className="text-muted">Query:</span>
              <span className="font-bold text-green-400">{queryLatency}ms</span>
            </div>
            {eventsPerSecond > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-muted">Peak:</span>
                <span className="font-bold text-blue-400">{eventsPerSecond} evt/s</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-muted/60">
            RPC alternative: 2-5s latency
          </div>
        </div>
      </div>
    </div>
  );
}
