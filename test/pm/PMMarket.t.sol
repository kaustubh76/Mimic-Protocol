// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {PMMarket} from "../../contracts/pm/PMMarket.sol";
import {PMMarketFactory} from "../../contracts/pm/PMMarketFactory.sol";
import {PMMockOracle} from "../../contracts/pm/PMMockOracle.sol";

/**
 * @title PMMarketTest
 * @notice End-to-end tests of the PM contracts. Verifies the four-state
 *         machine and the event emission shape the indexer in
 *         pow/envio-pm-template-v1/ subscribes to.
 *
 *         Tests are organised by state transition:
 *         - lifecycle: OPEN positions → lock → settle → claim
 *         - correction: SETTLED → CORRECTED, claim post-correction
 *         - guards: forbidden transitions, double-resolution, oracle-only access
 */
contract PMMarketTest is Test {
    PMMarketFactory factory;
    PMMockOracle oracle;
    PMMarket market;

    address resolver = address(0xBEEF);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address carol = address(0xCA101);

    bytes32 constant QUESTION_ID = keccak256("Will event X happen by Y?");
    uint256 endTime;
    uint8 constant OUTCOME_COUNT = 2;

    // Events mirror PMMarket / PMMarketFactory exactly so vm.expectEmit can
    // catch any signature drift between the contracts and the indexer's ABI.
    event MarketCreated(
        address indexed market, bytes32 indexed questionId, uint256 endTime, uint8 outcomeCount, string category
    );
    event PositionTaken(address indexed trader, uint8 outcomeIndex, uint256 shares, uint256 collateralIn);
    event PositionClosed(address indexed trader, uint8 outcomeIndex, uint256 shares, uint256 collateralOut);
    event MarketLockedForResolution(uint256 lockedAt);
    event OracleResolved(uint8 winningOutcome, uint256 resolvedAt, bytes32 oracleResolutionId);
    event MarketCorrected(uint8 previousWinningOutcome, uint8 correctedWinningOutcome, uint256 correctedAt);
    event PayoutClaimed(address indexed trader, uint256 payout);

    function setUp() public {
        oracle = new PMMockOracle(resolver);
        factory = new PMMarketFactory(address(oracle));
        endTime = block.timestamp + 1 days;

        // Default market for the bulk of tests.
        vm.expectEmit(false, true, false, true);
        emit MarketCreated(address(0), QUESTION_ID, endTime, OUTCOME_COUNT, "binary");
        address marketAddr = factory.createMarket(QUESTION_ID, endTime, OUTCOME_COUNT, "binary");
        market = PMMarket(marketAddr);

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
    }

    // -----------------------------------------------------------------
    // Happy-path lifecycle
    // -----------------------------------------------------------------

    function test_lifecycle_open_settled_claim() public {
        // Alice bets 10 on outcome 0; Bob bets 30 on outcome 1.
        vm.expectEmit(true, false, false, true);
        emit PositionTaken(alice, 0, 10 ether, 10 ether);
        vm.prank(alice);
        market.takePosition{value: 10 ether}(0);

        vm.expectEmit(true, false, false, true);
        emit PositionTaken(bob, 1, 30 ether, 30 ether);
        vm.prank(bob);
        market.takePosition{value: 30 ether}(1);

        assertEq(market.totalCollateral(), 40 ether);

        // Lock at deadline.
        vm.warp(endTime + 1);
        vm.expectEmit(false, false, false, true);
        emit MarketLockedForResolution(block.timestamp);
        market.lockForResolution();
        assertEq(uint256(market.state()), uint256(PMMarket.State.RESOLVING));

        // Oracle settles outcome 0 (Alice wins).
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);
        assertEq(uint256(market.state()), uint256(PMMarket.State.SETTLED));
        assertEq(market.winningOutcome(), 0);
        assertTrue(market.oracleResolutionId() != bytes32(0));

        // Alice claims pro-rata. She holds 100% of outcome-0 shares, so she
        // gets the full 40 ether pool.
        uint256 aliceBalanceBefore = alice.balance;
        vm.expectEmit(true, false, false, true);
        emit PayoutClaimed(alice, 40 ether);
        vm.prank(alice);
        market.claimPayout(0);
        assertEq(alice.balance - aliceBalanceBefore, 40 ether);

        // Bob can't claim — he held the losing outcome.
        vm.prank(bob);
        vm.expectRevert(PMMarket.NoPayout.selector);
        market.claimPayout(1);
    }

    function test_position_close_returns_collateral() public {
        vm.prank(alice);
        market.takePosition{value: 5 ether}(0);

        uint256 aliceBefore = alice.balance;
        vm.expectEmit(true, false, false, true);
        emit PositionClosed(alice, 0, 5 ether, 5 ether);
        vm.prank(alice);
        market.closePosition(0, 5 ether);

        assertEq(alice.balance - aliceBefore, 5 ether);
        assertEq(market.totalCollateral(), 0);
    }

    // -----------------------------------------------------------------
    // Correction path
    // -----------------------------------------------------------------

    function test_correction_after_settlement() public {
        vm.prank(alice);
        market.takePosition{value: 10 ether}(0);
        vm.prank(bob);
        market.takePosition{value: 10 ether}(1);

        vm.warp(endTime + 1);
        market.lockForResolution();

        // First resolve to outcome 0.
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);

        // Then correct to outcome 1.
        vm.expectEmit(false, false, false, true);
        emit MarketCorrected(0, 1, block.timestamp);
        vm.prank(resolver);
        oracle.correctResolution(address(market), 1);

        assertEq(uint256(market.state()), uint256(PMMarket.State.CORRECTED));
        assertEq(market.winningOutcome(), 1);

        // Bob (the new winner) can claim. Alice can't.
        vm.prank(bob);
        market.claimPayout(1);

        vm.prank(alice);
        vm.expectRevert(PMMarket.NoPayout.selector);
        market.claimPayout(0);
    }

    // -----------------------------------------------------------------
    // Guards / state-machine integrity
    // -----------------------------------------------------------------

    function test_cannot_take_position_after_lock() public {
        vm.warp(endTime + 1);
        market.lockForResolution();

        vm.prank(alice);
        vm.expectRevert(PMMarket.NotOpen.selector);
        market.takePosition{value: 1 ether}(0);
    }

    function test_cannot_lock_before_deadline() public {
        vm.expectRevert(PMMarket.PastDeadline.selector);
        market.lockForResolution();
    }

    function test_oracle_double_resolve_reverts() public {
        vm.warp(endTime + 1);
        market.lockForResolution();
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);

        // Second call to oracle should revert at the oracle layer.
        vm.prank(resolver);
        vm.expectRevert(PMMockOracle.AlreadyResolved.selector);
        oracle.reportResolution(address(market), 1);
    }

    function test_only_oracle_can_resolve() public {
        vm.warp(endTime + 1);
        market.lockForResolution();

        // Direct call to market.onOracleResolved bypassing oracle should fail.
        vm.expectRevert(PMMarket.NotOracle.selector);
        market.onOracleResolved(0, bytes32("forged-id"));
    }

    function test_only_resolver_can_report() public {
        vm.warp(endTime + 1);
        market.lockForResolution();

        vm.prank(alice); // not the resolver
        vm.expectRevert(PMMockOracle.NotResolver.selector);
        oracle.reportResolution(address(market), 0);
    }

    function test_correction_requires_prior_resolution() public {
        vm.warp(endTime + 1);
        market.lockForResolution();

        vm.prank(resolver);
        vm.expectRevert(PMMockOracle.NotResolved.selector);
        oracle.correctResolution(address(market), 0);
    }

    function test_invalid_outcome_index_rejected() public {
        vm.prank(alice);
        vm.expectRevert(PMMarket.InvalidOutcome.selector);
        market.takePosition{value: 1 ether}(99);
    }

    // -----------------------------------------------------------------
    // Multi-trader pro-rata payout math
    // -----------------------------------------------------------------

    function test_pro_rata_payout_three_traders() public {
        // Alice + Bob both bet on outcome 0; Carol bets on outcome 1.
        vm.prank(alice);
        market.takePosition{value: 6 ether}(0);
        vm.prank(bob);
        market.takePosition{value: 4 ether}(0);
        vm.prank(carol);
        market.takePosition{value: 10 ether}(1);

        // Total pool = 20 ether. Outcome-0 winning pool = 10 ether.
        // Alice = 6/10 of 20 = 12 ether. Bob = 4/10 of 20 = 8 ether.

        vm.warp(endTime + 1);
        market.lockForResolution();
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;

        vm.prank(alice);
        market.claimPayout(0);
        vm.prank(bob);
        market.claimPayout(0);

        assertEq(alice.balance - aliceBefore, 12 ether);
        assertEq(bob.balance - bobBefore, 8 ether);
    }

    function test_double_claim_reverts() public {
        vm.prank(alice);
        market.takePosition{value: 5 ether}(0);

        vm.warp(endTime + 1);
        market.lockForResolution();
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);

        vm.prank(alice);
        market.claimPayout(0);

        vm.prank(alice);
        vm.expectRevert(PMMarket.AlreadyClaimed.selector);
        market.claimPayout(0);
    }

    // -----------------------------------------------------------------
    // Factory-level checks
    // -----------------------------------------------------------------

    function test_factory_rejects_past_endTime() public {
        vm.expectRevert(PMMarketFactory.InvalidEndTime.selector);
        factory.createMarket(QUESTION_ID, block.timestamp, 2, "binary");
    }

    function test_factory_rejects_single_outcome() public {
        vm.expectRevert(PMMarketFactory.InvalidOutcomeCount.selector);
        factory.createMarket(QUESTION_ID, block.timestamp + 1 hours, 1, "binary");
    }

    function test_factory_tracks_market_count() public {
        uint256 startCount = factory.marketCount();
        factory.createMarket(QUESTION_ID, block.timestamp + 1 hours, 2, "sports");
        factory.createMarket(QUESTION_ID, block.timestamp + 2 hours, 3, "politics");
        assertEq(factory.marketCount() - startCount, 2);
    }
}
