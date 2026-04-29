// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PMMarket} from "../../contracts/pm/PMMarket.sol";
import {PMMarketFactory} from "../../contracts/pm/PMMarketFactory.sol";
import {PMMockOracle} from "../../contracts/pm/PMMockOracle.sol";

/**
 * @title PMMarketFuzzTest
 * @notice Foundry fuzz tests over the PMMarket arithmetic surface.
 *
 *         The unit tests in PMMarket.t.sol cover specific lifecycle paths;
 *         these fuzz tests probe the *math* — pro-rata payout calculation,
 *         position-sum invariants, and collateral-out-equals-collateral-in
 *         conservation under random inputs. Each test runs 256 times by
 *         default (per foundry.toml fuzz_runs = 256).
 *
 *         The fuzz harness sometimes generates inputs that violate
 *         contract guards (zero collateral, out-of-range outcomes); we
 *         vm.assume() those out so the run focuses on the valid input
 *         space where the math actually runs.
 */
contract PMMarketFuzzTest is Test {
    PMMarketFactory factory;
    PMMockOracle oracle;
    PMMarket market;

    address resolver = address(0xBEEF);
    bytes32 constant QUESTION_ID = keccak256("fuzz");
    uint256 endTime;
    uint8 constant OUTCOME_COUNT = 2;

    function setUp() public {
        oracle = new PMMockOracle(resolver);
        factory = new PMMarketFactory(address(oracle));
        endTime = block.timestamp + 1 days;
        address marketAddr = factory.createMarket(QUESTION_ID, endTime, OUTCOME_COUNT, "binary");
        market = PMMarket(marketAddr);
    }

    /**
     * @notice Fuzz: a single trader's collateral-in equals their close-out
     *         collateral when they close their full position pre-settlement.
     *         No fees in this contract → no slippage → exact match.
     */
    function testFuzz_takeAndClosePosition(address trader, uint256 collateral) public {
        // Bound the input space to plausible values:
        // - trader is not zero, not the contract itself
        // - collateral is non-zero and fits in 96 bits (avoids overflow on
        //   later additions inside the contract)
        vm.assume(trader != address(0));
        vm.assume(trader.code.length == 0); // EOA only — contracts may not have receive()
        vm.assume(uint160(trader) > 0xff); // skip precompile range
        collateral = bound(collateral, 1, type(uint96).max);

        vm.deal(trader, collateral);
        uint256 traderBalanceBefore = trader.balance;

        vm.prank(trader);
        market.takePosition{value: collateral}(0);
        assertEq(market.sharesOf(trader, 0), collateral);
        assertEq(market.totalCollateral(), collateral);
        assertEq(trader.balance, traderBalanceBefore - collateral);

        // Close full position — should return exactly the same collateral.
        vm.prank(trader);
        market.closePosition(0, collateral);
        assertEq(market.sharesOf(trader, 0), 0);
        assertEq(market.totalCollateral(), 0);
        assertEq(trader.balance, traderBalanceBefore);
    }

    /**
     * @notice Fuzz: pro-rata payout invariant. Two traders bet on the
     *         winning outcome; each gets paid proportional to their share
     *         of the winning pool. Sum of payouts must equal totalCollateral
     *         (within rounding).
     *
     *         Invariant: |payoutAlice + payoutBob - totalCollateral| <= 1
     *         (1 wei tolerance for integer-division rounding).
     */
    function testFuzz_proRataPayoutSumsToCollateral(uint256 aliceBet, uint256 bobBet, uint256 carolBet)
        public
    {
        // Bound to non-zero collateral that won't overflow the contract's
        // mappings on addition.
        aliceBet = bound(aliceBet, 1 ether, 100 ether);
        bobBet = bound(bobBet, 1 ether, 100 ether);
        carolBet = bound(carolBet, 1 ether, 100 ether);

        address alice = address(0xA11CE);
        address bob = address(0xB0B);
        address carol = address(0xCA01);

        vm.deal(alice, aliceBet);
        vm.deal(bob, bobBet);
        vm.deal(carol, carolBet);

        // Alice + Bob bet outcome 0 (winners). Carol bets outcome 1.
        vm.prank(alice);
        market.takePosition{value: aliceBet}(0);
        vm.prank(bob);
        market.takePosition{value: bobBet}(0);
        vm.prank(carol);
        market.takePosition{value: carolBet}(1);

        uint256 totalPool = aliceBet + bobBet + carolBet;
        assertEq(market.totalCollateral(), totalPool);

        // Lock and settle outcome 0.
        vm.warp(endTime + 1);
        market.lockForResolution();
        vm.prank(resolver);
        oracle.reportResolution(address(market), 0);

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;

        vm.prank(alice);
        market.claimPayout(0);
        vm.prank(bob);
        market.claimPayout(0);

        uint256 alicePayout = alice.balance - aliceBalanceBefore;
        uint256 bobPayout = bob.balance - bobBalanceBefore;

        // Each winner's payout = (totalPool * theirShares) / winningPool,
        // where winningPool = aliceBet + bobBet.
        uint256 winningPool = aliceBet + bobBet;
        uint256 expectedAlice = (totalPool * aliceBet) / winningPool;
        uint256 expectedBob = (totalPool * bobBet) / winningPool;

        assertEq(alicePayout, expectedAlice);
        assertEq(bobPayout, expectedBob);

        // Conservation invariant: payouts sum to (at most) totalPool.
        // The rounding-down in (totalPool * shares) / winningPool means
        // 0 <= totalPool - (alicePayout + bobPayout) <= 2 (one wei dust
        // per winner from integer division).
        uint256 totalPaid = alicePayout + bobPayout;
        assertLe(totalPaid, totalPool);
        assertGe(totalPaid + 2, totalPool);
    }

    /**
     * @notice Fuzz: invalid outcome indexes always revert. The valid range
     *         is [0, outcomeCount); anything outside reverts with InvalidOutcome.
     */
    function testFuzz_invalidOutcomeAlwaysReverts(uint8 outcomeIndex) public {
        vm.assume(outcomeIndex >= OUTCOME_COUNT);
        address trader = address(0x1234);
        vm.deal(trader, 1 ether);

        vm.prank(trader);
        vm.expectRevert(PMMarket.InvalidOutcome.selector);
        market.takePosition{value: 1 ether}(outcomeIndex);
    }

    /**
     * @notice Fuzz: close-position can never withdraw more shares than the
     *         trader holds. Tests the InsufficientShares guard.
     */
    function testFuzz_overdrawPositionAlwaysReverts(uint128 holding, uint128 attempt) public {
        vm.assume(holding > 0);
        vm.assume(attempt > holding);
        address trader = address(0x5678);
        vm.deal(trader, uint256(holding));

        vm.prank(trader);
        market.takePosition{value: holding}(0);

        vm.prank(trader);
        vm.expectRevert(PMMarket.InsufficientShares.selector);
        market.closePosition(0, attempt);
    }

    /**
     * @notice Fuzz: only the configured oracle can settle. Any other caller
     *         must revert with NotOracle.
     */
    function testFuzz_nonOracleCannotResolve(address caller, uint8 outcome) public {
        vm.assume(caller != address(oracle));
        outcome = uint8(bound(uint256(outcome), 0, OUTCOME_COUNT - 1));

        vm.warp(endTime + 1);
        market.lockForResolution();

        vm.prank(caller);
        vm.expectRevert(PMMarket.NotOracle.selector);
        market.onOracleResolved(outcome, bytes32("forged"));
    }

    /**
     * @notice Fuzz: factory always rejects past-deadline markets.
     */
    function testFuzz_factoryRejectsPastEndTime(uint256 endTimeOffset) public {
        // bound to "in the past" — anywhere from 0 (now) up to a year ago.
        endTimeOffset = bound(endTimeOffset, 0, 365 days);
        uint256 pastEnd = block.timestamp > endTimeOffset ? block.timestamp - endTimeOffset : 0;

        vm.expectRevert(PMMarketFactory.InvalidEndTime.selector);
        factory.createMarket(QUESTION_ID, pastEnd, 2, "binary");
    }
}
