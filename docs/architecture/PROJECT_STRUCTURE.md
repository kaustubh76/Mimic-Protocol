# Mirror Protocol - Project Structure

## 📁 Root Directory Structure

```
Mimic Protocol/
├── .claude/                    # Claude Code configuration
├── .env                        # Environment variables (PRIVATE - not committed)
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore rules
├── .gitmodules                # Git submodules (OpenZeppelin)
├── CLAUDE.md                  # Project context for Claude AI
├── README.md                  # Main project documentation
├── foundry.toml               # Foundry configuration
├── package.json               # Node.js dependencies
│
├── contracts/                 # Smart contracts (Solidity)
│   ├── BehavioralNFT.sol
│   ├── DelegationRouter.sol
│   ├── ExecutionEngine.sol
│   ├── PatternDetector.sol
│   └── interfaces/
│
├── script/                    # Foundry deployment scripts
│   ├── DeployBehavioralNFT.s.sol
│   ├── DeployDelegationRouter.s.sol
│   ├── DeployExecutionEngine.s.sol
│   ├── DeployPatternDetector.s.sol
│   ├── CompleteFlowMinimal.s.sol
│   ├── TestPatternAndDelegation.s.sol
│   └── AddExecutorAndTest.s.sol
│
├── scripts/                   # Helper shell scripts
│   └── helpers/
│       ├── check-contracts.sh
│       ├── mint-pattern.sh
│       └── mint-all-strategies.sh
│
├── test/                      # Solidity tests
│   └── *.t.sol
│
├── src/                       # Frontend & Envio source
│   ├── frontend/             # React frontend
│   └── envio/                # Envio indexer
│
├── docs/                      # Documentation
│   ├── archive/              # Old documentation
│   ├── guides/               # Setup and usage guides
│   └── status/               # Current status documents
│
├── logs/                      # Deployment and test logs
├── broadcast/                 # Foundry broadcast data
├── lib/                       # Dependencies (OpenZeppelin)
└── delegation-framework/      # MetaMask delegation toolkit

```

## 📝 Key Files

### Configuration
- **`.env`** - Private keys, RPC URLs, contract addresses
- **`foundry.toml`** - Solidity compiler settings, network configs
- **`package.json`** - Frontend dependencies

### Documentation
- **`README.md`** - Project overview and setup
- **`CLAUDE.md`** - AI assistant context
- **`docs/status/REFACTOR_COMPLETE.md`** - Latest refactor status
- **`docs/status/TESTING_SUMMARY.md`** - Contract testing results
- **`docs/status/QUICK_STATUS.md`** - Quick reference

### Smart Contracts (contracts/)
- **`BehavioralNFT.sol`** - Pattern NFTs
- **`DelegationRouter.sol`** - Delegation management (✅ Refactored)
- **`ExecutionEngine.sol`** - Trade execution (✅ Refactored)
- **`PatternDetector.sol`** - Pattern validation & minting

### Deployment Scripts (script/)
- **`CompleteFlowMinimal.s.sol`** - End-to-end test (optimized)
- **`TestPatternAndDelegation.s.sol`** - Pattern + delegation test
- **`Deploy*.s.sol`** - Individual contract deployment

### Helper Scripts (scripts/helpers/)
- **`check-contracts.sh`** - Quick contract state verification
- **`mint-pattern.sh`** - Mint single pattern
- **`mint-all-strategies.sh`** - Batch mint strategies

## 🗂️ Documentation Organization

### docs/archive/
Old documentation from development iterations

### docs/guides/
- **Setup guides** - Envio, UI, contracts
- **Quick starts** - Fast setup references

### docs/status/
- **`REFACTOR_COMPLETE.md`** - Latest code refactor details
- **`TESTING_SUMMARY.md`** - Test results and status
- **`QUICK_STATUS.md`** - Current blockers and next steps

## 🚮 Ignored Files (.gitignore)

The following are not tracked in git:
- `cache/`, `cache_foundry/`, `out/` - Build artifacts
- `node_modules/` - Dependencies
- `logs/`, `*.log` - Deployment logs
- `.env` - Private keys and secrets

## 📊 Current Status

### ✅ Completed
- Smart contracts refactored (memory bug fixed)
- Documentation organized
- Build artifacts cleaned
- Deployment scripts ready

### ⏳ Pending
- Need more MONAD testnet tokens (~0.35 more)
- Deploy refactored contracts
- Run end-to-end test
- Verify ExecutionEngine interactions

## 🔧 Quick Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Deploy to Monad testnet
forge script script/DeployDelegationRouter.s.sol --rpc-url $RPC --broadcast --legacy

# Check contract state
./scripts/helpers/check-contracts.sh

# Clean build artifacts
forge clean
```

## 📚 Important Notes

1. **Never commit .env** - Contains private keys
2. **Build artifacts are temporary** - Run `forge build` to regenerate
3. **Logs are for debugging** - Check `logs/` for deployment details
4. **Documentation in docs/** - Current status in `docs/status/`

---

**Last Updated:** October 16, 2025
**Version:** Post-refactor, pre-deployment
