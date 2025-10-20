// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title DeployBehavioralNFT
 * @author Mirror Protocol Team
 * @notice Deployment script for BehavioralNFT contract
 * @dev Run with: forge script script/DeployBehavioralNFT.s.sol:DeployBehavioralNFT --rpc-url monad --broadcast --verify
 *
 * DEPLOYMENT CHECKLIST:
 * 1. Set MONAD_RPC_URL in .env
 * 2. Set DEPLOYER_PRIVATE_KEY in .env
 * 3. Ensure deployer wallet has testnet tokens
 * 4. Run deployment script
 * 5. Verify contract on explorer
 * 6. Save contract address to .env (BEHAVIORAL_NFT_ADDRESS)
 * 7. Set pattern detector address via setPatternDetector()
 */
contract DeployBehavioralNFT is Script {
    function run() external {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        // Get deployer address
        address deployer = vm.addr(deployerPrivateKey);

        console.log("====================================");
        console.log("Deploying BehavioralNFT Contract");
        console.log("====================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("====================================");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy BehavioralNFT
        BehavioralNFT nft = new BehavioralNFT(deployer);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment info
        console.log("\n====================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("====================================");
        console.log("BehavioralNFT deployed at:", address(nft));
        console.log("Owner:", nft.owner());
        console.log("====================================");

        // Log next steps
        console.log("\n====================================");
        console.log("NEXT STEPS");
        console.log("====================================");
        console.log("1. Add to .env:");
        console.log(string(abi.encodePacked("   BEHAVIORAL_NFT_ADDRESS=", vm.toString(address(nft)))));
        console.log("\n2. Set pattern detector:");
        console.log("   cast send", vm.toString(address(nft)));
        console.log('   "setPatternDetector(address)" <PATTERN_DETECTOR_ADDRESS>');
        console.log("   --private-key $DEPLOYER_PRIVATE_KEY --rpc-url $MONAD_RPC_URL");
        console.log("\n3. Update Envio config with contract address");
        console.log("====================================");
    }

    function getChainName(uint256 chainId) internal pure returns (string memory) {
        if (chainId == 10143) return "Monad Testnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 31337) return "Hardhat/Localhost";
        return "Unknown";
    }
}
