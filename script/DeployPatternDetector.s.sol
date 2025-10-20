// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title DeployPatternDetector
 * @notice Deployment script for PatternDetector contract
 * @dev Deploys to Monad testnet and configures BehavioralNFT integration
 */
contract DeployPatternDetector is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address behavioralNFTAddress = vm.envAddress("BEHAVIORAL_NFT_ADDRESS");

        console.log("=== PatternDetector Deployment ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("BehavioralNFT:", behavioralNFTAddress);
        console.log("Network: Monad Testnet (Chain ID: 10143)");
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy PatternDetector
        console.log("Deploying PatternDetector...");
        PatternDetector detector = new PatternDetector(behavioralNFTAddress);
        console.log("PatternDetector deployed at:", address(detector));
        console.log("");

        // Configure BehavioralNFT to accept patterns from PatternDetector
        console.log("Configuring BehavioralNFT...");
        BehavioralNFT nft = BehavioralNFT(behavioralNFTAddress);
        nft.setPatternDetector(address(detector));
        console.log("BehavioralNFT configured to accept patterns from PatternDetector");
        console.log("");

        // Display configuration
        console.log("=== PatternDetector Configuration ===");
        console.log("Detection Cooldown: 1 hour");
        console.log("Max Active Patterns/User: 5");
        console.log("Minimum Trades: 10");
        console.log("Minimum Win Rate: 60%");
        console.log("Minimum Volume: 1 ETH");
        console.log("Minimum Confidence: 70%");
        console.log("Minimum Time Period: 7 days");
        console.log("");

        vm.stopBroadcast();

        console.log("=== Deployment Complete ===");
        console.log("PatternDetector:", address(detector));
        console.log("");
        console.log("Next steps:");
        console.log("1. Update .env with: PATTERN_DETECTOR_ADDRESS=", address(detector));
        console.log("2. Update Envio config with PatternDetector events");
        console.log("3. Run: cd src/envio && pnpm envio codegen");
        console.log("4. Start Envio indexer: pnpm dev");
        console.log("5. Test pattern detection with backend");
        console.log("");
        console.log("Gas used for deployment: Check transaction receipt");
        console.log("Estimated cost: ~0.25 ETH on Monad testnet");
    }
}
