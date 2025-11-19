/**
 * Solution to Exercise 4: Build a Path Utility Library
 */

const path = require('path');

function getNameWithoutExt(filepath) {
  const basename = path.basename(filepath);
  const ext = path.extname(basename);
  return basename.slice(0, basename.length - ext.length);
}

function changeExtension(filepath, newExt) {
  const ext = newExt.startsWith('.') ? newExt : '.' + newExt;
  const parsed = path.parse(filepath);
  return path.format({ ...parsed, base: undefined, ext });
}

function addSuffix(filepath, suffix) {
  const parsed = path.parse(filepath);
  return path.format({ ...parsed, name: parsed.name + suffix, base: undefined });
}

function getParentDirs(filepath) {
  const parents = [];
  let current = path.dirname(filepath);
  while (current !== path.dirname(current)) {
    parents.push(current);
    current = path.dirname(current);
  }
  parents.push(current);
  return parents;
}

function getPathDepth(filepath) {
  const normalized = path.normalize(filepath);
  return normalized.split(path.sep).filter(p => p && p !== '.').length;
}

function isChildOf(childPath, parentPath) {
  const child = path.resolve(childPath);
  const parent = path.resolve(parentPath);
  const relative = path.relative(parent, child);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function findCommonBase(paths) {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);

  const splitPaths = paths.map(p => p.split(path.sep));
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

function parseVersion(filepath) {
  const parsed = path.parse(filepath);
  const versionPattern = /^(.+?)[-_]v?(\d+\.\d+\.\d+)$/;
  const match = parsed.name.match(versionPattern);

  if (match) {
    return { basename: match[1], version: match[2], ext: parsed.ext };
  }
  return null;
}

function extractDate(filepath) {
  const basename = path.basename(filepath);
  const patterns = [
    { regex: /(\d{4}-\d{2}-\d{2})/, name: 'YYYY-MM-DD' },
    { regex: /(\d{4}\d{2}\d{2})/, name: 'YYYYMMDD' },
    { regex: /(\d{2}-\d{2}-\d{4})/, name: 'DD-MM-YYYY' }
  ];

  for (const { regex, name } of patterns) {
    const match = basename.match(regex);
    if (match) {
      return { date: match[1], pattern: name };
    }
  }
  return null;
}

function ensureTrailingSlash(dirPath) {
  return dirPath.endsWith(path.sep) ? dirPath : dirPath + path.sep;
}

function removeTrailingSlash(dirPath) {
  if (dirPath === '/' || dirPath === '\\') return dirPath;
  return dirPath.replace(/[\/\\]+$/, '');
}

class PathUtils {
  constructor(basePath = process.cwd()) {
    this.basePath = path.resolve(basePath);
  }

  resolve(...segments) {
    return path.resolve(this.basePath, ...segments);
  }

  relative(filepath) {
    return path.relative(this.basePath, path.resolve(filepath));
  }

  isInside(filepath) {
    const resolved = path.resolve(filepath);
    return resolved.startsWith(this.basePath + path.sep) || resolved === this.basePath;
  }

  getNameWithoutExt(filepath) {
    return getNameWithoutExt(filepath);
  }

  changeExtension(filepath, newExt) {
    return changeExtension(filepath, newExt);
  }

  addSuffix(filepath, suffix) {
    return addSuffix(filepath, suffix);
  }
}

// Test cases
console.log('=== Solution to Exercise 4 ===\n');

console.log('Test 1: Name Without Extension');
console.log(`  'document.pdf' → '${getNameWithoutExt('document.pdf')}'`);
console.log(`  'archive.tar.gz' → '${getNameWithoutExt('archive.tar.gz')}'`);
console.log();

console.log('Test 2: Change Extension');
console.log(`  'document.txt' → '${changeExtension('document.txt', '.pdf')}'`);
console.log();

console.log('Test 3: Add Suffix');
console.log(`  'photo.jpg' + '-thumb' → '${addSuffix('photo.jpg', '-thumb')}'`);
console.log();

console.log('Test 4: PathUtils Class');
const utils = new PathUtils('/home/user/project');
console.log(`  Base: ${utils.basePath}`);
console.log(`  resolve('src', 'app.js'): '${utils.resolve('src', 'app.js')}'`);
console.log(`  isInside('${utils.basePath}/src'): ${utils.isInside(utils.basePath + '/src')}`);

console.log('\n✅ Exercise 4 Solution Complete');
