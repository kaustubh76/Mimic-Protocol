// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/MockDEX.sol";

contract DeployMockDEX is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MockDEX mockDEX = new MockDEX();

        console.log("MockDEX deployed at:", address(mockDEX));

        vm.stopBroadcast();
    }
}
