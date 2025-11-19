/**
 * Example 1: Using path.join()
 *
 * Demonstrates how to use path.join() to combine path segments safely.
 * path.join() concatenates path segments and normalizes the resulting path.
 *
 * Key Points:
 * - Automatically uses correct separator for the OS
 * - Handles .. and . segments
 * - Doesn't create absolute paths unless first segment is absolute
 */

const path = require('path');

console.log('=== Path.join() Basics ===\n');

// Basic joining
console.log('1. Basic joining:');
const joined1 = path.join('users', 'john', 'documents');
console.log(`  path.join('users', 'john', 'documents')`);
console.log(`  Result: ${joined1}\n`);

// Joining with file
console.log('2. Joining directory and file:');
const joined2 = path.join('config', 'app.json');
console.log(`  path.join('config', 'app.json')`);
console.log(`  Result: ${joined2}\n`);

// Multiple segments
console.log('3. Multiple segments:');
const joined3 = path.join('var', 'www', 'html', 'public', 'index.html');
console.log(`  path.join('var', 'www', 'html', 'public', 'index.html')`);
console.log(`  Result: ${joined3}\n`);

// Handling relative paths
console.log('4. Handling relative paths (.. and .):');
const joined4 = path.join('folder', 'subfolder', '..', 'file.txt');
console.log(`  path.join('folder', 'subfolder', '..', 'file.txt')`);
console.log(`  Result: ${joined4}`);
console.log(`  Explanation: .. goes up one level, so subfolder is canceled out\n`);

const joined5 = path.join('folder', '.', 'file.txt');
console.log(`  path.join('folder', '.', 'file.txt')`);
console.log(`  Result: ${joined5}`);
console.log(`  Explanation: . represents current directory, so it's ignored\n`);

// Empty strings and handling
console.log('5. Handling empty strings:');
const joined6 = path.join('folder', '', 'file.txt');
console.log(`  path.join('folder', '', 'file.txt')`);
console.log(`  Result: ${joined6}`);
console.log(`  Explanation: Empty strings are ignored\n`);

// Starting with absolute path
console.log('6. Starting with absolute path:');
const joined7 = path.join('/var', 'log', 'app.log');
console.log(`  path.join('/var', 'log', 'app.log')`);
console.log(`  Result: ${joined7}\n`);

// Cross-platform demonstration
console.log('7. Cross-platform separator:');
console.log(`  Current OS: ${process.platform}`);
console.log(`  Path separator: ${path.sep}`);
console.log(`  Example result: ${path.join('a', 'b', 'c')}\n`);

// Practical example: Building config path
console.log('8. Practical example - Building paths:');
const baseDir = 'app';
const configDir = 'config';
const configFile = 'database.json';
const fullPath = path.join(baseDir, configDir, configFile);
console.log(`  Base: ${baseDir}`);
console.log(`  Config directory: ${configDir}`);
console.log(`  Config file: ${configFile}`);
console.log(`  Full path: ${fullPath}\n`);

// Why NOT to use string concatenation
console.log('9. ❌ Why NOT to use string concatenation:');
const wrong = 'folder' + '/' + 'file.txt';
console.log(`  Wrong: 'folder' + '/' + 'file.txt'`);
console.log(`  Result: ${wrong}`);
console.log(`  Problem: This uses / which won't work correctly on Windows!`);
console.log(`  ✅ Correct: path.join('folder', 'file.txt')`);
console.log(`  Result: ${path.join('folder', 'file.txt')}\n`);

// Common pattern: Multiple levels up
console.log('10. Going multiple levels up:');
const upTwo = path.join('a', 'b', 'c', '..', '..', 'd');
console.log(`  path.join('a', 'b', 'c', '..', '..', 'd')`);
console.log(`  Result: ${upTwo}`);
console.log(`  Explanation: Start with a/b/c, go up twice to a, then down to a/d`);
