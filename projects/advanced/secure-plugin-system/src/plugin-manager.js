/**
 * Plugin Manager
 * Main orchestrator for the plugin system
 */

const { EventEmitter } = require('events');
const PluginLoader = require('./plugin-loader');
const PluginAPI = require('./plugin-api');
const Security = require('./security');

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.pluginsDir = options.pluginsDir;
    this.dataDir = options.dataDir;

    // Initialize components
    this.api = new PluginAPI({
      dataDir: this.dataDir,
      allowedDomains: options.allowedDomains,
      blockedDomains: options.blockedDomains,
      maxRequestSize: options.maxRequestSize,
      requestTimeout: options.requestTimeout
    });

    this.security = new Security({
      publicKeyPath: options.publicKeyPath,
      privateKeyPath: options.privateKeyPath,
      requireSignature: options.requireSignature
    });

    this.loader = new PluginLoader(this.pluginsDir, this.api, options);

    // Options
    this.autoActivate = options.autoActivate !== false;
    this.scanPlugins = options.scanPlugins !== false;

    this.initialized = false;

    // Setup event forwarding
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from loader
   */
  setupEventForwarding() {
    // Forward all loader events
    this.loader.on('discovery:complete', (data) => this.emit('discovery:complete', data));
    this.loader.on('discovery:error', (data) => this.emit('discovery:error', data));
    this.loader.on('plugin:loading', (plugin) => this.emit('plugin:loading', plugin));
    this.loader.on('plugin:loaded', (plugin) => this.emit('plugin:loaded', plugin));
    this.loader.on('plugin:activated', (plugin) => this.emit('plugin:activated', plugin));
    this.loader.on('plugin:disabled', (plugin) => this.emit('plugin:disabled', plugin));
    this.loader.on('plugin:unloaded', (plugin) => this.emit('plugin:unloaded', plugin));
    this.loader.on('plugin:error', (data) => this.emit('plugin:error', data));
    this.loader.on('plugin:execution', (data) => this.emit('plugin:execution', data));
    this.loader.on('plugin:log', (data) => this.emit('plugin:log', data));
  }

  /**
   * Initialize plugin manager
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Initialize API
    await this.api.initialize();

    // Initialize security
    await this.security.initialize();

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Load all plugins
   */
  async loadPlugins() {
    if (!this.initialized) {
      await this.initialize();
    }

    const results = await this.loader.loadAll();

    // Verify signatures if security is enabled
    if (this.security.requireSignature && this.security.publicKey) {
      for (const pluginId of results.loaded) {
        const plugin = this.loader.getPlugin(pluginId);
        try {
          const verified = await this.security.verifyPlugin(plugin);
          if (!verified) {
            console.warn(`Plugin ${pluginId} signature verification failed`);
            this.loader.disable(pluginId);
          }
        } catch (error) {
          console.error(`Failed to verify plugin ${pluginId}:`, error.message);
          this.loader.disable(pluginId);
        }
      }
    }

    // Scan plugins for security issues
    if (this.scanPlugins) {
      for (const pluginId of results.loaded) {
        const plugin = this.loader.getPlugin(pluginId);
        const scanResult = Security.scanPlugin(plugin.code);

        if (!scanResult.safe) {
          console.warn(`Plugin ${pluginId} failed security scan:`, scanResult.issues);
          this.emit('security:scan-failed', { plugin, issues: scanResult.issues });

          // Disable unsafe plugins
          this.loader.disable(pluginId);
          results.failed.push({
            id: pluginId,
            error: 'Failed security scan'
          });
          results.loaded = results.loaded.filter(id => id !== pluginId);
        }
      }
    }

    // Auto-activate plugins
    if (this.autoActivate) {
      for (const pluginId of results.loaded) {
        try {
          this.loader.activate(pluginId);
        } catch (error) {
          console.error(`Failed to activate plugin ${pluginId}:`, error.message);
        }
      }
    }

    this.emit('plugins:loaded', results);

    return results;
  }

  /**
   * Load single plugin
   */
  async loadPlugin(pluginDir) {
    const Plugin = require('./plugin');
    const plugin = await Plugin.fromDirectory(pluginDir);

    // Scan for security issues
    if (this.scanPlugins) {
      await plugin.load();
      const scanResult = Security.scanPlugin(plugin.code);

      if (!scanResult.safe) {
        throw new Error(`Plugin failed security scan: ${scanResult.issues[0].message}`);
      }
    }

    await this.loader.load(plugin);

    // Verify signature
    if (this.security.requireSignature && this.security.publicKey) {
      const verified = await this.security.verifyPlugin(plugin);
      if (!verified) {
        this.loader.disable(plugin.id);
        throw new Error('Plugin signature verification failed');
      }
    }

    // Auto-activate
    if (this.autoActivate) {
      this.loader.activate(plugin.id);
    }

    return plugin;
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId) {
    return this.loader.getPlugin(pluginId);
  }

  /**
   * Get all plugins
   */
  getAllPlugins() {
    return this.loader.getAllPlugins();
  }

  /**
   * Execute plugin
   */
  async execute(pluginId, ...args) {
    const plugin = this.loader.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check if plugin is verified (if signature checking is enabled)
    if (this.security.requireSignature && !plugin.verified) {
      throw new Error(`Plugin ${pluginId} is not verified`);
    }

    return await this.loader.execute(pluginId, ...args);
  }

  /**
   * Configure plugin
   */
  async configure(pluginId, config) {
    return await this.loader.configure(pluginId, config);
  }

  /**
   * Activate plugin
   */
  activate(pluginId) {
    return this.loader.activate(pluginId);
  }

  /**
   * Disable plugin
   */
  disable(pluginId) {
    return this.loader.disable(pluginId);
  }

  /**
   * Unload plugin
   */
  async unload(pluginId) {
    return await this.loader.unload(pluginId);
  }

  /**
   * Reload plugin
   */
  async reload(pluginId) {
    return await this.loader.reload(pluginId);
  }

  /**
   * Sign plugin (requires private key)
   */
  async signPlugin(pluginDir) {
    return await this.security.signPlugin(pluginDir);
  }

  /**
   * Create security report for plugin
   */
  async createSecurityReport(pluginId) {
    const plugin = this.loader.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    return await Security.createSecurityReport(plugin);
  }

  /**
   * Get statistics
   */
  getStats() {
    const loaderStats = this.loader.getStats();
    const apiStats = this.api.getStats();

    return {
      plugins: loaderStats,
      api: apiStats,
      security: {
        signatureRequired: this.security.requireSignature,
        scanningEnabled: this.scanPlugins
      }
    };
  }

  /**
   * Get plugin info
   */
  getPluginInfo(pluginId) {
    const plugin = this.loader.getPlugin(pluginId);
    if (!plugin) {
      return null;
    }

    const sandbox = this.loader.getSandbox(pluginId);
    const resourceUsage = sandbox ? sandbox.getResourceUsage() : null;

    return {
      ...plugin.toJSON(),
      resourceUsage
    };
  }

  /**
   * List all plugins with info
   */
  listPlugins() {
    const plugins = this.loader.getAllPlugins();
    return plugins.map(plugin => this.getPluginInfo(plugin.id));
  }

  /**
   * Shutdown plugin manager
   */
  async shutdown() {
    await this.loader.cleanup();
    await this.api.cleanup();
    this.removeAllListeners();

    this.emit('shutdown');
  }
}

module.exports = PluginManager;
