# RUN — perp template (GMX v2, Arbitrum) — v1 scope

> Reproduce-the-proof guide. For the architecture and walkthrough, see [README.md](./README.md).

**v1 scope:** PositionIncrease only. PositionDecrease, Liquidation, Funding land in v2 (mechanical follow-up — README.md table).

## Prereqs

- Node 22, pnpm 10
- Docker daemon running (Envio uses it for Postgres + Hasura)
- An Arbitrum RPC URL — free public option works:
  `https://arbitrum-one.publicnode.com`

## 5-line reproduction

```bash
# 1) install
pnpm install && pnpm codegen

# 2) unit tests (offline, ~5s)
pnpm test                              # → 2 passing + 3 skipped (v2 follow-up)

# 3) live indexer — leave running 10–30 min for positions to accumulate
cp .env.example .env
sed -i '' 's|YOUR_ARBITRUM_RPC|https://arbitrum-one.publicnode.com|' .env
pnpm dev                               # GraphQL playground at http://localhost:8080

# 4) run the live-data invariant harness (in another terminal)
cd ../../scripts/demo-capture
pnpm install
pnpm assert:perp                       # → "Summary: N/N checks passed"
```

## Expected output (sample from a 2026-04-30 run)

```
PerpMarkets:      9
PerpAggregators:  9
Positions:        1252 (sampled)

✓ PASS  P1..P4
Summary: 2522/2522 checks passed across 4 invariants
PASS — all invariants hold on live data.
```

Full transcript checked in at
[`docs/screenshots/queries-perp/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries-perp/HARNESS_OUTPUT.txt).

## Anchored protocol

- EventEmitter: [`0xC8ee91A54287DB53897056e12D9819156D3822Fb`](https://arbiscan.io/address/0xC8ee91A54287DB53897056e12D9819156D3822Fb) (GMX v2, Arbitrum)
- Deploy block: 107,737,756
- Real GraphQL captures: [`docs/screenshots/queries-perp/`](../../docs/screenshots/queries-perp/)
- Routing: handler subscribes to `EventLog1` and switches on `event.params.eventName`. v1 routes only `"PositionIncrease"`; other event names (PositionDecrease, OrderExecuted, LiquidationOccurred, FundingFeeAmountPerSizeUpdated) are observed and skipped.
