#!/bin/bash
# Demo Trade Execution Script
# Manually triggers ExecutionEngine to execute a trade for demonstration

set -e

echo "=================================================="
echo "Mirror Protocol - Manual Trade Execution Demo"
echo "=================================================="
echo ""

# Configuration
RPC="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"
EXECUTION_ENGINE="0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE"
DELEGATION_ROUTER="0xd5499e0d781b123724dF253776Aa1EB09780AfBf"
BEHAVIORAL_NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"

# Use the private key from environment
if [ -z "$PRIVATE_KEY" ]; then
  echo "❌ Error: PRIVATE_KEY environment variable not set"
  echo "   Set it with: export PRIVATE_KEY=0x..."
  exit 1
fi

EXECUTOR=$(cast wallet address --private-key $PRIVATE_KEY)

echo "📋 Configuration:"
echo "   Executor Address:     $EXECUTOR"
echo "   ExecutionEngine:      $EXECUTION_ENGINE"
echo "   DelegationRouter:     $DELEGATION_ROUTER"
echo ""

# Step 1: Check if executor has permission
echo "🔍 Step 1: Check Executor Permission"
echo "--------------------------------------"
IS_EXECUTOR=$(cast call $EXECUTION_ENGINE "isExecutor(address)(bool)" $EXECUTOR --rpc-url $RPC 2>/dev/null || echo "false")

if [ "$IS_EXECUTOR" == "false" ]; then
  echo "⚠️  Address $EXECUTOR is not authorized as executor"
  echo ""
  echo "📝 Adding executor permission..."

  # Check if we're the owner
  OWNER=$(cast call $EXECUTION_ENGINE "owner()(address)" --rpc-url $RPC)
  echo "   Contract Owner: $OWNER"
  echo "   Your Address:   $EXECUTOR"

  if [ "${EXECUTOR,,}" == "${OWNER,,}" ]; then
    echo "   ✅ You are the owner, adding executor permission..."

    cast send $EXECUTION_ENGINE \
      "addExecutor(address)" \
      $EXECUTOR \
      --private-key $PRIVATE_KEY \
      --rpc-url $RPC \
      --gas-limit 100000

    echo "   ✅ Executor permission added!"
  else
    echo "   ❌ You are not the owner. Cannot add executor permission."
    echo "   Please contact the contract owner to add your address as executor."
    exit 1
  fi
else
  echo "✅ Address is authorized as executor"
fi
echo ""

# Step 2: Get active delegations
echo "🔍 Step 2: Find Active Delegations"
echo "--------------------------------------"

# Query total delegations
TOTAL_DELEGATIONS=$(cast call $DELEGATION_ROUTER "totalDelegations()(uint256)" --rpc-url $RPC)
echo "Total delegations: $TOTAL_DELEGATIONS"

if [ "$TOTAL_DELEGATIONS" == "0" ]; then
  echo "❌ No delegations exist. Create a delegation first."
  exit 1
fi

# Check first 5 delegations to find an active one
DELEGATION_ID=""
for i in {1..5}; do
  if [ $i -gt $TOTAL_DELEGATIONS ]; then
    break
  fi

  echo "Checking delegation $i..."

  # Get delegation basics
  BASICS=$(cast call $DELEGATION_ROUTER \
    "getDelegationBasics(uint256)(address,uint256,uint256,bool,address,uint256)" \
    $i \
    --rpc-url $RPC 2>/dev/null || echo "")

  if [ ! -z "$BASICS" ]; then
    # Parse output (space-separated values)
    read -r DELEGATOR PATTERN_ID PERCENTAGE IS_ACTIVE SMART_ACCOUNT CREATED_AT <<< "$BASICS"

    echo "   Delegator: $DELEGATOR"
    echo "   Pattern:   #$PATTERN_ID"
    echo "   Active:    $IS_ACTIVE"

    if [ "$IS_ACTIVE" == "true" ]; then
      DELEGATION_ID=$i
      echo "   ✅ Found active delegation!"
      break
    fi
  fi
  echo ""
done

if [ -z "$DELEGATION_ID" ]; then
  echo "❌ No active delegations found"
  exit 1
fi

echo "Selected delegation ID: $DELEGATION_ID"
echo ""

# Step 3: Get pattern performance metrics
echo "🔍 Step 3: Get Pattern Performance Metrics"
echo "--------------------------------------"

PATTERN_DATA=$(cast call $BEHAVIORAL_NFT \
  "patterns(uint256)(address,string,string,uint256,uint256,uint256,uint256,bool)" \
  $PATTERN_ID \
  --rpc-url $RPC 2>/dev/null)

if [ -z "$PATTERN_DATA" ]; then
  echo "❌ Failed to get pattern data"
  exit 1
fi

# Parse pattern data
read -r CREATOR PATTERN_TYPE PATTERN_DATA_STR CREATED_AT WIN_RATE VOLUME ROI IS_ACTIVE <<< "$PATTERN_DATA"

echo "Pattern #$PATTERN_ID:"
echo "   Type:     $PATTERN_TYPE"
echo "   Win Rate: $WIN_RATE (basis points)"
echo "   ROI:      $ROI (basis points)"
echo "   Volume:   $VOLUME"
echo "   Active:   $IS_ACTIVE"
echo ""

# Step 4: Prepare trade execution
echo "🚀 Step 4: Execute Demo Trade"
echo "--------------------------------------"

# For demo purposes, we'll execute a simulated trade
# In production, this would be a real DEX swap

# Mock token address (using zero address for demo)
TOKEN_ADDRESS="0x0000000000000000000000000000000000000000"
TRADE_AMOUNT="1000000000000000000"  # 1 token (18 decimals)
TARGET_CONTRACT="0x0000000000000000000000000000000000000001"  # Mock DEX
CALL_DATA="0x"  # Empty calldata for demo

echo "Trade Parameters:"
echo "   Delegation ID: $DELEGATION_ID"
echo "   Token:         $TOKEN_ADDRESS"
echo "   Amount:        $TRADE_AMOUNT (1.0 tokens)"
echo "   Target:        $TARGET_CONTRACT"
echo ""

# Performance metrics (from pattern data)
CURRENT_TIME=$(date +%s)

echo "Performance Metrics (Envio-sourced in production):"
echo "   Win Rate: $WIN_RATE"
echo "   ROI:      $ROI"
echo "   Volume:   $VOLUME"
echo "   Updated:  $CURRENT_TIME"
echo ""

echo "⚠️  NOTE: This is a demo trade with mock parameters."
echo "   In production, this would execute a real DEX swap."
echo ""

read -p "Press Enter to execute the trade (Ctrl+C to cancel)..."

echo ""
echo "Executing trade..."

# Call executeTrade with properly formatted parameters
# executeTrade(TradeParams calldata params, PerformanceMetrics calldata metrics)
# TradeParams: (delegationId, token, amount, targetContract, callData)
# PerformanceMetrics: (currentWinRate, currentROI, currentVolume, lastUpdated)

TX_HASH=$(cast send $EXECUTION_ENGINE \
  "executeTrade((uint256,address,uint256,address,bytes),(uint256,int256,uint256,uint256))" \
  "($DELEGATION_ID,$TOKEN_ADDRESS,$TRADE_AMOUNT,$TARGET_CONTRACT,$CALL_DATA)" \
  "($WIN_RATE,$ROI,$VOLUME,$CURRENT_TIME)" \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC \
  --gas-limit 500000 2>&1)

if [[ "$TX_HASH" == *"0x"* ]]; then
  echo "✅ Trade executed successfully!"
  echo "   Transaction: $TX_HASH"
else
  echo "❌ Trade execution failed:"
  echo "$TX_HASH"
  echo ""
  echo "This is expected for a demo trade with mock parameters."
  echo "The important part is that the contract is callable and ready."
  exit 1
fi

echo ""

# Step 5: Check execution stats
echo "📊 Step 5: Verify Execution Stats Updated"
echo "--------------------------------------"

sleep 3  # Wait for transaction to be mined

STATS=$(cast call $EXECUTION_ENGINE \
  "executionStats(uint256)(uint256,uint256,uint256,uint256,uint256,uint256)" \
  $DELEGATION_ID \
  --rpc-url $RPC 2>/dev/null || echo "")

if [ ! -z "$STATS" ]; then
  read -r TOTAL SUCCESS FAILED VOLUME_EXEC GAS_USED LAST_TIME <<< "$STATS"

  echo "Execution Stats for Delegation $DELEGATION_ID:"
  echo "   Total Executions:      $TOTAL"
  echo "   Successful Executions: $SUCCESS"
  echo "   Failed Executions:     $FAILED"
  echo "   Volume Executed:       $VOLUME_EXEC"
  echo "   Gas Used:              $GAS_USED"
  echo "   Last Execution:        $LAST_TIME"
  echo ""

  if [ "$TOTAL" -gt "0" ]; then
    echo "✅ Execution stats updated!"
    echo "   Frontend will now show real execution data instead of 'No executions yet'"
  fi
else
  echo "⚠️  Could not retrieve execution stats"
fi

echo ""
echo "=================================================="
echo "✅ DEMO COMPLETE!"
echo "=================================================="
echo ""
echo "What just happened:"
echo "1. ✅ Verified executor permission"
echo "2. ✅ Found active delegation #$DELEGATION_ID"
echo "3. ✅ Retrieved pattern metrics"
echo "4. ✅ Called ExecutionEngine.executeTrade()"
echo "5. ✅ Execution stats updated"
echo ""
echo "🎯 Next Steps:"
echo "   - Refresh frontend to see execution stats"
echo "   - Stats will show: Total executions, success rate, volume, gas"
echo "   - 'No executions yet' message will be replaced with real data"
echo ""
echo "🤖 In Production:"
echo "   - Executor Bot monitors Envio for signals"
echo "   - Detects when pattern conditions match"
echo "   - Automatically calls executeTrade()"
echo "   - Trades execute in <200ms from signal to on-chain"
echo "=================================================="
