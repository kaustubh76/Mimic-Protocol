#!/bin/bash

# Mirror Protocol - Envio Indexer Startup Script
# This script automates the Envio indexer setup and startup

set -e  # Exit on error

echo "🚀 Mirror Protocol - Envio Indexer Startup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
echo "📦 Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo "Please start Docker Desktop and try again."
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check pnpm
echo "📦 Checking pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm is installed${NC}"

# Navigate to envio directory
echo ""
echo "📁 Navigating to Envio directory..."
cd "$(dirname "$0")/../../src/envio"
echo -e "${GREEN}✓ In directory: $(pwd)${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run codegen
echo ""
echo "🔧 Running Envio codegen..."
pnpm envio codegen
echo -e "${GREEN}✓ Codegen complete${NC}"

# Start indexer
echo ""
echo "🚀 Starting Envio indexer..."
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Envio Indexer Starting!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "📊 Hasura Console: http://localhost:8080"
echo "🔐 Password: testing"
echo ""
echo "Press Ctrl+C to stop the indexer"
echo ""

pnpm dev
