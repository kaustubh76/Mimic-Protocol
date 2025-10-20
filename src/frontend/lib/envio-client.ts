/**
 * Envio GraphQL Client for Mirror Protocol
 *
 * Provides real-time access to indexed blockchain data
 * with sub-50ms query latency via Envio HyperSync
 */

import { ENVIO_GRAPHQL_URL } from '../src/contracts/config'

export interface Pattern {
  id: string
  tokenId: string
  creator: string
  patternType: string
  winRate: string
  totalVolume: string
  roi: string
  timestamp: string
  isActive: boolean
}

export interface Delegation {
  id: string
  delegationId: string
  delegator: string
  patternTokenId: string
  percentageAllocation: string
  smartAccountAddress: string
  timestamp: string
  isActive: boolean
}

export interface Execution {
  id: string
  delegationId: string
  patternTokenId: string
  executor: string
  token: string
  amount: string
  success: boolean
  timestamp: string
}

/**
 * Execute a GraphQL query against Envio indexer
 */
async function queryEnvio<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const startTime = Date.now()

  const response = await fetch(ENVIO_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  if (!response.ok) {
    throw new Error(`Envio query failed: ${response.statusText}`)
  }

  const json = await response.json()
  const queryTime = Date.now() - startTime

  console.log(`⚡ Envio query completed in ${queryTime}ms`)

  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`)
  }

  return json.data as T
}

/**
 * Get all patterns with optional filtering
 */
export async function getPatterns(options?: {
  creator?: string
  isActive?: boolean
  limit?: number
}): Promise<Pattern[]> {
  const query = `
    query GetPatterns($creator: String, $isActive: Boolean, $limit: Int) {
      Pattern(
        where: {
          ${options?.creator ? 'creator: { _eq: $creator }' : ''}
          ${options?.isActive !== undefined ? 'isActive: { _eq: $isActive }' : ''}
        }
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        tokenId
        creator
        patternType
        winRate
        totalVolume
        roi
        timestamp
        isActive
      }
    }
  `

  const data = await queryEnvio<{ Pattern: Pattern[] }>(query, {
    creator: options?.creator,
    isActive: options?.isActive,
    limit: options?.limit || 100,
  })

  return data.Pattern
}

/**
 * Get a single pattern by token ID
 */
export async function getPattern(tokenId: string): Promise<Pattern | null> {
  const query = `
    query GetPattern($tokenId: String!) {
      Pattern(where: { tokenId: { _eq: $tokenId } }) {
        id
        tokenId
        creator
        patternType
        winRate
        totalVolume
        roi
        timestamp
        isActive
      }
    }
  `

  const data = await queryEnvio<{ Pattern: Pattern[] }>(query, { tokenId })
  return data.Pattern[0] || null
}

/**
 * Get delegations with optional filtering
 */
export async function getDelegations(options?: {
  delegator?: string
  patternTokenId?: string
  isActive?: boolean
  limit?: number
}): Promise<Delegation[]> {
  const query = `
    query GetDelegations($delegator: String, $patternTokenId: String, $isActive: Boolean, $limit: Int) {
      Delegation(
        where: {
          ${options?.delegator ? 'delegator: { _eq: $delegator }' : ''}
          ${options?.patternTokenId ? 'patternTokenId: { _eq: $patternTokenId }' : ''}
          ${options?.isActive !== undefined ? 'isActive: { _eq: $isActive }' : ''}
        }
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        delegationId
        delegator
        patternTokenId
        percentageAllocation
        smartAccountAddress
        timestamp
        isActive
      }
    }
  `

  const data = await queryEnvio<{ Delegation: Delegation[] }>(query, {
    delegator: options?.delegator,
    patternTokenId: options?.patternTokenId,
    isActive: options?.isActive,
    limit: options?.limit || 100,
  })

  return data.Delegation
}

/**
 * Get executions for a delegation
 */
export async function getExecutions(options: {
  delegationId?: string
  patternTokenId?: string
  limit?: number
}): Promise<Execution[]> {
  const query = `
    query GetExecutions($delegationId: String, $patternTokenId: String, $limit: Int) {
      Execution(
        where: {
          ${options.delegationId ? 'delegationId: { _eq: $delegationId }' : ''}
          ${options.patternTokenId ? 'patternTokenId: { _eq: $patternTokenId }' : ''}
        }
        order_by: { timestamp: desc }
        limit: $limit
      ) {
        id
        delegationId
        patternTokenId
        executor
        token
        amount
        success
        timestamp
      }
    }
  `

  const data = await queryEnvio<{ Execution: Execution[] }>(query, {
    delegationId: options.delegationId,
    patternTokenId: options.patternTokenId,
    limit: options.limit || 100,
  })

  return data.Execution
}

/**
 * Get top performing patterns
 */
export async function getTopPatterns(limit: number = 10): Promise<Pattern[]> {
  const query = `
    query GetTopPatterns($limit: Int!) {
      Pattern(
        where: { isActive: { _eq: true } }
        order_by: { roi: desc }
        limit: $limit
      ) {
        id
        tokenId
        creator
        patternType
        winRate
        totalVolume
        roi
        timestamp
        isActive
      }
    }
  `

  const data = await queryEnvio<{ Pattern: Pattern[] }>(query, { limit })
  return data.Pattern
}

/**
 * Get user stats (patterns created, delegations, etc)
 */
export async function getUserStats(address: string) {
  const query = `
    query GetUserStats($address: String!) {
      Pattern_aggregate(where: { creator: { _eq: $address } }) {
        aggregate {
          count
        }
      }
      Delegation_aggregate(where: { delegator: { _eq: $address }, isActive: { _eq: true } }) {
        aggregate {
          count
          sum {
            percentageAllocation
          }
        }
      }
    }
  `

  const data = await queryEnvio<{
    Pattern_aggregate: { aggregate: { count: number } }
    Delegation_aggregate: {
      aggregate: {
        count: number
        sum: { percentageAllocation: string }
      }
    }
  }>(query, { address })

  return {
    patternsCreated: data.Pattern_aggregate.aggregate.count,
    activeDelegations: data.Delegation_aggregate.aggregate.count,
    totalDelegated: data.Delegation_aggregate.aggregate.sum?.percentageAllocation || '0',
  }
}

/**
 * Subscribe to real-time pattern updates (WebSocket)
 */
export function subscribeToPatterns(
  callback: (patterns: Pattern[]) => void,
  options?: { creator?: string; isActive?: boolean }
) {
  // WebSocket subscription for real-time updates
  const wsUrl = ENVIO_GRAPHQL_URL.replace('http://', 'ws://').replace('https://', 'wss://')

  const subscription = `
    subscription OnPatternUpdated($creator: String, $isActive: Boolean) {
      Pattern(
        where: {
          ${options?.creator ? 'creator: { _eq: $creator }' : ''}
          ${options?.isActive !== undefined ? 'isActive: { _eq: $isActive }' : ''}
        }
        order_by: { timestamp: desc }
      ) {
        id
        tokenId
        creator
        patternType
        winRate
        totalVolume
        roi
        timestamp
        isActive
      }
    }
  `

  // Note: Actual WebSocket implementation depends on Envio's subscription support
  // This is a placeholder for the subscription logic
  console.log('WebSocket subscription:', { wsUrl, subscription })

  return () => {
    // Cleanup function
    console.log('Unsubscribed from pattern updates')
  }
}
