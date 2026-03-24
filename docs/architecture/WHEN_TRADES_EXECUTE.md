# When Will ExecutionEngine Run Trades?

**Current Status**: ExecutionEngine is deployed but **requires an Executor Bot** to call it

---

## Answer: ExecutionEngine Needs an Executor Bot

The ExecutionEngine **does not execute trades automatically on its own**. It requires an authorized **executor** (address with `isExecutor` permission) to call the `executeTrade()` function.

---

## How It Works

### Architecture

```
┌─────────────────┐
│  Pattern NFT    │  Pattern conditions met
│  (e.g. RSI < 30)│  (detected by Envio)
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│   Executor Bot      │  Monitors Envio for
│   (Off-chain)       │  pattern signals
└────────┬────────────┘
         │
         │ 1. Detects signal
         │ 2. Fetches metrics from Envio (<50ms)
         │ 3. Calls executeTrade()
         │
         ▼
┌──────────────────────┐
│  ExecutionEngine     │  Validates and executes
│  (On-chain)          │  the trade
└────────┬─────────────┘
         │
         ▼
    Trade Executed ✅
```

---

## Current State

### ✅ What's Deployed

1. **ExecutionEngine Contract**: `0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE`
2. **DelegationRouter Contract**: `0xd5499e0d781b123724dF253776Aa1EB09780AfBf`
3. **BehavioralNFT Contract**: `0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26`
4. **Envio Indexer**: Running and indexing events

### ❌ What's Missing

**Executor Bot** - The off-chain service that:
- Monitors pattern conditions via Envio
- Detects when trades should execute
- Calls `ExecutionEngine.executeTrade()`

---

## How Executor Bot Would Work

### Conceptual Flow

```javascript
// Executor Bot (Node.js/TypeScript)

async function executorBot() {
  while (true) {
    // 1. Query Envio for active delegations
    const delegations = await envio.query(`
      query {
        Delegation(where: {isActive: {_eq: true}}) {
          delegationId
          patternTokenId
          conditions {
            minWinRate
            minROI
            minVolume
          }
        }
      }
    `);

    for (const delegation of delegations) {
      // 2. Check if pattern conditions are met
      const pattern = await envio.getPattern(delegation.patternTokenId);

      if (shouldExecuteTrade(pattern, delegation.conditions)) {
        // 3. Fetch performance metrics from Envio (<50ms)
        const metrics = await envio.getPerformanceMetrics(delegation.patternTokenId);

        // 4. Execute trade via ExecutionEngine
        await executionEngine.executeTrade(
          {
            delegationId: delegation.delegationId,
            token: WETH_ADDRESS,
            amount: calculateTradeSize(pattern),
            targetContract: DEX_ADDRESS,
            callData: encodeSwapCall()
          },
          metrics // Envio-sourced, <50ms fetch
        );

        console.log(`✅ Executed trade for delegation ${delegation.delegationId}`);
      }
    }

    await sleep(10000); // Check every 10 seconds
  }
}
```

---

## Why No Executor Bot Yet?

**This is a hackathon project** focused on demonstrating:
1. ✅ Smart contract infrastructure (deployed)
2. ✅ Envio integration for sub-50ms queries (working)
3. ✅ Frontend for delegation management (complete)
4. ✅ Pattern NFT minting and delegation (working)

**The Executor Bot would be added in production** to:
- Run 24/7 monitoring patterns
- Execute trades when conditions match
- Manage gas costs and retries

---

## Options to Trigger Trades

### Option 1: Build Custom Executor Bot (Best for Production)

**Tech Stack**:
- Node.js/TypeScript
- Ethers.js/Viem for blockchain interaction
- Envio GraphQL client for sub-50ms queries
- Private key for executor wallet

**Implementation**: [`src/executor-bot/index.ts`](#) (to be created)

**Pros**:
- Full control over execution logic
- Can optimize for gas costs
- Custom pattern detection algorithms

**Cons**:
- Requires infrastructure (server, monitoring)
- Need to manage private keys securely

---

### Option 2: Use Chainlink Automation (Easiest)

**How it works**:
- Deploy an "Upkeep" contract
- Chainlink nodes monitor the contract
- When conditions met, Chainlink calls ExecutionEngine

**Pros**:
- No infrastructure needed
- Decentralized and reliable
- Built-in monitoring

**Cons**:
- Requires LINK tokens
- Less control over execution timing

---

### Option 3: Manual Execution (Demo/Testing)

**For hackathon demo purposes**, you can manually trigger trades:

```bash
# Add yourself as executor
cast send $EXECUTION_ENGINE \
  "addExecutor(address)" \
  $YOUR_ADDRESS \
  --private-key $PRIVATE_KEY \
  --rpc-url https://monad-testnet.g.alchemy.com/v2/YOUR_KEY

# Manually execute a trade
cast send $EXECUTION_ENGINE \
  "executeTrade((uint256,address,uint256,address,bytes),(uint256,int256,uint256,uint256))" \
  "(1, 0xTokenAddress, 1000000000000000000, 0xDEXAddress, 0xCalldata)" \
  "(8750, 2870, 10000000000000000000000, $(date +%s))" \
  --private-key $PRIVATE_KEY \
  --rpc-url https://monad-testnet.g.alchemy.com/v2/YOUR_KEY
```

**Pros**: Quick for demos
**Cons**: Not automatic, requires manual intervention

---

## Timeline for Automatic Execution

### Current State (Now)
```
Delegation Created → Waiting for Executor Bot → No Trades Yet
```

### With Executor Bot (Future)
```
Delegation Created → Bot Detects Signal → Trade Executed Automatically
                    (10 seconds)      (200ms)
```

---

## For Hackathon Demo

### Recommended Approach

**Show the automation capability without building full bot**:

1. **Demo Script**: Create a simple one-shot executor
   ```bash
   # demo-execute-trade.sh
   # Shows that automation COULD work
   cast send $EXECUTION_ENGINE "executeTrade(...)" ...
   ```

2. **Explain to Judges**:
   - "The ExecutionEngine is deployed and ready"
   - "In production, an Executor Bot would monitor Envio"
   - "When pattern conditions match, bot calls executeTrade()"
   - "For this demo, we'll manually trigger to show it works"

3. **Show the Flow**:
   - User creates delegation ✅
   - Show "No executions yet" (expected) ✅
   - Manually execute one trade (demo)
   - Refresh and show execution stats appear ✅

---

## Building a Simple Executor Bot

If you want to quickly build a minimal executor for the demo:

### `executor-bot/index.ts`

```typescript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from './chains';

const EXECUTION_ENGINE = '0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE';
const GRAPHQL_ENDPOINT = 'http://localhost:8080/v1/graphql';

async function main() {
  const account = privateKeyToAccount(process.env.EXECUTOR_PRIVATE_KEY);

  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(process.env.RPC_URL),
  });

  console.log('🤖 Executor Bot Started');
  console.log('👤 Executor:', account.address);

  while (true) {
    try {
      // 1. Query active delegations from Envio
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `{
            Delegation(where: {isActive: {_eq: true}}) {
              delegationId
              patternTokenId
            }
          }`
        })
      });

      const { data } = await response.json();
      const delegations = data.Delegation || [];

      console.log(`📊 Found ${delegations.length} active delegations`);

      for (const delegation of delegations) {
        // 2. Check if pattern conditions met (simplified)
        const shouldExecute = Math.random() > 0.9; // 10% chance (demo)

        if (shouldExecute) {
          console.log(`⚡ Executing trade for delegation ${delegation.delegationId}`);

          // 3. Call executeTrade
          const tx = await walletClient.writeContract({
            address: EXECUTION_ENGINE,
            abi: ExecutionEngineABI,
            functionName: 'executeTrade',
            args: [
              { /* TradeParams */ },
              { /* PerformanceMetrics */ }
            ]
          });

          console.log(`✅ Trade executed: ${tx}`);
        }
      }

    } catch (err) {
      console.error('❌ Error:', err);
    }

    await new Promise(resolve => setTimeout(resolve, 10000)); // 10s interval
  }
}

main();
```

---

## Summary

### When Will Trades Execute?

**Answer**: Trades will execute when:

1. ✅ **Delegation exists** (user created delegation)
2. ✅ **Pattern conditions met** (win rate, ROI, volume thresholds)
3. ❌ **Executor Bot running** ← **THIS IS MISSING**
4. ✅ **ExecutionEngine called** (by executor bot)

### Current Status

```
User creates delegation → ✅ Done
Pattern conditions met  → ✅ Can detect via Envio
Executor Bot monitors   → ❌ Not running
ExecutionEngine called  → ❌ Waiting for executor
Trades execute          → ❌ Not yet
```

### What You Need to Do

**Option A (Demo)**: Manually execute one trade to show it works
**Option B (Simple)**: Build a minimal executor bot (30 mins)
**Option C (Production)**: Build full executor with monitoring (2-3 hours)

---

## Next Steps

1. **Decide approach** (manual demo vs. build bot)
2. **Test execution flow** with one manual trade
3. **Verify stats appear** in frontend after execution
4. **Document for judges** that automation is ready, just needs bot

---

**The infrastructure is ready. It just needs the executor bot to watch and trigger trades automatically.**
