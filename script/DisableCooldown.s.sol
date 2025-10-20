// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";

/**
 * @title DisableCooldown
 * @notice Temporarily disables the pattern detection cooldown for testing
 */
contract DisableCooldown is Script {
    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("===========================================");
        console.log("DISABLING PATTERN DETECTION COOLDOWN");
        console.log("===========================================");
        console.log("");

        PatternDetector detector = PatternDetector(PATTERN_DETECTOR);

        vm.startBroadcast(deployerPrivateKey);

        // Set cooldown to 0 (no cooldown for testing)
        console.log("Setting cooldown to 0 seconds...");
        detector.updateCooldown(0);

        vm.stopBroadcast();

        console.log("SUCCESS! Cooldown disabled.");
        console.log("You can now mint multiple patterns immediately.");
        console.log("");
    }
}
