/**
 * Hook to fetch real user statistics from contracts
 * Replaces mock data with real blockchain queries
 * Optimized with caching and request deduplication to prevent rate limiting
 */

import { useEffect, useState, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { getContract } from 'viem'
import { CONTRACTS, ABIS } from '../src/contracts/config'

// Cache to store user stats (persists across component re-renders)
const statsCache = new Map<string, { data: UserStats, timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

export interface UserStats {
  patternsCreated: number
  activeDelegations: number
  totalDelegated: string
}

interface UseUserStatsState {
  data: UserStats | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetch user statistics from contracts
 * Optimized with caching and request deduplication:
 * - Patterns created: Count from BehavioralNFT.getCreatorPatterns()
 * - Active delegations: Count from DelegationRouter.getDelegatorDelegations()
 * - Total delegated: Sum of delegation amounts (not yet calculated)
 */
export function useUserStats(address: string | undefined): UseUserStatsState {
  const publicClient = usePublicClient({ chainId: 10143 }) // Monad testnet
  const [data, setData] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Request deduplication flag
  const isFetchingRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStats = async () => {
    if (!publicClient || !address) {
      console.log('⏳ Waiting for publicClient or address...')
      setLoading(false)
      return
    }

    // Check cache first
    const cacheKey = `stats-${address}`
    const cached = statsCache.get(cacheKey)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`💾 Using cached stats for ${address} (cache hit)`)
      setData(cached.data)
      setLoading(false)
      return
    }

    // Prevent duplicate requests
    if (isFetchingRef.current) {
      console.log('⏸️ Stats request already in progress, skipping...')
      return
    }

    isFetchingRef.current = true
    console.log('📊 Fetching stats for:', address)

    try {
      setLoading(true)
      setError(null)

      const behavioralNFT = getContract({
        address: CONTRACTS.BehavioralNFT as `0x${string}`,
        abi: ABIS.BehavioralNFT,
        client: publicClient,
      })

      const delegationRouter = getContract({
        address: CONTRACTS.DelegationRouter as `0x${string}`,
        abi: ABIS.DelegationRouter,
        client: publicClient,
      })

      // Fetch patterns created by user
      const patternIds = await behavioralNFT.read.getCreatorPatterns([
        address as `0x${string}`
      ]) as bigint[]

      // Fetch delegations by user
      const delegationIds = await delegationRouter.read.getDelegatorDelegations([
        address as `0x${string}`
      ]) as bigint[]

      // Count active delegations
      let activeDelegations = 0
      if (delegationIds.length > 0) {
        const delegationPromises = delegationIds.map(id =>
          delegationRouter.read.delegations([id])
        )
        const delegations = await Promise.all(delegationPromises)
        activeDelegations = delegations.filter(d => d[8] as boolean).length // isActive is at index 8
      }

      const stats: UserStats = {
        patternsCreated: patternIds.length,
        activeDelegations,
        totalDelegated: '0 MON', // TODO: Calculate sum of delegation amounts
      }

      console.log(`✅ Fetched stats for ${address}:`, stats)

      // Store in cache
      statsCache.set(cacheKey, { data: stats, timestamp: now })
      setData(stats)
    } catch (err) {
      console.error('❌ Failed to fetch user stats:', err)
      setError(err as Error)
      // Return empty stats on error
      setData({
        patternsCreated: 0,
        activeDelegations: 0,
        totalDelegated: '0 MON',
      })
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
      fetchStats()
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [publicClient, address])

  return { data, loading, error, refetch: fetchStats }
}
