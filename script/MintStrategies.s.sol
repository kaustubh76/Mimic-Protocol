// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title MintStrategies
 * @notice Script to mint 5 trading strategy NFTs via PatternDetector
 */
contract MintStrategies is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    // Contract addresses on Monad testnet
    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("MINTING 5 TRADING STRATEGY NFTs");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        vm.startBroadcast(deployerPrivateKey);

        // Strategy 1: Arbitrage (87.5% win rate, +28.7% ROI) - Aggressive cross-exchange arbitrage
        mintStrategy(
            deployer,
            "Arbitrage",
            8,      // totalTrades
            7,      // successfulTrades (87.5% win rate)
            8960 ether,  // totalVolume
            2574 ether,  // totalPnL (+28.7% ROI)
            8750    // confidence (87.5%)
        );

        // Strategy 2: Liquidity (90% win rate, +22% ROI) - Conservative liquidity provision
        mintStrategy(
            deployer,
            "Liquidity",
            10,     // totalTrades
            9,      // successfulTrades (90% win rate)
            5000 ether,  // totalVolume
            1100 ether,  // totalPnL (+22% ROI)
            9000    // confidence (90%)
        );

        // Strategy 3: Yield (66.7% win rate, +43% ROI) - High-yield farming strategy
        mintStrategy(
            deployer,
            "Yield",
            6,      // totalTrades
            4,      // successfulTrades (66.7% win rate)
            12000 ether, // totalVolume
            5160 ether,  // totalPnL (+43% ROI)
            6670    // confidence (66.7%)
        );

        // Strategy 4: Composite (80% win rate, +13.5% ROI) - Multi-strategy scalping
        mintStrategy(
            deployer,
            "Composite",
            15,     // totalTrades
            12,     // successfulTrades (80% win rate)
            1500 ether,  // totalVolume
            202 ether,   // totalPnL (+13.5% ROI)
            8000    // confidence (80%)
        );

        // Strategy 5: Another Momentum (85.7% win rate, +33% ROI) - Swing/momentum hybrid
        mintStrategy(
            deployer,
            "Momentum",
            7,      // totalTrades
            6,      // successfulTrades (85.7% win rate)
            10500 ether, // totalVolume
            3465 ether,  // totalPnL (+33% ROI)
            8570    // confidence (85.7%)
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

        // Create DetectedPattern struct
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: patternType,
            patternData: abi.encode(patternType, totalTrades, successfulTrades),
            totalTrades: totalTrades,
            successfulTrades: successfulTrades,
            totalVolume: totalVolume,
            totalPnL: int256(totalPnL),
            confidence: confidence,
            detectedAt: block.timestamp - 30 days // Detected 30 days ago
        });

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Minted as NFT #", tokenId);
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
