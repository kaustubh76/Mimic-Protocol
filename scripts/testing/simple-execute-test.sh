#!/bin/bash
# Simple Trade Execution Test
set -e

cd "/Users/apple/Desktop/Mimic Protocol"
source .env

# Configuration
RPC="https://rpc.ankr.com/monad_testnet"
EXECUTION_ENGINE="0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE"
MOCK_DEX="0x3B083d82062ebbD1dDcdD2DB793da949329953b5"

echo "=================================================="
echo "🚀 Simple Trade Execution Test"
echo "=================================================="
echo ""

# Trade parameters
DELEGATION_ID=6
TOKEN="0x0000000000000000000000000000000000000000"  # ETH
TOKEN_OUT="0x0000000000000000000000000000000000000001"
AMOUNT="1000000000000000000"  # 1 ETH
TIMESTAMP=$(date +%s)

# Pattern metrics (from pattern #1)
WIN_RATE=8750  # 87.5%
ROI=2870       # 28.7%
VOLUME=10000000000000000000000  # 10k tokens

# Encode calldata
CALLDATA=$(cast calldata "swap(address,address,uint256,uint256)" $TOKEN $TOKEN_OUT $AMOUNT "980000000000000000")

echo "📊 Executing trade for delegation #$DELEGATION_ID"
echo ""
echo "Trade params:"
echo "  Amount: 1 ETH"
echo "  Target: $MOCK_DEX (MockDEX)"
echo ""
echo "Pattern metrics:"
echo "  Win Rate: $WIN_RATE (87.5%)"
echo "  ROI: $ROI (28.7%)"
echo ""

# Execute trade
echo "📤 Sending transaction..."
TX=$(cast send $EXECUTION_ENGINE \
  "executeTrade((uint256,address,uint256,address,bytes),(uint256,int256,uint256,uint256))" \
  "($DELEGATION_ID,$TOKEN,$AMOUNT,$MOCK_DEX,$CALLDATA)" \
  "($WIN_RATE,$ROI,$VOLUME,$TIMESTAMP)" \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC \
  --gas-limit 1000000 \
  2>&1)

echo "$TX"
echo ""

# Check if succeeded
if echo "$TX" | grep -q "status.*1"; then
  echo "✅ Trade executed successfully!"

  # Get transaction hash
  TX_HASH=$(echo "$TX" | grep "transactionHash" | awk '{print $2}')
  echo "   Transaction: $TX_HASH"
  echo ""

  # Wait for confirmation
  echo "⏳ Waiting for block confirmation..."
  sleep 5

  # Check execution stats
  echo "📊 Checking execution stats..."
  STATS=$(cast call $EXECUTION_ENGINE \
    "executionStats(uint256)(uint256,uint256,uint256,uint256,uint256,uint256)" \
    $DELEGATION_ID \
    --rpc-url $RPC)

  echo "Execution Stats for Delegation $DELEGATION_ID:"
  echo "$STATS"
  echo ""

  # Parse stats
  TOTAL=$(echo "$STATS" | awk '{print $1}')
  SUCCESS=$(echo "$STATS" | awk '{print $2}')
  FAILED=$(echo "$STATS" | awk '{print $3}')

  echo "✅ Stats Updated!"
  echo "   Total Executions: $TOTAL"
  echo "   Successful: $SUCCESS"
  echo "   Failed: $FAILED"
  echo ""
  echo "🎉 Frontend will now show real execution data!"

else
  echo "❌ Transaction failed"
  echo ""
  echo "Checking what went wrong..."

  # Try to get more details
  if echo "$TX" | grep -q "revert"; then
    echo "Transaction reverted on-chain"
    echo ""
    echo "Possible reasons:"
    echo "- MockDEX doesn't have receive() function for ETH"
    echo "- ExecutionEngine validation failed"
    echo "- Delegation not active"
  fi
fi

echo ""
echo "=================================================="
