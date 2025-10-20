# 🚀 Envio Indexer Setup & Run Commands

**Status:** Ready to run enhanced indexer with DelegationRouter support

---

## 📋 Prerequisites Check

First, verify you have everything needed:

```bash
# Check if you're in the project directory
pwd
# Should show: /Users/apple/Desktop/Mimic Protocol

# Check Node.js version (need 18+)
node --version

# Check pnpm is installed
pnpm --version

# Check Docker is running (required for Envio)
docker ps
```

---

## 🎯 Step-by-Step Setup

### **Step 1: Navigate to Envio Directory**

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
```

### **Step 2: Install Dependencies** (if needed)

```bash
# Install Envio dependencies
pnpm install
```

### **Step 3: Run Envio Codegen**

This generates TypeScript types from your config.yaml:

```bash
# Generate types and setup
pnpm envio codegen

# Alternative if pnpm envio doesn't work:
npx envio codegen
```

**Expected Output:**
```
✓ Configuration validated
✓ Generating TypeScript types
✓ Creating database schema
✓ Handler templates ready
✓ Codegen complete!
```

### **Step 4: Start the Indexer**

```bash
# Start Envio in development mode
pnpm dev

# Alternative:
npx envio dev
```

**Expected Output:**
```
🚀 Starting Envio indexer...
✓ PostgreSQL started
✓ Hasura GraphQL engine started
✓ Connecting to Monad testnet...
✓ Starting from block 42990000
⚡ Indexing events...

📊 Hasura Console: http://localhost:8080
🔐 Password: testing
```

---

## 🔍 Verify It's Working

### **Option 1: Check Terminal Output**

Look for log messages like:
```
[BehavioralNFT] 🎨 Processing PatternMinted event
[DelegationRouter] 🤝 Processing DelegationCreated event
✅ Pattern #1 minted - momentum pattern
✅ Delegation #1 created
```

### **Option 2: Open Hasura Console**

```bash
# Open in browser (macOS)
open http://localhost:8080

# Password: testing
```

Then run a test query:
```graphql
query TestQuery {
  Pattern {
    id
    patternType
    creator
    delegationCount
  }
  
  Delegation {
    id
    delegator
    pattern {
      patternType
    }
    isActive
  }
}
```

### **Option 3: Check Docker Containers**

```bash
# See running Envio containers
docker ps | grep envio

# Should show:
# - PostgreSQL database
# - Hasura GraphQL engine
# - Envio indexer
```

---

## 🛠️ Troubleshooting

### **Issue: "pnpm: command not found"**

Install pnpm:
```bash
npm install -g pnpm
```

### **Issue: "Docker not running"**

Start Docker Desktop:
```bash
# macOS
open -a Docker

# Wait for Docker to fully start, then retry
```

### **Issue: "Port already in use"**

Stop existing Envio instance:
```bash
# Stop all Envio containers
docker ps | grep envio | awk '{print $1}' | xargs docker stop

# Or stop all containers
cd src/envio
docker-compose down
```

### **Issue: "Module not found: logger/metrics/decoder"**

The utilities might need to be in generated code. Try:
```bash
# Re-run codegen
pnpm envio codegen

# If that doesn't work, check if handlers compile
cd generated
pnpm install
```

### **Issue: "Cannot connect to Monad RPC"**

Check RPC is accessible:
```bash
# Test Monad RPC
curl -X POST https://testnet-rpc.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return current block number
```

### **Issue: "Compilation errors in handlers"**

The auto-generated types might differ. You may need to adjust:
```bash
# Check generated types
ls -la generated/src/

# Look at generated Context interface
cat generated/src/Types.gen.ts | grep "interface Context" -A 20
```

---

## 📊 Monitoring Performance

### **Check Handler Performance**

Look for timing logs in output:
```
✅ Pattern #1 minted - handler took 7ms ✓ (<10ms target)
✅ Delegation #1 created - handler took 8ms ✓ (<10ms target)
⚠️  Trade execution - handler took 12ms (exceeded 10ms target)
```

### **Query System Metrics**

In Hasura console:
```graphql
query SystemMetrics {
  SystemMetrics(where: {id: {_eq: "1"}}) {
    totalPatterns
    activePatterns
    totalDelegations
    activeDelegations
    totalExecutions
    successfulExecutions
    failedExecutions
    eventsProcessed
  }
}
```

---

## 🎬 Full Startup Sequence

Here's the complete sequence to start fresh:

```bash
# 1. Navigate to project
cd "/Users/apple/Desktop/Mimic Protocol"

# 2. Navigate to Envio directory
cd src/envio

# 3. Install dependencies (first time only)
pnpm install

# 4. Generate types (required after config changes)
pnpm envio codegen

# 5. Start the indexer
pnpm dev
```

**Wait for:**
```
✓ All services started
✓ Indexing from block 42990000
⚡ Processing events...

Hasura console: http://localhost:8080
```

**Then in another terminal, verify contracts are deployed:**
```bash
# Check BehavioralNFT
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
  "name()(string)" \
  --rpc-url https://testnet.monad.xyz/rpc

# Check DelegationRouter  
cast call 0x56C145f5567f8DB77533c825cf4205F1427c5517 \
  "behavioralNFT()(address)" \
  --rpc-url https://testnet.monad.xyz/rpc
```

---

## 🎯 Testing Event Indexing

### **Method 1: Use Existing On-Chain Data**

Your contracts already have data:
- 2 patterns minted
- 1 active delegation

The indexer will automatically process these historical events when it starts.

### **Method 2: Trigger New Events**

Create a new delegation to test live indexing:

```bash
# Navigate to project root
cd "/Users/apple/Desktop/Mimic Protocol"

# Run delegation creation script
forge script script/CreateTestDelegation.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --broadcast

# Watch Envio terminal for:
# [DelegationRouter] 🤝 Processing DelegationCreated event
```

### **Method 3: Update a Pattern**

```bash
# Update pattern performance
forge script script/UpdatePatternPerformance.s.sol \
  --rpc-url $MONAD_RPC_URL \
  --broadcast

# Watch for:
# [BehavioralNFT] 📊 Processing PatternPerformanceUpdated event
```

---

## 📈 Expected Results

After indexer runs for ~1 minute, you should see:

### **In Terminal:**
```
📊 Statistics:
- Blocks processed: 1,000+
- Events indexed: 10+
- Patterns tracked: 2
- Delegations tracked: 1+
- Executions tracked: 0+
- Handler avg time: 6ms
```

### **In Hasura (http://localhost:8080):**

**Patterns Table:**
```
id  | patternType     | creator | delegationCount
----|-----------------|---------|----------------
1   | Momentum        | 0x...   | 1
2   | MeanReversion   | 0x...   | 0
```

**Delegations Table:**
```
id | delegator | patternTokenId | percentageAllocation | isActive
---|-----------|----------------|---------------------|----------
1  | 0x...     | 1              | 5000                | true
```

---

## 🎉 Success Indicators

You know it's working when:

✅ **Terminal shows:**
- "Indexing from block 42990000"
- "Processing PatternMinted event"
- "Processing DelegationCreated event"
- "Pattern #1 minted"
- "Delegation #1 created"

✅ **Hasura console accessible:**
- http://localhost:8080 loads
- GraphQL queries return data
- Tables visible: Pattern, Delegation, Delegator, etc.

✅ **No errors in logs:**
- No "handler failed" messages
- No "database error" messages
- All handlers completing <10ms

---

## 🔄 Stopping and Restarting

### **Stop the Indexer:**

```bash
# In terminal running pnpm dev:
Ctrl + C

# Or force stop all containers:
cd src/envio
docker-compose down
```

### **Restart from Scratch:**

```bash
# Stop everything
docker-compose down -v  # -v removes volumes (database)

# Restart
pnpm envio codegen
pnpm dev
```

### **Restart but Keep Data:**

```bash
# Stop
Ctrl + C

# Restart
pnpm dev
# Will continue from last indexed block
```

---

## 📞 Quick Commands Reference

```bash
# Start indexer
cd "/Users/apple/Desktop/Mimic Protocol/src/envio" && pnpm dev

# Open Hasura
open http://localhost:8080

# Check logs
docker logs -f $(docker ps | grep envio | awk '{print $1}')

# Stop indexer
Ctrl + C

# Reset database
docker-compose down -v && pnpm dev
```

---

## 🎯 Next Steps After Starting

1. **Verify indexing** - Check Hasura for data
2. **Test queries** - Run GraphQL queries
3. **Monitor performance** - Watch handler timing logs
4. **Update frontend** - Connect frontend to GraphQL API
5. **Record demo** - Show real-time indexing in action

---

**Ready to start?** Run these commands:

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
pnpm install
pnpm envio codegen
pnpm dev
```

Then open http://localhost:8080 (password: testing) to see your data! 🚀
