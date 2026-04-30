# Live indexing screenshots — Aave V3 on Polygon

Captured by `scripts/demo-capture/capture.mjs` against a live `pnpm dev` run of
`pow/envio-money-market-template-v1/` configured for Polygon-only.

Captured at: 2026-04-30T08:37:45.471Z

## What's here

- `png/00-indexer-state-summary.png` — aggregate counts across all entities. Quick visual
  proof that the indexer is alive and writing to all three layers.
- `png/*-playground-home.png` — Hasura GraphQL playground.
- `queries/*.json` — raw GraphQL responses (real, reproducible). The most reliable
  evidence; PNGs are convenient but JSON is what holds up under scrutiny.

## Capture results

| # | Slug | Title | Status |
|---|---|---|---|
| 01 | `01-top-reserves-by-supply` | Top 10 reserves by total supplied | ✅ |
| 02 | `02-recent-liquidations` | 10 most recent liquidations | ✅ |
| 03 | `03-most-liquidated-users` | Top 10 most-liquidated users (liquidations as borrower) | ✅ |
| 04 | `04-top-liquidators` | Top 10 liquidators (liquidations as liquidator) | ✅ |
| 05 | `05-rate-snapshots-per-reserve` | 10 most recent rate snapshots (across reserves) | ✅ |
| 06 | `06-sample-counts` | Sample counts across all entities (limit 1000 per type) | ✅ |

## Reproducing this

1. `cd pow/envio-money-market-template-v1`
2. Edit `config.yaml` to keep only the Polygon network entry (delete Arbitrum + Base)
3. `pnpm install && pnpm codegen && pnpm dev`
4. Wait ~5–15 min for HyperSync to ingest enough Aave V3 history to populate entities.
5. In another shell: `cd scripts/demo-capture && pnpm install && pnpm capture`

The capture script polls the GraphQL endpoint until at least one Reserve entity exists,
then captures both JSON responses and PNG screenshots into this directory.