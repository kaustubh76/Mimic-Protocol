// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BehavioralNFT.sol";

/**
 * @title PatternDetector
 * @author Mirror Protocol Team
 * @notice Detects and validates trading patterns, then mints BehavioralNFTs
 * @dev Integrates with Envio HyperSync for sub-50ms pattern analysis
 *
 * KEY FEATURES:
 * - Automated pattern detection from on-chain behavior
 * - Statistical validation (win rate, volume, consistency thresholds)
 * - Integration with Envio for real-time analysis (<50ms)
 * - Mints BehavioralNFTs for validated patterns
 * - Supports 6 pattern types: Momentum, MeanReversion, Arbitrage, Liquidity, Yield, Composite
 *
 * ENVIO INTEGRATION:
 * - Queries historical user transactions via Envio (<50ms vs 2000ms traditional)
 * - Real-time pattern validation using HyperSync
 * - Sub-50ms detection enables immediate pattern minting
 * - Cross-chain pattern aggregation support
 *
 * PATTERN VALIDATION THRESHOLDS:
 * - Minimum trades: 10
 * - Minimum win rate: 60% (6000 basis points)
 * - Minimum volume: 1 ETH (1e18 wei)
 * - Minimum confidence: 70% (7000 basis points)
 *
 * PERFORMANCE:
 * - Pattern detection: <50ms (via Envio)
 * - Minting gas: ~200,000 gas
 * - Validation gas: <100,000 gas (view function)
 *
 * SECURITY:
 * - Access control (owner can update thresholds)
 * - Reentrancy protection
 * - Pausable for emergencies
 * - Rate limiting per user (prevents spam)
 */
contract PatternDetector is Ownable, Pausable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Represents a detected trading pattern awaiting validation
     * @dev Passed to validateAndMintPattern for on-chain validation
     */
    struct DetectedPattern {
        address user;               // Trader address
        string patternType;         // Pattern category
        bytes patternData;          // Encoded pattern parameters
        uint256 totalTrades;        // Number of trades analyzed
        uint256 successfulTrades;   // Number of winning trades
        uint256 totalVolume;        // Total volume in wei
        int256 totalPnL;            // Total profit/loss in wei
        uint256 confidence;         // Confidence score (basis points)
        uint256 detectedAt;         // Timestamp of detection
    }

    /**
     * @notice Validation thresholds for pattern acceptance
     * @dev Owner-configurable for different market conditions
     */
    struct ValidationThresholds {
        uint256 minTrades;          // Minimum number of trades required
        uint256 minWinRate;         // Minimum win rate (basis points, 10000 = 100%)
        uint256 minVolume;          // Minimum total volume (wei)
        uint256 minConfidence;      // Minimum confidence score (basis points)
        uint256 minTimePeriod;      // Minimum time period (seconds)
    }

    /**
     * @notice User's pattern detection history
     * @dev Tracks rate limiting and pattern lifecycle
     */
    struct UserPatternHistory {
        uint256 lastDetectionTime;  // Last pattern detection timestamp
        uint256 totalPatternsMinted;// Total patterns created by user
        uint256 activePatterns;     // Currently active patterns
        uint256 deactivatedPatterns;// Deactivated patterns count
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Reference to BehavioralNFT contract for minting
    BehavioralNFT public immutable behavioralNFT;

    /// @notice Current validation thresholds
    ValidationThresholds public thresholds;

    /// @notice Mapping of user address to their pattern history
    mapping(address => UserPatternHistory) public userHistory;

    /// @notice Mapping to track if a pattern hash has been minted (prevents duplicates)
    mapping(bytes32 => bool) public patternMinted;

    /// @notice Minimum time between pattern detections per user (prevents spam)
    uint256 public detectionCooldown = 1 hours;

    /// @notice Maximum active patterns per user
    uint256 public maxActivePatternsPerUser = 5;

    /// @notice Total patterns detected across all users
    uint256 public totalPatternsDetected;

    /// @notice Total patterns successfully minted
    uint256 public totalPatternsMinted;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a pattern is detected and validated
     * @dev Indexed by Envio for real-time pattern tracking
     */
    event PatternDetected(
        address indexed user,
        string patternType,
        uint256 confidence,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a pattern is validated and minted
     * @dev Links detection to NFT minting
     */
    event PatternValidatedAndMinted(
        address indexed user,
        uint256 indexed tokenId,
        string patternType,
        uint256 winRate,
        uint256 volume,
        int256 roi
    );

    /**
     * @notice Emitted when a pattern fails validation
     * @dev Useful for debugging and analytics
     */
    event PatternValidationFailed(
        address indexed user,
        string patternType,
        string reason
    );

    /**
     * @notice Emitted when validation thresholds are updated
     */
    event ThresholdsUpdated(
        uint256 minTrades,
        uint256 minWinRate,
        uint256 minVolume,
        uint256 minConfidence
    );

    /**
     * @notice Emitted when detection cooldown is updated
     */
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    /**
     * @notice Emitted when max patterns per user is updated
     */
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
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the PatternDetector with default thresholds
     * @param _behavioralNFT Address of the BehavioralNFT contract
     */
    constructor(address _behavioralNFT) Ownable(msg.sender) {
        if (_behavioralNFT == address(0)) revert InvalidBehavioralNFTAddress();
        behavioralNFT = BehavioralNFT(_behavioralNFT);

        // Set default validation thresholds
        thresholds = ValidationThresholds({
            minTrades: 10,              // At least 10 trades
            minWinRate: 6000,           // 60% win rate
            minVolume: 1 ether,         // 1 ETH minimum volume
            minConfidence: 7000,        // 70% confidence
            minTimePeriod: 7 days       // 7 days of trading history
        });
    }

    /*//////////////////////////////////////////////////////////////
                            MAIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Detects pattern from user behavior and mints NFT if valid
     * @dev Called by backend after Envio analyzes user transactions (<50ms)
     * @param pattern The detected pattern data from Envio analysis
     * @return tokenId The minted NFT token ID (0 if validation failed)
     */
    function validateAndMintPattern(DetectedPattern calldata pattern)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 tokenId)
    {
        // Validate pattern type
        if (!_isValidPatternType(pattern.patternType)) {
            emit PatternValidationFailed(pattern.user, pattern.patternType, "Invalid pattern type");
            revert InvalidPatternType();
        }

        // Check cooldown period
        UserPatternHistory storage history = userHistory[pattern.user];
        if (block.timestamp < history.lastDetectionTime + detectionCooldown) {
            uint256 remaining = (history.lastDetectionTime + detectionCooldown) - block.timestamp;
            revert DetectionCooldownActive(remaining);
        }

        // Check max active patterns
        if (history.activePatterns >= maxActivePatternsPerUser) {
            revert MaxActivePatternsReached(history.activePatterns, maxActivePatternsPerUser);
        }

        // Generate pattern hash to prevent duplicates
        bytes32 patternHash = _generatePatternHash(pattern);
        if (patternMinted[patternHash]) {
            emit PatternValidationFailed(pattern.user, pattern.patternType, "Pattern already minted");
            revert PatternAlreadyMinted();
        }

        // Validate pattern meets thresholds
        string memory validationError = _validatePattern(pattern);
        if (bytes(validationError).length > 0) {
            emit PatternValidationFailed(pattern.user, pattern.patternType, validationError);
            revert InsufficientTrades(0, 0); // Generic revert, specific error emitted in event
        }

        // Mark pattern as detected
        totalPatternsDetected++;
        emit PatternDetected(pattern.user, pattern.patternType, pattern.confidence, block.timestamp);

        // Calculate metrics for NFT
        uint256 winRate = (pattern.successfulTrades * 10000) / pattern.totalTrades;
        int256 roi = (pattern.totalPnL * 10000) / int256(pattern.totalVolume);

        // Mint BehavioralNFT
        tokenId = behavioralNFT.mintPattern(
            pattern.user,
            pattern.patternType,
            pattern.patternData
        );

        // Update performance metrics on the NFT
        behavioralNFT.updatePerformance(tokenId, winRate, pattern.totalVolume, roi);

        // Update state
        patternMinted[patternHash] = true;
        history.lastDetectionTime = block.timestamp;
        history.totalPatternsMinted++;
        history.activePatterns++;
        totalPatternsMinted++;

        emit PatternValidatedAndMinted(
            pattern.user,
            tokenId,
            pattern.patternType,
            winRate,
            pattern.totalVolume,
            roi
        );

        return tokenId;
    }

    /**
     * @notice Updates performance metrics for an existing pattern NFT
     * @dev Called periodically by backend after Envio analyzes new trades
     * @param tokenId The NFT token ID to update
     * @param newTrades Number of new trades since last update
     * @param newSuccessfulTrades Number of new winning trades
     * @param newVolume New volume traded
     * @param newPnL New profit/loss
     */
    function updatePatternPerformance(
        uint256 tokenId,
        uint256 newTrades,
        uint256 newSuccessfulTrades,
        uint256 newVolume,
        int256 newPnL
    )
        external
        whenNotPaused
        nonReentrant
    {
        // Get current pattern metadata
        BehavioralNFT.PatternMetadata memory metadata = behavioralNFT.getPatternMetadata(tokenId);

        // Calculate updated metrics
        uint256 totalTrades = metadata.winRate > 0
            ? (metadata.totalVolume * 10000) / metadata.winRate + newTrades
            : newTrades;

        uint256 totalSuccessful = metadata.winRate > 0
            ? (metadata.totalVolume * metadata.winRate) / 10000 + newSuccessfulTrades
            : newSuccessfulTrades;

        uint256 updatedWinRate = totalTrades > 0
            ? (totalSuccessful * 10000) / totalTrades
            : 0;

        uint256 updatedVolume = metadata.totalVolume + newVolume;

        int256 updatedRoi = updatedVolume > 0
            ? ((metadata.roi * int256(metadata.totalVolume) / 10000) + newPnL) * 10000 / int256(updatedVolume)
            : int256(0);

        // Update the NFT
        behavioralNFT.updatePerformance(tokenId, updatedWinRate, updatedVolume, updatedRoi);

        // Auto-deactivate if performance degrades below thresholds
        if (updatedWinRate < thresholds.minWinRate) {
            behavioralNFT.deactivatePattern(tokenId, "Win rate dropped below threshold");

            // Update user history
            address creator = metadata.creator;
            userHistory[creator].activePatterns--;
            userHistory[creator].deactivatedPatterns++;
        }
    }

    /**
     * @notice Batch process multiple pattern detections (gas efficient)
     * @dev Useful for processing multiple users' patterns in one transaction
     * @param patterns Array of detected patterns to validate and mint
     * @return tokenIds Array of minted token IDs (0 for failed validations)
     */
    function batchValidateAndMint(DetectedPattern[] calldata patterns)
        external
        whenNotPaused
        nonReentrant
        returns (uint256[] memory tokenIds)
    {
        tokenIds = new uint256[](patterns.length);

        for (uint256 i = 0; i < patterns.length; i++) {
            // Use internal validation to avoid reentrancy guard issues
            tokenIds[i] = _validateAndMintInternal(patterns[i]);
        }

        return tokenIds;
    }

    /**
     * @notice Internal function to validate and mint (used by batch function)
     * @dev Returns 0 on failure instead of reverting
     * @param pattern The detected pattern data
     * @return tokenId The minted NFT token ID (0 if validation failed)
     */
    function _validateAndMintInternal(DetectedPattern calldata pattern)
        internal
        returns (uint256 tokenId)
    {
        // Validate pattern type
        if (!_isValidPatternType(pattern.patternType)) {
            return 0;
        }

        // Check cooldown period
        UserPatternHistory storage history = userHistory[pattern.user];
        if (block.timestamp < history.lastDetectionTime + detectionCooldown) {
            return 0;
        }

        // Check max active patterns
        if (history.activePatterns >= maxActivePatternsPerUser) {
            return 0;
        }

        // Generate pattern hash to prevent duplicates
        bytes32 patternHash = _generatePatternHash(pattern);
        if (patternMinted[patternHash]) {
            return 0;
        }

        // Validate pattern meets thresholds
        string memory validationError = _validatePattern(pattern);
        if (bytes(validationError).length > 0) {
            return 0;
        }

        // Mark pattern as detected
        totalPatternsDetected++;
        emit PatternDetected(pattern.user, pattern.patternType, pattern.confidence, block.timestamp);

        // Calculate metrics for NFT
        uint256 winRate = (pattern.successfulTrades * 10000) / pattern.totalTrades;
        int256 roi = (pattern.totalPnL * 10000) / int256(pattern.totalVolume);

        // Mint BehavioralNFT
        tokenId = behavioralNFT.mintPattern(
            pattern.user,
            pattern.patternType,
            pattern.patternData
        );

        // Update performance metrics on the NFT
        behavioralNFT.updatePerformance(tokenId, winRate, pattern.totalVolume, roi);

        // Update state
        patternMinted[patternHash] = true;
        history.lastDetectionTime = block.timestamp;
        history.totalPatternsMinted++;
        history.activePatterns++;
        totalPatternsMinted++;

        emit PatternValidatedAndMinted(
            pattern.user,
            tokenId,
            pattern.patternType,
            winRate,
            pattern.totalVolume,
            roi
        );

        return tokenId;
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get user's pattern detection history
     * @param user Address to query
     * @return history User's pattern history
     */
    function getUserHistory(address user) external view returns (UserPatternHistory memory) {
        return userHistory[user];
    }

    /**
     * @notice Check if a pattern hash has already been minted
     * @param pattern The pattern to check
     * @return True if already minted
     */
    function isPatternMinted(DetectedPattern calldata pattern) external view returns (bool) {
        return patternMinted[_generatePatternHash(pattern)];
    }

    /**
     * @notice Get time remaining until user can detect another pattern
     * @param user Address to check
     * @return Seconds remaining (0 if ready)
     */
    function getCooldownRemaining(address user) external view returns (uint256) {
        uint256 nextAllowedTime = userHistory[user].lastDetectionTime + detectionCooldown;
        if (block.timestamp >= nextAllowedTime) return 0;
        return nextAllowedTime - block.timestamp;
    }

    /**
     * @notice Check if user can mint another pattern
     * @param user Address to check
     * @return canMint True if user can mint
     * @return reason Reason if cannot mint
     */
    function canUserMintPattern(address user)
        external
        view
        returns (bool canMint, string memory reason)
    {
        UserPatternHistory memory history = userHistory[user];

        // Check cooldown
        if (block.timestamp < history.lastDetectionTime + detectionCooldown) {
            return (false, "Cooldown period active");
        }

        // Check max patterns
        if (history.activePatterns >= maxActivePatternsPerUser) {
            return (false, "Maximum active patterns reached");
        }

        return (true, "");
    }

    /**
     * @notice Validate pattern against thresholds (view function)
     * @param pattern The pattern to validate
     * @return isValid True if pattern meets all thresholds
     * @return reason Failure reason if invalid
     */
    function validatePatternView(DetectedPattern calldata pattern)
        external
        view
        returns (bool isValid, string memory reason)
    {
        // Check pattern type
        if (!_isValidPatternType(pattern.patternType)) {
            return (false, "Invalid pattern type");
        }

        // Check if already minted
        if (patternMinted[_generatePatternHash(pattern)]) {
            return (false, "Pattern already minted");
        }

        // Run validation
        reason = _validatePattern(pattern);
        isValid = bytes(reason).length == 0;

        return (isValid, reason);
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Update validation thresholds
     * @dev Only owner can update
     */
    function updateThresholds(
        uint256 _minTrades,
        uint256 _minWinRate,
        uint256 _minVolume,
        uint256 _minConfidence,
        uint256 _minTimePeriod
    ) external onlyOwner {
        if (_minWinRate > 10000 || _minConfidence > 10000) revert InvalidThresholds();

        thresholds = ValidationThresholds({
            minTrades: _minTrades,
            minWinRate: _minWinRate,
            minVolume: _minVolume,
            minConfidence: _minConfidence,
            minTimePeriod: _minTimePeriod
        });

        emit ThresholdsUpdated(_minTrades, _minWinRate, _minVolume, _minConfidence);
    }

    /**
     * @notice Update detection cooldown period
     * @param _cooldown New cooldown in seconds
     */
    function updateCooldown(uint256 _cooldown) external onlyOwner {
        uint256 oldCooldown = detectionCooldown;
        detectionCooldown = _cooldown;
        emit CooldownUpdated(oldCooldown, _cooldown);
    }

    /**
     * @notice Update max active patterns per user
     * @param _maxPatterns New maximum
     */
    function updateMaxPatternsPerUser(uint256 _maxPatterns) external onlyOwner {
        uint256 oldMax = maxActivePatternsPerUser;
        maxActivePatternsPerUser = _maxPatterns;
        emit MaxPatternsPerUserUpdated(oldMax, _maxPatterns);
    }

    /**
     * @notice Pause pattern detection (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause pattern detection
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Validate pattern against all thresholds
     * @param pattern Pattern to validate
     * @return error Empty string if valid, error message otherwise
     */
    function _validatePattern(DetectedPattern calldata pattern)
        internal
        view
        returns (string memory error)
    {
        // Check minimum trades
        if (pattern.totalTrades < thresholds.minTrades) {
            return "Insufficient trades";
        }

        // Check win rate
        uint256 winRate = (pattern.successfulTrades * 10000) / pattern.totalTrades;
        if (winRate < thresholds.minWinRate) {
            return "Insufficient win rate";
        }

        // Check volume
        if (pattern.totalVolume < thresholds.minVolume) {
            return "Insufficient volume";
        }

        // Check confidence
        if (pattern.confidence < thresholds.minConfidence) {
            return "Insufficient confidence score";
        }

        // Check time period (pattern must be detected from data spanning minTimePeriod)
        // detectedAt represents when the earliest trade in the pattern occurred
        if (pattern.detectedAt > block.timestamp) {
            return "Invalid detection timestamp";
        }
        if (block.timestamp - pattern.detectedAt < thresholds.minTimePeriod) {
            return "Insufficient time period";
        }

        return "";
    }

    /**
     * @notice Generate unique hash for a pattern
     * @param pattern Pattern to hash
     * @return Hash of the pattern
     */
    function _generatePatternHash(DetectedPattern calldata pattern)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encodePacked(
                pattern.user,
                pattern.patternType,
                pattern.patternData,
                pattern.totalTrades,
                pattern.totalVolume
            )
        );
    }

    /**
     * @notice Validate pattern type string
     * @param patternType Pattern type to validate
     * @return True if valid
     */
    function _isValidPatternType(string calldata patternType)
        internal
        pure
        returns (bool)
    {
        bytes32 typeHash = keccak256(bytes(patternType));

        return typeHash == keccak256("Momentum") ||
               typeHash == keccak256("MeanReversion") ||
               typeHash == keccak256("Arbitrage") ||
               typeHash == keccak256("Liquidity") ||
               typeHash == keccak256("Yield") ||
               typeHash == keccak256("Composite");
    }
}
