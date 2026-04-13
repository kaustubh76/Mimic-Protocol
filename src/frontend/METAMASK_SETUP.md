# MetaMask Setup for Mirror Protocol

## 🦊 Manual Network Configuration

If automatic network addition fails, add Ethereum Sepolia manually:

### Option 1: Public RPC (Recommended)

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter the following:
   - **Network Name**: `Ethereum Sepolia`
   - **RPC URL**: `https://ethereum-sepolia-rpc.publicnode.com`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer**: `https://sepolia.etherscan.io`
4. Click "Save"

Note: Ethereum Sepolia is a well-known testnet and may already be available in MetaMask's built-in network list.

## 🔧 Troubleshooting

### Error: "Error while connecting to the custom network"

**Cause**: RPC URL might be unreachable or misconfigured

**Solutions**:
1. Try the public RPC URL: `https://ethereum-sepolia-rpc.publicnode.com`
2. Check if Sepolia is online: https://sepolia.etherscan.io
3. Clear MetaMask cache:
   - Settings → Advanced → Reset Account
   - Disconnect wallet from site
   - Reconnect

### Error: "Invalid Chain ID"

**Cause**: Chain ID format issue

**Solution**:
- Ensure Chain ID is exactly: `11155111` (decimal)
- MetaMask converts it to hex: `0xaa36a7`

### Error: "Request failed"

**Cause**: Network connectivity issue

**Solution**:
1. Check internet connection
2. Try switching MetaMask networks back and forth
3. Restart browser
4. Clear browser cache

## ✅ Verification

Once added, verify:
1. MetaMask shows "Ethereum Sepolia" in network dropdown
2. Chain ID shows as "11155111"
3. You can view transactions on: https://sepolia.etherscan.io

## 💰 Get Testnet ETH

You'll need Sepolia ETH for gas:
1. Visit a Sepolia faucet (e.g., https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia)
2. Enter your wallet address
3. Request testnet ETH

## 🔗 Resources

- **Ethereum Sepolia**: https://sepolia.etherscan.io
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com
