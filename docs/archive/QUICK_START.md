# Mirror Protocol - Quick Start Guide

## 🚀 Start Everything in 3 Commands

```bash
# Terminal 1: Start Envio Indexer
cd "/Users/apple/Desktop/Mimic Protocol"
pnpm dev

# Terminal 2: Start Frontend
cd "/Users/apple/Desktop/Mimic Protocol/src/frontend"
npm run dev

# Terminal 3: Open Browser
open http://localhost:3000
```

---

## ✅ Checklist

### Before Starting
- [ ] MetaMask installed
- [ ] Monad testnet ETH in wallet
- [ ] Docker running (for Envio)

### Start Services
- [ ] Envio indexer running (Terminal 1)
- [ ] Frontend running (Terminal 2)
- [ ] Browser open at localhost:3000

### Test Flow
- [ ] Connect MetaMask
- [ ] Create Smart Account
- [ ] Browse patterns
- [ ] Create delegation
- [ ] Manage delegations

---

## 🔗 Important URLs

- **Frontend**: http://localhost:3000
- **Envio Hasura**: http://localhost:8080 (password: `testing`)
- **Monad Explorer**: https://explorer.testnet.monad.xyz

---

## 📝 Contract Addresses (Monad Testnet)

```
BehavioralNFT:    0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc
DelegationRouter: 0x56C145f5567f8DB77533c825cf4205F1427c5517
PatternDetector:  0x8768e4E5c8c3325292A201f824FAb86ADae398d0
```

---

## 🐛 Quick Troubleshooting

### Envio Not Starting
```bash
docker-compose down
docker-compose up -d
pnpm dev
```

### Frontend Port Conflict
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### MetaMask Network Issues
- Manually add Monad testnet:
  - Network: `Monad Testnet`
  - RPC: `https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0`
  - Chain ID: `10143`
  - Symbol: `MON`

---

## 🎬 Demo Flow (4 minutes)

1. **Show Landing** → Envio metrics (47ms)
2. **Connect Wallet** → MetaMask
3. **Create Smart Account** → ERC-4337
4. **Browse Patterns** → Performance cards
5. **Create Delegation** → Simple (30s) + Advanced (45s)
6. **Manage** → Update & revoke
7. **Closing** → "Only possible with Envio"

---

## 📚 Full Documentation

- [PROJECT_STATUS.md](PROJECT_STATUS.md) - Complete project overview
- [FRONTEND_COMPLETE.md](FRONTEND_COMPLETE.md) - Frontend details
- [src/frontend/DEPLOYMENT_GUIDE.md](src/frontend/DEPLOYMENT_GUIDE.md) - Detailed setup
- [src/frontend/README.md](src/frontend/README.md) - API documentation

---

**Status**: ✅ Ready for Demo

**Last Updated**: January 11, 2025
