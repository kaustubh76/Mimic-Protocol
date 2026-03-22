import { useState, useEffect } from 'react';
import { type Delegation } from './useDelegations';
import { ENVIO_GRAPHQL_URL } from '../contracts/config';

export interface PortfolioStats {
  totalVolume: bigint;
  totalEarnings: bigint;
  totalExecutions: number;
  successfulExecutions: number;
  averageROI: number;
  isLoading: boolean;
}

/**
 * Calculate portfolio-wide stats across all delegations.
 * Queries Envio GraphQL for real delegation execution data,
 * then aggregates totalAmountTraded, totalEarnings, and execution counts.
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

      try {
        // Query Envio for delegation stats
        const delegationIds = delegations.map(d => Number(d.delegationId));

        const query = `
          query GetPortfolioStats($ids: [numeric!]!) {
            Delegation(where: {delegationId: {_in: $ids}}) {
              delegationId
              totalAmountTraded
              totalEarnings
              totalExecutions
              successfulExecutions
              failedExecutions
              pattern {
                roi
              }
            }
          }
        `;

        const response = await fetch(ENVIO_GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { ids: delegationIds },
          }),
        });

        if (response.ok) {
          const result = await response.json();

          if (result.data && !result.errors) {
            const envDelegations = result.data.Delegation || [];

            let totalVolume = BigInt(0);
            let totalEarnings = BigInt(0);
            let totalExecutions = 0;
            let successfulExecutions = 0;
            let roiSum = 0;
            let roiCount = 0;

            for (const d of envDelegations) {
              const traded = BigInt(d.totalAmountTraded || 0);
              const indexedEarnings = BigInt(d.totalEarnings || 0);
              const patternRoi = d.pattern?.roi ? BigInt(d.pattern.roi) : 0n;

              totalVolume += traded;
              totalExecutions += d.totalExecutions || 0;
              successfulExecutions += d.successfulExecutions || 0;

              // Use indexed earnings if available, otherwise compute from volume × ROI
              if (indexedEarnings > 0n) {
                totalEarnings += indexedEarnings;
              } else if (traded > 0n && patternRoi > 0n) {
                totalEarnings += (traded * patternRoi) / 10000n;
              }

              if (d.pattern?.roi) {
                roiSum += Number(BigInt(d.pattern.roi));
                roiCount++;
              }
            }

            setStats({
              totalVolume,
              totalEarnings,
              totalExecutions,
              successfulExecutions,
              averageROI: roiCount > 0 ? Math.floor(roiSum / roiCount) : 0,
              isLoading: false,
            });
            return;
          }
        }

        // Fallback: aggregate from delegation objects passed in
        let totalVolume = BigInt(0);
        let roiSum = 0;
        let roiCount = 0;

        for (const d of delegations) {
          if (d.patternROI) {
            roiSum += Number(d.patternROI);
            roiCount++;
          }
        }

        setStats({
          totalVolume,
          totalEarnings: BigInt(0),
          totalExecutions: 0,
          successfulExecutions: 0,
          averageROI: roiCount > 0 ? Math.floor(roiSum / roiCount) : 0,
          isLoading: false,
        });
      } catch (err) {
        console.error('Error calculating portfolio stats:', err);
        setStats({
          totalVolume: BigInt(0),
          totalEarnings: BigInt(0),
          totalExecutions: 0,
          successfulExecutions: 0,
          averageROI: 0,
          isLoading: false,
        });
      }
    }

    calculateStats();
  }, [delegations]);

  return stats;
}
