// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title MintAll7Patterns
 * @notice Mints 7 diverse trading strategy NFTs for demo (all with 10+ trades to meet requirements)
 */
contract MintAll7Patterns is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("MINTING 7 TRADING STRATEGY NFTs");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        console.log("Current patterns on-chain:", nft.totalPatterns());
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Strategy 1: Arbitrage (90% win rate, +28.7% ROI)
        mintStrategy(
            deployer,
            "Arbitrage",
            10,     // totalTrades (meets 10+ requirement)
            9,      // successfulTrades (90% win rate)
            8960 ether,
            2574 ether,
            9000
        );

        // Strategy 2: Momentum (85% win rate, +33% ROI)
        mintStrategy(
            deployer,
            "Momentum",
            20,     // totalTrades
            17,     // successfulTrades (85% win rate)
            10500 ether,
            3465 ether,
            8500
        );

        // Strategy 3: Mean Reversion (88% win rate, +22% ROI)
        mintStrategy(
            deployer,
            "MeanReversion",
            25,     // totalTrades
            22,     // successfulTrades (88% win rate)
            5000 ether,
            1100 ether,
            8800
        );

        // Strategy 4: Yield (75% win rate, +45% ROI)
        mintStrategy(
            deployer,
            "Yield",
            20,     // totalTrades
            15,     // successfulTrades (75% win rate)
            12000 ether,
            5400 ether,
            7500
        );

        // Strategy 5: Liquidity (82% win rate, +15% ROI)
        mintStrategy(
            deployer,
            "Liquidity",
            50,     // totalTrades (high frequency)
            41,     // successfulTrades (82% win rate)
            6500 ether,
            975 ether,
            8200
        );

        // Strategy 6: Arbitrage (78% win rate, +38% ROI) - Second arbitrage strategy
        mintStrategy(
            deployer,
            "Arbitrage",
            18,     // totalTrades
            14,     // successfulTrades (77.8% win rate)
            9500 ether,
            3610 ether,
            7800
        );

        // Strategy 7: Composite Multi-Strategy (80% win rate, +25% ROI)
        mintStrategy(
            deployer,
            "Composite",
            30,     // totalTrades
            24,     // successfulTrades (80% win rate)
            7200 ether,
            1800 ether,
            8000
        );

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("MINTING COMPLETE!");
        console.log("===========================================");
        console.log("Total patterns now on-chain:", nft.totalPatterns());
        console.log("");
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
        console.log("Trades:", totalTrades);

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
            console.log("");
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
            console.log("");
        } catch (bytes memory) {
            console.log("FAILED: Unknown error - check cooldown (1hr between mints)");
            console.log("");
        }
    }
}
