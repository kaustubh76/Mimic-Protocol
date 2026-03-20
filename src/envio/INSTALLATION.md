# Envio HyperCore Installation Guide

## ⚠️ Important: Envio Setup Method

Envio is **NOT installed via npm**. It uses its own CLI tool installed via `pnpm`.

---

## 📋 Prerequisites

Before installing Envio, ensure you have:

1. **Node.js v22** (recommended) or v18+
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **pnpm v8+** (required for Envio)
   ```bash
   # Install pnpm if not already installed
   npm install -g pnpm

   # Verify installation
   pnpm --version  # Should be v8.0.0 or higher
   ```

3. **Docker Desktop** (required for local development)
   - Download from: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop before running `pnpm dev`

4. **Git** (for dependency management)
   ```bash
   git --version
   ```

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

Since Envio is not an npm package, we only need to install our project dependencies:

```bash
cd /Users/apple/Desktop/Mimic\ Protocol/src/envio

# Install project dependencies (not Envio itself)
pnpm install
```

**What this installs:**
- `ethers` - For ABI encoding/decoding
- `pino` - Structured logging
- TypeScript and dev tools

---

### Step 2: Initialize Envio Project

Envio needs to be initialized in the directory. We have two options:

#### Option A: Use Existing Configuration (Recommended)

Since we already have `config.yaml` and `schema.graphql`, we can generate the necessary files:

```bash
# Generate TypeScript types from our schema
pnpx envio codegen
```

This will:
- Generate TypeScript types in `generated/` directory
- Create event handler interfaces
- Set up the Envio project structure

#### Option B: Fresh Envio Init (If Option A Fails)

If you encounter issues, you can initialize a fresh Envio project and then restore our files:

```bash
# Backup our files
mkdir -p ../envio-backup
cp config.yaml schema.graphql ../envio-backup/
cp -r handlers ../envio-backup/
cp -r utils ../envio-backup/

# Initialize fresh Envio project
pnpx envio init

# Choose "Template" > "Greeter" (or any template)
# This creates the basic structure

# Restore our files
cp ../envio-backup/config.yaml ./
cp ../envio-backup/schema.graphql ./
cp -r ../envio-backup/handlers ./src/
cp -r ../envio-backup/utils ./src/

# Generate types
pnpx envio codegen
```

---

### Step 3: Verify Installation

Check that Envio is properly set up:

```bash
# This should show Envio CLI help
pnpx envio --help

# Check for generated files
ls -la generated/
```

Expected output:
```
generated/
├── schema.ts         # Entity types
├── src/
│   └── Types.gen.ts  # Event handler types
```

---

## 🔧 Configuration

### Update Environment Variables

Ensure your `.env` file in the project root has:

```bash
# Monad Testnet RPC
MONAD_RPC_URL=https://testnet.monad.xyz/rpc

# BehavioralNFT contract address (update when deployed)
BEHAVIORAL_NFT_ADDRESS=0x...

# Optional: Envio API key (if using hosted service)
ENVIO_API_KEY=
```

### Update config.yaml

Update the contract address in `config.yaml` once BehavioralNFT is deployed:

```yaml
contracts:
  - name: BehavioralNFT
    address:
      - env(BEHAVIORAL_NFT_ADDRESS)  # Will read from .env
```

---

## 🏃 Running Envio

### Local Development Mode

Start Envio indexer with local PostgreSQL database:

```bash
pnpm dev
```

**What this does:**
1. Starts Docker containers (PostgreSQL)
2. Starts Envio indexer
3. Begins indexing events from Monad testnet
4. Exposes GraphQL API at http://localhost:8080
5. Exposes GraphQL Playground at http://localhost:8080/graphql

**Requirements:**
- Docker Desktop must be running
- Monad RPC must be accessible
- Contract must be deployed

### Production Mode

```bash
pnpm start
```

This runs the indexer without Docker (for production deployment).

---

## 🧪 Testing the Setup

### 1. Check GraphQL API

Open http://localhost:8080/graphql in your browser.

Try this query:

```graphql
query TestQuery {
  systemMetrics(id: "1") {
    totalPatterns
    activePatterns
    currentEventsPerSecond
  }
}
```

### 2. Check Prometheus Metrics

Open http://localhost:9090/metrics

You should see metrics like:
```
events_processed_total
events_per_second
envio_query_latency_avg
```

### 3. Check Dashboard

```bash
# In a new terminal
cd ../dashboard
python -m http.server 3000
```

Open http://localhost:3000

---

## 🐛 Troubleshooting

### Issue: `pnpx envio` command not found

**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version

# Try again
pnpx envio --help
```

### Issue: `Cannot find module 'generated/schema'`

**Solution:**
```bash
# Generate TypeScript types
pnpx envio codegen

# Check that files were created
ls -la generated/
```

### Issue: Docker not running

**Error:**
```
Error: Cannot connect to the Docker daemon
```

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (green icon)
3. Try `pnpm dev` again

### Issue: `Port 8080 already in use`

**Solution:**
```bash
# Find process using port 8080
lsof -ti:8080

# Kill the process
kill -9 <PID>

# Or change port in config.yaml
graphql:
  endpoint:
    port: 8081  # Use different port
```

### Issue: Monad RPC not accessible (HTTP 405)

**Status:** Currently the Monad testnet RPC is experiencing issues.

**Workaround:**
```bash
# Use local Anvil fork for testing
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Update config.yaml to point to local Anvil
networks:
  - id: 31337
    rpc_config:
      url: http://localhost:8545
```

### Issue: Events not indexing

**Check:**
1. Contract address is correct in `config.yaml`
2. Start block is before deployment block
3. RPC is accessible: `curl $MONAD_RPC_URL`
4. Event signatures match contract exactly

**Solution:**
```bash
# Check Envio logs
pnpm dev 2>&1 | tee envio.log

# Look for errors like:
# - "Contract not found at address"
# - "Failed to fetch logs"
# - "RPC connection error"
```

---

## 📊 Performance Validation

Once running, validate performance targets:

### Check Handler Execution Time

```bash
# Watch Envio logs for handler timing
pnpm dev | grep "handler.*ms"
```

Expected:
```
✅ PatternMinted handler - 8ms (Target: <10ms)
✅ PerformanceUpdated handler - 6ms (Target: <10ms)
```

### Check Query Latency

In GraphQL Playground, run queries and check response time at bottom-right.

Expected: <50ms for all queries

### Check Events/Second

In dashboard (http://localhost:3000), watch the "Events/Second" metric.

Expected: >1000 events/sec during high activity

---

## 🎯 Next Steps After Installation

1. ✅ Envio installed and running
2. ✅ GraphQL API accessible at http://localhost:8080
3. ✅ Dashboard showing metrics at http://localhost:3000

**Now you can:**

- Deploy BehavioralNFT contract (when Monad RPC is available)
- Update contract address in config.yaml
- Test with real events
- Validate <50ms performance targets
- Record demo for hackathon submission

---

## 📚 Additional Resources

- **Envio Docs**: https://docs.envio.dev
- **HyperSync API**: https://docs.envio.dev/docs/hypersync
- **Discord Support**: https://discord.gg/envio
- **GitHub**: https://github.com/enviodev

---

## ✅ Installation Checklist

- [ ] Node.js v18+ installed
- [ ] pnpm installed globally
- [ ] Docker Desktop installed and running
- [ ] Project dependencies installed: `pnpm install`
- [ ] Envio types generated: `pnpx envio codegen`
- [ ] Environment variables configured in `.env`
- [ ] Contract address updated in `config.yaml`
- [ ] Envio running: `pnpm dev`
- [ ] GraphQL API accessible: http://localhost:8080/graphql
- [ ] Dashboard accessible: http://localhost:3000
- [ ] Performance metrics showing in dashboard

---

**Quick Start Commands:**

```bash
# 1. Install pnpm (if not installed)
npm install -g pnpm

# 2. Install dependencies
cd src/envio
pnpm install

# 3. Generate types
pnpx envio codegen

# 4. Start Envio (requires Docker)
pnpm dev

# 5. Open dashboard (new terminal)
cd ../dashboard
python -m http.server 3000
```

**Then open:**
- GraphQL Playground: http://localhost:8080/graphql
- Dashboard: http://localhost:3000
- Metrics: http://localhost:9090/metrics

---

*For issues, check the troubleshooting section above or refer to [Envio documentation](https://docs.envio.dev)*
