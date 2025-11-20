const path = require('path');

/**
 * Change Filter - Filters file change events based on rules
 */
class ChangeFilter {
  constructor(options = {}) {
    this.options = {
      includeExtensions: options.includeExtensions || null, // null = all
      excludeExtensions: options.excludeExtensions || [],
      includePatterns: options.includePatterns || [],
      excludePatterns: options.excludePatterns || [],
      ignoreHidden: options.ignoreHidden !== false,
      ignorePaths: options.ignorePaths || ['node_modules', '.git', '.DS_Store'],
      minSize: options.minSize || 0,
      maxSize: options.maxSize || Infinity,
      changeTypes: options.changeTypes || null, // null = all types
      ...options
    };

    // Compile regex patterns
    this.includeRegex = this.compilePatterns(this.options.includePatterns);
    this.excludeRegex = this.compilePatterns(this.options.excludePatterns);
  }

  /**
   * Compile string patterns to regex
   */
  compilePatterns(patterns) {
    return patterns.map(pattern => {
      if (pattern instanceof RegExp) {
        return pattern;
      }
      // Convert glob-like patterns to regex
      const regex = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      return new RegExp(regex, 'i');
    });
  }

  /**
   * Check if change event should be processed
   */
  shouldProcess(change) {
    // Filter by change type
    if (this.options.changeTypes && !this.options.changeTypes.includes(change.type)) {
      return false;
    }

    // Filter hidden files
    if (this.options.ignoreHidden && this.isHidden(change.filename)) {
      return false;
    }

    // Filter ignored paths
    if (this.isIgnoredPath(change.path)) {
      return false;
    }

    // Filter by extension
    if (!this.matchesExtension(change.filename)) {
      return false;
    }

    // Filter by patterns
    if (!this.matchesPatterns(change.path)) {
      return false;
    }

    // Filter by size
    if (change.stats && !this.matchesSize(change.stats.size)) {
      return false;
    }

    return true;
  }

  /**
   * Check if filename is hidden (starts with dot)
   */
  isHidden(filename) {
    return filename.startsWith('.');
  }

  /**
   * Check if path contains ignored directories
   */
  isIgnoredPath(filePath) {
    for (const ignorePath of this.options.ignorePaths) {
      if (filePath.includes(path.sep + ignorePath + path.sep) ||
          filePath.endsWith(path.sep + ignorePath) ||
          path.basename(filePath) === ignorePath) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if file extension matches filter
   */
  matchesExtension(filename) {
    const ext = path.extname(filename).toLowerCase();

    // Check exclude list first
    if (this.options.excludeExtensions.length > 0) {
      if (this.options.excludeExtensions.includes(ext)) {
        return false;
      }
    }

    // Check include list
    if (this.options.includeExtensions) {
      return this.options.includeExtensions.includes(ext);
    }

    return true;
  }

  /**
   * Check if path matches include/exclude patterns
   */
  matchesPatterns(filePath) {
    // Check exclude patterns first
    for (const regex of this.excludeRegex) {
      if (regex.test(filePath)) {
        return false;
      }
    }

    // Check include patterns
    if (this.includeRegex.length > 0) {
      for (const regex of this.includeRegex) {
        if (regex.test(filePath)) {
          return true;
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Check if file size matches filter
   */
  matchesSize(size) {
    return size >= this.options.minSize && size <= this.options.maxSize;
  }

  /**
   * Update filter options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.includeRegex = this.compilePatterns(this.options.includePatterns);
    this.excludeRegex = this.compilePatterns(this.options.excludePatterns);
  }

  /**
   * Get current filter options
   */
  getOptions() {
    return { ...this.options };
  }
}

module.exports = ChangeFilter;
