/**
 * Exercise 2: Plugin Manager
 *
 * Create a complete plugin manager that can load, isolate, and manage
 * multiple plugins with safe execution, lifecycle management, and
 * inter-plugin communication.
 *
 * Difficulty: ⭐⭐⭐ Hard
 * Estimated Time: 60-90 minutes
 *
 * Related Examples:
 * - 06-plugin-system.js
 * - 02-context-inspection.js
 *
 * Related Guides:
 * - 05-plugin-systems.md
 * - 02-context-manipulation.md
 */

const vm = require('vm');
const { EventEmitter } = require('events');

/**
 * TASK: Implement a PluginManager class
 *
 * Requirements:
 * 1. Load plugins from code strings
 * 2. Each plugin runs in isolated VM context
 * 3. Support plugin lifecycle: init(), run(), cleanup()
 * 4. Provide plugin API with: log(), emit(), storage
 * 5. Support plugin dependencies
 * 6. Handle plugin events
 * 7. Track plugin state (loaded, running, error, etc.)
 * 8. Prevent loading plugins with unmet dependencies
 * 9. Prevent unloading plugins that others depend on
 * 10. Set execution timeouts
 * 11. Collect plugin statistics
 *
 * Plugin Code Format:
 * ```
 * plugin.init = function(config) {
 *   // Initialize plugin
 * };
 *
 * plugin.run = function(input) {
 *   // Main plugin logic
 *   return result;
 * };
 *
 * plugin.cleanup = function() {
 *   // Cleanup resources
 * };
 * ```
 *
 * Example Usage:
 *
 * const manager = new PluginManager();
 *
 * await manager.load('math', mathPluginCode);
 * await manager.load('stats', statsPluginCode, { dependencies: ['math'] });
 *
 * const result = await manager.run('stats', { numbers: [1,2,3] });
 *
 * manager.on('plugin:math:error', (err) => console.error(err));
 *
 * await manager.unload('stats');
 */

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();
    // TODO: Initialize the plugin manager
    // - Set up plugin storage (Map)
    // - Set up shared storage
    // - Store options (timeout, etc.)
  }

  /**
   * Create API object for a plugin
   * @param {string} pluginName - Name of the plugin
   * @returns {object} API object
   */
  createAPI(pluginName) {
    // TODO: Create and return API object with:
    // - log: { info(), warn(), error() }
    // - emit(event, data)
    // - storage: { get(key), set(key, value), delete(key) }
    // - info: { name, version, ... }
  }

  /**
   * Create sandbox context for a plugin
   * @param {string} name - Plugin name
   * @param {Array} dependencies - Plugin dependencies
   * @param {object} config - Plugin configuration
   * @returns {object} Sandbox context
   */
  createSandbox(name, dependencies = [], config = {}) {
    // TODO: Create sandbox with:
    // - Safe built-ins (console, setTimeout, Math, JSON, etc.)
    // - Plugin API
    // - Dependencies (exports from other plugins)
    // - Plugin object with init, run, cleanup properties
    // - Config object
  }

  /**
   * Check if dependencies are loaded
   * @param {Array} dependencies - Array of plugin names
   * @throws {Error} If dependency not loaded
   */
  checkDependencies(dependencies) {
    // TODO: Verify all dependencies are loaded
    // Throw error if any dependency is missing
  }

  /**
   * Load a plugin
   * @param {string} name - Plugin name
   * @param {string} code - Plugin code
   * @param {object} options - Options { dependencies, config }
   * @returns {Promise<void>}
   */
  async load(name, code, options = {}) {
    // TODO: Implement plugin loading
    // 1. Check if plugin already loaded
    // 2. Verify dependencies
    // 3. Create sandbox
    // 4. Execute plugin code in sandbox
    // 5. Call plugin.init() if exists
    // 6. Store plugin metadata
    // 7. Emit 'loaded' event
    // 8. Handle errors
  }

  /**
   * Run a plugin
   * @param {string} name - Plugin name
   * @param {*} input - Input data
   * @returns {Promise<*>} Plugin result
   */
  async run(name, input) {
    // TODO: Implement plugin execution
    // 1. Get plugin
    // 2. Verify it has run() method
    // 3. Set plugin state to 'running'
    // 4. Execute plugin.run(input)
    // 5. Return result
    // 6. Update state
    // 7. Handle errors and emit events
  }

  /**
   * Unload a plugin
   * @param {string} name - Plugin name
   * @returns {Promise<void>}
   */
  async unload(name) {
    // TODO: Implement plugin unloading
    // 1. Check if any plugin depends on this one
    // 2. Call plugin.cleanup() if exists
    // 3. Remove from storage
    // 4. Emit 'unloaded' event
  }

  /**
   * Get plugin state
   * @param {string} name - Plugin name
   * @returns {string|null} Plugin state
   */
  getState(name) {
    // TODO: Return plugin state
    // States: 'loaded', 'ready', 'running', 'idle', 'error'
  }

  /**
   * List all loaded plugins
   * @returns {Array<string>} Plugin names
   */
  list() {
    // TODO: Return array of loaded plugin names
  }

  /**
   * Get plugin information
   * @param {string} name - Plugin name
   * @returns {object|null} Plugin info
   */
  getInfo(name) {
    // TODO: Return plugin information
    // { name, state, dependencies, hasInit, hasRun, hasCleanup }
  }

  /**
   * Get manager statistics
   * @returns {object} Statistics
   */
  getStats() {
    // TODO: Return statistics
    // { totalPlugins, byState: {...}, totalRuns, totalErrors }
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

async function runTests() {
  console.log('Testing PluginManager...\n');

  const manager = new PluginManager();
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

  // Test 1: Load simple plugin
  const simplePlugin = `
    plugin.run = function(input) {
      return input * 2;
    };
  `;

  try {
    await manager.load('simple', simplePlugin);
    test('Load simple plugin', manager.list().includes('simple'));
  } catch (err) {
    test('Load simple plugin', false);
    console.log('  Error:', err.message);
  }

  // Test 2: Run plugin
  try {
    const result = await manager.run('simple', 5);
    test('Run plugin', result === 10);
  } catch (err) {
    test('Run plugin', false);
    console.log('  Error:', err.message);
  }

  // Test 3: Plugin with init
  const initPlugin = `
    plugin.init = function(config) {
      this.multiplier = config.multiplier || 2;
    };

    plugin.run = function(input) {
      return input * this.multiplier;
    };
  `;

  try {
    await manager.load('init-test', initPlugin, {
      config: { multiplier: 3 }
    });
    const result = await manager.run('init-test', 4);
    test('Plugin with init', result === 12);
  } catch (err) {
    test('Plugin with init', false);
    console.log('  Error:', err.message);
  }

  // Test 4: Plugin with dependencies
  const mathPlugin = `
    plugin.run = function(input) {
      const { operation, a, b } = input;
      if (operation === 'add') return a + b;
      if (operation === 'multiply') return a * b;
      return 0;
    };
  `;

  const statsPlugin = `
    plugin.run = function(input) {
      const sum = deps.math({ operation: 'add', a: input.a, b: input.b });
      const product = deps.math({ operation: 'multiply', a: input.a, b: input.b });
      return { sum, product };
    };
  `;

  try {
    await manager.load('math', mathPlugin);
    await manager.load('stats', statsPlugin, { dependencies: ['math'] });
    const result = await manager.run('stats', { a: 3, b: 4 });
    test('Plugin with dependencies', result.sum === 7 && result.product === 12);
  } catch (err) {
    test('Plugin with dependencies', false);
    console.log('  Error:', err.message);
  }

  // Test 5: Prevent loading with missing dependency
  try {
    await manager.load('missing-dep', statsPlugin, { dependencies: ['nonexistent'] });
    test('Prevent missing dependency', false);
  } catch (err) {
    test('Prevent missing dependency', err.message.includes('not found') || err.message.includes('not loaded'));
  }

  // Test 6: Prevent unloading plugin with dependents
  try {
    await manager.unload('math'); // stats depends on math
    test('Prevent unload with dependents', false);
  } catch (err) {
    test('Prevent unload with dependents', err.message.includes('depend'));
  }

  // Test 7: Plugin API - logging
  let logReceived = false;
  const logPlugin = `
    plugin.run = function(input) {
      api.log.info('Test log');
      return 'logged';
    };
  `;

  try {
    await manager.load('logger', logPlugin);
    await manager.run('logger', {});
    test('Plugin API - logging', true); // If no error, logging works
  } catch (err) {
    test('Plugin API - logging', false);
    console.log('  Error:', err.message);
  }

  // Test 8: Plugin API - storage
  const storagePlugin = `
    plugin.run = function(input) {
      if (input.action === 'set') {
        api.storage.set('value', input.value);
        return 'set';
      } else {
        return api.storage.get('value');
      }
    };
  `;

  try {
    await manager.load('storage-test', storagePlugin);
    await manager.run('storage-test', { action: 'set', value: 42 });
    const result = await manager.run('storage-test', { action: 'get' });
    test('Plugin API - storage', result === 42);
  } catch (err) {
    test('Plugin API - storage', false);
    console.log('  Error:', err.message);
  }

  // Test 9: Plugin events
  let eventReceived = false;
  manager.on('plugin:event-test:custom', (data) => {
    eventReceived = data.value === 'test';
  });

  const eventPlugin = `
    plugin.run = function(input) {
      api.emit('custom', { value: input });
      return 'emitted';
    };
  `;

  try {
    await manager.load('event-test', eventPlugin);
    await manager.run('event-test', 'test');
    // Give event time to process
    await new Promise(resolve => setTimeout(resolve, 10));
    test('Plugin events', eventReceived);
  } catch (err) {
    test('Plugin events', false);
    console.log('  Error:', err.message);
  }

  // Test 10: Get plugin info
  try {
    const info = manager.getInfo('math');
    test('Get plugin info', info && info.name === 'math');
  } catch (err) {
    test('Get plugin info', false);
  }

  // Test 11: Get statistics
  try {
    const stats = manager.getStats();
    test('Get statistics', stats && stats.totalPlugins > 0);
  } catch (err) {
    test('Get statistics', false);
  }

  // Test 12: Successful unload
  try {
    await manager.unload('stats'); // Now safe to unload
    await manager.unload('math');
    test('Successful unload', !manager.list().includes('math'));
  } catch (err) {
    test('Successful unload', false);
    console.log('  Error:', err.message);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Excellent work!');
    console.log('\nNext steps:');
    console.log('1. Review the solution for alternative approaches');
    console.log('2. Try extending with more API features');
    console.log('3. Move on to Exercise 3');
  } else {
    console.log('\n💡 Some tests failed. Keep going!');
    console.log('Tips:');
    console.log('- Check examples/06-plugin-system.js for patterns');
    console.log('- Make sure dependencies are tracked correctly');
    console.log('- Implement all API methods (log, emit, storage)');
  }
}

// Uncomment to run tests
// runTests().catch(console.error);

module.exports = { PluginManager };

/**
 * INSTRUCTIONS:
 *
 * 1. Implement all methods in the PluginManager class
 * 2. Uncomment runTests() at the bottom
 * 3. Run: node exercise-2.js
 * 4. Keep working until all tests pass
 * 5. Compare with solution file when done
 *
 * HINTS:
 * - Use Map to store plugins: key=name, value={ context, dependencies, state, ... }
 * - Store plugin code execution in try-catch for proper error handling
 * - Track dependencies in both directions (what this depends on, what depends on this)
 * - Use vm.Script for executing plugin.run(), plugin.init(), etc.
 * - Emit events for plugin lifecycle: 'loaded', 'unloaded', 'error'
 * - Storage should be namespaced per plugin: `${pluginName}:${key}`
 *
 * BONUS CHALLENGES:
 * - Add plugin versioning support
 * - Implement plugin hot-reloading
 * - Add plugin permissions system
 * - Support async plugin methods
 * - Add plugin marketplace/discovery
 * - Implement plugin sandboxing levels (strict, moderate, permissive)
 */
