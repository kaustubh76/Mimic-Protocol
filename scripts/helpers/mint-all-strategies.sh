#!/bin/bash

# Script to mint 5 trading strategies with cooldown delays
# Each pattern must wait for cooldown (3600 seconds = 1 hour)

set -e

RPC_URL="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

echo "=========================================="
echo "MINTING 5 TRADING STRATEGIES"
echo "=========================================="
echo ""

# Function to mint a single strategy
mint_strategy() {
    local pattern_type=$1
    local trades=$2
    local successful=$3
    local volume=$4
    local pnl=$5
    local confidence=$6

    echo "----------------------------------------"
    echo "Minting: $pattern_type"
    echo "Trades: $trades | Win Rate: $((successful * 100 / trades))%"
    echo "----------------------------------------"

    # Create temporary script with this strategy
    cat > /tmp/mint_single.s.sol << EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/PatternDetector.sol";
import "../contracts/BehavioralNFT.sol";

contract MintSingle is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(pk);

        PatternDetector detector = PatternDetector(0x8768e4E5c8c3325292A201f824FAb86ADae398d0);

        vm.startBroadcast(pk);

        PatternDetector.DetectedPattern memory pattern = PatternDetector.DetectedPattern({
            user: user,
            patternType: "$pattern_type",
            patternData: abi.encode("$pattern_type", uint256($trades), uint256($successful)),
            totalTrades: $trades,
            successfulTrades: $successful,
            totalVolume: ${volume} ether,
            totalPnL: int256(${pnl} ether),
            confidence: $confidence,
            detectedAt: block.timestamp - 8 days
        });

        try detector.validateAndMintPattern(pattern) returns (uint256 tokenId) {
            console.log("SUCCESS! Token ID:", tokenId);
        } catch Error(string memory reason) {
            console.log("FAILED:", reason);
        }

        vm.stopBroadcast();
    }
}
EOF

    # Run the script
    cd "/Users/apple/Desktop/Mimic Protocol"
    forge script /tmp/mint_single.s.sol:MintSingle \
        --rpc-url $RPC_URL \
        --broadcast \
        --legacy \
        2>&1 | grep -E "SUCCESS|FAILED|Token ID" || echo "Check logs for details"

    echo ""
}

# Strategy 1: Arbitrage
mint_strategy "Arbitrage" 10 9 8960 2574 9000

echo "Waiting 5 seconds before next mint..."
sleep 5

# Strategy 2: Liquidity
mint_strategy "Liquidity" 10 9 5000 1100 9000

echo "Waiting 5 seconds before next mint..."
sleep 5

# Strategy 3: Yield
mint_strategy "Yield" 10 7 12000 5160 7000

echo "Waiting 5 seconds before next mint..."
sleep 5

# Strategy 4: Composite
mint_strategy "Composite" 15 12 1500 202 8000

echo "Waiting 5 seconds before next mint..."
sleep 5

# Strategy 5: Another MeanReversion
mint_strategy "MeanReversion" 10 9 10500 3465 9000

echo ""
echo "=========================================="
echo "MINTING COMPLETE!"
echo "=========================================="
echo ""
echo "Checking total patterns..."
cast call 0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc \
    "totalPatterns()" \
    --rpc-url $RPC_URL

echo ""
echo "View your patterns at: http://localhost:3000/"
