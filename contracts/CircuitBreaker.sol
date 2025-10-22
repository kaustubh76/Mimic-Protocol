// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CircuitBreaker
 * @notice Advanced circuit breaker system for pattern execution safety
 * @dev Provides multiple layers of protection against pattern failures
 *
 * FEATURES:
 * - Pattern-specific pause controls
 * - Global emergency stop
 * - Automatic circuit breaker triggers
 * - Rate limiting
 * - Loss threshold monitoring
 * - Recovery mechanisms
 */
contract CircuitBreaker is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============================================
    // STATE VARIABLES
    // ============================================

    struct PatternCircuitBreaker {
        bool isTripped;
        uint256 consecutiveLosses;
        uint256 totalLosses;
        uint256 totalExecutions;
        uint256 lastExecutionTime;
        uint256 tripTime;
        string tripReason;
        uint256 cooldownEnd;
    }

    struct RateLimitConfig {
        uint256 maxExecutionsPerHour;
        uint256 maxExecutionsPerDay;
        uint256 minTimeBetweenExecutions; // seconds
    }

    struct LossThresholds {
        uint256 maxConsecutiveLosses;      // e.g., 5 losses
        uint256 maxLossPercentage;         // e.g., 30% (basis points: 3000)
        uint256 maxDailyLosses;            // e.g., 10 losses per day
    }

    // Pattern ID => Circuit Breaker State
    mapping(uint256 => PatternCircuitBreaker) public patternBreakers;

    // Pattern ID => Rate Limit Config
    mapping(uint256 => RateLimitConfig) public rateLimits;

    // Pattern ID => Loss Thresholds
    mapping(uint256 => LossThresholds) public lossThresholds;

    // Pattern ID => Timestamp => Execution Count (for rate limiting)
    mapping(uint256 => mapping(uint256 => uint256)) public hourlyExecutions;
    mapping(uint256 => mapping(uint256 => uint256)) public dailyExecutions;
    mapping(uint256 => uint256) public lastExecutionTimestamp;

    // Pattern ID => Daily Loss Count
    mapping(uint256 => mapping(uint256 => uint256)) public dailyLosses;

    // Global circuit breaker
    bool public globalCircuitBreakerTripped;
    string public globalTripReason;

    // Default configurations
    LossThresholds public defaultLossThresholds;
    RateLimitConfig public defaultRateLimit;
    uint256 public defaultCooldownPeriod = 1 hours;

    // ============================================
    // EVENTS
    // ============================================

    event CircuitBreakerTripped(
        uint256 indexed patternId,
        string reason,
        uint256 consecutiveLosses,
        uint256 timestamp
    );

    event CircuitBreakerReset(
        uint256 indexed patternId,
        address indexed resetBy,
        uint256 timestamp
    );

    event GlobalCircuitBreakerTripped(
        string reason,
        address indexed triggeredBy,
        uint256 timestamp
    );

    event GlobalCircuitBreakerReset(
        address indexed resetBy,
        uint256 timestamp
    );

    event ExecutionBlocked(
        uint256 indexed patternId,
        string reason,
        uint256 timestamp
    );

    event ThresholdsUpdated(
        uint256 indexed patternId,
        uint256 maxConsecutiveLosses,
        uint256 maxLossPercentage,
        uint256 maxDailyLosses
    );

    event RateLimitUpdated(
        uint256 indexed patternId,
        uint256 maxPerHour,
        uint256 maxPerDay,
        uint256 minTimeBetween
    );

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Set default thresholds
        defaultLossThresholds = LossThresholds({
            maxConsecutiveLosses: 5,
            maxLossPercentage: 3000, // 30%
            maxDailyLosses: 10
        });

        // Set default rate limits
        defaultRateLimit = RateLimitConfig({
            maxExecutionsPerHour: 20,
            maxExecutionsPerDay: 100,
            minTimeBetweenExecutions: 60 // 1 minute
        });
    }

    // ============================================
    // CIRCUIT BREAKER CHECKS
    // ============================================

    /**
     * @notice Check if execution is allowed for a pattern
     * @param patternId The pattern token ID
     * @return allowed Whether execution is allowed
     * @return reason Reason if execution is blocked
     */
    function checkExecutionAllowed(uint256 patternId)
        external
        view
        returns (bool allowed, string memory reason)
    {
        // Check global circuit breaker
        if (globalCircuitBreakerTripped) {
            return (false, globalTripReason);
        }

        // Check if contract is paused
        if (paused()) {
            return (false, "Contract is paused");
        }

        // Check pattern-specific circuit breaker
        PatternCircuitBreaker memory breaker = patternBreakers[patternId];
        if (breaker.isTripped) {
            if (block.timestamp < breaker.cooldownEnd) {
                return (false, breaker.tripReason);
            }
        }

        // Check rate limits
        (bool rateLimitOk, string memory rateLimitReason) = _checkRateLimit(patternId);
        if (!rateLimitOk) {
            return (false, rateLimitReason);
        }

        return (true, "");
    }

    /**
     * @notice Record execution result and check circuit breaker conditions
     * @param patternId The pattern token ID
     * @param success Whether the execution was successful
     * @param lossAmount Amount lost (if unsuccessful)
     * @param totalValue Total value at risk
     */
    function recordExecution(
        uint256 patternId,
        bool success,
        uint256 lossAmount,
        uint256 totalValue
    ) external onlyRole(OPERATOR_ROLE) nonReentrant {
        PatternCircuitBreaker storage breaker = patternBreakers[patternId];

        // Update execution counters
        breaker.totalExecutions++;
        breaker.lastExecutionTime = block.timestamp;
        lastExecutionTimestamp[patternId] = block.timestamp;

        // Update rate limit tracking
        uint256 currentHour = block.timestamp / 1 hours;
        uint256 currentDay = block.timestamp / 1 days;
        hourlyExecutions[patternId][currentHour]++;
        dailyExecutions[patternId][currentDay]++;

        if (!success) {
            // Record loss
            breaker.consecutiveLosses++;
            breaker.totalLosses++;
            dailyLosses[patternId][currentDay]++;

            // Get thresholds (use pattern-specific or default)
            LossThresholds memory thresholds = _getThresholds(patternId);

            // Check consecutive losses threshold
            if (breaker.consecutiveLosses >= thresholds.maxConsecutiveLosses) {
                _tripCircuitBreaker(
                    patternId,
                    string(abi.encodePacked(
                        "Consecutive losses threshold reached: ",
                        _uint2str(breaker.consecutiveLosses)
                    ))
                );
                return;
            }

            // Check loss percentage threshold
            if (totalValue > 0) {
                uint256 lossPercentage = (lossAmount * 10000) / totalValue;
                if (lossPercentage >= thresholds.maxLossPercentage) {
                    _tripCircuitBreaker(
                        patternId,
                        string(abi.encodePacked(
                            "Loss percentage threshold exceeded: ",
                            _uint2str(lossPercentage / 100),
                            "%"
                        ))
                    );
                    return;
                }
            }

            // Check daily losses threshold
            if (dailyLosses[patternId][currentDay] >= thresholds.maxDailyLosses) {
                _tripCircuitBreaker(
                    patternId,
                    string(abi.encodePacked(
                        "Daily loss limit reached: ",
                        _uint2str(dailyLosses[patternId][currentDay])
                    ))
                );
                return;
            }
        } else {
            // Reset consecutive losses on success
            breaker.consecutiveLosses = 0;
        }
    }

    /**
     * @notice Manually trip circuit breaker for a pattern
     * @param patternId The pattern token ID
     * @param reason Reason for tripping
     */
    function tripCircuitBreaker(uint256 patternId, string calldata reason)
        external
        onlyRole(GUARDIAN_ROLE)
    {
        _tripCircuitBreaker(patternId, reason);
    }

    /**
     * @notice Reset circuit breaker for a pattern
     * @param patternId The pattern token ID
     */
    function resetCircuitBreaker(uint256 patternId)
        external
        onlyRole(GUARDIAN_ROLE)
    {
        PatternCircuitBreaker storage breaker = patternBreakers[patternId];
        require(breaker.isTripped, "Circuit breaker not tripped");

        breaker.isTripped = false;
        breaker.consecutiveLosses = 0;
        breaker.tripTime = 0;
        breaker.tripReason = "";
        breaker.cooldownEnd = 0;

        emit CircuitBreakerReset(patternId, msg.sender, block.timestamp);
    }

    /**
     * @notice Trip global circuit breaker (emergency stop all patterns)
     * @param reason Reason for global trip
     */
    function tripGlobalCircuitBreaker(string calldata reason)
        external
        onlyRole(GUARDIAN_ROLE)
    {
        globalCircuitBreakerTripped = true;
        globalTripReason = reason;

        emit GlobalCircuitBreakerTripped(reason, msg.sender, block.timestamp);
    }

    /**
     * @notice Reset global circuit breaker
     */
    function resetGlobalCircuitBreaker()
        external
        onlyRole(GUARDIAN_ROLE)
    {
        globalCircuitBreakerTripped = false;
        globalTripReason = "";

        emit GlobalCircuitBreakerReset(msg.sender, block.timestamp);
    }

    // ============================================
    // CONFIGURATION
    // ============================================

    /**
     * @notice Set loss thresholds for a pattern
     */
    function setLossThresholds(
        uint256 patternId,
        uint256 maxConsecutiveLosses,
        uint256 maxLossPercentage,
        uint256 maxDailyLosses
    ) external onlyRole(GUARDIAN_ROLE) {
        require(maxConsecutiveLosses > 0, "Invalid consecutive losses");
        require(maxLossPercentage > 0 && maxLossPercentage <= 10000, "Invalid loss percentage");
        require(maxDailyLosses > 0, "Invalid daily losses");

        lossThresholds[patternId] = LossThresholds({
            maxConsecutiveLosses: maxConsecutiveLosses,
            maxLossPercentage: maxLossPercentage,
            maxDailyLosses: maxDailyLosses
        });

        emit ThresholdsUpdated(patternId, maxConsecutiveLosses, maxLossPercentage, maxDailyLosses);
    }

    /**
     * @notice Set rate limits for a pattern
     */
    function setRateLimit(
        uint256 patternId,
        uint256 maxPerHour,
        uint256 maxPerDay,
        uint256 minTimeBetween
    ) external onlyRole(GUARDIAN_ROLE) {
        require(maxPerHour > 0, "Invalid hourly limit");
        require(maxPerDay >= maxPerHour, "Daily limit must be >= hourly");

        rateLimits[patternId] = RateLimitConfig({
            maxExecutionsPerHour: maxPerHour,
            maxExecutionsPerDay: maxPerDay,
            minTimeBetweenExecutions: minTimeBetween
        });

        emit RateLimitUpdated(patternId, maxPerHour, maxPerDay, minTimeBetween);
    }

    /**
     * @notice Set default cooldown period
     */
    function setDefaultCooldownPeriod(uint256 cooldownSeconds)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(cooldownSeconds >= 1 minutes && cooldownSeconds <= 7 days, "Invalid cooldown period");
        defaultCooldownPeriod = cooldownSeconds;
    }

    // ============================================
    // PAUSABLE OVERRIDES
    // ============================================

    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get circuit breaker status for a pattern
     */
    function getCircuitBreakerStatus(uint256 patternId)
        external
        view
        returns (
            bool isTripped,
            uint256 consecutiveLosses,
            uint256 totalLosses,
            uint256 totalExecutions,
            string memory tripReason,
            uint256 cooldownEnd
        )
    {
        PatternCircuitBreaker memory breaker = patternBreakers[patternId];
        return (
            breaker.isTripped,
            breaker.consecutiveLosses,
            breaker.totalLosses,
            breaker.totalExecutions,
            breaker.tripReason,
            breaker.cooldownEnd
        );
    }

    /**
     * @notice Get current execution counts for rate limiting
     */
    function getExecutionCounts(uint256 patternId)
        external
        view
        returns (uint256 hourly, uint256 daily)
    {
        uint256 currentHour = block.timestamp / 1 hours;
        uint256 currentDay = block.timestamp / 1 days;

        return (
            hourlyExecutions[patternId][currentHour],
            dailyExecutions[patternId][currentDay]
        );
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================

    function _tripCircuitBreaker(uint256 patternId, string memory reason) internal {
        PatternCircuitBreaker storage breaker = patternBreakers[patternId];

        breaker.isTripped = true;
        breaker.tripTime = block.timestamp;
        breaker.tripReason = reason;
        breaker.cooldownEnd = block.timestamp + defaultCooldownPeriod;

        emit CircuitBreakerTripped(
            patternId,
            reason,
            breaker.consecutiveLosses,
            block.timestamp
        );
    }

    function _checkRateLimit(uint256 patternId)
        internal
        view
        returns (bool allowed, string memory reason)
    {
        RateLimitConfig memory limits = _getRateLimits(patternId);
        uint256 currentHour = block.timestamp / 1 hours;
        uint256 currentDay = block.timestamp / 1 days;

        // Check minimum time between executions
        uint256 lastExecution = lastExecutionTimestamp[patternId];
        if (lastExecution > 0 && block.timestamp < lastExecution + limits.minTimeBetweenExecutions) {
            return (false, "Minimum time between executions not met");
        }

        // Check hourly limit
        if (hourlyExecutions[patternId][currentHour] >= limits.maxExecutionsPerHour) {
            return (false, "Hourly execution limit reached");
        }

        // Check daily limit
        if (dailyExecutions[patternId][currentDay] >= limits.maxExecutionsPerDay) {
            return (false, "Daily execution limit reached");
        }

        return (true, "");
    }

    function _getThresholds(uint256 patternId) internal view returns (LossThresholds memory) {
        LossThresholds memory thresholds = lossThresholds[patternId];

        // Return pattern-specific thresholds if set, otherwise default
        if (thresholds.maxConsecutiveLosses > 0) {
            return thresholds;
        }
        return defaultLossThresholds;
    }

    function _getRateLimits(uint256 patternId) internal view returns (RateLimitConfig memory) {
        RateLimitConfig memory limits = rateLimits[patternId];

        // Return pattern-specific limits if set, otherwise default
        if (limits.maxExecutionsPerHour > 0) {
            return limits;
        }
        return defaultRateLimit;
    }

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";

        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
