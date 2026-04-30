#!/usr/bin/env node
/**
 * assertions-perp.mjs — live-indexer assertion harness for the perp template.
 *
 * v1 scope (matches the perp template's v1 scope): PositionIncrease only.
 * The harness asserts cross-entity invariants over real GMX v2 data on
 * Arbitrum.
 *
 * Invariants (4):
 *   P1: every Position.market_id has a corresponding PerpMarket
 *   P2: every PerpMarket has a PerpAggregator (1:1, lazy-created together)
 *   P3: PerpAggregator.totalPositions >= count of distinct Positions per market
 *       in this sample
 *   P4: every Position has sizeInUsd > 0
 *
 * Run: pnpm assert:perp (with `pnpm dev` running in
 * pow/envio-perp-template-v1/ configured for Arbitrum-only).
 */

const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:8080/v1/graphql";

async function gql(query, variables = {}) {
  let res;
  try {
    res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    fail(`Cannot reach ${GRAPHQL_URL}. Is \`pnpm dev\` running in pow/envio-perp-template-v1/? (${e.message})`);
  }
  if (!res.ok) fail(`GraphQL HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) fail(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

function fail(msg) {
  console.error(`\nFATAL: ${msg}\n`);
  process.exit(2);
}

async function paginateAll(typename, fields, batchSize = 1000, maxPages = 30, orderBy = null) {
  const all = [];
  const orderClause = orderBy ? `, order_by: ${orderBy}` : "";
  for (let page = 0; page < maxPages; page++) {
    const offset = page * batchSize;
    const data = await gql(
      `query { ${typename}(limit: ${batchSize}, offset: ${offset}${orderClause}) { ${fields} } }`,
    );
    const rows = data[typename] ?? [];
    all.push(...rows);
    if (rows.length < batchSize) break;
  }
  return all;
}

const results = [];
function check(name, predicate, items, sampleSize = 3) {
  const failures = items.filter((i) => !predicate(i));
  results.push({
    name,
    total: items.length,
    passed: items.length - failures.length,
    failed: failures.length,
    sampleFailures: failures.slice(0, sampleSize),
  });
}

async function main() {
  console.log(`[harness] GraphQL: ${GRAPHQL_URL}`);
  console.log(`[harness] Loading entity sets...\n`);

  const markets = await paginateAll("PerpMarket", "id chainId address");
  const aggs = await paginateAll(
    "PerpAggregator",
    "id chainId marketAddress longOpenInterestUsd shortOpenInterestUsd totalPositions totalLiquidations uniqueTraders",
  );
  const positions = await paginateAll(
    "Position",
    "id market_id account isLong sizeInUsd cumulativeSizeIncreaseUsd cumulativeSizeDecreaseUsd",
    1000,
    20,
    "{ id: asc }",
  );

  console.log(`  PerpMarkets:      ${markets.length}`);
  console.log(`  PerpAggregators:  ${aggs.length}`);
  console.log(`  Positions:        ${positions.length} (sampled, may be partial)`);
  console.log("");

  if (positions.length === 0) {
    fail(
      "No positions indexed yet. Wait longer for sync — GMX v2 EventEmitter deploy block\n" +
        "       on Arbitrum is 107,737,756; PositionIncrease events fire shortly after.",
    );
  }

  const marketById = new Map(markets.map((m) => [m.id, m]));
  const aggByMarketId = new Map(aggs.map((a) => [a.id, a]));

  console.log(`[harness] Running invariants...\n`);

  check("P1: every Position.market_id has a PerpMarket", (p) => marketById.has(p.market_id), positions);
  check("P2: every PerpMarket has a PerpAggregator (1:1)", (m) => aggByMarketId.has(m.id), markets);

  const positionsPerMarket = new Map();
  for (const p of positions) {
    if (!positionsPerMarket.has(p.market_id)) positionsPerMarket.set(p.market_id, new Set());
    positionsPerMarket.get(p.market_id).add(p.id);
  }
  const aggCheckList = aggs.filter((a) => positionsPerMarket.has(a.id));
  check(
    "P3: PerpAggregator.totalPositions >= distinct Positions seen in sample",
    (a) => a.totalPositions >= positionsPerMarket.get(a.id).size,
    aggCheckList,
  );

  check(
    "P4: every Position has sizeInUsd > 0 (no zero-sized positions inserted)",
    (p) => BigInt(p.sizeInUsd ?? "0") > 0n,
    positions,
  );

  // Report
  console.log("");
  console.log("=".repeat(72));
  console.log("Perp invariant report (GMX v2, v1 scope: PositionIncrease only)");
  console.log("=".repeat(72));
  let anyFailed = false;
  for (const r of results) {
    const status = r.failed === 0 ? "✓ PASS" : "✗ FAIL";
    if (r.failed > 0) anyFailed = true;
    console.log(`${status}  ${r.name}`);
    console.log(`        checked ${r.total}, passed ${r.passed}, failed ${r.failed}`);
    if (r.failed > 0 && r.sampleFailures.length > 0) {
      console.log(`        sample failures:`);
      for (const f of r.sampleFailures) {
        console.log(`          ${JSON.stringify(f)}`);
      }
    }
  }
  console.log("=".repeat(72));
  const totalChecks = results.reduce((acc, r) => acc + r.total, 0);
  const totalFailures = results.reduce((acc, r) => acc + r.failed, 0);
  console.log(
    `Summary: ${totalChecks - totalFailures}/${totalChecks} checks passed across ${results.length} invariants`,
  );

  if (anyFailed) {
    console.log("\nFAIL — at least one invariant violated. See sample failures above.");
    process.exit(1);
  } else {
    console.log("\nPASS — all invariants hold on live data.");
    process.exit(0);
  }
}

main().catch((e) => {
  console.error("[harness] unexpected error:", e);
  process.exit(2);
});
