/**
 * Exercise 4: Build a Path Utility Library
 *
 * Task:
 * Create a comprehensive path utility library with commonly needed
 * path manipulation functions. This should be a reusable toolkit.
 *
 * Requirements:
 * - Get filename without extension
 * - Change file extension
 * - Add suffix to filename
 * - Parse versioned filenames
 * - Extract date from filename
 * - Get path depth
 * - Find common base path
 *
 * Bonus:
 * - Create a PathUtils class
 * - Support method chaining
 * - Add path comparison utilities
 * - Include path formatting helpers
 */

const path = require('path');

/**
 * Get filename without extension
 * @param {string} filepath - Path to file
 * @returns {string} Filename without extension
 */
function getNameWithoutExt(filepath) {
  // TODO: Implement this function
  // Hint: Use path.basename() and path.extname()
}

/**
 * Change file extension
 * @param {string} filepath - Original path
 * @param {string} newExt - New extension (with or without dot)
 * @returns {string} Path with new extension
 */
function changeExtension(filepath, newExt) {
  // TODO: Implement this function
  // Hints:
  // - Use path.parse()
  // - Ensure newExt starts with .
  // - Use path.format() to rebuild
}

/**
 * Add suffix to filename (before extension)
 * @param {string} filepath - Original path
 * @param {string} suffix - Suffix to add
 * @returns {string} Path with suffix added
 */
function addSuffix(filepath, suffix) {
  // TODO: Implement this function
  // Example: addSuffix('photo.jpg', '-thumb') → 'photo-thumb.jpg'
}

/**
 * Get all parent directories
 * @param {string} filepath - Path to analyze
 * @returns {string[]} Array of parent directories
 */
function getParentDirs(filepath) {
  // TODO: Implement this function
  // Return array of all parent directories from immediate parent to root
}

/**
 * Calculate path depth (number of directory levels)
 * @param {string} filepath - Path to analyze
 * @returns {number} Number of directory levels
 */
function getPathDepth(filepath) {
  // TODO: Implement this function
  // Hint: Split by separator and count non-empty parts
}

/**
 * Check if one path is a child of another
 * @param {string} childPath - Potential child path
 * @param {string} parentPath - Potential parent path
 * @returns {boolean} True if childPath is inside parentPath
 */
function isChildOf(childPath, parentPath) {
  // TODO: Implement this function
  // Hints:
  // - Resolve both paths to absolute
  // - Use path.relative()
  // - Check if relative path starts with ..
}

/**
 * Find common base path among multiple paths
 * @param {string[]} paths - Array of paths
 * @returns {string} Common base directory
 */
function findCommonBase(paths) {
  // TODO: Implement this function
  // Hints:
  // - Split all paths into segments
  // - Find common prefix
  // - Handle empty array case
}

/**
 * Parse versioned filename
 * @param {string} filepath - Filename with version
 * @returns {Object} { basename, version, ext } or null
 */
function parseVersion(filepath) {
  // TODO: Implement this function
  // Pattern: filename-v1.2.3.ext or filename-1.2.3.ext
  // Return: { basename: 'filename', version: '1.2.3', ext: '.ext' }
}

/**
 * Extract date from filename
 * @param {string} filepath - Filename with date
 * @returns {Object} { date, pattern } or null
 */
function extractDate(filepath) {
  // TODO: Implement this function
  // Support patterns: YYYY-MM-DD, YYYYMMDD, DD-MM-YYYY
  // Return: { date: '2024-01-15', pattern: 'YYYY-MM-DD' }
}

/**
 * Ensure trailing slash for directory
 * @param {string} dirPath - Directory path
 * @returns {string} Path with trailing slash
 */
function ensureTrailingSlash(dirPath) {
  // TODO: Implement this function
  // Don't add if already present
}

/**
 * Remove trailing slash
 * @param {string} dirPath - Directory path
 * @returns {string} Path without trailing slash
 */
function removeTrailingSlash(dirPath) {
  // TODO: Implement this function
  // Don't remove if it's just root (/)
}

/**
 * PathUtils Class - Complete utility toolkit
 */
class PathUtils {
  constructor(basePath = process.cwd()) {
    this.basePath = path.resolve(basePath);
  }

  // TODO: Implement all utility methods as class methods
  // Methods to include:
  // - resolve(...segments) - Resolve relative to basePath
  // - relative(filepath) - Get path relative to basePath
  // - isInside(filepath) - Check if path is inside basePath
  // - getNameWithoutExt(filepath)
  // - changeExtension(filepath, newExt)
  // - addSuffix(filepath, suffix)
  // - getDepth(filepath)
  // - parseVersion(filepath)
  // - extractDate(filepath)

  resolve(...segments) {
    // TODO: Implement
  }

  relative(filepath) {
    // TODO: Implement
  }

  isInside(filepath) {
    // TODO: Implement
  }

  // Add more methods...
}

// Test cases
console.log('=== Exercise 4: Path Utility Library ===\n');

console.log('Test 1: Name Without Extension');
const nameTests = [
  'document.pdf',
  'archive.tar.gz',
  '/path/to/file.txt',
  'noextension'
];

nameTests.forEach(p => {
  const name = getNameWithoutExt(p);
  console.log(`  '${p}' → '${name}'`);
});
console.log();

console.log('Test 2: Change Extension');
const extTests = [
  { path: 'document.txt', ext: '.pdf' },
  { path: 'script.js', ext: 'ts' },
  { path: 'image.jpg', ext: '.png' }
];

extTests.forEach(test => {
  const result = changeExtension(test.path, test.ext);
  console.log(`  '${test.path}' → '${result}'`);
});
console.log();

console.log('Test 3: Add Suffix');
const suffixTests = [
  { path: 'photo.jpg', suffix: '-thumb' },
  { path: 'document.pdf', suffix: '.backup' },
  { path: 'file.txt', suffix: '-v2' }
];

suffixTests.forEach(test => {
  const result = addSuffix(test.path, test.suffix);
  console.log(`  '${test.path}' + '${test.suffix}' → '${result}'`);
});
console.log();

console.log('Test 4: Parent Directories');
const parentTest = '/home/user/documents/work/project/file.txt';
const parents = getParentDirs(parentTest);
console.log(`  Path: '${parentTest}'`);
console.log('  Parents:');
parents.forEach(p => console.log(`    '${p}'`));
console.log();

console.log('Test 5: Path Depth');
const depthTests = [
  'file.txt',
  'folder/file.txt',
  '/home/user/docs/file.txt'
];

depthTests.forEach(p => {
  const depth = getPathDepth(p);
  console.log(`  '${p}' → depth: ${depth}`);
});
console.log();

console.log('Test 6: Child Path Check');
const childTests = [
  { child: '/home/user/docs/file.txt', parent: '/home/user' },
  { child: '/var/log/app.log', parent: '/home/user' }
];

childTests.forEach(test => {
  const result = isChildOf(test.child, test.parent);
  console.log(`  '${test.child}'`);
  console.log(`  is child of '${test.parent}': ${result ? 'Yes' : 'No'}`);
  console.log();
});

console.log('Test 7: Common Base Path');
const paths = [
  '/home/user/docs/a.txt',
  '/home/user/docs/b.txt',
  '/home/user/docs/sub/c.txt'
];
const common = findCommonBase(paths);
console.log('  Paths:');
paths.forEach(p => console.log(`    ${p}`));
console.log(`  Common base: '${common}'`);
console.log();

console.log('Test 8: Parse Version');
const versionTests = [
  'app-v1.2.3.tar.gz',
  'library-2.0.0.js',
  'file-without-version.txt'
];

versionTests.forEach(p => {
  const result = parseVersion(p);
  console.log(`  '${p}': ${result ? `v${result.version}` : 'No version'}`);
});
console.log();

console.log('Test 9: Extract Date');
const dateTests = [
  'backup-2024-01-15.sql',
  'report_20240315.pdf',
  'nodates.txt'
];

dateTests.forEach(p => {
  const result = extractDate(p);
  console.log(`  '${p}': ${result ? result.date : 'No date'}`);
});
console.log();

console.log('Test 10: PathUtils Class');
const utils = new PathUtils('/home/user/project');
console.log(`  Base path: ${utils.basePath}`);
console.log(`  resolve('src', 'app.js'): '${utils.resolve('src', 'app.js')}'`);
console.log(`  relative('/home/user/project/src/app.js'): '${utils.relative('/home/user/project/src/app.js')}'`);
console.log(`  isInside('/home/user/project/src/app.js'): ${utils.isInside('/home/user/project/src/app.js')}`);
console.log(`  isInside('/var/log/system.log'): ${utils.isInside('/var/log/system.log')}`);

// Expected output format:
// Test 1: Name Without Extension
//   'document.pdf' → 'document'
//   'archive.tar.gz' → 'archive.tar'
//
// Test 2: Change Extension
//   'document.txt' → 'document.pdf'
//
// Test 3: Add Suffix
//   'photo.jpg' + '-thumb' → 'photo-thumb.jpg'
