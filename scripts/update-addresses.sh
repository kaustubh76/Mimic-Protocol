#!/bin/bash
# Mirror Protocol — Post-Deployment Address Updater
#
# After running DeployAll.s.sol, this script reads the broadcast output
# and updates all three address files automatically:
#   1. .env
#   2. src/frontend/src/contracts/config.ts
#   3. src/envio/config.yaml
#
# Usage:
#   chmod +x scripts/update-addresses.sh
#   ./scripts/update-addresses.sh
#
# Or pass addresses directly:
#   ./scripts/update-addresses.sh \
#     --nft 0x... --router 0x... --engine 0x... --detector 0x...

set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BROADCAST_DIR="$ROOT/broadcast/DeployAll.s.sol/10143"
ENV_FILE="$ROOT/.env"
CONFIG_TS="$ROOT/src/frontend/src/contracts/config.ts"
ENVIO_YAML="$ROOT/src/envio/config.yaml"

NFT_ADDR=""
ROUTER_ADDR=""
ENGINE_ADDR=""
DETECTOR_ADDR=""

echo ""
echo "══════════════════════════════════════════════════════"
echo "   Mirror Protocol — Address Updater"
echo "══════════════════════════════════════════════════════"
echo ""

# Parse CLI args
while [[ $# -gt 0 ]]; do
  case $1 in
    --nft) NFT_ADDR="$2"; shift 2 ;;
    --router) ROUTER_ADDR="$2"; shift 2 ;;
    --engine) ENGINE_ADDR="$2"; shift 2 ;;
    --detector) DETECTOR_ADDR="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Auto-detect from broadcast JSON if not provided
if [ -z "$NFT_ADDR" ]; then
  LATEST_BROADCAST="$BROADCAST_DIR/run-latest.json"

  if [ ! -f "$LATEST_BROADCAST" ]; then
    echo "❌ No broadcast file found at: $LATEST_BROADCAST"
    echo ""
    echo "Options:"
    echo "  1. Run deployment first:"
    echo "     forge script script/DeployAll.s.sol:DeployAll --rpc-url monad --broadcast"
    echo ""
    echo "  2. Pass addresses manually:"
    echo "     ./scripts/update-addresses.sh --nft 0x... --router 0x... --engine 0x... --detector 0x..."
    exit 1
  fi

  echo "📂 Reading from broadcast: $LATEST_BROADCAST"
  echo ""

  # Extract addresses from broadcast JSON using python (available by default on macOS)
  ADDRESSES=$(python3 -c "
import json
with open('$LATEST_BROADCAST') as f:
    data = json.load(f)

contracts = {}
for tx in data.get('transactions', []):
    if tx.get('transactionType') == 'CREATE':
        name = tx.get('contractName', '')
        addr = tx.get('contractAddress', '')
        if name and addr:
            contracts[name] = addr

print(f\"{contracts.get('BehavioralNFT', '')} {contracts.get('DelegationRouter', '')} {contracts.get('ExecutionEngine', '')} {contracts.get('PatternDetector', '')}\")
" 2>/dev/null)

  read -r NFT_ADDR ROUTER_ADDR ENGINE_ADDR DETECTOR_ADDR <<< "$ADDRESSES"
fi

# Validate
if [ -z "$NFT_ADDR" ] || [ -z "$ROUTER_ADDR" ] || [ -z "$ENGINE_ADDR" ]; then
  echo "❌ Could not extract contract addresses."
  echo "   Please pass them manually with --nft --router --engine --detector flags."
  exit 1
fi

echo "New contract addresses:"
echo "  BehavioralNFT:    $NFT_ADDR"
echo "  DelegationRouter: $ROUTER_ADDR"
echo "  ExecutionEngine:  $ENGINE_ADDR"
echo "  PatternDetector:  ${DETECTOR_ADDR:-'(not found)'}"
echo ""

# ─── 1. Update .env ──────────────────────────────────────────────────────────
echo "📝 Updating .env..."

sed -i.bak \
  -e "s|BEHAVIORAL_NFT_ADDRESS=.*|BEHAVIORAL_NFT_ADDRESS=$NFT_ADDR|" \
  -e "s|DELEGATION_ROUTER_ADDRESS=.*|DELEGATION_ROUTER_ADDRESS=$ROUTER_ADDR|" \
  -e "s|EXECUTION_ENGINE_ADDRESS=.*|EXECUTION_ENGINE_ADDRESS=$ENGINE_ADDR|" \
  "$ENV_FILE"

if [ -n "$DETECTOR_ADDR" ]; then
  sed -i.bak \
    -e "s|PATTERN_DETECTOR_ADDRESS=.*|PATTERN_DETECTOR_ADDRESS=$DETECTOR_ADDR|" \
    "$ENV_FILE"
fi

rm -f "$ENV_FILE.bak"
echo "  ✅ .env updated"

# ─── 2. Update frontend config.ts ────────────────────────────────────────────
echo "📝 Updating src/frontend/src/contracts/config.ts..."

python3 -c "
import re

with open('$CONFIG_TS', 'r') as f:
    content = f.read()

content = re.sub(
    r\"BEHAVIORAL_NFT: '0x[0-9a-fA-F]+'( as \`0x\\\$\{string\}\`)\",
    f\"BEHAVIORAL_NFT: '$NFT_ADDR'\\\\1\",
    content
)
content = re.sub(
    r\"DELEGATION_ROUTER: '0x[0-9a-fA-F]+'( as \`0x\\\$\{string\}\`)\",
    f\"DELEGATION_ROUTER: '$ROUTER_ADDR'\\\\1\",
    content
)
content = re.sub(
    r\"EXECUTION_ENGINE: '0x[0-9a-fA-F]+'( as \`0x\\\$\{string\}\`)\",
    f\"EXECUTION_ENGINE: '$ENGINE_ADDR'\\\\1\",
    content
)
$([ -n "$DETECTOR_ADDR" ] && echo "
content = re.sub(
    r\"PATTERN_DETECTOR: '0x[0-9a-fA-F]+'( as \`0x\\\$\{string\}\`)\",
    f\"PATTERN_DETECTOR: '$DETECTOR_ADDR'\\\\1\",
    content
)
")

with open('$CONFIG_TS', 'w') as f:
    f.write(content)

print('  Done')
"
echo "  ✅ config.ts updated"

# ─── 3. Update Envio config.yaml ─────────────────────────────────────────────
echo "📝 Updating src/envio/config.yaml..."

python3 -c "
import re

with open('$ENVIO_YAML', 'r') as f:
    content = f.read()

# The YAML has contract addresses in a list under BehavioralNFT and DelegationRouter sections
# We do a two-pass: first NFT section, then DelegationRouter section

# Replace first address block (BehavioralNFT)
parts = content.split('- name: DelegationRouter')
if len(parts) == 2:
    nft_section = re.sub(
        r'(address:\s*\n\s*- \")[0-9a-fA-Fx]+\"',
        f'\\\\g<1>$NFT_ADDR\"',
        parts[0]
    )
    router_section = re.sub(
        r'(address:\s*\n\s*- \")[0-9a-fA-Fx]+\"',
        f'\\\\g<1>$ROUTER_ADDR\"',
        parts[1]
    )
    content = nft_section + '- name: DelegationRouter' + router_section
    with open('$ENVIO_YAML', 'w') as f:
        f.write(content)
    print('  Done (both contracts updated)')
else:
    print('  ⚠️  Could not parse config.yaml structure — update manually')
"
echo "  ✅ config.yaml updated"

# ─── Also update executor bot ────────────────────────────────────────────────
echo "📝 Updating executor-bot addresses..."
sed -i.bak \
  -e "s|EXECUTION_ENGINE: (ENV.EXECUTION_ENGINE_ADDRESS || '0x[0-9a-fA-F]+')|EXECUTION_ENGINE: (ENV.EXECUTION_ENGINE_ADDRESS \|\| '$ENGINE_ADDR')|" \
  -e "s|DELEGATION_ROUTER: (ENV.DELEGATION_ROUTER_ADDRESS || '0x[0-9a-fA-F]+')|DELEGATION_ROUTER: (ENV.DELEGATION_ROUTER_ADDRESS \|\| '$ROUTER_ADDR')|" \
  -e "s|BEHAVIORAL_NFT: (ENV.BEHAVIORAL_NFT_ADDRESS || '0x[0-9a-fA-F]+')|BEHAVIORAL_NFT: (ENV.BEHAVIORAL_NFT_ADDRESS \|\| '$NFT_ADDR')|" \
  "$ROOT/executor-bot/bot.mjs" 2>/dev/null || true
rm -f "$ROOT/executor-bot/bot.mjs.bak"
echo "  ✅ bot.mjs updated"

echo ""
echo "══════════════════════════════════════════════════════"
echo "   ✅ All addresses updated!"
echo "══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Re-run Envio codegen (addresses changed):"
echo "     cd src/envio && pnpm envio codegen"
echo ""
echo "  2. Start Envio indexer:"
echo "     cd src/envio && pnpm envio dev"
echo ""
echo "  3. Start frontend:"
echo "     cd src/frontend && pnpm dev"
echo ""
echo "  4. Run executor bot:"
echo "     node executor-bot/bot.mjs"
echo ""
