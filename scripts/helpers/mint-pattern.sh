#!/bin/bash

# Script to mint trading patterns directly via BehavioralNFT
# Simplified approach - directly mint patterns with PatternDetector address

set -e

echo "==========================================="
echo "MINTING TRADING PATTERN NFTs"
echo "==========================================="
echo ""

# Contract addresses
BEHAVIORAL_NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"
PATTERN_DETECTOR="0x8768e4E5c8c3325292A201f824FAb86ADae398d0"
RPC_URL="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"

# Get current total patterns
CURRENT_PATTERNS=$(cast call $BEHAVIORAL_NFT "totalPatterns()(uint256)" --rpc-url $RPC_URL)
echo "Current patterns on-chain: $CURRENT_PATTERNS"
echo ""

# Strategy 1: Aggressive Momentum (87.5% win rate)
echo "-------------------------------------------"
echo "Minting Pattern #1: AggressiveMomentum"
echo "Win Rate: 87.5% | ROI: +28.7% | Volume: 8,960 ETH"
echo "-------------------------------------------"

cast send $BEHAVIORAL_NFT \
  "mintPattern(address,string)" \
  $PATTERN_DETECTOR \
  "AggressiveMomentum" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-limit 500000

echo "✅ Pattern #1 minted!"
echo ""
sleep 3

# Strategy 2: Conservative Mean Reversion (90% win rate)
echo "-------------------------------------------"
echo "Minting Pattern #2: ConservativeMeanReversion"
echo "Win Rate: 90% | ROI: +22% | Volume: 5,000 ETH"
echo "-------------------------------------------"

cast send $BEHAVIORAL_NFT \
  "mintPattern(address,string)" \
  $PATTERN_DETECTOR \
  "ConservativeMeanReversion" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-limit 500000

echo "✅ Pattern #2 minted!"
echo ""
sleep 3

# Strategy 3: Breakout Trading (66.7% win rate)
echo "-------------------------------------------"
echo "Minting Pattern #3: BreakoutTrading"
echo "Win Rate: 66.7% | ROI: +43% | Volume: 12,000 ETH"
echo "-------------------------------------------"

cast send $BEHAVIORAL_NFT \
  "mintPattern(address,string)" \
  $PATTERN_DETECTOR \
  "BreakoutTrading" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-limit 500000

echo "✅ Pattern #3 minted!"
echo ""
sleep 3

# Strategy 4: Scalping Strategy (80% win rate)
echo "-------------------------------------------"
echo "Minting Pattern #4: ScalpingStrategy"
echo "Win Rate: 80% | ROI: +13.5% | Volume: 1,500 ETH"
echo "-------------------------------------------"

cast send $BEHAVIORAL_NFT \
  "mintPattern(address,string)" \
  $PATTERN_DETECTOR \
  "ScalpingStrategy" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-limit 500000

echo "✅ Pattern #4 minted!"
echo ""
sleep 3

# Strategy 5: Swing Trading (85.7% win rate)
echo "-------------------------------------------"
echo "Minting Pattern #5: SwingTrading"
echo "Win Rate: 85.7% | ROI: +33% | Volume: 10,500 ETH"
echo "-------------------------------------------"

cast send $BEHAVIORAL_NFT \
  "mintPattern(address,string)" \
  $PATTERN_DETECTOR \
  "SwingTrading" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --legacy \
  --gas-limit 500000

echo "✅ Pattern #5 minted!"
echo ""

# Check new total
NEW_TOTAL=$(cast call $BEHAVIORAL_NFT "totalPatterns()(uint256)" --rpc-url $RPC_URL)

echo "==========================================="
echo "MINTING COMPLETE!"
echo "==========================================="
echo "Previous patterns: $CURRENT_PATTERNS"
echo "New total patterns: $NEW_TOTAL"
echo "Patterns added: $((NEW_TOTAL - CURRENT_PATTERNS))"
echo ""
echo "View patterns at: http://localhost:3002/"
echo "==========================================="
