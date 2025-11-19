/**
 * Example 8: Complete Security Hardening
 *
 * This example demonstrates:
 * - Defense-in-depth security strategies
 * - Complete attack surface reduction
 * - Comprehensive security audit logging
 * - Intrusion detection
 * - Production-ready secure execution
 */

const vm = require('vm');
const crypto = require('crypto');
const { EventEmitter } = require('events');

console.log('=== Complete Security Hardening ===\n');

// ============================================================================
// Part 1: Secure Context Builder
// ============================================================================

console.log('Part 1: Secure Context Builder\n');

/**
 * Build hardened security context
 */
class SecureContextBuilder {
  constructor() {
    this.globalWhitelist = new Set(['Math', 'JSON', 'Date', 'Array', 'Object', 'String', 'Number']);
    this.propertyBlacklist = new Set([
      'constructor', '__proto__', 'prototype',
      'eval', 'Function', 'GeneratorFunction', 'AsyncFunction',
      'process', 'require', 'module', 'exports',
      'global', 'globalThis', 'Buffer', 'SharedArrayBuffer',
      'import', 'Worker', 'MessageChannel'
    ]);
  }

  /**
   * Create secure base context
   */
  createBase() {
    // Start with null prototype
    const base = Object.create(null);

    // Add whitelisted globals
    this.globalWhitelist.forEach(name => {
      if (global[name]) {
        // Create clean copy without constructor access
        const descriptor = Object.getOwnPropertyDescriptors(global[name]);
        base[name] = Object.create(null, descriptor);
        Object.freeze(base[name]);
      }
    });

    // Add safe console
    base.console = this.createSafeConsole();

    return base;
  }

  /**
   * Create safe console object
   */
  createSafeConsole() {
    const safeConsole = Object.create(null);
    ['log', 'error', 'warn', 'info'].forEach(method => {
      safeConsole[method] = (...args) => {
        const sanitized = args.map(arg =>
          typeof arg === 'string' ? arg.substring(0, 1000) : String(arg).substring(0, 100)
        );
        console[method]('[Sandbox]', ...sanitized);
      };
    });
    return Object.freeze(safeConsole);
  }

  /**
   * Create protective proxy
   */
  createProxy(target) {
    return new Proxy(target, {
      get: (obj, prop) => {
        if (this.propertyBlacklist.has(prop)) {
          throw new Error(`Access denied: ${String(prop)}`);
        }
        if (typeof prop === 'symbol') {
          throw new Error('Symbol access denied');
        }
        return Reflect.get(obj, prop);
      },

      set: (obj, prop, value) => {
        if (this.propertyBlacklist.has(prop)) {
          throw new Error(`Mutation denied: ${String(prop)}`);
        }
        if (typeof value === 'function') {
          throw new Error('Cannot set function properties');
        }
        return Reflect.set(obj, prop, value);
      },

      has: (obj, prop) => {
        if (this.propertyBlacklist.has(prop)) {
          return false;
        }
        return Reflect.has(obj, prop);
      },

      deleteProperty: (obj, prop) => {
        if (this.globalWhitelist.has(prop)) {
          throw new Error(`Cannot delete protected property: ${String(prop)}`);
        }
        return Reflect.deleteProperty(obj, prop);
      },

      getPrototypeOf: () => null,
      setPrototypeOf: () => false,

      defineProperty: (obj, prop, descriptor) => {
        if (this.propertyBlacklist.has(prop)) {
          throw new Error(`Cannot define property: ${String(prop)}`);
        }
        return Reflect.defineProperty(obj, prop, descriptor);
      }
    });
  }

  /**
   * Build complete secure context
   */
  build() {
    const base = this.createBase();
    const protected = this.createProxy(base);
    return vm.createContext(protected);
  }
}

// Test secure context builder
console.log('Testing secure context builder:');
const builder = new SecureContextBuilder();
const secureContext = builder.build();

const securityTests = [
  { code: 'Math.sqrt(144)', shouldPass: true },
  { code: 'JSON.stringify({a: 1})', shouldPass: true },
  { code: 'constructor', shouldPass: false },
  { code: '__proto__', shouldPass: false },
  { code: 'process', shouldPass: false },
  { code: 'eval("1+1")', shouldPass: false }
];

securityTests.forEach(({ code, shouldPass }) => {
  try {
    const result = vm.runInContext(code, secureContext, { timeout: 100 });
    if (shouldPass) {
      console.log(`  ✓ ${code} => ${result}`);
    } else {
      console.log(`  ❌ ${code} should have been blocked`);
    }
  } catch (err) {
    if (!shouldPass) {
      console.log(`  ✓ ${code} blocked`);
    } else {
      console.log(`  ❌ ${code} failed: ${err.message}`);
    }
  }
});

// ============================================================================
// Part 2: Security Audit Logger
// ============================================================================

console.log('\n\nPart 2: Security Audit Logger\n');

/**
 * Comprehensive security audit logger
 */
class SecurityAuditLogger extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      logLevel: options.logLevel || 'info',
      enableHashVerification: options.enableHashVerification !== false,
      ...options
    };

    this.logs = [];
    this.alerts = [];
  }

  /**
   * Log security event
   */
  log(level, category, event, details = {}) {
    const entry = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      level,
      category,
      event,
      details,
      hash: null
    };

    // Add hash for integrity
    if (this.options.enableHashVerification) {
      entry.hash = this.calculateHash(entry);
    }

    this.logs.push(entry);

    // Emit event
    this.emit('log', entry);

    // Check for alerts
    if (level === 'critical' || level === 'alert') {
      this.createAlert(entry);
    }

    return entry;
  }

  /**
   * Calculate entry hash
   */
  calculateHash(entry) {
    const data = JSON.stringify({
      timestamp: entry.timestamp,
      level: entry.level,
      category: entry.category,
      event: entry.event,
      details: entry.details
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify log integrity
   */
  verifyIntegrity() {
    for (const entry of this.logs) {
      if (entry.hash) {
        const calculatedHash = this.calculateHash(entry);
        if (calculatedHash !== entry.hash) {
          return {
            valid: false,
            compromised: entry.id,
            message: 'Log integrity compromised'
          };
        }
      }
    }
    return { valid: true, message: 'All logs verified' };
  }

  /**
   * Create security alert
   */
  createAlert(entry) {
    const alert = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      severity: entry.level,
      source: entry.category,
      description: entry.event,
      logEntry: entry.id
    };

    this.alerts.push(alert);
    this.emit('alert', alert);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 10) {
    return this.alerts.slice(-count);
  }

  /**
   * Get statistics
   */
  getStats() {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalLogs: this.logs.length,
      totalAlerts: this.alerts.length,
      byLevel,
      byCategory
    };
  }
}

// Test audit logger
console.log('Testing security audit logger:');
const auditLogger = new SecurityAuditLogger();

auditLogger.on('alert', (alert) => {
  console.log(`  [ALERT] ${alert.severity}: ${alert.description}`);
});

auditLogger.log('info', 'execution', 'Code execution started');
auditLogger.log('warning', 'access', 'Suspicious property access', { property: '__proto__' });
auditLogger.log('critical', 'security', 'Escape attempt detected', { method: 'constructor' });

console.log('\nAudit statistics:');
const stats = auditLogger.getStats();
Object.entries(stats).forEach(([key, value]) => {
  console.log(`  ${key}:`, typeof value === 'object' ? JSON.stringify(value) : value);
});

console.log('\nVerifying log integrity:');
const integrity = auditLogger.verifyIntegrity();
console.log(`  ${integrity.valid ? '✓' : '❌'} ${integrity.message}`);

// ============================================================================
// Part 3: Intrusion Detection System
// ============================================================================

console.log('\n\nPart 3: Intrusion Detection System\n');

/**
 * Intrusion detection for VM execution
 */
class IntrusionDetectionSystem {
  constructor(options = {}) {
    this.options = {
      maxViolationsPerMinute: options.maxViolationsPerMinute || 5,
      banDuration: options.banDuration || 300000, // 5 minutes
      ...options
    };

    this.violations = new Map();
    this.bannedClients = new Map();
    this.patterns = this.definePatterns();
  }

  /**
   * Define suspicious patterns
   */
  definePatterns() {
    return [
      {
        name: 'constructor_access',
        pattern: /constructor/gi,
        severity: 'high'
      },
      {
        name: 'proto_manipulation',
        pattern: /__proto__|prototype/gi,
        severity: 'critical'
      },
      {
        name: 'eval_usage',
        pattern: /eval\s*\(/gi,
        severity: 'high'
      },
      {
        name: 'function_constructor',
        pattern: /Function\s*\(/gi,
        severity: 'critical'
      },
      {
        name: 'process_access',
        pattern: /process\./gi,
        severity: 'critical'
      },
      {
        name: 'require_usage',
        pattern: /require\s*\(/gi,
        severity: 'high'
      },
      {
        name: 'infinite_loop',
        pattern: /while\s*\(\s*true\s*\)/gi,
        severity: 'medium'
      }
    ];
  }

  /**
   * Analyze code for threats
   */
  analyzeCode(code, clientId = 'anonymous') {
    if (this.isBanned(clientId)) {
      return {
        allowed: false,
        reason: 'Client is banned',
        banExpiry: this.bannedClients.get(clientId)
      };
    }

    const threats = [];

    for (const pattern of this.patterns) {
      const matches = code.match(pattern.pattern);
      if (matches) {
        threats.push({
          type: pattern.name,
          severity: pattern.severity,
          occurrences: matches.length
        });
      }
    }

    if (threats.length > 0) {
      this.recordViolation(clientId, threats);

      // Check if client should be banned
      if (this.shouldBan(clientId)) {
        this.banClient(clientId);
        return {
          allowed: false,
          reason: 'Too many violations - client banned',
          threats
        };
      }

      return {
        allowed: false,
        reason: 'Suspicious code detected',
        threats
      };
    }

    return {
      allowed: true,
      threats: []
    };
  }

  /**
   * Record violation
   */
  recordViolation(clientId, threats) {
    if (!this.violations.has(clientId)) {
      this.violations.set(clientId, []);
    }

    const violations = this.violations.get(clientId);
    violations.push({
      timestamp: Date.now(),
      threats
    });

    // Clean old violations
    const oneMinuteAgo = Date.now() - 60000;
    const recent = violations.filter(v => v.timestamp > oneMinuteAgo);
    this.violations.set(clientId, recent);
  }

  /**
   * Check if client should be banned
   */
  shouldBan(clientId) {
    const violations = this.violations.get(clientId) || [];
    const oneMinuteAgo = Date.now() - 60000;
    const recentViolations = violations.filter(v => v.timestamp > oneMinuteAgo);

    return recentViolations.length >= this.options.maxViolationsPerMinute;
  }

  /**
   * Ban client
   */
  banClient(clientId) {
    const expiry = Date.now() + this.options.banDuration;
    this.bannedClients.set(clientId, expiry);
    console.log(`  [IDS] Client ${clientId} banned until ${new Date(expiry).toISOString()}`);
  }

  /**
   * Check if client is banned
   */
  isBanned(clientId) {
    const expiry = this.bannedClients.get(clientId);
    if (!expiry) return false;

    if (Date.now() > expiry) {
      this.bannedClients.delete(clientId);
      return false;
    }

    return true;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalViolations: Array.from(this.violations.values()).reduce((sum, v) => sum + v.length, 0),
      uniqueClients: this.violations.size,
      bannedClients: this.bannedClients.size,
      activeViolations: Array.from(this.violations.entries()).map(([client, violations]) => ({
        client,
        violations: violations.length
      }))
    };
  }
}

// Test intrusion detection
console.log('Testing intrusion detection system:');
const ids = new IntrusionDetectionSystem({ maxViolationsPerMinute: 2 });

const idsTests = [
  { client: 'user1', code: 'Math.sqrt(16)' },
  { client: 'user2', code: 'this.constructor.constructor("return process")()' },
  { client: 'user2', code: '__proto__.polluted = true' },
  { client: 'user2', code: 'eval("alert(1)")' }
];

idsTests.forEach(({ client, code }) => {
  const analysis = ids.analyzeCode(code, client);
  console.log(`\n  Client: ${client}`);
  console.log(`  Code: ${code.substring(0, 50)}`);
  console.log(`  Allowed: ${analysis.allowed}`);
  if (!analysis.allowed) {
    console.log(`  Reason: ${analysis.reason}`);
    if (analysis.threats) {
      console.log(`  Threats: ${analysis.threats.map(t => t.type).join(', ')}`);
    }
  }
});

console.log('\nIDS Statistics:');
console.log(ids.getStats());

// ============================================================================
// Part 4: Complete Security System
// ============================================================================

console.log('\n\nPart 4: Complete Security System\n');

/**
 * Production-ready secure execution system
 */
class SecureExecutionSystem {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      enableAudit: options.enableAudit !== false,
      enableIDS: options.enableIDS !== false,
      ...options
    };

    this.contextBuilder = new SecureContextBuilder();
    this.auditLogger = new SecurityAuditLogger();
    this.ids = new IntrusionDetectionSystem();

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.auditLogger.on('alert', (alert) => {
      console.log(`  [SECURITY ALERT] ${alert.severity}: ${alert.description}`);
    });
  }

  /**
   * Execute code securely
   */
  execute(code, clientId = 'anonymous', sandbox = {}) {
    const executionId = crypto.randomBytes(8).toString('hex');

    // Log execution start
    if (this.options.enableAudit) {
      this.auditLogger.log('info', 'execution', 'Execution started', {
        executionId,
        clientId,
        codeLength: code.length
      });
    }

    // IDS check
    if (this.options.enableIDS) {
      const analysis = this.ids.analyzeCode(code, clientId);
      if (!analysis.allowed) {
        this.auditLogger.log('critical', 'security', 'Execution blocked by IDS', {
          executionId,
          clientId,
          reason: analysis.reason,
          threats: analysis.threats
        });

        return {
          success: false,
          error: 'Security violation: ' + analysis.reason,
          threats: analysis.threats
        };
      }
    }

    // Create secure context
    const context = this.contextBuilder.build();

    // Add sandbox data safely
    for (const key in sandbox) {
      if (!this.contextBuilder.propertyBlacklist.has(key)) {
        try {
          context[key] = JSON.parse(JSON.stringify(sandbox[key]));
        } catch (err) {
          // Skip non-serializable data
        }
      }
    }

    // Execute
    try {
      const result = vm.runInContext(code, context, {
        timeout: this.options.timeout,
        displayErrors: true
      });

      this.auditLogger.log('info', 'execution', 'Execution successful', {
        executionId,
        clientId
      });

      return {
        success: true,
        result,
        executionId
      };
    } catch (error) {
      const level = error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT' ? 'warning' : 'error';

      this.auditLogger.log(level, 'execution', 'Execution failed', {
        executionId,
        clientId,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        executionId
      };
    }
  }

  /**
   * Get security report
   */
  getSecurityReport() {
    return {
      audit: this.auditLogger.getStats(),
      ids: this.ids.getStats(),
      integrity: this.auditLogger.verifyIntegrity(),
      recentAlerts: this.auditLogger.getRecentAlerts(5)
    };
  }

  /**
   * Export audit logs
   */
  exportAuditLogs() {
    return {
      exported: new Date().toISOString(),
      logs: this.auditLogger.logs,
      alerts: this.auditLogger.alerts,
      integrity: this.auditLogger.verifyIntegrity()
    };
  }
}

// Test complete security system
console.log('Testing complete security system:');
const secureSystem = new SecureExecutionSystem({
  timeout: 3000,
  enableAudit: true,
  enableIDS: true
});

const systemTests = [
  { client: 'alice', code: 'Math.pow(2, 10)', safe: true },
  { client: 'bob', code: 'JSON.stringify({x: 1, y: 2})', safe: true },
  { client: 'eve', code: 'constructor.constructor("return process")()', safe: false },
  { client: 'eve', code: '__proto__.evil = true', safe: false }
];

console.log('Running security tests:\n');
systemTests.forEach(({ client, code, safe }) => {
  const result = secureSystem.execute(code, client);
  const status = result.success === safe ? '✓' : '❌';
  console.log(`${status} Client ${client}: ${result.success ? 'Success' : 'Blocked'}`);
  if (!result.success && result.threats) {
    console.log(`   Threats: ${result.threats.map(t => t.type).join(', ')}`);
  }
});

console.log('\nSecurity Report:');
const report = secureSystem.getSecurityReport();
console.log('  Total logs:', report.audit.totalLogs);
console.log('  Total alerts:', report.audit.totalAlerts);
console.log('  IDS violations:', report.ids.totalViolations);
console.log('  Banned clients:', report.ids.bannedClients);
console.log('  Integrity:', report.integrity.message);

// ============================================================================
// Summary
// ============================================================================

console.log('\n\n=== Summary: Complete Security Hardening ===\n');

console.log('Security Layers Implemented:');
console.log('1. Secure Context Builder');
console.log('   - Null prototype base');
console.log('   - Whitelist-only globals');
console.log('   - Property blacklist');
console.log('   - Multi-trap proxy protection');

console.log('\n2. Security Audit Logger');
console.log('   - Comprehensive event logging');
console.log('   - Hash-based integrity verification');
console.log('   - Alert generation');
console.log('   - Category-based filtering');

console.log('\n3. Intrusion Detection System');
console.log('   - Pattern-based threat detection');
console.log('   - Violation tracking');
console.log('   - Automatic client banning');
console.log('   - Severity classification');

console.log('\n4. Complete Security System');
console.log('   - Integration of all layers');
console.log('   - End-to-end protection');
console.log('   - Comprehensive reporting');
console.log('   - Audit log export');

console.log('\nBest Practices:');
console.log('✓ Defense in depth');
console.log('✓ Whitelist approach');
console.log('✓ Comprehensive logging');
console.log('✓ Real-time threat detection');
console.log('✓ Automatic response to threats');
console.log('✓ Integrity verification');
console.log('✓ Regular security audits');
