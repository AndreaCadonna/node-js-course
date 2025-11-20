const EventEmitter = require('events');
const FileWatcher = require('./watcher');
const ChangeFilter = require('./filter');

/**
 * File Monitor - High-level file monitoring with filtering and history
 */
class FileMonitor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      maxHistory: options.maxHistory || 1000,
      debounceTime: options.debounceTime || 100,
      ...options
    };

    this.watcher = new FileWatcher(options);
    this.filter = new ChangeFilter(options);

    this.changeHistory = [];
    this.debounceTimers = new Map();
    this.stats = {
      totalChanges: 0,
      filteredChanges: 0,
      byType: {},
      startTime: Date.now()
    };

    this.setupWatcherListeners();
  }

  /**
   * Setup watcher event listeners
   */
  setupWatcherListeners() {
    this.watcher.on('change', (change) => {
      this.handleChange(change);
    });

    this.watcher.on('error', (error) => {
      this.emit('error', error);
    });

    this.watcher.on('watching', (data) => {
      this.emit('watching', data);
    });

    this.watcher.on('unwatched', (data) => {
      this.emit('unwatched', data);
    });
  }

  /**
   * Handle file change with debouncing and filtering
   */
  handleChange(change) {
    this.stats.totalChanges++;

    // Apply filter
    if (!this.filter.shouldProcess(change)) {
      this.stats.filteredChanges++;
      return;
    }

    // Debounce rapid changes to same file
    const key = change.path;

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    this.debounceTimers.set(key, setTimeout(() => {
      this.processChange(change);
      this.debounceTimers.delete(key);
    }, this.options.debounceTime));
  }

  /**
   * Process filtered change
   */
  processChange(change) {
    // Update stats
    this.stats.byType[change.type] = (this.stats.byType[change.type] || 0) + 1;

    // Add to history
    this.addToHistory(change);

    // Emit change event
    this.emit('change', change);

    // Emit specific type events
    this.emit(`change:${change.type}`, change);
  }

  /**
   * Add change to history
   */
  addToHistory(change) {
    this.changeHistory.unshift(change);

    // Limit history size
    if (this.changeHistory.length > this.options.maxHistory) {
      this.changeHistory = this.changeHistory.slice(0, this.options.maxHistory);
    }
  }

  /**
   * Watch a path
   */
  watch(targetPath, options = {}) {
    try {
      this.watcher.watch(targetPath, options);
    } catch (err) {
      this.emit('error', { path: targetPath, error: err });
    }
  }

  /**
   * Watch multiple paths
   */
  watchMany(paths) {
    for (const targetPath of paths) {
      this.watch(targetPath);
    }
  }

  /**
   * Unwatch a path
   */
  unwatch(targetPath) {
    this.watcher.unwatch(targetPath);
  }

  /**
   * Unwatch all paths
   */
  unwatchAll() {
    this.watcher.unwatchAll();
  }

  /**
   * Get change history
   */
  getHistory(limit = 100) {
    return this.changeHistory.slice(0, limit);
  }

  /**
   * Get changes by type
   */
  getChangesByType(type, limit = 100) {
    return this.changeHistory
      .filter(change => change.type === type)
      .slice(0, limit);
  }

  /**
   * Get changes for specific path
   */
  getChangesForPath(targetPath, limit = 100) {
    return this.changeHistory
      .filter(change => change.path === targetPath)
      .slice(0, limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    const uptime = (Date.now() - this.stats.startTime) / 1000;

    return {
      ...this.stats,
      ...this.watcher.getStats(),
      uptime,
      changesPerSecond: (this.stats.totalChanges / uptime).toFixed(2),
      filterRate: ((this.stats.filteredChanges / this.stats.totalChanges) * 100).toFixed(1) + '%'
    };
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.changeHistory = [];
    this.emit('history-cleared');
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalChanges: 0,
      filteredChanges: 0,
      byType: {},
      startTime: Date.now()
    };
    this.emit('stats-reset');
  }

  /**
   * Update filter options
   */
  updateFilter(options) {
    this.filter.updateOptions(options);
    this.emit('filter-updated', options);
  }

  /**
   * Get current filter options
   */
  getFilterOptions() {
    return this.filter.getOptions();
  }

  /**
   * Get watched paths
   */
  getWatchedPaths() {
    return this.watcher.getWatchedPaths();
  }

  /**
   * Check if path is being watched
   */
  isWatching(targetPath) {
    return this.watcher.isWatching(targetPath);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.emit('shutting-down');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close watcher
    this.watcher.close();

    this.emit('shutdown');
  }

  /**
   * Close (alias for shutdown)
   */
  close() {
    return this.shutdown();
  }
}

module.exports = FileMonitor;
