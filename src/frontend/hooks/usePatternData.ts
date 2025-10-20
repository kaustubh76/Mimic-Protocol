/**
 * Hook to fetch real pattern data from BehavioralNFT contract
 * Uses correct contract function names: getCreatorPatterns
 * Optimized with caching and request deduplication to prevent rate limiting
 */

import { useEffect, useState, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import type { Abi } from 'viem'
import { getContract } from 'viem'
import { CONTRACTS, ABIS } from '../src/contracts/config'

// Cache to store fetched patterns (persists across component re-renders)
const patternCache = new Map<string, { data: PatternData[], timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export interface PatternData {
  tokenId: bigint
  creator: string
  patternType: string
  winRate: bigint
  totalVolume: bigint
  roi: bigint
  isActive: boolean
  createdAt: bigint
}

interface UsePatternDataState {
  patterns: PatternData[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetch all patterns from BehavioralNFT contract
 * Dynamically fetches ALL patterns using totalPatterns():
 * - Uses cache to avoid redundant fetches
 * - Implements request deduplication
 * - Fetches exact number of patterns from contract
 */
export function useAllPatterns(): UsePatternDataState {
  const publicClient = usePublicClient({ chainId: 10143 }) // Monad testnet
  const [patterns, setPatterns] = useState<PatternData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Request deduplication flag
  const isFetchingRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchPatterns = async () => {
    if (!publicClient) {
      console.log('⏳ Waiting for publicClient to connect to Monad...')
      setLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `patterns-${CONTRACTS.BEHAVIORAL_NFT}`
    const cached = patternCache.get(cacheKey)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('💾 Using cached patterns (cache hit)')
      setPatterns(cached.data)
      setLoading(false)
      return
    }

    // Prevent duplicate requests
    if (isFetchingRef.current) {
      console.log('⏸️ Request already in progress, skipping...')
      return
    }

    isFetchingRef.current = true
    console.log('🔍 Fetching patterns from BehavioralNFT on Monad...')

    try {
      setLoading(true)
      setError(null)

      console.log('📝 Contract address:', CONTRACTS.BEHAVIORAL_NFT)
      console.log('🌐 Chain ID:', await publicClient.getChainId())

      const contract = getContract({
        address: CONTRACTS.BEHAVIORAL_NFT as `0x${string}`,
        abi: ABIS.BEHAVIORAL_NFT as Abi,
        client: publicClient,
      })

      // Get total number of patterns from contract
      const totalPatterns = await contract.read.totalPatterns() as bigint
      const maxPatterns = Number(totalPatterns) + 1 // +1 because tokenIds start at 0
      console.log(`📊 Total patterns from contract: ${totalPatterns}`)
      console.log(`🔄 Fetching token IDs 0-${maxPatterns - 1}...`)

      // Batch queries in smaller chunks to avoid overwhelming RPC
      const patternPromises: Promise<any>[] = []
      for (let i = 0; i < maxPatterns; i++) {
        patternPromises.push(
          contract.read.patterns([BigInt(i)]).catch(() => null)
        )
      }

      const patternResults = await Promise.all(patternPromises)
      console.log(`📊 Raw results received: ${patternResults.filter(r => r !== null).length} non-null responses`)

      // Filter out null and zero address patterns
      const fetchedPatterns: PatternData[] = patternResults
        .map((result, index) => {
          if (!result || result[0] === '0x0000000000000000000000000000000000000000') {
            return null
          }

          console.log(`✅ Found pattern at token ID ${index}:`, {
            creator: result[0],
            type: result[1],
            winRate: result[4],
            isActive: result[7]
          })

          return {
            tokenId: BigInt(index),
            creator: result[0] as string,
            patternType: result[1] as string,
            winRate: result[4] as bigint,
            totalVolume: result[5] as bigint,
            roi: result[6] as bigint,
            isActive: result[7] as boolean,
            createdAt: result[3] as bigint,
          }
        })
        .filter((p): p is PatternData => p !== null)

      console.log(`✅ Total patterns fetched: ${fetchedPatterns.length}`)
      console.log('📋 Pattern details:', fetchedPatterns)

      // Store in cache
      patternCache.set(cacheKey, { data: fetchedPatterns, timestamp: now })
      setPatterns(fetchedPatterns)
    } catch (err) {
      console.error('❌ Failed to fetch patterns:', err)
      setError(err as Error)
      setPatterns([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    // Debounce to prevent rapid successive calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchPatterns()
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [publicClient])

  return { patterns, loading, error, refetch: fetchPatterns }
}
