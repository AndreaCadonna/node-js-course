/**
 * Example 1: Glob Pattern Implementation
 *
 * Demonstrates how to implement glob pattern matching for paths.
 * Glob patterns are widely used in file operations, build tools,
 * and configuration systems.
 *
 * Key Points:
 * - Understanding glob syntax (*, **, ?, [...])
 * - Converting glob patterns to regular expressions
 * - Handling recursive directory patterns
 * - Performance considerations
 * - Real-world applications
 */

const path = require('path');

console.log('=== Glob Pattern Implementation ===\n');

// 1. Basic Glob Syntax
console.log('1. Understanding Glob Syntax:');
console.log('  * - Matches any characters except /');
console.log('     Example: *.js matches app.js, index.js');
console.log('  ** - Matches any characters including /');
console.log('     Example: **/*.js matches src/app.js, lib/util/helper.js');
console.log('  ? - Matches exactly one character');
console.log('     Example: file?.txt matches file1.txt, fileA.txt');
console.log('  [...] - Matches one character from set');
console.log('     Example: file[0-9].txt matches file0.txt, file9.txt');
console.log('  {...} - Matches any of the alternatives');
console.log('     Example: *.{js,ts} matches app.js, index.ts');
console.log();

// 2. Simple Glob Matcher
console.log('2. Simple Glob Pattern Matcher:');

function simpleGlob(pattern, filepath) {
  // Escape special regex characters except our glob chars
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');

  return new RegExp('^' + regex + '$').test(filepath);
}

const simpleTests = [
  { pattern: '*.js', path: 'app.js', expected: true },
  { pattern: '*.js', path: 'lib/app.js', expected: false },
  { pattern: 'file?.txt', path: 'file1.txt', expected: true },
  { pattern: 'file?.txt', path: 'file10.txt', expected: false },
  { pattern: 'test-*.js', path: 'test-utils.js', expected: true }
];

console.log('  Testing simple glob matcher:');
simpleTests.forEach(test => {
  const result = simpleGlob(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`    ${status} '${test.pattern}' vs '${test.path}' → ${result}`);
});
console.log();

// 3. Advanced Glob Matcher with **
console.log('3. Advanced Glob Matcher (with **):\n');

function advancedGlob(pattern, filepath) {
  // Handle ** for recursive matching
  let regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLE_STAR§§')  // Placeholder
    .replace(/\*/g, '[^/]*')
    .replace(/§§DOUBLE_STAR§§/g, '.*')
    .replace(/\?/g, '[^/]');

  return new RegExp('^' + regex + '$').test(filepath);
}

const advancedTests = [
  { pattern: '**/*.js', path: 'app.js', expected: true },
  { pattern: '**/*.js', path: 'lib/app.js', expected: true },
  { pattern: '**/*.js', path: 'src/lib/util.js', expected: true },
  { pattern: 'src/**/*.js', path: 'src/app.js', expected: true },
  { pattern: 'src/**/*.js', path: 'src/lib/app.js', expected: true },
  { pattern: 'src/**/*.js', path: 'lib/app.js', expected: false },
  { pattern: '**/test/**/*.js', path: 'src/test/unit/app.test.js', expected: true }
];

console.log('  Testing advanced glob matcher:');
advancedTests.forEach(test => {
  const result = advancedGlob(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`    ${status} '${test.pattern}' vs '${test.path}' → ${result}`);
});
console.log();

// 4. Character Set Matching
console.log('4. Character Set Matching:');

function globWithSets(pattern, filepath) {
  let regex = pattern
    .replace(/[.+^${}()|\\]/g, '\\$&')
    .replace(/\*\*/g, '§§DOUBLE_STAR§§')
    .replace(/\*/g, '[^/]*')
    .replace(/§§DOUBLE_STAR§§/g, '.*')
    .replace(/\?/g, '[^/]')
    // Keep [...] as-is (it's already regex)
    .replace(/\[([^\]]+)\]/g, '[$1]');

  return new RegExp('^' + regex + '$').test(filepath);
}

const setTests = [
  { pattern: 'file[0-9].txt', path: 'file0.txt', expected: true },
  { pattern: 'file[0-9].txt', path: 'file5.txt', expected: true },
  { pattern: 'file[0-9].txt', path: 'fileA.txt', expected: false },
  { pattern: 'file[abc].txt', path: 'filea.txt', expected: true },
  { pattern: 'file[!0-9].txt', path: 'fileA.txt', expected: true },
  { pattern: 'file[!0-9].txt', path: 'file5.txt', expected: false }
];

console.log('  Testing character set matching:');
setTests.forEach(test => {
  const result = globWithSets(test.pattern, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`    ${status} '${test.pattern}' vs '${test.path}' → ${result}`);
});
console.log();

// 5. Negation Patterns
console.log('5. Negation Patterns:');

function isMatch(patterns, filepath) {
  // patterns can be ['*.js', '!test-*.js']
  // Positive patterns must match, negative patterns must not
  let isIncluded = false;
  let isExcluded = false;

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      // Negation pattern
      const actualPattern = pattern.slice(1);
      if (advancedGlob(actualPattern, filepath)) {
        isExcluded = true;
      }
    } else {
      // Inclusion pattern
      if (advancedGlob(pattern, filepath)) {
        isIncluded = true;
      }
    }
  }

  return isIncluded && !isExcluded;
}

const negationTests = [
  { patterns: ['*.js', '!test-*.js'], path: 'app.js', expected: true },
  { patterns: ['*.js', '!test-*.js'], path: 'test-app.js', expected: false },
  { patterns: ['**/*.js', '!**/node_modules/**'], path: 'src/app.js', expected: true },
  { patterns: ['**/*.js', '!**/node_modules/**'], path: 'node_modules/pkg/index.js', expected: false }
];

console.log('  Testing negation patterns:');
negationTests.forEach(test => {
  const result = isMatch(test.patterns, test.path);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`    ${status} ${JSON.stringify(test.patterns)} vs '${test.path}' → ${result}`);
});
console.log();

// 6. Production-Ready Glob Matcher
console.log('6. Production-Ready Glob Matcher:');

class GlobMatcher {
  constructor(pattern, options = {}) {
    this.pattern = pattern;
    this.options = {
      caseSensitive: options.caseSensitive !== false,
      dot: options.dot || false, // Match dotfiles
      ...options
    };
    this.regex = this.compilePattern(pattern);
  }

  compilePattern(pattern) {
    let regex = pattern
      .replace(/[.+^${}()|\\]/g, '\\$&')
      .replace(/\*\*/g, '§§DOUBLE_STAR§§')
      .replace(/\*/g, '[^/]*')
      .replace(/§§DOUBLE_STAR§§/g, '.*')
      .replace(/\?/g, '[^/]')
      .replace(/\[([^\]]+)\]/g, '[$1]');

    // Handle dotfiles
    if (!this.options.dot) {
      // Exclude paths starting with .
      regex = regex.replace(/^\.\*/, '(?!\\.).*');
    }

    const flags = this.options.caseSensitive ? '' : 'i';
    return new RegExp('^' + regex + '$', flags);
  }

  test(filepath) {
    return this.regex.test(filepath);
  }

  match(filepaths) {
    return filepaths.filter(fp => this.test(fp));
  }
}

const matcher = new GlobMatcher('src/**/*.js', { caseSensitive: false });

const files = [
  'src/app.js',
  'src/lib/util.js',
  'SRC/APP.JS',  // Case insensitive
  'lib/app.js',
  'src/.hidden.js',
  'src/test/spec.js'
];

console.log('  GlobMatcher class with options:');
console.log(`  Pattern: src/**/*.js (case-insensitive)`);
console.log('  Testing files:');
files.forEach(file => {
  const matches = matcher.test(file);
  console.log(`    ${matches ? '✓' : '✗'} ${file}`);
});
console.log();

// 7. Brace Expansion
console.log('7. Brace Expansion:');

function expandBraces(pattern) {
  // Simple brace expansion: *.{js,ts} → [*.js, *.ts]
  const braceMatch = pattern.match(/\{([^}]+)\}/);
  if (!braceMatch) {
    return [pattern];
  }

  const alternatives = braceMatch[1].split(',');
  const results = [];

  for (const alt of alternatives) {
    const expanded = pattern.replace(/\{[^}]+\}/, alt);
    // Recursively expand nested braces
    results.push(...expandBraces(expanded));
  }

  return results;
}

const braceTests = [
  '*.{js,ts}',
  'src/**/*.{js,ts,jsx}',
  'file.{test,spec}.js'
];

console.log('  Expanding brace patterns:');
braceTests.forEach(pattern => {
  const expanded = expandBraces(pattern);
  console.log(`    '${pattern}'`);
  console.log(`    → [${expanded.map(p => `'${p}'`).join(', ')}]`);
});
console.log();

// 8. Multiple Pattern Matching
console.log('8. Multiple Pattern Matching:');

class MultiGlob {
  constructor(patterns, options = {}) {
    this.matchers = patterns.map(p => {
      if (p.startsWith('!')) {
        return { matcher: new GlobMatcher(p.slice(1), options), negate: true };
      }
      return { matcher: new GlobMatcher(p, options), negate: false };
    });
  }

  test(filepath) {
    let included = false;
    let excluded = false;

    for (const { matcher, negate } of this.matchers) {
      if (matcher.test(filepath)) {
        if (negate) {
          excluded = true;
        } else {
          included = true;
        }
      }
    }

    return included && !excluded;
  }

  match(filepaths) {
    return filepaths.filter(fp => this.test(fp));
  }
}

const multiGlob = new MultiGlob([
  '**/*.js',
  '!**/test/**',
  '!**/node_modules/**'
]);

const projectFiles = [
  'src/app.js',
  'src/lib/util.js',
  'src/test/app.test.js',
  'node_modules/pkg/index.js',
  'lib/helper.js'
];

console.log('  MultiGlob with inclusion and exclusion:');
console.log('  Patterns: ["**/*.js", "!**/test/**", "!**/node_modules/**"]');
console.log('  Testing files:');
projectFiles.forEach(file => {
  const matches = multiGlob.test(file);
  console.log(`    ${matches ? '✓' : '✗'} ${file}`);
});
console.log();

// 9. Performance Considerations
console.log('9. Performance Considerations:');

function benchmarkGlob(pattern, paths, iterations = 10000) {
  const matcher = new GlobMatcher(pattern);
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    paths.forEach(p => matcher.test(p));
  }

  const end = Date.now();
  const duration = end - start;
  const opsPerSecond = Math.floor((iterations * paths.length) / (duration / 1000));

  return { duration, opsPerSecond };
}

const testPaths = [
  'src/app.js',
  'src/lib/util.js',
  'lib/helper.js',
  'test/spec.js'
];

console.log('  Performance benchmarking:');
console.log('  Pattern: **/*.js');
console.log('  Paths: ' + testPaths.length);

const bench = benchmarkGlob('**/*.js', testPaths, 10000);
console.log(`  Duration: ${bench.duration}ms`);
console.log(`  Operations per second: ${bench.opsPerSecond.toLocaleString()}`);
console.log();

// 10. Real-World Applications
console.log('10. Real-World Applications:');
console.log();

console.log('  Use Case 1: Build Tool File Selection');
console.log('    Pattern: ["src/**/*.{js,ts}", "!**/*.test.{js,ts}", "!**/node_modules/**"]');
console.log('    → Select all source files, exclude tests and dependencies');
console.log();

console.log('  Use Case 2: Git-style Ignore Patterns');
console.log('    Pattern: ["**/*", "!node_modules/**", "!*.log", "!.env*"]');
console.log('    → Include everything except node_modules, logs, and env files');
console.log();

console.log('  Use Case 3: Test File Discovery');
console.log('    Pattern: ["**/*.{test,spec}.{js,ts}", "!**/node_modules/**"]');
console.log('    → Find all test files in any directory');
console.log();

console.log('  Use Case 4: Asset Processing');
console.log('    Pattern: ["src/**/*.{png,jpg,svg}", "!src/test/**"]');
console.log('    → Process images, exclude test fixtures');
console.log();

// 11. Best Practices
console.log('11. Glob Pattern Best Practices:');
console.log();
console.log('  ✅ DO:');
console.log('    • Use ** for recursive matching');
console.log('    • Use negation patterns to exclude files');
console.log('    • Cache compiled patterns for reuse');
console.log('    • Consider case sensitivity for your platform');
console.log('    • Use character sets for specific ranges');
console.log('    • Document your glob patterns');
console.log();
console.log('  ❌ DON\'T:');
console.log('    • Use complex patterns without testing');
console.log('    • Forget about performance with many patterns');
console.log('    • Ignore case sensitivity differences');
console.log('    • Use string operations instead of regex');
console.log('    • Forget to handle dotfiles explicitly');
console.log();

// 12. Integration Example
console.log('12. Integration Example - File Processor:');

class FileProcessor {
  constructor(includePatterns, excludePatterns = []) {
    this.glob = new MultiGlob([
      ...includePatterns,
      ...excludePatterns.map(p => '!' + p)
    ]);
  }

  shouldProcess(filepath) {
    // Normalize path to use forward slashes
    const normalized = filepath.split(path.sep).join('/');
    return this.glob.test(normalized);
  }

  filterFiles(files) {
    return files.filter(f => this.shouldProcess(f));
  }
}

const processor = new FileProcessor(
  ['**/*.js'],
  ['**/node_modules/**', '**/*.test.js', '**/dist/**']
);

const allFiles = [
  'src/app.js',
  'src/test/app.test.js',
  'lib/util.js',
  'node_modules/pkg/index.js',
  'dist/bundle.js'
];

console.log('  FileProcessor configuration:');
console.log('    Include: ["**/*.js"]');
console.log('    Exclude: ["**/node_modules/**", "**/*.test.js", "**/dist/**"]');
console.log();
console.log('  Filtered files:');
processor.filterFiles(allFiles).forEach(file => {
  console.log(`    ✓ ${file}`);
});
console.log();

console.log('✅ Glob pattern implementation complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Glob patterns provide flexible file filtering');
console.log('  • Convert glob syntax to regex for matching');
console.log('  • Support negation for exclusion patterns');
console.log('  • Cache compiled patterns for performance');
console.log('  • Use classes for reusable, configurable matchers');
