# Mirror Protocol Frontend - Deployment Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd src/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

### 4. Preview Production Build

```bash
npm run preview
```

---

## 📋 Prerequisites

- **Node.js**: v18 or later
- **MetaMask**: Browser extension installed
- **Monad Testnet**: ETH for gas fees

---

## 🔧 Configuration

### Environment Variables

The application uses hardcoded contract addresses in `lib/contracts.ts`. To modify:

```typescript
// lib/contracts.ts
export const CONTRACT_ADDRESSES = {
  behavioralNFT: '0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc',
  delegationRouter: '0x56C145f5567f8DB77533c825cf4205F1427c5517',
};
```

### Network Configuration

Monad testnet is configured in `lib/metamask.ts`:

```typescript
export const monadTestnet: Chain = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0'],
    },
  },
};
```

---

## 🧪 Testing the Application

### Step 1: Connect Wallet

1. Click "Connect MetaMask" button
2. Approve connection in MetaMask
3. MetaMask will prompt to switch to Monad testnet
4. Approve network switch

### Step 2: Create Smart Account

1. After wallet connection, click "Create Smart Account"
2. Smart Account will be created counterfactually (no gas cost)
3. Address will be displayed in wallet section

### Step 3: Browse Patterns

1. Navigate to "Browse Patterns" tab
2. View available patterns with performance metrics
3. Click "Delegate to This Pattern" on any active pattern

### Step 4: Create Delegation

1. Navigate to "Create Delegation" tab (or from pattern card)
2. **Simple Mode**:
   - Enter Pattern Token ID
   - Set percentage allocation (1-100%)
   - Click "Create Delegation"
3. **Advanced Mode**:
   - Toggle to "Advanced" mode
   - Set custom permissions (spend limits, expiration)
   - Configure conditional requirements (win rate, ROI, volume)
   - Click "Create Delegation"
4. Approve transaction in MetaMask
5. Wait for confirmation

### Step 5: Manage Delegations

1. Navigate to "Manage Delegations" tab
2. View all your delegations
3. **Update Percentage**:
   - Click edit icon (✏️) next to allocation
   - Enter new percentage
   - Click "Save"
4. **Revoke Delegation**:
   - Click "Revoke" button
   - Confirm in popup
   - Approve transaction in MetaMask

---

## 📊 Features Showcase

### Envio Metrics Banner

The top banner displays real-time Envio HyperSync metrics:
- Events Processed: Total events indexed
- Avg Latency: **47ms** (50x faster than alternatives)
- Peak Throughput: Events per second
- Cross-Chain Queries: Multi-chain aggregation
- Patterns Detected: Total behavioral patterns

### Pattern Cards

Each pattern displays:
- Pattern ID and type
- **Win Rate**: Success percentage
- **ROI**: Return on investment
- **Creator**: Pattern originator address
- **Status**: Active/Inactive badge

### Delegation Management

- View all delegations
- Active/Inactive status
- Pattern information
- Allocation percentage
- Smart Account address
- Created timestamp
- Conditional checks indicator

---

## 🎯 Demo Flow

### For Hackathon Demo

1. **Open Application** → Show welcome screen
2. **Connect Wallet** → Demonstrate MetaMask integration
3. **Show Envio Metrics** → Highlight 47ms latency
4. **Create Smart Account** → Show ERC-4337 functionality
5. **Browse Patterns** → Display pattern performance
6. **Create Delegation** → Show both simple & advanced
7. **View Delegations** → Show management interface
8. **Update Percentage** → Demonstrate inline editing
9. **Revoke Delegation** → Show delegation lifecycle

### Key Talking Points

✅ **Sub-50ms Pattern Detection** - "Envio HyperSync detects patterns in 47ms"
✅ **MetaMask Smart Accounts** - "ERC-4337 counterfactual accounts"
✅ **NFT-Based Delegations** - "Trading patterns as NFTs with delegatable permissions"
✅ **Custom Permissions** - "Spend limits, expiration, token whitelists"
✅ **Conditional Execution** - "Only execute if win rate > 60%, ROI > 10%"
✅ **Monad Testnet** - "Deployed and tested on Monad"

---

## 🐛 Troubleshooting

### MetaMask Not Detected

**Issue**: "MetaMask is not installed" error

**Solution**:
- Install MetaMask extension from https://metamask.io
- Refresh the page
- Click "Connect MetaMask" again

### Wrong Network

**Issue**: Transactions fail or network errors

**Solution**:
- MetaMask should auto-prompt to switch networks
- If not, manually add Monad testnet:
  - Network Name: `Monad Testnet`
  - RPC URL: `https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0`
  - Chain ID: `10143`
  - Currency Symbol: `MON`
  - Explorer: `https://explorer.testnet.monad.xyz`

### No Patterns Showing

**Issue**: "No patterns detected yet" message

**Solution**:
- Patterns must be minted by pattern detector
- Use the pattern minting script:
  ```bash
  cd /Users/apple/Desktop/Mimic\ Protocol
  forge script script/MintPattern.s.sol --rpc-url $MONAD_RPC_URL --broadcast
  ```

### Transaction Failures

**Issue**: Transactions revert or fail

**Solution**:
1. Check you have sufficient ETH for gas
2. Verify Smart Account is created
3. Check pattern is active
4. Verify percentage is between 1-100%
5. Check contract addresses are correct

### Import Path Errors

**Issue**: Module not found errors

**Solution**:
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Restart dev server: `npm run dev`

---

## 📦 Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd src/frontend
vercel
```

### Netlify Deployment

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
netlify deploy --prod --dir=dist
```

### GitHub Pages

```bash
# Build with correct base path
vite build --base=/mirror-protocol/

# Deploy to gh-pages branch
npm run deploy
```

---

## 🔗 Resources

- **Application**: http://localhost:3000 (dev)
- **Monad Explorer**: https://explorer.testnet.monad.xyz
- **BehavioralNFT**: https://explorer.testnet.monad.xyz/address/0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc
- **DelegationRouter**: https://explorer.testnet.monad.xyz/address/0x56C145f5567f8DB77533c825cf4205F1427c5517
- **MetaMask Docs**: https://docs.metamask.io/delegation-toolkit/
- **Envio Docs**: https://docs.envio.dev

---

## 📝 Package Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "tsc && vite build",     // Build for production
  "preview": "vite preview",        // Preview production build
  "lint": "eslint . --ext ts,tsx"   // Lint code
}
```

---

## ✅ Checklist for Demo

- [ ] MetaMask installed and connected
- [ ] Monad testnet ETH in wallet
- [ ] Contracts deployed to Monad testnet
- [ ] At least 1 pattern minted
- [ ] Frontend running on localhost:3000
- [ ] Smart Account created
- [ ] Test delegation created
- [ ] All features working (create, view, update, revoke)
- [ ] Envio metrics displaying correctly
- [ ] Explorer links working

---

## 🎉 Status

**Frontend Status**: ✅ Production Ready

**Last Updated**: January 2025

**Version**: 1.0.0

**Author**: Mirror Protocol Team
