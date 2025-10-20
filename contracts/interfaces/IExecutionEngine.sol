// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IExecutionEngine
 * @author Mirror Protocol Team
 * @notice Interface for the ExecutionEngine contract
 * @dev Used by backend services, frontend, and monitoring systems
 *
 * INTEGRATION POINTS:
 * - Backend: Calls executeTrade() and executeBatch() for automation
 * - DelegationRouter: Receives execution records
 * - Frontend: Queries execution statistics and success rates
 * - Monitoring: Tracks gas savings and performance metrics
 */
interface IExecutionEngine {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct TradeParams {
        uint256 delegationId;
        address token;
        uint256 amount;
        address targetContract;
        bytes callData;
    }

    struct PerformanceMetrics {
        uint256 currentWinRate;
        int256 currentROI;
        uint256 currentVolume;
        uint256 lastUpdated;
    }

    struct ExecutionStats {
        uint256 totalExecutions;
        uint256 successfulExecutions;
        uint256 failedExecutions;
        uint256 totalVolumeExecuted;
        uint256 totalGasUsed;
        uint256 lastExecutionTime;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event TradeExecuted(
        uint256 indexed delegationId,
        uint256 indexed patternTokenId,
        address indexed executor,
        address token,
        uint256 baseAmount,
        uint256 executedAmount,
        bool success,
        uint256 gasUsed,
        uint256 timestamp
    );

    event BatchExecutionComplete(
        uint256 indexed batchId,
        uint256 successfulTrades,
        uint256 failedTrades,
        uint256 totalGasUsed,
        uint256 timestamp
    );

    event ExecutionFailed(
        uint256 indexed delegationId,
        uint256 indexed patternTokenId,
        string reason,
        uint256 timestamp
    );

    event MultiLayerExecutionComplete(
        uint256 indexed rootDelegationId,
        uint256 layersExecuted,
        uint256 totalExecutions,
        uint256 timestamp
    );

    event ExecutorAdded(address indexed executor, uint256 timestamp);

    event ExecutorRemoved(address indexed executor, uint256 timestamp);

    event MaxDelegationDepthUpdated(uint256 oldDepth, uint256 newDepth);

    event MinExecutionIntervalUpdated(uint256 oldInterval, uint256 newInterval);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error InvalidDelegation();
    error DelegationInactive();
    error PatternInactive();
    error ValidationFailed(string reason);
    error ExecutionIntervalNotMet(uint256 remainingTime);
    error MaxDepthExceeded(uint256 currentDepth, uint256 maxDepth);
    error InvalidToken();
    error InvalidAmount();
    error InvalidTargetContract();
    error ExecutionReverted(bytes returnData);
    error InsufficientBalance();
    error ZeroAddress();

    /*//////////////////////////////////////////////////////////////
                        EXECUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function executeTrade(
        TradeParams calldata params,
        PerformanceMetrics calldata metrics
    ) external returns (bool success);

    function executeBatch(
        TradeParams[] calldata tradeParams,
        PerformanceMetrics[] calldata metricsArray
    ) external returns (uint256 successCount);

    function executeMultiLayer(
        uint256 rootDelegationId,
        TradeParams calldata params,
        PerformanceMetrics calldata metrics
    ) external returns (uint256 totalExecutions);

    /*//////////////////////////////////////////////////////////////
                        VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function canExecuteTrade(
        uint256 delegationId,
        address token,
        uint256 amount,
        PerformanceMetrics calldata metrics
    ) external view returns (bool canExecute, string memory reason);

    /*//////////////////////////////////////////////////////////////
                          QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getExecutionStats(uint256 delegationId)
        external
        view
        returns (ExecutionStats memory);

    function getSuccessRate(uint256 delegationId)
        external
        view
        returns (uint256 rate);

    function getGlobalMetrics()
        external
        view
        returns (
            uint256 totalTrades,
            uint256 totalVolume,
            uint256 gasSaved
        );

    function isExecutor(address executor) external view returns (bool);

    function maxDelegationDepth() external view returns (uint256);

    function minExecutionInterval() external view returns (uint256);

    function totalTradesExecuted() external view returns (uint256);

    function totalVolumeExecuted() external view returns (uint256);

    function totalGasSaved() external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function addExecutor(address executor) external;

    function removeExecutor(address executor) external;

    function setMaxDelegationDepth(uint256 depth) external;

    function setMinExecutionInterval(uint256 interval) external;

    function pause() external;

    function unpause() external;

    function recoverTokens(address token, uint256 amount) external;
}
