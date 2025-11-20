/**
 * Exercise 2 Solution: Plugin Manager
 */
const vm = require('vm');
const { EventEmitter } = require('events');

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.plugins = new Map();
    this.storage = new Map();
    this.timeout = options.timeout || 5000;
    this.stats = { totalRuns: 0, totalErrors: 0 };
  }

  createAPI(pluginName) {
    return {
      log: {
        info: (msg) => console.log(`[${pluginName}] INFO:`, msg),
        warn: (msg) => console.log(`[${pluginName}] WARN:`, msg),
        error: (msg) => console.log(`[${pluginName}] ERROR:`, msg)
      },
      emit: (event, data) => this.emit(`plugin:${pluginName}:${event}`, data),
      storage: {
        get: (key) => this.storage.get(`${pluginName}:${key}`),
        set: (key, value) => this.storage.set(`${pluginName}:${key}`, value),
        delete: (key) => this.storage.delete(`${pluginName}:${key}`)
      },
      info: { name: pluginName }
    };
  }

  createSandbox(name, dependencies = [], config = {}) {
    const deps = {};
    for (const dep of dependencies) {
      const plugin = this.plugins.get(dep);
      if (plugin) {
        deps[dep] = (input) => this.run(dep, input);
      }
    }

    return {
      console,
      deps,
      api: this.createAPI(name),
      config,
      plugin: { init: null, run: null, cleanup: null }
    };
  }

  checkDependencies(dependencies) {
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Dependency '${dep}' not found or not loaded`);
      }
    }
  }

  async load(name, code, options = {}) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' already loaded`);
    }

    const { dependencies = [], config = {} } = options;
    this.checkDependencies(dependencies);

    const sandbox = this.createSandbox(name, dependencies, config);
    vm.createContext(sandbox);

    try {
      vm.runInContext(code, sandbox, { timeout: this.timeout });

      const plugin = {
        name,
        context: sandbox,
        dependencies,
        config,
        state: 'loaded'
      };

      this.plugins.set(name, plugin);

      if (sandbox.plugin.init) {
        const script = new vm.Script('plugin.init(config)');
        await script.runInContext(sandbox);
        plugin.state = 'ready';
      }

      this.emit('loaded', { name });
    } catch (err) {
      throw new Error(`Failed to load plugin '${name}': ${err.message}`);
    }
  }

  async run(name, input) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin '${name}' not found`);
    if (!plugin.context.plugin.run) throw new Error(`Plugin '${name}' has no run method`);

    try {
      this.stats.totalRuns++;
      plugin.state = 'running';
      plugin.context.input = input;
      const script = new vm.Script('plugin.run(input)');
      const result = script.runInContext(plugin.context, { timeout: this.timeout });
      plugin.state = 'idle';
      return result;
    } catch (err) {
      this.stats.totalErrors++;
      plugin.state = 'error';
      this.emit(`plugin:${name}:error`, err);
      throw err;
    }
  }

  async unload(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    for (const [pName, p] of this.plugins.entries()) {
      if (p.dependencies.includes(name)) {
        throw new Error(`Cannot unload '${name}': plugin '${pName}' depends on it`);
      }
    }

    if (plugin.context.plugin.cleanup) {
      const script = new vm.Script('plugin.cleanup()');
      await script.runInContext(plugin.context);
    }

    this.plugins.delete(name);
    this.emit('unloaded', { name });
  }

  getState(name) {
    return this.plugins.get(name)?.state || null;
  }

  list() {
    return Array.from(this.plugins.keys());
  }

  getInfo(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return null;
    return {
      name: plugin.name,
      state: plugin.state,
      dependencies: plugin.dependencies,
      hasInit: !!plugin.context.plugin.init,
      hasRun: !!plugin.context.plugin.run,
      hasCleanup: !!plugin.context.plugin.cleanup
    };
  }

  getStats() {
    const byState = {};
    for (const plugin of this.plugins.values()) {
      byState[plugin.state] = (byState[plugin.state] || 0) + 1;
    }
    return {
      totalPlugins: this.plugins.size,
      byState,
      totalRuns: this.stats.totalRuns,
      totalErrors: this.stats.totalErrors
    };
  }
}

module.exports = { PluginManager };

if (require.main === module) {
  (async () => {
    const manager = new PluginManager();
    console.log('=== Plugin Manager Solution ===\n');
    await manager.load('test', 'plugin.run = (x) => x * 2;');
    console.log('Result:', await manager.run('test', 21));
    console.log('\n✓ Solution ready!');
  })();
}
