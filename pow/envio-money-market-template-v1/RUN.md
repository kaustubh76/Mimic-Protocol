# RUN — money-market template (Aave V3, Polygon)

> Reproduce-the-proof guide. For the architecture and walkthrough, see [README.md](./README.md).

## Prereqs

- Node 22, pnpm 10
- Docker daemon running (Envio uses it for Postgres + Hasura)
- A Polygon RPC URL — free public option works:
  `https://polygon-bor-rpc.publicnode.com`

## 5-line reproduction

```bash
# 1) install
pnpm install && pnpm codegen

# 2) unit tests (offline, ~5s)
pnpm test                              # → 5/5 passing

# 3) live indexer — leave running 10–30 min for liquidations to accumulate
cp .env.example .env
sed -i '' 's|YOUR_POLYGON_RPC|https://polygon-bor-rpc.publicnode.com|' .env
pnpm dev                               # GraphQL playground at http://localhost:8080

# 4) run the live-data invariant harness (in another terminal)
cd ../../scripts/demo-capture
pnpm install
pnpm assert                            # → "Summary: N/N checks passed"
```

## Expected output (sample from a 2026-04-30 run)

```
Reserves:           16
ReserveAggregators: 16
Liquidations:       1089
UserReserves:       5000 (sampled)
UserAggregators:    9990

✓ PASS  L1..L9
Summary: 14401/14401 checks passed across 9 invariants
PASS — all invariants hold on live data.
```

Full transcript checked in at
[`docs/screenshots/queries/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries/HARNESS_OUTPUT.txt).

## Anchored protocol

- Pool contract: [`0x794a61358D6845594F94dc1DB02A252b5b4814aD`](https://polygonscan.com/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD) (Aave V3 Pool, Polygon)
- Deploy block: 25,826,028
- Real GraphQL captures: [`docs/screenshots/queries/`](../../docs/screenshots/queries/)
