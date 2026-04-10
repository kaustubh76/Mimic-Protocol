# Mirror Protocol — Sepolia Envio Indexer

Self-contained Envio HyperIndex config for the Sepolia deployment of Mirror Protocol.

## Why this exists

The original `src/envio/` indexer targets the Monad testnet deployment at `0xd5499e0d...` etc. and is deployed to the live hosted endpoint `https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql`. That indexer must not be touched.

After the Sepolia pivot (see `PLAN_REAL_CPAMM.md` at the repo root), we deployed a fresh Mirror Protocol on Ethereum Sepolia. This directory is a standalone copy of the indexer config pointed at the new Sepolia contracts.

## What's inside

- `config.yaml` — network/chain/contract config for Sepolia (chain 11155111, start block 10633021)
- `schema.graphql` — identical to `src/envio/schema.graphql` (same entities)
- `src/EventHandlers.ts` — identical to `src/envio/src/EventHandlers.ts` (same event logic)
- `abis/` — identical to `src/envio/abis/` (contract code is unchanged between Monad and Sepolia, so ABIs match)
- `package.json` — same Envio version as the Monad indexer

## Sepolia contract addresses (indexed)

| Contract | Address |
|---|---|
| BehavioralNFT | `0xCFa22481dDa2E4758115D3e826C2FfA1eC9c3954` |
| DelegationRouter | `0xD36fB1E9537fa3b7b15B9892eb0E42A0226577a8` |
| ExecutionEngine | `0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A` |
| PatternDetector | `0x4C122A516930a5E23f3c31Db53Ee008a2720527E` |
| UniswapV2Adapter | `0x5B59f315d4E2670446ed7B130584A326A0f7c2D3` |

Only `BehavioralNFT` and `DelegationRouter` are watched by the indexer (same as the Monad config) because those are the two contracts that emit the events the frontend renders.

## How to deploy

This config is NOT automatically deployed. You deploy it yourself to a fresh HyperIndex hosted endpoint. Suggested steps:

1. Create a new branch off `main` — e.g. `envio-deploy-sepolia` — that contains this directory at the repo root (or under `envio/`, whatever Envio's hosted service prefers).
2. Push that branch to the project's GitHub remote.
3. In the Envio dashboard, create a new Indexer pointing at the branch + this directory.
4. Wait for the initial sync to catch up from block `10633021` (the deploy block) to head. With only ~500k blocks of history since deploy and two contracts with no pre-existing events, the sync should take seconds, not minutes.
5. Once the dashboard shows the indexer as live, copy the GraphQL endpoint URL.
6. Paste the endpoint URL into the project root `.env` as `VITE_ENVIO_GRAPHQL_URL_SEPOLIA=<url>`.
7. Report back to Claude so it can proceed with gate 13 (executor bot update) and gate 14 (frontend config update).

## Local test

To verify the config is valid before pushing:

```bash
cd src/envio-sepolia
pnpm install
pnpm envio dev
```

Open the local GraphQL explorer at `http://localhost:8080/` and run:

```graphql
{ SystemMetrics { totalPatterns activePatterns totalDelegations } }
```

Expected: `totalPatterns: 7` once the indexer catches up past block 10633021 (it should take a few seconds).
