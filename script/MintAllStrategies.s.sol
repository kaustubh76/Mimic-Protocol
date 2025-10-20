// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title MintAllStrategies
 * @notice Mint all 5 strategies by temporarily disabling cooldown
 */
contract MintAllStrategies is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("MINTING ALL 5 STRATEGIES");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Temporarily disable cooldown
        console.log("Step 1: Disabling cooldown temporarily...");
        detector.updateCooldown(0);
        console.log("Cooldown set to 0 seconds");
        console.log("");

        // Step 2: Mint all 5 strategies
        console.log("Step 2: Minting 5 strategies...");
        console.log("");

        // Strategy 1: Arbitrage
        mintStrategy(
            deployer,
            "Arbitrage",
            10, 9, 8960 ether, 2574 ether, 9000
        );

        // Strategy 2: Liquidity
        mintStrategy(
            deployer,
            "Liquidity",
            10, 9, 5000 ether, 1100 ether, 9000
        );

        // Strategy 3: Yield
        mintStrategy(
            deployer,
            "Yield",
            10, 7, 12000 ether, 5160 ether, 7000
        );

        // Strategy 4: Composite
        mintStrategy(
            deployer,
            "Composite",
            15, 12, 1500 ether, 202 ether, 8000
        );

        // Strategy 5: Another MeanReversion
        mintStrategy(
            deployer,
            "MeanReversion",
            10, 9, 10500 ether, 3465 ether, 9000
        );

        // Step 3: Restore cooldown to 1 hour
        console.log("");
        console.log("Step 3: Restoring cooldown to 1 hour...");
        detector.updateCooldown(3600);
        console.log("Cooldown restored to 3600 seconds");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("MINTING COMPLETE!");
        console.log("===========================================");
        console.log("Total patterns on-chain:", nft.totalPatterns());
        console.log("");
        console.log("View at: http://localhost:3000/");
    }

    function mintStrategy(
        address user,
        string memory patternType,
        uint256 totalTrades,
        uint256 successfulTrades,
        uint256 totalVolume,
        uint256 totalPnL,
        uint256 confidence
    ) internal {
        console.log("-------------------------------------------");
        console.log("Minting:", patternType);
        console.log("Win Rate:", (successfulTrades * 100) / totalTrades, "%");

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: patternType,
            patternData: abi.encode(patternType, totalTrades, successfulTrades),
            totalTrades: totalTrades,
            successfulTrades: successfulTrades,
            totalVolume: totalVolume,
            totalPnL: int256(totalPnL),
            confidence: confidence,
            detectedAt: block.timestamp - 8 days
        });

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Token ID:", tokenId);
            console.log("");
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
            console.log("");
        } catch (bytes memory) {
            console.log("FAILED: Unknown error");
            console.log("");
        }
    }
}
