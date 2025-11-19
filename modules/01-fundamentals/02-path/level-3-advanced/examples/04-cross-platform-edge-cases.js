/**
 * Example 4: Cross-Platform Path Edge Cases
 *
 * Demonstrates handling of complex cross-platform edge cases including
 * maximum path lengths, reserved names, case sensitivity, and Unicode.
 *
 * Key Points:
 * - Platform-specific path behaviors
 * - Maximum path length handling
 * - Reserved names and characters
 * - Case sensitivity issues
 * - Unicode and special characters
 */

const path = require('path');
const os = require('os');

console.log('=== Cross-Platform Path Edge Cases ===\n');

// 1. Platform Detection and Basics
console.log('1. Platform Information:');
console.log(`  Platform: ${process.platform}`);
console.log(`  Path separator: '${path.sep}'`);
console.log(`  Delimiter: '${path.delimiter}'`);
console.log(`  OS type: ${os.type()}`);
console.log(`  OS release: ${os.release()}`);
console.log();

// 2. Maximum Path Lengths
console.log('2. Maximum Path Lengths:');

const PATH_MAX = {
  win32: 260,    // MAX_PATH on Windows (can be 32767 with long path support)
  darwin: 1024,  // PATH_MAX on macOS
  linux: 4096    // PATH_MAX on Linux
};

function checkPathLength(filepath) {
  const platform = process.platform;
  const maxLength = PATH_MAX[platform] || 4096;

  return {
    length: filepath.length,
    maxLength,
    exceeds: filepath.length > maxLength,
    platform
  };
}

const testPaths = [
  'normal/path/file.txt',
  'a'.repeat(300) + '/file.txt',
  '/very/' + 'long/'.repeat(100) + 'path.txt',
  'C:\\' + 'deep\\'.repeat(50) + 'file.txt'
];

console.log('  Checking path lengths:');
testPaths.forEach(testPath => {
  const result = checkPathLength(testPath);
  const status = result.exceeds ? '⚠️' : '✓';
  const display = testPath.length > 50 ? testPath.substring(0, 47) + '...' : testPath;
  console.log(`    ${status} Length: ${result.length}/${result.maxLength} - ${display}`);
});
console.log();

// 3. Windows Reserved Names
console.log('3. Windows Reserved Names:');

const WINDOWS_RESERVED_NAMES = [
  'CON', 'PRN', 'AUX', 'NUL',
  'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
];

function isWindowsReservedName(filename) {
  const basename = path.basename(filename, path.extname(filename)).toUpperCase();
  return WINDOWS_RESERVED_NAMES.includes(basename);
}

function checkReservedName(filepath) {
  const basename = path.basename(filepath);
  const nameWithoutExt = basename.split('.')[0].toUpperCase();

  const isReserved = WINDOWS_RESERVED_NAMES.includes(nameWithoutExt);

  return {
    basename,
    nameWithoutExt,
    isReserved,
    message: isReserved ? `${nameWithoutExt} is a reserved Windows name` : 'OK'
  };
}

const reservedTests = [
  'file.txt',
  'CON',
  'CON.txt',
  'aux.log',
  'COM1.dat',
  'con', // Case insensitive on Windows
  'document.prn',
  'LPT9.txt'
];

console.log('  Testing reserved names:');
reservedTests.forEach(filename => {
  const result = checkReservedName(filename);
  const status = result.isReserved ? '⚠️' : '✓';
  console.log(`    ${status} '${filename}' → ${result.message}`);
});
console.log();

// 4. Invalid Characters
console.log('4. Platform-Specific Invalid Characters:');

const INVALID_CHARS = {
  win32: ['<', '>', ':', '"', '/', '\\', '|', '?', '*'],
  posix: ['\0'], // Only null byte is invalid on Unix
  darwin: ['\0', ':'] // macOS also restricts colon
};

function getInvalidChars(platform = process.platform) {
  if (platform === 'win32') return INVALID_CHARS.win32;
  if (platform === 'darwin') return INVALID_CHARS.darwin;
  return INVALID_CHARS.posix;
}

function containsInvalidChars(filename, platform = process.platform) {
  const invalidChars = getInvalidChars(platform);
  const found = [];

  for (const char of invalidChars) {
    if (filename.includes(char)) {
      found.push(char);
    }
  }

  return {
    valid: found.length === 0,
    invalidChars: found,
    platform
  };
}

const charTests = [
  'normal-file.txt',
  'file:name.txt',
  'file<name>.txt',
  'file|name.txt',
  'file*name.txt',
  'file?name.txt',
  'file"name".txt',
  'file\0name.txt'
];

console.log(`  Testing for platform: ${process.platform}`);
charTests.forEach(filename => {
  const result = containsInvalidChars(filename);
  const status = result.valid ? '✓' : '⚠️';
  const invalid = result.invalidChars.length > 0
    ? ` (contains: ${result.invalidChars.map(c => `'${c}'`).join(', ')})`
    : '';
  console.log(`    ${status} '${filename}'${invalid}`);
});
console.log();

// 5. Case Sensitivity
console.log('5. Case Sensitivity Handling:');

const caseSensitivity = {
  win32: false,
  darwin: false, // Default APFS is case-insensitive
  linux: true
};

function arPathsEqual(path1, path2, platform = process.platform) {
  const isCaseSensitive = caseSensitivity[platform] !== false;

  if (isCaseSensitive) {
    return path1 === path2;
  } else {
    return path1.toLowerCase() === path2.toLowerCase();
  }
}

function normalizeCaseForPlatform(filepath, platform = process.platform) {
  const isCaseSensitive = caseSensitivity[platform] !== false;
  return isCaseSensitive ? filepath : filepath.toLowerCase();
}

const caseTests = [
  { path1: '/Users/John/file.txt', path2: '/users/john/file.txt' },
  { path1: 'README.md', path2: 'readme.md' },
  { path1: 'File.TXT', path2: 'file.txt' }
];

console.log(`  Case sensitivity (${process.platform}): ${caseSensitivity[process.platform]}`);
caseTests.forEach(test => {
  const equal = arePathsEqual(test.path1, test.path2);
  console.log(`    '${test.path1}' === '${test.path2}' → ${equal}`);
});
console.log();

// 6. Unicode and Special Characters
console.log('6. Unicode and Special Characters:');

function analyzeUnicode(str) {
  return {
    length: str.length,
    byteLength: Buffer.byteLength(str, 'utf8'),
    codePoints: [...str].length,
    normalized: {
      NFC: str.normalize('NFC'),
      NFD: str.normalize('NFD'),
      NFKC: str.normalize('NFKC'),
      NFKD: str.normalize('NFKD')
    }
  };
}

const unicodeTests = [
  'café.txt',          // é as single character
  'café.txt',          // é as e + combining accent
  'file\u200Bname.txt', // Zero-width space
  '文件.txt',          // Chinese characters
  'файл.txt',          // Cyrillic
  'ﬁle.txt'            // Ligature
];

console.log('  Analyzing Unicode paths:');
unicodeTests.forEach(filename => {
  const analysis = analyzeUnicode(filename);
  console.log(`    '${filename}'`);
  console.log(`      Length: ${analysis.length}, Bytes: ${analysis.byteLength}, Code points: ${analysis.codePoints}`);
});
console.log();

// 7. Trailing Dots and Spaces (Windows)
console.log('7. Trailing Dots and Spaces (Windows Issue):');

function hasTrailingIssues(filename) {
  return {
    trailingDots: /\.$/.test(filename),
    trailingSpaces: / $/.test(filename),
    leadingSpaces: /^ /.test(filename)
  };
}

const trailingTests = [
  'normal.txt',
  'file.',
  'file..',
  'file ',
  'file. ',
  ' file.txt'
];

console.log('  Windows strips trailing dots and spaces:');
trailingTests.forEach(filename => {
  const issues = hasTrailingIssues(filename);
  const hasIssue = issues.trailingDots || issues.trailingSpaces || issues.leadingSpaces;
  const status = hasIssue ? '⚠️' : '✓';
  const problems = [];
  if (issues.trailingDots) problems.push('trailing dot');
  if (issues.trailingSpaces) problems.push('trailing space');
  if (issues.leadingSpaces) problems.push('leading space');
  const msg = problems.length > 0 ? ` (${problems.join(', ')})` : '';
  console.log(`    ${status} '${filename}'${msg}`);
});
console.log();

// 8. Comprehensive Path Validator
console.log('8. Comprehensive Cross-Platform Validator:');

class CrossPlatformPathValidator {
  constructor(options = {}) {
    this.platform = options.platform || process.platform;
    this.strict = options.strict !== false;
  }

  validate(filepath) {
    const errors = [];
    const warnings = [];

    // 1. Length check
    const lengthCheck = checkPathLength(filepath);
    if (lengthCheck.exceeds) {
      errors.push(`Path length ${lengthCheck.length} exceeds maximum ${lengthCheck.maxLength}`);
    }

    // 2. Reserved names (Windows)
    if (this.platform === 'win32' || this.strict) {
      const basename = path.basename(filepath);
      if (isWindowsReservedName(basename)) {
        errors.push(`Reserved Windows name: ${basename}`);
      }
    }

    // 3. Invalid characters
    const charCheck = containsInvalidChars(filepath, this.platform);
    if (!charCheck.valid) {
      errors.push(`Invalid characters: ${charCheck.invalidChars.map(c => `'${c}'`).join(', ')}`);
    }

    // 4. Trailing issues (Windows)
    if (this.platform === 'win32' || this.strict) {
      const basename = path.basename(filepath);
      const issues = hasTrailingIssues(basename);
      if (issues.trailingDots) {
        warnings.push('Windows strips trailing dots');
      }
      if (issues.trailingSpaces) {
        warnings.push('Windows strips trailing spaces');
      }
    }

    // 5. Unicode normalization
    const filename = path.basename(filepath);
    const nfc = filename.normalize('NFC');
    const nfd = filename.normalize('NFD');
    if (nfc !== nfd) {
      warnings.push('Filename has different Unicode normalizations');
    }

    // 6. Null bytes
    if (filepath.includes('\0')) {
      errors.push('Contains null byte');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      platform: this.platform
    };
  }
}

const validator = new CrossPlatformPathValidator({ strict: true });

const validationTests = [
  'normal/file.txt',
  'CON.txt',
  'file:name.txt',
  'file.',
  'a'.repeat(300) + '.txt',
  'café.txt',
  'path/to/file\0.txt'
];

console.log('  Comprehensive validation (strict mode):');
validationTests.forEach(filepath => {
  const result = validator.validate(filepath);
  if (result.valid) {
    console.log(`    ✓ '${filepath}'`);
    if (result.warnings.length > 0) {
      console.log(`      Warnings: ${result.warnings.join(', ')}`);
    }
  } else {
    console.log(`    ✗ '${filepath}'`);
    console.log(`      Errors: ${result.errors.join(', ')}`);
  }
});
console.log();

// 9. Path Normalization Across Platforms
console.log('9. Cross-Platform Path Normalization:');

class PathNormalizer {
  static normalize(filepath, targetPlatform = process.platform) {
    let normalized = filepath;

    // Remove null bytes
    normalized = normalized.replace(/\0/g, '');

    // Normalize Unicode
    normalized = normalized.normalize('NFC');

    // Platform-specific normalization
    if (targetPlatform === 'win32') {
      // Windows: Use backslashes
      normalized = normalized.split('/').join('\\');

      // Remove trailing dots and spaces
      const parts = normalized.split('\\');
      normalized = parts.map(part => {
        return part.replace(/\.+$/, '').replace(/ +$/, '');
      }).join('\\');

    } else {
      // Unix: Use forward slashes
      normalized = normalized.split('\\').join('/');
    }

    // Use Node's normalize
    normalized = path.normalize(normalized);

    return normalized;
  }

  static sanitize(filepath, targetPlatform = process.platform) {
    let sanitized = filepath;

    // Remove invalid characters
    const invalidChars = getInvalidChars(targetPlatform);
    for (const char of invalidChars) {
      sanitized = sanitized.replace(new RegExp(char, 'g'), '_');
    }

    // Handle reserved names
    if (targetPlatform === 'win32') {
      const basename = path.basename(sanitized);
      if (isWindowsReservedName(basename)) {
        sanitized = path.join(
          path.dirname(sanitized),
          '_' + basename
        );
      }
    }

    return this.normalize(sanitized, targetPlatform);
  }
}

const normTests = [
  'path/to//file.txt',
  'path\\to/mixed\\separators',
  'CON.txt',
  'file:name.txt',
  'file.   ',
  'café.txt'
];

console.log('  Normalizing and sanitizing paths:');
normTests.forEach(filepath => {
  const normalized = PathNormalizer.normalize(filepath);
  const sanitized = PathNormalizer.sanitize(filepath);
  console.log(`    Original:   '${filepath}'`);
  console.log(`    Normalized: '${normalized}'`);
  console.log(`    Sanitized:  '${sanitized}'`);
  console.log();
});

// 10. Production Recommendations
console.log('10. Production Recommendations:');
console.log();
console.log('  Path Length:');
console.log('    • Limit paths to 255 characters for maximum compatibility');
console.log('    • On Windows, enable long path support if needed');
console.log('    • Provide clear error messages when limits exceeded');
console.log();
console.log('  Reserved Names:');
console.log('    • Always check against Windows reserved names');
console.log('    • Add prefix/suffix to user-generated filenames');
console.log('    • Document restrictions clearly');
console.log();
console.log('  Characters:');
console.log('    • Sanitize user input to remove invalid characters');
console.log('    • Use safe character set: [a-zA-Z0-9._-]');
console.log('    • Preserve Unicode when possible');
console.log();
console.log('  Case Sensitivity:');
console.log('    • Normalize case for comparisons on case-insensitive systems');
console.log('    • Document case sensitivity behavior');
console.log('    • Test on all target platforms');
console.log();
console.log('  Unicode:');
console.log('    • Normalize to NFC for consistency');
console.log('    • Test with non-ASCII characters');
console.log('    • Be aware of visual homoglyphs');
console.log();

console.log('✅ Cross-platform edge cases complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Path behavior varies significantly across platforms');
console.log('  • Always validate maximum path lengths');
console.log('  • Check for reserved names on Windows');
console.log('  • Handle case sensitivity appropriately');
console.log('  • Normalize Unicode for consistency');
console.log('  • Test thoroughly on all target platforms');
