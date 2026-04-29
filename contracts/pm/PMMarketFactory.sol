// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PMMarket} from "./PMMarket.sol";

/**
 * @title PMMarketFactory
 * @author Kaustubh Agrawal — Growth Engineer candidate package
 * @notice Deploys new PMMarket instances and emits MarketCreated for each one.
 *         The MarketCreated event signature matches abis/MarketFactory.json
 *         exactly — that's what makes the indexer's
 *         PoolFactory.MarketCreated.contractRegister() pattern work without
 *         modification.
 *
 *         The factory is the entry point for the Envio indexer: every new
 *         PMMarket is dynamically registered via context.addMarket() in the
 *         template's MarketFactory handler.
 */
contract PMMarketFactory {
    address public immutable defaultOracle;

    /// @notice All markets ever created. Useful for off-chain enumeration when
    ///         the indexer is not yet caught up.
    PMMarket[] public markets;

    event MarketCreated(
        address indexed market,
        bytes32 indexed questionId,
        uint256 endTime,
        uint8 outcomeCount,
        string category
    );

    error InvalidEndTime();
    error InvalidOutcomeCount();

    constructor(address _defaultOracle) {
        defaultOracle = _defaultOracle;
    }

    /**
     * @notice Deploy a new market. The questionId is content-addressed off-chain
     *         (typically keccak256 of the question text). Category is free-form
     *         and parsed by the indexer's parseMarketCategory() helper.
     */
    function createMarket(bytes32 questionId, uint256 endTime, uint8 outcomeCount, string calldata category)
        external
        returns (address)
    {
        if (endTime <= block.timestamp) revert InvalidEndTime();
        if (outcomeCount < 2) revert InvalidOutcomeCount();

        PMMarket market = new PMMarket(address(this), defaultOracle, questionId, endTime, outcomeCount);
        markets.push(market);

        emit MarketCreated(address(market), questionId, endTime, outcomeCount, category);
        return address(market);
    }

    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
