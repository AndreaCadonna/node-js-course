/**
 * Solution to Exercise 2: Find Relative Path Between Two Locations
 */

const path = require('path');

function getRelativePath(from, to) {
  const fromDir = path.dirname(path.resolve(from));
  const toResolved = path.resolve(to);
  return path.relative(fromDir, toResolved);
}

function createImportPath(fromFile, toFile) {
  const fromDir = path.dirname(path.resolve(fromFile));
  const toResolved = path.resolve(toFile);
  const relative = path.relative(fromDir, toResolved);

  // Remove extension
  const withoutExt = relative.replace(/\.[^/.]+$/, '');

  // Ensure it starts with ./ or ../
  if (!withoutExt.startsWith('.')) {
    return './' + withoutExt;
  }

  return withoutExt;
}

function getProjectRelativePath(filepath, projectRoot) {
  const resolved = path.resolve(filepath);
  const root = path.resolve(projectRoot);
  return path.relative(root, resolved);
}

function createPathMatrix(files) {
  const matrix = {};

  files.forEach(fromFile => {
    matrix[fromFile] = {};
    files.forEach(toFile => {
      if (fromFile !== toFile) {
        matrix[fromFile][toFile] = createImportPath(fromFile, toFile);
      }
    });
  });

  return matrix;
}

function findCommonBase(paths) {
  if (paths.length === 0) return '';
  if (paths.length === 1) return path.dirname(paths[0]);

  const splitPaths = paths.map(p => path.resolve(p).split(path.sep));
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

// Test cases
console.log('=== Solution to Exercise 2 ===\n');

console.log('Test 1: Basic Relative Paths');
const pathPairs = [
  { from: '/project/src/components/Button.js', to: '/project/src/utils/helpers.js' },
  { from: '/project/src/pages/index.js', to: '/project/src/components/Header.js' },
  { from: '/project/lib/utils.js', to: '/project/src/app.js' }
];

pathPairs.forEach(pair => {
  const relative = getRelativePath(pair.from, pair.to);
  console.log(`  From: ${pair.from}`);
  console.log(`  To:   ${pair.to}`);
  console.log(`  Relative: '${relative}'`);
  console.log();
});

console.log('Test 2: Import Paths');
pathPairs.forEach(pair => {
  const importPath = createImportPath(pair.from, pair.to);
  console.log(`  From: ${path.basename(pair.from)}`);
  console.log(`  To:   ${path.basename(pair.to)}`);
  console.log(`  Import: import { something } from '${importPath}';`);
  console.log();
});

console.log('Test 3: Project Relative Paths');
const projectRoot = '/project';
const files = ['/project/src/app.js', '/project/lib/utils.js', '/project/test/app.test.js'];

files.forEach(file => {
  const relative = getProjectRelativePath(file, projectRoot);
  console.log(`  ${file} → '${relative}'`);
});
console.log();

console.log('Test 4: Common Base');
const pathGroups = [
  ['/home/user/docs/a.txt', '/home/user/docs/b.txt', '/home/user/docs/sub/c.txt']
];

pathGroups.forEach(group => {
  const common = findCommonBase(group);
  console.log('  Paths:');
  group.forEach(p => console.log(`    ${p}`));
  console.log(`  Common base: '${common}'`);
});

console.log('\n✅ Exercise 2 Solution Complete');
