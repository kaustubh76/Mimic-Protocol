import { useState, useEffect, useCallback } from 'react';
import { ENVIO_GRAPHQL_URL } from '../contracts/config';

export interface PatternROIData {
  name: string;
  roi: number;
  winRate: number;
  volume: number;
  type: string;
}

export interface ExecutionTimelineData {
  time: string;
  timestamp: number;
  cumVolume: number;
  executions: number;
  cumExecutions: number;
  success: number;
}

export interface AnalyticsData {
  patternROI: PatternROIData[];
  executionTimeline: ExecutionTimelineData[];
  isLoading: boolean;
}

const ANALYTICS_QUERY = `
  query GetAnalyticsData {
    Pattern(order_by: {roi: desc}, where: {isActive: {_eq: true}}) {
      id tokenId patternType winRate roi totalVolume totalEarnings
    }
    TradeExecution(order_by: {timestamp: asc}, limit: 100) {
      id delegationId patternTokenId amount success timestamp
    }
  }
`;

export function useAnalyticsData(pollIntervalMs = 10000): AnalyticsData {
  const [patternROI, setPatternROI] = useState<PatternROIData[]>([]);
  const [executionTimeline, setExecutionTimeline] = useState<ExecutionTimelineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(ENVIO_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ANALYTICS_QUERY }),
      });

      if (!res.ok) return;
      const result = await res.json();
      const patterns = result.data?.Pattern || [];
      const executions = result.data?.TradeExecution || [];

      // Pattern ROI bar chart data
      const roiData: PatternROIData[] = patterns.map((p: any) => ({
        name: `#${p.tokenId}`,
        roi: Number(p.roi) / 100,
        winRate: Number(p.winRate) / 100,
        volume: Number(BigInt(p.totalVolume) / BigInt(10 ** 18)),
        type: p.patternType.replace(/_/g, ' '),
      }));
      setPatternROI(roiData);

      // Execution timeline — group by time bucket
      if (executions.length > 0) {
        let cumVol = 0;
        let cumExec = 0;
        let successCount = 0;
        const timeline: ExecutionTimelineData[] = [];

        // Group executions into time buckets
        const buckets = new Map<string, { vol: number; count: number; success: number; ts: number }>();

        for (const exec of executions) {
          const ts = Number(exec.timestamp);
          const date = new Date(ts * 1000);
          const key = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

          const existing = buckets.get(key) || { vol: 0, count: 0, success: 0, ts };
          existing.vol += Number(BigInt(exec.amount)) / 1e18;
          existing.count += 1;
          existing.success += exec.success ? 1 : 0;
          buckets.set(key, existing);
        }

        for (const [time, bucket] of buckets) {
          cumVol += bucket.vol;
          cumExec += bucket.count;
          successCount += bucket.success;
          timeline.push({
            time,
            timestamp: bucket.ts,
            cumVolume: parseFloat(cumVol.toFixed(4)),
            executions: bucket.count,
            cumExecutions: cumExec,
            success: successCount,
          });
        }
        setExecutionTimeline(timeline);
      }

      setIsLoading(false);
    } catch (err) {
      console.warn('Analytics fetch failed:', err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchData, pollIntervalMs]);

  return { patternROI, executionTimeline, isLoading };
}
