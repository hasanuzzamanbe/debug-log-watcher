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
const logTextContent = document.getElementById('logTextContent');
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

// New view elements
const homeHeader = document.getElementById('homeHeader');
const homeContent = document.getElementById('homeContent');
const logViewHeader = document.getElementById('logViewHeader');
const logViewContent = document.getElementById('logViewContent');

// State
let currentFile = null;
let watchedFiles = [];
let showNewestFirst = true; // Default to newest first

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    // Debug: Check if all elements are found
    console.log('clearBtn found:', !!clearBtn);
    console.log('clearLogBtn found:', !!clearLogBtn);
    console.log('quickClearBtn found:', !!quickClearBtn);
    console.log('homeHeader found:', !!homeHeader);
    console.log('homeContent found:', !!homeContent);
    console.log('logViewHeader found:', !!logViewHeader);
    console.log('logViewContent found:', !!logViewContent);
    console.log('logText found:', !!logText);
    console.log('logTextContent found:', !!logTextContent);

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
    refreshBtn.addEventListener('click', () => {
        console.log('Refresh button clicked');
        refreshCurrentLog();
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log('Clear button (header) clicked');
            clearCurrentLog();
        });
        console.log('clearBtn event listener attached');
    } else {
        console.warn('clearBtn element not found during setup');
    }

    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            console.log('Clear Log button (content) clicked');
            clearCurrentLog();
        });
        console.log('clearLogBtn event listener attached');
    } else {
        console.warn('clearLogBtn element not found during setup');
    }

    exportLogBtn.addEventListener('click', () => {
        console.log('Export button clicked');
        exportCurrentLog();
    });

    if (quickClearBtn) {
        quickClearBtn.addEventListener('click', () => {
            console.log('Quick clear button (floating) clicked');
            clearCurrentLog();
        });
    } else {
        console.warn('quickClearBtn element not found');
    }

    testNotificationBtn.addEventListener('click', () => {
        console.log('Test notification button clicked');
        testNotification();
    });

    orderToggleBtn.addEventListener('click', () => {
        console.log('Order toggle button clicked');
        toggleLogOrder();
    });
    
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

        // Start with home view - don't auto-select first file
        if (!currentFile) {
            showHomeView();
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
  console.log('selectFile called with:', filePath);
  currentFile = filePath;
  currentLogTitle.textContent = filePath.split('/').pop() || filePath.split('\\').pop();

  // Switch to single log view
  showLogView();

  // Update active state
  document.querySelectorAll('.watched-file-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`[data-file="${filePath}"]`)?.parentElement;
  if (activeItem) {
    activeItem.classList.add('active');
  }

  console.log('Switched to log view for file:', filePath);

  // Load log content
  await loadLogContent(filePath);

  // Re-render to update active state
  renderWatchedFiles();
}

async function loadLogContent(filePath) {
    try {
        const result = await ipcRenderer.invoke('get-log-content', filePath, showNewestFirst);

        if (result.success) {
            // Use the correct element for log view content
            if (logTextContent) {
                logTextContent.innerHTML = `<pre>${escapeHtml(result.content)}</pre>`;
            }

            // Update line count
            const lines = result.content.split('\n').filter(line => line.trim() !== '');
            lineCount.textContent = `${lines.length} lines`;

            // Update order toggle button
            updateOrderToggleButton();
        } else {
            if (logTextContent) {
                logTextContent.innerHTML = `
                    <div class="placeholder">
                        <div class="placeholder-icon">⚠️</div>
                        <p>Error loading log file</p>
                        <p>${result.error}</p>
                    </div>
                `;
            }
            lineCount.textContent = '0 lines';
        }
    } catch (error) {
        if (logTextContent) {
            logTextContent.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">⚠️</div>
                    <p>Error loading log file</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
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
  console.log('clearCurrentLog called, currentFile:', currentFile);

  if (!currentFile) {
    showToast('No log file selected', 'warning');
    console.warn('clearCurrentLog: No current file selected');
    return;
  }

  const fileName = currentFile.split('/').pop() || currentFile.split('\\').pop();
  const confirmed = confirm(`Are you sure you want to clear the log file "${fileName}"?\n\nThis action cannot be undone.`);

  if (confirmed) {
    try {
      console.log('Attempting to clear log file:', currentFile);

      // Disable clear buttons during operation to prevent double-clicks
      const clearButtons = [clearBtn, clearLogBtn, quickClearBtn];
      clearButtons.forEach(btn => {
        if (btn) btn.disabled = true;
      });

      const result = await ipcRenderer.invoke('clear-log-file', currentFile);
      console.log('Clear log file result:', result);

      if (result.success) {
        showToast(result.message, 'success');
        // Refresh the log content to show it's empty
        await loadLogContent(currentFile);
        console.log('Log file cleared and content refreshed');
      } else {
        showToast(`Error clearing log: ${result.error}`, 'error');
        console.error('Clear log file failed:', result.error);
      }
    } catch (error) {
      showToast(`Error clearing log: ${error.message}`, 'error');
      console.error('Exception in clearCurrentLog:', error);
    } finally {
      // Re-enable clear buttons
      const clearButtons = [clearBtn, clearLogBtn, quickClearBtn];
      clearButtons.forEach(btn => {
        if (btn && currentFile) btn.disabled = false;
      });
    }
  } else {
    console.log('User cancelled log clear operation');
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

            // Don't auto-select the newly added file - stay on home view
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
            
            // If we're removing the currently selected file, go back to home view
            if (currentFile === filePath) {
                currentFile = null;
                showHomeView();
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

function showHomeView() {
  console.log('Switching to home view');

  // Show home elements
  if (homeHeader) homeHeader.style.display = 'flex';
  if (homeContent) homeContent.style.display = 'block';

  // Hide log view elements
  if (logViewHeader) logViewHeader.style.display = 'none';
  if (logViewContent) logViewContent.style.display = 'none';
}

function showLogView() {
  console.log('Switching to log view');

  // Hide home elements
  if (homeHeader) {
    homeHeader.style.display = 'none';
    console.log('Hidden homeHeader');
  }
  if (homeContent) {
    homeContent.style.display = 'none';
    console.log('Hidden homeContent');
  }

  // Show log view elements
  if (logViewHeader) {
    logViewHeader.style.display = 'flex';
    console.log('Shown logViewHeader');
  }
  if (logViewContent) {
    logViewContent.style.display = 'block';
    console.log('Shown logViewContent');
  }

  // Debug: Check if clear buttons are now visible
  console.log('clearLogBtn visible after view switch:', clearLogBtn && clearLogBtn.offsetParent !== null);
  console.log('quickClearBtn visible after view switch:', quickClearBtn && quickClearBtn.offsetParent !== null);
}

function goBack() {
  // Clear current file selection
  currentFile = null;

  // Switch to home view
  showHomeView();

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

ipcRenderer.on('select-log-file', (event, filePath) => {
    console.log('Notification clicked, selecting file:', filePath);
    if (watchedFiles.includes(filePath)) {
        selectFile(filePath);
    } else {
        showToast('Log file no longer being watched', 'warning');
    }
});

// Debug function for testing clear functionality
window.debugClearFunction = function() {
    console.log('=== DEBUG CLEAR FUNCTION ===');
    console.log('currentFile:', currentFile);
    console.log('clearBtn element:', clearBtn);
    console.log('clearBtn disabled:', clearBtn ? clearBtn.disabled : 'not found');
    console.log('clearLogBtn element:', clearLogBtn);
    console.log('clearLogBtn disabled:', clearLogBtn ? clearLogBtn.disabled : 'not found');
    console.log('quickClearBtn element:', quickClearBtn);
    console.log('quickClearBtn disabled:', quickClearBtn ? quickClearBtn.disabled : 'not found');

    if (currentFile) {
        console.log('Attempting to call clearCurrentLog...');
        clearCurrentLog();
    } else {
        console.log('No current file selected');
    }
};
