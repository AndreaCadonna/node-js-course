/**
 * Exercise 4: Configuration Reloader
 * ===================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Create a configuration management system that loads configuration from a JSON
 * file and reloads it when receiving SIGHUP signal (common Unix pattern for
 * configuration reload). The system should validate configuration, handle
 * errors, and maintain application state during reload.
 *
 * Requirements:
 * 1. Load configuration from JSON file at startup
 * 2. Validate configuration structure and values
 * 3. Handle SIGHUP signal to trigger reload
 * 4. Reload configuration without restarting the process
 * 5. Validate new configuration before applying
 * 6. Roll back to previous config if new config is invalid
 * 7. Maintain application state during reload
 * 8. Log all configuration changes
 *
 * Learning Goals:
 * - Using SIGHUP for configuration reload
 * - File watching and reading
 * - Configuration validation patterns
 * - Error handling with rollback
 * - State management during hot reload
 * - Production configuration patterns
 *
 * Run: node exercise-4.js
 */

const fs = require('fs');
const path = require('path');

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Application state
let currentConfig = null;
let previousConfig = null;
let configLoadCount = 0;

/**
 * Default configuration (used if file doesn't exist)
 */
const DEFAULT_CONFIG = {
  app: {
    name: 'ConfigApp',
    version: '1.0.0',
    port: 3000,
    environment: 'development'
  },
  features: {
    enableLogging: true,
    enableMetrics: false,
    maxConnections: 100
  },
  timeouts: {
    request: 30000,
    idle: 120000
  },
  database: {
    host: 'localhost',
    port: 5432,
    maxPoolSize: 10
  }
};

/**
 * TODO 1: Implement configuration schema validator
 *
 * Validate configuration has required structure:
 * - app.name (string, required, non-empty)
 * - app.port (number, required, 1-65535)
 * - features.maxConnections (number, required, > 0)
 * - timeouts.request (number, required, > 0)
 * - database.port (number, required, 1-65535)
 *
 * Return: { valid: boolean, errors: string[] }
 */
function validateConfig(config) {
  const errors = [];

  // TODO: Check if config is an object
  // if (!config || typeof config !== 'object') {
  //   errors.push('Configuration must be an object');
  //   return { valid: false, errors };
  // }

  // TODO: Validate app section
  // if (!config.app) {
  //   errors.push('Missing required section: app');
  // } else {
  //   if (!config.app.name || typeof config.app.name !== 'string') {
  //     errors.push('app.name must be a non-empty string');
  //   }
  //   if (typeof config.app.port !== 'number' || config.app.port < 1 || config.app.port > 65535) {
  //     errors.push('app.port must be a number between 1 and 65535');
  //   }
  // }

  // TODO: Validate features section
  // if (!config.features) {
  //   errors.push('Missing required section: features');
  // } else {
  //   if (typeof config.features.maxConnections !== 'number' || config.features.maxConnections <= 0) {
  //     errors.push('features.maxConnections must be a positive number');
  //   }
  // }

  // TODO: Validate timeouts section
  // if (!config.timeouts) {
  //   errors.push('Missing required section: timeouts');
  // } else {
  //   if (typeof config.timeouts.request !== 'number' || config.timeouts.request <= 0) {
  //     errors.push('timeouts.request must be a positive number');
  //   }
  // }

  // TODO: Validate database section
  // if (!config.database) {
  //   errors.push('Missing required section: database');
  // } else {
  //   if (typeof config.database.port !== 'number' || config.database.port < 1 || config.database.port > 65535) {
  //     errors.push('database.port must be a number between 1 and 65535');
  //   }
  // }

  // return { valid: errors.length === 0, errors };
}

/**
 * TODO 2: Implement configuration loader
 *
 * Steps:
 * 1. Check if config file exists
 * 2. If not, create it with default configuration
 * 3. Read and parse JSON file
 * 4. Handle parse errors
 * 5. Validate configuration
 * 6. Return parsed config or throw error
 */
function loadConfigFile() {
  console.log(`📖 Loading configuration from: ${CONFIG_FILE}`);

  // TODO: Check if file exists
  // if (!fs.existsSync(CONFIG_FILE)) {
  //   console.log('📝 Config file not found, creating with defaults...');
  //   fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
  //   console.log('✅ Default config file created');
  //   return DEFAULT_CONFIG;
  // }

  try {
    // TODO: Read file
    // const content = fs.readFileSync(CONFIG_FILE, 'utf8');

    // TODO: Parse JSON
    // const config = JSON.parse(content);

    // TODO: Validate
    // const validation = validateConfig(config);
    // if (!validation.valid) {
    //   console.error('❌ Configuration validation failed:');
    //   validation.errors.forEach(err => console.error(`   - ${err}`));
    //   throw new Error('Invalid configuration');
    // }

    // console.log('✅ Configuration loaded and validated');
    // return config;

  } catch (error) {
    // TODO: Handle errors
    // if (error instanceof SyntaxError) {
    //   console.error('❌ Invalid JSON in configuration file');
    //   throw new Error(`JSON parse error: ${error.message}`);
    // }
    // throw error;
  }
}

/**
 * TODO 3: Implement configuration diff
 *
 * Compare old and new configurations and return changes:
 * - added: keys in new but not in old
 * - removed: keys in old but not in new
 * - modified: keys with different values
 *
 * Return: { hasChanges: boolean, changes: { added, removed, modified } }
 */
function getConfigDiff(oldConfig, newConfig) {
  const changes = {
    added: [],
    removed: [],
    modified: []
  };

  /**
   * Helper to get all keys with dot notation (e.g., 'app.name', 'app.port')
   */
  function flattenObject(obj, prefix = '') {
    const flattened = {};
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], fullKey));
      } else {
        flattened[fullKey] = obj[key];
      }
    }
    return flattened;
  }

  // TODO: Flatten both configs
  // const oldFlat = flattenObject(oldConfig);
  // const newFlat = flattenObject(newConfig);

  // TODO: Find added keys
  // for (const key in newFlat) {
  //   if (!(key in oldFlat)) {
  //     changes.added.push({ key, value: newFlat[key] });
  //   }
  // }

  // TODO: Find removed keys
  // for (const key in oldFlat) {
  //   if (!(key in newFlat)) {
  //     changes.removed.push({ key, value: oldFlat[key] });
  //   }
  // }

  // TODO: Find modified keys
  // for (const key in newFlat) {
  //   if (key in oldFlat && oldFlat[key] !== newFlat[key]) {
  //     changes.modified.push({
  //       key,
  //       oldValue: oldFlat[key],
  //       newValue: newFlat[key]
  //     });
  //   }
  // }

  // const hasChanges = changes.added.length > 0 ||
  //                    changes.removed.length > 0 ||
  //                    changes.modified.length > 0;

  // return { hasChanges, changes };
}

/**
 * TODO 4: Implement configuration display
 *
 * Display configuration in readable format with sections
 */
function displayConfig(config) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 CURRENT CONFIGURATION');
  console.log('═'.repeat(60));

  // TODO: Display app section
  // console.log('\n🚀 Application:');
  // console.log(`   Name: ${config.app.name}`);
  // console.log(`   Version: ${config.app.version}`);
  // console.log(`   Port: ${config.app.port}`);
  // console.log(`   Environment: ${config.app.environment}`);

  // TODO: Display features section
  // console.log('\n⚙️  Features:');
  // console.log(`   Logging: ${config.features.enableLogging ? 'Enabled' : 'Disabled'}`);
  // console.log(`   Metrics: ${config.features.enableMetrics ? 'Enabled' : 'Disabled'}`);
  // console.log(`   Max Connections: ${config.features.maxConnections}`);

  // TODO: Display timeouts section
  // console.log('\n⏱️  Timeouts:');
  // console.log(`   Request: ${config.timeouts.request}ms`);
  // console.log(`   Idle: ${config.timeouts.idle}ms`);

  // TODO: Display database section
  // console.log('\n💾 Database:');
  // console.log(`   Host: ${config.database.host}`);
  // console.log(`   Port: ${config.database.port}`);
  // console.log(`   Pool Size: ${config.database.maxPoolSize}`);

  console.log('\n' + '═'.repeat(60) + '\n');
}

/**
 * TODO 5: Implement reload handler
 *
 * Steps:
 * 1. Save current config as previous
 * 2. Try to load new configuration
 * 3. Validate new configuration
 * 4. Compare with current config
 * 5. If valid and different, apply changes
 * 6. If invalid, roll back to previous
 * 7. Log all operations
 */
function reloadConfiguration() {
  console.log('\n' + '🔄 '.repeat(30));
  console.log('🔄 CONFIGURATION RELOAD TRIGGERED');
  console.log('🔄 '.repeat(30));

  // TODO: Save current as previous
  // previousConfig = JSON.parse(JSON.stringify(currentConfig));
  // console.log('💾 Current configuration backed up');

  try {
    // TODO: Load new configuration
    // console.log('\n📖 Loading new configuration...');
    // const newConfig = loadConfigFile();

    // TODO: Compare configurations
    // console.log('\n🔍 Comparing configurations...');
    // const diff = getConfigDiff(currentConfig, newConfig);

    // if (!diff.hasChanges) {
    //   console.log('ℹ️  No changes detected in configuration');
    //   console.log('✅ Reload complete (no changes applied)\n');
    //   return;
    // }

    // TODO: Display changes
    // console.log('\n📝 Configuration changes detected:');
    //
    // if (diff.changes.added.length > 0) {
    //   console.log('\n  ➕ Added:');
    //   diff.changes.added.forEach(({ key, value }) => {
    //     console.log(`     ${key}: ${JSON.stringify(value)}`);
    //   });
    // }
    //
    // if (diff.changes.removed.length > 0) {
    //   console.log('\n  ➖ Removed:');
    //   diff.changes.removed.forEach(({ key, value }) => {
    //     console.log(`     ${key}: ${JSON.stringify(value)}`);
    //   });
    // }
    //
    // if (diff.changes.modified.length > 0) {
    //   console.log('\n  🔄 Modified:');
    //   diff.changes.modified.forEach(({ key, oldValue, newValue }) => {
    //     console.log(`     ${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
    //   });
    // }

    // TODO: Apply new configuration
    // currentConfig = newConfig;
    // configLoadCount++;
    // console.log('\n✅ Configuration reloaded successfully!');
    // console.log(`📊 Total reloads: ${configLoadCount}`);

    // TODO: Display new configuration
    // displayConfig(currentConfig);

  } catch (error) {
    // TODO: Handle reload errors
    // console.error('\n❌ Configuration reload failed:', error.message);
    // console.log('⚠️  Rolling back to previous configuration...');
    //
    // if (previousConfig) {
    //   currentConfig = previousConfig;
    //   console.log('✅ Rollback successful - using previous configuration\n');
    // } else {
    //   console.log('⚠️  No previous configuration available\n');
    // }
  }
}

/**
 * TODO 6: Implement signal handlers
 */
function setupSignalHandlers() {
  // TODO: Handle SIGHUP for configuration reload
  // process.on('SIGHUP', () => {
  //   console.log('\n📨 Received SIGHUP signal');
  //   reloadConfiguration();
  // });

  // TODO: Handle SIGINT for graceful shutdown
  // process.on('SIGINT', () => {
  //   console.log('\n\n🛑 Received SIGINT (Ctrl+C)');
  //   console.log('👋 Shutting down gracefully...');
  //   console.log(`📊 Configuration was reloaded ${configLoadCount} time(s)\n`);
  //   process.exit(0);
  // });

  // TODO: Handle SIGTERM
  // process.on('SIGTERM', () => {
  //   console.log('\n\n🛑 Received SIGTERM');
  //   console.log('👋 Shutting down gracefully...\n');
  //   process.exit(0);
  // });
}

/**
 * TODO 7: Simulate application work
 *
 * Periodically log that the application is running and using current config
 */
function simulateApplication() {
  setInterval(() => {
    const status = currentConfig.features.enableMetrics ? '📊' : '⚙️';
    console.log(`${status} App running (Port: ${currentConfig.app.port}, ` +
                `Connections: ${currentConfig.features.maxConnections})`);
  }, 5000);
}

/**
 * TODO 8: Main function
 */
function main() {
  console.log('═'.repeat(60));
  console.log('CONFIGURATION RELOADER');
  console.log('═'.repeat(60));
  console.log();

  try {
    // TODO: Load initial configuration
    // currentConfig = loadConfigFile();
    // configLoadCount = 1;
    // displayConfig(currentConfig);

    // TODO: Set up signal handlers
    // setupSignalHandlers();

    // TODO: Display instructions
    // console.log('📖 Instructions:');
    // console.log(`   1. Edit config file: ${CONFIG_FILE}`);
    // console.log(`   2. Send SIGHUP signal: kill -SIGHUP ${process.pid}`);
    // console.log('   3. Press Ctrl+C to exit\n');

    // TODO: Start application simulation
    // simulateApplication();

  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

// Start the application
// TODO: Uncomment when ready to test
// main();

// =============================================================================
// Expected Output:
// =============================================================================

/**
 * On startup:
 * ═══════════════════════════════════════════════════════════
 * CONFIGURATION RELOADER
 * ═══════════════════════════════════════════════════════════
 *
 * 📖 Loading configuration from: /path/to/config.json
 * ✅ Configuration loaded and validated
 *
 * ═══════════════════════════════════════════════════════════
 * 📋 CURRENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 *
 * 🚀 Application:
 *    Name: ConfigApp
 *    Port: 3000
 *    ...
 *
 * On SIGHUP:
 * 🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄
 * 🔄 CONFIGURATION RELOAD TRIGGERED
 * 🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄🔄
 * 📨 Received SIGHUP signal
 * 💾 Current configuration backed up
 *
 * 📖 Loading new configuration...
 * ✅ Configuration loaded and validated
 *
 * 🔍 Comparing configurations...
 *
 * 📝 Configuration changes detected:
 *
 *   🔄 Modified:
 *      app.port: 3000 → 8080
 *      features.maxConnections: 100 → 200
 *
 * ✅ Configuration reloaded successfully!
 * 📊 Total reloads: 2
 * ...
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Validating configuration
 * Check each section exists and has required fields with correct types:
 * if (!config.app || typeof config.app.name !== 'string') {
 *   errors.push('Invalid app.name');
 * }
 *
 * Hint 2: Backing up configuration
 * Use JSON to create a deep copy:
 * previousConfig = JSON.parse(JSON.stringify(currentConfig));
 *
 * Hint 3: Flattening objects
 * Recursively build dot-notation keys:
 * flattenObject({ a: { b: 1 } }) => { 'a.b': 1 }
 *
 * Hint 4: SIGHUP handler
 * process.on('SIGHUP', () => {
 *   console.log('Reloading configuration...');
 *   reloadConfiguration();
 * });
 *
 * Hint 5: Testing reload
 * In one terminal: node exercise-4.js
 * In another: kill -SIGHUP <pid>
 * Or: kill -SIGHUP $(pgrep -f exercise-4.js)
 */

// =============================================================================
// Testing:
// =============================================================================

/**
 * Test 1: Initial load
 * $ node exercise-4.js
 * Should create config.json with defaults and display it
 *
 * Test 2: Valid config reload
 * $ node exercise-4.js
 * Edit config.json (change port to 8080)
 * $ kill -SIGHUP <pid>
 * Should reload and show changes
 *
 * Test 3: Invalid config (should rollback)
 * Edit config.json (remove required field like "app")
 * $ kill -SIGHUP <pid>
 * Should show errors and rollback
 *
 * Test 4: No changes
 * $ kill -SIGHUP <pid>
 * Should detect no changes
 *
 * Test 5: Multiple reloads
 * Send SIGHUP multiple times with different changes
 * Should track reload count
 */
