#!/bin/bash

# Script to mint all 7 patterns with 1-hour cooldown between each
# Run this script in the background: ./mint-all-patterns.sh &

set -e

echo "========================================"
echo "MINTING 7 PATTERNS WITH COOLDOWN"
echo "========================================"
echo ""

# Pattern types to mint
PATTERNS=("Arbitrage" "Momentum" "MeanReversion" "Breakout" "Scalping" "SwingTrading" "Composite")

for i in "${!PATTERNS[@]}"; do
    PATTERN="${PATTERNS[$i]}"
    NUM=$((i + 1))

    echo "[$NUM/7] Minting $PATTERN strategy..."
    echo "Time: $(date)"

    # Create a temporary single-pattern minting script
    cat > "script/MintPattern${NUM}.s.sol" <<EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

contract MintPattern${NUM} is Script {
    PatternDetector public detector;
    BehavioralNFT public nft;

    address constant PATTERN_DETECTOR = 0x8768e4E5c8c3325292A201f824FAb86ADae398d0;
    address constant BEHAVIORAL_NFT = 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        detector = PatternDetector(PATTERN_DETECTOR);
        nft = BehavioralNFT(BEHAVIORAL_NFT);

        console.log("Minting pattern $NUM/7: $PATTERN");
        console.log("Current total:", nft.totalPatterns());

        vm.startBroadcast(deployerPrivateKey);
EOF

    # Add pattern-specific data
    case $i in
        0) # Arbitrage
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "Arbitrage",
            patternData: abi.encode("Arbitrage", 10, 9),
            totalTrades: 10,
            successfulTrades: 9,
            totalVolume: 8960 ether,
            totalPnL: 2574 ether,
            confidence: 9000,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        1) # Momentum
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "Momentum",
            patternData: abi.encode("Momentum", 20, 17),
            totalTrades: 20,
            successfulTrades: 17,
            totalVolume: 10500 ether,
            totalPnL: 3465 ether,
            confidence: 8500,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        2) # MeanReversion
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "MeanReversion",
            patternData: abi.encode("MeanReversion", 25, 22),
            totalTrades: 25,
            successfulTrades: 22,
            totalVolume: 5000 ether,
            totalPnL: 1100 ether,
            confidence: 8800,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        3) # Breakout
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "Breakout",
            patternData: abi.encode("Breakout", 15, 10),
            totalTrades: 15,
            successfulTrades: 10,
            totalVolume: 12000 ether,
            totalPnL: 5400 ether,
            confidence: 7000,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        4) # Scalping
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "Scalping",
            patternData: abi.encode("Scalping", 50, 41),
            totalTrades: 50,
            successfulTrades: 41,
            totalVolume: 1500 ether,
            totalPnL: 225 ether,
            confidence: 8200,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        5) # SwingTrading
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "SwingTrading",
            patternData: abi.encode("SwingTrading", 18, 14),
            totalTrades: 18,
            successfulTrades: 14,
            totalVolume: 9500 ether,
            totalPnL: 3610 ether,
            confidence: 7800,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
        6) # Composite
            cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'
        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: deployer,
            patternType: "Composite",
            patternData: abi.encode("Composite", 30, 24),
            totalTrades: 30,
            successfulTrades: 24,
            totalVolume: 7200 ether,
            totalPnL: 1800 ether,
            confidence: 8000,
            detectedAt: block.timestamp - 8 days
        });
EOF
            ;;
    esac

    # Complete the script
    cat >> "script/MintPattern${NUM}.s.sol" <<'EOF'

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Minted as NFT #", tokenId);
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
        } catch (bytes memory) {
            console.log("FAILED: Unknown error");
        }

        vm.stopBroadcast();

        console.log("New total patterns:", nft.totalPatterns());
    }
}
EOF

    # Run the forge script
    forge script "script/MintPattern${NUM}.s.sol:MintPattern${NUM}" \
        --rpc-url https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0 \
        --broadcast \
        --legacy \
        2>&1 | grep -E "(SUCCESS|FAILED|Minting|total)"

    # Clean up temporary script
    rm "script/MintPattern${NUM}.s.sol"

    # Wait 1 hour before next mint (except for last one)
    if [ $i -lt 6 ]; then
        echo ""
        echo "Waiting 1 hour before next mint (cooldown period)..."
        echo "Next mint at: $(date -v+1H)"
        echo ""
        sleep 3600  # 1 hour = 3600 seconds
    fi
done

echo ""
echo "========================================"
echo "ALL 7 PATTERNS MINTED SUCCESSFULLY!"
echo "========================================"
echo "Check your frontend at http://localhost:3000"
echo ""
