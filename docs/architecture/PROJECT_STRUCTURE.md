# Mirror Protocol - Project Structure

**Last Updated:** 2026-03-22

## Root Directory Structure

```
Mimic Protocol/
├── .claude/                    # Claude Code configuration
├── .env                        # Environment variables (PRIVATE - not committed)
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore rules
├── .gitmodules                # Git submodules (OpenZeppelin)
├── CLAUDE.md                  # Project context for Claude AI
├── README.md                  # Main project documentation
├── QUICK_START.md             # Getting started guide
├── foundry.toml               # Foundry configuration (Solidity 0.8.20)
├── config.yaml                # Envio indexer configuration
├── schema.graphql             # GraphQL schema (10.5KB)
├── package.json               # Node.js dependencies
│
├── contracts/                 # Smart contracts (7 files, 3,550 LOC)
│   ├── BehavioralNFT.sol              # Pattern NFTs (477 lines)
│   ├── DelegationRouter.sol           # Multi-layer delegation management (958 lines)
│   ├── ExecutionEngine.sol            # Automated trade execution (790 lines)
│   ├── PatternDetector.sol            # Pattern validation & minting (688 lines)
│   ├── CircuitBreaker.sol             # Emergency stops & rate limiting (537 lines)
│   ├── MockDEX.sol                    # DEX simulator for testing (58 lines)
│   └── TestToken.sol                  # ERC-20 test token (42 lines)
│
├── script/                    # Foundry deployment scripts (21 files)
│   ├── DeployAll.s.sol                # Complete deployment
│   ├── DeployBehavioralNFT.s.sol      # Individual deploys
│   ├── DeployDelegationRouter.s.sol
│   ├── DeployExecutionEngine.s.sol
│   ├── DeployPatternDetector.s.sol
│   ├── DeployUpdatedRouter.s.sol
│   ├── DeployMockDEX.s.sol
│   ├── MintStrategies.s.sol           # Pattern minting scripts
│   ├── MintStrategiesSimple.s.sol
│   ├── MintAllStrategies.s.sol
│   ├── MintAll7Patterns.s.sol
│   ├── Mint5More.s.sol
│   ├── Mint5MoreStrategies.s.sol
│   ├── MintAdditionalStrategies.s.sol
│   ├── DisableCooldown.s.sol
│   ├── TestFullFlowOptimized.s.sol    # Test scripts
│   ├── TestPatternAndDelegation.s.sol
│   ├── TestDeployment.s.sol
│   ├── AddExecutorAndTest.s.sol
│   ├── CompleteFlowMinimal.s.sol
│   └── FinalFlowTest.s.sol
│
├── test/                      # Solidity tests (7 files, 67+ tests)
│   ├── BehavioralNFT.t.sol
│   ├── DelegationRouter.t.sol
│   ├── ExecutionEngine.t.sol
│   ├── PatternDetector.t.sol
│   ├── Integration.t.sol
│   ├── SimpleEndToEndTest.t.sol
│   └── SimpleIntegrationTest.t.sol
│
├── src/
│   ├── frontend/              # React + Wagmi frontend (Vercel deployed)
│   │   ├── src/
│   │   │   ├── App.tsx                # Main app (tabbed UI with glassmorphism)
│   │   │   ├── main.tsx               # Entry point
│   │   │   ├── globals.css            # Tailwind + glassmorphism styles
│   │   │   ├── components/            # 12 UI components
│   │   │   │   ├── WalletConnect.tsx
│   │   │   │   ├── PatternBrowser.tsx
│   │   │   │   ├── PatternLeaderboard.tsx
│   │   │   │   ├── EnhancedPatternCard.tsx
│   │   │   │   ├── MyDelegations.tsx
│   │   │   │   ├── CreateDelegationModal.tsx
│   │   │   │   ├── UpdateDelegationModal.tsx
│   │   │   │   ├── EnvioMetricsDashboard.tsx
│   │   │   │   ├── DelegationEarningsDisplay.tsx
│   │   │   │   ├── DelegationExecutionStats.tsx
│   │   │   │   ├── ExecutionStats.tsx
│   │   │   │   └── RiskScoreBadge.tsx
│   │   │   ├── hooks/                 # 12 React hooks
│   │   │   │   ├── useSmartAccount.ts
│   │   │   │   ├── usePatterns.ts
│   │   │   │   ├── useDelegations.ts
│   │   │   │   ├── useCreateDelegation.ts
│   │   │   │   ├── useRevokeDelegation.ts
│   │   │   │   ├── useUpdateDelegation.ts
│   │   │   │   ├── useEnvioMetrics.ts
│   │   │   │   ├── useExecutionStats.ts
│   │   │   │   ├── usePatternAnalytics.ts
│   │   │   │   ├── useDelegationEarnings.ts
│   │   │   │   ├── usePortfolioStats.ts
│   │   │   │   └── useUserStats.ts
│   │   │   ├── contracts/             # Contract config & ABIs
│   │   │   │   ├── config.ts          # SOURCE OF TRUTH for addresses
│   │   │   │   └── abis/              # All contract ABIs
│   │   │   └── lib/
│   │   │       └── utils.ts           # Utility functions
│   │   ├── package.json               # Frontend dependencies
│   │   └── vite.config.ts             # Vite build config
│   │
│   └── envio/                 # Envio HyperSync indexer
│       ├── config.yaml                # Event handlers config
│       ├── schema.graphql             # GraphQL schema
│       ├── package.json               # Envio dependencies
│       └── src/
│           ├── EventHandlers.ts       # Main event processing
│           ├── behavioralNFT.ts       # Pattern entity handlers
│           ├── delegationRouter.ts    # Delegation handlers
│           ├── patternDetector.ts     # Pattern validation
│           ├── AnalyticsEngine.ts     # Metrics computation
│           ├── ErrorHandler.ts        # Error handling
│           └── PatternValidator.ts    # Pattern validation
│
├── delegation-framework/      # MetaMask Delegation Toolkit
├── generated/                 # Envio codegen output (gitignored)
├── lib/                       # Dependencies (OpenZeppelin)
├── broadcast/                 # Foundry broadcast data
├── out/                       # Compiled contract artifacts
└── docs/                      # Documentation (128+ files)
    ├── FINAL_STATE.md                 # Authoritative state reference
    ├── architecture/                  # System design docs
    ├── progress-reports/              # Development progress
    ├── fixes/                         # Bug fix records
    ├── testing/                       # Test documentation
    ├── status/                        # Status reports
    ├── guides/                        # Setup & usage guides
    ├── archive/                       # Archived documentation
    └── archive-status-reports/        # Archived status reports
```

## Key Files

### Configuration
- **`.env`** - Private keys, RPC URLs, contract addresses
- **`foundry.toml`** - Solidity compiler (0.8.20, optimizer on, 200 runs)
- **`config.yaml`** - Envio indexer config (Monad testnet, 8 event types)
- **`schema.graphql`** - GraphQL schema for Envio entities

### Source of Truth
- **`src/frontend/src/contracts/config.ts`** - All contract addresses and Envio endpoint

### Documentation
- **`docs/FINAL_STATE.md`** - Complete project state reference
- **`README.md`** - Project overview
- **`CLAUDE.md`** - AI assistant context

## Deployed Contracts (Monad Testnet - Chain ID: 10143)

| Contract | Address |
|----------|---------|
| BehavioralNFT | `0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26` |
| DelegationRouter | `0xd5499e0d781b123724dF253776Aa1EB09780AfBf` |
| PatternDetector | `0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE` |
| ExecutionEngine | `0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8` |
| MockDEX | `0x8108e615e7858f246f820eae0844c983ea5e9a12` |
| TestToken | `0x21C06C325F7b308cF1B52568B462747944B3Fde6` |

## Current Status: All Contracts Deployed and Verified

- Smart contracts compiled, tested (67+ tests), and deployed
- Envio indexer live at HyperSync
- Frontend deployed on Vercel
- All features functional

## Quick Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Run frontend
cd src/frontend && pnpm dev

# Run Envio codegen
cd src/envio && pnpm envio codegen
```

## Important Notes

1. **Never commit .env** - Contains private keys
2. **Build artifacts are temporary** - Run `forge build` to regenerate
3. **`generated/` is gitignored** - Run Envio codegen to regenerate
4. **Source of truth for addresses** - Always use `src/frontend/src/contracts/config.ts`
