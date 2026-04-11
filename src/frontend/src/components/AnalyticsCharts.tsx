import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { useAnalyticsData } from '../hooks/useAnalyticsData';

const COLORS = {
  primary: '#8B5CF6',
  secondary: '#06B6D4',
  accent: '#F59E0B',
  success: '#10B981',
  pink: '#EC4899',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1 border border-white/10">
      <div className="font-bold text-white">{label}</div>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted">{entry.name}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            {entry.name.includes('ROI') || entry.name.includes('Win') ? '%' : ''}
            {entry.name.includes('Volume') ? ' WETH' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsCharts() {
  const { patternROI, executionTimeline, isLoading } = useAnalyticsData(8000);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-4 sm:p-6">
          <div className="loading-skeleton h-6 w-48 mb-4"></div>
          <div className="loading-skeleton h-64 w-full rounded-lg"></div>
        </div>
        <div className="glass-card p-4 sm:p-6">
          <div className="loading-skeleton h-6 w-48 mb-4"></div>
          <div className="loading-skeleton h-64 w-full rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Pattern ROI Comparison */}
      <motion.div
        className="glass-card p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>📊</span>
            Pattern ROI Comparison
          </h3>
          <span className="text-xs text-muted">{patternROI.length} active patterns</span>
        </div>

        {patternROI.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={patternROI} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717A', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#71717A', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.1)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }}
              />
              <Bar dataKey="roi" name="ROI" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              <Bar dataKey="winRate" name="Win Rate" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted text-sm">
            No pattern data available yet
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-muted text-center">
          Real-time data from Envio HyperSync
        </div>
      </motion.div>

      {/* Trade Execution Timeline */}
      <motion.div
        className="glass-card p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>📈</span>
            Execution Volume Timeline
          </h3>
          <span className="text-xs text-muted">{executionTimeline.reduce((s, d) => s + d.executions, 0)} trades</span>
        </div>

        {executionTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={executionTimeline} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#71717A', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }}
              />
              <Area
                type="monotone"
                dataKey="cumVolume"
                name="Cumulative Volume"
                stroke={COLORS.primary}
                fill="url(#gradVolume)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="cumExecutions"
                name="Total Executions"
                stroke={COLORS.success}
                fill="url(#gradExec)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted text-sm">
            No execution data available yet
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-white/5 text-xs text-muted text-center">
          Indexed in real-time by Envio — sub-50ms latency
        </div>
      </motion.div>
    </div>
  );
}
