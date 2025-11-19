/**
 * Example 2: Using path.resolve()
 *
 * Demonstrates how to use path.resolve() to create absolute paths.
 * path.resolve() resolves a sequence of paths into an absolute path.
 *
 * Key Points:
 * - Always returns an absolute path
 * - Starts from the rightmost path and works backwards
 * - Uses current working directory if result isn't absolute
 * - Different from path.join()
 */

const path = require('path');

console.log('=== Path.resolve() Basics ===\n');

// Current working directory
console.log('1. Current working directory:');
console.log(`  process.cwd(): ${process.cwd()}\n`);

// Basic resolve
console.log('2. Basic resolve (creates absolute path):');
const resolved1 = path.resolve('users', 'john', 'documents');
console.log(`  path.resolve('users', 'john', 'documents')`);
console.log(`  Result: ${resolved1}`);
console.log(`  Explanation: Resolves relative to current working directory\n`);

// Resolve with single argument
console.log('3. Resolve with single argument:');
const resolved2 = path.resolve('config.json');
console.log(`  path.resolve('config.json')`);
console.log(`  Result: ${resolved2}\n`);

// Resolve with absolute path
console.log('4. Resolve with absolute path:');
const resolved3 = path.resolve('/etc', 'config', 'app.json');
console.log(`  path.resolve('/etc', 'config', 'app.json')`);
console.log(`  Result: ${resolved3}`);
console.log(`  Explanation: When an absolute path is found, previous segments are ignored\n`);

// Multiple absolute paths
console.log('5. Multiple absolute paths (rightmost wins):');
const resolved4 = path.resolve('/foo', '/bar', 'baz');
console.log(`  path.resolve('/foo', '/bar', 'baz')`);
console.log(`  Result: ${resolved4}`);
console.log(`  Explanation: Starts from rightmost absolute path (/bar)\n`);

// Handling .. (parent directory)
console.log('6. Handling parent directory (..) :');
const resolved5 = path.resolve('folder', 'subfolder', '..', 'file.txt');
console.log(`  path.resolve('folder', 'subfolder', '..', 'file.txt')`);
console.log(`  Result: ${resolved5}`);
console.log(`  Explanation: Resolves .. to parent, then creates absolute path\n`);

// No arguments
console.log('7. No arguments (returns current directory):');
const resolved6 = path.resolve();
console.log(`  path.resolve()`);
console.log(`  Result: ${resolved6}`);
console.log(`  Same as: ${process.cwd()}\n`);

// Compare with path.join()
console.log('8. Compare resolve() vs join():');
const joined = path.join('users', 'john');
const resolved = path.resolve('users', 'john');
console.log(`  path.join('users', 'john'):`);
console.log(`    ${joined} (relative path)`);
console.log(`  path.resolve('users', 'john'):`);
console.log(`    ${resolved} (absolute path)\n`);

// Resolving from different starting points
console.log('9. Resolve sequence (right to left):');
const seq1 = path.resolve('a', 'b', 'c');
console.log(`  path.resolve('a', 'b', 'c')`);
console.log(`  Result: ${seq1}`);

const seq2 = path.resolve('a', '/b', 'c');
console.log(`  path.resolve('a', '/b', 'c')`);
console.log(`  Result: ${seq2}`);
console.log(`  Explanation: When /b is encountered, 'a' is discarded\n`);

// Practical use case
console.log('10. Practical example - Ensuring absolute paths:');
function getAbsolutePath(relativePath) {
  return path.resolve(relativePath);
}

console.log(`  User provides: "data/users.json"`);
console.log(`  Absolute path: ${getAbsolutePath('data/users.json')}`);
console.log(`  This ensures we always work with absolute paths\n`);

// Resolution algorithm demonstration
console.log('11. Understanding resolution algorithm:');
console.log('  path.resolve() works from right to left:');
console.log('  - Starts with an empty path');
console.log('  - Prepends each argument from right to left');
console.log('  - Stops when an absolute path is formed');
console.log('  - If still relative, prepends current working directory\n');

const demo1 = path.resolve('a', 'b');
const demo2 = path.resolve('/a', 'b');
const demo3 = path.resolve('a', '/b');
const demo4 = path.resolve('/a', '/b', 'c');

console.log(`  path.resolve('a', 'b')     = ${demo1}`);
console.log(`  path.resolve('/a', 'b')    = ${demo2}`);
console.log(`  path.resolve('a', '/b')    = ${demo3}`);
console.log(`  path.resolve('/a', '/b', 'c') = ${demo4}`);
