// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title DeployDelegationRouter
 * @notice Deployment script for DelegationRouter contract on Monad testnet
 * @dev Deploys DelegationRouter and configures it with BehavioralNFT
 *
 * DEPLOYMENT STEPS:
 * 1. Deploy DelegationRouter (or use existing BehavioralNFT address)
 * 2. Set ExecutionEngine address (once deployed)
 * 3. Set SmartAccountFactory address (MetaMask)
 * 4. Verify contract on Monad explorer
 *
 * USAGE:
 * forge script script/DeployDelegationRouter.s.sol:DeployDelegationRouter \
 *   --rpc-url $MONAD_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast \
 *   --verify \
 *   --etherscan-api-key $MONAD_API_KEY
 *
 * OR with environment variables in .env:
 * source .env && forge script script/DeployDelegationRouter.s.sol:DeployDelegationRouter \
 *   --rpc-url $MONAD_RPC_URL \
 *   --private-key $PRIVATE_KEY \
 *   --broadcast
 */
contract DeployDelegationRouter is Script {
    // Deployment addresses (update these after each deployment)
    address public behavioralNFT;
    address public executionEngine;
    address public smartAccountFactory;

    // Deployment results
    DelegationRouter public router;

    function setUp() public {
        // Load addresses from environment variables
        behavioralNFT = vm.envOr("BEHAVIORAL_NFT_ADDRESS", address(0));
        executionEngine = vm.envOr("EXECUTION_ENGINE_ADDRESS", address(0));
        smartAccountFactory = vm.envOr("SMART_ACCOUNT_FACTORY_ADDRESS", address(0));
    }

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("====================================");
        console.log("DEPLOYING DELEGATIONROUTER");
        console.log("====================================");
        console.log("Deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);
        console.log("Chain ID:", block.chainid);
        console.log("====================================");

        // Validate BehavioralNFT address
        if (behavioralNFT == address(0)) {
            console.log("");
            console.log("ERROR: BEHAVIORAL_NFT_ADDRESS not set!");
            console.log("Please set BEHAVIORAL_NFT_ADDRESS in .env");
            console.log("Or deploy BehavioralNFT first using DeployBehavioralNFT.s.sol");
            revert("Missing BehavioralNFT address");
        }

        console.log("BehavioralNFT address:", behavioralNFT);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy DelegationRouter
        console.log("");
        console.log("Deploying DelegationRouter...");
        router = new DelegationRouter(
            behavioralNFT,
            deployer // Owner
        );

        console.log("DelegationRouter deployed at:", address(router));

        // Configure ExecutionEngine if provided
        if (executionEngine != address(0)) {
            console.log("");
            console.log("Setting ExecutionEngine to:", executionEngine);
            router.setExecutionEngine(executionEngine);
            console.log("ExecutionEngine set successfully");
        } else {
            console.log("");
            console.log("WARNING: EXECUTION_ENGINE_ADDRESS not set");
            console.log("Set it later using setExecutionEngine()");
        }

        // Configure SmartAccountFactory if provided
        if (smartAccountFactory != address(0)) {
            console.log("");
            console.log("Setting SmartAccountFactory to:", smartAccountFactory);
            router.setSmartAccountFactory(smartAccountFactory);
            console.log("SmartAccountFactory set successfully");
        } else {
            console.log("");
            console.log("WARNING: SMART_ACCOUNT_FACTORY_ADDRESS not set");
            console.log("Set it later using setSmartAccountFactory()");
        }

        vm.stopBroadcast();

        // Print deployment summary
        console.log("");
        console.log("====================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("====================================");
        console.log("DelegationRouter:", address(router));
        console.log("BehavioralNFT:", behavioralNFT);
        console.log("ExecutionEngine:", executionEngine == address(0) ? "NOT SET" : vm.toString(executionEngine));
        console.log("SmartAccountFactory:", smartAccountFactory == address(0) ? "NOT SET" : vm.toString(smartAccountFactory));
        console.log("Owner:", deployer);
        console.log("====================================");

        // Print next steps
        console.log("");
        console.log("NEXT STEPS:");
        console.log("1. Update src/envio/config.yaml with DelegationRouter address");
        console.log("2. Add DelegationRouter events to Envio indexer");
        console.log("3. Run 'pnpx envio codegen' to regenerate types");
        console.log("4. Deploy ExecutionEngine and configure it");
        console.log("5. Test delegation flow end-to-end");
        console.log("");

        // Print environment variable exports for convenience
        console.log("EXPORT THESE FOR NEXT DEPLOYMENTS:");
        console.log("export DELEGATION_ROUTER_ADDRESS=%s", vm.toString(address(router)));
        console.log("");

        // Verify contract initialization
        console.log("VERIFYING DEPLOYMENT:");
        require(address(router.behavioralNFT()) == behavioralNFT, "BehavioralNFT address mismatch");
        require(router.owner() == deployer, "Owner mismatch");
        require(router.totalDelegations() == 0, "Initial delegation count should be 0");
        console.log("All verifications passed!");
    }

    /**
     * @notice Deploy with existing BehavioralNFT address (for testing)
     * @dev Used when you already have BehavioralNFT deployed
     */
    function deployWithExistingNFT(address _behavioralNFT) public returns (address) {
        require(_behavioralNFT != address(0), "Invalid BehavioralNFT address");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        router = new DelegationRouter(_behavioralNFT, deployer);

        vm.stopBroadcast();

        return address(router);
    }

    /**
     * @notice Full deployment (BehavioralNFT + DelegationRouter)
     * @dev Deploys both contracts in one transaction
     */
    function deployFull() public returns (address, address) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BehavioralNFT
        BehavioralNFT nft = new BehavioralNFT(deployer);
        console.log("BehavioralNFT deployed at:", address(nft));

        // Deploy DelegationRouter
        router = new DelegationRouter(address(nft), deployer);
        console.log("DelegationRouter deployed at:", address(router));

        vm.stopBroadcast();

        return (address(nft), address(router));
    }
}
