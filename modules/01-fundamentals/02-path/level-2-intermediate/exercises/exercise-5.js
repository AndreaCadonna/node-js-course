/**
 * Exercise 5: Handle Special Characters in Paths
 *
 * Task:
 * Create functions to properly handle special path characters and markers.
 * Work with ., .., ~, and other special cases. Implement safe normalization
 * and navigation using special characters.
 *
 * Requirements:
 * - Normalize paths with . and .. markers
 * - Expand ~ (home directory) manually
 * - Handle multiple consecutive special characters
 * - Resolve relative paths safely
 * - Count directory traversals (.. occurrences)
 *
 * Bonus:
 * - Detect and handle encoded special characters
 * - Implement safe path resolution with limits
 * - Handle symbolic link simulation
 */

const path = require('path');
const os = require('os');

/**
 * Manually expand ~ to home directory
 * @param {string} filepath - Path that may contain ~
 * @returns {string} Path with ~ expanded
 */
function expandTilde(filepath) {
  // TODO: Implement this function
  // Hints:
  // - Check if path starts with ~/ or is just ~
  // - Use os.homedir() to get home directory
  // - Use path.join() to combine
  // - Handle ~username (bonus: just handle ~)
}

/**
 * Count directory traversals (.. occurrences)
 * @param {string} filepath - Path to analyze
 * @returns {number} Number of .. segments
 */
function countTraversals(filepath) {
  // TODO: Implement this function
  // Hints:
  // - Split path by separator
  // - Count segments that are exactly '..'
  // - Normalize first to handle /./../../
}

/**
 * Resolve special characters safely
 * @param {string} filepath - Path with special chars
 * @param {number} maxTraversals - Maximum allowed .. levels
 * @returns {string} Resolved path or throws error
 */
function safeResolve(filepath, maxTraversals = 3) {
  // TODO: Implement this function
  // Hints:
  // - Count traversals first
  // - Throw error if exceeds maxTraversals
  // - Use path.normalize()
  // - Handle edge cases
}

/**
 * Remove all . and .. from path (simulate resolution)
 * @param {string} filepath - Path to resolve
 * @returns {string} Path with special chars resolved
 */
function resolveSpecialChars(filepath) {
  // TODO: Implement this function
  // Hints:
  // - Split path into segments
  // - Process each segment:
  //   - Skip '.' (current dir)
  //   - Pop previous for '..' (parent dir)
  //   - Add regular segments to result
  // - Join back into path
}

/**
 * Check if path tries to escape a base directory
 * @param {string} basePath - Base directory
 * @param {string} relativePath - Relative path with possible ..
 * @returns {boolean} True if path tries to escape
 */
function escapesBaseDir(basePath, relativePath) {
  // TODO: Implement this function
  // Hints:
  // - Join basePath and relativePath
  // - Resolve to absolute
  // - Check if result starts with basePath
}

/**
 * Simplify path (remove redundant . and ..)
 * @param {string} filepath - Path to simplify
 * @returns {string} Simplified path
 */
function simplifyPath(filepath) {
  // TODO: Implement this function
  // Similar to resolveSpecialChars but handle absolute paths
  // and preserve leading ../ for relative paths
}

/**
 * Navigate path using special characters
 * @param {string} currentPath - Current directory
 * @param {string} navigation - Navigation string (., .., dirname)
 * @returns {string} New path after navigation
 */
function navigate(currentPath, navigation) {
  // TODO: Implement this function
  // Examples:
  // - navigate('/home/user', '..') → '/home'
  // - navigate('/home/user', '.') → '/home/user'
  // - navigate('/home/user', 'docs') → '/home/user/docs'
}

/**
 * Parse path into segments, marking special ones
 * @param {string} filepath - Path to parse
 * @returns {Array} Array of { segment, type } objects
 */
function parsePathSegments(filepath) {
  // TODO: Implement this function
  // Return array of objects like:
  // { segment: '..', type: 'parent' }
  // { segment: '.', type: 'current' }
  // { segment: 'folder', type: 'normal' }
}

/**
 * Validate special character usage
 * @param {string} filepath - Path to validate
 * @returns {Object} Validation result with details
 */
function validateSpecialChars(filepath) {
  // TODO: Implement this function
  // Check for:
  // - Multiple consecutive . or ..
  // - Invalid combinations
  // - Suspicious patterns
  // Return: { valid: boolean, issues: string[] }
}

// Test cases
console.log('=== Exercise 5: Special Characters ===\n');

console.log('Test 1: Expand Tilde');
const tildeTests = [
  '~/documents/file.txt',
  '~',
  '~/.',
  '/absolute/path',
  'relative/path'
];

tildeTests.forEach(p => {
  const expanded = expandTilde(p);
  console.log(`  '${p}'`);
  console.log(`  → '${expanded}'`);
  console.log();
});

console.log('Test 2: Count Traversals');
const traversalTests = [
  'folder/file.txt',
  '../file.txt',
  '../../file.txt',
  '../../../file.txt',
  './folder/../file.txt'
];

traversalTests.forEach(p => {
  const count = countTraversals(p);
  console.log(`  '${p}' → ${count} traversal${count !== 1 ? 's' : ''}`);
});
console.log();

console.log('Test 3: Safe Resolve');
const resolveTests = [
  { path: '../file.txt', max: 3 },
  { path: '../../../../file.txt', max: 3 },
  { path: './folder/../file.txt', max: 3 }
];

resolveTests.forEach(test => {
  try {
    const resolved = safeResolve(test.path, test.max);
    console.log(`  '${test.path}' (max: ${test.max}) → '${resolved}'`);
  } catch (error) {
    console.log(`  '${test.path}' (max: ${test.max}) → Error: ${error.message}`);
  }
});
console.log();

console.log('Test 4: Resolve Special Characters');
const specialTests = [
  'a/b/c',
  'a/./b/c',
  'a/b/../c',
  'a/b/c/../../d',
  './a/./b/../c/./d'
];

specialTests.forEach(p => {
  const resolved = resolveSpecialChars(p);
  console.log(`  '${p}' → '${resolved}'`);
});
console.log();

console.log('Test 5: Escape Detection');
const escapeTests = [
  { base: '/app/data', path: 'files/doc.txt' },
  { base: '/app/data', path: '../../../etc/passwd' },
  { base: '/app/data', path: './files/../docs/file.txt' }
];

escapeTests.forEach(test => {
  const escapes = escapesBaseDir(test.base, test.path);
  console.log(`  Base: '${test.base}'`);
  console.log(`  Path: '${test.path}'`);
  console.log(`  Escapes? ${escapes ? '⚠️  Yes' : '✓ No'}`);
  console.log();
});

console.log('Test 6: Simplify Path');
const simplifyTests = [
  '/a/./b/../c/',
  'a/b/c/../../d',
  '/a/b/c/../../../d',
  '../a/./b/../c'
];

simplifyTests.forEach(p => {
  const simplified = simplifyPath(p);
  console.log(`  '${p}' → '${simplified}'`);
});
console.log();

console.log('Test 7: Navigate');
const navTests = [
  { current: '/home/user/docs', nav: '..' },
  { current: '/home/user/docs', nav: '.' },
  { current: '/home/user', nav: 'documents' },
  { current: '/home/user/docs', nav: '../..' }
];

navTests.forEach(test => {
  const result = navigate(test.current, test.nav);
  console.log(`  Current: '${test.current}'`);
  console.log(`  Navigate: '${test.nav}'`);
  console.log(`  Result: '${result}'`);
  console.log();
});

console.log('Test 8: Parse Segments');
const segmentTests = [
  'a/b/../c/./d',
  '../../folder/file.txt'
];

segmentTests.forEach(p => {
  const segments = parsePathSegments(p);
  console.log(`  Path: '${p}'`);
  console.log('  Segments:');
  segments.forEach(seg => {
    console.log(`    '${seg.segment}' (${seg.type})`);
  });
  console.log();
});

console.log('Test 9: Validate Special Characters');
const validateTests = [
  'normal/path/file.txt',
  'path/with/../parent',
  '../../safe/traversal',
  '.././../multiple/./dots/../path'
];

validateTests.forEach(p => {
  const result = validateSpecialChars(p);
  console.log(`  Path: '${p}'`);
  console.log(`  Valid: ${result.valid}`);
  if (!result.valid) {
    console.log('  Issues:');
    result.issues.forEach(issue => console.log(`    - ${issue}`));
  }
  console.log();
});

console.log('Test 10: Complex Special Character Handling');
const complexPath = '~/./documents/../projects/./app/../lib/./utils.js';
console.log(`  Original: '${complexPath}'`);
console.log(`  Expanded: '${expandTilde(complexPath)}'`);
console.log(`  Traversals: ${countTraversals(complexPath)}`);
console.log(`  Simplified: '${simplifyPath(complexPath)}'`);
console.log(`  Resolved: '${resolveSpecialChars(complexPath.replace('~/', ''))}'`);

// Expected output format:
// Test 1: Expand Tilde
//   '~/documents/file.txt'
//   → '/home/username/documents/file.txt'
//
// Test 2: Count Traversals
//   '../file.txt' → 1 traversal
//   '../../file.txt' → 2 traversals
//
// Test 4: Resolve Special Characters
//   'a/./b/c' → 'a/b/c'
//   'a/b/../c' → 'a/c'
//
// Test 5: Escape Detection
//   Base: '/app/data'
//   Path: '../../../etc/passwd'
//   Escapes? ⚠️  Yes
