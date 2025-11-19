/**
 * Solution: Exercise 2 - Implement Deprecation System
 * =====================================================
 *
 * This solution demonstrates how to build a comprehensive deprecation system
 * for managing API evolution. It shows best practices for deprecating features
 * while maintaining backward compatibility and guiding users through migrations.
 *
 * Key techniques used:
 * - util.deprecate() for marking deprecated APIs
 * - Deprecation tracking and reporting
 * - Progressive deprecation levels
 * - Migration guide generation
 * - Timeline-based deprecation strategy
 */

const util = require('util');

// =============================================================================
// SOLUTION: ConfigManager with Deprecation System
// =============================================================================

/**
 * STEP 1: Create DeprecationTracker first (needed by ConfigManager)
 *
 * This class tracks all deprecation warnings, helping monitor which
 * features are still being used and need user attention.
 */
class DeprecationTracker {
  constructor(options = {}) {
    this.warnings = new Map();
    this.maxWarnings = options.maxWarnings || 10;
    this.warnOnce = options.warnOnce !== false; // Default true
  }

  /**
   * Track a deprecation warning
   * @param {string} code - Deprecation code (e.g., 'DEP0001')
   * @param {string} message - Warning message
   * @returns {Object} Tracking info
   */
  track(code, message) {
    const now = new Date();

    if (this.warnings.has(code)) {
      // Update existing entry
      const entry = this.warnings.get(code);
      entry.count++;
      entry.lastSeen = now;
    } else {
      // Create new entry
      this.warnings.set(code, {
        code,
        message,
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
    }

    return this.warnings.get(code);
  }

  /**
   * Get deprecation report
   * @returns {Object} Formatted report
   */
  getReport() {
    const warnings = Array.from(this.warnings.values());
    const totalWarnings = warnings.reduce((sum, w) => sum + w.count, 0);

    return {
      summary: {
        uniqueDeprecations: warnings.length,
        totalWarnings,
        underBudget: totalWarnings <= this.maxWarnings
      },
      warnings: warnings.map(w => ({
        code: w.code,
        message: w.message.split('\n')[0], // First line only
        count: w.count,
        firstSeen: w.firstSeen.toISOString(),
        lastSeen: w.lastSeen.toISOString()
      }))
    };
  }

  /**
   * Print formatted report
   */
  printReport() {
    const report = this.getReport();

    console.log('=== Deprecation Report ===\n');
    console.log('Summary:');
    console.log(`  Unique deprecations: ${report.summary.uniqueDeprecations}`);
    console.log(`  Total warnings: ${report.summary.totalWarnings}`);
    console.log(`  Budget status: ${report.summary.underBudget ? '✓ Under budget' : '⚠ Over budget'}`);
    console.log(`  Budget limit: ${this.maxWarnings}\n`);

    if (report.warnings.length > 0) {
      console.log('Details:');
      report.warnings.forEach(w => {
        console.log(`\n  [${w.code}] ${w.count} warning(s)`);
        console.log(`    Message: ${w.message}`);
        console.log(`    First seen: ${w.firstSeen}`);
        console.log(`    Last seen: ${w.lastSeen}`);
      });
    }
  }

  /**
   * Check if deprecation budget is exceeded
   * @param {number} maxWarnings - Optional override of default budget
   * @returns {boolean} True if under budget
   */
  checkBudget(maxWarnings = this.maxWarnings) {
    const totalWarnings = Array.from(this.warnings.values())
      .reduce((sum, w) => sum + w.count, 0);

    return totalWarnings <= maxWarnings;
  }

  /**
   * Get warnings by severity (based on count)
   */
  getHighUsageDeprecations(threshold = 5) {
    return Array.from(this.warnings.values())
      .filter(w => w.count >= threshold)
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Clear tracking data (useful for testing)
   */
  clear() {
    this.warnings.clear();
  }
}

/**
 * STEP 2: Create ConfigManager with old and new APIs
 *
 * This demonstrates how to maintain both old (deprecated) and new APIs
 * during a transition period.
 */
class ConfigManager {
  constructor(options = {}) {
    this.config = {
      server: {
        port: 3000,
        host: 'localhost',
      },
      database: {
        url: 'postgresql://localhost/mydb',
      },
    };

    this.tracker = options.tracker || null;
  }

  // ===== NEW APIs (Modern, clean) =====

  /**
   * Get config value by path
   * @param {string} path - Dot-separated path (e.g., 'server.port')
   * @returns {*} Config value
   */
  getConfig(path) {
    const parts = path.split('.');
    let value = this.config;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Set config value by path
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setConfig(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let target = this.config;

    // Navigate to parent
    for (const part of parts) {
      if (!target[part] || typeof target[part] !== 'object') {
        target[part] = {};
      }
      target = target[part];
    }

    // Set value
    target[lastPart] = value;
  }

  /**
   * Load config (new API)
   * @param {string} path - Config file path
   * @param {Object} options - Load options
   */
  loadConfig(path, options = {}) {
    // Check for deprecated 'sync' option
    if ('sync' in options) {
      const deprecatedFn = util.deprecate(
        () => {},
        `[DEP0004] loadConfig option 'sync' is deprecated. Use 'async: false' instead.\n` +
        `  Old: loadConfig(path, { sync: true })\n` +
        `  New: loadConfig(path, { async: false })`
      );

      deprecatedFn();

      // Track if tracker provided
      if (this.tracker) {
        this.tracker.track('DEP0004', 'loadConfig sync option');
      }

      // Convert to new format
      options.async = !options.sync;
      delete options.sync;
    }

    // Simulate loading config
    console.log(`Loading config from ${path} (async: ${options.async !== false})`);
    return this.config;
  }

  // ===== OLD APIs (Deprecated) =====

  /**
   * Get server port [DEPRECATED]
   * @deprecated Use getConfig('server.port') instead
   */
  getServerPort = util.deprecate(
    function() {
      // Track usage
      if (this.tracker) {
        this.tracker.track(
          'DEP0001',
          "getServerPort() is deprecated. Use getConfig('server.port') instead."
        );
      }

      return this.getConfig('server.port');
    },
    `[DEP0001] getServerPort() is deprecated and will be removed in v3.0.0.\n` +
    `  Use getConfig('server.port') instead.\n` +
    `  Migration: port = config.getConfig('server.port')`,
    'DEP0001'
  );

  /**
   * Get database URL [DEPRECATED]
   * @deprecated Use getConfig('database.url') instead
   */
  getDatabaseUrl = util.deprecate(
    function() {
      if (this.tracker) {
        this.tracker.track(
          'DEP0002',
          "getDatabaseUrl() is deprecated. Use getConfig('database.url') instead."
        );
      }

      return this.getConfig('database.url');
    },
    `[DEP0002] getDatabaseUrl() is deprecated and will be removed in v3.0.0.\n` +
    `  Use getConfig('database.url') instead.\n` +
    `  Migration: url = config.getConfig('database.url')`,
    'DEP0002'
  );

  /**
   * Update server config [DEPRECATED]
   * @deprecated Use setConfig() instead
   */
  updateServerConfig = util.deprecate(
    function(port, host) {
      if (this.tracker) {
        this.tracker.track(
          'DEP0003',
          'updateServerConfig() is deprecated. Use setConfig() instead.'
        );
      }

      if (port !== undefined) this.setConfig('server.port', port);
      if (host !== undefined) this.setConfig('server.host', host);
    },
    `[DEP0003] updateServerConfig(port, host) is deprecated and will be removed in v3.0.0.\n` +
    `  Use setConfig() for individual updates instead.\n` +
    `  Migration:\n` +
    `    Old: config.updateServerConfig(8080, 'example.com')\n` +
    `    New: config.setConfig('server.port', 8080)\n` +
    `         config.setConfig('server.host', 'example.com')`,
    'DEP0003'
  );
}

// =============================================================================
// STEP 3: Enhanced deprecate function with rich metadata
// =============================================================================

/**
 * Create a deprecation wrapper with enhanced metadata
 * @param {Function} fn - Function to deprecate
 * @param {Object} options - Deprecation options
 * @returns {Function} Deprecated function
 */
function enhancedDeprecate(fn, options) {
  const {
    message = 'This function is deprecated',
    code = 'DEP0000',
    removeIn = 'future version',
    alternative = 'N/A',
    migrationGuide = null,
    tracker = null,
    level = 'warning' // 'warning', 'error', 'silent'
  } = options;

  // Build comprehensive message
  const fullMessage = [
    `[${code}] ${message}`,
    `Will be removed in: ${removeIn}`,
    alternative !== 'N/A' ? `Alternative: ${alternative}` : null,
    migrationGuide ? `Migration guide: ${migrationGuide}` : null
  ].filter(Boolean).join('\n');

  // Create deprecated function based on level
  let deprecatedFn;

  if (level === 'error') {
    // Throw error instead of warning
    deprecatedFn = function(...args) {
      throw new Error(fullMessage);
    };
  } else if (level === 'silent') {
    // No warning, just track
    deprecatedFn = function(...args) {
      if (tracker) {
        tracker.track(code, message);
      }
      return fn.apply(this, args);
    };
  } else {
    // Normal deprecation warning
    deprecatedFn = util.deprecate(
      function(...args) {
        if (tracker) {
          tracker.track(code, message);
        }
        return fn.apply(this, args);
      },
      fullMessage,
      code
    );
  }

  // Attach metadata
  deprecatedFn.deprecation = {
    code,
    message,
    removeIn,
    alternative,
    migrationGuide,
    level
  };

  return deprecatedFn;
}

// =============================================================================
// STEP 4: Deprecation timeline and documentation
// =============================================================================

/**
 * Deprecation timeline documenting when features will be removed
 */
const DEPRECATION_TIMELINE = {
  'DEP0001': {
    feature: 'getServerPort()',
    deprecated: 'v1.5.0',
    removeWarning: 'v2.0.0',
    removed: 'v3.0.0',
    alternative: "getConfig('server.port')",
    reason: 'Moving to unified config API for consistency',
    breaking: false
  },
  'DEP0002': {
    feature: 'getDatabaseUrl()',
    deprecated: 'v1.5.0',
    removeWarning: 'v2.0.0',
    removed: 'v3.0.0',
    alternative: "getConfig('database.url')",
    reason: 'Moving to unified config API for consistency',
    breaking: false
  },
  'DEP0003': {
    feature: 'updateServerConfig()',
    deprecated: 'v1.5.0',
    removeWarning: 'v2.0.0',
    removed: 'v3.0.0',
    alternative: 'setConfig(path, value)',
    reason: 'Unified setter API is more flexible',
    breaking: false
  },
  'DEP0004': {
    feature: "loadConfig option 'sync'",
    deprecated: 'v1.6.0',
    removeWarning: 'v2.5.0',
    removed: 'v3.0.0',
    alternative: "option 'async: false'",
    reason: 'Clearer naming convention',
    breaking: false
  }
};

/**
 * Generate migration guide for a deprecation code
 * @param {string} code - Deprecation code
 * @returns {string} Migration guide
 */
function generateMigrationGuide(code) {
  const deprecation = DEPRECATION_TIMELINE[code];

  if (!deprecation) {
    return `No migration guide available for ${code}`;
  }

  return `
═══════════════════════════════════════════════════════════════
MIGRATION GUIDE: ${code}
═══════════════════════════════════════════════════════════════

WHAT'S DEPRECATED:
  ${deprecation.feature}

WHY:
  ${deprecation.reason}

TIMELINE:
  Deprecated in:    ${deprecation.deprecated}
  Warning ends in:  ${deprecation.removeWarning}
  Removed in:       ${deprecation.removed}

MIGRATION:
  Old: ${deprecation.feature}
  New: ${deprecation.alternative}

STEPS:
  1. Find all usages of ${deprecation.feature}
  2. Replace with ${deprecation.alternative}
  3. Test your changes
  4. Commit and deploy

BREAKING CHANGE:
  ${deprecation.breaking ? 'Yes - requires code changes' : 'No - backward compatible during transition'}

HELP:
  Run tests with NODE_OPTIONS='--throw-deprecation' to find all uses
═══════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Print complete deprecation timeline
 */
function printDeprecationTimeline() {
  console.log('\n=== Deprecation Timeline ===\n');

  Object.entries(DEPRECATION_TIMELINE).forEach(([code, info]) => {
    console.log(`${code}: ${info.feature}`);
    console.log(`  Deprecated: ${info.deprecated}`);
    console.log(`  Removed: ${info.removed}`);
    console.log(`  Use: ${info.alternative}\n`);
  });
}

// =============================================================================
// TEST CASES
// =============================================================================

async function testDeprecationSystem() {
  console.log('=== Testing Deprecation System ===\n');

  // Create tracker and config manager
  const tracker = new DeprecationTracker({ maxWarnings: 10 });
  const config = new ConfigManager({ tracker });

  console.log('--- Testing Deprecated APIs (will show warnings) ---\n');

  // Test deprecated methods
  const port = config.getServerPort();
  console.log('Port (via deprecated API):', port);

  const dbUrl = config.getDatabaseUrl();
  console.log('Database URL (via deprecated API):', dbUrl);

  config.updateServerConfig(8080, 'example.com');
  console.log('Updated server config (via deprecated API)');

  config.loadConfig('config.json', { sync: true });

  // Call deprecated method multiple times to test tracking
  config.getServerPort();
  config.getServerPort();

  console.log('\n--- Testing New APIs (no warnings) ---\n');

  // Test new methods
  const port2 = config.getConfig('server.port');
  console.log('Port (via new API):', port2);

  config.setConfig('server.port', 9000);
  console.log('Set port (via new API)');

  const host = config.getConfig('server.host');
  console.log('Host:', host);

  config.loadConfig('config.json', { async: true });

  // Print deprecation report
  console.log();
  tracker.printReport();

  // Check budget
  console.log('\n--- Budget Check ---\n');
  const underBudget = tracker.checkBudget();
  console.log('Under budget:', underBudget ? '✓ Yes' : '✗ No');

  // High usage deprecations
  const highUsage = tracker.getHighUsageDeprecations(2);
  if (highUsage.length > 0) {
    console.log('\nHigh usage deprecations (>= 2 calls):');
    highUsage.forEach(w => {
      console.log(`  ${w.code}: ${w.count} calls`);
    });
  }
}

/**
 * Test enhanced deprecation
 */
function testEnhancedDeprecation() {
  console.log('\n\n=== Testing Enhanced Deprecation ===\n');

  const tracker = new DeprecationTracker();

  // Test warning level
  const oldFunction = enhancedDeprecate(
    function(x) { return x * 2; },
    {
      message: 'oldFunction() is deprecated',
      code: 'DEP0100',
      removeIn: 'v4.0.0',
      alternative: 'newFunction()',
      migrationGuide: 'https://example.com/migration',
      tracker,
      level: 'warning'
    }
  );

  console.log('Calling deprecated function (warning level):');
  const result = oldFunction(5);
  console.log('Result:', result);

  // Test silent level
  const silentFunction = enhancedDeprecate(
    function(x) { return x * 3; },
    {
      message: 'silentFunction() is deprecated',
      code: 'DEP0101',
      removeIn: 'v4.0.0',
      alternative: 'newFunction()',
      tracker,
      level: 'silent'
    }
  );

  console.log('\nCalling deprecated function (silent level - tracks but no warning):');
  const result2 = silentFunction(5);
  console.log('Result:', result2);

  // Test error level
  const errorFunction = enhancedDeprecate(
    function(x) { return x * 4; },
    {
      message: 'errorFunction() is deprecated',
      code: 'DEP0102',
      removeIn: 'v4.0.0',
      alternative: 'newFunction()',
      level: 'error'
    }
  );

  console.log('\nCalling deprecated function (error level - throws):');
  try {
    errorFunction(5);
  } catch (err) {
    console.log('✓ Caught error:', err.message.split('\n')[0]);
  }

  console.log('\n--- Enhanced Deprecation Report ---\n');
  tracker.printReport();
}

/**
 * Test migration guide generation
 */
function testMigrationGuides() {
  console.log('\n\n=== Testing Migration Guides ===\n');

  // Generate guide for DEP0001
  const guide = generateMigrationGuide('DEP0001');
  console.log(guide);

  // Print full timeline
  printDeprecationTimeline();
}

// Run all tests
if (require.main === module) {
  testDeprecationSystem().then(() => {
    testEnhancedDeprecation();
    testMigrationGuides();
  });
}

// =============================================================================
// ALTERNATIVE SOLUTION: Class-based deprecation wrapper
// =============================================================================

/**
 * ALTERNATIVE: Use a class decorator to automatically deprecate methods
 */
class DeprecationManager {
  constructor(timeline = DEPRECATION_TIMELINE) {
    this.timeline = timeline;
    this.tracker = new DeprecationTracker();
  }

  /**
   * Wrap a class to add deprecation to specified methods
   */
  wrapClass(TargetClass, deprecations) {
    const manager = this;

    return class DeprecatedClass extends TargetClass {
      constructor(...args) {
        super(...args);

        // Wrap deprecated methods
        Object.entries(deprecations).forEach(([methodName, code]) => {
          const originalMethod = this[methodName];
          const info = manager.timeline[code];

          if (originalMethod && info) {
            this[methodName] = enhancedDeprecate(
              originalMethod.bind(this),
              {
                message: `${methodName}() is deprecated`,
                code,
                removeIn: info.removed,
                alternative: info.alternative,
                tracker: manager.tracker
              }
            );
          }
        });
      }
    };
  }

  getReport() {
    return this.tracker.getReport();
  }
}

// Example usage:
// const deprecationMgr = new DeprecationManager();
// const DeprecatedConfig = deprecationMgr.wrapClass(ConfigManager, {
//   'getServerPort': 'DEP0001',
//   'getDatabaseUrl': 'DEP0002'
// });

module.exports = {
  ConfigManager,
  DeprecationTracker,
  enhancedDeprecate,
  generateMigrationGuide,
  DEPRECATION_TIMELINE,
  DeprecationManager
};

// =============================================================================
// KEY LEARNING POINTS
// =============================================================================

/**
 * 1. DEPRECATION IS A PROCESS, NOT AN EVENT
 *    Deprecation should follow a timeline: warn → educate → remove
 *    Give users adequate time and tools to migrate (usually 1-2 major versions)
 *
 * 2. CLEAR COMMUNICATION IS ESSENTIAL
 *    Every deprecation warning should include:
 *    - What's deprecated
 *    - Why it's deprecated
 *    - What to use instead
 *    - When it will be removed
 *    - How to migrate (with examples)
 *
 * 3. TRACK DEPRECATION USAGE
 *    Monitor which deprecated features are still being used.
 *    This helps prioritize migration efforts and communicate with users
 *    who might be affected by removal.
 *
 * 4. PROVIDE MIGRATION TOOLS
 *    Don't just warn - help users migrate:
 *    - Migration guides with examples
 *    - Automated migration scripts when possible
 *    - Clear timeline and version information
 *
 * 5. PROGRESSIVE DEPRECATION LEVELS
 *    Start with warnings, progress to errors in strict mode, finally remove.
 *    This gives users flexibility while encouraging migration.
 *
 * 6. USE DEPRECATION CODES
 *    Unique codes (DEP0001) make it easy to:
 *    - Reference in documentation
 *    - Track in monitoring systems
 *    - Search in codebases
 *    - Filter warnings
 *
 * 7. SEMVER COMPATIBILITY
 *    Follow semantic versioning:
 *    - Deprecate in minor version (1.5.0)
 *    - Remove in major version (2.0.0)
 *    - Never remove in patch version
 */

// =============================================================================
// COMMON MISTAKES
// =============================================================================

/**
 * MISTAKE 1: Deprecating without providing alternative
 * ❌ BAD:
 */
const bad1 = util.deprecate(
  oldFunction,
  'This function is deprecated'
);
/**
 * Users have no idea what to use instead!
 *
 * ✅ GOOD:
 */
const good1 = util.deprecate(
  oldFunction,
  'oldFunction() is deprecated. Use newFunction() instead.\n' +
  '  Old: oldFunction(x)\n' +
  '  New: newFunction(x)'
);

/**
 * MISTAKE 2: Removing features without deprecation period
 * ❌ BAD:
 * v1.0: feature exists
 * v2.0: feature removed  <-- Breaking change without warning!
 *
 * ✅ GOOD:
 * v1.0: feature exists
 * v1.5: feature deprecated with warning
 * v2.0: feature removed (users had time to migrate)
 */

/**
 * MISTAKE 3: Vague or unhelpful deprecation messages
 * ❌ BAD:
 */
const bad3 = util.deprecate(
  fn,
  'Deprecated'  // Not helpful!
);
/**
 * ✅ GOOD:
 */
const good3 = util.deprecate(
  fn,
  '[DEP0001] getUser() is deprecated and will be removed in v3.0.0.\n' +
  'Use getUserById() instead.\n' +
  'Migration: getUser(123) → getUserById(123)\n' +
  'See: https://docs.example.com/migration#DEP0001'
);

/**
 * MISTAKE 4: Not tracking deprecation usage
 * ❌ BAD: Just deprecate and hope users migrate
 *
 * ✅ GOOD: Track usage to understand impact and communicate with affected users
 */

/**
 * MISTAKE 5: Inconsistent deprecation codes
 * ❌ BAD: DEP1, DEP_OLD_API, DEPRECATED_FUNC
 * ✅ GOOD: DEP0001, DEP0002, DEP0003 (consistent format)
 */

// =============================================================================
// GOING FURTHER - Advanced Challenges
// =============================================================================

/**
 * CHALLENGE 1: Environment-Based Deprecation Behavior
 * Implement different behaviors per environment:
 *
 * Development:
 * - Show all warnings
 * - Show stack traces
 * - Suggest fixes inline
 *
 * Staging:
 * - Show warnings
 * - Send to monitoring system
 * - Track usage statistics
 *
 * Production:
 * - Warn once per process
 * - Send to monitoring only
 * - No console output (performance)
 *
 * Test:
 * - Throw errors (fail tests)
 * - or silent (ignore for legacy tests)
 */

/**
 * CHALLENGE 2: Automated Deprecation Detection
 * Build a static analysis tool that:
 * - Scans codebase for deprecated API usage
 * - Reports locations with file:line numbers
 * - Suggests replacements
 * - Generates migration PR
 * - Estimates migration effort
 *
 * Example output:
 * Found 15 uses of deprecated APIs:
 *   DEP0001: src/server.js:45, src/config.js:12 (2 occurrences)
 *   DEP0002: src/database.js:78 (1 occurrence)
 *
 * Estimated migration time: 2 hours
 * Auto-fix available: Yes
 * Run 'npm run migrate-deprecations' to apply fixes
 */

/**
 * CHALLENGE 3: Deprecation Budget System
 * Implement a budget system for CI/CD:
 *
 * .deprecationrc.json:
 * {
 *   "budget": 10,
 *   "action": "warn",  // or "fail"
 *   "ignore": ["DEP0001"],
 *   "by-code": {
 *     "DEP0002": 5
 *   }
 * }
 *
 * CI fails if deprecation budget exceeded, forcing teams to:
 * - Fix deprecations
 * - Or explicitly increase budget (with justification)
 */

/**
 * CHALLENGE 4: Visual Deprecation Timeline
 * Create a web dashboard showing:
 * - Timeline of deprecations
 * - Current version indicator
 * - What's deprecated now
 * - What will be removed soon
 * - Migration progress (% of codebase migrated)
 * - Top offenders (files with most deprecated calls)
 *
 * Make it shareable for team communication.
 */

/**
 * CHALLENGE 5: Automated Migration Script Generator
 * Build a tool that generates migration scripts:
 *
 * Input: Deprecation code (DEP0001)
 * Output: Codemod script using jscodeshift
 *
 * Example:
 * $ generate-migration DEP0001
 * Generated: migrations/DEP0001.js
 *
 * $ jscodeshift -t migrations/DEP0001.js src/
 * Migrated 15 files
 * Fixed 23 deprecated calls
 *
 * Review changes and commit:
 * $ git diff
 */

/**
 * BONUS: Test different NODE_OPTIONS:
 *
 * Show all warnings:
 * node exercise-2-solution.js
 *
 * Suppress warnings:
 * NODE_OPTIONS='--no-deprecation' node exercise-2-solution.js
 *
 * Throw on deprecation (useful for CI):
 * NODE_OPTIONS='--throw-deprecation' node exercise-2-solution.js
 *
 * Trace deprecations (show stack traces):
 * NODE_OPTIONS='--trace-deprecation' node exercise-2-solution.js
 */
