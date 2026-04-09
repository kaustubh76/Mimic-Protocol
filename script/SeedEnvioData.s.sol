// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title SeedEnvioData
 * @notice Full seed: disable cooldown, mint 5 patterns, create 3 delegations, restore cooldown
 */
contract SeedEnvioData is Script {
    address constant DETECTOR = 0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE;
    address constant NFT_ADDR = 0x6943e7D39F3799d0b8fa9D6aD6B63861a15a8d26;
    address constant ROUTER = 0xd5499e0d781b123724dF253776Aa1EB09780AfBf;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);

        console.log("==========================================");
        console.log("MIRROR PROTOCOL - FULL DATA SEED");
        console.log("==========================================");
        console.log("User:", user);

        vm.startBroadcast(pk);

        // Disable cooldown so we can mint multiple patterns
        PatternDetector(DETECTOR).updateCooldown(0);
        console.log("Cooldown disabled");

        // --- PATTERN 1: Arbitrage ---
        uint256 id1 = PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: "Arbitrage",
                patternData: abi.encode("Cross-DEX arbitrage"),
                totalTrades: 20,
                successfulTrades: 18,
                totalVolume: 50 ether,
                totalPnL: 5 ether,
                confidence: 9500,
                detectedAt: block.timestamp - 14 days
            })
        );
        console.log("Pattern 1 (Arbitrage) minted, ID:", id1);

        // --- PATTERN 2: Momentum ---
        uint256 id2 = PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: "Momentum",
                patternData: abi.encode("Trend-following momentum"),
                totalTrades: 15,
                successfulTrades: 12,
                totalVolume: 30 ether,
                totalPnL: 3 ether,
                confidence: 8500,
                detectedAt: block.timestamp - 10 days
            })
        );
        console.log("Pattern 2 (Momentum) minted, ID:", id2);

        // --- PATTERN 3: Mean Reversion ---
        uint256 id3 = PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: "MeanReversion",
                patternData: abi.encode("Bollinger band reversion"),
                totalTrades: 12,
                successfulTrades: 10,
                totalVolume: 25 ether,
                totalPnL: 4 ether,
                confidence: 8800,
                detectedAt: block.timestamp - 12 days
            })
        );
        console.log("Pattern 3 (MeanReversion) minted, ID:", id3);

        // --- PATTERN 4: Liquidity ---
        uint256 id4 = PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: "Liquidity",
                patternData: abi.encode("LP provision strategy"),
                totalTrades: 10,
                successfulTrades: 9,
                totalVolume: 40 ether,
                totalPnL: 6 ether,
                confidence: 9000,
                detectedAt: block.timestamp - 15 days
            })
        );
        console.log("Pattern 4 (Liquidity) minted, ID:", id4);

        // --- PATTERN 5: Composite ---
        uint256 id5 = PatternDetector(DETECTOR).validateAndMintPattern(
            PatternDetector.DetectedPattern({
                user: user,
                patternType: "Composite",
                patternData: abi.encode("Multi-strategy scalping"),
                totalTrades: 25,
                successfulTrades: 20,
                totalVolume: 60 ether,
                totalPnL: 8 ether,
                confidence: 9200,
                detectedAt: block.timestamp - 20 days
            })
        );
        console.log("Pattern 5 (Composite) minted, ID:", id5);

        // --- DELEGATION 1: Arbitrage 75% ---
        uint256 del1 = DelegationRouter(ROUTER).createSimpleDelegation(id1, 7500, user);
        console.log("Delegation 1 created, ID:", del1);

        // --- DELEGATION 2: Momentum 50% ---
        uint256 del2 = DelegationRouter(ROUTER).createSimpleDelegation(id2, 5000, user);
        console.log("Delegation 2 created, ID:", del2);

        // --- DELEGATION 3: Composite 60% ---
        uint256 del3 = DelegationRouter(ROUTER).createSimpleDelegation(id5, 6000, user);
        console.log("Delegation 3 created, ID:", del3);

        // Restore cooldown to 1 hour
        PatternDetector(DETECTOR).updateCooldown(3600);
        console.log("Cooldown restored to 1 hour");

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================");
        console.log("SEED COMPLETE!");
        console.log("==========================================");
        console.log("Patterns minted: 5");
        console.log("Delegations created: 3");
        console.log("Events generated: 10+");
    }
}
