#!/usr/bin/env bash
# Mirror Protocol — Sepolia Test Harness
#
# Runs the full Sepolia test suite in two layers:
#   1. Existing unit + integration tests (MockDEX, local EVM, no fork)
#   2. Forked Sepolia integration test (real adapter against real Uniswap V2)
#
# Usage:
#   ./test/run-sepolia-harness.sh
#
# Env vars:
#   SEPOLIA_RPC_URL   Sepolia RPC endpoint used for the forked layer.
#                     Defaults to the free publicnode RPC.

set -euo pipefail

SEPOLIA_RPC_URL="${SEPOLIA_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"

echo "=========================================="
echo "Mirror Protocol — Sepolia Test Harness"
echo "=========================================="
echo "Sepolia RPC: $SEPOLIA_RPC_URL"
echo

echo "▸ Layer 1: existing unit + integration tests (MockDEX)"
forge test --no-match-contract "SepoliaPivot|MultiLayerDelegation"
echo "  ✓ layer 1 passed"
echo

echo "▸ Layer 2: forked Sepolia tests (real adapter + real Uniswap V2 + multi-layer)"
SEPOLIA_RPC_URL="$SEPOLIA_RPC_URL" forge test \
    --match-contract "SepoliaPivot|MultiLayerDelegation" \
    --fork-url "$SEPOLIA_RPC_URL" \
    -vv
echo "  ✓ layer 2 passed"
echo

echo "=========================================="
echo "All Sepolia harness checks passed ✓"
echo "=========================================="
