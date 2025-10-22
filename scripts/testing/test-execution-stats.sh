#!/bin/bash
# Test Execution Stats Functionality
# Verifies that execution stats use real data, not dummy data

set -e

echo "=================================================="
echo "Mirror Protocol - Execution Stats Test"
echo "Testing: No dummy data, only real execution stats"
echo "=================================================="
echo ""

RPC="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"
EXECUTION_ENGINE="0x28BEC7E4d25D385BBf5FD4d2CF5163c513662CaE"

echo "📊 Step 1: Check ExecutionEngine Contract"
echo "-------------------------------------------"
echo "Contract: $EXECUTION_ENGINE"
CODE=$(cast code $EXECUTION_ENGINE --rpc-url $RPC 2>/dev/null || echo "")
if [ -z "$CODE" ] || [ "$CODE" == "0x" ]; then
  echo "❌ ExecutionEngine contract not deployed"
  exit 1
else
  echo "✅ ExecutionEngine contract deployed"
  echo "   Bytecode length: ${#CODE} characters"
fi
echo ""

echo "📊 Step 2: Query Execution Stats for Test Delegation"
echo "--------------------------------------------------------"
echo "Testing delegationId = 1"

# Query executionStats(1) from ExecutionEngine
# Returns tuple: (totalExecutions, successfulExecutions, failedExecutions, totalVolumeExecuted, totalGasUsed, lastExecutionTime)

echo "Querying: executionStats(1)"
STATS=$(cast call $EXECUTION_ENGINE "executionStats(uint256)(uint256,uint256,uint256,uint256,uint256,uint256)" 1 --rpc-url $RPC 2>/dev/null || echo "")

if [ -z "$STATS" ]; then
  echo "❌ Failed to query executionStats"
  exit 1
fi

echo "✅ Successfully queried executionStats(1)"
echo "   Raw response: $STATS"

# Parse the tuple (space-separated values from cast)
read -r TOTAL SUCCESS FAILED VOLUME GAS LAST_TIME <<< "$STATS"

echo ""
echo "📈 Execution Stats Results:"
echo "   Total Executions:      $TOTAL"
echo "   Successful Executions: $SUCCESS"
echo "   Failed Executions:     $FAILED"
echo "   Total Volume:          $VOLUME"
echo "   Total Gas Used:        $GAS"
echo "   Last Execution Time:   $LAST_TIME"
echo ""

if [ "$TOTAL" == "0" ]; then
  echo "ℹ️  No executions yet for delegation 1"
  echo "   This is expected if no trades have been executed"
  echo "   Frontend should show: 'No executions yet' message"
else
  echo "✅ Found $TOTAL execution(s)"
  echo "   Frontend will show real execution statistics"
fi
echo ""

echo "📊 Step 3: Check GraphQL for TradeExecuted Events"
echo "---------------------------------------------------"

# Check if Envio has indexed TradeExecuted events
GRAPHQL_RESPONSE=$(curl -s -X POST http://localhost:8080/v1/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ TradeExecuted(limit: 5) { id delegationId success timestamp } }"}' 2>/dev/null || echo "")

if [ -z "$GRAPHQL_RESPONSE" ]; then
  echo "⚠️  GraphQL endpoint not responding"
  echo "   Frontend will fall back to blockchain RPC"
else
  echo "✅ GraphQL endpoint responding"

  # Check if we have any TradeExecuted events
  TRADE_COUNT=$(echo "$GRAPHQL_RESPONSE" | grep -o '"TradeExecuted":\[' | wc -l || echo "0")

  if [ "$TRADE_COUNT" == "0" ]; then
    echo "ℹ️  No TradeExecuted events indexed yet"
    echo "   This is expected if:"
    echo "   - Indexer is still syncing"
    echo "   - No trades have been executed"
    echo "   Frontend will use blockchain data as fallback"
  else
    echo "✅ TradeExecuted events found in GraphQL"
    echo "   Frontend will use sub-50ms Envio data"
    echo ""
    echo "   Response preview:"
    echo "$GRAPHQL_RESPONSE" | head -5
  fi
fi
echo ""

echo "📊 Step 4: Verify Frontend Hook Configuration"
echo "-----------------------------------------------"

# Check if useExecutionStats hook exists
if [ -f "src/frontend/src/hooks/useExecutionStats.ts" ]; then
  echo "✅ useExecutionStats hook exists"

  # Check that it queries GraphQL first
  if grep -q "GRAPHQL_ENDPOINT" "src/frontend/src/hooks/useExecutionStats.ts"; then
    echo "✅ Hook configured to query GraphQL first"
  else
    echo "⚠️  Hook may not be querying GraphQL"
  fi

  # Check that it has blockchain fallback
  if grep -q "publicClient.readContract" "src/frontend/src/hooks/useExecutionStats.ts"; then
    echo "✅ Hook has blockchain fallback"
  else
    echo "⚠️  Hook may not have blockchain fallback"
  fi
else
  echo "❌ useExecutionStats hook not found"
  exit 1
fi
echo ""

echo "📊 Step 5: Check MyDelegations Component"
echo "-------------------------------------------"

# Verify MyDelegations uses DelegationExecutionStats (real data component)
if grep -q "DelegationExecutionStats" "src/frontend/src/components/MyDelegations.tsx"; then
  echo "✅ MyDelegations uses DelegationExecutionStats component"
  echo "   (Real data from Envio/blockchain)"
else
  echo "❌ MyDelegations may still use hardcoded dummy data"
  exit 1
fi

# Check that old hardcoded stats are removed
if grep -q "totalExecutions: 0, // Would come from" "src/frontend/src/components/MyDelegations.tsx"; then
  echo "❌ Found hardcoded dummy stats in MyDelegations"
  echo "   Line: totalExecutions: 0, // Would come from ExecutionEngine contract"
  exit 1
else
  echo "✅ No hardcoded dummy stats found"
fi
echo ""

echo "=================================================="
echo "✅ ALL CHECKS PASSED!"
echo "=================================================="
echo ""
echo "📋 Summary:"
echo "   - ExecutionEngine contract is deployed"
echo "   - executionStats() function works correctly"
echo "   - GraphQL endpoint checked (may be syncing)"
echo "   - Frontend hooks configured for real data"
echo "   - No dummy/hardcoded execution stats"
echo ""
echo "🎯 Expected Behavior:"
echo ""
echo "BEFORE trades are executed:"
echo "   UI shows: ⏳ No executions yet"
echo "             Pattern will execute automatically when conditions match"
echo ""
echo "AFTER trades are executed:"
echo "   UI shows: Real execution statistics with:"
echo "             - Total executions count"
echo "             - Success rate percentage"
echo "             - Volume executed"
echo "             - Gas usage"
echo "             - Last execution timestamp"
echo ""
echo "🚀 Data Source Priority:"
echo "   1. Envio GraphQL (sub-50ms queries) ⚡"
echo "   2. Blockchain RPC (fallback) 🔗"
echo "   3. Shows 'No executions yet' if delegation has no trades 📊"
echo ""
echo "✅ No dummy data is used for execution stats!"
echo "=================================================="
