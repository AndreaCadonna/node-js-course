/**
 * Solution to Exercise 3: Validate User-Provided File Paths
 */

const path = require('path');

function isPathSafe(baseDir, userPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userPath);
  return target.startsWith(base + path.sep) || target === base;
}

function validatePathStructure(filepath) {
  const errors = [];

  if (!filepath || typeof filepath !== 'string') {
    errors.push('Invalid input type');
  } else if (filepath.trim() === '') {
    errors.push('Empty path');
  } else if (filepath.includes('\0')) {
    errors.push('Null byte detected');
  }

  return { valid: errors.length === 0, errors };
}

function hasPathTraversal(filepath) {
  const patterns = ['../', '..\\', '%2e%2e', '%252e%252e'];
  return patterns.some(pattern => filepath.toLowerCase().includes(pattern.toLowerCase()));
}

function hasValidExtension(filepath, allowedExtensions) {
  if (allowedExtensions.length === 0) return true;
  const ext = path.extname(filepath).toLowerCase();
  return allowedExtensions.map(e => e.toLowerCase()).includes(ext);
}

function isValidLength(filepath, maxLength = 4096) {
  return filepath.length <= maxLength;
}

function validatePath(baseDir, userPath, options = {}) {
  const {
    allowedExtensions = [],
    maxLength = 4096
  } = options;

  const errors = [];
  const structureResult = validatePathStructure(userPath);

  if (!structureResult.valid) {
    return { valid: false, errors: structureResult.errors, sanitizedPath: '' };
  }

  if (hasPathTraversal(userPath)) {
    errors.push('Path traversal detected');
  }

  if (!isPathSafe(baseDir, userPath)) {
    errors.push('Path outside allowed directory');
  }

  if (!isValidLength(userPath, maxLength)) {
    errors.push(`Path too long (max: ${maxLength})`);
  }

  if (allowedExtensions.length > 0 && !hasValidExtension(userPath, allowedExtensions)) {
    errors.push('Invalid file extension');
  }

  const sanitizedPath = errors.length === 0 ? path.normalize(userPath) : '';

  return { valid: errors.length === 0, errors, sanitizedPath };
}

function sanitizePath(userPath) {
  if (!userPath || typeof userPath !== 'string') return '';
  return path.normalize(userPath.replace(/\0/g, '').trim());
}

// Test cases
console.log('=== Solution to Exercise 3 ===\n');

console.log('Test 1: Path Safety Check');
const baseDir = '/app/uploads';
const safetyTests = ['images/photo.jpg', '../../../etc/passwd'];

safetyTests.forEach(userPath => {
  const safe = isPathSafe(baseDir, userPath);
  console.log(`  '${userPath}' → ${safe ? '✓ Safe' : '✗ Unsafe'}`);
});
console.log();

console.log('Test 2: Comprehensive Validation');
const comprehensiveTests = [
  { path: 'images/photo.jpg', options: { allowedExtensions: ['.jpg', '.png'] } },
  { path: '../../../etc/passwd', options: {} }
];

comprehensiveTests.forEach(test => {
  const result = validatePath('/app/data', test.path, test.options);
  console.log(`  Path: '${test.path}'`);
  console.log(`  Valid: ${result.valid}`);
  if (!result.valid) {
    console.log(`  Errors: ${result.errors.join(', ')}`);
  }
  console.log();
});

console.log('✅ Exercise 3 Solution Complete');
