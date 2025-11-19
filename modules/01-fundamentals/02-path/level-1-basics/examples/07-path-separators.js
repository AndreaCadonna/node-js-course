/**
 * Example 7: Path Separators and Delimiters
 *
 * Demonstrates path.sep (path separator) and path.delimiter (path list delimiter).
 * Understanding these is crucial for cross-platform compatibility.
 *
 * Key Points:
 * - path.sep: separator between path segments (/ or \)
 * - path.delimiter: separator in PATH environment variable (; or :)
 * - These are platform-specific
 * - Usually don't need to use them directly (use path methods instead)
 */

const path = require('path');

console.log('=== Path Separators and Delimiters ===\n');

// 1. Current platform information
console.log('1. Current platform:\n');
console.log(`  Platform: ${process.platform}`);
console.log(`  Path separator (path.sep): "${path.sep}"`);
console.log(`  Path delimiter (path.delimiter): "${path.delimiter}"`);
console.log();

// 2. Understanding path.sep
console.log('2. path.sep - Path segment separator:\n');

console.log('  What it is:');
console.log('    - Unix/Linux/Mac: "/"');
console.log('    - Windows: "\\"');
console.log();

console.log('  Current system:', path.sep);
console.log();

console.log('  Example usage:');
const pathString = '/home/user/documents';
const segments = pathString.split(path.sep);
console.log(`    Path: ${pathString}`);
console.log(`    Split by separator:`, segments.filter(s => s)); // Filter empty
console.log();

// 3. Building paths with sep (not recommended)
console.log('3. Using path.sep (usually not recommended):\n');

// Manual path building with sep
const manual = ['home', 'user', 'documents'].join(path.sep);
console.log(`  Manual: ["home", "user", "documents"].join(path.sep)`);
console.log(`  Result: ${manual}`);

// Better approach with path.join
const better = path.join('home', 'user', 'documents');
console.log(`  Better: path.join("home", "user", "documents")`);
console.log(`  Result: ${better}`);
console.log('  Recommendation: Use path.join() instead of path.sep');
console.log();

// 4. Understanding path.delimiter
console.log('4. path.delimiter - Path list delimiter:\n');

console.log('  What it is:');
console.log('    - Unix/Linux/Mac: ":"');
console.log('    - Windows: ";"');
console.log();

console.log('  Current system:', path.delimiter);
console.log();

console.log('  Used in PATH environment variable:');
const pathEnv = process.env.PATH;
if (pathEnv) {
  const paths = pathEnv.split(path.delimiter);
  console.log('  First 5 paths in PATH:');
  paths.slice(0, 5).forEach((p, i) => {
    console.log(`    ${i + 1}. ${p}`);
  });
  console.log(`    ... and ${paths.length - 5} more`);
}
console.log();

// 5. Practical example: Parsing PATH environment variable
console.log('5. Practical example - Parse PATH variable:\n');

function getPATHDirectories() {
  const pathEnv = process.env.PATH || '';
  return pathEnv.split(path.delimiter).filter(p => p.length > 0);
}

const pathDirs = getPATHDirectories();
console.log(`  Found ${pathDirs.length} directories in PATH`);
console.log('  First 3:');
pathDirs.slice(0, 3).forEach(dir => console.log(`    - ${dir}`));
console.log();

// 6. Practical example: Building PATH-like string
console.log('6. Practical example - Build PATH-like string:\n');

function buildPathString(directories) {
  return directories.join(path.delimiter);
}

const customPaths = [
  '/usr/local/bin',
  '/usr/bin',
  '/bin'
];

const pathString2 = buildPathString(customPaths);
console.log('  Input directories:', customPaths);
console.log('  PATH string:', pathString2);
console.log();

// 7. Cross-platform path splitting
console.log('7. Splitting paths correctly:\n');

const testPath = '/home/user/documents/file.txt';
console.log(`  Path: ${testPath}`);

// Split by separator
const parts = testPath.split(path.sep).filter(p => p);
console.log('  Segments:', parts);
console.log();

// 8. Platform-specific examples
console.log('8. Platform-specific behavior:\n');

console.log('  On Unix/Linux/Mac:');
console.log('    path.sep = "/"');
console.log('    path.delimiter = ":"');
console.log('    Example path: /usr/local/bin');
console.log('    Example PATH: /usr/bin:/bin:/usr/local/bin');
console.log();

console.log('  On Windows:');
console.log('    path.sep = "\\\\"');
console.log('    path.delimiter = ";"');
console.log('    Example path: C:\\\\Program Files\\\\App');
console.log('    Example PATH: C:\\\\Windows;C:\\\\Windows\\\\System32');
console.log();

// 9. Why you rarely need these directly
console.log('9. Why you rarely need sep and delimiter directly:\n');

console.log('  Instead of using path.sep:');
console.log('    ❌ Don\'t: parts.join(path.sep)');
console.log('    ✅ Do: path.join(...parts)');
console.log();

console.log('  Instead of hardcoding:');
console.log('    ❌ Don\'t: "dir/file" or "dir\\\\file"');
console.log('    ✅ Do: path.join("dir", "file")');
console.log();

console.log('  path.delimiter is mainly for:');
console.log('    - Parsing PATH environment variable');
console.log('    - Building path lists');
console.log();

// 10. When to use path.sep
console.log('10. Legitimate uses of path.sep:\n');

console.log('  a) Splitting a path string:');
const split = '/home/user/file.txt'.split(path.sep);
console.log(`     ${split.filter(s => s)}`);

console.log('  b) Checking if path uses separators:');
const hasSep = '/home/user'.includes(path.sep);
console.log(`     Path has separator: ${hasSep}`);

console.log('  c) Normalizing separators in user input:');
const userInput = 'some/path/with/mixed\\separators';
const normalized = userInput.split(/[/\\]/).join(path.sep);
console.log(`     Input: ${userInput}`);
console.log(`     Normalized: ${normalized}`);
console.log();

// 11. POSIX vs Windows
console.log('11. Forcing platform-specific behavior:\n');

console.log('  Current platform sep:', path.sep);
console.log('  Force POSIX sep:', path.posix.sep);
console.log('  Force Windows sep:', path.win32.sep);
console.log();

console.log('  Current platform delimiter:', path.delimiter);
console.log('  Force POSIX delimiter:', path.posix.delimiter);
console.log('  Force Windows delimiter:', path.win32.delimiter);
console.log();

// 12. Summary
console.log('12. Summary:\n');
console.log('  path.sep:');
console.log('    - Separates path segments (/ or \\)');
console.log('    - Use path.join() instead of manual concatenation');
console.log();

console.log('  path.delimiter:');
console.log('    - Separates paths in PATH variable (: or ;)');
console.log('    - Useful for parsing/building PATH strings');
console.log();

console.log('  Best practice:');
console.log('    - Let path module methods handle separators');
console.log('    - Avoid hardcoding separators in your code');
console.log('    - Your code will work on all platforms!');
