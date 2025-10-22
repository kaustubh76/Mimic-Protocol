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
  patternROI?: bigint; // Pattern's ROI for earnings calculation
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
            // Use getDelegation to get full delegation struct
            const delegation = await publicClient.readContract({
                address: CONTRACTS.DELEGATION_ROUTER,
                abi: ABIS.DELEGATION_ROUTER,
                functionName: 'getDelegation',
                args: [delegationId],
              }) as any;

            // Extract fields from the delegation struct
            const delegator = delegation.delegator;
            const patternTokenId = delegation.patternTokenId;
            const percentageAllocation = delegation.percentageAllocation;
            const isActive = delegation.isActive;
            const smartAccountAddress = delegation.smartAccountAddress;
            const createdAt = delegation.createdAt || BigInt(Math.floor(Date.now() / 1000));

            // Get pattern name and ROI
            let patternName = `Pattern #${patternTokenId}`;
            let patternROI = BigInt(0);
            try {
              const pattern = await publicClient.readContract({
                address: CONTRACTS.BEHAVIORAL_NFT,
                abi: ABIS.BEHAVIORAL_NFT,
                functionName: 'patterns',
                args: [patternTokenId],
              }) as any;

              // Safely extract pattern type and ROI
              if (pattern && typeof pattern === 'object') {
                if (pattern.patternType && typeof pattern.patternType === 'string') {
                  patternName = pattern.patternType;
                } else if (Array.isArray(pattern) && pattern[1]) {
                  // If it's an array, pattern type might be at index 1
                  patternName = pattern[1];
                }

                // Extract ROI (usually at index 6 in the pattern struct)
                if (pattern.roi !== undefined) {
                  patternROI = BigInt(pattern.roi);
                } else if (Array.isArray(pattern) && pattern[6] !== undefined) {
                  patternROI = BigInt(pattern[6]);
                }
              }
            } catch (e) {
              console.error('Error fetching pattern data:', e);
              // Keep the default Pattern #X name and 0 ROI
            }

            return {
              id: Number(delegationId),
              delegationId,
              delegator,
              patternTokenId,
              percentageAllocation,
              isActive,
              createdAt, // Now properly fetched from contract
              smartAccountAddress,
              patternName,
              patternROI, // Add ROI for earnings calculation
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
