import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { getTestDelegations } from '../config/testData';

// GraphQL endpoint — Envio primary data source
const GRAPHQL_ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENVIO_GRAPHQL_URL) ||
  'http://localhost:8080/v1/graphql';

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
  patternROI?: bigint;
}

export function useDelegations(pollIntervalMs = 12000) {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const fetchDelegations = useCallback(async () => {
    if (!address) {
      setDelegations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // PRIMARY: Envio GraphQL — instant, real-time
      const query = `
        query GetUserDelegations($delegator: String!) {
          Delegation(
            where: {delegator: {_eq: $delegator}}
            order_by: {createdAt: desc}
          ) {
            id
            delegationId
            delegator
            patternTokenId
            percentageAllocation
            isActive
            createdAt
            smartAccountAddress
            pattern {
              id
              patternType
              roi
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { delegator: address.toLowerCase() },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data && !result.errors) {
          const indexed = result.data.Delegation || [];

          if (indexed.length > 0) {
            const formatted: Delegation[] = indexed.map((d: any) => ({
              id: Number(d.delegationId),
              delegationId: BigInt(d.delegationId),
              delegator: d.delegator,
              patternTokenId: BigInt(d.patternTokenId),
              percentageAllocation: BigInt(d.percentageAllocation),
              isActive: d.isActive,
              createdAt: BigInt(d.createdAt || 0),
              smartAccountAddress: d.smartAccountAddress,
              patternName: d.pattern?.patternType || `Pattern #${d.patternTokenId}`,
              patternROI: BigInt(d.pattern?.roi || 0),
            }));

            console.log(`✅ Envio: ${formatted.length} delegations for ${address}`);
            setDelegations(formatted);
            setUsingTestData(false);
            setError(null);
            setIsLoading(false);
            return;
          }
        }
      }

      // FALLBACK 1: Blockchain RPC
      if (!publicClient) {
        throw new Error('No RPC client');
      }

      const userDelegationIds = await publicClient.readContract({
        address: CONTRACTS.DELEGATION_ROUTER,
        abi: ABIS.DELEGATION_ROUTER,
        functionName: 'getDelegatorDelegations',
        args: [address],
      } as any) as bigint[];

      if (userDelegationIds.length === 0) {
        console.info('No delegations on chain, using test data');
        setDelegations(getTestDelegations(address));
        setUsingTestData(true);
        setIsLoading(false);
        return;
      }

      const delegationPromises = userDelegationIds.map(async (delegationId) => {
        try {
          const delegation = await publicClient.readContract({
            address: CONTRACTS.DELEGATION_ROUTER,
            abi: ABIS.DELEGATION_ROUTER,
            functionName: 'getDelegation',
            args: [delegationId],
          } as any) as any;

          let patternName = `Pattern #${delegation.patternTokenId}`;
          let patternROI = BigInt(0);
          try {
            const pattern = await publicClient.readContract({
              address: CONTRACTS.BEHAVIORAL_NFT,
              abi: ABIS.BEHAVIORAL_NFT,
              functionName: 'patterns',
              args: [delegation.patternTokenId],
            } as any) as any;
            if (pattern?.patternType) patternName = pattern.patternType;
            if (pattern?.roi !== undefined) patternROI = BigInt(pattern.roi);
          } catch { /* keep defaults */ }

          return {
            id: Number(delegationId),
            delegationId,
            delegator: delegation.delegator,
            patternTokenId: delegation.patternTokenId,
            percentageAllocation: delegation.percentageAllocation,
            isActive: delegation.isActive,
            createdAt: delegation.createdAt || BigInt(Math.floor(Date.now() / 1000)),
            smartAccountAddress: delegation.smartAccountAddress,
            patternName,
            patternROI,
          };
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(delegationPromises)).filter(Boolean) as Delegation[];
      setDelegations(results);
      setUsingTestData(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching delegations:', err);
      setDelegations(getTestDelegations(address));
      setUsingTestData(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    fetchDelegations();
    const interval = setInterval(fetchDelegations, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchDelegations, pollIntervalMs]);

  return { delegations, isLoading, error, usingTestData };
}
