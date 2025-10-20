// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDelegationRouter
 * @author Mirror Protocol Team
 * @notice Interface for the DelegationRouter contract
 * @dev Used by ExecutionEngine and frontend to manage delegations
 *
 * INTEGRATION POINTS:
 * - ExecutionEngine: Validates and records execution
 * - PatternDetector: Queries delegation status
 * - Frontend: Creates/revokes delegations
 * - BehavioralNFT: Verifies pattern ownership
 */
interface IDelegationRouter {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct DelegationPermissions {
        uint256 maxSpendPerTx;
        uint256 maxSpendPerDay;
        uint256 expiresAt;
        address[] allowedTokens;
        bool requiresConditionalCheck;
    }

    struct ConditionalRequirements {
        uint256 minWinRate;
        int256 minROI;
        uint256 minVolume;
        bool isActive;
    }

    struct Delegation {
        address delegator;
        uint256 patternTokenId;
        uint256 percentageAllocation;
        DelegationPermissions permissions;
        ConditionalRequirements conditions;
        uint256 createdAt;
        uint256 totalSpentToday;
        uint256 lastResetTimestamp;
        bool isActive;
        address smartAccountAddress;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

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

    event DelegationUpdated(
        uint256 indexed delegationId,
        uint256 percentageAllocation,
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

    event ConditionalCheckFailed(
        uint256 indexed delegationId,
        uint256 indexed patternTokenId,
        string reason,
        uint256 timestamp
    );

    event ExecutionEngineUpdated(
        address indexed oldEngine,
        address indexed newEngine
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error DelegationNotFound();
    error DelegationInactive();
    error PatternNotOwned();
    error InvalidPercentage();
    error InvalidSmartAccount();
    error MaxDelegationsReached();
    error InvalidTokenList();
    error PermissionDenied();
    error DailyLimitExceeded();
    error TransactionLimitExceeded();
    error DelegationExpired();
    error TokenNotAllowed();
    error InsufficientWinRate();
    error InsufficientROI();
    error InsufficientVolume();
    error MaxDelegationDepthExceeded();

    /*//////////////////////////////////////////////////////////////
                        DELEGATION MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function createDelegation(
        uint256 patternTokenId,
        uint256 percentageAllocation,
        DelegationPermissions memory permissions,
        ConditionalRequirements memory conditions,
        address smartAccount
    ) external returns (uint256);

    function createSimpleDelegation(
        uint256 patternTokenId,
        uint256 percentageAllocation,
        address smartAccount
    ) external returns (uint256);

    function revokeDelegation(uint256 delegationId) external;

    function updateDelegationPercentage(
        uint256 delegationId,
        uint256 newPercentage
    ) external;

    /*//////////////////////////////////////////////////////////////
                        EXECUTION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function validateExecution(
        uint256 delegationId,
        address token,
        uint256 amount,
        uint256 currentWinRate,
        int256 currentROI,
        uint256 currentVolume
    ) external view returns (bool isValid, string memory reason);

    function recordExecution(
        uint256 delegationId,
        address token,
        uint256 amount,
        bool success
    ) external;

    /*//////////////////////////////////////////////////////////////
                          QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getDelegation(uint256 delegationId)
        external
        view
        returns (Delegation memory);

    function getUserDelegations(address user)
        external
        view
        returns (uint256[] memory);

    function getPatternDelegations(uint256 patternTokenId)
        external
        view
        returns (uint256[] memory);

    function getDelegationsByPattern(uint256 patternTokenId)
        external
        view
        returns (Delegation[] memory);

    function getTotalDelegatedAmount(uint256 patternTokenId)
        external
        view
        returns (uint256);

    function canDelegate(address user, uint256 patternTokenId)
        external
        view
        returns (bool canDelegate, string memory reason);

    function getDelegationBasics(uint256 delegationId)
        external
        view
        returns (
            address delegator,
            uint256 patternTokenId,
            uint256 percentageAllocation,
            bool isActive,
            address smartAccountAddress
        );

    function getDelegationPermissions(uint256 delegationId)
        external
        view
        returns (
            uint256 maxSpendPerTx,
            uint256 maxSpendPerDay,
            uint256 expiresAt,
            bool requiresConditionalCheck
        );

    function getDelegationConditions(uint256 delegationId)
        external
        view
        returns (
            uint256 minWinRate,
            int256 minROI,
            uint256 minVolume,
            bool isActive
        );

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setExecutionEngine(address executionEngine) external;

    function setMaxDelegationsPerUser(uint256 max) external;

    function setMaxDelegationDepth(uint256 depth) external;

    function pause() external;

    function unpause() external;
}
