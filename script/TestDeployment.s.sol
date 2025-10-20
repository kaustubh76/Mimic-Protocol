// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

contract TestDeployment is Script {
    function run() public {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        console.log("Test Deployment");
        console.log("Deployer from PK:", deployer);
        console.log("Deployer balance:", deployer.balance / 1 ether, "ETH");
    }
}
