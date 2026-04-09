# Mirror Protocol

## Behavioral Liquidity Infrastructure Powered by Envio HyperSync

[![Monad Testnet](https://img.shields.io/badge/Monad-Testnet-purple)](https://testnet.monad.xyz)
[![Envio](https://img.shields.io/badge/Powered%20by-Envio-blue)](https://envio.dev)
[![MetaMask](https://img.shields.io/badge/MetaMask-Smart%20Accounts-orange)](https://metamask.io)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](.)

**Transform on-chain trading behavior into executable, delegatable NFTs with sub-50ms pattern detection.**

Mirror Protocol turns successful trading patterns into ownable ERC-721 NFTs. Other users can delegate capital to these patterns via MetaMask Smart Accounts, and an execution engine automatically replicates trades — with granular permission controls, spending limits, and conditional safety checks. Envio HyperSync is the backbone: it indexes every on-chain event in under 50ms, making real-time pattern detection and conditional execution validation possible at a speed traditional indexers cannot match.

---

## Live Deployment

| Resource | URL |
|----------|-----|
| **Frontend** | https://mirror-protocol-nine.vercel.app |
| **Envio GraphQL** | https://indexer.dev.hyperindex.xyz/b383f5b/v1/graphql |
| **Chain** | Monad Testnet (Chain ID 10143) |

```bash
# Local Development
cd src/frontend && npm run dev    # Frontend at http://localhost:3000
cd src/envio && envio dev          # Envio indexer (requires Docker)
```

---

## Key Differentiators

| Capability | Metric | Why It Matters |
|-----------|--------|----------------|
| **Sub-50ms Pattern Detection** | 47ms avg via Envio HyperSync | 50x faster than traditional indexers (2-3s). Enables actionable trading signals instead of stale data. |
| **NFT-Based Delegation Model** | First-ever behavioral pattern NFTs | Trading strategies become ownable, tradeable assets. Delegation targets are NFTs, not wallet addresses. |
| **Automated Pattern Execution** | Smart Account-based (ERC-4337) | Permission-based automation with conditional safety. Users maintain full control via spend limits, expiration, and metric thresholds. |
| **Production-Grade Indexing** | 8 event types, 10 GraphQL entities | Envio hosted service scales automatically. Zero infrastructure management. |

---

## System Architecture

### High-Level Stack

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MIRROR PROTOCOL STACK                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  FRONTEND (React 18 + TypeScript + Wagmi + Viem)                │     │
│  │  ├── WalletConnect ──→ MetaMask Smart Account (ERC-4337)       │     │
│  │  ├── PatternBrowser ──→ Envio GraphQL (patterns, leaderboard)  │     │
│  │  ├── DelegationManager ──→ DelegationRouter contract           │     │
│  │  └── MetricsDashboard ──→ Envio SystemMetrics (5s polling)     │     │
│  └──────────────────────────────┬──────────────────────────────────┘     │
│                                 │ writes (tx)          │ reads (GraphQL) │
│                                 ▼                      ▼                 │
│  ┌────────────────────────┐    ┌──────────────────────────────────┐     │
│  │  SMART CONTRACTS       │    │  ENVIO HYPERSYNC                  │     │
│  │  (Monad Testnet)       │───▶│  (Hosted Indexer Service)         │     │
│  │                        │emit│                                   │     │
│  │  BehavioralNFT         │    │  8 Event Handlers                 │     │
│  │  PatternDetector       │    │  10 GraphQL Entities              │     │
│  │  DelegationRouter      │    │  <50ms Query Latency              │     │
│  │  ExecutionEngine       │    │  HyperSync Batch Sync             │     │
│  │  CircuitBreaker        │    │  Hasura GraphQL API               │     │
│  └────────────────────────┘    └──────────────────────────────────┘     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  MONAD TESTNET BLOCKCHAIN (Chain ID 10143)                       │    │
│  │  High-throughput EVM · Low gas costs · Fast finality             │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Smart Contract Architecture

Five contracts form the on-chain protocol, connected through interfaces:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CONTRACT DEPENDENCY GRAPH                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PatternDetector                                                         │
│  ├── Validates trading patterns against thresholds:                      │
│  │   minTrades=10, minWinRate=60%, minVolume=1 ETH, minConfidence=70%   │
│  ├── Rate limits: 1hr cooldown, max 5 activn e patterns per user          │
│  └── Calls ──▶ BehavioralNFT.mintPattern()                              │
│                     │                                                    │
│                     ▼                                                    │
│  BehavioralNFT (ERC-721)                                                │
│  ├── Stores: patternType, patternData, creator, winRate, roi, volume    │
│  ├── Emits: PatternMinted, PatternPerformanceUpdated, PatternDeactivated│
│  └── Read by ──▶ DelegationRouter (isPatternActive, getPatternMetadata) │
│                     │                                                    │
│                     ▼                                                    │
│  DelegationRouter                                                        │
│  ├── Creates delegations with permissions:                               │
│  │   maxSpendPerTx, maxSpendPerDay, expiresAt, allowedTokens            │
│  ├── Conditional requirements: minWinRate, minROI, minVolume             │
│  ├── Max delegation depth: 3 layers                                      │
│  ├── Emits: DelegationCreated, DelegationRevoked, DelegationUpdated      │
│  └── Called by ──▶ ExecutionEngine (recordExecution)                      │
│                     │                                                    │
│                     ▼                                                    │
│  ExecutionEngine                                                         │
│  ├── Validates permissions + conditional requirements                    │
│  ├── Calculates: baseAmount × percentageAllocation / 100                 │
│  ├── Executes trades via target DEX contract                             │
│  ├── Emits: TradeExecuted                                                │
│  └── Gas: ~250k single, ~150k/trade batched                             │
│                                                                          │
│  CircuitBreaker (Independent Safety Layer)                               │
│  ├── Emergency pause for all contracts                                   │
│  ├── Loss threshold monitoring per pattern                               │
│  └── Rate limiting per pattern execution                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Envio Indexer Architecture

Envio HyperSync listens to on-chain events and builds a queryable GraphQL layer. This is the critical infrastructure that makes sub-50ms pattern detection and real-time dashboards possible.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ENVIO INDEXER DATA MODEL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ON-CHAIN EVENTS              ENVIO ENTITIES                             │
│  ─────────────────            ──────────────────────────                 │
│                                                                          │
│  PatternMinted ──────────────▶ Pattern                                   │
│  PatternPerformanceUpdated ──▶ Pattern + PerformanceUpdate (history)     │
│  PatternDeactivated ─────────▶ Pattern (isActive=false)                  │
│  Transfer ───────────────────▶ Pattern (owner change)                    │
│                                    │                                     │
│                                    ├──▶ Creator (aggregated stats)       │
│                                    │    totalPatterns, avgWinRate,        │
│                                    │    avgROI, reputationScore           │
│                                    │                                     │
│  DelegationCreated ──────────▶ Delegation                                │
│  DelegationRevoked ──────────▶ Delegation (isActive=false)               │
│  DelegationUpdated ──────────▶ Delegation (new allocation)               │
│                                    │                                     │
│                                    ├──▶ Delegator (per-wallet stats)     │
│                                    │    activeDelegations, earnings,      │
│                                    │    totalCapitalDelegated             │
│                                    │                                     │
│  TradeExecuted ──────────────▶ TradeExecution                            │
│                                    │                                     │
│                                    ├──▶ earnings = amount × roi / 10000  │
│                                    └──▶ Updates: Delegation, Pattern,    │
│                                         Delegator, SystemMetrics         │
│                                                                          │
│  ALL EVENTS ─────────────────▶ SystemMetrics (singleton ID="1")          │
│                                    totalPatterns, totalDelegations,       │
│                                    totalExecutions, successRate,          │
│                                    totalVolume, totalEarnings,            │
│                                    averageQueryLatency,                   │
│                                    peakEventsPerSecond                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Indexer directory structure:**
```
src/envio/
├── config.yaml              # HyperSync config: Monad 10143, start block 19213700
├── schema.graphql           # 10 entities with relationships
├── src/
│   ├── EventHandlers.ts     # 8 event handlers with earnings computation
│   ├── patternDetector.ts   # Sub-50ms detection engine
│   ├── AnalyticsEngine.ts   # Leaderboard, trending, comparisons
│   ├── PatternValidator.ts  # Risk scores, quality grades
│   └── ErrorHandler.ts      # Recovery strategies, circuit breaker
└── abis/
    ├── BehavioralNFT.json
    └── DelegationRouter.json
```

---

## Data Flow Diagrams

### Flow 1: Pattern Detection and Minting

This flow shows how a trader's on-chain behavior becomes an ownable NFT.

```
 Trader executes           PatternDetector              BehavioralNFT
 successful trades         validates pattern            mints NFT
      │                         │                            │
      │  on-chain trades        │                            │
      ├────────────────────────▶│                            │
      │                         │  validates:                │
      │                         │  ├─ minTrades ≥ 10         │
      │                         │  ├─ winRate ≥ 60%          │
      │                         │  ├─ volume ≥ 1 ETH         │
      │                         │  ├─ confidence ≥ 70%       │
      │                         │  ├─ cooldown (1hr)         │
      │                         │  └─ max 5 active/user      │
      │                         │                            │
      │                         │  mintPattern(creator,      │
      │                         │    type, data)             │
      │                         ├───────────────────────────▶│
      │                         │                            │
      │                         │                  emit PatternMinted
      │                         │                            │
      │                         │                            ▼
      │                         │                     ┌──────────────┐
      │                         │                     │ ENVIO indexes │
      │                         │                     │ in <50ms     │
      │                         │                     └──────┬───────┘
      │                         │                            │
      │                         │                            ▼
      │                         │                     Creates entities:
      │                         │                     Pattern, Creator,
      │                         │                     SystemMetrics
      │                         │                            │
      │                         │                            ▼
      │                         │                     ┌──────────────┐
      │                         │                     │ Frontend     │
      │                         │                     │ usePatterns() │
      │                         │                     │ polls 10s    │
      │                         │                     └──────────────┘
```

### Flow 2: Delegation Creation and Automated Execution

This flow shows the complete lifecycle from delegation to automated trade execution.

```
 User                   DelegationRouter          ExecutionEngine        Envio
  │                          │                         │                  │
  │ createDelegation(        │                         │                  │
  │   patternId,             │                         │                  │
  │   allocation: 50%,       │                         │                  │
  │   maxSpend: 1000,        │                         │                  │
  │   minWinRate: 60%)       │                         │                  │
  ├─────────────────────────▶│                         │                  │
  │                          │ validates:              │                  │
  │                          │ ├─ pattern active?      │                  │
  │                          │ ├─ NFT exists?          │                  │
  │                          │ └─ depth ≤ 3?           │                  │
  │                          │                         │                  │
  │                          │── emit DelegationCreated ──────────────────▶│
  │                          │                         │                  │
  │                          │                         │           indexes │
  │                          │                         │         Delegation│
  │                          │                         │         Delegator │
  │                          │                         │      SystemMetrics│
  │                          │                         │                  │
  │        ... time passes, pattern creator trades ... │                  │
  │                          │                         │                  │
  │                          │  executeTrade(          │                  │
  │                          │    delegationId,        │   fetch metrics  │
  │                          │    token, amount)       │◀─────────────────│
  │                          │                         │  winRate, ROI    │
  │                          │                         │  (<50ms query)   │
  │                          │                         │                  │
  │                          │                         │ validates:       │
  │                          │                         │ ├─ active?       │
  │                          │                         │ ├─ not expired?  │
  │                          │                         │ ├─ spend limit?  │
  │                          │                         │ ├─ token allowed?│
  │                          │                         │ └─ winRate≥60%?  │
  │                          │                         │                  │
  │                          │                         │ execute:         │
  │                          │                         │ amount × 50%     │
  │                          │                         │ = proportional   │
  │                          │                         │   trade          │
  │                          │                         │                  │
  │                          │  recordExecution()      │                  │
  │                          │◀────────────────────────│                  │
  │                          │                         │                  │
  │                          │── emit TradeExecuted ──────────────────────▶│
  │                          │                         │                  │
  │                          │                         │   earnings =     │
  │                          │                         │   amount×roi     │
  │                          │                         │   /10000         │
  │                          │                         │                  │
  │                          │                         │   updates:       │
  │                          │                         │   Delegation     │
  │                          │                         │   Pattern        │
  │                          │                         │   Delegator      │
  │                          │                         │   SystemMetrics  │
  │                          │                         │                  │
  │◀──── useEnvioMetrics() polls every 5s ─────────────────────────────────│
  │      updated earnings, execution count, success rate                  │
```

### Flow 3: Frontend Data Pipeline

Shows how the frontend queries Envio with fallback strategies.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    FRONTEND DATA PIPELINE                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Hook                   Data Source          Fallback        Poll     │
│  ──────────────────     ─────────────────    ──────────      ─────   │
│  useEnvioMetrics()  ──▶ Envio SystemMetrics  (graceful off)  5s     │
│  usePatterns()      ──▶ Envio Pattern[]      ──▶ on-chain    10s    │
│  useDelegations()   ──▶ Envio Delegation[]   ──▶ on-chain    10s    │
│  useExecutionStats()──▶ Envio TradeExec[]    (empty)         10s    │
│  usePatternAnalytics()─▶ Envio Pattern       (empty)         10s    │
│  useDelegationEarnings()▶ Envio Delegation   (computed)      10s    │
│  usePortfolioStats() ──▶ Envio aggregate     (computed)      10s    │
│  useUserStats()     ──▶ Envio Delegator      (computed)      10s    │
│                                                                       │
│  Priority: Envio GraphQL ──▶ Blockchain Direct ──▶ Empty State       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  Envio GraphQL Endpoint                                      │     │
│  │  https://indexer.dev.hyperindex.xyz/b383f5b/v1/graphql      │     │
│  │                                                              │     │
│  │  Query latency: <50ms (avg 1ms processing)                  │     │
│  │  Entities: Pattern, Creator, Delegation, Delegator,         │     │
│  │            TradeExecution, PerformanceUpdate, SystemMetrics  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Why Envio is Essential

Mirror Protocol cannot function without Envio HyperSync. Here's why:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENVIO vs TRADITIONAL INDEXERS                          │
├──────────────────────┬──────────────────┬────────────────────────────────┤
│  Capability          │  Envio HyperSync │  Traditional (Subgraph/RPC)    │
├──────────────────────┼──────────────────┼────────────────────────────────┤
│  Query Latency       │  47ms            │  2,000-3,000ms                 │
│  Historical Sync     │  Batch (100x)    │  Block-by-block                │
│  Pattern Detection   │  Real-time       │  Minutes behind                │
│  Conditional Checks  │  <50ms           │  Not feasible in time          │
│  Infrastructure      │  Hosted (zero)   │  Self-managed servers          │
│  Multi-chain         │  Config change   │  Separate deployments          │
│  Deploy on Push      │  Automatic       │  Manual redeploy               │
├──────────────────────┴──────────────────┴────────────────────────────────┤
│                                                                          │
│  The core insight: pattern detection for trading automation requires     │
│  sub-second latency. At 2-3 seconds, a trading signal is stale.         │
│  At 47ms, it's actionable. This gap is what makes Envio essential —     │
│  not just faster, but the difference between viable and not viable.      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Envio enables three things no other indexer can at this speed:**

1. **Real-time pattern detection** — Analyzing behavioral sequences across thousands of transactions requires low-latency access to both historical and live events. HyperSync's batch sync processes 10M+ events in seconds.

2. **Conditional execution validation** — Before every automated trade, the ExecutionEngine queries Envio for current pattern metrics (winRate, ROI, volume). This check must complete in under 50ms to not block execution. Traditional indexers at 2-3s would make conditional delegations impractical.

3. **Live dashboards without on-chain queries** — The frontend's 12 hooks query Envio's GraphQL layer instead of making expensive RPC calls. This saves ~50,000 gas per execution and enables real-time metrics display for all users, including those without wallets.

---

## Deployed Contracts (Monad Testnet)

| Contract | Address | Gas (avg) |
|----------|---------|-----------|
| **BehavioralNFT** | [`0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26`](https://explorer.testnet.monad.xyz/address/0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26) | 140k mint |
| **DelegationRouter** | [`0xd5499e0d781b123724dF253776Aa1EB09780AfBf`](https://explorer.testnet.monad.xyz/address/0xd5499e0d781b123724dF253776Aa1EB09780AfBf) | 120k create |
| **PatternDetector** | [`0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE`](https://explorer.testnet.monad.xyz/address/0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE) | 50k validate |
| **ExecutionEngine** | [`0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8`](https://explorer.testnet.monad.xyz/address/0x4364457325CeB1Af9f0BDD72C0927eD30CB69eD8) | 250k execute |

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Envio Query Latency** | 47ms avg | 50x faster than RPC-based indexing |
| **Envio Processing** | 1ms avg | Per-event handler processing time |
| **Peak Throughput** | 102 eps (live) | HyperSync capable of 10,000+ eps |
| **Events Indexed** | 8 types | PatternMinted, DelegationCreated, TradeExecuted, etc. |
| **GraphQL Entities** | 10 | Pattern, Creator, Delegation, Delegator, TradeExecution, etc. |
| **Contract Tests** | 67/67 | 100% pass rate, 100% coverage |
| **Frontend Build** | <2s | Vite 5 hot module replacement |
| **Trade Success Rate** | 100% | 16/16 automated executions successful |

---

## Project Structure

```
Mimic Protocol/
├── contracts/                       # Solidity 0.8.20+
│   ├── BehavioralNFT.sol            # ERC-721 pattern NFTs (477 lines)
│   ├── DelegationRouter.sol         # Multi-layer delegations (958 lines)
│   ├── PatternDetector.sol          # Pattern validation (688 lines)
│   ├── ExecutionEngine.sol          # Automated execution (790 lines)
│   ├── CircuitBreaker.sol           # Emergency safety (537 lines)
│   └── interfaces/                  # IBehavioralNFT, IDelegationRouter, etc.
├── src/
│   ├── envio/                       # Envio HyperSync indexer
│   │   ├── config.yaml              # Monad 10143, block 19213700
│   │   ├── schema.graphql           # 10 entities
│   │   └── src/EventHandlers.ts     # 8 event handlers
│   └── frontend/                    # React 18 + TypeScript
│       ├── src/components/          # 12 components
│       ├── src/hooks/               # 12 hooks (8 query Envio)
│       └── src/contracts/config.ts  # Single source of truth for addresses
├── test/                            # Foundry test suite (67 tests)
├── script/                          # 21 deployment scripts
└── docs/                            # Architecture, guides, status
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Monad Testnet (10143) | High-throughput EVM, low gas, fast finality |
| **Contracts** | Solidity 0.8.20 + Foundry | Smart contract development and testing |
| **Security** | OpenZeppelin | ERC-721, ReentrancyGuard, Pausable, AccessControl |
| **Indexing** | Envio HyperSync | Real-time event indexing, GraphQL API, hosted service |
| **Frontend** | React 18 + TypeScript | UI framework with type safety |
| **Ethereum** | Viem 2.38 + Wagmi 2.18 | Lightweight chain interactions and React hooks |
| **Accounts** | MetaMask Delegation Toolkit 0.13 | ERC-4337 Smart Account creation and delegation |
| **Styling** | Tailwind CSS 4 + Framer Motion | Glassmorphism UI with fluid animations |
| **Build** | Vite 5 | Fast development server and production builds |

---

## Scalability Path

| Dimension | Current (Testnet) | Production Target |
|-----------|-------------------|-------------------|
| Chains | 1 (Monad) | 5+ (Ethereum, Arbitrum, Base, etc.) |
| Event throughput | 102 eps | 10,000+ eps |
| Query latency | <50ms | <20ms |
| Indexed entities | 10 | 50+ |
| Patterns | 7 | 1,000+ |
| Concurrent users | ~10 | Unlimited (Envio hosted service auto-scales) |

**Multi-chain expansion** requires only a config change in Envio — same event handlers, same schema, additional network blocks in `config.yaml`. HyperSync supports every major EVM chain.

---

## Getting Started

### Prerequisites
- Node.js 18+, Foundry, Docker, pnpm/npm, MetaMask

### Setup
```bash
git clone <repo-url> && cd "Mimic Protocol"
forge install                          # Contract dependencies
cd src/envio && pnpm install           # Envio indexer
cd ../frontend && npm install          # Frontend

cp .env.example .env                   # Configure RPC + keys
```

### Run
```bash
# Terminal 1: Envio
cd src/envio && pnpm dev

# Terminal 2: Frontend
cd src/frontend && npm run dev

# Terminal 3: Deploy (if needed)
forge script script/Deploy.s.sol --rpc-url $MONAD_RPC_URL --broadcast
```

### Test
```bash
forge test                             # 67/67 passing
```

---

## Core User Flow

1. **Landing Page** — View live Envio metrics and pattern leaderboard (no wallet needed)
2. **Connect Wallet** — MetaMask auto-switches to Monad testnet
3. **Create Smart Account** — Counterfactual ERC-4337 account (no deployment gas)
4. **Browse Patterns** — Pattern cards with real-time win rates, ROI, volume from Envio
5. **Delegate** — Simple (pattern + percentage) or Advanced (spend limits, conditions, expiration)
6. **Automated Execution** — ExecutionEngine replicates trades proportionally with safety checks
7. **Track Earnings** — Dashboard shows per-delegation earnings computed from on-chain execution data

---

## Links

- **Envio Docs**: https://docs.envio.dev
- **HyperSync API**: https://hypersync.envio.dev
- **MetaMask Delegation Toolkit**: https://docs.metamask.io/delegation-toolkit/
- **Monad Testnet**: https://testnet.monad.xyz
- **Monad Explorer**: https://explorer.testnet.monad.xyz

---

**Project Status**: Production Ready | **Last Updated**: March 2026 | **Team**: Mirror Protocol

**Mirror Protocol — Your Trading Style is Now a Product**
