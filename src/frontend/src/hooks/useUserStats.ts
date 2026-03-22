import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS, ENVIO_GRAPHQL_URL } from '../contracts/config';

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
            patterns: Pattern(where: {creator_id: {_eq: $address}}) {
              id
              tokenId
              totalVolume
              totalEarnings
              roi
            }
            delegations: Delegation(where: {delegator: {_eq: $address}, isActive: {_eq: true}}) {
              id
              isActive
              totalAmountTraded
              totalEarnings
              pattern {
                roi
              }
            }
          }
        `;

        const response = await fetch(ENVIO_GRAPHQL_URL, {
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

            // Aggregate volume from patterns and delegations
            const patternVolume = patterns.reduce(
              (sum: bigint, p: any) => sum + BigInt(p.totalVolume || 0), 0n
            );
            const delegationVolume = delegations.reduce(
              (sum: bigint, d: any) => sum + BigInt(d.totalAmountTraded || 0), 0n
            );
            const totalVolume = patternVolume + delegationVolume;

            // Aggregate earnings — compute from volume × ROI if indexed earnings are 0
            let totalEarnings = 0n;
            for (const p of patterns) {
              const indexed = BigInt(p.totalEarnings || 0);
              const vol = BigInt(p.totalVolume || 0);
              const roi = BigInt(p.roi || 0);
              totalEarnings += indexed > 0n ? indexed : (vol * roi) / 10000n;
            }
            for (const d of delegations) {
              const indexed = BigInt(d.totalEarnings || 0);
              const traded = BigInt(d.totalAmountTraded || 0);
              const roi = d.pattern?.roi ? BigInt(d.pattern.roi) : 0n;
              totalEarnings += indexed > 0n ? indexed : (traded * roi) / 10000n;
            }

            // If Envio has 0 delegations, supplement with RPC count
            let activeDelegationCount = delegations.length;
            if (activeDelegationCount === 0 && publicClient) {
              try {
                const rpcDelegationIds = await publicClient.readContract({
                  address: CONTRACTS.DELEGATION_ROUTER,
                  abi: ABIS.DELEGATION_ROUTER,
                  functionName: 'getDelegatorDelegations',
                  args: [address],
                } as any) as bigint[];
                if (rpcDelegationIds.length > 0) {
                  let activeCount = 0;
                  for (const did of rpcDelegationIds) {
                    try {
                      const d = await publicClient.readContract({
                        address: CONTRACTS.DELEGATION_ROUTER,
                        abi: ABIS.DELEGATION_ROUTER,
                        functionName: 'getDelegation',
                        args: [did],
                      } as any) as any;
                      if (d && d.isActive) activeCount++;
                    } catch { /* skip */ }
                  }
                  activeDelegationCount = activeCount;
                  console.log(`ℹ️ Supplemented delegation count from RPC: ${activeCount} active`);
                }
              } catch { /* keep Envio count */ }
            }

            console.log(`✅ Envio: ${patterns.length} patterns, ${activeDelegationCount} active delegations`);

            setStats({
              patternsCreated: patterns.length,
              activeDelegations: activeDelegationCount,
              totalVolume: Number(totalVolume) / 1e18,
              totalEarnings: Number(totalEarnings) / 1e18,
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
          } as any) as bigint;
        } catch (balanceError) {
          console.warn('Failed to fetch balanceOf, using 0:', balanceError);
        }

        const delegations = await publicClient.readContract({
          address: CONTRACTS.DELEGATION_ROUTER,
          abi: ABIS.DELEGATION_ROUTER,
          functionName: 'getDelegatorDelegations',
          args: [address],
        } as any) as bigint[];

        let activeDelegations = 0;
        for (const delegationId of delegations) {
          try {
            const delegation = await publicClient.readContract({
              address: CONTRACTS.DELEGATION_ROUTER,
              abi: ABIS.DELEGATION_ROUTER,
              functionName: 'getDelegation',
              args: [delegationId],
            } as any) as any;

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
        console.info('Failed to fetch user stats');
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [publicClient, address]);

  return { data: stats, isLoading };
}
