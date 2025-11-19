/**
 * SOLUTION: Exercise 4 - Configuration Reloader
 * ==============================================
 *
 * This solution demonstrates hot-reloading configuration using SIGHUP signal,
 * a common Unix pattern for configuration reload without process restart.
 *
 * KEY CONCEPTS:
 * - SIGHUP signal for configuration reload
 * - Configuration validation before applying
 * - Rollback on validation failure
 * - Configuration diffing
 * - Zero-downtime configuration updates
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const DEFAULT_CONFIG = {
  app: { name: 'ConfigApp', version: '1.0.0', port: 3000, environment: 'development' },
  features: { enableLogging: true, enableMetrics: false, maxConnections: 100 },
  timeouts: { request: 30000, idle: 120000 },
  database: { host: 'localhost', port: 5432, maxPoolSize: 10 }
};

let currentConfig = null;
let previousConfig = null;
let configLoadCount = 0;

/**
 * Validates configuration structure and values
 */
function validateConfig(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be an object');
    return { valid: false, errors };
  }

  // Validate app section
  if (!config.app) {
    errors.push('Missing required section: app');
  } else {
    if (!config.app.name || typeof config.app.name !== 'string') {
      errors.push('app.name must be a non-empty string');
    }
    if (typeof config.app.port !== 'number' || config.app.port < 1 || config.app.port > 65535) {
      errors.push('app.port must be a number between 1 and 65535');
    }
  }

  // Validate features section
  if (!config.features) {
    errors.push('Missing required section: features');
  } else {
    if (typeof config.features.maxConnections !== 'number' || config.features.maxConnections <= 0) {
      errors.push('features.maxConnections must be a positive number');
    }
  }

  // Validate timeouts section
  if (!config.timeouts) {
    errors.push('Missing required section: timeouts');
  } else {
    if (typeof config.timeouts.request !== 'number' || config.timeouts.request <= 0) {
      errors.push('timeouts.request must be a positive number');
    }
  }

  // Validate database section
  if (!config.database) {
    errors.push('Missing required section: database');
  } else {
    if (typeof config.database.port !== 'number' || config.database.port < 1 || config.database.port > 65535) {
      errors.push('database.port must be a number between 1 and 65535');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Loads and validates configuration from file
 */
function loadConfigFile() {
  console.log(`📖 Loading configuration from: ${CONFIG_FILE}`);

  // Create default config if file doesn't exist
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('📝 Config file not found, creating with defaults...');
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
    console.log('✅ Default config file created');
    return DEFAULT_CONFIG;
  }

  try {
    // Read and parse JSON
    const content = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(content);

    // Validate
    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      throw new Error('Invalid configuration');
    }

    console.log('✅ Configuration loaded and validated');
    return config;

  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('❌ Invalid JSON in configuration file');
      throw new Error(`JSON parse error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Compares configurations and returns differences
 */
function getConfigDiff(oldConfig, newConfig) {
  const changes = { added: [], removed: [], modified: [] };

  // Flatten objects to dot notation
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

  const oldFlat = flattenObject(oldConfig);
  const newFlat = flattenObject(newConfig);

  // Find added keys
  for (const key in newFlat) {
    if (!(key in oldFlat)) {
      changes.added.push({ key, value: newFlat[key] });
    }
  }

  // Find removed keys
  for (const key in oldFlat) {
    if (!(key in newFlat)) {
      changes.removed.push({ key, value: oldFlat[key] });
    }
  }

  // Find modified keys
  for (const key in newFlat) {
    if (key in oldFlat && oldFlat[key] !== newFlat[key]) {
      changes.modified.push({ key, oldValue: oldFlat[key], newValue: newFlat[key] });
    }
  }

  const hasChanges = changes.added.length > 0 || changes.removed.length > 0 || changes.modified.length > 0;
  return { hasChanges, changes };
}

/**
 * Displays current configuration
 */
function displayConfig(config) {
  console.log('\n' + '═'.repeat(60));
  console.log('📋 CURRENT CONFIGURATION');
  console.log('═'.repeat(60));

  console.log('\n🚀 Application:');
  console.log(`   Name: ${config.app.name}`);
  console.log(`   Version: ${config.app.version}`);
  console.log(`   Port: ${config.app.port}`);
  console.log(`   Environment: ${config.app.environment}`);

  console.log('\n⚙️  Features:');
  console.log(`   Logging: ${config.features.enableLogging ? 'Enabled' : 'Disabled'}`);
  console.log(`   Metrics: ${config.features.enableMetrics ? 'Enabled' : 'Disabled'}`);
  console.log(`   Max Connections: ${config.features.maxConnections}`);

  console.log('\n⏱️  Timeouts:');
  console.log(`   Request: ${config.timeouts.request}ms`);
  console.log(`   Idle: ${config.timeouts.idle}ms`);

  console.log('\n💾 Database:');
  console.log(`   Host: ${config.database.host}`);
  console.log(`   Port: ${config.database.port}`);
  console.log(`   Pool Size: ${config.database.maxPoolSize}`);

  console.log('\n' + '═'.repeat(60) + '\n');
}

/**
 * Reloads configuration from file
 */
function reloadConfiguration() {
  console.log('\n' + '🔄 '.repeat(30));
  console.log('🔄 CONFIGURATION RELOAD TRIGGERED');
  console.log('🔄 '.repeat(30));

  // Backup current config
  previousConfig = JSON.parse(JSON.stringify(currentConfig));
  console.log('💾 Current configuration backed up');

  try {
    // Load new configuration
    console.log('\n📖 Loading new configuration...');
    const newConfig = loadConfigFile();

    // Compare configurations
    console.log('\n🔍 Comparing configurations...');
    const diff = getConfigDiff(currentConfig, newConfig);

    if (!diff.hasChanges) {
      console.log('ℹ️  No changes detected in configuration');
      console.log('✅ Reload complete (no changes applied)\n');
      return;
    }

    // Display changes
    console.log('\n📝 Configuration changes detected:');

    if (diff.changes.added.length > 0) {
      console.log('\n  ➕ Added:');
      diff.changes.added.forEach(({ key, value }) => {
        console.log(`     ${key}: ${JSON.stringify(value)}`);
      });
    }

    if (diff.changes.removed.length > 0) {
      console.log('\n  ➖ Removed:');
      diff.changes.removed.forEach(({ key, value }) => {
        console.log(`     ${key}: ${JSON.stringify(value)}`);
      });
    }

    if (diff.changes.modified.length > 0) {
      console.log('\n  🔄 Modified:');
      diff.changes.modified.forEach(({ key, oldValue, newValue }) => {
        console.log(`     ${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
      });
    }

    // Apply new configuration
    currentConfig = newConfig;
    configLoadCount++;
    console.log('\n✅ Configuration reloaded successfully!');
    console.log(`📊 Total reloads: ${configLoadCount}`);

    // Display new configuration
    displayConfig(currentConfig);

  } catch (error) {
    // Rollback on error
    console.error('\n❌ Configuration reload failed:', error.message);
    console.log('⚠️  Rolling back to previous configuration...');

    if (previousConfig) {
      currentConfig = previousConfig;
      console.log('✅ Rollback successful - using previous configuration\n');
    } else {
      console.log('⚠️  No previous configuration available\n');
    }
  }
}

/**
 * Sets up signal handlers
 */
function setupSignalHandlers() {
  // SIGHUP for configuration reload
  process.on('SIGHUP', () => {
    console.log('\n📨 Received SIGHUP signal');
    reloadConfiguration();
  });

  // SIGINT for graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Received SIGINT (Ctrl+C)');
    console.log('👋 Shutting down gracefully...');
    console.log(`📊 Configuration was reloaded ${configLoadCount} time(s)\n`);
    process.exit(0);
  });

  // SIGTERM
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Received SIGTERM');
    console.log('👋 Shutting down gracefully...\n');
    process.exit(0);
  });
}

/**
 * Simulates application work
 */
function simulateApplication() {
  setInterval(() => {
    const status = currentConfig.features.enableMetrics ? '📊' : '⚙️';
    console.log(`${status} App running (Port: ${currentConfig.app.port}, ` +
                `Connections: ${currentConfig.features.maxConnections})`);
  }, 5000);
}

/**
 * Main function
 */
function main() {
  console.log('═'.repeat(60));
  console.log('CONFIGURATION RELOADER');
  console.log('═'.repeat(60));
  console.log();

  try {
    // Load initial configuration
    currentConfig = loadConfigFile();
    configLoadCount = 1;
    displayConfig(currentConfig);

    // Set up signal handlers
    setupSignalHandlers();

    // Display instructions
    console.log('📖 Instructions:');
    console.log(`   1. Edit config file: ${CONFIG_FILE}`);
    console.log(`   2. Send SIGHUP signal: kill -SIGHUP ${process.pid}`);
    console.log('   3. Press Ctrl+C to exit\n');

    // Start application simulation
    simulateApplication();

  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    process.exit(1);
  }
}

main();

/**
 * LEARNING NOTES:
 *
 * 1. SIGHUP is the standard Unix signal for configuration reload
 * 2. Always validate new configuration before applying
 * 3. Keep a backup of previous configuration for rollback
 * 4. Calculate and display configuration differences
 * 5. Handle JSON parse errors gracefully
 * 6. Zero-downtime configuration updates are critical in production
 */
