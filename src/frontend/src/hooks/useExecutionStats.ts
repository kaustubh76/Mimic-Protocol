import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import type { ExecutionStats } from '../components/ExecutionStats';

// GraphQL endpoint for Envio indexer — configurable via env
const GRAPHQL_ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENVIO_GRAPHQL_URL) ||
  'http://localhost:8080/v1/graphql';

/**
 * Hook to fetch execution statistics for a delegation
 * Prioritizes GraphQL from Envio (TradeExecution entity), falls back to blockchain RPC
 */
export function useExecutionStats(delegationId: bigint | undefined) {
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingGraphQL, setUsingGraphQL] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!delegationId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setIsLoading(true);

        // PRIMARY DATA SOURCE: GraphQL from Envio
        // Entity name is TradeExecution (matches schema.graphql)
        const query = `
          query GetExecutionStats($delegationId: String!) {
            TradeExecution(
              where: {delegationId: {_eq: $delegationId}}
              order_by: {timestamp: desc}
            ) {
              id
              delegationId
              success
              amount
              timestamp
              txHash
            }
          }
        `;

        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { delegationId: delegationId.toString() },
          }),
        });

        if (response.ok) {
          const result = await response.json();

          if (result.data && !result.errors) {
            const trades = result.data.TradeExecution || [];

            if (trades.length > 0) {
              const totalExecutions = trades.length;
              const successfulExecutions = trades.filter((t: any) => t.success).length;
              const failedExecutions = totalExecutions - successfulExecutions;

              const totalVolumeExecuted = trades.reduce(
                (sum: bigint, t: any) => sum + BigInt(t.amount || 0),
                BigInt(0)
              );

              const lastExecutionTime = trades[0].timestamp;

              console.log(`✅ Envio: ${totalExecutions} executions for delegation ${delegationId}`);

              setStats({
                delegationId,
                totalExecutions,
                successfulExecutions,
                failedExecutions,
                totalVolumeExecuted,
                totalGasUsed: BigInt(0), // Not tracked in TradeExecution entity
                lastExecutionTime: Number(lastExecutionTime),
              });
              setUsingGraphQL(true);
              setError(null);
              setIsLoading(false);
              return;
            }
          }
        }

        // FALLBACK: Query ExecutionEngine contract directly
        if (!publicClient) {
          setStats(null);
          setIsLoading(false);
          return;
        }

        const contractStats = await publicClient.readContract({
          address: CONTRACTS.EXECUTION_ENGINE,
          abi: ABIS.EXECUTION_ENGINE,
          functionName: 'executionStats',
          args: [delegationId],
        } as any) as any;

        const [
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          totalVolumeExecuted,
          totalGasUsed,
          lastExecutionTime,
        ] = contractStats;

        setStats({
          delegationId,
          totalExecutions: Number(totalExecutions),
          successfulExecutions: Number(successfulExecutions),
          failedExecutions: Number(failedExecutions),
          totalVolumeExecuted,
          totalGasUsed,
          lastExecutionTime: Number(lastExecutionTime),
        });
        setUsingGraphQL(false);
        setError(null);

      } catch (err) {
        console.error(`❌ Error fetching execution stats for delegation ${delegationId}:`, err);
        setStats(null);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [delegationId, publicClient]);

  return { stats, isLoading, error, usingGraphQL };
}
