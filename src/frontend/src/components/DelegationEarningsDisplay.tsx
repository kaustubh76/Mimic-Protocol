import { useDelegationEarnings } from '../hooks/useDelegationEarnings';
import { formatEther } from 'viem';

interface Props {
  delegationId: bigint;
  isActive: boolean;
  patternROI: bigint;
}

export function DelegationEarningsDisplay({ delegationId, isActive, patternROI }: Props) {
  const { totalEarnings, volumeExecuted, roi, successRate, isLoading } = useDelegationEarnings(
    delegationId,
    isActive,
    Number(patternROI) // Convert BigInt to number for calculations
  );

  if (isLoading) {
    return (
      <div className="glass-card p-4 text-center">
        <div className="loading-skeleton h-8 w-24 mx-auto mb-1"></div>
        <div className="loading-skeleton h-4 w-32 mx-auto"></div>
      </div>
    );
  }

  const earningsEth = parseFloat(formatEther(totalEarnings));
  const volumeEth = parseFloat(formatEther(volumeExecuted));

  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl font-bold mb-1">
        {totalEarnings > 0 ? (
          <span className="text-gradient-secondary">
            {earningsEth.toFixed(4)} WETH
          </span>
        ) : (
          <span className="text-gray-400">0.00 WETH</span>
        )}
      </div>
      <div className="text-xs text-muted">
        {totalEarnings > 0 ? (
          <>
            Earnings
            {volumeExecuted > 0 && (
              <div className="mt-1 text-[10px]">
                Volume: {volumeEth.toFixed(2)} WETH
              </div>
            )}
          </>
        ) : (
          'No Earnings Yet'
        )}
      </div>
    </div>
  );
}
