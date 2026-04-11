// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/// @notice Minimal WETH9 interface for wrap + transfer.
interface IWETH9 {
    function deposit() external payable;
    function balanceOf(address) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * @title RefundEngineWETH
 * @notice Top up the Sepolia ExecutionEngine's WETH float so the bot can
 *         resume executing trades.
 *
 * @dev Each bot trade drains the engine's float by TRADE_AMOUNT (currently
 *      0.005 WETH per trade). When the float drops below TRADE_AMOUNT, the
 *      adapter's safeTransferFrom starts reverting and every executeTrade
 *      attempt records a failure. Run this script to wrap 0.05 ETH into
 *      WETH and transfer it to the engine, restoring ~10 trades of headroom.
 *
 *      Run with:
 *        forge script script/RefundEngineWETH.s.sol:RefundEngineWETH \
 *          --rpc-url sepolia --broadcast --legacy
 *
 *      Required env:
 *        DEPLOYER_PRIVATE_KEY  (0x-prefixed, funds the wrap + transfer)
 *
 *      Optional env:
 *        SEPOLIA_WETH                     fallback: canonical 0xfFf99767...
 *        SEPOLIA_EXECUTION_ENGINE_ADDRESS fallback: gate 7 deployment
 *        REFUND_AMOUNT                    fallback: 0.05 ether
 */
contract RefundEngineWETH is Script {
    address constant DEFAULT_WETH   = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address constant DEFAULT_ENGINE = 0x1C1b05628EFaD25804E663dEeA97e224ccA1eD5A;
    uint256 constant DEFAULT_AMOUNT = 0.05 ether;

    function run() external {
        uint256 deployerPrivateKey = uint256(vm.envBytes32("DEPLOYER_PRIVATE_KEY"));
        address deployer = vm.addr(deployerPrivateKey);

        address wethAddr   = _envAddressOr("SEPOLIA_WETH",                     DEFAULT_WETH);
        address engineAddr = _envAddressOr("SEPOLIA_EXECUTION_ENGINE_ADDRESS", DEFAULT_ENGINE);
        uint256 amount     = _envUintOr("REFUND_AMOUNT", DEFAULT_AMOUNT);

        IWETH9 weth = IWETH9(wethAddr);

        uint256 engineBefore = weth.balanceOf(engineAddr);
        uint256 deployerBefore = deployer.balance;

        console.log("==================================================");
        console.log("REFUND ENGINE WETH FLOAT");
        console.log("==================================================");
        console.log("Deployer:         ", deployer);
        console.log("Chain ID:         ", block.chainid);
        console.log("Engine:           ", engineAddr);
        console.log("WETH:             ", wethAddr);
        console.log("Amount to refund: ", amount);
        console.log("Engine WETH before:", engineBefore);
        console.log("Deployer ETH:     ", deployerBefore);
        console.log("==================================================");

        require(block.chainid == 11155111, "Not Sepolia");
        require(deployerBefore >= amount + 0.005 ether, "Deployer low on ETH");

        vm.startBroadcast(deployerPrivateKey);
        weth.deposit{value: amount}();
        weth.transfer(engineAddr, amount);
        vm.stopBroadcast();

        uint256 engineAfter = weth.balanceOf(engineAddr);

        console.log("");
        console.log("Engine WETH after: ", engineAfter);
        console.log("Delta:             ", engineAfter - engineBefore);
        console.log("==================================================");
        console.log("REFUND COMPLETE");
        console.log("==================================================");
    }

    function _envAddressOr(string memory key, address fallbackAddr) internal view returns (address) {
        try vm.envAddress(key) returns (address a) {
            return a;
        } catch {
            return fallbackAddr;
        }
    }

    function _envUintOr(string memory key, uint256 fallbackVal) internal view returns (uint256) {
        try vm.envUint(key) returns (uint256 v) {
            return v;
        } catch {
            return fallbackVal;
        }
    }
}
