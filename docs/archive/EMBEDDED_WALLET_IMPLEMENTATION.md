# MetaMask Smart Accounts - Embedded Wallet Implementation

## ✅ CORRECT Understanding

MetaMask Smart Accounts are **EMBEDDED WALLETS** - they do NOT require connecting to an EOA (Externally Owned Account) like MetaMask browser extension.

## How It Works

### 1. Generate Private Key
```typescript
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey = generatePrivateKey();
const signerAccount = privateKeyToAccount(privateKey);
```

### 2. Create Smart Account
```typescript
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit';

const smartAccount = await toMetaMaskSmartAccount({
  client: publicClient,
  implementation: Implementation.Hybrid,
  deployParams: [
    signerAccount.address, // owner
    [],                     // additional owners
    [],                     // permissions
    [],                     // policies
  ],
  deploySalt: '0x',
  signer: {
    account: signerAccount, // ✅ Correct parameter
  },
});
```

### 3. Send User Operations
```typescript
import { createBundlerClient } from 'viem/account-abstraction';

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(BUNDLER_RPC_URL),
});

const userOpHash = await bundlerClient.sendUserOperation({
  account: smartAccount,
  calls: [{
    to: '0x...',
    value: parseEther('0.1'),
  }],
  maxFeePerGas,
  maxPriorityFeePerGas,
});
```

## Key Points

1. **NO MetaMask Extension Required**
   - Smart accounts are embedded wallets
   - Use generated private keys or passkeys
   - Completely independent of browser wallets

2. **Signer Configuration**
   For `Implementation.Hybrid`, you can use:
   ```typescript
   // Option 1: Account (what we're using)
   signer: { account: signerAccount }

   // Option 2: Wallet Client
   signer: { walletClient: walletClient }

   // Option 3: WebAuthn (Passkey)
   signer: { webAuthnAccount: webAuthnAccount, keyId: keyId }
   ```

3. **CounterFactual Deployment**
   - Smart account address is computed before deployment
   - Actual deployment happens on first transaction
   - Saves gas for account creation

4. **Bundler Required**
   - User operations go through a bundler
   - Bundler submits to EntryPoint contract
   - NOT sent directly to blockchain

## Implementation in Mirror Protocol

### File: `src/frontend/lib/metamask.ts`

```typescript
export class MetaMaskSmartAccountManager {
  private publicClient: PublicClient | null = null;
  private bundlerClient: any | null = null;
  private smartAccount: MetaMaskSmartAccount | null = null;
  private signerAccount: Account | null = null;
  private privateKey: `0x${string}` | null = null;

  async createEmbeddedSmartAccount(): Promise<SmartAccountConfig> {
    // 1. Initialize clients
    await this.initializeClients();

    // 2. Generate private key
    this.privateKey = generatePrivateKey();
    this.signerAccount = privateKeyToAccount(this.privateKey);

    // 3. Create smart account
    this.smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient!,
      implementation: Implementation.Hybrid,
      deployParams: [this.signerAccount.address, [], [], []],
      deploySalt: '0x',
      signer: {
        account: this.signerAccount,
      },
    });

    return {
      address: this.smartAccount.address,
      isDeployed: false, // Counterfactual
      implementation: 'Hybrid',
      owner: this.signerAccount.address,
    };
  }
}
```

### Usage in Frontend

```typescript
import { getMetaMaskSmartAccountManager } from './lib/metamask';

const manager = getMetaMaskSmartAccountManager();

// Create new embedded wallet
const config = await manager.createEmbeddedSmartAccount();
console.log('Smart Account:', config.address);
console.log('Private Key:', manager.getPrivateKey()); // SAVE THIS!

// Restore from saved private key
const restored = await manager.restoreSmartAccount(savedPrivateKey);
console.log('Restored:', restored.address);
```

## Security Considerations

1. **Private Key Storage**
   - Must be saved securely by user
   - Use encrypted storage
   - Consider using passkeys (WebAuthn) instead

2. **Backup & Recovery**
   - No seed phrase recovery
   - User must backup private key
   - Lost key = lost account

3. **Production Recommendations**
   - Use Web3Auth for social login
   - Implement passkey authentication
   - Add multi-sig for high-value accounts

## Bundler Setup

For production, you need a bundler service:

### Option 1: Pimlico
```typescript
const BUNDLER_RPC = 'https://api.pimlico.io/v2/monad-testnet/rpc?apikey=YOUR_KEY';
```

### Option 2: Alchemy
```typescript
const BUNDLER_RPC = 'https://monad-testnet.g.alchemy.com/v2/YOUR_KEY';
```

### Option 3: Self-hosted
Run your own bundler using ERC-4337 reference implementation

## References

- [MetaMask Delegation Toolkit Docs](https://docs.metamask.io/delegation-toolkit/)
- [Hello Gator Example](https://github.com/MetaMask/hello-gator)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Viem Account Abstraction](https://viem.sh/account-abstraction)

## Next Steps for Mirror Protocol

1. ✅ Build succeeds with new implementation
2. ⏳ Add UI for creating embedded wallets
3. ⏳ Implement private key backup/restore
4. ⏳ Configure bundler for Monad testnet
5. ⏳ Test delegation creation with smart accounts
6. ⏳ Add passkey support for better UX

---

**Status**: Implementation Complete
**Build**: ✅ Successful
**Ready for**: UI Integration & Testing
