/**
 * Plugin API
 * Safe API interfaces for plugins to interact with the system
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');

class PluginAPI {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.storageDir = path.join(this.dataDir, 'storage');
    this.pluginDataDir = path.join(this.dataDir, 'plugins');

    this.eventBus = new EventEmitter();
    this.storage = new Map();

    // Network restrictions
    this.allowedDomains = options.allowedDomains || [];
    this.blockedDomains = options.blockedDomains || [];
    this.maxRequestSize = options.maxRequestSize || 10 * 1024 * 1024; // 10MB
    this.requestTimeout = options.requestTimeout || 30000; // 30s
  }

  /**
   * Initialize API
   */
  async initialize() {
    await fs.promises.mkdir(this.storageDir, { recursive: true });
    await fs.promises.mkdir(this.pluginDataDir, { recursive: true });

    // Load storage from disk
    await this.loadStorage();
  }

  /**
   * File System API
   */
  fs = {
    /**
     * Read file (sandboxed to plugin directory)
     */
    readFile: async (pluginId, filePath) => {
      const safePath = this.getSafePluginPath(pluginId, filePath);
      return await fs.promises.readFile(safePath, 'utf8');
    },

    /**
     * Write file (sandboxed to plugin directory)
     */
    writeFile: async (pluginId, filePath, data) => {
      const safePath = this.getSafePluginPath(pluginId, filePath);
      await fs.promises.mkdir(path.dirname(safePath), { recursive: true });
      return await fs.promises.writeFile(safePath, data, 'utf8');
    },

    /**
     * Check if file exists
     */
    exists: async (pluginId, filePath) => {
      const safePath = this.getSafePluginPath(pluginId, filePath);
      try {
        await fs.promises.access(safePath);
        return true;
      } catch {
        return false;
      }
    },

    /**
     * List files in directory
     */
    listFiles: async (pluginId, dirPath = '.') => {
      const safePath = this.getSafePluginPath(pluginId, dirPath);
      const entries = await fs.promises.readdir(safePath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile()
      }));
    }
  };

  /**
   * Network API
   */
  network = {
    /**
     * Make HTTP/HTTPS request
     */
    fetch: async (pluginId, url, options = {}) => {
      this.validateURL(url);

      return new Promise((resolve, reject) => {
        const parsedURL = new URL(url);
        const protocol = parsedURL.protocol === 'https:' ? https : http;

        const requestOptions = {
          method: options.method || 'GET',
          headers: options.headers || {},
          timeout: this.requestTimeout
        };

        const req = protocol.request(url, requestOptions, (res) => {
          let data = '';
          let size = 0;

          res.on('data', (chunk) => {
            size += chunk.length;
            if (size > this.maxRequestSize) {
              req.destroy();
              reject(new Error('Response size exceeds limit'));
              return;
            }
            data += chunk;
          });

          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: data
            });
          });
        });

        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        if (options.body) {
          req.write(options.body);
        }

        req.end();
      });
    },

    /**
     * Make generic network request
     */
    request: async (pluginId, options) => {
      if (!options.url) {
        throw new Error('URL is required');
      }
      return await this.network.fetch(pluginId, options.url, options);
    }
  };

  /**
   * Storage API (key-value store)
   */
  storage = {
    /**
     * Get value from storage
     */
    get: async (pluginId, key) => {
      const storageKey = `${pluginId}:${key}`;
      return this.storage.get(storageKey);
    },

    /**
     * Set value in storage
     */
    set: async (pluginId, key, value) => {
      const storageKey = `${pluginId}:${key}`;
      this.storage.set(storageKey, value);
      await this.persistStorage();
      return true;
    },

    /**
     * Delete value from storage
     */
    delete: async (pluginId, key) => {
      const storageKey = `${pluginId}:${key}`;
      const deleted = this.storage.delete(storageKey);
      if (deleted) {
        await this.persistStorage();
      }
      return deleted;
    },

    /**
     * List all keys for plugin
     */
    list: async (pluginId) => {
      const prefix = `${pluginId}:`;
      const keys = [];

      for (const key of this.storage.keys()) {
        if (key.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    }
  };

  /**
   * Events API
   */
  events = {
    /**
     * Emit event
     */
    emit: (pluginId, eventName, data) => {
      const qualifiedEvent = `plugin:${pluginId}:${eventName}`;
      this.eventBus.emit(qualifiedEvent, data);
    },

    /**
     * Listen to event
     */
    on: (pluginId, eventName, handler) => {
      const qualifiedEvent = `plugin:${pluginId}:${eventName}`;
      this.eventBus.on(qualifiedEvent, handler);
    },

    /**
     * Remove event listener
     */
    off: (pluginId, eventName, handler) => {
      const qualifiedEvent = `plugin:${pluginId}:${eventName}`;
      this.eventBus.off(qualifiedEvent, handler);
    }
  };

  /**
   * Get safe plugin path (prevent directory traversal)
   */
  getSafePluginPath(pluginId, filePath) {
    const pluginDir = path.join(this.pluginDataDir, pluginId);
    const resolvedPath = path.resolve(pluginDir, filePath);

    // Ensure path is within plugin directory
    if (!resolvedPath.startsWith(pluginDir)) {
      throw new Error('Access denied: path outside plugin directory');
    }

    return resolvedPath;
  }

  /**
   * Validate URL
   */
  validateURL(url) {
    let parsedURL;

    try {
      parsedURL = new URL(url);
    } catch {
      throw new Error('Invalid URL');
    }

    // Check protocol
    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are allowed');
    }

    // Check allowed domains
    if (this.allowedDomains.length > 0) {
      const allowed = this.allowedDomains.some(domain =>
        parsedURL.hostname.endsWith(domain)
      );

      if (!allowed) {
        throw new Error(`Domain not allowed: ${parsedURL.hostname}`);
      }
    }

    // Check blocked domains
    if (this.blockedDomains.length > 0) {
      const blocked = this.blockedDomains.some(domain =>
        parsedURL.hostname.endsWith(domain)
      );

      if (blocked) {
        throw new Error(`Domain blocked: ${parsedURL.hostname}`);
      }
    }

    return true;
  }

  /**
   * Load storage from disk
   */
  async loadStorage() {
    const storagePath = path.join(this.storageDir, 'storage.json');

    try {
      const data = await fs.promises.readFile(storagePath, 'utf8');
      const parsed = JSON.parse(data);

      this.storage = new Map(Object.entries(parsed));
    } catch (error) {
      // Storage file doesn't exist yet
      if (error.code !== 'ENOENT') {
        console.error('Failed to load storage:', error);
      }
    }
  }

  /**
   * Persist storage to disk
   */
  async persistStorage() {
    const storagePath = path.join(this.storageDir, 'storage.json');
    const data = Object.fromEntries(this.storage);

    await fs.promises.writeFile(
      storagePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
  }

  /**
   * Get API statistics
   */
  getStats() {
    return {
      storage: {
        keys: this.storage.size,
        size: JSON.stringify(Object.fromEntries(this.storage)).length
      },
      events: {
        listeners: this.eventBus.listenerCount()
      }
    };
  }

  /**
   * Cleanup API resources
   */
  async cleanup() {
    await this.persistStorage();
    this.eventBus.removeAllListeners();
  }
}

module.exports = PluginAPI;
