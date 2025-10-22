import { useExecutionStats } from '../hooks/useExecutionStats';
import { ExecutionStatsDisplay } from './ExecutionStats';

interface DelegationExecutionStatsProps {
  delegationId: bigint;
  isActive: boolean;
}

/**
 * Wrapper component that fetches and displays execution stats for a delegation
 * Uses real data from Envio GraphQL or blockchain, never dummy data
 */
export function DelegationExecutionStats({ delegationId, isActive }: DelegationExecutionStatsProps) {
  const { stats, isLoading } = useExecutionStats(isActive ? delegationId : undefined);

  if (!isActive) {
    return null; // Don't show stats for inactive delegations
  }

  return (
    <ExecutionStatsDisplay
      delegationId={delegationId}
      stats={stats || undefined}
      isLoading={isLoading}
    />
  );
}
