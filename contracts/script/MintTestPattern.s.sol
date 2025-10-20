// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../PatternDetector.sol";
import "../BehavioralNFT.sol";

/**
 * @title MintTestPattern
 * @notice Script to mint a basic "Buy Low, Sell High" pattern for testing
 */
contract MintTestPattern is Script {
    // Deployed contract addresses on Monad testnet
    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("==============================================");
        console.log("Minting Test Pattern: Buy Low, Sell High");
        console.log("==============================================");
        console.log("Pattern Detector:", PATTERN_DETECTOR);
        console.log("Behavioral NFT:", BEHAVIORAL_NFT);
        console.log("Deployer/Creator:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        PatternDetector detector = PatternDetector(PATTERN_DETECTOR);

        // Create a "Buy Low, Sell High" pattern that meets validation thresholds
        // Thresholds: minTrades=10, minWinRate=6000 (60%), minVolume=1 ether, minConfidence=7000 (70%)

        // Encode simple pattern data for "Buy Low, Sell High"
        // Format: (buyThreshold%, sellThreshold%, stopLoss%)
        bytes memory patternData = abi.encode(
            uint256(9500),  // Buy when price drops 5% (95% of previous)
            uint256(10500), // Sell when price rises 5% (105% of buy price)
            uint256(9200)   // Stop loss at 8% down (92% of buy price)
        );

        // Create DetectedPattern struct
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,                      // Creator address
            patternType: "MeanReversion",        // Pattern type (valid type from contract)
            patternData: patternData,            // Encoded parameters
            totalTrades: 20,                     // Total trades (meets minTrades=10)
            successfulTrades: 16,                // 16/20 = 80% win rate (meets minWinRate=60%)
            totalVolume: 5 ether,                // 5 ETH volume (meets minVolume=1 ether)
            totalPnL: int256(1 ether),           // 1 ETH profit (20% ROI)
            confidence: 8500,                    // 85% confidence (meets minConfidence=70%)
            detectedAt: block.timestamp - 8 days // 8 days ago (meets minTimePeriod=7 days)
        });

        console.log("Pattern Details:");
        console.log("- Type: MeanReversion (Buy Low, Sell High)");
        console.log("- Total Trades: 20");
        console.log("- Successful Trades: 16 (80% win rate)");
        console.log("- Total Volume: 5 ETH");
        console.log("- Total P&L: +1 ETH (+20% ROI)");
        console.log("- Confidence: 85%");
        console.log("- Detection Time: 8 days ago");
        console.log("");
        console.log("Parameters:");
        console.log("- Buy Threshold: 95% (buy on 5% dip)");
        console.log("- Sell Threshold: 105% (sell on 5% gain)");
        console.log("- Stop Loss: 92% (exit on 8% loss)");
        console.log("");

        // Mint the pattern
        console.log("Minting pattern...");
        uint256 tokenId = detector.validateAndMintPattern(pattern);

        console.log("");
        console.log("==============================================");
        console.log("SUCCESS! Pattern Minted");
        console.log("==============================================");
        console.log("Token ID:", tokenId);
        console.log("Creator:", deployer);
        console.log("Pattern Type: MeanReversion (Buy Low, Sell High)");
        console.log("");
        console.log("View on frontend:");
        console.log("http://localhost:3001");
        console.log("");
        console.log("Query on-chain:");
        console.log("cast call", BEHAVIORAL_NFT, "\\");
        console.log('  "patterns(uint256)" ', tokenId, " \\");
        console.log("  --rpc-url https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0");
        console.log("==============================================");

        vm.stopBroadcast();
    }
}
