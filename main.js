const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle chokidar import for both development and production
let chokidar;
try {
  chokidar = require('chokidar');
} catch (error) {
  try {
    // In production, try to load from app.asar.unpacked
    const chokidarPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'chokidar');
    chokidar = require(chokidarPath);
  } catch (secondError) {
    try {
      // Alternative path for different Electron versions
      const altPath = path.join(__dirname, '..', 'app.asar.unpacked', 'node_modules', 'chokidar');
      chokidar = require(altPath);
    } catch (thirdError) {
      console.error('Failed to load chokidar:', error.message);
      console.error('Second attempt failed:', secondError.message);
      console.error('Third attempt failed:', thirdError.message);
      // Fallback: try to use fs.watch instead
      chokidar = null;
    }
  }
}

// Import modules
const AutoUpdater = require('./src/updater/updater');
const DumpServer = require('./src/dump-server/dump-server');
const WindowManager = require('./src/utils/window-manager');

// Initialize modules
const windowManager = new WindowManager(app);
const dumpServer = new DumpServer({ port: 9913 });
const autoUpdater = new AutoUpdater({
  apiUrl: 'https://wpminers.com/?fluent-cart=get_license_version&item_id=2740&license_key=wpd_8356eb0c0f04cf1ab41dbe29282a9af9',
  // Use local test server for testing manual installation workflow
  // Production API:
  currentVersion: require('./package.json').version,
  allowInsecureSSL: true, // Allow insecure SSL for development domains
  debug: true // Enable debug logging
});

let mainWindow;
let tray;
let watchers = new Map();
let isQuitting = false;

// These variables are now handled by the modules

// Store watched files configuration
const configPath = path.join(app.getPath('userData'), 'config.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Set up window management
  windowManager.setMainWindow(mainWindow);
  dumpServer.setMainWindow(mainWindow);
  windowManager.setupWindowEvents(mainWindow, isQuitting);

  // Create tray
  createTray();
}

// Window management is now handled by WindowManager class

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  tray.setToolTip('WP Debugger');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        windowManager.showMainWindow();
      }
    },
    {
      label: 'Add Log File',
      click: () => {
        windowManager.showMainWindow();
        mainWindow.webContents.send('show-add-dialog');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Handle tray clicks to show window
  tray.on('click', () => {
    windowManager.showMainWindow();
  });

  tray.on('double-click', () => {
    windowManager.showMainWindow();
  });
}

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.watchedFiles || [];
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return [];
}

function saveConfig(watchedFiles) {
  try {
    const config = { watchedFiles };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function startWatching(filePath) {
  if (watchers.has(filePath)) {
    return false; // Already watching
  }

  try {
    if (!chokidar) {
      console.warn('Chokidar not available, using fs.watch as fallback');
      // Fallback to fs.watch
      const watcher = fs.watch(filePath, (eventType, filename) => {
        if (eventType === 'change') {
          // Send notification
          const fileName = path.basename(filePath);
          const notificationMessage = `New log entries detected in ${fileName}`;
          sendNotification(fileName, notificationMessage, filePath);
          
          // Send to renderer process
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('new-log-entry', {
              filePath: filePath,
              content: 'File changed',
              timestamp: new Date().toISOString()
            });
          }
        }
      });
      
      watcher.on('error', (error) => {
        console.error(`Error watching ${filePath}:`, error);
        mainWindow.webContents.send('watch-error', { filePath, error: error.message });
      });
      
      watchers.set(filePath, watcher);
      return true;
    }

    const watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      }
    });

    let lastSize = 0;
    
    // Get initial file size
    try {
      const stats = fs.statSync(filePath);
      lastSize = stats.size;
    } catch (error) {
      console.error('Error getting initial file size:', error);
    }

        watcher.on('change', (filePath) => {
      try {
        const stats = fs.statSync(filePath);
        if (stats.size > lastSize) {
          // Read new content
          const stream = fs.createReadStream(filePath, { start: lastSize });
          let newContent = '';
          
          stream.on('data', (chunk) => {
            newContent += chunk.toString();
          });
          
          stream.on('end', () => {
            if (newContent.trim()) {
              // Send notification using Electron's built-in notification system
              const fileName = path.basename(filePath);
              const notificationMessage = `New log entries detected in ${fileName}`;

              sendNotification(fileName, notificationMessage, filePath);

              // Send to renderer process
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('new-log-entry', {
                  filePath: filePath,
                  content: newContent,
                  timestamp: new Date().toISOString()
                });
              }
            }
            lastSize = stats.size;
          });
        } else if (stats.size < lastSize) {
          // File was truncated (cleared)
          lastSize = stats.size;
        }
      } catch (error) {
        console.error('Error reading file changes:', error);
      }
    });

    watcher.on('error', (error) => {
      console.error(`Error watching ${filePath}:`, error);
      mainWindow.webContents.send('watch-error', { filePath, error: error.message });
    });

    watchers.set(filePath, watcher);
    return true;
  } catch (error) {
    console.error('Error starting watcher:', error);
    return false;
  }
}

function stopWatching(filePath) {
  const watcher = watchers.get(filePath);
  if (watcher) {
    if (watcher.close) {
      watcher.close();
    } else if (watcher.removeAllListeners) {
      // For fs.watch fallback
      watcher.removeAllListeners();
    }
    watchers.delete(filePath);
    return true;
  }
  return false;
}

function sendNotification(fileName, message, filePath = null) {
  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'WordPress Debug Log',
        body: message,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        silent: false
      });

      notification.on('click', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();

          // If we have a file path, tell the renderer to select that file
          if (filePath) {
            mainWindow.webContents.send('select-log-file', filePath);
          }
        }
      });

      notification.show();
      console.log('Notification sent successfully for:', fileName);
    } else {
      console.log('Notifications not supported on this system');
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// IPC Handlers
ipcMain.handle('get-watched-files', () => {
  return loadConfig();
});

ipcMain.handle('add-watched-file', async (event, filePath) => {
  const watchedFiles = loadConfig();
  
  if (!watchedFiles.includes(filePath)) {
    watchedFiles.push(filePath);
    saveConfig(watchedFiles);
    
    if (startWatching(filePath)) {
      return { success: true, message: 'File added successfully' };
    } else {
      return { success: false, message: 'Failed to start watching file' };
    }
  } else {
    return { success: false, message: 'File is already being watched' };
  }
});

ipcMain.handle('remove-watched-file', (event, filePath) => {
  const watchedFiles = loadConfig();
  const index = watchedFiles.indexOf(filePath);
  
  if (index > -1) {
    watchedFiles.splice(index, 1);
    saveConfig(watchedFiles);
    stopWatching(filePath);
    return { success: true, message: 'File removed successfully' };
  } else {
    return { success: false, message: 'File not found in watched list' };
  }
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Log Files', extensions: ['log'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-log-content', (event, filePath, showNewestFirst = true) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (showNewestFirst) {
      // Parse WordPress debug log entries and sort by timestamp
      const lines = content.split('\n');
      const logEntries = [];
      let currentEntry = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line starts with a WordPress timestamp pattern
        if (line.match(/^\[\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} UTC\]/)) {
          // If we have a previous entry, save it
          if (currentEntry.trim()) {
            logEntries.push(currentEntry.trim());
          }
          // Start new entry
          currentEntry = line;
        } else {
          // Continue current entry
          currentEntry += '\n' + line;
        }
      }
      
      // Add the last entry if it exists
      if (currentEntry.trim()) {
        logEntries.push(currentEntry.trim());
      }
      
      // Sort entries by timestamp (newest first)
      logEntries.sort((a, b) => {
        const timestampA = a.match(/^\[(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} UTC)\]/);
        const timestampB = b.match(/^\[(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} UTC)\]/);
        
        if (timestampA && timestampB) {
          const dateA = new Date(timestampA[1]);
          const dateB = new Date(timestampB[1]);
          return dateB - dateA; // Newest first
        }
        
        // If no timestamp, keep original order
        return 0;
      });
      
      const sortedContent = logEntries.join('\n\n');
      return { success: true, content: sortedContent };
    } else {
      // Return content as-is (oldest first)
      return { success: true, content };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-log-file', (event, filePath) => {
  console.log('clear-log-file handler called with filePath:', filePath);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return { success: false, error: 'File does not exist' };
    }

    // Check if we can write to the file
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
    } catch (accessError) {
      console.error('No write permission for file:', filePath, accessError.message);
      return { success: false, error: 'No write permission for this file' };
    }

    // Get file stats before clearing
    const statsBefore = fs.statSync(filePath);
    console.log('File size before clearing:', statsBefore.size, 'bytes');

    // Clear the file
    fs.writeFileSync(filePath, '');

    // Verify the file was cleared
    const statsAfter = fs.statSync(filePath);
    console.log('File size after clearing:', statsAfter.size, 'bytes');

    if (statsAfter.size === 0) {
      console.log('Log file cleared successfully:', filePath);
      return { success: true, message: 'Log file cleared successfully' };
    } else {
      console.error('File was not properly cleared, size is still:', statsAfter.size);
      return { success: false, error: 'File was not properly cleared' };
    }
  } catch (error) {
    console.error('Error clearing log file:', filePath, error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-log-file', (event, filePath) => {
  try {
    const fileName = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFileName = `${fileName.replace('.log', '')}_export_${timestamp}.log`;
    
    const result = dialog.showSaveDialogSync(mainWindow, {
      title: 'Export Log File',
      defaultPath: exportFileName,
      filters: [
        { name: 'Log Files', extensions: ['log'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result) {
      const content = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(result, content);
      return { success: true, filePath: result };
    } else {
      return { success: false, error: 'Export cancelled' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('test-notification', () => {
  const testMessage = 'Test notification - if you see this, notifications are working!';
  
  try {
    sendNotification('Test', testMessage);
    return { success: true, message: 'Test notification sent' };
  } catch (error) {
    console.error('Test notification error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
});

ipcMain.handle('hide-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});

// All functionality is now handled by the modules

// IPC handlers for dump server
ipcMain.handle('start-dump-server', () => {
  return dumpServer.start();
});

ipcMain.handle('stop-dump-server', () => {
  return dumpServer.stop();
});

ipcMain.handle('get-dump-server-status', () => {
  return dumpServer.getStatus();
});

ipcMain.handle('show-window', () => {
  windowManager.showMainWindow();
});

// Updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
  return await autoUpdater.checkForUpdates();
});

ipcMain.handle('download-update', async (event, updateData) => {
  return await autoUpdater.downloadUpdate(updateData);
});

ipcMain.handle('install-update', async (event, extractPath) => {
  const result = await autoUpdater.applyUpdate(extractPath);
  if (result.success) {
    // Schedule app restart after a short delay
    setTimeout(() => {
      app.relaunch();
      app.exit();
    }, 2000);
  }
  return result;
});

ipcMain.handle('get-updater-status', () => {
  return autoUpdater.getStatus();
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  
  // Check notification support
  if (Notification.isSupported()) {
    console.log('Notifications are supported on this system');
  } else {
    console.log('Notifications not supported on this system');
  }
  
  // Test notification system on startup
  console.log('Testing notification system...');
  sendNotification('Startup', 'Application started successfully!');
  
  // Start watching previously saved files
  const watchedFiles = loadConfig();
  watchedFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      startWatching(filePath);
    }
  });

  app.on('activate', () => {
    console.log('App activate event triggered');
    console.log('Number of windows:', BrowserWindow.getAllWindows().length);
    console.log('mainWindow exists:', !!mainWindow);

    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('No windows exist, creating new window');
      createWindow();
    } else if (mainWindow) {
      console.log('Window exists but hidden, showing it');
      // Show the existing window if it's hidden
      windowManager.showMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  // Stop all watchers
  watchers.forEach((watcher, filePath) => {
    if (watcher.close) {
      watcher.close();
    } else if (watcher.removeAllListeners) {
      // For fs.watch fallback
      watcher.removeAllListeners();
    }
  });
  watchers.clear();
});
