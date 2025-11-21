/**
 * Sandbox
 * Secure plugin execution environment using VM
 */

const vm = require('vm');
const { EventEmitter } = require('events');

class Sandbox extends EventEmitter {
  constructor(plugin, api) {
    super();

    this.plugin = plugin;
    this.api = api;
    this.context = null;
    this.memoryUsage = 0;
    this.cpuTime = 0;
  }

  /**
   * Create sandbox context
   */
  createContext() {
    // Safe console for plugin logging
    const safeConsole = {
      log: (...args) => this.emit('log', { level: 'info', args }),
      info: (...args) => this.emit('log', { level: 'info', args }),
      warn: (...args) => this.emit('log', { level: 'warn', args }),
      error: (...args) => this.emit('log', { level: 'error', args })
    };

    // Restricted global objects
    const contextGlobal = {
      console: safeConsole,
      setTimeout: this.createTimerFunction('setTimeout'),
      setInterval: this.createTimerFunction('setInterval'),
      clearTimeout: (id) => clearTimeout(id),
      clearInterval: (id) => clearInterval(id),
      Buffer: {
        from: Buffer.from.bind(Buffer),
        alloc: Buffer.alloc.bind(Buffer),
        concat: Buffer.concat.bind(Buffer),
        isBuffer: Buffer.isBuffer.bind(Buffer)
      },
      Promise,
      Error,
      TypeError,
      RangeError,
      JSON,
      Math,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,

      // Plugin-specific
      __plugin__: {
        id: this.plugin.id,
        name: this.plugin.name,
        version: this.plugin.version
      },

      // Plugin API
      __api__: this.createPluginAPI(),

      // Module exports
      module: { exports: {} },
      exports: {}
    };

    // Sync exports
    contextGlobal.module.exports = contextGlobal.exports;

    // Create and freeze context
    this.context = vm.createContext(contextGlobal, {
      name: `plugin-${this.plugin.id}`,
      codeGeneration: {
        strings: false, // Disable eval()
        wasm: false     // Disable WebAssembly
      }
    });

    return this.context;
  }

  /**
   * Create timer function with resource limits
   */
  createTimerFunction(name) {
    const timers = new Set();
    const maxTimers = 100;

    return (callback, delay, ...args) => {
      if (timers.size >= maxTimers) {
        throw new Error(`Maximum number of ${name} exceeded (${maxTimers})`);
      }

      const wrappedCallback = () => {
        try {
          callback(...args);
        } catch (error) {
          this.emit('error', error);
        } finally {
          timers.delete(id);
        }
      };

      const id = global[name](wrappedCallback, delay);
      timers.add(id);

      return id;
    };
  }

  /**
   * Create plugin API based on permissions
   */
  createPluginAPI() {
    const pluginAPI = {};

    // File system access (if permitted)
    if (this.plugin.hasPermission('fs')) {
      pluginAPI.fs = this.createFileSystemAPI();
    }

    // Network access (if permitted)
    if (this.plugin.hasPermission('network')) {
      pluginAPI.network = this.createNetworkAPI();
    }

    // Storage access (if permitted)
    if (this.plugin.hasPermission('storage')) {
      pluginAPI.storage = this.createStorageAPI();
    }

    // Events (if permitted)
    if (this.plugin.hasPermission('events')) {
      pluginAPI.events = this.createEventsAPI();
    }

    // Crypto utilities (always available)
    pluginAPI.crypto = this.createCryptoAPI();

    // Plugin utilities (always available)
    pluginAPI.utils = this.createUtilsAPI();

    return pluginAPI;
  }

  /**
   * Create file system API
   */
  createFileSystemAPI() {
    return {
      readFile: async (filePath) => {
        this.checkPermission('fs');
        return await this.api.fs.readFile(this.plugin.id, filePath);
      },
      writeFile: async (filePath, data) => {
        this.checkPermission('fs');
        return await this.api.fs.writeFile(this.plugin.id, filePath, data);
      },
      exists: async (filePath) => {
        this.checkPermission('fs');
        return await this.api.fs.exists(this.plugin.id, filePath);
      },
      listFiles: async (dirPath) => {
        this.checkPermission('fs');
        return await this.api.fs.listFiles(this.plugin.id, dirPath);
      }
    };
  }

  /**
   * Create network API
   */
  createNetworkAPI() {
    return {
      fetch: async (url, options) => {
        this.checkPermission('network');
        return await this.api.network.fetch(this.plugin.id, url, options);
      },
      request: async (options) => {
        this.checkPermission('network');
        return await this.api.network.request(this.plugin.id, options);
      }
    };
  }

  /**
   * Create storage API
   */
  createStorageAPI() {
    return {
      get: async (key) => {
        this.checkPermission('storage');
        return await this.api.storage.get(this.plugin.id, key);
      },
      set: async (key, value) => {
        this.checkPermission('storage');
        return await this.api.storage.set(this.plugin.id, key, value);
      },
      delete: async (key) => {
        this.checkPermission('storage');
        return await this.api.storage.delete(this.plugin.id, key);
      },
      list: async () => {
        this.checkPermission('storage');
        return await this.api.storage.list(this.plugin.id);
      }
    };
  }

  /**
   * Create events API
   */
  createEventsAPI() {
    return {
      emit: (eventName, data) => {
        this.checkPermission('events');
        this.api.events.emit(this.plugin.id, eventName, data);
      },
      on: (eventName, handler) => {
        this.checkPermission('events');
        this.api.events.on(this.plugin.id, eventName, handler);
      },
      off: (eventName, handler) => {
        this.checkPermission('events');
        this.api.events.off(this.plugin.id, eventName, handler);
      }
    };
  }

  /**
   * Create crypto API
   */
  createCryptoAPI() {
    const crypto = require('crypto');

    return {
      randomBytes: (size) => {
        if (size > 1024) {
          throw new Error('Maximum random bytes size is 1024');
        }
        return crypto.randomBytes(size);
      },
      createHash: (algorithm) => {
        const allowed = ['sha256', 'sha512', 'md5'];
        if (!allowed.includes(algorithm)) {
          throw new Error(`Hash algorithm not allowed: ${algorithm}`);
        }
        return crypto.createHash(algorithm);
      },
      randomUUID: () => crypto.randomUUID()
    };
  }

  /**
   * Create utils API
   */
  createUtilsAPI() {
    return {
      sleep: (ms) => {
        if (ms > 10000) {
          throw new Error('Maximum sleep time is 10000ms');
        }
        return new Promise(resolve => setTimeout(resolve, ms));
      },
      timestamp: () => Date.now(),
      date: () => new Date().toISOString()
    };
  }

  /**
   * Check permission
   */
  checkPermission(permission) {
    if (!this.plugin.hasPermission(permission)) {
      throw new Error(`Plugin ${this.plugin.id} does not have permission: ${permission}`);
    }
  }

  /**
   * Execute code in sandbox
   */
  async execute(code, options = {}) {
    const timeout = options.timeout || this.plugin.resources.timeoutLimit;

    try {
      // Create script
      const script = new vm.Script(code, {
        filename: `${this.plugin.id}.js`,
        displayErrors: true
      });

      // Run with timeout
      const result = script.runInContext(this.context, {
        timeout,
        breakOnSigint: true
      });

      return result;
    } catch (error) {
      if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        throw new Error(`Plugin ${this.plugin.id} execution timeout (${timeout}ms)`);
      }
      throw error;
    }
  }

  /**
   * Execute plugin function
   */
  async executeFunction(functionName, args = []) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      // Get function from exports
      const fn = this.context.module.exports[functionName];

      if (!fn || typeof fn !== 'function') {
        throw new Error(`Function ${functionName} not found in plugin ${this.plugin.id}`);
      }

      // Check memory limit
      const currentMemory = process.memoryUsage().heapUsed;
      if (currentMemory > this.plugin.resources.memoryLimit) {
        throw new Error(`Plugin ${this.plugin.id} exceeded memory limit`);
      }

      // Execute with timeout
      const timeout = this.plugin.resources.timeoutLimit;
      const result = await this.executeWithTimeout(() => fn(...args), timeout);

      // Track resource usage
      const executionTime = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      this.memoryUsage = memoryUsed;
      this.cpuTime += executionTime;

      this.emit('execution', {
        functionName,
        executionTime,
        memoryUsed,
        success: true
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.emit('execution', {
        functionName,
        executionTime,
        error: error.message,
        success: false
      });

      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(fn, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timeout (${timeout}ms)`));
      }, timeout);

      try {
        Promise.resolve(fn())
          .then(result => {
            clearTimeout(timer);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timer);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Get resource usage
   */
  getResourceUsage() {
    return {
      memoryUsage: this.memoryUsage,
      cpuTime: this.cpuTime,
      memoryLimit: this.plugin.resources.memoryLimit,
      timeoutLimit: this.plugin.resources.timeoutLimit,
      memoryPercent: (this.memoryUsage / this.plugin.resources.memoryLimit) * 100,
      cpuPercent: (this.cpuTime / this.plugin.resources.cpuLimit) * 100
    };
  }

  /**
   * Cleanup sandbox
   */
  cleanup() {
    this.context = null;
    this.removeAllListeners();
  }
}

module.exports = Sandbox;
