// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/UniswapV2Adapter.sol";

/// @notice Minimal WETH9 interface for wrapping ETH during setup.
interface IWETH9 {
    function deposit() external payable;
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title DeployAllSepolia
 * @notice One-shot deployment of Mirror Protocol + UniswapV2Adapter on Ethereum Sepolia.
 * @dev Run:
 *        forge script script/DeployAllSepolia.s.sol:DeployAllSepolia \
 *          --rpc-url sepolia --broadcast --legacy --verify
 *
 * Required env vars (set before broadcast):
 *   DEPLOYER_PRIVATE_KEY    0x-prefixed 32-byte private key of the deployer
 *   SEPOLIA_UNISWAP_V2_ROUTER (optional, defaults to canonical 0xeE567Fe1...)
 *   SEPOLIA_WETH              (optional, defaults to canonical 0xfFf99767...)
 *   SEPOLIA_TOKEN_B           (optional, defaults to Sepolia USDC 0x1c7D4B19...)
 *
 * The defaults below were verified live on Sepolia during plan A0 (see PLAN_REAL_CPAMM.md §3).
 *
 * This script:
 *   1. Deploys BehavioralNFT, DelegationRouter, ExecutionEngine, PatternDetector
 *   2. Deploys UniswapV2Adapter(router, WETH, USDC)
 *   3. Wires Router -> ExecutionEngine
 *   4. Mints 7 seed patterns (same set as DeployAll.s.sol)
 *   5. Wires NFT -> real PatternDetector, adds deployer as executor
 *   6. Wraps 0.1 Sepolia ETH -> WETH from the deployer wallet
 *   7. Transfers the 0.1 WETH to the ExecutionEngine as its trading float
 *   8. Calls engine.approveToken(WETH, adapter, max) so the adapter can pull WETH
 *
 * After this runs, `executor-bot/bot.mjs` can call executeTrade with callData =
 * encodeCall(adapter.swap, (WETH, amount, 0, executionEngine)) and a real swap
 * will hit the Sepolia Uniswap V2 WETH/USDC pool (pair 0x72e46e15...).
 */
contract DeployAllSepolia is Script {
    // Verified-live Sepolia defaults (overridable via env).
    address constant DEFAULT_ROUTER = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;
    address constant DEFAULT_WETH   = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant DEFAULT_USDC   = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    // ETH to wrap into WETH as the ExecutionEngine's initial trading float.
    uint256 constant INITIAL_WETH_FLOAT = 0.1 ether;

    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_PRIVATE_KEY"));
        address deployer = vm.addr(deployerPrivateKey);

        // Env-overridable addresses with verified-live fallbacks.
        address router = _envAddressOr("SEPOLIA_UNISWAP_V2_ROUTER", DEFAULT_ROUTER);
        address weth   = _envAddressOr("SEPOLIA_WETH",              DEFAULT_WETH);
        address usdc   = _envAddressOr("SEPOLIA_TOKEN_B",           DEFAULT_USDC);

        console.log("==================================================");
        console.log("MIRROR PROTOCOL - SEPOLIA DEPLOYMENT");
        console.log("==================================================");
        console.log("Deployer:   ", deployer);
        console.log("Chain ID:   ", block.chainid);
        console.log("Balance:    ", deployer.balance);
        console.log("Router:     ", router);
        console.log("WETH:       ", weth);
        console.log("TokenB:     ", usdc);
        console.log("==================================================");

        require(block.chainid == 11155111, "Not Sepolia");
        require(deployer.balance >= INITIAL_WETH_FLOAT + 0.05 ether, "Fund deployer >= 0.15 ETH");

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. Deploy BehavioralNFT ──
        BehavioralNFT nft = new BehavioralNFT(deployer);
        console.log("\n[1/6] BehavioralNFT:  ", address(nft));

        // ── 2. Deploy DelegationRouter ──
        DelegationRouter delegationRouter = new DelegationRouter(address(nft), deployer);
        console.log("[2/6] DelegationRouter:", address(delegationRouter));

        // ── 3. Deploy ExecutionEngine ──
        ExecutionEngine engine = new ExecutionEngine(address(delegationRouter), address(nft));
        console.log("[3/6] ExecutionEngine: ", address(engine));

        // ── 4. Deploy PatternDetector ──
        PatternDetector detector = new PatternDetector(address(nft));
        console.log("[4/6] PatternDetector: ", address(detector));

        // ── 5. Deploy UniswapV2Adapter ──
        UniswapV2Adapter adapter = new UniswapV2Adapter(
            IUniswapV2Router02(router),
            IERC20(weth),
            IERC20(usdc)
        );
        console.log("[5/6] UniswapV2Adapter:", address(adapter));

        // ── 6. Wire Router -> ExecutionEngine ──
        delegationRouter.setExecutionEngine(address(engine));
        console.log("\n--- Wiring: DelegationRouter.setExecutionEngine OK");

        // ── 7. Temporarily set deployer as patternDetector and seed strategies ──
        _seedPatterns(nft, deployer);

        // ── 10. Wire real PatternDetector and add deployer as executor ──
        nft.setPatternDetector(address(detector));
        console.log("\n--- Wiring: NFT -> real PatternDetector set");
        engine.addExecutor(deployer);
        console.log("--- Wiring: deployer added as executor");

        // ── 11. Wrap ETH -> WETH and fund ExecutionEngine ──
        IWETH9 wethContract = IWETH9(weth);
        wethContract.deposit{value: INITIAL_WETH_FLOAT}();
        wethContract.transfer(address(engine), INITIAL_WETH_FLOAT);
        console.log("\n--- Funded ExecutionEngine with WETH:", INITIAL_WETH_FLOAT);

        // ── 12. Approve the adapter to pull WETH from the ExecutionEngine ──
        engine.approveToken(IERC20(weth), address(adapter), type(uint256).max);
        console.log("--- ExecutionEngine.approveToken(WETH, adapter, MAX) OK");

        vm.stopBroadcast();

        // ── Summary ──
        console.log("\n==================================================");
        console.log("SEPOLIA DEPLOYMENT COMPLETE");
        console.log("==================================================");
        console.log("BehavioralNFT:      ", address(nft));
        console.log("DelegationRouter:   ", address(delegationRouter));
        console.log("ExecutionEngine:    ", address(engine));
        console.log("PatternDetector:    ", address(detector));
        console.log("UniswapV2Adapter:   ", address(adapter));
        console.log("Router (Uniswap V2):", router);
        console.log("WETH:               ", weth);
        console.log("TokenB (USDC):      ", usdc);
        console.log("Total Patterns:     ", nft.totalPatterns());
        console.log("==================================================");
        console.log("\nCopy these into .env:");
        console.log("SEPOLIA_BEHAVIORAL_NFT_ADDRESS=", address(nft));
        console.log("SEPOLIA_DELEGATION_ROUTER_ADDRESS=", address(delegationRouter));
        console.log("SEPOLIA_EXECUTION_ENGINE_ADDRESS=", address(engine));
        console.log("SEPOLIA_PATTERN_DETECTOR_ADDRESS=", address(detector));
        console.log("SEPOLIA_UNISWAP_ADAPTER_ADDRESS=", address(adapter));
        console.log("==================================================");
    }

    function _envAddressOr(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) {
            return a;
        } catch {
            return fallbackAddr;
        }
    }

    /// @dev Extracted into a helper to keep run() under the stack-too-deep limit.
    ///      Mints 7 seed patterns and writes their performance metrics.
    function _seedPatterns(BehavioralNFT nft, address deployer) internal {
        nft.setPatternDetector(deployer);
        console.log("--- Wiring: deployer set as temporary patternDetector");
        console.log("\n--- Minting initial strategies ---");

        uint256 id;

        id = nft.mintPattern(
            deployer,
            "Momentum",
            abi.encode("RSI-based momentum strategy", uint256(70), uint256(30))
        );
        nft.updatePerformance(id, 8750, 10287 ether, 2870);
        console.log("  [1/7] Momentum id:", id);

        id = nft.mintPattern(
            deployer,
            "MeanReversion",
            abi.encode("Bollinger band mean reversion", uint256(20), uint256(2))
        );
        nft.updatePerformance(id, 9000, 5000 ether, 270);
        console.log("  [2/7] MeanReversion id:", id);

        id = nft.mintPattern(
            deployer,
            "Arbitrage",
            abi.encode("Cross-DEX arbitrage", uint256(5), uint256(100000e18))
        );
        nft.updatePerformance(id, 6667, 12000 ether, 4583);
        console.log("  [3/7] Arbitrage id:", id);

        id = nft.mintPattern(
            deployer,
            "Liquidity",
            abi.encode("Liquidity provision strategy", uint256(50), uint256(10000e18))
        );
        nft.updatePerformance(id, 8000, 1500 ether, 125);
        console.log("  [4/7] Liquidity id:", id);

        id = nft.mintPattern(
            deployer,
            "Yield",
            abi.encode("Yield farming optimizer", uint256(100), uint256(5000e18))
        );
        nft.updatePerformance(id, 8571, 10500 ether, 3900);
        console.log("  [5/7] Yield id:", id);

        id = nft.mintPattern(
            deployer,
            "Composite",
            abi.encode("Multi-strategy composite", uint256(3), uint256(25000e18))
        );
        nft.updatePerformance(id, 7500, 25000 ether, 1200);
        console.log("  [6/7] Composite id:", id);

        id = nft.mintPattern(
            deployer,
            "AdvancedMeanReversion",
            abi.encode("Advanced mean reversion with ML signals", uint256(20), uint256(50000e18))
        );
        nft.updatePerformance(id, 8200, 50000 ether, 2500);
        console.log("  [7/7] AdvancedMeanReversion id:", id);
    }
}
