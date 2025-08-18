# WP Debugger

A native macOS application for monitoring WordPress debug.log files and receiving instant notifications when new log entries appear.

![WP Debugger](assets/icon.png)

> **Monitor WordPress debug logs in real-time with instant macOS notifications**

## Features

- 🔍 **Real-time Monitoring**: Watch multiple WordPress debug.log files simultaneously
- 🔔 **Instant Notifications**: Get macOS notifications when new log entries are detected
- 📱 **Tray Integration**: Runs in the system tray with quick access menu
- 🎨 **Modern UI**: Clean, intuitive interface with real-time log viewing
- 💾 **Persistent Configuration**: Remembers your watched files between sessions
- 📊 **Activity Log**: Track recent monitoring activity
- 🔄 **Auto-refresh**: Automatically updates log content when changes are detected

## Installation
You can download your application from here.
[https://drive.google.com/drive/u/4/folders/1xMLx-Fmnf5P1YendcKRmPzzbiVyZvqeT](Debug Log.dmg files)

Run this command in the terminal:
`sudo xattr -rd com.apple.quarantine "/Applications/WP Debugger.app"`

### Prerequisites

- macOS 10.14 or later
- Node.js 16 or later
- npm or yarn

### Quick Start

1. **Download the latest release** from the releases page
2. **Install the .dmg file** by dragging to Applications
3. **Launch the app** from Applications or Spotlight

### Development Setup

### Development Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application in development mode:
   ```bash
   npm start
   ```

### Building for Distribution

To create a distributable macOS application:

```bash
npm run build
```

The built application will be available in the `dist` folder.

## Usage

### Adding Log Files

1. Click the "Add Log File" button
2. Either:
   - Enter the full path to your debug.log file manually
   - Click "Browse" to select the file through the file picker
3. Click "Add File" to start monitoring

### Common WordPress Debug Log Locations

- `/wp-content/debug.log`
- `/wp-content/uploads/debug.log`
- `/logs/debug.log`

### Features

- **Real-time Monitoring**: The app watches for file changes and displays new content immediately
- **System Notifications**: Receive macOS notifications when new log entries are detected
- **Tray Menu**: Right-click the tray icon for quick access to app functions
- **Multiple Files**: Monitor several debug.log files from different WordPress installations
- **Activity Tracking**: View recent monitoring activity in the sidebar

### Tray Integration

The app runs in the system tray and provides:
- Show/Hide application window
- Quick access to add new log files
- Quit application

## Configuration

The application automatically saves your watched files configuration to:
```
~/Library/Application Support/debug-log-watcher/config.json
```

### System Requirements

- **macOS**: 10.14 (Mojave) or later
- **Memory**: 50MB RAM
- **Storage**: 10MB disk space
- **Permissions**: File system access for log monitoring

## Development

### Project Structure

```
debug-log-watcher/
├── main.js          # Main Electron process
├── index.html       # Application UI
├── styles.css       # Application styles
├── renderer.js      # Renderer process logic
├── package.json     # Dependencies and scripts
└── assets/          # Application assets
```

### Scripts

- `npm start` - Start the application in development mode
- `npm run build` - Build the application for distribution
- `npm run dev` - Start with development flags

## Troubleshooting

### Common Issues

1. **File not found errors**: Ensure the debug.log file path is correct and the file exists
2. **Permission errors**: Make sure the application has read access to the log files
3. **Notifications not working**: Check macOS notification settings for the application

### Debug Mode

Run the application with debug logging:
```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please create an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Real-time WordPress debug.log monitoring
- macOS notifications
- System tray integration
- Modern UI with activity tracking
