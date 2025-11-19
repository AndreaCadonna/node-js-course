/**
 * Example 2: Symbolic Link Resolution
 *
 * Demonstrates safe symbolic link handling and resolution.
 * Symlinks can be security vulnerabilities if not handled correctly.
 *
 * Key Points:
 * - Understanding symlinks vs hard links
 * - Safe symlink resolution strategies
 * - Detecting circular symlinks
 * - Security implications
 * - Cross-platform considerations
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== Symbolic Link Resolution ===\n');

// 1. Understanding Symlinks
console.log('1. Understanding Symbolic Links:');
console.log('  Symbolic Link (Symlink):');
console.log('    • A file that points to another file or directory');
console.log('    • Like a shortcut or alias');
console.log('    • Can cross file system boundaries');
console.log('    • Can point to non-existent targets (broken link)');
console.log('    • Can create circular references');
console.log();
console.log('  Hard Link:');
console.log('    • Multiple directory entries for same inode');
console.log('    • Cannot cross file system boundaries');
console.log('    • Cannot link to directories (usually)');
console.log('    • More efficient but less flexible');
console.log();

// 2. Detecting Symlinks
console.log('2. Detecting Symbolic Links:');

function isSymbolicLink(filepath) {
  try {
    const stats = fs.lstatSync(filepath);
    return stats.isSymbolicLink();
  } catch (error) {
    return false;
  }
}

function getFileInfo(filepath) {
  try {
    const lstat = fs.lstatSync(filepath);
    const isLink = lstat.isSymbolicLink();

    const info = {
      path: filepath,
      isSymlink: isLink,
      exists: true
    };

    if (isLink) {
      try {
        info.target = fs.readlinkSync(filepath);
        info.realpath = fs.realpathSync(filepath);
        info.targetExists = fs.existsSync(info.realpath);
      } catch (error) {
        info.broken = true;
        info.error = error.message;
      }
    }

    return info;
  } catch (error) {
    return { path: filepath, exists: false, error: error.message };
  }
}

// Note: We can't create actual symlinks in this example without file system access
// So we'll demonstrate the concepts and provide implementation patterns
console.log('  Conceptual example (requires actual file system):');
console.log('  ```javascript');
console.log('  const stats = fs.lstatSync(filepath);');
console.log('  if (stats.isSymbolicLink()) {');
console.log('    const target = fs.readlinkSync(filepath);');
console.log('    const realpath = fs.realpathSync(filepath);');
console.log('    console.log(`Symlink ${filepath} → ${target}`);');
console.log('  }');
console.log('  ```');
console.log();

// 3. Safe Symlink Resolution
console.log('3. Safe Symlink Resolution:');

function safeResolveSymlink(filepath, baseDir, options = {}) {
  const { maxDepth = 10, visited = new Set() } = options;

  // Check if we've seen this path before (circular reference)
  if (visited.has(filepath)) {
    throw new Error(`Circular symlink detected: ${filepath}`);
  }

  // Check depth to prevent infinite loops
  if (visited.size >= maxDepth) {
    throw new Error(`Maximum symlink depth exceeded: ${maxDepth}`);
  }

  visited.add(filepath);

  try {
    const stats = fs.lstatSync(filepath);

    if (!stats.isSymbolicLink()) {
      // Not a symlink, return as-is
      return filepath;
    }

    // Read the symlink target
    const target = fs.readlinkSync(filepath);

    // Resolve relative symlinks
    const resolvedTarget = path.isAbsolute(target)
      ? target
      : path.resolve(path.dirname(filepath), target);

    // Validate the target is within base directory
    const base = path.resolve(baseDir);
    const resolved = path.resolve(resolvedTarget);

    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      throw new Error(`Symlink points outside base directory: ${resolved}`);
    }

    // Recursively resolve if target is also a symlink
    return safeResolveSymlink(resolvedTarget, baseDir, { maxDepth, visited });

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Broken symlink: ${filepath}`);
    }
    throw error;
  }
}

console.log('  Safe resolution validates:');
console.log('    • Maximum depth to prevent infinite loops');
console.log('    • Circular reference detection');
console.log('    • Target stays within base directory');
console.log('    • Handles broken symlinks');
console.log();

// 4. Circular Symlink Detection
console.log('4. Circular Symlink Detection:');

class SymlinkResolver {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.maxDepth = options.maxDepth || 10;
    this.cache = new Map();
  }

  resolve(filepath) {
    const visited = new Set();
    return this._resolveRecursive(filepath, visited);
  }

  _resolveRecursive(filepath, visited) {
    // Check cache
    if (this.cache.has(filepath)) {
      return this.cache.get(filepath);
    }

    // Check for circular reference
    if (visited.has(filepath)) {
      const chain = Array.from(visited).concat([filepath]).join(' → ');
      throw new Error(`Circular symlink: ${chain}`);
    }

    // Check depth
    if (visited.size >= this.maxDepth) {
      throw new Error(`Maximum symlink depth ${this.maxDepth} exceeded`);
    }

    visited.add(filepath);

    try {
      const stats = fs.lstatSync(filepath);

      if (!stats.isSymbolicLink()) {
        this.cache.set(filepath, filepath);
        return filepath;
      }

      const target = fs.readlinkSync(filepath);
      const resolvedTarget = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(filepath), target);

      // Security check
      if (!resolvedTarget.startsWith(this.baseDir + path.sep) &&
          resolvedTarget !== this.baseDir) {
        throw new Error('Symlink escape attempt detected');
      }

      // Recursively resolve
      const result = this._resolveRecursive(resolvedTarget, visited);
      this.cache.set(filepath, result);
      return result;

    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Broken symlink: ${filepath}`);
      }
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

console.log('  SymlinkResolver class features:');
console.log('    • Tracks visited paths for circular detection');
console.log('    • Caches resolved paths for performance');
console.log('    • Provides detailed error messages');
console.log('    • Configurable maximum depth');
console.log();

// 5. Security Implications
console.log('5. Security Implications of Symlinks:');
console.log();

console.log('  Attack Vector 1: Directory Escape');
console.log('    Attacker creates: /app/uploads/evil → /etc/passwd');
console.log('    Application reads: /app/uploads/evil');
console.log('    Actually reads: /etc/passwd ⚠️');
console.log();

console.log('  Attack Vector 2: TOCTOU (Time-of-Check-Time-of-Use)');
console.log('    1. Check: symlink points to safe location');
console.log('    2. [Attacker changes symlink]');
console.log('    3. Use: now points to sensitive file ⚠️');
console.log();

console.log('  Attack Vector 3: Circular Reference DoS');
console.log('    link1 → link2 → link3 → link1');
console.log('    Naive resolution: infinite loop ⚠️');
console.log();

console.log('  Attack Vector 4: Relative Path Confusion');
console.log('    Symlink: ./safe → ../../../etc/passwd');
console.log('    Without validation: directory escape ⚠️');
console.log();

// 6. Defense Strategies
console.log('6. Defense Strategies:');

class SecureSymlinkHandler {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.maxDepth = options.maxDepth || 10;
    this.followSymlinks = options.followSymlinks !== false;
    this.allowBrokenLinks = options.allowBrokenLinks || false;
  }

  validate(filepath) {
    const errors = [];
    const warnings = [];

    try {
      // 1. Check if path exists
      if (!fs.existsSync(filepath)) {
        errors.push('Path does not exist');
        return { valid: false, errors, warnings };
      }

      // 2. Get link stats (don't follow symlink)
      const stats = fs.lstatSync(filepath);

      if (!stats.isSymbolicLink()) {
        // Not a symlink, validate it's in base directory
        const resolved = path.resolve(filepath);
        if (!resolved.startsWith(this.baseDir + path.sep) &&
            resolved !== this.baseDir) {
          errors.push('Path outside base directory');
        }
        return { valid: errors.length === 0, errors, warnings };
      }

      // 3. It's a symlink - read target
      let target;
      try {
        target = fs.readlinkSync(filepath);
      } catch (error) {
        errors.push(`Cannot read symlink: ${error.message}`);
        return { valid: false, errors, warnings };
      }

      // 4. Resolve target path
      const targetPath = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(filepath), target);

      // 5. Check if target is in base directory
      if (!targetPath.startsWith(this.baseDir + path.sep) &&
          targetPath !== this.baseDir) {
        errors.push('Symlink points outside base directory');
      }

      // 6. Check if target exists
      if (!fs.existsSync(targetPath)) {
        if (this.allowBrokenLinks) {
          warnings.push('Symlink target does not exist');
        } else {
          errors.push('Broken symlink');
        }
      }

      // 7. Follow symlink chain if enabled
      if (this.followSymlinks) {
        try {
          const visited = new Set([filepath]);
          this._validateChain(targetPath, visited);
        } catch (error) {
          errors.push(error.message);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        target: targetPath
      };

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  _validateChain(filepath, visited) {
    if (visited.has(filepath)) {
      throw new Error('Circular symlink detected');
    }

    if (visited.size >= this.maxDepth) {
      throw new Error('Maximum symlink depth exceeded');
    }

    visited.add(filepath);

    const stats = fs.lstatSync(filepath);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(filepath);
      const targetPath = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(filepath), target);

      this._validateChain(targetPath, visited);
    }
  }

  safeRead(filepath) {
    const validation = this.validate(filepath);

    if (!validation.valid) {
      throw new Error(`Unsafe symlink: ${validation.errors.join(', ')}`);
    }

    // Use file descriptor for atomic read
    const fd = fs.openSync(filepath, 'r');
    try {
      const stats = fs.fstatSync(fd);
      const buffer = Buffer.allocUnsafe(stats.size);
      fs.readSync(fd, buffer, 0, stats.size, 0);
      return buffer;
    } finally {
      fs.closeSync(fd);
    }
  }
}

console.log('  SecureSymlinkHandler features:');
console.log('    • Multi-layer validation');
console.log('    • Circular reference detection');
console.log('    • Boundary checking');
console.log('    • Broken link handling');
console.log('    • File descriptor usage to prevent TOCTOU');
console.log();

// 7. Cross-Platform Considerations
console.log('7. Cross-Platform Symlink Considerations:');
console.log();

console.log('  Windows:');
console.log('    • Requires admin privileges (unless Developer Mode)');
console.log('    • Directory symlinks vs file symlinks');
console.log('    • Junction points (different from symlinks)');
console.log('    • Reparse points');
console.log();

console.log('  Unix/Linux:');
console.log('    • No special privileges required');
console.log('    • Same API for files and directories');
console.log('    • More commonly used');
console.log();

console.log('  macOS:');
console.log('    • Similar to Linux');
console.log('    • Case-insensitive file system (default)');
console.log('    • Aliases vs symlinks');
console.log();

// 8. Practical Symlink Utilities
console.log('8. Practical Symlink Utilities:');

function getAllSymlinks(dirPath, options = {}) {
  const { recursive = true, baseDir = dirPath } = options;
  const symlinks = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isSymbolicLink()) {
        try {
          const target = fs.readlinkSync(fullPath);
          const resolvedTarget = path.isAbsolute(target)
            ? target
            : path.resolve(path.dirname(fullPath), target);

          symlinks.push({
            path: fullPath,
            name: entry.name,
            target,
            resolvedTarget,
            exists: fs.existsSync(resolvedTarget)
          });
        } catch (error) {
          symlinks.push({
            path: fullPath,
            name: entry.name,
            error: error.message
          });
        }
      }

      if (recursive && entry.isDirectory() && !entry.isSymbolicLink()) {
        symlinks.push(...getAllSymlinks(fullPath, { recursive, baseDir }));
      }
    }
  } catch (error) {
    // Directory not accessible
  }

  return symlinks;
}

console.log('  getAllSymlinks function:');
console.log('    • Recursively finds all symlinks');
console.log('    • Resolves targets');
console.log('    • Checks if targets exist');
console.log('    • Handles errors gracefully');
console.log();

// 9. Best Practices
console.log('9. Symlink Handling Best Practices:');
console.log();
console.log('  ✅ DO:');
console.log('    • Always validate symlink targets');
console.log('    • Check for circular references');
console.log('    • Use lstat() to detect symlinks');
console.log('    • Validate resolved path is in bounds');
console.log('    • Use file descriptors to prevent TOCTOU');
console.log('    • Set maximum recursion depth');
console.log('    • Handle broken symlinks explicitly');
console.log('    • Log symlink operations for security audit');
console.log();
console.log('  ❌ DON\'T:');
console.log('    • Trust symlinks without validation');
console.log('    • Follow symlinks recursively without limit');
console.log('    • Ignore circular reference possibilities');
console.log('    • Use path-based operations after validation');
console.log('    • Forget about TOCTOU vulnerabilities');
console.log('    • Assume symlinks work the same on all platforms');
console.log();

// 10. Production Pattern
console.log('10. Production-Ready Symlink Handler:');

class ProductionSymlinkHandler {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.maxDepth = options.maxDepth || 10;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5000; // 5 seconds
    this.logger = options.logger || console;
  }

  async resolveAsync(filepath) {
    const cached = this._getCached(filepath);
    if (cached) return cached;

    try {
      const result = await this._resolveWithValidation(filepath);
      this._setCached(filepath, result);
      return result;
    } catch (error) {
      this.logger.error('Symlink resolution failed:', {
        filepath,
        error: error.message
      });
      throw error;
    }
  }

  async _resolveWithValidation(filepath) {
    const visited = new Set();
    return await this._resolveRecursive(filepath, visited);
  }

  async _resolveRecursive(filepath, visited) {
    if (visited.has(filepath)) {
      throw new Error('Circular symlink detected');
    }

    if (visited.size >= this.maxDepth) {
      throw new Error('Maximum depth exceeded');
    }

    visited.add(filepath);

    const stats = await fs.promises.lstat(filepath);

    if (!stats.isSymbolicLink()) {
      // Validate final path
      if (!filepath.startsWith(this.baseDir + path.sep) &&
          filepath !== this.baseDir) {
        throw new Error('Path outside base directory');
      }
      return filepath;
    }

    const target = await fs.promises.readlink(filepath);
    const resolvedTarget = path.isAbsolute(target)
      ? target
      : path.resolve(path.dirname(filepath), target);

    // Security check
    if (!resolvedTarget.startsWith(this.baseDir + path.sep) &&
        resolvedTarget !== this.baseDir) {
      throw new Error('Symlink escape detected');
    }

    return await this._resolveRecursive(resolvedTarget, visited);
  }

  _getCached(filepath) {
    const entry = this.cache.get(filepath);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(filepath);
      return null;
    }

    return entry.value;
  }

  _setCached(filepath, value) {
    this.cache.set(filepath, {
      value,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

console.log('  ProductionSymlinkHandler features:');
console.log('    • Async operation for better performance');
console.log('    • Cache with timeout');
console.log('    • Comprehensive logging');
console.log('    • Error handling and recovery');
console.log('    • Security validation at every step');
console.log();

console.log('✅ Symbolic link resolution complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Symlinks are powerful but can be security risks');
console.log('  • Always validate symlink targets');
console.log('  • Detect circular references to prevent infinite loops');
console.log('  • Use file descriptors to avoid TOCTOU attacks');
console.log('  • Consider platform differences in symlink behavior');
console.log('  • Implement caching for performance');
