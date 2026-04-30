# scripts/demo-capture

Playwright + GraphQL capture script for the money-market template's live Polygon Aave V3 demo run.

Lives separately from `pow/envio-money-market-template-v1/` so the template's `pnpm install` stays lean — playwright is ~150MB. Forking the template doesn't pull in this tooling.

## Run

Prerequisites: a `pnpm dev` instance of the money-market template running with a Polygon-only config (Hasura at `http://localhost:8080`).

```bash
pnpm install
pnpm capture
```

Output is written to `../../docs/screenshots/` in the parent repo.

## What it captures

Six GraphQL queries against the live indexer, hitting all three entity layers:

1. Top reserves by total supplied
2. 10 most recent liquidations
3. Most-liquidated users
4. Top liquidators
5. 10 most recent rate snapshots
6. Aggregate counts across all entity types

Each query produces:
- A JSON response file (`docs/screenshots/queries/*.json`) — real, diff-able, reproducible
- (Where playwright can render it) A PNG screenshot

The aggregate-counts query also gets rendered as a styled HTML page and screenshotted as a quick visual summary of indexer state.
