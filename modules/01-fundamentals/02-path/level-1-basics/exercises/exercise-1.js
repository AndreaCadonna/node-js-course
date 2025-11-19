/**
 * Exercise 1: Join Multiple Path Segments
 *
 * Task:
 * Write a function that takes an array of path segments and returns
 * a properly joined path that works on all platforms.
 *
 * Requirements:
 * - Use path.join() to combine segments
 * - Handle empty segments gracefully
 * - Return a cross-platform compatible path
 *
 * Example:
 * joinPathSegments(['users', 'john', 'documents', 'file.txt'])
 * should return: 'users/john/documents/file.txt' (Unix) or 'users\\john\\documents\\file.txt' (Windows)
 */

const path = require('path');

function joinPathSegments(segments) {
  // TODO: Implement this function
  // Hint: Use path.join() with the spread operator
}

// Test cases
console.log('Testing joinPathSegments:\n');

const testCases = [
  ['users', 'john', 'documents'],
  ['var', 'www', 'html', 'index.html'],
  ['config', 'app.json'],
  ['folder', 'subfolder', '..', 'file.txt'],
  []
];

testCases.forEach(segments => {
  const result = joinPathSegments(segments);
  console.log(`Input: [${segments.map(s => `'${s}'`).join(', ')}]`);
  console.log(`Output: ${result}`);
  console.log();
});

// Expected output (Unix):
// Input: ['users', 'john', 'documents']
// Output: users/john/documents
//
// Input: ['var', 'www', 'html', 'index.html']
// Output: var/www/html/index.html
//
// Input: ['config', 'app.json']
// Output: config/app.json
//
// Input: ['folder', 'subfolder', '..', 'file.txt']
// Output: folder/file.txt
//
// Input: []
// Output: .
