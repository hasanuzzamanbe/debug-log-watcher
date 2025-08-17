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
// const clearBtn = document.getElementById('clearBtn'); // Removed from UI
const clearLogBtn = document.getElementById('clearLogBtn');
const exportLogBtn = document.getElementById('exportLogBtn');
const quickClearBtn = document.getElementById('quickClearBtn');
const floatingActions = document.querySelector('.floating-actions');
const orderToggleBtn = document.getElementById('orderToggleBtn');
const lineCount = document.getElementById('lineCount');
const backBtn = document.getElementById('backBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const sidebarToggle = document.getElementById('sidebarToggle');
const darkModeToggle = document.getElementById('darkModeToggle');
const sidebar = document.getElementById('sidebar');

// New view elements
const homeHeader = document.getElementById('homeHeader');
const homeContent = document.getElementById('homeContent');
const logViewHeader = document.getElementById('logViewHeader');
const logViewContent = document.getElementById('logViewContent');

// Dumper elements
const toggleDumpServerBtn = document.getElementById('toggleDumpServerBtn');
const dumpServerStatus = document.getElementById('dumpServerStatus');
const dumpServerInfo = document.getElementById('dumpServerInfo');
const viewDumperBtn = document.getElementById('viewDumperBtn');
const clearDumpsBtn = document.getElementById('clearDumpsBtn');
const dumperViewContent = document.getElementById('dumperViewContent');
const dumperBackBtn = document.getElementById('dumperBackBtn');
const dumpsContainer = document.getElementById('dumpsContainer');
const dumpCount = document.getElementById('dumpCount');
const serverStatusIndicator = document.getElementById('serverStatusIndicator');
const clearAllDumpsBtn = document.getElementById('clearAllDumpsBtn');

// State
let currentFile = null;
let watchedFiles = [];
let showNewestFirst = true; // Default to newest first
let sidebarCollapsed = false;
let darkMode = false;

// Dumper state
let isDumpServerRunning = false;
let dumps = [];
let currentView = 'home'; // 'home', 'log', 'dumper'

// Updater elements and state
const checkUpdateBtn = document.getElementById('checkUpdateBtn');
const updateBtnText = document.getElementById('updateBtnText');
const updateModal = document.getElementById('updateModal');
const updateModalClose = document.getElementById('updateModalClose');
const updateCancelBtn = document.getElementById('updateCancelBtn');
const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
const currentVersionText = document.getElementById('currentVersionText');
const updateStatus = document.getElementById('updateStatus');
const updateDetails = document.getElementById('updateDetails');
const latestVersionText = document.getElementById('latestVersionText');
const releaseDateText = document.getElementById('releaseDateText');
const downloadUpdateBtn = document.getElementById('downloadUpdateBtn');
const viewChangelogBtn = document.getElementById('viewChangelogBtn');
const downloadProgress = document.getElementById('downloadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const installReady = document.getElementById('installReady');
const installUpdateBtn = document.getElementById('installUpdateBtn');

let updateData = null;
let extractPath = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    // Debug: Check if all elements are found
    console.log('clearLogBtn found:', !!clearLogBtn);
    console.log('quickClearBtn found:', !!quickClearBtn);
    console.log('homeHeader found:', !!homeHeader);
    console.log('homeContent found:', !!homeContent);
    console.log('logViewHeader found:', !!logViewHeader);
    console.log('logViewContent found:', !!logViewContent);
    console.log('logText found:', !!logText);
    console.log('logTextContent found:', !!logTextContent);
    console.log('sidebarToggle found:', !!sidebarToggle);
    console.log('darkModeToggle found:', !!darkModeToggle);
    console.log('sidebar found:', !!sidebar);

    loadUserPreferences();
    await loadWatchedFiles();
    await loadDumpServerStatus();
    await loadUpdaterStatus();
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

    // clearBtn removed from UI

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

    // Dumper event listeners
    if (toggleDumpServerBtn) {
        toggleDumpServerBtn.addEventListener('click', () => {
            toggleDumpServer();
        });
    }

    if (viewDumperBtn) {
        viewDumperBtn.addEventListener('click', () => {
            showDumperView();
        });
    }

    if (clearDumpsBtn) {
        clearDumpsBtn.addEventListener('click', () => {
            clearAllDumps();
        });
    }

    if (dumperBackBtn) {
        dumperBackBtn.addEventListener('click', () => {
            goBackFromDumper();
        });
    }

    if (clearAllDumpsBtn) {
        clearAllDumpsBtn.addEventListener('click', () => {
            clearAllDumps();
        });
    }

    // Updater event listeners
    if (checkUpdateBtn) {
        checkUpdateBtn.addEventListener('click', () => {
            showUpdateModal();
        });
    }

    if (updateModalClose) {
        updateModalClose.addEventListener('click', () => {
            hideUpdateModal();
        });
    }

    if (updateCancelBtn) {
        updateCancelBtn.addEventListener('click', () => {
            hideUpdateModal();
        });
    }

    if (checkUpdatesBtn) {
        checkUpdatesBtn.addEventListener('click', () => {
            checkForUpdates();
        });
    }

    if (downloadUpdateBtn) {
        downloadUpdateBtn.addEventListener('click', () => {
            downloadUpdate();
        });
    }

    if (viewChangelogBtn) {
        viewChangelogBtn.addEventListener('click', () => {
            viewChangelog();
        });
    }

    if (installUpdateBtn) {
        installUpdateBtn.addEventListener('click', () => {
            installUpdate();
        });
    }
    
    // Navigation
    backBtn.addEventListener('click', () => goBack());



    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        toggleSidebar();
    });

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            console.log('Dark mode button clicked');
            toggleDarkMode();
        });
        console.log('Dark mode toggle event listener attached');
    } else {
        console.warn('darkModeToggle element not found');
    }
    
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
        } else {
            // If we're in log view, just update the home content for when we go back
            updateHomeContent();
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

  // Auto-hide sidebar when viewing a log file
  if (!sidebarCollapsed) {
    toggleSidebar();
  }

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

  // Ensure clear buttons are visible after loading content
  setTimeout(() => {
    ensureClearButtonsVisible();
  }, 200);

  // Re-render to update active state
  renderWatchedFiles();
}

async function loadLogContent(filePath) {
    try {
        const result = await ipcRenderer.invoke('get-log-content', filePath, showNewestFirst);

        if (result.success) {
            // Use the correct element for log view content
            if (logTextContent) {
                try {
                    const formattedContent = formatLogContent(result.content);
                    logTextContent.innerHTML = `<div class="formatted-log">${formattedContent}</div>`;
                } catch (formatError) {
                    console.error('Error formatting log content:', formatError);
                    // Fallback to plain text display
                    logTextContent.innerHTML = `<pre>${escapeHtml(result.content)}</pre>`;
                    showToast('Log formatting failed, showing raw content', 'warning');
                }
            }

            // Update line count
            const lines = result.content.split('\n').filter(line => line.trim() !== '');
            lineCount.textContent = `${lines.length} lines`;

            // Update order toggle button
            updateOrderToggleButton();

            // Ensure clear buttons are visible and enabled after content loads
            ensureClearButtonsVisible();
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

            // Even on error, ensure clear buttons are visible
            ensureClearButtonsVisible();
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

        // Even on error, ensure clear buttons are visible
        ensureClearButtonsVisible();
    }
}

function ensureClearButtonsVisible() {
    console.log('ensureClearButtonsVisible called');

    // Make sure we're in log view and have a current file
    if (!currentFile) {
        console.log('No current file, skipping clear button visibility');
        return;
    }

    // Ensure log view content is visible
    if (logViewContent) {
        logViewContent.style.display = 'block';
        console.log('logViewContent made visible');
    }

    // Check and enable clear buttons
    if (clearLogBtn) {
        clearLogBtn.disabled = false;
        clearLogBtn.style.display = '';
        console.log('clearLogBtn enabled and visible');
    } else {
        console.warn('clearLogBtn not found');
    }

    if (quickClearBtn) {
        quickClearBtn.disabled = false;
        quickClearBtn.style.display = '';
        console.log('quickClearBtn enabled and visible');
    } else {
        console.warn('quickClearBtn not found');
    }

    // Make sure floating actions are visible
    const floatingActions = document.querySelector('.floating-actions');
    if (floatingActions) {
        floatingActions.style.display = 'flex';
        console.log('floating actions made visible');
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
      const clearButtons = [clearLogBtn, quickClearBtn];
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
      const clearButtons = [clearLogBtn, quickClearBtn];
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
    orderToggleBtn.innerHTML = '⬇️ ASC';
    orderToggleBtn.title = 'Click to show oldest first';
  } else {
    orderToggleBtn.innerHTML = '⬆️ DES';
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
                // Auto-show sidebar when returning to home
                if (sidebarCollapsed) {
                    toggleSidebar();
                }
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

function formatLogContent(content) {
  try {
    // Split content into individual log entries
    const lines = content.split('\n');
    let formattedContent = '';

    for (let i = 0; i < lines.length; i++) {
      try {
        const line = lines[i];

        // Check if this is a WordPress timestamp line
        const timestampMatch = line.match(/^\[(\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2}:\d{2} UTC)\]/);

        if (timestampMatch) {
          // This is a timestamp line - format it
          const timestamp = timestampMatch[1];
          const message = line.substring(timestampMatch[0].length).trim();

          formattedContent += `<div class="log-entry">`;
          formattedContent += `<span class="log-timestamp">[${timestamp}]</span> `;
          formattedContent += formatLogMessage(message);
          formattedContent += `</div>\n`;
        } else if (line.trim()) {
          // This is a continuation line or standalone content
          formattedContent += `<div class="log-continuation">`;
          formattedContent += formatLogMessage(line);
          formattedContent += `</div>\n`;
        } else {
          // Empty line
          formattedContent += `<div class="log-empty-line"></div>\n`;
        }
      } catch (lineError) {
        console.warn('Error formatting line:', line, lineError);
        // Fallback to escaped HTML for problematic lines
        formattedContent += `<div class="log-entry">`;
        formattedContent += `<span class="log-message">${escapeHtml(lines[i])}</span>`;
        formattedContent += `</div>\n`;
      }
    }

    return formattedContent;
  } catch (error) {
    console.error('Error in formatLogContent:', error);
    // Fallback to simple escaped content
    return `<pre>${escapeHtml(content)}</pre>`;
  }
}

function formatLogMessage(message) {
  try {
    // Detect different types of content and format accordingly

    // Check for PHP errors/warnings/notices
    if (message.match(/^PHP (Fatal error|Warning|Notice|Parse error|Deprecated):/)) {
      return formatPhpError(message);
    }

    // Check for arrays (PHP print_r or var_dump style) - but limit processing for very large arrays
    if (message.includes('Array') && message.includes('(') && message.includes(')')) {
      // Limit array formatting for very large content to prevent performance issues
      if (message.length > 10000) {
        return `<div class="log-large-array">
          <span class="array-keyword">Array</span>
          <span class="array-note">(Large array - ${message.length} characters)</span>
          <details>
            <summary>Click to view raw content</summary>
            <pre class="raw-content">${escapeHtml(message)}</pre>
          </details>
        </div>`;
      }
      return formatArray(message);
    }

    // Check for JSON - with size limit
    try {
      if ((message.trim().startsWith('{') && message.trim().endsWith('}')) ||
          (message.trim().startsWith('[') && message.trim().endsWith(']'))) {
        if (message.length > 5000) {
          // For large JSON, show collapsed view
          return `<div class="log-large-json">
            <span class="json-note">Large JSON (${message.length} characters)</span>
            <details>
              <summary>Click to view formatted JSON</summary>
              ${formatJson(JSON.parse(message.trim()))}
            </details>
          </div>`;
        }
        const parsed = JSON.parse(message.trim());
        return formatJson(parsed);
      }
    } catch (e) {
      // Not valid JSON, continue with other checks
    }

    // Check for stack traces
    if (message.includes('Stack trace:') || message.match(/^#\d+/)) {
      return formatStackTrace(message);
    }

    // Check for file paths
    if (message.match(/\/[^\s]+\.(php|js|css|html)/)) {
      return formatFilePath(message);
    }

    // Default formatting for regular messages
    return `<span class="log-message">${escapeHtml(message)}</span>`;
  } catch (error) {
    console.warn('Error formatting message:', error);
    // Fallback to simple escaped content
    return `<span class="log-message">${escapeHtml(message)}</span>`;
  }
}

function formatPhpError(message) {
  const errorTypes = {
    'Fatal error': 'error-fatal',
    'Warning': 'error-warning',
    'Notice': 'error-notice',
    'Parse error': 'error-parse',
    'Deprecated': 'error-deprecated'
  };

  let className = 'error-general';
  for (const [type, cls] of Object.entries(errorTypes)) {
    if (message.includes(type)) {
      className = cls;
      break;
    }
  }

  return `<span class="log-error ${className}">${escapeHtml(message)}</span>`;
}

function formatArray(message) {
  try {
    // Check for recursion indicators
    if (message.includes('*RECURSION*') || message.includes('*CIRCULAR REFERENCE*')) {
      return `<div class="log-recursive-array">
        <span class="array-keyword">Array</span>
        <span class="recursion-warning">⚠️ Contains recursion/circular references</span>
        <details>
          <summary>Click to view raw content</summary>
          <pre class="raw-content">${escapeHtml(message)}</pre>
        </details>
      </div>`;
    }

    // For very large arrays, show collapsed view immediately
    if (message.length > 8000) {
      return `<div class="log-large-array">
        <span class="array-keyword">Array</span>
        <span class="array-note">(Large array - ${message.length} characters)</span>
        <details>
          <summary>Click to view formatted content</summary>
          <div class="formatted-array-content">${formatArraySafely(message)}</div>
        </details>
      </div>`;
    }

    return formatArraySafely(message);
  } catch (error) {
    console.warn('Error formatting array:', error);
    return `<div class="log-array-error">
      <span class="array-keyword">Array</span>
      <span class="format-error">⚠️ Formatting error</span>
      <details>
        <summary>Click to view raw content</summary>
        <pre class="raw-content">${escapeHtml(message)}</pre>
      </details>
    </div>`;
  }
}

function formatArraySafely(message) {
  try {
    // Escape HTML first to prevent any injection issues
    let formatted = escapeHtml(message);

    // Split into lines for better processing
    const lines = formatted.split('\n');
    let result = '';

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Skip empty lines
      if (!line.trim()) {
        result += '\n';
        continue;
      }

      // Format different parts of the array structure
      // Handle Array keyword
      line = line.replace(/^(\s*)(Array)(\s*)$/g, '$1<span class="array-keyword">$2</span>$3');

      // Handle opening and closing parentheses on their own lines
      line = line.replace(/^(\s*)(\()(\s*)$/g, '$1<span class="array-bracket">$2</span>$3');
      line = line.replace(/^(\s*)(\))(\s*)$/g, '$1<span class="array-bracket">$2</span>$3');

      // Handle array keys with => arrows (be more specific to avoid issues)
      line = line.replace(/^(\s*)\[([^\]]+)\](\s*)(=&gt;)(\s*)(.*)$/g,
        '$1<span class="array-key">[$2]</span>$3<span class="array-arrow">$4</span>$5<span class="array-value">$6</span>');

      // Handle nested Array declarations
      line = line.replace(/(\s+)(Array)(\s*)$/g, '$1<span class="array-keyword">$2</span>$3');

      result += line + '\n';
    }

    return `<div class="log-array"><pre class="array-content">${result}</pre></div>`;
  } catch (error) {
    console.warn('Error in formatArraySafely:', error);
    // Ultimate fallback - just return escaped content
    return `<div class="log-array"><pre class="array-content">${escapeHtml(message)}</pre></div>`;
  }
}

function formatJson(obj) {
  const jsonString = JSON.stringify(obj, null, 2);
  let formatted = escapeHtml(jsonString);

  // Highlight JSON syntax
  formatted = formatted.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:');
  formatted = formatted.replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>');
  formatted = formatted.replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>');
  formatted = formatted.replace(/:\s*(true|false|null)/g, ': <span class="json-boolean">$1</span>');
  formatted = formatted.replace(/[{}]/g, '<span class="json-bracket">$&</span>');
  formatted = formatted.replace(/[\[\]]/g, '<span class="json-bracket">$&</span>');

  return `<div class="log-json"><pre>${formatted}</pre></div>`;
}

function formatStackTrace(message) {
  let formatted = escapeHtml(message);

  // Highlight stack trace elements
  formatted = formatted.replace(/^(#\d+)/gm, '<span class="stack-number">$1</span>');
  formatted = formatted.replace(/(\/[^\s]+\.php)/g, '<span class="stack-file">$1</span>');
  formatted = formatted.replace(/:(\d+)/g, ':<span class="stack-line">$1</span>');
  formatted = formatted.replace(/(\w+::\w+|\w+->w+)/g, '<span class="stack-method">$1</span>');

  return `<span class="log-stack">${formatted}</span>`;
}

function formatFilePath(message) {
  let formatted = escapeHtml(message);

  // Highlight file paths
  formatted = formatted.replace(/(\/[^\s]+\.(php|js|css|html))/g, '<span class="file-path">$1</span>');
  formatted = formatted.replace(/:(\d+)/g, ':<span class="line-number">$1</span>');

  return `<span class="log-filepath">${formatted}</span>`;
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

function updateHomeContent() {
  if (!homeContent) return;

  if (watchedFiles.length === 0) {
    // Show welcome message when no files are watched
    homeContent.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">📄</div>
        <p>Welcome to WP Debugger</p>
        <p>Select a log file from the sidebar to start monitoring</p>
        <div class="placeholder-actions">
          <button class="btn btn-primary" onclick="document.getElementById('addFileBtn').click()">
            + Add Your First Log File
          </button>
        </div>
      </div>
    `;
  } else {
    // Show watched files overview
    homeContent.innerHTML = `
      <div class="home-files-overview">
        <div class="overview-header">
          <h3>📁 Watched Log Files (${watchedFiles.length})</h3>
          <p>Click on any file to view its contents</p>
        </div>
        <div class="files-grid">
          ${watchedFiles.map(filePath => {
            const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
            const shortPath = filePath.length > 50 ? '...' + filePath.slice(-47) : filePath;
            return `
              <div class="file-card" onclick="selectFile('${filePath.replace(/'/g, "\\'")}')">
                <div class="file-icon">📄</div>
                <div class="file-info">
                  <div class="file-name">${fileName}</div>
                  <div class="file-path">${shortPath}</div>
                </div>
                <div class="file-actions">
                  <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); selectFile('${filePath.replace(/'/g, "\\'")}')">
                    👁️ View
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
<!--        <div class="overview-actions">-->
<!--          <button class="btn btn-primary" onclick="document.getElementById('addFileBtn').click()">-->
<!--            + Add Another Log File-->
<!--          </button>-->
<!--        </div>-->
      </div>
    `;
  }
}

function showHomeView() {
  console.log('Switching to home view');
  currentView = 'home';

  // Show home elements
  if (homeHeader) homeHeader.style.display = 'flex';
  if (homeContent) homeContent.style.display = 'block';

  // Hide log view elements
  if (logViewHeader) logViewHeader.style.display = 'none';
  if (logViewContent) logViewContent.style.display = 'none';

  // Hide dumper view elements
  if (dumperViewContent) dumperViewContent.style.display = 'none';

  // Update home content based on watched files
  updateHomeContent();
}

function showLogView() {
  console.log('Switching to log view');
  currentView = 'log';

  // Hide home elements
  if (homeHeader) {
    homeHeader.style.display = 'none';
    console.log('Hidden homeHeader');
  }
  if (homeContent) {
    homeContent.style.display = 'none';
    console.log('Hidden homeContent');
  }

  // Hide dumper view elements
  if (dumperViewContent) {
    dumperViewContent.style.display = 'none';
    console.log('Hidden dumperViewContent');
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

  // Ensure clear buttons are visible after view switch
  setTimeout(() => {
    ensureClearButtonsVisible();
  }, 100);
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;

  if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
    document.querySelector('.main-content').classList.add('sidebar-collapsed');
    sidebarToggle.innerHTML = '☰';
    sidebarToggle.title = 'Show Sidebar';
  } else {
    sidebar.classList.remove('collapsed');
    document.querySelector('.main-content').classList.remove('sidebar-collapsed');
    sidebarToggle.innerHTML = '☰';
    sidebarToggle.title = 'Hide Sidebar';
  }

  // Save sidebar state
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
}

function toggleDarkMode() {
  console.log('toggleDarkMode called, current darkMode:', darkMode);
  darkMode = !darkMode;
  console.log('New darkMode state:', darkMode);

  if (darkMode) {
    document.body.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '☀️';
    darkModeToggle.title = 'Switch to Light Mode';
    console.log('Switched to dark mode');
  } else {
    document.body.setAttribute('data-theme', 'light');
    darkModeToggle.innerHTML = '🌙';
    darkModeToggle.title = 'Switch to Dark Mode';
    console.log('Switched to light mode');
  }

  // Save dark mode state
  localStorage.setItem('darkMode', darkMode);
  console.log('Dark mode state saved to localStorage');
}

function loadUserPreferences() {
  // Load sidebar state
  const savedSidebarState = localStorage.getItem('sidebarCollapsed');
  if (savedSidebarState === 'true') {
    sidebarCollapsed = true;
    sidebar.classList.add('collapsed');
    document.querySelector('.main-content').classList.add('sidebar-collapsed');
    sidebarToggle.title = 'Show Sidebar';
  }

  // Load dark mode state
  const savedDarkMode = localStorage.getItem('darkMode');
  if (savedDarkMode === 'true') {
    darkMode = true;
    document.body.setAttribute('data-theme', 'dark');
    darkModeToggle.innerHTML = '☀️';
    darkModeToggle.title = 'Switch to Light Mode';
  }
}

function goBack() {
  // Clear current file selection
  currentFile = null;

  // Auto-show sidebar when returning to home
  if (sidebarCollapsed) {
    toggleSidebar();
  }

  // Switch to home view
  showHomeView();

  // Clear active state from file list
  document.querySelectorAll('.watched-file-item').forEach(item => {
    item.classList.remove('active');
  });

  showToast('Returned to main view', 'success');
}

// Dumper Functions
async function toggleDumpServer() {
  try {
    if (isDumpServerRunning) {
      const result = await ipcRenderer.invoke('stop-dump-server');
      if (result.success) {
        isDumpServerRunning = false;
        updateDumpServerUI();
        showToast(result.message, 'success');
      } else {
        showToast(`Error stopping server: ${result.error}`, 'error');
      }
    } else {
      const result = await ipcRenderer.invoke('start-dump-server');
      if (result.success) {
        isDumpServerRunning = true;
        updateDumpServerUI();
        showToast(result.message, 'success');
      } else {
        showToast(`Error starting server: ${result.error}`, 'error');
      }
    }
  } catch (error) {
    showToast(`Error toggling dump server: ${error.message}`, 'error');
  }
}

function updateDumpServerUI() {
  if (isDumpServerRunning) {
    dumpServerStatus.textContent = '⏹️ Stop Server';
    dumpServerInfo.style.display = 'block';
    viewDumperBtn.style.display = 'block';
    clearDumpsBtn.style.display = 'block';
    serverStatusIndicator.textContent = '🟢 Online';
  } else {
    dumpServerStatus.textContent = '▶️ Start Server';
    dumpServerInfo.style.display = 'none';
    viewDumperBtn.style.display = 'none';
    clearDumpsBtn.style.display = 'none';
    serverStatusIndicator.textContent = '🔴 Offline';
  }
}

function showDumperView() {
  currentView = 'dumper';

  // Auto-hide sidebar when viewing dumper
  if (!sidebarCollapsed) {
    toggleSidebar();
  }

  // Hide other views
  if (homeHeader) homeHeader.style.display = 'none';
  if (homeContent) homeContent.style.display = 'none';
  if (logViewHeader) logViewHeader.style.display = 'none';
  if (logViewContent) logViewContent.style.display = 'none';

  // Show dumper view
  if (dumperViewContent) dumperViewContent.style.display = 'block';

  updateDumperView();
}

function goBackFromDumper() {
  currentView = 'home';

  // Auto-show sidebar when returning to home
  if (sidebarCollapsed) {
    toggleSidebar();
  }

  // Switch to home view
  showHomeView();

  showToast('Returned to main view', 'success');
}

function updateDumperView() {
  updateDumpServerUI();
  renderDumps();
}

function renderDumps() {
  console.log('renderDumps called, dumps count:', dumps.length);
  if (!dumpsContainer) {
    console.warn('dumpsContainer not found');
    return;
  }

  if (dumps.length === 0) {
    dumpsContainer.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">🔍</div>
        <p>No dumps received yet</p>
        <p>Start the dump server and send dumps from your WordPress application</p>
        <div class="placeholder-actions">
          <p><strong>Endpoint:</strong> <code>POST http://localhost:9913/dump</code></p>
        </div>
      </div>
    `;
  } else {
    dumpsContainer.innerHTML = dumps.map((dump, index) => {
      const dumpNumber = dumps.length - index;
      const dumpTime = dump.time || new Date().toISOString();
      const dumpContent = dump.content || 'No content available';

      return `
        <div class="dump-card">
          <div class="dump-meta">
            <span>Dump #${dumpNumber}</span>
            <span>${dumpTime}</span>
          </div>
          <div class="dump-content">
            ${dumpContent}
          </div>
        </div>
      `;
    }).join('');
  }

  if (dumpCount) {
    dumpCount.textContent = `${dumps.length} dumps`;
  }
}

function clearAllDumps() {
  if (dumps.length === 0) {
    showToast('No dumps to clear', 'info');
    return;
  }

  const confirmed = confirm(`Are you sure you want to clear all ${dumps.length} dumps?\n\nThis action cannot be undone.`);

  if (confirmed) {
    dumps = [];
    renderDumps();
    showToast('All dumps cleared', 'success');
  }
}

async function loadDumpServerStatus() {
  try {
    const status = await ipcRenderer.invoke('get-dump-server-status');
    isDumpServerRunning = status.running;

    // Check if dump server dependencies are available
    if (!status.available) {
      console.warn('Dump server dependencies not available');
      if (dumpServerStatus) {
        dumpServerStatus.textContent = '❌ Unavailable';
      }
      if (toggleDumpServerBtn) {
        toggleDumpServerBtn.disabled = true;
        toggleDumpServerBtn.title = 'Dump server dependencies not available';
      }
      showToast('Dump server dependencies not available. Please reinstall the application.', 'error');
      return;
    }

    updateDumpServerUI();
  } catch (error) {
    console.error('Error loading dump server status:', error);
  }
}

// Updater Functions
async function loadUpdaterStatus() {
  try {
    const status = await ipcRenderer.invoke('get-updater-status');

    if (currentVersionText) {
      currentVersionText.textContent = status.currentVersion;
    }

    if (!status.available) {
      console.warn('Updater not available');
      if (checkUpdateBtn) {
        checkUpdateBtn.disabled = true;
        checkUpdateBtn.title = 'Updater not available';
        updateBtnText.textContent = '❌';
      }
      return;
    }

    // Check for updates automatically on startup (optional)
    // setTimeout(() => checkForUpdatesBackground(), 5000);

  } catch (error) {
    console.error('Error loading updater status:', error);
  }
}

function showUpdateModal() {
  if (updateModal) {
    updateModal.style.display = 'flex';
    resetUpdateModal();
  }
}

function hideUpdateModal() {
  if (updateModal) {
    updateModal.style.display = 'none';
  }
}

function resetUpdateModal() {
  // Hide all sections
  if (updateDetails) updateDetails.style.display = 'none';
  if (downloadProgress) downloadProgress.style.display = 'none';
  if (installReady) installReady.style.display = 'none';

  // Reset status
  if (updateStatus) {
    updateStatus.textContent = 'Click "Check for Updates" to see if a new version is available.';
  }

  // Reset button states
  if (checkUpdatesBtn) {
    checkUpdatesBtn.disabled = false;
    checkUpdatesBtn.textContent = '🔄 Check for Updates';
  }
}

async function checkForUpdates() {
  if (!checkUpdatesBtn) return;

  try {
    // Update UI
    checkUpdatesBtn.disabled = true;
    checkUpdatesBtn.textContent = '🔄 Checking...';
    updateStatus.textContent = 'Checking for updates...';

    // Add spinning animation to header button
    if (checkUpdateBtn) {
      checkUpdateBtn.classList.add('checking');
    }

    const result = await ipcRenderer.invoke('check-for-updates');

    if (result.success) {
      if (result.hasUpdate) {
        // Update available
        updateData = result.updateData;
        showUpdateAvailable(result);

        // Update header button
        if (checkUpdateBtn) {
          checkUpdateBtn.classList.remove('checking');
          checkUpdateBtn.classList.add('update-available');
          updateBtnText.textContent = '🔄';
          checkUpdateBtn.title = `Update available: v${result.latestVersion}`;
        }

        showToast(`Update available: v${result.latestVersion}`, 'info');
      } else {
        // No update available
        updateStatus.textContent = `You're running the latest version (${result.currentVersion}).`;

        // Reset header button
        if (checkUpdateBtn) {
          checkUpdateBtn.classList.remove('checking');
          updateBtnText.textContent = '✅';
          checkUpdateBtn.title = 'Up to date';
        }

        showToast('You\'re running the latest version!', 'success');
      }
    } else {
      // Error checking for updates
      updateStatus.textContent = `Error checking for updates: ${result.error}`;

      // Reset header button
      if (checkUpdateBtn) {
        checkUpdateBtn.classList.remove('checking');
        updateBtnText.textContent = '❌';
        checkUpdateBtn.title = 'Error checking for updates';
      }

      showToast(`Error checking for updates: ${result.error}`, 'error');
    }
  } catch (error) {
    updateStatus.textContent = `Error: ${error.message}`;
    showToast(`Error checking for updates: ${error.message}`, 'error');
  } finally {
    // Reset button
    checkUpdatesBtn.disabled = false;
    checkUpdatesBtn.textContent = '🔄 Check for Updates';

    // Remove spinning animation
    if (checkUpdateBtn) {
      checkUpdateBtn.classList.remove('checking');
    }
  }
}

function showUpdateAvailable(result) {
  if (!updateDetails) return;

  // Show update details
  updateDetails.style.display = 'block';

  // Update text content
  if (latestVersionText) {
    latestVersionText.textContent = result.latestVersion;
  }

  if (releaseDateText && result.updateData.last_updated) {
    const date = new Date(result.updateData.last_updated);
    releaseDateText.textContent = date.toLocaleDateString();
  }

  updateStatus.textContent = `A new version (${result.latestVersion}) is available!`;
}

async function downloadUpdate() {
  if (!updateData || !downloadUpdateBtn) return;

  try {
    // Update UI
    downloadUpdateBtn.disabled = true;
    downloadUpdateBtn.textContent = '📥 Downloading...';

    // Show progress section
    downloadProgress.style.display = 'block';
    updateDetails.style.display = 'none';

    // Start download
    const result = await ipcRenderer.invoke('download-update', updateData);

    if (result.success) {
      // Download successful
      extractPath = result.extractPath;

      // Hide progress, show install ready
      downloadProgress.style.display = 'none';
      installReady.style.display = 'block';

      showToast('Update downloaded successfully!', 'success');
    } else {
      // Download failed
      downloadProgress.style.display = 'none';
      updateDetails.style.display = 'block';

      showToast(`Download failed: ${result.error}`, 'error');
    }
  } catch (error) {
    downloadProgress.style.display = 'none';
    updateDetails.style.display = 'block';
    showToast(`Download error: ${error.message}`, 'error');
  } finally {
    // Reset button
    downloadUpdateBtn.disabled = false;
    downloadUpdateBtn.textContent = '📥 Download Update';
  }
}

async function installUpdate() {
  if (!extractPath || !installUpdateBtn) return;

  try {
    installUpdateBtn.disabled = true;
    installUpdateBtn.textContent = '🚀 Installing...';

    const result = await ipcRenderer.invoke('install-update', extractPath);

    if (result.success) {
      showToast('Update installed! Application will restart...', 'success');
      hideUpdateModal();
    } else {
      showToast(`Installation failed: ${result.error}`, 'error');
    }
  } catch (error) {
    showToast(`Installation error: ${error.message}`, 'error');
  } finally {
    installUpdateBtn.disabled = false;
    installUpdateBtn.textContent = '🚀 Install Update';
  }
}

function viewChangelog() {
  if (updateData && updateData.url) {
    // Open changelog URL in external browser
    require('electron').shell.openExternal(updateData.url);
  }
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

ipcRenderer.on('new-dump', (event, dumpData) => {
    console.log('New dump received:', dumpData);

    // Validate and normalize dump data
    const normalizedDump = {
        time: dumpData.time || new Date().toISOString(),
        content: dumpData.content || 'No content available'
    };

    dumps.unshift(normalizedDump); // Add to beginning of array

    // Limit to last 100 dumps to prevent memory issues
    if (dumps.length > 100) {
        dumps = dumps.slice(0, 100);
    }

    // Update UI if we're in dumper view
    if (currentView === 'dumper') {
        renderDumps();
    }

    // Show notification
    const timeDisplay = new Date(normalizedDump.time).toLocaleTimeString();
    showToast(`New dump received at ${timeDisplay}`, 'info');

    // Request to show the app window when dump is received
    ipcRenderer.invoke('show-window');
});

// Make selectFile available globally for home page file cards
window.selectFile = selectFile;

// Debug function for testing clear functionality
window.debugClearFunction = function() {
    console.log('=== DEBUG CLEAR FUNCTION ===');
    console.log('currentFile:', currentFile);
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
