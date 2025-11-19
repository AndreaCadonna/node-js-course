/**
 * Example 7: Building a Complete Path Library
 *
 * Demonstrates how to build a comprehensive, production-ready
 * path utility library with proper API design, error handling,
 * and extensive functionality.
 *
 * Key Points:
 * - API design principles
 * - Error handling patterns
 * - Extensive utility methods
 * - Testing considerations
 * - Documentation approaches
 */

const path = require('path');
const fs = require('fs');

console.log('=== Building a Complete Path Library ===\n');

// 1. Core Path Library Class
console.log('1. Core PathLib Class:');

class PathLib {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      strict: options.strict !== false,
      throwOnError: options.throwOnError !== false,
      cache: options.cache !== false,
      maxCacheSize: options.maxCacheSize || 1000,
      ...options
    };

    if (this.options.cache) {
      this._cache = new Map();
    }
  }

  // Core operations
  join(...segments) {
    return path.join(this.baseDir, ...segments);
  }

  resolve(...segments) {
    return path.resolve(this.baseDir, ...segments);
  }

  relative(to) {
    return path.relative(this.baseDir, to);
  }

  // Validation
  isInBounds(filepath) {
    const resolved = this.resolve(filepath);
    return resolved.startsWith(this.baseDir + path.sep) || resolved === this.baseDir;
  }

  validate(filepath) {
    const errors = [];

    if (!this.isInBounds(filepath)) {
      errors.push('Path outside base directory');
    }

    if (filepath.includes('\0')) {
      errors.push('Contains null byte');
    }

    if (filepath.includes('..') && this.options.strict) {
      errors.push('Contains traversal pattern');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Parsing
  parse(filepath) {
    return path.parse(this.resolve(filepath));
  }

  components(filepath) {
    const resolved = this.resolve(filepath);
    return resolved.split(path.sep).filter(c => c);
  }

  depth(filepath) {
    return this.components(filepath).length;
  }

  // Transformation
  changeExtension(filepath, newExt) {
    const parsed = this.parse(filepath);
    return path.join(
      parsed.dir,
      parsed.name + (newExt.startsWith('.') ? newExt : '.' + newExt)
    );
  }

  addSuffix(filepath, suffix) {
    const parsed = this.parse(filepath);
    return path.join(parsed.dir, parsed.name + suffix + parsed.ext);
  }

  normalize(filepath) {
    return path.normalize(this.resolve(filepath));
  }

  // Matching
  matches(filepath, pattern) {
    // Simple glob matching
    const regex = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '§§DOUBLE_STAR§§')
      .replace(/\*/g, '[^/\\\\]*')
      .replace(/§§DOUBLE_STAR§§/g, '.*')
      .replace(/\?/g, '[^/\\\\]');

    return new RegExp('^' + regex + '$').test(filepath);
  }

  // File operations (safe wrappers)
  async exists(filepath) {
    const validation = this.validate(filepath);
    if (!validation.valid && this.options.throwOnError) {
      throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
    }

    try {
      await fs.promises.access(this.resolve(filepath));
      return true;
    } catch {
      return false;
    }
  }

  existsSync(filepath) {
    const validation = this.validate(filepath);
    if (!validation.valid && this.options.throwOnError) {
      throw new Error(`Invalid path: ${validation.errors.join(', ')}`);
    }

    return fs.existsSync(this.resolve(filepath));
  }

  // Utility methods
  toString() {
    return this.baseDir;
  }

  clone(newBaseDir) {
    return new PathLib(newBaseDir || this.baseDir, this.options);
  }
}

const lib = new PathLib('/app/data');

console.log('  PathLib initialized:');
console.log(`    Base directory: ${lib.baseDir}`);
console.log(`    Options: ${JSON.stringify(lib.options)}`);
console.log();

// 2. Extended Functionality
console.log('2. Extended Path Utilities:');

class PathLibExtended extends PathLib {
  // Advanced parsing
  getAllExtensions(filepath) {
    const basename = path.basename(filepath);
    const parts = basename.split('.');

    if (parts.length <= 1) return [];

    return parts.slice(1).map((ext, i) =>
      '.' + parts.slice(i + 1).join('.')
    );
  }

  getBasename(filepath, removeExt = false) {
    const basename = path.basename(filepath);
    return removeExt ? basename.replace(/\.[^.]+$/, '') : basename;
  }

  // Path comparison
  equals(path1, path2, caseSensitive = true) {
    const resolved1 = this.resolve(path1);
    const resolved2 = this.resolve(path2);

    if (caseSensitive) {
      return resolved1 === resolved2;
    } else {
      return resolved1.toLowerCase() === resolved2.toLowerCase();
    }
  }

  // Parent operations
  getParent(filepath) {
    return path.dirname(this.resolve(filepath));
  }

  getParents(filepath) {
    const parents = [];
    let current = this.resolve(filepath);
    const base = this.baseDir;

    while (current !== base && current !== path.dirname(current)) {
      current = path.dirname(current);
      if (current.startsWith(base)) {
        parents.push(current);
      }
    }

    return parents;
  }

  // Common base
  findCommonBase(paths) {
    if (paths.length === 0) return this.baseDir;
    if (paths.length === 1) return path.dirname(this.resolve(paths[0]));

    const resolved = paths.map(p => this.resolve(p));
    const components = resolved.map(p => p.split(path.sep));

    let commonParts = [];
    for (let i = 0; i < components[0].length; i++) {
      const part = components[0][i];
      if (components.every(c => c[i] === part)) {
        commonParts.push(part);
      } else {
        break;
      }
    }

    return commonParts.join(path.sep) || path.sep;
  }

  // Batch operations
  resolveBatch(paths) {
    return paths.map(p => this.resolve(p));
  }

  validateBatch(paths) {
    return paths.map(p => ({
      path: p,
      ...this.validate(p)
    }));
  }
}

const extLib = new PathLibExtended('/project');

console.log('  Testing extended functionality:');
console.log(`    Extensions of 'file.test.js': ${JSON.stringify(extLib.getAllExtensions('file.test.js'))}`);
console.log(`    Parents of 'src/lib/util.js':`);
extLib.getParents('src/lib/util.js').forEach(parent => {
  console.log(`      → ${parent}`);
});

const commonBase = extLib.findCommonBase(['src/app.js', 'src/lib/util.js', 'src/test/spec.js']);
console.log(`    Common base: ${commonBase}`);
console.log();

// 3. Fluent API
console.log('3. Fluent API Design:');

class FluentPath {
  constructor(basePath) {
    this._path = basePath;
  }

  join(...segments) {
    this._path = path.join(this._path, ...segments);
    return this;
  }

  parent() {
    this._path = path.dirname(this._path);
    return this;
  }

  normalize() {
    this._path = path.normalize(this._path);
    return this;
  }

  changeExt(newExt) {
    const parsed = path.parse(this._path);
    this._path = path.join(
      parsed.dir,
      parsed.name + (newExt.startsWith('.') ? newExt : '.' + newExt)
    );
    return this;
  }

  addSuffix(suffix) {
    const parsed = path.parse(this._path);
    this._path = path.join(parsed.dir, parsed.name + suffix + parsed.ext);
    return this;
  }

  toString() {
    return this._path;
  }

  valueOf() {
    return this._path;
  }
}

console.log('  Fluent API example:');
const fluentPath = new FluentPath('/app/src')
  .join('lib')
  .join('util.js')
  .parent()
  .join('helper.js')
  .changeExt('.ts');

console.log(`    Result: ${fluentPath.toString()}`);
console.log();

// 4. Error Handling
console.log('4. Comprehensive Error Handling:');

class PathError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PathError';
    this.code = code;
    this.details = details;
  }
}

class SafePathLib extends PathLibExtended {
  _handleError(error, operation, context = {}) {
    if (this.options.throwOnError) {
      throw error;
    }

    return {
      success: false,
      error: error.message,
      code: error.code,
      operation,
      context
    };
  }

  safeResolve(filepath) {
    try {
      const validation = this.validate(filepath);
      if (!validation.valid) {
        throw new PathError(
          validation.errors.join(', '),
          'VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }

      return {
        success: true,
        result: this.resolve(filepath)
      };
    } catch (error) {
      return this._handleError(error, 'resolve', { filepath });
    }
  }

  safeJoin(...segments) {
    try {
      const result = this.join(...segments);
      const validation = this.validate(result);

      if (!validation.valid) {
        throw new PathError(
          'Invalid result path',
          'VALIDATION_ERROR',
          { errors: validation.errors }
        );
      }

      return {
        success: true,
        result
      };
    } catch (error) {
      return this._handleError(error, 'join', { segments });
    }
  }
}

const safeLib = new SafePathLib('/app/data', { throwOnError: false });

console.log('  Testing safe operations:');
const safeTests = [
  ['valid', 'file.txt'],
  ['../../../etc/passwd']
];

safeTests.forEach(segments => {
  const result = safeLib.safeJoin(...segments);
  if (result.success) {
    console.log(`    ✓ ${segments.join('/')} → ${result.result}`);
  } else {
    console.log(`    ✗ ${segments.join('/')} → Error: ${result.error}`);
  }
});
console.log();

// 5. Production Library Example
console.log('5. Complete Production Library:');

class ProductionPathLib {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      validateAll: options.validateAll !== false,
      cache: options.cache !== false,
      logging: options.logging || false,
      ...options
    };

    this._cache = new Map();
    this._stats = {
      operations: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // Public API
  resolve(...segments) {
    this._stats.operations++;

    if (this.options.cache) {
      const key = segments.join('|');
      if (this._cache.has(key)) {
        this._stats.cacheHits++;
        return this._cache.get(key);
      }
      this._stats.cacheMisses++;
    }

    const result = path.resolve(this.baseDir, ...segments);

    if (this.options.validateAll) {
      this._validatePath(result);
    }

    if (this.options.cache) {
      this._cache.set(segments.join('|'), result);
    }

    return result;
  }

  _validatePath(filepath) {
    if (!filepath.startsWith(this.baseDir + path.sep) && filepath !== this.baseDir) {
      this._stats.errors++;
      throw new Error('Path outside base directory');
    }
  }

  getStats() {
    return { ...this._stats };
  }

  clearCache() {
    this._cache.clear();
  }
}

console.log('  Production library features:');
console.log('    • Automatic validation');
console.log('    • Built-in caching');
console.log('    • Operation statistics');
console.log('    • Error tracking');
console.log('    • Performance monitoring');
console.log();

console.log('✅ Path library implementation complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Design clear, intuitive APIs');
console.log('  • Implement comprehensive error handling');
console.log('  • Provide both sync and async methods');
console.log('  • Include validation in all operations');
console.log('  • Support fluent and traditional APIs');
console.log('  • Track statistics for monitoring');
console.log('  • Document all public methods');
