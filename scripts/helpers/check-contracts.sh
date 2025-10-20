#!/bin/bash

# Optimized Contract State Check - Minimal RPC Calls
# Uses cast with --legacy flag for Monad compatibility

RPC="https://testnet.monad.xyz/rpc"
NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"
ROUTER="0x56C145f5567f8DB77533c825cf4205F1427c5517"
ENGINE="0xBbBE055f281Ef5d3F6004E0eE2A8447be26e6287"

echo "================================================"
echo "CHECKING MIRROR PROTOCOL CONTRACTS"
echo "================================================"
echo ""

# Single call each - only 3 RPC requests total
echo "1. BehavioralNFT - Total Patterns:"
cast call $NFT "totalPatterns()(uint256)" --rpc-url $RPC 2>&1 | grep -v "Error" || echo "   [RPC Error]"

echo ""
echo "2. DelegationRouter - Total Delegations:"
cast call $ROUTER "totalDelegations()(uint256)" --rpc-url $RPC 2>&1 | grep -v "Error" || echo "   [RPC Error]"

echo ""
echo "3. ExecutionEngine - Total Trades:"
cast call $ENGINE "totalTrades()(uint256)" --rpc-url $RPC 2>&1 | grep -v "Error" || echo "   [RPC Error]"

echo ""
echo "================================================"
echo "Total RPC calls made: 3"
echo "================================================"
