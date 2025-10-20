// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/BehavioralNFT.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DelegationRouterTest
 * @notice Comprehensive test suite for DelegationRouter contract
 * @dev Tests all delegation functionality including MetaMask integration
 */
contract DelegationRouterTest is Test {
    DelegationRouter public router;
    BehavioralNFT public nft;
    MockERC20 public token;

    address public owner = address(1);
    address public patternDetector = address(2);
    address public executionEngine = address(3);
    address public user1 = address(4);
    address public user2 = address(5);
    address public smartAccount1 = address(6);
    address public smartAccount2 = address(7);

    uint256 public constant PATTERN_ID_1 = 1;
    uint256 public constant PATTERN_ID_2 = 2;

    // Events
    event DelegationCreated(
        uint256 indexed delegationId,
        address indexed delegator,
        uint256 indexed patternTokenId,
        uint256 percentageAllocation,
        address smartAccountAddress,
        uint256 timestamp
    );

    event DelegationRevoked(
        uint256 indexed delegationId,
        address indexed delegator,
        uint256 indexed patternTokenId,
        uint256 timestamp
    );

    event TradeExecuted(
        uint256 indexed delegationId,
        uint256 indexed patternTokenId,
        address indexed executor,
        address token,
        uint256 amount,
        bool success,
        uint256 timestamp
    );

    function setUp() public {
        // Deploy contracts
        vm.startPrank(owner);

        nft = new BehavioralNFT(owner);
        router = new DelegationRouter(address(nft), owner);
        token = new MockERC20("Test Token", "TEST", 18);

        // Setup NFT
        nft.setPatternDetector(patternDetector);

        // Setup router
        router.setExecutionEngine(executionEngine);

        vm.stopPrank();

        // Mint test patterns
        vm.startPrank(patternDetector);

        nft.mintPattern(
            user1,
            "momentum",
            abi.encode("momentum_params")
        );

        nft.mintPattern(
            user2,
            "arbitrage",
            abi.encode("arbitrage_params")
        );

        vm.stopPrank();

        // Fund users
        token.mint(user1, 1000 ether);
        token.mint(user2, 1000 ether);
    }

    /*//////////////////////////////////////////////////////////////
                        DELEGATION CREATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CreateDelegation_Success() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: block.timestamp + 30 days,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = DelegationRouter.ConditionalRequirements({
            minWinRate: 0,
            minROI: 0,
            minVolume: 0,
            isActive: false
        });

        vm.expectEmit(true, true, true, true);
        emit DelegationCreated(
            1,
            user1,
            PATTERN_ID_1,
            5000, // 50%
            smartAccount1,
            block.timestamp
        );

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000, // 50%
            permissions,
            conditions,
            smartAccount1
        );

        assertEq(delegationId, 1);

        // Verify delegation data
        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.delegator, user1);
        assertEq(delegation.patternTokenId, PATTERN_ID_1);
        assertEq(delegation.percentageAllocation, 5000);
        assertEq(delegation.smartAccountAddress, smartAccount1);
        assertTrue(delegation.isActive);

        vm.stopPrank();
    }

    function test_CreateSimpleDelegation_Success() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            10000, // 100%
            smartAccount1
        );

        assertEq(delegationId, 1);

        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.delegator, user1);
        assertEq(delegation.percentageAllocation, 10000);

        vm.stopPrank();
    }

    function test_CreateDelegation_InvalidPattern() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();
        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        vm.expectRevert(DelegationRouter.InvalidPatternId.selector);
        router.createDelegation(
            999, // Non-existent pattern
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();
    }

    function test_CreateDelegation_InvalidPercentage_TooLow() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();
        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        vm.expectRevert(DelegationRouter.InvalidPercentage.selector);
        router.createDelegation(
            PATTERN_ID_1,
            50, // Less than MIN_PERCENTAGE (100 = 1%)
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();
    }

    function test_CreateDelegation_InvalidPercentage_TooHigh() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();
        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        vm.expectRevert(DelegationRouter.InvalidPercentage.selector);
        router.createDelegation(
            PATTERN_ID_1,
            10001, // More than MAX_PERCENTAGE (10000 = 100%)
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();
    }

    function test_CreateDelegation_AlreadyExists() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();
        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        // Create first delegation
        router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        // Try to create duplicate
        vm.expectRevert(DelegationRouter.DelegationAlreadyExists.selector);
        router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();
    }

    function test_CreateDelegation_InvalidSmartAccount() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();
        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        vm.expectRevert(DelegationRouter.InvalidSmartAccount.selector);
        router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            address(0) // Invalid smart account
        );

        vm.stopPrank();
    }

    function test_CreateDelegation_ExpiredPermissions() public {
        vm.startPrank(user1);

        // Warp forward first
        vm.warp(block.timestamp + 100);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: block.timestamp - 10, // Already expired
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        vm.expectRevert(DelegationRouter.InvalidPermissions.selector);
        router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    DELEGATION MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevokeDelegation_Success() public {
        vm.startPrank(user1);

        // Create delegation
        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        // Revoke delegation
        vm.expectEmit(true, true, true, true);
        emit DelegationRevoked(
            delegationId,
            user1,
            PATTERN_ID_1,
            block.timestamp
        );

        router.revokeDelegation(delegationId);

        // Verify delegation is inactive
        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertFalse(delegation.isActive);

        // Verify can create new delegation now
        uint256 newDelegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            7500,
            smartAccount1
        );
        assertEq(newDelegationId, 2);

        vm.stopPrank();
    }

    function test_RevokeDelegation_Unauthorized() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.stopPrank();

        // Try to revoke from different user
        vm.startPrank(user2);

        vm.expectRevert(DelegationRouter.Unauthorized.selector);
        router.revokeDelegation(delegationId);

        vm.stopPrank();
    }

    function test_UpdateDelegationPercentage_Success() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        router.updateDelegationPercentage(delegationId, 7500);

        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.percentageAllocation, 7500);

        vm.stopPrank();
    }

    function test_UpdateDelegationPercentage_InvalidPercentage() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.expectRevert(DelegationRouter.InvalidPercentage.selector);
        router.updateDelegationPercentage(delegationId, 10001);

        vm.stopPrank();
    }

    function test_UpdateDelegationPercentage_Unauthorized() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.stopPrank();

        vm.startPrank(user2);

        vm.expectRevert(DelegationRouter.Unauthorized.selector);
        router.updateDelegationPercentage(delegationId, 7500);

        vm.stopPrank();
    }

    function test_UpdateDelegationConditions_Success() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        DelegationRouter.ConditionalRequirements memory newConditions = DelegationRouter.ConditionalRequirements({
            minWinRate: 6000, // 60%
            minROI: 1000,     // 10%
            minVolume: 100 ether,
            isActive: true
        });

        router.updateDelegationConditions(delegationId, newConditions);

        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.conditions.minWinRate, 6000);
        assertEq(delegation.conditions.minROI, 1000);
        assertTrue(delegation.conditions.isActive);

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                    EXECUTION VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ValidateExecution_Success() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: block.timestamp + 30 days,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        // Validate execution
        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,  // 70% win rate
            1500,  // 15% ROI
            500 ether
        );

        assertTrue(isValid);
        assertEq(reason, "");
    }

    function test_ValidateExecution_DelegationInactive() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        router.revokeDelegation(delegationId);

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Delegation inactive");
    }

    function test_ValidateExecution_PatternInactive() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.stopPrank();

        // Deactivate pattern
        vm.prank(user1);
        nft.deactivatePattern(PATTERN_ID_1, "test");

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Pattern inactive");
    }

    function test_ValidateExecution_Expired() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: block.timestamp + 1 hours,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        // Fast forward past expiration
        vm.warp(block.timestamp + 2 hours);

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Delegation expired");
    }

    function test_ValidateExecution_TokenNotAllowed() public {
        vm.startPrank(user1);

        address[] memory allowedTokens = new address[](1);
        allowedTokens[0] = address(999); // Different token

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: 0,
            allowedTokens: allowedTokens,
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Token not allowed");
    }

    function test_ValidateExecution_ExceedsPerTxLimit() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 10 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: 0,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            11 ether, // Exceeds maxSpendPerTx
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Exceeds per-tx limit");
    }

    function test_ValidateExecution_ExceedsDailyLimit() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 50 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: 0,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        // Record first execution
        vm.prank(executionEngine);
        router.recordExecution(delegationId, address(token), 60 ether, true);

        // Try to validate second execution that would exceed daily limit
        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            50 ether, // Would bring total to 110 ether
            7000,
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Exceeds daily limit");
    }

    function test_ValidateExecution_ConditionalWinRateFails() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();

        DelegationRouter.ConditionalRequirements memory conditions = DelegationRouter.ConditionalRequirements({
            minWinRate: 7000, // Require 70%
            minROI: 0,
            minVolume: 0,
            isActive: true
        });

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            6000, // Only 60% win rate
            1500,
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "Win rate below threshold");
    }

    function test_ValidateExecution_ConditionalROIFails() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();

        DelegationRouter.ConditionalRequirements memory conditions = DelegationRouter.ConditionalRequirements({
            minWinRate: 0,
            minROI: 2000, // Require 20% ROI
            minVolume: 0,
            isActive: true
        });

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1000, // Only 10% ROI
            500 ether
        );

        assertFalse(isValid);
        assertEq(reason, "ROI below threshold");
    }

    function test_ValidateExecution_ConditionalVolumeFails() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = _defaultPermissions();

        DelegationRouter.ConditionalRequirements memory conditions = DelegationRouter.ConditionalRequirements({
            minWinRate: 0,
            minROI: 0,
            minVolume: 1000 ether, // Require 1000 ether volume
            isActive: true
        });

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        (bool isValid, string memory reason) = router.validateExecution(
            delegationId,
            address(token),
            5 ether,
            7000,
            1500,
            500 ether // Only 500 ether volume
        );

        assertFalse(isValid);
        assertEq(reason, "Volume below threshold");
    }

    /*//////////////////////////////////////////////////////////////
                        EXECUTION RECORD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecordExecution_Success() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.stopPrank();

        // Record execution
        vm.startPrank(executionEngine);

        vm.expectEmit(true, true, true, true);
        emit TradeExecuted(
            delegationId,
            PATTERN_ID_1,
            executionEngine,
            address(token),
            5 ether,
            true,
            block.timestamp
        );

        router.recordExecution(
            delegationId,
            address(token),
            5 ether,
            true
        );

        vm.stopPrank();

        // Verify execution was recorded
        DelegationRouter.ExecutionRecord[] memory records = router.getDelegationExecutions(delegationId);
        assertEq(records.length, 1);
        assertEq(records[0].delegationId, delegationId);
        assertEq(records[0].amount, 5 ether);
        assertTrue(records[0].success);
    }

    function test_RecordExecution_Unauthorized() public {
        vm.startPrank(user1);

        uint256 delegationId = router.createSimpleDelegation(
            PATTERN_ID_1,
            5000,
            smartAccount1
        );

        vm.expectRevert(DelegationRouter.Unauthorized.selector);
        router.recordExecution(
            delegationId,
            address(token),
            5 ether,
            true
        );

        vm.stopPrank();
    }

    function test_RecordExecution_DailyLimitTracking() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 50 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: 0,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        // Record first execution
        vm.prank(executionEngine);
        router.recordExecution(delegationId, address(token), 40 ether, true);

        // Verify totalSpentToday updated
        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.totalSpentToday, 40 ether);

        // Record second execution
        vm.prank(executionEngine);
        router.recordExecution(delegationId, address(token), 30 ether, true);

        delegation = router.getDelegation(delegationId);
        assertEq(delegation.totalSpentToday, 70 ether);
    }

    function test_RecordExecution_DailyLimitReset() public {
        vm.startPrank(user1);

        DelegationRouter.DelegationPermissions memory permissions = DelegationRouter.DelegationPermissions({
            maxSpendPerTx: 50 ether,
            maxSpendPerDay: 100 ether,
            expiresAt: 0,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });

        DelegationRouter.ConditionalRequirements memory conditions = _defaultConditions();

        uint256 delegationId = router.createDelegation(
            PATTERN_ID_1,
            5000,
            permissions,
            conditions,
            smartAccount1
        );

        vm.stopPrank();

        // Record execution on day 1
        vm.prank(executionEngine);
        router.recordExecution(delegationId, address(token), 40 ether, true);

        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);

        // Record execution on day 2 (should reset counter)
        vm.prank(executionEngine);
        router.recordExecution(delegationId, address(token), 30 ether, true);

        DelegationRouter.Delegation memory delegation = router.getDelegation(delegationId);
        assertEq(delegation.totalSpentToday, 30 ether); // Should be reset
    }

    /*//////////////////////////////////////////////////////////////
                            QUERY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetDelegatorDelegations() public {
        vm.startPrank(user1);

        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);

        vm.stopPrank();

        vm.startPrank(user2);

        router.createSimpleDelegation(PATTERN_ID_2, 7500, smartAccount2);

        vm.stopPrank();

        uint256[] memory user1Delegations = router.getDelegatorDelegations(user1);
        assertEq(user1Delegations.length, 1);
        assertEq(user1Delegations[0], 1);

        uint256[] memory user2Delegations = router.getDelegatorDelegations(user2);
        assertEq(user2Delegations.length, 1);
        assertEq(user2Delegations[0], 2);
    }

    function test_GetPatternDelegations() public {
        vm.startPrank(user1);

        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);

        vm.stopPrank();

        vm.startPrank(user2);

        router.createSimpleDelegation(PATTERN_ID_1, 7500, smartAccount2);

        vm.stopPrank();

        uint256[] memory patternDelegations = router.getPatternDelegations(PATTERN_ID_1);
        assertEq(patternDelegations.length, 2);
        assertEq(patternDelegations[0], 1);
        assertEq(patternDelegations[1], 2);
    }

    function test_GetDelegationId() public {
        vm.startPrank(user1);

        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);

        vm.stopPrank();

        uint256 delegationId = router.getDelegationId(user1, PATTERN_ID_1);
        assertEq(delegationId, 1);

        uint256 nonExistent = router.getDelegationId(user2, PATTERN_ID_1);
        assertEq(nonExistent, 0);
    }

    function test_TotalDelegations() public {
        assertEq(router.totalDelegations(), 0);

        vm.prank(user1);
        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);

        assertEq(router.totalDelegations(), 1);

        vm.prank(user2);
        router.createSimpleDelegation(PATTERN_ID_2, 7500, smartAccount2);

        assertEq(router.totalDelegations(), 2);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetExecutionEngine_Success() public {
        address newEngine = address(999);

        vm.prank(owner);
        router.setExecutionEngine(newEngine);

        assertEq(router.executionEngine(), newEngine);
    }

    function test_SetExecutionEngine_Unauthorized() public {
        vm.prank(user1);

        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        router.setExecutionEngine(address(999));
    }

    function test_SetSmartAccountFactory_Success() public {
        address factory = address(888);

        vm.prank(owner);
        router.setSmartAccountFactory(factory);

        assertEq(router.smartAccountFactory(), factory);
    }

    function test_Pause_Success() public {
        vm.prank(owner);
        router.pause();

        vm.prank(user1);
        vm.expectRevert();
        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);
    }

    function test_Unpause_Success() public {
        vm.startPrank(owner);

        router.pause();
        router.unpause();

        vm.stopPrank();

        vm.prank(user1);
        router.createSimpleDelegation(PATTERN_ID_1, 5000, smartAccount1);
    }

    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _defaultPermissions() internal pure returns (DelegationRouter.DelegationPermissions memory) {
        return DelegationRouter.DelegationPermissions({
            maxSpendPerTx: type(uint256).max,
            maxSpendPerDay: type(uint256).max,
            expiresAt: 0,
            allowedTokens: new address[](0),
            requiresConditionalCheck: false
        });
    }

    function _defaultConditions() internal pure returns (DelegationRouter.ConditionalRequirements memory) {
        return DelegationRouter.ConditionalRequirements({
            minWinRate: 0,
            minROI: 0,
            minVolume: 0,
            isActive: false
        });
    }
}

/**
 * @title MockERC20
 * @notice Simple ERC20 for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue
    ) ERC20(name, symbol) {
        _decimals = decimalsValue;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
