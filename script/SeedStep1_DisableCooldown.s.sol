// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";

contract SeedStep1_DisableCooldown is Script {
    address constant DETECTOR = 0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        PatternDetector(DETECTOR).updateCooldown(0);
        vm.stopBroadcast();
        console.log("Cooldown set to 0");
    }
}
