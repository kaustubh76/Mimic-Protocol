import type { Abi } from 'viem';
import BehavioralNFTABI from './abis/BehavioralNFT.json';
import DelegationRouterABI from './abis/DelegationRouter.json';
import PatternDetectorABI from './abis/PatternDetector.json';
import ExecutionEngineABI from './abis/ExecutionEngine.json';

export const MONAD_CHAIN_ID = 10143;

// Updated contract addresses - deployed on Monad Testnet
// Last updated: 2025-10-22 (Latest deployment addresses)
export const CONTRACTS = {
  BEHAVIORAL_NFT: '0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26' as `0x${string}`,
  DELEGATION_ROUTER: '0xd5499e0d781b123724dF253776Aa1EB09780AfBf' as `0x${string}`,
  PATTERN_DETECTOR: '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE' as `0x${string}`,
  EXECUTION_ENGINE: '0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8' as `0x${string}`,
};

export const CONTRACT_ADDRESSES = CONTRACTS;

// Handle both raw array ABIs and { abi: [...] } wrapper format
const extractAbi = (json: any): Abi =>
  (Array.isArray(json) ? json : json.abi) as Abi;

export const ABIS = {
  BEHAVIORAL_NFT: extractAbi(BehavioralNFTABI),
  DELEGATION_ROUTER: extractAbi(DelegationRouterABI),
  PATTERN_DETECTOR: extractAbi(PatternDetectorABI),
  EXECUTION_ENGINE: extractAbi(ExecutionEngineABI),
};

export const MONAD_RPC_URL = 'https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0';

// Envio GraphQL endpoint for real-time indexing
// Production: uses env var (set in Vercel dashboard) with Vercel rewrite proxy as fallback
// Development: connects directly to local Envio Docker instance
export const ENVIO_GRAPHQL_URL: string =
  import.meta.env.VITE_ENVIO_GRAPHQL_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '/api/envio/graphql'
    : 'http://localhost:8080/v1/graphql');
