import { useState, useEffect, useCallback } from 'react';

const GRAPHQL_ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENVIO_GRAPHQL_URL) ||
  'http://localhost:8080/v1/graphql';

export interface EnvioMetrics {
  // Indexer health
  isLive: boolean;
  lastUpdatedAt: number;
  eventsProcessed: bigint;

  // Pattern stats
  totalPatterns: number;
  activePatterns: number;

  // Delegation stats
  totalDelegations: number;
  activeDelegations: number;
  totalDelegators: number;

  // Execution stats
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;

  // Performance metrics (Envio-specific)
  averageQueryLatency: number;
  peakEventsPerSecond: number;
  currentEventsPerSecond: number;
  averageProcessingTime: number;

  // Volume
  totalVolume: bigint;
  totalEarnings: bigint;

  // Type distribution
  momentumPatterns: number;
  arbitragePatterns: number;
  meanReversionPatterns: number;
  otherPatterns: number;
}

const METRICS_QUERY = `
  query GetSystemMetrics {
    SystemMetrics(where: {id: {_eq: "1"}}) {
      id
      totalPatterns
      activePatterns
      last24hPatterns
      last7dPatterns
      totalCreators
      activeCreators
      totalDelegations
      activeDelegations
      totalDelegators
      totalExecutions
      successfulExecutions
      failedExecutions
      eventsProcessed
      averageQueryLatency
      peakEventsPerSecond
      currentEventsPerSecond
      averageProcessingTime
      totalVolume
      totalEarnings
      momentumPatterns
      arbitragePatterns
      meanReversionPatterns
      otherPatterns
      lastPatternMintedAt
      lastUpdatedAt
    }
  }
`;

export function useEnvioMetrics(pollIntervalMs = 5000) {
  const [metrics, setMetrics] = useState<EnvioMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [indexerOnline, setIndexerOnline] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: METRICS_QUERY }),
      });

      if (!response.ok) {
        setIndexerOnline(false);
        return;
      }

      const result = await response.json();
      const raw = result.data?.SystemMetrics?.[0];

      setIndexerOnline(true);

      if (raw) {
        const totalExec = raw.totalExecutions || 0;
        const successExec = raw.successfulExecutions || 0;

        setMetrics({
          isLive: true,
          lastUpdatedAt: Number(raw.lastUpdatedAt || 0),
          eventsProcessed: BigInt(raw.eventsProcessed || 0),
          totalPatterns: raw.totalPatterns || 0,
          activePatterns: raw.activePatterns || 0,
          totalDelegations: raw.totalDelegations || 0,
          activeDelegations: raw.activeDelegations || 0,
          totalDelegators: raw.totalDelegators || 0,
          totalExecutions: totalExec,
          successfulExecutions: successExec,
          failedExecutions: raw.failedExecutions || 0,
          successRate: totalExec > 0 ? Math.round((successExec / totalExec) * 100) : 0,
          averageQueryLatency: raw.averageQueryLatency || 0,
          peakEventsPerSecond: raw.peakEventsPerSecond || 0,
          currentEventsPerSecond: raw.currentEventsPerSecond || 0,
          averageProcessingTime: raw.averageProcessingTime || 0,
          totalVolume: BigInt(raw.totalVolume || 0),
          totalEarnings: BigInt(raw.totalEarnings || 0),
          momentumPatterns: raw.momentumPatterns || 0,
          arbitragePatterns: raw.arbitragePatterns || 0,
          meanReversionPatterns: raw.meanReversionPatterns || 0,
          otherPatterns: raw.otherPatterns || 0,
        });
      } else {
        // Indexer is online but no data yet (still syncing)
        setMetrics({
          isLive: true,
          lastUpdatedAt: Date.now() / 1000,
          eventsProcessed: 0n,
          totalPatterns: 0,
          activePatterns: 0,
          totalDelegations: 0,
          activeDelegations: 0,
          totalDelegators: 0,
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          successRate: 0,
          averageQueryLatency: 0,
          peakEventsPerSecond: 0,
          currentEventsPerSecond: 0,
          averageProcessingTime: 0,
          totalVolume: 0n,
          totalEarnings: 0n,
          momentumPatterns: 0,
          arbitragePatterns: 0,
          meanReversionPatterns: 0,
          otherPatterns: 0,
        });
      }
    } catch {
      setIndexerOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchMetrics, pollIntervalMs]);

  return { metrics, isLoading, indexerOnline, refetch: fetchMetrics };
}
