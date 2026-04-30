#!/usr/bin/env node
/**
 * add-chain — multi-chain expansion CLI for the money-market template.
 *
 * Same shape as the DEX, PM, and perp templates' add-chain scripts. Reads
 * a chain config JSON, deterministically patches config.yaml + Constants.ts,
 * idempotent on re-run.
 *
 * USAGE
 *   pnpm add-chain <path-to-chain-config.json>
 *
 * INPUT FORMAT (JSON)
 *   {
 *     "chainId": 1,
 *     "name": "ethereum",
 *     "factoryAddress": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
 *     "startBlock": 16291127,
 *     "rpcEnvVar": "ENVIO_ETHEREUM_RPC_URL"
 *   }
 *
 * Note: factoryAddress here is the Aave V3 Pool address for the chain.
 * The "factoryAddress" naming is consistent with the other templates'
 * CLIs even though Aave doesn't have a factory pattern (singleton Pool).
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
    fail(`factoryAddress (Aave Pool address) must be a 0x-prefixed 40-char hex address; got ${String(o.factoryAddress)}`);
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
    `      - name: Pool`,
    `        address:`,
    `          - ${c.factoryAddress}  # Aave V3 Pool on ${c.name}`,
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
