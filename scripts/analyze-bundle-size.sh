#!/bin/bash

# Bundle size analyzer for Electron app

echo "📊 Bundle Size Analysis"
echo "======================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to convert bytes to human readable
human_readable() {
    local bytes=$1
    if [ $bytes -gt 1073741824 ]; then
        echo "$(echo "scale=1; $bytes/1073741824" | bc)GB"
    elif [ $bytes -gt 1048576 ]; then
        echo "$(echo "scale=1; $bytes/1048576" | bc)MB"
    elif [ $bytes -gt 1024 ]; then
        echo "$(echo "scale=1; $bytes/1024" | bc)KB"
    else
        echo "${bytes}B"
    fi
}

# Function to get directory size in bytes
get_size_bytes() {
    if [ -d "$1" ]; then
        du -sb "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

echo -e "${BLUE}🔍 Analyzing current project...${NC}"
echo ""

# Analyze main files
echo -e "${YELLOW}📁 Main Application Files:${NC}"
for file in main.js renderer.js index.html styles.css package.json; do
    if [ -f "$file" ]; then
        size=$(wc -c < "$file" 2>/dev/null)
        echo "  $file: $(human_readable $size)"
    fi
done

echo ""
echo -e "${YELLOW}📁 Source Directory:${NC}"
if [ -d "src" ]; then
    echo "  src/: $(du -sh src 2>/dev/null | cut -f1)"
    find src -name "*.js" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print "  JavaScript files: " $1 " bytes"}'
else
    echo "  src/: Not found"
fi

echo ""
echo -e "${YELLOW}📦 Dependencies Analysis:${NC}"
if [ -d "node_modules" ]; then
    total_size=$(get_size_bytes "node_modules")
    echo "  Total node_modules: $(human_readable $total_size)"
    echo ""
    
    echo -e "${BLUE}🔝 Top 10 Largest Dependencies:${NC}"
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10 | while read size dir; do
        echo "  $(basename "$dir"): $size"
    done
    
    echo ""
    echo -e "${BLUE}📋 Dependency Categories:${NC}"
    
    # Electron
    electron_size=$(get_size_bytes "node_modules/electron")
    if [ $electron_size -gt 0 ]; then
        echo "  Electron: $(human_readable $electron_size)"
    fi
    
    # Native modules
    native_total=0
    for module in chokidar fsevents; do
        if [ -d "node_modules/$module" ]; then
            size=$(get_size_bytes "node_modules/$module")
            native_total=$((native_total + size))
        fi
    done
    if [ $native_total -gt 0 ]; then
        echo "  Native modules: $(human_readable $native_total)"
    fi
    
    # HTTP/Network
    network_total=0
    for module in axios express socket.io cors body-parser; do
        if [ -d "node_modules/$module" ]; then
            size=$(get_size_bytes "node_modules/$module")
            network_total=$((network_total + size))
        fi
    done
    if [ $network_total -gt 0 ]; then
        echo "  Network modules: $(human_readable $network_total)"
    fi
    
    # Utilities
    util_total=0
    for module in semver extract-zip archiver; do
        if [ -d "node_modules/$module" ]; then
            size=$(get_size_bytes "node_modules/$module")
            util_total=$((util_total + size))
        fi
    done
    if [ $util_total -gt 0 ]; then
        echo "  Utility modules: $(human_readable $util_total)"
    fi
    
else
    echo "  node_modules: Not found"
fi

echo ""
echo -e "${YELLOW}🏗️  Build Analysis:${NC}"
if [ -d "dist" ]; then
    echo "  dist/: $(du -sh dist 2>/dev/null | cut -f1)"
    
    if [ -d "dist/mac" ]; then
        echo "  macOS build: $(du -sh dist/mac 2>/dev/null | cut -f1)"
        
        if [ -f "dist/mac/WP Debugger.app/Contents/Resources/app.asar" ]; then
            asar_size=$(get_size_bytes "dist/mac/WP Debugger.app/Contents/Resources/app.asar")
            echo "  app.asar: $(human_readable $asar_size)"
        fi
    fi
else
    echo "  dist/: Not found (run npm run build:mac first)"
fi

echo ""
echo -e "${YELLOW}💾 Temporary Files:${NC}"
temp_total=0
for dir in temp backup test-update.zip; do
    if [ -e "$dir" ]; then
        size=$(get_size_bytes "$dir")
        temp_total=$((temp_total + size))
        echo "  $dir: $(human_readable $size)"
    fi
done
if [ $temp_total -eq 0 ]; then
    echo "  No temporary files found"
fi

echo ""
echo -e "${GREEN}💡 Optimization Recommendations:${NC}"

# Check for large dependencies
if [ -d "node_modules/electron" ]; then
    electron_size=$(get_size_bytes "node_modules/electron")
    if [ $electron_size -gt 209715200 ]; then # > 200MB
        echo -e "${RED}  ⚠️  Electron is very large ($(human_readable $electron_size))${NC}"
        echo "     Consider using a smaller Electron version"
    fi
fi

# Check for unnecessary files
if find . -name "*.map" -type f | head -1 | grep -q .; then
    echo -e "${YELLOW}  📍 Found source maps - consider removing for production${NC}"
fi

if find node_modules -name "test" -type d | head -1 | grep -q .; then
    echo -e "${YELLOW}  🧪 Found test directories in node_modules${NC}"
    echo "     Run: ./scripts/optimize-build.sh"
fi

# Check for dev dependencies in production
if grep -q '"devDependencies"' package.json; then
    echo -e "${YELLOW}  🔧 Consider using 'npm prune --production' before building${NC}"
fi

echo ""
echo -e "${BLUE}🚀 Quick Optimization Commands:${NC}"
echo "  1. Clean build: rm -rf dist node_modules && npm install --production"
echo "  2. Optimize: ./scripts/optimize-build.sh"
echo "  3. Build: npm run build:mac"
echo "  4. Analyze: ./scripts/analyze-bundle-size.sh"
