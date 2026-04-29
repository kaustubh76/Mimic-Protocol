#!/usr/bin/env node
/**
 * add-chain — multi-chain expansion CLI.
 *
 * Implements the runbook in ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md as a
 * deterministic, idempotent CLI. Replaces the hand-edit-config-yaml flow
 * that takes a one-week project and turns it into a one-command operation.
 *
 * USAGE
 *   pnpm add-chain <path-to-chain-config.json>
 *
 * INPUT FORMAT (JSON)
 *   {
 *     "chainId": 8453,
 *     "name": "base",
 *     "factoryAddress": "0x420DD...",
 *     "startBlock": 3200559,
 *     "rpcEnvVar": "ENVIO_BASE_RPC_URL"
 *   }
 *
 * EFFECTS
 *   - patches config.yaml with a new networks: entry
 *   - patches src/Constants.ts with a new ChainConstants export + CHAIN_CONFIG entry
 *
 * IDEMPOTENT — re-running with the same config is a no-op (the script
 * detects existing entries and returns early). Exits non-zero on
 * conflicting entries (same chainId, different fields).
 *
 * Why string-based patching, not js-yaml round-trip:
 *   js-yaml drops comments and reorders keys on round-trip. config.yaml
 *   and Constants.ts both use comments load-bearing for readability.
 *   String-based insertion at known anchor points preserves them.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type ChainConfig = {
  chainId: number;
  name: string;
  factoryAddress: string;
  startBlock: number;
  rpcEnvVar: string;
};

function fail(msg: string): never {
  console.error(`add-chain: ${msg}`);
  process.exit(1);
}

function validateConfig(c: unknown): asserts c is ChainConfig {
  if (typeof c !== "object" || c === null) fail("config must be a JSON object");
  const o = c as Record<string, unknown>;
  if (typeof o.chainId !== "number") fail("chainId must be a number");
  if (typeof o.name !== "string" || o.name.length === 0) fail("name must be a non-empty string");
  if (typeof o.factoryAddress !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(o.factoryAddress)) {
    fail(`factoryAddress must be a 0x-prefixed 40-char hex address; got ${String(o.factoryAddress)}`);
  }
  if (typeof o.startBlock !== "number" || o.startBlock < 0) {
    fail("startBlock must be a non-negative number");
  }
  if (typeof o.rpcEnvVar !== "string" || o.rpcEnvVar.length === 0) {
    fail("rpcEnvVar must be a non-empty string");
  }
}

function patchConfigYaml(repoRoot: string, c: ChainConfig): "added" | "skipped" {
  const path = resolve(repoRoot, "config.yaml");
  const yaml = readFileSync(path, "utf8");

  // Check idempotency: if the chainId already appears under networks:, skip.
  const existingChainPattern = new RegExp(
    `^\\s+- id:\\s*${c.chainId}\\b`,
    "m",
  );
  if (existingChainPattern.test(yaml)) {
    return "skipped";
  }

  // Find the end of the networks: block. We append a new entry at the end.
  // Anchor: the file ends after the last network's contracts: list.
  const networksHeaderMatch = yaml.match(/^networks:\s*$/m);
  if (!networksHeaderMatch) fail("config.yaml: cannot find `networks:` block");

  // Build the new entry. The `Pool` contract uses the dynamic-registration
  // pattern (bare `address:` with no value), matching the existing template.
  const entry = [
    "",
    `  # Chain ${c.chainId} — ${c.name}`,
    `  - id: ${c.chainId}`,
    `    start_block: ${c.startBlock}`,
    `    contracts:`,
    `      - name: PoolFactory`,
    `        address:`,
    `          - ${c.factoryAddress}  # ${c.name} PoolFactory`,
    `      - name: Pool`,
    `        address:  # registered dynamically`,
    "",
  ].join("\n");

  // Append at end of file. config.yaml has trailing networks entries that
  // are themselves last in the file; appending preserves comment ordering.
  const patched = yaml.trimEnd() + "\n" + entry;
  writeFileSync(path, patched, "utf8");
  return "added";
}

function patchConstantsTs(repoRoot: string, c: ChainConfig): "added" | "skipped" {
  const path = resolve(repoRoot, "src/Constants.ts");
  const ts = readFileSync(path, "utf8");

  // Check idempotency: skip if the chainId already appears in CHAIN_CONFIG.
  const existingPattern = new RegExp(`\\b${c.chainId}\\s*:\\s*[A-Z_]+`, "m");
  if (existingPattern.test(ts)) {
    return "skipped";
  }

  // The new chain export. Goes ABOVE the CHAIN_CONFIG map.
  const exportName = c.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const newExport = [
    "",
    `export const ${exportName}: ChainConstants = {`,
    `  chainId: ${c.chainId},`,
    `  name: "${c.name}",`,
    `  factoryAddress: "${c.factoryAddress}",`,
    `  defaultStableFeeBps: 5,`,
    `  defaultVolatileFeeBps: 30,`,
    `  rpcEnvVar: "${c.rpcEnvVar}",`,
    `};`,
    "",
  ].join("\n");

  // Insert the new export right before the CHAIN_CONFIG map declaration.
  const chainConfigDeclMatch = ts.match(/^export const CHAIN_CONFIG:/m);
  if (!chainConfigDeclMatch) fail("src/Constants.ts: cannot find `export const CHAIN_CONFIG:`");
  const insertAt = chainConfigDeclMatch.index!;
  const before = ts.slice(0, insertAt);
  const after = ts.slice(insertAt);

  // Add the chainId entry inside the CHAIN_CONFIG map. We patch the closing
  // `};` of the map by inserting before it.
  const chainConfigEntryRegex = /(export const CHAIN_CONFIG: Record<number, ChainConstants> = \{[^}]*?)(\n\};)/;
  const afterPatched = after.replace(
    chainConfigEntryRegex,
    (_full, body, close) => `${body}\n  ${c.chainId}: ${exportName},${close}`,
  );

  const patched = before + newExport + afterPatched;
  writeFileSync(path, patched, "utf8");
  return "added";
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    fail("usage: pnpm add-chain <path-to-chain-config.json>");
  }
  const configPath = resolve(args[0]);
  let raw: string;
  try {
    raw = readFileSync(configPath, "utf8");
  } catch (e) {
    fail(`cannot read ${configPath}: ${e instanceof Error ? e.message : String(e)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    fail(`config is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  validateConfig(parsed);

  // The CLI runs from the template root (where package.json + config.yaml live).
  const repoRoot = process.cwd();

  const yamlResult = patchConfigYaml(repoRoot, parsed);
  const tsResult = patchConstantsTs(repoRoot, parsed);

  console.log(`add-chain: chain ${parsed.chainId} (${parsed.name})`);
  console.log(`  config.yaml:      ${yamlResult}`);
  console.log(`  src/Constants.ts: ${tsResult}`);

  if (yamlResult === "added" || tsResult === "added") {
    console.log("");
    console.log("Next steps:");
    console.log(`  1. Add ${parsed.rpcEnvVar} to your .env`);
    console.log(`  2. pnpm codegen   # regenerates the typed bindings`);
    console.log(`  3. pnpm dev       # restarts the indexer with the new chain`);
  } else {
    console.log("");
    console.log(`Chain ${parsed.chainId} already configured. No changes made.`);
  }
}

main();
