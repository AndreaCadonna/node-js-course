/**
 * Exercise 1: Implement a Simple Glob Pattern Matcher
 *
 * Task:
 * Create a glob pattern matcher that supports *, **, ?, and [...] patterns.
 * This is commonly used in build tools, file selection, and configuration systems.
 *
 * Requirements:
 * - Support * (matches any characters except /)
 * - Support ** (matches any characters including /)
 * - Support ? (matches exactly one character)
 * - Support [...] character sets (e.g., [0-9], [abc])
 * - Support negation patterns with !
 * - Handle case sensitivity option
 *
 * Bonus:
 * - Support brace expansion {a,b,c}
 * - Optimize for performance with caching
 * - Support multiple patterns with exclusions
 */

const path = require('path');

/**
 * Convert a glob pattern to a regular expression
 * @param {string} pattern - Glob pattern (e.g., '**/*.js')
 * @returns {RegExp} - Compiled regular expression
 */
function globToRegex(pattern) {
  // TODO: Implement glob to regex conversion
  // Hints:
  // - Replace ** with a placeholder first to avoid conflicts
  // - Replace * with [^/]* (matches any except /)
  // - Replace ** placeholder with .* (matches any including /)
  // - Replace ? with [^/] (matches one character)
  // - Keep [...] as-is (it's already regex)
  // - Escape other special regex characters
}

/**
 * Test if a filepath matches a glob pattern
 * @param {string} pattern - Glob pattern
 * @param {string} filepath - Path to test
 * @param {object} options - Options {caseSensitive: boolean}
 * @returns {boolean} - True if matches
 */
function matchGlob(pattern, filepath, options = {}) {
  // TODO: Implement glob matching
  // Hints:
  // - Use globToRegex to convert pattern
  // - Apply case sensitivity option
  // - Test the filepath against the regex
}

/**
 * Match multiple patterns with exclusions
 * @param {string[]} patterns - Array of patterns (use ! prefix for exclusions)
 * @param {string} filepath - Path to test
 * @param {object} options - Options
 * @returns {boolean} - True if matches any include and no exclude patterns
 */
function matchMultiGlob(patterns, filepath, options = {}) {
  // TODO: Implement multi-pattern matching
  // Hints:
  // - Separate patterns into includes and excludes (! prefix)
  // - Check if filepath matches any include pattern
  // - Check if filepath matches any exclude pattern
  // - Return true only if included and not excluded
}

/**
 * GlobMatcher class for reusable pattern matching
 */
class GlobMatcher {
  constructor(pattern, options = {}) {
    // TODO: Initialize the matcher
    // Store pattern, compile regex, store options
  }

  test(filepath) {
    // TODO: Test if filepath matches the pattern
  }

  match(filepaths) {
    // TODO: Filter an array of filepaths that match the pattern
  }
}

// Test cases
console.log('=== Exercise 1: Glob Pattern Matcher ===\n');

console.log('Test 1: Basic Patterns');
const basicTests = [
  { pattern: '*.js', path: 'app.js', expected: true },
  { pattern: '*.js', path: 'lib/app.js', expected: false },
  { pattern: '**/*.js', path: 'lib/app.js', expected: true },
  { pattern: 'test-?.js', path: 'test-1.js', expected: true },
  { pattern: 'file[0-9].txt', path: 'file5.txt', expected: true }
];

basicTests.forEach(test => {
  const result = matchGlob(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} '${test.pattern}' vs '${test.path}' → ${result} (expected: ${test.expected})`);
});
console.log();

console.log('Test 2: Multi-Pattern with Exclusions');
const multiTests = [
  { patterns: ['**/*.js', '!**/test/**'], path: 'src/app.js', expected: true },
  { patterns: ['**/*.js', '!**/test/**'], path: 'test/spec.js', expected: false },
  { patterns: ['**/*.js', '!node_modules/**'], path: 'node_modules/pkg/index.js', expected: false }
];

multiTests.forEach(test => {
  const result = matchMultiGlob(test.patterns, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} ${JSON.stringify(test.patterns)} vs '${test.path}' → ${result}`);
});
console.log();

console.log('Test 3: GlobMatcher Class');
// TODO: Test your GlobMatcher class
// const matcher = new GlobMatcher('**/*.js');
// console.log(matcher.test('src/app.js'));
// console.log(matcher.match(['src/app.js', 'README.md', 'lib/util.js']));

console.log('\n💡 Tips:');
console.log('  • Use a placeholder (like §§) for ** to avoid conflicts during conversion');
console.log('  • Test with various pattern combinations');
console.log('  • Consider edge cases like empty patterns or paths');
console.log('  • Think about performance for repeated matches');
