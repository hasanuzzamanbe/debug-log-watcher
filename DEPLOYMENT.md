# 🚀 Deployment Guide

This guide covers all aspects of building and deploying the Debug Log Watcher application for macOS.

## 📋 Prerequisites

- **macOS**: 10.14 or later
- **Node.js**: 16 or later
- **npm**: Latest version
- **Git**: For version control

## 🛠️ Local Build Process

### Quick Build
```bash
# Install dependencies
npm install

# Build for distribution
npm run build
```

### Advanced Build Options
```bash
# Build for specific architecture
npm run build:mac-arm64    # Apple Silicon (M1/M2)
npm run build:mac-x64      # Intel Macs
npm run build:mac-universal # Universal binary (both)

# Development build (unpacked)
npm run pack
```

## 🎯 Automated Deployment

### Using the Deployment Script
```bash
# Run the automated deployment script
npm run deploy
```

This script will:
- ✅ Clean previous builds
- ✅ Install dependencies
- ✅ Build the application
- ✅ Create release notes
- ✅ Check for code signing certificates
- ✅ Open the dist folder

### Manual Deployment Steps
```bash
# 1. Clean and install
rm -rf dist/ node_modules/
npm install

# 2. Build application
npm run build

# 3. Verify build artifacts
ls -la dist/
```

## 📦 Build Artifacts

After a successful build, you'll find these files in the `dist/` directory:

- **`Debug Log Watcher-1.0.0-arm64.dmg`** - DMG installer for Apple Silicon
- **`Debug Log Watcher-1.0.0-arm64-mac.zip`** - ZIP archive for Apple Silicon
- **`Debug Log Watcher-1.0.0-x64.dmg`** - DMG installer for Intel Macs
- **`Debug Log Watcher-1.0.0-x64-mac.zip`** - ZIP archive for Intel Macs
- **`RELEASE_NOTES.md`** - Auto-generated release notes

## 🔐 Code Signing (Optional)

### For Distribution Outside App Store
```bash
# Check available certificates
security find-identity -v -p codesigning

# Sign the application
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name" \
  dist/mac-arm64/Debug\ Log\ Watcher.app

# Notarize the app (required for distribution)
xcrun notarytool submit dist/Debug\ Log\ Watcher-1.0.0-arm64.dmg \
  --apple-id "your-apple-id@example.com" \
  --password "app-specific-password" \
  --team-id "YOUR_TEAM_ID"
```

### For Mac App Store
```bash
# Sign with Mac App Store certificate
codesign --deep --force --verify --verbose \
  --sign "3rd Party Mac Developer Application: Your Name" \
  dist/mac-arm64/Debug\ Log\ Watcher.app
```

## 🌐 GitHub Releases

### Automated Releases
1. **Create a tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **GitHub Actions** will automatically:
   - Build the application
   - Create a release
   - Upload DMG and ZIP files
   - Generate release notes

### Manual Release
1. Go to GitHub repository
2. Click "Releases" → "Create a new release"
3. Upload the DMG and ZIP files from `dist/`
4. Add release notes

## 📱 Distribution Options

### 1. Direct Distribution
- Share DMG files directly with users
- Users drag to Applications folder
- May require "Open Anyway" for unsigned apps

### 2. GitHub Releases
- Upload to GitHub releases
- Users download from releases page
- Automatic updates via GitHub API

### 3. Homebrew Cask (Advanced)
```bash
# Create Homebrew formula
brew create --cask debug-log-watcher

# Formula example:
class DebugLogWatcher < Formula
  desc "Monitor WordPress debug.log files with notifications"
  homepage "https://github.com/yourusername/debug-log-watcher"
  url "https://github.com/yourusername/debug-log-watcher/releases/download/v1.0.0/Debug%20Log%20Watcher-1.0.0-arm64.dmg"
  sha256 "your-sha256-hash"
  
  app "Debug Log Watcher.app"
end
```

### 4. Mac App Store
- Requires Apple Developer account ($99/year)
- App review process (1-7 days)
- Automatic updates via App Store

## 🔧 Troubleshooting

### Common Build Issues

**Build fails with permission errors**:
```bash
# Fix permissions
sudo chown -R $(whoami) .
chmod +x scripts/deploy.sh
```

**DMG creation fails**:
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

**App won't run on other Macs**:
```bash
# Check if app is signed
codesign -dv --verbose=4 dist/mac-arm64/Debug\ Log\ Watcher.app

# Sign the app
codesign --deep --force --sign "Developer ID Application: Your Name" \
  dist/mac-arm64/Debug\ Log\ Watcher.app
```

### Performance Optimization

**Reduce app size**:
```json
// In package.json build config
"files": [
  "**/*",
  "!node_modules/**/*",
  "!**/*.map",
  "!**/*.ts"
]
```

**Optimize for specific architecture**:
```bash
# Build only for your target architecture
npm run build:mac-arm64  # For M1/M2 Macs
npm run build:mac-x64    # For Intel Macs
```

## 📊 Release Checklist

Before releasing:

- [ ] Update version in `package.json`
- [ ] Update changelog in `README.md`
- [ ] Test on target macOS versions
- [ ] Verify all features work correctly
- [ ] Check app permissions and entitlements
- [ ] Test installation process
- [ ] Create release notes
- [ ] Tag the release
- [ ] Upload to distribution platform

## 🎉 Success!

Your Debug Log Watcher app is now ready for distribution! Users can:

1. Download the DMG file
2. Drag to Applications folder
3. Launch from Applications or Spotlight
4. Start monitoring WordPress debug logs

For support and updates, direct users to your GitHub repository.
