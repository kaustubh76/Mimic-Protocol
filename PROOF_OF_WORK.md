# Proof of Work — Envio Growth Engineer Package

> One-page scoreboard. Built for someone landing cold who wants to know: what was made, what was proven, where to verify.

---

## 🟢 Live on Envio hosted service

The money-market template (Aave V3, Polygon + Arbitrum + Base) is **deployed and queryable right now** on Envio's hosted indexing service:

**GraphQL endpoint:** [`https://indexer.dev.hyperindex.xyz/8fc0607/v1/graphql`](https://indexer.dev.hyperindex.xyz/8fc0607/v1/graphql)

```bash
curl -sX POST https://indexer.dev.hyperindex.xyz/8fc0607/v1/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ ReserveAggregator(order_by:{totalSupplied:desc}, limit:5){ asset totalSupplied uniqueBorrowers totalLiquidations } }"}'
```

Deployed from branch [`envio-deploy-money-market`](https://github.com/kaustubh76/Growth_Engineer_at_ENVIO/tree/envio-deploy-money-market) — pushes to that branch trigger redeploys. See [`DEPLOY.md`](https://github.com/kaustubh76/Growth_Engineer_at_ENVIO/blob/envio-deploy-money-market/DEPLOY.md) on that branch for sample queries.

---

## 📊 The consumer surface — risk dashboard

A polished Next.js dashboard that **consumes the live indexer above** and renders it as a real risk-monitoring product. Six pages, statically pre-rendered, multi-chain. Forkable as a GitHub Template — point at any Aave-shape Envio indexer.

🟢 **Live demo:** [envio-risk-dashboard.vercel.app](https://envio-risk-dashboard.vercel.app)
🍴 **Use this template:** [github.com/kaustubh76/envio-risk-dashboard](https://github.com/kaustubh76/envio-risk-dashboard)

| Page | What it proves |
|---|---|
| `/` | KPI tiles · all-time + 24h liquidations + top reserve, multi-chain |
| `/reserves` | ~200 reserves sortable; supply/borrow APR; supplier/borrower counts |
| `/reserves/[id]` | 168-point rate-history sparkline + recent liquidations strip |
| `/liquidations` | Paginated feed of real liquidation events with explorer links |
| `/leaderboards/liquidators` | Top liquidators in a single GraphQL hop via `UserAggregator` |
| `/leaderboards/at-risk` | Heuristic risk-score using prior liquidations + active debt |

The dashboard is the **growth motion**: fork → change one env var → ship a risk dashboard for *your* protocol tonight. The same pattern scales to any Aave-fork (Spark, Radiant, Seamless, ZeroLend, Sonne, ...). Per [`ENVIO_REVENUE_MATH_V2.md`](./ENVIO_REVENUE_MATH_V2.md), one converted protocol pays for the entire build cost in week one.

---

## What was built

Three forkable Envio HyperIndex templates, each anchored to a different real DeFi vertical and a real production protocol — not synthesised toys.

| Template | Vertical | Anchored protocol | Chain |
|---|---|---|---|
| [`pow/envio-defi-template-v1/`](./pow/envio-defi-template-v1/) | DEX (AMM swaps + liquidity) | Velodrome V2 PoolFactory | Optimism |
| [`pow/envio-money-market-template-v1/`](./pow/envio-money-market-template-v1/) | Money market (lending + liquidations) | Aave V3 Pool | Polygon |
| [`pow/envio-perp-template-v1/`](./pow/envio-perp-template-v1/) | Perpetuals (positions + funding) | GMX v2 EventEmitter | Arbitrum |

Plus 23 strategy memos at the repo root (`ENVIO_*.md`) — vertical playbook, pain-map matrix, money-market diagnostics, revenue math, video script, etc.

---

## What was proven

| Layer | Count | Where |
|---|---|---|
| **Vitest unit tests passing** | 19 / 19 | `pow/*/test/*.test.ts` (10 DEX + 5 money-market + 4 perp/v1) |
| **Cross-entity invariants written** | 21 | `scripts/demo-capture/assertions{,-defi,-perp}.mjs` |
| **Live-data checks passing** | **48,014 / 48,014** | All 21 invariants, against real on-chain state on 3 chains |
| **JSON GraphQL captures** | 18 | `docs/screenshots/queries{,-defi,-perp}/*.json` |
| **Harness output transcripts** | 3 | `docs/screenshots/queries*/HARNESS_OUTPUT.txt` |

### Per-template scoreboard

| Template | Vitest | Invariants | Live checks | Sample size |
|---|---|---|---|---|
| DEX (Velodrome V2 / Optimism) | 10 ✓ | 8 (D1–D8) | **31,091 / 31,091** ✓ | 265 pools, 10k snapshots |
| Money market (Aave V3 / Polygon) | 5 ✓ | 9 (L1–L9) | **14,401 / 14,401** ✓ | 16 reserves, 1,089 liquidations, 5k user-reserves |
| Perp (GMX v2 / Arbitrum) | 2 ✓ + 3 skip→v2 | 4 (P1–P4) | **2,522 / 2,522** ✓ | 9 markets, 1,252 positions |

The harnesses catch a different class of bug from the unit tests: unit tests use `MockDb` with ~5–10 synthetic events, while the harness queries real chain state and asserts cross-entity invariants would have failed if any handler bug produced inconsistent state across thousands of events. **Two real harness bugs were caught during DEX-harness development** (unstable Hasura pagination; bad heuristic D8) — see the 2026-04-30 CHANGELOG entry in [`Growth_Engineer_at_ENVIO/CHANGELOG.md`](https://github.com/kaustubh76/Growth_Engineer_at_ENVIO/blob/main/CHANGELOG.md).

---

## Where to verify it

1. **Read the saved harness output** (no setup required):
   - [`docs/screenshots/queries/HARNESS_OUTPUT.txt`](./docs/screenshots/queries/HARNESS_OUTPUT.txt)
   - [`docs/screenshots/queries-defi/HARNESS_OUTPUT.txt`](./docs/screenshots/queries-defi/HARNESS_OUTPUT.txt)
   - [`docs/screenshots/queries-perp/HARNESS_OUTPUT.txt`](./docs/screenshots/queries-perp/HARNESS_OUTPUT.txt)
2. **Read the JSON GraphQL response captures** (real live-indexer output):
   - [`docs/screenshots/queries/`](./docs/screenshots/queries/) (money market, 6 files)
   - [`docs/screenshots/queries-defi/`](./docs/screenshots/queries-defi/) (DEX, 6 files)
   - [`docs/screenshots/queries-perp/`](./docs/screenshots/queries-perp/) (perp, 6 files)
3. **Read the harness scripts** (the predicates being checked):
   - [`scripts/demo-capture/assertions.mjs`](./scripts/demo-capture/assertions.mjs) — 9 money-market invariants
   - [`scripts/demo-capture/assertions-defi.mjs`](./scripts/demo-capture/assertions-defi.mjs) — 8 DEX invariants
   - [`scripts/demo-capture/assertions-perp.mjs`](./scripts/demo-capture/assertions-perp.mjs) — 4 perp invariants
4. **Reproduce the runs yourself** — see each template's `RUN.md`:
   - [`pow/envio-defi-template-v1/RUN.md`](./pow/envio-defi-template-v1/RUN.md)
   - [`pow/envio-money-market-template-v1/RUN.md`](./pow/envio-money-market-template-v1/RUN.md)
   - [`pow/envio-perp-template-v1/RUN.md`](./pow/envio-perp-template-v1/RUN.md)

---

## Chain provenance

| Template | Chain | Contract | Deploy block |
|---|---|---|---|
| DEX | Optimism (10) | [`0xF1046053…5FF5a`](https://optimistic.etherscan.io/address/0xF1046053aa5682b4F9a81b5481394DA16BE5FF5a) (Velodrome V2 PoolFactory) | 105,896,852 |
| Money market | Polygon (137) | [`0x794a6135…814aD`](https://polygonscan.com/address/0x794a61358D6845594F94dc1DB02A252b5b4814aD) (Aave V3 Pool) | 25,826,028 |
| Perp | Arbitrum (42161) | [`0xC8ee91A5…22Fb`](https://arbiscan.io/address/0xC8ee91A54287DB53897056e12D9819156D3822Fb) (GMX v2 EventEmitter) | 107,737,756 |

All harness runs recorded in this package were against these mainnet deployments on 2026-04-30.

---

## 4-line replay

```bash
git clone https://github.com/kaustubh76/Growth_Engineer_at_ENVIO.git && cd Growth_Engineer_at_ENVIO
pnpm -C pow/envio-money-market-template-v1 install && pnpm -C pow/envio-money-market-template-v1 test     # 5 ✓
pnpm -C pow/envio-defi-template-v1 install         && pnpm -C pow/envio-defi-template-v1 test             # 10 ✓
pnpm -C pow/envio-perp-template-v1 install         && pnpm -C pow/envio-perp-template-v1 test             # 2 ✓ + 3 skip→v2
```

For the live runs (with RPC URL): `cd pow/envio-XXX-template-v1 && cat RUN.md`.

---

## Strategy artifacts (the "growth engineer" half)

Strategy and positioning memos at the repo root. Highlights:

- [`ENVIO_VERTICAL_PLAYBOOK.md`](./ENVIO_VERTICAL_PLAYBOOK.md) — three-vertical positioning + onboarding plan
- [`ENVIO_PAIN_MAP_MATRIX.md`](./ENVIO_PAIN_MAP_MATRIX.md) — protocol-pain × Envio-feature matrix
- [`ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md`](./ENVIO_MONEY_MARKET_TECH_DIAGNOSTIC.md), [`ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md`](./ENVIO_MONEY_MARKET_POSITIONING_AUDIT.md), [`ENVIO_LIQUIDATION_HANDLER_REFERENCE.md`](./ENVIO_LIQUIDATION_HANDLER_REFERENCE.md) — money-market vertical
- [`ENVIO_DEFI_TECH_DIAGNOSTIC.md`](./ENVIO_DEFI_TECH_DIAGNOSTIC.md), [`ENVIO_DEFI_POSITIONING_AUDIT.md`](./ENVIO_DEFI_POSITIONING_AUDIT.md) — DEX vertical
- [`ENVIO_DEFI_60MIN_TEMPLATE.md`](./ENVIO_DEFI_60MIN_TEMPLATE.md) — 60-minute fork-and-ship walkthrough
- [`ENVIO_FIRST_24_HOURS.md`](./ENVIO_FIRST_24_HOURS.md), [`ENVIO_GROWTH_PLAN.md`](./ENVIO_GROWTH_PLAN.md), [`ENVIO_DECK_OUTLINE.md`](./ENVIO_DECK_OUTLINE.md), [`ENVIO_VIDEO_SCRIPT.md`](./ENVIO_VIDEO_SCRIPT.md) — operating plan
- [`ENVIO_REVENUE_MATH.md`](./ENVIO_REVENUE_MATH.md), [`ENVIO_REVENUE_MATH_V2.md`](./ENVIO_REVENUE_MATH_V2.md), [`ENVIO_REVENUE_MODEL.md`](./ENVIO_REVENUE_MODEL.md) — revenue math
- [`ENVIO_EFFECT_API_PATTERN.md`](./ENVIO_EFFECT_API_PATTERN.md), [`ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md`](./ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md), [`ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md`](./ENVIO_RISK_DASHBOARD_QUERY_ARCHITECTURE.md) — depth on Envio-specific patterns
