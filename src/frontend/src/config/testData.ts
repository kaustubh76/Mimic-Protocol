/**
 * @file Test Data for Development
 * @description Provides fallback test data when RPC is unavailable or for local testing
 * This data mimics the structure of real blockchain data
 */

import { type Pattern } from '../hooks/usePatterns';
import { type Delegation } from '../hooks/useDelegations';

// Development mode flag
export const DEV_MODE = import.meta.env.DEV && import.meta.env.VITE_USE_TEST_DATA === 'true';

/**
 * Test patterns matching the 5 trading strategies from MintTradingPatterns.s.sol
 * These mirror real on-chain data structure
 */
export const TEST_PATTERNS: Pattern[] = [
  {
    id: 1,
    tokenId: BigInt(1),
    creator: '0x1234567890123456789012345678901234567890',
    owner: '0x1234567890123456789012345678901234567890',
    patternType: 'AggressiveMomentum',
    winRate: BigInt(8750), // 87.5%
    totalVolume: BigInt('10287000000000000000000'), // ~10,287 tokens
    roi: BigInt(2870), // 28.7%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60), // 7 days ago
  },
  {
    id: 2,
    tokenId: BigInt(2),
    creator: '0x2345678901234567890123456789012345678901',
    owner: '0x2345678901234567890123456789012345678901',
    patternType: 'ConservativeMeanReversion',
    winRate: BigInt(9000), // 90%
    totalVolume: BigInt('5000000000000000000000'), // 5,000 tokens
    roi: BigInt(270), // 2.7%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60), // 10 days ago
  },
  {
    id: 3,
    tokenId: BigInt(3),
    creator: '0x3456789012345678901234567890123456789012',
    owner: '0x3456789012345678901234567890123456789012',
    patternType: 'BreakoutTrading',
    winRate: BigInt(6667), // 66.67%
    totalVolume: BigInt('12000000000000000000000'), // 12,000 tokens
    roi: BigInt(4583), // 45.83%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60), // 14 days ago
  },
  {
    id: 4,
    tokenId: BigInt(4),
    creator: '0x4567890123456789012345678901234567890123',
    owner: '0x4567890123456789012345678901234567890123',
    patternType: 'ScalpingStrategy',
    winRate: BigInt(8000), // 80%
    totalVolume: BigInt('1500000000000000000000'), // 1,500 tokens
    roi: BigInt(125), // 1.25%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 15 * 60 * 60), // 15 hours ago
  },
  {
    id: 5,
    tokenId: BigInt(5),
    creator: '0x5678901234567890123456789012345678901234',
    owner: '0x5678901234567890123456789012345678901234',
    patternType: 'SwingTrading',
    winRate: BigInt(8571), // 85.71%
    totalVolume: BigInt('10500000000000000000000'), // 10,500 tokens
    roi: BigInt(3900), // 39%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60), // 21 days ago
  },
  {
    id: 6,
    tokenId: BigInt(6),
    creator: '0x6789012345678901234567890123456789012345',
    owner: '0x6789012345678901234567890123456789012345',
    patternType: 'GridTrading',
    winRate: BigInt(7500), // 75%
    totalVolume: BigInt('8000000000000000000000'), // 8,000 tokens
    roi: BigInt(1200), // 12%
    isActive: false, // Inactive example
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60), // 30 days ago
  },
];

/**
 * Test delegations for development
 * These would normally come from getDelegatorDelegations() and delegations() calls
 */
export const TEST_DELEGATIONS: Delegation[] = [
  {
    id: 1,
    delegationId: BigInt(1),
    delegator: '0x1234567890123456789012345678901234567890',
    patternTokenId: BigInt(1),
    percentageAllocation: BigInt(2500), // 25%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60),
    smartAccountAddress: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    patternName: 'AggressiveMomentum',
  },
  {
    id: 2,
    delegationId: BigInt(2),
    delegator: '0x1234567890123456789012345678901234567890',
    patternTokenId: BigInt(2),
    percentageAllocation: BigInt(5000), // 50%
    isActive: true,
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60),
    smartAccountAddress: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    patternName: 'ConservativeMeanReversion',
  },
  {
    id: 3,
    delegationId: BigInt(3),
    delegator: '0x1234567890123456789012345678901234567890',
    patternTokenId: BigInt(5),
    percentageAllocation: BigInt(2500), // 25%
    isActive: false, // Revoked example
    createdAt: BigInt(Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60),
    smartAccountAddress: '0xABCDEF0123456789ABCDEF0123456789ABCDEF01',
    patternName: 'SwingTrading',
  },
];

/**
 * Get test patterns for development
 */
export function getTestPatterns(): Pattern[] {
  return TEST_PATTERNS;
}

/**
 * Get test delegations for a specific address
 */
export function getTestDelegations(address?: string): Delegation[] {
  if (!address) return [];
  // In dev mode, return test delegations for any connected address
  return TEST_DELEGATIONS.map(d => ({
    ...d,
    delegator: address,
  }));
}

/**
 * Get test user stats
 */
export function getTestUserStats() {
  return {
    totalPatterns: 0, // Patterns owned by user
    activeDelegations: 2,
    totalDelegations: 3,
  };
}
