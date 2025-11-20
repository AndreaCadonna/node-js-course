/**
 * Plugin Model
 * Represents a plugin with metadata and state
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Plugin {
  static STATUS = {
    UNLOADED: 'unloaded',
    LOADING: 'loading',
    LOADED: 'loaded',
    ACTIVE: 'active',
    DISABLED: 'disabled',
    ERROR: 'error'
  };

  constructor(manifest, options = {}) {
    // Manifest data
    this.id = manifest.id;
    this.name = manifest.name;
    this.version = manifest.version;
    this.description = manifest.description || '';
    this.author = manifest.author || 'Unknown';
    this.main = manifest.main || 'index.js';
    this.permissions = manifest.permissions || [];
    this.dependencies = manifest.dependencies || [];

    // Plugin paths
    this.pluginDir = options.pluginDir;
    this.mainPath = path.join(this.pluginDir, this.main);

    // State
    this.status = Plugin.STATUS.UNLOADED;
    this.code = null;
    this.exports = null;
    this.sandbox = null;
    this.signature = options.signature || null;
    this.verified = false;

    // Metadata
    this.loadedAt = null;
    this.activatedAt = null;
    this.lastError = null;

    // Statistics
    this.stats = {
      executions: 0,
      totalExecutionTime: 0,
      errors: 0,
      lastExecutedAt: null
    };

    // Resource usage
    this.resources = {
      memoryLimit: manifest.resourceLimits?.memory || 50 * 1024 * 1024, // 50MB default
      timeoutLimit: manifest.resourceLimits?.timeout || 5000, // 5s default
      cpuLimit: manifest.resourceLimits?.cpu || 1000 // 1s CPU time
    };
  }

  /**
   * Load plugin code from disk
   */
  async load() {
    if (this.status !== Plugin.STATUS.UNLOADED) {
      throw new Error(`Plugin ${this.id} is already loaded`);
    }

    this.status = Plugin.STATUS.LOADING;

    try {
      // Read plugin code
      this.code = await fs.promises.readFile(this.mainPath, 'utf8');

      // Calculate code hash
      this.codeHash = crypto
        .createHash('sha256')
        .update(this.code)
        .digest('hex');

      this.status = Plugin.STATUS.LOADED;
      this.loadedAt = Date.now();

      return this;
    } catch (error) {
      this.status = Plugin.STATUS.ERROR;
      this.lastError = {
        message: error.message,
        timestamp: Date.now()
      };
      throw error;
    }
  }

  /**
   * Activate plugin
   */
  activate() {
    if (this.status !== Plugin.STATUS.LOADED) {
      throw new Error(`Plugin ${this.id} must be loaded before activation`);
    }

    this.status = Plugin.STATUS.ACTIVE;
    this.activatedAt = Date.now();
  }

  /**
   * Disable plugin
   */
  disable() {
    this.status = Plugin.STATUS.DISABLED;
  }

  /**
   * Set plugin exports (from sandbox execution)
   */
  setExports(exports) {
    this.exports = exports;
  }

  /**
   * Set plugin sandbox
   */
  setSandbox(sandbox) {
    this.sandbox = sandbox;
  }

  /**
   * Record execution statistics
   */
  recordExecution(executionTime, success = true) {
    this.stats.executions++;
    this.stats.totalExecutionTime += executionTime;
    this.stats.lastExecutedAt = Date.now();

    if (!success) {
      this.stats.errors++;
    }
  }

  /**
   * Get average execution time
   */
  getAverageExecutionTime() {
    if (this.stats.executions === 0) return 0;
    return Math.round(this.stats.totalExecutionTime / this.stats.executions);
  }

  /**
   * Get error rate
   */
  getErrorRate() {
    if (this.stats.executions === 0) return 0;
    return this.stats.errors / this.stats.executions;
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('*');
  }

  /**
   * Check if plugin is callable
   */
  isCallable() {
    return (
      this.status === Plugin.STATUS.ACTIVE &&
      this.exports &&
      typeof this.exports.execute === 'function'
    );
  }

  /**
   * Serialize plugin info
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      status: this.status,
      permissions: this.permissions,
      dependencies: this.dependencies,
      verified: this.verified,
      loadedAt: this.loadedAt,
      activatedAt: this.activatedAt,
      stats: {
        executions: this.stats.executions,
        avgExecutionTime: this.getAverageExecutionTime(),
        errorRate: this.getErrorRate(),
        lastExecutedAt: this.stats.lastExecutedAt
      },
      resources: this.resources
    };
  }

  /**
   * Create plugin from directory
   */
  static async fromDirectory(pluginDir) {
    // Read manifest
    const manifestPath = path.join(pluginDir, 'plugin.json');
    const manifestData = await fs.promises.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    // Read signature if exists
    let signature = null;
    const signaturePath = path.join(pluginDir, 'plugin.sig');
    try {
      signature = await fs.promises.readFile(signaturePath, 'utf8');
    } catch (error) {
      // Signature file is optional
    }

    return new Plugin(manifest, { pluginDir, signature });
  }

  /**
   * Validate manifest schema
   */
  static validateManifest(manifest) {
    const required = ['id', 'name', 'version', 'main'];

    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate version format (semver)
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      throw new Error('Invalid version format. Expected: major.minor.patch');
    }

    // Validate id format
    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Invalid id format. Use lowercase alphanumeric and hyphens');
    }

    return true;
  }
}

module.exports = Plugin;
