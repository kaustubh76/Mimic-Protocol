// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/PatternDetector.sol";

contract SeedStep3_Delegations is Script {
    address constant ROUTER = 0xd5499e0d781b123724dF253776Aa1EB09780AfBf;
    address constant DETECTOR = 0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);
        vm.startBroadcast(pk);

        // Create delegations for newly minted patterns (IDs 9-12)
        DelegationRouter(ROUTER).createSimpleDelegation(9, 7500, user);
        console.log("Delegation for pattern 9 created (75%)");

        DelegationRouter(ROUTER).createSimpleDelegation(10, 5000, user);
        console.log("Delegation for pattern 10 created (50%)");

        DelegationRouter(ROUTER).createSimpleDelegation(11, 6000, user);
        console.log("Delegation for pattern 11 created (60%)");

        // Restore cooldown
        PatternDetector(DETECTOR).updateCooldown(3600);
        console.log("Cooldown restored to 1 hour");

        vm.stopBroadcast();
        console.log("3 delegations created + cooldown restored");
    }
}
