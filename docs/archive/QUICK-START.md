# 🚀 Mirror Protocol - Quick Start Guide

## ⚡ Start Everything (2 Commands)

### Terminal 1: Start Envio Indexer

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/envio"
pnpm dev
```

### Terminal 2: Start Dashboard

```bash
cd "/Users/apple/Desktop/Mimic Protocol/src/dashboard"
python3 -m http.server 3000
```

### Open in Browser

```bash
# Dashboard
open http://localhost:3000

# GraphQL Playground (when Envio running)
open http://localhost:8080/graphql
```

---

## ✅ Correct Commands Summary

| What | Command |
|------|---------|
| **Go to dashboard** | `cd "/Users/apple/Desktop/Mimic Protocol/src/dashboard"` |
| **Start server** | `python3 -m http.server 3000` |
| **Open dashboard** | `open http://localhost:3000` |

**Note**: Use `python3` not `python` on macOS!

---

## 🔧 Troubleshooting

**Port in use?**
```bash
kill -9 $(lsof -ti:3000)
```

**Docker not running?**
```bash
open -a Docker
```

---

**Status**: ✅ Ready to run (awaiting Monad RPC for real data)
**Mock Mode**: Dashboard works with simulated metrics
