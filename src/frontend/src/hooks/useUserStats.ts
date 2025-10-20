import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { getTestUserStats } from '../config/testData';

export function useUserStats(address: string | undefined) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchStats() {
      if (!address) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      if (!publicClient) {
        console.warn('No public client available, using test user stats');
        setStats(getTestUserStats());
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const balance = await publicClient.readContract({
          address: CONTRACTS.BEHAVIORAL_NFT,
          abi: ABIS.BEHAVIORAL_NFT,
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;

        const delegations = await publicClient.readContract({
          address: CONTRACTS.DELEGATION_ROUTER,
          abi: ABIS.DELEGATION_ROUTER,
          functionName: 'getDelegatorDelegations',
          args: [address],
        }) as bigint[];

        let activeDelegations = 0;
        for (const delegationId of delegations) {
          try {
            const [, , , isActive] = await publicClient.readContract({
              address: CONTRACTS.DELEGATION_ROUTER,
              abi: ABIS.DELEGATION_ROUTER,
              functionName: 'getDelegationBasics',
              args: [delegationId],
            }) as [string, bigint, bigint, boolean, string];

            if (isActive) {
              activeDelegations++;
            }
          } catch (err) {
            console.error(`Failed to read delegation ${delegationId}:`, err);
          }
        }

        setStats({
          patternsCreated: Number(balance),
          activeDelegations,
          totalVolume: '0',
          totalEarnings: '0'
        });
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
        console.info('Falling back to test user stats');
        setStats(getTestUserStats());
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [publicClient, address]);

  return { data: stats, isLoading };
}
