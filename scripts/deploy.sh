#!/bin/bash

# WP Debugger - Deployment Script
# This script automates the build and deployment process for macOS

set -e  # Exit on any error

echo "🚀 Starting WP Debugger deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script is designed for macOS only"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js 16 or later is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/

# Install dependencies
print_status "Installing dependencies..."
npm install

# Run tests (if you have them)
# print_status "Running tests..."
# npm test

# Build the application
print_status "Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

# List build artifacts
print_status "Build artifacts created:"
ls -la dist/

# Check for DMG and ZIP files
DMG_FILE=$(find dist/ -name "*.dmg" | head -1)
ZIP_FILE=$(find dist/ -name "*.zip" | head -1)

if [ -n "$DMG_FILE" ]; then
    print_success "DMG installer created: $DMG_FILE"
    print_status "File size: $(du -h "$DMG_FILE" | cut -f1)"
fi

if [ -n "$ZIP_FILE" ]; then
    print_success "ZIP archive created: $ZIP_FILE"
    print_status "File size: $(du -h "$ZIP_FILE" | cut -f1)"
fi

# Optional: Create release notes
print_status "Creating release notes..."
cat > dist/RELEASE_NOTES.md << EOF
# WP Debugger v$(node -p "require('./package.json').version")

## What's New
- Real-time WordPress debug.log monitoring
- macOS notifications
- System tray integration
- Modern UI with activity tracking

## Installation
1. Download the .dmg file
2. Drag to Applications folder
3. Launch from Applications or Spotlight

## System Requirements
- macOS 10.14 (Mojave) or later
- 50MB RAM
- 10MB disk space

## Build Date
$(date)

## Build Info
- Node.js: $(node --version)
- npm: $(npm --version)
- Electron: $(node -p "require('./package.json').devDependencies.electron")
- Electron Builder: $(node -p "require('./package.json').devDependencies['electron-builder']")
EOF

print_success "Release notes created: dist/RELEASE_NOTES.md"

# Optional: Sign the application (if you have a developer certificate)
if command -v codesign &> /dev/null; then
    print_status "Checking for code signing certificate..."
    if security find-identity -v -p codesigning | grep -q "Developer ID Application"; then
        print_warning "Developer ID certificate found. To sign the app, run:"
        echo "  codesign --deep --force --verify --verbose --sign \"Developer ID Application: Your Name\" dist/mac-arm64/Debug\\ Log\\ Watcher.app"
    else
        print_warning "No Developer ID certificate found. App will be unsigned."
        print_warning "Users may need to right-click and select 'Open' to run the app."
    fi
fi

print_success "🎉 Deployment completed successfully!"
print_status "Build artifacts are in the 'dist' directory"
print_status "Ready for distribution!"

# Optional: Open dist folder
read -p "Open dist folder? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open dist/
fi
