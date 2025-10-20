/**
 * @file Contract Configuration and ABIs
 * @description Contract addresses and ABI definitions for Mirror Protocol
 */

import type { Address } from 'viem';
import type { ContractAddresses } from '../types/delegation';

/**
 * Monad Testnet Configuration
 * Updated: 2025-10-18 - Fixed to correct chain ID and refactored contract addresses
 */
export const MONAD_TESTNET_CHAIN_ID = 10143; // ✅ CORRECT Chain ID

/**
 * Deployed contract addresses on Monad Testnet
 * Updated: 2025-10-18 - Using refactored contracts with memory bug fixes
 */
export const CONTRACT_ADDRESSES: ContractAddresses = {
  behavioralNFT: '0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc' as Address,
  delegationRouter: '0xd5499e0d781b123724dF253776Aa1EB09780AfBf' as Address, // NEW - Refactored
  patternDetector: '0x8768e4E5c8c3325292A201f824FAb86ADae398d0' as Address,
  executionEngine: '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE' as Address, // NEW - Refactored
};

/**
 * DelegationRouter ABI (essential functions only)
 */
export const DELEGATION_ROUTER_ABI = [
  // Read functions
  {
    inputs: [{ name: 'delegationId', type: 'uint256' }],
    name: 'getDelegation',
    outputs: [
      {
        components: [
          { name: 'delegator', type: 'address' },
          { name: 'patternTokenId', type: 'uint256' },
          { name: 'percentageAllocation', type: 'uint256' },
          {
            name: 'permissions',
            type: 'tuple',
            components: [
              { name: 'maxSpendPerTx', type: 'uint256' },
              { name: 'maxSpendPerDay', type: 'uint256' },
              { name: 'expiresAt', type: 'uint256' },
              { name: 'allowedTokens', type: 'address[]' },
              { name: 'requiresConditionalCheck', type: 'bool' },
            ],
          },
          {
            name: 'conditions',
            type: 'tuple',
            components: [
              { name: 'minWinRate', type: 'uint256' },
              { name: 'minROI', type: 'int256' },
              { name: 'minVolume', type: 'uint256' },
              { name: 'isActive', type: 'bool' },
            ],
          },
          { name: 'createdAt', type: 'uint256' },
          { name: 'totalSpentToday', type: 'uint256' },
          { name: 'lastResetTimestamp', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'smartAccountAddress', type: 'address' },
        ],
        name: 'delegation',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'delegator', type: 'address' }],
    name: 'getDelegatorDelegations',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'patternTokenId', type: 'uint256' }],
    name: 'getPatternDelegations',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalDelegations',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Write functions
  {
    inputs: [
      { name: 'patternTokenId', type: 'uint256' },
      { name: 'percentageAllocation', type: 'uint256' },
      {
        name: 'permissions',
        type: 'tuple',
        components: [
          { name: 'maxSpendPerTx', type: 'uint256' },
          { name: 'maxSpendPerDay', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'allowedTokens', type: 'address[]' },
          { name: 'requiresConditionalCheck', type: 'bool' },
        ],
      },
      {
        name: 'conditions',
        type: 'tuple',
        components: [
          { name: 'minWinRate', type: 'uint256' },
          { name: 'minROI', type: 'int256' },
          { name: 'minVolume', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
      },
      { name: 'smartAccount', type: 'address' },
    ],
    name: 'createDelegation',
    outputs: [{ name: 'delegationId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'patternTokenId', type: 'uint256' },
      { name: 'percentageAllocation', type: 'uint256' },
      { name: 'smartAccount', type: 'address' },
    ],
    name: 'createSimpleDelegation',
    outputs: [{ name: 'delegationId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'delegationId', type: 'uint256' }],
    name: 'revokeDelegation',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'delegationId', type: 'uint256' },
      { name: 'newPercentage', type: 'uint256' },
    ],
    name: 'updateDelegationPercentage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'delegationId', type: 'uint256' },
      { indexed: true, name: 'delegator', type: 'address' },
      { indexed: true, name: 'patternTokenId', type: 'uint256' },
      { indexed: false, name: 'percentageAllocation', type: 'uint256' },
      { indexed: false, name: 'smartAccountAddress', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'DelegationCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'delegationId', type: 'uint256' },
      { indexed: true, name: 'delegator', type: 'address' },
      { indexed: true, name: 'patternTokenId', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'DelegationRevoked',
    type: 'event',
  },
] as const;

/**
 * BehavioralNFT ABI (essential functions only)
 */
export const BEHAVIORAL_NFT_ABI = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getPatternMetadata',
    outputs: [
      {
        components: [
          { name: 'creator', type: 'address' },
          { name: 'patternType', type: 'string' },
          { name: 'patternData', type: 'bytes' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'winRate', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'roi', type: 'int256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'isPatternActive',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPatterns',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCreatorPatterns',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'patternType', type: 'string' },
      { indexed: false, name: 'patternData', type: 'bytes' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
    name: 'PatternMinted',
    type: 'event',
  },
] as const;
