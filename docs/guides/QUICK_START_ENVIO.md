# ⚡ Quick Start - Enhanced Envio Indexer

**3 Simple Commands to Start:**

```bash
# Option 1: Use the automated script (EASIEST)
cd "/Users/apple/Desktop/Mimic Protocol"
./start-envio.sh

# Option 2: Manual startup
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
pnpm install && pnpm envio codegen && pnpm dev

# Option 3: Step by step (if you want to see each step)
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
pnpm install
pnpm envio codegen
pnpm dev
```

## ✅ What to Expect

1. **After running the command:**
   - Docker containers will start (PostgreSQL + Hasura)
   - Indexer will connect to Monad testnet
   - Historical events will be indexed (2 patterns, 1 delegation)

2. **Terminal will show:**
   ```
   🚀 Starting Envio indexer...
   ✓ PostgreSQL started
   ✓ Hasura GraphQL engine started
   ✓ Indexing from block 42990000
   ⚡ Processing events...
   
   Hasura console: http://localhost:8080
   Password: testing
   ```

3. **Open Hasura Console:**
   ```bash
   open http://localhost:8080
   # Password: testing
   ```

4. **Run a test query in Hasura:**
   ```graphql
   query TestIndexer {
     Pattern {
       id
       patternType
       creator
       delegationCount
       winRate
     }
     
     Delegation {
       id
       delegator
       patternTokenId
       percentageAllocation
       isActive
     }
   }
   ```

## 🎯 What You Should See

**Patterns Table:**
- Pattern #1: Momentum (delegationCount: 1)
- Pattern #2: MeanReversion (delegationCount: 0)

**Delegations Table:**
- Delegation #1: 50% allocation to Pattern #1

## 📊 What's New

Your enhanced indexer now tracks:
- ✅ **7 event types** (was 3)
- ✅ **2 contracts** (BehavioralNFT + DelegationRouter)
- ✅ **Real-time delegations**
- ✅ **Execution performance**
- ✅ **Pattern popularity**
- ✅ **Delegator statistics**

## 🛠️ Troubleshooting

**Docker not running?**
```bash
open -a Docker
# Wait 30 seconds, then retry
```

**Port already in use?**
```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
docker-compose down
./start-envio.sh
```

**Need help?**
See full documentation: [ENVIO_SETUP_COMMANDS.md](ENVIO_SETUP_COMMANDS.md)

## 🎉 That's It!

Your enhanced Envio indexer with full DelegationRouter support is now running!

Access your data at: **http://localhost:8080** (password: testing)
