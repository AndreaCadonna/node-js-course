/**
 * Solution to Exercise 4: Create a Path Traversal Detector
 *
 * This solution demonstrates a comprehensive path traversal detection system
 * with pattern matching, threat analysis, violation logging, and security reporting.
 *
 * Features:
 * - Multi-pattern traversal detection
 * - Encoding attack detection (URL, double, hex, unicode)
 * - Risk level assessment
 * - Violation logging with context
 * - Security report generation
 * - Attack pattern database
 * - Rate limiting simulation
 *
 * Production Use:
 * Deploy this as a security middleware to detect and log all path traversal
 * attempts, helping you identify attacks and potential vulnerabilities.
 */

const path = require('path');

/**
 * Path Traversal Detector with comprehensive threat analysis
 */
class TraversalDetector {
  /**
   * @param {string} baseDir - Base directory to protect
   * @param {object} options - Detector options
   */
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      logViolations: options.logViolations !== false,
      throwOnDetection: options.throwOnDetection || false,
      maxViolations: options.maxViolations || 10000,
      enableRateLimit: options.enableRateLimit || false,
      rateLimitWindow: options.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: options.rateLimitMax || 10,
      ...options
    };

    this.violations = [];
    this.rateLimitMap = new Map(); // IP -> {count, firstSeen}
  }

  /**
   * Detect path traversal attempts
   * @param {string} filepath - Path to check
   * @param {object} context - Context {ip, userId, userAgent, timestamp}
   * @returns {object} - Detection result {safe, threats, riskLevel, details}
   */
  detect(filepath, context = {}) {
    const threats = [];
    const details = {
      originalPath: filepath,
      normalizedPath: null,
      resolvedPath: null,
      checks: {}
    };

    // Add timestamp if not provided
    context.timestamp = context.timestamp || new Date().toISOString();

    // Rate limiting check
    if (this.options.enableRateLimit && context.ip) {
      const rateLimitResult = this._checkRateLimit(context.ip);
      if (!rateLimitResult.allowed) {
        threats.push({
          type: 'RATE_LIMIT_EXCEEDED',
          description: 'Too many requests',
          severity: 'HIGH'
        });
      }
    }

    // Check 1: Direct traversal patterns
    const traversalThreats = this._detectDirectTraversal(filepath);
    threats.push(...traversalThreats);
    details.checks.directTraversal = traversalThreats.length > 0;

    // Check 2: Encoded traversal
    const encodedThreats = this.detectEncodedTraversal(filepath);
    threats.push(...encodedThreats);
    details.checks.encodedTraversal = encodedThreats.length > 0;

    // Check 3: Null byte injection
    const nullByteThreats = this._detectNullByte(filepath);
    threats.push(...nullByteThreats);
    details.checks.nullByte = nullByteThreats.length > 0;

    // Check 4: Unicode tricks
    const unicodeThreats = this._detectUnicodeTricks(filepath);
    threats.push(...unicodeThreats);
    details.checks.unicode = unicodeThreats.length > 0;

    // Try to normalize and resolve
    try {
      details.normalizedPath = path.normalize(filepath);
      details.resolvedPath = path.resolve(this.baseDir, filepath);

      // Check 5: Boundary violation
      const boundaryResult = this.checkBoundary(details.resolvedPath);
      if (!boundaryResult.safe) {
        threats.push({
          type: 'BOUNDARY_VIOLATION',
          description: boundaryResult.reason,
          severity: 'CRITICAL'
        });
      }
      details.checks.boundary = !boundaryResult.safe;
    } catch (error) {
      threats.push({
        type: 'PATH_RESOLUTION_ERROR',
        description: error.message,
        severity: 'MEDIUM'
      });
    }

    // Determine risk level
    const riskLevel = this._calculateRiskLevel(threats);

    // Log violation if threats detected
    if (threats.length > 0 && this.options.logViolations) {
      this.logViolation(filepath, threats, context);
    }

    // Throw if configured to do so
    if (threats.length > 0 && this.options.throwOnDetection) {
      throw new Error(`Path traversal detected: ${threats.map(t => t.type).join(', ')}`);
    }

    return {
      safe: threats.length === 0,
      threats,
      riskLevel,
      details,
      context
    };
  }

  /**
   * Detect direct traversal patterns
   * @private
   */
  _detectDirectTraversal(filepath) {
    const threats = [];

    // Pattern variations of ..
    const patterns = [
      { pattern: /\.\.[\/\\]/g, type: 'TRAVERSAL_DOT_SLASH', severity: 'HIGH' },
      { pattern: /[\/\\]\.\./g, type: 'TRAVERSAL_SLASH_DOT', severity: 'HIGH' },
      { pattern: /^\.\./g, type: 'TRAVERSAL_RELATIVE_START', severity: 'MEDIUM' },
      { pattern: /\.\.$/g, type: 'TRAVERSAL_DOT_END', severity: 'MEDIUM' },
      { pattern: /\.\.\\|\.\.\//, type: 'TRAVERSAL_SEPARATOR', severity: 'HIGH' }
    ];

    for (const { pattern, type, severity } of patterns) {
      if (pattern.test(filepath)) {
        threats.push({
          type,
          description: `Direct traversal pattern detected: ${pattern.source}`,
          severity
        });
      }
    }

    return threats;
  }

  /**
   * Detect encoded traversal patterns
   * @param {string} input - Input to check
   * @returns {object[]} - Array of detected threats
   */
  detectEncodedTraversal(input) {
    const threats = [];

    // URL encoding variations
    const encodingPatterns = [
      { pattern: /%2e%2e[%2f%5c]/gi, type: 'URL_ENCODED_TRAVERSAL', severity: 'HIGH' },
      { pattern: /%252e%252e/gi, type: 'DOUBLE_URL_ENCODED', severity: 'CRITICAL' },
      { pattern: /%2e\./gi, type: 'PARTIAL_URL_ENCODED', severity: 'HIGH' },
      { pattern: /\.%2e/gi, type: 'MIXED_ENCODING', severity: 'HIGH' },
      { pattern: /\.\.[%2f%5c]/gi, type: 'ENCODED_SEPARATOR', severity: 'HIGH' }
    ];

    for (const { pattern, type, severity } of encodingPatterns) {
      if (pattern.test(input)) {
        threats.push({
          type,
          description: `Encoded traversal detected: ${pattern.source}`,
          severity
        });
      }
    }

    // Try decoding and check for traversal
    try {
      let decoded = decodeURIComponent(input);
      let iterations = 0;
      const maxIterations = 5;

      while (decoded !== input && iterations < maxIterations) {
        if (decoded.includes('..')) {
          threats.push({
            type: 'DECODED_TRAVERSAL',
            description: `Traversal found after ${iterations + 1}x decoding`,
            severity: 'CRITICAL'
          });
          break;
        }
        input = decoded;
        decoded = decodeURIComponent(input);
        iterations++;
      }
    } catch (error) {
      threats.push({
        type: 'INVALID_ENCODING',
        description: 'Malformed URL encoding detected',
        severity: 'MEDIUM'
      });
    }

    // Hex encoding
    if (/\\x2e\\x2e/gi.test(input)) {
      threats.push({
        type: 'HEX_ENCODED_TRAVERSAL',
        description: 'Hex-encoded traversal pattern',
        severity: 'HIGH'
      });
    }

    // Unicode encoding
    if (/\\u002e\\u002e/gi.test(input)) {
      threats.push({
        type: 'UNICODE_ENCODED_TRAVERSAL',
        description: 'Unicode-encoded traversal pattern',
        severity: 'HIGH'
      });
    }

    // UTF-8 overlong encoding
    if (/%c0%ae%c0%ae/gi.test(input) || /\\xc0\\xae\\xc0\\xae/gi.test(input)) {
      threats.push({
        type: 'UTF8_OVERLONG_ENCODING',
        description: 'UTF-8 overlong encoding attack',
        severity: 'CRITICAL'
      });
    }

    return threats;
  }

  /**
   * Detect null byte injection
   * @private
   */
  _detectNullByte(input) {
    const threats = [];

    // Direct null byte
    if (input.includes('\0')) {
      threats.push({
        type: 'NULL_BYTE_INJECTION',
        description: 'Null byte character detected',
        severity: 'CRITICAL'
      });
    }

    // Encoded null bytes
    const nullBytePatterns = [
      { pattern: /%00/gi, name: 'URL-encoded null byte' },
      { pattern: /\\0/gi, name: 'Escaped null byte' },
      { pattern: /\\x00/gi, name: 'Hex-encoded null byte' },
      { pattern: /\\u0000/gi, name: 'Unicode null byte' }
    ];

    for (const { pattern, name } of nullBytePatterns) {
      if (pattern.test(input)) {
        threats.push({
          type: 'ENCODED_NULL_BYTE',
          description: name,
          severity: 'CRITICAL'
        });
      }
    }

    return threats;
  }

  /**
   * Detect Unicode tricks
   * @private
   */
  _detectUnicodeTricks(input) {
    const threats = [];

    // Unicode normalization attacks
    // Different representations of the same character
    const normalized = input.normalize('NFC');
    if (normalized !== input && normalized.includes('..')) {
      threats.push({
        type: 'UNICODE_NORMALIZATION_ATTACK',
        description: 'Unicode normalization reveals traversal',
        severity: 'HIGH'
      });
    }

    // Homograph attacks (characters that look similar)
    // е (Cyrillic) vs e (Latin)
    if (/[А-Яа-яЁё]/g.test(input)) {
      threats.push({
        type: 'UNICODE_HOMOGRAPH',
        description: 'Cyrillic characters detected (possible homograph attack)',
        severity: 'MEDIUM'
      });
    }

    // Zero-width characters
    if (/[\u200B-\u200D\uFEFF]/g.test(input)) {
      threats.push({
        type: 'ZERO_WIDTH_CHARACTERS',
        description: 'Zero-width characters detected',
        severity: 'MEDIUM'
      });
    }

    return threats;
  }

  /**
   * Check if path violates boundaries
   * @param {string} filepath - Resolved path to check
   * @returns {object} - {safe, reason}
   */
  checkBoundary(filepath) {
    try {
      const normalizedPath = path.resolve(filepath);
      const normalizedBase = path.resolve(this.baseDir);

      // Check if path is within base directory
      if (normalizedPath.startsWith(normalizedBase + path.sep) || normalizedPath === normalizedBase) {
        return { safe: true };
      }

      return {
        safe: false,
        reason: `Path '${normalizedPath}' is outside base directory '${normalizedBase}'`
      };
    } catch (error) {
      return {
        safe: false,
        reason: `Boundary check error: ${error.message}`
      };
    }
  }

  /**
   * Log a violation
   * @param {string} filepath - Attempted path
   * @param {object[]} threats - Detected threats
   * @param {object} context - Request context
   */
  logViolation(filepath, threats, context) {
    const violation = {
      timestamp: context.timestamp || new Date().toISOString(),
      filepath,
      threats,
      context: {
        ip: context.ip || 'unknown',
        userId: context.userId || 'anonymous',
        userAgent: context.userAgent || 'unknown'
      },
      riskLevel: this._calculateRiskLevel(threats)
    };

    // Add to violations array
    this.violations.push(violation);

    // Limit violations array size
    if (this.violations.length > this.options.maxViolations) {
      this.violations.shift(); // Remove oldest
    }

    // In production, you would also:
    // - Log to file/database
    // - Send alerts for critical violations
    // - Update WAF rules
    // - Notify security team
  }

  /**
   * Get all logged violations
   * @returns {object[]} - Array of violations
   */
  getViolations() {
    return [...this.violations];
  }

  /**
   * Generate security report
   * @returns {object} - Comprehensive security report
   */
  generateReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange: this._getTimeRange(),
      summary: {
        totalViolations: this.violations.length,
        byRiskLevel: this._countByRiskLevel(),
        byThreatType: this._countByThreatType(),
        byIP: this._countByIP(),
        topTargets: this._getTopTargets(10)
      },
      trends: {
        violationsOverTime: this._getViolationsOverTime(),
        peakHours: this._getPeakHours()
      },
      recommendations: this._generateRecommendations()
    };

    return report;
  }

  /**
   * Calculate risk level based on threats
   * @private
   */
  _calculateRiskLevel(threats) {
    if (threats.length === 0) return 'NONE';

    const hasCritical = threats.some(t => t.severity === 'CRITICAL');
    const hasHigh = threats.some(t => t.severity === 'HIGH');
    const threatCount = threats.length;

    if (hasCritical || threatCount >= 3) return 'CRITICAL';
    if (hasHigh || threatCount >= 2) return 'HIGH';
    if (threatCount >= 1) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Rate limiting check
   * @private
   */
  _checkRateLimit(ip) {
    const now = Date.now();
    const record = this.rateLimitMap.get(ip);

    if (!record) {
      this.rateLimitMap.set(ip, { count: 1, firstSeen: now });
      return { allowed: true };
    }

    // Check if window has expired
    if (now - record.firstSeen > this.options.rateLimitWindow) {
      // Reset counter
      this.rateLimitMap.set(ip, { count: 1, firstSeen: now });
      return { allowed: true };
    }

    // Increment counter
    record.count++;

    // Check limit
    if (record.count > this.options.rateLimitMax) {
      return { allowed: false, count: record.count };
    }

    return { allowed: true, count: record.count };
  }

  /**
   * Helper methods for report generation
   * @private
   */
  _getTimeRange() {
    if (this.violations.length === 0) return null;

    const timestamps = this.violations.map(v => new Date(v.timestamp));
    return {
      start: new Date(Math.min(...timestamps)).toISOString(),
      end: new Date(Math.max(...timestamps)).toISOString()
    };
  }

  _countByRiskLevel() {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    this.violations.forEach(v => {
      counts[v.riskLevel] = (counts[v.riskLevel] || 0) + 1;
    });
    return counts;
  }

  _countByThreatType() {
    const counts = new Map();
    this.violations.forEach(v => {
      v.threats.forEach(t => {
        counts.set(t.type, (counts.get(t.type) || 0) + 1);
      });
    });
    return Object.fromEntries(counts);
  }

  _countByIP() {
    const counts = new Map();
    this.violations.forEach(v => {
      const ip = v.context.ip;
      counts.set(ip, (counts.get(ip) || 0) + 1);
    });
    return Object.fromEntries(counts);
  }

  _getTopTargets(limit) {
    const counts = new Map();
    this.violations.forEach(v => {
      counts.set(v.filepath, (counts.get(v.filepath) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([path, count]) => ({ path, count }));
  }

  _getViolationsOverTime() {
    // Group by hour
    const byHour = new Map();
    this.violations.forEach(v => {
      const hour = new Date(v.timestamp).toISOString().substring(0, 13);
      byHour.set(hour, (byHour.get(hour) || 0) + 1);
    });
    return Object.fromEntries(byHour);
  }

  _getPeakHours() {
    const byHour = new Map();
    this.violations.forEach(v => {
      const hour = new Date(v.timestamp).getHours();
      byHour.set(hour, (byHour.get(hour) || 0) + 1);
    });

    return Array.from(byHour.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
  }

  _generateRecommendations() {
    const recommendations = [];
    const summary = {
      totalViolations: this.violations.length,
      byRiskLevel: this._countByRiskLevel(),
      byThreatType: this._countByThreatType()
    };

    if (summary.byRiskLevel.CRITICAL > 0) {
      recommendations.push('URGENT: Critical violations detected. Review and block malicious IPs.');
    }

    if (summary.byThreatType.DOUBLE_URL_ENCODED > 0) {
      recommendations.push('Implement double-decode protection in input validation.');
    }

    if (summary.byThreatType.BOUNDARY_VIOLATION > 10) {
      recommendations.push('High number of boundary violations. Consider stricter path validation.');
    }

    if (summary.totalViolations > 100) {
      recommendations.push('High attack volume. Consider implementing rate limiting or CAPTCHA.');
    }

    return recommendations;
  }
}

/**
 * Attack Pattern Database
 * Collection of known attack patterns for testing
 */
const ATTACK_PATTERNS = {
  basic: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    'uploads/../../etc/shadow'
  ],
  encoded: [
    '%2e%2e%2fetc%2fpasswd',
    '%252e%252e%252fetc%252fpasswd',
    '%2e%2e/%2e%2e/%2e%2e/etc/passwd'
  ],
  mixed: [
    '../\\/../etc/passwd',
    '..%2f..%2fetc%2fpasswd',
    '.%2e/.%2e/etc/passwd'
  ],
  nullByte: [
    '../../../etc/passwd%00.jpg',
    'file.txt%00../../etc/passwd',
    'image.jpg\\0../../../etc/passwd'
  ],
  unicode: [
    '\\u002e\\u002e\\u002fetc\\u002fpasswd',
    '%c0%ae%c0%ae%c0%afetc%c0%afpasswd',
    '..%c0%af..%c0%afetc%c0%afpasswd'
  ],
  windows: [
    '..\\..\\..\\windows\\system32\\config\\sam',
    'C:\\windows\\system32\\config\\sam',
    '\\\\?\\C:\\windows\\system32'
  ]
};

// ============================================================================
// Test Cases and Demonstrations
// ============================================================================

console.log('=== Solution to Exercise 4: Path Traversal Detector ===\n');

console.log('Test 1: Basic Detection');
console.log('─'.repeat(60));

const detector = new TraversalDetector('/app/data', {
  logViolations: true,
  enableRateLimit: true
});

const basicTests = [
  { path: 'normal/file.txt', ip: '192.168.1.1' },
  { path: '../../../etc/passwd', ip: '192.168.1.2' },
  { path: '..\\..\\windows\\system32', ip: '192.168.1.2' },
  { path: 'uploads/image.jpg', ip: '192.168.1.1' }
];

basicTests.forEach(test => {
  const result = detector.detect(test.path, { ip: test.ip });
  const icon = result.safe ? '✓' : '⚠';
  console.log(`${icon} '${test.path}'`);
  console.log(`  Safe: ${result.safe}, Risk: ${result.riskLevel}`);
  if (result.threats.length > 0) {
    result.threats.forEach(t => {
      console.log(`    • ${t.type}: ${t.description} [${t.severity}]`);
    });
  }
});
console.log();

console.log('Test 2: Encoding Attack Detection');
console.log('─'.repeat(60));

Object.entries(ATTACK_PATTERNS).forEach(([category, patterns]) => {
  console.log(`\n${category.toUpperCase()} attacks:`);
  patterns.slice(0, 2).forEach(pattern => {
    const result = detector.detect(pattern, { ip: '10.0.0.1' });
    console.log(`  • ${pattern.substring(0, 40)}${pattern.length > 40 ? '...' : ''}`);
    console.log(`    Threats: ${result.threats.length}, Risk: ${result.riskLevel}`);
  });
});
console.log();

console.log('Test 3: Violation Logging');
console.log('─'.repeat(60));

const violations = detector.getViolations();
console.log(`Total violations logged: ${violations.length}`);
console.log(`\nRecent violations:`);
violations.slice(-5).forEach((v, i) => {
  console.log(`  ${i + 1}. ${v.filepath} from ${v.context.ip}`);
  console.log(`     Risk: ${v.riskLevel}, Threats: ${v.threats.length}`);
});
console.log();

console.log('Test 4: Security Report');
console.log('─'.repeat(60));

const report = detector.generateReport();
console.log(`Report generated at: ${report.generatedAt}`);
console.log(`\nSummary:`);
console.log(`  Total violations: ${report.summary.totalViolations}`);
console.log(`\nBy Risk Level:`);
Object.entries(report.summary.byRiskLevel).forEach(([level, count]) => {
  if (count > 0) {
    console.log(`  ${level}: ${count}`);
  }
});
console.log(`\nTop Threat Types:`);
Object.entries(report.summary.byThreatType)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

if (report.recommendations.length > 0) {
  console.log(`\nRecommendations:`);
  report.recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });
}
console.log();

console.log('Test 5: Rate Limiting');
console.log('─'.repeat(60));

const rateLimitDetector = new TraversalDetector('/app', {
  enableRateLimit: true,
  rateLimitMax: 3,
  rateLimitWindow: 1000
});

console.log('Simulating rapid requests from same IP:');
for (let i = 1; i <= 5; i++) {
  const result = rateLimitDetector.detect('../etc/passwd', { ip: '192.168.1.100' });
  const rateLimitThreat = result.threats.find(t => t.type === 'RATE_LIMIT_EXCEEDED');
  console.log(`  Request ${i}: ${rateLimitThreat ? '🚫 BLOCKED (rate limit)' : '⚠ Detected'}`);
}
console.log();

console.log('✅ Exercise 4 Solution Complete\n');

console.log('Key Takeaways:');
console.log('─'.repeat(60));
console.log('  1. Check for multiple attack vectors simultaneously');
console.log('  2. Decode multiple times to catch double encoding');
console.log('  3. Log all violations with context for analysis');
console.log('  4. Classify threats by severity and risk level');
console.log('  5. Generate reports to identify attack patterns');
console.log('  6. Implement rate limiting to prevent abuse');
console.log();

console.log('💡 Production Tips:');
console.log('─'.repeat(60));
console.log('  • Integrate with WAF/firewall to block attackers');
console.log('  • Send real-time alerts for critical violations');
console.log('  • Store violations in database for analysis');
console.log('  • Use machine learning to detect new patterns');
console.log('  • Implement automated blocking for repeat offenders');
console.log('  • Generate daily security reports');
console.log();

console.log('Attack Pattern Coverage:');
console.log('─'.repeat(60));
console.log('  ✓ Direct traversal (.., /, \\)');
console.log('  ✓ URL encoding (%2e%2e)');
console.log('  ✓ Double encoding (%252e%252e)');
console.log('  ✓ Hex encoding (\\x2e)');
console.log('  ✓ Unicode encoding (\\u002e)');
console.log('  ✓ UTF-8 overlong encoding');
console.log('  ✓ Null byte injection');
console.log('  ✓ Mixed encodings');
console.log('  ✓ Unicode normalization');
console.log('  ✓ Boundary violations');
