import type { Abi } from 'viem';
import BehavioralNFTABI from './abis/BehavioralNFT.json';
import DelegationRouterABI from './abis/DelegationRouter.json';
import PatternDetectorABI from './abis/PatternDetector.json';
import ExecutionEngineABI from './abis/ExecutionEngine.json';

// ─── Active chain (Sepolia pivot) ────────────────────────────────────────
// Mirror Protocol pivoted from Monad testnet to Ethereum Sepolia in April 2026
// so we could route real trades through the deployed Uniswap V2 infrastructure.
// See PLAN_REAL_CPAMM.md at the repo root for the full pivot history.

export const SEPOLIA_CHAIN_ID = 11155111;

// Sepolia Mirror Protocol contracts (deployed blocks 10633021-10633023)
export const SEPOLIA_CONTRACTS = {
  BEHAVIORAL_NFT: '0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954' as `0x${string}`,
  DELEGATION_ROUTER: '0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8' as `0x${string}`,
  PATTERN_DETECTOR: '0x4C122A516930a5E23f3c31Db53Ee008a2720527E' as `0x${string}`,
  EXECUTION_ENGINE: '0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A' as `0x${string}`,
  UNISWAP_V2_ADAPTER: '0x5B59f315d4E2670446ed7B130584A326A0f7c2D3' as `0x${string}`,
};

// Sepolia Uniswap V2 infrastructure (verified live)
export const SEPOLIA_UNISWAP = {
  ROUTER: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3' as `0x${string}`,
  FACTORY: '0xF62c03E08ada871A0bEb309762E260a7a6a880E6' as `0x${string}`,
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as `0x${string}`,
  USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
};

export const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// ─── Legacy Monad (orphaned after Sepolia pivot, kept for reference) ─────
export const MONAD_CHAIN_ID = 10143;

export const MONAD_CONTRACTS = {
  BEHAVIORAL_NFT: '0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26' as `0x${string}`,
  DELEGATION_ROUTER: '0xd5499e0d781b123724dF253776Aa1EB09780AfBf' as `0x${string}`,
  PATTERN_DETECTOR: '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE' as `0x${string}`,
  EXECUTION_ENGINE: '0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8' as `0x${string}`,
};

export const MONAD_RPC_URL =
  import.meta.env.VITE_MONAD_RPC_URL || 'https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0';

// ─── Active chain exports (what the rest of the app imports) ─────────────
// All hooks and components that previously read CONTRACTS / MONAD_CHAIN_ID /
// MONAD_RPC_URL / ENVIO_GRAPHQL_URL continue to work — they now get Sepolia
// values. The legacy MONAD_* constants are still exported in case anything
// specifically wants to reference the orphaned Monad deployment.

export const ACTIVE_CHAIN_ID = SEPOLIA_CHAIN_ID;
export const CONTRACTS = SEPOLIA_CONTRACTS;
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

// Envio GraphQL endpoint — Sepolia indexer (live since 2026-04-11)
export const ENVIO_GRAPHQL_URL =
  import.meta.env.VITE_ENVIO_GRAPHQL_URL_SEPOLIA ||
  import.meta.env.VITE_ENVIO_GRAPHQL_URL ||
  'https://indexer.dev.hyperindex.xyz/009ef9b/v1/graphql';

console.log('[Mirror] Active chain:', ACTIVE_CHAIN_ID, '| Envio:', ENVIO_GRAPHQL_URL, '| RPC:', SEPOLIA_RPC_URL.substring(0, 50) + '...');
