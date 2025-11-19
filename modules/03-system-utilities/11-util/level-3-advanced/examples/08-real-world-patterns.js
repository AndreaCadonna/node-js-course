/**
 * Example 8: Real-World Production Patterns
 *
 * Demonstrates production patterns from real applications: API clients,
 * database wrappers, testing utilities, and monitoring systems.
 */

const util = require('util');
const fs = require('fs');
const { EventEmitter } = require('events');

console.log('=== Real-World Production Patterns ===\n');

// =============================================================================
// 1. Production API Client
// =============================================================================
console.log('1. Production-Ready API Client\n');

class APIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL;
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
    this.debuglog = util.debuglog('api-client');

    // Sensitive data that should be hidden
    this.apiKey = options.apiKey;
    this.sessionToken = null;
  }

  [util.inspect.custom](depth, options) {
    // Never expose API keys in logs
    return util.inspect({
      baseURL: this.baseURL,
      timeout: this.timeout,
      retries: this.retries,
      apiKey: '[REDACTED]',
      sessionToken: this.sessionToken ? '[REDACTED]' : null,
      authenticated: !!this.sessionToken
    }, { ...options, depth: depth - 1 });
  }

  async request(endpoint, options = {}) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.debuglog('Request %s: %s %s', requestId, options.method || 'GET', endpoint);

    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const response = {
          status: 200,
          data: { success: true, endpoint },
          headers: { 'x-request-id': requestId }
        };

        this.debuglog('Response %s: %O', requestId, response);
        resolve(response);
      }, 50);
    });
  }

  // Promisified with built-in error handling
  get = util.promisify(function(endpoint, callback) {
    this.request(endpoint, { method: 'GET' })
      .then(result => callback(null, result))
      .catch(err => callback(err));
  });

  // Custom promisify implementation
  [util.promisify.custom] = function(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  };
}

const client = new APIClient({
  baseURL: 'https://api.example.com',
  apiKey: 'sk_live_secret_key_12345',
  timeout: 3000
});

console.log('API Client:');
console.log(client);

client.request('/users')
  .then(response => {
    console.log('✅ API request successful');
    console.log('');
  });

// =============================================================================
// 2. Database Connection Pool
// =============================================================================
setTimeout(() => {
  console.log('2. Database Connection Pool\n');

  class DatabasePool {
    constructor(options = {}) {
      this.host = options.host || 'localhost';
      this.port = options.port || 5432;
      this.database = options.database;
      this.user = options.user;
      this.password = options.password;

      this.poolSize = options.poolSize || 10;
      this.connections = new Set();
      this.available = [];

      this.debuglog = util.debuglog('database');
      this.metrics = {
        queries: 0,
        errors: 0,
        avgQueryTime: 0
      };
    }

    [util.inspect.custom](depth, options) {
      // Secure inspection - hide password
      return util.inspect({
        host: this.host,
        port: this.port,
        database: this.database,
        user: this.user,
        password: '[REDACTED]',
        poolSize: this.poolSize,
        activeConnections: this.connections.size,
        availableConnections: this.available.length,
        metrics: this.metrics
      }, { ...options, depth: depth - 1, colors: true });
    }

    async query(sql, params = []) {
      const queryId = `query-${Date.now()}`;
      const start = process.hrtime.bigint();

      this.debuglog('Query %s: %s', queryId, sql);

      try {
        // Simulate query
        await new Promise(resolve => setTimeout(resolve, 10));

        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000;

        // Update metrics
        this.metrics.queries++;
        this.metrics.avgQueryTime =
          (this.metrics.avgQueryTime * (this.metrics.queries - 1) + duration) /
          this.metrics.queries;

        this.debuglog('Query %s completed in %sms', queryId, duration.toFixed(2));

        return { rows: [], rowCount: 0, duration };
      } catch (err) {
        this.metrics.errors++;
        this.debuglog('Query %s failed: %s', queryId, err.message);
        throw err;
      }
    }

    getStats() {
      return {
        ...this.metrics,
        avgQueryTime: this.metrics.avgQueryTime.toFixed(2) + 'ms'
      };
    }
  }

  const db = new DatabasePool({
    host: 'localhost',
    database: 'myapp',
    user: 'admin',
    password: 'super_secret_password',
    poolSize: 20
  });

  console.log('Database Pool:');
  console.log(db);

  db.query('SELECT * FROM users WHERE id = $1', [123])
    .then(() => {
      console.log('Query stats:', db.getStats());
      console.log('✅ Password hidden in inspect, metrics tracked');
      console.log('');
    });
}, 150);

// =============================================================================
// 3. Testing Framework Utilities
// =============================================================================
setTimeout(() => {
  console.log('3. Testing Framework Utilities\n');

  class TestRunner {
    constructor() {
      this.tests = [];
      this.results = {
        passed: 0,
        failed: 0,
        total: 0
      };
    }

    // Assertion utilities using util
    assert = {
      equal: (actual, expected, message) => {
        if (!util.isDeepStrictEqual(actual, expected)) {
          throw new AssertionError(message || 'Assertion failed', actual, expected);
        }
      },

      notEqual: (actual, expected, message) => {
        if (util.isDeepStrictEqual(actual, expected)) {
          throw new AssertionError(message || 'Should not be equal', actual, expected);
        }
      },

      throws: async (fn, expectedError, message) => {
        try {
          await fn();
          throw new AssertionError(message || 'Expected function to throw');
        } catch (err) {
          if (expectedError && !(err instanceof expectedError)) {
            throw new AssertionError('Wrong error type', err, expectedError);
          }
        }
      }
    };

    test(name, fn) {
      this.tests.push({ name, fn });
    }

    async run() {
      console.log(`Running ${this.tests.length} tests...\n`);

      for (const { name, fn } of this.tests) {
        this.results.total++;
        try {
          await fn(this.assert);
          this.results.passed++;
          console.log(`✅ ${name}`);
        } catch (err) {
          this.results.failed++;
          console.log(`❌ ${name}`);
          console.log(`   ${err.message}`);

          if (err instanceof AssertionError) {
            console.log(`   Expected: ${util.inspect(err.expected, { depth: 2 })}`);
            console.log(`   Actual: ${util.inspect(err.actual, { depth: 2 })}`);
          }
        }
      }

      console.log(`\n${this.results.passed}/${this.results.total} tests passed`);
      return this.results;
    }
  }

  class AssertionError extends Error {
    constructor(message, actual, expected) {
      super(message);
      this.name = 'AssertionError';
      this.actual = actual;
      this.expected = expected;
    }
  }

  // Use the test runner
  const runner = new TestRunner();

  runner.test('objects are deeply equal', (assert) => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    assert.equal(obj1, obj2);
  });

  runner.test('arrays are equal', (assert) => {
    assert.equal([1, 2, 3], [1, 2, 3]);
  });

  runner.test('this should fail', (assert) => {
    assert.equal({ a: 1 }, { a: 2 }, 'Values do not match');
  });

  runner.run().then(() => console.log(''));
}, 250);

// =============================================================================
// 4. Monitoring and Observability
// =============================================================================
setTimeout(() => {
  console.log('4. Monitoring and Observability System\n');

  class Monitor extends EventEmitter {
    constructor(options = {}) {
      super();
      this.namespace = options.namespace || 'app';
      this.debuglog = util.debuglog(this.namespace);

      this.metrics = new Map();
      this.alerts = [];

      this.thresholds = options.thresholds || {
        responseTime: 1000,
        errorRate: 0.05,
        memoryUsage: 0.9
      };
    }

    recordMetric(name, value, tags = {}) {
      const metric = {
        name,
        value,
        tags,
        timestamp: new Date()
      };

      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }

      this.metrics.get(name).push(metric);
      this.debuglog('Metric recorded: %s = %s', name, value);

      // Check thresholds
      this.checkThresholds(name, value);

      this.emit('metric', metric);
    }

    checkThresholds(name, value) {
      const threshold = this.thresholds[name];

      if (threshold && value > threshold) {
        const alert = {
          metric: name,
          value,
          threshold,
          timestamp: new Date()
        };

        this.alerts.push(alert);
        this.emit('alert', alert);

        console.warn('⚠️  Alert:', util.inspect(alert, { colors: true }));
      }
    }

    getMetrics(name) {
      const metrics = this.metrics.get(name) || [];

      if (metrics.length === 0) {
        return { count: 0, avg: 0, min: 0, max: 0 };
      }

      const values = metrics.map(m => m.value);
      return {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };
    }

    [util.inspect.custom](depth, options) {
      const summary = {};

      for (const [name, metrics] of this.metrics.entries()) {
        summary[name] = this.getMetrics(name);
      }

      return util.inspect({
        namespace: this.namespace,
        metricsCount: this.metrics.size,
        alertsCount: this.alerts.length,
        summary
      }, { ...options, depth: depth - 1, colors: true });
    }
  }

  const monitor = new Monitor({
    namespace: 'production',
    thresholds: {
      responseTime: 100,
      errorRate: 0.1
    }
  });

  // Record some metrics
  monitor.recordMetric('responseTime', 45);
  monitor.recordMetric('responseTime', 89);
  monitor.recordMetric('responseTime', 150); // Over threshold!

  monitor.recordMetric('errorRate', 0.02);
  monitor.recordMetric('errorRate', 0.15); // Over threshold!

  console.log('\nMonitor state:');
  console.log(monitor);
  console.log('');
}, 450);

// =============================================================================
// 5. Configuration Manager
// =============================================================================
setTimeout(() => {
  console.log('5. Configuration Manager\n');

  class ConfigManager {
    constructor(options = {}) {
      this.configs = new Map();
      this.deprecated = new Map();
      this.debuglog = util.debuglog('config');

      this.sensitiveKeys = ['password', 'secret', 'token', 'key'];
    }

    set(key, value) {
      this.configs.set(key, value);
      this.debuglog('Config set: %s', key);
    }

    get(key) {
      // Check if deprecated
      if (this.deprecated.has(key)) {
        const { newKey, message } = this.deprecated.get(key);
        const deprecatedFn = util.deprecate(
          () => this.configs.get(newKey || key),
          message,
          `DEP_CONFIG_${key.toUpperCase()}`
        );
        return deprecatedFn();
      }

      return this.configs.get(key);
    }

    deprecate(oldKey, newKey, message) {
      this.deprecated.set(oldKey, {
        newKey,
        message: message || `Config key "${oldKey}" is deprecated. Use "${newKey}" instead.`
      });
    }

    validate(schema) {
      const errors = [];

      for (const [key, validator] of Object.entries(schema)) {
        const value = this.configs.get(key);

        if (value === undefined) {
          errors.push(`Missing required config: ${key}`);
        } else if (!validator(value)) {
          errors.push(`Invalid config for ${key}: ${util.inspect(value)}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    [util.inspect.custom](depth, options) {
      const sanitized = new Map();

      for (const [key, value] of this.configs.entries()) {
        const isSensitive = this.sensitiveKeys.some(s =>
          key.toLowerCase().includes(s)
        );

        sanitized.set(key, isSensitive ? '[REDACTED]' : value);
      }

      return util.inspect({
        configs: Object.fromEntries(sanitized),
        deprecated: Array.from(this.deprecated.keys())
      }, { ...options, depth: depth - 1, colors: true });
    }
  }

  const config = new ConfigManager();

  // Set configs
  config.set('database.host', 'localhost');
  config.set('database.port', 5432);
  config.set('database.password', 'super_secret');
  config.set('api.timeout', 5000);
  config.set('api.newEndpoint', 'https://api.v2.example.com');

  // Deprecate old config
  config.deprecate('api.endpoint', 'api.newEndpoint');

  // Validate
  const validation = config.validate({
    'database.host': (v) => typeof v === 'string',
    'database.port': (v) => typeof v === 'number' && v > 0,
    'api.timeout': (v) => typeof v === 'number'
  });

  console.log('Validation:', validation);
  console.log('\nConfig Manager:');
  console.log(config);

  console.log('\nAccessing deprecated config:');
  config.get('api.endpoint'); // Shows deprecation warning

  console.log('');
}, 550);

// =============================================================================
// 6. Event-Driven Service with Util Integration
// =============================================================================
setTimeout(() => {
  console.log('6. Event-Driven Service\n');

  class EventDrivenService extends EventEmitter {
    constructor(name) {
      super();
      this.name = name;
      this.debuglog = util.debuglog(this.name);
      this.eventCount = new Map();

      // Track all events
      this.on('newListener', (event) => {
        this.debuglog('New listener for event: %s', event);
      });

      // Log all emitted events in debug mode
      const originalEmit = this.emit;
      this.emit = function(event, ...args) {
        this.debuglog('Event emitted: %s %O', event, args);

        // Track event count
        const count = this.eventCount.get(event) || 0;
        this.eventCount.set(event, count + 1);

        return originalEmit.call(this, event, ...args);
      };
    }

    [util.inspect.custom](depth, options) {
      return util.inspect({
        name: this.name,
        eventNames: this.eventNames(),
        eventCounts: Object.fromEntries(this.eventCount),
        listenerCount: this.eventNames().reduce((acc, event) => {
          acc[event] = this.listenerCount(event);
          return acc;
        }, {})
      }, { ...options, depth: depth - 1, colors: true });
    }
  }

  const service = new EventDrivenService('my-service');

  service.on('data', (data) => {
    console.log('Data received:', data);
  });

  service.on('error', (err) => {
    console.error('Error:', err.message);
  });

  // Emit events
  service.emit('data', { id: 1, value: 'test' });
  service.emit('data', { id: 2, value: 'test2' });
  service.emit('error', new Error('Test error'));

  console.log('\nService state:');
  console.log(service);
  console.log('');
}, 650);

// =============================================================================
// Key Takeaways
// =============================================================================
setTimeout(() => {
  console.log('=== Key Takeaways ===');
  console.log('1. API clients: Hide sensitive data with custom inspect');
  console.log('2. Database pools: Track metrics, secure credentials');
  console.log('3. Test frameworks: Use isDeepStrictEqual for assertions');
  console.log('4. Monitoring: Combine events, metrics, and debugging');
  console.log('5. Config managers: Deprecation warnings, validation');
  console.log('6. Event services: Debug logging for all events');
  console.log('7. Always sanitize sensitive data in production');
  console.log('8. Use util.debuglog for conditional production logging');
  console.log('9. Custom inspect makes debugging much easier');
  console.log('10. Composition of util functions creates powerful tools');
}, 750);
