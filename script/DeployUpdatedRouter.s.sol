// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DelegationRouter.sol";

contract DeployUpdatedRouter is Script {
    function run() external {
        address BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;
        address DEPLOYER = 0xFc46DA4cbAbDca9f903863De571E03A39D9079aD;

        vm.startBroadcast();

        DelegationRouter router = new DelegationRouter(BEHAVIORAL_NFT, DEPLOYER);

        console.log("DelegationRouter deployed at:", address(router));
        console.log("Total delegations in new contract:", router.totalDelegations());

        vm.stopBroadcast();
    }
}
