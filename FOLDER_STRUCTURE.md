# Mirror Protocol - Folder Structure Guide

This document explains the organization of the Mirror Protocol codebase after cleanup.

## Root Directory Structure

```
Mimic Protocol/
├── contracts/              # Smart contracts
├── script/                 # Foundry deployment scripts
├── test/                   # Contract tests
├── src/                    # Source code
│   ├── envio/             # Envio indexer configuration
│   └── frontend/          # React frontend application
├── docs/                   # Documentation (organized)
├── delegation-framework/   # MetaMask delegation toolkit submodule
├── broadcast/             # Foundry deployment artifacts
├── cache_foundry/         # Foundry cache
├── out/                   # Compiled contract artifacts
├── logs/                  # Deployment and test logs
└── lib/                   # Dependencies (git submodules)
```

## Core Directories

### `/contracts` - Smart Contracts
Core protocol smart contracts:
- `BehavioralNFT.sol` - NFTs representing trading patterns
- `DelegationRouter.sol` - Manages delegations to patterns
- `PatternRegistry.sol` - Stores pattern metadata
- `ExecutionEngine.sol` - Automated pattern execution
- `CircuitBreaker.sol` - Emergency stop mechanism

### `/script` - Deployment Scripts
Foundry scripts for deployment and testing:
- `DeployUpdatedRouter.s.sol` - Latest router deployment
- `MintStrategiesSimple.s.sol` - Pattern minting script
- `FinalFlowTest.s.sol` - End-to-end flow test

### `/test` - Contract Tests
Comprehensive test suite:
- `BehavioralNFT.t.sol` - NFT contract tests
- `DelegationRouter.t.sol` - Router tests
- `ExecutionEngine.t.sol` - Execution engine tests
- `Integration.t.sol` - Integration tests
- `SimpleEndToEndTest.t.sol` - E2E tests

### `/src` - Source Code

#### `/src/envio` - Envio Indexer
Real-time blockchain indexing:
- `config.yaml` - Envio configuration
- Event handlers for pattern detection
- Database schema definitions

#### `/src/frontend` - React Frontend
User interface application:
- `src/components/` - React components
- `src/hooks/` - Custom React hooks
- `src/contracts/` - Contract ABIs and configs
- `src/config/` - Application configuration

### `/docs` - Documentation (Organized)

#### `/docs/architecture`
System architecture and design:
- `PROJECT_STRUCTURE.md` - Original project structure
- `ENVIO_INDEXING_STATUS.md` - Envio integration status
- `ENVIO_INTEGRATION_STATUS.md` - Integration details
- `GAME_CHANGER_FEATURES.md` - Key features
- `HOMEPAGE_STRATEGIES_AND_RPC_EXPLAINED.md` - Technical explanations
- `WHY_ENVIO_NOT_INTEGRATED.md` - Integration decisions

#### `/docs/fixes`
Bug fixes and debugging:
- `ALL_FIXES_COMPLETE.md` - Complete fix summary
- `FINAL_FIX_SUMMARY.md` - Final fixes
- `DELEGATION_FIX_SUMMARY.md` - Delegation fixes
- `FRONTEND_ERRORS_FIXED.md` - Frontend fixes
- `PATTERN_NAME_ERROR_FIX.md` - Pattern naming fix
- `POSITION_OUT_OF_BOUNDS_FIX.md` - Position error fix
- `BLANK_SCREEN_FIXED.md` - UI blank screen fix
- `BLANK_SCREEN_ROOT_CAUSE_FIXED.md` - Root cause analysis
- `PROCESS_ENV_FIX.md` - Environment variable fix
- `REFACTOR_SUCCESS.md` - Refactoring summary
- `TRANSACTION_REVERT_DEBUGGING.md` - Transaction debugging

#### `/docs/testing`
Testing documentation:
- `TESTING_AND_DEMO_GUIDE.md` - Testing guide
- `TESTING_VERIFICATION_COMPLETE.md` - Verification results
- `END_TO_END_TEST_SUMMARY.md` - E2E test summary
- `COMPREHENSIVE_END_TO_END_VALIDATION.md` - Validation report
- `LIVE_TESTING_REPORT.md` - Live testing results

#### `/docs/progress-reports`
Development progress:
- `DELEGATION_FLOW_READY.md` - Delegation flow completion
- `DELEGATION_UI_COMPLETE.md` - UI completion
- `IMPLEMENTATION_COMPLETE.md` - Implementation status
- `UI_INTEGRATION_COMPLETE.md` - UI integration
- `UI_REDESIGN_COMPLETE.md` - UI redesign
- `UI_VERIFICATION_AND_TESTING.md` - UI verification
- `CLEANUP_SUMMARY.md` - Cleanup report
- `CURRENT_STATUS.md` - Current project status
- `PATTERN_MINTING_SUCCESS.md` - Pattern minting success

### `/delegation-framework` - MetaMask Delegation Toolkit
Git submodule containing MetaMask's delegation framework:
- Core delegation contracts
- Enforcement mechanisms
- Test suite

## Build Artifacts (Git Ignored)

### `/broadcast`
Foundry deployment transaction logs
- Organized by script name
- Contains deployment receipts and transaction data

### `/cache_foundry` & `/out`
Foundry compilation artifacts
- Cached contract data
- Compiled bytecode and ABIs

### `/logs`
Deployment and test execution logs
- `final-test.log` - Latest test run
- `deploy-router.log` - Router deployment log
- `complete-flow-final.log` - Complete flow test log

## Key Configuration Files

### Root Level
- `.env` - Environment variables (RPC URLs, private keys)
- `.gitignore` - Git ignore patterns
- `foundry.toml` - Foundry configuration
- `package.json` - Node.js dependencies
- `CLAUDE.md` - AI assistant context
- `README.md` - Project overview
- `QUICK_START.md` - Quick start guide

## Working with the Codebase

### Development Workflow
1. Smart contract development happens in `/contracts`
2. Deploy using scripts in `/script`
3. Test with Foundry in `/test`
4. Frontend development in `/src/frontend`
5. Envio indexer in `/src/envio`

### Build Commands
```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy
forge script script/DeployUpdatedRouter.s.sol --rpc-url $RPC_URL --broadcast

# Frontend
cd src/frontend
pnpm install
pnpm dev
```

### Documentation
- Architecture docs → `/docs/architecture`
- Bug fixes → `/docs/fixes`
- Testing guides → `/docs/testing`
- Progress updates → `/docs/progress-reports`

## Git Submodules
- `delegation-framework/` - MetaMask Delegation Toolkit
- `lib/openzeppelin-contracts` - OpenZeppelin contracts
- `lib/forge-std` - Foundry standard library

## Notes
- All backup files (`.bak`) have been removed
- Temporary directories cleaned up
- Documentation organized by category
- Build artifacts properly git-ignored
- Clean separation of concerns
