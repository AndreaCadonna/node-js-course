/**
 * Exercise 5 Solution: Secure Plugin Runtime
 *
 * A secure plugin runtime environment that:
 * - Provides plugin isolation (separate VM contexts)
 * - Controls API exposure
 * - Manages plugin lifecycle (load, start, stop, unload)
 * - Enables inter-plugin communication (with security)
 * - Enforces resource limits per plugin
 * - Implements plugin sandboxing
 * - Provides event system
 * - Maintains plugin registry
 */

const vm = require('vm');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

/**
 * PluginRuntime - Secure runtime for loading and executing plugins
 */
class PluginRuntime extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configuration
    this.maxPlugins = options.maxPlugins || 50;
    this.defaultTimeout = options.defaultTimeout || 5000;
    this.defaultMemoryLimit = options.defaultMemoryLimit || 50 * 1024 * 1024;
    this.enableSandbox = options.enableSandbox !== false;

    // Allowed APIs that plugins can access
    this.allowedAPIs = options.allowedAPIs || [
      'console',
      'setTimeout',
      'setInterval',
      'emit',
      'on',
      'storage'
    ];

    // Plugin registry
    this.plugins = new Map();

    // Plugin storage (key-value store per plugin)
    this.storage = new Map();

    // Plugin timers (for cleanup)
    this.timers = new Map();

    // Plugin event listeners
    this.pluginListeners = new Map();

    // Runtime statistics
    this.stats = {
      totalPlugins: 0,
      activePlugins: 0,
      totalExecutions: 0,
      totalErrors: 0
    };
  }

  /**
   * Create plugin API - the interface exposed to plugins
   */
  createPluginAPI(pluginName) {
    const runtime = this;
    const pluginTimers = [];
    const pluginStorage = new Map();

    // Store plugin storage for persistence
    this.storage.set(pluginName, pluginStorage);

    const api = {
      // Limited console
      console: {
        log: (...args) => {
          console.log(`[Plugin:${pluginName}]`, ...args);
        },
        error: (...args) => {
          console.error(`[Plugin:${pluginName}]`, ...args);
        },
        warn: (...args) => {
          console.warn(`[Plugin:${pluginName}]`, ...args);
        },
        info: (...args) => {
          console.info(`[Plugin:${pluginName}]`, ...args);
        }
      },

      // Timers with tracking for cleanup
      setTimeout: (callback, delay, ...args) => {
        const timer = setTimeout(() => {
          try {
            callback(...args);
          } catch (error) {
            runtime.handlePluginError(pluginName, error);
          }
        }, delay);

        pluginTimers.push(timer);
        return timer;
      },

      setInterval: (callback, interval, ...args) => {
        const timer = setInterval(() => {
          try {
            callback(...args);
          } catch (error) {
            runtime.handlePluginError(pluginName, error);
          }
        }, interval);

        pluginTimers.push(timer);
        return timer;
      },

      clearTimeout: (timer) => {
        clearTimeout(timer);
        const index = pluginTimers.indexOf(timer);
        if (index > -1) {
          pluginTimers.splice(index, 1);
        }
      },

      clearInterval: (timer) => {
        clearInterval(timer);
        const index = pluginTimers.indexOf(timer);
        if (index > -1) {
          pluginTimers.splice(index, 1);
        }
      },

      // Event emission (plugins can emit events)
      emit: (event, data) => {
        runtime.emit(`plugin:${pluginName}:${event}`, data);
        runtime.emit('plugin-event', {
          plugin: pluginName,
          event,
          data
        });
      },

      // Event listening (plugins can listen to events)
      on: (event, handler) => {
        const eventName = `plugin:${pluginName}:${event}`;

        if (!runtime.pluginListeners.has(pluginName)) {
          runtime.pluginListeners.set(pluginName, []);
        }

        runtime.pluginListeners.get(pluginName).push({
          event: eventName,
          handler
        });

        runtime.on(eventName, handler);
      },

      // Simple key-value storage
      storage: {
        get: (key) => {
          return pluginStorage.get(key);
        },
        set: (key, value) => {
          pluginStorage.set(key, value);
        },
        has: (key) => {
          return pluginStorage.has(key);
        },
        delete: (key) => {
          return pluginStorage.delete(key);
        },
        clear: () => {
          pluginStorage.clear();
        },
        keys: () => {
          return Array.from(pluginStorage.keys());
        }
      }
    };

    // Store timers for cleanup
    this.timers.set(pluginName, pluginTimers);

    return api;
  }

  /**
   * Create secure isolated context for plugin
   */
  createPluginContext(pluginName, api) {
    // Start with minimal globals
    const context = {
      // Plugin API
      ...api,

      // Safe built-in objects
      Math: Math,
      JSON: JSON,
      Date: Date,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
      Promise: Promise,
      Map: Map,
      Set: Set,

      // Utility functions
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,

      // Module pattern support
      module: { exports: {} },
      exports: {}
    };

    // Link module.exports and exports
    context.exports = context.module.exports;

    // Create VM context
    return vm.createContext(context);
  }

  /**
   * Validate plugin code before loading
   */
  validatePluginCode(code) {
    const validationResult = {
      valid: true,
      errors: []
    };

    // Check code length
    if (code.length > 1024 * 1024) {
      validationResult.valid = false;
      validationResult.errors.push('Plugin code too large (max 1MB)');
    }

    // Check for forbidden patterns (basic security check)
    const forbiddenPatterns = [
      /process\./g,
      /require\(/g,
      /child_process/g,
      /__dirname/g,
      /__filename/g,
      /global\./g
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        validationResult.valid = false;
        validationResult.errors.push(`Forbidden pattern detected: ${pattern}`);
      }
    }

    // Validate syntax
    try {
      new vm.Script(code);
    } catch (error) {
      validationResult.valid = false;
      validationResult.errors.push(`Syntax error: ${error.message}`);
    }

    return validationResult;
  }

  /**
   * Load a plugin
   */
  loadPlugin(name, code, config = {}) {
    // Check if plugin already exists
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} already loaded`);
    }

    // Check plugin limit
    if (this.plugins.size >= this.maxPlugins) {
      throw new Error(`Maximum number of plugins (${this.maxPlugins}) reached`);
    }

    // Validate plugin name
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      throw new Error('Invalid plugin name. Use only alphanumeric characters, hyphens, and underscores');
    }

    // Validate plugin code
    const validation = this.validatePluginCode(code);
    if (!validation.valid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      // Create plugin API
      const api = this.createPluginAPI(name);

      // Create plugin context
      const context = this.createPluginContext(name, api);

      // Execute plugin code to get exports
      const script = new vm.Script(code, {
        filename: `plugin-${name}.js`,
        displayErrors: true
      });

      script.runInContext(context, {
        timeout: this.defaultTimeout,
        displayErrors: true
      });

      // Get plugin exports
      const exports = context.module.exports;

      // Validate plugin exports
      if (!exports || typeof exports !== 'object') {
        throw new Error('Plugin must export an object');
      }

      // Create plugin object
      const plugin = {
        name,
        code,
        context,
        api,
        exports,
        status: 'loaded',
        config: config || {},
        loadedAt: Date.now(),
        startedAt: null,
        stats: {
          totalExecutions: 0,
          totalTime: 0,
          errors: 0,
          apiCalls: {
            console: 0,
            emit: 0,
            storage: 0
          }
        }
      };

      // Store plugin
      this.plugins.set(name, plugin);
      this.stats.totalPlugins++;

      this.emit('plugin-loaded', {
        name,
        status: 'loaded'
      });

      return {
        name,
        status: 'loaded',
        exports: Object.keys(exports),
        loadedAt: plugin.loadedAt
      };

    } catch (error) {
      this.emit('plugin-error', {
        name,
        error: error.message
      });
      throw new Error(`Failed to load plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Start a plugin
   */
  async startPlugin(name) {
    const plugin = this.getPluginOrThrow(name);

    if (plugin.status === 'started') {
      throw new Error(`Plugin ${name} is already started`);
    }

    try {
      // Call plugin's init method if it exists
      if (plugin.exports.init && typeof plugin.exports.init === 'function') {
        await this.executePluginMethodInternal(plugin, 'init', []);
      }

      plugin.status = 'started';
      plugin.startedAt = Date.now();
      this.stats.activePlugins++;

      this.emit('plugin-started', {
        name,
        status: 'started'
      });

    } catch (error) {
      plugin.stats.errors++;
      this.emit('plugin-error', {
        name,
        error: error.message
      });
      throw new Error(`Failed to start plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Stop a plugin
   */
  async stopPlugin(name) {
    const plugin = this.getPluginOrThrow(name);

    if (plugin.status !== 'started') {
      throw new Error(`Plugin ${name} is not running`);
    }

    try {
      // Call plugin's cleanup method if it exists
      if (plugin.exports.cleanup && typeof plugin.exports.cleanup === 'function') {
        await this.executePluginMethodInternal(plugin, 'cleanup', []);
      }

      // Clear all timers
      this.clearPluginTimers(name);

      plugin.status = 'stopped';
      this.stats.activePlugins--;

      this.emit('plugin-stopped', {
        name,
        status: 'stopped'
      });

    } catch (error) {
      plugin.stats.errors++;
      this.emit('plugin-error', {
        name,
        error: error.message
      });
      throw new Error(`Failed to stop plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(name) {
    const plugin = this.getPluginOrThrow(name);

    try {
      // Stop if running
      if (plugin.status === 'started') {
        this.stopPlugin(name);
      }

      // Clear timers
      this.clearPluginTimers(name);

      // Clear event listeners
      this.clearPluginListeners(name);

      // Clear storage
      this.storage.delete(name);

      // Remove from registry
      this.plugins.delete(name);
      this.stats.totalPlugins--;

      this.emit('plugin-unloaded', {
        name
      });

    } catch (error) {
      this.emit('plugin-error', {
        name,
        error: error.message
      });
      throw new Error(`Failed to unload plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Execute a plugin method
   */
  async executePluginMethod(name, method, args = [], timeout) {
    const plugin = this.getPluginOrThrow(name);

    if (plugin.status !== 'started') {
      return {
        success: false,
        error: `Plugin ${name} is not running (status: ${plugin.status})`
      };
    }

    if (!plugin.exports[method] || typeof plugin.exports[method] !== 'function') {
      return {
        success: false,
        error: `Method ${method} not found in plugin ${name}`
      };
    }

    try {
      const result = await this.executePluginMethodInternal(plugin, method, args, timeout);

      return {
        success: true,
        result
      };

    } catch (error) {
      plugin.stats.errors++;
      this.stats.totalErrors++;

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute a plugin method internally (with proper context handling)
   */
  async executePluginMethodInternal(plugin, methodName, args = [], timeout) {
    const startTime = performance.now();

    try {
      // Build the code to execute the method from the context
      // We need to serialize the arguments safely
      const argsJson = JSON.stringify(args);
      const code = `
        (function() {
          const method = module.exports.${methodName};
          if (typeof method === 'function') {
            const args = ${argsJson};
            return method.apply(module.exports, args);
          }
          throw new Error('Method ${methodName} is not a function');
        })()
      `;

      const script = new vm.Script(code, {
        filename: `plugin-${plugin.name}-${methodName}`,
        displayErrors: true
      });

      const result = script.runInContext(plugin.context, {
        timeout: timeout || this.defaultTimeout,
        displayErrors: true
      });

      const executionTime = performance.now() - startTime;

      // Update statistics
      plugin.stats.totalExecutions++;
      plugin.stats.totalTime += executionTime;
      this.stats.totalExecutions++;

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;
      plugin.stats.totalTime += executionTime;

      throw error;
    }
  }

  /**
   * Send a message to a plugin
   */
  async sendMessage(name, event, data) {
    const plugin = this.getPluginOrThrow(name);

    if (plugin.status !== 'started') {
      throw new Error(`Plugin ${name} is not running`);
    }

    // Check if plugin has event handler
    if (!plugin.exports.onMessage || typeof plugin.exports.onMessage !== 'function') {
      throw new Error(`Plugin ${name} does not have an onMessage handler`);
    }

    try {
      const result = await this.executePluginMethodInternal(plugin, 'onMessage', [event, data]);

      return result;

    } catch (error) {
      plugin.stats.errors++;
      throw new Error(`Failed to send message to plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Get plugin information
   */
  getPlugin(name) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      return null;
    }

    return {
      name: plugin.name,
      status: plugin.status,
      loadedAt: plugin.loadedAt,
      startedAt: plugin.startedAt,
      exports: Object.keys(plugin.exports),
      stats: { ...plugin.stats }
    };
  }

  /**
   * List all plugins
   */
  listPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      status: plugin.status,
      memoryUsage: 0, // Would need more complex tracking
      executionCount: plugin.stats.totalExecutions
    }));
  }

  /**
   * Get plugin statistics
   */
  getPluginStats(name) {
    const plugin = this.getPluginOrThrow(name);

    return {
      name: plugin.name,
      totalExecutions: plugin.stats.totalExecutions,
      totalTime: plugin.stats.totalTime,
      averageTime: plugin.stats.totalExecutions > 0
        ? plugin.stats.totalTime / plugin.stats.totalExecutions
        : 0,
      errors: plugin.stats.errors,
      apiCalls: { ...plugin.stats.apiCalls },
      memoryUsage: 0, // Would need v8 heap snapshots for accurate tracking
      uptime: plugin.startedAt ? Date.now() - plugin.startedAt : 0
    };
  }

  /**
   * Get runtime statistics
   */
  getRuntimeStats() {
    let totalMemoryUsed = 0;

    // Calculate approximate memory (would need proper heap snapshots)
    this.plugins.forEach(plugin => {
      // Rough estimation
      totalMemoryUsed += plugin.code.length;
    });

    return {
      totalPlugins: this.stats.totalPlugins,
      activePlugins: this.stats.activePlugins,
      totalExecutions: this.stats.totalExecutions,
      totalMemoryUsed,
      totalErrors: this.stats.totalErrors
    };
  }

  /**
   * Handle plugin errors
   */
  handlePluginError(pluginName, error) {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.stats.errors++;
    }

    this.stats.totalErrors++;

    this.emit('plugin-error', {
      plugin: pluginName,
      error: error.message
    });

    console.error(`[Plugin:${pluginName}] Error:`, error);
  }

  /**
   * Clear all timers for a plugin
   */
  clearPluginTimers(name) {
    const timers = this.timers.get(name);
    if (timers) {
      timers.forEach(timer => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      timers.length = 0;
    }
  }

  /**
   * Clear all event listeners for a plugin
   */
  clearPluginListeners(name) {
    const listeners = this.pluginListeners.get(name);
    if (listeners) {
      listeners.forEach(({ event, handler }) => {
        this.removeListener(event, handler);
      });
      this.pluginListeners.delete(name);
    }
  }

  /**
   * Get plugin or throw error
   */
  getPluginOrThrow(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    return plugin;
  }

  /**
   * Shutdown runtime - stop all plugins
   */
  async shutdown() {
    const pluginNames = Array.from(this.plugins.keys());

    for (const name of pluginNames) {
      try {
        await this.stopPlugin(name);
        this.unloadPlugin(name);
      } catch (error) {
        console.error(`Error shutting down plugin ${name}:`, error);
      }
    }

    this.emit('runtime-shutdown');
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

async function runTests() {
  console.log('Testing Secure Plugin Runtime\n');
  console.log('='.repeat(60));

  const runtime = new PluginRuntime({
    maxPlugins: 10,
    defaultTimeout: 3000,
    enableSandbox: true
  });

  // Test 1: Load plugin
  console.log('\n✓ Test 1: Load Plugin');
  const plugin1 = runtime.loadPlugin('test-plugin', `
    module.exports = {
      init() {
        this.counter = 0;
      },
      increment() {
        return ++this.counter;
      },
      getCount() {
        return this.counter;
      }
    };
  `);
  console.assert(plugin1.name === 'test-plugin', 'Plugin should load');
  console.log('  Plugin loaded:', plugin1.name);

  // Test 2: Start plugin
  console.log('\n✓ Test 2: Start Plugin');
  await runtime.startPlugin('test-plugin');
  const info = runtime.getPlugin('test-plugin');
  console.assert(info.status === 'started', 'Plugin should start');
  console.log('  Plugin started');

  // Test 3: Execute plugin method
  console.log('\n✓ Test 3: Execute Plugin Method');
  const result1 = await runtime.executePluginMethod('test-plugin', 'increment');
  const result2 = await runtime.executePluginMethod('test-plugin', 'increment');
  const count = await runtime.executePluginMethod('test-plugin', 'getCount');
  console.assert(count.result === 2, 'Counter should be 2');
  console.log('  Counter:', count.result);

  // Test 4: Plugin isolation
  console.log('\n✓ Test 4: Plugin Isolation');
  runtime.loadPlugin('plugin2', `
    module.exports = {
      test() {
        return typeof counter; // Should be undefined
      }
    };
  `);
  await runtime.startPlugin('plugin2');
  const isolated = await runtime.executePluginMethod('plugin2', 'test');
  console.assert(isolated.result === 'undefined', 'Plugins should be isolated');
  console.log('  Isolation verified');

  // Test 5: List plugins
  console.log('\n✓ Test 5: List Plugins');
  const plugins = runtime.listPlugins();
  console.assert(plugins.length === 2, 'Should have 2 plugins');
  console.log('  Plugins:', plugins.map(p => p.name).join(', '));

  // Test 6: Plugin stats
  console.log('\n✓ Test 6: Plugin Statistics');
  const stats = runtime.getPluginStats('test-plugin');
  console.assert(stats.totalExecutions > 0, 'Should track executions');
  console.log('  Executions:', stats.totalExecutions);

  // Test 7: Stop plugin
  console.log('\n✓ Test 7: Stop Plugin');
  await runtime.stopPlugin('test-plugin');
  const stopped = runtime.getPlugin('test-plugin');
  console.assert(stopped.status === 'stopped', 'Plugin should stop');
  console.log('  Plugin stopped');

  // Test 8: Unload plugin
  console.log('\n✓ Test 8: Unload Plugin');
  runtime.unloadPlugin('test-plugin');
  const unloaded = runtime.getPlugin('test-plugin');
  console.assert(unloaded === null, 'Plugin should be removed');
  console.log('  Plugin unloaded');

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Export for reuse
module.exports = PluginRuntime;

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
