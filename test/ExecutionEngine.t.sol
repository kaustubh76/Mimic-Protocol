// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/ExecutionEngine.sol";
import "../contracts/DelegationRouter.sol";
import "../contracts/BehavioralNFT.sol";
import "../contracts/PatternDetector.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ExecutionEngineTest
 * @notice Comprehensive test suite for ExecutionEngine contract
 * @dev Tests trade execution, validation, batch processing, and multi-layer delegations
 */
contract ExecutionEngineTest is Test {
    ExecutionEngine public engine;
    DelegationRouter public router;
    BehavioralNFT public nft;
    PatternDetector public detector;
    MockERC20 public token;
    MockDEX public dex;

    address public owner = address(1);
    address public executor = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public user3 = address(7);
    address public smartAccount1 = address(5);
    address public smartAccount2 = address(6);
    address public smartAccount3 = address(8);

    uint256 public patternTokenId1;
    uint256 public patternTokenId2;
    uint256 public delegationId1;
    uint256 public delegationId2;

    // Test pattern data
    bytes public momentumData = abi.encode(
        "WETH/USDC",
        uint256(3600),
        uint256(150),
        uint256(5000)
    );

    function setUp() public {
        vm.warp(30 days);

        vm.startPrank(owner);

        // Deploy core contracts
        nft = new BehavioralNFT(owner);
        detector = new PatternDetector(address(nft));
        router = new DelegationRouter(address(nft), owner);
        engine = new ExecutionEngine(address(router), address(nft));

        // Deploy mock token and DEX
        token = new MockERC20("Test Token", "TEST");
        dex = new MockDEX(address(token));

        // Configure contracts
        nft.setPatternDetector(address(detector));
        router.setExecutionEngine(address(engine));

        // Add executor
        engine.addExecutor(executor);

        vm.stopPrank();

        // Mint patterns for testing
        _setupTestPatterns();
        _setupTestDelegations();
    }

    /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public {
        assertEq(address(engine.delegationRouter()), address(router));
        assertEq(address(engine.behavioralNFT()), address(nft));
        assertEq(engine.maxDelegationDepth(), 3);
        assertEq(engine.minExecutionInterval(), 1 minutes);
        assertEq(engine.totalTradesExecuted(), 0);
        assertEq(engine.totalVolumeExecuted(), 0);
        assertTrue(engine.isExecutor(owner));
        assertTrue(engine.isExecutor(executor));
    }

    function testRevert_DeploymentWithZeroAddress() public {
        vm.expectRevert(ExecutionEngine.ZeroAddress.selector);
        new ExecutionEngine(address(0), address(nft));

        vm.expectRevert(ExecutionEngine.ZeroAddress.selector);
        new ExecutionEngine(address(router), address(0));
    }

    /*//////////////////////////////////////////////////////////////
                      SINGLE TRADE EXECUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ExecuteTrade_Success() public {
        // Prepare trade params
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        // Prepare performance metrics (meets requirements)
        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000, // 70%
            currentROI: 2000,     // 20%
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        // Fund smart account
        token.mint(smartAccount1, 1000 ether);

        // Execute trade
        vm.prank(executor);
        bool success = engine.executeTrade(params, metrics);

        assertTrue(success);
        assertEq(engine.totalTradesExecuted(), 1);
        assertEq(engine.totalVolumeExecuted(), 500 ether); // 50% allocation
    }

    function test_ExecuteTrade_AppliesPercentageCorrectly() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);

        vm.prank(executor);
        engine.executeTrade(params, metrics);

        // Check that 50% allocation was applied
        assertEq(engine.totalVolumeExecuted(), 500 ether);
    }

    function test_ExecuteTrade_UpdatesStatistics() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);

        vm.prank(executor);
        engine.executeTrade(params, metrics);

        // Check execution stats
        ExecutionEngine.ExecutionStats memory stats = engine.getExecutionStats(delegationId1);
        assertEq(stats.totalExecutions, 1);
        assertEq(stats.successfulExecutions, 1);
        assertEq(stats.failedExecutions, 0);
        assertEq(stats.totalVolumeExecuted, 500 ether);
        assertGt(stats.totalGasUsed, 0);
        assertEq(stats.lastExecutionTime, block.timestamp);
    }

    function test_ExecuteTrade_TracksGasSavings() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);

        uint256 gasSavedBefore = engine.totalGasSaved();

        vm.prank(executor);
        engine.executeTrade(params, metrics);

        // Should track ~50k gas saved per execution
        assertEq(engine.totalGasSaved(), gasSavedBefore + 50000);
    }

    function testRevert_ExecuteTrade_Unauthorized() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        vm.prank(user1); // Not an executor
        vm.expectRevert(ExecutionEngine.Unauthorized.selector);
        engine.executeTrade(params, metrics);
    }

    function testRevert_ExecuteTrade_InvalidToken() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(0), // Invalid
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        vm.prank(executor);
        vm.expectRevert(ExecutionEngine.InvalidToken.selector);
        engine.executeTrade(params, metrics);
    }

    function testRevert_ExecuteTrade_InvalidAmount() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 0, // Invalid
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        vm.prank(executor);
        vm.expectRevert(ExecutionEngine.InvalidAmount.selector);
        engine.executeTrade(params, metrics);
    }

    function testRevert_ExecuteTrade_DelegationInactive() public {
        // Revoke delegation
        vm.prank(user1);
        router.revokeDelegation(delegationId1);

        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        vm.prank(executor);
        vm.expectRevert(ExecutionEngine.DelegationInactive.selector);
        engine.executeTrade(params, metrics);
    }

    function testRevert_ExecuteTrade_ExecutionIntervalNotMet() public {
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 2000 ether);

        // Execute first trade
        vm.prank(executor);
        engine.executeTrade(params, metrics);

        // Try to execute again immediately
        vm.prank(executor);
        vm.expectRevert();
        engine.executeTrade(params, metrics);

        // Warp forward past interval
        vm.warp(block.timestamp + 2 minutes);

        // Should succeed now
        vm.prank(executor);
        bool success = engine.executeTrade(params, metrics);
        assertTrue(success);
    }

    /*//////////////////////////////////////////////////////////////
                      BATCH EXECUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ExecuteBatch_Success() public {
        // Create multiple trade params
        ExecutionEngine.TradeParams[] memory tradeParams = new ExecutionEngine.TradeParams[](2);
        tradeParams[0] = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 500 ether)
        });
        tradeParams[1] = ExecutionEngine.TradeParams({
            delegationId: delegationId2,
            token: address(token),
            amount: 2000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        // Create metrics array
        ExecutionEngine.PerformanceMetrics[] memory metricsArray = new ExecutionEngine.PerformanceMetrics[](2);
        metricsArray[0] = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });
        metricsArray[1] = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 8000,
            currentROI: 3000,
            currentVolume: 15 ether,
            lastUpdated: block.timestamp
        });

        // Fund smart accounts
        token.mint(smartAccount1, 1000 ether);
        token.mint(smartAccount2, 2000 ether);

        // Execute batch
        vm.prank(executor);
        uint256 successCount = engine.executeBatch(tradeParams, metricsArray);

        assertEq(successCount, 2);
        assertEq(engine.totalTradesExecuted(), 2);
    }

    function testRevert_ExecuteBatch_ArrayLengthMismatch() public {
        ExecutionEngine.TradeParams[] memory tradeParams = new ExecutionEngine.TradeParams[](2);
        ExecutionEngine.PerformanceMetrics[] memory metricsArray = new ExecutionEngine.PerformanceMetrics[](1);

        vm.prank(executor);
        vm.expectRevert();
        engine.executeBatch(tradeParams, metricsArray);
    }

    function test_ExecuteBatch_PartialSuccess() public {
        // Create trades where one will fail
        ExecutionEngine.TradeParams[] memory tradeParams = new ExecutionEngine.TradeParams[](2);
        tradeParams[0] = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 500 ether)
        });
        tradeParams[1] = ExecutionEngine.TradeParams({
            delegationId: delegationId2,
            token: address(token),
            amount: 2000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics[] memory metricsArray = new ExecutionEngine.PerformanceMetrics[](2);
        metricsArray[0] = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });
        metricsArray[1] = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 3000, // Below threshold - will fail
            currentROI: -1000,
            currentVolume: 1 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);
        // Don't fund smartAccount2 - will fail

        vm.prank(executor);
        uint256 successCount = engine.executeBatch(tradeParams, metricsArray);

        assertEq(successCount, 1); // Only first trade should succeed
    }

    /*//////////////////////////////////////////////////////////////
                      MULTI-LAYER EXECUTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ExecuteMultiLayer_Success() public {
        // Create second layer delegation (user3 delegates to pattern1)
        vm.startPrank(user3);
        nft.setApprovalForAll(address(router), true);
        uint256 layer2DelegationId = router.createSimpleDelegation(
            patternTokenId1,
            3000, // 30% (in basis points)
            smartAccount3
        );
        vm.stopPrank();

        // Silence unused variable warning
        layer2DelegationId;

        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);
        token.mint(smartAccount3, 1000 ether);

        vm.prank(executor);
        uint256 executionCount = engine.executeMultiLayer(delegationId1, params, metrics);

        assertGt(executionCount, 0); // Should execute at least root delegation
    }

    /*//////////////////////////////////////////////////////////////
                      VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_CanExecuteTrade_Success() public {
        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        (bool canExecute, string memory reason) = engine.canExecuteTrade(
            delegationId1,
            address(token),
            1000 ether,
            metrics
        );

        assertTrue(canExecute);
        assertEq(bytes(reason).length, 0);
    }

    function test_CanExecuteTrade_DelegationInactive() public {
        // Revoke delegation
        vm.prank(user1);
        router.revokeDelegation(delegationId1);

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        (bool canExecute, string memory reason) = engine.canExecuteTrade(
            delegationId1,
            address(token),
            1000 ether,
            metrics
        );

        assertFalse(canExecute);
        assertEq(reason, "Delegation inactive");
    }

    /*//////////////////////////////////////////////////////////////
                      QUERY FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetExecutionStats() public {
        ExecutionEngine.ExecutionStats memory stats = engine.getExecutionStats(delegationId1);

        assertEq(stats.totalExecutions, 0);
        assertEq(stats.successfulExecutions, 0);
        assertEq(stats.failedExecutions, 0);
        assertEq(stats.totalVolumeExecuted, 0);
        assertEq(stats.totalGasUsed, 0);
        assertEq(stats.lastExecutionTime, 0);
    }

    function test_GetSuccessRate() public {
        uint256 rate = engine.getSuccessRate(delegationId1);
        assertEq(rate, 0); // No executions yet
    }

    function test_GetSuccessRate_AfterExecutions() public {
        // Execute some trades
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 2000 ether);

        vm.startPrank(executor);
        engine.executeTrade(params, metrics);

        vm.warp(block.timestamp + 2 minutes);
        engine.executeTrade(params, metrics);
        vm.stopPrank();

        uint256 rate = engine.getSuccessRate(delegationId1);
        assertEq(rate, 10000); // 100% success rate (both succeeded)
    }

    function test_GetGlobalMetrics() public {
        (uint256 totalTrades, uint256 totalVolume, uint256 gasSaved) = engine.getGlobalMetrics();

        assertEq(totalTrades, 0);
        assertEq(totalVolume, 0);
        assertEq(gasSaved, 0);
    }

    /*//////////////////////////////////////////////////////////////
                      ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddExecutor() public {
        address newExecutor = address(10);

        vm.prank(owner);
        engine.addExecutor(newExecutor);

        assertTrue(engine.isExecutor(newExecutor));
    }

    function testRevert_AddExecutor_Unauthorized() public {
        address newExecutor = address(10);

        vm.prank(user1);
        vm.expectRevert();
        engine.addExecutor(newExecutor);
    }

    function testRevert_AddExecutor_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ExecutionEngine.ZeroAddress.selector);
        engine.addExecutor(address(0));
    }

    function test_RemoveExecutor() public {
        vm.prank(owner);
        engine.removeExecutor(executor);

        assertFalse(engine.isExecutor(executor));
    }

    function test_SetMaxDelegationDepth() public {
        vm.prank(owner);
        engine.setMaxDelegationDepth(5);

        assertEq(engine.maxDelegationDepth(), 5);
    }

    function testRevert_SetMaxDelegationDepth_InvalidValue() public {
        vm.prank(owner);
        vm.expectRevert();
        engine.setMaxDelegationDepth(0);

        vm.prank(owner);
        vm.expectRevert();
        engine.setMaxDelegationDepth(10);
    }

    function test_SetMinExecutionInterval() public {
        vm.prank(owner);
        engine.setMinExecutionInterval(5 minutes);

        assertEq(engine.minExecutionInterval(), 5 minutes);
    }

    function test_Pause() public {
        vm.prank(owner);
        engine.pause();

        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        vm.prank(executor);
        vm.expectRevert();
        engine.executeTrade(params, metrics);
    }

    function test_Unpause() public {
        vm.startPrank(owner);
        engine.pause();
        engine.unpause();
        vm.stopPrank();

        // Should be able to execute now
        ExecutionEngine.TradeParams memory params = ExecutionEngine.TradeParams({
            delegationId: delegationId1,
            token: address(token),
            amount: 1000 ether,
            targetContract: address(dex),
            callData: abi.encodeWithSignature("swap(address,uint256)", address(token), 1000 ether)
        });

        ExecutionEngine.PerformanceMetrics memory metrics = ExecutionEngine.PerformanceMetrics({
            currentWinRate: 7000,
            currentROI: 2000,
            currentVolume: 10 ether,
            lastUpdated: block.timestamp
        });

        token.mint(smartAccount1, 1000 ether);

        vm.prank(executor);
        bool success = engine.executeTrade(params, metrics);
        assertTrue(success);
    }

    /*//////////////////////////////////////////////////////////////
                          HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _setupTestPatterns() internal {
        // Create pattern for user1
        PatternDetector.DetectedPattern memory pattern1 = PatternDetector.DetectedPattern({
            user: user1,
            patternType: "Momentum",
            patternData: momentumData,
            totalTrades: 20,
            successfulTrades: 15,
            totalVolume: 50 ether,
            totalPnL: 10 ether,
            confidence: 8000,
            detectedAt: block.timestamp - 10 days
        });

        vm.prank(owner);
        patternTokenId1 = detector.validateAndMintPattern(pattern1);

        // Create pattern for user2
        PatternDetector.DetectedPattern memory pattern2 = PatternDetector.DetectedPattern({
            user: user2,
            patternType: "MeanReversion",
            patternData: momentumData,
            totalTrades: 30,
            successfulTrades: 22,
            totalVolume: 100 ether,
            totalPnL: 20 ether,
            confidence: 8500,
            detectedAt: block.timestamp - 15 days
        });

        vm.prank(owner);
        patternTokenId2 = detector.validateAndMintPattern(pattern2);
    }

    function _setupTestDelegations() internal {
        // User2 creates delegation to pattern1 (user1's pattern)
        vm.startPrank(user2);
        nft.setApprovalForAll(address(router), true);
        delegationId1 = router.createSimpleDelegation(
            patternTokenId1,
            5000, // 50% allocation (in basis points)
            smartAccount1
        );
        vm.stopPrank();

        // User1 creates delegation to pattern2 (user2's pattern)
        vm.startPrank(user1);
        nft.setApprovalForAll(address(router), true);
        delegationId2 = router.createSimpleDelegation(
            patternTokenId2,
            7500, // 75% allocation (in basis points)
            smartAccount2
        );
        vm.stopPrank();
    }
}

/**
 * @notice Mock ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @notice Mock DEX for testing trade execution
 */
contract MockDEX {
    address public token;

    constructor(address _token) {
        token = _token;
    }

    function swap(address _token, uint256 amount) external returns (bool) {
        // Simple mock - just return success
        return true;
    }
}
