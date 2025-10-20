// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/ExecutionEngine.sol";

/**
 * @title SimpleEndToEndTest
 * @notice Simplified end-to-end test using direct minting
 * @dev Tests: Direct NFT Mint -> Delegation -> Execution
 */
contract SimpleEndToEndTest is Test {
    BehavioralNFT public nft;
    DelegationRouter public router;
    ExecutionEngine public engine;

    address public owner;
    address public trader1;
    address public trader2;

    function setUp() public {
        owner = address(this);
        trader1 = makeAddr("trader1");
        trader2 = makeAddr("trader2");

        // Deploy contracts
        nft = new BehavioralNFT();
        router = new DelegationRouter(address(nft));
        engine = new ExecutionEngine(address(router), address(nft));

        // Setup
        router.setExecutionEngine(address(engine));

        // Fund test accounts
        vm.deal(trader1, 100 ether);
        vm.deal(trader2, 100 ether);
    }

    function testCompleteFlow() public {
        console.log("==================================================");
        console.log("SIMPLE END-TO-END TEST");
        console.log("==================================================");

        // STEP 1: Mint pattern NFT directly (bypass PatternDetector for testing)
        console.log("\n1. MINTING PATTERN NFT");
        console.log("-----------------------");

        vm.prank(trader1);
        uint256 tokenId = nft.mintPattern(
            trader1,
            "TestStrategy",
            abi.encode("Test pattern data")
        );

        console.log("  Pattern minted: Token ID", tokenId);
        console.log("  Owner:", nft.ownerOf(tokenId));
        assertEq(nft.totalPatterns(), 1);
        assertEq(nft.ownerOf(tokenId), trader1);

        // STEP 2: Create delegation
        console.log("\n2. CREATING DELEGATION");
        console.log("-----------------------");

        vm.prank(trader2);
        router.createSimpleDelegation(tokenId, 2500); // 25%

        uint256[] memory delegations = router.getDelegatorDelegations(trader2);
        console.log("  Delegation created: ID", delegations[0]);
        console.log("  Delegator:", trader2);
        console.log("  Pattern Token ID:", tokenId);
        assertEq(delegations.length, 1);

        // STEP 3: Execute trade via ExecutionEngine
        console.log("\n3. EXECUTING TRADE");
        console.log("-------------------");

        vm.prank(trader1); // Pattern owner executes
        engine.executeTrade(
            1, // delegationId
            address(0x1111),
            address(0x2222),
            1 ether,
            1.1 ether
        );

        console.log("  Trade executed successfully");
        console.log("  [OK] ExecutionEngine interacted!");

        // STEP 4: Verify delegation state
        (,,,,,,,, bool isActive,) = router.delegations(1);
        assertTrue(isActive);
        console.log("  Delegation still active:", isActive);

        // STEP 5: Revoke delegation
        console.log("\n4. REVOKING DELEGATION");
        console.log("-----------------------");

        vm.prank(trader2);
        router.revokeDelegation(1);

        (,,,,,,,, bool isActiveAfter,) = router.delegations(1);
        assertFalse(isActiveAfter);
        console.log("  Delegation revoked");
        console.log("  Is active:", isActiveAfter);

        console.log("\n==================================================");
        console.log("TEST PASSED - ALL CONTRACT INTERACTIONS WORK!");
        console.log("==================================================");
        console.log("[OK] BehavioralNFT - Minting works");
        console.log("[OK] DelegationRouter - Creation works");
        console.log("[OK] DelegationRouter - Revocation works");
        console.log("[OK] ExecutionEngine - Trade execution works");
    }

    function testMultipleDelegationsToSamePattern() public {
        console.log("\n=== Testing Multiple Delegations ===");

        // Mint pattern
        vm.prank(trader1);
        uint256 tokenId = nft.mintPattern(trader1, "PopularStrategy", "");

        // Create multiple delegations
        address trader3 = makeAddr("trader3");
        address trader4 = makeAddr("trader4");

        vm.prank(trader2);
        router.createSimpleDelegation(tokenId, 2500);

        vm.prank(trader3);
        router.createSimpleDelegation(tokenId, 5000);

        vm.prank(trader4);
        router.createSimpleDelegation(tokenId, 2500);

        // Verify
        assertEq(router.getDelegatorDelegations(trader2).length, 1);
        assertEq(router.getDelegatorDelegations(trader3).length, 1);
        assertEq(router.getDelegatorDelegations(trader4).length, 1);
        assertEq(router.totalDelegations(), 3);

        console.log("  [OK] 3 users delegated to same pattern");
        console.log("  Total delegations:", router.totalDelegations());
    }

    function testExecutionEnginePermissions() public {
        console.log("\n=== Testing Execution Permissions ===");

        // Setup
        vm.prank(trader1);
        uint256 tokenId = nft.mintPattern(trader1, "TestPattern", "");

        vm.prank(trader2);
        router.createSimpleDelegation(tokenId, 2500);

        // Test: Non-owner cannot execute
        vm.prank(trader2);
        vm.expectRevert();
        engine.executeTrade(1, address(0x1111), address(0x2222), 1 ether, 1.1 ether);

        // Test: Owner can execute
        vm.prank(trader1);
        engine.executeTrade(1, address(0x1111), address(0x2222), 1 ether, 1.1 ether);

        console.log("  [OK] Only pattern owner can execute trades");
    }

    function testDelegationLimits() public {
        console.log("\n=== Testing Delegation Limits ===");

        vm.prank(trader1);
        uint256 tokenId = nft.mintPattern(trader1, "LimitTest", "");

        // Test: Cannot delegate > 100%
        vm.prank(trader2);
        vm.expectRevert();
        router.createSimpleDelegation(tokenId, 10001); // 100.01%

        // Test: Can delegate exactly 100%
        vm.prank(trader2);
        router.createSimpleDelegation(tokenId, 10000); // 100%

        console.log("  [OK] Delegation limits enforced");
    }
}
