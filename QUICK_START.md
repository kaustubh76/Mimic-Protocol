# Mirror Protocol - Quick Start Guide

**Ready to test the delegation UI?** Follow these simple steps.

---

## 🚀 Start the Frontend (30 seconds)

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
pnpm dev
```

**Frontend runs at:** http://localhost:5173

---

## 🦊 Configure MetaMask (1 minute)

### Add Monad Testnet

1. Open MetaMask
2. Click network dropdown (top)
3. Click "Add network" → "Add a network manually"
4. Enter:

```
Network Name: Monad Testnet
RPC URL: https://rpc.ankr.com/monad_testnet
Chain ID: 10143
Currency Symbol: MON
Block Explorer: https://explorer.testnet.monad.xyz
```

5. Click "Save"
6. Switch to Monad Testnet

### Import Test Wallet (Optional)

If you need a wallet with MONAD tokens:

```
Private Key: 0xd15ba7076d9bc4d05135c6d9c22e20af053ba2b0d66f0b944ce5d66a8b3c8141
Address: 0xFc46DA4cbAbDca9f903863De571E03A39D9079aD
Balance: ~4.3 MONAD
```

**WARNING:** This is a test wallet with exposed private key. Only use on testnet!

---

## ✅ Test Delegation Creation (2 minutes)

### Step 1: Connect Wallet

1. Open http://localhost:5173
2. Click **"Connect Wallet"** (top right)
3. Approve connection in MetaMask
4. If needed, click **"Switch to Monad"**

### Step 2: Browse Patterns

1. Click **"Browse Patterns"** tab (default view)
2. You'll see either:
   - **Real patterns** from blockchain (if any exist)
   - **Demo data** with orange banner (if none exist)

### Step 3: Create a Delegation

1. Click **"Delegate to Pattern"** on any active pattern
2. Modal opens with pattern details
3. Choose allocation:
   - Type a number (e.g., `50`) OR
   - Click preset button (`25%`, `50%`, `75%`, `100%`)
4. Click **"Create Delegation"** button
5. **Confirm in MetaMask** popup
6. Wait for transaction confirmation (~5-10 seconds)
7. **Success!** Green checkmark appears
8. Modal auto-closes after 3 seconds

### Step 4: View Your Delegations

1. Click **"My Delegations"** tab
2. See your newly created delegation
3. Check allocation percentage
4. Status should be "Active" (green badge)

---

## 🔍 Verify On-Chain

```bash
# Check total delegations
cast call 0xd5499e0d781b123724dF253776Aa1EB09780AfBf \
  "totalDelegations()(uint256)" \
  --rpc-url https://rpc.ankr.com/monad_testnet

# Should return delegation count (e.g., 3)
```

---

## 🧪 Test Error Scenarios

### Test 1: Invalid Allocation

1. Open delegation modal
2. Enter `150` (over 100%)
3. Click "Create Delegation"
4. **Expected:** Alert saying "Please enter a valid allocation between 0.01% and 100%"

### Test 2: Reject Transaction

1. Open delegation modal
2. Enter valid allocation (e.g., `50`)
3. Click "Create Delegation"
4. **Reject** in MetaMask
5. **Expected:** Error message appears in modal
6. Can try again or close

### Test 3: Close During Transaction

1. Start creating delegation
2. Confirm in MetaMask
3. Try to close modal while "Confirming..."
4. **Expected:** Modal doesn't close (button disabled)
5. Must wait for transaction to complete

---

## 📊 Expected Behavior

### Modal States

1. **Initial:** Form with pattern info and allocation input
2. **Waiting for Wallet:** Yellow box with spinner - "Waiting for wallet confirmation..."
3. **Confirming:** Blue box with spinner - "Transaction submitted!" + tx hash
4. **Success:** Green checkmark animation - "Delegation Created!" + auto-close
5. **Error:** Red box with error message - Can retry or close

### Timing

- Wallet confirmation: 2-5 seconds (depends on user)
- Blockchain confirmation: 2-6 seconds (Monad testnet)
- **Total:** ~4-11 seconds from click to success

---

## 🐛 Troubleshooting

### Issue: "Connect Wallet" button does nothing

**Fix:** Make sure MetaMask is installed and unlocked

### Issue: Orange banner says "Showing demo data"

**Meaning:** No patterns on-chain OR RPC unavailable
**Impact:** You can still test delegation creation (uses test data)
**To Fix:** Create real patterns using deployment scripts

### Issue: MetaMask shows "Insufficient funds"

**Fix 1:** Make sure you're on Monad testnet (not Ethereum mainnet)
**Fix 2:** Import test wallet with MONAD tokens (see above)
**Fix 3:** Get testnet MONAD from faucet (if available)

### Issue: Transaction pending forever

**Debug:**
```bash
# Check if transaction went through
cast receipt <TX_HASH> --rpc-url https://rpc.ankr.com/monad_testnet
```

**If stuck:** Refresh page (delegation may have been created)

### Issue: Modal doesn't appear

**Check:**
1. Browser console for errors (F12)
2. Make sure you clicked active pattern (green "Active" badge)
3. Try different browser

---

## 📁 Project Structure (Reference)

```
Mirror Protocol/
├── src/frontend/              # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── PatternBrowser.tsx        # Pattern listing
│   │   │   ├── CreateDelegationModal.tsx # Delegation modal
│   │   │   ├── MyDelegations.tsx         # User's delegations
│   │   │   └── WalletConnect.tsx         # Wallet connection
│   │   ├── hooks/
│   │   │   ├── useCreateDelegation.ts    # Transaction hook
│   │   │   ├── usePatterns.ts            # Fetch patterns
│   │   │   └── useDelegations.ts         # Fetch delegations
│   │   ├── contracts/
│   │   │   ├── config.ts                 # Contract addresses
│   │   │   └── abis/                     # Contract ABIs
│   │   ├── App.tsx                       # Main app
│   │   ├── main.tsx                      # Entry point
│   │   └── globals.css                   # Styles
│   └── package.json
│
├── contracts/                 # Smart contracts
│   ├── BehavioralNFT.sol
│   ├── PatternDetector.sol
│   ├── DelegationRouter.sol   # Main contract for delegations
│   └── ExecutionEngine.sol
│
├── src/envio/                # Envio indexer config
│   └── config.yaml
│
└── docs/                     # Documentation
    ├── guides/
    │   └── DELEGATION_UI_TESTING_GUIDE.md
    └── status/
        ├── FRONTEND_INTEGRATION_ANALYSIS.md
        └── FRONTEND_FIXES_APPLIED.md
```

---

## 🎯 What You Can Do Now

✅ **Working:**
- Connect wallet to Monad testnet
- Browse available trading patterns
- Create delegations to patterns
- Choose custom allocation percentages
- Monitor transaction status in real-time
- View success/error feedback
- See all your delegations in "My Delegations"

❌ **Not Implemented Yet:**
- Revoke delegation (button disabled)
- Update allocation (button disabled)
- Real smart accounts (using EOA for now)
- Envio real-time indexing (ready to deploy)

---

## 📚 More Information

- **Full Testing Guide:** [docs/guides/DELEGATION_UI_TESTING_GUIDE.md](docs/guides/DELEGATION_UI_TESTING_GUIDE.md)
- **Implementation Details:** [DELEGATION_UI_COMPLETE.md](DELEGATION_UI_COMPLETE.md)
- **Project Status:** [CURRENT_STATUS.md](CURRENT_STATUS.md)
- **Frontend Analysis:** [docs/status/FRONTEND_INTEGRATION_ANALYSIS.md](docs/status/FRONTEND_INTEGRATION_ANALYSIS.md)

---

## 🔗 Useful Links

- **Frontend:** http://localhost:5173 (after `pnpm dev`)
- **Monad Explorer:** https://explorer.testnet.monad.xyz
- **RPC Endpoint:** https://rpc.ankr.com/monad_testnet
- **Chain ID:** 10143

---

## 💡 Tips

1. **Keep MetaMask open** while testing for faster confirmations
2. **Check browser console** (F12) for detailed logs
3. **Use preset buttons** (25%, 50%, 75%, 100%) for quick testing
4. **Wait for success animation** before creating another delegation
5. **Refresh page** if something seems stuck

---

## ✨ Demo Script (30 seconds)

Perfect for showing off the UI:

1. **Connect wallet** (2 seconds)
2. **Click "Delegate to Pattern"** on first pattern (1 second)
3. **Click "75%" preset** (1 second)
4. **Click "Create Delegation"** (1 second)
5. **Confirm in MetaMask** (3 seconds)
6. **Watch transaction status** update in real-time (5 seconds)
7. **See success animation** (3 seconds)
8. **Switch to "My Delegations" tab** (2 seconds)
9. **Show newly created delegation** (2 seconds)

**Total:** ~20 seconds + audience reaction time 😊

---

**Status:** ✅ Ready to run!
**Next Step:** `pnpm dev` and open http://localhost:5173
