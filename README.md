<div align="center">

# 🔄 Mirror Protocol

### Behavioral Liquidity Infrastructure on Ethereum Sepolia

**Transform on-chain trading behavior into executable, delegatable NFTs — powered by Envio HyperSync.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-mirror--protocol--nine.vercel.app-8B5CF6?style=for-the-badge)](https://mirror-protocol-nine.vercel.app)
[![Ethereum Sepolia](https://img.shields.io/badge/Chain-Ethereum%20Sepolia-8B5CF6?style=for-the-badge)](https://sepolia.etherscan.io)
[![Envio HyperSync](https://img.shields.io/badge/Indexer-Envio%20HyperSync-06B6D4?style=for-the-badge)](https://envio.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://mirror-protocol-nine.vercel.app)

**[🚀 Live Demo](https://mirror-protocol-nine.vercel.app)** · **[📖 Blog Article](./BLOG.md)** · **[⚡ Envio Playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)** · **[🔍 Contracts on Explorer](https://sepolia.etherscan.io/address/0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954)**

</div>

---

## What is Mirror Protocol?

Mirror Protocol is a new class of DeFi primitive: it turns successful on-chain trading patterns into **tradeable, delegatable ERC-721 NFTs**. Users can mint their proven strategies as NFTs, and other users delegate capital to those NFTs via MetaMask Smart Accounts. An automated execution engine watches for matching conditions and executes trades on behalf of delegators — all in real-time, all on-chain.

The key insight: **this only works because of Envio HyperSync**. Traditional RPC-based indexing cannot sustain the query throughput and sub-second latency needed for behavioral pattern detection at scale. Envio makes it possible.

## Why Envio is Essential

| Capability | Without Envio | With Envio HyperSync |
|---|---|---|
| **Pattern Detection Latency** | 2–5s (RPC polling) | **<50ms** |
| **Query Throughput** | ~10 qps | **10,000+ events/sec** |
| **Cross-entity Joins** | Multiple RPC calls | **Single GraphQL query** |
| **Historical Analysis** | Slow block-by-block scan | **Instant aggregations** |
| **Backend Infra** | Custom indexer + DB + API | **Zero — hosted by Envio** |

The executor bot makes a single Envio query per cycle joining `Delegation → Pattern → executions → performanceUpdates`. A pure-RPC equivalent would require dozens of calls and take seconds.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER (MetaMask Wallet)                        │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ 1. Delegate capital to Pattern NFT
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│             Smart Contracts on Ethereum Sepolia                    │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐   │
│  │ BehavioralNFT│  │DelegationRouter  │  │ ExecutionEngine   │   │
│  │  (ERC-721)  │  │ (MetaMask DT)    │  │ (Auto Executor)   │   │
│  └─────────────┘  └──────────────────┘  └───────────────────┘   │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ 2. Events emitted on every action
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Envio HyperSync Indexer                         │
│        Real-time event processing  •  <50ms latency               │
│  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────┐    │
│  │ Pattern  │  │ Delegation  │  │TradeExec │  │SysMetrics  │    │
│  └──────────┘  └─────────────┘  └──────────┘  └────────────┘    │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ 3. GraphQL query (single request, joins across entities)
                 ▼
┌────────────────┬─────────────────────────────────────────────────┐
│                │                                                   │
│  React Frontend│           Executor Bot (Node.js)                 │
│  (Live UI)     │           Queries Envio every 5s                 │
│                │           Executes when conditions match          │
└────────────────┴─────────────────────────────────────────────────┘
```

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/kaustubh76/Mimic-Protocol.git
cd Mimic-Protocol

# 2. Install frontend deps
cd src/frontend && npm install --legacy-peer-deps

# 3. Run locally (uses live Envio indexer by default)
npm run dev

# 4. (Optional) Run the executor bot
cd ../../executor-bot
node bot.mjs
```

Open [http://localhost:3000](http://localhost:3000) and connect a MetaMask wallet to Ethereum Sepolia (Chain ID `11155111`).

## Project Structure

```
Mimic-Protocol/
├── contracts/          # Solidity smart contracts
│   ├── BehavioralNFT.sol       # Pattern NFT (ERC-721)
│   ├── DelegationRouter.sol    # MetaMask delegation logic
│   ├── ExecutionEngine.sol     # Auto execution + stats
│   └── PatternDetector.sol     # On-chain pattern detection
├── src/
│   ├── frontend/       # React + Vite + Tailwind dashboard
│   └── envio/          # Envio HyperIndex config + event handlers
├── executor-bot/       # Node.js bot: Envio → chain execution
├── script/             # Foundry deployment scripts
├── docs/               # Architecture, deployment, GraphQL queries
├── BLOG.md             # Full story article (Medium-ready)
└── README.md
```

## Contract Addresses (Ethereum Sepolia — Chain ID 11155111)

| Contract | Address |
|---|---|
| **BehavioralNFT** | [`0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954`](https://sepolia.etherscan.io/address/0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954) |
| **DelegationRouter** | [`0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8`](https://sepolia.etherscan.io/address/0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8) |
| **PatternDetector** | [`0x4C122A516930a5E23f3c31Db53Ee008a2720527E`](https://sepolia.etherscan.io/address/0x4C122A516930a5E23f3c31Db53Ee008a2720527E) |
| **ExecutionEngine** | [`0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A`](https://sepolia.etherscan.io/address/0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A) |
| **UniswapV2Adapter** | [`0x5B59f315d4E2670446ed7B130584A326A0f7c2D3`](https://sepolia.etherscan.io/address/0x5B59f315d4E2670446ed7B130584A326A0f7c2D3) |

## Tech Stack

| Layer | Technology |
|---|---|
| **Chain** | Ethereum Sepolia (Chain ID 11155111) |
| **Smart Contracts** | Solidity 0.8.20+, Foundry, OpenZeppelin |
| **Indexer** | Envio HyperSync (hosted) |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, recharts |
| **Web3** | Wagmi v2, Viem, MetaMask Delegation Toolkit |
| **Execution Bot** | Node.js, Viem |
| **Hosting** | Vercel (frontend), Envio Hosted Service (indexer) |

## Live Metrics (Real-Time)

Current protocol state (auto-updated via Envio):

- **13** active trading patterns
- **9** active delegations
- **47** successful trade executions (100% success rate)
- **290.02 ETH** total volume indexed
- **112.76 ETH** total earnings distributed
- **<5ms** average Envio query latency

## Documentation

- **[📖 Full Story — BLOG.md](./BLOG.md)** — How and why Mirror Protocol was built
- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** — System design deep dive
- **[🚀 Deployment Guide](./docs/DEPLOYMENT.md)** — How to deploy your own instance
- **[📊 Envio Query Playground](./docs/ENVIO_QUERIES.md)** — Ready-to-paste GraphQL queries

## Links

- **Live App**: [mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app)
- **GitHub**: [kaustubh76/Mimic-Protocol](https://github.com/kaustubh76/Mimic-Protocol)
- **Envio GraphQL Playground**: [indexer.dev.hyperindex.xyz/14ba103/v1/graphql](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)
- **Ethereum Sepolia**: [sepolia.etherscan.io](https://sepolia.etherscan.io)
- **Envio Docs**: [docs.envio.dev](https://docs.envio.dev)

## License

MIT © Kaustubh Agrawal

---

<div align="center">

**Built with ⚡ Envio HyperSync on Ethereum Sepolia · Real Uniswap V2 execution**

</div>
