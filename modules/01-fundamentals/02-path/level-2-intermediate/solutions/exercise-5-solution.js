/**
 * Solution to Exercise 5: Handle Special Characters in Paths
 */

const path = require('path');
const os = require('os');

function expandTilde(filepath) {
  if (filepath.startsWith('~/') || filepath === '~') {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

function countTraversals(filepath) {
  const normalized = path.normalize(filepath);
  const segments = normalized.split(path.sep);
  return segments.filter(seg => seg === '..').length;
}

function safeResolve(filepath, maxTraversals = 3) {
  const count = countTraversals(filepath);
  if (count > maxTraversals) {
    throw new Error(`Too many traversals: ${count} (max: ${maxTraversals})`);
  }
  return path.normalize(filepath);
}

function resolveSpecialChars(filepath) {
  const segments = filepath.split(/[\/\\]/);
  const result = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      continue;
    } else if (segment === '..') {
      if (result.length > 0) {
        result.pop();
      }
    } else {
      result.push(segment);
    }
  }

  return result.join('/') || '.';
}

function escapesBaseDir(basePath, relativePath) {
  const base = path.resolve(basePath);
  const target = path.resolve(base, relativePath);
  return !target.startsWith(base + path.sep) && target !== base;
}

function simplifyPath(filepath) {
  const isAbsolute = filepath.startsWith('/');
  const segments = filepath.split(/[\/\\]/);
  const result = [];

  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      continue;
    } else if (segment === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop();
      } else if (!isAbsolute) {
        result.push('..');
      }
    } else {
      result.push(segment);
    }
  }

  const joined = result.join('/');
  return isAbsolute ? '/' + joined : (joined || '.');
}

function navigate(currentPath, navigation) {
  return path.normalize(path.join(currentPath, navigation));
}

function parsePathSegments(filepath) {
  const segments = filepath.split(/[\/\\]/).filter(s => s);
  return segments.map(segment => {
    if (segment === '..') {
      return { segment, type: 'parent' };
    } else if (segment === '.') {
      return { segment, type: 'current' };
    } else {
      return { segment, type: 'normal' };
    }
  });
}

function validateSpecialChars(filepath) {
  const issues = [];

  // Check for multiple consecutive dots
  if (/\.{3,}/.test(filepath)) {
    issues.push('Multiple consecutive dots detected');
  }

  // Check for suspicious patterns
  if (filepath.includes('.../')) {
    issues.push('Suspicious pattern: .../ ');
  }

  return { valid: issues.length === 0, issues };
}

// Test cases
console.log('=== Solution to Exercise 5 ===\n');

console.log('Test 1: Expand Tilde');
console.log(`  '~/documents' → '${expandTilde('~/documents')}'`);
console.log(`  '~' → '${expandTilde('~')}'`);
console.log();

console.log('Test 2: Count Traversals');
console.log(`  '../file.txt' → ${countTraversals('../file.txt')} traversal(s)`);
console.log(`  '../../file.txt' → ${countTraversals('../../file.txt')} traversal(s)`);
console.log();

console.log('Test 3: Resolve Special Characters');
console.log(`  'a/./b/c' → '${resolveSpecialChars('a/./b/c')}'`);
console.log(`  'a/b/../c' → '${resolveSpecialChars('a/b/../c')}'`);
console.log();

console.log('Test 4: Simplify Path');
console.log(`  '/a/./b/../c/' → '${simplifyPath('/a/./b/../c/')}'`);
console.log(`  '../a/./b/../c' → '${simplifyPath('../a/./b/../c')}'`);
console.log();

console.log('Test 5: Navigate');
console.log(`  navigate('/home/user/docs', '..') → '${navigate('/home/user/docs', '..')}'`);
console.log(`  navigate('/home/user', 'documents') → '${navigate('/home/user', 'documents')}'`);

console.log('\n✅ Exercise 5 Solution Complete');
