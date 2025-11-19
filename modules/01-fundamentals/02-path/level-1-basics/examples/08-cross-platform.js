/**
 * Example 8: Cross-Platform Path Handling
 *
 * Demonstrates best practices for writing cross-platform path code.
 * Shows common pitfalls and how to avoid them.
 *
 * Key Points:
 * - Always use path module methods
 * - Never hardcode separators
 * - Be aware of case sensitivity differences
 * - Use path.normalize() for user input
 * - Test on multiple platforms when possible
 */

const path = require('path');

console.log('=== Cross-Platform Path Handling ===\n');

// 1. The problem with hardcoded separators
console.log('1. ❌ Common mistake - Hardcoded separators:\n');

// Wrong way
const wrongPath = 'folder' + '/' + 'file.txt';
console.log(`  ❌ Wrong: 'folder' + '/' + 'file.txt'`);
console.log(`     Result: ${wrongPath}`);
console.log(`     Problem: Uses / which may not work on Windows`);
console.log();

// Right way
const rightPath = path.join('folder', 'file.txt');
console.log(`  ✅ Correct: path.join('folder', 'file.txt')`);
console.log(`     Result: ${rightPath}`);
console.log(`     Works on: All platforms`);
console.log();

// 2. Building paths correctly
console.log('2. ✅ Building paths that work everywhere:\n');

const examples = [
  { segments: ['users', 'john', 'documents'] },
  { segments: ['var', 'www', 'html', 'index.html'] },
  { segments: ['config', 'app.json'] }
];

examples.forEach(ex => {
  console.log(`  Segments: [${ex.segments.map(s => `"${s}"`).join(', ')}]`);
  console.log(`  Result: ${path.join(...ex.segments)}`);
});
console.log();

// 3. Handling absolute vs relative paths
console.log('3. Absolute vs relative paths (cross-platform):\n');

// Relative path
const relative = path.join('config', 'database.json');
console.log(`  Relative: ${relative}`);

// Absolute path
const absolute = path.resolve('config', 'database.json');
console.log(`  Absolute: ${absolute}`);
console.log(`  Note: Absolute path includes current directory`);
console.log();

// 4. Using __dirname for file-relative paths
console.log('4. Using __dirname (always works):\n');

const configPath = path.join(__dirname, 'config', 'app.json');
console.log(`  __dirname: ${__dirname}`);
console.log(`  Config path: ${configPath}`);
console.log('  This works regardless of where the script is run from');
console.log();

// 5. Normalizing paths
console.log('5. Normalizing paths from user input:\n');

const userInputs = [
  'folder/./file.txt',
  'folder//file.txt',
  'folder/subfolder/../file.txt',
  './folder/file.txt'
];

console.log('  User input -> Normalized:');
userInputs.forEach(input => {
  const normalized = path.normalize(input);
  console.log(`    ${input.padEnd(30)} -> ${normalized}`);
});
console.log();

// 6. Cross-platform path parsing
console.log('6. Parsing paths (works on any platform):\n');

function analyzeP(filepath) {
  const parsed = path.parse(filepath);
  console.log(`  Path: ${filepath}`);
  console.log(`    Directory: ${parsed.dir}`);
  console.log(`    Filename: ${parsed.base}`);
  console.log(`    Extension: ${parsed.ext}`);
  console.log();
}

analyzeP('/home/user/document.pdf');
analyzeP('config/settings.json');

// 7. Platform-specific behavior awareness
console.log('7. Platform differences to be aware of:\n');

console.log('  a) Case sensitivity:');
console.log('     - Windows: Usually case-insensitive');
console.log('     - Mac: Usually case-insensitive (configurable)');
console.log('     - Linux: Case-sensitive');
console.log('     Impact: file.txt ≠ FILE.txt on Linux');
console.log();

console.log('  b) Path separators:');
console.log('     - Windows: \\ (backslash)');
console.log('     - Unix/Mac: / (forward slash)');
console.log('     Solution: Always use path.join()');
console.log();

console.log('  c) Drive letters:');
console.log('     - Windows: C:\\, D:\\, etc.');
console.log('     - Unix/Mac: No drive letters, single root /');
console.log('     Solution: Use path module to handle both');
console.log();

// 8. Converting between formats
console.log('8. Working with different path formats:\n');

// Force POSIX format (Unix-style)
const posixPath = path.posix.join('folder', 'subfolder', 'file.txt');
console.log(`  POSIX format: ${posixPath}`);

// Force Windows format
const winPath = path.win32.join('folder', 'subfolder', 'file.txt');
console.log(`  Windows format: ${winPath}`);

// Current platform
const currentPath = path.join('folder', 'subfolder', 'file.txt');
console.log(`  Current platform: ${currentPath}`);
console.log();

// 9. Checking if path is absolute
console.log('9. Checking absolute vs relative (cross-platform):\n');

const pathsToCheck = [
  '/home/user/file.txt',    // Unix absolute
  'C:\\Users\\file.txt',    // Windows absolute
  './relative/path.txt',     // Relative
  'just-a-file.txt'          // Relative
];

pathsToCheck.forEach(p => {
  const isAbs = path.isAbsolute(p);
  console.log(`  ${p}`);
  console.log(`    Absolute: ${isAbs}`);
});
console.log();

// 10. Building portable configuration paths
console.log('10. Practical example - Portable config loading:\n');

class ConfigLoader {
  constructor() {
    this.configDir = path.join(__dirname, 'config');
  }

  getConfigPath(filename) {
    return path.join(this.configDir, filename);
  }

  loadConfig(filename) {
    const fullPath = this.getConfigPath(filename);
    console.log(`    Loading: ${fullPath}`);
    return fullPath;
  }
}

const loader = new ConfigLoader();
loader.loadConfig('database.json');
loader.loadConfig('server.json');
console.log();

// 11. Handling user-provided paths safely
console.log('11. Validating user-provided paths:\n');

function isPathSafe(basePath, userPath) {
  // Normalize and resolve
  const resolvedBase = path.resolve(basePath);
  const resolvedUser = path.resolve(basePath, userPath);

  // Check if user path is within base path
  const isSafe = resolvedUser.startsWith(resolvedBase + path.sep) ||
                 resolvedUser === resolvedBase;

  return isSafe;
}

const base = '/var/app/uploads';
const testPaths = [
  'file.txt',                    // Safe
  'folder/file.txt',             // Safe
  '../../../etc/passwd',         // Unsafe!
  'normal.jpg'                   // Safe
];

console.log(`  Base directory: ${base}`);
testPaths.forEach(userPath => {
  const safe = isPathSafe(base, userPath);
  const indicator = safe ? '✅' : '❌';
  console.log(`  ${indicator} ${userPath.padEnd(25)} -> ${safe ? 'Safe' : 'UNSAFE!'}`);
});
console.log();

// 12. Best practices summary
console.log('12. ✅ Cross-Platform Best Practices:\n');

console.log('  DO:');
console.log('    ✓ Use path.join() to combine path segments');
console.log('    ✓ Use path.resolve() for absolute paths');
console.log('    ✓ Use __dirname for file-relative paths');
console.log('    ✓ Use path.normalize() on user input');
console.log('    ✓ Use path.parse() and path.format() for manipulation');
console.log('    ✓ Test on multiple platforms if possible');
console.log();

console.log('  DON\'T:');
console.log('    ✗ Hardcode separators (/ or \\)');
console.log('    ✗ Use string concatenation for paths');
console.log('    ✗ Assume case sensitivity behavior');
console.log('    ✗ Assume all paths have drive letters');
console.log('    ✗ Trust user input without validation');
console.log();

// 13. Testing paths
console.log('13. Testing example:\n');

function testPathOperation(description, operation) {
  try {
    const result = operation();
    console.log(`  ✅ ${description}`);
    console.log(`     Result: ${result}`);
    return result;
  } catch (error) {
    console.log(`  ❌ ${description}`);
    console.log(`     Error: ${error.message}`);
    return null;
  }
}

testPathOperation(
  'Join with __dirname',
  () => path.join(__dirname, 'config', 'app.json')
);

testPathOperation(
  'Resolve relative path',
  () => path.resolve('data', 'users.json')
);

testPathOperation(
  'Parse complex path',
  () => JSON.stringify(path.parse('/var/www/html/index.html'))
);

console.log();

console.log('Remember: The path module handles all platform differences!');
console.log('Use it consistently, and your code will work everywhere.');
