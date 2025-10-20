/**
 * Mirror Protocol Contract Interaction Hooks
 *
 * Provides typed contract interaction functions for:
 * - BehavioralNFT: Pattern NFT management
 * - DelegationRouter: Delegation operations
 * - PatternDetector: Pattern detection queries
 * - ExecutionEngine: Execution monitoring
 */

import { usePublicClient, useWalletClient } from 'wagmi'
import { getContract as viemGetContract } from 'viem'
import { getContract, CONTRACTS, ABIS } from '../src/contracts/config'
import type { Address } from 'viem'

/**
 * Hook for BehavioralNFT contract interactions
 */
export function useBehavioralNFT() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contractConfig = getContract('BehavioralNFT')

  // Read functions
  const getPatternMetadata = async (tokenId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getPatternMetadata([tokenId])
  }

  const getPatternsByCreator = async (creator: Address) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getPatternsByCreator([creator])
  }

  const ownerOf = async (tokenId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.ownerOf([tokenId])
  }

  const balanceOf = async (owner: Address) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.balanceOf([owner])
  }

  // Write functions
  const mintPattern = async (
    recipient: Address,
    patternHash: `0x${string}`,
    performanceScore: bigint,
    metadataURI: string
  ) => {
    if (!walletClient) throw new Error('Wallet client not available')

    const { request } = await publicClient!.simulateContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'mintPattern',
      args: [recipient, patternHash, performanceScore, metadataURI],
      account: walletClient.account,
    })

    return await walletClient.writeContract(request)
  }

  return {
    address: contractConfig.address,
    // Read
    getPatternMetadata,
    getPatternsByCreator,
    ownerOf,
    balanceOf,
    // Write
    mintPattern,
  }
}

/**
 * Hook for DelegationRouter contract interactions
 */
export function useDelegationRouter() {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const contractConfig = getContract('DelegationRouter')

  // Read functions
  const getDelegation = async (delegationId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getDelegation([delegationId])
  }

  const getDelegationsByUser = async (user: Address) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getDelegationsByUser([user])
  }

  const getDelegationsByPattern = async (patternId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getDelegationsByPattern([patternId])
  }

  // Write functions
  const createDelegation = async (
    patternId: bigint,
    amount: bigint,
    duration: bigint
  ) => {
    if (!walletClient) throw new Error('Wallet client not available')

    const { request } = await publicClient!.simulateContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'createDelegation',
      args: [patternId, amount, duration],
      account: walletClient.account,
      value: amount, // Send ETH with the transaction
    })

    return await walletClient.writeContract(request)
  }

  const cancelDelegation = async (delegationId: bigint) => {
    if (!walletClient) throw new Error('Wallet client not available')

    const { request } = await publicClient!.simulateContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'cancelDelegation',
      args: [delegationId],
      account: walletClient.account,
    })

    return await walletClient.writeContract(request)
  }

  return {
    address: contractConfig.address,
    // Read
    getDelegation,
    getDelegationsByUser,
    getDelegationsByPattern,
    // Write
    createDelegation,
    cancelDelegation,
  }
}

/**
 * Hook for PatternDetector contract interactions
 */
export function usePatternDetector() {
  const publicClient = usePublicClient()

  const contractConfig = getContract('PatternDetector')

  // Read functions
  const isPatternValid = async (patternHash: `0x${string}`) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.isPatternValid([patternHash])
  }

  const getPatternScore = async (patternHash: `0x${string}`) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getPatternScore([patternHash])
  }

  return {
    address: contractConfig.address,
    // Read
    isPatternValid,
    getPatternScore,
  }
}

/**
 * Hook for ExecutionEngine contract interactions
 */
export function useExecutionEngine() {
  const publicClient = usePublicClient()

  const contractConfig = getContract('ExecutionEngine')

  // Read functions
  const getExecutionStatus = async (executionId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getExecutionStatus([executionId])
  }

  const getExecutionsByDelegation = async (delegationId: bigint) => {
    if (!publicClient) throw new Error('Public client not available')

    const contract = viemGetContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      client: publicClient,
    })

    return await contract.read.getExecutionsByDelegation([delegationId])
  }

  return {
    address: contractConfig.address,
    // Read
    getExecutionStatus,
    getExecutionsByDelegation,
  }
}

/**
 * Combined hook for all contracts
 */
export function useMirrorContracts() {
  const behavioralNFT = useBehavioralNFT()
  const delegationRouter = useDelegationRouter()
  const patternDetector = usePatternDetector()
  const executionEngine = useExecutionEngine()

  return {
    behavioralNFT,
    delegationRouter,
    patternDetector,
    executionEngine,
    addresses: CONTRACTS,
  }
}
