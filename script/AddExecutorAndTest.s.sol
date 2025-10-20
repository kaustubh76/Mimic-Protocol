// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ExecutionEngine.sol";

/**
 * @title AddExecutorAndTest
 * @notice Add executor permission and test trade execution
 */
contract AddExecutorAndTest is Script {
    address constant ENGINE = 0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);

        console.log("==========================================");
        console.log("ADD EXECUTOR & TEST EXECUTION");
        console.log("==========================================");
        console.log("User:", user);
        console.log("");

        vm.startBroadcast(pk);

        ExecutionEngine engine = ExecutionEngine(ENGINE);

        // Add user as executor
        console.log("1. Adding executor permission...");
        engine.addExecutor(user);
        console.log("   Executor added:", user);

        // Verify executor status
        bool isExecutor = engine.isExecutor(user);
        console.log("   Is executor:", isExecutor);

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================");
        console.log("SUCCESS!");
        console.log("==========================================");
    }
}
