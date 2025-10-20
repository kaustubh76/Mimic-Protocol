# Mirror Protocol - Troubleshooting Guide

## 🐛 Common Issues and Solutions

### 1. MetaMask Connection Error: "Error while connecting to the custom network"

**Problem**: MetaMask fails to connect to Monad Testnet

**Solutions**:

#### Solution A: Manual Network Addition (Recommended)
1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name**: `Monad Testnet`
   - **RPC URL**: `https://testnet.monad.xyz/rpc`
   - **Chain ID**: `10143`
   - **Currency Symbol**: `MON`
   - **Block Explorer**: `https://explorer.testnet.monad.xyz`
4. Click "Save"
5. Refresh the Mirror Protocol page
6. Click "Connect MetaMask" again

#### Solution B: Reset MetaMask Connection
1. In MetaMask, go to Settings → Advanced → Reset Account
2. Disconnect from Mirror Protocol site
3. Refresh page
4. Connect again

#### Solution C: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for specific error messages
4. Common errors:
   - `Invalid RPC URL` → Use public RPC: `https://testnet.monad.xyz/rpc`
   - `Chain ID mismatch` → Ensure Chain ID is exactly `10143`
   - `Network unreachable` → Check Monad testnet status

---

### 2. Envio Indexer Won't Start

**Problem**: `pnpm dev` fails or loops infinitely

**Error Messages**:
```
Error: Cannot find module config.yaml
```

**Solution**:
```bash
# Ensure you're running from the correct directory
cd "/Users/apple/Desktop/Mimic Protocol"
pnpm dev

# OR run Envio directly
cd src/envio
envio dev
```

**If Docker issues**:
```bash
# Check Docker is running
docker ps

# Restart Docker containers
docker-compose down
docker-compose up -d

# Try again
pnpm dev
```

---

### 3. Frontend Won't Start

**Problem**: `npm run dev` fails in frontend directory

**Error Messages**:
```
Module not found
```

**Solution**:
```bash
cd src/frontend

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Start dev server
npm run dev
```

**If port 3000 is busy**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts
# server: { port: 3001 }
```

---

### 4. Smart Account Creation Fails

**Problem**: "Create Smart Account" button doesn't work

**Possible Causes**:
- Wallet not connected
- Wrong network
- Insufficient gas

**Solutions**:

1. **Check Connection**:
   - Ensure MetaMask shows "Monad Testnet"
   - Verify wallet is connected (green checkmark)

2. **Get Testnet ETH**:
   - You need MON for gas fees
   - Check Monad Discord for faucet link
   - Or use: https://testnet.monad.xyz (if available)

3. **Check Console**:
   - Open browser DevTools (F12)
   - Look for error messages
   - Common: `Insufficient funds for gas`

---

### 5. Delegation Creation Fails

**Problem**: Transaction reverts or fails

**Error Messages**:
```
Pattern is not active
Percentage out of range
Insufficient allowance
```

**Solutions**:

1. **Pattern Not Active**:
   - Only active patterns can receive delegations
   - Browse patterns and check the "Active" badge
   - Pattern #1 should be active (minted during deployment)

2. **Invalid Percentage**:
   - Must be between 1% and 100%
   - Input as: `50` (not `0.5` for 50%)

3. **No Smart Account**:
   - Click "Create Smart Account" first
   - Wait for confirmation
   - Then create delegation

---

### 6. No Patterns Showing

**Problem**: "No patterns detected yet" message

**Cause**: No patterns have been minted

**Solution**:
```bash
cd "/Users/apple/Desktop/Mimic Protocol"

# Mint a test pattern
forge script script/MintPattern.s.sol \
  --rpc-url https://testnet.monad.xyz/rpc \
  --broadcast \
  --private-key $DEPLOYER_PRIVATE_KEY
```

**Verify on Envio**:
1. Open http://localhost:8080 (Hasura console)
2. Password: `testing`
3. Run query:
```graphql
query {
  BehavioralNFT_PatternMinted {
    tokenId
    creator
    patternType
  }
}
```

---

### 7. Envio Data Not Showing

**Problem**: Hasura console shows no data

**Solutions**:

1. **Check start_block**:
```bash
cd src/envio
cat config.yaml | grep start_block
# Should be: 42525000 (before contract deployment)
```

2. **Restart Envio**:
```bash
# Stop current process (Ctrl+C)
# Start again
pnpm dev
```

3. **Check Database**:
```bash
# Hasura console
open http://localhost:8080
# Password: testing

# Check if tables exist
# Run a simple query
```

---

### 8. Transaction Pending Forever

**Problem**: MetaMask transaction stuck on "Pending"

**Solutions**:

1. **Speed Up**:
   - Click transaction in MetaMask
   - Click "Speed Up"
   - Increase gas price

2. **Cancel**:
   - Click "Cancel" in MetaMask
   - Confirm cancellation
   - Try again

3. **Clear Pending Txs**:
   - Settings → Advanced → Reset Account
   - This clears nonce issues

---

### 9. Build Errors

**Problem**: TypeScript or build errors

**Solutions**:

1. **Clean Build**:
```bash
cd src/frontend
rm -rf node_modules dist .vite
npm install
npm run build
```

2. **Check TypeScript**:
```bash
npx tsc --noEmit
# Shows type errors
```

3. **Update Dependencies**:
```bash
npm update
```

---

### 10. Contract Interaction Fails

**Problem**: Reads/writes to contracts fail

**Possible Causes**:
- Wrong contract address
- Wrong network
- ABI mismatch

**Solutions**:

1. **Verify Contract Addresses**:
```typescript
// Check src/frontend/lib/contracts.ts
BehavioralNFT: 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc
DelegationRouter: 0x56C145f5567f8DB77533c825cf4205F1427c5517
```

2. **Verify on Explorer**:
   - https://explorer.testnet.monad.xyz
   - Search for contract address
   - Check it exists and has code

3. **Check Network**:
   - MetaMask must show "Monad Testnet"
   - Chain ID: 10143

---

## 🔍 Debugging Steps

### General Debugging Process

1. **Check Browser Console** (F12)
   - Look for red errors
   - Note exact error messages

2. **Check MetaMask**
   - Is it connected?
   - Correct network?
   - Sufficient balance?

3. **Check Backend Logs**
   - Terminal running `pnpm dev` (Envio)
   - Terminal running `npm run dev` (Frontend)

4. **Check Hasura**
   - http://localhost:8080
   - Password: `testing`
   - Query for data

5. **Check Explorer**
   - https://explorer.testnet.monad.xyz
   - Search for transactions
   - Verify contract interactions

---

## 📞 Getting Help

### Information to Provide

When asking for help, include:

1. **Error Message** (exact text)
2. **Browser Console Log** (screenshot or text)
3. **What you were trying to do**
4. **Network** (should be Monad Testnet)
5. **Wallet Address** (for checking on explorer)

### Where to Get Help

- **GitHub Issues**: [Project repository]
- **Monad Discord**: Check #support channel
- **Browser DevTools**: Console tab for errors

---

## ✅ Health Check

Run this checklist to verify everything works:

- [ ] MetaMask installed and unlocked
- [ ] Monad Testnet added to MetaMask
- [ ] Wallet has MON testnet tokens
- [ ] Envio indexer running (pnpm dev)
- [ ] Frontend running (npm run dev)
- [ ] Hasura console accessible (localhost:8080)
- [ ] Can connect wallet
- [ ] Can create Smart Account
- [ ] Patterns showing in "Browse Patterns"
- [ ] Can create delegation
- [ ] Can view delegations in "Manage"

---

## 🔗 Useful Links

- **Monad Explorer**: https://explorer.testnet.monad.xyz
- **Hasura Console**: http://localhost:8080 (password: `testing`)
- **Frontend**: http://localhost:3000
- **Contract Addresses**: See [README.md](README.md)

---

**Last Updated**: January 11, 2025

Need more help? Check [DEPLOYMENT_GUIDE.md](src/frontend/DEPLOYMENT_GUIDE.md) for detailed setup instructions.
