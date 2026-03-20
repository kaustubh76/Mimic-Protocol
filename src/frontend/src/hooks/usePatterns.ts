import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS, ABIS } from '../contracts/config';
import { getTestPatterns } from '../config/testData';

export interface Pattern {
  id: number;
  tokenId: bigint;
  creator: string;
  owner: string;
  patternType: string;
  winRate: bigint;
  totalVolume: bigint;
  roi: bigint;
  isActive: boolean;
  createdAt: bigint;
  successfulExecutions: number;
  failedExecutions: number;
}

// GraphQL endpoint for Envio indexer — configurable via env, fallback to localhost for dev
const GRAPHQL_ENDPOINT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ENVIO_GRAPHQL_URL) ||
  'http://localhost:8080/v1/graphql';

export function usePatterns(pollIntervalMs = 10000) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const publicClient = usePublicClient();

  const fetchPatterns = useCallback(async () => {
      try {
        setIsLoading(true);

        // PRIMARY DATA SOURCE: GraphQL from Envio
        console.log('Fetching patterns from Envio GraphQL...');

        const query = `
          query GetPatterns {
            Pattern(order_by: {tokenId: asc}) {
              id
              tokenId
              patternType
              isActive
              winRate
              totalVolume
              roi
              createdAt
              delegationCount
              successfulExecutions
              failedExecutions
              creator {
                id
              }
            }
          }
        `;

        const response = await fetch(GRAPHQL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
          throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
        }

        const indexedPatterns = result.data?.Pattern || [];

        // If Envio has indexed patterns, use them
        if (indexedPatterns.length > 0) {
          console.log(`✅ Using ${indexedPatterns.length} patterns from Envio GraphQL`);

          const formattedPatterns: Pattern[] = indexedPatterns.map((p: any) => ({
            id: parseInt(p.tokenId),
            tokenId: BigInt(p.tokenId),
            creator: p.creator?.id || p.id,
            owner: p.creator?.id || p.id,
            patternType: p.patternType,
            winRate: BigInt(p.winRate || 0),
            totalVolume: BigInt(p.totalVolume || 0),
            roi: BigInt(p.roi || 0),
            isActive: p.isActive,
            createdAt: BigInt(p.createdAt || Math.floor(Date.now() / 1000)),
            successfulExecutions: p.successfulExecutions || 0,
            failedExecutions: p.failedExecutions || 0,
          }));

          setPatterns(formattedPatterns);
          setUsingTestData(false);
          setIsSyncing(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        // FALLBACK 1: Check if indexer is syncing (GraphQL is up but no data yet)
        console.warn('⏳ Envio indexer is syncing - no patterns indexed yet');
        setIsSyncing(true);

        // FALLBACK 2: Try blockchain directly (only if we have a client)
        if (publicClient) {
          console.log('Attempting to fetch from blockchain directly...');

          const totalPatterns = await publicClient.readContract({
            address: CONTRACTS.BEHAVIORAL_NFT,
            abi: ABIS.BEHAVIORAL_NFT,
            functionName: 'totalPatterns',
          } as any) as bigint;

          if (Number(totalPatterns) > 0) {
            console.log(`Found ${totalPatterns} patterns on blockchain`);

            const patternPromises = [];
            for (let i = 1; i <= Number(totalPatterns); i++) {
              patternPromises.push(
                publicClient.readContract({
                  address: CONTRACTS.BEHAVIORAL_NFT,
                  abi: ABIS.BEHAVIORAL_NFT,
                  functionName: 'patterns',
                  args: [BigInt(i)],
                } as any)
              );
            }

            const patternsData = await Promise.all(patternPromises);

            const formattedPatterns: Pattern[] = patternsData.map((data: any, index) => {
              const [creator, patternType, patternData, createdAt, winRate, totalVolume, roi, isActive] = data as [
                string,
                string,
                string,
                bigint,
                bigint,
                bigint,
                bigint,
                boolean
              ];

              return {
                id: index + 1,
                tokenId: BigInt(index + 1),
                creator,
                owner: creator,
                patternType,
                winRate,
                totalVolume,
                roi,
                isActive,
                createdAt,
                successfulExecutions: 0,
                failedExecutions: 0,
              };
            });

            console.log('✅ Using blockchain data (Envio still syncing)');
            setPatterns(formattedPatterns);
            setUsingTestData(false);
            setIsSyncing(true); // Still mark as syncing
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        // FALLBACK 3: Use test data
        console.warn('⚠️ No data from Envio or blockchain, using test data');
        setPatterns(getTestPatterns());
        setUsingTestData(true);
        setIsSyncing(false);
        setError(null);

      } catch (err) {
        console.error('❌ Error fetching patterns:', err);

        // Final fallback: test data
        console.info('Falling back to test data due to error');
        setPatterns(getTestPatterns());
        setUsingTestData(true);
        setIsSyncing(false);
        setError(null); // Don't show error if we have fallback data
      } finally {
        setIsLoading(false);
      }
  }, [publicClient]);

  useEffect(() => {
    fetchPatterns();
    // Poll Envio for real-time updates
    const interval = setInterval(fetchPatterns, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchPatterns, pollIntervalMs]);

  return { patterns, isLoading, error, usingTestData, isSyncing, refetch: fetchPatterns };
}
