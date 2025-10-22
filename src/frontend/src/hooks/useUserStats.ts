import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { getTestUserStats } from '../config/testData';

// GraphQL endpoint for Envio indexer
const GRAPHQL_ENDPOINT = 'http://localhost:8080/v1/graphql';

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

      try {
        setIsLoading(true);

        // PRIMARY DATA SOURCE: GraphQL from Envio
        console.log('Fetching user stats from Envio GraphQL...');

        const query = `
          query GetUserStats($address: String!) {
            patterns: Pattern(where: {id: {_eq: $address}}) {
              id
              tokenId
            }
            delegations: Delegation(where: {delegator: {_eq: $address}, isActive: {_eq: true}}) {
              id
              isActive
            }
          }
        `;

        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { address: address.toLowerCase() },
          }),
        });

        if (response.ok) {
          const result = await response.json();

          if (result.data && !result.errors) {
            const patterns = result.data.patterns || [];
            const delegations = result.data.delegations || [];

            console.log(`✅ Using Envio data: ${patterns.length} patterns, ${delegations.length} active delegations`);

            setStats({
              patternsCreated: patterns.length,
              activeDelegations: delegations.length,
              totalVolume: 0, // TODO: Calculate from indexed data
              totalEarnings: 0, // TODO: Calculate from indexed data
            });
            setIsLoading(false);
            return;
          }
        }

        // FALLBACK: Use blockchain directly if GraphQL fails or has no data
        console.warn('⏳ GraphQL unavailable or no data, querying blockchain...');

        if (!publicClient) {
          throw new Error('No public client available');
        }

        // Try to get pattern balance, fallback to 0 if fails
        let balance = 0n;
        try {
          balance = await publicClient.readContract({
            address: CONTRACTS.BEHAVIORAL_NFT,
            abi: ABIS.BEHAVIORAL_NFT,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
        } catch (balanceError) {
          console.warn('Failed to fetch balanceOf, using 0:', balanceError);
        }

        const delegations = await publicClient.readContract({
          address: CONTRACTS.DELEGATION_ROUTER,
          abi: ABIS.DELEGATION_ROUTER,
          functionName: 'getDelegatorDelegations',
          args: [address],
        }) as bigint[];

        let activeDelegations = 0;
        for (const delegationId of delegations) {
          try {
            const delegation = await publicClient.readContract({
              address: CONTRACTS.DELEGATION_ROUTER,
              abi: ABIS.DELEGATION_ROUTER,
              functionName: 'getDelegation',
              args: [delegationId],
            }) as any;

            if (delegation && delegation.isActive) {
              activeDelegations++;
            }
          } catch (err) {
            console.error(`Failed to read delegation ${delegationId}:`, err);
          }
        }

        console.log('✅ Using blockchain data');
        setStats({
          patternsCreated: Number(balance),
          activeDelegations,
          totalVolume: 0,
          totalEarnings: 0
        });
      } catch (err) {
        console.error('❌ Failed to fetch user stats:', err);
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
