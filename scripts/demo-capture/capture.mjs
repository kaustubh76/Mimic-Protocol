#!/usr/bin/env node
/**
 * capture.mjs — playwright-driven screenshot + JSON capture for the
 * money-market template's live Polygon Aave V3 demo run.
 *
 * Assumes:
 *   - `pnpm dev` is running in /tmp/aave-demo with Polygon-only config
 *   - Hasura GraphQL endpoint at http://localhost:8080/v1/graphql is up
 *   - Hasura playground at http://localhost:8080
 *
 * Outputs:
 *   - docs/screenshots/queries/*.json — raw GraphQL responses (text, diff-able)
 *   - docs/screenshots/png/*.png      — playwright PNG renders of the playground
 *   - docs/screenshots/README.md      — index of what each artifact shows
 *
 * Run: pnpm capture
 *
 * The script polls the GraphQL endpoint until indexed event count > 0
 * before attempting captures (otherwise we'd capture empty results).
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_ROOT = resolve(__dirname, "../../docs/screenshots");
const QUERIES_DIR = resolve(OUT_ROOT, "queries");
const PNG_DIR = resolve(OUT_ROOT, "png");

const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:8080/v1/graphql";
const PLAYGROUND_URL = process.env.PLAYGROUND_URL ?? "http://localhost:8080";

// The captures we want, ordered by what a reviewer would scan first.
const CAPTURES = [
  {
    slug: "01-top-reserves-by-supply",
    title: "Top 10 reserves by total supplied",
    query: `query {
  ReserveAggregator(order_by: {totalSupplied: desc}, limit: 10) {
    asset
    totalSupplied
    totalBorrowed
    totalLiquidations
    uniqueSuppliers
    uniqueBorrowers
    currentLiquidityRate
    currentVariableBorrowRate
  }
}`,
  },
  {
    slug: "02-recent-liquidations",
    title: "10 most recent liquidations",
    query: `query {
  Liquidation(order_by: {blockNumber: desc}, limit: 10) {
    user
    liquidator
    collateralAsset
    debtAsset
    debtToCover
    liquidatedCollateralAmount
    receiveAToken
    blockNumber
    timestamp
  }
}`,
  },
  {
    slug: "03-most-liquidated-users",
    title: "Top 10 most-liquidated users (liquidations as borrower)",
    query: `query {
  UserAggregator(order_by: {liquidationsAsBorrower: desc}, limit: 10) {
    user
    liquidationsAsBorrower
    liquidationsAsLiquidator
    totalSuppliedAcrossReserves
    totalBorrowedAcrossReserves
    reservesParticipated
  }
}`,
  },
  {
    slug: "04-top-liquidators",
    title: "Top 10 liquidators (liquidations as liquidator)",
    query: `query {
  UserAggregator(
    where: {liquidationsAsLiquidator: {_gt: 0}}
    order_by: {liquidationsAsLiquidator: desc}
    limit: 10
  ) {
    user
    liquidationsAsLiquidator
    totalSuppliedAcrossReserves
    totalBorrowedAcrossReserves
  }
}`,
  },
  {
    slug: "05-rate-snapshots-per-reserve",
    title: "10 most recent rate snapshots (across reserves)",
    query: `query {
  ReserveRateSnapshot(order_by: {blockNumber: desc}, limit: 10) {
    reserve_id
    liquidityRate
    variableBorrowRate
    liquidityIndex
    variableBorrowIndex
    blockNumber
    timestamp
  }
}`,
  },
  {
    slug: "06-sample-counts",
    title: "Sample counts across all entities (limit 1000 per type)",
    // Envio v2's Hasura config exposes entity tables but not _aggregate
    // queries. We sample limit:1000 from each and count length client-side.
    // This is sufficient to prove the indexer is alive and writing to all
    // three entity layers; for true aggregate counts the customer would
    // wire an _aggregate-enabled Hasura config or query Postgres directly.
    query: `query {
  Reserve(limit: 1000) { id }
  UserReserve(limit: 1000) { id }
  Liquidation(limit: 1000) { id }
  ReserveAggregator(limit: 1000) { id }
  UserAggregator(limit: 1000) { id }
  ReserveRateSnapshot(limit: 1000) { id }
}`,
  },
];

async function gqlFetch(query) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

async function waitForData() {
  // Poll until at least one Reserve has been indexed. Envio v2's Hasura
  // config doesn't expose _aggregate queries, so we sample limit:1 and
  // check length client-side.
  const maxAttempts = 360; // ~30 minutes at 5s interval
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await gqlFetch(`query { Reserve(limit: 1) { id } }`);
      const count = (r?.data?.Reserve ?? []).length;
      if (i % 6 === 0) console.log(`[wait] Reserve sample length: ${count} (attempt ${i + 1}/${maxAttempts})`);
      if (count > 0) return count;
    } catch (e) {
      if (i % 12 === 0) console.log(`[wait] GraphQL not ready yet: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Timed out waiting for indexed data");
}

async function captureJsonResponses() {
  await mkdir(QUERIES_DIR, { recursive: true });
  const summary = [];
  for (const c of CAPTURES) {
    console.log(`[json] ${c.slug}: ${c.title}`);
    try {
      const r = await gqlFetch(c.query);
      const out = { title: c.title, query: c.query, response: r, capturedAt: new Date().toISOString() };
      await writeFile(resolve(QUERIES_DIR, `${c.slug}.json`), JSON.stringify(out, null, 2));
      summary.push({ slug: c.slug, title: c.title, ok: true });
    } catch (e) {
      console.error(`  failed: ${e.message}`);
      summary.push({ slug: c.slug, title: c.title, ok: false, error: e.message });
    }
  }
  return summary;
}

async function capturePngScreenshots() {
  await mkdir(PNG_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Hasura console: navigate to the API tab and run each query, screenshot.
  // Hasura's API explorer is at /api-explorer/graphql but the URL varies by
  // Hasura version. Easiest path: open the playground root and screenshot.
  for (const c of CAPTURES) {
    console.log(`[png] ${c.slug}: ${c.title}`);
    try {
      await page.goto(PLAYGROUND_URL, { waitUntil: "networkidle", timeout: 30000 });
      await page.screenshot({ path: resolve(PNG_DIR, `${c.slug}-playground-home.png`), fullPage: false });
      // Note: full UI-driven query interaction would need playwright to find
      // the Hasura editor textbox + run button. For v1 we capture the
      // playground home + rely on the JSON dumps for query content.
      break; // one shot of the playground home is enough; JSON dumps carry the rest
    } catch (e) {
      console.error(`  failed: ${e.message}`);
    }
  }

  // Also screenshot the rendered JSON of one canonical query as visual proof
  // the indexer is alive. Use a data URL with prettified JSON.
  try {
    const sampleCounts = await gqlFetch(CAPTURES[5].query);
    // Convert sample-arrays into per-entity counts for the visual summary.
    const counts = {};
    if (sampleCounts?.data) {
      for (const [k, v] of Object.entries(sampleCounts.data)) {
        counts[k] = Array.isArray(v) ? `${v.length}${v.length === 1000 ? "+" : ""}` : "?";
      }
    }
    const jsonHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Aave V3 Polygon — indexer state</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0e1116;color:#e6e6e6;padding:48px;margin:0}
h1{font-size:22px;font-weight:600;margin:0 0 8px}
.sub{color:#888;font-size:13px;margin-bottom:24px}
pre{background:#1a1d24;border:1px solid #2a2f38;border-radius:8px;padding:24px;overflow:auto;font-size:14px;line-height:1.6}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{text-align:left;padding:10px 14px;border-bottom:1px solid #2a2f38}
th{color:#aaa;font-size:12px;text-transform:uppercase;letter-spacing:0.05em}
.count{font-family:ui-monospace,monospace;color:#7ec699;font-size:18px}
.meta{color:#888;font-size:12px;margin-top:16px}
</style></head><body>
<h1>envio-money-market-template-v1 — indexer state</h1>
<div class="sub">Aave V3 on Polygon (chain 137) · live data, sampled ${new Date().toISOString()}</div>
<table>
<tr><th>Entity</th><th>Sample size (limit 1000)</th></tr>
${Object.entries(counts).map(([k, v]) => `<tr><td>${k}</td><td class="count">${v}</td></tr>`).join("\n")}
</table>
<div class="meta">Source: ${GRAPHQL_URL} · Captured by scripts/demo-capture/capture.mjs</div>
</body></html>`;
    await page.setContent(jsonHtml);
    await page.screenshot({ path: resolve(PNG_DIR, "00-indexer-state-summary.png"), fullPage: true });
  } catch (e) {
    console.error(`  summary screenshot failed: ${e.message}`);
  }

  await browser.close();
}

async function writeIndex(summary) {
  const lines = [
    "# Live indexing screenshots — Aave V3 on Polygon",
    "",
    "Captured by `scripts/demo-capture/capture.mjs` against a live `pnpm dev` run of",
    "`pow/envio-money-market-template-v1/` configured for Polygon-only.",
    "",
    `Captured at: ${new Date().toISOString()}`,
    "",
    "## What's here",
    "",
    "- `png/00-indexer-state-summary.png` — aggregate counts across all entities. Quick visual",
    "  proof that the indexer is alive and writing to all three layers.",
    "- `png/*-playground-home.png` — Hasura GraphQL playground.",
    "- `queries/*.json` — raw GraphQL responses (real, reproducible). The most reliable",
    "  evidence; PNGs are convenient but JSON is what holds up under scrutiny.",
    "",
    "## Capture results",
    "",
    "| # | Slug | Title | Status |",
    "|---|---|---|---|",
    ...summary.map((s) => `| ${s.slug.split("-")[0]} | \`${s.slug}\` | ${s.title} | ${s.ok ? "✅" : `❌ ${s.error}`} |`),
    "",
    "## Reproducing this",
    "",
    "1. `cd pow/envio-money-market-template-v1`",
    "2. Edit `config.yaml` to keep only the Polygon network entry (delete Arbitrum + Base)",
    "3. `pnpm install && pnpm codegen && pnpm dev`",
    "4. Wait ~5–15 min for HyperSync to ingest enough Aave V3 history to populate entities.",
    "5. In another shell: `cd scripts/demo-capture && pnpm install && pnpm capture`",
    "",
    "The capture script polls the GraphQL endpoint until at least one Reserve entity exists,",
    "then captures both JSON responses and PNG screenshots into this directory.",
  ].join("\n");
  await writeFile(resolve(OUT_ROOT, "README.md"), lines);
}

async function main() {
  console.log(`[capture] GraphQL: ${GRAPHQL_URL}`);
  console.log(`[capture] Output:  ${OUT_ROOT}`);
  await mkdir(OUT_ROOT, { recursive: true });

  await waitForData();
  const summary = await captureJsonResponses();
  await capturePngScreenshots();
  await writeIndex(summary);

  const ok = summary.filter((s) => s.ok).length;
  console.log(`[capture] done — ${ok}/${summary.length} JSON captures successful`);
  if (ok < summary.length) process.exit(1);
}

main().catch((e) => {
  console.error("[capture] fatal:", e);
  process.exit(1);
});
