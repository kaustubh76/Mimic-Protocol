// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ExecutionEngine.sol";
import "../contracts/DelegationRouter.sol";

/**
 * @title DeployExecutionEngine
 * @notice Deployment script for ExecutionEngine contract on Monad testnet
 * @dev Deploys ExecutionEngine and sets it as the execution engine in DelegationRouter
 */
contract DeployExecutionEngine is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address delegationRouterAddress = vm.envAddress("DELEGATION_ROUTER_ADDRESS");
        address behavioralNFTAddress = vm.envAddress("BEHAVIORAL_NFT_ADDRESS");

        console.log("===========================================");
        console.log("EXECUTION ENGINE DEPLOYMENT");
        console.log("===========================================");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("DelegationRouter:", delegationRouterAddress);
        console.log("BehavioralNFT:", behavioralNFTAddress);
        console.log("Chain ID:", block.chainid);
        console.log("-------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy ExecutionEngine
        console.log("Deploying ExecutionEngine...");
        ExecutionEngine engine = new ExecutionEngine(
            delegationRouterAddress,
            behavioralNFTAddress
        );
        console.log("ExecutionEngine deployed at:", address(engine));

        // Set ExecutionEngine in DelegationRouter
        console.log("Setting ExecutionEngine in DelegationRouter...");
        DelegationRouter router = DelegationRouter(delegationRouterAddress);
        router.setExecutionEngine(address(engine));
        console.log("ExecutionEngine configured in DelegationRouter");

        vm.stopBroadcast();

        console.log("===========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("===========================================");
        console.log("ExecutionEngine Address:", address(engine));
        console.log("Max Delegation Depth:", engine.maxDelegationDepth());
        console.log("Min Execution Interval:", engine.minExecutionInterval());
        console.log("Owner is Executor:", engine.isExecutor(vm.addr(deployerPrivateKey)));
        console.log("===========================================");
        console.log("\nAdd to .env:");
        console.log("EXECUTION_ENGINE_ADDRESS=", address(engine));
        console.log("\nVerification command:");
        console.log("forge verify-contract", address(engine), "contracts/ExecutionEngine.sol:ExecutionEngine --chain-id", block.chainid);
    }
}
