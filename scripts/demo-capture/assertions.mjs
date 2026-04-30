#!/usr/bin/env node
/**
 * assertions.mjs — live-indexer assertion harness for the money-market template.
 *
 * Queries the live `pnpm dev` GraphQL endpoint and asserts cross-entity invariants
 * that should hold over real Aave V3 history. Catches a different class of bug
 * from the unit tests:
 *   - Unit tests use MockDb with ~5-10 events; pass/fail on synthetic data.
 *   - This harness queries real Polygon Aave V3 history (16 reserves, 119+
 *     liquidations, 1000+ user-reserves) and fails if any of them violate
 *     expected invariants.
 *
 * Run:
 *   1. Start pnpm dev in pow/envio-money-market-template-v1/ (Polygon-only config)
 *   2. Wait for partial sync (>= 1 Liquidation indexed)
 *   3. cd scripts/demo-capture && pnpm assert
 *
 * Output:
 *   PASS/FAIL per invariant, with sample failures printed inline.
 *   Exit 0 if all pass, 1 otherwise, 2 on infrastructure error.
 *
 * The harness is NOT a CI-runnable test (it requires a live indexer). It's a
 * manual reproduction step documented as such.
 */

const GRAPHQL_URL = process.env.GRAPHQL_URL ?? "http://localhost:8080/v1/graphql";

// ===================================================================
// GraphQL helpers
// ===================================================================

async function gql(query, variables = {}) {
  let res;
  try {
    res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    fail(`Cannot reach ${GRAPHQL_URL}. Is \`pnpm dev\` running in pow/envio-money-market-template-v1/? (${e.message})`);
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

// Paginate over a list query. Hasura supports `limit + offset`.
async function paginateAll(typename, fields, batchSize = 1000, maxPages = 20) {
  const all = [];
  for (let page = 0; page < maxPages; page++) {
    const offset = page * batchSize;
    const data = await gql(
      `query { ${typename}(limit: ${batchSize}, offset: ${offset}) { ${fields} } }`,
    );
    const rows = data[typename] ?? [];
    all.push(...rows);
    if (rows.length < batchSize) break; // last page
  }
  return all;
}

// ===================================================================
// Assertion runner
// ===================================================================

const results = []; // { name, passed, failed, sampleFailures }

function check(name, predicate, items, sampleSize = 3) {
  const failures = items.filter((i) => !predicate(i));
  const passed = items.length - failures.length;
  results.push({
    name,
    total: items.length,
    passed,
    failed: failures.length,
    sampleFailures: failures.slice(0, sampleSize),
  });
}

// ===================================================================
// Invariants L1–L9
// ===================================================================

async function main() {
  console.log(`[harness] GraphQL: ${GRAPHQL_URL}`);
  console.log(`[harness] Loading entity sets...\n`);

  const reserves = await paginateAll("Reserve", "id chainId asset");
  const reserveAggs = await paginateAll(
    "ReserveAggregator",
    "id chainId asset totalSupplied totalBorrowed totalLiquidations uniqueSuppliers uniqueBorrowers",
  );
  const liquidations = await paginateAll(
    "Liquidation",
    "id chainId user liquidator collateralAsset debtAsset blockNumber",
  );
  const userReserves = await paginateAll(
    "UserReserve",
    "id chainId asset user cumulativeSupplied cumulativeWithdrawn cumulativeBorrowed cumulativeRepaid netSupplyPosition netDebtPosition",
    1000,
    5, // sample up to 5000 user-reserves; full scan can be 100k+
  );
  const userAggs = await paginateAll(
    "UserAggregator",
    "id chainId user liquidationsAsBorrower liquidationsAsLiquidator",
    1000,
    20, // larger to cover all liquidator + liquidatee addresses
  );

  console.log(`  Reserves:           ${reserves.length}`);
  console.log(`  ReserveAggregators: ${reserveAggs.length}`);
  console.log(`  Liquidations:       ${liquidations.length}`);
  console.log(`  UserReserves:       ${userReserves.length} (sampled, may be partial)`);
  console.log(`  UserAggregators:    ${userAggs.length}`);
  console.log("");

  if (liquidations.length === 0) {
    fail(
      "No liquidations indexed yet. Wait longer for sync, or check that pnpm dev is making progress.\n" +
        "       (block 25,826,028 is the Aave V3 Polygon deploy block; the first liquidation\n" +
        "        usually shows up after a few hundred thousand blocks of sync.)",
    );
  }

  // Lookup tables for O(1) cross-references.
  const reserveById = new Map(reserves.map((r) => [r.id, r]));
  const userAggById = new Map(userAggs.map((u) => [u.id, u]));

  // Helper: build the reserve-id from chainId + asset address.
  const rid = (chainId, asset) => `${chainId}-${asset.toLowerCase()}`;
  const uid = (chainId, user) => `${chainId}-${user.toLowerCase()}`;

  console.log(`[harness] Running invariants...\n`);

  check(
    "L1: every Liquidation.collateralAsset has a Reserve",
    (l) => reserveById.has(rid(l.chainId, l.collateralAsset)),
    liquidations,
  );

  check(
    "L2: every Liquidation.debtAsset has a Reserve",
    (l) => reserveById.has(rid(l.chainId, l.debtAsset)),
    liquidations,
  );

  check(
    "L3: every Liquidation.user has UserAggregator with liquidationsAsBorrower >= 1",
    (l) => {
      const u = userAggById.get(uid(l.chainId, l.user));
      return u && u.liquidationsAsBorrower >= 1;
    },
    liquidations,
  );

  check(
    "L4: every Liquidation.liquidator has UserAggregator with liquidationsAsLiquidator >= 1",
    (l) => {
      const u = userAggById.get(uid(l.chainId, l.liquidator));
      return u && u.liquidationsAsLiquidator >= 1;
    },
    liquidations,
  );

  // L5: per-reserve liquidation count. Each Liquidation contributes +1 to the
  // collateral reserve and +1 to the debt reserve (handler skips double-count
  // when collat == debt). So aggregator.totalLiquidations >= count_of_liqs_touching_it.
  const liqCountByReserve = new Map();
  for (const l of liquidations) {
    const collId = rid(l.chainId, l.collateralAsset);
    const debtId = rid(l.chainId, l.debtAsset);
    liqCountByReserve.set(collId, (liqCountByReserve.get(collId) ?? 0) + 1);
    if (collId !== debtId) {
      liqCountByReserve.set(debtId, (liqCountByReserve.get(debtId) ?? 0) + 1);
    }
  }
  const reservesWithLiquidations = reserveAggs.filter((r) => liqCountByReserve.has(r.id));
  check(
    "L5: ReserveAggregator.totalLiquidations >= count of liquidations touching this reserve",
    (r) => r.totalLiquidations >= (liqCountByReserve.get(r.id) ?? 0),
    reservesWithLiquidations,
  );

  check(
    "L6: ReserveAggregator with totalSupplied > 0 has uniqueSuppliers >= 1",
    (r) => BigInt(r.totalSupplied ?? "0") <= 0n || (r.uniqueSuppliers ?? 0) >= 1,
    reserveAggs,
  );

  check(
    "L7: ReserveAggregator with totalBorrowed > 0 has uniqueBorrowers >= 1",
    (r) => BigInt(r.totalBorrowed ?? "0") <= 0n || (r.uniqueBorrowers ?? 0) >= 1,
    reserveAggs,
  );

  check(
    "L8: UserReserve.netSupplyPosition == cumulativeSupplied - cumulativeWithdrawn",
    (u) => {
      const expected = BigInt(u.cumulativeSupplied ?? "0") - BigInt(u.cumulativeWithdrawn ?? "0");
      return BigInt(u.netSupplyPosition ?? "0") === expected;
    },
    userReserves,
  );

  check(
    "L9: UserReserve.netDebtPosition == cumulativeBorrowed - cumulativeRepaid",
    (u) => {
      const expected = BigInt(u.cumulativeBorrowed ?? "0") - BigInt(u.cumulativeRepaid ?? "0");
      return BigInt(u.netDebtPosition ?? "0") === expected;
    },
    userReserves,
  );

  // ===================================================================
  // Report
  // ===================================================================
  console.log("");
  console.log("=".repeat(72));
  console.log("Invariant report");
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
