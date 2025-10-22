// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/ExecutionEngine.sol";

contract SimpleIntegrationTest is Test {
    BehavioralNFT public behavioralNFT;
    DelegationRouter public delegationRouter;
    PatternDetector public patternDetector;
    ExecutionEngine public executionEngine;

    address public owner;
    address public trader1;
    address public delegator1;

    function setUp() public {
        owner = address(this);
        trader1 = makeAddr("trader1");
        delegator1 = makeAddr("delegator1");

        vm.deal(trader1, 100 ether);
        vm.deal(delegator1, 100 ether);

        console.log("\n=== DEPLOYING ALL 4 CONTRACTS ===");

        // 1. BehavioralNFT
        behavioralNFT = new BehavioralNFT(owner);
        console.log("1. BehavioralNFT:", address(behavioralNFT));

        // 2. PatternDetector
        patternDetector = new PatternDetector(address(behavioralNFT));
        console.log("2. PatternDetector:", address(patternDetector));

        // 3. DelegationRouter
        delegationRouter = new DelegationRouter(
            address(behavioralNFT),
            address(0x1) // Placeholder
        );
        console.log("3. DelegationRouter:", address(delegationRouter));

        // 4. ExecutionEngine
        executionEngine = new ExecutionEngine(
            address(delegationRouter),
            address(behavioralNFT)
        );
        console.log("4. ExecutionEngine:", address(executionEngine));

        // Setup permissions
        behavioralNFT.setPatternDetector(address(patternDetector));

        console.log("\n=== ALL CONTRACTS DEPLOYED & CONNECTED ===\n");
    }

    function test_AllContractsIntegration() public {
        console.log(">>> TESTING ALL 4 CONTRACTS INTEGRATION");

        // Test 1: Mint pattern via PatternDetector
        console.log("\n[1/4] Testing BehavioralNFT + PatternDetector...");
        vm.prank(address(patternDetector));
        uint256 tokenId = behavioralNFT.mintPattern(
            trader1,
            "AggressiveMomentum",
            abi.encodePacked("momentum_config")
        );
        console.log("  SUCCESS: Pattern #", tokenId, "minted by trader1");

        // Verify pattern
        (address creator, string memory pType, , , , , , bool isActive) = behavioralNFT.patterns(tokenId);
        assertEq(creator, trader1);
        assertEq(pType, "AggressiveMomentum");
        assertTrue(isActive);
        console.log("  SUCCESS: Pattern verified - Creator:", creator);

        // Test 2: Create delegation via DelegationRouter
        console.log("\n[2/4] Testing DelegationRouter...");
        vm.prank(delegator1);
        address smartAccount = makeAddr("smartAccount1");
        uint256 delegationId = delegationRouter.createSimpleDelegation(
            tokenId,
            5000, // 50%
            smartAccount
        );
        console.log("  SUCCESS: Delegation #", delegationId, "created");

        // Verify delegation
        (address delegatorAddr, uint256 pTokenId, uint256 allocation, bool active,) = 
            delegationRouter.getDelegationBasics(delegationId);
        assertEq(delegatorAddr, delegator1);
        assertEq(pTokenId, tokenId);
        assertEq(allocation, 5000);
        assertTrue(active);
        console.log("  SUCCESS: Delegation verified - Allocation: 50%");

        // Test 3: Update delegation
        console.log("\n[3/4] Testing delegation update...");
        vm.prank(delegator1);
        delegationRouter.updateDelegationPercentage(delegationId, 7500);

        (, , uint256 newAlloc, ,) = delegationRouter.getDelegationBasics(delegationId);
        assertEq(newAlloc, 7500);
        console.log("  SUCCESS: Delegation updated to 75%");

        // Test 4: Verify ExecutionEngine connectivity
        console.log("\n[4/4] Testing ExecutionEngine connectivity...");
        assertEq(address(executionEngine.delegationRouter()), address(delegationRouter));
        assertEq(address(executionEngine.behavioralNFT()), address(behavioralNFT));
        console.log("  SUCCESS: ExecutionEngine connected to DelegationRouter");
        console.log("  SUCCESS: ExecutionEngine connected to BehavioralNFT");

        // Final stats
        console.log("\n=== FINAL STATS ===");
        console.log("Total Patterns:", behavioralNFT.totalPatterns());
        console.log("Pattern Owner:", behavioralNFT.ownerOf(tokenId));
        console.log("Delegation Active:", active);

        console.log("\n=== ALL 4 CONTRACTS INTEGRATION TEST PASSED ===\n");
    }

    function test_MultiDelegationFlow() public {
        console.log("\n>>> TESTING MULTI-DELEGATION FLOW");

        // Create 2 patterns
        vm.startPrank(address(patternDetector));
        uint256 pattern1 = behavioralNFT.mintPattern(trader1, "Momentum", abi.encodePacked("m1"));
        uint256 pattern2 = behavioralNFT.mintPattern(trader1, "Arbitrage", abi.encodePacked("arb"));
        vm.stopPrank();

        console.log("Created 2 patterns:", pattern1, pattern2);

        // Create 2 delegations
        vm.startPrank(delegator1);
        address sa1 = makeAddr("sa1");
        address sa2 = makeAddr("sa2");

        uint256 del1 = delegationRouter.createSimpleDelegation(pattern1, 3000, sa1);
        uint256 del2 = delegationRouter.createSimpleDelegation(pattern2, 7000, sa2);
        vm.stopPrank();

        console.log("Created 2 delegations:", del1, del2);

        // Verify delegator has 2 delegations
        uint256[] memory delegations = delegationRouter.getDelegatorDelegations(delegator1);
        assertEq(delegations.length, 2);
        console.log("Delegator has", delegations.length, "delegations");

        // Revoke one
        vm.prank(delegator1);
        delegationRouter.revokeDelegation(del1);

        (, , , bool isActive,,) = delegationRouter.getDelegationBasics(del1);
        assertFalse(isActive);
        console.log("Delegation #1 revoked successfully");

        console.log("\n=== MULTI-DELEGATION FLOW TEST PASSED ===\n");
    }

    function test_ContractAddresses() public view {
        console.log("\n=== CONTRACT ADDRESSES ===");
        console.log("BehavioralNFT:    ", address(behavioralNFT));
        console.log("PatternDetector:  ", address(patternDetector));
        console.log("DelegationRouter: ", address(delegationRouter));
        console.log("ExecutionEngine:  ", address(executionEngine));
        console.log("=========================\n");
    }
}
