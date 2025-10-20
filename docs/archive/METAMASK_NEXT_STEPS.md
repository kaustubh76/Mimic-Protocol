# MetaMask Smart Accounts - Next Steps Required

## Current Status

✅ **Correct Understanding Achieved**
- MetaMask Smart Accounts are EMBEDDED WALLETS
- Do NOT connect to MetaMask browser extension
- Use generated private keys or passkeys
- Send transactions via bundlers (ERC-4337)

❌ **Implementation Incomplete**
- Current frontend code still uses EOA (Externally Owned Account) patterns
- Hooks and services expect wallet connection like MetaMask extension
- Need complete architectural change

## The Problem

Your current frontend architecture assumes:
1. User connects via MetaMask browser extension
2. Get EOA address from extension
3. Create smart account linked to EOA
4. Sign transactions with MetaMask popup

**This is WRONG for embedded smart accounts!**

## What Embedded Smart Accounts Actually Need

### 1. No Browser Extension Connection
```typescript
// ❌ WRONG (what you have now)
const connect = () => {
  await window.ethereum.request({ method: 'eth_requestAccounts' });
};

// ✅ CORRECT (what you need)
const createWallet = () => {
  const privateKey = generatePrivateKey();
  const smartAccount = await toMetaMaskSmartAccount({
    signer: { account: privateKeyToAccount(privateKey) },
    ...
  });
};
```

### 2. Private Key Management
```typescript
// User needs to backup this!
const privateKey = generatePrivateKey();
localStorage.setItem('walletKey', privateKey); // Encrypt in production!

// Restore later
const restored = await restoreSmartAccount(privateKey);
```

### 3. User Operations via Bundler
```typescript
// ❌ WRONG
const tx = await walletClient.writeContract({...});

// ✅ CORRECT
const userOpHash = await bundlerClient.sendUserOperation({
  account: smartAccount,
  calls: [{
    to: contractAddress,
    data: encodedData,
  }],
});
```

## Required Changes

### Phase 1: Core SDK (src/frontend/lib/metamask.ts)
✅ **DONE** - Rewrote to use embedded wallet pattern

### Phase 2: Hooks (src/frontend/hooks/)
❌ **TODO** - Need complete rewrite

**useMetaMask.ts** changes needed:
```typescript
// Remove:
- isMetaMaskInstalled()
- connectWallet()
- onAccountsChanged()
- onChainChanged()
- getEOAAddress()

// Add:
- createEmbeddedWallet()
- restoreWallet(privateKey)
- getPrivateKey()
- saveToLocalStorage()
- loadFromLocalStorage()
```

### Phase 3: Delegation Service (src/frontend/lib/delegation-service.ts)
❌ **TODO** - Convert all transactions to user operations

**Changes needed:**
```typescript
// Remove all walletClient.writeContract() calls
// Replace with bundlerClient.sendUserOperation()

class DelegationService {
  async createDelegation(params) {
    // ❌ OLD:
    const tx = await walletClient.writeContract({...});

    // ✅ NEW:
    const bundler = sdk.getBundlerClient();
    const smartAccount = sdk.getSmartAccount();

    const userOpHash = await bundler.sendUserOperation({
      account: smartAccount,
      calls: [{
        to: DELEGATION_ROUTER_ADDRESS,
        data: encodeFunctionData({
          abi: DELEGATION_ROUTER_ABI,
          functionName: 'createDelegation',
          args: [...]
        }),
      }],
    });

    const receipt = await bundler.waitForUserOperationReceipt({
      hash: userOpHash
    });
  }
}
```

### Phase 4: UI Components (src/frontend/components/)
❌ **TODO** - Update all components

**WalletConnect.tsx** changes:
```typescript
// ❌ OLD: "Connect Wallet" button
<button onClick={connect}>Connect to MetaMask</button>

// ✅ NEW: "Create Wallet" or "Restore Wallet"
<button onClick={createNewWallet}>Create New Wallet</button>
<button onClick={() => restoreWallet(privateKey)}>Restore Wallet</button>

// Show private key backup!
{privateKey && (
  <div className="warning">
    ⚠️ SAVE THIS PRIVATE KEY:
    <code>{privateKey}</code>
    You cannot recover your wallet without it!
  </div>
)}
```

## Recommended Approach

### Option 1: Use MetaMask's Official CLI (EASIEST)
```bash
npx @metamask/create-gator-app@latest

# Follow prompts:
# - Choose "MetaMask Smart Accounts Starter"
# - Framework: Vite React
# - Add Web3Auth for better UX
```

This generates a working example you can adapt.

### Option 2: Manual Implementation (HARDER)
1. Study the [hello-gator example](https://github.com/MetaMask/hello-gator)
2. Rewrite hooks to match embedded wallet pattern
3. Convert all transactions to user operations
4. Add bundler client configuration
5. Implement private key backup/restore UI

### Option 3: Hybrid Approach (RECOMMENDED)
1. Generate new project with CLI
2. Copy working wallet/hook patterns
3. Integrate with your existing contracts
4. Keep your delegation logic

## Bundler Setup Required

You MUST have a bundler service. Options:

### Pimlico (Recommended)
```typescript
import { http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://api.pimlico.io/v2/monad-testnet/rpc?apikey=YOUR_KEY'),
});
```

### Alchemy
```typescript
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://monad-testnet.g.alchemy.com/v2/YOUR_KEY'),
});
```

### Check if Monad has bundler support
- Contact Monad team
- Check if they provide bundler RPC
- May need to run your own bundler

## Security Considerations

### Private Key Storage
```typescript
// ❌ NEVER do this in production:
localStorage.setItem('key', privateKey);

// ✅ Use encryption:
import { encrypt, decrypt } from './crypto';
const encrypted = encrypt(privateKey, userPassword);
localStorage.setItem('encryptedKey', encrypted);

// ✅ OR use Web3Auth (social login):
// User logs in with Google/Twitter
// Web3Auth manages keys securely
```

### Better UX with Passkeys
```typescript
// Instead of private keys, use WebAuthn
const smartAccount = await toMetaMaskSmartAccount({
  signer: {
    webAuthnAccount: webAuthnAccount,
    keyId: credentialId,
  },
  ...
});
```

## Testing Steps

1. **Create Wallet**
   ```typescript
   const config = await manager.createEmbeddedSmartAccount();
   const privateKey = manager.getPrivateKey();
   console.log('Smart Account:', config.address);
   console.log('Private Key:', privateKey); // User must save this!
   ```

2. **Fund Smart Account**
   ```
   Send MON testnet tokens to: config.address
   ```

3. **Send User Operation**
   ```typescript
   const userOpHash = await bundlerClient.sendUserOperation({
     account: smartAccount,
     calls: [{
       to: '0x...', // Your delegation router
       value: 0n,
       data: '0x...' // Encoded function call
     }],
   });
   ```

4. **Wait for Receipt**
   ```typescript
   const receipt = await bundlerClient.waitForUserOperationReceipt({
     hash: userOpHash
   });
   ```

## Immediate Next Action

**I recommend:**

1. **Generate Reference Project**
   ```bash
   cd /Users/apple/Desktop
   npx @metamask/create-gator-app@latest mirror-protocol-reference
   # Choose: MetaMask Smart Accounts Starter + Vite React
   ```

2. **Study the Generated Code**
   - Look at how they create wallets
   - See how they send user operations
   - Understand bundler setup

3. **Adapt to Your Project**
   - Copy wallet creation pattern
   - Adapt delegation contract calls
   - Keep your existing smart contracts

## Summary

Your Mirror Protocol needs a **complete frontend rewrite** to work with embedded MetaMask Smart Accounts:

- ✅ SDK layer is correct (lib/metamask.ts)
- ❌ Hooks need rewrite (no EOA concepts)
- ❌ Services need user operations (not direct transactions)
- ❌ UI needs wallet creation flow (not connection flow)
- ❌ Bundler client must be configured
- ❌ Private key backup UI required

**Estimated Work**: 2-4 hours if you use the CLI-generated reference project as a template.

---

**Files to Reference:**
- [EMBEDDED_WALLET_IMPLEMENTATION.md](EMBEDDED_WALLET_IMPLEMENTATION.md) - Technical details
- [hello-gator GitHub](https://github.com/MetaMask/hello-gator) - Official example
- [MetaMask Docs](https://docs.metamask.io/delegation-toolkit/) - Full documentation

**Current Status**: Understanding phase complete ✅ | Implementation phase required ⏳
