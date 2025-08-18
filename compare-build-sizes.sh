#!/bin/bash

# Compare different build methods

echo "📊 Build Size Comparison"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Available build methods:${NC}"
echo ""
echo -e "${YELLOW}1. Standard Build:${NC}"
echo "   Command: npm run build:mac"
echo "   Description: Normal build with all dependencies"
echo "   Expected size: ~200-300MB"
echo ""

echo -e "${YELLOW}2. Optimized Build:${NC}"
echo "   Command: npm run build:optimized"
echo "   Description: Cleaned node_modules + standard build"
echo "   Expected size: ~150-200MB"
echo ""

echo -e "${YELLOW}3. Small Build:${NC}"
echo "   Command: npm run build:small"
echo "   Description: Production dependencies only"
echo "   Expected size: ~100-150MB"
echo ""

echo -e "${YELLOW}4. Minimal Build:${NC}"
echo "   Command: npm run build:minimal"
echo "   Description: Aggressive optimization + maximum compression"
echo "   Expected size: ~50-100MB"
echo ""

echo -e "${GREEN}💡 Recommendations:${NC}"
echo ""
echo -e "${BLUE}For Development:${NC}"
echo "  Use: npm run build:mac"
echo "  Pros: Fast, includes all tools"
echo "  Cons: Large size"
echo ""

echo -e "${BLUE}For Testing:${NC}"
echo "  Use: npm run build:optimized"
echo "  Pros: Reasonable size, still has dev tools"
echo "  Cons: Slower build"
echo ""

echo -e "${BLUE}For Distribution:${NC}"
echo "  Use: npm run build:minimal"
echo "  Pros: Smallest size, fastest download"
echo "  Cons: Longest build time"
echo ""

echo -e "${YELLOW}🚀 Quick Start:${NC}"
echo "  1. For immediate testing: npm run build:optimized"
echo "  2. For final release: npm run build:minimal"
echo "  3. To analyze current size: npm run analyze"
echo ""

# Check current state
if [ -d "dist" ]; then
    echo -e "${BLUE}📁 Current dist folder:${NC}"
    du -sh dist 2>/dev/null | cut -f1
    echo ""
fi

echo -e "${GREEN}✨ Choose the build method that fits your needs!${NC}"
