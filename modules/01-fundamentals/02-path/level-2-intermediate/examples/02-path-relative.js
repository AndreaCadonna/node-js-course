/**
 * Example 2: Using path.relative()
 *
 * Demonstrates how to calculate relative paths between two locations.
 * path.relative(from, to) returns the relative path needed to get from
 * 'from' to 'to'.
 *
 * Key Points:
 * - Returns the relative path from one location to another
 * - Both arguments should be absolute paths (or both relative)
 * - Result shows how to navigate from first path to second
 * - Very useful for creating import statements
 * - Empty string returned if paths are the same
 */

const path = require('path');

console.log('=== Path.relative() Basics ===\n');

// 1. Basic relative path calculation
console.log('1. Basic relative path:');
const from1 = '/data/users';
const to1 = '/data/photos';
const relative1 = path.relative(from1, to1);
console.log(`  From: '${from1}'`);
console.log(`  To:   '${to1}'`);
console.log(`  Relative path: '${relative1}'`);
console.log(`  Explanation: Go up one level (..) then into photos\n`);

// 2. Same directory
console.log('2. Same directory:');
const from2 = '/data/users';
const to2 = '/data/users';
const relative2 = path.relative(from2, to2);
console.log(`  From: '${from2}'`);
const displayRelative2 = relative2 || '(empty string)';
console.log(`  To:   '${to2}'`);
console.log(`  Relative path: '${displayRelative2}'`);
console.log(`  Explanation: Same location, no path needed\n`);

// 3. File in same directory
console.log('3. File in same directory:');
const from3 = '/data/users/john.txt';
const to3 = '/data/users/jane.txt';
const relative3 = path.relative(from3, to3);
console.log(`  From: '${from3}'`);
console.log(`  To:   '${to3}'`);
console.log(`  Relative path: '${relative3}'`);
console.log(`  Explanation: Both in same directory\n`);

// 4. Nested directory
console.log('4. Going into nested directory:');
const from4 = '/project/src';
const to4 = '/project/src/components/Button.js';
const relative4 = path.relative(from4, to4);
console.log(`  From: '${from4}'`);
console.log(`  To:   '${to4}'`);
console.log(`  Relative path: '${relative4}'`);
console.log(`  Explanation: Navigate into subdirectory\n`);

// 5. Going up and across
console.log('5. Going up and across directories:');
const from5 = '/project/src/components';
const to5 = '/project/lib/utils';
const relative5 = path.relative(from5, to5);
console.log(`  From: '${from5}'`);
console.log(`  To:   '${to5}'`);
console.log(`  Relative path: '${relative5}'`);
console.log(`  Explanation: Up two levels, then into lib/utils\n`);

// 6. Completely different trees
console.log('6. Different directory trees:');
const from6 = '/var/www/html';
const to6 = '/usr/local/bin';
const relative6 = path.relative(from6, to6);
console.log(`  From: '${from6}'`);
console.log(`  To:   '${to6}'`);
console.log(`  Relative path: '${relative6}'`);
console.log(`  Explanation: Go to common ancestor (root) then navigate\n`);

// 7. Using with __dirname
console.log('7. Real-world: Relative to current file');
const currentDir = __dirname;
const targetFile = path.join(__dirname, '..', 'level-1-basics', 'examples', '01-path-join.js');
const relative7 = path.relative(currentDir, targetFile);
console.log(`  Current directory: '${currentDir}'`);
console.log(`  Target file: '${targetFile}'`);
console.log(`  Relative path: '${relative7}'`);
console.log(`  Explanation: Path from current file to another\n`);

// 8. Creating import statements
console.log('8. Practical: Creating import statements');
function createImportPath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relative = path.relative(fromDir, toFile);

  // Remove file extension
  const withoutExt = relative.replace(/\.[^/.]+$/, '');

  // Ensure it starts with ./ for relative imports
  if (!withoutExt.startsWith('.')) {
    return './' + withoutExt;
  }

  return withoutExt;
}

const file1 = '/project/src/components/Button.js';
const file2 = '/project/src/utils/helpers.js';
const importPath = createImportPath(file1, file2);
console.log(`  From file: '${file1}'`);
console.log(`  To file:   '${file2}'`);
console.log(`  Import statement: import { helper } from '${importPath}';`);
console.log();

// 9. Working with relative paths (not recommended)
console.log('9. ⚠️  Using relative paths (not recommended):');
const fromRel = 'src/components';
const toRel = 'src/utils';
const relativeRel = path.relative(fromRel, toRel);
console.log(`  From: '${fromRel}'`);
console.log(`  To:   '${toRel}'`);
console.log(`  Result: '${relativeRel}'`);
console.log(`  Warning: Results depend on current working directory!`);
console.log(`  Better: Use absolute paths with path.resolve()\n`);

// 10. Platform differences
console.log('10. Platform-specific behavior:');
console.log(`  Current platform: ${process.platform}`);

if (process.platform === 'win32') {
  // Windows examples
  console.log('  Windows drive letters:');
  const fromWin = 'C:\\Users\\john';
  const toWin = 'D:\\Data\\files';
  const relativeWin = path.relative(fromWin, toWin);
  console.log(`    From: '${fromWin}'`);
  console.log(`    To:   '${toWin}'`);
  console.log(`    Result: '${relativeWin}'`);
  console.log(`    Note: Different drives return absolute path!`);
} else {
  console.log('  Unix/Linux paths use forward slashes');
  console.log('  No drive letters to complicate things');
}
console.log();

// 11. Edge cases
console.log('11. Edge cases:');

// Root paths
const fromRoot = '/';
const toRoot = '/usr/local';
const relativeRoot = path.relative(fromRoot, toRoot);
console.log(`  From root to directory:`);
console.log(`    From: '${fromRoot}'`);
console.log(`    To:   '${toRoot}'`);
console.log(`    Result: '${relativeRoot}'`);
console.log();

// To root
const fromDir = '/usr/local';
const toRootPath = '/';
const relativeToRoot = path.relative(fromDir, toRootPath);
console.log(`  From directory to root:`);
console.log(`    From: '${fromDir}'`);
console.log(`    To:   '${toRootPath}'`);
console.log(`    Result: '${relativeToRoot}'`);
console.log();

// 12. Common mistake: Wrong order
console.log('12. ❌ Common mistake - wrong argument order:');
const source = '/project/src/components';
const target = '/project/lib/utils';
const wrong = path.relative(target, source); // Backwards!
const correct = path.relative(source, target);
console.log(`  Source: '${source}'`);
console.log(`  Target: '${target}'`);
console.log(`  Wrong:   path.relative(target, source) = '${wrong}'`);
console.log(`  Correct: path.relative(source, target) = '${correct}'`);
console.log(`  Remember: relative(from, to) - where you ARE to where you WANT\n`);

// 13. Building relative URL paths
console.log('13. Practical: Building relative URL paths');
function buildRelativeURL(fromURL, toURL) {
  // Convert URLs to path-like strings
  const fromPath = fromURL.replace(/^https?:\/\/[^\/]+/, '');
  const toPath = toURL.replace(/^https?:\/\/[^\/]+/, '');

  const relative = path.relative(
    path.dirname(fromPath),
    toPath
  );

  return relative;
}

const currentPage = 'https://example.com/docs/api/users.html';
const linkedPage = 'https://example.com/docs/guides/intro.html';
const relativeURL = buildRelativeURL(currentPage, linkedPage);
console.log(`  Current page: ${currentPage}`);
console.log(`  Linked page:  ${linkedPage}`);
console.log(`  Relative URL: ${relativeURL}`);
console.log();

// 14. Finding common path components
console.log('14. Understanding the path relationship:');
function explainRelativePath(from, to) {
  const relative = path.relative(from, to);
  const upLevels = (relative.match(/\.\./g) || []).length;

  console.log(`  From: ${from}`);
  console.log(`  To:   ${to}`);
  console.log(`  Relative: ${relative}`);

  if (relative === '') {
    console.log(`  Relationship: Same location`);
  } else if (!relative.includes('..')) {
    console.log(`  Relationship: Target is a descendant`);
  } else if (upLevels > 0) {
    console.log(`  Relationship: Go up ${upLevels} level(s), then navigate`);
  }
  console.log();
}

explainRelativePath('/a/b/c', '/a/b/c');
explainRelativePath('/a/b/c', '/a/b/c/d/e');
explainRelativePath('/a/b/c/d', '/a/x/y');

// 15. When to use path.relative()
console.log('15. When to use path.relative():');
console.log('  ✅ Creating import/require statements');
console.log('  ✅ Building relative links in documentation');
console.log('  ✅ Displaying paths relative to project root');
console.log('  ✅ Calculating path relationships');
console.log('  ✅ Build tools that transform file references');
console.log('  ⚠️  Always use absolute paths as arguments');
console.log('  ⚠️  Remember the order: relative(from, to)');
