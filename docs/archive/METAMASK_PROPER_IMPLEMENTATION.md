# MetaMask Delegation Toolkit - Proper Implementation

## Problem Identified

The previous implementation was trying to do everything at once during wallet connection, which caused the error:
```
Error while connecting to the custom network
```

## Root Cause

Based on analysis of the official MetaMask Delegation Toolkit documentation:
- https://docs.metamask.io/delegation-toolkit/
- https://viem.sh/account-abstraction/accounts/smart/toMetaMaskSmartAccount
- https://github.com/MetaMask/delegation-toolkit

The issue was:
1. **Mixing concerns**: Trying to create smart account during wallet connection
2. **Wrong parameter order**: Checking network AFTER requesting accounts
3. **Incorrect signer setup**: Not using proper Viem account object

## Solution Implemented

### Phase 1: Wallet Connection (EOA Only)

**File**: `src/frontend/lib/metamask.ts` - `connectWallet()` method

The wallet connection now follows this proper flow:

```typescript
async connectWallet(): Promise<Address> {
  // 1. Check if MetaMask is installed
  if (!this.isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  // 2. Check current network FIRST (before requesting accounts)
  const currentChainId = await ethereum.request({
    method: 'eth_chainId',
  });

  // 3. Switch network if needed (BEFORE account access)
  if (currentChainId !== '0x27af') { // 10159
    await this.switchToMonadTestnet();
  }

  // 4. NOW request account access (after network is correct)
  const accounts = await ethereum.request({
    method: 'eth_requestAccounts',
  });

  this.eoaAddress = accounts[0];

  // 5. Create Viem clients
  this.publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  this.walletClient = createWalletClient({
    chain: monadTestnet,
    transport: custom(window.ethereum), // Uses MetaMask as provider
  });

  return this.eoaAddress;
}
```

**Key Changes**:
- ✅ Check network **BEFORE** requesting accounts
- ✅ Switch network **BEFORE** requesting accounts
- ✅ Create clients **AFTER** network is confirmed correct
- ✅ Don't create smart account during connection
- ✅ Better error handling with specific messages

### Phase 2: Smart Account Creation (Separate Step)

**File**: `src/frontend/lib/metamask.ts` - `getOrCreateSmartAccount()` method

Smart account creation is now a **separate step** after wallet connection:

```typescript
async getOrCreateSmartAccount(): Promise<SmartAccountConfig> {
  // 1. Ensure wallet is connected first
  if (!this.publicClient || !this.walletClient || !this.eoaAddress) {
    throw new Error('Wallet not connected. Call connectWallet() first.');
  }

  // 2. Create a proper Viem Account object for signing
  const signerAccount: Account = {
    address: this.eoaAddress,
    type: 'json-rpc', // Uses JSON-RPC for signing (MetaMask)
  };

  // 3. Create MetaMask Smart Account (counterfactual)
  this.smartAccount = await toMetaMaskSmartAccount({
    client: this.publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [
      this.eoaAddress, // owner address
      [],              // additional owners (empty)
      [],              // permissions (empty)
      [],              // policies (empty)
    ],
    deploySalt: '0x',
    signer: {
      account: signerAccount, // Proper account object
    },
  });

  // 4. Check if already deployed on-chain
  const code = await this.publicClient.getBytecode({
    address: this.smartAccount.address,
  });

  const isDeployed = code !== undefined && code !== '0x';

  return {
    address: this.smartAccount.address,
    isDeployed,
    implementation: 'Hybrid',
    owner: this.eoaAddress,
  };
}
```

**Key Changes**:
- ✅ Separate from wallet connection
- ✅ Uses proper Viem `Account` type with `json-rpc` type
- ✅ Correct `signer` parameter (not `signatory`, not `walletClient`)
- ✅ Creates counterfactual address (deploys on first use)
- ✅ Checks if already deployed

## Architecture Improvements

### Before (Incorrect)
```
User clicks "Connect Wallet"
  ↓
connectWallet() {
  1. Request accounts
  2. Switch network  ❌ Too late
  3. Create smart account ❌ Wrong phase
  4. Return address
}
```

### After (Correct)
```
User clicks "Connect Wallet"
  ↓
connectWallet() {
  1. Check current network
  2. Switch if needed
  3. Request account access  ✅ After network is correct
  4. Create Viem clients
  5. Return EOA address
}
  ↓
User clicks "Create Smart Account" (optional)
  ↓
getOrCreateSmartAccount() {
  1. Verify wallet connected
  2. Create Account object
  3. Call toMetaMaskSmartAccount()
  4. Return smart account config
}
```

## Technical Details

### 1. Network Switch Order

**Why it matters**: MetaMask needs to be on the correct network **before** you request account access, otherwise the user sees confusing popups asking them to switch networks after they've already approved the connection.

**Implementation**:
```typescript
// Get current chain ID first
const currentChainId = await ethereum.request({ method: 'eth_chainId' });

// Only switch if needed
if (currentChainId !== '0x27af') { // 10159 in hex
  await this.switchToMonadTestnet();
}

// NOW request accounts (network is already correct)
const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
```

### 2. Account Object Type

**Why it matters**: `toMetaMaskSmartAccount` requires a proper Viem `Account` object, not just an address string.

**Implementation**:
```typescript
import { type Account } from 'viem';

const signerAccount: Account = {
  address: this.eoaAddress,
  type: 'json-rpc', // Tells Viem to use JSON-RPC (MetaMask) for signing
};
```

### 3. Signer vs Signatory

**Why it matters**: The parameter name changed between versions of the toolkit.

**v0.13.0 (Current)**:
```typescript
await toMetaMaskSmartAccount({
  ...
  signer: {
    account: signerAccount,
  },
});
```

**NOT** (older docs):
```typescript
signatory: { ... } // ❌ Wrong parameter name
```

## Testing Instructions

### 1. Clear Browser State
```bash
# In Browser Console (F12):
localStorage.clear();
sessionStorage.clear();
# Hard reload: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
```

### 2. Test Wallet Connection

Open http://localhost:3001/ and click "Connect Wallet"

**Expected Console Logs**:
```
🔌 Connecting to MetaMask...
🔗 Current chain ID: 0x27af (decimal: 10159)
✅ Already on Monad Testnet
✅ EOA Address: 0x...
✅ Connected to MetaMask: 0x...
```

**If on wrong network**:
```
🔌 Connecting to MetaMask...
🔗 Current chain ID: 0x1 (decimal: 1)
⚠️ Not on Monad Testnet, switching...
✅ Switched to Monad Testnet
✅ EOA Address: 0x...
✅ Connected to MetaMask: 0x...
```

### 3. Test Smart Account Creation

Click "Create Smart Account" button

**Expected Console Logs**:
```
🏗️ Creating Smart Account for: 0x...
📬 Smart Account Address (counterfactual): 0x...
✅ Smart Account Ready: {
  address: "0x...",
  deployed: "⏳ Counterfactual (will deploy on first use)",
  owner: "0x..."
}
```

## Error Handling

### Error: "Connection rejected"
**Cause**: User clicked "Cancel" in MetaMask popup
**Solution**: User needs to approve the connection

### Error: "Please approve the network switch"
**Cause**: User rejected network switch to Monad Testnet
**Solution**: User needs to approve network switch or manually add Monad Testnet

### Error: "Wallet not connected"
**Cause**: Trying to create smart account before connecting wallet
**Solution**: Call `connectWallet()` first

## Files Modified

1. ✅ **src/frontend/lib/metamask.ts**
   - Lines 79-139: Rewrote `connectWallet()` method
   - Lines 201-260: Rewrote `getOrCreateSmartAccount()` method
   - Line 22: Added `Account` type import

2. ✅ **Build Output**
   ```
   dist/index.html                     0.68 kB
   dist/assets/index-CNmJLXKL.css     18.39 kB
   dist/assets/index-D3vY10sa.js   1,259.50 kB
   ✓ built in 2.52s
   ```

## References

- [MetaMask Delegation Toolkit Docs](https://docs.metamask.io/delegation-toolkit/)
- [Viem toMetaMaskSmartAccount](https://viem.sh/account-abstraction/accounts/smart/toMetaMaskSmartAccount)
- [MetaMask Delegation Toolkit GitHub](https://github.com/MetaMask/delegation-toolkit)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

## Next Steps

1. ✅ Build completed successfully
2. ⏳ Test wallet connection in browser
3. ⏳ Test smart account creation
4. ⏳ Verify delegation flow works end-to-end
5. ⏳ Deploy contracts and test live

---

**Date**: 2025-10-12
**Status**: ✅ Implementation Complete - Ready for Testing
**Build**: ✅ Successful
**Version**: @metamask/delegation-toolkit@0.13.0
