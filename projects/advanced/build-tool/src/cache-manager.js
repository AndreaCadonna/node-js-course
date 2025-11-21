const fs = require('fs').promises;
const fss = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

/**
 * CacheManager - Manage build cache with content-based hashing
 *
 * Implements incremental builds by tracking file hashes and cached outputs.
 * Uses SHA-256 hashing to detect actual content changes.
 */
class CacheManager extends EventEmitter {
  constructor(cacheDir = '.build-cache') {
    super();
    this.cacheDir = cacheDir;
    this.cache = new Map(); // file -> { hash, output, timestamp }
    this.initialized = false;
  }

  /**
   * Initialize cache directory and load existing cache
   */
  async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await this.load();
      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { operation: 'initialize', error });
      throw error;
    }
  }

  /**
   * Calculate SHA-256 hash of file content
   */
  async hashFile(filePath) {
    try {
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(content);
      return hash.digest('hex');
    } catch (error) {
      this.emit('error', { operation: 'hashFile', filePath, error });
      throw error;
    }
  }

  /**
   * Calculate hash from content string
   */
  hashContent(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Check if file has changed since last build
   */
  async hasChanged(filePath) {
    try {
      const currentHash = await this.hashFile(filePath);
      const cached = this.cache.get(filePath);

      if (!cached) return true;

      const changed = cached.hash !== currentHash;

      if (changed) {
        this.emit('file:changed', { filePath, oldHash: cached.hash, newHash: currentHash });
      }

      return changed;
    } catch (error) {
      // If file doesn't exist or can't be read, consider it changed
      return true;
    }
  }

  /**
   * Get cached build output for a file
   */
  async get(filePath) {
    const cached = this.cache.get(filePath);

    if (!cached) {
      this.emit('cache:miss', { filePath });
      return null;
    }

    // Verify file hasn't changed
    const changed = await this.hasChanged(filePath);
    if (changed) {
      this.emit('cache:miss', { filePath, reason: 'file_changed' });
      return null;
    }

    this.emit('cache:hit', { filePath });
    return cached.output;
  }

  /**
   * Store build output in cache
   */
  async set(filePath, output) {
    try {
      const hash = await this.hashFile(filePath);

      this.cache.set(filePath, {
        hash,
        output,
        timestamp: Date.now()
      });

      this.emit('cache:set', { filePath, hash });

      // Persist to disk
      await this.persist();
    } catch (error) {
      this.emit('error', { operation: 'set', filePath, error });
      throw error;
    }
  }

  /**
   * Invalidate cache for a file
   */
  invalidate(filePath) {
    const existed = this.cache.has(filePath);
    this.cache.delete(filePath);

    if (existed) {
      this.emit('cache:invalidated', { filePath });
    }

    return existed;
  }

  /**
   * Invalidate cache for multiple files
   */
  invalidateMultiple(filePaths) {
    const invalidated = [];

    for (const filePath of filePaths) {
      if (this.invalidate(filePath)) {
        invalidated.push(filePath);
      }
    }

    return invalidated;
  }

  /**
   * Check if file is in cache
   */
  has(filePath) {
    return this.cache.has(filePath);
  }

  /**
   * Get all cached file paths
   */
  getCachedFiles() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalEntries: this.cache.size,
      totalSize: this.getCacheSize(),
      oldestEntry: entries.length > 0
        ? Math.min(...entries.map(e => e.timestamp))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(e => e.timestamp))
        : null,
      avgAge: entries.length > 0
        ? entries.reduce((sum, e) => sum + (now - e.timestamp), 0) / entries.length
        : 0
    };
  }

  /**
   * Get total cache size (approximate)
   */
  getCacheSize() {
    let size = 0;

    for (const entry of this.cache.values()) {
      // Rough estimate of memory size
      size += JSON.stringify(entry).length;
    }

    return size;
  }

  /**
   * Clean old cache entries
   */
  clean(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const now = Date.now();
    const removed = [];

    for (const [filePath, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(filePath);
        removed.push(filePath);
      }
    }

    if (removed.length > 0) {
      this.emit('cache:cleaned', { removed: removed.length, files: removed });
    }

    return removed;
  }

  /**
   * Clear entire cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.emit('cache:cleared', { entries: size });
  }

  /**
   * Persist cache to disk
   */
  async persist() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');
      const data = {
        version: '1.0',
        timestamp: Date.now(),
        entries: Array.from(this.cache.entries()).map(([filePath, entry]) => ({
          filePath,
          ...entry
        }))
      };

      await fs.writeFile(
        cacheFile,
        JSON.stringify(data, null, 2),
        'utf8'
      );

      this.emit('cache:persisted', { entries: this.cache.size });
    } catch (error) {
      this.emit('error', { operation: 'persist', error });
      throw error;
    }
  }

  /**
   * Load cache from disk
   */
  async load() {
    try {
      const cacheFile = path.join(this.cacheDir, 'cache.json');

      // Check if cache file exists
      try {
        await fs.access(cacheFile);
      } catch {
        // Cache file doesn't exist, start fresh
        this.emit('cache:loaded', { entries: 0, source: 'new' });
        return;
      }

      const content = await fs.readFile(cacheFile, 'utf8');
      const data = JSON.parse(content);

      this.cache.clear();

      for (const entry of data.entries) {
        const { filePath, ...rest } = entry;
        this.cache.set(filePath, rest);
      }

      this.emit('cache:loaded', {
        entries: this.cache.size,
        source: 'disk',
        version: data.version,
        timestamp: data.timestamp
      });
    } catch (error) {
      this.emit('error', { operation: 'load', error });
      // Don't throw - start with empty cache if load fails
      this.cache.clear();
    }
  }

  /**
   * Export cache data
   */
  export() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([filePath, entry]) => ({
        filePath,
        hash: entry.hash,
        timestamp: entry.timestamp,
        outputSize: JSON.stringify(entry.output).length
      }))
    };
  }

  /**
   * Get cache hit rate (requires tracking)
   */
  getHitRate() {
    // This would require tracking hits/misses
    // For now, return null - can be extended
    return null;
  }
}

module.exports = CacheManager;
