class DumpServer {
  constructor(config = {}) {
    this.config = {
      port: config.port || 9913,
      ...config
    };

    this.server = null;
    this.app = null;
    this.io = null;
    this.isRunning = false;
    this.dependencies = null;
    this.mainWindow = null;

    this.loadDependencies();
  }

  loadDependencies() {
    try {
      this.dependencies = {
        express: require('express'),
        http: require('http'),
        Server: require("socket.io").Server,
        bodyParser: require('body-parser'),
        cors: require('cors')
      };
      console.log('Dump server dependencies loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load dump server dependencies:', error.message);
      return false;
    }
  }

  isAvailable() {
    return this.dependencies !== null;
  }

  setMainWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  start() {
    if (!this.isAvailable()) {
      console.error('Dump server dependencies not available');
      return { success: false, error: 'Dump server dependencies not available. Please reinstall the application.' };
    }

    if (this.isRunning) {
      console.log('Dump server is already running');
      return { success: true, message: 'Dump server is already running' };
    }

    try {
      this.app = this.dependencies.express();
      this.server = this.dependencies.http.createServer(this.app);
      this.io = new this.dependencies.Server(this.server, {
        cors: {
          origin: "*",
        }
      });

      this.app.use(this.dependencies.cors());
      this.app.use(this.dependencies.bodyParser.json({ limit: '50mb' }));

      this.app.post('/dump', (req, res) => {
        const rawData = req.body;
        console.log('Raw dump data received:', rawData);
        
        // Process different dump formats
        let content = '';
        let time = rawData.time || new Date().toISOString();
        
        if (rawData.html) {
          // Laravel/Symfony dump format with html field
          content = this.formatLaravelDump(rawData.html);
          if (rawData.time) {
            time = rawData.time;
          }
        } else if (rawData.content) {
          content = rawData.content;
        } else if (rawData.dump) {
          content = rawData.dump;
        } else if (rawData.data) {
          content = rawData.data;
        } else {
          content = JSON.stringify(rawData, null, 2);
        }
        
        // Add source information if available
        if (rawData.source) {
          const sourceInfo = `<div class="dump-source">
            <strong>Source:</strong> ${rawData.source.file}:${rawData.source.line}
          </div>`;
          content = sourceInfo + content;
        }
        
        const dumpData = {
          time: time,
          content: content,
          source: rawData.source || null
        };
        
        console.log(`Processed dump data:`, dumpData);
        
        // Broadcast to Socket.IO clients
        this.io.emit('new-dump', dumpData);
        
        // Send to renderer process
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('new-dump', dumpData);
        }
        
        console.log(`Received and broadcasted a new dump at ${dumpData.time}`);
        res.status(200).send('OK');
      });

      this.io.on('connection', (socket) => {
        console.log('A dump viewer connected.');
        socket.on('disconnect', () => {
          console.log('A dump viewer disconnected.');
        });
      });

      this.server.listen(this.config.port, () => {
        console.log(`WP Dump Server is running on http://localhost:${this.config.port}`);
        this.isRunning = true;
      });

      return { success: true, message: `Dump server started on port ${this.config.port}` };
    } catch (error) {
      console.error('Error starting dump server:', error);
      return { success: false, error: error.message };
    }
  }

  stop() {
    if (!this.isRunning) {
      return { success: true, message: 'Dump server is not running' };
    }

    try {
      if (this.server) {
        this.server.close(() => {
          console.log('Dump server stopped');
        });
      }
      this.isRunning = false;
      this.server = null;
      this.app = null;
      this.io = null;
      return { success: true, message: 'Dump server stopped' };
    } catch (error) {
      console.error('Error stopping dump server:', error);
      return { success: false, error: error.message };
    }
  }

  formatLaravelDump(rawHtml) {
    try {
      // Clean up the raw dump text and convert to HTML
      let formatted = rawHtml
        .replace(/\n/g, '<br>')
        .replace(/\s{2,}/g, '&nbsp;&nbsp;')
        .replace(/\{#(\d+)/g, '<span class="sf-dump-note">{#$1</span>')
        .replace(/#(\w+):/g, '<span class="sf-dump-private">#$1:</span>')
        .replace(/\+(\w+):/g, '<span class="sf-dump-public">+$1:</span>')
        .replace(/-(\w+):/g, '<span class="sf-dump-protected">-$1:</span>')
        .replace(/"([^"]+)":/g, '"<span class="sf-dump-key">$1</span>":')
        .replace(/=> "([^"]+)"/g, '=> "<span class="sf-dump-str">$1</span>"')
        .replace(/=> (\d+)/g, '=> <span class="sf-dump-num">$1</span>')
        .replace(/=> (null|true|false)/g, '=> <span class="sf-dump-const">$1</span>')
        .replace(/array:(\d+)/g, '<span class="sf-dump-note">array:$1</span>')
        .replace(/\[([^\]]+)\]/g, '[<span class="sf-dump-index">$1</span>]')
        .replace(/(FluentCart\\[^\s{]+)/g, '<span class="sf-dump-class">$1</span>');
      
      return `<div class="sf-dump laravel-dump"><pre>${formatted}</pre></div>`;
    } catch (error) {
      console.error('Error formatting Laravel dump:', error);
      return `<div class="sf-dump laravel-dump"><pre>${rawHtml}</pre></div>`;
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      port: this.config.port,
      available: this.isAvailable()
    };
  }
}

module.exports = DumpServer;
