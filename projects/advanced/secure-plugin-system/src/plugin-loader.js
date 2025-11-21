/**
 * Plugin Loader
 * Loads and initializes plugins from directory
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const Plugin = require('./plugin');
const Sandbox = require('./sandbox');

class PluginLoader extends EventEmitter {
  constructor(pluginsDir, api, options = {}) {
    super();

    this.pluginsDir = pluginsDir;
    this.api = api;
    this.options = options;

    this.plugins = new Map();
    this.sandboxes = new Map();
    this.loadedPlugins = new Set();
  }

  /**
   * Discover plugins in directory
   */
  async discover() {
    try {
      const entries = await fs.promises.readdir(this.pluginsDir, {
        withFileTypes: true
      });

      const pluginDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(this.pluginsDir, entry.name));

      const discovered = [];

      for (const pluginDir of pluginDirs) {
        try {
          const manifestPath = path.join(pluginDir, 'plugin.json');

          // Check if plugin.json exists
          await fs.promises.access(manifestPath);

          // Load plugin metadata
          const plugin = await Plugin.fromDirectory(pluginDir);

          // Validate manifest
          Plugin.validateManifest({
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            main: plugin.main
          });

          discovered.push(plugin);
        } catch (error) {
          this.emit('discovery:error', {
            pluginDir,
            error: error.message
          });
        }
      }

      this.emit('discovery:complete', { count: discovered.length });

      return discovered;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Plugins directory doesn't exist
        await fs.promises.mkdir(this.pluginsDir, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  /**
   * Load a plugin
   */
  async load(plugin) {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already loaded`);
    }

    this.emit('plugin:loading', plugin);

    try {
      // Check dependencies
      await this.checkDependencies(plugin);

      // Load plugin code
      await plugin.load();

      // Create sandbox
      const sandbox = new Sandbox(plugin, this.api);
      sandbox.createContext();

      // Setup sandbox event forwarding
      this.setupSandboxEvents(plugin, sandbox);

      // Execute plugin code in sandbox
      await sandbox.execute(plugin.code);

      // Get exports
      const exports = sandbox.context.module.exports;
      plugin.setExports(exports);
      plugin.setSandbox(sandbox);

      // Validate plugin exports
      this.validateExports(plugin);

      // Store plugin and sandbox
      this.plugins.set(plugin.id, plugin);
      this.sandboxes.set(plugin.id, sandbox);
      this.loadedPlugins.add(plugin.id);

      // Call plugin init if available
      if (exports.init && typeof exports.init === 'function') {
        await sandbox.executeFunction('init');
      }

      this.emit('plugin:loaded', plugin);

      return plugin;
    } catch (error) {
      plugin.status = Plugin.STATUS.ERROR;
      plugin.lastError = {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };

      this.emit('plugin:error', {
        plugin,
        error
      });

      throw error;
    }
  }

  /**
   * Load all discovered plugins
   */
  async loadAll() {
    const discovered = await this.discover();
    const results = {
      loaded: [],
      failed: []
    };

    // Sort by dependencies
    const sorted = this.sortByDependencies(discovered);

    for (const plugin of sorted) {
      try {
        await this.load(plugin);
        results.loaded.push(plugin.id);
      } catch (error) {
        results.failed.push({
          id: plugin.id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Check plugin dependencies
   */
  async checkDependencies(plugin) {
    for (const depId of plugin.dependencies) {
      if (!this.loadedPlugins.has(depId)) {
        throw new Error(`Missing dependency: ${depId}`);
      }
    }
  }

  /**
   * Sort plugins by dependencies
   */
  sortByDependencies(plugins) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (plugin) => {
      if (visited.has(plugin.id)) {
        return;
      }

      if (visiting.has(plugin.id)) {
        throw new Error(`Circular dependency detected: ${plugin.id}`);
      }

      visiting.add(plugin.id);

      // Visit dependencies first
      for (const depId of plugin.dependencies) {
        const dep = plugins.find(p => p.id === depId);
        if (dep) {
          visit(dep);
        }
      }

      visiting.delete(plugin.id);
      visited.add(plugin.id);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      visit(plugin);
    }

    return sorted;
  }

  /**
   * Validate plugin exports
   */
  validateExports(plugin) {
    const exports = plugin.exports;

    if (!exports) {
      throw new Error(`Plugin ${plugin.id} has no exports`);
    }

    if (typeof exports !== 'object') {
      throw new Error(`Plugin ${plugin.id} exports must be an object`);
    }

    // Check for required execute function
    if (!exports.execute || typeof exports.execute !== 'function') {
      throw new Error(`Plugin ${plugin.id} must export an execute function`);
    }

    // Validate optional lifecycle hooks
    const hooks = ['init', 'destroy', 'configure'];
    for (const hook of hooks) {
      if (exports[hook] && typeof exports[hook] !== 'function') {
        throw new Error(`Plugin ${plugin.id} ${hook} must be a function`);
      }
    }
  }

  /**
   * Setup sandbox event forwarding
   */
  setupSandboxEvents(plugin, sandbox) {
    sandbox.on('log', (data) => {
      this.emit('plugin:log', {
        pluginId: plugin.id,
        ...data
      });
    });

    sandbox.on('error', (error) => {
      this.emit('plugin:error', {
        plugin,
        error
      });
    });

    sandbox.on('execution', (data) => {
      plugin.recordExecution(data.executionTime, data.success);

      this.emit('plugin:execution', {
        pluginId: plugin.id,
        ...data
      });
    });
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin sandbox
   */
  getSandbox(pluginId) {
    return this.sandboxes.get(pluginId);
  }

  /**
   * Activate plugin
   */
  activate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === Plugin.STATUS.ACTIVE) {
      return plugin;
    }

    plugin.activate();
    this.emit('plugin:activated', plugin);

    return plugin;
  }

  /**
   * Disable plugin
   */
  disable(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.disable();
    this.emit('plugin:disabled', plugin);

    return plugin;
  }

  /**
   * Unload plugin
   */
  async unload(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check if other plugins depend on this one
    for (const [id, p] of this.plugins) {
      if (p.dependencies.includes(pluginId)) {
        throw new Error(`Cannot unload ${pluginId}: ${id} depends on it`);
      }
    }

    // Call destroy hook if available
    const sandbox = this.sandboxes.get(pluginId);
    if (plugin.exports.destroy && typeof plugin.exports.destroy === 'function') {
      try {
        await sandbox.executeFunction('destroy');
      } catch (error) {
        this.emit('plugin:error', { plugin, error });
      }
    }

    // Cleanup sandbox
    sandbox.cleanup();

    // Remove from maps
    this.plugins.delete(pluginId);
    this.sandboxes.delete(pluginId);
    this.loadedPlugins.delete(pluginId);

    plugin.status = Plugin.STATUS.UNLOADED;

    this.emit('plugin:unloaded', plugin);

    return plugin;
  }

  /**
   * Reload plugin
   */
  async reload(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const pluginDir = plugin.pluginDir;

    // Unload
    await this.unload(pluginId);

    // Reload from disk
    const reloaded = await Plugin.fromDirectory(pluginDir);
    await this.load(reloaded);

    return reloaded;
  }

  /**
   * Execute plugin
   */
  async execute(pluginId, ...args) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.isCallable()) {
      throw new Error(`Plugin ${pluginId} is not callable (status: ${plugin.status})`);
    }

    const sandbox = this.sandboxes.get(pluginId);
    return await sandbox.executeFunction('execute', args);
  }

  /**
   * Configure plugin
   */
  async configure(pluginId, config) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.exports.configure) {
      throw new Error(`Plugin ${pluginId} does not support configuration`);
    }

    const sandbox = this.sandboxes.get(pluginId);
    return await sandbox.executeFunction('configure', [config]);
  }

  /**
   * Get loader statistics
   */
  getStats() {
    const stats = {
      total: this.plugins.size,
      byStatus: {
        unloaded: 0,
        loading: 0,
        loaded: 0,
        active: 0,
        disabled: 0,
        error: 0
      },
      plugins: []
    };

    for (const plugin of this.plugins.values()) {
      stats.byStatus[plugin.status]++;

      stats.plugins.push({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        status: plugin.status,
        executions: plugin.stats.executions,
        avgExecutionTime: plugin.getAverageExecutionTime(),
        errorRate: plugin.getErrorRate()
      });
    }

    return stats;
  }

  /**
   * Cleanup loader
   */
  async cleanup() {
    const pluginIds = Array.from(this.plugins.keys());

    for (const pluginId of pluginIds) {
      try {
        await this.unload(pluginId);
      } catch (error) {
        this.emit('error', error);
      }
    }

    this.removeAllListeners();
  }
}

module.exports = PluginLoader;
