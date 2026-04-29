#!/usr/bin/env node
/**
 * add-chain — multi-chain expansion CLI for the PM template.
 *
 * Implements ENVIO_MULTICHAIN_EXPANSION_RUNBOOK.md as a deterministic,
 * idempotent CLI. Reads a chain config JSON, patches config.yaml and
 * src/Constants.ts.
 *
 * USAGE
 *   pnpm add-chain <path-to-chain-config.json>
 *
 * INPUT FORMAT (JSON)
 *   {
 *     "chainId": 11155111,
 *     "name": "sepolia",
 *     "factoryAddress": "0x...",
 *     "startBlock": 5_000_000,
 *     "rpcEnvVar": "ENVIO_SEPOLIA_RPC_URL"
 *   }
 *
 * IDEMPOTENT — re-running with the same config is a no-op.
 *
 * Implementation note: this CLI is a near-copy of the DEX template's
 * add-chain CLI; the differences are (a) ChainConstants shape (no
 * factoryAddress, no fee fields — those live in config.yaml or are
 * PM-specific elsewhere) and (b) the `MarketFactory` contract name in
 * the YAML patcher (vs DEX's `PoolFactory`).
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

  if (new RegExp(`^\\s+- id:\\s*${c.chainId}\\b`, "m").test(yaml)) return "skipped";
  if (!/^networks:\s*$/m.test(yaml)) fail("config.yaml: cannot find `networks:` block");

  const entry = [
    "",
    `  # Chain ${c.chainId} — ${c.name}`,
    `  - id: ${c.chainId}`,
    `    start_block: ${c.startBlock}`,
    `    contracts:`,
    `      - name: MarketFactory`,
    `        address:`,
    `          - ${c.factoryAddress}  # ${c.name} MarketFactory`,
    `      - name: Market`,
    `        address:  # registered dynamically`,
    "",
  ].join("\n");

  writeFileSync(path, yaml.trimEnd() + "\n" + entry, "utf8");
  return "added";
}

function patchConstantsTs(repoRoot: string, c: ChainConfig): "added" | "skipped" {
  const path = resolve(repoRoot, "src/Constants.ts");
  const ts = readFileSync(path, "utf8");

  if (new RegExp(`\\b${c.chainId}\\s*:\\s*[A-Z_]+`, "m").test(ts)) return "skipped";

  const exportName = c.name.toUpperCase().replace(/[^A-Z0-9]/g, "_");
  const newExport = [
    "",
    `export const ${exportName}: ChainConstants = {`,
    `  chainId: ${c.chainId},`,
    `  name: "${c.name}",`,
    `  rpcEnvVar: "${c.rpcEnvVar}",`,
    `};`,
    "",
  ].join("\n");

  const chainConfigDeclMatch = ts.match(/^export const CHAIN_CONFIG:/m);
  if (!chainConfigDeclMatch) fail("src/Constants.ts: cannot find `export const CHAIN_CONFIG:`");
  const insertAt = chainConfigDeclMatch.index!;
  const before = ts.slice(0, insertAt);
  const after = ts.slice(insertAt);

  const afterPatched = after.replace(
    /(export const CHAIN_CONFIG: Record<number, ChainConstants> = \{[^}]*?)(\n\};)/,
    (_full, body, close) => `${body}\n  ${c.chainId}: ${exportName},${close}`,
  );

  writeFileSync(path, before + newExport + afterPatched, "utf8");
  return "added";
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length !== 1) fail("usage: pnpm add-chain <path-to-chain-config.json>");
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
