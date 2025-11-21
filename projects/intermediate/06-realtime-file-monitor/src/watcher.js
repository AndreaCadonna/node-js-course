const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

/**
 * File Watcher - Watches files and directories for changes
 * Uses fs.watch for efficient, OS-level file system monitoring
 */
class FileWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      recursive: options.recursive !== false,
      persistent: options.persistent !== false,
      encoding: options.encoding || 'utf8',
      ...options
    };

    this.watchers = new Map();
    this.watchedPaths = new Set();
    this.fileStats = new Map();
  }

  /**
   * Watch a file or directory
   */
  watch(targetPath, options = {}) {
    // Resolve to absolute path
    const absolutePath = path.resolve(targetPath);

    // Check if path exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Path does not exist: ${absolutePath}`);
    }

    // Check if already watching
    if (this.watchedPaths.has(absolutePath)) {
      return;
    }

    const stats = fs.statSync(absolutePath);

    if (stats.isDirectory()) {
      this.watchDirectory(absolutePath, options);
    } else {
      this.watchFile(absolutePath, options);
    }

    this.watchedPaths.add(absolutePath);
    this.emit('watching', { path: absolutePath, type: stats.isDirectory() ? 'directory' : 'file' });
  }

  /**
   * Watch a file
   */
  watchFile(filePath, options = {}) {
    try {
      // Store initial stats
      const stats = fs.statSync(filePath);
      this.fileStats.set(filePath, {
        size: stats.size,
        mtime: stats.mtimeMs,
        ctime: stats.ctimeMs
      });

      const watcher = fs.watch(filePath, {
        persistent: this.options.persistent,
        encoding: this.options.encoding
      }, (eventType, filename) => {
        this.handleFileChange(filePath, eventType, filename);
      });

      watcher.on('error', (err) => {
        this.emit('error', { path: filePath, error: err });
      });

      this.watchers.set(filePath, watcher);

    } catch (err) {
      this.emit('error', { path: filePath, error: err });
    }
  }

  /**
   * Watch a directory
   */
  watchDirectory(dirPath, options = {}) {
    try {
      const watcher = fs.watch(dirPath, {
        persistent: this.options.persistent,
        recursive: this.options.recursive,
        encoding: this.options.encoding
      }, (eventType, filename) => {
        this.handleDirectoryChange(dirPath, eventType, filename);
      });

      watcher.on('error', (err) => {
        this.emit('error', { path: dirPath, error: err });
      });

      this.watchers.set(dirPath, watcher);

      // Watch existing files in directory if recursive
      if (this.options.recursive) {
        this.scanDirectory(dirPath);
      }

    } catch (err) {
      this.emit('error', { path: dirPath, error: err });
    }
  }

  /**
   * Scan directory and store file stats
   */
  scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          this.fileStats.set(fullPath, {
            size: stats.size,
            mtime: stats.mtimeMs,
            ctime: stats.ctimeMs
          });
        } else if (entry.isDirectory() && this.options.recursive) {
          this.scanDirectory(fullPath);
        }
      }
    } catch (err) {
      this.emit('error', { path: dirPath, error: err });
    }
  }

  /**
   * Handle file change event
   */
  handleFileChange(filePath, eventType, filename) {
    // Check if file still exists
    const exists = fs.existsSync(filePath);

    if (!exists) {
      // File was deleted
      const oldStats = this.fileStats.get(filePath);
      this.fileStats.delete(filePath);

      this.emit('change', {
        type: 'deleted',
        path: filePath,
        filename: path.basename(filePath),
        directory: path.dirname(filePath),
        timestamp: new Date(),
        oldStats
      });

      // Remove watcher
      const watcher = this.watchers.get(filePath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(filePath);
      }

      return;
    }

    // Get current stats
    const stats = fs.statSync(filePath);
    const oldStats = this.fileStats.get(filePath);

    // Determine change type
    let changeType = 'modified';

    if (!oldStats) {
      changeType = 'created';
    } else if (stats.mtimeMs !== oldStats.mtime) {
      changeType = 'modified';
    } else if (stats.ctimeMs !== oldStats.ctime) {
      changeType = 'changed'; // Metadata changed
    }

    // Update stored stats
    this.fileStats.set(filePath, {
      size: stats.size,
      mtime: stats.mtimeMs,
      ctime: stats.ctimeMs
    });

    this.emit('change', {
      type: changeType,
      path: filePath,
      filename: path.basename(filePath),
      directory: path.dirname(filePath),
      timestamp: new Date(),
      stats: {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime
      },
      oldStats
    });
  }

  /**
   * Handle directory change event
   */
  handleDirectoryChange(dirPath, eventType, filename) {
    if (!filename) return;

    const fullPath = path.join(dirPath, filename);

    // Check if file/directory exists
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      // File/directory was deleted
      const oldStats = this.fileStats.get(fullPath);
      this.fileStats.delete(fullPath);

      this.emit('change', {
        type: 'deleted',
        path: fullPath,
        filename: filename,
        directory: dirPath,
        timestamp: new Date(),
        oldStats
      });

      return;
    }

    // Get stats
    const stats = fs.statSync(fullPath);
    const oldStats = this.fileStats.get(fullPath);

    // Determine change type
    let changeType;

    if (!oldStats) {
      changeType = stats.isDirectory() ? 'directory-created' : 'created';
    } else if (stats.mtimeMs !== oldStats.mtime) {
      changeType = 'modified';
    } else if (stats.ctimeMs !== oldStats.ctime) {
      changeType = 'changed';
    } else {
      return; // No actual change
    }

    // Update stored stats
    this.fileStats.set(fullPath, {
      size: stats.size,
      mtime: stats.mtimeMs,
      ctime: stats.ctimeMs
    });

    this.emit('change', {
      type: changeType,
      path: fullPath,
      filename: filename,
      directory: dirPath,
      timestamp: new Date(),
      stats: {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        isDirectory: stats.isDirectory()
      },
      oldStats
    });

    // If new directory and recursive, scan it
    if (changeType === 'directory-created' && this.options.recursive) {
      this.scanDirectory(fullPath);
    }
  }

  /**
   * Unwatch a path
   */
  unwatch(targetPath) {
    const absolutePath = path.resolve(targetPath);

    const watcher = this.watchers.get(absolutePath);
    if (watcher) {
      watcher.close();
      this.watchers.delete(absolutePath);
      this.watchedPaths.delete(absolutePath);
      this.emit('unwatched', { path: absolutePath });
    }
  }

  /**
   * Unwatch all paths
   */
  unwatchAll() {
    for (const [path, watcher] of this.watchers) {
      watcher.close();
      this.emit('unwatched', { path });
    }

    this.watchers.clear();
    this.watchedPaths.clear();
    this.fileStats.clear();
  }

  /**
   * Get list of watched paths
   */
  getWatchedPaths() {
    return Array.from(this.watchedPaths);
  }

  /**
   * Check if path is being watched
   */
  isWatching(targetPath) {
    const absolutePath = path.resolve(targetPath);
    return this.watchedPaths.has(absolutePath);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      watchedPaths: this.watchedPaths.size,
      trackedFiles: this.fileStats.size,
      activeWatchers: this.watchers.size
    };
  }

  /**
   * Close all watchers
   */
  close() {
    this.unwatchAll();
    this.emit('closed');
  }
}

module.exports = FileWatcher;
