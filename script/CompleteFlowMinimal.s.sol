// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";

/**
 * @title CompleteFlowMinimal
 * @notice Optimized test - Only 3-4 RPC calls total!
 * @dev Tests complete flow: Pattern -> Delegation -> Execution
 */
contract CompleteFlowMinimal is Script {
    address constant DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant ROUTER = 0xd5499e0d781b123724dF253776Aa1EB09780AfBf; // NEW REFACTORED
    address constant ENGINE = 0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE; // NEW REFACTORED

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);

        console.log("===========================================");
        console.log("MIRROR PROTOCOL - OPTIMIZED COMPLETE TEST");
        console.log("===========================================");
        console.log("User:", user);
        console.log("");

        vm.startBroadcast(pk);

        // STEP 1: Submit pattern via PatternDetector
        console.log("1. Submitting pattern...");

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: "Momentum",  // Valid pattern type (capitalized)
            patternData: abi.encode("Optimized test data"),
            totalTrades: 10,
            successfulTrades: 8,      // 80% win rate
            totalVolume: 10 ether,
            totalPnL: 1 ether,        // 1 ETH profit
            confidence: 8500,         // 85% confidence
            detectedAt: block.timestamp - 8 days  // 8 days ago to meet 7-day requirement
        });

        uint256 tokenId = PatternDetector(DETECTOR).validateAndMintPattern(pattern);
        console.log("   Pattern minted - Token ID:", tokenId);

        // STEP 2: Create delegation
        console.log("2. Creating delegation...");

        uint256 delegationId = DelegationRouter(ROUTER).createSimpleDelegation(
            tokenId,
            5000,   // 50% allocation
            user    // smartAccount (using EOA for test)
        );
        console.log("   Delegation created - ID:", delegationId);

        // STEP 3: Execute trade via ExecutionEngine
        console.log("3. Executing trade...");

        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId,
            token: address(0x1111111111111111111111111111111111111111),
            amount: 1 ether,
            targetContract: address(0x2222222222222222222222222222222222222222),
            callData: ""
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8500,         // 85%
            currentROI: 1500,             // 15%
            currentVolume: 1 ether,
            lastUpdated: block.timestamp
        });

        ExecutionEngine(ENGINE).executeTrade(params, metrics);
        console.log("   Trade executed successfully!");

        vm.stopBroadcast();

        console.log("");
        console.log("===========================================");
        console.log("SUCCESS! ALL CONTRACTS TESTED!");
        console.log("===========================================");
        console.log("Results:");
        console.log("  Pattern Token ID:", tokenId);
        console.log("  Delegation ID:", delegationId);
        console.log("  ExecutionEngine: NOW HAS INTERACTIONS!");
        console.log("");
        console.log("Verify with:");
        console.log("  ./check-contracts.sh");
        console.log("");
        console.log("Total RPC calls: ~3-4 (OPTIMIZED!)");
    }
}
