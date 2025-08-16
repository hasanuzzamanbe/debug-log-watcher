const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle chokidar import for both development and production
let chokidar;
try {
  chokidar = require('chokidar');
} catch (error) {
  // In production, try to load from app.asar.unpacked
  const chokidarPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'chokidar');
  chokidar = require(chokidarPath);
}

let mainWindow;
let tray;
let watchers = new Map();
let isQuitting = false;

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

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Create tray
  createTray();
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon);
  tray.setToolTip('Debug Log Watcher');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Add Log File',
      click: () => {
        mainWindow.show();
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
  
  tray.on('double-click', () => {
    mainWindow.show();
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
              
              sendNotification(fileName, notificationMessage);

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
    watcher.close();
    watchers.delete(filePath);
    return true;
  }
  return false;
}

function sendNotification(fileName, message) {
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
  try {
    fs.writeFileSync(filePath, '');
    return { success: true, message: 'Log file cleared successfully' };
  } catch (error) {
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
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
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
    watcher.close();
  });
  watchers.clear();
});
