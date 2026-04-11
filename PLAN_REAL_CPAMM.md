# Plan: Sepolia Pivot — Real Uniswap V2 Trades, Real Envio Indexing

Status: **awaiting user review before implementation**
Owner: Kaustubh
Scope: full pivot of Mirror Protocol from Monad Testnet (chain 10143) to Ethereum Sepolia (chain 11155111), with real Uniswap V2 swaps as the execution path.

> **This document supersedes the earlier "deploy our own CPAMM on Monad" plan.** That plan is dead — the user chose to pivot to Sepolia after I confirmed that no DEX is deployed on the current Monad testnet.

---

## 1. Why this plan exists

The user wants **real trades against real pools** in the Live Trading tab, indexed by Envio. After verifying on-chain that every DEX in the official `monad-crypto/protocols` GitHub registry has no code on the current Monad testnet (see §2), the user approved a full pivot to **Ethereum Sepolia**, where Uniswap V2 Router02 + Factory + WETH9 are **verified live on-chain** (see §3) and Envio HyperSync officially supports the network.

The outcome this plan delivers:
- Executor bot calls the **real Uniswap V2 Router02** on Sepolia and swaps real WETH for a real ERC20 through a real Uniswap pair.
- Every swap is indexed by a new Envio HyperIndex deployment reading Sepolia events.
- The frontend Live Trading tab shows those real trades, same `LiveExecutionFeed` component.
- The Monad side of the project continues to exist as archived history; it is not actively maintained post-pivot.

---

## 2. Why we're leaving Monad (Phase A0 evidence)

This is the failure paper trail so future-me doesn't repeat the investigation.

Against `https://testnet-rpc.monad.xyz` (chain 10143, block ~24.6M), every DEX from the canonical [`monad-crypto/protocols`](https://github.com/monad-crypto/protocols) GitHub registry returned `eth_getCode == "0x"`:

| Protocol                      | Address                                         | Result              |
| ----------------------------- | ------------------------------------------------ | ------------------- |
| Bean Exchange SpotRouter      | `0xCa810D095e90Daae6e867c19DF6D9A8C56db2c89`    | **no code**         |
| Ambient Dex                   | `0x88B96aF200c8a9c35442C8AC6cd3D22695AaE4F0`    | **no code**         |
| Uniswap V2 Router (Monad)     | `0xfB8e1C3b833f9E67a71C859a132cf783b645e436`    | **no code**         |
| Uniswap V3 Factory (Monad)    | `0x961235a9020b05c44df1026d956d1f4d78014276`    | **no code**         |
| Monorail Router               | `0x7B5dF408da2356e9Eecda0492104E758A2B6913d`    | **no code**         |
| Kuru Router                   | `0xc816865f172d640d93712C68a7E1F83F3fA63235`    | **no code**         |
| iZUMi swap                    | `0xF6FFe4f3FdC8BBb7F70FFD48e61f17D1e343dDfD`    | **no code**         |
| LFJ Router V1                 | `0x4faCe5b0EF2757Ceb9151D14C036A1135931C70E`    | **no code**         |
| LFJ LBRouter V2.2             | `0x18556DA13313f3532c54711497A8FedAC273220E`    | **no code**         |
| **Mirror BehavioralNFT**      | `0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26`    | **has code (8544B)** |
| **Mirror DelegationRouter**   | `0xd5499e0d781b123724dF253776Aa1EB09780AfBf`    | **has code (9985B)** |
| Multicall3 / Permit2          | canonical cross-chain addresses                   | **has code**         |

A 500-block traffic scan produced zero matches for any Uniswap V2/V3/Universal Router swap selectors. The public Monad testnet was reset since those DEXes were last deployed; protocol teams have not redeployed. Two-line reproducible proof:

```bash
curl -s -X POST https://testnet-rpc.monad.xyz -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0x4faCe5b0EF2757Ceb9151D14C036A1135931C70E","latest"]}'
# → {"jsonrpc":"2.0","result":"0x","id":1}    (LFJ Router V1 — no code)

curl -s -X POST https://testnet-rpc.monad.xyz -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["0xd5499e0d781b123724dF253776Aa1EB09780AfBf","latest"]}'
# → {"jsonrpc":"2.0","result":"0x608...",...}  (Mirror DelegationRouter — live)
```

---

## 3. Why Sepolia works (verified live)

Against `https://ethereum-sepolia-rpc.publicnode.com` (chain 11155111), all of these returned bytecode:

| Contract                     | Address                                          | Status        |
| ---------------------------- | ------------------------------------------------- | ------------- |
| **Uniswap V2 Router02**      | `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3`     | **live**      |
| **Uniswap V2 Factory**       | `0xF62c03E08ada871A0bEb309762E260a7a6a880E6`     | **live**      |
| **Uniswap V3 SwapRouter02**  | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E`     | **live**      |
| **WETH9 (canonical Sepolia)** | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`    | **live**      |

Source of the addresses: Uniswap official docs ([V2 deployments](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments)), verified on-chain by direct RPC probe.

**Envio HyperSync support for Sepolia** is confirmed in the [official supported networks page](https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks) at tier 🎒 (backpack — not production-tier, but functional for a testnet demo). HyperSync endpoint: `https://sepolia.hypersync.xyz` or `https://11155111.hypersync.xyz`. HyperIndex (the hosted indexer service) accepts any chain HyperSync supports.

The "behavioral liquidity" narrative in [`BLOG.md`](BLOG.md) currently sells Monad + Envio as a combination. On Sepolia the Monad-specific angle goes away, but the Envio angle stays strong — real Uniswap V2 + real behavioral indexing is actually a *more* concrete product story than "simulated trades on Monad."

---

## 4. The pivot, in one paragraph

Deploy Mirror Protocol's four contracts (`BehavioralNFT`, `DelegationRouter`, `ExecutionEngine`, `PatternDetector`) to Sepolia from scratch. Replace `MockDEX` with a thin `UniswapV2Adapter` contract that wraps `IUniswapV2Router02` and emits a `Swap` event whose signature matches what the executor bot expects. Reconfigure the Envio indexer to watch the Sepolia contracts at the new addresses, redeploy to a new HyperIndex endpoint (**the user pushes this to `envio-deploy` — I do not touch that branch**). Reconfigure the frontend to default to Sepolia (wagmi config already imports `sepolia` — chain list goes `[sepolia, monadTestnet]`). Reconfigure the executor bot to read Sepolia RPC and the new GraphQL endpoint. Keep the Monad deployment in place as dead state, not actively maintained.

---

## 5. Architectural decisions

### 5.1 Why a thin `UniswapV2Adapter` instead of calling Router02 directly

The executor bot currently calls `ExecutionEngine.executeTrade(TradeParams, PerformanceMetrics)` with:

```
TradeParams = { delegationId, token, amount, targetContract, callData }
```

`ExecutionEngine._externalCall` at [contracts/ExecutionEngine.sol:526-534](contracts/ExecutionEngine.sol#L526-L534) does `target.call(data)` with **no value forwarding and no automatic token transfer**. This means:

1. **ExecutionEngine** is `msg.sender` to whatever `targetContract` we call. Router02's `swapExactTokensForTokens` would then try to `transferFrom(ExecutionEngine, ...)` — which requires the engine to both **hold WETH** and **have approved Router02** to spend it.
2. Router02's payable `swapExactETHForTokens` would require value forwarding which `_externalCall` does not do. Unusable without a contract change.

Options considered:
- **(A)** Modify `_externalCall` to forward `msg.value`. Rejected — touches production execution path.
- **(B)** Have the bot pre-approve Router02 from the ExecutionEngine address via a new `approveToken` admin function on ExecutionEngine. Works, but requires a new admin function which means redeploying ExecutionEngine anyway — which we're already doing as part of the Sepolia pivot, so this cost is zero.
- **(C)** **Thin adapter contract.** Deploy `UniswapV2Adapter(router, tokenA, tokenB)` that:
  - Holds a small WETH float (funded by deployer during setup).
  - Exposes `swap(uint256 amountIn, uint256 minAmountOut, address to)`.
  - Internally calls `router.swapExactTokensForTokens` against its own balance.
  - Emits a rich `Swap(sender, tokenIn, tokenOut, amountIn, amountOut, to)` event that Envio can index cleanly.
  - Is self-contained — the ExecutionEngine doesn't need to know anything about Uniswap.

**Choosing (C)** because it contains Uniswap-specific concerns to one small contract, keeps the ExecutionEngine unchanged except for the redeploy, gives us a clean `Swap` event to index in Envio (the Uniswap V2 Pair `Swap` event uses `amount0In/amount1In` fields which are clunky to display), and is trivial to swap out later if we want to move to V3 or a different aggregator.

### 5.2 Token pair: WETH ↔ UNI (or similar well-known Sepolia ERC20)

Uniswap V2 on Sepolia has liquid pairs for several tokens. The plan is:
- **tokenA = WETH** (`0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`) — we wrap real Sepolia ETH once at setup.
- **tokenB = UNI token on Sepolia** (verify address during §7-step-1 on-chain probe; use the most-liquid pair on the V2 factory).

Fallback if UNI/WETH pool has thin liquidity: try USDC/WETH or any other pair `factory.getPair(weth, candidate)` returns as live. This is an **on-chain discovery step** done before any code is written — same A0 methodology I used for Monad, but this time expecting it to succeed.

### 5.3 Envio indexer: new HyperIndex deployment, not a second network on the existing one

Adding Sepolia as a second `networks:` entry in the existing `src/envio/config.yaml` would break the live Monad indexer because the schema is shared and the Sepolia contracts have different addresses. Cleaner approach: **new config targeting only Sepolia, new HyperIndex deployment, new GraphQL endpoint**. The existing Monad indexer stays untouched and keeps running (fulfilling the "don't touch envio-deploy" rule — the new deployment goes to a new branch or a new subdirectory that the user deploys separately).

**Critical constraint:** I still do not touch the `envio-deploy` branch myself. I land the new config on `main` in a new directory (e.g. `src/envio-sepolia/`) and hand it off to the user to deploy.

### 5.4 Contract identity strategy

Redeploying the four Mirror contracts on Sepolia produces **new addresses**. Two consequences:
1. The Monad indexer is effectively orphaned; it keeps working but the frontend stops pointing at it.
2. Past Monad trade history is not migrated. Fresh chain = fresh state.

This is acceptable per the user's decision. The point of the pivot is real DEX execution; historical trade count is not a deliverable.

---

## 6. Files to change

### 6.1 Smart contracts

**`contracts/UniswapV2Adapter.sol`** — **NEW**. Thin wrapper around `IUniswapV2Router02`. ~80 lines.

```solidity
contract UniswapV2Adapter {
    using SafeERC20 for IERC20;

    IUniswapV2Router02 public immutable router;
    IERC20 public immutable tokenA;  // WETH
    IERC20 public immutable tokenB;  // UNI or USDC

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );

    constructor(IUniswapV2Router02 _router, IERC20 _tokenA, IERC20 _tokenB) {
        router = _router;
        tokenA = _tokenA;
        tokenB = _tokenB;
        // One-time max approvals to the router for both legs
        _tokenA.forceApprove(address(_router), type(uint256).max);
        _tokenB.forceApprove(address(_router), type(uint256).max);
    }

    function swap(
        IERC20 tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "bad tokenIn");
        IERC20 tokenOut = tokenIn == tokenA ? tokenB : tokenA;

        tokenIn.safeTransferFrom(msg.sender, address(this), amountIn);

        address[] memory path = new address[](2);
        path[0] = address(tokenIn);
        path[1] = address(tokenOut);

        uint256[] memory amounts = router.swapExactTokensForTokens(
            amountIn,
            minAmountOut,
            path,
            to,
            block.timestamp + 300
        );

        amountOut = amounts[1];
        emit Swap(msg.sender, address(tokenIn), address(tokenOut), amountIn, amountOut, to);
    }
}
```

Key properties:
- Uses `safeTransferFrom` so `msg.sender` (which will be ExecutionEngine during a trade) keeps full control of how much it spends.
- Sends swap output directly to `to` — no adapter-side balance accumulation to manage.
- Emits a semantically clean `Swap` event indexable by Envio.
- Constructor approvals are a one-time setup cost; no ongoing approval management.

**`contracts/MockDEX.sol`** — **unchanged**. Still exists for the Monad deployment, not used on Sepolia.

**`contracts/ExecutionEngine.sol`** — add `approveToken(IERC20 token, address spender, uint256 amount) external onlyOwner` so the deployer can approve the new `UniswapV2Adapter` to pull WETH from the engine. ~8 lines. Required because the engine is `msg.sender` to the adapter during trades and the adapter calls `safeTransferFrom(ExecutionEngine, adapter, amountIn)`.

**`contracts/BehavioralNFT.sol`**, **`contracts/PatternDetector.sol`**, **`contracts/DelegationRouter.sol`** — **unchanged code**, fresh deployment on Sepolia.

### 6.2 Deploy scripts

**`script/DeployAllSepolia.s.sol`** — **NEW**. Based on the structure of [`script/DeployAll.s.sol`](script/DeployAll.s.sol), but:
1. Deploys all four Mirror contracts (`BehavioralNFT`, `DelegationRouter`, `ExecutionEngine`, `PatternDetector`).
2. Wires them (`setExecutionEngine`, `setPatternDetector`, `addExecutor`, etc.).
3. Deploys `UniswapV2Adapter(sepoliaRouter02, WETH, UNI)` — addresses passed via env vars.
4. Calls `executionEngine.approveToken(WETH, adapter, type(uint256).max)`.
5. Wraps 0.1 Sepolia ETH → WETH from the deployer wallet, sends it to the ExecutionEngine as the initial trading float.
6. Mints the same 7 initial patterns that [`DeployAll.s.sol:67-116`](script/DeployAll.s.sol#L67-L116) mints.
7. Logs all addresses in a `.env`-copy-paste-ready block at the end.

**`script/DeployAll.s.sol`** — **unchanged**. Still usable for Monad redeploys if ever needed.

### 6.3 Envio indexer

**`src/envio-sepolia/`** — **NEW directory**, mirroring the structure of [`src/envio/`](src/envio/). Contents:
- **`config.yaml`** — chain `11155111`, start block set at Sepolia deploy block, watches the new Sepolia `BehavioralNFT` + `DelegationRouter` + the new `UniswapV2Adapter` (for `Swap` events).
- **`schema.graphql`** — copied from [`src/envio/schema.graphql`](src/envio/schema.graphql), add a `PoolSwap` entity for the adapter's `Swap` event so the frontend can show real swap details (tokenIn, tokenOut, amountIn, amountOut).
- **`src/EventHandlers.ts`** — copied from [`src/envio/src/EventHandlers.ts`](src/envio/src/EventHandlers.ts), add a `UniswapV2Adapter.Swap` handler that creates `PoolSwap` entities.
- **`package.json`**, **`envio.yaml`**-generation artifacts, etc. — copied from the existing indexer.

**User deploys this to a new Envio HyperIndex endpoint** off a new branch (e.g. `envio-deploy-sepolia`). **I do not push.** The resulting GraphQL URL becomes `VITE_ENVIO_GRAPHQL_URL_SEPOLIA` in frontend env.

[`src/envio/`](src/envio/) is **not modified** — the Monad indexer keeps running as-is, orphaned but alive.

### 6.4 Executor bot

**`executor-bot/bot.mjs`** — substantial edits:
- Rename `MONAD_CHAIN` → `CHAIN`, set `id: 11155111`, `name: 'Sepolia'`, `nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH' }`, RPC from `ENV.SEPOLIA_RPC_URL`.
- Update `GRAPHQL_ENDPOINT` fallback to the new Sepolia endpoint (or require it via env).
- Update `CONTRACTS` with new Sepolia addresses: `EXECUTION_ENGINE`, `DELEGATION_ROUTER`, `BEHAVIORAL_NFT`, plus new keys `UNISWAP_ADAPTER`, `WETH`, `UNI`.
- Add `DEX_ADAPTER_ABI` (just the `swap` function).
- Replace `tradeParams` construction at [lines 269-282](executor-bot/bot.mjs#L269-L282) to encode `adapter.swap(WETH, 0.001e18, 0n, ExecutionEngine)`.
- Keep trade amount small (`0.001 WETH`) since the ExecutionEngine holds only 0.1 WETH float initially.

### 6.5 Frontend

[`src/frontend/lib/wagmi.ts`](src/frontend/lib/wagmi.ts) — **already imports `sepolia` and has `[monadTestnet, sepolia]`**. Only change: reorder to `[sepolia, monadTestnet]` so Sepolia is the default chain. (~1 line change.)

[`src/frontend/src/contracts/config.ts`](src/frontend/src/contracts/config.ts) — the big one:
- Add `export const SEPOLIA_CHAIN_ID = 11155111;`
- Add `SEPOLIA_CONTRACTS = { BEHAVIORAL_NFT, DELEGATION_ROUTER, PATTERN_DETECTOR, EXECUTION_ENGINE, UNISWAP_ADAPTER, WETH, UNI }` with new addresses.
- Add `SEPOLIA_RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com'` (or whatever default).
- Add `SEPOLIA_ENVIO_GRAPHQL_URL = import.meta.env.VITE_ENVIO_GRAPHQL_URL_SEPOLIA || '<new endpoint>'`.
- Keep `MONAD_CHAIN_ID`, `CONTRACTS` etc. as fallbacks for any hook that still wants to read Monad history — or prune them in a cleanup pass at the end.
- Export a "default active chain" constant the rest of the app imports so we flip Monad → Sepolia at one place.

[`src/frontend/src/App.tsx`](src/frontend/src/App.tsx) — change `isCorrectChain` check at line 36 to use the new active-chain constant. Update the "Please switch to Monad Testnet" message at line 107 to say "Sepolia". Update the footer text at line 539.

[`src/frontend/src/hooks/useLiveExecutions.ts`](src/frontend/src/hooks/useLiveExecutions.ts) — point at the Sepolia GraphQL endpoint via the new `SEPOLIA_ENVIO_GRAPHQL_URL`.

All other hooks (`useDelegations`, `useUserStats`, `usePatterns`, `useCreateDelegation`, etc.) use the `CONTRACTS` object from `contracts/config.ts` — they inherit the new addresses automatically once `config.ts` is updated.

[`src/frontend/src/components/LiveExecutionFeed.tsx`](src/frontend/src/components/LiveExecutionFeed.tsx) — change `EXPLORER_URL` at line 6 to `https://sepolia.etherscan.io`.

### 6.6 Env + docs

**`.env.example`** — add:
```
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SEPOLIA_CHAIN_ID=11155111
# Sepolia Uniswap V2 infrastructure (hardcoded — already verified live)
SEPOLIA_UNISWAP_V2_ROUTER=0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3
SEPOLIA_UNISWAP_V2_FACTORY=0xF62c03E08ada871A0bEb309762E260a7a6a880E6
SEPOLIA_WETH=0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
SEPOLIA_UNI=<fill after on-chain discovery>
# Sepolia Mirror Protocol (fill after deploy)
SEPOLIA_BEHAVIORAL_NFT_ADDRESS=
SEPOLIA_DELEGATION_ROUTER_ADDRESS=
SEPOLIA_PATTERN_DETECTOR_ADDRESS=
SEPOLIA_EXECUTION_ENGINE_ADDRESS=
SEPOLIA_UNISWAP_ADAPTER_ADDRESS=
# Sepolia Envio (fill after user deploys indexer)
VITE_ENVIO_GRAPHQL_URL_SEPOLIA=
```

**`.env`** — same keys, populated during deploy. Do **not** remove existing Monad keys — they remain as reference for the orphaned Monad deployment.

**`foundry.toml`** — already has `sepolia = "${SEPOLIA_RPC_URL}"` at line 32. No changes needed.

**`CLAUDE.md`, `BLOG.md`, `BLOG_FINAL.md`, `docs/ARCHITECTURE.md`, `README.md`** — documentation updates are **out of scope for this plan**. Track them as a follow-up; the priority here is working code.

---

## 7. Execution order with hard gates

Every gate must be green before proceeding. **Do not skip forward.**

1. **On-chain discovery (read-only, no code yet)** — write a throwaway node script that calls `factory.getPair(WETH, candidate)` on the Sepolia Uniswap V2 Factory for a list of candidate ERC20s (UNI, USDC, DAI, LINK, WBTC). For each pair that exists, read `getReserves` and pick the one with the most WETH reserve. Output: the chosen `tokenB` address. Delete script after.
2. **Write `UniswapV2Adapter.sol`**. Use OpenZeppelin's `SafeERC20`. Compile with `forge build`. **Must be green.**
3. **Add `approveToken` admin function to `ExecutionEngine.sol`**. `forge build` must stay green.
4. **`forge test`** — existing tests must pass unchanged (they use their own in-file MockDEX and don't touch UniswapV2Adapter). **Must be green.**
5. **Write `script/DeployAllSepolia.s.sol`**. Reference [`script/DeployAll.s.sol`](script/DeployAll.s.sol) for wiring pattern. `forge build` must stay green.
6. **HARD STOP — user approval gate #1.** Before broadcasting to Sepolia, show the user:
    - Green `forge build` + `forge test` output.
    - Exact deployer address that will sign.
    - Estimated gas cost in Sepolia ETH.
    - List of contracts being deployed (8 deploys: 4 Mirror contracts + 1 adapter + 1 PatternDetector + wiring + initial patterns + WETH wrap + ExecutionEngine funding).
    - Confirmation that no existing Monad contracts are being touched.
7. **Deploy**: `forge script script/DeployAllSepolia.s.sol:DeployAllSepolia --rpc-url sepolia --broadcast --legacy --verify`. Capture addresses.
8. **Populate `.env`** with new Sepolia addresses.
9. **Post-deploy sanity** (read-only `cast call` checks):
    - `executionEngine.owner()` → deployer
    - `executionEngine.isExecutor(deployer)` → true
    - `WETH.balanceOf(executionEngine)` → ≥ 0.1e18
    - `WETH.allowance(executionEngine, uniswapV2Adapter)` → `type(uint256).max`
    - `uniswapV2Adapter.router()` → Sepolia Router02
    - `behavioralNFT.totalPatterns()` → 7
10. **Create `src/envio-sepolia/`** by copying `src/envio/` and editing for Sepolia. `pnpm envio dev` locally to confirm it syncs and the schema is valid.
11. **HARD STOP — user approval gate #2.** Show the user:
    - The new `src/envio-sepolia/` config diff summary.
    - Confirmation that I have NOT touched the existing `src/envio/` or pushed anything.
    - Instructions for the user to deploy `src/envio-sepolia/` to a new HyperIndex endpoint (new branch, e.g. `envio-deploy-sepolia`, which the user creates and pushes themselves).
12. **User deploys Envio Sepolia indexer**, reports the new GraphQL URL back.
13. **Update `executor-bot/bot.mjs`** with new chain config, addresses, GraphQL URL, and adapter swap encoding. Run a single dry cycle with debug logging (`node executor-bot/bot.mjs` with active delegation present) — confirm it produces a real tx hash and the tx succeeds on Sepolia Etherscan.
14. **Update frontend config** (`config.ts`, `wagmi.ts`, `App.tsx`, `LiveExecutionFeed.tsx`, `useLiveExecutions.ts`). `pnpm dev` locally, connect MetaMask to Sepolia, verify:
    - "Please switch to Sepolia" banner works when on the wrong chain.
    - Create a delegation on Sepolia via the UI.
    - Run the bot once; confirm `LiveExecutionFeed` shows the new trade within 5s.
    - Click the tx hash in the feed; Etherscan shows a real Uniswap V2 swap.
15. **Production deploy** of the frontend (Vercel). Update `VITE_ENVIO_GRAPHQL_URL_SEPOLIA` env var in the Vercel dashboard. Smoke-test the live site.

---

## 8. Rollback plan

The Sepolia pivot is **additive** during implementation — the Monad deployment is not touched until the very end. Rollback at any gate is trivial:

- **Gates 1-5 (local code)**: `git checkout .` restores everything.
- **Gate 7 (Sepolia deploy)**: the contracts exist on Sepolia but nothing in the live app references them. Ignoring them costs $0.
- **Gate 13 (bot pointed at Sepolia)**: revert `executor-bot/bot.mjs` to its old `CONTRACTS` block and it's back on Monad.
- **Gate 14 (frontend flipped to Sepolia)**: revert `src/frontend/src/contracts/config.ts` and it's back on Monad.
- **Gate 15 (Vercel)**: the Vercel "revert" button restores the previous deployment.

The old Monad-facing Envio indexer at `https://indexer.dev.hyperindex.xyz/4cda827/v1/graphql` is **never touched**. The old Monad contracts at `0x6943e7D3...`, `0xd5499e0d...`, `0x4364457...` are **never touched**. Worst case = orphaned Sepolia contracts.

---

## 9. Risks and mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Sepolia ETH faucet rate limits slow down deploy | Start with a single well-funded deployer wallet (≥ 0.5 Sepolia ETH) verified before §7-step-7. If short, use multiple faucets in parallel. |
| 2 | Chosen `tokenB` pool has low liquidity, swap reverts with "INSUFFICIENT_OUTPUT" | §7-step-1 picks the highest-liquidity pool by `getReserves`. If the swap still reverts, fall back to a smaller `amountIn`. |
| 3 | HyperSync Sepolia tier (🎒) has higher latency than Monad tier | Acceptable for demo. If latency is visibly bad in the Live Feed, bump the frontend poll interval from 5s to 10s. |
| 4 | User is unable to push to new `envio-deploy-sepolia` branch for some reason | Plan explicitly pauses at gate 11 for the user to handle. Implementation continues at gate 13 only after the user reports a working GraphQL endpoint. |
| 5 | `DeployAllSepolia.s.sol` mints 7 patterns via `setPatternDetector(deployer)` trick at [DeployAll.s.sol:63-140](script/DeployAll.s.sol#L63-L140) — if PatternDetector enforces a cooldown, this fails | Mirror the existing pattern: set deployer as `patternDetector`, mint all 7, then swap to the real PatternDetector. Already works on Monad; same code should work on Sepolia. |
| 6 | ExecutionEngine's [balance check at L504-507](contracts/ExecutionEngine.sol#L504-L507) requires the delegation's smart account to hold the input token | Bot pre-funds smart accounts with WETH before executing (similar to the `faucetTo` pattern from the Monad CPAMM plan, but using a `wrapAndSend` helper in the bot since WETH has no faucet). |
| 7 | Gas on Sepolia is higher than Monad, ExecutionEngine trade gas limit of 2_000_000 at [bot.mjs:301](executor-bot/bot.mjs#L301) might be insufficient | Bump to 3_000_000 to be safe. Router02 swaps are ~150k gas so there's headroom either way. |
| 8 | `blog.md` mentions specific Monad metrics that become meaningless after pivot | Explicitly out of scope for this plan; tracked as a docs follow-up. |

---

## 10. Explicit non-goals

- Documentation updates (CLAUDE.md, BLOG.md, BLOG_FINAL.md, docs/**, README.md) — follow-up.
- Decommissioning or archiving the Monad deployment — it keeps running, dead-lettered.
- Indexing the Uniswap V2 Pair contracts directly for organic swap volume — we only index the `UniswapV2Adapter.Swap` events (our own swaps). Organic swap indexing is a Phase B style follow-up.
- Multi-hop swaps. WETH ↔ UNI single hop only.
- Migrating historical Monad delegation/pattern data to Sepolia. Fresh start.
- Frontend UI chrome changes beyond "switch Monad references to Sepolia."

---

## 11. Critical file reference

| File | Action | Notes |
|---|---|---|
| `contracts/UniswapV2Adapter.sol` | **create** | Thin wrapper around Sepolia Router02 |
| [contracts/ExecutionEngine.sol](contracts/ExecutionEngine.sol) | **edit + redeploy** | Add `approveToken` admin function |
| [contracts/BehavioralNFT.sol](contracts/BehavioralNFT.sol) | unchanged code, **redeploy to Sepolia** | |
| [contracts/PatternDetector.sol](contracts/PatternDetector.sol) | unchanged code, **redeploy to Sepolia** | |
| [contracts/DelegationRouter.sol](contracts/DelegationRouter.sol) | unchanged code, **redeploy to Sepolia** | |
| [contracts/MockDEX.sol](contracts/MockDEX.sol) | unchanged, unused on Sepolia | |
| `script/DeployAllSepolia.s.sol` | **create** | Based on [script/DeployAll.s.sol](script/DeployAll.s.sol) |
| [script/DeployAll.s.sol](script/DeployAll.s.sol) | unchanged | Monad version, preserved |
| `src/envio-sepolia/` | **create (directory)** | Mirror of `src/envio/` for Sepolia |
| [src/envio/](src/envio/) | **unchanged** | Monad indexer, orphaned |
| [executor-bot/bot.mjs](executor-bot/bot.mjs) | edit | New chain, addresses, adapter swap encoding |
| [src/frontend/lib/wagmi.ts](src/frontend/lib/wagmi.ts) | 1-line edit | Reorder chains so sepolia is default |
| [src/frontend/src/contracts/config.ts](src/frontend/src/contracts/config.ts) | edit | Add Sepolia constants, flip default active chain |
| [src/frontend/src/App.tsx](src/frontend/src/App.tsx) | edit | Chain check + user-facing copy |
| [src/frontend/src/hooks/useLiveExecutions.ts](src/frontend/src/hooks/useLiveExecutions.ts) | edit | Point at new GraphQL endpoint |
| [src/frontend/src/components/LiveExecutionFeed.tsx](src/frontend/src/components/LiveExecutionFeed.tsx) | 1-line edit | Etherscan URL |
| `.env.example`, `.env` | edit | Add Sepolia keys, keep Monad keys for reference |

---

## 12. Testing

Two-layer test harness at [test/run-sepolia-harness.sh](test/run-sepolia-harness.sh):

```bash
./test/run-sepolia-harness.sh
```

**Layer 1 — unit + integration tests (MockDEX, local EVM):**
`forge test --no-match-contract SepoliaPivot` → 143 tests across 7 suites. Runs the existing pre-pivot coverage over `BehavioralNFT`, `DelegationRouter`, `ExecutionEngine`, and `PatternDetector` using in-file `MockDEX` stubs. Fast (<1s), deterministic, no network required.

**Layer 2 — forked Sepolia integration test (real Uniswap V2):**
`forge test --match-contract SepoliaPivot --fork-url $SEPOLIA_RPC_URL -vv` → 4 tests in [test/SepoliaPivot.t.sol](test/SepoliaPivot.t.sol):

1. `test_AdapterIsWiredCorrectly` — asserts the live deploy wiring: engine.owner, executor role, WETH float present, adapter allowance is MAX, adapter points at the real Sepolia Uniswap V2 Router. One-shot sanity check; diagnose any pivot regression here first.
2. `test_SeededPatternsAreActive` — asserts pattern 1 and pattern 7 from the gate 7 seed set are still active and owned by the deployer.
3. `test_FullFlow_CreateDelegationAndExecuteRealSwap` — **the critical test.** Creates a fresh delegation as a `makeAddr`-derived EOA, funds the smart account with WETH (mirroring the bot's `ensureSmartAccountFunded` helper), builds the exact `tradeParams` + `callData` the bot would produce, executes the swap, and asserts the engine's WETH balance dropped by `TRADE_AMOUNT` and its USDC balance rose (real Uniswap V2 liquidity). Logs the realized WETH→USDC rate.
4. `test_ExecuteTrade_ReturnsFalseIfEngineUnderfunded` — drains the engine's WETH float inside the fork and asserts `executeTrade` returns `false` (not a revert — the engine wraps `_externalCall` in try/catch at [ExecutionEngine.sol:512-517](contracts/ExecutionEngine.sol#L512-L517) and swallows failures so bookkeeping continues).

The forked test uses `vm.createSelectFork` to snapshot live Sepolia into an in-memory EVM. **Nothing writes to real Sepolia; no Sepolia ETH is spent.** Runtime: ~14s dominated by the RPC fetch for the fork snapshot.

**Last verified run:** full harness green at commit after `a767a93`. The full-flow test showed `0.001 WETH → 8.26341 USDC` against real current Sepolia Uniswap V2 liquidity.

**Assumptions the forked tests make about live state:**
- `ExecutionEngine` at `0x1C1b05628...` still holds ≥ `TRADE_AMOUNT` (0.001 WETH) in its float
- `ExecutionEngine.allowance(adapter)` is still `type(uint256).max`
- The WETH/USDC Uniswap V2 pair at `0x72e46e15...` still has non-trivial reserves
- Pattern 1 (Momentum) is still active on the `BehavioralNFT` contract

If any of those drift, Layer 2 fails loudly with an actionable error message. Re-fund the engine's float via `WETH.deposit` + `WETH.transfer`, re-run, and the tests pass again.

---

## 13. Decision points requiring user sign-off before write-phase begins

1. **Approve §5.1 (thin UniswapV2Adapter) vs the alternative of modifying `_externalCall` to forward value.** Recommended: adapter.
2. **Approve §5.2 default pair (WETH/UNI with on-chain fallback to USDC or DAI).** Yes/no.
3. **Approve §5.3 (new `src/envio-sepolia/` directory + new HyperIndex deployment on a new branch that you push yourself).** Confirm you are willing and able to handle the envio-deploy-sepolia push — otherwise we stall at gate 12.
4. **Approve §6.1 `approveToken` admin function on ExecutionEngine** (small change, same pattern as `addExecutor`).
5. **Confirm deployer wallet has ≥ 0.5 Sepolia ETH** (or you'll fund it before gate 7). Without this the deploy stalls.
6. **Confirm the Monad deployment staying orphaned is acceptable** — it keeps running but the frontend/bot stop pointing at it. No cleanup required.

Once §12 is answered, I proceed on the execution order in §7 with hard stops at gates 6, 11, and before each mainnet/testnet broadcast.
