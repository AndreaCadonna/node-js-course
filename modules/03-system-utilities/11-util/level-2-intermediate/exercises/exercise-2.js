/**
 * Exercise 2: Implement Deprecation System
 *
 * DIFFICULTY: ⭐⭐ Intermediate
 * TIME: 25-30 minutes
 *
 * OBJECTIVE:
 * Create a comprehensive deprecation warning system for an API that helps users
 * migrate to new versions. This teaches proper API evolution and user communication.
 *
 * REQUIREMENTS:
 * 1. Create an API with old and new versions of methods
 * 2. Use util.deprecate() to mark old methods
 * 3. Create deprecation codes and documentation
 * 4. Implement different deprecation levels (warning, error)
 * 5. Provide clear migration guides in warnings
 *
 * BONUS CHALLENGES:
 * - Track all deprecation warnings issued
 * - Create a deprecation timeline (when features will be removed)
 * - Generate a deprecation report
 * - Implement a "deprecation budget" system
 *
 * HINTS:
 * - Use util.deprecate with custom codes
 * - Provide detailed migration messages
 * - Consider environment-based deprecation behavior
 * - Track unique deprecation warnings
 */

const util = require('util');

// TODO 1: Create ConfigManager with old and new APIs
class ConfigManager {
  constructor() {
    this.config = {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://localhost/mydb',
      },
    };
  }

  // TODO: New API - getConfig(path)
  // Gets config value by path: 'server.port'
  getConfig(path) {
    // Your code here
  }

  // TODO: Old API - getServerPort() [DEPRECATED]
  // Should return server port
  // Mark as deprecated with util.deprecate
  // Message: "Use getConfig('server.port') instead"
  // Code: DEP0001
  getServerPort() {
    // Your code here:
    // 1. Create deprecated wrapper
    // 2. Call getConfig internally
    // 3. Return result
  }

  // TODO: Old API - getDatabaseUrl() [DEPRECATED]
  // Similar to getServerPort
  // Code: DEP0002
  getDatabaseUrl() {
    // Your code here
  }

  // TODO: New API - setConfig(path, value)
  // Sets config value by path
  setConfig(path, value) {
    // Your code here
  }

  // TODO: Old API - updateServerConfig(port, host) [DEPRECATED]
  // Should update server config
  // Code: DEP0003
  // Warning: Include migration example in message
  updateServerConfig(port, host) {
    // Your code here
  }

  // TODO: Create a method with deprecated parameter
  // loadConfig(path, options)
  // options.sync is deprecated (use options.async = false instead)
  // Code: DEP0004
  loadConfig(path, options = {}) {
    // Your code here:
    // 1. Check if 'sync' option is used
    // 2. Issue deprecation warning
    // 3. Convert to new option format
    // 4. Continue processing
  }
}

// TODO 2: Create DeprecationTracker
class DeprecationTracker {
  constructor() {
    this.warnings = new Map(); // code -> { count, message, firstSeen, lastSeen }
  }

  // TODO: Track a deprecation warning
  track(code, message) {
    // Your code here:
    // 1. Record deprecation usage
    // 2. Track count and timestamps
    // 3. Return tracking info
  }

  // TODO: Get deprecation report
  getReport() {
    // Your code here:
    // Return formatted report of all deprecations
  }

  // TODO: Check if deprecation budget is exceeded
  checkBudget(maxWarnings = 10) {
    // Your code here:
    // Return true if under budget, false otherwise
  }
}

// TODO 3: Create enhanced deprecate function
function enhancedDeprecate(fn, options) {
  // Options:
  // - message: Deprecation message
  // - code: Deprecation code (DEP0001)
  // - removeIn: Version when it will be removed (v3.0.0)
  // - alternative: What to use instead
  // - migrationGuide: URL to migration guide
  // - tracker: DeprecationTracker instance

  // Your code here:
  // 1. Build detailed warning message
  // 2. Create deprecated function with util.deprecate
  // 3. Track deprecation if tracker provided
  // 4. Return deprecated function
}

// TODO 4: Test the deprecation system
async function testDeprecationSystem() {
  console.log('=== Testing Deprecation System ===\n');

  const tracker = new DeprecationTracker();
  const config = new ConfigManager();

  // TODO: Test old APIs (should show deprecation warnings)
  console.log('Testing deprecated APIs:');
  // - Call getServerPort()
  // - Call getDatabaseUrl()
  // - Call updateServerConfig()
  // - Call loadConfig with sync option

  console.log('\n=== Testing New APIs (no warnings) ===\n');

  // TODO: Test new APIs (should work without warnings)
  // - Use getConfig()
  // - Use setConfig()
  // - Use loadConfig without deprecated options

  console.log('\n=== Deprecation Report ===\n');

  // TODO: Print deprecation tracker report
}

// TODO 5: Create deprecation timeline
const DEPRECATION_TIMELINE = {
  // TODO: Document when each feature will be removed
  // Example:
  // 'DEP0001': {
  //   deprecated: 'v1.5.0',
  //   removeWarning: 'v2.0.0',
  //   removed: 'v3.0.0',
  //   alternative: 'getConfig()',
  // },
};

// TODO 6: Create migration guide generator
function generateMigrationGuide(code) {
  // Your code here:
  // Generate a migration guide for a specific deprecation code
  // Include:
  // - What's deprecated
  // - Why it's deprecated
  // - How to migrate (with code examples)
  // - Timeline for removal
}

// Uncomment to run:
// testDeprecationSystem();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-2.js
 *
 * 2. Expected output:
 *    - Deprecation warnings for old APIs
 *    - No warnings for new APIs
 *    - Detailed warning messages with migration info
 *    - Deprecation report showing usage
 *
 * 3. Test cases to verify:
 *    ✓ Old methods show deprecation warnings
 *    ✓ New methods work without warnings
 *    ✓ Warnings include deprecation codes
 *    ✓ Warnings include migration guidance
 *    ✓ Deprecated parameters trigger warnings
 *    ✓ Tracker records all deprecations
 *    ✓ Report shows useful statistics
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Deprecation System ===
 *
 * Testing deprecated APIs:
 *
 * (node:12345) [DEP0001] DeprecationWarning:
 * getServerPort() is deprecated and will be removed in v3.0.0.
 * Use getConfig('server.port') instead.
 * Migration guide: https://docs.example.com/migration#DEP0001
 *
 * Port: 3000
 *
 * (node:12345) [DEP0002] DeprecationWarning:
 * getDatabaseUrl() is deprecated and will be removed in v3.0.0.
 * Use getConfig('database.url') instead.
 *
 * === Testing New APIs (no warnings) ===
 *
 * Port: 3000
 * Updated successfully
 *
 * === Deprecation Report ===
 *
 * Deprecation Summary:
 * - Total unique deprecations: 3
 * - Total warnings issued: 5
 *
 * Details:
 * [DEP0001] getServerPort() - 2 warnings
 *   First seen: 2024-01-01T10:00:00.000Z
 *   Last seen: 2024-01-01T10:00:05.000Z
 *
 * [DEP0002] getDatabaseUrl() - 1 warning
 * [DEP0003] updateServerConfig() - 2 warnings
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How do you structure deprecation warnings?
 * - What information should deprecation messages include?
 * - How do you track deprecated feature usage?
 * - What's a good timeline for removing deprecated features?
 * - How do you communicate breaking changes to users?
 */

/**
 * BONUS IMPLEMENTATION IDEAS:
 *
 * 1. Deprecation Levels:
 *    - Level 1: Warning only
 *    - Level 2: Warning + track usage
 *    - Level 3: Error in strict mode
 *
 * 2. Environment-Based Behavior:
 *    - Development: Show all warnings
 *    - Production: Warn once per deprecation
 *    - Test: Silent or throw errors
 *
 * 3. Automated Migration:
 *    - Scan code for deprecated usage
 *    - Generate migration patches
 *    - Suggest automated fixes
 *
 * 4. Deprecation Dashboard:
 *    - Visual timeline
 *    - Usage statistics
 *    - Migration progress tracking
 */

/**
 * Good Deprecation Message Template:
 *
 * [CODE] DeprecationWarning:
 * {old_api} is deprecated and will be removed in {version}.
 *
 * Reason: {why_deprecated}
 *
 * Migration:
 *   Old: {old_code_example}
 *   New: {new_code_example}
 *
 * Timeline:
 *   - Deprecated: {version_deprecated}
 *   - Removed: {version_removed}
 *
 * See: {migration_guide_url}
 */
