/**
 * Example 6: Plugin System with VM
 *
 * This example demonstrates how to design a plugin architecture using VM
 * for safe plugin loading, isolation, lifecycle management, and controlled
 * inter-plugin communication.
 *
 * Topics covered:
 * - Plugin loading and isolation
 * - Plugin lifecycle (init, run, cleanup)
 * - Inter-plugin communication
 * - Plugin API design
 * - Plugin sandboxing and security
 */

const vm = require('vm');
const { EventEmitter } = require('events');

// ============================================================================
// 1. Basic Plugin System
// ============================================================================

console.log('=== 1. Basic Plugin System ===\n');

/**
 * Simple plugin system
 */
class BasicPluginSystem {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Load a plugin from code
   */
  load(name, code) {
    // Create sandbox for plugin
    const sandbox = {
      console,
      exports: {}
    };

    vm.createContext(sandbox);

    try {
      // Execute plugin code
      vm.runInContext(code, sandbox, { timeout: 5000 });

      // Store plugin
      this.plugins.set(name, {
        name,
        exports: sandbox.exports,
        context: sandbox
      });

      console.log(`Plugin '${name}' loaded successfully`);
    } catch (err) {
      console.error(`Failed to load plugin '${name}':`, err.message);
    }
  }

  /**
   * Get a plugin
   */
  get(name) {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.exports : null;
  }

  /**
   * Unload a plugin
   */
  unload(name) {
    this.plugins.delete(name);
    console.log(`Plugin '${name}' unloaded`);
  }

  /**
   * List all plugins
   */
  list() {
    return Array.from(this.plugins.keys());
  }
}

// Demo basic plugin system
const basicSystem = new BasicPluginSystem();

// Load a simple plugin
basicSystem.load('greeter', `
  exports.greet = function(name) {
    return 'Hello, ' + name + '!';
  };

  exports.farewell = function(name) {
    return 'Goodbye, ' + name + '!';
  };
`);

const greeter = basicSystem.get('greeter');
console.log(greeter.greet('World'));
console.log(greeter.farewell('World'));
console.log('Loaded plugins:', basicSystem.list());
console.log();

// ============================================================================
// 2. Plugin System with Lifecycle
// ============================================================================

console.log('=== 2. Plugin System with Lifecycle ===\n');

/**
 * Plugin system with lifecycle hooks
 */
class LifecyclePluginSystem {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Load and initialize a plugin
   */
  async load(name, code, config = {}) {
    const sandbox = {
      console,
      config,
      plugin: {
        name,
        init: null,
        run: null,
        cleanup: null
      }
    };

    vm.createContext(sandbox);

    try {
      // Execute plugin code
      vm.runInContext(code, sandbox, { timeout: 5000 });

      const plugin = {
        name,
        context: sandbox,
        config,
        state: 'loaded'
      };

      this.plugins.set(name, plugin);

      // Call init if available
      if (sandbox.plugin.init) {
        console.log(`Initializing plugin '${name}'...`);
        const initScript = new vm.Script('plugin.init(config)');
        await initScript.runInContext(sandbox);
        plugin.state = 'initialized';
      }

      console.log(`Plugin '${name}' loaded and initialized`);
      return true;
    } catch (err) {
      console.error(`Failed to load plugin '${name}':`, err.message);
      return false;
    }
  }

  /**
   * Run a plugin
   */
  async run(name, input) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      throw new Error(`Plugin '${name}' not found`);
    }

    if (!plugin.context.plugin.run) {
      throw new Error(`Plugin '${name}' has no run method`);
    }

    try {
      plugin.state = 'running';
      const script = new vm.Script(`plugin.run(input)`);

      // Pass input to context
      plugin.context.input = input;

      const result = script.runInContext(plugin.context, { timeout: 10000 });
      plugin.state = 'idle';
      return result;
    } catch (err) {
      plugin.state = 'error';
      throw new Error(`Plugin '${name}' run error: ${err.message}`);
    }
  }

  /**
   * Cleanup and unload a plugin
   */
  async unload(name) {
    const plugin = this.plugins.get(name);

    if (!plugin) {
      return;
    }

    // Call cleanup if available
    if (plugin.context.plugin.cleanup) {
      console.log(`Cleaning up plugin '${name}'...`);
      const cleanupScript = new vm.Script('plugin.cleanup()');
      await cleanupScript.runInContext(plugin.context);
    }

    this.plugins.delete(name);
    console.log(`Plugin '${name}' unloaded`);
  }

  /**
   * Get plugin state
   */
  getState(name) {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.state : null;
  }
}

// Demo lifecycle system
const lifecycleSystem = new LifecyclePluginSystem();

const calculatorPlugin = `
  // Initialize plugin
  plugin.init = function(config) {
    console.log('Calculator plugin initialized with config:', config);
    this.precision = config.precision || 2;
  };

  // Main plugin logic
  plugin.run = function(input) {
    const { operation, a, b } = input;

    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        result = b !== 0 ? a / b : 'Error: Division by zero';
        break;
      default:
        result = 'Unknown operation';
    }

    if (typeof result === 'number') {
      result = Number(result.toFixed(this.precision));
    }

    return result;
  };

  // Cleanup plugin
  plugin.cleanup = function() {
    console.log('Calculator plugin cleaned up');
  };
`;

(async () => {
  await lifecycleSystem.load('calculator', calculatorPlugin, { precision: 3 });

  console.log('\nRunning calculations:');
  console.log('Add:', await lifecycleSystem.run('calculator', { operation: 'add', a: 5, b: 3 }));
  console.log('Multiply:', await lifecycleSystem.run('calculator', { operation: 'multiply', a: 7, b: 6 }));
  console.log('Divide:', await lifecycleSystem.run('calculator', { operation: 'divide', a: 10, b: 3 }));

  await lifecycleSystem.unload('calculator');
  console.log();

  continueExamples();
})();

function continueExamples() {
  // ============================================================================
  // 3. Plugin System with Events
  // ============================================================================

  console.log('=== 3. Plugin System with Events ===\n');

  /**
   * Plugin system with event-based communication
   */
  class EventPluginSystem extends EventEmitter {
    constructor() {
      super();
      this.plugins = new Map();
    }

    load(name, code) {
      const self = this;

      const sandbox = {
        console,
        plugin: {
          name,
          emit: (event, data) => {
            self.emit(`plugin:${name}:${event}`, data);
          },
          on: (event, handler) => {
            self.on(`plugin:${name}:${event}`, handler);
          }
        },
        exports: {}
      };

      vm.createContext(sandbox);

      try {
        vm.runInContext(code, sandbox, { timeout: 5000 });

        this.plugins.set(name, {
          name,
          exports: sandbox.exports,
          context: sandbox
        });

        console.log(`Plugin '${name}' loaded`);
        this.emit('plugin:loaded', { name });
      } catch (err) {
        console.error(`Failed to load plugin '${name}':`, err.message);
      }
    }

    call(name, method, ...args) {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        throw new Error(`Plugin '${name}' not found`);
      }

      if (!plugin.exports[method]) {
        throw new Error(`Plugin '${name}' has no method '${method}'`);
      }

      return plugin.exports[method](...args);
    }
  }

  // Demo event system
  const eventSystem = new EventPluginSystem();

  // Listen for plugin events
  eventSystem.on('plugin:loaded', ({ name }) => {
    console.log(`[System] Plugin loaded: ${name}`);
  });

  eventSystem.on('plugin:logger:log', (data) => {
    console.log(`[Logger Event] ${data.level}: ${data.message}`);
  });

  eventSystem.load('logger', `
    exports.log = function(level, message) {
      plugin.emit('log', { level, message });
    };

    exports.info = function(message) {
      this.log('INFO', message);
    };

    exports.error = function(message) {
      this.log('ERROR', message);
    };
  `);

  const logger = eventSystem.plugins.get('logger').exports;
  logger.info('This is an info message');
  logger.error('This is an error message');
  console.log();

  // ============================================================================
  // 4. Plugin System with API
  // ============================================================================

  console.log('=== 4. Plugin System with API ===\n');

  /**
   * Plugin system with structured API
   */
  class APIPluginSystem {
    constructor() {
      this.plugins = new Map();
      this.sharedData = new Map();
    }

    createAPI(pluginName) {
      return {
        // Storage API
        storage: {
          get: (key) => this.sharedData.get(`${pluginName}:${key}`),
          set: (key, value) => this.sharedData.set(`${pluginName}:${key}`, value),
          delete: (key) => this.sharedData.delete(`${pluginName}:${key}`)
        },

        // Logging API
        log: {
          info: (msg) => console.log(`[${pluginName}] INFO:`, msg),
          warn: (msg) => console.log(`[${pluginName}] WARN:`, msg),
          error: (msg) => console.log(`[${pluginName}] ERROR:`, msg)
        },

        // HTTP-like API (mocked)
        http: {
          get: (url) => {
            return Promise.resolve({
              status: 200,
              data: `Mocked data from ${url}`
            });
          }
        },

        // Plugin info
        info: {
          name: pluginName,
          version: '1.0.0'
        }
      };
    }

    load(name, code) {
      const api = this.createAPI(name);

      const sandbox = {
        console,
        api,
        exports: {},
        Promise
      };

      vm.createContext(sandbox);

      try {
        vm.runInContext(code, sandbox, { timeout: 5000 });

        this.plugins.set(name, {
          name,
          exports: sandbox.exports,
          context: sandbox,
          api
        });

        console.log(`Plugin '${name}' loaded with API`);
      } catch (err) {
        console.error(`Failed to load plugin '${name}':`, err.message);
      }
    }

    call(name, method, ...args) {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        throw new Error(`Plugin '${name}' not found`);
      }

      if (!plugin.exports[method]) {
        throw new Error(`Plugin '${name}' has no method '${method}'`);
      }

      return plugin.exports[method](...args);
    }
  }

  // Demo API system
  const apiSystem = new APIPluginSystem();

  apiSystem.load('counter', `
    let count = 0;

    exports.increment = function() {
      count++;
      const stored = api.storage.get('total') || 0;
      api.storage.set('total', stored + 1);
      api.log.info('Counter incremented to ' + count);
      return count;
    };

    exports.getTotal = function() {
      return api.storage.get('total') || 0;
    };

    exports.reset = function() {
      count = 0;
      api.storage.set('total', 0);
      api.log.warn('Counter reset');
    };
  `);

  console.log('Increment:', apiSystem.call('counter', 'increment'));
  console.log('Increment:', apiSystem.call('counter', 'increment'));
  console.log('Total:', apiSystem.call('counter', 'getTotal'));
  apiSystem.call('counter', 'reset');
  console.log('After reset:', apiSystem.call('counter', 'getTotal'));
  console.log();

  // ============================================================================
  // 5. Plugin System with Dependencies
  // ============================================================================

  console.log('=== 5. Plugin System with Dependencies ===\n');

  /**
   * Plugin system supporting plugin dependencies
   */
  class DependencyPluginSystem {
    constructor() {
      this.plugins = new Map();
    }

    load(name, code, dependencies = []) {
      // Check if dependencies are loaded
      for (const dep of dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Dependency '${dep}' not loaded for plugin '${name}'`);
        }
      }

      // Create dependency object
      const deps = {};
      for (const dep of dependencies) {
        deps[dep] = this.plugins.get(dep).exports;
      }

      const sandbox = {
        console,
        deps,
        exports: {}
      };

      vm.createContext(sandbox);

      try {
        vm.runInContext(code, sandbox, { timeout: 5000 });

        this.plugins.set(name, {
          name,
          exports: sandbox.exports,
          context: sandbox,
          dependencies
        });

        console.log(`Plugin '${name}' loaded with dependencies: [${dependencies.join(', ')}]`);
      } catch (err) {
        console.error(`Failed to load plugin '${name}':`, err.message);
      }
    }

    unload(name) {
      // Check if any plugin depends on this one
      for (const [pluginName, plugin] of this.plugins.entries()) {
        if (plugin.dependencies.includes(name)) {
          throw new Error(`Cannot unload '${name}': plugin '${pluginName}' depends on it`);
        }
      }

      this.plugins.delete(name);
      console.log(`Plugin '${name}' unloaded`);
    }

    get(name) {
      const plugin = this.plugins.get(name);
      return plugin ? plugin.exports : null;
    }
  }

  // Demo dependency system
  const depSystem = new DependencyPluginSystem();

  // Load base plugin
  depSystem.load('math', `
    exports.add = (a, b) => a + b;
    exports.multiply = (a, b) => a * b;
  `);

  // Load plugin that depends on math
  depSystem.load('statistics', `
    exports.sum = function(numbers) {
      return numbers.reduce((acc, n) => deps.math.add(acc, n), 0);
    };

    exports.average = function(numbers) {
      return this.sum(numbers) / numbers.length;
    };
  `, ['math']);

  const stats = depSystem.get('statistics');
  console.log('Sum:', stats.sum([1, 2, 3, 4, 5]));
  console.log('Average:', stats.average([10, 20, 30, 40]));

  // Try to unload math (should fail)
  try {
    depSystem.unload('math');
  } catch (err) {
    console.log('Expected error:', err.message);
  }
  console.log();

  // ============================================================================
  // 6. Complete Plugin System
  // ============================================================================

  console.log('=== 6. Complete Plugin System ===\n');

  /**
   * Full-featured plugin system
   */
  class PluginSystem extends EventEmitter {
    constructor(options = {}) {
      super();
      this.plugins = new Map();
      this.config = options;
    }

    createSandbox(name, dependencies = []) {
      const deps = {};
      for (const dep of dependencies) {
        if (this.plugins.has(dep)) {
          deps[dep] = this.plugins.get(dep).exports;
        }
      }

      return {
        console,
        setTimeout,
        clearTimeout,
        Promise,
        JSON,
        Math,
        deps,
        api: {
          emit: (event, data) => this.emit(`plugin:${name}:${event}`, data),
          log: (level, msg) => console.log(`[${name}] ${level}:`, msg)
        },
        plugin: {
          name,
          init: null,
          run: null,
          cleanup: null
        },
        exports: {}
      };
    }

    async load(name, code, options = {}) {
      const { dependencies = [], config = {} } = options;

      // Check dependencies
      for (const dep of dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Dependency '${dep}' not found`);
        }
      }

      const sandbox = this.createSandbox(name, dependencies);
      sandbox.config = config;

      vm.createContext(sandbox);

      try {
        // Execute plugin code
        vm.runInContext(code, sandbox, { timeout: 5000 });

        const plugin = {
          name,
          context: sandbox,
          dependencies,
          config,
          state: 'loaded'
        };

        this.plugins.set(name, plugin);

        // Initialize
        if (sandbox.plugin.init) {
          const initScript = new vm.Script('plugin.init(config)');
          await initScript.runInContext(sandbox);
          plugin.state = 'ready';
        }

        this.emit('loaded', { name });
        console.log(`Plugin '${name}' loaded successfully`);
      } catch (err) {
        console.error(`Failed to load plugin '${name}':`, err.message);
        throw err;
      }
    }

    async run(name, input) {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        throw new Error(`Plugin '${name}' not found`);
      }

      if (!plugin.context.plugin.run) {
        throw new Error(`Plugin '${name}' has no run method`);
      }

      plugin.context.input = input;
      const script = new vm.Script('plugin.run(input)');
      return script.runInContext(plugin.context, { timeout: 10000 });
    }

    async unload(name) {
      const plugin = this.plugins.get(name);

      if (!plugin) {
        return;
      }

      // Check dependencies
      for (const [pName, p] of this.plugins.entries()) {
        if (p.dependencies.includes(name)) {
          throw new Error(`Cannot unload '${name}': '${pName}' depends on it`);
        }
      }

      // Cleanup
      if (plugin.context.plugin.cleanup) {
        const cleanupScript = new vm.Script('plugin.cleanup()');
        await cleanupScript.runInContext(plugin.context);
      }

      this.plugins.delete(name);
      this.emit('unloaded', { name });
    }

    list() {
      return Array.from(this.plugins.keys());
    }
  }

  // Demo complete system
  const system = new PluginSystem();

  system.on('loaded', ({ name }) => {
    console.log(`[System Event] Plugin '${name}' loaded`);
  });

  (async () => {
    await system.load('processor', `
      plugin.init = function(config) {
        this.prefix = config.prefix || '';
      };

      plugin.run = function(input) {
        return this.prefix + input.toUpperCase();
      };

      plugin.cleanup = function() {
        api.log('INFO', 'Cleanup complete');
      };
    `, { config: { prefix: '>>> ' } });

    console.log('Result:', await system.run('processor', 'hello world'));

    await system.unload('processor');

    console.log();
    console.log('=== Key Takeaways ===\n');
    console.log('1. VM provides isolated execution environments for plugins');
    console.log('2. Lifecycle hooks (init, run, cleanup) enable proper plugin management');
    console.log('3. Events facilitate inter-plugin communication');
    console.log('4. Structured APIs provide controlled access to system features');
    console.log('5. Dependency management ensures plugins load in correct order');
    console.log('6. Always set timeouts for plugin code execution');
    console.log();

    console.log('Run this example with: node 06-plugin-system.js');
  })();
}
