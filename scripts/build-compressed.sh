#!/bin/bash

# Simple compressed build script that works

echo "🗜️  Building Compressed Electron App"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to get directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

echo -e "${BLUE}📊 Current sizes:${NC}"
echo "node_modules: $(get_size node_modules)"
echo "dist: $(get_size dist)"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf dist
rm -rf temp
rm -rf backup
rm -rf test-update.zip
echo -e "${GREEN}✅ Cleaned${NC}"

# Step 2: Optimize node_modules
echo -e "${YELLOW}🗑️  Optimizing node_modules...${NC}"

# Remove documentation files
find node_modules -name "*.md" -type f -delete 2>/dev/null
find node_modules -name "*.txt" -type f -delete 2>/dev/null
find node_modules -name "LICENSE*" -type f -delete 2>/dev/null
find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null
find node_modules -name "*.map" -type f -delete 2>/dev/null

# Remove test directories
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "example" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null

# Remove development files
find node_modules -name "*.ts" -type f -delete 2>/dev/null
find node_modules -name "*.coffee" -type f -delete 2>/dev/null
find node_modules -name ".eslintrc*" -type f -delete 2>/dev/null

echo -e "${GREEN}✅ node_modules optimized${NC}"

# Step 3: Build with maximum compression
echo -e "${YELLOW}🏗️  Building with compression...${NC}"
npm run rebuild
npx electron-builder --mac --config.compression=maximum
echo -e "${GREEN}✅ Build completed${NC}"

echo ""
echo -e "${BLUE}📊 Final sizes:${NC}"
echo "node_modules: $(get_size node_modules)"
echo "dist: $(get_size dist)"

if [ -d "dist/mac" ]; then
    echo "macOS app: $(get_size "dist/mac")"
    
    # Check app.asar size
    if [ -f "dist/mac/WP Debugger.app/Contents/Resources/app.asar" ]; then
        asar_size=$(du -sh "dist/mac/WP Debugger.app/Contents/Resources/app.asar" 2>/dev/null | cut -f1)
        echo "app.asar: $asar_size"
    fi
    
    # Check total app size
    if [ -d "dist/mac/WP Debugger.app" ]; then
        app_size=$(du -sh "dist/mac/WP Debugger.app" 2>/dev/null | cut -f1)
        echo "Total app: $app_size"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Compressed build complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Optimizations applied:${NC}"
echo "  • Removed documentation files"
echo "  • Removed test directories"
echo "  • Removed development files"
echo "  • Used maximum compression"
echo "  • Optimized file inclusion"
echo ""
echo -e "${BLUE}📁 Your compressed app is ready in: dist/mac/${NC}"
