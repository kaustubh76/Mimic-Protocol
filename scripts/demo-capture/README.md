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

---

## Live-indexer assertion harness — `pnpm assert`

`assertions.mjs` is a complementary script: where `capture.mjs` *describes* the data the indexer produced, `assert` *checks* that the data satisfies cross-entity invariants the schema implies.

```bash
pnpm assert
```

Catches a different class of bug from the unit tests:
- Unit tests use `MockDb` with ~5-10 events; pass/fail on synthetic data.
- The harness queries real Polygon Aave V3 history (1000+ liquidations, 5000+ user-reserves, 16 reserves) and fails if any of them violate invariants.

### The 9 invariants (anchored to the liquidation lifecycle)

| # | Invariant | Catches if it fails |
|---|---|---|
| L1 | every `Liquidation.collateralAsset` has a corresponding `Reserve` | Missed lazy-create on collateral side |
| L2 | every `Liquidation.debtAsset` has a corresponding `Reserve` | Missed lazy-create on debt side |
| L3 | every `Liquidation.user` has `UserAggregator.liquidationsAsBorrower >= 1` | Missing victim-counter increment |
| L4 | every `Liquidation.liquidator` has `UserAggregator.liquidationsAsLiquidator >= 1` | Missing liquidator-counter increment |
| L5 | `ReserveAggregator.totalLiquidations >= count of liquidations touching this reserve` | Single-side increment bug |
| L6 | `Reserve` with `totalSupplied > 0` has `uniqueSuppliers >= 1` | Counter sanity |
| L7 | `Reserve` with `totalBorrowed > 0` has `uniqueBorrowers >= 1` | Counter sanity |
| L8 | every `UserReserve` has `netSupplyPosition == cumulativeSupplied - cumulativeWithdrawn` | Withdraw-handler arithmetic drift |
| L9 | every `UserReserve` has `netDebtPosition == cumulativeBorrowed - cumulativeRepaid` | Repay-handler arithmetic drift |

### Sample output

```
=========================================================================
Invariant report
=========================================================================
✓ PASS  L1: every Liquidation.collateralAsset has a Reserve
        checked 1089, passed 1089, failed 0
✓ PASS  L2: every Liquidation.debtAsset has a Reserve
        checked 1089, passed 1089, failed 0
[...]
✓ PASS  L9: UserReserve.netDebtPosition == cumulativeBorrowed - cumulativeRepaid
        checked 5000, passed 5000, failed 0
=========================================================================
Summary: 14401/14401 checks passed across 9 invariants
PASS — all invariants hold on live data.
```

Exit codes: `0` on all-pass, `1` on any-fail (with sample failures printed inline), `2` on infrastructure error (e.g. indexer not running).

### Why this isn't in CI

The harness needs a running `pnpm dev` against Polygon — not feasible in GitHub Actions without standing up the indexer infrastructure inside CI. It's a **manual reproduction step**: run `pnpm dev`, wait for partial sync, run `pnpm assert`. Documented as such, not an automated gate.

### Limitations

- **Sample-based for `UserReserve`** (default `limit + offset` paginated to 5000 rows). Aave V3 has hundreds of thousands of user-reserves once fully indexed; sampling is honest enough for a per-commit check but not exhaustive.
- **Money-market template only** in v1. The same pattern would apply to the DEX + perp templates; flagged as a follow-up.

---

## Saved harness output transcripts

The literal stdout from the recorded `pnpm assert*` runs is checked in alongside the JSON GraphQL captures, so a reviewer can see the `Summary: N/N checks passed` lines without re-running:

| Template | Transcript | Recorded total |
|---|---|---|
| Money market (Polygon Aave V3) | [`docs/screenshots/queries/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries/HARNESS_OUTPUT.txt) | 14,401 / 14,401 ✓ |
| DEX (Optimism Velodrome V2) | [`docs/screenshots/queries-defi/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries-defi/HARNESS_OUTPUT.txt) | 31,091 / 31,091 ✓ |
| Perp (Arbitrum GMX v2) | [`docs/screenshots/queries-perp/HARNESS_OUTPUT.txt`](../../docs/screenshots/queries-perp/HARNESS_OUTPUT.txt) | 2,522 / 2,522 ✓ |

These are the recorded numbers from a 2026-04-30 run. Re-running `pnpm assert{,:defi,:perp}` against fresh chain state will give slightly different totals (the indexer sees more events as the chain advances).
