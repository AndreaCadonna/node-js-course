/**
 * 05-process-warnings.js
 *
 * Working with Process Warnings
 *
 * This example demonstrates handling and emitting process warnings including:
 * - Listening to process warnings
 * - Custom warning emission
 * - Warning categories and types
 * - Warning deduplication
 * - Warning to error promotion
 * - Deprecation warnings
 * - MaxListenersExceeded warnings
 * - Custom warning handlers
 *
 * Process warnings are similar to errors but don't crash the application.
 * They indicate potential problems, deprecations, or misconfigurations.
 *
 * Common Warning Types:
 * - DeprecationWarning: Using deprecated APIs
 * - MaxListenersExceededWarning: Too many event listeners
 * - Warning: General warnings
 * - Custom warnings: Application-specific warnings
 *
 * Warning Handling:
 * - By default, warnings are printed to stderr
 * - Can be suppressed with --no-warnings flag
 * - Can be converted to errors with --throw-warnings
 * - Can filter by type with --no-deprecation
 *
 * @module process-warnings
 * @level intermediate
 */

'use strict';

const { EventEmitter } = require('events');
const util = require('util');

// =============================================================================
// 1. Basic Warning Listening
// =============================================================================

console.log('\n=== 1. Basic Warning Listening ===\n');

class WarningListener {
  constructor() {
    this.warnings = [];
    this.warningCounts = new Map();
    this.setupListener();
  }

  /**
   * Setup warning event listener
   */
  setupListener() {
    process.on('warning', (warning) => {
      this.handleWarning(warning);
    });

    console.log('[WarningListener] Warning listener installed');
  }

  /**
   * Handle process warning
   */
  handleWarning(warning) {
    const warningInfo = {
      timestamp: new Date().toISOString(),
      name: warning.name,
      message: warning.message,
      code: warning.code,
      stack: warning.stack
    };

    this.warnings.push(warningInfo);

    // Count by type
    const count = this.warningCounts.get(warning.name) || 0;
    this.warningCounts.set(warning.name, count + 1);

    console.log('\n╭─────────────────────────────────────────────╮');
    console.log('│  PROCESS WARNING                            │');
    console.log('╰─────────────────────────────────────────────╯');
    console.log(`Time:    ${warningInfo.timestamp}`);
    console.log(`Type:    ${warningInfo.name}`);
    console.log(`Code:    ${warningInfo.code || 'N/A'}`);
    console.log(`Message: ${warningInfo.message}`);

    if (warning.stack) {
      console.log('\nStack:');
      console.log(warning.stack);
    }

    console.log('');
  }

  /**
   * Get warning statistics
   */
  getStats() {
    return {
      total: this.warnings.length,
      byType: Object.fromEntries(this.warningCounts),
      recent: this.warnings.slice(-5)
    };
  }
}

const warningListener = new WarningListener();

// =============================================================================
// 2. Emitting Custom Warnings
// =============================================================================

console.log('\n=== 2. Emitting Custom Warnings ===\n');

class CustomWarningEmitter {
  /**
   * Emit a simple warning
   */
  emitSimpleWarning(message) {
    console.log(`[CustomWarning] Emitting simple warning: "${message}"`);
    process.emitWarning(message);
  }

  /**
   * Emit warning with type
   */
  emitTypedWarning(message, type) {
    console.log(`[CustomWarning] Emitting ${type} warning: "${message}"`);
    process.emitWarning(message, type);
  }

  /**
   * Emit warning with code
   */
  emitCodedWarning(message, type, code) {
    console.log(`[CustomWarning] Emitting ${type} warning [${code}]: "${message}"`);
    process.emitWarning(message, type, code);
  }

  /**
   * Emit warning with constructor
   */
  emitWarningObject(options) {
    console.log(`[CustomWarning] Emitting warning object:`, options);

    const warning = new Error(options.message);
    warning.name = options.type || 'Warning';
    warning.code = options.code;

    process.emitWarning(warning);
  }

  /**
   * Emit warning with detail
   */
  emitDetailedWarning(message, options = {}) {
    console.log(`[CustomWarning] Emitting detailed warning`);

    process.emitWarning(message, {
      type: options.type || 'Warning',
      code: options.code,
      detail: options.detail
    });
  }
}

const warningEmitter = new CustomWarningEmitter();

// Examples of emitting warnings
setTimeout(() => {
  warningEmitter.emitSimpleWarning('This is a simple warning');
}, 1000);

setTimeout(() => {
  warningEmitter.emitTypedWarning('This feature is deprecated', 'DeprecationWarning');
}, 2000);

setTimeout(() => {
  warningEmitter.emitCodedWarning(
    'Configuration is missing',
    'ConfigWarning',
    'MISSING_CONFIG'
  );
}, 3000);

// =============================================================================
// 3. Warning Categories and Management
// =============================================================================

console.log('\n=== 3. Warning Categories and Management ===\n');

class WarningManager extends EventEmitter {
  constructor() {
    super();
    this.categories = new Map();
    this.suppressedCodes = new Set();
    this.emittedWarnings = new Set();
  }

  /**
   * Register warning category
   */
  registerCategory(code, config) {
    this.categories.set(code, {
      ...config,
      count: 0,
      lastEmitted: null
    });

    console.log(`[WarningManager] Registered category: ${code}`);
  }

  /**
   * Emit managed warning
   */
  emitWarning(code, context = {}) {
    const category = this.categories.get(code);

    if (!category) {
      console.log(`[WarningManager] Unknown warning code: ${code}`);
      return;
    }

    // Check if suppressed
    if (this.suppressedCodes.has(code)) {
      console.log(`[WarningManager] Warning ${code} is suppressed`);
      return;
    }

    // Check if should deduplicate
    if (category.once && this.emittedWarnings.has(code)) {
      console.log(`[WarningManager] Warning ${code} already emitted (once mode)`);
      return;
    }

    // Update tracking
    category.count++;
    category.lastEmitted = Date.now();
    this.emittedWarnings.add(code);

    // Format message with context
    const message = this.formatMessage(category.message, context);

    // Emit warning
    process.emitWarning(message, {
      type: category.type || 'Warning',
      code,
      detail: category.detail
    });

    // Emit event
    this.emit('warning', { code, category, context });

    console.log(`[WarningManager] Emitted warning ${code} (count: ${category.count})`);
  }

  /**
   * Format message with context variables
   */
  formatMessage(template, context) {
    let message = template;

    for (const [key, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return message;
  }

  /**
   * Suppress warning by code
   */
  suppress(code) {
    this.suppressedCodes.add(code);
    console.log(`[WarningManager] Suppressed warning: ${code}`);
  }

  /**
   * Unsuppress warning
   */
  unsuppress(code) {
    this.suppressedCodes.delete(code);
    console.log(`[WarningManager] Unsuppressed warning: ${code}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      categories: [],
      suppressed: Array.from(this.suppressedCodes)
    };

    for (const [code, category] of this.categories.entries()) {
      stats.categories.push({
        code,
        type: category.type,
        count: category.count,
        lastEmitted: category.lastEmitted
      });
    }

    return stats;
  }
}

const warningManager = new WarningManager();

// Register warning categories
warningManager.registerCategory('DEPRECATED_API', {
  type: 'DeprecationWarning',
  message: 'API {api} is deprecated, use {replacement} instead',
  detail: 'This API will be removed in version {version}',
  once: true
});

warningManager.registerCategory('MISSING_CONFIG', {
  type: 'ConfigWarning',
  message: 'Configuration {config} is missing, using default: {default}',
  once: false
});

warningManager.registerCategory('PERFORMANCE_ISSUE', {
  type: 'PerformanceWarning',
  message: 'Performance issue detected: {issue}',
  detail: 'Consider optimizing: {suggestion}',
  once: false
});

// Emit managed warnings
setTimeout(() => {
  warningManager.emitWarning('DEPRECATED_API', {
    api: 'oldFunction()',
    replacement: 'newFunction()',
    version: '2.0.0'
  });
}, 4000);

setTimeout(() => {
  warningManager.emitWarning('MISSING_CONFIG', {
    config: 'database.timeout',
    default: '5000ms'
  });
}, 5000);

// =============================================================================
// 4. MaxListenersExceeded Warning Handler
// =============================================================================

console.log('\n=== 4. MaxListenersExceeded Warning Handler ===\n');

class MaxListenersHandler {
  constructor() {
    this.monitoredEmitters = new Map();
  }

  /**
   * Monitor emitter for max listeners
   */
  monitor(emitter, name = 'unnamed') {
    const originalSetMaxListeners = emitter.setMaxListeners.bind(emitter);

    // Track info
    this.monitoredEmitters.set(emitter, {
      name,
      currentMax: emitter.getMaxListeners(),
      warnings: []
    });

    // Listen for warning events on the emitter
    emitter.on('newListener', (event) => {
      const listenerCount = emitter.listenerCount(event);
      const maxListeners = emitter.getMaxListeners();

      if (maxListeners > 0 && listenerCount >= maxListeners) {
        console.log(`\n[MaxListeners] Warning: Approaching max listeners for "${event}"`);
        console.log(`  Emitter: ${name}`);
        console.log(`  Event: ${event}`);
        console.log(`  Current: ${listenerCount}`);
        console.log(`  Max: ${maxListeners}`);
      }
    });

    console.log(`[MaxListeners] Monitoring emitter: ${name}`);
  }

  /**
   * Create test scenario
   */
  demonstrateMaxListeners() {
    console.log('\n[MaxListeners] Demonstrating max listeners warning...\n');

    const emitter = new EventEmitter();
    emitter.setMaxListeners(3); // Set low limit for demo

    this.monitor(emitter, 'test-emitter');

    // Add listeners to trigger warning
    for (let i = 0; i < 5; i++) {
      emitter.on('test', () => {
        // Listener
      });
      console.log(`[MaxListeners] Added listener ${i + 1}`);
    }

    console.log(`[MaxListeners] Total listeners: ${emitter.listenerCount('test')}`);
  }
}

const maxListenersHandler = new MaxListenersHandler();

// Demonstrate in 6 seconds
setTimeout(() => {
  maxListenersHandler.demonstrateMaxListeners();
}, 6000);

// =============================================================================
// 5. Deprecation Warning System
// =============================================================================

console.log('\n=== 5. Deprecation Warning System ===\n');

class DeprecationManager {
  constructor() {
    this.deprecations = new Map();
    this.emittedDeprecations = new Set();
  }

  /**
   * Register a deprecation
   */
  registerDeprecation(id, config) {
    this.deprecations.set(id, {
      ...config,
      emitCount: 0,
      firstEmitted: null,
      lastEmitted: null
    });

    console.log(`[Deprecation] Registered: ${id}`);
  }

  /**
   * Emit deprecation warning
   */
  deprecate(id, context = {}) {
    const deprecation = this.deprecations.get(id);

    if (!deprecation) {
      console.log(`[Deprecation] Unknown deprecation: ${id}`);
      return;
    }

    // Only emit once per process
    if (this.emittedDeprecations.has(id)) {
      return;
    }

    this.emittedDeprecations.add(id);

    // Update tracking
    deprecation.emitCount++;
    if (!deprecation.firstEmitted) {
      deprecation.firstEmitted = Date.now();
    }
    deprecation.lastEmitted = Date.now();

    // Format message
    const message = this.formatMessage(deprecation.message, context);
    const detail = this.formatMessage(deprecation.detail || '', context);

    // Emit warning
    process.emitWarning(message, {
      type: 'DeprecationWarning',
      code: id,
      detail: detail || undefined
    });

    console.log(`[Deprecation] Emitted: ${id}`);
  }

  /**
   * Create deprecation wrapper
   */
  wrapDeprecated(id, originalFn) {
    const self = this;

    return function deprecatedWrapper(...args) {
      self.deprecate(id);
      return originalFn.apply(this, args);
    };
  }

  /**
   * Format message with context
   */
  formatMessage(template, context) {
    let message = template;

    for (const [key, value] of Object.entries(context)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    return message;
  }

  /**
   * Get deprecation statistics
   */
  getStats() {
    const stats = [];

    for (const [id, deprecation] of this.deprecations.entries()) {
      stats.push({
        id,
        emitCount: deprecation.emitCount,
        firstEmitted: deprecation.firstEmitted,
        lastEmitted: deprecation.lastEmitted,
        since: deprecation.since,
        removedIn: deprecation.removedIn
      });
    }

    return stats;
  }
}

const deprecationManager = new DeprecationManager();

// Register deprecations
deprecationManager.registerDeprecation('OLD_FUNCTION', {
  message: 'oldFunction() is deprecated, use newFunction() instead',
  detail: 'oldFunction will be removed in version 3.0.0',
  since: '2.5.0',
  removedIn: '3.0.0'
});

deprecationManager.registerDeprecation('OLD_CONFIG', {
  message: 'Configuration option "{option}" is deprecated',
  detail: 'Use "{replacement}" instead',
  since: '2.3.0',
  removedIn: '3.0.0'
});

// Example deprecated function
function oldFunction() {
  deprecationManager.deprecate('OLD_FUNCTION');
  return 'old result';
}

// Or use wrapper
const wrappedOldFunction = deprecationManager.wrapDeprecated('OLD_FUNCTION', function() {
  return 'wrapped old result';
});

// Call deprecated function
setTimeout(() => {
  console.log('\n[Demo] Calling deprecated function...');
  oldFunction();
  console.log('[Demo] Called deprecated function\n');
}, 7000);

// =============================================================================
// 6. Warning to Error Promotion
// =============================================================================

console.log('\n=== 6. Warning to Error Promotion ===\n');

class WarningToErrorPromoter {
  constructor() {
    this.promotedTypes = new Set();
    this.promotedCodes = new Set();
  }

  /**
   * Promote warnings of a specific type to errors
   */
  promoteType(type) {
    this.promotedTypes.add(type);
    console.log(`[WarningPromoter] Promoting ${type} to errors`);
  }

  /**
   * Promote warnings with specific code to errors
   */
  promoteCode(code) {
    this.promotedCodes.add(code);
    console.log(`[WarningPromoter] Promoting code ${code} to errors`);
  }

  /**
   * Setup promotion handler
   */
  setup() {
    process.on('warning', (warning) => {
      // Check if should promote
      const shouldPromote =
        this.promotedTypes.has(warning.name) ||
        this.promotedCodes.has(warning.code);

      if (shouldPromote) {
        console.error(`\n[WarningPromoter] Promoting warning to error:`);
        console.error(`  Type: ${warning.name}`);
        console.error(`  Code: ${warning.code}`);
        console.error(`  Message: ${warning.message}\n`);

        // Convert to error
        const error = new Error(warning.message);
        error.name = warning.name;
        error.code = warning.code;
        error.stack = warning.stack;

        // Throw error
        throw error;
      }
    });

    console.log('[WarningPromoter] Warning promotion handler installed');
  }
}

const warningPromoter = new WarningToErrorPromoter();

// Example: Promote specific types to errors (commented to not crash)
// warningPromoter.promoteType('DeprecationWarning');
// warningPromoter.promoteCode('CRITICAL_WARNING');
// warningPromoter.setup();

console.log('[WarningPromoter] (Demo: promotion disabled to prevent crash)\n');

// =============================================================================
// 7. Advanced Warning Analytics
// =============================================================================

console.log('\n=== 7. Advanced Warning Analytics ===\n');

class WarningAnalytics extends EventEmitter {
  constructor() {
    super();
    this.warnings = [];
    this.maxWarnings = 1000;
    this.startTime = Date.now();
  }

  /**
   * Start collecting warnings
   */
  start() {
    process.on('warning', (warning) => {
      this.recordWarning(warning);
    });

    console.log('[WarningAnalytics] Started collecting warning analytics');
  }

  /**
   * Record warning
   */
  recordWarning(warning) {
    const record = {
      timestamp: Date.now(),
      name: warning.name,
      message: warning.message,
      code: warning.code,
      stack: warning.stack
    };

    this.warnings.push(record);

    // Keep only recent warnings
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }

    this.emit('warning', record);
  }

  /**
   * Get analytics
   */
  getAnalytics() {
    const now = Date.now();
    const runtime = now - this.startTime;

    // Count by type
    const byType = {};
    for (const warning of this.warnings) {
      byType[warning.name] = (byType[warning.name] || 0) + 1;
    }

    // Count by code
    const byCode = {};
    for (const warning of this.warnings) {
      if (warning.code) {
        byCode[warning.code] = (byCode[warning.code] || 0) + 1;
      }
    }

    // Calculate rate
    const rate = (this.warnings.length / runtime) * 1000 * 60; // per minute

    return {
      total: this.warnings.length,
      runtime,
      rate: rate.toFixed(2),
      byType,
      byCode,
      recent: this.warnings.slice(-10).map(w => ({
        timestamp: new Date(w.timestamp).toISOString(),
        name: w.name,
        code: w.code,
        message: w.message
      }))
    };
  }

  /**
   * Generate report
   */
  generateReport() {
    const analytics = this.getAnalytics();

    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  WARNING ANALYTICS REPORT                         ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`Total Warnings: ${analytics.total}`);
    console.log(`Runtime: ${Math.floor(analytics.runtime / 1000)}s`);
    console.log(`Rate: ${analytics.rate} warnings/minute\n`);

    console.log('By Type:');
    for (const [type, count] of Object.entries(analytics.byType)) {
      console.log(`  ${type}: ${count}`);
    }

    console.log('\nBy Code:');
    for (const [code, count] of Object.entries(analytics.byCode)) {
      console.log(`  ${code}: ${count}`);
    }

    console.log('');
  }
}

const warningAnalytics = new WarningAnalytics();
warningAnalytics.start();

// Generate report periodically
setInterval(() => {
  warningAnalytics.generateReport();
}, 30000);

// =============================================================================
// Summary and Best Practices
// =============================================================================

console.log('\n=== Process Warning Best Practices ===\n');

console.log(`
Process Warning Guidelines:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Listening to Warnings:
   • Always listen to process 'warning' event
   • Log warnings for debugging
   • Track warning frequency
   • Investigate repeated warnings
   • Don't ignore warnings

2. Emitting Custom Warnings:
   • Use process.emitWarning(message)
   • Include warning type (DeprecationWarning, etc.)
   • Add warning code for identification
   • Provide helpful detail/context
   • Don't overuse warnings

3. Deprecation Strategy:
   • Warn before removing features
   • Document migration path
   • Set removal version
   • Emit once per process
   • Track deprecation usage

4. MaxListeners Warnings:
   • Usually indicates a bug (listener leak)
   • Investigate before increasing limit
   • Use emitter.setMaxListeners() carefully
   • Monitor listener counts
   • Clean up listeners properly

5. Warning Categories:
   • DeprecationWarning: Deprecated APIs
   • ExperimentalWarning: Experimental features
   • MaxListenersExceededWarning: Too many listeners
   • Custom warnings: Application-specific
   • Use consistent naming

6. Warning Management:
   • Centralize warning handling
   • Implement warning deduplication
   • Allow suppression by code/type
   • Track warning statistics
   • Review warnings regularly

7. Production Handling:
   • Log warnings to monitoring systems
   • Alert on critical warnings
   • Track warning trends
   • Fix causes, don't just suppress
   • Include in error budgets

8. Command Line Flags:
   • --no-warnings: Suppress all warnings
   • --no-deprecation: Suppress deprecation warnings
   • --throw-deprecation: Throw on deprecation
   • --trace-warnings: Print stack traces
   • --trace-deprecation: Trace deprecations

9. Testing:
   • Test that warnings are emitted
   • Test warning content
   • Test deprecation paths
   • Verify warning deduplication
   • Check warning handlers

10. Documentation:
    • Document all custom warnings
    • Include warning codes
    • Explain how to fix
    • Provide examples
    • Keep changelog updated

Statistics:
───────────
${JSON.stringify(warningListener.getStats(), null, 2)}

Warning Manager:
────────────────
${JSON.stringify(warningManager.getStats(), null, 2)}

Node.js will emit various warnings during normal operation.
Always investigate the root cause rather than suppressing warnings.
Use warnings to improve code quality and user experience.
`);

console.log('\nWarning handlers active. Emitting example warnings...\n');

// Keep process alive
setInterval(() => {
  // Periodically emit a performance warning
  if (Math.random() > 0.7) {
    warningManager.emitWarning('PERFORMANCE_ISSUE', {
      issue: 'Event loop lag detected',
      suggestion: 'Reduce synchronous operations'
    });
  }
}, 10000);
