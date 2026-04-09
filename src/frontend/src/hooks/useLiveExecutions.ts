import { useState, useEffect, useCallback, useRef } from 'react';
import { ENVIO_GRAPHQL_URL } from '../contracts/config';

export interface LiveExecution {
  id: string;
  delegationId: string;
  patternTokenId: string;
  executor: string;
  amount: string;
  success: boolean;
  timestamp: string;
  txHash: string;
  isNew?: boolean; // For animation
}

const LIVE_EXECUTIONS_QUERY = `
  query GetLiveExecutions {
    TradeExecution(order_by: {timestamp: desc}, limit: 10) {
      id
      delegationId
      patternTokenId
      executor
      amount
      success
      timestamp
      txHash
    }
  }
`;

export function useLiveExecutions(pollIntervalMs = 5000) {
  const [executions, setExecutions] = useState<LiveExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [queryLatency, setQueryLatency] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchExecutions = useCallback(async () => {
    try {
      const startMs = Date.now();
      const res = await fetch(ENVIO_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: LIVE_EXECUTIONS_QUERY }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const latency = Date.now() - startMs;
      setQueryLatency(latency);

      if (data.errors) throw new Error(data.errors[0].message);

      const rawExecutions: LiveExecution[] = data.data?.TradeExecution || [];

      // Mark new entries for animation
      const prevIds = prevIdsRef.current;
      const withNewFlag = rawExecutions.map(exec => ({
        ...exec,
        isNew: !prevIds.has(exec.id),
      }));

      // Update prev IDs
      prevIdsRef.current = new Set(rawExecutions.map(e => e.id));

      setExecutions(withNewFlag);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchExecutions, pollIntervalMs]);

  return { executions, isLoading, error, queryLatency };
}
