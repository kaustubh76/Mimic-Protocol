// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPatternDetector
 * @author Mirror Protocol Team
 * @notice Interface for the PatternDetector contract
 * @dev Used by backend services and frontend to validate/mint patterns
 *
 * INTEGRATION POINTS:
 * - Backend: Calls validateAndMintPattern() after Envio analysis
 * - BehavioralNFT: Receives minting requests
 * - Frontend: Queries user history and pattern status
 * - Envio: Indexes pattern detection events
 */
interface IPatternDetector {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct DetectedPattern {
        address user;
        string patternType;
        bytes patternData;
        uint256 totalTrades;
        uint256 successfulTrades;
        uint256 totalVolume;
        int256 totalPnL;
        uint256 confidence;
        uint256 detectedAt;
    }

    struct ValidationThresholds {
        uint256 minTrades;
        uint256 minWinRate;
        uint256 minVolume;
        uint256 minConfidence;
        uint256 minTimePeriod;
    }

    struct UserPatternHistory {
        uint256 lastDetectionTime;
        uint256 totalPatternsMinted;
        uint256 activePatterns;
        uint256 deactivatedPatterns;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PatternDetected(
        address indexed user,
        string patternType,
        uint256 confidence,
        uint256 timestamp
    );

    event PatternValidatedAndMinted(
        address indexed user,
        uint256 indexed tokenId,
        string patternType,
        uint256 winRate,
        uint256 volume,
        int256 roi
    );

    event PatternValidationFailed(
        address indexed user,
        string patternType,
        string reason
    );

    event ThresholdsUpdated(
        uint256 minTrades,
        uint256 minWinRate,
        uint256 minVolume,
        uint256 minConfidence
    );

    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    event MaxPatternsPerUserUpdated(uint256 oldMax, uint256 newMax);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error InvalidBehavioralNFTAddress();
    error PatternAlreadyMinted();
    error InsufficientTrades(uint256 actual, uint256 required);
    error InsufficientWinRate(uint256 actual, uint256 required);
    error InsufficientVolume(uint256 actual, uint256 required);
    error InsufficientConfidence(uint256 actual, uint256 required);
    error InsufficientTimePeriod(uint256 actual, uint256 required);
    error DetectionCooldownActive(uint256 remainingTime);
    error MaxActivePatternsReached(uint256 current, uint256 max);
    error InvalidPatternType();
    error InvalidPatternData();
    error InvalidThresholds();

    /*//////////////////////////////////////////////////////////////
                            MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function validateAndMintPattern(DetectedPattern calldata pattern)
        external
        returns (uint256 tokenId);

    function updatePatternPerformance(
        uint256 tokenId,
        uint256 newTrades,
        uint256 newSuccessfulTrades,
        uint256 newVolume,
        int256 newPnL
    ) external;

    function batchValidateAndMint(DetectedPattern[] calldata patterns)
        external
        returns (uint256[] memory tokenIds);

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getUserHistory(address user)
        external
        view
        returns (UserPatternHistory memory);

    function isPatternMinted(DetectedPattern calldata pattern)
        external
        view
        returns (bool);

    function getCooldownRemaining(address user)
        external
        view
        returns (uint256);

    function canUserMintPattern(address user)
        external
        view
        returns (bool canMint, string memory reason);

    function validatePatternView(DetectedPattern calldata pattern)
        external
        view
        returns (bool isValid, string memory reason);

    function behavioralNFT() external view returns (address);

    function detectionCooldown() external view returns (uint256);

    function maxActivePatternsPerUser() external view returns (uint256);

    function totalPatternsDetected() external view returns (uint256);

    function totalPatternsMinted() external view returns (uint256);

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function updateThresholds(
        uint256 minTrades,
        uint256 minWinRate,
        uint256 minVolume,
        uint256 minConfidence,
        uint256 minTimePeriod
    ) external;

    function updateCooldown(uint256 cooldown) external;

    function updateMaxPatternsPerUser(uint256 maxPatterns) external;

    function pause() external;

    function unpause() external;
}
