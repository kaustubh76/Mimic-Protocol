# MetaMask Setup for Mirror Protocol

## 🦊 Manual Network Configuration

If automatic network addition fails, add Monad Testnet manually:

### Option 1: Alchemy RPC (Recommended - Faster)

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter the following:
   - **Network Name**: `Monad Testnet`
   - **RPC URL**: `https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0`
   - **Chain ID**: `10143`
   - **Currency Symbol**: `MON`
   - **Block Explorer**: `https://explorer.testnet.monad.xyz`
4. Click "Save"

### Option 2: Public RPC (Fallback)

If Alchemy RPC doesn't work, try the public RPC:

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter the following:
   - **Network Name**: `Monad Testnet`
   - **RPC URL**: `https://testnet.monad.xyz/rpc`
   - **Chain ID**: `10143`
   - **Currency Symbol**: `MON`
   - **Block Explorer**: `https://explorer.testnet.monad.xyz`
4. Click "Save"

## 🔧 Troubleshooting

### Error: "Error while connecting to the custom network"

**Cause**: RPC URL might be unreachable or misconfigured

**Solutions**:
1. Try the public RPC URL: `https://testnet.monad.xyz/rpc`
2. Check if Monad testnet is online: https://testnet.monad.xyz
3. Clear MetaMask cache:
   - Settings → Advanced → Reset Account
   - Disconnect wallet from site
   - Reconnect

### Error: "Invalid Chain ID"

**Cause**: Chain ID format issue

**Solution**:
- Ensure Chain ID is exactly: `10143` (decimal)
- MetaMask converts it to hex: `0x27af`

### Error: "Request failed"

**Cause**: Network connectivity issue

**Solution**:
1. Check internet connection
2. Try switching MetaMask networks back and forth
3. Restart browser
4. Clear browser cache

## ✅ Verification

Once added, verify:
1. MetaMask shows "Monad Testnet" in network dropdown
2. Chain ID shows as "10143"
3. You can view transactions on: https://explorer.testnet.monad.xyz

## 💰 Get Testnet ETH

You'll need MON testnet tokens for gas:
1. Visit Monad Testnet Faucet (check Monad Discord for link)
2. Enter your wallet address
3. Request testnet MON

## 🔗 Resources

- **Monad Testnet**: https://testnet.monad.xyz
- **Explorer**: https://explorer.testnet.monad.xyz
- **Discord**: Check for official Monad Discord for support
