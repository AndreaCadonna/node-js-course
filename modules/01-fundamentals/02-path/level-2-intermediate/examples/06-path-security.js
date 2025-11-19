/**
 * Example 6: Path Security
 *
 * Demonstrates secure path handling to prevent common vulnerabilities.
 * Learn to prevent path traversal attacks, validate user input,
 * and implement secure file access patterns.
 *
 * Key Points:
 * - Path traversal is a critical security vulnerability
 * - Always validate and sanitize user-provided paths
 * - Check if resolved paths stay within allowed boundaries
 * - Be aware of symbolic link attacks
 * - Implement defense in depth
 */

const path = require('path');

console.log('=== Path Security ===\n');

// 1. Path Traversal Attack - The Vulnerability
console.log('1. ⚠️  Path Traversal Vulnerability:');

// VULNERABLE CODE - DO NOT USE
function vulnerableFileAccess(userInput) {
  const baseDir = '/app/uploads';
  const filePath = path.join(baseDir, userInput);
  return filePath;
}

const maliciousInputs = [
  'normal.txt',
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  'uploads/../../../etc/shadow'
];

console.log('  Vulnerable function: path.join(baseDir, userInput)');
console.log('  Base directory: /app/uploads');
console.log();
maliciousInputs.forEach(input => {
  const result = vulnerableFileAccess(input);
  const isSafe = result.startsWith('/app/uploads/') || result === '/app/uploads';
  console.log(`    Input: '${input}'`);
  console.log(`    Result: '${result}'`);
  console.log(`    ${isSafe ? '✓ Safe' : '⚠️  SECURITY RISK - Escaped base directory!'}`);
  console.log();
});

// 2. Secure Path Validation
console.log('2. ✅ Secure Path Validation:');

function securePathJoin(baseDir, userInput) {
  // Normalize the base directory
  const base = path.resolve(baseDir);

  // Join and resolve the user input
  const targetPath = path.resolve(base, userInput);

  // Check if the resolved path is within the base directory
  if (!targetPath.startsWith(base + path.sep) && targetPath !== base) {
    throw new Error('Path traversal detected!');
  }

  return targetPath;
}

console.log('  Secure function with validation:');
maliciousInputs.forEach(input => {
  try {
    const result = securePathJoin('/app/uploads', input);
    console.log(`    Input: '${input}'`);
    console.log(`    Result: '${result}'`);
    console.log(`    ✓ Safe`);
  } catch (error) {
    console.log(`    Input: '${input}'`);
    console.log(`    ✗ Blocked: ${error.message}`);
  }
  console.log();
});

// 3. Defense in Depth - Multiple Checks
console.log('3. Defense in Depth - Multiple Security Layers:');

function securePathWithMultipleChecks(baseDir, userInput) {
  // Layer 1: Input validation
  if (!userInput || typeof userInput !== 'string') {
    throw new Error('Invalid input');
  }

  // Layer 2: Check for null bytes
  if (userInput.includes('\0')) {
    throw new Error('Null byte detected');
  }

  // Layer 3: Check for suspicious patterns
  const suspicious = ['../', '..\\', '%2e%2e', '\\x2e\\x2e'];
  for (const pattern of suspicious) {
    if (userInput.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error('Suspicious pattern detected');
    }
  }

  // Layer 4: Resolve and check boundaries
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userInput);

  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Path outside boundaries');
  }

  // Layer 5: Check path length
  if (target.length > 4096) {
    throw new Error('Path too long');
  }

  return target;
}

const testInputs = [
  'valid/file.txt',
  '../../../etc/passwd',
  'file\0name.txt',
  '%2e%2e/sensitive',
  'a'.repeat(5000) + '/file.txt'
];

console.log('  Testing multi-layer security:');
testInputs.forEach(input => {
  try {
    const result = securePathWithMultipleChecks('/app/data', input);
    const display = input.length > 50 ? input.substring(0, 47) + '...' : input;
    console.log(`    ✓ '${display}' → Safe`);
  } catch (error) {
    const display = input.length > 50 ? input.substring(0, 47) + '...' : input;
    console.log(`    ✗ '${display}' → ${error.message}`);
  }
});
console.log();

// 4. Whitelist Approach
console.log('4. Whitelist Approach - Most Secure:');

function whitelistPath(baseDir, userInput, allowedPaths) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userInput);

  // Check if target is in whitelist
  const relativePath = path.relative(base, target);
  const isAllowed = allowedPaths.some(allowed => {
    return relativePath === allowed || relativePath.startsWith(allowed + path.sep);
  });

  if (!isAllowed) {
    throw new Error('Path not in whitelist');
  }

  return target;
}

const allowedPaths = ['uploads', 'temp', 'public'];
const whitelistTests = [
  'uploads/image.jpg',
  'temp/cache.dat',
  'private/secret.txt',
  'uploads/../../etc/passwd'
];

console.log('  Allowed directories: uploads, temp, public');
whitelistTests.forEach(input => {
  try {
    const result = whitelistPath('/app', input, allowedPaths);
    console.log(`    ✓ '${input}' → Allowed`);
  } catch (error) {
    console.log(`    ✗ '${input}' → ${error.message}`);
  }
});
console.log();

// 5. Encoding Attacks
console.log('5. Handling Encoding Attacks:');

function detectEncodedTraversal(input) {
  const patterns = [
    /\.\./,                    // Direct ..
    /%2e%2e/i,                 // URL encoded ..
    /%252e%252e/i,             // Double URL encoded ..
    /\x2e\x2e/,                // Hex encoded ..
    /\\x2e\\x2e/,              // String escaped hex
    /\u002e\u002e/,            // Unicode encoded ..
  ];

  return patterns.some(pattern => pattern.test(input));
}

const encodedTests = [
  'normal/path',
  '../traversal',
  '%2e%2e/encoded',
  '%252e%252e/double-encoded',
  '\\x2e\\x2e/hex',
  '\u002e\u002e/unicode'
];

console.log('  Detecting encoded traversal attempts:');
encodedTests.forEach(input => {
  const detected = detectEncodedTraversal(input);
  console.log(`    '${input}' → ${detected ? '⚠️  Suspicious' : '✓ OK'}`);
});
console.log();

// 6. Symlink Attack Prevention
console.log('6. Symbolic Link Attack Prevention:');

// Note: This example is conceptual since we can't create actual symlinks
console.log('  Scenario: Attacker creates symlink in allowed directory');
console.log('           pointing to sensitive file outside base directory');
console.log();
console.log('  Prevention strategies:');
console.log('    1. Check realpath before allowing access');
console.log('    2. Disable symlink following in sensitive directories');
console.log('    3. Validate both link and target');
console.log('    4. Use fs.lstat() instead of fs.stat()');
console.log();

function securePathWithSymlinkCheck(baseDir, userInput) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userInput);

  // Basic boundary check
  if (!target.startsWith(base + path.sep) && target !== base) {
    throw new Error('Path outside boundaries');
  }

  // In real code, you would use fs.realpathSync() here
  // to resolve symlinks and check the real target
  // const realTarget = fs.realpathSync(target);
  // if (!realTarget.startsWith(base + path.sep)) {
  //   throw new Error('Symlink points outside base directory');
  // }

  return target;
}

console.log('  Implementation note: Use fs.realpathSync() to resolve symlinks');
console.log();

// 7. Race Condition - TOCTOU
console.log('7. Time-of-Check Time-of-Use (TOCTOU) Vulnerability:');

console.log('  Vulnerable pattern:');
console.log('    1. Check if path is safe');
console.log('    2. [Time passes - attacker changes path]');
console.log('    3. Use the path');
console.log();
console.log('  Mitigation:');
console.log('    1. Open file immediately after validation');
console.log('    2. Use file descriptor for all operations');
console.log('    3. Avoid path-based operations after validation');
console.log('    4. Use atomic operations when possible');
console.log();

// 8. Secure File Access Pattern
console.log('8. Complete Secure File Access Pattern:');

class SecureFileAccess {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
  }

  validatePath(userInput) {
    // Input validation
    if (!userInput || typeof userInput !== 'string') {
      throw new Error('Invalid input');
    }

    // Null byte check
    if (userInput.includes('\0')) {
      throw new Error('Null byte detected');
    }

    // Normalize and resolve
    const normalized = path.normalize(userInput);
    const resolved = path.resolve(this.baseDir, normalized);

    // Boundary check
    if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
      throw new Error('Path traversal detected');
    }

    return resolved;
  }

  getRelativePath(userInput) {
    const fullPath = this.validatePath(userInput);
    return path.relative(this.baseDir, fullPath);
  }

  isPathSafe(userInput) {
    try {
      this.validatePath(userInput);
      return true;
    } catch {
      return false;
    }
  }
}

const secureAccess = new SecureFileAccess('/app/uploads');

const accessTests = [
  'images/photo.jpg',
  '../../../etc/passwd',
  'documents/report.pdf'
];

console.log('  SecureFileAccess class:');
console.log(`  Base directory: ${secureAccess.baseDir}`);
console.log();
accessTests.forEach(input => {
  const safe = secureAccess.isPathSafe(input);
  console.log(`    '${input}': ${safe ? '✓ Safe' : '✗ Unsafe'}`);
  if (safe) {
    console.log(`      Relative: '${secureAccess.getRelativePath(input)}'`);
  }
});
console.log();

// 9. Common Attack Vectors
console.log('9. Common Attack Vectors to Defend Against:');

const attackVectors = [
  { name: 'Basic Traversal', input: '../../../etc/passwd' },
  { name: 'Windows Traversal', input: '..\\..\\..\\windows\\system32\\config\\sam' },
  { name: 'Mixed Separators', input: '..\\/../etc/passwd' },
  { name: 'Encoded Dots', input: '%2e%2e/%2e%2e/etc/passwd' },
  { name: 'Double Encoding', input: '%252e%252e/etc/passwd' },
  { name: 'Null Byte', input: '../../../etc/passwd\0.jpg' },
  { name: 'Unicode', input: '..%c0%af..%c0%afetc/passwd' },
  { name: 'Absolute Path', input: '/etc/passwd' },
  { name: 'Windows Drive', input: 'C:\\Windows\\System32' },
  { name: 'UNC Path', input: '\\\\server\\share\\sensitive' }
];

console.log('  Testing against common attack vectors:');
attackVectors.forEach(attack => {
  const safe = secureAccess.isPathSafe(attack.input);
  console.log(`    ${attack.name.padEnd(20)}: ${safe ? '⚠️  Bypassed!' : '✓ Blocked'}`);
});
console.log();

// 10. Security Best Practices
console.log('10. Path Security Best Practices:');
console.log();
console.log('  ✅ DO:');
console.log('    • Always validate user-provided paths');
console.log('    • Use path.resolve() to get absolute paths');
console.log('    • Check resolved path is within base directory');
console.log('    • Implement multiple security layers');
console.log('    • Use whitelist approach when possible');
console.log('    • Check for null bytes and encoding attacks');
console.log('    • Validate both before and after normalization');
console.log('    • Handle symlinks carefully');
console.log('    • Log security violations');
console.log('    • Test with malicious inputs');
console.log();
console.log('  ❌ DON\'T:');
console.log('    • Trust user input without validation');
console.log('    • Use string operations to check paths');
console.log('    • Rely on single validation method');
console.log('    • Forget about encoded traversal attempts');
console.log('    • Ignore platform-specific attacks');
console.log('    • Allow paths outside base directory');
console.log('    • Use blacklist approach (easy to bypass)');
console.log('    • Forget to normalize before checking');
console.log();
console.log('  🎯 Remember: Defense in Depth');
console.log('    • Multiple layers of validation');
console.log('    • Assume attackers are creative');
console.log('    • Test thoroughly with malicious inputs');
console.log('    • Stay updated on new attack vectors');
