/**
 * Solution to Exercise 3: Build a Secure File Path Validator
 *
 * This solution demonstrates a production-ready, multi-layered path validation
 * system with comprehensive security checks.
 *
 * Security Layers:
 * 1. Type and basic validation
 * 2. Null byte detection
 * 3. Encoding attack detection (URL, double, hex, unicode)
 * 4. Traversal pattern detection
 * 5. Length validation
 * 6. Boundary checking
 * 7. Extension validation
 * 8. Whitelist validation
 * 9. Dot file checking
 *
 * Defense-in-Depth Philosophy:
 * Each layer provides independent validation. An attacker must bypass
 * ALL layers to succeed, making the system significantly more secure.
 */

const path = require('path');

/**
 * Comprehensive path validator with multi-layer security
 */
class SecurePathValidator {
  /**
   * @param {string} baseDir - Base directory to enforce
   * @param {object} options - Validation options
   */
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      maxLength: options.maxLength || 255,
      allowedExtensions: options.allowedExtensions || null, // null = all allowed
      allowDotFiles: options.allowDotFiles !== undefined ? options.allowDotFiles : false,
      whitelist: options.whitelist || null, // null = no whitelist
      strict: options.strict !== false, // strict mode by default
      checkEncoding: options.checkEncoding !== false,
      ...options
    };
  }

  /**
   * Validate a filepath with comprehensive checks
   * @param {string} filepath - Path to validate
   * @param {object} context - Additional context (userId, ip, etc.)
   * @returns {object} - Validation result {valid, errors, warnings, sanitized}
   */
  validate(filepath, context = {}) {
    const errors = [];
    const warnings = [];
    let sanitized = filepath;

    // Layer 1: Type and basic checks
    if (!filepath) {
      errors.push('Path is required');
      return { valid: false, errors, warnings, sanitized: null };
    }

    if (typeof filepath !== 'string') {
      errors.push('Path must be a string');
      return { valid: false, errors, warnings, sanitized: null };
    }

    if (filepath.trim() === '') {
      errors.push('Path cannot be empty');
      return { valid: false, errors, warnings, sanitized: null };
    }

    // Layer 2: Null byte detection
    if (filepath.includes('\0')) {
      errors.push('Null byte detected (security violation)');
      return { valid: false, errors, warnings, sanitized };
    }

    // Layer 3: Encoding attack detection
    if (this.options.checkEncoding) {
      const encodingThreats = this.detectEncodingAttack(filepath);
      if (encodingThreats.length > 0) {
        errors.push(...encodingThreats.map(t => `Encoding attack detected: ${t}`));
      }
    }

    // Layer 4: Traversal pattern detection (before normalization)
    if (this._hasTraversalPatterns(filepath)) {
      errors.push('Path traversal pattern detected');
    }

    // Sanitize: normalize the path
    try {
      sanitized = path.normalize(filepath);
    } catch (error) {
      errors.push(`Path normalization failed: ${error.message}`);
      return { valid: false, errors, warnings, sanitized: filepath };
    }

    // Layer 5: Length validation
    if (sanitized.length > this.options.maxLength) {
      errors.push(`Path too long (${sanitized.length} > ${this.options.maxLength})`);
    }

    // Layer 6: Boundary checking
    try {
      const resolved = path.resolve(this.baseDir, sanitized);
      const base = path.resolve(this.baseDir);

      if (!resolved.startsWith(base + path.sep) && resolved !== base) {
        errors.push('Path escapes base directory');
      }
    } catch (error) {
      errors.push(`Boundary check failed: ${error.message}`);
    }

    // Layer 7: Extension validation
    if (this.options.allowedExtensions) {
      const ext = path.extname(sanitized).toLowerCase();
      const allowed = this.options.allowedExtensions.map(e => e.toLowerCase());

      if (!allowed.includes(ext)) {
        errors.push(`File extension '${ext}' not allowed. Allowed: ${allowed.join(', ')}`);
      }
    }

    // Layer 8: Whitelist validation
    if (this.options.whitelist) {
      if (!this.isInWhitelist(sanitized)) {
        errors.push('Path not in whitelist');
      }
    }

    // Layer 9: Dot file checking
    const basename = path.basename(sanitized);
    if (!this.options.allowDotFiles && basename.startsWith('.')) {
      errors.push('Dot files not allowed');
    }

    // Additional warnings (not errors, but suspicious)
    if (sanitized.includes('..')) {
      warnings.push('Path contains .. (already normalized, but suspicious)');
    }

    if (sanitized !== filepath) {
      warnings.push('Path was modified during normalization');
    }

    // Return validation result
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized,
      original: filepath,
      context
    };
  }

  /**
   * Detect encoding attacks in the filepath
   * @param {string} filepath - Path to check
   * @returns {string[]} - Array of detected threats
   */
  detectEncodingAttack(filepath) {
    const threats = [];

    // Check for URL encoding
    if (/%[0-9a-fA-F]{2}/.test(filepath)) {
      // Decode and check for traversal patterns
      try {
        const decoded = decodeURIComponent(filepath);
        if (decoded.includes('..') || decoded.includes('\0')) {
          threats.push('URL-encoded traversal or null byte');
        }

        // Check for double encoding
        const doubleDecoded = decodeURIComponent(decoded);
        if (doubleDecoded !== decoded && (doubleDecoded.includes('..') || doubleDecoded.includes('\0'))) {
          threats.push('Double URL-encoded attack');
        }
      } catch (error) {
        // Invalid encoding itself is suspicious
        threats.push('Invalid URL encoding');
      }
    }

    // Check for specific encoded patterns
    const encodedPatterns = [
      { pattern: /%2e%2e/i, name: 'URL-encoded ..' },
      { pattern: /%252e%252e/i, name: 'Double URL-encoded ..' },
      { pattern: /\\u002e\\u002e/i, name: 'Unicode-encoded ..' },
      { pattern: /\\x2e\\x2e/i, name: 'Hex-encoded ..' },
      { pattern: /%00/i, name: 'URL-encoded null byte' },
      { pattern: /\\0/i, name: 'Escaped null byte' }
    ];

    for (const { pattern, name } of encodedPatterns) {
      if (pattern.test(filepath)) {
        threats.push(name);
      }
    }

    // Check for UTF-8 overlong encoding
    if (/\\xc0\\xae/i.test(filepath) || /%c0%ae/i.test(filepath)) {
      threats.push('UTF-8 overlong encoding attack');
    }

    return threats;
  }

  /**
   * Check for traversal patterns
   * @private
   */
  _hasTraversalPatterns(filepath) {
    const patterns = [
      /\.\.[\/\\]/,  // ../  or ..\
      /[\/\\]\.\./,  // /..  or \..
      /^\.\./,       // Starts with ..
      /\.\.$/        // Ends with ..
    ];

    return patterns.some(pattern => pattern.test(filepath));
  }

  /**
   * Sanitize a filepath (best effort cleaning)
   * @param {string} filepath - Path to sanitize
   * @returns {string} - Sanitized path
   */
  sanitize(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return '';
    }

    let cleaned = filepath;

    // Remove null bytes
    cleaned = cleaned.replace(/\0/g, '');

    // Decode if URL-encoded
    try {
      while (/%[0-9a-fA-F]{2}/.test(cleaned)) {
        const decoded = decodeURIComponent(cleaned);
        if (decoded === cleaned) break; // No more encoding
        cleaned = decoded;
      }
    } catch (error) {
      // Invalid encoding, continue with current value
    }

    // Remove traversal patterns
    cleaned = cleaned.replace(/\.\.+[\/\\]/g, '');
    cleaned = cleaned.replace(/[\/\\]\.\.+/g, '');

    // Normalize
    cleaned = path.normalize(cleaned);

    // Remove leading dots if not allowed
    if (!this.options.allowDotFiles) {
      const parts = cleaned.split(path.sep);
      const basename = parts[parts.length - 1];
      if (basename && basename.startsWith('.')) {
        parts[parts.length - 1] = basename.substring(1);
      }
      cleaned = parts.join(path.sep);
    }

    return cleaned;
  }

  /**
   * Check if filepath is in whitelist
   * @param {string} filepath - Path to check
   * @returns {boolean} - True if in whitelist
   */
  isInWhitelist(filepath) {
    if (!this.options.whitelist || this.options.whitelist.length === 0) {
      return true; // No whitelist means all allowed
    }

    const normalized = path.normalize(filepath);

    // Check exact matches and directory prefixes
    return this.options.whitelist.some(allowed => {
      const allowedPath = path.normalize(allowed);

      // Exact match
      if (normalized === allowedPath) {
        return true;
      }

      // Check if filepath is under allowed directory
      if (normalized.startsWith(allowedPath + path.sep)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Validate multiple paths in batch
   * @param {string[]} filepaths - Paths to validate
   * @param {object} context - Shared context
   * @returns {Map<string, object>} - Map of path to validation result
   */
  validateBatch(filepaths, context = {}) {
    const results = new Map();

    for (const filepath of filepaths) {
      const result = this.validate(filepath, context);
      results.set(filepath, result);
    }

    return results;
  }

  /**
   * Get validation statistics
   * @param {Map<string, object>} results - Batch validation results
   * @returns {object} - Statistics
   */
  getStats(results) {
    const stats = {
      total: results.size,
      valid: 0,
      invalid: 0,
      warnings: 0,
      commonErrors: new Map()
    };

    for (const result of results.values()) {
      if (result.valid) {
        stats.valid++;
      } else {
        stats.invalid++;
      }

      if (result.warnings.length > 0) {
        stats.warnings++;
      }

      // Count error types
      for (const error of result.errors) {
        const count = stats.commonErrors.get(error) || 0;
        stats.commonErrors.set(error, count + 1);
      }
    }

    return stats;
  }
}

/**
 * Validation rule system for composable validation
 */
class ValidationRule {
  /**
   * @param {string} name - Rule name
   * @param {function} validator - Validation function (value, context) => {valid, message}
   * @param {object} options - Rule options {severity: 'error'|'warning'}
   */
  constructor(name, validator, options = {}) {
    this.name = name;
    this.validator = validator;
    this.options = {
      severity: options.severity || 'error',
      ...options
    };
  }

  /**
   * Execute the validation rule
   * @param {any} value - Value to validate
   * @param {object} context - Validation context
   * @returns {object} - Result {valid, message, severity}
   */
  validate(value, context = {}) {
    try {
      const result = this.validator(value, context);
      return {
        rule: this.name,
        valid: result.valid,
        message: result.message || (result.valid ? 'OK' : 'Validation failed'),
        severity: this.options.severity
      };
    } catch (error) {
      return {
        rule: this.name,
        valid: false,
        message: `Rule execution error: ${error.message}`,
        severity: 'error'
      };
    }
  }
}

// ============================================================================
// Test Cases and Demonstrations
// ============================================================================

console.log('=== Solution to Exercise 3: Secure Path Validator ===\n');

console.log('Test 1: Basic Validation');
console.log('─'.repeat(60));

const validator = new SecurePathValidator('/app/uploads', {
  allowedExtensions: ['.jpg', '.png', '.pdf'],
  maxLength: 255,
  allowDotFiles: false
});

const basicTests = [
  'document.pdf',
  '../../../etc/passwd',
  '%2e%2e/secret',
  'file.exe',
  '.env',
  'a'.repeat(300),
  'valid/path/image.jpg',
  'path/with spaces/file.pdf'
];

basicTests.forEach(testPath => {
  const result = validator.validate(testPath);
  const status = result.valid ? '✓' : '✗';
  console.log(`${status} '${testPath.substring(0, 50)}${testPath.length > 50 ? '...' : ''}'`);
  if (!result.valid) {
    result.errors.forEach(err => console.log(`    ❌ ${err}`));
  }
  if (result.warnings.length > 0) {
    result.warnings.forEach(warn => console.log(`    ⚠ ${warn}`));
  }
});
console.log();

console.log('Test 2: Encoding Attack Detection');
console.log('─'.repeat(60));

const encodingTests = [
  { path: '../passwd', description: 'Plain traversal' },
  { path: '%2e%2e/passwd', description: 'URL-encoded ..' },
  { path: '%252e%252e/passwd', description: 'Double URL-encoded ..' },
  { path: '..%2fpasswd', description: 'Mixed encoding' },
  { path: '%00../../passwd', description: 'Null byte + traversal' },
  { path: '\\u002e\\u002e/passwd', description: 'Unicode-encoded' }
];

encodingTests.forEach(test => {
  const threats = validator.detectEncodingAttack(test.path);
  console.log(`• ${test.description}`);
  console.log(`  Path: '${test.path}'`);
  if (threats.length > 0) {
    console.log(`  Threats: ${threats.join(', ')}`);
  } else {
    console.log(`  Threats: None detected`);
  }
});
console.log();

console.log('Test 3: Whitelist Validation');
console.log('─'.repeat(60));

const whitelistValidator = new SecurePathValidator('/app', {
  whitelist: ['uploads', 'public', 'temp']
});

const whitelistTests = [
  'uploads/image.jpg',
  'public/css/style.css',
  'temp/cache.dat',
  'private/secret.txt',
  'config/app.json'
];

whitelistTests.forEach(testPath => {
  const result = whitelistValidator.validate(testPath);
  const status = result.valid ? '✓' : '✗';
  console.log(`${status} '${testPath}' - ${result.valid ? 'In whitelist' : 'Not in whitelist'}`);
});
console.log();

console.log('Test 4: Sanitization');
console.log('─'.repeat(60));

const sanitizeTests = [
  '../../../etc/passwd',
  '%2e%2e/secret',
  'path//with///multiple////slashes',
  './current/./directory/./file.txt',
  'path\\with/mixed\\separators'
];

sanitizeTests.forEach(testPath => {
  const sanitized = validator.sanitize(testPath);
  console.log(`Original:  '${testPath}'`);
  console.log(`Sanitized: '${sanitized}'`);
  console.log();
});

console.log('Test 5: Batch Validation');
console.log('─'.repeat(60));

const batchPaths = [
  'valid/file.pdf',
  '../escape/attempt.pdf',
  'image.jpg',
  'document.pdf',
  '.hidden.pdf',
  'very' + '/long'.repeat(100) + '/path.pdf'
];

const batchResults = validator.validateBatch(batchPaths);
const stats = validator.getStats(batchResults);

console.log(`Total paths: ${stats.total}`);
console.log(`Valid: ${stats.valid}`);
console.log(`Invalid: ${stats.invalid}`);
console.log(`With warnings: ${stats.warnings}`);
console.log();

console.log('Common errors:');
stats.commonErrors.forEach((count, error) => {
  console.log(`  • ${error} (${count}x)`);
});
console.log();

console.log('Test 6: Validation Rules System');
console.log('─'.repeat(60));

// Define custom validation rules
const rules = [
  new ValidationRule('no-spaces', (value) => ({
    valid: !value.includes(' '),
    message: 'Path must not contain spaces'
  })),

  new ValidationRule('max-depth', (value) => {
    const depth = value.split(/[\/\\]/).length;
    return {
      valid: depth <= 5,
      message: `Path depth (${depth}) exceeds maximum (5)`
    };
  }),

  new ValidationRule('lowercase-only', (value) => ({
    valid: value === value.toLowerCase(),
    message: 'Path must be lowercase only'
  }), { severity: 'warning' })
];

const ruleTestPaths = [
  'valid/path/file.txt',
  'path with spaces/file.txt',
  'very/deep/nested/path/structure/file.txt',
  'Path/With/UPPERCASE/file.txt'
];

ruleTestPaths.forEach(testPath => {
  console.log(`Path: '${testPath}'`);
  rules.forEach(rule => {
    const result = rule.validate(testPath);
    const icon = result.valid ? '✓' : (result.severity === 'warning' ? '⚠' : '✗');
    console.log(`  ${icon} ${rule.name}: ${result.message}`);
  });
  console.log();
});

console.log('✅ Exercise 3 Solution Complete\n');

console.log('Key Takeaways:');
console.log('─'.repeat(60));
console.log('  1. Implement multiple independent validation layers');
console.log('  2. Check for encoded attacks (URL, hex, unicode)');
console.log('  3. Detect both single and double encoding');
console.log('  4. Validate before AND after normalization');
console.log('  5. Use whitelists when possible (safer than blacklists)');
console.log('  6. Provide detailed, actionable error messages');
console.log();

console.log('💡 Production Tips:');
console.log('─'.repeat(60));
console.log('  • Log all validation failures with context (user, IP, timestamp)');
console.log('  • Rate-limit repeated validation failures');
console.log('  • Use validation rules for flexibility');
console.log('  • Cache validation results for performance');
console.log('  • Monitor for attack patterns');
console.log('  • Provide safe alternatives when possible');
console.log();

console.log('Defense-in-Depth:');
console.log('─'.repeat(60));
console.log('  Each layer catches different attack vectors:');
console.log('  • Null bytes - Layer 2');
console.log('  • URL encoding - Layer 3');
console.log('  • Traversal patterns - Layer 4');
console.log('  • Length attacks - Layer 5');
console.log('  • Boundary escapes - Layer 6');
console.log('  • Wrong file types - Layer 7');
console.log('  • Unauthorized paths - Layer 8');
console.log('  • Hidden files - Layer 9');
