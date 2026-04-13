# BehavioralNFT Contract Documentation

## Overview

**BehavioralNFT** is an ERC-721 NFT contract that represents successful trading patterns detected by Envio HyperSync. Each NFT embodies a specific trading strategy that can be delegated to via MetaMask Smart Accounts for automated execution.

## Key Features

- ✅ **Pattern Ownership**: Trading patterns are minted as tradeable NFTs
- ✅ **Performance Tracking**: Real-time metrics (win rate, volume, ROI)
- ✅ **Delegation Support**: Integrates with MetaMask Delegation Toolkit
- ✅ **Envio Integration**: Sub-50ms pattern queries via HyperSync
- ✅ **Security**: Access control, pausable, reentrancy protection

## Contract Details

- **License**: MIT
- **Solidity Version**: ^0.8.20
- **Inheritance**: ERC721, ERC721URIStorage, Ownable, Pausable, ReentrancyGuard
- **Network**: Ethereum Sepolia (Chain ID: 11155111)

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  ENVIO HYPERCORE                                         │
│  Detects patterns in real-time (<50ms)                   │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────┐
│  PATTERN DETECTOR                                        │
│  Validates and triggers minting                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ↓ mintPattern()
┌──────────────────────────────────────────────────────────┐
│  BEHAVIORAL NFT (This Contract)                          │
│  • Stores pattern metadata                               │
│  • Tracks performance metrics                            │
│  • Emits events for Envio indexing                       │
└──────────────────┬───────────────────────────────────────┘
                   │
                   ├──→ DELEGATION ROUTER (reads patterns)
                   ├──→ EXECUTION ENGINE (reads parameters)
                   └──→ ENVIO (indexes all events)
```

## Core Functions

### Minting

```solidity
function mintPattern(
    address creator,
    string memory patternType,
    bytes memory patternData
) external onlyPatternDetector returns (uint256)
```

Mints a new pattern NFT. Only callable by authorized PatternDetector.

**Parameters:**
- `creator`: Address that generated the pattern
- `patternType`: Category of pattern (e.g., "momentum", "arbitrage")
- `patternData`: ABI-encoded pattern parameters

**Returns:** Token ID of the minted NFT

**Events:** `PatternMinted(tokenId, creator, patternType, patternData, timestamp)`

**Gas Usage:** ~317k

### Performance Updates

```solidity
function updatePerformance(
    uint256 tokenId,
    uint256 winRate,
    uint256 totalVolume,
    int256 roi
) external onlyPatternDetector
```

Updates pattern performance metrics after executions.

**Parameters:**
- `tokenId`: Pattern NFT ID
- `winRate`: Success rate in basis points (10000 = 100%)
- `totalVolume`: Total volume traded using this pattern
- `roi`: Return on investment in basis points (can be negative)

**Events:** `PatternPerformanceUpdated(tokenId, winRate, totalVolume, roi)`

**Gas Usage:** ~95k

### Pattern Management

```solidity
function deactivatePattern(uint256 tokenId, string memory reason) external
function reactivatePattern(uint256 tokenId) external onlyOwner
```

Deactivate/reactivate patterns. Deactivation stops new delegations.

### Query Functions

```solidity
function getPatternMetadata(uint256 tokenId) external view returns (PatternMetadata memory)
function getCreatorPatterns(address creator) external view returns (uint256[] memory)
function totalPatterns() external view returns (uint256)
function isPatternActive(uint256 tokenId) external view returns (bool)
```

## Pattern Metadata Structure

```solidity
struct PatternMetadata {
    address creator;        // Original pattern creator
    string patternType;     // e.g., "buy_dip", "momentum"
    bytes patternData;      // Encoded pattern parameters
    uint256 createdAt;      // Block timestamp
    uint256 winRate;        // Success rate (basis points)
    uint256 totalVolume;    // Total volume traded
    int256 roi;             // Return on investment (basis points)
    bool isActive;          // Can be delegated to
}
```

## Events

### PatternMinted
```solidity
event PatternMinted(
    uint256 indexed tokenId,
    address indexed creator,
    string patternType,
    bytes patternData,
    uint256 timestamp
);
```

Emitted when a new pattern NFT is minted. Indexed by Envio for sub-50ms queries.

### PatternPerformanceUpdated
```solidity
event PatternPerformanceUpdated(
    uint256 indexed tokenId,
    uint256 winRate,
    uint256 totalVolume,
    int256 roi
);
```

Emitted when pattern metrics are updated. Used for leaderboards and performance tracking.

### PatternDeactivated
```solidity
event PatternDeactivated(uint256 indexed tokenId, string reason);
```

Emitted when a pattern is deactivated.

## Access Control

| Function | Access Level |
|----------|--------------|
| `mintPattern()` | Pattern Detector only |
| `updatePerformance()` | Pattern Detector only |
| `deactivatePattern()` | Pattern owner or contract owner |
| `reactivatePattern()` | Contract owner only |
| `setPatternDetector()` | Contract owner only |
| `pause()`/`unpause()` | Contract owner only |

## Security Features

- ✅ **Reentrancy Protection**: All state-changing functions protected
- ✅ **Access Control**: Role-based permissions
- ✅ **Pausable**: Emergency stop mechanism
- ✅ **Input Validation**: All parameters validated
- ✅ **Safe Minting**: Uses `_safeMint()` to prevent stuck NFTs

## Integration Guide

### For Pattern Detector Contract

```solidity
// Import interface
import "./interfaces/IBehavioralNFT.sol";

contract PatternDetector {
    IBehavioralNFT public behavioralNFT;

    function detectAndMintPattern(address user, bytes memory pattern) external {
        // Analyze pattern
        string memory patternType = analyzePatternType(pattern);

        // Mint NFT
        uint256 tokenId = behavioralNFT.mintPattern(
            user,
            patternType,
            pattern
        );

        // Update performance after execution
        behavioralNFT.updatePerformance(
            tokenId,
            winRate,      // Calculate win rate
            totalVolume,  // Sum of volumes
            roi           // Calculate ROI
        );
    }
}
```

### For Frontend (via Envio)

```javascript
// Query patterns with Envio (sub-50ms)
const patterns = await envio.query({
  patterns: {
    where: { isActive: true },
    orderBy: { roi: 'desc' },
    limit: 10
  }
});

// Get creator's patterns
const creatorPatterns = await behavioralNFT.getCreatorPatterns(creatorAddress);

// Get pattern details
const metadata = await behavioralNFT.getPatternMetadata(tokenId);
```

### For Delegation Router

```solidity
// Verify pattern is active before delegation
function createDelegation(uint256 patternId) external {
    require(behavioralNFT.isPatternActive(patternId), "Pattern inactive");

    // Get pattern metadata
    IBehavioralNFT.PatternMetadata memory pattern =
        behavioralNFT.getPatternMetadata(patternId);

    // Create delegation
    // ...
}
```

## Deployment

### Using Foundry

```bash
# 1. Set environment variables in .env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
DEPLOYER_PRIVATE_KEY=your_private_key_here

# 2. Deploy contract
forge script script/DeployBehavioralNFT.s.sol:DeployBehavioralNFT \
    --rpc-url sepolia \
    --broadcast \
    --verify

# 3. Set pattern detector address
cast send $BEHAVIORAL_NFT_ADDRESS \
    "setPatternDetector(address)" \
    $PATTERN_DETECTOR_ADDRESS \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --rpc-url $SEPOLIA_RPC_URL
```

### Post-Deployment Checklist

- [ ] Contract deployed to Ethereum Sepolia
- [ ] Contract verified on explorer
- [ ] Address saved to `.env` as `BEHAVIORAL_NFT_ADDRESS`
- [ ] Pattern detector address set via `setPatternDetector()`
- [ ] Ownership transferred to multisig (if applicable)
- [ ] Envio config updated with contract address
- [ ] Integration tests passing

## Testing

```bash
# Run all tests
forge test --match-contract BehavioralNFTTest

# Run with gas report
forge test --match-contract BehavioralNFTTest --gas-report

# Run specific test
forge test --match-test test_MintPattern_Success -vvvv

# Check coverage
forge coverage
```

### Test Results

- **Total Tests**: 30
- **Pass Rate**: 100%
- **Coverage**: 100% of core functions
- **Fuzz Tests**: 2 (256 runs each)

## Gas Benchmarks

| Function | Average Gas | Max Gas |
|----------|-------------|---------|
| `mintPattern()` | 309,976 | 388,346 |
| `updatePerformance()` | 93,978 | 95,852 |
| `deactivatePattern()` | 29,651 | 31,923 |
| `getPatternMetadata()` | 26,459 | 30,963 |
| `transferFrom()` | 54,680 | 54,680 |

## Envio Integration

### config.yaml

```yaml
contracts:
  - name: BehavioralNFT
    address: ${BEHAVIORAL_NFT_ADDRESS}
    abi: ./abis/BehavioralNFT.json
    events:
      - PatternMinted
      - PatternPerformanceUpdated
      - Transfer
    startBlock: ${DEPLOYMENT_BLOCK}
    network: sepolia
```

### Event Handler

```javascript
// src/envio/handlers/behavioralNFT.js
export async function handlePatternMinted(event) {
  const startTime = Date.now();

  await db.patterns.create({
    tokenId: event.params.tokenId,
    creator: event.params.creator,
    patternType: event.params.patternType,
    patternData: event.params.patternData,
    createdAt: event.params.timestamp,
    isActive: true
  });

  const latency = Date.now() - startTime;
  if (latency < 50) {
    console.log(`✅ SUB-50MS INDEXING: ${latency}ms`);
  }
}
```

## Troubleshooting

### Common Issues

**Issue**: Minting fails with "Unauthorized" error
**Solution**: Ensure caller is the authorized PatternDetector address

**Issue**: Pattern not queryable via Envio
**Solution**: Verify Envio is configured correctly and indexing the contract

**Issue**: Gas cost too high
**Solution**: Use smaller `patternData` size, batch operations if possible

**Issue**: Pattern cannot be transferred
**Solution**: Check if pattern owner is correct, ensure not paused

## Roadmap

### v1.0 (Current)
- ✅ Basic minting and performance tracking
- ✅ Envio integration
- ✅ Access control and security

### v1.1 (Next)
- [ ] On-chain SVG generation for pattern visualization
- [ ] ERC2981 royalty support
- [ ] Pattern versioning
- [ ] Batch minting support

### v2.0 (Future)
- [ ] Cross-chain pattern NFTs
- [ ] Pattern composition (combine multiple patterns)
- [ ] On-chain pattern validation
- [ ] Governance for pattern curation

## Resources

- **OpenZeppelin Docs**: https://docs.openzeppelin.com/contracts/5.x/
- **Envio Docs**: https://docs.envio.dev
- **MetaMask Delegation**: https://docs.metamask.io/delegation-toolkit/
- **Foundry Book**: https://book.getfoundry.sh/

## License

MIT License - see LICENSE file for details

## Contact

- **Project**: Mirror Protocol
- **Team**: Mirror Protocol Team
- **Support**: [GitHub Issues](https://github.com/mirror-protocol/issues)

---

**Built on Ethereum Sepolia with Envio HyperSync and MetaMask Smart Accounts**

*"Your trading style is now a product. Own it. Trade it. Delegate it."*
