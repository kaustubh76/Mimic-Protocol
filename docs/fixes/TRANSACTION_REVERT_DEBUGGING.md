# Transaction Revert Errors - Debugging Guide

## Common Revert Reasons

### 1. **Delegation Already Exists** ⚠️ (Most Common)

**Error**: Transaction reverts when creating delegation
**Cause**: You already have a delegation to that pattern

**Check:**
```bash
# Check if you have a delegation to pattern ID X
cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "getDelegationId(address,uint256)(uint256)" \
  YOUR_ADDRESS \
  PATTERN_ID \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# If returns > 0, you already have a delegation!
```

**Your Current Delegations:**
```
Total delegations: 6
Pattern #2: Delegation ID 3 (already exists!) ✅
Pattern #3: Delegation ID 4 (already exists!) ✅
Pattern #4: Delegation ID 1 (already exists!) ✅
Pattern #5: Delegation ID 2 (already exists!) ✅
```

**Solution:** Try delegating to a DIFFERENT pattern you haven't delegated to yet (like pattern #1 or #6)

---

### 2. **Pattern Not Active**

**Error**: `Pattern inactive` or `InvalidPatternId`
**Cause**: Pattern doesn't exist or is marked inactive

**Check:**
```bash
# Check if pattern is active
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
  "isPatternActive(uint256)(bool)" \
  PATTERN_ID \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# Should return: true
```

**Solution:** Choose an active pattern (1-6 are all active)

---

### 3. **Invalid Percentage**

**Error**: `InvalidPercentage`
**Cause**: Percentage not between 100 (1%) and 10000 (100%)

**Valid Range:**
- Minimum: `100` (1%)
- Maximum: `10000` (100%)

**Common Mistakes:**
```javascript
// ❌ WRONG
percentageAllocation: 75  // Less than minimum!

// ❌ WRONG
percentageAllocation: 75000  // More than maximum!

// ✅ CORRECT
percentageAllocation: 7500  // 75%
percentageAllocation: 5000  // 50%
percentageAllocation: 2500  // 25%
```

---

### 4. **Invalid Smart Account**

**Error**: `InvalidSmartAccount`
**Cause**: Smart account address is `0x0` or invalid

**Check Your Smart Account:**
```bash
# Should return a valid address
console.log(smartAccount.address);
```

**Solution:** Make sure smart account is created before delegation

---

### 5. **Contract Paused**

**Error**: Transaction reverts with no specific message
**Cause**: DelegationRouter might be paused

**Check:**
```bash
cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "paused()(bool)" \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# Should return: false
```

---

### 6. **Insufficient Gas**

**Error**: Out of gas or gas estimation failed
**Cause**: Not enough MONAD for gas

**Check Balance:**
```bash
cast balance YOUR_ADDRESS \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# Should be > 0
```

**Your Balance:** 2.99 MONAD ✅ (sufficient)

---

## Your Current Status

### ✅ Working:
- 6 patterns minted
- 6 delegations created
- Contracts deployed and functional
- RPC working perfectly

### ⚠️ Likely Issue:
You're trying to create a delegation to a pattern you've already delegated to!

**Delegations you already have:**
```
Delegation 1 → Pattern #4 (75% allocation)
Delegation 2 → Pattern #5 (50% allocation)
Delegation 3 → Pattern #2 (50% allocation)  ← Can't create another!
Delegation 4 → Pattern #3 (50% allocation)
Delegation 5 → Pattern #? (new)
Delegation 6 → Pattern #? (new)
```

---

## How to Fix Revert Errors

### Step 1: Check Which Patterns You Can Delegate To

```bash
# Get your delegations
cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "getDelegatorDelegations(address)(uint256[])" \
  0xFc46DA4cbAbDca9f903863De571E03A39D9079aD \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# Returns: [1, 2, 3, 4, 5, 6]
```

### Step 2: Check Each Delegation's Pattern

```bash
for id in 1 2 3 4 5 6; do
  echo "=== Delegation $id ==="
  cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
    "getDelegation(uint256)" $id \
    --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0" | head -5
done
```

### Step 3: Try Pattern You Haven't Delegated To

If you have delegations to patterns 2, 3, 4, 5:
- ✅ Try pattern #1
- ✅ Try pattern #6

---

## Testing Delegation Creation

### Option A: Via Frontend (Recommended)

1. **Refresh Browser** - Get latest delegation list
2. **Go to "Browse Patterns"** - See all 6 patterns
3. **Look for patterns WITHOUT "Delegated" badge**
4. **Click "Delegate" on one you haven't delegated to**
5. **Create delegation**

### Option B: Via Cast (Manual)

```bash
# Create delegation to pattern #1 (if you don't have one)
export PRIVATE_KEY=0xd15ba7076d9bc4d05135c6d9c22e20af053ba2b0d66f0b944ce5d66a8b3c8141

cast send 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "createSimpleDelegation(uint256,uint256,address)" \
  1 \
  5000 \
  0xFc46DA4cbAbDca9f903863De571E03A39D9079aD \
  --private-key $PRIVATE_KEY \
  --rpc-url "https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0" \
  --legacy
```

---

## Debugging Checklist

Before creating delegation, verify:

- [ ] Pattern exists and is active
  ```bash
  cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc "isPatternActive(uint256)" X
  ```

- [ ] You don't already have a delegation to this pattern
  ```bash
  cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
    "getDelegationId(address,uint256)" YOUR_ADDRESS PATTERN_ID
  # Should return: 0 (no delegation) or > 0 (delegation exists)
  ```

- [ ] Percentage is valid (100-10000)
  ```javascript
  100 <= percentageAllocation <= 10000
  ```

- [ ] Smart account address is valid
  ```javascript
  smartAccountAddress !== "0x0000..."
  ```

- [ ] Contract is not paused
  ```bash
  cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf "paused()"
  # Should return: false
  ```

- [ ] You have gas (MONAD balance)
  ```bash
  cast balance YOUR_ADDRESS
  # Should be > 0
  ```

---

## Frontend Error Handling

### Check Browser Console

Look for specific error messages:
```javascript
// Common errors:
"DelegationAlreadyExists" ← Most likely!
"InvalidPatternId"
"PatternInactive"
"InvalidPercentage"
"InvalidSmartAccount"
```

### Enable Verbose Logging

In `useCreateDelegation.ts`, the error should show:
```javascript
console.error('Error creating delegation:', error);
```

Check what the actual error message says!

---

## Quick Fix Script

```bash
#!/bin/bash
# Find which patterns you can delegate to

ROUTER="0xd5499e0d781b123724dF253776Aa1EB09780AfBf"
NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"
USER="0xFc46DA4cbAbDca9f903863De571E03A39D9079aD"
RPC="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

echo "=== Checking which patterns you can delegate to ==="

for i in 1 2 3 4 5 6; do
  ACTIVE=$(cast call $NFT "isPatternActive(uint256)" $i --rpc-url $RPC)
  EXISTING=$(cast call $ROUTER "getDelegationId(address,uint256)" $USER $i --rpc-url $RPC)

  if [ "$ACTIVE" = "true" ] && [ "$EXISTING" = "0" ]; then
    echo "✅ Pattern #$i - Available for delegation"
  elif [ "$EXISTING" != "0" ]; then
    echo "❌ Pattern #$i - Already delegated (Delegation ID: $EXISTING)"
  else
    echo "⚠️ Pattern #$i - Not active"
  fi
done
```

---

## Most Likely Solution

Based on your setup:

1. **You have 6 delegations already**
2. **You're trying to create another to a pattern you already delegated to**
3. **Contract correctly reverts with "DelegationAlreadyExists"**

**To fix:**
- Delegate to a different pattern (check which ones you haven't delegated to)
- Or revoke an existing delegation first, then create a new one
- Or update an existing delegation instead of creating new

---

## Summary

**Problem**: Transaction reverts when creating delegation
**Most Likely Cause**: `DelegationAlreadyExists` error
**Solution**:
1. Check which patterns you've delegated to
2. Choose a pattern you haven't delegated to yet
3. Or update/revoke existing delegation

**Your system is working!** The reverts are **expected behavior** - the contract is preventing duplicate delegations, which is correct! ✅
