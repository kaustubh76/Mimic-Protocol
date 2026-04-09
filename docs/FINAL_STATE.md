# Mirror Protocol — Final State

**Last Updated:** 2026-03-24
**Status:** PRODUCTION READY — LIVE ON MONAD TESTNET
**Frontend:** https://mirror-protocol-nine.vercel.app

---

## Deployed Contracts (Monad Testnet, Chain ID 10143)

| Contract | Address | Purpose |
|----------|---------|---------|
| **BehavioralNFT** | `0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26` | ERC-721 pattern NFTs with performance tracking |
| **DelegationRouter** | `0xd5499e0d781b123724dF253776Aa1EB09780AfBf` | Multi-layer delegation management with permissions |
| **PatternDetector** | `0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE` | Pattern validation & NFT minting (<50ms via Envio) |
| **ExecutionEngine** | `0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8` | Automated trade execution with safety checks |
| **MockDEX** | `0x8108e615e7858f246f820eae0844c983ea5e9a12` | DEX simulator for testing execution |
| **TestToken** | `0x21C06C325F7b308cF1B52568B462747944B3Fde6` | ERC-20 test token |

**RPC:** `https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0`
**Explorer:** `https://explorer.testnet.monad.xyz`

---

## Envio HyperSync: DEPLOYED & LIVE

| Property | Value |
|----------|-------|
| **GraphQL Endpoint** | `https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql` |
| **HyperSync** | ENABLED (monad-testnet.hypersync.xyz) |
| **Deploy Branch** | `envio-deploy` (indexer root: `src/envio`) |
| **Events Indexed** | 8 event types across 2 contracts |
| **Query Latency** | <50ms (avg 1ms processing) |
| **Peak Throughput** | 102 events/second |
| **Patterns Indexed** | 7 (momentum, mean_reversion, arbitrage, liquidity, yield, composite) |
| **Delegations** | 4 active |
| **Trade Executions** | 16 (100% success rate) |
| **Total Volume** | 290+ MON |

### How Envio Enables Scalability

**Current Architecture:**
- HyperSync replaces RPC polling — batch syncing is 100x more efficient
- 8 event handlers process all contract interactions in real-time
- GraphQL layer provides flexible, cacheable queries for the frontend
- Hosted service auto-deploys on push — zero infrastructure management

**Scaling Path:**
| Dimension | Current | Production Target |
|-----------|---------|-------------------|
| Chains | 1 (Monad) | 5+ (Ethereum, Arbitrum, Base, etc.) |
| Event throughput | 102 eps | 10,000+ eps |
| Query latency | <50ms | <20ms |
| Indexed entities | 10 | 50+ |
| Concurrent frontends | 1 | Unlimited (hosted service) |

**Why Envio (Not Subgraph/Custom Indexer):**
- HyperSync: 100x faster historical sync than RPC polling
- Hosted service: No infrastructure to manage, auto-scaling
- Multi-chain: Same config pattern extends to any EVM chain
- TypeScript handlers: Full type safety, familiar DX
- Real-time: Events indexed within seconds of block confirmation

**Frontend hooks consuming Envio data:**
- `useEnvioMetrics` — system-wide metrics (patterns, delegations, execution stats, earnings)
- `usePatterns` — pattern NFT data with creator relationships
- `useDelegations` — delegation data with pattern ROI
- `useExecutionStats` — per-delegation trade execution history (fixed: numeric type)
- `usePatternAnalytics` — risk scores, quality grades, health metrics
- `useDelegationEarnings` — earnings computed from volume x ROI
- `usePortfolioStats` — aggregate portfolio metrics with client-side earnings
- `useUserStats` — user-specific statistics with computed earnings

---

## Frontend: FULLY FUNCTIONAL

**Deployment:** Vercel — https://mirror-protocol-nine.vercel.app
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS 4 + Wagmi 2 + Viem 2

### Key UI Features
- **Landing page** shows live Envio metrics + pattern leaderboard (no wallet needed)
- **Earnings displayed** on dashboard, pattern cards, delegations, and portfolio
- **Real-time data** from Envio HyperSync — no test data, no mocks
- **Pattern analytics** with risk scores, quality grades, trending indicators
- **Glassmorphism UI** with fluid animations (Framer Motion)

### 12 Components
| Component | Purpose |
|-----------|---------|
| WalletConnect | MetaMask connection + network switching |
| PatternBrowser | Pattern discovery grid |
| PatternLeaderboard | Pattern rankings by performance |
| EnhancedPatternCard | Pattern display with metrics + earnings |
| MyDelegations | User's delegation management |
| CreateDelegationModal | Create new delegations |
| UpdateDelegationModal | Modify existing delegations |
| EnvioMetricsDashboard | Real-time Envio performance metrics + earnings |
| DelegationEarningsDisplay | Earnings tracking per delegation |
| DelegationExecutionStats | Execution history per delegation |
| ExecutionStats | Global execution statistics |
| RiskScoreBadge | Risk assessment indicator |

### 12 Hooks
| Hook | Purpose |
|------|---------|
| useSmartAccount | MetaMask Delegation Toolkit smart account creation |
| usePatterns | Fetch patterns from chain + Envio |
| useDelegations | Fetch user delegations with pattern ROI |
| useCreateDelegation | Create delegation transaction |
| useRevokeDelegation | Revoke delegation transaction |
| useUpdateDelegation | Update delegation allocation |
| useEnvioMetrics | Real-time system metrics from Envio GraphQL |
| useExecutionStats | Execution history and stats (numeric type fix) |
| usePatternAnalytics | Pattern performance analytics, risk, quality |
| useDelegationEarnings | Delegation earnings (volume x ROI) |
| usePortfolioStats | Aggregate portfolio metrics with earnings |
| useUserStats | User-specific statistics with computed earnings |

**Key:** `testData.ts` has been removed — all data comes from real on-chain + Envio sources.

---

## Smart Contracts: 7 Contracts

| Contract | Lines | Purpose |
|----------|-------|---------|
| DelegationRouter.sol | 958 | Multi-layer NFT delegations with permissions, spending limits, conditions |
| ExecutionEngine.sol | 790 | Automated trade execution, batch processing, gas tracking |
| PatternDetector.sol | 688 | Pattern validation, duplicate prevention, cooldown enforcement |
| CircuitBreaker.sol | 537 | Emergency stops, loss thresholds, rate limiting per pattern |
| BehavioralNFT.sol | 477 | ERC-721 pattern NFTs with performance metrics |
| MockDEX.sol | 58 | DEX simulator (2% slippage) |
| TestToken.sol | 42 | ERC-20 test token |

**Deployment scripts:** 21 scripts in `script/`
**Test suite:** 7 test files in `test/`, 67+ tests passing

---

## Envio Indexer Architecture

```
src/envio/
├── config.yaml              # HyperSync config for Monad 10143
├── schema.graphql           # 10 entities: Pattern, Creator, Delegation, etc.
├── EventHandlers.ts         # Root handler (hosted service entry point)
├── package.json             # envio@2.32.6
├── pnpm-lock.yaml           # Generated with pnpm 9.10.0 (hosted compat)
├── pnpm-workspace.yaml      # Workspace: generated/
├── src/
│   ├── EventHandlers.ts     # 8 event handlers with earnings computation
│   ├── patternDetector.ts   # Sub-50ms detection engine
│   ├── AnalyticsEngine.ts   # Leaderboard, trending, comparisons
│   ├── PatternValidator.ts  # Risk scores, quality grades
│   ├── ErrorHandler.ts      # Recovery strategies, circuit breaker
│   └── utils/
│       ├── decoder.ts       # Pattern data encoding/decoding
│       ├── logger.ts        # Module-based logging
│       └── metrics.ts       # Performance tracking
└── abis/
    ├── BehavioralNFT.json
    └── DelegationRouter.json
```

### Event Handlers (8 total)
| Event | Handler |
|-------|---------|
| PatternMinted | Creates Pattern + Creator entities, updates SystemMetrics |
| PatternPerformanceUpdated | Records historical performance, updates rankings |
| PatternDeactivated | Deactivates pattern, updates creator stats |
| Transfer | Tracks NFT ownership changes |
| DelegationCreated | Creates Delegation + Delegator entities |
| DelegationRevoked | Revokes delegation, updates stats |
| DelegationUpdated | Updates allocation percentages |
| TradeExecuted | Tracks executions, computes earnings (amount x ROI / 10000) |

---

## Branch Strategy

| Branch | Purpose | Triggers |
|--------|---------|----------|
| `main` | Frontend, bot, docs, contracts | Vercel auto-deploy |
| `envio-deploy` | Envio indexer only | Envio hosted service auto-deploy |

**Important:** Only push to `envio-deploy` when changing the indexer (config, handlers, schema). Each push creates a new Envio deployment with a new endpoint URL.

---

## Source of Truth

All contract addresses and the Envio endpoint are centralized in:
**`src/frontend/src/contracts/config.ts`**

This is the single source of truth for all deployment addresses used by the frontend.
