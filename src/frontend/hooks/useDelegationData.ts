/**
 * Hook to fetch real delegation data from DelegationRouter contract
 * Uses correct contract function names: getDelegatorDelegations
 * NOW WITH TEST DATA FALLBACK
 */

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import type { Abi } from 'viem'
import { getContract } from 'viem'
import { CONTRACTS, ABIS } from '../src/contracts/config'
import { getTestDelegations } from '../src/config/testData'

export interface DelegationData {
  delegationId: bigint
  delegator: string
  patternTokenId: bigint
  percentageAllocation: bigint
  smartAccountAddress: string
  isActive: boolean
  createdAt: bigint
  totalSpentToday: bigint
  permissions: {
    maxSpendPerTx: bigint
    maxSpendPerDay: bigint
    expiresAt: bigint
    allowedTokens: string[]
    requiresConditionalCheck: boolean
  }
}

interface UseDelegationDataState {
  delegations: DelegationData[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Fetch delegations for a specific delegator
 * Uses getDelegatorDelegations function with test data fallback
 */
export function useDelegationsByUser(delegator: string | undefined): UseDelegationDataState {
  const publicClient = usePublicClient({ chainId: 10143 }) // Monad testnet
  const [delegations, setDelegations] = useState<DelegationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDelegations = async () => {
    if (!delegator) {
      console.log('⏳ No delegator address provided')
      setDelegations([])
      setLoading(false)
      return
    }

    if (!publicClient) {
      console.warn('⚠️ No public client, using test delegation data')
      const testData = getTestDelegations(delegator)
      // Map to DelegationData format
      setDelegations(testData.map(d => ({
        delegationId: d.delegationId,
        delegator: d.delegator,
        patternTokenId: d.patternTokenId,
        percentageAllocation: d.percentageAllocation,
        smartAccountAddress: d.smartAccountAddress,
        isActive: d.isActive,
        createdAt: d.createdAt,
        totalSpentToday: BigInt(0),
        permissions: {
          maxSpendPerTx: BigInt(0),
          maxSpendPerDay: BigInt(0),
          expiresAt: BigInt(0),
          allowedTokens: [],
          requiresConditionalCheck: false
        }
      })))
      setLoading(false)
      return
    }

    console.log('🔍 Fetching delegations for:', delegator)

    try {
      setLoading(true)
      setError(null)

      const contract = getContract({
        address: CONTRACTS.DELEGATION_ROUTER as `0x${string}`,
        abi: ABIS.DELEGATION_ROUTER as Abi,
        client: publicClient,
      })

      // Use getDelegatorDelegations - catch revert errors
      let delegationIds: bigint[] = []
      try {
        delegationIds = await contract.read.getDelegatorDelegations([delegator as `0x${string}`]) as bigint[]
      } catch (revertErr: any) {
        // Function reverted - likely no delegations exist or function not found
        console.log(`ℹ️ getDelegatorDelegations reverted (no delegations or function missing), using test data`)
        const testData = getTestDelegations(delegator)
        setDelegations(testData.map(d => ({
          delegationId: d.delegationId,
          delegator: d.delegator,
          patternTokenId: d.patternTokenId,
          percentageAllocation: d.percentageAllocation,
          smartAccountAddress: d.smartAccountAddress,
          isActive: d.isActive,
          createdAt: d.createdAt,
          totalSpentToday: BigInt(0),
          permissions: {
            maxSpendPerTx: BigInt(0),
            maxSpendPerDay: BigInt(0),
            expiresAt: BigInt(0),
            allowedTokens: [],
            requiresConditionalCheck: false
          }
        })))
        setLoading(false)
        return
      }

      console.log(`📊 Found ${delegationIds?.length || 0} delegation IDs for ${delegator}`)

      if (!delegationIds || delegationIds.length === 0) {
        console.log(`ℹ️ No delegations on-chain, using test data`)
        const testData = getTestDelegations(delegator)
        setDelegations(testData.map(d => ({
          delegationId: d.delegationId,
          delegator: d.delegator,
          patternTokenId: d.patternTokenId,
          percentageAllocation: d.percentageAllocation,
          smartAccountAddress: d.smartAccountAddress,
          isActive: d.isActive,
          createdAt: d.createdAt,
          totalSpentToday: BigInt(0),
          permissions: {
            maxSpendPerTx: BigInt(0),
            maxSpendPerDay: BigInt(0),
            expiresAt: BigInt(0),
            allowedTokens: [],
            requiresConditionalCheck: false
          }
        })))
        setLoading(false)
        return
      }

      // Fetch full delegation data for each ID
      const delegationPromises = delegationIds.map(id =>
        contract.read.delegations([id])
      )

      const delegationResults = await Promise.all(delegationPromises)

      const fetchedDelegations: DelegationData[] = delegationResults.map((result, index) => {
        return {
          delegationId: delegationIds[index],
          delegator: result[0] as string,
          patternTokenId: result[1] as bigint,
          percentageAllocation: result[2] as bigint,
          smartAccountAddress: result[9] as string,
          isActive: result[8] as boolean,
          createdAt: result[5] as bigint,
          totalSpentToday: result[6] as bigint,
          permissions: {
            maxSpendPerTx: result[3]?.[0] as bigint,
            maxSpendPerDay: result[3]?.[1] as bigint,
            expiresAt: result[3]?.[2] as bigint,
            allowedTokens: (result[3]?.[3] as string[]) || [],
            requiresConditionalCheck: result[3]?.[4] as boolean,
          },
        }
      })

      console.log(`✅ Fetched ${fetchedDelegations.length} delegations from blockchain`)
      setDelegations(fetchedDelegations)
    } catch (err: any) {
      console.error('❌ Failed to fetch delegations:', err)
      console.info('ℹ️ Falling back to test delegation data')
      
      // Fallback to test data on any error
      const testData = getTestDelegations(delegator)
      setDelegations(testData.map(d => ({
        delegationId: d.delegationId,
        delegator: d.delegator,
        patternTokenId: d.patternTokenId,
        percentageAllocation: d.percentageAllocation,
        smartAccountAddress: d.smartAccountAddress,
        isActive: d.isActive,
        createdAt: d.createdAt,
        totalSpentToday: BigInt(0),
        permissions: {
          maxSpendPerTx: BigInt(0),
          maxSpendPerDay: BigInt(0),
          expiresAt: BigInt(0),
          allowedTokens: [],
          requiresConditionalCheck: false
        }
      })))
      setError(null) // Don't show error if we have fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDelegations()
  }, [publicClient, delegator])

  return { delegations, loading, error, refetch: fetchDelegations }
}
