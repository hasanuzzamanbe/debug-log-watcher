class WindowManager {
  constructor(app) {
    this.app = app;
    this.mainWindow = null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  showMainWindow() {
    console.log('showMainWindow called, mainWindow exists:', !!this.mainWindow);
    if (this.mainWindow) {
      console.log('Window state - isMinimized:', this.mainWindow.isMinimized(), 'isVisible:', this.mainWindow.isVisible());
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
        console.log('Window restored from minimized state');
      }
      this.mainWindow.show();
      this.mainWindow.focus();
      console.log('Window shown and focused');
      
      // On macOS, also bring the app to front
      if (process.platform === 'darwin') {
        this.app.focus();
        console.log('App brought to front on macOS');
      }
    } else {
      console.log('mainWindow is null, cannot show window');
    }
  }

  setupWindowEvents(mainWindow, isQuitting) {
    mainWindow.on('close', (event) => {
      console.log('Window close event triggered, isQuitting:', isQuitting);
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        console.log('Window hidden instead of closed');
      } else {
        console.log('App is quitting, allowing window to close');
      }
    });
  }
}

module.exports = WindowManager;
