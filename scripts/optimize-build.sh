#!/bin/bash

# Build optimization script to reduce Electron app size

echo "🗜️  Optimizing Electron Build Size"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to get directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "N/A"
    fi
}

# Function to remove unnecessary files from node_modules
optimize_node_modules() {
    echo -e "${YELLOW}🧹 Cleaning node_modules...${NC}"
    
    # Remove common unnecessary files
    find node_modules -name "*.md" -type f -delete 2>/dev/null
    find node_modules -name "*.txt" -type f -delete 2>/dev/null
    find node_modules -name "LICENSE*" -type f -delete 2>/dev/null
    find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null
    find node_modules -name "HISTORY*" -type f -delete 2>/dev/null
    find node_modules -name "*.map" -type f -delete 2>/dev/null
    find node_modules -name "*.ts" -type f -delete 2>/dev/null
    find node_modules -name "*.flow" -type f -delete 2>/dev/null
    
    # Remove test directories
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
    
    # Remove development files
    find node_modules -name "*.coffee" -type f -delete 2>/dev/null
    find node_modules -name "*.scss" -type f -delete 2>/dev/null
    find node_modules -name "*.sass" -type f -delete 2>/dev/null
    find node_modules -name "*.less" -type f -delete 2>/dev/null
    find node_modules -name "gulpfile.js" -type f -delete 2>/dev/null
    find node_modules -name "Gruntfile.js" -type f -delete 2>/dev/null
    find node_modules -name "webpack.config.js" -type f -delete 2>/dev/null
    find node_modules -name ".eslintrc*" -type f -delete 2>/dev/null
    find node_modules -name ".jshintrc*" -type f -delete 2>/dev/null
    find node_modules -name ".babelrc*" -type f -delete 2>/dev/null
    
    echo -e "${GREEN}✅ node_modules cleaned${NC}"
}

# Function to optimize specific modules
optimize_specific_modules() {
    echo -e "${YELLOW}🎯 Optimizing specific modules...${NC}"
    
    # Remove unnecessary Electron files
    if [ -d "node_modules/electron" ]; then
        rm -rf node_modules/electron/dist/*.zip 2>/dev/null
        rm -rf node_modules/electron/dist/*.tar.gz 2>/dev/null
    fi
    
    # Clean axios
    if [ -d "node_modules/axios" ]; then
        rm -rf node_modules/axios/dist/axios.min.js.map 2>/dev/null
        rm -rf node_modules/axios/UPGRADE_GUIDE.md 2>/dev/null
    fi
    
    # Clean socket.io
    if [ -d "node_modules/socket.io" ]; then
        rm -rf node_modules/socket.io/client-dist/*.map 2>/dev/null
    fi
    
    echo -e "${GREEN}✅ Specific modules optimized${NC}"
}

# Function to create production package.json
create_production_package() {
    echo -e "${YELLOW}📦 Creating production package.json...${NC}"
    
    # Backup original
    cp package.json package.json.backup
    
    # Create minimal package.json for production
    node -e "
    const pkg = require('./package.json');
    const prodPkg = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        main: pkg.main,
        author: pkg.author,
        license: pkg.license,
        dependencies: pkg.dependencies
    };
    require('fs').writeFileSync('package.json.prod', JSON.stringify(prodPkg, null, 2));
    "
    
    echo -e "${GREEN}✅ Production package.json created${NC}"
}

# Main optimization process
echo -e "${BLUE}📊 Current sizes:${NC}"
echo "node_modules: $(get_size node_modules)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
fi

# Optimize
optimize_node_modules
optimize_specific_modules
create_production_package

echo ""
echo -e "${BLUE}📊 Optimized sizes:${NC}"
echo "node_modules: $(get_size node_modules)"
echo ""

# Additional optimization tips
echo -e "${BLUE}💡 Additional optimization tips:${NC}"
echo "1. Use 'npm prune --production' before building"
echo "2. Consider using 'electron-builder' with asar compression"
echo "3. Remove unused dependencies from package.json"
echo "4. Use 'npm ls' to check for duplicate dependencies"
echo ""

echo -e "${GREEN}✨ Build optimization complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run: npm run build:mac"
echo "2. Check the dist/ folder for optimized build"
echo "3. Compare file sizes before and after"
