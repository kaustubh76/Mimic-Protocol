import { useState, useEffect, useCallback, useRef } from 'react';
import { ENVIO_GRAPHQL_URL } from '../contracts/config';

/**
 * Real DEX swap detail from the UniswapV2Adapter.Swap event, joined to
 * TradeExecution by txHash. Populated from the PoolSwap entity indexed
 * on envio-deploy-sepolia at commit 8c47c85. Nullable because back-fill
 * may not yet cover the very latest tx, or the swap may be a non-
 * adapter execution (e.g. old mock-path trades before the Sepolia pivot).
 */
export interface PoolSwapDetail {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
}

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
  patternType?: string | null; // joined from Pattern entity
  poolSwap?: PoolSwapDetail | null; // joined from PoolSwap entity by txHash
}

// Fetches the 10 most recent TradeExecution records alongside the 20 most
// recent PoolSwap records. 20 swaps is enough headroom to cover the 10
// trades we care about even with a few reverted txs in between. Joined
// client-side by txHash so we don't need Envio schema relations.
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
      pattern {
        patternType
      }
    }
    PoolSwap(order_by: {timestamp: desc}, limit: 20) {
      txHash
      tokenIn
      tokenOut
      amountIn
      amountOut
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

      // Build a txHash -> PoolSwap map so we can attach the real DEX detail
      // to each TradeExecution in O(1). We use .toLowerCase() because Envio
      // returns addresses in mixed case while other parts of the system may
      // normalize; belt-and-braces.
      const poolSwaps = data.data?.PoolSwap || [];
      const poolSwapByTxHash = new Map<string, PoolSwapDetail>();
      for (const s of poolSwaps) {
        poolSwapByTxHash.set(s.txHash.toLowerCase(), {
          tokenIn: s.tokenIn,
          tokenOut: s.tokenOut,
          amountIn: s.amountIn,
          amountOut: s.amountOut,
        });
      }

      // TradeExecution rows come with `pattern: { patternType }` nested —
      // flatten it onto the row so the component can read exec.patternType
      // directly.
      const rawExecutions: LiveExecution[] = (data.data?.TradeExecution || []).map((t: any) => ({
        id: t.id,
        delegationId: t.delegationId,
        patternTokenId: t.patternTokenId,
        executor: t.executor,
        amount: t.amount,
        success: t.success,
        timestamp: t.timestamp,
        txHash: t.txHash,
        patternType: t.pattern?.patternType ?? null,
        poolSwap: poolSwapByTxHash.get(t.txHash.toLowerCase()) ?? null,
      }));

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
