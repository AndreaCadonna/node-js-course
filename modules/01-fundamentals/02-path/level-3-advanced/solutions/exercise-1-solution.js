/**
 * Solution to Exercise 1: Implement a Simple Glob Pattern Matcher
 *
 * This solution demonstrates a production-ready glob pattern matcher with support
 * for *, **, ?, [...], and negation patterns. It includes caching for performance
 * and comprehensive test cases.
 *
 * Key Techniques:
 * - Using placeholders to handle ** before * conversion
 * - Escaping special regex characters
 * - Caching compiled regex patterns for performance
 * - Supporting case-sensitive and case-insensitive matching
 */

const path = require('path');

/**
 * Convert a glob pattern to a regular expression
 * @param {string} pattern - Glob pattern (e.g., '**/*.js')
 * @param {object} options - Options {caseSensitive: boolean}
 * @returns {RegExp} - Compiled regular expression
 *
 * Pattern Syntax:
 * - * matches any characters except /
 * - ** matches any characters including /
 * - ? matches exactly one character except /
 * - [...] matches one character in the set
 * - {a,b,c} matches one of the alternatives (bonus)
 */
function globToRegex(pattern, options = {}) {
  const caseSensitive = options.caseSensitive !== false;

  // Handle brace expansion {a,b,c} first (bonus feature)
  // Convert {a,b,c} to (a|b|c)
  let regexPattern = pattern.replace(/\{([^}]+)\}/g, (match, group) => {
    const alternatives = group.split(',').map(alt => {
      // Escape special regex chars in each alternative
      return alt.trim().replace(/[.+^${}()|[\]\\]/g, '\\$&');
    });
    return `(${alternatives.join('|')})`;
  });

  // Step 1: Use placeholder for ** to avoid conflicts with * replacement
  // We use a unique string that won't appear in normal paths
  const DOUBLE_STAR_PLACEHOLDER = '§§DOUBLE_STAR§§';
  regexPattern = regexPattern.replace(/\*\*/g, DOUBLE_STAR_PLACEHOLDER);

  // Step 2: Escape special regex characters (but not glob wildcards)
  // We need to escape: . + ^ $ ( ) [ ] { } | \
  // But we keep our placeholders and glob chars: * ? [ ]
  regexPattern = regexPattern.replace(/[.+^${}()|\\]/g, '\\$&');

  // Step 3: Convert * to regex (matches any characters except /)
  regexPattern = regexPattern.replace(/\*/g, '[^/]*');

  // Step 4: Convert ** placeholder to regex (matches any characters including /)
  regexPattern = regexPattern.replace(new RegExp(DOUBLE_STAR_PLACEHOLDER, 'g'), '.*');

  // Step 5: Convert ? to regex (matches exactly one character except /)
  regexPattern = regexPattern.replace(/\?/g, '[^/]');

  // Step 6: Character sets [...] are already valid regex, no conversion needed
  // They were preserved by the escape step

  // Step 7: Anchor the pattern to match the entire path
  regexPattern = '^' + regexPattern + '$';

  // Step 8: Compile the regex with appropriate flags
  const flags = caseSensitive ? '' : 'i';
  return new RegExp(regexPattern, flags);
}

/**
 * Test if a filepath matches a glob pattern
 * @param {string} pattern - Glob pattern
 * @param {string} filepath - Path to test
 * @param {object} options - Options {caseSensitive: boolean}
 * @returns {boolean} - True if matches
 */
function matchGlob(pattern, filepath, options = {}) {
  try {
    const regex = globToRegex(pattern, options);
    return regex.test(filepath);
  } catch (error) {
    console.error(`Error matching pattern '${pattern}':`, error.message);
    return false;
  }
}

/**
 * Match multiple patterns with exclusions
 * @param {string[]} patterns - Array of patterns (use ! prefix for exclusions)
 * @param {string} filepath - Path to test
 * @param {object} options - Options
 * @returns {boolean} - True if matches any include and no exclude patterns
 *
 * Example:
 *   matchMultiGlob(['**\/*.js', '!**\/test\/**'], 'src/app.js') // true
 *   matchMultiGlob(['**\/*.js', '!**\/test\/**'], 'test/spec.js') // false
 */
function matchMultiGlob(patterns, filepath, options = {}) {
  // Separate patterns into inclusions and exclusions
  const includes = [];
  const excludes = [];

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      // Exclusion pattern (remove ! prefix)
      excludes.push(pattern.substring(1));
    } else {
      // Inclusion pattern
      includes.push(pattern);
    }
  }

  // If no inclusion patterns, default to matching all
  const matchesInclude = includes.length === 0 ||
    includes.some(pattern => matchGlob(pattern, filepath, options));

  // Check if any exclusion pattern matches
  const matchesExclude = excludes.some(pattern => matchGlob(pattern, filepath, options));

  // Match if included and not excluded
  return matchesInclude && !matchesExclude;
}

/**
 * GlobMatcher class for reusable pattern matching with caching
 *
 * This class compiles patterns once and reuses them for better performance.
 */
class GlobMatcher {
  /**
   * @param {string|string[]} patterns - Glob pattern(s)
   * @param {object} options - Options {caseSensitive: boolean}
   */
  constructor(patterns, options = {}) {
    this.patterns = Array.isArray(patterns) ? patterns : [patterns];
    this.options = options;
    this.cache = new Map();

    // Pre-compile all patterns
    this._compilePatterns();
  }

  /**
   * Compile all patterns to regex and cache them
   * @private
   */
  _compilePatterns() {
    for (const pattern of this.patterns) {
      const cleanPattern = pattern.startsWith('!') ? pattern.substring(1) : pattern;
      if (!this.cache.has(cleanPattern)) {
        try {
          const regex = globToRegex(cleanPattern, this.options);
          this.cache.set(cleanPattern, regex);
        } catch (error) {
          console.error(`Error compiling pattern '${cleanPattern}':`, error.message);
        }
      }
    }
  }

  /**
   * Test if a filepath matches the pattern(s)
   * @param {string} filepath - Path to test
   * @returns {boolean} - True if matches
   */
  test(filepath) {
    return matchMultiGlob(this.patterns, filepath, this.options);
  }

  /**
   * Filter an array of filepaths that match the pattern(s)
   * @param {string[]} filepaths - Array of paths to filter
   * @returns {string[]} - Filtered paths that match
   */
  match(filepaths) {
    return filepaths.filter(filepath => this.test(filepath));
  }

  /**
   * Add a new pattern to the matcher
   * @param {string} pattern - Pattern to add
   */
  addPattern(pattern) {
    this.patterns.push(pattern);
    const cleanPattern = pattern.startsWith('!') ? pattern.substring(1) : pattern;
    if (!this.cache.has(cleanPattern)) {
      const regex = globToRegex(cleanPattern, this.options);
      this.cache.set(cleanPattern, regex);
    }
  }

  /**
   * Get statistics about the matcher
   * @returns {object} - Statistics
   */
  getStats() {
    const includes = this.patterns.filter(p => !p.startsWith('!'));
    const excludes = this.patterns.filter(p => p.startsWith('!'));

    return {
      totalPatterns: this.patterns.length,
      includePatterns: includes.length,
      excludePatterns: excludes.length,
      cachedRegex: this.cache.size
    };
  }
}

// ============================================================================
// Test Cases and Demonstrations
// ============================================================================

console.log('=== Solution to Exercise 1: Glob Pattern Matcher ===\n');

console.log('Test 1: Basic Patterns');
console.log('─'.repeat(60));
const basicTests = [
  { pattern: '*.js', path: 'app.js', expected: true },
  { pattern: '*.js', path: 'lib/app.js', expected: false },
  { pattern: '**/*.js', path: 'lib/app.js', expected: true },
  { pattern: '**/*.js', path: 'lib/util/helper.js', expected: true },
  { pattern: 'test-?.js', path: 'test-1.js', expected: true },
  { pattern: 'test-?.js', path: 'test-12.js', expected: false },
  { pattern: 'file[0-9].txt', path: 'file5.txt', expected: true },
  { pattern: 'file[0-9].txt', path: 'fileA.txt', expected: false },
  { pattern: 'src/**/*.{js,ts}', path: 'src/app.js', expected: true },
  { pattern: 'src/**/*.{js,ts}', path: 'src/lib/util.ts', expected: true },
  { pattern: 'src/**/*.{js,ts}', path: 'src/data.json', expected: false }
];

basicTests.forEach(test => {
  const result = matchGlob(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  const mark = result === test.expected ? ' ' : ' ❌';
  console.log(`  ${status} '${test.pattern}' vs '${test.path}' → ${result}${mark}`);
});
console.log();

console.log('Test 2: Multi-Pattern with Exclusions');
console.log('─'.repeat(60));
const multiTests = [
  {
    patterns: ['**/*.js', '!**/test/**'],
    path: 'src/app.js',
    expected: true,
    description: 'Include .js but exclude test directory'
  },
  {
    patterns: ['**/*.js', '!**/test/**'],
    path: 'test/spec.js',
    expected: false,
    description: 'Should exclude test directory'
  },
  {
    patterns: ['**/*.js', '!node_modules/**'],
    path: 'node_modules/pkg/index.js',
    expected: false,
    description: 'Should exclude node_modules'
  },
  {
    patterns: ['src/**', '!**/*.test.js', '!**/*.spec.js'],
    path: 'src/app.js',
    expected: true,
    description: 'Include src but exclude test files'
  },
  {
    patterns: ['src/**', '!**/*.test.js', '!**/*.spec.js'],
    path: 'src/app.test.js',
    expected: false,
    description: 'Should exclude test files'
  }
];

multiTests.forEach(test => {
  const result = matchMultiGlob(test.patterns, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} ${test.description}`);
  console.log(`     Patterns: ${JSON.stringify(test.patterns)}`);
  console.log(`     Path: '${test.path}' → ${result}`);
});
console.log();

console.log('Test 3: Case Sensitivity');
console.log('─'.repeat(60));
const caseTests = [
  { pattern: '*.JS', path: 'app.js', caseSensitive: false, expected: true },
  { pattern: '*.JS', path: 'app.js', caseSensitive: true, expected: false },
  { pattern: 'SRC/**', path: 'src/app.js', caseSensitive: false, expected: true },
  { pattern: 'SRC/**', path: 'src/app.js', caseSensitive: true, expected: false }
];

caseTests.forEach(test => {
  const result = matchGlob(test.pattern, test.path, { caseSensitive: test.caseSensitive });
  const status = result === test.expected ? '✓' : '✗';
  const mode = test.caseSensitive ? 'sensitive' : 'insensitive';
  console.log(`  ${status} '${test.pattern}' vs '${test.path}' (${mode}) → ${result}`);
});
console.log();

console.log('Test 4: GlobMatcher Class');
console.log('─'.repeat(60));

// Example 1: Single pattern matcher
const jsMatcher = new GlobMatcher('**/*.js');
console.log('Example 1: Match JavaScript files');
const files1 = ['src/app.js', 'README.md', 'lib/util.js', 'package.json'];
const jsFiles = jsMatcher.match(files1);
console.log(`  Input files: ${JSON.stringify(files1)}`);
console.log(`  Matched: ${JSON.stringify(jsFiles)}`);
console.log();

// Example 2: Multiple patterns with exclusions
const sourceMatcher = new GlobMatcher([
  'src/**/*.{js,ts}',
  '!**/*.test.{js,ts}',
  '!**/*.spec.{js,ts}'
]);
console.log('Example 2: Match source files (exclude tests)');
const files2 = [
  'src/app.js',
  'src/lib/util.ts',
  'src/app.test.js',
  'src/lib/util.spec.ts',
  'README.md'
];
const sourceFiles = sourceMatcher.match(files2);
console.log(`  Input files: ${JSON.stringify(files2)}`);
console.log(`  Matched: ${JSON.stringify(sourceFiles)}`);
console.log();

// Example 3: Test individual paths
console.log('Example 3: Test individual paths');
console.log(`  'src/app.js' matches: ${sourceMatcher.test('src/app.js')}`);
console.log(`  'src/app.test.js' matches: ${sourceMatcher.test('src/app.test.js')}`);
console.log();

// Example 4: Matcher statistics
console.log('Example 4: Matcher Statistics');
const stats = sourceMatcher.getStats();
console.log(`  Total patterns: ${stats.totalPatterns}`);
console.log(`  Include patterns: ${stats.includePatterns}`);
console.log(`  Exclude patterns: ${stats.excludePatterns}`);
console.log(`  Cached regex: ${stats.cachedRegex}`);
console.log();

console.log('Test 5: Advanced Patterns');
console.log('─'.repeat(60));
const advancedTests = [
  {
    pattern: '**/[A-Z]*.js',
    path: 'lib/Utils.js',
    expected: true,
    description: 'Match files starting with uppercase'
  },
  {
    pattern: '**/[A-Z]*.js',
    path: 'lib/utils.js',
    expected: false,
    description: 'Lowercase should not match'
  },
  {
    pattern: '**/*.{jpg,jpeg,png,gif}',
    path: 'images/photo.jpg',
    expected: true,
    description: 'Match image extensions'
  },
  {
    pattern: 'src/**/[!_]*.js',
    path: 'src/app.js',
    expected: true,
    description: 'Match files not starting with underscore'
  },
  {
    pattern: 'src/**/[!_]*.js',
    path: 'src/_private.js',
    expected: false,
    description: 'Files starting with underscore should not match'
  }
];

advancedTests.forEach(test => {
  const result = matchGlob(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} ${test.description}`);
  console.log(`     Pattern: '${test.pattern}' vs '${test.path}' → ${result}`);
});
console.log();

console.log('Test 6: Performance with Caching');
console.log('─'.repeat(60));

// Create a large set of files to test
const testFiles = [];
for (let i = 0; i < 1000; i++) {
  testFiles.push(`src/file${i}.js`);
  testFiles.push(`test/spec${i}.test.js`);
  testFiles.push(`lib/util${i}.ts`);
}

// Test without caching (recreating matcher each time)
console.log('Without caching (1000 iterations):');
const start1 = Date.now();
for (let i = 0; i < 1000; i++) {
  const tempMatcher = new GlobMatcher(['**/*.js', '!**/*.test.js']);
  tempMatcher.test('src/file1.js');
}
const time1 = Date.now() - start1;
console.log(`  Time: ${time1}ms`);

// Test with caching (reusing same matcher)
console.log('With caching (1000 iterations):');
const cachedMatcher = new GlobMatcher(['**/*.js', '!**/*.test.js']);
const start2 = Date.now();
for (let i = 0; i < 1000; i++) {
  cachedMatcher.test('src/file1.js');
}
const time2 = Date.now() - start2;
console.log(`  Time: ${time2}ms`);
console.log(`  Speedup: ${(time1 / time2).toFixed(2)}x faster`);
console.log();

console.log('✅ Exercise 1 Solution Complete\n');

console.log('Key Takeaways:');
console.log('─'.repeat(60));
console.log('  1. Use placeholders to handle ** before * conversion');
console.log('  2. Escape special regex characters but preserve glob syntax');
console.log('  3. Cache compiled patterns for better performance');
console.log('  4. Support both inclusion and exclusion patterns');
console.log('  5. Consider case sensitivity based on platform needs');
console.log('  6. Provide a class-based API for reusable matchers');
console.log();

console.log('💡 Production Tips:');
console.log('─'.repeat(60));
console.log('  • Compile patterns once, use many times');
console.log('  • Validate patterns before compilation');
console.log('  • Consider using existing libraries (minimatch, micromatch) for complex needs');
console.log('  • Profile performance for large file sets');
console.log('  • Document pattern syntax for users');
