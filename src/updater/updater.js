const fs = require('fs');
const path = require('path');

class AutoUpdater {
  constructor(config) {
    this.config = {
      apiUrl: config.apiUrl,
      currentVersion: config.currentVersion,
      checkInterval: config.checkInterval || 24 * 60 * 60 * 1000, // 24 hours
      downloadTimeout: config.downloadTimeout || 30000, // 30 seconds
      tempDir: config.tempDir || path.join(process.cwd(), 'temp'),
      backupDir: config.backupDir || path.join(process.cwd(), 'backup'),
      allowInsecureSSL: config.allowInsecureSSL !== false, // Default to true for development
      debug: config.debug || false,
      ...config
    };

    this.updateCheckInProgress = false;
    this.downloadInProgress = false;
    this.dependencies = null;

    this.loadDependencies();
    this.log('AutoUpdater initialized', this.config);
  }

  log(message, data = null) {
    if (this.config.debug) {
      console.log(`[AutoUpdater] ${message}`, data || '');
    }
  }

  loadDependencies() {
    try {
      this.dependencies = {
        axios: require('axios'),
        semver: require('semver'),
        extractZip: require('extract-zip')
      };
      console.log('Updater dependencies loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load updater dependencies:', error.message);
      return false;
    }
  }

  isAvailable() {
    return this.dependencies !== null;
  }

  async checkForUpdates() {
    if (!this.isAvailable()) {
      this.log('Updater dependencies not available');
      return { success: false, error: 'Updater dependencies not available' };
    }

    if (this.updateCheckInProgress) {
      this.log('Update check already in progress');
      return { success: false, error: 'Update check already in progress' };
    }

    this.updateCheckInProgress = true;

    try {
      this.log('Starting update check...');
      this.log('Current version:', this.config.currentVersion);
      this.log('API URL:', this.config.apiUrl);

      const axiosConfig = {
        timeout: 10000,
        headers: {
          'User-Agent': `Debug Log Watcher/${this.config.currentVersion}`
        },
        // Additional options for better compatibility
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      };

      // Handle SSL certificate issues for development domains
      if (this.config.allowInsecureSSL) {
        axiosConfig.httpsAgent = new (require('https').Agent)({
          rejectUnauthorized: false
        });
      }

      const response = await this.dependencies.axios.get(this.config.apiUrl, axiosConfig);

      const updateData = response.data;
      console.log('Update check response:', updateData);

      if (!updateData.new_version) {
        throw new Error('Invalid response: missing new_version');
      }

      const isNewerVersion = this.dependencies.semver.gt(
        updateData.new_version, 
        this.config.currentVersion
      );
      
      const result = {
        success: true,
        hasUpdate: isNewerVersion,
        currentVersion: this.config.currentVersion,
        latestVersion: updateData.new_version,
        updateData: updateData
      };

      console.log('Update check result:', result);
      return result;

    } catch (error) {
      console.error('Error checking for updates:', error.message);
      return {
        success: false,
        error: error.message,
        hasUpdate: false
      };
    } finally {
      this.updateCheckInProgress = false;
    }
  }

  async downloadUpdate(updateData) {
    if (!this.isAvailable()) {
      return { success: false, error: 'Updater dependencies not available' };
    }

    if (this.downloadInProgress) {
      return { success: false, error: 'Download already in progress' };
    }

    this.downloadInProgress = true;

    try {
      const downloadUrl = updateData.download_link;
      if (!downloadUrl) {
        throw new Error('No download link provided');
      }

      console.log('Starting download from:', downloadUrl);

      // Create temp directory
      if (!fs.existsSync(this.config.tempDir)) {
        fs.mkdirSync(this.config.tempDir, { recursive: true });
      }

      const zipPath = path.join(this.config.tempDir, 'update.zip');
      
      // Download the update
      const downloadConfig = {
        method: 'GET',
        url: downloadUrl,
        responseType: 'stream',
        timeout: this.config.downloadTimeout,
        headers: {
          'User-Agent': `Debug Log Watcher/${this.config.currentVersion}`
        }
      };

      // Handle SSL certificate issues for development domains
      if (this.config.allowInsecureSSL) {
        downloadConfig.httpsAgent = new (require('https').Agent)({
          rejectUnauthorized: false
        });
      }

      const response = await this.dependencies.axios(downloadConfig);

      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Validate download
      const stats = fs.statSync(zipPath);
      console.log(`Download completed. File size: ${stats.size} bytes`);

      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      if (stats.size < 1000) { // Less than 1KB is probably an error page
        const content = fs.readFileSync(zipPath, 'utf8');
        console.error('Downloaded content:', content);
        throw new Error('Downloaded file appears to be an error response, not a ZIP file');
      }

      console.log('Download validation passed, extracting...');

      // Extract the update
      const extractPath = path.join(this.config.tempDir, 'extracted');
      if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
      }

      await this.dependencies.extractZip(zipPath, { dir: extractPath });
      console.log('Extraction completed');

      // Debug: List extracted files
      console.log('Extracted files and directories:');
      const extractedItems = fs.readdirSync(extractPath);
      extractedItems.forEach(item => {
        const itemPath = path.join(extractPath, item);
        const stats = fs.statSync(itemPath);
        console.log(`  ${stats.isDirectory() ? 'DIR' : 'FILE'}: ${item}`);

        // If it's a directory, list its contents too
        if (stats.isDirectory()) {
          try {
            const subItems = fs.readdirSync(itemPath);
            subItems.forEach(subItem => {
              console.log(`    - ${subItem}`);
            });
          } catch (e) {
            console.log(`    (cannot read directory: ${e.message})`);
          }
        }
      });

      // Check for package.json in different locations
      let packageJsonPath = path.join(extractPath, 'package.json');
      let actualExtractPath = extractPath;

      if (!fs.existsSync(packageJsonPath)) {
        console.log('package.json not found in root, checking subdirectories...');

        // Check if there's a single subdirectory containing the app
        const items = fs.readdirSync(extractPath);
        const directories = items.filter(item => {
          const itemPath = path.join(extractPath, item);
          return fs.statSync(itemPath).isDirectory();
        });

        if (directories.length === 1) {
          const subDirPath = path.join(extractPath, directories[0]);
          const subPackageJsonPath = path.join(subDirPath, 'package.json');

          if (fs.existsSync(subPackageJsonPath)) {
            console.log(`Found package.json in subdirectory: ${directories[0]}`);
            packageJsonPath = subPackageJsonPath;
            actualExtractPath = subDirPath;
          }
        }
      }

      // Verify the update
      // if (!fs.existsSync(packageJsonPath)) {
      //   console.error('package.json not found in any expected location');
      //   console.error('Available files:', extractedItems);
      //   throw new Error('Invalid update package: missing package.json');
      // }

      const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log('Found package.json with version:', newPackageJson.version);

      if (newPackageJson.version !== updateData.new_version) {
        console.warn(`Version mismatch: expected ${updateData.new_version}, got ${newPackageJson.version}`);
        // Don't fail on version mismatch, just warn
      }

      return {
        success: true,
        message: 'Update downloaded successfully. Ready for manual installation.',
        extractPath: actualExtractPath, // Use the actual path where package.json was found
        version: newPackageJson.version,
        downloadPath: zipPath, // Include original ZIP path for reference
        readyForInstall: true
      };

    } catch (error) {
      console.error('Error downloading update:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.downloadInProgress = false;
    }
  }

  async applyUpdate(extractPath) {
    try {
      console.log('Applying update from:', extractPath);

      // Create backup directory
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true });
      }

      // Create backup of current version
      const backupPath = path.join(this.config.backupDir, `backup-${Date.now()}`);
      console.log('Creating backup at:', backupPath);

      // Copy current app to backup (excluding node_modules and temp directories)
      const filesToBackup = fs.readdirSync(process.cwd()).filter(item => 
        !['node_modules', 'temp', 'backup', '.git', 'src'].includes(item)
      );

      fs.mkdirSync(backupPath, { recursive: true });
      for (const file of filesToBackup) {
        const srcPath = path.join(process.cwd(), file);
        const destPath = path.join(backupPath, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // Apply the update
      console.log('Copying new files...');
      const newFiles = fs.readdirSync(extractPath);
      
      for (const file of newFiles) {
        const srcPath = path.join(extractPath, file);
        const destPath = path.join(process.cwd(), file);
        
        if (fs.statSync(srcPath).isDirectory()) {
          if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }
          fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }

      // Clean up temp files
      fs.rmSync(this.config.tempDir, { recursive: true, force: true });

      console.log('Update applied successfully');
      return { success: true, message: 'Update applied successfully. Please restart the application.' };

    } catch (error) {
      console.error('Error applying update:', error.message);
      return { success: false, error: error.message };
    }
  }

  getStatus() {
    return {
      available: this.isAvailable(),
      currentVersion: this.config.currentVersion,
      updateCheckInProgress: this.updateCheckInProgress,
      downloadInProgress: this.downloadInProgress
    };
  }
}

module.exports = AutoUpdater;
