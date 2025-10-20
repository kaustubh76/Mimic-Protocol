// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

contract Mint5More is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Minting 5 Additional Strategies");
        console.log("Deployer:", deployer);
        console.log("");

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        vm.startBroadcast(deployerPrivateKey);

        // Disable cooldown
        detector.updateCooldown(0);

        // Mint strategies
        mintStrategy(deployer, "Arbitrage", 20, 18, 500000 ether, 143500 ether, 9000);
        mintStrategy(deployer, "Liquidity", 20, 18, 350000 ether, 77000 ether, 9000);
        mintStrategy(deployer, "Yield", 20, 14, 280000 ether, 120400 ether, 7000);
        mintStrategy(deployer, "Composite", 25, 20, 420000 ether, 56700 ether, 8000);
        mintStrategy(deployer, "AdvancedMeanReversion", 20, 18, 380000 ether, 125400 ether, 9000);

        // Restore cooldown
        detector.updateCooldown(3600);

        vm.stopBroadcast();

        console.log("");
        console.log("SUCCESS! 5 strategies minted");
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

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: patternType,
            patternData: abi.encode(patternType, totalTrades, successfulTrades),
            totalTrades: totalTrades,
            successfulTrades: successfulTrades,
            totalVolume: totalVolume,
            totalPnL: int256(totalPnL),
            confidence: confidence,
            detectedAt: block.timestamp
        });

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("  Token ID:", tokenId);
        } catch Error(string memory reason) {
            console.log("  FAILED:", reason);
        }
    }
}
