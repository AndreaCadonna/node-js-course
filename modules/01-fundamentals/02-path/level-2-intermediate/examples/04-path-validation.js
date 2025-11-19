/**
 * Example 4: Path Validation
 *
 * Demonstrates comprehensive path validation techniques.
 * Learn how to validate path structure, check for invalid characters,
 * and ensure paths are safe to use.
 *
 * Key Points:
 * - Validate path structure before file operations
 * - Check for platform-specific invalid characters
 * - Ensure paths stay within allowed boundaries
 * - Handle edge cases (empty paths, null bytes, etc.)
 * - Implement multi-layer validation
 */

const path = require('path');

console.log('=== Path Validation ===\n');

// 1. Basic path structure validation
console.log('1. Basic path structure validation:');

function isValidPathStructure(filepath) {
  // Check for null or undefined
  if (!filepath || typeof filepath !== 'string') {
    return false;
  }

  // Check for empty string
  if (filepath.trim() === '') {
    return false;
  }

  // Check for null bytes (security risk)
  if (filepath.includes('\0')) {
    return false;
  }

  return true;
}

const testPaths = [
  'valid/path/file.txt',
  '',
  null,
  'path\0with\0nulls',
  '   ',
  undefined
];

console.log('  Testing basic structure:');
testPaths.forEach(p => {
  const display = p === null ? 'null' :
                  p === undefined ? 'undefined' :
                  `'${p}'`;
  const valid = isValidPathStructure(p);
  console.log(`    ${display.padEnd(30)} → ${valid ? '✓ Valid' : '✗ Invalid'}`);
});
console.log();

// 2. Platform-specific invalid characters
console.log('2. Platform-specific invalid characters:');

function hasInvalidCharacters(filepath) {
  // Windows has more restrictions
  const windowsInvalid = /[<>:"|?*\x00-\x1F]/;
  const unixInvalid = /\x00/; // Null byte

  if (process.platform === 'win32') {
    return windowsInvalid.test(filepath);
  } else {
    return unixInvalid.test(filepath);
  }
}

const charTests = [
  'normal/path.txt',
  'file<name>.txt',      // Invalid on Windows
  'file:name.txt',       // Invalid on Windows
  'file|name.txt',       // Invalid on Windows
  'file*name.txt',       // Invalid on Windows (wildcard)
  'file?name.txt',       // Invalid on Windows (wildcard)
  'file\x00name.txt'     // Invalid on all platforms
];

console.log(`  Current platform: ${process.platform}`);
console.log('  Testing for invalid characters:');
charTests.forEach(p => {
  const hasInvalid = hasInvalidCharacters(p);
  console.log(`    '${p}' → ${hasInvalid ? '✗ Invalid' : '✓ Valid'}`);
});
console.log();

// 3. Path length validation
console.log('3. Path length validation:');

function isValidLength(filepath) {
  // Windows: 260 character limit for full path (MAX_PATH)
  // Unix: 4096 typical limit (PATH_MAX)
  // Individual component: 255 characters (NAME_MAX)

  const maxPathLength = process.platform === 'win32' ? 260 : 4096;
  const maxComponentLength = 255;

  if (filepath.length > maxPathLength) {
    return { valid: false, reason: 'Path too long' };
  }

  const components = filepath.split(path.sep);
  for (const component of components) {
    if (component.length > maxComponentLength) {
      return { valid: false, reason: 'Component too long' };
    }
  }

  return { valid: true };
}

const lengthTests = [
  'short/path.txt',
  'a'.repeat(300) + '/file.txt',  // Long component
  'x/'.repeat(1000) + 'file.txt'  // Long total path
];

console.log('  Testing path lengths:');
lengthTests.forEach(p => {
  const result = isValidLength(p);
  const display = p.length > 50 ? `'${p.substring(0, 47)}...'` : `'${p}'`;
  console.log(`    ${display}`);
  console.log(`      Length: ${p.length} chars → ${result.valid ? '✓ Valid' : `✗ ${result.reason}`}`);
});
console.log();

// 4. Reserved names (Windows)
console.log('4. Reserved names (Windows):');

function hasReservedName(filepath) {
  const reserved = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];

  if (process.platform !== 'win32') {
    return false; // Only Windows has reserved names
  }

  const basename = path.basename(filepath, path.extname(filepath)).toUpperCase();
  return reserved.includes(basename);
}

const reservedTests = [
  'normal.txt',
  'CON',
  'CON.txt',
  'folder/PRN.doc',
  'AUX.log',
  'COM1'
];

console.log(`  Current platform: ${process.platform}`);
if (process.platform === 'win32') {
  console.log('  These names are reserved on Windows:');
  reservedTests.forEach(p => {
    const isReserved = hasReservedName(p);
    console.log(`    '${p}' → ${isReserved ? '✗ Reserved' : '✓ OK'}`);
  });
} else {
  console.log('  Reserved names only apply to Windows');
  console.log('  On Unix/Linux, these names are allowed');
}
console.log();

// 5. Checking for hidden files
console.log('5. Detecting hidden files:');

function isHiddenFile(filepath) {
  const basename = path.basename(filepath);

  if (process.platform === 'win32') {
    // Windows: Would need file system check for hidden attribute
    // Starting with . is Unix convention but sometimes used
    return basename.startsWith('.');
  } else {
    // Unix: Files starting with . are hidden
    return basename.startsWith('.') && basename !== '.' && basename !== '..';
  }
}

const hiddenTests = [
  'normal.txt',
  '.hidden',
  '.gitignore',
  'folder/.env',
  '.',
  '..'
];

console.log('  Testing for hidden files:');
hiddenTests.forEach(p => {
  const hidden = isHiddenFile(p);
  console.log(`    '${p}' → ${hidden ? '👁️  Hidden' : '👀 Visible'}`);
});
console.log();

// 6. Absolute vs relative validation
console.log('6. Validating absolute vs relative paths:');

function validatePathType(filepath, shouldBeAbsolute) {
  const isAbs = path.isAbsolute(filepath);

  if (shouldBeAbsolute && !isAbs) {
    return { valid: false, reason: 'Expected absolute path' };
  }

  if (!shouldBeAbsolute && isAbs) {
    return { valid: false, reason: 'Expected relative path' };
  }

  return { valid: true };
}

const typeTests = [
  { path: '/absolute/path', absolute: true },
  { path: 'relative/path', absolute: true },
  { path: '/absolute/path', absolute: false },
  { path: 'relative/path', absolute: false }
];

console.log('  Testing path types:');
typeTests.forEach(test => {
  const result = validatePathType(test.path, test.absolute);
  const expected = test.absolute ? 'absolute' : 'relative';
  console.log(`    '${test.path}' expecting ${expected}:`);
  console.log(`      → ${result.valid ? '✓ Valid' : `✗ ${result.reason}`}`);
});
console.log();

// 7. Extension validation
console.log('7. Validating file extensions:');

function hasValidExtension(filepath, allowedExtensions) {
  const ext = path.extname(filepath).toLowerCase();

  if (allowedExtensions.length === 0) {
    return true; // No restrictions
  }

  return allowedExtensions.includes(ext);
}

const extTests = [
  { path: 'document.pdf', allowed: ['.pdf', '.doc', '.docx'] },
  { path: 'image.jpg', allowed: ['.pdf', '.doc', '.docx'] },
  { path: 'script.js', allowed: ['.js', '.ts'] },
  { path: 'noextension', allowed: ['.txt'] }
];

console.log('  Testing file extensions:');
extTests.forEach(test => {
  const valid = hasValidExtension(test.path, test.allowed);
  console.log(`    '${test.path}'`);
  console.log(`      Allowed: [${test.allowed.join(', ')}]`);
  console.log(`      → ${valid ? '✓ Valid' : '✗ Invalid'}`);
});
console.log();

// 8. Comprehensive validation function
console.log('8. Comprehensive path validation:');

function validatePath(filepath, options = {}) {
  const {
    allowRelative = true,
    allowAbsolute = true,
    maxLength = process.platform === 'win32' ? 260 : 4096,
    allowedExtensions = [],
    allowHidden = true
  } = options;

  const errors = [];

  // Basic structure
  if (!isValidPathStructure(filepath)) {
    errors.push('Invalid path structure');
    return { valid: false, errors };
  }

  // Path type
  const isAbs = path.isAbsolute(filepath);
  if (isAbs && !allowAbsolute) {
    errors.push('Absolute paths not allowed');
  }
  if (!isAbs && !allowRelative) {
    errors.push('Relative paths not allowed');
  }

  // Invalid characters
  if (hasInvalidCharacters(filepath)) {
    errors.push('Contains invalid characters');
  }

  // Length
  if (filepath.length > maxLength) {
    errors.push(`Path too long (max: ${maxLength})`);
  }

  // Reserved names (Windows)
  if (hasReservedName(filepath)) {
    errors.push('Uses reserved name');
  }

  // Extension
  if (allowedExtensions.length > 0) {
    if (!hasValidExtension(filepath, allowedExtensions)) {
      errors.push('Invalid file extension');
    }
  }

  // Hidden files
  if (!allowHidden && isHiddenFile(filepath)) {
    errors.push('Hidden files not allowed');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const comprehensiveTests = [
  { path: 'normal/file.txt', options: {} },
  { path: '.hidden', options: { allowHidden: false } },
  { path: '/absolute/path', options: { allowAbsolute: false } },
  { path: 'file.jpg', options: { allowedExtensions: ['.txt', '.pdf'] } },
  { path: 'file<name>.txt', options: {} }
];

console.log('  Comprehensive validation:');
comprehensiveTests.forEach(test => {
  const result = validatePath(test.path, test.options);
  console.log(`    '${test.path}':`);
  if (result.valid) {
    console.log(`      ✓ Valid`);
  } else {
    console.log(`      ✗ Invalid:`);
    result.errors.forEach(err => console.log(`        - ${err}`));
  }
});
console.log();

// 9. Custom validation rules
console.log('9. Custom validation rules:');

function createPathValidator(rules) {
  return function(filepath) {
    const errors = [];

    for (const rule of rules) {
      const result = rule.validate(filepath);
      if (!result.valid) {
        errors.push(result.message);
      }
    }

    return { valid: errors.length === 0, errors };
  };
}

const customRules = [
  {
    name: 'noSpaces',
    validate: (p) => ({
      valid: !p.includes(' '),
      message: 'Path cannot contain spaces'
    })
  },
  {
    name: 'mustHaveExtension',
    validate: (p) => ({
      valid: path.extname(p) !== '',
      message: 'File must have an extension'
    })
  }
];

const customValidator = createPathValidator(customRules);

const customTests = [
  'file.txt',
  'file with spaces.txt',
  'noextension'
];

console.log('  Custom rules: no spaces, must have extension');
customTests.forEach(p => {
  const result = customValidator(p);
  console.log(`    '${p}':`);
  if (result.valid) {
    console.log(`      ✓ Valid`);
  } else {
    result.errors.forEach(err => console.log(`      ✗ ${err}`));
  }
});
console.log();

// 10. Best practices
console.log('10. Path validation best practices:');
console.log('  ✅ Validate all user-provided paths');
console.log('  ✅ Check for null bytes (security)');
console.log('  ✅ Validate against platform-specific rules');
console.log('  ✅ Combine multiple validation checks');
console.log('  ✅ Provide clear error messages');
console.log('  ✅ Consider length limits');
console.log('  ✅ Check for reserved names on Windows');
console.log('  ❌ Don\'t rely on single validation method');
console.log('  ❌ Don\'t forget platform differences');
console.log('  ❌ Don\'t trust normalized paths without validation');
