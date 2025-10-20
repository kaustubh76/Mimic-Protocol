import { useState, useEffect } from 'react';
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
}

export function usePatterns() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingTestData, setUsingTestData] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchPatterns() {
      if (!publicClient) {
        // Use test data when no client available
        console.warn('No public client available, using test data');
        setPatterns(getTestPatterns());
        setUsingTestData(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get total supply of NFTs
        const totalSupply = await publicClient.readContract({
          address: CONTRACTS.BEHAVIORAL_NFT,
          abi: ABIS.BEHAVIORAL_NFT,
          functionName: 'totalSupply',
        }) as bigint;

        // If no patterns on chain, use test data
        if (Number(totalSupply) === 0) {
          console.info('No patterns on chain, using test data');
          setPatterns(getTestPatterns());
          setUsingTestData(true);
          setError(null);
          setIsLoading(false);
          return;
        }

        const patternPromises = [];

        // Fetch each pattern's data
        for (let i = 1; i <= Number(totalSupply); i++) {
          patternPromises.push(
            publicClient.readContract({
              address: CONTRACTS.BEHAVIORAL_NFT,
              abi: ABIS.BEHAVIORAL_NFT,
              functionName: 'patterns',
              args: [BigInt(i)],
            })
          );
        }

        const patternsData = await Promise.all(patternPromises);

        const formattedPatterns: Pattern[] = patternsData.map((data: any, index) => ({
          id: index + 1,
          tokenId: BigInt(index + 1),
          creator: data.creator,
          owner: data.creator,
          patternType: data.patternType,
          winRate: data.winRate,
          totalVolume: data.totalVolume,
          roi: data.roi,
          isActive: data.isActive,
          createdAt: data.createdAt,
        }));

        setPatterns(formattedPatterns);
        setUsingTestData(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching patterns from blockchain:', err);
        console.info('Falling back to test data');

        // Fallback to test data on error
        setPatterns(getTestPatterns());
        setUsingTestData(true);
        setError(null); // Don't show error if we have fallback data
      } finally {
        setIsLoading(false);
      }
    }

    fetchPatterns();
  }, [publicClient]);

  return { patterns, isLoading, error, usingTestData, refetch: () => {} };
}
