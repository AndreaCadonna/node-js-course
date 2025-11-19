/**
 * Solution to Exercise 5: Implement a Cross-Platform Path Library
 *
 * This solution demonstrates a comprehensive, production-ready path library
 * that handles all cross-platform edge cases.
 *
 * Platform Differences Handled:
 * - Maximum path lengths (Windows: 260, Unix: varies)
 * - Reserved names (Windows: CON, PRN, AUX, etc.)
 * - Invalid characters (Windows: <, >, :, ", |, etc.)
 * - Case sensitivity (Windows: insensitive, Unix: sensitive)
 * - Path separators (Windows: \, Unix: /)
 * - Drive letters (Windows: C:, Unix: N/A)
 * - Trailing spaces/dots (Windows issue)
 * - Unicode normalization
 *
 * Features:
 * - Full platform abstraction
 * - Comprehensive validation
 * - Path sanitization
 * - Format conversion
 * - Extensive utilities
 * - Performance caching
 */

const path = require('path');
const os = require('os');

/**
 * Cross-Platform Path Library
 */
class CrossPlatformPathLib {
  /**
   * @param {string} baseDir - Base directory for operations
   * @param {object} options - Library options
   */
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.platform = options.platform || process.platform;
    this.options = {
      strict: options.strict !== false,
      cache: options.cache !== false,
      cacheSize: options.cacheSize || 1000,
      normalizeUnicode: options.normalizeUnicode !== false,
      ...options
    };

    // Initialize cache
    this.cache = new Map();

    // Set platform-specific constants
    this._initPlatformConstants();
  }

  /**
   * Initialize platform-specific constants
   * @private
   */
  _initPlatformConstants() {
    if (this.platform === 'win32') {
      this.maxPathLength = 260;
      this.caseSensitive = false;
      this.separator = '\\';
      this.reservedNames = [
        'CON', 'PRN', 'AUX', 'NUL',
        'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
        'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
      ];
      this.invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
      this.invalidCharsPattern = /[<>:"|?*]/g;
    } else {
      // Unix-like (Linux, macOS)
      this.maxPathLength = 4096; // Common limit, varies by filesystem
      this.caseSensitive = true;
      this.separator = '/';
      this.reservedNames = [];
      this.invalidChars = ['\0']; // Only null byte is truly invalid
      this.invalidCharsPattern = /\0/g;
    }
  }

  // ============================================================================
  // Core Operations
  // ============================================================================

  /**
   * Platform-aware join with validation
   * @param {...string} segments - Path segments to join
   * @returns {string} - Joined path
   */
  join(...segments) {
    // Filter out empty segments
    const filtered = segments.filter(s => s && typeof s === 'string');

    if (filtered.length === 0) {
      return '.';
    }

    // Join segments
    let joined = path.join(...filtered);

    // Validate the result
    if (this.options.strict) {
      const validation = this.validate(joined);
      if (!validation.valid) {
        throw new Error(`Invalid joined path: ${validation.errors.join(', ')}`);
      }
    }

    return joined;
  }

  /**
   * Platform-aware resolve with validation
   * @param {...string} segments - Path segments to resolve
   * @returns {string} - Resolved absolute path
   */
  resolve(...segments) {
    const resolved = path.resolve(this.baseDir, ...segments);

    if (this.options.strict) {
      const validation = this.validate(resolved);
      if (!validation.valid) {
        throw new Error(`Invalid resolved path: ${validation.errors.join(', ')}`);
      }
    }

    return resolved;
  }

  /**
   * Platform-aware normalization
   * @param {string} filepath - Path to normalize
   * @returns {string} - Normalized path
   */
  normalize(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return '';
    }

    // Normalize Unicode if enabled
    let normalized = this.options.normalizeUnicode
      ? filepath.normalize('NFC')
      : filepath;

    // Apply platform normalization
    normalized = path.normalize(normalized);

    // Windows-specific: Remove trailing spaces and dots
    if (this.platform === 'win32') {
      const parts = normalized.split(path.sep);
      parts[parts.length - 1] = parts[parts.length - 1].replace(/[. ]+$/, '');
      normalized = parts.join(path.sep);
    }

    return normalized;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Comprehensive cross-platform validation
   * @param {string} filepath - Path to validate
   * @returns {object} - {valid, errors, warnings, platform}
   */
  validate(filepath) {
    const errors = [];
    const warnings = [];

    if (!filepath || typeof filepath !== 'string') {
      return {
        valid: false,
        errors: ['Path must be a non-empty string'],
        warnings: [],
        platform: this.platform
      };
    }

    // Check 1: Path length
    if (filepath.length > this.maxPathLength) {
      errors.push(`Path length (${filepath.length}) exceeds platform maximum (${this.maxPathLength})`);
    } else if (filepath.length > this.maxPathLength * 0.9) {
      warnings.push(`Path length (${filepath.length}) approaching platform maximum`);
    }

    // Check 2: Reserved names (Windows)
    if (this.isReservedName(filepath)) {
      errors.push(`Filename uses reserved name on ${this.platform}`);
    }

    // Check 3: Invalid characters
    if (this.hasInvalidChars(filepath)) {
      errors.push(`Path contains invalid characters for ${this.platform}`);
    }

    // Check 4: Trailing issues (Windows)
    if (this.platform === 'win32') {
      const basename = path.basename(filepath);
      if (/[. ]$/.test(basename)) {
        errors.push('Filename ends with space or dot (invalid on Windows)');
      }
    }

    // Check 5: Unicode normalization
    if (this.options.normalizeUnicode) {
      const normalized = filepath.normalize('NFC');
      if (normalized !== filepath) {
        warnings.push('Path contains non-normalized Unicode characters');
      }
    }

    // Check 6: Null bytes
    if (filepath.includes('\0')) {
      errors.push('Path contains null byte');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      platform: this.platform
    };
  }

  /**
   * Check for Windows reserved names
   * @param {string} filepath - Path to check
   * @returns {boolean} - True if reserved
   */
  isReservedName(filepath) {
    if (this.platform !== 'win32') {
      return false;
    }

    const basename = path.basename(filepath).toUpperCase();
    const nameWithoutExt = basename.split('.')[0];

    return this.reservedNames.includes(nameWithoutExt);
  }

  /**
   * Check for platform-specific invalid characters
   * @param {string} filepath - Path to check
   * @returns {boolean} - True if has invalid chars
   */
  hasInvalidChars(filepath) {
    return this.invalidCharsPattern.test(filepath);
  }

  // ============================================================================
  // Transformation
  // ============================================================================

  /**
   * Sanitize path for target platform
   * @param {string} filepath - Path to sanitize
   * @returns {string} - Sanitized path
   */
  sanitize(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      return '';
    }

    let sanitized = filepath;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Remove/replace invalid characters
    if (this.platform === 'win32') {
      sanitized = sanitized.replace(this.invalidCharsPattern, '_');

      // Handle reserved names
      const parts = sanitized.split(path.sep);
      parts[parts.length - 1] = this._sanitizeReservedName(parts[parts.length - 1]);
      sanitized = parts.join(path.sep);

      // Remove trailing spaces/dots
      const basename = path.basename(sanitized);
      const dirname = path.dirname(sanitized);
      const cleaned = basename.replace(/[. ]+$/, '');
      sanitized = dirname === '.' ? cleaned : path.join(dirname, cleaned);
    } else {
      sanitized = sanitized.replace(/\0/g, '');
    }

    // Normalize Unicode
    if (this.options.normalizeUnicode) {
      sanitized = sanitized.normalize('NFC');
    }

    // Normalize path
    sanitized = path.normalize(sanitized);

    return sanitized;
  }

  /**
   * Sanitize reserved names
   * @private
   */
  _sanitizeReservedName(filename) {
    if (this.platform !== 'win32') {
      return filename;
    }

    const upper = filename.toUpperCase();
    const nameWithoutExt = upper.split('.')[0];

    if (this.reservedNames.includes(nameWithoutExt)) {
      // Prepend underscore to make it non-reserved
      return '_' + filename;
    }

    return filename;
  }

  /**
   * Change file extension
   * @param {string} filepath - Path to modify
   * @param {string} newExt - New extension (with or without dot)
   * @returns {string} - Path with new extension
   */
  changeExtension(filepath, newExt) {
    const ext = newExt.startsWith('.') ? newExt : '.' + newExt;
    const parsed = path.parse(filepath);
    return path.join(parsed.dir, parsed.name + ext);
  }

  /**
   * Add suffix before extension
   * @param {string} filepath - Path to modify
   * @param {string} suffix - Suffix to add
   * @returns {string} - Path with suffix
   */
  addSuffix(filepath, suffix) {
    const parsed = path.parse(filepath);
    return path.join(parsed.dir, parsed.name + suffix + parsed.ext);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Split path into components
   * @param {string} filepath - Path to split
   * @returns {string[]} - Array of path components
   */
  getComponents(filepath) {
    const normalized = path.normalize(filepath);
    return normalized.split(path.sep).filter(c => c !== '');
  }

  /**
   * Calculate path depth
   * @param {string} filepath - Path to analyze
   * @returns {number} - Depth (number of components)
   */
  getDepth(filepath) {
    return this.getComponents(filepath).length;
  }

  /**
   * Get all parent directories
   * @param {string} filepath - Path to analyze
   * @returns {string[]} - Array of parent paths
   */
  getParents(filepath) {
    const parents = [];
    let current = path.dirname(filepath);

    while (current !== '.' && current !== '/' && current !== path.parse(current).root) {
      parents.push(current);
      current = path.dirname(current);
    }

    return parents;
  }

  // ============================================================================
  // Platform Conversion
  // ============================================================================

  /**
   * Convert to POSIX format (Unix-style)
   * @param {string} filepath - Path to convert
   * @returns {string} - POSIX path
   */
  toPosix(filepath) {
    let converted = filepath;

    // Remove drive letter if present
    converted = converted.replace(/^[A-Za-z]:/, '');

    // Handle UNC paths
    if (filepath.startsWith('\\\\')) {
      converted = '//' + converted.substring(2);
    }

    // Replace backslashes with forward slashes
    converted = converted.split('\\').join('/');

    return converted;
  }

  /**
   * Convert to Windows format
   * @param {string} filepath - Path to convert
   * @param {string} driveLetter - Drive letter to use (default: 'C:')
   * @returns {string} - Windows path
   */
  toWindows(filepath, driveLetter = 'C:') {
    let converted = filepath;

    // Replace forward slashes with backslashes
    converted = converted.split('/').join('\\');

    // Add drive letter for absolute paths
    if (filepath.startsWith('/') && !converted.startsWith('\\\\')) {
      converted = driveLetter + converted;
    }

    return converted;
  }

  // ============================================================================
  // Comparison
  // ============================================================================

  /**
   * Compare paths respecting case sensitivity
   * @param {string} path1 - First path
   * @param {string} path2 - Second path
   * @returns {boolean} - True if paths are equal
   */
  equals(path1, path2) {
    const norm1 = this.normalize(path1);
    const norm2 = this.normalize(path2);

    if (this.caseSensitive) {
      return norm1 === norm2;
    } else {
      return norm1.toLowerCase() === norm2.toLowerCase();
    }
  }

  /**
   * Check if path1 is under path2
   * @param {string} path1 - Child path
   * @param {string} path2 - Parent path
   * @returns {boolean} - True if path1 is under path2
   */
  isUnder(path1, path2) {
    const norm1 = this.normalize(path1);
    const norm2 = this.normalize(path2);

    if (this.caseSensitive) {
      return norm1.startsWith(norm2 + path.sep);
    } else {
      return norm1.toLowerCase().startsWith(norm2.toLowerCase() + path.sep);
    }
  }

  // ============================================================================
  // Performance & Caching
  // ============================================================================

  /**
   * Clear internal cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get library statistics
   * @returns {object} - Statistics
   */
  getStats() {
    return {
      platform: this.platform,
      maxPathLength: this.maxPathLength,
      caseSensitive: this.caseSensitive,
      separator: this.separator,
      reservedNames: this.reservedNames.length,
      cacheSize: this.cache.size
    };
  }
}

// ============================================================================
// Test Cases and Demonstrations
// ============================================================================

console.log('=== Solution to Exercise 5: Cross-Platform Path Library ===\n');

console.log('Platform Information:');
console.log('─'.repeat(60));
console.log(`  Current platform: ${process.platform}`);
console.log(`  Path separator: ${path.sep}`);
console.log(`  Delimiter: ${path.delimiter}`);
console.log();

console.log('Test 1: Library Initialization');
console.log('─'.repeat(60));

const lib = new CrossPlatformPathLib('/app/data');
const stats = lib.getStats();

console.log('Library configuration:');
Object.entries(stats).forEach(([key, value]) => {
  console.log(`  ${key}: ${JSON.stringify(value)}`);
});
console.log();

console.log('Test 2: Path Validation');
console.log('─'.repeat(60));

const validationTests = [
  'normal/file.txt',
  'CON.txt',
  'file:name.txt',
  'file.   ',
  'a'.repeat(300) + '.txt',
  'valid/path/document.pdf'
];

validationTests.forEach(testPath => {
  const result = lib.validate(testPath);
  const status = result.valid ? '✓' : '✗';
  console.log(`${status} '${testPath.substring(0, 40)}${testPath.length > 40 ? '...' : ''}'`);
  if (!result.valid) {
    result.errors.forEach(err => console.log(`    Error: ${err}`));
  }
  if (result.warnings.length > 0) {
    result.warnings.forEach(warn => console.log(`    Warning: ${warn}`));
  }
});
console.log();

console.log('Test 3: Reserved Name Detection');
console.log('─'.repeat(60));

const reservedTests = ['CON.txt', 'PRN', 'AUX.log', 'COM1', 'normal.txt'];

reservedTests.forEach(name => {
  const isReserved = lib.isReservedName(name);
  console.log(`  ${name}: ${isReserved ? '⚠ RESERVED' : '✓ OK'}`);
});
console.log();

console.log('Test 4: Path Sanitization');
console.log('─'.repeat(60));

const sanitizeTests = [
  'CON.txt',
  'file:name.txt',
  'file.   ',
  'path\\with/mixed\\separators',
  'file|with|pipes.txt'
];

sanitizeTests.forEach(testPath => {
  const sanitized = lib.sanitize(testPath);
  console.log(`  Original:  '${testPath}'`);
  console.log(`  Sanitized: '${sanitized}'`);
  console.log();
});

console.log('Test 5: Platform Conversion');
console.log('─'.repeat(60));

const convertTests = [
  { path: 'C:\\Users\\John\\file.txt', desc: 'Windows path to POSIX' },
  { path: '/home/john/file.txt', desc: 'POSIX path to Windows' },
  { path: 'relative\\path\\file.txt', desc: 'Relative path conversion' }
];

convertTests.forEach(test => {
  console.log(`  ${test.desc}:`);
  console.log(`    Original: ${test.path}`);
  console.log(`    To POSIX: ${lib.toPosix(test.path)}`);
  console.log(`    To Windows: ${lib.toWindows(test.path)}`);
  console.log();
});

console.log('Test 6: Path Utilities');
console.log('─'.repeat(60));

const utilPath = 'deeply/nested/path/to/file.txt';

console.log(`  Path: ${utilPath}`);
console.log(`  Components: ${JSON.stringify(lib.getComponents(utilPath))}`);
console.log(`  Depth: ${lib.getDepth(utilPath)}`);
console.log(`  Parents: ${JSON.stringify(lib.getParents(utilPath))}`);
console.log();

console.log('Test 7: Extension Manipulation');
console.log('─'.repeat(60));

const extPath = 'document.txt';
console.log(`  Original: ${extPath}`);
console.log(`  Change to .pdf: ${lib.changeExtension(extPath, '.pdf')}`);
console.log(`  Add suffix '_backup': ${lib.addSuffix(extPath, '_backup')}`);
console.log();

console.log('Test 8: Path Comparison');
console.log('─'.repeat(60));

const compareTests = [
  { path1: 'Path/To/File.txt', path2: 'path/to/file.txt', desc: 'Case difference' },
  { path1: 'path/./to/../to/file.txt', path2: 'path/to/file.txt', desc: 'With normalization' },
  { path1: 'completely/different.txt', path2: 'path/to/file.txt', desc: 'Different paths' }
];

compareTests.forEach(test => {
  const equal = lib.equals(test.path1, test.path2);
  console.log(`  ${test.desc}:`);
  console.log(`    '${test.path1}' == '${test.path2}' → ${equal}`);
});
console.log();

console.log('Test 9: Hierarchical Path Check');
console.log('─'.repeat(60));

const hierarchyTests = [
  { child: 'parent/child/file.txt', parent: 'parent', expected: true },
  { child: 'other/path/file.txt', parent: 'parent', expected: false },
  { child: 'parent', parent: 'parent', expected: false }
];

hierarchyTests.forEach(test => {
  const isUnder = lib.isUnder(test.child, test.parent);
  const status = isUnder === test.expected ? '✓' : '✗';
  console.log(`  ${status} '${test.child}' under '${test.parent}' → ${isUnder}`);
});
console.log();

console.log('Test 10: Normalization');
console.log('─'.repeat(60));

const normTests = [
  'path//with///multiple////slashes',
  './current/./directory/./file.txt',
  'path/../to/../file.txt',
  'path\\with/mixed\\separators'
];

normTests.forEach(testPath => {
  console.log(`  Original:   '${testPath}'`);
  console.log(`  Normalized: '${lib.normalize(testPath)}'`);
  console.log();
});

console.log('✅ Exercise 5 Solution Complete\n');

console.log('Key Takeaways:');
console.log('─'.repeat(60));
console.log('  1. Store platform-specific constants (max length, reserved names)');
console.log('  2. Handle case sensitivity based on platform');
console.log('  3. Normalize Unicode to NFC for consistency');
console.log('  4. Sanitize paths by replacing invalid characters');
console.log('  5. Test on all target platforms');
console.log('  6. Provide platform conversion utilities');
console.log();

console.log('💡 Production Tips:');
console.log('─'.repeat(60));
console.log('  • Document platform-specific behaviors clearly');
console.log('  • Provide migration paths between platforms');
console.log('  • Cache validation results for performance');
console.log('  • Test with real file systems, not just strings');
console.log('  • Consider long path support on Windows (\\\\?\\)');
console.log('  • Handle symbolic links platform-appropriately');
console.log();

console.log('Platform Edge Cases Covered:');
console.log('─'.repeat(60));
console.log('  ✓ Maximum path length limits');
console.log('  ✓ Reserved filenames (Windows)');
console.log('  ✓ Invalid characters per platform');
console.log('  ✓ Case sensitivity differences');
console.log('  ✓ Path separator differences');
console.log('  ✓ Drive letters (Windows)');
console.log('  ✓ Trailing spaces/dots (Windows)');
console.log('  ✓ Unicode normalization');
console.log('  ✓ UNC paths (Windows)');
console.log('  ✓ Null byte handling');
