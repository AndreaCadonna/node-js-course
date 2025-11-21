/**
 * Complete Example
 * Demonstrates all features of the secure plugin system
 */

const path = require('path');
const { PluginManager } = require('../src');

async function main() {
  console.log('=== Secure Plugin System - Complete Example ===\n');

  // Create plugin manager
  const pluginManager = new PluginManager({
    pluginsDir: path.join(__dirname, '../plugins'),
    dataDir: path.join(__dirname, '../data'),
    autoActivate: true,
    scanPlugins: true,
    requireSignature: false // Set to true if you have signed plugins
  });

  // Setup event listeners
  setupEventListeners(pluginManager);

  // Initialize
  console.log('Initializing plugin manager...\n');
  await pluginManager.initialize();

  // Load all plugins
  console.log('Loading plugins...\n');
  const results = await pluginManager.loadPlugins();

  console.log('\n=== Load Results ===');
  console.log(`Successfully loaded: ${results.loaded.length}`);
  console.log(`Failed to load: ${results.failed.length}\n`);

  if (results.failed.length > 0) {
    console.log('Failed plugins:');
    results.failed.forEach(({ id, error }) => {
      console.log(`  - ${id}: ${error}`);
    });
    console.log('');
  }

  // List all plugins
  console.log('=== Loaded Plugins ===');
  const plugins = pluginManager.listPlugins();
  plugins.forEach(plugin => {
    console.log(`\n${plugin.name} (${plugin.id}) v${plugin.version}`);
    console.log(`  Status: ${plugin.status}`);
    console.log(`  Permissions: ${plugin.permissions.join(', ') || 'none'}`);
    console.log(`  Description: ${plugin.description}`);
  });

  // Execute plugins
  console.log('\n\n=== Executing Plugins ===\n');

  // 1. Hello World plugin
  try {
    console.log('1. Hello World Plugin:');
    const result1 = await pluginManager.execute('hello-world', 'Plugin System');
    console.log('   Result:', result1);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // 2. Text Processor plugin
  try {
    console.log('\n2. Text Processor Plugin:');

    // Hash operation
    const result2a = await pluginManager.execute('text-processor', {
      text: 'Hello, Secure Plugin System!',
      operation: 'hash',
      algorithm: 'sha256'
    });
    console.log('   Hash:', result2a);

    // Word count
    const result2b = await pluginManager.execute('text-processor', {
      text: 'The quick brown fox jumps over the lazy dog',
      operation: 'wordcount'
    });
    console.log('   Word count:', result2b);

    // Text stats
    const result2c = await pluginManager.execute('text-processor', {
      text: 'Hello World!\nThis is line 2.\nAnd line 3.',
      operation: 'stats'
    });
    console.log('   Stats:', result2c);
  } catch (error) {
    console.error('   Error:', error.message);
  }

  // 3. Data Fetcher plugin (if network is available)
  try {
    console.log('\n3. Data Fetcher Plugin:');

    // This will fail without actual network access, so we catch the error
    try {
      const result3 = await pluginManager.execute('data-fetcher', {
        url: 'https://httpbin.org/json',
        filename: 'test-data.json',
        method: 'GET'
      });
      console.log('   Result:', result3);
    } catch (error) {
      console.log('   (Network request failed - this is expected in sandboxed environment)');
      console.log('   Error:', error.message);
    }
  } catch (error) {
    console.error('   Plugin error:', error.message);
  }

  // Configure a plugin
  console.log('\n\n=== Plugin Configuration ===\n');
  try {
    await pluginManager.configure('text-processor', {
      cacheEnabled: false,
      maxCacheSize: 50
    });
    console.log('Text Processor configured successfully');
  } catch (error) {
    console.error('Configuration error:', error.message);
  }

  // Get statistics
  console.log('\n\n=== Statistics ===\n');
  const stats = pluginManager.getStats();

  console.log('Plugin Statistics:');
  console.log(`  Total: ${stats.plugins.total}`);
  console.log(`  Active: ${stats.plugins.byStatus.active}`);
  console.log(`  Disabled: ${stats.plugins.byStatus.disabled}`);
  console.log(`  Error: ${stats.plugins.byStatus.error}`);

  console.log('\nPlugin Details:');
  stats.plugins.plugins.forEach(plugin => {
    console.log(`  ${plugin.name} (${plugin.id}):`);
    console.log(`    Status: ${plugin.status}`);
    console.log(`    Executions: ${plugin.executions}`);
    console.log(`    Avg Execution Time: ${plugin.avgExecutionTime}ms`);
    console.log(`    Error Rate: ${(plugin.errorRate * 100).toFixed(2)}%`);
  });

  // Security reports
  console.log('\n\n=== Security Reports ===\n');
  for (const plugin of plugins) {
    if (plugin.status === 'active') {
      const report = await pluginManager.createSecurityReport(plugin.id);
      console.log(`${plugin.name}:`);
      console.log(`  Overall: ${report.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`  Code Scan: ${report.checks.codeScan.passed ? 'PASSED' : 'FAILED'}`);
      if (!report.checks.codeScan.passed) {
        console.log(`    Issues: ${report.checks.codeScan.issues.length}`);
      }
      console.log(`  Permissions: ${report.checks.permissions.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`  Integrity: ${report.checks.integrity.passed ? 'PASSED' : 'FAILED'}`);
      console.log('');
    }
  }

  // Plugin info
  console.log('=== Plugin Information ===\n');
  const pluginInfo = pluginManager.getPluginInfo('text-processor');
  if (pluginInfo) {
    console.log('Text Processor Plugin:');
    console.log('  Basic Info:');
    console.log(`    ID: ${pluginInfo.id}`);
    console.log(`    Name: ${pluginInfo.name}`);
    console.log(`    Version: ${pluginInfo.version}`);
    console.log(`    Status: ${pluginInfo.status}`);
    console.log('  Resource Usage:');
    if (pluginInfo.resourceUsage) {
      console.log(`    Memory: ${(pluginInfo.resourceUsage.memoryUsage / 1024).toFixed(2)} KB`);
      console.log(`    Memory Limit: ${(pluginInfo.resourceUsage.memoryLimit / 1024 / 1024).toFixed(2)} MB`);
      console.log(`    CPU Time: ${pluginInfo.resourceUsage.cpuTime}ms`);
    }
    console.log('  Statistics:');
    console.log(`    Executions: ${pluginInfo.stats.executions}`);
    console.log(`    Avg Execution Time: ${pluginInfo.stats.avgExecutionTime}ms`);
    console.log(`    Error Rate: ${(pluginInfo.stats.errorRate * 100).toFixed(2)}%`);
  }

  // Demonstrate reload
  console.log('\n\n=== Plugin Reload ===\n');
  try {
    console.log('Reloading hello-world plugin...');
    await pluginManager.reload('hello-world');
    console.log('Plugin reloaded successfully');

    const result = await pluginManager.execute('hello-world', 'Reloaded System');
    console.log('Result after reload:', result);
  } catch (error) {
    console.error('Reload error:', error.message);
  }

  // Cleanup
  console.log('\n\n=== Shutdown ===\n');
  console.log('Shutting down plugin manager...');
  await pluginManager.shutdown();
  console.log('Shutdown complete');

  console.log('\n=== Example Complete ===');
}

/**
 * Setup event listeners
 */
function setupEventListeners(pluginManager) {
  pluginManager.on('plugin:loaded', (plugin) => {
    console.log(`✓ Loaded: ${plugin.name} (${plugin.id})`);
  });

  pluginManager.on('plugin:activated', (plugin) => {
    console.log(`✓ Activated: ${plugin.name}`);
  });

  pluginManager.on('plugin:error', (data) => {
    console.error(`✗ Error in ${data.plugin.id}:`, data.error.message);
  });

  pluginManager.on('plugin:execution', (data) => {
    if (data.success) {
      console.log(`  → ${data.pluginId} executed in ${data.executionTime}ms`);
    } else {
      console.error(`  ✗ ${data.pluginId} execution failed: ${data.error}`);
    }
  });

  pluginManager.on('plugin:log', (data) => {
    const prefix = `[${data.pluginId}]`;
    if (data.level === 'error') {
      console.error(prefix, ...data.args);
    } else if (data.level === 'warn') {
      console.warn(prefix, ...data.args);
    } else {
      console.log(prefix, ...data.args);
    }
  });

  pluginManager.on('security:scan-failed', (data) => {
    console.warn(`⚠️  Security scan failed for ${data.plugin.id}:`);
    data.issues.forEach(issue => {
      console.warn(`    - [${issue.severity}] ${issue.message}`);
    });
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
