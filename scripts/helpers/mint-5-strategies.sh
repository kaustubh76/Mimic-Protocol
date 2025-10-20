#!/bin/bash

# Mint 5 Additional Trading Strategies
# Uses cast to call PatternDetector contract

set -e

source .env

echo "🎨 Minting 5 Additional Trading Strategies"
echo "==========================================="
echo ""

PATTERN_DETECTOR="0x8768e4E5c8c3325292A201f824FAb86ADae398d0"
BEHAVIORAL_NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"

echo "PatternDetector: $PATTERN_DETECTOR"
echo "BehavioralNFT: $BEHAVIORAL_NFT"
echo ""

# Helper function to mint and update a pattern
mint_pattern() {
    local pattern_type=$1
    local description=$2
    local win_rate=$3
    local volume=$4
    local roi=$5
    local token_id=$6
    
    echo "Minting Strategy #$token_id: $pattern_type"
    echo "  Description: $description"
    echo "  Win Rate: $((win_rate / 100))%"
    echo "  Volume: $volume"
    echo "  ROI: $((roi / 100))%"
    
    # Encode pattern data
    local pattern_data=$(cast abi-encode "f(string,uint256,uint256)" "$description" "5" "100000000000000000000000")
    
    # Mint pattern (only PatternDetector can do this)
    # Since we can't call as PatternDetector, we'll use a different approach
    # We'll create patterns via the existing scripts
    
    echo "  ✓ Prepared"
    echo ""
}

echo "📝 Preparing 5 strategies:"
echo ""

mint_pattern "Arbitrage" "Cross-DEX arbitrage" 9000 "500000" 2870 3
mint_pattern "Liquidity" "Liquidity provision strategy" 9000 "350000" 2200 4  
mint_pattern "Yield" "Yield farming optimizer" 7000 "280000" 4300 5
mint_pattern "Composite" "Multi-strategy composite" 8000 "420000" 1350 6
mint_pattern "AdvancedMeanReversion" "Advanced mean reversion with ML" 9000 "380000" 3300 7

echo "✅ Strategy definitions prepared!"
echo ""
echo "Note: Since only PatternDetector can mint patterns,"
echo "we need to use the Foundry script approach."
echo ""
echo "Run: forge script script/MintAdditionalStrategies.s.sol --rpc-url \$MONAD_RPC_URL --broadcast"
