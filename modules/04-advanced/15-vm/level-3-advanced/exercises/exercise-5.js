/**
 * Exercise 5: Create a Secure Plugin Runtime
 *
 * Difficulty: ⭐⭐⭐ Hard
 * Estimated Time: 75-90 minutes
 *
 * Your Task:
 * Build a secure plugin runtime environment that can load and execute
 * untrusted plugins with complete isolation and controlled API access.
 *
 * Requirements:
 * 1. Plugin isolation (separate VM contexts)
 * 2. Controlled API exposure
 * 3. Plugin lifecycle management (load, start, stop, unload)
 * 4. Inter-plugin communication (with security)
 * 5. Resource limits per plugin
 * 6. Plugin sandboxing
 * 7. Event system
 * 8. Plugin registry
 *
 * Methods to implement:
 * - loadPlugin(name, code): Load and initialize plugin
 * - startPlugin(name): Start plugin execution
 * - stopPlugin(name): Stop plugin execution
 * - unloadPlugin(name): Remove plugin
 * - getPlugin(name): Get plugin info
 * - listPlugins(): List all plugins
 * - executePluginMethod(name, method, args): Call plugin function
 * - getPluginStats(name): Get plugin statistics
 */

const vm = require('vm');
const { EventEmitter } = require('events');

// TODO: Implement PluginRuntime class
class PluginRuntime extends EventEmitter {
  constructor(options = {}) {
    super();
    // TODO: Initialize runtime with:
    // - maxPlugins
    // - defaultTimeout
    // - defaultMemoryLimit
    // - enableSandbox
    // - allowedAPIs
  }

  /**
   * Create plugin API
   * TODO: Build API object for plugins
   */
  createPluginAPI(pluginName) {
    // TODO: Create API object with:
    //   - console (limited logging)
    //   - setTimeout/setInterval (with limits)
    //   - emit (event emitter)
    //   - on (event listener)
    //   - storage (get/set data)
    //   - http (if allowed - fetch only)
    // TODO: Wrap each API method for security
    // TODO: Track API usage
  }

  /**
   * Create secure context for plugin
   * TODO: Build isolated sandbox
   */
  createPluginContext(pluginName, api) {
    // TODO: Start with null prototype
    // TODO: Add safe globals (Math, JSON, Date)
    // TODO: Add plugin API
    // TODO: Add module/exports pattern
    // TODO: Wrap in protective proxy
    // TODO: Create VM context
  }

  /**
   * Load plugin
   * TODO: Parse and initialize plugin
   */
  loadPlugin(name, code, config = {}) {
    // TODO: Check if plugin already exists
    // TODO: Validate plugin name
    // TODO: Create plugin API
    // TODO: Create plugin context
    // TODO: Execute plugin code to get exports
    // TODO: Validate plugin exports (must have init method)
    // TODO: Store plugin object:
    //   - name
    //   - code
    //   - context
    //   - api
    //   - exports
    //   - status (loaded/started/stopped)
    //   - config
    //   - stats
    // TODO: Emit 'plugin-loaded' event
    // TODO: Return plugin info
  }

  /**
   * Start plugin
   * TODO: Initialize and start plugin
   */
  async startPlugin(name) {
    // TODO: Get plugin
    // TODO: Check if already started
    // TODO: Call plugin's init() method if exists
    // TODO: Update status to 'started'
    // TODO: Start resource monitoring
    // TODO: Emit 'plugin-started' event
  }

  /**
   * Stop plugin
   * TODO: Gracefully stop plugin
   */
  async stopPlugin(name) {
    // TODO: Get plugin
    // TODO: Check if running
    // TODO: Call plugin's cleanup() method if exists
    // TODO: Clear timers
    // TODO: Update status to 'stopped'
    // TODO: Stop resource monitoring
    // TODO: Emit 'plugin-stopped' event
  }

  /**
   * Unload plugin
   * TODO: Remove plugin completely
   */
  unloadPlugin(name) {
    // TODO: Get plugin
    // TODO: Stop if running
    // TODO: Clear context
    // TODO: Remove from registry
    // TODO: Emit 'plugin-unloaded' event
  }

  /**
   * Execute plugin method
   * TODO: Safely call plugin function
   */
  async executePluginMethod(name, method, args = [], timeout) {
    // TODO: Get plugin
    // TODO: Check if started
    // TODO: Validate method exists in exports
    // TODO: Execute in plugin context with timeout
    // TODO: Track execution time
    // TODO: Update stats
    // TODO: Return result
  }

  /**
   * Get plugin
   * TODO: Retrieve plugin information
   */
  getPlugin(name) {
    // TODO: Get plugin from registry
    // TODO: Return plugin object (without code)
  }

  /**
   * List all plugins
   * TODO: Return array of plugin info
   */
  listPlugins() {
    // TODO: Get all plugins
    // TODO: Return array with:
    //   - name
    //   - status
    //   - memory usage
    //   - execution count
  }

  /**
   * Get plugin statistics
   * TODO: Return detailed stats
   */
  getPluginStats(name) {
    // TODO: Get plugin
    // TODO: Return stats:
    //   - totalExecutions
    //   - totalTime
    //   - averageTime
    //   - memoryUsage
    //   - apiCalls
    //   - errors
  }

  /**
   * Send message to plugin
   * TODO: Trigger plugin event handler
   */
  async sendMessage(name, event, data) {
    // TODO: Get plugin
    // TODO: Check if plugin has event handler
    // TODO: Execute handler in plugin context
    // TODO: Return response
  }

  /**
   * Validate plugin code
   * TODO: Check for security issues
   */
  validatePluginCode(code) {
    // TODO: Check for forbidden patterns
    // TODO: Verify syntax
    // TODO: Check code length
    // TODO: Return validation result
  }

  /**
   * Get runtime statistics
   * TODO: Return overall stats
   */
  getRuntimeStats() {
    // TODO: Return:
    //   - totalPlugins
    //   - activePlugins
    //   - totalExecutions
    //   - totalMemoryUsed
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

async function runTests() {
  console.log('Testing Secure Plugin Runtime\n');
  console.log('='.repeat(60));

  const runtime = new PluginRuntime({
    maxPlugins: 10,
    defaultTimeout: 3000,
    enableSandbox: true
  });

  // Test 1: Load plugin
  console.log('\n✓ Test 1: Load Plugin');
  const plugin1 = runtime.loadPlugin('test-plugin', `
    module.exports = {
      init() {
        this.counter = 0;
      },
      increment() {
        return ++this.counter;
      },
      getCount() {
        return this.counter;
      }
    };
  `);
  console.assert(plugin1.name === 'test-plugin', 'Plugin should load');
  console.log('  Plugin loaded:', plugin1.name);

  // Test 2: Start plugin
  console.log('\n✓ Test 2: Start Plugin');
  await runtime.startPlugin('test-plugin');
  const info = runtime.getPlugin('test-plugin');
  console.assert(info.status === 'started', 'Plugin should start');
  console.log('  Plugin started');

  // Test 3: Execute plugin method
  console.log('\n✓ Test 3: Execute Plugin Method');
  const result1 = await runtime.executePluginMethod('test-plugin', 'increment');
  const result2 = await runtime.executePluginMethod('test-plugin', 'increment');
  const count = await runtime.executePluginMethod('test-plugin', 'getCount');
  console.assert(count.result === 2, 'Counter should be 2');
  console.log('  Counter:', count.result);

  // Test 4: Plugin isolation
  console.log('\n✓ Test 4: Plugin Isolation');
  runtime.loadPlugin('plugin2', `
    module.exports = {
      test() {
        return typeof counter; // Should be undefined
      }
    };
  `);
  await runtime.startPlugin('plugin2');
  const isolated = await runtime.executePluginMethod('plugin2', 'test');
  console.assert(isolated.result === 'undefined', 'Plugins should be isolated');
  console.log('  Isolation verified');

  // Test 5: List plugins
  console.log('\n✓ Test 5: List Plugins');
  const plugins = runtime.listPlugins();
  console.assert(plugins.length === 2, 'Should have 2 plugins');
  console.log('  Plugins:', plugins.map(p => p.name).join(', '));

  // Test 6: Plugin stats
  console.log('\n✓ Test 6: Plugin Statistics');
  const stats = runtime.getPluginStats('test-plugin');
  console.assert(stats.totalExecutions > 0, 'Should track executions');
  console.log('  Executions:', stats.totalExecutions);

  // Test 7: Stop plugin
  console.log('\n✓ Test 7: Stop Plugin');
  await runtime.stopPlugin('test-plugin');
  const stopped = runtime.getPlugin('test-plugin');
  console.assert(stopped.status === 'stopped', 'Plugin should stop');
  console.log('  Plugin stopped');

  // Test 8: Unload plugin
  console.log('\n✓ Test 8: Unload Plugin');
  runtime.unloadPlugin('test-plugin');
  const unloaded = runtime.getPlugin('test-plugin');
  console.assert(unloaded === null, 'Plugin should be removed');
  console.log('  Plugin unloaded');

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Uncomment to run tests
// runTests();

console.log(`
Exercise 5: Create a Secure Plugin Runtime

Next Steps:
1. Implement PluginRuntime class
2. Create plugin API layer
3. Build secure contexts per plugin
4. Implement plugin lifecycle
5. Add method execution
6. Track statistics
7. Test isolation
8. Verify security

Tips:
- Each plugin gets isolated VM context
- Expose limited API to plugins
- Use module.exports pattern
- Track resource usage per plugin
- Implement cleanup on unload
- Clear timers when stopping
- Validate plugin exports
- Handle errors gracefully

Good luck!
`);
