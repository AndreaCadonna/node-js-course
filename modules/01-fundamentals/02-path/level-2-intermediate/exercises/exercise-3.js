/**
 * Exercise 3: Validate User-Provided File Paths
 *
 * Task:
 * Create a comprehensive path validation system that checks user input
 * for security issues, invalid characters, and structural problems.
 *
 * Requirements:
 * - Prevent path traversal attacks
 * - Check for invalid characters
 * - Validate path length
 * - Ensure paths stay within allowed directories
 * - Check for null bytes and encoding attacks
 *
 * Bonus:
 * - Support whitelist/blacklist of directories
 * - Validate file extensions
 * - Check for reserved names (Windows)
 * - Provide detailed error messages
 */

const path = require('path');

/**
 * Check if path is safe (no traversal attacks)
 * @param {string} baseDir - Base directory to restrict to
 * @param {string} userPath - User-provided path
 * @returns {boolean} True if path is safe
 */
function isPathSafe(baseDir, userPath) {
  // TODO: Implement this function
  // Hints:
  // - Resolve both baseDir and the joined path
  // - Check if resolved path starts with baseDir
  // - Use path.sep to ensure you check full directory
}

/**
 * Validate path structure
 * @param {string} filepath - Path to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validatePathStructure(filepath) {
  // TODO: Implement this function
  // Check for:
  // - Not null/undefined
  // - Not empty string
  // - No null bytes (\0)
  // - Valid string type
  // Return object with valid flag and array of error messages
}

/**
 * Check for path traversal attempts
 * @param {string} filepath - Path to check
 * @returns {boolean} True if traversal detected
 */
function hasPathTraversal(filepath) {
  // TODO: Implement this function
  // Hints:
  // - Check for ../
  // - Check for ..\\
  // - Check for encoded versions (%2e%2e)
  // - Check for other encoding tricks
}

/**
 * Validate file extension
 * @param {string} filepath - Path to check
 * @param {string[]} allowedExtensions - Array of allowed extensions (e.g., ['.jpg', '.png'])
 * @returns {boolean} True if extension is allowed
 */
function hasValidExtension(filepath, allowedExtensions) {
  // TODO: Implement this function
  // Hints:
  // - Use path.extname()
  // - Convert to lowercase for comparison
  // - Return true if allowedExtensions is empty (no restrictions)
}

/**
 * Check path length
 * @param {string} filepath - Path to check
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if path length is valid
 */
function isValidLength(filepath, maxLength = 4096) {
  // TODO: Implement this function
  // Hints:
  // - Check total path length
  // - Optionally check individual component lengths (255 chars)
}

/**
 * Comprehensive path validator
 * @param {string} baseDir - Base directory to restrict to
 * @param {string} userPath - User-provided path
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, errors: string[], sanitizedPath: string }
 */
function validatePath(baseDir, userPath, options = {}) {
  // TODO: Implement this function
  // Combine all validation checks
  // Options should support:
  // - allowedExtensions: string[]
  // - maxLength: number
  // - allowTraversal: boolean (default: false)
  //
  // Return object with:
  // - valid: boolean
  // - errors: string[] (array of error messages)
  // - sanitizedPath: string (cleaned path if valid)
}

/**
 * Sanitize user path
 * @param {string} userPath - User-provided path
 * @returns {string} Sanitized path
 */
function sanitizePath(userPath) {
  // TODO: Implement this function
  // Hints:
  // - Remove null bytes
  // - Normalize the path
  // - Remove suspicious patterns
  // - Trim whitespace
}

// Test cases
console.log('=== Exercise 3: Path Validation ===\n');

console.log('Test 1: Path Safety Check');
const baseDir = '/app/uploads';
const safetyTests = [
  'images/photo.jpg',
  '../../../etc/passwd',
  'documents/report.pdf',
  '..\\..\\windows\\system32\\config'
];

safetyTests.forEach(userPath => {
  const safe = isPathSafe(baseDir, userPath);
  console.log(`  Base: ${baseDir}`);
  console.log(`  User path: '${userPath}'`);
  console.log(`  Safe? ${safe ? '✓ Yes' : '✗ No'}`);
  console.log();
});

console.log('Test 2: Structure Validation');
const structureTests = [
  'valid/path.txt',
  '',
  null,
  'path\0with\0nulls',
  '   ',
  'normal-path.txt'
];

structureTests.forEach(p => {
  const result = validatePathStructure(p);
  const display = p === null ? 'null' : p === undefined ? 'undefined' : `'${p}'`;
  console.log(`  ${display}:`);
  console.log(`    Valid: ${result.valid}`);
  if (!result.valid) {
    console.log(`    Errors: ${result.errors.join(', ')}`);
  }
  console.log();
});

console.log('Test 3: Traversal Detection');
const traversalTests = [
  'normal/path.txt',
  '../../../etc/passwd',
  '..\\..\\windows\\system',
  '%2e%2e/encoded',
  'safe/path/file.txt'
];

traversalTests.forEach(p => {
  const hasTraversal = hasPathTraversal(p);
  console.log(`  '${p}' → ${hasTraversal ? '⚠️  Traversal detected' : '✓ Safe'}`);
});
console.log();

console.log('Test 4: Extension Validation');
const allowedExts = ['.jpg', '.png', '.gif'];
const extTests = [
  'photo.jpg',
  'document.pdf',
  'image.PNG',
  'script.js',
  'picture.gif'
];

extTests.forEach(p => {
  const valid = hasValidExtension(p, allowedExts);
  console.log(`  '${p}' (allowed: ${allowedExts.join(', ')}) → ${valid ? '✓ Valid' : '✗ Invalid'}`);
});
console.log();

console.log('Test 5: Length Validation');
const lengthTests = [
  'short.txt',
  'a'.repeat(300) + '.txt',
  'normal/path/file.txt'
];

lengthTests.forEach(p => {
  const valid = isValidLength(p, 255);
  const display = p.length > 50 ? `'${p.substring(0, 47)}...' (${p.length} chars)` : `'${p}'`;
  console.log(`  ${display} → ${valid ? '✓ Valid' : '✗ Too long'}`);
});
console.log();

console.log('Test 6: Comprehensive Validation');
const comprehensiveTests = [
  { path: 'images/photo.jpg', options: { allowedExtensions: ['.jpg', '.png'] } },
  { path: '../../../etc/passwd', options: {} },
  { path: 'documents/report.pdf', options: { allowedExtensions: ['.jpg', '.png'] } },
  { path: 'valid/file.png', options: { allowedExtensions: ['.jpg', '.png'], maxLength: 100 } }
];

comprehensiveTests.forEach(test => {
  const result = validatePath('/app/data', test.path, test.options);
  console.log(`  Path: '${test.path}'`);
  console.log(`  Valid: ${result.valid}`);
  if (result.valid) {
    console.log(`  Sanitized: '${result.sanitizedPath}'`);
  } else {
    console.log(`  Errors:`);
    result.errors.forEach(err => console.log(`    - ${err}`));
  }
  console.log();
});

console.log('Test 7: Path Sanitization');
const sanitizeTests = [
  'normal/path.txt',
  '  spaces  /path/  file.txt  ',
  'path\0with\0nulls.txt',
  '../../../etc/passwd'
];

sanitizeTests.forEach(p => {
  const sanitized = sanitizePath(p);
  console.log(`  Original:  '${p}'`);
  console.log(`  Sanitized: '${sanitized}'`);
  console.log();
});

// Expected output format:
// Test 1: Path Safety Check
//   Base: /app/uploads
//   User path: 'images/photo.jpg'
//   Safe? ✓ Yes
//
//   Base: /app/uploads
//   User path: '../../../etc/passwd'
//   Safe? ✗ No
//
// Test 6: Comprehensive Validation
//   Path: 'images/photo.jpg'
//   Valid: true
//   Sanitized: 'images/photo.jpg'
//
//   Path: '../../../etc/passwd'
//   Valid: false
//   Errors:
//     - Path traversal detected
//     - Path outside allowed directory
