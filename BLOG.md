# Building Real-Time Behavioral Trading Infrastructure with Envio HyperSync

### How I used Envio to power sub-5ms pattern detection, real-time trade execution, and a live dashboard that runs against real Uniswap V2 liquidity.

*By Kaustubh Agrawal*

![Mirror Protocol Live Dashboard](./docs/images/dashboard-hero.png)
*[mirror-protocol-nine.vercel.app](https://mirror-protocol-nine.vercel.app) — 139+ real trades, 7 strategy NFTs, sub-5ms Envio queries, live on Ethereum Sepolia.*

---

## The Project

**Mirror Protocol** is a DeFi application where trading strategies become NFTs, other users delegate capital to those NFTs, and an automated bot executes real Uniswap V2 swaps when on-chain conditions match — all orchestrated through Envio HyperSync's real-time event indexing.

> A trader mints their strategy as an ERC-721. Other users delegate with conditions like "only execute if win rate > 80%." A keeper bot queries Envio every 5 seconds, validates conditions in <5ms, and fires a real swap. The whole cycle — from on-chain event to dashboard render — takes under 3 seconds.

Everything runs on Ethereum Sepolia with real Uniswap V2 liquidity. 139+ successful swaps have executed so far, both WETH→USDC and USDC→WETH, all verifiable on [Sepolia Etherscan](https://sepolia.etherscan.io).

---

## Why I Built This on Envio

The core problem Mirror Protocol solves is **speed of decision**. The executor bot needs to answer a question every 5 seconds: "which delegations are active, what are their pattern metrics, and should I execute a trade right now?"

Without a real-time indexer, answering that question means reading from the blockchain directly:

```
Per delegation:
  → getDelegationBasics()      ~200ms RPC call
  → getPatternMetadata()       ~200ms RPC call  
  → getDelegationConditions()  ~200ms RPC call

× 7 active delegations = 21 RPC calls = 4.2 seconds minimum
```

That's a 4-second decision latency before the bot can even begin building a transaction. At that speed, the "real-time" dashboard would update once every 10 seconds at best. The product wouldn't feel alive.

**With Envio HyperSync**, the same information comes from one GraphQL query in **3-5ms**:

```graphql
{
  Delegation(where: {isActive: {_eq: true}}) {
    delegationId
    patternTokenId
    percentageAllocation
    smartAccountAddress
    pattern {
      winRate
      roi
      totalVolume
      isActive
      patternType
    }
  }
}
```

One round-trip. Every field. Sub-5ms. That's the difference between a product that feels like a dashboard and one that feels like a live feed.

---

## The Envio Integration — Technical Deep Dive

### Event Architecture

Mirror Protocol emits 8 distinct events across 3 contracts, all indexed by Envio:

**BehavioralNFT** (pattern lifecycle):
- `PatternMinted` — new strategy created, indexed with type + creator + metadata
- `PatternPerformanceUpdated` — win rate, volume, ROI changes
- `PatternDeactivated` — strategy retired
- `Transfer` — NFT ownership changes

**DelegationRouter** (delegation management):
- `DelegationCreated` — new capital delegation with allocation % and smart account
- `DelegationRevoked` — delegation withdrawn
- `DelegationUpdated` — allocation changed
- `TradeExecuted` — execution result with amount, success flag, timestamp

**UniswapV2Adapter** (DEX execution):
- `Swap` — real swap detail: tokenIn, tokenOut, amountIn, amountOut, recipient

### Schema Design

I designed the Envio schema around how the data gets consumed, not how the contracts emit it:

```graphql
type Pattern @entity {
  tokenId: BigInt! @index
  patternType: String!
  creator: Bytes! @index
  winRate: BigInt!
  roi: Int!
  totalVolume: BigInt!
  isActive: Boolean! @index
  # Derived counts — computed in the handler, not queried separately
  delegationCount: Int!
  successfulExecutions: Int!
}

type TradeExecution @entity {
  delegationId: BigInt! @index
  pattern: Pattern!          # ← Envio relation, enables nested queries
  amount: BigInt!
  success: Boolean! @index   # ← indexed for the success-only feed filter
  txHash: Bytes! @index      # ← join key for PoolSwap
}

type PoolSwap @entity {
  tokenIn: Bytes!
  tokenOut: Bytes!
  amountIn: BigInt!
  amountOut: BigInt!          # ← the real Uniswap V2 output amount
  txHash: Bytes! @index       # ← join key for TradeExecution
}
```

**Key design decisions:**

1. **`Pattern` has derived counts** (`delegationCount`, `successfulExecutions`) that get incremented in the event handler rather than computed via aggregation queries. This keeps the frontend's pattern-browser query fast — one `Pattern(limit: 20)` call returns everything the card needs without joins.

2. **`PoolSwap` is a separate entity joined by `txHash`**, not nested under `TradeExecution`. This is because the `Swap` event comes from a different contract (the adapter) than `TradeExecuted` (the engine). Envio doesn't enforce cross-contract event relations, so the frontend joins them client-side: fetch both in one GraphQL request, build a `Map<txHash, PoolSwap>`, attach to each trade row.

3. **`success` is indexed on `TradeExecution`** so the LiveExecutionFeed can query `where: {success: {_eq: true}}` at the GraphQL level instead of filtering 139+ rows client-side. This matters because the engine's try/catch wrapper records failed swaps as `success: false` — without the filter, the feed would show a mix of real trades and under-funded failures.

### Event Handler Pattern

Every handler follows the same structure: read the event, compute derived state, write entities, update system metrics. Here's the `TradeExecuted` handler (simplified):

```typescript
DelegationRouter.TradeExecuted.handler(async ({ event, context }) => {
  const { delegationId, patternTokenId, amount, success, timestamp } = event.params;

  // 1. Write the TradeExecution entity
  context.TradeExecution.set({
    id: `${delegationId}-${timestamp}-${event.block.number}`,
    delegation_id: delegationId.toString(),
    pattern_id: patternTokenId.toString(),
    amount,
    success,
    timestamp: BigInt(timestamp),
    txHash: event.transaction.hash,
    // ...
  });

  // 2. Update the delegation's running stats
  const delegation = await context.Delegation.get(delegationId.toString());
  if (delegation) {
    context.Delegation.set({
      ...delegation,
      totalExecutions: delegation.totalExecutions + 1,
      successfulExecutions: delegation.successfulExecutions + (success ? 1 : 0),
      totalAmountTraded: delegation.totalAmountTraded + amount,
    });
  }

  // 3. Update the pattern's execution counts
  const pattern = await context.Pattern.get(patternTokenId.toString());
  if (pattern) {
    context.Pattern.set({
      ...pattern,
      successfulExecutions: pattern.successfulExecutions + (success ? 1 : 0),
    });
  }

  // 4. Update global system metrics
  // ... (similar read-modify-write on SystemMetrics entity)
});
```

**Why this matters:** Every piece of state the frontend and bot need — delegation stats, pattern metrics, system-wide counters — is computed incrementally in the handler and available via a single GraphQL query. No aggregation, no client-side computation, no chain reads. The handler does the work once at index time; every subsequent query is a direct read.

### HyperSync Configuration

```yaml
networks:
  - id: 11155111  # Ethereum Sepolia
    start_block: 10633021
    hypersync_config:
      url: https://sepolia.hypersync.xyz
    contracts:
      - name: BehavioralNFT
        address: ["0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954"]
        handler: EventHandlers.ts
        events:
          - event: "PatternMinted(uint256 indexed tokenId, ...)"
          # ... 4 events

      - name: DelegationRouter
        address: ["0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8"]
        handler: EventHandlers.ts
        events:
          - event: "DelegationCreated(uint256 indexed delegationId, ...)"
          # ... 4 events

      - name: UniswapV2Adapter
        address: ["0x5B59f315d4E2670446ed7B130584A326A0f7c2D3"]
        handler: EventHandlers.ts
        events:
          - event: "Swap(address indexed sender, ...)"
```

**HyperSync vs RPC polling:** The indexer uses HyperSync (`hypersync_config`) instead of RPC polling (`rpc_config`). HyperSync batch-fetches historical events efficiently — the initial sync from block 10633021 to head (covering all 139+ trades) completes in **under 30 seconds**. With RPC polling on Sepolia, the same sync would take minutes due to per-block rate limits.

### Envio Hosted Service

The indexer runs on Envio's hosted service via a dedicated Git branch (`envio-deploy-sepolia`). Every push triggers a rebuild + redeploy with a new GraphQL endpoint. The current endpoint:

```
https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql
```

The hosted service handles reorgs (`rollback_on_reorg: true`), auto-scales with event volume, and provides a built-in GraphQL explorer for debugging queries.

---

## How Envio Powers Each Product Feature

| Feature | Envio's Role | Without Envio |
|---|---|---|
| **Live Execution Feed** | Polls `TradeExecution + PoolSwap` every 5s, renders in <100ms | Would need to parse raw tx receipts per trade — 200ms+ per row, N RPC calls |
| **Pattern Browser** | Single `Pattern(limit: 20)` query returns win rate, ROI, volume, delegation count | 4 RPC calls per pattern × 7 patterns = 1.4s+ load time |
| **Bot Decision Loop** | One query for all 7 delegations + pattern metrics in 3-5ms | 21 RPC calls = 4.2s decision latency per cycle |
| **Portfolio Dashboard** | `Delegation` entity has pre-computed `totalAmountTraded`, `totalEarnings` | Client-side aggregation across N trade receipts |
| **DEX Detail Display** | `PoolSwap` entity stores real amountIn/amountOut from adapter Swap event | Parse Uniswap V2 pair logs from raw receipts per trade |
| **Analytics Charts** | `SystemMetrics` entity with running totals updated per event | Full-table scan or client-side aggregation |

---

## Real DEX Execution

Every trade is a real Uniswap V2 swap through this flow:

```
ExecutionEngine._externalCall(adapter, callData)
  → UniswapV2Adapter.swap(tokenIn, amountIn, minOut, to)
    → IERC20(tokenIn).safeTransferFrom(engine, adapter, amountIn)
    → router.swapExactTokensForTokens([tokenIn, tokenOut], to)
      → real constant-product math in WETH/USDC pair
    → emit Swap(sender, tokenIn, tokenOut, amountIn, amountOut, to)
  → engine records TradeExecuted event
→ Envio indexes both events in <50ms
→ Frontend joins by txHash, renders: "5.00 USDC → 0.0007 WETH"
```

**Pool:** [WETH/USDC on Sepolia](https://sepolia.etherscan.io/address/0x72e46e15ef83c896de44b1874b4af7ddab5b4f74) — ~40 WETH / ~340K USDC reserves.

**Bidirectional:** Both WETH→USDC and USDC→WETH, same adapter, same pool. The bot's trade direction is configurable without contract changes.

---

## Contracts

| Contract | Address | What It Does |
|---|---|---|
| [BehavioralNFT](https://sepolia.etherscan.io/address/0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954) | `0xCFa224…` | ERC-721 with on-chain win rate, ROI, volume |
| [PatternDetector](https://sepolia.etherscan.io/address/0x4C122A516930a5E23f3c31Db53Ee008a2720527E) | `0x4C122A…` | Validates strategy quality before minting |
| [DelegationRouter](https://sepolia.etherscan.io/address/0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8) | `0xD36fB1…` | Manages delegations with permissions + conditions |
| [ExecutionEngine](https://sepolia.etherscan.io/address/0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A) | `0x1C1b05…` | Orchestrates execution, 3-layer delegation chains |
| [UniswapV2Adapter](https://sepolia.etherscan.io/address/0x5B59f315d4E2670446ed7B130584A326A0f7c2D3) | `0x5B59f3…` | Wraps Uniswap V2 Router02 with indexable events |

---

## Testing

149 tests including **forked Sepolia integration tests** against real Uniswap V2:

```bash
./test/run-sepolia-harness.sh
# Layer 1: 143 unit/integration tests — <1 second
# Layer 2: 6 forked Sepolia tests — ~30 seconds
#   ✓ Adapter wiring correct
#   ✓ Full flow: delegate → fund → swap → assert balance changes
#   ✓ 3-layer delegation executes all layers
#   ✓ Underfunded engine returns false (not revert)
# All 149 tests passed ✓
```

---

## Try It

**[Live Dashboard](https://mirror-protocol-nine.vercel.app)** — watch the feed, no wallet needed.

**[Envio Playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)** — run this query:

```graphql
{
  SystemMetrics { successfulExecutions averageQueryLatency }
  TradeExecution(where: {success: {_eq: true}}, order_by: {timestamp: desc}, limit: 5) {
    txHash
    pattern { patternType }
  }
  PoolSwap(order_by: {timestamp: desc}, limit: 5) {
    amountIn amountOut tokenIn tokenOut
  }
}
```

**[Source Code](https://github.com/kaustubh76/Mimic-Protocol)** — `./test/run-sepolia-harness.sh` runs 149 tests against real Sepolia.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Indexing | **Envio HyperSync + HyperIndex** |
| Smart Contracts | Solidity 0.8.20, Foundry |
| DEX | Uniswap V2 Router02 (Sepolia) |
| Frontend | React, wagmi, viem, Framer Motion |
| Bot | Node.js, viem, Envio GraphQL |
| Chain | Ethereum Sepolia (11155111) |

---

*Built with [Envio HyperSync](https://docs.envio.dev) on Ethereum Sepolia*

*[Live Demo](https://mirror-protocol-nine.vercel.app) · [Source](https://github.com/kaustubh76/Mimic-Protocol) · [Envio Playground](https://indexer.dev.hyperindex.xyz/14ba103/v1/graphql)*

**Tags:** `Envio` `HyperSync` `HyperIndex` `DeFi` `Uniswap V2` `NFT` `Ethereum` `Web3`
