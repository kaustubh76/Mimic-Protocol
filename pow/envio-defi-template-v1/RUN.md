# RUN — DEX template (Velodrome V2, Optimism)

> Reproduce-the-proof guide. For the architecture and walkthrough, see [README.md](./README.md).

## Prereqs

- Node 22, pnpm 10
- Docker daemon running (Envio uses it for Postgres + Hasura)
- An Optimism RPC URL — free public option works:
  `https://optimism.publicnode.com`

## 5-line reproduction

```bash
# 1) install
pnpm install && pnpm codegen

# 2) unit tests (offline, ~10s)
pnpm test                              # → 10/10 passing (7 PoolAggregator + 3 EffectCache)

# 3) live indexer — leave running 10–30 min for snapshot diversity
cp .env.example .env
sed -i '' 's|YOUR_OPTIMISM_RPC|https://optimism.publicnode.com|' .env
pnpm dev                               # GraphQL playground at http://localhost:8080

# 4) run the live-data invariant harness (in another terminal)
cd ../../scripts/demo-capture
pnpm install
pnpm assert:defi                       # → "Summary: N/N checks passed"
```

## Expected output (sample from a 2026-04-30 run)

```
Tokens:           115
Pools:            265
PoolAggregators:  265
PoolHourSnapshot: 10000 (sampled)

✓ PASS  D1..D8
Summary: 31091/31091 checks passed across 8 invariants
PASS — all invariants hold on live data.
```

Full transcript checked in at
[`docs/screenshots/queries-defi/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries-defi/HARNESS_OUTPUT.txt).

## Anchored protocol

- PoolFactory: [`0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a`](https://optimistic.etherscan.io/address/0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a) (Velodrome V2)
- Deploy block: 105,896,852
- Real GraphQL captures: [`docs/screenshots/queries-defi/`](../../docs/screenshots/queries-defi/)
