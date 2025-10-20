import type { Abi } from 'viem';
import BehavioralNFTABI from './abis/BehavioralNFT.json';
import DelegationRouterABI from './abis/DelegationRouter.json';
import PatternDetectorABI from './abis/PatternDetector.json';
import ExecutionEngineABI from './abis/ExecutionEngine.json';

export const MONAD_CHAIN_ID = 10143;

// Updated contract addresses - deployed on Monad Testnet
// Last updated: 2025-10-18 (Refactored contracts with memory bug fixes)
export const CONTRACTS = {
  BEHAVIORAL_NFT: '0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc' as `0x${string}`,
  DELEGATION_ROUTER: '0xd5499e0d781b123724dF253776Aa1EB09780AfBf' as `0x${string}`, // NEW - Refactored
  PATTERN_DETECTOR: '0x8768e4E5c8c3325292A201f824FAb86ADae398d0' as `0x${string}`,
  EXECUTION_ENGINE: '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE' as `0x${string}` // NEW - Refactored
};

export const CONTRACT_ADDRESSES = CONTRACTS;

export const ABIS = {
  BEHAVIORAL_NFT: BehavioralNFTABI as Abi,
  DELEGATION_ROUTER: DelegationRouterABI as Abi,
  PATTERN_DETECTOR: PatternDetectorABI as Abi,
  EXECUTION_ENGINE: ExecutionEngineABI as Abi
};

export const MONAD_RPC_URL = 'https://rpc.ankr.com/monad_testnet'; // Using Ankr RPC (more reliable)

// Envio GraphQL endpoint for real-time indexing
// Note: Update this with your actual Envio deployment URL
export const ENVIO_GRAPHQL_URL = import.meta.env.VITE_ENVIO_GRAPHQL_URL ||
  'https://indexer.bigdevenergy.link/mirror-protocol/v1/graphql';
