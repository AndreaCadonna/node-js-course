/**
 * Exercise 5: Safe Module Loader
 *
 * Create a safe module loader with whitelist/blacklist support, custom
 * module resolution, and proper caching with circular dependency handling.
 *
 * Difficulty: ⭐⭐⭐ Hard
 * Estimated Time: 60-90 minutes
 *
 * Related Examples:
 * - 04-module-loading.js
 * - 01-script-reuse.js
 *
 * Related Guides:
 * - 01-script-patterns.md
 * - 03-resource-control.md
 */

const vm = require('vm');
const path = require('path');
const fs = require('fs');

/**
 * TASK: Implement a SafeModuleLoader class
 *
 * Requirements:
 * 1. Load modules from files with custom require()
 * 2. Support CommonJS module format (module.exports, exports)
 * 3. Module caching to prevent duplicate loading
 * 4. Handle circular dependencies correctly
 * 5. Support whitelist (only allowed modules)
 * 6. Support blacklist (blocked modules)
 * 7. Resolve module paths (./, ../, absolute, node_modules)
 * 8. Support both .js and .json files
 * 9. Provide module metadata (__filename, __dirname)
 * 10. Set execution timeout for module loading
 * 11. Track loading statistics
 * 12. Support module unloading
 *
 * Example Usage:
 *
 * const loader = new SafeModuleLoader({
 *   basePath: '/app/modules',
 *   whitelist: ['./utils.js', './helpers/*.js']
 * });
 *
 * const utils = loader.require('./utils.js');
 * utils.someFunction();
 */

class SafeModuleLoader {
  constructor(options = {}) {
    // TODO: Initialize the module loader
    // - Set base path for module resolution
    // - Initialize module cache
    // - Store whitelist/blacklist
    // - Initialize statistics
  }

  /**
   * Resolve module path
   * @param {string} modulePath - Module path to resolve
   * @param {string} fromPath - Path of requesting module
   * @returns {string} Resolved absolute path
   */
  resolve(modulePath, fromPath = this.basePath) {
    // TODO: Resolve module path
    // 1. Handle relative paths (./, ../)
    // 2. Handle absolute paths
    // 3. Handle node_modules (simplified)
    // 4. Try adding .js extension if needed
    // 5. Try /index.js if path is directory
    // 6. Return absolute path
  }

  /**
   * Check if module is allowed
   * @param {string} resolvedPath - Resolved module path
   * @returns {boolean} True if allowed
   * @throws {Error} If blocked
   */
  isAllowed(resolvedPath) {
    // TODO: Check whitelist/blacklist
    // 1. If whitelist exists, path must match whitelist
    // 2. If blacklist exists, path must not match blacklist
    // 3. Support glob patterns (*, **)
    // 4. Throw error if blocked
  }

  /**
   * Load a JavaScript module
   * @param {string} filepath - Absolute path to module
   * @param {object} context - VM context
   * @returns {*} Module exports
   */
  loadJS(filepath, context) {
    // TODO: Load JavaScript module
    // 1. Read file content
    // 2. Wrap in CommonJS format:
    //    (function(exports, require, module, __filename, __dirname) {
    //      // module code
    //    })
    // 3. Compile to vm.Script
    // 4. Execute in context
    // 5. Return module.exports
  }

  /**
   * Load a JSON module
   * @param {string} filepath - Absolute path to JSON file
   * @returns {*} Parsed JSON
   */
  loadJSON(filepath) {
    // TODO: Load JSON module
    // 1. Read file content
    // 2. Parse JSON
    // 3. Return parsed data
  }

  /**
   * Create require function for a module
   * @param {string} modulePath - Path of current module
   * @returns {function} Custom require function
   */
  createRequire(modulePath) {
    // TODO: Create custom require function
    // Should resolve paths relative to modulePath
    // Should call this.require() with proper fromPath
  }

  /**
   * Require a module
   * @param {string} modulePath - Module path
   * @param {string} fromPath - Path of requesting module
   * @returns {*} Module exports
   */
  require(modulePath, fromPath) {
    // TODO: Load and return module
    // 1. Resolve module path
    // 2. Check if allowed
    // 3. Check cache - return if already loaded
    // 4. Create module object: { exports: {}, loaded: false }
    // 5. Cache immediately (for circular deps)
    // 6. Load based on extension (.js or .json)
    // 7. Mark as loaded
    // 8. Return exports
    // 9. Update statistics
  }

  /**
   * Unload a module from cache
   * @param {string} modulePath - Module path
   */
  unload(modulePath) {
    // TODO: Remove module from cache
    // Allow re-loading the module
  }

  /**
   * Clear all cached modules
   */
  clearCache() {
    // TODO: Clear module cache
  }

  /**
   * Get loaded modules
   * @returns {Array<string>} Array of loaded module paths
   */
  getLoadedModules() {
    // TODO: Return list of cached module paths
  }

  /**
   * Get module metadata
   * @param {string} modulePath - Module path
   * @returns {object|null} Module metadata
   */
  getModuleInfo(modulePath) {
    // TODO: Return module information
    // { path, loaded, hasCircularDep, loadTime, ... }
  }

  /**
   * Get loader statistics
   * @returns {object} Statistics
   */
  getStats() {
    // TODO: Return statistics
    // { totalLoads, cacheHits, cacheMisses, errors, ... }
  }

  /**
   * Check for circular dependencies
   * @param {string} modulePath - Module to check
   * @returns {Array<string>} Circular dependency chain if found
   */
  detectCircularDep(modulePath) {
    // TODO: Detect circular dependencies
    // Return array of module paths in circular chain
    // Return empty array if no circular dep
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

async function runTests() {
  console.log('Testing SafeModuleLoader...\n');

  let passed = 0;
  let failed = 0;

  function test(name, condition) {
    if (condition) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}`);
      failed++;
    }
  }

  // Create test directory
  const testDir = '/tmp/vm-module-loader-test';
  try {
    fs.mkdirSync(testDir, { recursive: true });

    // Create test modules
    fs.writeFileSync(path.join(testDir, 'math.js'), `
      exports.add = function(a, b) {
        return a + b;
      };

      exports.multiply = function(a, b) {
        return a * b;
      };
    `);

    fs.writeFileSync(path.join(testDir, 'config.json'), JSON.stringify({
      name: 'Test App',
      version: '1.0.0'
    }));

    fs.writeFileSync(path.join(testDir, 'greet.js'), `
      module.exports = function(name) {
        return 'Hello, ' + name + '!';
      };
    `);

    fs.writeFileSync(path.join(testDir, 'circular-a.js'), `
      const b = require('./circular-b.js');
      exports.name = 'A';
      exports.getBName = function() {
        return b.name || 'B not ready';
      };
    `);

    fs.writeFileSync(path.join(testDir, 'circular-b.js'), `
      const a = require('./circular-a.js');
      exports.name = 'B';
      exports.getAName = function() {
        return a.name || 'A not ready';
      };
    `);

    fs.writeFileSync(path.join(testDir, 'blocked.js'), `
      exports.dangerous = true;
    `);

    console.log('Created test modules\n');

    // Test 1: Create loader
    const loader = new SafeModuleLoader({
      basePath: testDir
    });
    test('Create loader', loader !== null);

    // Test 2: Load simple module
    try {
      const math = loader.require('./math.js');
      test('Load simple module', typeof math.add === 'function');
      test('Module functionality', math.add(2, 3) === 5);
    } catch (err) {
      test('Load simple module', false);
      test('Module functionality', false);
      console.log('  Error:', err.message);
    }

    // Test 3: Load JSON module
    try {
      const config = loader.require('./config.json');
      test('Load JSON module', config.name === 'Test App');
    } catch (err) {
      test('Load JSON module', false);
      console.log('  Error:', err.message);
    }

    // Test 4: Module caching
    try {
      const math1 = loader.require('./math.js');
      const math2 = loader.require('./math.js');
      test('Module caching', math1 === math2);
    } catch (err) {
      test('Module caching', false);
    }

    // Test 5: Module with module.exports
    try {
      const greet = loader.require('./greet.js');
      test('module.exports', greet('World') === 'Hello, World!');
    } catch (err) {
      test('module.exports', false);
      console.log('  Error:', err.message);
    }

    // Test 6: Circular dependencies
    try {
      const a = loader.require('./circular-a.js');
      const b = loader.require('./circular-b.js');
      test('Circular dependencies', a.name === 'A' && b.name === 'B');
    } catch (err) {
      test('Circular dependencies', false);
      console.log('  Error:', err.message);
    }

    // Test 7: Whitelist
    const whitelistLoader = new SafeModuleLoader({
      basePath: testDir,
      whitelist: ['./math.js', './config.json']
    });
    try {
      whitelistLoader.require('./math.js');
      test('Whitelist allowed', true);
    } catch (err) {
      test('Whitelist allowed', false);
    }

    try {
      whitelistLoader.require('./greet.js');
      test('Whitelist blocked', false);
    } catch (err) {
      test('Whitelist blocked', err.message.includes('not allowed') || err.message.includes('blocked'));
    }

    // Test 8: Blacklist
    const blacklistLoader = new SafeModuleLoader({
      basePath: testDir,
      blacklist: ['./blocked.js']
    });
    try {
      blacklistLoader.require('./blocked.js');
      test('Blacklist blocking', false);
    } catch (err) {
      test('Blacklist blocking', err.message.includes('not allowed') || err.message.includes('blocked'));
    }

    // Test 9: Get loaded modules
    try {
      const loaded = loader.getLoadedModules();
      test('Get loaded modules', Array.isArray(loaded) && loaded.length > 0);
    } catch (err) {
      test('Get loaded modules', false);
    }

    // Test 10: Unload module
    try {
      loader.unload('./math.js');
      const loadedAfter = loader.getLoadedModules();
      const stillLoaded = loadedAfter.some(p => p.includes('math.js'));
      test('Unload module', !stillLoaded);
    } catch (err) {
      test('Unload module', false);
    }

    // Test 11: Statistics
    try {
      const stats = loader.getStats();
      test('Statistics', stats && typeof stats.totalLoads === 'number');
    } catch (err) {
      test('Statistics', false);
    }

    // Test 12: Clear cache
    try {
      loader.clearCache();
      const loaded = loader.getLoadedModules();
      test('Clear cache', loaded.length === 0);
    } catch (err) {
      test('Clear cache', false);
    }

    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('\nCleaned up test directory');

  } catch (err) {
    console.error('Test setup error:', err.message);
    failed += 12;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Excellent work!');
    console.log('\nNext steps:');
    console.log('1. Review the solution for advanced techniques');
    console.log('2. Try implementing module hot-reloading');
    console.log('3. Move on to Level 3: Advanced');
  } else {
    console.log('\n💡 Some tests failed. Keep going!');
    console.log('Tips:');
    console.log('- Check examples/04-module-loading.js for patterns');
    console.log('- Cache modules immediately before loading (circular deps)');
    console.log('- Use path.resolve() for path resolution');
  }
}

// Uncomment to run tests
// runTests().catch(console.error);

module.exports = { SafeModuleLoader };

/**
 * INSTRUCTIONS:
 *
 * 1. Implement all methods in the SafeModuleLoader class
 * 2. Uncomment runTests() at the bottom
 * 3. Run: node exercise-5.js
 * 4. Keep working until all tests pass
 * 5. Compare with solution file when done
 *
 * HINTS:
 * - Use Map for module cache: key = absolute path, value = module object
 * - Module object: { exports: {}, loaded: false, ... }
 * - Cache module immediately before loading (handles circular deps)
 * - CommonJS wrapper: (function(exports, require, module, __filename, __dirname) { code })
 * - For JSON: just parse and return, no need for VM
 * - Path resolution: path.resolve(fromDir, modulePath)
 * - Check file extension: path.extname(filepath)
 * - See examples/04-module-loading.js for complete reference
 *
 * BONUS CHALLENGES:
 * - Add ES modules support (import/export)
 * - Implement package.json resolution
 * - Support module transformers/loaders
 * - Add module version management
 * - Implement module hooks (before/after load)
 * - Add source map support for debugging
 */
