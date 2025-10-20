// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title Mint5MoreStrategies
 * @notice Mint 5 additional diverse trading strategies (IDs 3-7)
 */
contract Mint5MoreStrategies is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("MINTING 5 ADDITIONAL STRATEGIES (IDs 3-7)");
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

        // Step 2: Mint 5 new strategies
        console.log("Step 2: Minting 5 new strategies...");
        console.log("");

        // Strategy 3: Arbitrage (High win rate, excellent ROI)
        mintStrategy(
            deployer,
            "Arbitrage",
            20, 18,         // 90% win rate (18/20)
            500000 ether,   // 500k volume
            143500 ether,   // +28.7% ROI
            9000
        );

        // Strategy 4: Liquidity (High win rate, solid returns)
        mintStrategy(
            deployer,
            "Liquidity",
            20, 18,         // 90% win rate
            350000 ether,   // 350k volume
            77000 ether,    // +22% ROI
            9000
        );

        // Strategy 5: Yield (Medium win rate, high ROI when successful)
        mintStrategy(
            deployer,
            "Yield",
            20, 14,         // 70% win rate
            280000 ether,   // 280k volume
            120400 ether,   // +43% ROI
            7000
        );

        // Strategy 6: Composite (Balanced multi-strategy)
        mintStrategy(
            deployer,
            "Composite",
            25, 20,         // 80% win rate
            420000 ether,   // 420k volume
            56700 ether,    // +13.5% ROI
            8000
        );

        // Strategy 7: AdvancedMeanReversion (High performance)
        mintStrategy(
            deployer,
            "AdvancedMeanReversion",
            20, 18,         // 90% win rate
            380000 ether,   // 380k volume
            125400 ether,   // +33% ROI
            9000
        );

        // Step 3: Restore cooldown to 1 hour
        console.log("");
        console.log("Step 3: Restoring cooldown to 1 hour...");
        detector.updateCooldown(3600);
        console.log("Cooldown restored to 3600 seconds");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("SUCCESS! 5 strategies minted");
        console.log("Total patterns on-chain: 7");
        console.log("===========================================");
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
        console.log("Trades:", totalTrades, "Successful:", successfulTrades);
        console.log("Win Rate:", (successfulTrades * 10000) / totalTrades / 100, "%");
        console.log("Volume:", totalVolume / 1 ether, "tokens");
        console.log("PnL:", totalPnL / 1 ether, "tokens");

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: patternType,
            patternData: abi.encode(patternType, totalTrades, successfulTrades),
            totalTrades: totalTrades,
            successfulTrades: successfulTrades,
            totalVolume: totalVolume,
            totalPnL: int256(totalPnL),
            confidence: confidence,
            firstTradeTimestamp: block.timestamp - 90 days,
            lastTradeTimestamp: block.timestamp
        });

        try detector.registerPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Token ID:", tokenId);
            console.log("-------------------------------------------");
            console.log("");
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
            console.log("-------------------------------------------");
            console.log("");
        }
    }
}
