/**
 * Example 3: Path Traversal Attack Prevention
 *
 * Demonstrates comprehensive strategies for preventing path traversal
 * attacks, one of the most common and dangerous web vulnerabilities.
 *
 * Key Points:
 * - Understanding path traversal vulnerabilities
 * - Multi-layer defense strategies
 * - Encoding attack detection
 * - Real-world attack patterns
 * - Production-grade prevention systems
 */

const path = require('path');
const fs = require('fs');

console.log('=== Path Traversal Attack Prevention ===\n');

// 1. Understanding the Vulnerability
console.log('1. Understanding Path Traversal Vulnerabilities:');
console.log();

// VULNERABLE CODE - DO NOT USE IN PRODUCTION
function vulnerableFileRead(baseDir, userInput) {
  const filepath = path.join(baseDir, userInput);
  return fs.readFileSync(filepath, 'utf8');
}

const attackExamples = [
  {
    name: 'Basic Traversal',
    input: '../../../etc/passwd',
    base: '/app/uploads'
  },
  {
    name: 'Windows Traversal',
    input: '..\\..\\..\\windows\\system32\\config\\sam',
    base: 'C:\\app\\uploads'
  },
  {
    name: 'Mixed Separators',
    input: '../\\/../../etc/passwd',
    base: '/app/uploads'
  },
  {
    name: 'Encoded Traversal',
    input: '%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    base: '/app/uploads'
  }
];

console.log('  Common attack patterns:');
attackExamples.forEach(attack => {
  const joined = path.join(attack.base, attack.input);
  const resolved = path.resolve(attack.base, attack.input);
  console.log(`    ${attack.name}:`);
  console.log(`      Input: '${attack.input}'`);
  console.log(`      Joined: '${joined}'`);
  console.log(`      Resolved: '${resolved}'`);
  console.log(`      Escapes base: ${!resolved.startsWith(attack.base)}`);
  console.log();
});

// 2. Basic Defense - Boundary Checking
console.log('2. Basic Defense - Boundary Checking:');

function basicSecurePath(baseDir, userInput) {
  // Resolve both paths
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userInput);

  // Check if target is within base directory
  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Path traversal detected');
  }

  return target;
}

console.log('  Testing basic defense:');
const testInputs = [
  { input: 'file.txt', safe: true },
  { input: 'subdir/file.txt', safe: true },
  { input: '../../../etc/passwd', safe: false },
  { input: '..', safe: false }
];

testInputs.forEach(test => {
  try {
    const result = basicSecurePath('/app/data', test.input);
    const status = test.safe ? '✓' : '⚠️ SHOULD HAVE BLOCKED';
    console.log(`    ${status} '${test.input}' → ${result}`);
  } catch (error) {
    const status = test.safe ? '✗ FALSE POSITIVE' : '✓';
    console.log(`    ${status} '${test.input}' → Blocked: ${error.message}`);
  }
});
console.log();

// 3. Multi-Layer Defense
console.log('3. Multi-Layer Defense System:');

class PathTraversalDefense {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      allowDotFiles: options.allowDotFiles || false,
      maxLength: options.maxLength || 4096,
      allowedExtensions: options.allowedExtensions || null,
      ...options
    };
  }

  validate(userInput) {
    const errors = [];

    // Layer 1: Input Type Validation
    if (!userInput || typeof userInput !== 'string') {
      errors.push('Invalid input type');
      return { valid: false, errors };
    }

    // Layer 2: Null Byte Check
    if (userInput.includes('\0')) {
      errors.push('Null byte detected');
    }

    // Layer 3: Length Check
    if (userInput.length > this.options.maxLength) {
      errors.push('Path too long');
    }

    // Layer 4: Encoding Attack Detection
    const encodingPatterns = [
      /%2e%2e/i,           // URL encoded ..
      /%252e%252e/i,       // Double URL encoded ..
      /\\x2e\\x2e/,        // Hex escaped ..
      /\u002e\u002e/,      // Unicode ..
    ];

    for (const pattern of encodingPatterns) {
      if (pattern.test(userInput)) {
        errors.push('Encoded traversal pattern detected');
        break;
      }
    }

    // Layer 5: Direct Traversal Pattern Detection
    const traversalPatterns = [
      /\.\./,              // ..
      /\.\\/,              // .\ (Windows)
      /\.\.%/,             // ..% (partial encoding)
      /\.\.\x00/,          // ..\0 (null byte injection)
    ];

    for (const pattern of traversalPatterns) {
      if (pattern.test(userInput)) {
        errors.push('Traversal pattern detected');
        break;
      }
    }

    // Layer 6: Absolute Path Check
    if (path.isAbsolute(userInput)) {
      errors.push('Absolute paths not allowed');
    }

    // Layer 7: Normalize and Resolve
    try {
      const normalized = path.normalize(userInput);
      const resolved = path.resolve(this.baseDir, normalized);

      // Layer 8: Boundary Check
      if (!resolved.startsWith(this.baseDir + path.sep) &&
          resolved !== this.baseDir) {
        errors.push('Path outside base directory');
      }

      // Layer 9: Dot File Check
      if (!this.options.allowDotFiles) {
        const basename = path.basename(resolved);
        if (basename.startsWith('.')) {
          errors.push('Dot files not allowed');
        }
      }

      // Layer 10: Extension Check
      if (this.options.allowedExtensions) {
        const ext = path.extname(resolved).toLowerCase();
        if (!this.options.allowedExtensions.includes(ext)) {
          errors.push(`Extension '${ext}' not allowed`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        sanitized: resolved
      };

    } catch (error) {
      errors.push(`Path resolution failed: ${error.message}`);
      return { valid: false, errors };
    }
  }

  sanitize(userInput) {
    const result = this.validate(userInput);
    if (!result.valid) {
      throw new Error(`Invalid path: ${result.errors.join(', ')}`);
    }
    return result.sanitized;
  }
}

const defense = new PathTraversalDefense('/app/uploads', {
  allowDotFiles: false,
  allowedExtensions: ['.jpg', '.png', '.pdf']
});

const advancedTests = [
  'document.pdf',
  '../../../etc/passwd',
  '.env',
  'file.txt',
  '%2e%2e/sensitive',
  'image.jpg',
  '\0file.pdf',
  'a'.repeat(5000)
];

console.log('  Testing multi-layer defense:');
advancedTests.forEach(input => {
  const display = input.length > 50 ? input.substring(0, 47) + '...' : input;
  const result = defense.validate(input);
  if (result.valid) {
    console.log(`    ✓ '${display}' → Valid`);
  } else {
    console.log(`    ✗ '${display}' → ${result.errors.join(', ')}`);
  }
});
console.log();

// 4. Encoding Attack Detection
console.log('4. Advanced Encoding Attack Detection:');

class EncodingDetector {
  static detectEncodedTraversal(input) {
    const patterns = [
      { name: 'URL Encoded', regex: /%2e%2e/i },
      { name: 'Double URL Encoded', regex: /%252e%252e/i },
      { name: 'Hex Escaped', regex: /\\x2e\\x2e/ },
      { name: 'Unicode', regex: /\u002e\u002e/ },
      { name: 'Mixed Encoding', regex: /\.%2e|%2e\./ },
      { name: 'UTF-8 Overlong', regex: /%c0%ae%c0%ae/ },
      { name: 'UTF-16', regex: /%u002e%u002e/ }
    ];

    const detected = [];

    for (const pattern of patterns) {
      if (pattern.regex.test(input)) {
        detected.push(pattern.name);
      }
    }

    return detected;
  }

  static decodeAll(input) {
    let decoded = input;
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      const before = decoded;

      // URL decode
      try {
        decoded = decodeURIComponent(decoded);
      } catch (e) {
        // Invalid encoding
      }

      // If nothing changed, we're done
      if (decoded === before) {
        break;
      }

      iterations++;
    }

    return decoded;
  }

  static isTraversalAfterDecoding(input) {
    const decoded = this.decodeAll(input);
    return /\.\./.test(decoded);
  }
}

const encodedInputs = [
  'normal/path',
  '%2e%2e/passwd',
  '%252e%252e/passwd',
  '..%2fpasswd',
  '%c0%ae%c0%ae/passwd'
];

console.log('  Detecting encoding attacks:');
encodedInputs.forEach(input => {
  const detected = EncodingDetector.detectEncodedTraversal(input);
  const isTraversal = EncodingDetector.isTraversalAfterDecoding(input);
  const status = detected.length > 0 || isTraversal ? '⚠️' : '✓';

  console.log(`    ${status} '${input}'`);
  if (detected.length > 0) {
    console.log(`       Detected: ${detected.join(', ')}`);
  }
  if (isTraversal) {
    console.log(`       Contains '..' after decoding`);
  }
});
console.log();

// 5. Whitelist Approach
console.log('5. Whitelist-Based Validation (Most Secure):');

class WhitelistValidator {
  constructor(baseDir, allowedPaths) {
    this.baseDir = path.resolve(baseDir);
    this.allowedPaths = allowedPaths.map(p => path.normalize(p));
  }

  validate(userInput) {
    const normalized = path.normalize(userInput);

    // Check if path matches any allowed pattern
    const isAllowed = this.allowedPaths.some(allowed => {
      // Exact match
      if (normalized === allowed) return true;

      // Subdirectory match
      if (normalized.startsWith(allowed + path.sep)) return true;

      return false;
    });

    if (!isAllowed) {
      throw new Error('Path not in whitelist');
    }

    // Still validate boundaries
    const resolved = path.resolve(this.baseDir, normalized);
    if (!resolved.startsWith(this.baseDir + path.sep) &&
        resolved !== this.baseDir) {
      throw new Error('Path outside base directory');
    }

    return resolved;
  }
}

const whitelist = new WhitelistValidator('/app', [
  'uploads',
  'public',
  'temp'
]);

const whitelistTests = [
  { input: 'uploads/image.jpg', expected: true },
  { input: 'public/css/style.css', expected: true },
  { input: 'private/secret.txt', expected: false },
  { input: 'uploads/../private/secret.txt', expected: false }
];

console.log('  Whitelist: uploads, public, temp');
console.log('  Testing:');
whitelistTests.forEach(test => {
  try {
    whitelist.validate(test.input);
    const status = test.expected ? '✓' : '⚠️ SHOULD BLOCK';
    console.log(`    ${status} '${test.input}' → Allowed`);
  } catch (error) {
    const status = test.expected ? '✗ FALSE POSITIVE' : '✓';
    console.log(`    ${status} '${test.input}' → Blocked`);
  }
});
console.log();

// 6. Real-World Attack Patterns
console.log('6. Real-World Attack Pattern Database:');

const attackPatterns = [
  { name: 'Basic Unix', pattern: '../../../etc/passwd' },
  { name: 'Basic Windows', pattern: '..\\..\\..\\windows\\system32\\config\\sam' },
  { name: 'URL Encoded', pattern: '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd' },
  { name: 'Double Encoded', pattern: '%252e%252e%252f%252e%252e%252fetc%252fpasswd' },
  { name: 'UTF-8 Overlong', pattern: '%c0%ae%c0%ae%c0%af%c0%ae%c0%ae%c0%afetc%c0%afpasswd' },
  { name: 'Mixed Separators', pattern: '..\\/..//..\\etc/passwd' },
  { name: 'Null Byte', pattern: '../../../etc/passwd%00.jpg' },
  { name: 'Unicode', pattern: '\u002e\u002e\u002f\u002e\u002e\u002fetc\u002fpasswd' },
  { name: 'Absolute Path', pattern: '/etc/passwd' },
  { name: 'UNC Path', pattern: '\\\\server\\share\\sensitive' },
  { name: 'Windows Drive', pattern: 'C:\\Windows\\System32\\config\\sam' },
  { name: 'Dot Segments', pattern: './././../../../etc/passwd' }
];

console.log('  Testing against known attack patterns:');
attackPatterns.forEach(attack => {
  const validation = defense.validate(attack.pattern);
  const status = validation.valid ? '⚠️ BYPASSED' : '✓';
  console.log(`    ${status} ${attack.name.padEnd(20)}: Blocked=${!validation.valid}`);
});
console.log();

// 7. Production-Grade Prevention System
console.log('7. Production-Grade Prevention System:');

class ProductionPathSecurity {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      maxLength: options.maxLength || 4096,
      allowedExtensions: options.allowedExtensions || null,
      allowDotFiles: options.allowDotFiles || false,
      whitelist: options.whitelist || null,
      logViolations: options.logViolations !== false,
      throwOnViolation: options.throwOnViolation !== false,
      ...options
    };
    this.violations = [];
  }

  validate(userInput, context = {}) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      context
    };

    try {
      // 1. Type check
      if (!userInput || typeof userInput !== 'string') {
        this._addError(validation, 'Invalid input type', 'TYPE_ERROR');
        return validation;
      }

      // 2. Length check
      if (userInput.length > this.options.maxLength) {
        this._addError(validation, 'Path too long', 'LENGTH_ERROR');
      }

      // 3. Null byte check
      if (userInput.includes('\0')) {
        this._addError(validation, 'Null byte detected', 'NULL_BYTE');
      }

      // 4. Encoding detection
      const encodedPatterns = EncodingDetector.detectEncodedTraversal(userInput);
      if (encodedPatterns.length > 0) {
        this._addError(validation, `Encoded traversal: ${encodedPatterns.join(', ')}`, 'ENCODING_ATTACK');
      }

      // 5. Direct traversal check
      if (/\.\./.test(userInput)) {
        this._addError(validation, 'Traversal pattern detected', 'TRAVERSAL_PATTERN');
      }

      // 6. Absolute path check
      if (path.isAbsolute(userInput)) {
        this._addError(validation, 'Absolute paths not allowed', 'ABSOLUTE_PATH');
      }

      // 7. Resolve and validate
      const normalized = path.normalize(userInput);
      const resolved = path.resolve(this.baseDir, normalized);

      // 8. Boundary check
      if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
        this._addError(validation, 'Path outside boundaries', 'BOUNDARY_VIOLATION');
      }

      // 9. Whitelist check
      if (this.options.whitelist) {
        const relative = path.relative(this.baseDir, resolved);
        const inWhitelist = this.options.whitelist.some(allowed =>
          relative === allowed || relative.startsWith(allowed + path.sep)
        );

        if (!inWhitelist) {
          this._addError(validation, 'Path not in whitelist', 'WHITELIST_VIOLATION');
        }
      }

      // 10. Extension check
      if (this.options.allowedExtensions) {
        const ext = path.extname(resolved).toLowerCase();
        if (!this.options.allowedExtensions.includes(ext)) {
          this._addError(validation, `Extension ${ext} not allowed`, 'EXTENSION_VIOLATION');
        }
      }

      // 11. Dot file check
      if (!this.options.allowDotFiles && path.basename(resolved).startsWith('.')) {
        this._addError(validation, 'Dot files not allowed', 'DOTFILE_VIOLATION');
      }

      validation.sanitized = resolved;
      validation.relative = path.relative(this.baseDir, resolved);

    } catch (error) {
      this._addError(validation, `Validation error: ${error.message}`, 'VALIDATION_ERROR');
    }

    if (!validation.valid && this.options.logViolations) {
      this._logViolation(userInput, validation, context);
    }

    if (!validation.valid && this.options.throwOnViolation) {
      throw new Error(`Security violation: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    return validation;
  }

  _addError(validation, message, code) {
    validation.valid = false;
    validation.errors.push({ message, code, timestamp: new Date() });
  }

  _logViolation(input, validation, context) {
    this.violations.push({
      timestamp: new Date(),
      input,
      errors: validation.errors,
      context
    });
  }

  getViolations() {
    return this.violations;
  }

  clearViolations() {
    this.violations = [];
  }
}

const prodSecurity = new ProductionPathSecurity('/app/data', {
  allowedExtensions: ['.txt', '.pdf', '.jpg'],
  logViolations: true,
  throwOnViolation: false
});

console.log('  Testing production security system:');
const prodTests = [
  'document.pdf',
  '../../../etc/passwd',
  '%2e%2e/secret',
  'file.exe',
  'valid/path/file.txt'
];

prodTests.forEach(input => {
  const validation = prodSecurity.validate(input, { user: 'testUser' });
  if (validation.valid) {
    console.log(`    ✓ '${input}' → ${validation.sanitized}`);
  } else {
    console.log(`    ✗ '${input}' → ${validation.errors.map(e => e.code).join(', ')}`);
  }
});

console.log();
console.log(`  Total violations logged: ${prodSecurity.getViolations().length}`);
console.log();

// 8. Best Practices Summary
console.log('8. Path Traversal Prevention Best Practices:');
console.log();
console.log('  ✅ DO:');
console.log('    • Implement multi-layer validation');
console.log('    • Check for encoding attacks');
console.log('    • Validate after normalization and resolution');
console.log('    • Use whitelist approach when possible');
console.log('    • Log all security violations');
console.log('    • Test with real attack patterns');
console.log('    • Validate on server side');
console.log('    • Use principle of least privilege');
console.log();
console.log('  ❌ DON\'T:');
console.log('    • Rely on client-side validation only');
console.log('    • Use blacklist approach (easy to bypass)');
console.log('    • Trust any user input');
console.log('    • Skip encoding detection');
console.log('    • Forget about null byte injection');
console.log('    • Ignore security logs');
console.log();

console.log('✅ Path traversal prevention complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Path traversal is a critical vulnerability');
console.log('  • Use multiple layers of defense');
console.log('  • Detect and block encoding attacks');
console.log('  • Whitelist is more secure than blacklist');
console.log('  • Always validate, normalize, and resolve paths');
console.log('  • Log violations for security monitoring');
