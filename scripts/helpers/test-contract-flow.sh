#!/bin/bash

# Test Complete Smart Contract Flow
# Tests: Pattern Minting -> Delegation -> Execution

echo "=================================================="
echo "TESTING MIRROR PROTOCOL SMART CONTRACT FLOW"
echo "=================================================="
echo ""

RPC_URL="https://testnet.monad.xyz/rpc"
BEHAVIORAL_NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"
DELEGATION_ROUTER="0x56C145f5567f8DB77533c825cf4205F1427c5517"
PATTERN_DETECTOR="0x8768e4E5c8c3325292A201f824FAb86ADae398d0"
EXECUTION_ENGINE="0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287"

echo "📋 Contract Addresses:"
echo "  - BehavioralNFT: $BEHAVIORAL_NFT"
echo "  - DelegationRouter: $DELEGATION_ROUTER"
echo "  - PatternDetector: $PATTERN_DETECTOR"
echo "  - ExecutionEngine: $EXECUTION_ENGINE"
echo ""

echo "🔍 Step 1: Check BehavioralNFT State"
echo "----------------------------------------"
echo "Total patterns minted:"
cast call $BEHAVIORAL_NFT "totalPatterns()(uint256)" --rpc-url $RPC_URL 2>&1 | head -3

echo ""
echo "Total supply (NFTs):"
cast call $BEHAVIORAL_NFT "totalSupply()(uint256)" --rpc-url $RPC_URL 2>&1 | head -3

echo ""
echo "🔍 Step 2: Check DelegationRouter State"
echo "----------------------------------------"
echo "Total delegations count:"
cast call $DELEGATION_ROUTER "totalDelegations()(uint256)" --rpc-url $RPC_URL 2>&1 | head -3

echo ""
echo "🔍 Step 3: Check ExecutionEngine State"
echo "----------------------------------------"
echo "Checking ExecutionEngine storage..."
cast storage $EXECUTION_ENGINE 0 --rpc-url $RPC_URL 2>&1 | head -3

echo ""
echo "🔍 Step 4: Check Pattern Detector"
echo "----------------------------------------"
echo "Get pattern detector owner:"
cast call $PATTERN_DETECTOR "owner()(address)" --rpc-url $RPC_URL 2>&1 | head -3

echo ""
echo "=================================================="
echo "SUMMARY"
echo "=================================================="
