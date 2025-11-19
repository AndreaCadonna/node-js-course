/**
 * Example 7: Building Path Utilities
 *
 * Demonstrates creating useful path utility functions by combining
 * path module methods. Build a reusable toolkit for common path operations.
 *
 * Key Points:
 * - Combine path methods to create higher-level utilities
 * - Handle edge cases consistently
 * - Create reusable, well-tested functions
 * - Build domain-specific path helpers
 * - Focus on common real-world needs
 */

const path = require('path');

console.log('=== Path Utilities ===\n');

// 1. Get filename without extension
console.log('1. Get filename without extension:');

function getNameWithoutExt(filepath) {
  const basename = path.basename(filepath);
  const ext = path.extname(basename);
  return basename.slice(0, basename.length - ext.length);
}

const filenameTests = [
  'document.pdf',
  'archive.tar.gz',
  '/path/to/file.txt',
  'noextension',
  '.hidden'
];

filenameTests.forEach(file => {
  const name = getNameWithoutExt(file);
  console.log(`  '${file}' → '${name}'`);
});
console.log();

// 2. Change file extension
console.log('2. Change file extension:');

function changeExtension(filepath, newExt) {
  // Ensure extension starts with .
  const ext = newExt.startsWith('.') ? newExt : '.' + newExt;

  const parsed = path.parse(filepath);
  return path.format({
    ...parsed,
    base: undefined, // Remove base so name + ext is used
    ext: ext
  });
}

const extTests = [
  { file: 'document.txt', newExt: '.pdf' },
  { file: 'script.js', newExt: 'ts' },
  { file: '/path/to/image.jpg', newExt: '.png' }
];

extTests.forEach(test => {
  const result = changeExtension(test.file, test.newExt);
  console.log(`  '${test.file}' + '${test.newExt}' → '${result}'`);
});
console.log();

// 3. Add suffix to filename
console.log('3. Add suffix to filename (before extension):');

function addSuffix(filepath, suffix) {
  const parsed = path.parse(filepath);
  return path.format({
    ...parsed,
    name: parsed.name + suffix,
    base: undefined
  });
}

const suffixTests = [
  { file: 'photo.jpg', suffix: '-thumb' },
  { file: 'document.pdf', suffix: '.backup' },
  { file: '/path/report.txt', suffix: '-final' }
];

suffixTests.forEach(test => {
  const result = addSuffix(test.file, test.suffix);
  console.log(`  '${test.file}' + '${test.suffix}' → '${result}'`);
});
console.log();

// 4. Ensure trailing slash
console.log('4. Ensure trailing slash (for directories):');

function ensureTrailingSlash(dirPath) {
  if (dirPath.endsWith(path.sep)) {
    return dirPath;
  }
  return dirPath + path.sep;
}

const dirTests = [
  '/home/user/documents',
  '/home/user/documents/',
  'C:\\Users\\John',
  'relative/path'
];

dirTests.forEach(dir => {
  const result = ensureTrailingSlash(dir);
  console.log(`  '${dir}' → '${result}'`);
});
console.log();

// 5. Remove trailing slash
console.log('5. Remove trailing slash:');

function removeTrailingSlash(dirPath) {
  // Don't remove if it's just the root
  if (dirPath === '/' || dirPath === '\\') {
    return dirPath;
  }

  return dirPath.replace(/[\/\\]+$/, '');
}

const trailingTests = [
  '/home/user/',
  '/home/user',
  '/',
  'C:\\',
  'relative/path///'
];

trailingTests.forEach(dir => {
  const result = removeTrailingSlash(dir);
  console.log(`  '${dir}' → '${result}'`);
});
console.log();

// 6. Get parent directories (all ancestors)
console.log('6. Get all parent directories:');

function getParentDirs(filepath) {
  const parents = [];
  let current = path.dirname(filepath);

  while (current !== path.dirname(current)) {
    parents.push(current);
    current = path.dirname(current);
  }

  // Add root
  parents.push(current);

  return parents;
}

const parentTest = '/home/user/documents/work/project/file.txt';
const parents = getParentDirs(parentTest);
console.log(`  Path: '${parentTest}'`);
console.log('  Parents:');
parents.forEach(p => console.log(`    '${p}'`));
console.log();

// 7. Find common base path
console.log('7. Find common base path:');

function findCommonBase(paths) {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);

  // Split all paths into components
  const splitPaths = paths.map(p => p.split(path.sep));

  // Find common prefix
  const first = splitPaths[0];
  let commonLength = 0;

  for (let i = 0; i < first.length; i++) {
    if (splitPaths.every(p => p[i] === first[i])) {
      commonLength++;
    } else {
      break;
    }
  }

  return first.slice(0, commonLength).join(path.sep) || path.sep;
}

const commonTests = [
  ['/home/user/docs/a.txt', '/home/user/docs/b.txt', '/home/user/docs/sub/c.txt'],
  ['/var/log/app.log', '/var/log/system.log'],
  ['C:\\Users\\John\\file1.txt', 'C:\\Users\\Jane\\file2.txt']
];

commonTests.forEach((paths, i) => {
  const common = findCommonBase(paths);
  console.log(`  Test ${i + 1}:`);
  paths.forEach(p => console.log(`    '${p}'`));
  console.log(`    Common base: '${common}'`);
  console.log();
});

// 8. Is path a child of another?
console.log('8. Check if path is child of another:');

function isChildOf(childPath, parentPath) {
  const child = path.resolve(childPath);
  const parent = path.resolve(parentPath);

  const relative = path.relative(parent, child);

  // If relative path starts with .., child is not inside parent
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

const childTests = [
  { child: '/home/user/docs/file.txt', parent: '/home/user' },
  { child: '/home/user/docs', parent: '/home/user/docs' },
  { child: '/var/log', parent: '/home/user' },
  { child: 'folder/file.txt', parent: 'folder' }
];

childTests.forEach(test => {
  const result = isChildOf(test.child, test.parent);
  console.log(`  Child:  '${test.child}'`);
  console.log(`  Parent: '${test.parent}'`);
  console.log(`  Is child? ${result ? 'Yes' : 'No'}`);
  console.log();
});

// 9. Path depth (number of levels)
console.log('9. Calculate path depth:');

function getPathDepth(filepath) {
  const normalized = path.normalize(filepath);
  const parts = normalized.split(path.sep).filter(p => p && p !== '.');

  return parts.length;
}

const depthTests = [
  'file.txt',
  'folder/file.txt',
  '/home/user/docs/work/file.txt',
  './folder/subfolder/file.txt',
  '../parent/file.txt'
];

depthTests.forEach(p => {
  const depth = getPathDepth(p);
  console.log(`  '${p}' → depth: ${depth}`);
});
console.log();

// 10. Comprehensive Path Utility Class
console.log('10. Complete PathUtils Class:');

class PathUtils {
  static getNameWithoutExt(filepath) {
    return getNameWithoutExt(filepath);
  }

  static changeExtension(filepath, newExt) {
    return changeExtension(filepath, newExt);
  }

  static addSuffix(filepath, suffix) {
    return addSuffix(filepath, suffix);
  }

  static ensureTrailingSlash(dirPath) {
    return ensureTrailingSlash(dirPath);
  }

  static removeTrailingSlash(dirPath) {
    return removeTrailingSlash(dirPath);
  }

  static getParentDirs(filepath) {
    return getParentDirs(filepath);
  }

  static findCommonBase(paths) {
    return findCommonBase(paths);
  }

  static isChildOf(childPath, parentPath) {
    return isChildOf(childPath, parentPath);
  }

  static getPathDepth(filepath) {
    return getPathDepth(filepath);
  }

  static hasExtension(filepath, extensions) {
    const ext = path.extname(filepath).toLowerCase();
    const allowed = extensions.map(e => e.toLowerCase());
    return allowed.includes(ext);
  }

  static replaceBasename(filepath, newBasename) {
    const dir = path.dirname(filepath);
    return path.join(dir, newBasename);
  }

  static getRelativeToProject(filepath, projectRoot) {
    return path.relative(projectRoot, path.resolve(filepath));
  }
}

console.log('  PathUtils class methods:');
console.log('    ✓ getNameWithoutExt()');
console.log('    ✓ changeExtension()');
console.log('    ✓ addSuffix()');
console.log('    ✓ ensureTrailingSlash()');
console.log('    ✓ removeTrailingSlash()');
console.log('    ✓ getParentDirs()');
console.log('    ✓ findCommonBase()');
console.log('    ✓ isChildOf()');
console.log('    ✓ getPathDepth()');
console.log('    ✓ hasExtension()');
console.log('    ✓ replaceBasename()');
console.log('    ✓ getRelativeToProject()');
console.log();

// Example usage
const testFile = '/project/src/components/Button.tsx';
console.log(`  Example: '${testFile}'`);
console.log(`    Name without ext: '${PathUtils.getNameWithoutExt(testFile)}'`);
console.log(`    Change to .jsx: '${PathUtils.changeExtension(testFile, '.jsx')}'`);
console.log(`    Add suffix: '${PathUtils.addSuffix(testFile, '.test')}'`);
console.log(`    Depth: ${PathUtils.getPathDepth(testFile)}`);
console.log(`    Has .tsx ext: ${PathUtils.hasExtension(testFile, ['.tsx', '.ts'])}`);
console.log();

// 11. File path patterns
console.log('11. Working with file patterns:');

function matchesPattern(filepath, pattern) {
  // Simple glob-like pattern matching
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexPattern}$`).test(filepath);
}

const patternTests = [
  { path: 'test.txt', pattern: '*.txt' },
  { path: 'file.js', pattern: '*.txt' },
  { path: 'component.tsx', pattern: '*.ts?' },
  { path: 'app.test.js', pattern: '*.test.js' }
];

console.log('  Simple pattern matching:');
patternTests.forEach(test => {
  const matches = matchesPattern(path.basename(test.path), test.pattern);
  console.log(`    '${test.path}' matches '${test.pattern}': ${matches ? 'Yes' : 'No'}`);
});
console.log();

// 12. Building project-relative paths
console.log('12. Project-relative path utilities:');

class ProjectPath {
  constructor(projectRoot) {
    this.root = path.resolve(projectRoot);
  }

  resolve(...segments) {
    return path.resolve(this.root, ...segments);
  }

  relative(filepath) {
    return path.relative(this.root, path.resolve(filepath));
  }

  isInProject(filepath) {
    const resolved = path.resolve(filepath);
    return resolved.startsWith(this.root + path.sep) || resolved === this.root;
  }

  src(...segments) {
    return this.resolve('src', ...segments);
  }

  dist(...segments) {
    return this.resolve('dist', ...segments);
  }

  test(...segments) {
    return this.resolve('test', ...segments);
  }
}

const project = new ProjectPath('/home/user/my-project');
console.log(`  Project root: ${project.root}`);
console.log(`  project.src('index.js'): '${project.src('index.js')}'`);
console.log(`  project.dist('bundle.js'): '${project.dist('bundle.js')}'`);
console.log(`  project.test('app.test.js'): '${project.test('app.test.js')}'`);
console.log();

// 13. Safe path operations
console.log('13. Safe path operation utilities:');

function safeJoin(...segments) {
  try {
    return path.join(...segments);
  } catch {
    return '';
  }
}

function safeResolve(...segments) {
  try {
    return path.resolve(...segments);
  } catch {
    return '';
  }
}

function safeNormalize(filepath) {
  try {
    return path.normalize(filepath);
  } catch {
    return '';
  }
}

console.log('  Safe operations handle errors gracefully');
console.log('  Example: safeJoin(null, undefined) → ""');
console.log();

// 14. Best practices
console.log('14. Path Utility Best Practices:');
console.log('  ✅ Create reusable utility functions');
console.log('  ✅ Handle edge cases consistently');
console.log('  ✅ Add error handling to utilities');
console.log('  ✅ Document expected inputs and outputs');
console.log('  ✅ Test utilities thoroughly');
console.log('  ✅ Make utilities platform-agnostic');
console.log('  ✅ Use descriptive function names');
console.log('  ✅ Combine multiple path operations logically');
console.log('  ❌ Don\'t reinvent built-in path methods');
console.log('  ❌ Don\'t assume specific platform behaviors');
console.log('  ❌ Don\'t ignore error cases');
