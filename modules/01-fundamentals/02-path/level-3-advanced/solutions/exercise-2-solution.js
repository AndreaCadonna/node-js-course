/**
 * Solution to Exercise 2: Resolve Symbolic Links Safely
 *
 * This solution demonstrates production-ready symbolic link resolution with:
 * - Circular reference detection
 * - Boundary validation
 * - Maximum depth checking
 * - Caching for performance
 * - Comprehensive error handling
 *
 * Security Considerations:
 * - Symlinks can point outside intended boundaries
 * - Circular symlinks can cause infinite loops
 * - Time-of-check-time-of-use (TOCTOU) vulnerabilities
 * - Symlinks can be used to bypass access controls
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Safely resolve a symbolic link with boundary checking
 * @param {string} filepath - Path that might be a symlink
 * @param {string} baseDir - Base directory to enforce boundaries
 * @param {object} options - Options {maxDepth: number, followSymlinks: boolean}
 * @returns {string} - Resolved real path
 * @throws {Error} - If symlink is circular, exceeds depth, or escapes boundaries
 */
function safeResolveSymlink(filepath, baseDir, options = {}) {
  const maxDepth = options.maxDepth || 10;
  const followSymlinks = options.followSymlinks !== false;

  // Validate inputs
  if (!filepath || typeof filepath !== 'string') {
    throw new Error('Invalid filepath');
  }
  if (!baseDir || typeof baseDir !== 'string') {
    throw new Error('Invalid baseDir');
  }

  // Normalize base directory
  const normalizedBase = path.resolve(baseDir);

  // If we shouldn't follow symlinks, just validate the path
  if (!followSymlinks) {
    const resolved = path.resolve(normalizedBase, filepath);
    validateBoundary(resolved, normalizedBase);
    return resolved;
  }

  // Track visited paths to detect circular references
  const visited = new Set();

  // Recursively resolve the symlink
  return resolveRecursive(filepath, normalizedBase, visited, 0, maxDepth);
}

/**
 * Recursively resolve symlinks
 * @private
 */
function resolveRecursive(filepath, baseDir, visited, depth, maxDepth) {
  // Check maximum depth
  if (depth > maxDepth) {
    throw new Error(`Maximum symlink depth exceeded (${maxDepth})`);
  }

  // Resolve the path relative to base directory
  const absolutePath = path.resolve(baseDir, filepath);

  // Check for circular reference
  if (visited.has(absolutePath)) {
    const chain = Array.from(visited).concat(absolutePath);
    throw new Error(`Circular symlink detected: ${chain.join(' → ')}`);
  }

  // Add to visited set
  visited.add(absolutePath);

  // Check if the path exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  // Check if it's a symlink
  let stats;
  try {
    stats = fs.lstatSync(absolutePath);
  } catch (error) {
    throw new Error(`Cannot stat path: ${error.message}`);
  }

  if (!stats.isSymbolicLink()) {
    // Not a symlink, validate boundary and return
    validateBoundary(absolutePath, baseDir);
    return absolutePath;
  }

  // Read the symlink target
  let target;
  try {
    target = fs.readlinkSync(absolutePath);
  } catch (error) {
    throw new Error(`Cannot read symlink: ${error.message}`);
  }

  // Resolve the target path
  // If target is relative, it's relative to the directory containing the symlink
  const symlinkDir = path.dirname(absolutePath);
  const targetPath = path.resolve(symlinkDir, target);

  // Recursively resolve if target is also a symlink
  return resolveRecursive(targetPath, baseDir, visited, depth + 1, maxDepth);
}

/**
 * Validate that a path is within the base directory
 * @private
 */
function validateBoundary(filepath, baseDir) {
  const normalizedPath = path.resolve(filepath);
  const normalizedBase = path.resolve(baseDir);

  // Check if path starts with base directory
  if (!normalizedPath.startsWith(normalizedBase + path.sep) && normalizedPath !== normalizedBase) {
    throw new Error(`Path escapes base directory: ${filepath} not in ${baseDir}`);
  }
}

/**
 * SymlinkResolver class with caching and advanced features
 *
 * Features:
 * - Automatic caching of resolutions
 * - Batch resolution
 * - Circular detection
 * - Chain tracking
 * - Statistics
 */
class SymlinkResolver {
  /**
   * @param {string} baseDir - Base directory for boundary enforcement
   * @param {object} options - Options {maxDepth: number, cacheSize: number}
   */
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.maxDepth = options.maxDepth || 10;
    this.cacheSize = options.cacheSize || 1000;
    this.cache = new Map();
    this.stats = {
      resolutions: 0,
      cacheHits: 0,
      cacheMisses: 0,
      circularDetected: 0,
      boundaryViolations: 0
    };
  }

  /**
   * Resolve a path with caching
   * @param {string} filepath - Path to resolve
   * @returns {string} - Resolved path
   */
  resolve(filepath) {
    this.stats.resolutions++;

    // Check cache first
    if (this.cache.has(filepath)) {
      this.stats.cacheHits++;
      return this.cache.get(filepath);
    }

    this.stats.cacheMisses++;

    // Resolve the path
    try {
      const resolved = safeResolveSymlink(filepath, this.baseDir, {
        maxDepth: this.maxDepth
      });

      // Add to cache
      this._addToCache(filepath, resolved);

      return resolved;
    } catch (error) {
      // Track error types
      if (error.message.includes('Circular')) {
        this.stats.circularDetected++;
      } else if (error.message.includes('escapes')) {
        this.stats.boundaryViolations++;
      }
      throw error;
    }
  }

  /**
   * Resolve multiple paths in batch
   * @param {string[]} filepaths - Array of paths to resolve
   * @returns {Map<string, {success: boolean, path?: string, error?: string}>}
   */
  resolveBatch(filepaths) {
    const results = new Map();

    for (const filepath of filepaths) {
      try {
        const resolved = this.resolve(filepath);
        results.set(filepath, { success: true, path: resolved });
      } catch (error) {
        results.set(filepath, { success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get the full symlink chain for a path
   * @param {string} filepath - Path to trace
   * @returns {string[]} - Array of paths in the symlink chain
   */
  getChain(filepath) {
    const chain = [];
    const visited = new Set();
    let currentPath = path.resolve(this.baseDir, filepath);

    while (true) {
      // Prevent infinite loops
      if (visited.has(currentPath)) {
        chain.push(`[CIRCULAR: ${currentPath}]`);
        break;
      }

      chain.push(currentPath);
      visited.add(currentPath);

      // Check if it's a symlink
      if (!fs.existsSync(currentPath)) {
        chain.push('[NOT FOUND]');
        break;
      }

      const stats = fs.lstatSync(currentPath);
      if (!stats.isSymbolicLink()) {
        // End of chain
        break;
      }

      // Read symlink target
      const target = fs.readlinkSync(currentPath);
      const symlinkDir = path.dirname(currentPath);
      currentPath = path.resolve(symlinkDir, target);
    }

    return chain;
  }

  /**
   * Detect if a path has circular symlinks
   * @param {string} filepath - Path to check
   * @returns {boolean} - True if circular
   */
  detectCircular(filepath) {
    try {
      this.resolve(filepath);
      return false;
    } catch (error) {
      return error.message.includes('Circular');
    }
  }

  /**
   * Clear the resolution cache
   */
  clearCache() {
    this.cache.clear();
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }

  /**
   * Add a path to the cache with size limits
   * @private
   */
  _addToCache(filepath, resolved) {
    // Implement LRU cache behavior
    if (this.cache.size >= this.cacheSize) {
      // Remove oldest entry (first item in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(filepath, resolved);
  }

  /**
   * Get resolver statistics
   * @returns {object} - Statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      cacheHitRate: this.stats.resolutions > 0
        ? (this.stats.cacheHits / this.stats.resolutions * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

// ============================================================================
// Test Cases and Demonstrations
// ============================================================================

console.log('=== Solution to Exercise 2: Symlink Resolution ===\n');

console.log('Test 1: Safe Resolution Concepts');
console.log('─'.repeat(60));
console.log('This exercise demonstrates safe symlink resolution.\n');
console.log('Key Security Checks:');
console.log('  ✓ Circular reference detection');
console.log('  ✓ Maximum depth enforcement');
console.log('  ✓ Boundary validation');
console.log('  ✓ Broken symlink handling');
console.log();

console.log('Test 2: SymlinkResolver Class');
console.log('─'.repeat(60));

// Create a temporary directory for testing
const testDir = path.join(os.tmpdir(), 'symlink-test-' + Date.now());
try {
  fs.mkdirSync(testDir, { recursive: true });

  // Create test files
  const fileA = path.join(testDir, 'fileA.txt');
  const fileB = path.join(testDir, 'fileB.txt');
  const subdir = path.join(testDir, 'subdir');

  fs.writeFileSync(fileA, 'Content of A');
  fs.writeFileSync(fileB, 'Content of B');
  fs.mkdirSync(subdir);

  // Create symbolic links (platform-dependent)
  try {
    // Link to file
    const linkToA = path.join(testDir, 'linkToA.txt');
    fs.symlinkSync(fileA, linkToA);
    console.log('✓ Created symlink: linkToA.txt → fileA.txt');

    // Link to link (chain)
    const linkToLink = path.join(testDir, 'linkToLink.txt');
    fs.symlinkSync(linkToA, linkToLink);
    console.log('✓ Created symlink chain: linkToLink.txt → linkToA.txt → fileA.txt');

    // Test resolution
    const resolver = new SymlinkResolver(testDir);

    console.log('\nResolving symlinks:');
    const resolved1 = resolver.resolve('linkToA.txt');
    console.log(`  linkToA.txt → ${path.relative(testDir, resolved1)}`);

    const resolved2 = resolver.resolve('linkToLink.txt');
    console.log(`  linkToLink.txt → ${path.relative(testDir, resolved2)}`);

    // Show chain
    console.log('\nSymlink chains:');
    const chain = resolver.getChain('linkToLink.txt');
    chain.forEach((p, i) => {
      const relativePath = p.startsWith('[') ? p : path.relative(testDir, p);
      console.log(`  ${i + 1}. ${relativePath}`);
    });

    // Test caching
    console.log('\nCache performance:');
    for (let i = 0; i < 100; i++) {
      resolver.resolve('linkToLink.txt');
    }
    const stats = resolver.getStats();
    console.log(`  Total resolutions: ${stats.resolutions}`);
    console.log(`  Cache hits: ${stats.cacheHits}`);
    console.log(`  Cache hit rate: ${stats.cacheHitRate}`);

  } catch (symlinkError) {
    console.log('⚠ Cannot create symlinks (may require admin/sudo):');
    console.log(`  ${symlinkError.message}`);
    console.log('\nNote: On Windows, creating symlinks requires administrator privileges');
    console.log('or Developer Mode enabled.');
  }

  // Clean up
  fs.rmSync(testDir, { recursive: true, force: true });

} catch (error) {
  console.log('⚠ Test setup error:', error.message);
}
console.log();

console.log('Test 3: Boundary Validation');
console.log('─'.repeat(60));

// Create resolver with restricted base
const restrictedResolver = new SymlinkResolver('/app/data');

console.log('Testing boundary enforcement:');
console.log('  Base directory: /app/data');
console.log();

// Simulate tests (without actual symlinks)
const boundaryTests = [
  {
    path: 'uploads/file.txt',
    description: 'Path within boundary',
    shouldPass: true
  },
  {
    path: '../../../etc/passwd',
    description: 'Path escaping via ..',
    shouldPass: false
  }
];

boundaryTests.forEach(test => {
  console.log(`  • ${test.description}`);
  console.log(`    Path: ${test.path}`);
  console.log(`    Expected: ${test.shouldPass ? 'PASS' : 'FAIL'}`);
});
console.log();

console.log('Test 4: Error Handling');
console.log('─'.repeat(60));

const errorTests = [
  {
    scenario: 'Circular symlink',
    example: 'link1 → link2 → link3 → link1',
    errorType: 'Circular symlink detected'
  },
  {
    scenario: 'Depth exceeded',
    example: 'Chain longer than maxDepth',
    errorType: 'Maximum symlink depth exceeded'
  },
  {
    scenario: 'Broken symlink',
    example: 'link → nonexistent',
    errorType: 'Path does not exist'
  },
  {
    scenario: 'Boundary escape',
    example: 'link → ../../outside',
    errorType: 'Path escapes base directory'
  }
];

errorTests.forEach(test => {
  console.log(`  • ${test.scenario}`);
  console.log(`    Example: ${test.example}`);
  console.log(`    Error: ${test.errorType}`);
});
console.log();

console.log('Test 5: Batch Resolution');
console.log('─'.repeat(60));

const batchResolver = new SymlinkResolver('/app');
console.log('Batch resolving multiple paths:');
console.log('  (Simulated results)\n');

const batchPaths = [
  'data/file1.txt',
  'uploads/image.jpg',
  'cache/temp.dat'
];

console.log('Input paths:');
batchPaths.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p}`);
});
console.log();

console.log('Results would show:');
console.log('  • Success/failure for each path');
console.log('  • Resolved path or error message');
console.log('  • Performance statistics');
console.log();

console.log('✅ Exercise 2 Solution Complete\n');

console.log('Key Takeaways:');
console.log('─'.repeat(60));
console.log('  1. Always use fs.lstatSync() to detect symlinks (not stat)');
console.log('  2. Track visited paths to prevent infinite loops');
console.log('  3. Validate final resolved path is within boundaries');
console.log('  4. Set reasonable maximum depth limits');
console.log('  5. Use caching for frequently accessed paths');
console.log('  6. Provide detailed error messages for debugging');
console.log();

console.log('💡 Production Tips:');
console.log('─'.repeat(60));
console.log('  • Use fs.realpathSync() as a starting point, then validate');
console.log('  • Consider TOCTOU vulnerabilities (use file descriptors)');
console.log('  • Log all symlink escapes as security events');
console.log('  • Test with actual symlinks on target platform');
console.log('  • Document platform differences (Windows vs Unix)');
console.log('  • Implement rate limiting for resolution operations');
console.log();

console.log('Security Reminders:');
console.log('─'.repeat(60));
console.log('  ⚠ Symlinks can bypass directory restrictions');
console.log('  ⚠ Attacker can change symlink between check and use');
console.log('  ⚠ Always validate the final resolved path');
console.log('  ⚠ Use file descriptors instead of paths when possible');
console.log('  ⚠ Consider disabling symlinks in sensitive directories');
