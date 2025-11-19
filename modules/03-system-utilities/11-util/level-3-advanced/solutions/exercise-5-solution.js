/**
 * Solution: Exercise 5 - Complete Enterprise Utility Suite
 * Comprehensive utility library combining all advanced patterns
 */

const util = require('util');
const { EventEmitter } = require('events');

// Import previous solutions
const DebugSystem = require('./exercise-3-solution');
const PerformanceMonitor = require('./exercise-4-solution');
const { Assert } = require('./exercise-2-solution');

class EnterpriseUtils extends EventEmitter {
  constructor(options = {}) {
    super();

    this.environment = options.environment || 'development';
    this.namespace = options.namespace || 'app';

    // Initialize subsystems
    this.debugSystem = new DebugSystem(this.namespace, options);
    this.performanceMonitor = new PerformanceMonitor(options);
    this.config = new Map();
    this.errors = [];

    // Bind methods
    this.promisify = this.promisify.bind(this);
    this.createLogger = this.createLogger.bind(this);
  }

  // Promisify with enterprise features
  promisify(fn, options = {}) {
    const promisified = util.promisify(fn);

    return async (...args) => {
      if (options.validator) {
        const error = options.validator(...args);
        if (error) throw error;
      }

      return await this.performanceMonitor.track('promisify', async () => {
        let lastError;

        for (let attempt = 0; attempt <= (options.retries || 0); attempt++) {
          try {
            if (options.timeout) {
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after ${options.timeout}ms`)), options.timeout)
              );
              return await Promise.race([promisified(...args), timeoutPromise]);
            }
            return await promisified(...args);
          } catch (err) {
            lastError = err;
            if (attempt === (options.retries || 0)) throw err;
          }
        }

        throw lastError;
      });
    };
  }

  promisifyAll(obj) {
    const promisified = {};
    for (const key of Object.getOwnPropertyNames(obj)) {
      const value = obj[key];
      if (typeof value === 'function' && !key.endsWith('Sync')) {
        promisified[key] = this.promisify(value.bind(obj));
      }
    }
    return promisified;
  }

  createLogger(namespace) {
    const logger = new DebugSystem(namespace || this.namespace, {
      environment: this.environment
    });

    // Wrap with performance tracking
    return {
      trace: (msg, ctx) => this.performanceMonitor.track('log', () => logger.trace(msg, ctx)),
      debug: (msg, ctx) => this.performanceMonitor.track('log', () => logger.debug(msg, ctx)),
      info: (msg, ctx) => this.performanceMonitor.track('log', () => logger.info(msg, ctx)),
      warn: (msg, ctx) => this.performanceMonitor.track('log', () => logger.warn(msg, ctx)),
      error: (msg, ctx) => this.performanceMonitor.track('log', () => logger.error(msg, ctx))
    };
  }

  inspect(obj, options = {}) {
    return this.performanceMonitor.track('inspect', () => {
      const sanitized = this.debugSystem.sanitize(obj);
      return util.inspect(sanitized, {
        depth: options.depth || 3,
        colors: options.colors !== false,
        ...options
      });
    });
  }

  createTestSuite(name) {
    const tests = [];

    return {
      test: (testName, fn) => {
        tests.push({ name: testName, fn });
      },

      run: async () => {
        let passed = 0;
        let failed = 0;

        console.log(`\nRunning ${name}:\n`);

        for (const { name: testName, fn } of tests) {
          try {
            await fn(Assert);
            passed++;
            console.log(`✅ ${testName}`);
          } catch (err) {
            failed++;
            console.log(`❌ ${testName}`);
            console.log(`   ${err.message}`);
          }
        }

        console.log(`\n${passed}/${tests.length} tests passed\n`);
        return { passed, failed, total: tests.length };
      }
    };
  }

  get assert() {
    return Assert;
  }

  async track(operationName, fn) {
    return await this.performanceMonitor.track(operationName, fn);
  }

  getMetrics(operationName) {
    return this.performanceMonitor.getMetrics(operationName);
  }

  performanceReport() {
    return this.performanceMonitor.generateReport();
  }

  config(key, value) {
    if (value === undefined) {
      return this.config.get(key);
    }
    this.config.set(key, value);
  }

  getConfig(key) {
    return this.config.get(key);
  }

  createError(type, message, context = {}) {
    const error = new Error(message);
    error.name = type;
    error.context = context;
    error.timestamp = new Date();

    this.trackError(error, context);
    return error;
  }

  trackError(error, context = {}) {
    this.errors.push({
      error,
      context,
      timestamp: new Date()
    });

    this.emit('error', error);
  }

  getErrorReport() {
    const counts = {};
    for (const { error } of this.errors) {
      const key = error.message;
      counts[key] = (counts[key] || 0) + 1;
    }

    return {
      totalErrors: this.errors.length,
      uniqueErrors: Object.keys(counts).length,
      errorCounts: counts
    };
  }

  pipe(...fns) {
    return (x) => fns.reduce((v, f) => f(v), x);
  }

  asyncPipe(...fns) {
    return (x) => fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(x));
  }

  [util.inspect.custom](depth, options) {
    return util.inspect({
      namespace: this.namespace,
      environment: this.environment,
      configCount: this.config.size,
      errorCount: this.errors.length,
      performance: this.performanceMonitor.generateReport().summary
    }, { ...options, depth: depth - 1, colors: true });
  }
}

// KEY LEARNING POINTS:
// 1. Integrate multiple patterns into cohesive system
// 2. Each subsystem focuses on single responsibility
// 3. Cross-cutting concerns (performance, logging) applied uniformly
// 4. Event-driven architecture for extensibility
// 5. Configuration and error tracking for production
// 6. Custom inspect shows system health at a glance
// 7. Composition patterns enable flexible usage

// COMMON MISTAKES:
// 1. Too much coupling between subsystems
// 2. Inconsistent APIs across different features
// 3. Not considering performance overhead
// 4. Missing error handling and recovery
// 5. Inadequate testing of integrated system

// GOING FURTHER:
// 1. Add plugin system for extensions
// 2. Implement distributed tracing
// 3. Add circuit breaker pattern
// 4. Support custom serialization
// 5. Add health checks and metrics export
// 6. Implement request deduplication
// 7. Add resource pooling
// 8. Support graceful degradation

module.exports = EnterpriseUtils;
