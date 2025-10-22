import { useEffect, useState } from 'react';
import { useExecutionStats } from './useExecutionStats';

export interface DelegationEarnings {
  volumeExecuted: bigint;
  totalEarnings: bigint;
  roi: number;
  successRate: number;
  isLoading: boolean;
}

/**
 * Calculate earnings for a delegation based on execution stats
 * Earnings = (Volume × Pattern ROI × Success Rate) / 10000
 */
export function useDelegationEarnings(
  delegationId: bigint | undefined,
  isActive: boolean,
  patternROI: number = 0 // Pattern's ROI in basis points (e.g., 2870 = 28.7%)
): DelegationEarnings {
  const { stats, isLoading } = useExecutionStats(isActive ? delegationId : undefined);
  const [earnings, setEarnings] = useState<DelegationEarnings>({
    volumeExecuted: BigInt(0),
    totalEarnings: BigInt(0),
    roi: 0,
    successRate: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!stats || isLoading) {
      setEarnings({
        volumeExecuted: BigInt(0),
        totalEarnings: BigInt(0),
        roi: 0,
        successRate: 0,
        isLoading: isLoading,
      });
      return;
    }

    // Calculate success rate
    const successRate = stats.totalExecutions > 0
      ? (stats.successfulExecutions / stats.totalExecutions) * 100
      : 0;

    // Calculate ROI (actual performance)
    const actualROI = stats.totalExecutions > 0 ? patternROI * (successRate / 100) : 0;

    // Calculate earnings: Volume × ROI / 10000
    // ROI is in basis points (e.g., 2870 = 28.7%)
    const totalEarnings = (stats.totalVolumeExecuted * BigInt(Math.floor(actualROI))) / BigInt(10000);

    setEarnings({
      volumeExecuted: stats.totalVolumeExecuted,
      totalEarnings,
      roi: actualROI / 100, // Convert from basis points to percentage
      successRate,
      isLoading: false,
    });
  }, [stats, isLoading, patternROI]);

  return earnings;
}
