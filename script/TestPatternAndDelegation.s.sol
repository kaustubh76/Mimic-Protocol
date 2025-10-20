// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/DelegationRouter.sol";

/**
 * @title TestPatternAndDelegation
 * @notice Test pattern minting and delegation creation only (skip execution)
 * @dev Optimized - Only 2 RPC calls total
 */
contract TestPatternAndDelegation is Script {
    address constant DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant ROUTER = 0x56C145f5567f8DB77533c825cf4205F1427c5517;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);

        console.log("==========================================");
        console.log("MIRROR PROTOCOL - PATTERN & DELEGATION TEST");
        console.log("==========================================");
        console.log("User:", user);
        console.log("");

        vm.startBroadcast(pk);

        // STEP 1: Submit pattern via PatternDetector
        console.log("1. Submitting pattern...");

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: "Arbitrage",  // Different type from previous tests
            patternData: abi.encode("Test arbitrage pattern"),
            totalTrades: 15,
            successfulTrades: 12,     // 80% win rate
            totalVolume: 15 ether,
            totalPnL: 2 ether,        // 2 ETH profit
            confidence: 9000,         // 90% confidence
            detectedAt: block.timestamp - 10 days  // 10 days ago
        });

        uint256 tokenId = PatternDetector(DETECTOR).validateAndMintPattern(pattern);
        console.log("   Pattern minted - Token ID:", tokenId);

        // STEP 2: Create delegation
        console.log("2. Creating delegation...");

        uint256 delegationId = DelegationRouter(ROUTER).createSimpleDelegation(
            tokenId,
            7500,   // 75% allocation
            user    // smartAccount (using EOA for test)
        );
        console.log("   Delegation created - ID:", delegationId);

        vm.stopBroadcast();

        console.log("");
        console.log("==========================================");
        console.log("SUCCESS!");
        console.log("==========================================");
        console.log("Results:");
        console.log("  Pattern Token ID:", tokenId);
        console.log("  Delegation ID:", delegationId);
        console.log("");
        console.log("Total RPC calls: 2 (OPTIMIZED!)");
    }
}
