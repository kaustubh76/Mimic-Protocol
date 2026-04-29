// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PMMockOracle
 * @author Kaustubh Agrawal — Growth Engineer candidate package
 * @notice Mock oracle backing the PM template's four-state settlement machine.
 *         The deployer (or anyone with the resolver role) calls
 *         `reportResolution()` to settle a market and `correctResolution()` to
 *         flip the winning outcome post-settlement. Settlement notifies the
 *         market contract, which emits the OracleResolved / MarketCorrected
 *         events the indexer in pow/envio-pm-template-v1/ subscribes to.
 *
 *         Real prediction markets use UMA's optimistic oracle (Polymarket) or
 *         dispute-game oracles (Limitless). This mock keeps the settlement
 *         interaction deterministic so the four-state machine is exercisable
 *         end-to-end without standing up an off-chain dispute system.
 */

interface IPMOracleConsumer {
    function onOracleResolved(uint8 winningOutcome, bytes32 oracleResolutionId) external;
    function onOracleCorrected(uint8 correctedWinningOutcome) external;
}

contract PMMockOracle {
    /// @notice Address allowed to report and correct resolutions. Set at deploy.
    address public immutable resolver;

    /// @notice Tracks resolutions per market. Used to derive a stable
    ///         `oracleResolutionId` and to detect double-resolution.
    mapping(address => bytes32) public resolutionIdOf;
    mapping(address => uint8) public outcomeOf;
    mapping(address => bool) public hasResolved;

    event ResolutionReported(address indexed market, uint8 winningOutcome, bytes32 oracleResolutionId);
    event ResolutionCorrected(address indexed market, uint8 previousOutcome, uint8 correctedOutcome);

    error NotResolver();
    error AlreadyResolved();
    error NotResolved();

    modifier onlyResolver() {
        if (msg.sender != resolver) revert NotResolver();
        _;
    }

    constructor(address _resolver) {
        resolver = _resolver;
    }

    /**
     * @notice Report the initial resolution for a market.
     * @dev Called by the resolver. Emits the resolution upstream to the market
     *      contract, which then emits its own OracleResolved event for the indexer.
     */
    function reportResolution(address market, uint8 winningOutcome) external onlyResolver {
        if (hasResolved[market]) revert AlreadyResolved();

        // Stable, content-addressed resolution id. Lets the indexer cache the
        // oracle read by (market, resolutionId) and dedupe per-position reads.
        bytes32 resolutionId = keccak256(abi.encodePacked(market, winningOutcome, block.number));

        resolutionIdOf[market] = resolutionId;
        outcomeOf[market] = winningOutcome;
        hasResolved[market] = true;

        emit ResolutionReported(market, winningOutcome, resolutionId);
        IPMOracleConsumer(market).onOracleResolved(winningOutcome, resolutionId);
    }

    /**
     * @notice Correct an existing resolution.
     * @dev Used to exercise the SETTLED → CORRECTED transition in the indexer's
     *      four-state machine. The market contract emits MarketCorrected with
     *      the previous + corrected outcomes.
     */
    function correctResolution(address market, uint8 correctedOutcome) external onlyResolver {
        if (!hasResolved[market]) revert NotResolved();

        uint8 previousOutcome = outcomeOf[market];
        outcomeOf[market] = correctedOutcome;

        emit ResolutionCorrected(market, previousOutcome, correctedOutcome);
        IPMOracleConsumer(market).onOracleCorrected(correctedOutcome);
    }
}
