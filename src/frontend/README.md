# Mirror Protocol - Frontend Integration

Complete MetaMask Delegation Toolkit integration for Mirror Protocol, enabling NFT-based behavioral pattern delegations on Ethereum Sepolia.

## 📦 Installation

```bash
cd src/frontend
npm install
```

### Dependencies

```json
{
  "@metamask/delegation-toolkit": "^0.1.0",
  "viem": "^2.21.0",
  "wagmi": "^2.0.0",
  "react": "^18.2.0"
}
```

## 🚀 Quick Start

### 1. Basic Integration

```tsx
import React from 'react';
import { WalletConnect, CreateDelegation, DelegationList } from './components';

function App() {
  return (
    <div>
      <WalletConnect />
      <CreateDelegation />
      <DelegationList />
    </div>
  );
}
```

### 2. Using Hooks Directly

```tsx
import { useMetaMask, useDelegation } from './hooks';

function CustomComponent() {
  const { isConnected, connect, smartAccountAddress } = useMetaMask();
  const { createSimpleDelegation, parsePercentage } = useDelegation();

  const handleDelegate = async () => {
    if (!isConnected) {
      await connect();
    }

    const delegationId = await createSimpleDelegation({
      patternTokenId: 1n,
      percentageAllocation: parsePercentage(50), // 50%
    });

    console.log('Delegation created:', delegationId);
  };

  return <button onClick={handleDelegate}>Delegate 50%</button>;
}
```

## 📚 API Reference

### Hooks

#### `useMetaMask()`

Manages MetaMask wallet connection and Smart Account creation.

```tsx
const {
  // State
  isConnected: boolean,
  isConnecting: boolean,
  eoaAddress: Address | null,
  smartAccountAddress: Address | null,
  smartAccountConfig: SmartAccountConfig | null,
  error: Error | null,

  // Actions
  connect: () => Promise<void>,
  disconnect: () => void,
  createSmartAccount: () => Promise<void>,
  clearError: () => void,
} = useMetaMask();
```

**Example: Wallet Connection**

```tsx
function WalletButton() {
  const { isConnected, eoaAddress, connect, disconnect } = useMetaMask();

  return (
    <button onClick={isConnected ? disconnect : connect}>
      {isConnected ? `Disconnect ${eoaAddress}` : 'Connect Wallet'}
    </button>
  );
}
```

#### `useDelegation()`

Manages delegation creation, queries, and updates.

```tsx
const {
  // Create delegations
  createSimpleDelegation: (params) => Promise<bigint>,
  createDelegation: (params) => Promise<bigint>,

  // Query delegations
  getDelegation: (id) => Promise<Delegation>,
  getMyDelegations: () => Promise<bigint[]>,
  getPatternDelegations: (patternId) => Promise<bigint[]>,

  // Manage delegations
  revokeDelegation: (id) => Promise<Hash>,
  updatePercentage: (id, percentage) => Promise<Hash>,

  // Pattern queries
  getPatternMetadata: (id) => Promise<PatternMetadata>,
  getTotalPatterns: () => Promise<bigint>,
  getTotalDelegations: () => Promise<bigint>,

  // Transaction state
  txState: TransactionState,
  resetTxState: () => void,

  // Helpers
  formatPercentage: (basisPoints: bigint) => string,
  parsePercentage: (percentage: number) => bigint,
  createDefaultPermissions: () => DelegationPermissions,
  createDefaultConditions: () => ConditionalRequirements,
} = useDelegation();
```

**Example: Simple Delegation**

```tsx
function QuickDelegate() {
  const { createSimpleDelegation, parsePercentage, txState } = useDelegation();

  const handleDelegate = async () => {
    const delegationId = await createSimpleDelegation({
      patternTokenId: 1n,
      percentageAllocation: parsePercentage(50), // 50%
    });
    console.log('Created:', delegationId);
  };

  return (
    <button onClick={handleDelegate} disabled={txState.isLoading}>
      {txState.isLoading ? 'Creating...' : 'Delegate 50%'}
    </button>
  );
}
```

**Example: Advanced Delegation**

```tsx
function AdvancedDelegate() {
  const { createDelegation, createDefaultPermissions, createDefaultConditions } = useDelegation();

  const handleDelegate = async () => {
    // Custom permissions
    const permissions = createDefaultPermissions();
    permissions.maxSpendPerTx = BigInt('1000000000000000000'); // 1 ETH
    permissions.maxSpendPerDay = BigInt('5000000000000000000'); // 5 ETH
    permissions.expiresAt = BigInt(Math.floor(Date.now() / 1000) + 86400 * 30); // 30 days
    permissions.requiresConditionalCheck = true;

    // Custom conditions
    const conditions = createDefaultConditions();
    conditions.minWinRate = 6000n; // 60%
    conditions.minROI = 1000n; // 10%
    conditions.minVolume = BigInt('10000000000000000000'); // 10 ETH
    conditions.isActive = true;

    const delegationId = await createDelegation({
      patternTokenId: 1n,
      percentageAllocation: 5000n, // 50%
      permissions,
      conditions,
    });

    console.log('Advanced delegation created:', delegationId);
  };

  return <button onClick={handleDelegate}>Create Advanced Delegation</button>;
}
```

### Components

#### `<WalletConnect />`

Wallet connection component with Smart Account creation.

**Props:**
- `onConnected?: (address: string) => void` - Callback when wallet connects
- `className?: string` - CSS class name

**Example:**

```tsx
<WalletConnect
  onConnected={(address) => console.log('Connected:', address)}
  className="my-wallet-connect"
/>
```

#### `<CreateDelegation />`

Form for creating simple and advanced delegations.

**Props:**
- `onSuccess?: (delegationId: bigint) => void` - Callback when delegation is created
- `className?: string` - CSS class name

**Features:**
- Simple mode: Pattern ID + percentage
- Advanced mode: Custom permissions & conditions
- Real-time validation
- Transaction status tracking

**Example:**

```tsx
<CreateDelegation
  onSuccess={(id) => alert(`Delegation #${id} created!`)}
/>
```

#### `<DelegationList />`

Display and manage user delegations.

**Props:**
- `onDelegationClick?: (delegationId: bigint) => void` - Callback when delegation is clicked
- `className?: string` - CSS class name

**Features:**
- View all user delegations
- Edit allocation percentage
- Revoke delegations
- View on block explorer

**Example:**

```tsx
<DelegationList
  onDelegationClick={(id) => console.log('Clicked:', id)}
/>
```

## 🔧 Configuration

### Contract Addresses (Ethereum Sepolia)

Update `lib/contracts.ts` with deployed addresses:

```typescript
export const CONTRACT_ADDRESSES: ContractAddresses = {
  behavioralNFT: '0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954',
  delegationRouter: '0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8',
};
```

### Network Configuration

Ethereum Sepolia is configured in `lib/metamask.ts`:

```typescript
export const sepoliaChain: Chain = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia-rpc.publicnode.com'],
    },
  },
  blockExplorers: {
    default: {
      url: 'https://sepolia.etherscan.io',
    },
  },
};
```

## 📖 Type Definitions

### `DelegationPermissions`

```typescript
interface DelegationPermissions {
  maxSpendPerTx: bigint;           // Maximum wei per transaction
  maxSpendPerDay: bigint;          // Maximum wei per day
  expiresAt: bigint;               // Unix timestamp (0 = no expiration)
  allowedTokens: Address[];        // Whitelisted token addresses
  requiresConditionalCheck: boolean; // Enable conditional checks
}
```

### `ConditionalRequirements`

```typescript
interface ConditionalRequirements {
  minWinRate: bigint;  // Basis points (6000 = 60%)
  minROI: bigint;      // Basis points (1000 = 10%)
  minVolume: bigint;   // Minimum volume in wei
  isActive: boolean;   // Enable/disable conditions
}
```

### `Delegation`

```typescript
interface Delegation {
  delegator: Address;
  patternTokenId: bigint;
  percentageAllocation: bigint;
  permissions: DelegationPermissions;
  conditions: ConditionalRequirements;
  createdAt: bigint;
  isActive: boolean;
  smartAccountAddress: Address;
}
```

## 🎯 Common Use Cases

### Use Case 1: Quick Delegation Flow

```tsx
import { useMetaMask, useDelegation } from './hooks';

function QuickDelegateFlow() {
  const { connect, isConnected, createSmartAccount, smartAccountAddress } = useMetaMask();
  const { createSimpleDelegation, parsePercentage } = useDelegation();

  const handleQuickDelegate = async () => {
    // Step 1: Connect wallet
    if (!isConnected) {
      await connect();
    }

    // Step 2: Create smart account if needed
    if (!smartAccountAddress) {
      await createSmartAccount();
    }

    // Step 3: Create delegation
    const delegationId = await createSimpleDelegation({
      patternTokenId: 1n,
      percentageAllocation: parsePercentage(50),
    });

    console.log('✅ Delegation created:', delegationId);
  };

  return <button onClick={handleQuickDelegate}>Delegate Now</button>;
}
```

### Use Case 2: Pattern Performance Monitoring

```tsx
import { useDelegation } from './hooks';

function PatternPerformance({ patternId }: { patternId: bigint }) {
  const { getPatternMetadata } = useDelegation();
  const [metadata, setMetadata] = React.useState(null);

  React.useEffect(() => {
    getPatternMetadata(patternId).then(setMetadata);
  }, [patternId]);

  if (!metadata) return <div>Loading...</div>;

  return (
    <div>
      <h3>Pattern #{patternId.toString()}</h3>
      <p>Win Rate: {Number(metadata.winRate) / 100}%</p>
      <p>ROI: {Number(metadata.roi) / 100}%</p>
      <p>Volume: {metadata.totalVolume.toString()}</p>
    </div>
  );
}
```

### Use Case 3: Delegation Dashboard

```tsx
import { useDelegation } from './hooks';

function DelegationDashboard() {
  const { getMyDelegations, getDelegation, getTotalDelegations } = useDelegation();
  const [delegations, setDelegations] = React.useState([]);
  const [totalGlobal, setTotalGlobal] = React.useState(0n);

  React.useEffect(() => {
    async function load() {
      const ids = await getMyDelegations();
      const delegationData = await Promise.all(
        ids.map((id) => getDelegation(id))
      );
      setDelegations(delegationData);

      const total = await getTotalDelegations();
      setTotalGlobal(total);
    }
    load();
  }, []);

  return (
    <div>
      <h2>My Delegations: {delegations.length}</h2>
      <h3>Total Protocol Delegations: {totalGlobal.toString()}</h3>
      {delegations.map((d, i) => (
        <div key={i}>
          <p>Pattern: #{d.patternTokenId.toString()}</p>
          <p>Allocation: {Number(d.percentageAllocation) / 100}%</p>
        </div>
      ))}
    </div>
  );
}
```

## 🛠️ Troubleshooting

### MetaMask Not Detected

```tsx
const { isMetaMaskInstalled } = useMetaMask();

if (!isMetaMaskInstalled()) {
  return (
    <div>
      <p>MetaMask not detected</p>
      <a href="https://metamask.io">Install MetaMask</a>
    </div>
  );
}
```

### Wrong Network

```tsx
// MetaMask SDK automatically prompts to switch to Ethereum Sepolia
// or adds the network if not configured
```

### Transaction Errors

```tsx
const { txState } = useDelegation();

if (txState.error) {
  console.error('Transaction failed:', txState.error.message);
  // Handle specific errors
  if (txState.error.message.includes('user rejected')) {
    alert('Transaction was cancelled');
  }
}
```

## 📝 Examples

See `/examples` directory for complete working examples:
- `BasicIntegration.tsx` - Complete delegation interface
- `CustomHooksUsage.tsx` - Hook usage patterns

## 🔗 Links

- **Ethereum Sepolia Explorer**: https://sepolia.etherscan.io
- **MetaMask Delegation Toolkit**: https://docs.metamask.io/delegation-toolkit/
- **Viem Documentation**: https://viem.sh

## 📄 License

MIT License - Mirror Protocol Team
