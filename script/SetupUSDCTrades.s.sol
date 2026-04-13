// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../contracts/ExecutionEngine.sol";

/**
 * @title SetupUSDCTrades
 * @notice One-shot script to switch the trade direction from WETH→USDC to USDC→WETH.
 *
 * @dev Does two things:
 *   1. Calls engine.approveToken(USDC, adapter, MAX) so the adapter can pull
 *      USDC from the engine during swaps (same pattern as the WETH approval
 *      set during gate 7, but for the other side of the pair).
 *   2. Calls engine.recoverTokens(USDC, 100e6) which sends 100 USDC from the
 *      engine's accumulated balance to the owner (= deployer = executor EOA).
 *      This funds the executor's USDC balance so the engine's
 *      balanceOf(smartAccount) >= amount check passes when smartAccount ==
 *      executor (our current delegation setup).
 *
 *      Run with:
 *        forge script script/SetupUSDCTrades.s.sol:SetupUSDCTrades \
 *          --rpc-url sepolia --broadcast --legacy
 */
contract SetupUSDCTrades is Script {
    address constant DEFAULT_ENGINE  = 0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A;
    address constant DEFAULT_ADAPTER = 0x5B59f315d4E2670446ed7B130584A326A0f7c2D3;
    address constant DEFAULT_USDC    = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    // 100 USDC (6 decimals) - enough for 20 trades at 5 USDC each
    uint256 constant RECOVER_AMOUNT = 100_000_000;

    function run() external {
        uint256 pk = uint256(vm.envBytes32("DEPLOYER_PRIVATE_KEY"));
        address deployer = vm.addr(pk);

        ExecutionEngine engine = ExecutionEngine(_envAddressOr("SEPOLIA_EXECUTION_ENGINE_ADDRESS", DEFAULT_ENGINE));
        address adapter = _envAddressOr("SEPOLIA_UNISWAP_ADAPTER_ADDRESS", DEFAULT_ADAPTER);
        address usdc    = _envAddressOr("SEPOLIA_TOKEN_B", DEFAULT_USDC);

        uint256 engineUsdcBefore = IERC20(usdc).balanceOf(address(engine));
        uint256 executorUsdcBefore = IERC20(usdc).balanceOf(deployer);

        console.log("==================================================");
        console.log("SETUP USDC TRADES");
        console.log("==================================================");
        console.log("Deployer:            ", deployer);
        console.log("Engine:              ", address(engine));
        console.log("Adapter:             ", adapter);
        console.log("USDC:                ", usdc);
        console.log("Engine USDC before:  ", engineUsdcBefore);
        console.log("Executor USDC before:", executorUsdcBefore);
        console.log("Recover amount:      ", RECOVER_AMOUNT);
        console.log("==================================================");

        require(block.chainid == 11155111, "Not Sepolia");
        require(engine.owner() == deployer, "Not engine owner");
        require(engineUsdcBefore >= RECOVER_AMOUNT, "Engine USDC too low");

        vm.startBroadcast(pk);

        // 1. Approve adapter to pull USDC from the engine (same pattern as WETH approval)
        engine.approveToken(IERC20(usdc), adapter, type(uint256).max);
        console.log("\n[1/2] approveToken(USDC, adapter, MAX) - OK");

        // 2. Send 100 USDC from engine to deployer/executor so the engine's
        //    balanceOf(smartAccount) check passes (smartAccount == executor)
        engine.recoverTokens(usdc, RECOVER_AMOUNT);
        console.log("[2/2] recoverTokens(USDC, 100e6) - OK");

        vm.stopBroadcast();

        uint256 engineUsdcAfter = IERC20(usdc).balanceOf(address(engine));
        uint256 executorUsdcAfter = IERC20(usdc).balanceOf(deployer);

        console.log("\n==================================================");
        console.log("SETUP COMPLETE");
        console.log("==================================================");
        console.log("Engine USDC after:   ", engineUsdcAfter);
        console.log("Executor USDC after: ", executorUsdcAfter);
        console.log("USDC allowance set:  MAX");
        console.log("==================================================");
    }

    function _envAddressOr(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) { return a; }
        catch { return fallbackAddr; }
    }
}
