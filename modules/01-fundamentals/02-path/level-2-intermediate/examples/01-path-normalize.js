/**
 * Example 1: Using path.normalize()
 *
 * Demonstrates how to use path.normalize() to clean up messy paths.
 * Normalization removes redundant separators, resolves . and .. segments,
 * and creates a clean canonical path.
 *
 * Key Points:
 * - Removes redundant path separators (/// becomes /)
 * - Resolves . (current directory) segments
 * - Resolves .. (parent directory) segments
 * - Returns platform-appropriate path format
 * - Does NOT make paths absolute or verify they exist
 */

const path = require('path');

console.log('=== Path Normalization Basics ===\n');

// 1. Removing redundant separators
console.log('1. Redundant separators:');
const messy1 = 'users//john///documents';
const clean1 = path.normalize(messy1);
console.log(`  Input:  '${messy1}'`);
console.log(`  Output: '${clean1}'`);
console.log(`  Explanation: Multiple slashes collapsed to one\n`);

// 2. Resolving current directory (.)
console.log('2. Resolving current directory (.):');
const messy2 = './users/./john/./documents';
const clean2 = path.normalize(messy2);
console.log(`  Input:  '${messy2}'`);
console.log(`  Output: '${clean2}'`);
console.log(`  Explanation: . segments are removed (they mean "here")\n`);

// 3. Resolving parent directory (..)
console.log('3. Resolving parent directory (..):');
const messy3 = 'users/john/../jane/documents';
const clean3 = path.normalize(messy3);
console.log(`  Input:  '${messy3}'`);
console.log(`  Output: '${clean3}'`);
console.log(`  Explanation: .. goes up one level, canceling out 'john'\n`);

// 4. Complex path with everything
console.log('4. Complex path combining all issues:');
const messy4 = '/users//john/./documents/../photos/./vacation/';
const clean4 = path.normalize(messy4);
console.log(`  Input:  '${messy4}'`);
console.log(`  Output: '${clean4}'`);
console.log(`  Breakdown:`);
console.log(`    - Remove //: /users/john/./documents/../photos/./vacation/`);
console.log(`    - Remove .: /users/john/documents/../photos/vacation/`);
console.log(`    - Resolve ..: /users/john/photos/vacation/`);
console.log(`    - Remove trailing /: /users/john/photos/vacation/\n`);

// 5. Going up multiple levels
console.log('5. Multiple parent directory navigations:');
const messy5 = 'a/b/c/d/../../e';
const clean5 = path.normalize(messy5);
console.log(`  Input:  '${messy5}'`);
console.log(`  Output: '${clean5}'`);
console.log(`  Explanation: Two .. go up twice (cancel d and c)\n`);

// 6. Going up beyond root
console.log('6. Going up beyond root (.. at start):');
const messy6 = '../../../etc/config';
const clean6 = path.normalize(messy6);
console.log(`  Input:  '${messy6}'`);
console.log(`  Output: '${clean6}'`);
console.log(`  Explanation: Can't go above root, so .. are preserved\n`);

// 7. Absolute path normalization
console.log('7. Normalizing absolute paths:');
const messy7 = '/var//log/./app/../system.log';
const clean7 = path.normalize(messy7);
console.log(`  Input:  '${messy7}'`);
console.log(`  Output: '${clean7}'`);
console.log(`  Explanation: Same rules apply to absolute paths\n`);

// 8. Trailing slashes
console.log('8. Handling trailing slashes:');
const messy8a = 'folder/subfolder/';
const messy8b = 'folder/subfolder';
const clean8a = path.normalize(messy8a);
const clean8b = path.normalize(messy8b);
console.log(`  With trailing slash:    '${messy8a}' → '${clean8a}'`);
console.log(`  Without trailing slash: '${messy8b}' → '${clean8b}'`);
console.log(`  Note: Trailing slash is typically preserved\n`);

// 9. Empty and current directory
console.log('9. Edge cases - empty and current:');
const empty = '';
const current = '.';
const cleanEmpty = path.normalize(empty) || '(empty string)';
const cleanCurrent = path.normalize(current);
console.log(`  Empty string: '${empty}' → '${cleanEmpty}'`);
console.log(`  Current dir:  '${current}' → '${cleanCurrent}'`);
console.log(`  Note: Empty strings remain empty, . becomes .\n`);

// 10. Real-world example: User input
console.log('10. Real-world: Cleaning user input');
const userInputs = [
  'data//files//document.txt',
  './config/../settings.json',
  'uploads/./images/../../docs/file.pdf',
  '/var/www/html/../../log/app.log'
];

console.log('  User inputs before normalization:');
userInputs.forEach(input => {
  const normalized = path.normalize(input);
  console.log(`    '${input}'`);
  console.log(`    → '${normalized}'`);
});
console.log();

// 11. When normalization matters
console.log('11. Why normalization matters:');
console.log('  Without normalization, these are considered different:');
const same1 = 'data/files/doc.txt';
const same2 = 'data//files/./doc.txt';
console.log(`    '${same1}'`);
console.log(`    '${same2}'`);
console.log(`    Equal? ${same1 === same2}`); // false
console.log('  After normalization:');
console.log(`    '${path.normalize(same1)}'`);
console.log(`    '${path.normalize(same2)}'`);
console.log(`    Equal? ${path.normalize(same1) === path.normalize(same2)}'`); // true
console.log();

// 12. Platform-specific behavior
console.log('12. Platform-specific normalization:');
console.log(`  Current platform: ${process.platform}`);
console.log(`  Path separator: '${path.sep}'`);
const testPath = 'folder/subfolder/file.txt';
const normalized = path.normalize(testPath);
console.log(`  Input:  '${testPath}'`);
console.log(`  Output: '${normalized}'`);
console.log('  Note: On Windows, forward slashes become backslashes\n');

// 13. Important: What normalize() does NOT do
console.log('13. ❗ What normalize() does NOT do:');
console.log('  ❌ Does NOT make paths absolute');
console.log(`     'file.txt' → '${path.normalize('file.txt')}' (still relative)`);
console.log('  ❌ Does NOT check if path exists');
console.log(`     'nonexistent//file.txt' → '${path.normalize('nonexistent//file.txt')}' (still works)`);
console.log('  ❌ Does NOT resolve symbolic links');
console.log('     Use fs.realpathSync() for that\n');

// 14. Common use case: Comparing paths
console.log('14. Practical: Path comparison');
function pathsEqual(path1, path2) {
  return path.normalize(path1) === path.normalize(path2);
}

const pathA = 'data/./files/../documents/report.pdf';
const pathB = 'data/documents/report.pdf';
console.log(`  Path A: '${pathA}'`);
console.log(`  Path B: '${pathB}'`);
console.log(`  Are they equal? ${pathsEqual(pathA, pathB)}`);
console.log();

// 15. When to use normalize()
console.log('15. When to use normalize():');
console.log('  ✅ Before comparing paths for equality');
console.log('  ✅ After concatenating path strings (though use path.join instead)');
console.log('  ✅ When processing user input paths');
console.log('  ✅ When cleaning up paths from external sources');
console.log('  ✅ Before displaying paths to users');
console.log('  ⚠️  path.join() and path.resolve() already normalize!');
