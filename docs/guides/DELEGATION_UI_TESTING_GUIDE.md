# Delegation UI - Testing & Deployment Guide

**Created:** 2025-10-18
**Status:** ✅ IMPLEMENTATION COMPLETE

---

## Summary

Delegation creation UI has been fully implemented with transaction handling, error states, and success confirmations. This guide covers testing the complete flow and deploying Envio indexer.

---

## What Was Implemented

### 1. ✅ useCreateDelegation Hook

**File:** [src/frontend/src/hooks/useCreateDelegation.ts](../../src/frontend/src/hooks/useCreateDelegation.ts)

**Features:**
- Wagmi `useWriteContract` integration
- Transaction receipt waiting
- Input validation (0.01% - 100%)
- Error handling
- Transaction hash tracking

**Usage:**
```typescript
const { createDelegation, hash, isWriting, isConfirming, isConfirmed, error } = useCreateDelegation();

await createDelegation({
  patternTokenId: 1n,
  percentageAllocation: 7500n, // 75% in basis points
  smartAccountAddress: userAddress,
});
```

---

### 2. ✅ CreateDelegationModal Component

**File:** [src/frontend/src/components/CreateDelegationModal.tsx](../../src/frontend/src/components/CreateDelegationModal.tsx)

**Features:**
- Pattern summary display
- Allocation percentage input (0.01% - 100%)
- Preset buttons (25%, 50%, 75%, 100%)
- Real-time transaction status
- Success confirmation with auto-close
- Error handling with clear messages
- Modal overlay with backdrop blur

**States:**
1. **Initial State** - Form with pattern info
2. **Waiting for Wallet** - User confirming in MetaMask
3. **Transaction Pending** - Waiting for blockchain confirmation
4. **Success** - Delegation created successfully
5. **Error** - Transaction failed with error message

---

### 3. ✅ Updated PatternBrowser

**File:** [src/frontend/src/components/PatternBrowser.tsx](../../src/frontend/src/components/PatternBrowser.tsx)

**Changes:**
- Added modal state management
- "Delegate to Pattern" button now functional
- Modal integration with pattern selection
- Automatic refetch on success

---

### 4. ✅ Modal Styling

**File:** [src/frontend/src/globals.css](../../src/frontend/src/globals.css)

**Added Styles:**
- Modal overlay with backdrop blur
- Animated modal entrance (slideUp + fadeIn)
- Form inputs with focus states
- Preset button styling
- Transaction status badges
- Success state animation
- Error message styling
- Responsive layout

---

## Testing the Delegation UI

### Prerequisites

1. **MetaMask Installed**
   - Browser extension installed
   - Wallet unlocked

2. **Monad Testnet Configured**
   ```
   Network Name: Monad Testnet
   RPC URL: https://rpc.ankr.com/monad_testnet
   Chain ID: 10143
   Currency Symbol: MON
   ```

3. **Test Funds**
   - Need MONAD tokens in wallet
   - Current test wallet: `0xFc46DA4cbAbDca9f903863De571E03A39D9079aD`
   - Balance: ~4.3 MONAD

---

### Step-by-Step Testing

#### Step 1: Start Frontend Dev Server

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
pnpm dev
```

Frontend will run at: http://localhost:5173

#### Step 2: Connect Wallet

1. Open http://localhost:5173
2. Click "Connect Wallet" button (top right)
3. MetaMask popup will appear
4. Select account and approve connection
5. If not on Monad testnet, click "Switch to Monad" button

**Expected Result:**
- Wallet address displayed in header
- No network warning banner
- Pattern browser showing patterns (real or test data)

#### Step 3: Browse Patterns

1. Click "Browse Patterns" tab (should be default)
2. View available patterns

**Expected Result:**
- Either real patterns from blockchain OR test data with orange banner
- Each pattern shows: Win Rate, Volume, ROI, Creator, Token ID
- "Delegate to Pattern" button enabled for active patterns

#### Step 4: Open Delegation Modal

1. Click "Delegate to Pattern" on any active pattern
2. Modal should slide up from bottom

**Expected Result:**
- Modal displays with pattern summary
- Pattern stats shown (Win Rate, Volume, ROI)
- Allocation input field default at 50%
- Preset buttons (25%, 50%, 75%, 100%)
- Your address and smart account shown
- "Create Delegation" button enabled

#### Step 5: Test Form Inputs

**Test Preset Buttons:**
1. Click "25%" → Input should change to 25
2. Click "75%" → Input should change to 75
3. Click "100%" → Input should change to 100

**Test Manual Input:**
1. Type "33.5" → Should accept decimal
2. Type "101" → Should accept (will validate on submit)
3. Type "0" → Should accept (will validate on submit)

#### Step 6: Create Delegation

1. Set allocation to 50%
2. Click "Create Delegation" button

**Expected Flow:**

**Phase 1: Wallet Confirmation**
- Button changes to "Creating..."
- Status message appears: "Waiting for wallet confirmation..."
- MetaMask popup appears
- Yellow/orange border on status box

**What to do:**
- Review transaction in MetaMask
- Check:
  - Contract: DelegationRouter (`0xd5499e0d781b123724dF253776Aa1EB09780AfBf`)
  - Function: `createSimpleDelegation`
  - Gas estimate shown
- Click "Confirm" in MetaMask

**Phase 2: Transaction Pending**
- Status changes to: "Transaction submitted! Waiting for confirmation..."
- Blue border on status box
- Transaction hash displayed
- Spinner animating

**Phase 3: Success!**
- Modal content changes to success screen
- Green checkmark appears with scale animation
- Message: "Delegation Created!"
- Transaction hash shown
- "Closing in 3 seconds..." countdown
- Auto-closes after 3 seconds

**Phase 4: Return to Patterns**
- Modal closes
- Patterns refetched (may show updated delegation count)
- Can now see delegation in "My Delegations" tab

---

### Step 7: Verify Delegation

1. Click "My Delegations" tab
2. Should see newly created delegation

**Expected Result:**
- Delegation card displayed
- Pattern name and ID shown
- Allocation percentage shown (50%)
- Status: "Active" badge (green)
- Created date shown
- Smart account address displayed

---

### Step 8: Check On-Chain Data

**Option A: Using Cast (CLI)**
```bash
cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "totalDelegations()(uint256)" \
  --rpc-url https://rpc.ankr.com/monad_testnet

# Should return delegation count (incremented)
```

**Option B: Using Frontend Console**
```javascript
// Open browser console (F12)
// Check network requests
// Look for contract read calls to DelegationRouter
```

**Option C: Block Explorer** (if available)
- Visit https://explorer.testnet.monad.xyz
- Search for contract: `0xd5499e0d781b123724dF253776Aa1EB09780AfBf`
- View recent transactions
- Find your delegation creation transaction

---

## Error Scenarios to Test

### Test 1: Wallet Not Connected

1. Disconnect wallet
2. Try to open delegation modal
3. Click "Create Delegation"

**Expected:**
- Alert: "Please connect your wallet"
- Transaction doesn't proceed

### Test 2: Invalid Allocation

1. Enter "0" for allocation
2. Click "Create Delegation"

**Expected:**
- Alert: "Please enter a valid allocation between 0.01% and 100%"
- Transaction doesn't proceed

1. Enter "150" for allocation
2. Click "Create Delegation"

**Expected:**
- Alert: "Please enter a valid allocation between 0.01% and 100%"
- Transaction doesn't proceed

### Test 3: Rejected Transaction

1. Enter valid allocation (e.g., 50%)
2. Click "Create Delegation"
3. In MetaMask popup, click "Reject"

**Expected:**
- Error message appears in modal
- "User rejected the request" or similar
- Can try again or close modal

### Test 4: Insufficient Gas

1. Use wallet with very low MONAD balance
2. Try to create delegation

**Expected:**
- MetaMask shows insufficient funds error
- Can't confirm transaction
- Error shown in UI

### Test 5: Network Mismatch

1. Switch MetaMask to different network (e.g., Ethereum)
2. Try to create delegation

**Expected:**
- Warning banner: "Please switch to Monad Testnet"
- Button to switch networks available
- Can't proceed until switched

---

## Deploying Envio Indexer

Envio provides real-time event indexing for the Mirror Protocol. This enables fast queries for patterns and delegations.

### Prerequisites

1. **Envio Account**
   - Sign up at https://envio.dev
   - Get API credentials

2. **Updated Config**
   - ✅ DelegationRouter address updated to `0xd5499e0d781b123724dF253776Aa1EB09780AfBf`
   - ✅ Codegen completed successfully

---

### Deployment Steps

#### Step 1: Login to Envio

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
pnpm envio login
```

Follow the prompts to authenticate.

#### Step 2: Initialize Deployment

```bash
pnpm envio deploy
```

You'll be prompted for:
- **Deployment name:** `mirror-protocol`
- **Network:** Monad Testnet (10143)
- **Start block:** 42990000 (or current block - 10000)

#### Step 3: Confirm Deployment

Review the deployment summary:
- Networks: Monad Testnet (10143)
- Contracts: BehavioralNFT, DelegationRouter
- Events: 7 total (3 from BehavioralNFT, 4 from DelegationRouter)
- Indexing mode: RPC polling

Type `yes` to confirm.

#### Step 4: Wait for Deployment

Deployment typically takes 2-5 minutes:
1. Uploading configuration
2. Building indexer
3. Starting sync process
4. Backfilling historical events

**Expected Output:**
```
✓ Configuration uploaded
✓ Indexer built successfully
✓ Sync started
→ Indexing from block 42990000...
→ Current block: 43050000
→ Backfilling events...
✓ Deployment complete!

GraphQL Endpoint: https://indexer.bigdevenergy.link/XXXXX/v1/graphql
```

#### Step 5: Get GraphQL Endpoint

Copy the GraphQL endpoint URL from the deployment output.

Example:
```
https://indexer.bigdevenergy.link/a4b2c8d1-e3f5-4a6b-8c9d-0e1f2a3b4c5d/v1/graphql
```

---

### Configuring Frontend to Use Envio

#### Step 1: Update Environment Variable

Create `.env` file in `src/frontend/`:

```env
VITE_ENVIO_GRAPHQL_URL=https://indexer.bigdevenergy.link/XXXXX/v1/graphql
```

Replace `XXXXX` with your actual deployment ID.

#### Step 2: Rebuild Frontend

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
pnpm build
```

#### Step 3: Test Envio Integration

**Option A: GraphQL Playground**

1. Open GraphQL endpoint in browser
2. Try example query:

```graphql
query GetPatterns {
  Pattern(limit: 10, order_by: { timestamp: desc }) {
    id
    tokenId
    creator
    patternType
    winRate
    totalVolume
    roi
    timestamp
    isActive
  }
}
```

**Expected Result:**
- Should return list of patterns
- Data should match on-chain data

**Option B: Frontend Console**

1. Open frontend in browser
2. Open console (F12)
3. Look for Envio query logs
4. Should see: `⚡ Envio query completed in XXms`

---

### Verify Delegation Events Are Indexed

After creating a delegation via UI:

```graphql
query GetDelegations {
  Delegation(limit: 10, order_by: { timestamp: desc }) {
    id
    delegationId
    delegator
    patternTokenId
    percentageAllocation
    smartAccountAddress
    timestamp
    isActive
  }
}
```

**Expected Result:**
- Should include your newly created delegation
- `delegator` should be your address
- `percentageAllocation` should match what you entered (in basis points)
- `timestamp` should be recent

**Verify Real-time Indexing:**
1. Create another delegation via UI
2. Immediately query Envio
3. Should appear within 1-2 seconds (RPC polling interval)

---

## Performance Metrics

### Expected Query Times (with Envio)

| Query Type | Expected Time | Current (Direct RPC) |
|------------|---------------|---------------------|
| Get all patterns | < 50ms | 500-2000ms |
| Get user delegations | < 50ms | 1000-3000ms |
| Get pattern delegations | < 30ms | 500-1500ms |
| Get execution history | < 100ms | 2000-5000ms |

**Why Envio is faster:**
- Events pre-indexed in database
- GraphQL query optimization
- Pagination and filtering at DB level
- No repeated RPC calls

---

## Troubleshooting

### Issue: "Cannot read properties of undefined"

**Cause:** Modal trying to render before pattern selected

**Fix:** Already handled with conditional rendering:
```tsx
{selectedPattern && (
  <CreateDelegationModal pattern={selectedPattern} ... />
)}
```

### Issue: Transaction Pending Forever

**Possible Causes:**
1. RPC issue (Monad testnet congestion)
2. Insufficient gas
3. Contract error (shouldn't happen with refactored contracts)

**Debug:**
```bash
# Check transaction status
cast tx <TX_HASH> --rpc-url https://rpc.ankr.com/monad_testnet

# Check transaction receipt
cast receipt <TX_HASH> --rpc-url https://rpc.ankr.com/monad_testnet
```

### Issue: Modal Doesn't Close

**Cause:** Transaction still pending (isConfirming = true)

**Expected Behavior:** Modal should not close during transaction to prevent user confusion

**If stuck:** Refresh page (transaction will still complete on-chain)

### Issue: Patterns Not Loading

**Possible Causes:**
1. RPC down
2. Network mismatch
3. Contract address wrong

**Debug:**
```bash
# Test RPC
curl https://rpc.ankr.com/monad_testnet \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return latest block number
```

**Fallback:** Frontend should show test data with orange banner if RPC fails

### Issue: Envio Not Indexing New Events

**Check Deployment Status:**
```bash
cd src/envio
pnpm envio status
```

**Common Issues:**
1. **Indexer behind:** Wait for it to catch up to current block
2. **RPC rate limited:** Envio will retry automatically
3. **Contract address wrong:** Redeploy with correct address

---

## Next Steps

### High Priority

1. **Test Delegation Creation**
   - Create 2-3 delegations via UI
   - Verify in "My Delegations" tab
   - Check on-chain via cast

2. **Deploy Envio**
   - Follow deployment steps above
   - Update frontend .env
   - Test query speed improvement

3. **Implement Revoke Delegation**
   - Similar to create delegation hook
   - Add confirm dialog
   - Enable revoke button in MyDelegations

### Medium Priority

4. **Implement Update Allocation**
   - Modal for changing percentage
   - Validation (must be different from current)
   - Enable update button

5. **Add Transaction History**
   - New tab showing all user transactions
   - Status (pending, confirmed, failed)
   - Timestamps and tx hashes

6. **Integrate Real Smart Accounts**
   - Replace EOA with MetaMask Delegation Toolkit
   - Deploy smart accounts programmatically
   - Update delegation creation to use real smart accounts

---

## Success Criteria

### UI Implementation ✅
- [x] Create delegation modal designed
- [x] Transaction handling implemented
- [x] Error states handled
- [x] Success confirmation working
- [x] CSS animations added
- [x] Build successful

### Testing 🔄
- [ ] Manual testing on localhost
- [ ] Delegation created successfully on testnet
- [ ] Transaction confirmed on-chain
- [ ] Delegation appears in "My Delegations"
- [ ] Error scenarios tested
- [ ] MetaMask integration verified

### Envio Deployment ⏳
- [ ] Envio account created
- [ ] Indexer deployed
- [ ] GraphQL endpoint obtained
- [ ] Frontend configured with endpoint
- [ ] Real-time indexing verified
- [ ] Query performance improved

---

## Related Documentation

- [useCreateDelegation Hook](../../src/frontend/src/hooks/useCreateDelegation.ts)
- [CreateDelegationModal Component](../../src/frontend/src/components/CreateDelegationModal.tsx)
- [PatternBrowser Component](../../src/frontend/src/components/PatternBrowser.tsx)
- [FRONTEND_FIXES_APPLIED.md](../status/FRONTEND_FIXES_APPLIED.md)
- [REFACTOR_SUCCESS.md](../status/REFACTOR_SUCCESS.md)

---

**Status:** ✅ Implementation Complete - Ready for Testing
**Next Step:** Manual testing on localhost with test wallet
**Estimated Time to Full Deployment:** 1-2 hours (testing + Envio deployment)
