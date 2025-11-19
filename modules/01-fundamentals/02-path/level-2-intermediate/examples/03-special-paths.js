/**
 * Example 3: Special Path Characters
 *
 * Demonstrates handling of special path characters and markers.
 * Understanding ., .., ~, and other special path components.
 *
 * Key Points:
 * - . means "current directory"
 * - .. means "parent directory"
 * - ~ means "home directory" (shell convention, not Node.js built-in)
 * - Multiple consecutive special characters have specific behaviors
 * - Platform-specific special characters exist
 */

const path = require('path');
const os = require('os');

console.log('=== Special Path Characters ===\n');

// 1. Current directory (.)
console.log('1. Current directory (.) marker:');
const current1 = './file.txt';
const current2 = 'folder/./file.txt';
const current3 = './././file.txt';
console.log(`  './file.txt' is same as 'file.txt'`);
console.log(`    Normalized: '${path.normalize(current1)}'`);
console.log(`  'folder/./file.txt' is same as 'folder/file.txt'`);
console.log(`    Normalized: '${path.normalize(current2)}'`);
console.log(`  './././file.txt' - multiple dots:`);
console.log(`    Normalized: '${path.normalize(current3)}'`);
console.log(`  Rule: . means "this directory" and is usually removed\n`);

// 2. Parent directory (..)
console.log('2. Parent directory (..) marker:');
const parent1 = '../file.txt';
const parent2 = 'folder/../file.txt';
const parent3 = 'a/b/../../c';
console.log(`  '../file.txt' - go up one level`);
console.log(`    Normalized: '${path.normalize(parent1)}'`);
console.log(`  'folder/../file.txt' - go into folder then back out`);
console.log(`    Normalized: '${path.normalize(parent2)}'`);
console.log(`  'a/b/../../c' - go up two levels`);
console.log(`    Normalized: '${path.normalize(parent3)}'`);
console.log(`  Rule: .. cancels out the previous directory component\n`);

// 3. Combining . and ..
console.log('3. Combining . and ..:');
const combined1 = './folder/../file.txt';
const combined2 = 'a/./b/../c/./d';
console.log(`  './folder/../file.txt'`);
console.log(`    Step by step: . is removed → 'folder/../file.txt'`);
console.log(`                  folder/.. cancel → 'file.txt'`);
console.log(`    Normalized: '${path.normalize(combined1)}'`);
console.log(`  'a/./b/../c/./d'`);
console.log(`    Normalized: '${path.normalize(combined2)}'`);
console.log();

// 4. Multiple consecutive ..
console.log('4. Multiple consecutive parent markers:');
const multi1 = 'a/b/c/../../d';
const multi2 = '../../file.txt';
const multi3 = 'a/b/c/../../../d';
console.log(`  'a/b/c/../../d' - two levels up from c`);
console.log(`    Normalized: '${path.normalize(multi1)}'`);
console.log(`  '../../file.txt' - can't go above relative root`);
console.log(`    Normalized: '${path.normalize(multi2)}'`);
console.log(`  'a/b/c/../../../d' - three levels up (all the way)`);
console.log(`    Normalized: '${path.normalize(multi3)}'`);
console.log();

// 5. Edge case: More .. than levels
console.log('5. Edge case: More .. than directory levels:');
const tooMany = 'a/../../../b';
console.log(`  'a/../../../b' - trying to go up 3 from depth 1`);
console.log(`    Normalized: '${path.normalize(tooMany)}'`);
console.log(`    Result: Extra .. are preserved, path goes "above" start\n`);

// 6. Absolute paths with special characters
console.log('6. Special characters in absolute paths:');
const abs1 = '/a/./b/../c';
const abs2 = '/home/user/../../root';
console.log(`  '/a/./b/../c'`);
console.log(`    Normalized: '${path.normalize(abs1)}'`);
console.log(`  '/home/user/../../root'`);
console.log(`    Normalized: '${path.normalize(abs2)}'`);
console.log(`  Note: .. can go up to root (/) but not beyond\n`);

// 7. Home directory (~) - NOT built into path module
console.log('7. Home directory (~) - Shell convention:');
console.log(`  Important: ~ is NOT handled by Node.js path module!`);
console.log(`  ~ is expanded by Unix shells, not by Node.js\n`);

// Manual ~ expansion
function expandTilde(filepath) {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

const tildeExample = '~/documents/file.txt';
console.log(`  Path with ~: '${tildeExample}'`);
console.log(`  path.normalize() result: '${path.normalize(tildeExample)}'`);
console.log(`  Manual expansion: '${expandTilde(tildeExample)}'`);
console.log(`  Actual home directory: '${os.homedir()}'`);
console.log();

// 8. Trailing slashes
console.log('8. Trailing slashes and special characters:');
const trailing1 = 'folder/.';
const trailing2 = 'folder/..';
const trailing3 = './folder/';
console.log(`  'folder/.' - current dir of folder`);
console.log(`    Normalized: '${path.normalize(trailing1)}'`);
console.log(`  'folder/..' - parent of folder`);
console.log(`    Normalized: '${path.normalize(trailing2)}'`);
console.log(`  './folder/' - current then into folder with trailing slash`);
console.log(`    Normalized: '${path.normalize(trailing3)}'`);
console.log();

// 9. Empty path segments
console.log('9. Empty path segments:');
const empty1 = 'folder//./file.txt';
const empty2 = 'a/b///c';
console.log(`  'folder//./file.txt' - double slash with .`);
console.log(`    Normalized: '${path.normalize(empty1)}'`);
console.log(`  'a/b///c' - triple slash`);
console.log(`    Normalized: '${path.normalize(empty2)}'`);
console.log(`  Rule: Multiple slashes are treated as one\n`);

// 10. Special characters at the start
console.log('10. Special characters at path start:');
const start1 = '.';
const start2 = '..';
const start3 = './';
const start4 = '../';
console.log(`  '.' alone → '${path.normalize(start1)}' (current directory)`);
console.log(`  '..' alone → '${path.normalize(start2)}' (parent directory)`);
console.log(`  './' → '${path.normalize(start3)}' (current directory)`);
console.log(`  '../' → '${path.normalize(start4)}' (parent directory)`);
console.log();

// 11. Resolution behavior with special characters
console.log('11. path.resolve() behavior with special characters:');
const resolved1 = path.resolve('.');
const resolved2 = path.resolve('..');
const resolved3 = path.resolve('./file.txt');
console.log(`  path.resolve('.') → Current working directory`);
console.log(`    '${resolved1}'`);
console.log(`  path.resolve('..') → Parent of working directory`);
console.log(`    '${resolved2}'`);
console.log(`  path.resolve('./file.txt') → File in current directory`);
console.log(`    '${resolved3}'`);
console.log();

// 12. Common patterns with special characters
console.log('12. Common patterns:');

// Pattern 1: Sibling directory
const sibling = '../sibling/file.txt';
console.log(`  Sibling directory: '${sibling}'`);
console.log(`    From: /current/directory/`);
console.log(`    Goes to: /current/sibling/file.txt`);

// Pattern 2: Current directory file
const currentFile = './file.txt';
console.log(`  Current directory file: '${currentFile}'`);
console.log(`    Explicit current directory reference`);

// Pattern 3: Parent directory file
const parentFile = '../config.json';
console.log(`  Parent directory file: '${parentFile}'`);
console.log(`    One level up from current location`);
console.log();

// 13. Security implications
console.log('13. ⚠️  Security: Path traversal with special characters:');
const malicious1 = '../../etc/passwd';
const malicious2 = './uploads/../../../sensitive/data.txt';
console.log(`  Malicious input: '${malicious1}'`);
console.log(`    Normalized: '${path.normalize(malicious1)}'`);
console.log(`    Risk: Could escape intended directory!`);
console.log(`  Malicious input: '${malicious2}'`);
console.log(`    Normalized: '${path.normalize(malicious2)}'`);
console.log(`    Always validate paths from user input!\n`);

// Safe path validation
function isPathSafe(basePath, userPath) {
  const base = path.resolve(basePath);
  const target = path.resolve(basePath, userPath);

  return target.startsWith(base + path.sep) || target === base;
}

const baseDir = '/app/uploads';
const safePath = 'images/photo.jpg';
const unsafePath = '../../etc/passwd';

console.log(`  Base directory: '${baseDir}'`);
console.log(`  Safe path: '${safePath}' → ${isPathSafe(baseDir, safePath) ? '✓ Safe' : '✗ Unsafe'}`);
console.log(`  Unsafe path: '${unsafePath}' → ${isPathSafe(baseDir, unsafePath) ? '✓ Safe' : '✗ Unsafe'}`);
console.log();

// 14. Platform-specific special characters
console.log('14. Platform-specific considerations:');
console.log(`  Current platform: ${process.platform}`);

if (process.platform === 'win32') {
  console.log('  Windows special paths:');
  console.log('    . and .. work the same');
  console.log('    \\ is the separator (but / also works)');
  console.log('    Drive letters: C:, D:, etc.');
  console.log('    UNC paths: \\\\server\\share');
} else {
  console.log('  Unix/Linux special paths:');
  console.log('    . and .. work as described');
  console.log('    / is the separator');
  console.log('    ~ is shell-expanded (not by Node.js)');
  console.log('    Hidden files start with .');
}
console.log();

// 15. Best practices
console.log('15. Best practices with special characters:');
console.log('  ✅ Always normalize paths with special characters');
console.log('  ✅ Use path.join() to handle . and .. automatically');
console.log('  ✅ Validate user input that contains .. or .');
console.log('  ✅ Manually expand ~ if needed (not automatic)');
console.log('  ✅ Test with edge cases (multiple .., empty paths)');
console.log('  ❌ Don\'t assume . and .. behave like in shells');
console.log('  ❌ Don\'t trust user input with .. without validation');
console.log('  ❌ Don\'t rely on ~ expansion in Node.js paths');
