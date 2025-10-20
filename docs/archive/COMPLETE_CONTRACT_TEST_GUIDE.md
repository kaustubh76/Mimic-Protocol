# Complete Smart Contract Testing Guide

## Overview
This guide provides a complete end-to-end testing strategy for all Mirror Protocol smart contracts, including ExecutionEngine interactions.

## Contract Addresses (Monad Testnet - Chain ID: 10143)

```
BehavioralNFT:      0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc
DelegationRouter:   0x56C145f5567f8DB77533c825cf4205F1427c5517
PatternDetector:    0x8768e4E5c8c3325292A201f824FAb86ADae398d0
ExecutionEngine:    0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287
```

## Current Status Check

### Issue: ExecutionEngine Has Zero Interactions
**Root Cause**: No trades have been executed through the ExecutionEngine yet because:
1. No patterns have been minted on-chain
2. No delegations have been created
3. No one has called `executeTrade()` on ExecutionEngine

**Solution**: Follow the complete flow below to test all contracts.

---

## Complete End-to-End Flow

### Phase 1: Pattern Minting

#### Option A: Via PatternDetector (Proper Way)
```solidity
// 1. Create detected pattern data
PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
    user: msg.sender,
    patternType: "TestStrategy",
    patternData: abi.encode("test data"),
    totalTrades: 10,
    successfulTrades: 8,
    totalVolume: 10 ether,
    avgProfit: 1000, // 10% in basis points
    detectedAt: block.timestamp,
    confidence: 8500  // 85% confidence
});

// 2. Submit pattern for validation and minting
detector.validateAndMintPattern(pattern);
```

**Result**: Creates NFT in BehavioralNFT, emits `PatternMinted` event

#### Option B: Direct Minting (Testing Only)
```solidity
// Only contract owner can do this
nft.mintPattern(
    creator,
    "TestStrategy",
    abi.encode("pattern data")
);
```

**Result**: Token ID 1 minted to creator

---

### Phase 2: Delegation Creation

```solidity
// User delegates to pattern NFT
router.createSimpleDelegation(
    1,                  // patternTokenId
    2500,               // 25% allocation (basis points)
    smartAccountAddr    // delegator's smart account
);
```

**Contract Interactions**:
1. ✅ DelegationRouter validates pattern exists
2. ✅ DelegationRouter checks pattern is active
3. ✅ DelegationRouter creates delegation struct
4. ✅ DelegationRouter emits `DelegationCreated` event

**Result**: Delegation ID 1 created, stored in router

---

### Phase 3: Trade Execution (THIS IS WHERE EXECUTIONENGINE GETS USED!)

```solidity
// Pattern owner executes trade on behalf of delegator
ExecutionEngine.TradeParams memory tradeParams = ExecutionEngine.TradeParams({
    delegationId: 1,
    tokenIn: address(0x...),
    tokenOut: address(0x...),
    amountIn: 1 ether,
    minAmountOut: 0.95 ether,
    deadline: block.timestamp + 300
});

ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
    currentWinRate: 8000,    // 80%
    recentVolume: 5 ether,
    patternStrength: 9000,   // 90%
    riskScore: 3000,         // 30%
    envioTimestamp: block.timestamp,
    sourceChain: 10143
});

engine.executeTrade(tradeParams, metrics);
```

**Contract Interactions**:
1. ✅ ExecutionEngine validates caller is pattern owner
2. ✅ ExecutionEngine checks delegation is active
3. ✅ ExecutionEngine validates trade parameters
4. ✅ ExecutionEngine executes trade logic
5. ✅ ExecutionEngine updates performance metrics in BehavioralNFT
6. ✅ ExecutionEngine emits `TradeExecuted` event

**Result**: Trade executed, performance updated, ExecutionEngine transaction count increases!

---

### Phase 4: Performance Update

After trade execution, ExecutionEngine automatically updates BehavioralNFT:

```solidity
// Called internally by ExecutionEngine
nft.updatePatternPerformance(
    patternTokenId,
    newWinRate,
    newVolume,
    newROI
);
```

**Result**: Pattern metrics updated on-chain

---

### Phase 5: Delegation Revocation

```solidity
// Delegator can revoke at any time
router.revokeDelegation(1);
```

**Result**: Delegation marked inactive, no more trades can be executed

---

## Testing Script (When RPC Works)

Create `script/TestCompleteFlow.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";

contract TestCompleteFlow is Script {
    address constant NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;
    address constant ROUTER = 0x56C145f5567f8DB77533c825cf4205F1427c5517;
    address constant ENGINE = 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        BehavioralNFT nft = BehavioralNFT(NFT);
        DelegationRouter router = DelegationRouter(ROUTER);
        ExecutionEngine engine = ExecutionEngine(ENGINE);

        console.log("=== STEP 1: Mint Pattern ===");
        uint256 tokenId = nft.mintPattern(
            deployer,
            "TestStrategy",
            ""
        );
        console.log("Minted pattern:", tokenId);

        console.log("\n=== STEP 2: Create Delegation ===");
        router.createSimpleDelegation(
            tokenId,
            2500,
            deployer  // Using EOA as smart account for demo
        );
        console.log("Created delegation ID: 1");

        console.log("\n=== STEP 3: Execute Trade ===");
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: 1,
            tokenIn: address(0x1111111111111111111111111111111111111111),
            tokenOut: address(0x2222222222222222222222222222222222222222),
            amountIn: 1 ether,
            minAmountOut: 0.95 ether,
            deadline: block.timestamp + 300
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8000,
            recentVolume: 1 ether,
            patternStrength: 9000,
            riskScore: 2000,
            envioTimestamp: block.timestamp,
            sourceChain: 10143
        });

        engine.executeTrade(params, metrics);
        console.log("Trade executed successfully!");
        console.log("\n[SUCCESS] ExecutionEngine now has interactions!");

        vm.stopBroadcast();
    }
}
```

**Run with**:
```bash
forge script script/TestCompleteFlow.s.sol \
    --rpc-url https://testnet.monad.xyz/rpc \
    --broadcast \
    --legacy
```

---

## Verification Commands

### Check BehavioralNFT State
```bash
# Total patterns
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
  "totalPatterns()(uint256)" \
  --rpc-url https://testnet.monad.xyz/rpc

# Get pattern data
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
  "patterns(uint256)(string,address,uint256,uint256,uint256,bool,uint256)" \
  1 \
  --rpc-url https://testnet.monad.xyz/rpc
```

### Check DelegationRouter State
```bash
# Total delegations
cast call 0x56C145f5567f8DB77533c825cf4205F1427c5517 \
  "totalDelegations()(uint256)" \
  --rpc-url https://testnet.monad.xyz/rpc

# Get user's delegations
cast call 0x56C145f5567f8DB77533c825cf4205F1427c5517 \
  "getDelegatorDelegations(address)(uint256[])" \
  YOUR_ADDRESS \
  --rpc-url https://testnet.monad.xyz/rpc

# Get delegation details
cast call 0x56C145f5567f8DB77533c825cf4205F1427c5517 \
  "delegations(uint256)" \
  1 \
  --rpc-url https://testnet.monad.xyz/rpc
```

### Check ExecutionEngine State (THE KEY TEST!)
```bash
# Check transaction count (should be > 0 after testing)
cast call 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287 \
  "totalTrades()(uint256)" \
  --rpc-url https://testnet.monad.xyz/rpc

# Check if delegationRouter is set
cast call 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287 \
  "delegationRouter()(address)" \
  --rpc-url https://testnet.monad.xyz/rpc

# Check if behavioralNFT is set
cast call 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287 \
  "behavioralNFT()(address)" \
  --rpc-url https://testnet.monad.xyz/rpc
```

---

## Contract Interaction Flow Diagram

```
User A (Pattern Creator)
    ↓
[1] Mint Pattern NFT
    ↓
BehavioralNFT
    ↓ (NFT minted)
    ↓
User B (Delegator)
    ↓
[2] Create Delegation
    ↓
DelegationRouter
    ↓ (Delegation created)
    ↓
User A (Pattern Owner)
    ↓
[3] Execute Trade
    ↓
ExecutionEngine  ← THIS IS WHERE THE ACTION HAPPENS!
    ↓
    ├──> Validates delegation (checks DelegationRouter)
    ├──> Verifies pattern ownership (checks BehavioralNFT)
    ├──> Executes trade logic
    ├──> Updates performance (calls BehavioralNFT.updatePatternPerformance)
    └──> Emits TradeExecuted event
    ↓
BehavioralNFT (performance updated)
    ↓
[RESULT] ExecutionEngine transaction count++
```

---

## Why ExecutionEngine Has Zero Interactions

### Current State:
- ✅ BehavioralNFT deployed
- ✅ DelegationRouter deployed
- ✅ ExecutionEngine deployed
- ❌ No patterns minted yet
- ❌ No delegations created yet
- ❌ No trades executed yet

### What Needs to Happen:
1. **Mint at least 1 pattern** (via PatternDetector or direct mint)
2. **Create at least 1 delegation** (via DelegationRouter.createSimpleDelegation)
3. **Execute at least 1 trade** (via ExecutionEngine.executeTrade)

### Then ExecutionEngine Will Have:
- ✅ Transaction history
- ✅ Trade count > 0
- ✅ Performance metrics updated
- ✅ Events emitted
- ✅ Visible interactions on block explorer

---

## Quick Test Checklist

- [ ] Step 1: Mint a pattern NFT
- [ ] Step 2: Verify pattern exists (`totalPatterns()` > 0)
- [ ] Step 3: Create a delegation to that pattern
- [ ] Step 4: Verify delegation exists (`totalDelegations()` > 0)
- [ ] Step 5: Execute a trade via ExecutionEngine
- [ ] Step 6: Verify ExecutionEngine has transactions
- [ ] Step 7: Check pattern performance was updated
- [ ] Step 8: Revoke delegation
- [ ] Step 9: Verify cannot execute more trades

---

## Expected Results After Testing

### Before Testing:
```
BehavioralNFT.totalPatterns():         0
DelegationRouter.totalDelegations():   0
ExecutionEngine.totalTrades():         0  ← PROBLEM
```

### After Testing:
```
BehavioralNFT.totalPatterns():         1+
DelegationRouter.totalDelegations():   1+
ExecutionEngine.totalTrades():         1+  ← FIXED!
```

---

## Troubleshooting

### Issue: "RPC HTTP error 405"
**Solution**: Monad testnet RPC is temporarily unavailable. Wait and retry, or use local fork testing.

### Issue: "Unauthorized" when calling executeTrade
**Solution**: Only the pattern NFT owner can execute trades. Make sure you own the pattern NFT.

### Issue: "Delegation not active"
**Solution**: Delegation was revoked or never created. Check delegation status first.

### Issue: "Pattern not found"
**Solution**: Pattern NFT doesn't exist. Mint it first via BehavioralNFT.mint Pattern().

---

## Summary

**To get ExecutionEngine interactions, you MUST**:
1. Mint a pattern (creates NFT)
2. Create a delegation (links user to pattern)
3. Execute a trade (calls ExecutionEngine.executeTrade)

**ExecutionEngine will then**:
- Have transaction history
- Update pattern performance
- Emit events
- Show interactions on explorer

**Current Status**: Ready for testing, just need to execute the 3 steps above when RPC is available.

---

**Last Updated**: 2025-10-15
**Status**: Documentation complete, awaiting RPC availability for on-chain testing
