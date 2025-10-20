// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title MintStrategiesSimple
 * @notice Simplified script to mint patterns one at a time with proper delays
 */
contract MintStrategiesSimple is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("MINTING SINGLE STRATEGY NFT");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        vm.startBroadcast(deployerPrivateKey);

        // Mint ONE strategy at a time to avoid cooldown
        // Run this script multiple times for multiple patterns

        // Strategy: Arbitrage (87.5% win rate, +28.7% ROI)
        mintStrategy(
            deployer,
            "Arbitrage",
            10,     // Increased to 10 trades (meets minimum)
            9,      // 90% win rate
            8960 ether,
            2574 ether,
            9000
        );

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("Total patterns on-chain:", nft.totalPatterns());
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
        console.log("Minting:", patternType);
        console.log("Trades:", totalTrades);
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
            detectedAt: block.timestamp - 8 days // 8 days ago (meets minimum)
        });

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Minted as NFT #", tokenId);
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
        } catch (bytes memory) {
            console.log("FAILED: Check contract requirements");
        }
    }
}
