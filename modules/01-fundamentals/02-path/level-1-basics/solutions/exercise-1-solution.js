/**
 * Solution: Exercise 1 - Join Multiple Path Segments
 */

const path = require('path');

function joinPathSegments(segments) {
  // Use spread operator with path.join()
  // path.join() handles empty arrays by returning '.'
  return path.join(...segments);
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

// Alternative solution with validation
function joinPathSegmentsValidated(segments) {
  // Filter out empty strings and null/undefined values
  const validSegments = segments.filter(seg => seg && typeof seg === 'string');
  return path.join(...validSegments);
}

console.log('With validation:');
const edgeCases = [
  ['users', '', 'documents'],  // Empty string
  ['users', null, 'documents'], // null value
  ['users', undefined, 'documents'] // undefined
];

edgeCases.forEach(segments => {
  const result = joinPathSegmentsValidated(segments);
  console.log(`Input: [${segments.map(s => s === null ? 'null' : s === undefined ? 'undefined' : `'${s}'`).join(', ')}]`);
  console.log(`Output: ${result}`);
});
