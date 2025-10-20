# MetaMask Template Analysis - Complete Integration Guide

## ✅ Key Discovery

The official MetaMask template uses a **HYBRID APPROACH**:

1. **Connect to MetaMask browser extension** (EOA) via **Wagmi**
2. **Create a smart account** linked to that EOA
3. **Send transactions** as user operations via bundler

This is DIFFERENT from pure embedded wallets! They still use MetaMask extension but upgrade it to a smart account.

---

## 📁 Template Structure (MIMIC folder)

### Core Dependencies
```json
{
  "@metamask/delegation-toolkit": "^0.13.0",
  "wagmi": "^2.15.3",
  "viem": "^2.29.2",
  "permissionless": "^0.2.46",
  "@tanstack/react-query": "^5.76.1"
}
```

### File Structure
```
src/
├── providers/
│   ├── AppProvider.tsx        # Wagmi + React Query setup
│   ├── GatorProvider.tsx      # Delegate wallet generation
│   └── StepProvider.tsx       # UI step management
├── hooks/
│   ├── useDelegatorSmartAccount.tsx   # Smart account creation
│   ├── useDelegateSmartAccount.tsx    # Delegate smart account
│   ├── useAccountAbstractionUtils.tsx # Bundler/Paymaster clients
│   └── useStorageClient.ts            # Storage utilities
└── components/
    ├── ConnectButton.tsx              # Wallet connection
    ├── DeployDelegatorButton.tsx      # Deploy smart account
    ├── CreateDelegationButton.tsx     # Create delegation
    └── RedeemDelegationButton.tsx     # Redeem delegation
```

---

## 🔑 Key Implementation Patterns

### 1. Wallet Connection via Wagmi

**File**: `src/providers/AppProvider.tsx`

```typescript
import { createConfig, http, WagmiProvider } from "wagmi";
import { sepolia } from "viem/chains";
import { metaMask } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [metaMask()],
  transports: {
    [sepolia.id]: http(),
  },
});

export function AppProvider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      {children}
    </WagmiProvider>
  );
}
```

**Key Points:**
- ✅ Uses Wagmi to connect to MetaMask extension
- ✅ Supports multiple chains
- ✅ Standard Web3 wallet connection pattern

### 2. Smart Account Creation

**File**: `src/hooks/useDelegatorSmartAccount.tsx`

```typescript
import { toMetaMaskSmartAccount, Implementation } from "@metamask/delegation-toolkit";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

export default function useDelegatorSmartAccount() {
  const { address } = useAccount(); // EOA from MetaMask
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState(null);

  useEffect(() => {
    if (!address || !walletClient || !publicClient) return;

    toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [address, [], [], []], // EOA as owner
      deploySalt: "0x",
      signer: { walletClient }, // Uses Wagmi wallet client
    }).then(setSmartAccount);
  }, [address, walletClient, publicClient]);

  return { smartAccount };
}
```

**Key Points:**
- ✅ EOA address becomes the **owner** of smart account
- ✅ Uses `walletClient` from Wagmi (connected to MetaMask)
- ✅ Smart account is **linked to user's MetaMask wallet**
- ✅ Counterfactual creation (deploys on first use)

### 3. Bundler Client Setup

**File**: `src/hooks/useAccountAbstractionUtils.tsx`

```typescript
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { http } from "viem";

export function useAccountAbstractionUtils() {
  const chainId = useChainId();
  const pimlicoKey = import.meta.env.VITE_PIMLICO_API_KEY;

  const bundlerClient = createBundlerClient({
    transport: http(
      `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`
    ),
  });

  const paymasterClient = createPaymasterClient({
    transport: http(
      `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`
    ),
  });

  return { bundlerClient, paymasterClient };
}
```

**Key Points:**
- ✅ Uses **Pimlico** as bundler service
- ✅ Creates separate bundler and paymaster clients
- ✅ Supports **gasless transactions** via paymaster

### 4. Sending User Operations

**File**: `src/components/DeployDelegatorButton.tsx`

```typescript
export default function DeployDelegatorButton() {
  const { smartAccount } = useDelegatorSmartAccount();
  const { bundlerClient, paymasterClient, pimlicoClient } = useAccountAbstractionUtils();

  const handleDeployDelegator = async () => {
    // Get gas prices
    const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

    // Send user operation
    const userOperationHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [{
        to: zeroAddress, // Contract address
        // data: encodedFunctionCall, // For contract calls
      }],
      paymaster: paymasterClient, // Optional: for gasless txs
      ...fee,
    });

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({
      hash: userOperationHash,
    });

    console.log('Transaction confirmed:', receipt);
  };

  return <Button onClick={handleDeployDelegator}>Deploy</Button>;
}
```

**Key Points:**
- ✅ NO `walletClient.writeContract()` calls
- ✅ ALL transactions go through `bundlerClient.sendUserOperation()`
- ✅ Gas estimation via Pimlico
- ✅ Optional gasless transactions

### 5. Delegate Wallet Generation

**File**: `src/providers/GatorProvider.tsx`

```typescript
import { generatePrivateKey } from "viem/accounts";

export const GatorProvider = ({ children }) => {
  const [delegateWallet, setDelegateWallet] = useState("0x");

  const generateDelegateWallet = useCallback(() => {
    const privateKey = generatePrivateKey();
    setDelegateWallet(privateKey);
  }, []);

  return (
    <GatorContext.Provider value={{ delegateWallet, generateDelegateWallet }}>
      {children}
    </GatorContext.Provider>
  );
};
```

**Key Points:**
- ✅ Generates private keys for **delegate** accounts
- ✅ Separate from main wallet
- ✅ Used for delegation scenarios

---

## 🎯 How to Integrate into Mirror Protocol

### Step 1: Install Dependencies

```bash
cd "src/frontend"
pnpm add wagmi @tanstack/react-query permissionless
```

### Step 2: Update Monad Chain Configuration

**File**: `src/frontend/lib/chains.ts` (create new file)

```typescript
import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10159,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.monad.xyz/rpc'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.testnet.monad.xyz',
    },
  },
  testnet: true,
});
```

### Step 3: Setup Wagmi Provider

**File**: `src/frontend/lib/wagmi-config.ts` (create new file)

```typescript
import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import { monadTestnet } from './chains';

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [metaMask()],
  transports: {
    [monadTestnet.id]: http(),
  },
});
```

**File**: `src/frontend/src/App.tsx` (update)

```typescript
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../lib/wagmi-config';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {/* Your existing app */}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
```

### Step 4: Create Smart Account Hook

**File**: `src/frontend/hooks/useSmartAccount.ts` (create new file)

```typescript
import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { toMetaMaskSmartAccount, Implementation } from '@metamask/delegation-toolkit';
import type { MetaMaskSmartAccount } from '@metamask/delegation-toolkit';

export function useSmartAccount() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [smartAccount, setSmartAccount] = useState<MetaMaskSmartAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !walletClient || !publicClient) return;

    setIsLoading(true);
    toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [address, [], [], []],
      deploySalt: '0x',
      signer: { walletClient },
    })
      .then(setSmartAccount)
      .finally(() => setIsLoading(false));
  }, [address, walletClient, publicClient]);

  return { smartAccount, isLoading };
}
```

### Step 5: Setup Bundler Client

**File**: `src/frontend/hooks/useBundlerClient.ts` (create new file)

```typescript
import { useEffect, useState } from 'react';
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction';
import { http } from 'viem';
import { useChainId } from 'wagmi';

export function useBundlerClient() {
  const chainId = useChainId();
  const [bundlerClient, setBundlerClient] = useState<any>(null);
  const [paymasterClient, setPaymasterClient] = useState<any>(null);

  useEffect(() => {
    // TODO: Get Pimlico API key for Monad testnet
    const pimlicoKey = import.meta.env.VITE_PIMLICO_API_KEY;

    if (!pimlicoKey) {
      console.warn('Pimlico API key not set. User operations may not work.');
      return;
    }

    const bundler = createBundlerClient({
      transport: http(`https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`),
    });

    const paymaster = createPaymasterClient({
      transport: http(`https://api.pimlico.io/v2/${chainId}/rpc?apikey=${pimlicoKey}`),
    });

    setBundlerClient(bundler);
    setPaymasterClient(paymaster);
  }, [chainId]);

  return { bundlerClient, paymasterClient };
}
```

### Step 6: Update Delegation Service

**File**: `src/frontend/lib/delegation-service.ts` (major update needed)

```typescript
import { encodeFunctionData } from 'viem';
import { DELEGATION_ROUTER_ABI, CONTRACT_ADDRESSES } from './contracts';

export class DelegationService {
  async createDelegation(
    smartAccount: any,
    bundlerClient: any,
    params: CreateDelegationParams
  ) {
    // Encode the contract call
    const callData = encodeFunctionData({
      abi: DELEGATION_ROUTER_ABI,
      functionName: 'createDelegation',
      args: [
        params.patternTokenId,
        params.percentageAllocation,
        params.permissions,
        params.conditions,
        params.smartAccountAddress,
      ],
    });

    // Send as user operation
    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [{
        to: CONTRACT_ADDRESSES.delegationRouter,
        data: callData,
      }],
    });

    // Wait for confirmation
    const { receipt } = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    return receipt;
  }
}
```

### Step 7: Update UI Components

**File**: `src/frontend/components/WalletConnect.tsx` (simplify)

```typescript
import { useConnect, useAccount, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button key={connector.id} onClick={() => connect({ connector })}>
          Connect with {connector.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 🚀 Complete Integration Checklist

- [ ] Install Wagmi, React Query, Permissionless
- [ ] Create Monad chain configuration
- [ ] Setup Wagmi provider with MetaMask connector
- [ ] Create `useSmartAccount` hook
- [ ] Create `useBundlerClient` hook (need Pimlico API key)
- [ ] Update delegation service to use user operations
- [ ] Simplify WalletConnect component to use Wagmi
- [ ] Remove all old EOA-based code
- [ ] Test wallet connection
- [ ] Test smart account creation
- [ ] Test delegation creation via user operations

---

## ⚠️ Critical Requirements

### 1. Pimlico API Key
You NEED a bundler service. Get Pimlico API key:
- Sign up: https://www.pimlico.io/
- Check if they support Monad testnet
- Add to `.env`: `VITE_PIMLICO_API_KEY=your_key_here`

### 2. Monad Bundler Support
**IMPORTANT**: Check if Monad testnet has bundler support:
- Contact Monad team
- Ask if they have ERC-4337 bundler
- May need to use fallback RPC for now

### 3. Environment Variables

```env
# .env file
VITE_PIMLICO_API_KEY=your_pimlico_api_key
```

---

## 📊 Comparison: Your Old Code vs Template

| Aspect | Your Old Code | Template Pattern |
|--------|--------------|------------------|
| **Wallet Connection** | Manual `eth_requestAccounts` | Wagmi `useConnect` |
| **Smart Account** | Standalone embedded wallet | Linked to EOA |
| **Signer** | `{ account: signerAccount }` | `{ walletClient }` |
| **Transactions** | `walletClient.writeContract()` | `bundlerClient.sendUserOperation()` |
| **Private Keys** | Generated & stored | Managed by MetaMask |
| **User Experience** | User manages private key | Familiar MetaMask flow |

---

## 🎯 Recommended Next Steps

1. **Test the MIMIC template**
   ```bash
   cd /Users/apple/Desktop/Mimic\ Protocol/MIMIC
   pnpm dev
   ```
   Open http://localhost:5173 and test the flow

2. **Get Pimlico API Key**
   - Sign up at https://www.pimlico.io/
   - Check Monad testnet support

3. **Start Integration**
   - Begin with Step 1 (install dependencies)
   - Follow steps 2-7 systematically
   - Test each step before moving to next

4. **Keep Template as Reference**
   - Don't delete MIMIC folder
   - Reference it when stuck
   - Copy patterns, not entire files

---

**Status**: ✅ Template analyzed | ⏳ Integration guide complete | Ready to implement

**Estimated Time**: 3-4 hours for complete integration
