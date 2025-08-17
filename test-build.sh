#!/bin/bash

# Test build script to verify dependencies are properly included

echo "🔧 Testing Electron Build with Dump Server Dependencies..."
echo ""

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
echo "Installing dependencies..."
npm install

# Rebuild native modules for Electron
echo "Rebuilding native modules..."
npm run rebuild

# Test that all required modules can be loaded
echo "Testing module loading..."
node -e "
try {
  require('express');
  require('socket.io');
  require('body-parser');
  require('cors');
  require('chokidar');
  console.log('✅ All required modules loaded successfully');
} catch (error) {
  console.error('❌ Module loading failed:', error.message);
  process.exit(1);
}
"

# Build for current platform
echo "Building application..."
npm run pack

# Check if build was successful
if [ -d "dist" ]; then
  echo ""
  echo "✅ Build completed successfully!"
  echo "Build artifacts:"
  ls -la dist/
  
  # Check if the main executable exists
  if [ -f "dist/mac/Debug Log Watcher.app/Contents/MacOS/Debug Log Watcher" ]; then
    echo ""
    echo "✅ Main executable found"
    
    # Check if node_modules are included
    if [ -d "dist/mac/Debug Log Watcher.app/Contents/Resources/app.asar.unpacked/node_modules" ]; then
      echo "✅ Node modules unpacked correctly"
      
      # Check specific modules
      if [ -d "dist/mac/Debug Log Watcher.app/Contents/Resources/app.asar.unpacked/node_modules/express" ]; then
        echo "✅ Express module included"
      else
        echo "❌ Express module missing"
      fi
      
      if [ -d "dist/mac/Debug Log Watcher.app/Contents/Resources/app.asar.unpacked/node_modules/socket.io" ]; then
        echo "✅ Socket.IO module included"
      else
        echo "❌ Socket.IO module missing"
      fi
    else
      echo "❌ Node modules not unpacked"
    fi
  else
    echo "❌ Main executable not found"
  fi
else
  echo "❌ Build failed - no dist directory found"
  exit 1
fi

echo ""
echo "🎉 Build test completed!"
echo ""
echo "To create a full distribution build, run:"
echo "  npm run build:mac"
echo ""
echo "To test the built app:"
echo "  open 'dist/mac/Debug Log Watcher.app'"
