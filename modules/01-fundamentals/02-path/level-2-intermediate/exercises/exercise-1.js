/**
 * Exercise 1: Convert Between Windows and Unix Paths
 *
 * Task:
 * Create functions to convert paths between Windows and Unix formats.
 * Handle edge cases like drive letters, UNC paths, and mixed separators.
 *
 * Requirements:
 * - Convert Windows paths (C:\path\to\file) to Unix format (/path/to/file)
 * - Convert Unix paths (/path/to/file) to Windows format (C:\path\to\file)
 * - Handle relative paths correctly
 * - Remove/add drive letters appropriately
 * - Handle mixed separators (path/with\mixed/separators)
 *
 * Bonus:
 * - Detect which format a path is currently in
 * - Handle UNC paths (\\server\share\path)
 */

const path = require('path');

/**
 * Convert Windows path to Unix format
 * @param {string} windowsPath - Path in Windows format
 * @returns {string} Path in Unix format
 */
function windowsToUnix(windowsPath) {
  // TODO: Implement this function
  // Hints:
  // - Remove drive letter (C:, D:, etc.)
  // - Replace backslashes with forward slashes
  // - Handle UNC paths (\\server\share)
}

/**
 * Convert Unix path to Windows format
 * @param {string} unixPath - Path in Unix format
 * @param {string} driveLetter - Drive letter to add (default: 'C:')
 * @returns {string} Path in Windows format
 */
function unixToWindows(unixPath, driveLetter = 'C:') {
  // TODO: Implement this function
  // Hints:
  // - Replace forward slashes with backslashes
  // - Add drive letter if path is absolute
  // - Don't add drive letter to relative paths
}

/**
 * Normalize path separators (convert all to target format)
 * @param {string} filepath - Path with mixed separators
 * @param {string} targetSep - Target separator ('/' or '\\')
 * @returns {string} Path with consistent separators
 */
function normalizeSeparators(filepath, targetSep = '/') {
  // TODO: Implement this function
  // Hint: Replace all separator types with target separator
}

/**
 * Detect path format
 * @param {string} filepath - Path to analyze
 * @returns {string} 'windows', 'unix', or 'unknown'
 */
function detectPathFormat(filepath) {
  // TODO: Implement this function
  // Hints:
  // - Check for drive letter (C:)
  // - Check for backslashes
  // - Check for UNC path (\\server)
}

// Test cases
console.log('=== Exercise 1: Path Format Conversion ===\n');

console.log('Test 1: Windows to Unix');
const windowsPaths = [
  'C:\\Users\\John\\Documents\\file.txt',
  'D:\\Projects\\app\\src\\index.js',
  'relative\\path\\file.txt',
  '\\\\server\\share\\folder\\file.txt'
];

windowsPaths.forEach(p => {
  const result = windowsToUnix(p);
  console.log(`  '${p}'`);
  console.log(`  → '${result}'`);
});
console.log();

console.log('Test 2: Unix to Windows');
const unixPaths = [
  '/home/john/documents/file.txt',
  '/var/www/html/index.html',
  'relative/path/file.txt'
];

unixPaths.forEach(p => {
  const result = unixToWindows(p);
  console.log(`  '${p}'`);
  console.log(`  → '${result}'`);
});
console.log();

console.log('Test 3: Normalize Mixed Separators');
const mixedPaths = [
  'folder/subfolder\\file.txt',
  'path\\with/mixed\\separators/file.txt'
];

mixedPaths.forEach(p => {
  const toUnix = normalizeSeparators(p, '/');
  const toWindows = normalizeSeparators(p, '\\');
  console.log(`  '${p}'`);
  console.log(`  → Unix:    '${toUnix}'`);
  console.log(`  → Windows: '${toWindows}'`);
});
console.log();

console.log('Test 4: Detect Path Format');
const detectPaths = [
  'C:\\Windows\\System32\\file.txt',
  '/usr/local/bin/node',
  'relative\\windows\\path',
  'relative/unix/path',
  '\\\\server\\share\\file.txt'
];

detectPaths.forEach(p => {
  const format = detectPathFormat(p);
  console.log(`  '${p}' → ${format}`);
});
console.log();

// Expected output format:
// Test 1: Windows to Unix
//   'C:\Users\John\Documents\file.txt'
//   → '/Users/John/Documents/file.txt'
//
// Test 2: Unix to Windows
//   '/home/john/documents/file.txt'
//   → 'C:\home\john\documents\file.txt'
//
// Test 3: Normalize Mixed Separators
//   'folder/subfolder\file.txt'
//   → Unix:    'folder/subfolder/file.txt'
//   → Windows: 'folder\subfolder\file.txt'
//
// Test 4: Detect Path Format
//   'C:\Windows\System32\file.txt' → windows
//   '/usr/local/bin/node' → unix
