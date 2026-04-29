// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IPMOracleConsumer} from "./PMMockOracle.sol";

/**
 * @title PMMarket
 * @author Kaustubh Agrawal — Growth Engineer candidate package
 * @notice Single prediction market. Implements the four-state machine the
 *         indexer in pow/envio-pm-template-v1/src/EventHandlers/Settlement.ts
 *         tracks: OPEN → RESOLVING → SETTLED → CORRECTED.
 *
 *         Event signatures match abis/Market.json exactly so the indexer's
 *         generated bindings see the events the template was scaffolded
 *         against. This is the on-chain twin of the indexer's state machine.
 *
 * KEY DESIGN POINTS
 * - Collateral is tracked in raw uint256 wei. No ERC-20 transfers in this
 *   reference contract; positions are token-less commitments. Real markets
 *   would integrate ERC-20 + ConditionalTokens (Polymarket) or vAMMs.
 * - Settlement is push-driven from the oracle (PMMockOracle.onOracleResolved).
 *   This mirrors UMA's optimistic-oracle callback shape.
 * - Payouts are pull-based: traders call `claimPayout()` after settlement.
 *   Lazy claim is a deliberate gas-optimisation pattern visible in real PM
 *   protocols and exercises the indexer's PayoutClaimed handler.
 */
contract PMMarket is IPMOracleConsumer {
    enum State {
        OPEN,
        RESOLVING,
        SETTLED,
        CORRECTED
    }

    address public immutable factory;
    address public immutable oracle;
    bytes32 public immutable questionId;
    uint256 public immutable endTime;
    uint8 public immutable outcomeCount;

    State public state;
    uint8 public winningOutcome;
    bytes32 public oracleResolutionId;
    uint256 public resolvedAt;

    /// @notice trader => outcomeIndex => share count
    mapping(address => mapping(uint8 => uint256)) public sharesOf;
    /// @notice trader => outcomeIndex => already-claimed flag
    mapping(address => mapping(uint8 => bool)) public claimedOf;
    /// @notice outcomeIndex => total shares minted across all traders
    mapping(uint8 => uint256) public totalSharesPerOutcome;
    /// @notice trader => outcomeIndex => cumulative collateral committed
    mapping(address => mapping(uint8 => uint256)) public cumulativeCollateralIn;
    /// @notice Total collateral pool. After settlement, distributed pro-rata
    ///         to holders of the winning outcome.
    uint256 public totalCollateral;

    event PositionTaken(address indexed trader, uint8 outcomeIndex, uint256 shares, uint256 collateralIn);
    event PositionClosed(address indexed trader, uint8 outcomeIndex, uint256 shares, uint256 collateralOut);
    event MarketLockedForResolution(uint256 lockedAt);
    event OracleResolved(uint8 winningOutcome, uint256 resolvedAt, bytes32 oracleResolutionId);
    event MarketCorrected(uint8 previousWinningOutcome, uint8 correctedWinningOutcome, uint256 correctedAt);
    event PayoutClaimed(address indexed trader, uint256 payout);

    error NotOpen();
    error NotResolving();
    error NotSettledOrCorrected();
    error NotOracle();
    error InvalidOutcome();
    error InsufficientShares();
    error PastDeadline();
    error AlreadyClaimed();
    error NoPayout();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address _factory, address _oracle, bytes32 _questionId, uint256 _endTime, uint8 _outcomeCount) {
        factory = _factory;
        oracle = _oracle;
        questionId = _questionId;
        endTime = _endTime;
        outcomeCount = _outcomeCount;
        state = State.OPEN;
    }

    // ---------------------------------------------------------------
    // OPEN — position lifecycle
    // ---------------------------------------------------------------

    /**
     * @notice Take a position by committing collateral. 1 wei collateral = 1 share
     *         in this reference contract; real protocols use AMM curves.
     */
    function takePosition(uint8 outcomeIndex) external payable {
        if (state != State.OPEN) revert NotOpen();
        if (block.timestamp >= endTime) revert PastDeadline();
        if (outcomeIndex >= outcomeCount) revert InvalidOutcome();
        if (msg.value == 0) revert InsufficientShares();

        uint256 shares = msg.value;
        sharesOf[msg.sender][outcomeIndex] += shares;
        totalSharesPerOutcome[outcomeIndex] += shares;
        cumulativeCollateralIn[msg.sender][outcomeIndex] += msg.value;
        totalCollateral += msg.value;

        emit PositionTaken(msg.sender, outcomeIndex, shares, msg.value);
    }

    /**
     * @notice Close part or all of a position before settlement. Withdraws
     *         collateral 1:1 (no slippage in this reference shape).
     */
    function closePosition(uint8 outcomeIndex, uint256 shares) external {
        if (state != State.OPEN) revert NotOpen();
        if (sharesOf[msg.sender][outcomeIndex] < shares) revert InsufficientShares();
        if (shares == 0) revert InsufficientShares();

        sharesOf[msg.sender][outcomeIndex] -= shares;
        totalSharesPerOutcome[outcomeIndex] -= shares;
        totalCollateral -= shares;

        emit PositionClosed(msg.sender, outcomeIndex, shares, shares);
        (bool ok,) = msg.sender.call{value: shares}("");
        require(ok, "transfer failed");
    }

    // ---------------------------------------------------------------
    // OPEN → RESOLVING
    // ---------------------------------------------------------------

    /// @notice Anyone can lock the market once the deadline passes. No more
    ///         positions accepted after this point.
    function lockForResolution() external {
        if (state != State.OPEN) revert NotOpen();
        if (block.timestamp < endTime) revert PastDeadline();
        state = State.RESOLVING;
        emit MarketLockedForResolution(block.timestamp);
    }

    // ---------------------------------------------------------------
    // RESOLVING → SETTLED — driven by the oracle callback
    // ---------------------------------------------------------------

    function onOracleResolved(uint8 _winningOutcome, bytes32 _oracleResolutionId) external onlyOracle {
        if (state != State.RESOLVING) revert NotResolving();
        if (_winningOutcome >= outcomeCount) revert InvalidOutcome();

        winningOutcome = _winningOutcome;
        oracleResolutionId = _oracleResolutionId;
        resolvedAt = block.timestamp;
        state = State.SETTLED;

        emit OracleResolved(_winningOutcome, block.timestamp, _oracleResolutionId);
    }

    // ---------------------------------------------------------------
    // SETTLED → CORRECTED — driven by the oracle correction callback
    // ---------------------------------------------------------------

    function onOracleCorrected(uint8 correctedWinningOutcome) external onlyOracle {
        if (state != State.SETTLED) revert NotSettledOrCorrected();
        if (correctedWinningOutcome >= outcomeCount) revert InvalidOutcome();

        uint8 previousOutcome = winningOutcome;
        winningOutcome = correctedWinningOutcome;
        state = State.CORRECTED;

        emit MarketCorrected(previousOutcome, correctedWinningOutcome, block.timestamp);
    }

    // ---------------------------------------------------------------
    // SETTLED|CORRECTED — pull-based payouts
    // ---------------------------------------------------------------

    /**
     * @notice Claim the pro-rata payout from the total collateral pool for a
     *         winning position. Pull-based to keep settlement gas O(1).
     */
    function claimPayout(uint8 outcomeIndex) external {
        if (state != State.SETTLED && state != State.CORRECTED) revert NotSettledOrCorrected();
        if (outcomeIndex != winningOutcome) revert NoPayout();
        if (claimedOf[msg.sender][outcomeIndex]) revert AlreadyClaimed();

        uint256 traderShares = sharesOf[msg.sender][outcomeIndex];
        if (traderShares == 0) revert NoPayout();

        uint256 winningPool = totalSharesPerOutcome[outcomeIndex];
        // Defensive: should never happen if traderShares > 0, but guard against
        // a divide-by-zero in pathological correction scenarios.
        if (winningPool == 0) revert NoPayout();

        uint256 payout = (totalCollateral * traderShares) / winningPool;
        claimedOf[msg.sender][outcomeIndex] = true;

        emit PayoutClaimed(msg.sender, payout);
        (bool ok,) = msg.sender.call{value: payout}("");
        require(ok, "transfer failed");
    }
}
