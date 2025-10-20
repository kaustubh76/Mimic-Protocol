/**
 * @file Mirror Protocol TypeScript Types
 * @description Type definitions for MetaMask Delegation Toolkit integration
 */

import type { Address, Hash } from 'viem';

/**
 * Delegation permissions structure matching DelegationRouter.sol
 */
export interface DelegationPermissions {
  maxSpendPerTx: bigint;
  maxSpendPerDay: bigint;
  expiresAt: bigint;
  allowedTokens: Address[];
  requiresConditionalCheck: boolean;
}

/**
 * Conditional requirements structure matching DelegationRouter.sol
 */
export interface ConditionalRequirements {
  minWinRate: bigint;      // Basis points (6000 = 60%)
  minROI: bigint;          // Basis points (1000 = 10%)
  minVolume: bigint;       // Minimum total volume
  isActive: boolean;
}

/**
 * Full delegation data structure
 */
export interface Delegation {
  delegator: Address;
  patternTokenId: bigint;
  percentageAllocation: bigint;
  permissions: DelegationPermissions;
  conditions: ConditionalRequirements;
  createdAt: bigint;
  totalSpentToday: bigint;
  lastResetTimestamp: bigint;
  isActive: boolean;
  smartAccountAddress: Address;
}

/**
 * Pattern metadata from BehavioralNFT.sol
 */
export interface PatternMetadata {
  creator: Address;
  patternType: string;
  patternData: `0x${string}`;
  createdAt: bigint;
  winRate: bigint;
  totalVolume: bigint;
  roi: bigint;
  isActive: boolean;
}

/**
 * MetaMask Smart Account configuration
 */
export interface SmartAccountConfig {
  address: Address;
  isDeployed: boolean;
  implementation: 'Hybrid' | 'MSA';
  owner: Address;
}

/**
 * Delegation creation parameters
 */
export interface CreateDelegationParams {
  patternTokenId: bigint;
  percentageAllocation: bigint;  // 100-10000 (1%-100%)
  permissions: DelegationPermissions;
  conditions: ConditionalRequirements;
  smartAccountAddress?: Address;
}

/**
 * Simple delegation creation parameters
 */
export interface CreateSimpleDelegationParams {
  patternTokenId: bigint;
  percentageAllocation: bigint;  // 100-10000 (1%-100%)
  smartAccountAddress?: Address;
}

/**
 * Transaction status
 */
export interface TxStatus {
  hash?: Hash;
  status: 'idle' | 'pending' | 'success' | 'error';
  error?: Error;
}

/**
 * Envio pattern metrics
 */
export interface PatternMetrics {
  tokenId: bigint;
  currentWinRate: bigint;
  currentROI: bigint;
  currentVolume: bigint;
  executionCount: number;
  lastUpdated: number;
}

/**
 * Delegation validation result
 */
export interface ValidationResult {
  isValid: boolean;
  reason: string;
}

/**
 * Contract addresses configuration
 */
export interface ContractAddresses {
  behavioralNFT: Address;
  delegationRouter: Address;
  patternDetector?: Address;
  executionEngine?: Address;
}
