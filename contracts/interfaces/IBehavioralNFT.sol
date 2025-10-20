// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBehavioralNFT
 * @author Mirror Protocol Team
 * @notice Interface for the BehavioralNFT contract
 * @dev Used by other contracts to interact with pattern NFTs
 *
 * INTEGRATION POINTS:
 * - PatternDetector: Calls mintPattern() and updatePerformance()
 * - DelegationRouter: Queries pattern metadata and active status
 * - ExecutionEngine: Reads pattern data for execution
 * - Frontend: Displays patterns and leaderboards
 */
interface IBehavioralNFT {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct PatternMetadata {
        address creator;
        string patternType;
        bytes patternData;
        uint256 createdAt;
        uint256 winRate;
        uint256 totalVolume;
        int256 roi;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event PatternMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string patternType,
        bytes patternData,
        uint256 timestamp
    );

    event PatternPerformanceUpdated(
        uint256 indexed tokenId,
        uint256 winRate,
        uint256 totalVolume,
        int256 roi
    );

    event PatternDeactivated(uint256 indexed tokenId, string reason);

    event PatternDetectorUpdated(
        address indexed oldDetector,
        address indexed newDetector
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error Unauthorized();
    error PatternNotFound();
    error PatternInactive();
    error PatternAlreadyActive();
    error InvalidAddress();
    error InvalidPatternType();
    error InvalidPatternData();

    /*//////////////////////////////////////////////////////////////
                          MINTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function mintPattern(
        address creator,
        string memory patternType,
        bytes memory patternData
    ) external returns (uint256);

    /*//////////////////////////////////////////////////////////////
                    PATTERN MANAGEMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function updatePerformance(
        uint256 tokenId,
        uint256 winRate,
        uint256 totalVolume,
        int256 roi
    ) external;

    function deactivatePattern(uint256 tokenId, string memory reason) external;

    function reactivatePattern(uint256 tokenId) external;

    /*//////////////////////////////////////////////////////////////
                          QUERY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getPatternMetadata(uint256 tokenId)
        external
        view
        returns (PatternMetadata memory);

    function getCreatorPatterns(address creator)
        external
        view
        returns (uint256[] memory);

    function totalPatterns() external view returns (uint256);

    function isPatternActive(uint256 tokenId) external view returns (bool);

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function setPatternDetector(address detector) external;

    function pause() external;

    function unpause() external;
}
