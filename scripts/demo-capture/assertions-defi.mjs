#!/usr/bin/env node
/**
 * assertions-defi.mjs — live-indexer assertion harness for the DEX template.
 *
 * Companion to assertions.mjs (money-market). Same pattern, DEX-shape
 * invariants for Velodrome V2 on Optimism:
 *
 *   D1: every Pool.token0_id has a corresponding Token
 *   D2: every Pool.token1_id has a corresponding Token
 *   D3: every Pool has a PoolAggregator (1:1)
 *   D4: PoolAggregator.swapCount > 0 implies cumulativeVolume0 + volume1 > 0
 *   D5: every PoolHourSnapshot.pool_id has a corresponding Pool (FK)
 *   D6: PoolHourSnapshot.cumulativeVolume0 is monotonic non-decreasing per pool
 *   D7: PoolHourSnapshot.hourlyVolume0 == cumVol0[i] - cumVol0[i-1] across adjacent
 *       snapshots within the same pool
 *   D8: pools with swapCount > 100 have reserve0 < cumulativeVolume0 (sanity heuristic
 *       catching the bug where reserve0 was wrongly accumulated)
 *
 * Run: pnpm assert:defi (with `pnpm dev` running in pow/envio-defi-template-v1/
 * configured Optimism-only).
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
    fail(`Cannot reach ${GRAPHQL_URL}. Is \`pnpm dev\` running in pow/envio-defi-template-v1/? (${e.message})`);
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

  const tokens = await paginateAll("Token", "id chainId address");
  const pools = await paginateAll(
    "Pool",
    "id chainId address token0_id token1_id isStable",
  );
  const poolAggs = await paginateAll(
    "PoolAggregator",
    "id chainId poolAddress reserve0 reserve1 cumulativeVolume0 cumulativeVolume1 cumulativeFees0 cumulativeFees1 swapCount",
  );
  // Critical: paginate with a STABLE ordering tuple. Just (pool_id asc,
  // hourEpoch asc) is not unique; if the indexer is writing during pagination,
  // Hasura+Postgres can re-emit the same row at different page boundaries.
  // Adding `id asc` as a tiebreaker makes the order total + stable. Caught
  // by an earlier harness run that produced D7 failures with `expected: 0`
  // (same cumulativeVolume0 in two consecutive sampled rows for one pool —
  // proving the row was duplicated by the unstable pagination).
  const snapshots = await paginateAll(
    "PoolHourSnapshot",
    "id pool_id chainId hourEpoch reserve0 reserve1 cumulativeVolume0 cumulativeVolume1 hourlyVolume0 hourlyVolume1 swapCount",
    1000,
    10, // sample up to 10k snapshots
    "{ pool_id: asc, hourEpoch: asc, id: asc }",
  );

  // Dedupe defensively in case there are still duplicates from race-with-writer.
  const snapshotById = new Map();
  for (const s of snapshots) snapshotById.set(s.id, s);
  const uniqueSnapshots = Array.from(snapshotById.values());
  console.log(`  (after dedup: ${uniqueSnapshots.length} unique snapshots)`);
  // Replace the live `snapshots` with the deduped set.
  snapshots.length = 0;
  snapshots.push(...uniqueSnapshots);

  console.log(`  Tokens:           ${tokens.length}`);
  console.log(`  Pools:            ${pools.length}`);
  console.log(`  PoolAggregators:  ${poolAggs.length}`);
  console.log(`  PoolHourSnapshot: ${snapshots.length} (sampled, may be partial)`);
  console.log("");

  if (pools.length === 0) {
    fail(
      "No pools indexed yet. Wait longer for sync (Velodrome V2 PoolFactory deploy block\n" +
        "       is 105,896,852 on Optimism; pools start being created shortly after).",
    );
  }

  const tokenById = new Map(tokens.map((t) => [t.id, t]));
  const poolById = new Map(pools.map((p) => [p.id, p]));
  const aggByPoolId = new Map(poolAggs.map((a) => [a.id, a]));

  console.log(`[harness] Running invariants...\n`);

  check("D1: every Pool.token0_id has a Token", (p) => tokenById.has(p.token0_id), pools);
  check("D2: every Pool.token1_id has a Token", (p) => tokenById.has(p.token1_id), pools);
  check("D3: every Pool has a PoolAggregator (1:1)", (p) => aggByPoolId.has(p.id), pools);
  check(
    "D4: PoolAggregator.swapCount > 0 -> cumulativeVolume0 + volume1 > 0",
    (a) => {
      if (BigInt(a.swapCount ?? "0") === 0n) return true;
      return (
        BigInt(a.cumulativeVolume0 ?? "0") + BigInt(a.cumulativeVolume1 ?? "0") > 0n
      );
    },
    poolAggs,
  );
  check(
    "D5: every PoolHourSnapshot.pool_id has a Pool",
    (s) => poolById.has(s.pool_id),
    snapshots,
  );

  // Group snapshots by pool, sort by hourEpoch.
  const snapsByPool = new Map();
  for (const s of snapshots) {
    if (!snapsByPool.has(s.pool_id)) snapsByPool.set(s.pool_id, []);
    snapsByPool.get(s.pool_id).push(s);
  }
  for (const list of snapsByPool.values()) {
    list.sort((a, b) => {
      const aE = BigInt(a.hourEpoch);
      const bE = BigInt(b.hourEpoch);
      if (aE < bE) return -1;
      if (aE > bE) return 1;
      return 0;
    });
  }

  // D6: monotonic non-decreasing cumulativeVolume0
  const monotonicityChecks = [];
  for (const [poolId, list] of snapsByPool.entries()) {
    if (list.length < 2) continue;
    for (let i = 1; i < list.length; i++) {
      const prev = BigInt(list[i - 1].cumulativeVolume0 ?? "0");
      const cur = BigInt(list[i].cumulativeVolume0 ?? "0");
      monotonicityChecks.push({
        pool_id: poolId,
        prevEpoch: list[i - 1].hourEpoch,
        curEpoch: list[i].hourEpoch,
        prevCumVol0: prev.toString(),
        curCumVol0: cur.toString(),
        ok: cur >= prev,
      });
    }
  }
  check(
    "D6: PoolHourSnapshot.cumulativeVolume0 monotonic non-decreasing per pool",
    (c) => c.ok,
    monotonicityChecks,
  );

  // D7: hourlyVolume0 == cumVol0[i] - cumVol0[i-1]
  const deltaChecks = [];
  for (const [poolId, list] of snapsByPool.entries()) {
    if (list.length < 2) continue;
    for (let i = 1; i < list.length; i++) {
      const prev = BigInt(list[i - 1].cumulativeVolume0 ?? "0");
      const cur = BigInt(list[i].cumulativeVolume0 ?? "0");
      const expected = cur - prev;
      const actual = BigInt(list[i].hourlyVolume0 ?? "0");
      deltaChecks.push({
        pool_id: poolId,
        epoch: list[i].hourEpoch,
        expected: expected.toString(),
        actual: actual.toString(),
        ok: actual === expected,
      });
    }
  }
  check(
    "D7: PoolHourSnapshot.hourlyVolume0 == cumVol0[i] - cumVol0[i-1]",
    (c) => c.ok,
    deltaChecks,
  );

  // D8: sanity — every pool with cumulativeVolume0 > 0 has at least one snapshot
  // (since the snapshot is written from the swap handler after applySwap).
  // Original heuristic "reserve0 < cumulativeVolume0" was WRONG: a pool with
  // large LPs but few swaps legitimately has reserves > total cumulative
  // swap volume. Caught by the first run of this harness.
  //
  // Direct existence check via GraphQL per pool rather than relying on the
  // sampled snapshot set (which only covers 10k of potentially many more
  // snapshots).
  const poolsWithVolume = poolAggs.filter((a) => BigInt(a.cumulativeVolume0 ?? "0") > 0n);
  console.log(`  [D8] checking ${poolsWithVolume.length} pools for snapshot existence...`);
  const d8Checks = [];
  for (const a of poolsWithVolume) {
    const r = await gql(
      `query { PoolHourSnapshot(where: {pool_id: {_eq: "${a.id}"}}, limit: 1) { id } }`,
    );
    const exists = (r?.PoolHourSnapshot ?? []).length > 0;
    d8Checks.push({ id: a.id, swapCount: a.swapCount, exists });
  }
  check(
    "D8: every pool with cumulativeVolume0 > 0 has at least one PoolHourSnapshot",
    (c) => c.exists,
    d8Checks,
  );

  // Report
  console.log("");
  console.log("=".repeat(72));
  console.log("DEX invariant report");
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
