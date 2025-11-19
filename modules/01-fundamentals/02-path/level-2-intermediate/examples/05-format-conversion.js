/**
 * Example 5: Format Conversion
 *
 * Demonstrates converting between Windows and Unix path formats.
 * Learn to use path.posix and path.win32 for cross-platform paths.
 *
 * Key Points:
 * - path.posix always uses Unix-style paths (/)
 * - path.win32 always uses Windows-style paths (\)
 * - Regular path module uses current platform
 * - Useful for handling paths from different systems
 * - Important for cross-platform tools
 */

const path = require('path');

console.log('=== Path Format Conversion ===\n');

// 1. Understanding path.posix and path.win32
console.log('1. Different path modules:');
console.log(`  Current platform: ${process.platform}`);
console.log(`  path.sep: '${path.sep}'`);
console.log(`  path.posix.sep: '${path.posix.sep}'`);
console.log(`  path.win32.sep: '${path.win32.sep}'`);
console.log();

// 2. Joining with different formats
console.log('2. Joining paths in different formats:');
const segments = ['users', 'john', 'documents', 'file.txt'];

const defaultJoin = path.join(...segments);
const posixJoin = path.posix.join(...segments);
const win32Join = path.win32.join(...segments);

console.log(`  Segments: [${segments.map(s => `'${s}'`).join(', ')}]`);
console.log(`  path.join():       '${defaultJoin}'`);
console.log(`  path.posix.join(): '${posixJoin}'`);
console.log(`  path.win32.join(): '${win32Join}'`);
console.log();

// 3. Converting Windows to Unix
console.log('3. Converting Windows paths to Unix:');

function windowsToUnix(windowsPath) {
  // Remove drive letter if present
  let result = windowsPath.replace(/^[A-Za-z]:/, '');

  // Replace backslashes with forward slashes
  result = result.split('\\').join('/');

  return result;
}

const windowsPaths = [
  'C:\\Users\\John\\Documents\\file.txt',
  'D:\\Projects\\app\\src\\index.js',
  '\\\\server\\share\\folder',
  'relative\\path\\file.txt'
];

console.log('  Windows → Unix conversion:');
windowsPaths.forEach(winPath => {
  const unixPath = windowsToUnix(winPath);
  console.log(`    '${winPath}'`);
  console.log(`    → '${unixPath}'`);
});
console.log();

// 4. Converting Unix to Windows
console.log('4. Converting Unix paths to Windows:');

function unixToWindows(unixPath, addDrive = 'C:') {
  // Replace forward slashes with backslashes
  let result = unixPath.split('/').join('\\');

  // Add drive letter if absolute path
  if (unixPath.startsWith('/') && addDrive) {
    result = addDrive + result;
  }

  return result;
}

const unixPaths = [
  '/home/john/documents/file.txt',
  '/var/www/html/index.html',
  'relative/path/file.txt',
  '../parent/file.txt'
];

console.log('  Unix → Windows conversion:');
unixPaths.forEach(unixPath => {
  const windowsPath = unixToWindows(unixPath);
  console.log(`    '${unixPath}'`);
  console.log(`    → '${windowsPath}'`);
});
console.log();

// 5. Using path.posix methods
console.log('5. Using path.posix for Unix-style operations:');

const unixStylePath = '/home/user/docs/../../etc/config';
const normalizedPosix = path.posix.normalize(unixStylePath);
const basenamePosix = path.posix.basename(unixStylePath);
const dirnamePosix = path.posix.dirname(unixStylePath);

console.log(`  Unix path: '${unixStylePath}'`);
console.log(`  path.posix.normalize(): '${normalizedPosix}'`);
console.log(`  path.posix.basename():  '${basenamePosix}'`);
console.log(`  path.posix.dirname():   '${dirnamePosix}'`);
console.log();

// 6. Using path.win32 methods
console.log('6. Using path.win32 for Windows-style operations:');

const windowsStylePath = 'C:\\Users\\John\\..\\Jane\\file.txt';
const normalizedWin32 = path.win32.normalize(windowsStylePath);
const basenameWin32 = path.win32.basename(windowsStylePath);
const dirnameWin32 = path.win32.dirname(windowsStylePath);

console.log(`  Windows path: '${windowsStylePath}'`);
console.log(`  path.win32.normalize(): '${normalizedWin32}'`);
console.log(`  path.win32.basename():  '${basenameWin32}'`);
console.log(`  path.win32.dirname():   '${dirnameWin32}'`);
console.log();

// 7. Cross-platform path handling
console.log('7. Detecting and normalizing any path:');

function detectAndNormalize(filepath) {
  // Detect if Windows path (has drive letter or backslashes)
  const isWindows = /^[A-Za-z]:/.test(filepath) || filepath.includes('\\');

  if (isWindows) {
    return {
      format: 'windows',
      original: filepath,
      normalized: path.win32.normalize(filepath),
      asUnix: windowsToUnix(filepath)
    };
  } else {
    return {
      format: 'unix',
      original: filepath,
      normalized: path.posix.normalize(filepath),
      asWindows: unixToWindows(filepath)
    };
  }
}

const mixedPaths = [
  'C:\\Users\\John\\file.txt',
  '/home/user/file.txt',
  'relative\\windows\\path',
  'relative/unix/path'
];

console.log('  Auto-detecting path format:');
mixedPaths.forEach(p => {
  const result = detectAndNormalize(p);
  console.log(`    Original: '${result.original}'`);
  console.log(`    Format: ${result.format}`);
  console.log(`    Normalized: '${result.normalized}'`);
  if (result.asUnix) {
    console.log(`    As Unix: '${result.asUnix}'`);
  }
  if (result.asWindows) {
    console.log(`    As Windows: '${result.asWindows}'`);
  }
  console.log();
});

// 8. Relative paths between different formats
console.log('8. Calculating relative paths in specific format:');

const fromUnix = '/home/user/projects/app';
const toUnix = '/home/user/documents/file.txt';
const relativePosix = path.posix.relative(fromUnix, toUnix);

console.log(`  Unix paths:`);
console.log(`    From: '${fromUnix}'`);
console.log(`    To:   '${toUnix}'`);
console.log(`    Relative: '${relativePosix}'`);
console.log();

const fromWin = 'C:\\Users\\John\\Projects\\app';
const toWin = 'C:\\Users\\John\\Documents\\file.txt';
const relativeWin32 = path.win32.relative(fromWin, toWin);

console.log(`  Windows paths:`);
console.log(`    From: '${fromWin}'`);
console.log(`    To:   '${toWin}'`);
console.log(`    Relative: '${relativeWin32}'`);
console.log();

// 9. URL-style paths
console.log('9. Converting to URL-style paths:');

function toURLPath(filepath) {
  // Convert to Unix-style (URLs always use /)
  let urlPath = windowsToUnix(filepath);

  // Encode special characters
  const parts = urlPath.split('/');
  const encoded = parts.map(part => {
    // Don't encode the separators
    if (part === '') return part;
    return encodeURIComponent(part);
  });

  return encoded.join('/');
}

const pathsForURL = [
  'C:\\Users\\John Smith\\file with spaces.txt',
  '/home/user/文件.txt',
  'folder/file (1).txt'
];

console.log('  Converting to URL-safe paths:');
pathsForURL.forEach(p => {
  const urlPath = toURLPath(p);
  console.log(`    '${p}'`);
  console.log(`    → '${urlPath}'`);
});
console.log();

// 10. Building cross-platform utilities
console.log('10. Cross-platform path utility:');

class PathConverter {
  static toUnix(filepath) {
    return windowsToUnix(filepath);
  }

  static toWindows(filepath, drive = 'C:') {
    return unixToWindows(filepath, drive);
  }

  static normalize(filepath, targetFormat = process.platform) {
    if (targetFormat === 'win32') {
      return path.win32.normalize(this.toWindows(filepath));
    } else {
      return path.posix.normalize(this.toUnix(filepath));
    }
  }

  static join(...segments) {
    return {
      unix: path.posix.join(...segments),
      windows: path.win32.join(...segments),
      current: path.join(...segments)
    };
  }
}

console.log('  PathConverter utility examples:');
const testPath = 'C:\\Users\\John\\..\\Jane\\file.txt';
console.log(`    Original: '${testPath}'`);
console.log(`    toUnix(): '${PathConverter.toUnix(testPath)}'`);
console.log(`    normalize('unix'): '${PathConverter.normalize(testPath, 'linux')}'`);

const joinResult = PathConverter.join('folder', 'subfolder', 'file.txt');
console.log(`    join('folder', 'subfolder', 'file.txt'):`);
console.log(`      Unix:    '${joinResult.unix}'`);
console.log(`      Windows: '${joinResult.windows}'`);
console.log(`      Current: '${joinResult.current}'`);
console.log();

// 11. Handling UNC paths (Windows network paths)
console.log('11. Windows UNC paths:');

const uncPath = '\\\\server\\share\\folder\\file.txt';
const uncNormalized = path.win32.normalize(uncPath);
const uncParsed = path.win32.parse(uncPath);

console.log(`  UNC path: '${uncPath}'`);
console.log(`  Normalized: '${uncNormalized}'`);
console.log(`  Parsed:`, uncParsed);
console.log('  Note: UNC paths are Windows-only');
console.log();

// 12. Git-style paths (always Unix)
console.log('12. Git-style paths (always forward slashes):');

function toGitPath(filepath) {
  // Git always uses forward slashes, even on Windows
  return windowsToUnix(filepath);
}

const gitPaths = [
  'C:\\Projects\\repo\\src\\index.js',
  'src/components/Button.tsx'
];

console.log('  Converting to Git-style:');
gitPaths.forEach(p => {
  console.log(`    '${p}' → '${toGitPath(p)}'`);
});
console.log();

// 13. Handling mixed separators
console.log('13. Handling mixed separators:');

function normalizeSeparators(filepath, targetSep = path.sep) {
  // Replace all separators with target
  return filepath.replace(/[\\/]+/g, targetSep);
}

const mixedSeparators = [
  'folder/subfolder\\file.txt',
  'C:\\Users/John\\Documents/file.txt'
];

console.log('  Normalizing mixed separators:');
mixedSeparators.forEach(p => {
  const unixStyle = normalizeSeparators(p, '/');
  const windowsStyle = normalizeSeparators(p, '\\');
  console.log(`    Original: '${p}'`);
  console.log(`    Unix:     '${unixStyle}'`);
  console.log(`    Windows:  '${windowsStyle}'`);
});
console.log();

// 14. Best practices
console.log('14. Format conversion best practices:');
console.log('  ✅ Use path.posix for Unix-style operations');
console.log('  ✅ Use path.win32 for Windows-style operations');
console.log('  ✅ Store paths in a consistent format internally');
console.log('  ✅ Convert to target format only when needed');
console.log('  ✅ Handle UNC paths separately on Windows');
console.log('  ✅ Use forward slashes for URLs and Git');
console.log('  ✅ Test conversions on target platform');
console.log('  ❌ Don\'t mix path formats in the same operation');
console.log('  ❌ Don\'t assume paths from one system work on another');
console.log('  ❌ Don\'t hardcode separators');
