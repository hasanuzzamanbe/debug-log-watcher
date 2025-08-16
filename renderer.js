const { ipcRenderer } = require('electron');

// DOM Elements
const addFileBtn = document.getElementById('addFileBtn');
const addFileModal = document.getElementById('addFileModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const addBtn = document.getElementById('addBtn');
const browseBtn = document.getElementById('browseBtn');
const filePathInput = document.getElementById('filePath');
const watchedFilesList = document.getElementById('watchedFilesList');
const activityLog = document.getElementById('activityLog');
const currentLogTitle = document.getElementById('currentLogTitle');
const logText = document.getElementById('logText');
const refreshBtn = document.getElementById('refreshBtn');
const testNotificationBtn = document.getElementById('testNotificationBtn');
const clearBtn = document.getElementById('clearBtn');
const clearLogBtn = document.getElementById('clearLogBtn');
const exportLogBtn = document.getElementById('exportLogBtn');
const quickClearBtn = document.getElementById('quickClearBtn');
const floatingActions = document.querySelector('.floating-actions');
const orderToggleBtn = document.getElementById('orderToggleBtn');
const lineCount = document.getElementById('lineCount');
const minimizeBtn = document.getElementById('minimizeBtn');
const closeBtn = document.getElementById('closeBtn');
const backBtn = document.getElementById('backBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// State
let currentFile = null;
let watchedFiles = [];
let showNewestFirst = true; // Default to newest first

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadWatchedFiles();
    setupEventListeners();
});

function setupEventListeners() {
    // Modal controls
    addFileBtn.addEventListener('click', () => showModal());
    closeModal.addEventListener('click', () => hideModal());
    cancelBtn.addEventListener('click', () => hideModal());
    addBtn.addEventListener('click', () => addWatchedFile());
    browseBtn.addEventListener('click', () => browseFile());
    
    // File input
    filePathInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addWatchedFile();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key to go back
        if (e.key === 'Escape' && currentFile) {
            goBack();
        }
    });
    
    // Log actions
    refreshBtn.addEventListener('click', () => refreshCurrentLog());
    clearBtn.addEventListener('click', () => clearCurrentLog());
    clearLogBtn.addEventListener('click', () => clearCurrentLog());
    exportLogBtn.addEventListener('click', () => exportCurrentLog());
    quickClearBtn.addEventListener('click', () => clearCurrentLog());
    testNotificationBtn.addEventListener('click', () => testNotification());
    orderToggleBtn.addEventListener('click', () => toggleLogOrder());
    
    // Navigation
    backBtn.addEventListener('click', () => goBack());
    
    // Window controls
    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('minimize-window');
    });
    
    closeBtn.addEventListener('click', () => {
        ipcRenderer.invoke('hide-window');
    });
    
    // Modal backdrop click
    addFileModal.addEventListener('click', (e) => {
        if (e.target === addFileModal) {
            hideModal();
        }
    });
}

async function loadWatchedFiles() {
    try {
        watchedFiles = await ipcRenderer.invoke('get-watched-files');
        renderWatchedFiles();
        
        if (watchedFiles.length > 0) {
            selectFile(watchedFiles[0]);
        }
    } catch (error) {
        showToast('Error loading watched files', 'error');
    }
}

function renderWatchedFiles() {
    watchedFilesList.innerHTML = '';
    
    if (watchedFiles.length === 0) {
        watchedFilesList.innerHTML = `
            <div style="text-align: center; color: #6c757d; padding: 20px;">
                <p>No files being watched</p>
                <p style="font-size: 12px;">Click "Add Log File" to get started</p>
            </div>
        `;
        return;
    }
    
    watchedFiles.forEach(filePath => {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
        const isActive = currentFile === filePath;
        
        const fileItem = document.createElement('div');
        fileItem.className = `watched-file-item ${isActive ? 'active' : ''}`;
        fileItem.innerHTML = `
            <div class="file-name">${fileName}</div>
            <div class="file-path">${filePath}</div>
            <button class="remove-file-btn" data-file="${filePath}">×</button>
        `;
        
        fileItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-file-btn')) {
                selectFile(filePath);
            }
        });
        
        // Remove button
        const removeBtn = fileItem.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeWatchedFile(filePath);
        });
        
        watchedFilesList.appendChild(fileItem);
    });
}

async function selectFile(filePath) {
  currentFile = filePath;
  currentLogTitle.textContent = filePath.split('/').pop() || filePath.split('\\').pop();
  
  // Show back button
  backBtn.style.display = 'flex';
  
  // Update active state
  document.querySelectorAll('.watched-file-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeItem = document.querySelector(`[data-file="${filePath}"]`)?.parentElement;
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  // Enable buttons
  refreshBtn.disabled = false;
  clearBtn.disabled = false;
  clearLogBtn.disabled = false;
  exportLogBtn.disabled = false;
  orderToggleBtn.disabled = false;
  
  // Load log content
  await loadLogContent(filePath);
  
  // Show floating actions
  floatingActions.style.display = 'flex';
  
  // Re-render to update active state
  renderWatchedFiles();
}

async function loadLogContent(filePath) {
    try {
        const result = await ipcRenderer.invoke('get-log-content', filePath, showNewestFirst);
        
        if (result.success) {
            logText.innerHTML = `<pre>${escapeHtml(result.content)}</pre>`;
            
            // Update line count
            const lines = result.content.split('\n').filter(line => line.trim() !== '');
            lineCount.textContent = `${lines.length} lines`;
            
            // Update order toggle button
            updateOrderToggleButton();
        } else {
            logText.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">⚠️</div>
                    <p>Error loading log file</p>
                    <p>${result.error}</p>
                </div>
            `;
            lineCount.textContent = '0 lines';
        }
    } catch (error) {
        logText.innerHTML = `
            <div class="placeholder">
                <div class="placeholder-icon">⚠️</div>
                <p>Error loading log file</p>
                <p>${error.message}</p>
            </div>
        `;
        lineCount.textContent = '0 lines';
    }
}

async function refreshCurrentLog() {
    if (currentFile) {
        await loadLogContent(currentFile);
        showToast('Log refreshed', 'success');
    }
}

async function clearCurrentLog() {
  if (currentFile) {
    const fileName = currentFile.split('/').pop() || currentFile.split('\\').pop();
    const confirmed = confirm(`Are you sure you want to clear the log file "${fileName}"?\n\nThis action cannot be undone.`);
    
    if (confirmed) {
      try {
        const result = await ipcRenderer.invoke('clear-log-file', currentFile);
        
        if (result.success) {
          showToast(result.message, 'success');
          // Refresh the log content to show it's empty
          await loadLogContent(currentFile);
        } else {
          showToast(`Error clearing log: ${result.error}`, 'error');
        }
      } catch (error) {
        showToast('Error clearing log', 'error');
      }
    }
  }
}

function toggleLogOrder() {
  showNewestFirst = !showNewestFirst;
  if (currentFile) {
    loadLogContent(currentFile);
  }
}

function updateOrderToggleButton() {
  if (showNewestFirst) {
    orderToggleBtn.innerHTML = '⬇️ Newest First';
    orderToggleBtn.title = 'Click to show oldest first';
  } else {
    orderToggleBtn.innerHTML = '⬆️ Oldest First';
    orderToggleBtn.title = 'Click to show newest first';
  }
}

async function exportCurrentLog() {
  if (currentFile) {
    try {
      const result = await ipcRenderer.invoke('export-log-file', currentFile);
      
      if (result.success) {
        showToast(`Log exported to: ${result.filePath}`, 'success');
      } else {
        showToast(`Export failed: ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('Error exporting log', 'error');
    }
  }
}

function showModal() {
    addFileModal.classList.add('show');
    filePathInput.focus();
}

function hideModal() {
    addFileModal.classList.remove('show');
    filePathInput.value = '';
}

async function browseFile() {
    try {
        const filePath = await ipcRenderer.invoke('select-file');
        if (filePath) {
            filePathInput.value = filePath;
        }
    } catch (error) {
        showToast('Error browsing for file', 'error');
    }
}

async function addWatchedFile() {
    const filePath = filePathInput.value.trim();
    
    if (!filePath) {
        showToast('Please enter a file path', 'warning');
        return;
    }
    
    try {
        const result = await ipcRenderer.invoke('add-watched-file', filePath);
        
        if (result.success) {
            showToast(result.message, 'success');
            hideModal();
            await loadWatchedFiles();
            
            // Select the newly added file
            if (!currentFile) {
                selectFile(filePath);
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error adding file', 'error');
    }
}

async function removeWatchedFile(filePath) {
    try {
        const result = await ipcRenderer.invoke('remove-watched-file', filePath);
        
        if (result.success) {
            showToast(result.message, 'success');
            
            // If we're removing the currently selected file, clear the view
            if (currentFile === filePath) {
                currentFile = null;
                currentLogTitle.textContent = '';
                backBtn.style.display = 'none';
                logText.innerHTML = `
                    <div class="placeholder">
                        <div class="placeholder-icon">📄</div>
                        <p>No log file selected</p>
                        <p>Add a debug.log file to start monitoring</p>
                    </div>
                `;
                refreshBtn.disabled = true;
                clearBtn.disabled = true;
            }
            
            await loadWatchedFiles();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error removing file', 'error');
    }
}

function addActivityEntry(message) {
    const time = new Date().toLocaleTimeString();
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-time">${time}</div>
        <div class="activity-message">${message}</div>
    `;
    
    activityLog.insertBefore(activityItem, activityLog.firstChild);
    
    // Keep only last 10 entries
    while (activityLog.children.length > 10) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function testNotification() {
  try {
    const result = await ipcRenderer.invoke('test-notification');
    if (result.success) {
      showToast('Test notification sent!', 'success');
    } else {
      showToast(`Notification error: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast('Error testing notification', 'error');
  }
}

function goBack() {
  // Clear current file selection
  currentFile = null;
  
  // Hide back button
  backBtn.style.display = 'none';
  
  // Reset title
  currentLogTitle.textContent = '';
  
  // Disable action buttons
  refreshBtn.disabled = true;
  clearBtn.disabled = true;
  clearLogBtn.disabled = true;
  exportLogBtn.disabled = true;
  orderToggleBtn.disabled = true;
  
  // Reset line count
  lineCount.textContent = '0 lines';
  
  // Show placeholder content
  logText.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">📄</div>
      <p>Welcome to Debug Log Watcher</p>
      <p>Select a log file from the sidebar to start monitoring</p>
      <div class="placeholder-actions">
        <button class="btn btn-primary" onclick="document.getElementById('addFileBtn').click()">
          + Add Your First Log File
        </button>
      </div>
    </div>
  `;
  
  // Hide floating actions
  floatingActions.style.display = 'none';
  
  // Clear active state from file list
  document.querySelectorAll('.watched-file-item').forEach(item => {
    item.classList.remove('active');
  });
  
  showToast('Returned to main view', 'success');
}

// IPC Listeners
ipcRenderer.on('new-log-entry', (event, data) => {
    addActivityEntry(`New log entries in ${data.filePath.split('/').pop()}`);
    
    // If this is the currently viewed file, refresh the content
    if (currentFile === data.filePath) {
        loadLogContent(data.filePath);
    }
});

ipcRenderer.on('watch-error', (event, data) => {
    addActivityEntry(`Error watching ${data.filePath}: ${data.error}`);
    showToast(`Error watching ${data.filePath}`, 'error');
});

ipcRenderer.on('show-add-dialog', () => {
    showModal();
});
