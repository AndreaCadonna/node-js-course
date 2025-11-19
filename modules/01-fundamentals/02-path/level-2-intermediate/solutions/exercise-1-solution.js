/**
 * Solution to Exercise 1: Convert Between Windows and Unix Paths
 */

const path = require('path');

/**
 * Convert Windows path to Unix format
 */
function windowsToUnix(windowsPath) {
  // Remove drive letter if present (C:, D:, etc.)
  let result = windowsPath.replace(/^[A-Za-z]:/, '');

  // Handle UNC paths (\\server\share)
  if (windowsPath.startsWith('\\\\')) {
    result = '//' + windowsPath.substring(2);
  }

  // Replace all backslashes with forward slashes
  result = result.split('\\').join('/');

  return result;
}

/**
 * Convert Unix path to Windows format
 */
function unixToWindows(unixPath, driveLetter = 'C:') {
  // Replace forward slashes with backslashes
  let result = unixPath.split('/').join('\\');

  // Add drive letter if path is absolute and doesn't already have one
  if (unixPath.startsWith('/') && !result.startsWith('\\\\')) {
    result = driveLetter + result;
  }

  return result;
}

/**
 * Normalize path separators
 */
function normalizeSeparators(filepath, targetSep = '/') {
  // Replace all separator types with target separator
  return filepath.replace(/[\\/]+/g, targetSep);
}

/**
 * Detect path format
 */
function detectPathFormat(filepath) {
  // Check for UNC path
  if (filepath.startsWith('\\\\')) {
    return 'windows';
  }

  // Check for drive letter
  if (/^[A-Za-z]:/.test(filepath)) {
    return 'windows';
  }

  // Check for backslashes
  if (filepath.includes('\\')) {
    return 'windows';
  }

  // Check for Unix absolute path
  if (filepath.startsWith('/')) {
    return 'unix';
  }

  // Relative path with forward slashes (assume Unix)
  if (filepath.includes('/')) {
    return 'unix';
  }

  return 'unknown';
}

// Test cases
console.log('=== Solution to Exercise 1 ===\n');

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

console.log('\n✅ Exercise 1 Solution Complete');
