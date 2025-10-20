// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

/**
 * @title PatternDetectorTest
 * @notice Comprehensive test suite for PatternDetector contract
 * @dev Tests pattern validation, minting, performance updates, and edge cases
 */
contract PatternDetectorTest is Test {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public backend = address(4);

    // Test pattern data
    bytes public momentumData = abi.encode(
        "WETH/USDC",      // pair
        uint256(3600),    // timeframe
        uint256(150),     // minMomentum
        uint256(5000)     // stopLoss
    );

    function setUp() public {
        // Warp to a time that allows for valid detection timestamps
        vm.warp(30 days);

        vm.startPrank(owner);

        // Deploy BehavioralNFT
        nft = new BehavioralNFT(owner);

        // Deploy PatternDetector
        detector = new PatternDetector(address(nft));

        // Configure BehavioralNFT to accept patterns from PatternDetector
        nft.setPatternDetector(address(detector));

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Deployment() public {
        assertEq(address(detector.behavioralNFT()), address(nft));
        assertEq(detector.owner(), owner);
        assertEq(detector.detectionCooldown(), 1 hours);
        assertEq(detector.maxActivePatternsPerUser(), 5);
        assertEq(detector.totalPatternsDetected(), 0);
        assertEq(detector.totalPatternsMinted(), 0);
    }

    function test_DefaultThresholds() public {
        // thresholds() returns multiple values, test them individually
        assertEq(detector.detectionCooldown(), 1 hours);
        assertEq(detector.maxActivePatternsPerUser(), 5);
    }

    function testRevert_DeploymentWithZeroAddress() public {
        vm.expectRevert(PatternDetector.InvalidBehavioralNFTAddress.selector);
        new PatternDetector(address(0));
    }

    /*//////////////////////////////////////////////////////////////
                      PATTERN VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ValidateAndMintPattern_Success() public {
        // Create valid pattern
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        // Mint pattern
        vm.prank(backend);
        uint256 tokenId = detector.validateAndMintPattern(pattern);

        // Verify NFT minted
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(detector.totalPatternsDetected(), 1);
        assertEq(detector.totalPatternsMinted(), 1);

        // Verify pattern metadata
        BehavioralNFT.PatternMetadata memory metadata = nft.getPatternMetadata(tokenId);
        assertEq(metadata.creator, user1);
        assertEq(metadata.patternType, "Momentum");
        assertEq(metadata.isActive, true);
        assertGt(metadata.winRate, 0);
        assertGt(metadata.totalVolume, 0);
    }

    function test_ValidateAndMintPattern_EmitsEvents() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        vm.prank(backend);

        // Expect PatternDetected event
        vm.expectEmit(true, false, false, true);
        emit PatternDetected(user1, "Momentum", pattern.confidence, block.timestamp);

        // Expect PatternValidatedAndMinted event
        vm.expectEmit(true, true, false, false);
        uint256 expectedWinRate = (pattern.successfulTrades * 10000) / pattern.totalTrades;
        emit PatternValidatedAndMinted(
            user1,
            1,
            "Momentum",
            expectedWinRate,
            pattern.totalVolume,
            0 // roi calculated in contract
        );

        detector.validateAndMintPattern(pattern);
    }

    function test_ValidateAndMintPattern_UpdatesUserHistory() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        PatternDetector.UserPatternHistory memory history = detector.getUserHistory(user1);
        assertEq(history.lastDetectionTime, block.timestamp);
        assertEq(history.totalPatternsMinted, 1);
        assertEq(history.activePatterns, 1);
        assertEq(history.deactivatedPatterns, 0);
    }

    function testRevert_ValidateAndMintPattern_InsufficientTrades() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.totalTrades = 5; // Below minimum of 10
        pattern.successfulTrades = 3;

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_InsufficientWinRate() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.totalTrades = 10;
        pattern.successfulTrades = 5; // 50% win rate, below 60% threshold

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_InsufficientVolume() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.totalVolume = 0.5 ether; // Below 1 ETH minimum

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_InsufficientConfidence() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.confidence = 5000; // 50%, below 70% threshold

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_InvalidPatternType() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.patternType = "InvalidType";

        vm.prank(backend);
        vm.expectRevert(PatternDetector.InvalidPatternType.selector);
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_DuplicatePattern() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        // Mint first time
        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        // Try to mint same pattern again
        vm.warp(block.timestamp + 2 hours); // Skip cooldown
        vm.prank(backend);
        vm.expectRevert(PatternDetector.PatternAlreadyMinted.selector);
        detector.validateAndMintPattern(pattern);
    }

    function testRevert_ValidateAndMintPattern_CooldownActive() public {
        PatternDetector.DetectedPattern memory pattern1 = _createValidPattern(user1);

        // Mint first pattern
        vm.prank(backend);
        detector.validateAndMintPattern(pattern1);

        // Try to mint another pattern immediately
        PatternDetector.DetectedPattern memory pattern2 = _createValidPattern(user1);
        pattern2.totalVolume = 2 ether; // Make it unique

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern2);
    }

    function test_ValidateAndMintPattern_AfterCooldown() public {
        PatternDetector.DetectedPattern memory pattern1 = _createValidPattern(user1);

        // Mint first pattern
        vm.prank(backend);
        detector.validateAndMintPattern(pattern1);

        // Wait for cooldown
        vm.warp(block.timestamp + 1 hours + 1);

        // Mint second pattern
        PatternDetector.DetectedPattern memory pattern2 = _createValidPattern(user1);
        pattern2.totalVolume = 2 ether; // Make it unique

        vm.prank(backend);
        uint256 tokenId = detector.validateAndMintPattern(pattern2);

        assertEq(tokenId, 2);
        assertEq(detector.totalPatternsMinted(), 2);
    }

    function testRevert_ValidateAndMintPattern_MaxPatternsReached() public {
        // Mint maximum patterns (5)
        for (uint256 i = 0; i < 5; i++) {
            PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
            pattern.totalVolume = (i + 1) * 1 ether; // Make each unique

            vm.warp(block.timestamp + (i * 2 hours)); // Skip cooldowns
            vm.prank(backend);
            detector.validateAndMintPattern(pattern);
        }

        // Try to mint 6th pattern
        vm.warp(block.timestamp + 10 hours);
        PatternDetector.DetectedPattern memory pattern6 = _createValidPattern(user1);
        pattern6.totalVolume = 10 ether;

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern6);
    }

    /*//////////////////////////////////////////////////////////////
                    PERFORMANCE UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdatePatternPerformance_Success() public {
        // Mint initial pattern
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        vm.prank(backend);
        uint256 tokenId = detector.validateAndMintPattern(pattern);

        // Update performance
        vm.prank(backend);
        detector.updatePatternPerformance(
            tokenId,
            5,      // newTrades
            4,      // newSuccessfulTrades
            1 ether, // newVolume
            0.2 ether // newPnL
        );

        // Verify updated metrics
        BehavioralNFT.PatternMetadata memory metadata = nft.getPatternMetadata(tokenId);
        assertGt(metadata.totalVolume, pattern.totalVolume);
    }

    function test_UpdatePatternPerformance_AutoDeactivation() public {
        // Mint pattern with good performance
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        vm.prank(backend);
        uint256 tokenId = detector.validateAndMintPattern(pattern);

        // Update with poor performance (win rate drops below 60%)
        vm.prank(backend);
        detector.updatePatternPerformance(
            tokenId,
            100,    // newTrades
            30,     // newSuccessfulTrades (30% win rate)
            10 ether,
            -5 ether // Losses
        );

        // Verify pattern was deactivated
        BehavioralNFT.PatternMetadata memory metadata = nft.getPatternMetadata(tokenId);
        assertEq(metadata.isActive, false);

        // Verify user history updated
        PatternDetector.UserPatternHistory memory history = detector.getUserHistory(user1);
        assertEq(history.activePatterns, 0);
        assertEq(history.deactivatedPatterns, 1);
    }

    /*//////////////////////////////////////////////////////////////
                      BATCH OPERATIONS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BatchValidateAndMint_Success() public {
        // Create multiple patterns
        PatternDetector.DetectedPattern[] memory patterns = new PatternDetector.DetectedPattern[](3);
        patterns[0] = _createValidPattern(user1);
        patterns[1] = _createValidPattern(user2);
        patterns[2] = _createValidPattern(address(5));

        // Make each unique
        patterns[0].totalVolume = 1 ether;
        patterns[1].totalVolume = 2 ether;
        patterns[2].totalVolume = 3 ether;

        // Batch mint
        vm.prank(backend);
        uint256[] memory tokenIds = detector.batchValidateAndMint(patterns);

        assertEq(tokenIds.length, 3);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(tokenIds[2], 3);
        assertEq(detector.totalPatternsMinted(), 3);
    }

    function test_BatchValidateAndMint_PartialFailure() public {
        PatternDetector.DetectedPattern[] memory patterns = new PatternDetector.DetectedPattern[](3);
        patterns[0] = _createValidPattern(user1);
        patterns[1] = _createValidPattern(user2);
        patterns[1].totalTrades = 5; // Invalid: below minimum
        patterns[2] = _createValidPattern(address(5));

        vm.prank(backend);
        uint256[] memory tokenIds = detector.batchValidateAndMint(patterns);

        assertEq(tokenIds[0], 1);  // Success
        assertEq(tokenIds[1], 0);  // Failed
        assertEq(tokenIds[2], 2);  // Success
        assertEq(detector.totalPatternsMinted(), 2);
    }

    /*//////////////////////////////////////////////////////////////
                         VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetUserHistory() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        PatternDetector.UserPatternHistory memory history = detector.getUserHistory(user1);
        assertEq(history.totalPatternsMinted, 1);
        assertEq(history.activePatterns, 1);
    }

    function test_IsPatternMinted() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        // Check before minting
        assertEq(detector.isPatternMinted(pattern), false);

        // Mint pattern
        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        // Check after minting
        assertEq(detector.isPatternMinted(pattern), true);
    }

    function test_GetCooldownRemaining() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        // Before any pattern
        assertEq(detector.getCooldownRemaining(user1), 0);

        // After minting
        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        assertEq(detector.getCooldownRemaining(user1), 1 hours);

        // After half cooldown
        vm.warp(block.timestamp + 30 minutes);
        assertEq(detector.getCooldownRemaining(user1), 30 minutes);

        // After full cooldown
        vm.warp(block.timestamp + 31 minutes);
        assertEq(detector.getCooldownRemaining(user1), 0);
    }

    function test_CanUserMintPattern() public {
        // Initially can mint
        (bool canMint, string memory reason) = detector.canUserMintPattern(user1);
        assertEq(canMint, true);
        assertEq(bytes(reason).length, 0);

        // After minting, cooldown active
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        vm.prank(backend);
        detector.validateAndMintPattern(pattern);

        (canMint, reason) = detector.canUserMintPattern(user1);
        assertEq(canMint, false);
        assertEq(reason, "Cooldown period active");

        // After cooldown, can mint again
        vm.warp(block.timestamp + 2 hours);
        (canMint, reason) = detector.canUserMintPattern(user1);
        assertEq(canMint, true);
    }

    function test_ValidatePatternView() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        (bool isValid, string memory reason) = detector.validatePatternView(pattern);
        assertEq(isValid, true);
        assertEq(bytes(reason).length, 0);
    }

    function test_ValidatePatternView_Invalid() public {
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.totalTrades = 5; // Below minimum

        (bool isValid, string memory reason) = detector.validatePatternView(pattern);
        assertEq(isValid, false);
        assertEq(reason, "Insufficient trades");
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateThresholds() public {
        vm.prank(owner);
        detector.updateThresholds(
            20,     // minTrades
            7000,   // minWinRate (70%)
            2 ether, // minVolume
            8000,   // minConfidence (80%)
            14 days // minTimePeriod
        );

        // Thresholds updated successfully (event would be emitted)
        // Cannot read struct directly, but can verify via validation
        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);
        pattern.totalTrades = 15; // Between old (10) and new (20) threshold

        (bool isValid,) = detector.validatePatternView(pattern);
        assertEq(isValid, false); // Should fail with new higher threshold
    }

    function testRevert_UpdateThresholds_InvalidWinRate() public {
        vm.prank(owner);
        vm.expectRevert(PatternDetector.InvalidThresholds.selector);
        detector.updateThresholds(10, 15000, 1 ether, 7000, 7 days); // 150% win rate
    }

    function testRevert_UpdateThresholds_Unauthorized() public {
        vm.prank(user1);
        vm.expectRevert();
        detector.updateThresholds(20, 7000, 2 ether, 8000, 14 days);
    }

    function test_UpdateCooldown() public {
        vm.prank(owner);
        detector.updateCooldown(2 hours);

        assertEq(detector.detectionCooldown(), 2 hours);
    }

    function test_UpdateMaxPatternsPerUser() public {
        vm.prank(owner);
        detector.updateMaxPatternsPerUser(10);

        assertEq(detector.maxActivePatternsPerUser(), 10);
    }

    function test_PauseAndUnpause() public {
        vm.startPrank(owner);

        // Pause
        detector.pause();
        assertEq(detector.paused(), true);

        // Unpause
        detector.unpause();
        assertEq(detector.paused(), false);

        vm.stopPrank();
    }

    function testRevert_ValidateAndMintPattern_WhenPaused() public {
        vm.prank(owner);
        detector.pause();

        PatternDetector.DetectedPattern memory pattern = _createValidPattern(user1);

        vm.prank(backend);
        vm.expectRevert();
        detector.validateAndMintPattern(pattern);
    }

    /*//////////////////////////////////////////////////////////////
                       PATTERN TYPE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AllPatternTypes() public {
        string[6] memory patternTypes = [
            "Momentum",
            "MeanReversion",
            "Arbitrage",
            "Liquidity",
            "Yield",
            "Composite"
        ];

        for (uint256 i = 0; i < patternTypes.length; i++) {
            PatternDetector.DetectedPattern memory pattern = _createValidPattern(address(uint160(100 + i)));
            pattern.patternType = patternTypes[i];
            pattern.totalVolume = (i + 1) * 1 ether; // Make unique

            vm.prank(backend);
            uint256 tokenId = detector.validateAndMintPattern(pattern);

            assertEq(nft.ownerOf(tokenId), address(uint160(100 + i)));

            BehavioralNFT.PatternMetadata memory metadata = nft.getPatternMetadata(tokenId);
            assertEq(metadata.patternType, patternTypes[i]);

            vm.warp(block.timestamp + 2 hours); // Skip cooldown
        }
    }

    /*//////////////////////////////////////////////////////////////
                         HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _createValidPattern(address user) internal view returns (PatternDetector.DetectedPattern memory) {
        // Ensure we have a valid timestamp (at least 8 days from epoch)
        uint256 detectionTime = block.timestamp > 8 days ? block.timestamp - 8 days : 0;

        return PatternDetector.DetectedPattern({
            user: user,
            patternType: "Momentum",
            patternData: momentumData,
            totalTrades: 15,
            successfulTrades: 10,  // 66.7% win rate
            totalVolume: 5 ether,
            totalPnL: 1 ether,
            confidence: 8500,      // 85%
            detectedAt: detectionTime
        });
    }

    // Event declarations for testing
    event PatternDetected(address indexed user, string patternType, uint256 confidence, uint256 timestamp);
    event PatternValidatedAndMinted(
        address indexed user,
        uint256 indexed tokenId,
        string patternType,
        uint256 winRate,
        uint256 volume,
        int256 roi
    );
}
