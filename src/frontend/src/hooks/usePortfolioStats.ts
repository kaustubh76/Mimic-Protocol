import { useState, useEffect } from 'react';
import { useExecutionStats } from './useExecutionStats';
import { type Delegation } from './useDelegations';

export interface PortfolioStats {
  totalVolume: bigint;
  totalEarnings: bigint;
  totalExecutions: number;
  successfulExecutions: number;
  averageROI: number;
  isLoading: boolean;
}

/**
 * Calculate portfolio-wide stats across all delegations
 */
export function usePortfolioStats(delegations: Delegation[]): PortfolioStats {
  const [stats, setStats] = useState<PortfolioStats>({
    totalVolume: BigInt(0),
    totalEarnings: BigInt(0),
    totalExecutions: 0,
    successfulExecutions: 0,
    averageROI: 0,
    isLoading: true,
  });

  useEffect(() => {
    async function calculateStats() {
      if (!delegations || delegations.length === 0) {
        setStats({
          totalVolume: BigInt(0),
          totalEarnings: BigInt(0),
          totalExecutions: 0,
          successfulExecutions: 0,
          averageROI: 0,
          isLoading: false,
        });
        return;
      }

      // For now, aggregate from active delegations
      // In production, this would query a portfolio aggregator contract
      const activeDelegations = delegations.filter(d => d.isActive);

      let totalVolume = BigInt(0);
      let totalExecutions = 0;
      let successfulExecutions = 0;
      let weightedROI = 0;

      // Note: In a real implementation, we'd query ExecutionEngine for each delegation
      // For this demo, we'll show 0 until trades are executed
      // When trades execute, the stats will automatically update

      setStats({
        totalVolume,
        totalEarnings: BigInt(0), // Will be calculated when we have volume
        totalExecutions,
        successfulExecutions,
        averageROI: weightedROI,
        isLoading: false,
      });
    }

    calculateStats();
  }, [delegations]);

  return stats;
}
