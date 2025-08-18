#!/bin/bash

# Minimal build script for smallest possible Electron app

echo "🎯 Creating Minimal Production Build"
echo "===================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to get directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

echo -e "${BLUE}📊 Starting size analysis...${NC}"
echo "Current node_modules: $(get_size node_modules)"
echo "Current dist: $(get_size dist)"
echo ""

# Step 1: Clean everything
echo -e "${YELLOW}🧹 Step 1: Cleaning previous builds...${NC}"
rm -rf dist
rm -rf temp
rm -rf backup
rm -rf test-update.zip
rm -rf node_modules/.cache
echo -e "${GREEN}✅ Cleaned${NC}"

# Step 2: Create minimal package.json for production
echo -e "${YELLOW}📦 Step 2: Creating minimal package.json...${NC}"
cp package.json package.json.full

# Create production-only package.json
node -e "
const pkg = require('./package.json');
const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main,
    author: pkg.author,
    license: pkg.license,
    dependencies: {
        'chokidar': pkg.dependencies.chokidar,
        'express': pkg.dependencies.express,
        'socket.io': pkg.dependencies['socket.io'],
        'body-parser': pkg.dependencies['body-parser'],
        'cors': pkg.dependencies.cors,
        'axios': pkg.dependencies.axios,
        'semver': pkg.dependencies.semver,
        'extract-zip': pkg.dependencies['extract-zip']
    },
    build: pkg.build
};
require('fs').writeFileSync('package.json', JSON.stringify(prodPkg, null, 2));
"
echo -e "${GREEN}✅ Minimal package.json created${NC}"

# Step 3: Install only production dependencies
echo -e "${YELLOW}📥 Step 3: Installing production dependencies only...${NC}"
rm -rf node_modules
npm install --production --no-optional
echo -e "${GREEN}✅ Production dependencies installed${NC}"

# Step 4: Aggressive node_modules cleanup
echo -e "${YELLOW}🗑️  Step 4: Aggressive cleanup...${NC}"

# Remove all documentation and unnecessary files
find node_modules -name "*.md" -type f -delete 2>/dev/null
find node_modules -name "*.txt" -type f -delete 2>/dev/null
find node_modules -name "LICENSE*" -type f -delete 2>/dev/null
find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null
find node_modules -name "HISTORY*" -type f -delete 2>/dev/null
find node_modules -name "*.map" -type f -delete 2>/dev/null
find node_modules -name "*.ts" -type f -delete 2>/dev/null
find node_modules -name "*.flow" -type f -delete 2>/dev/null
find node_modules -name "*.coffee" -type f -delete 2>/dev/null
find node_modules -name "*.scss" -type f -delete 2>/dev/null
find node_modules -name "*.sass" -type f -delete 2>/dev/null
find node_modules -name "*.less" -type f -delete 2>/dev/null

# Remove test and example directories
find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "__tests__" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "spec" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "example" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "demo" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "doc" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name "coverage" -type d -exec rm -rf {} + 2>/dev/null
find node_modules -name ".nyc_output" -type d -exec rm -rf {} + 2>/dev/null

# Remove development config files
find node_modules -name "gulpfile.js" -type f -delete 2>/dev/null
find node_modules -name "Gruntfile.js" -type f -delete 2>/dev/null
find node_modules -name "webpack.config.js" -type f -delete 2>/dev/null
find node_modules -name ".eslintrc*" -type f -delete 2>/dev/null
find node_modules -name ".jshintrc*" -type f -delete 2>/dev/null
find node_modules -name ".babelrc*" -type f -delete 2>/dev/null
find node_modules -name "tsconfig.json" -type f -delete 2>/dev/null

# Remove source files where possible (keep only dist/lib folders)
for module in node_modules/*/; do
    if [ -d "$module/dist" ] && [ -d "$module/src" ]; then
        rm -rf "$module/src" 2>/dev/null
    fi
    if [ -d "$module/lib" ] && [ -d "$module/src" ]; then
        rm -rf "$module/src" 2>/dev/null
    fi
done

echo -e "${GREEN}✅ Aggressive cleanup completed${NC}"

echo ""
echo -e "${BLUE}📊 After cleanup:${NC}"
echo "node_modules: $(get_size node_modules)"

# Step 5: Install electron-builder temporarily for build
echo -e "${YELLOW}⚡ Step 5: Installing electron-builder for build...${NC}"
npm install electron-builder --no-save
echo -e "${GREEN}✅ electron-builder installed${NC}"

# Step 6: Build with maximum compression
echo -e "${YELLOW}🏗️  Step 6: Building with maximum compression...${NC}"
npx electron-builder --mac --config.compression=maximum --config.nsis.compression=maximum
echo -e "${GREEN}✅ Build completed${NC}"

# Step 7: Remove electron-builder after build
echo -e "${YELLOW}🗑️  Step 7: Cleaning up build tools...${NC}"
rm -rf node_modules/electron-builder
rm -rf node_modules/app-builder-*
rm -rf node_modules/7zip-bin
rm -rf node_modules/dmg-builder
echo -e "${GREEN}✅ Build tools removed${NC}"

# Step 8: Restore original package.json
echo -e "${YELLOW}🔄 Step 8: Restoring original package.json...${NC}"
mv package.json.full package.json
echo -e "${GREEN}✅ Original package.json restored${NC}"

echo ""
echo -e "${BLUE}📊 Final Results:${NC}"
echo "node_modules: $(get_size node_modules)"
echo "dist: $(get_size dist)"

if [ -d "dist/mac" ]; then
    echo "macOS build: $(get_size dist/mac)"
    
    if [ -f "dist/mac/WP Debugger.app/Contents/Resources/app.asar" ]; then
        asar_size=$(du -sh "dist/mac/WP Debugger.app/Contents/Resources/app.asar" 2>/dev/null | cut -f1)
        echo "app.asar: $asar_size"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Minimal build complete!${NC}"
echo ""
echo -e "${YELLOW}💡 What was optimized:${NC}"
echo "  • Removed all dev dependencies"
echo "  • Cleaned documentation and test files"
echo "  • Removed source maps and TypeScript files"
echo "  • Used maximum compression"
echo "  • Removed build tools after building"
echo ""
echo -e "${BLUE}📁 Your optimized app is in: dist/mac/${NC}"
