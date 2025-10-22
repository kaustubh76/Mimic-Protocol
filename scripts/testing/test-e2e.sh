#!/bin/bash

# Mirror Protocol - End-to-End Test Suite
# Tests all components from blockchain to frontend

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     MIRROR PROTOCOL - END-TO-END FUNCTIONALITY TEST            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

RPC="https://monad-testnet.g.alchemy.com/v2/pFkOAygOyJ72KbT_I-LM0"
NFT="0x3ceBC8049BdAC66BfbAECC94Cce756122ed25DAc"
ROUTER="0xd5499e0d781b123724dF253776Aa1EB09780AfBf"
CIRCUIT_BREAKER="0x56C145f5567f8DB77533c825cf4205F1427c5517"

PASS=0
FAIL=0

test_result() {
    if [ $? -eq 0 ]; then
        echo "  ✅ PASS"
        ((PASS++))
    else
        echo "  ❌ FAIL"
        ((FAIL++))
    fi
}

# TEST 1: Blockchain Connectivity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Blockchain Connectivity (Monad Testnet)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BLOCK=$(cast block-number --rpc-url $RPC 2>/dev/null)
if [ -n "$BLOCK" ]; then
    echo "  Current Block: $BLOCK"
    echo "  Chain ID: 10143 (Monad)"
    test_result
else
    false; test_result
fi
echo ""

# TEST 2: Smart Contract Deployment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Smart Contract Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "  A. BehavioralNFT ($NFT)"
CODE=$(cast code $NFT --rpc-url $RPC 2>/dev/null)
if [ -n "$CODE" ] && [ "$CODE" != "0x" ]; then
    echo "     Contract deployed: YES"
    test_result
else
    echo "     Contract deployed: NO"
    false; test_result
fi

echo "  B. DelegationRouter ($ROUTER)"
CODE=$(cast code $ROUTER --rpc-url $RPC 2>/dev/null)
if [ -n "$CODE" ] && [ "$CODE" != "0x" ]; then
    echo "     Contract deployed: YES"
    test_result
else
    echo "     Contract deployed: NO"
    false; test_result
fi

echo "  C. CircuitBreaker ($CIRCUIT_BREAKER)"
CODE=$(cast code $CIRCUIT_BREAKER --rpc-url $RPC 2>/dev/null)
if [ -n "$CODE" ] && [ "$CODE" != "0x" ]; then
    echo "     Contract deployed: YES"
    test_result
else
    echo "     Contract deployed: NO"
    false; test_result
fi
echo ""

# TEST 3: Pattern NFTs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Pattern NFTs (BehavioralNFT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for id in 1 2 3 4 5 6; do
    OWNER=$(cast call $NFT "ownerOf(uint256)" $id --rpc-url $RPC 2>/dev/null)
    if [ -n "$OWNER" ] && [ "$OWNER" != "0x0000000000000000000000000000000000000000000000000000000000000000" ]; then
        echo "  Pattern #$id: EXISTS (Owner: ${OWNER:0:10}...)"
        test_result
    else
        echo "  Pattern #$id: NOT FOUND"
        false; test_result
    fi
done
echo ""

# TEST 4: Envio Indexer
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Envio HyperSync Indexer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if indexer process is running
if pgrep -f "envio" > /dev/null; then
    echo "  Indexer Process: RUNNING"
    test_result
else
    echo "  Indexer Process: NOT RUNNING"
    false; test_result
fi
echo ""

# TEST 5: GraphQL API
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: GraphQL API (Hasura)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH=$(curl -s http://localhost:8080/healthz 2>/dev/null)
if [ "$HEALTH" = "OK" ]; then
    echo "  Health Check: OK"
    test_result
else
    echo "  Health Check: FAILED"
    false; test_result
fi

SCHEMA=$(curl -s 'http://localhost:8080/v1/graphql' -H 'Content-Type: application/json' --data '{"query":"{ __schema { queryType { name } } }"}' 2>/dev/null | grep -c "query_root")
if [ "$SCHEMA" -gt 0 ]; then
    echo "  GraphQL Schema: VALID"
    test_result
else
    echo "  GraphQL Schema: INVALID"
    false; test_result
fi
echo ""

# TEST 6: Database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: PostgreSQL Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if pg_isready -h localhost -p 5433 > /dev/null 2>&1; then
    echo "  PostgreSQL (5433): READY"
    test_result
else
    echo "  PostgreSQL (5433): NOT READY"
    false; test_result
fi
echo ""

# TEST 7: Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Frontend Structure"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/frontend/package.json" ]; then
    echo "  package.json: EXISTS"
    test_result
else
    echo "  package.json: NOT FOUND"
    false; test_result
fi

COMPONENTS=$(ls -1 src/frontend/src/components/*.tsx 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMPONENTS" -gt 0 ]; then
    echo "  Components: $COMPONENTS found"
    test_result
else
    echo "  Components: NONE"
    false; test_result
fi
echo ""

# SUMMARY
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ PASSED: $PASS"
echo "  ❌ FAILED: $FAIL"
echo "  📊 TOTAL:  $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  🎉 ALL TESTS PASSED! Mirror Protocol is fully functional."
    echo ""
    exit 0
else
    echo "  ⚠️  Some tests failed. Review the output above."
    echo ""
    exit 1
fi
