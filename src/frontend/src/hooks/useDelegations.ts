import { useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { getTestDelegations } from '../config/testData';

export interface Delegation {
  id: number;
  delegationId: bigint;
  delegator: string;
  patternTokenId: bigint;
  percentageAllocation: bigint;
  isActive: boolean;
  createdAt: bigint;
  smartAccountAddress: string;
  patternName?: string;
}

export function useDelegations() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const publicClient = usePublicClient();
  const { address } = useAccount();

  useEffect(() => {
    async function fetchDelegations() {
      if (!address) {
        setDelegations([]);
        setIsLoading(false);
        return;
      }

      if (!publicClient) {
        // Use test data when no client available
        console.warn('No public client available, using test delegation data');
        setDelegations(getTestDelegations(address));
        setUsingTestData(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get user's delegations
        const userDelegations = await publicClient.readContract({
          address: CONTRACTS.DELEGATION_ROUTER,
          abi: ABIS.DELEGATION_ROUTER,
          functionName: 'getDelegatorDelegations',
          args: [address],
        }) as bigint[];

        // If no delegations on chain, use test data
        if (userDelegations.length === 0) {
          console.info('No delegations on chain, using test data');
          setDelegations(getTestDelegations(address));
          setUsingTestData(true);
          setError(null);
          setIsLoading(false);
          return;
        }

        const delegationPromises = userDelegations.map(async (delegationId) => {
          try {
            // Use getDelegationBasics instead of delegations (refactored contract)
            const [delegator, patternTokenId, percentageAllocation, isActive, smartAccountAddress] =
              await publicClient.readContract({
                address: CONTRACTS.DELEGATION_ROUTER,
                abi: ABIS.DELEGATION_ROUTER,
                functionName: 'getDelegationBasics',
                args: [delegationId],
              }) as [string, bigint, bigint, boolean, string];

            // Get pattern name
            let patternName = 'Unknown';
            try {
              const pattern = await publicClient.readContract({
                address: CONTRACTS.BEHAVIORAL_NFT,
                abi: ABIS.BEHAVIORAL_NFT,
                functionName: 'patterns',
                args: [patternTokenId],
              }) as any;
              patternName = pattern.patternType;
            } catch (e) {
              console.error('Error fetching pattern name:', e);
            }

            return {
              id: Number(delegationId),
              delegationId,
              delegator,
              patternTokenId,
              percentageAllocation,
              isActive,
              createdAt: BigInt(Math.floor(Date.now() / 1000)), // Placeholder - not in getDelegationBasics
              smartAccountAddress,
              patternName,
            };
          } catch (err) {
            console.error(`Failed to fetch delegation ${delegationId}:`, err);
            return null;
          }
        });

        const formattedDelegations = (await Promise.all(delegationPromises)).filter(d => d !== null);
        setDelegations(formattedDelegations as any);
        setUsingTestData(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching delegations from blockchain:', err);
        console.info('Falling back to test delegation data');

        // Fallback to test data on error
        setDelegations(getTestDelegations(address));
        setUsingTestData(true);
        setError(null); // Don't show error if we have fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchDelegations();
  }, [publicClient, address]);

  return { delegations, isLoading, error, usingTestData };
}
