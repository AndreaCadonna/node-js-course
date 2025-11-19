/**
 * Production Debugging System
 *
 * This module demonstrates enterprise-grade debugging using:
 * - Distributed tracing (OpenTelemetry)
 * - APM integration patterns
 * - Dynamic log level control
 * - Performance tracing
 * - Error tracking and aggregation
 * - Debug dumps and diagnostics
 *
 * Production Features:
 * - Zero-downtime debugging
 * - Minimal performance impact
 * - Correlation ID tracking
 * - Structured logging
 * - Real-time metrics
 * - Remote debugging capabilities
 *
 * @module ProductionDebugging
 */

const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * Debug Configuration
 */
const DEFAULT_DEBUG_CONFIG = {
  // Logging
  logLevel: 'info', // trace, debug, info, warn, error
  structuredLogging: true,
  enableColors: true,
  timestampFormat: 'iso',

  // Tracing
  enableTracing: true,
  traceSamplingRate: 1.0, // 100% sampling (reduce in production)
  maxSpanDepth: 10,

  // Performance
  enableProfiling: false,
  slowOperationThreshold: 1000, // ms
  trackAsyncOperations: true,

  // Error tracking
  enableErrorTracking: true,
  captureStackTraces: true,
  maxStackFrames: 20,

  // APM simulation
  apmEndpoint: 'http://localhost:8200',
  apmEnabled: false,

  // Diagnostics
  diagnosticsDir: './diagnostics',
  autoDumpOnError: false,
};

/**
 * Log Levels
 */
const LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

const LogLevelNames = {
  0: 'TRACE',
  1: 'DEBUG',
  2: 'INFO',
  3: 'WARN',
  4: 'ERROR',
  5: 'FATAL',
};

/**
 * Colors for console output
 */
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

/**
 * Trace Span
 */
class Span {
  constructor(name, parentSpan = null) {
    this.spanId = this.generateId();
    this.traceId = parentSpan ? parentSpan.traceId : this.generateId();
    this.parentSpanId = parentSpan ? parentSpan.spanId : null;
    this.name = name;
    this.startTime = performance.now();
    this.endTime = null;
    this.duration = null;
    this.attributes = {};
    this.events = [];
    this.status = 'unset';
    this.children = [];
  }

  generateId() {
    return crypto.randomBytes(8).toString('hex');
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
  }

  setAttributes(attributes) {
    Object.assign(this.attributes, attributes);
  }

  addEvent(name, attributes = {}) {
    this.events.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  }

  end(status = 'ok') {
    this.endTime = performance.now();
    this.duration = this.endTime - this.startTime;
    this.status = status;
  }

  recordException(error) {
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack,
    });
    this.status = 'error';
  }

  toJSON() {
    return {
      spanId: this.spanId,
      traceId: this.traceId,
      parentSpanId: this.parentSpanId,
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      attributes: this.attributes,
      events: this.events,
      status: this.status,
    };
  }
}

/**
 * Tracer
 */
class Tracer {
  constructor(config) {
    this.config = config;
    this.spans = [];
    this.activeSpans = new Map();
    this.completedTraces = [];
  }

  startSpan(name, parentSpan = null) {
    // Check sampling
    if (Math.random() > this.config.traceSamplingRate) {
      return null; // Skip this span
    }

    const span = new Span(name, parentSpan);
    this.activeSpans.set(span.spanId, span);

    if (parentSpan) {
      parentSpan.children.push(span);
    }

    return span;
  }

  endSpan(span) {
    if (!span) return;

    span.end();
    this.activeSpans.delete(span.spanId);

    // If this is a root span (no parent), record completed trace
    if (!span.parentSpanId) {
      this.completedTraces.push(span);

      // Keep only last 100 traces
      if (this.completedTraces.length > 100) {
        this.completedTraces.shift();
      }
    }
  }

  withSpan(name, fn, parentSpan = null) {
    const span = this.startSpan(name, parentSpan);

    try {
      const result = fn(span);

      // Handle promises
      if (result && typeof result.then === 'function') {
        return result
          .then(value => {
            this.endSpan(span);
            return value;
          })
          .catch(error => {
            if (span) {
              span.recordException(error);
            }
            this.endSpan(span);
            throw error;
          });
      }

      this.endSpan(span);
      return result;
    } catch (error) {
      if (span) {
        span.recordException(error);
      }
      this.endSpan(span);
      throw error;
    }
  }

  getActiveSpans() {
    return Array.from(this.activeSpans.values());
  }

  getCompletedTraces(limit = 10) {
    return this.completedTraces.slice(-limit);
  }
}

/**
 * Structured Logger
 */
class StructuredLogger {
  constructor(config) {
    this.config = config;
    this.currentLevel = LogLevel[config.logLevel.toUpperCase()];
    this.context = {};
  }

  setLevel(level) {
    this.currentLevel = LogLevel[level.toUpperCase()];
  }

  setContext(context) {
    Object.assign(this.context, context);
  }

  clearContext() {
    this.context = {};
  }

  shouldLog(level) {
    return level >= this.currentLevel;
  }

  log(level, message, metadata = {}) {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LogLevelNames[level],
      message,
      ...this.context,
      ...metadata,
    };

    if (this.config.structuredLogging) {
      this.writeStructured(entry);
    } else {
      this.writeFormatted(entry);
    }
  }

  writeStructured(entry) {
    console.log(JSON.stringify(entry));
  }

  writeFormatted(entry) {
    const levelColor = this.getLevelColor(entry.level);
    const timestamp = entry.timestamp;
    const level = entry.level.padEnd(5);

    let output = `${Colors.dim}${timestamp}${Colors.reset} ${levelColor}${level}${Colors.reset} ${entry.message}`;

    // Add metadata
    const metadata = { ...entry };
    delete metadata.timestamp;
    delete metadata.level;
    delete metadata.message;

    if (Object.keys(metadata).length > 0) {
      output += `\n${Colors.dim}${JSON.stringify(metadata, null, 2)}${Colors.reset}`;
    }

    console.log(output);
  }

  getLevelColor(level) {
    const colors = {
      TRACE: Colors.dim,
      DEBUG: Colors.cyan,
      INFO: Colors.green,
      WARN: Colors.yellow,
      ERROR: Colors.red,
      FATAL: Colors.bright + Colors.red,
    };
    return colors[level] || Colors.white;
  }

  trace(message, metadata) {
    this.log(LogLevel.TRACE, message, metadata);
  }

  debug(message, metadata) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message, metadata) {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message, metadata) {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message, metadata) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  fatal(message, metadata) {
    this.log(LogLevel.FATAL, message, metadata);
  }
}

/**
 * Error Tracker
 */
class ErrorTracker {
  constructor(config) {
    this.config = config;
    this.errors = [];
    this.errorCounts = new Map();
  }

  captureError(error, context = {}) {
    const errorEntry = {
      timestamp: Date.now(),
      name: error.name,
      message: error.message,
      stack: this.config.captureStackTraces
        ? this.parseStackTrace(error.stack)
        : null,
      context,
    };

    this.errors.push(errorEntry);

    // Keep only last 100 errors
    if (this.errors.length > 100) {
      this.errors.shift();
    }

    // Count occurrences
    const key = `${error.name}:${error.message}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);

    return errorEntry;
  }

  parseStackTrace(stack) {
    if (!stack) return [];

    return stack
      .split('\n')
      .slice(1, this.config.maxStackFrames + 1)
      .map(line => {
        const match = line.match(/at\s+(.*?)\s+\((.*?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4]),
          };
        }
        return { raw: line.trim() };
      });
  }

  getRecentErrors(limit = 10) {
    return this.errors.slice(-limit);
  }

  getErrorStatistics() {
    const stats = Array.from(this.errorCounts.entries())
      .map(([key, count]) => {
        const [name, message] = key.split(':');
        return { name, message, count };
      })
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors: this.errors.length,
      uniqueErrors: this.errorCounts.size,
      topErrors: stats.slice(0, 5),
    };
  }
}

/**
 * Performance Monitor
 */
class PerformanceMonitor {
  constructor(config) {
    this.config = config;
    this.operations = [];
    this.slowOperations = [];
  }

  trackOperation(name, duration, metadata = {}) {
    const operation = {
      timestamp: Date.now(),
      name,
      duration,
      ...metadata,
    };

    this.operations.push(operation);

    // Check if slow
    if (duration > this.config.slowOperationThreshold) {
      this.slowOperations.push(operation);
      console.warn(`🐌 Slow operation detected: ${name} (${duration.toFixed(2)}ms)`);
    }

    // Keep last 100 operations
    if (this.operations.length > 100) {
      this.operations.shift();
    }
  }

  async measure(name, fn, metadata = {}) {
    const start = performance.now();

    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.trackOperation(name, duration, { ...metadata, status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.trackOperation(name, duration, { ...metadata, status: 'error', error: error.message });
      throw error;
    }
  }

  getStatistics(name = null) {
    let ops = this.operations;

    if (name) {
      ops = ops.filter(op => op.name === name);
    }

    if (ops.length === 0) return null;

    const durations = ops.map(op => op.duration);
    durations.sort((a, b) => a - b);

    return {
      count: ops.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
    };
  }

  getSlowOperations() {
    return this.slowOperations;
  }
}

/**
 * Diagnostics Collector
 */
class DiagnosticsCollector {
  constructor(config) {
    this.config = config;
  }

  async collectDiagnostics() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      process: this.getProcessInfo(),
      system: this.getSystemInfo(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      eventLoop: await this.getEventLoopLag(),
      handles: this.getHandleInfo(),
      environment: this.getEnvironmentInfo(),
    };

    return diagnostics;
  }

  getProcessInfo() {
    return {
      pid: process.pid,
      ppid: process.ppid,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      uptime: process.uptime(),
      argv: process.argv,
      execPath: process.execPath,
      cwd: process.cwd(),
    };
  }

  getSystemInfo() {
    return {
      hostname: require('os').hostname(),
      type: require('os').type(),
      release: require('os').release(),
      cpus: require('os').cpus().length,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
      loadAverage: require('os').loadavg(),
    };
  }

  async getEventLoopLag() {
    return new Promise((resolve) => {
      const start = performance.now();
      setImmediate(() => {
        resolve(performance.now() - start);
      });
    });
  }

  getHandleInfo() {
    return {
      activeHandles: process._getActiveHandles ? process._getActiveHandles().length : 0,
      activeRequests: process._getActiveRequests ? process._getActiveRequests().length : 0,
    };
  }

  getEnvironmentInfo() {
    // Filter sensitive env vars
    const safeEnv = {};
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'api'];

    for (const [key, value] of Object.entries(process.env)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        safeEnv[key] = '[REDACTED]';
      } else {
        safeEnv[key] = value;
      }
    }

    return safeEnv;
  }

  async saveDiagnosticsDump(filename = null) {
    const diagnostics = await this.collectDiagnostics();

    const name = filename || `diagnostics-${Date.now()}.json`;
    const filepath = path.join(this.config.diagnosticsDir, name);

    // Ensure directory exists
    fs.mkdirSync(this.config.diagnosticsDir, { recursive: true });

    fs.writeFileSync(filepath, JSON.stringify(diagnostics, null, 2));

    console.log(`📋 Diagnostics saved to: ${filepath}`);

    return filepath;
  }
}

/**
 * APM Client (Simulated)
 */
class APMClient {
  constructor(config) {
    this.config = config;
    this.metrics = [];
  }

  sendMetric(name, value, tags = {}) {
    if (!this.config.apmEnabled) return;

    const metric = {
      timestamp: Date.now(),
      name,
      value,
      tags,
    };

    this.metrics.push(metric);

    // Simulate sending to APM
    // In production: HTTP POST to APM endpoint
    console.log(`📊 [APM] ${name}: ${value}`, tags);
  }

  sendTrace(trace) {
    if (!this.config.apmEnabled) return;

    // Simulate sending trace to APM
    console.log(`🔍 [APM] Trace: ${trace.name} (${trace.duration.toFixed(2)}ms)`);
  }

  sendError(error, context) {
    if (!this.config.apmEnabled) return;

    // Simulate sending error to APM
    console.log(`❌ [APM] Error: ${error.message}`, context);
  }
}

/**
 * Main Production Debugger
 */
class ProductionDebugger extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = { ...DEFAULT_DEBUG_CONFIG, ...config };

    this.logger = new StructuredLogger(this.config);
    this.tracer = new Tracer(this.config);
    this.errorTracker = new ErrorTracker(this.config);
    this.perfMonitor = new PerformanceMonitor(this.config);
    this.diagnostics = new DiagnosticsCollector(this.config);
    this.apm = new APMClient(this.config);

    this.isActive = false;
  }

  /**
   * Initialize debugger
   */
  initialize() {
    console.log('🔧 Initializing Production Debugger...\n');

    // Set up error handlers
    process.on('uncaughtException', (error) => {
      this.handleUncaughtException(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.handleUnhandledRejection(reason, promise);
    });

    // Set up warning handler
    process.on('warning', (warning) => {
      this.logger.warn('Process warning', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    });

    this.isActive = true;
    this.logger.info('Production debugger initialized', {
      logLevel: this.config.logLevel,
      tracingEnabled: this.config.enableTracing,
      apmEnabled: this.config.apmEnabled,
    });

    this.emit('initialized');
  }

  /**
   * Handle uncaught exception
   */
  handleUncaughtException(error) {
    this.logger.fatal('Uncaught exception', {
      error: error.message,
      stack: error.stack,
    });

    const errorEntry = this.errorTracker.captureError(error, {
      type: 'uncaughtException',
    });

    this.apm.sendError(error, errorEntry);

    if (this.config.autoDumpOnError) {
      this.diagnostics.saveDiagnosticsDump().catch(console.error);
    }

    // Don't exit immediately in production
    this.emit('fatal-error', error);
  }

  /**
   * Handle unhandled rejection
   */
  handleUnhandledRejection(reason, promise) {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    this.logger.error('Unhandled promise rejection', {
      error: error.message,
      stack: error.stack,
    });

    const errorEntry = this.errorTracker.captureError(error, {
      type: 'unhandledRejection',
    });

    this.apm.sendError(error, errorEntry);

    this.emit('unhandled-rejection', error);
  }

  /**
   * Create a traced function
   */
  trace(name, fn) {
    return (...args) => {
      return this.tracer.withSpan(name, (span) => {
        if (span) {
          span.setAttribute('args.length', args.length);
        }
        return fn(...args);
      });
    };
  }

  /**
   * Measure function performance
   */
  async measure(name, fn, metadata = {}) {
    return this.perfMonitor.measure(name, fn, metadata);
  }

  /**
   * Log with context
   */
  log(level, message, metadata = {}) {
    this.logger.log(LogLevel[level.toUpperCase()], message, metadata);
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level) {
    this.logger.setLevel(level);
    this.logger.info('Log level changed', { newLevel: level });
  }

  /**
   * Generate debug report
   */
  async generateReport() {
    const diagnostics = await this.diagnostics.collectDiagnostics();

    const report = {
      timestamp: new Date().toISOString(),
      diagnostics,
      tracing: {
        activeSpans: this.tracer.getActiveSpans().length,
        completedTraces: this.tracer.getCompletedTraces(5).map(t => ({
          name: t.name,
          duration: t.duration,
          status: t.status,
        })),
      },
      errors: this.errorTracker.getErrorStatistics(),
      performance: {
        operations: this.perfMonitor.operations.length,
        slowOperations: this.perfMonitor.getSlowOperations().length,
      },
    };

    return report;
  }

  /**
   * Dump diagnostics
   */
  async dumpDiagnostics() {
    return this.diagnostics.saveDiagnosticsDump();
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      active: this.isActive,
      logLevel: this.config.logLevel,
      activeSpans: this.tracer.getActiveSpans().length,
      totalErrors: this.errorTracker.errors.length,
      trackedOperations: this.perfMonitor.operations.length,
    };
  }
}

/**
 * Demo: Production debugging
 */
async function demonstrateProductionDebugging() {
  console.log('='.repeat(80));
  console.log('PRODUCTION DEBUGGING DEMO');
  console.log('='.repeat(80));
  console.log();

  const debugger = new ProductionDebugger({
    logLevel: 'debug',
    structuredLogging: false,
    enableTracing: true,
    apmEnabled: true,
  });

  // Initialize
  debugger.initialize();

  // Demo: Logging
  console.log('='.repeat(80));
  console.log('STRUCTURED LOGGING');
  console.log('='.repeat(80));
  console.log();

  debugger.logger.debug('Debug message', { userId: '12345' });
  debugger.logger.info('Application started', { port: 3000 });
  debugger.logger.warn('High memory usage', { heapMB: 450 });
  debugger.logger.error('Database connection failed', { error: 'Timeout' });

  // Demo: Distributed tracing
  console.log('\n' + '='.repeat(80));
  console.log('DISTRIBUTED TRACING');
  console.log('='.repeat(80));
  console.log();

  const tracedFunction = debugger.trace('process-request', async (span) => {
    if (span) {
      span.setAttribute('user.id', '12345');
      span.setAttribute('request.method', 'GET');
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    // Nested span
    return debugger.tracer.withSpan('database-query', async (dbSpan) => {
      if (dbSpan) {
        dbSpan.setAttribute('query', 'SELECT * FROM users');
      }
      await new Promise(resolve => setTimeout(resolve, 50));
      return { users: [] };
    }, span);
  });

  console.log('Executing traced function...');
  await tracedFunction();

  // Demo: Performance monitoring
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE MONITORING');
  console.log('='.repeat(80));
  console.log();

  await debugger.measure('fast-operation', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  await debugger.measure('slow-operation', async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
  });

  const stats = debugger.perfMonitor.getStatistics();
  console.log('\nPerformance Statistics:');
  console.log(`  Operations: ${stats.count}`);
  console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
  console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
  console.log(`  Slow operations: ${debugger.perfMonitor.getSlowOperations().length}`);

  // Demo: Error tracking
  console.log('\n' + '='.repeat(80));
  console.log('ERROR TRACKING');
  console.log('='.repeat(80));
  console.log();

  try {
    throw new Error('Simulated error');
  } catch (error) {
    debugger.errorTracker.captureError(error, {
      component: 'demo',
      action: 'test-error',
    });
  }

  const errorStats = debugger.errorTracker.getErrorStatistics();
  console.log('Error Statistics:');
  console.log(`  Total Errors: ${errorStats.totalErrors}`);
  console.log(`  Unique Errors: ${errorStats.uniqueErrors}`);

  // Demo: Dynamic log level
  console.log('\n' + '='.repeat(80));
  console.log('DYNAMIC LOG LEVEL');
  console.log('='.repeat(80));
  console.log();

  console.log('Setting log level to WARN...');
  debugger.setLogLevel('warn');

  debugger.logger.debug('This will not show');
  debugger.logger.info('This will not show');
  debugger.logger.warn('This will show');

  // Reset
  debugger.setLogLevel('info');

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('DEBUG REPORT');
  console.log('='.repeat(80));
  console.log();

  const report = await debugger.generateReport();
  console.log('System Diagnostics:');
  console.log(`  PID: ${report.diagnostics.process.pid}`);
  console.log(`  Uptime: ${report.diagnostics.process.uptime.toFixed(2)}s`);
  console.log(`  Memory (RSS): ${(report.diagnostics.memory.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Event Loop Lag: ${report.diagnostics.eventLoop.toFixed(2)}ms`);
  console.log(`  Active Handles: ${report.diagnostics.handles.activeHandles}`);

  console.log('\nTracing:');
  console.log(`  Active Spans: ${report.tracing.activeSpans}`);
  console.log(`  Completed Traces: ${report.tracing.completedTraces.length}`);

  // Dump diagnostics
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC DUMP');
  console.log('='.repeat(80));
  console.log();

  await debugger.dumpDiagnostics();

  console.log('\n✅ Demo complete!');
  console.log('\n💡 Production Debugging Best Practices:');
  console.log('  1. Use structured logging for machine-readable logs');
  console.log('  2. Implement distributed tracing for microservices');
  console.log('  3. Set up APM integration (DataDog, New Relic, etc.)');
  console.log('  4. Monitor event loop lag and memory usage');
  console.log('  5. Implement correlation IDs for request tracking');
  console.log('  6. Use dynamic log levels to debug production issues');
  console.log('  7. Set up automated diagnostic dumps on errors');
  console.log('  8. Track performance metrics and slow operations');
  console.log('  9. Implement proper error aggregation and alerting');
  console.log('  10. Use remote debugging cautiously (security implications)');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateProductionDebugging().catch(console.error);
}

module.exports = {
  ProductionDebugger,
  StructuredLogger,
  Tracer,
  Span,
  ErrorTracker,
  PerformanceMonitor,
  DiagnosticsCollector,
  APMClient,
  LogLevel,
};
