/**
 * Exercise 2: Find Relative Path Between Two Locations
 *
 * Task:
 * Create a utility to calculate relative paths between files and directories.
 * Handle various scenarios including sibling directories, nested paths,
 * and creating import-style relative paths.
 *
 * Requirements:
 * - Calculate relative path from one location to another
 * - Handle both files and directories
 * - Create import-ready paths (starting with ./ or ../)
 * - Remove file extensions for imports
 * - Work with absolute paths
 *
 * Bonus:
 * - Support custom base directories
 * - Handle edge cases (same file, same directory)
 * - Create multiple import formats (CommonJS, ES6)
 */

const path = require('path');

/**
 * Calculate relative path between two file paths
 * @param {string} from - Source file path
 * @param {string} to - Target file path
 * @returns {string} Relative path from source to target
 */
function getRelativePath(from, to) {
  // TODO: Implement this function
  // Hints:
  // - Use path.relative() with directory paths
  // - Use path.dirname() for file paths
  // - Resolve both paths to absolute first
}

/**
 * Create import-ready relative path
 * @param {string} fromFile - Source file
 * @param {string} toFile - Target file to import
 * @returns {string} Import path (without extension, with ./ or ../)
 */
function createImportPath(fromFile, toFile) {
  // TODO: Implement this function
  // Hints:
  // - Get relative path
  // - Remove file extension
  // - Ensure it starts with ./ or ../
  // - Handle same directory case
}

/**
 * Get relative path from project root
 * @param {string} filepath - File path
 * @param {string} projectRoot - Project root directory
 * @returns {string} Path relative to project root
 */
function getProjectRelativePath(filepath, projectRoot) {
  // TODO: Implement this function
  // Hints:
  // - Resolve both paths to absolute
  // - Use path.relative()
  // - Handle case where file is outside project
}

/**
 * Calculate paths between multiple files
 * @param {string[]} files - Array of file paths
 * @returns {Object} Matrix of relative paths between all files
 */
function createPathMatrix(files) {
  // TODO: Implement this function
  // Hints:
  // - Create object with each file as key
  // - For each file, calculate relative paths to all others
  // - Return nested object structure
}

/**
 * Find common base directory
 * @param {string[]} paths - Array of paths
 * @returns {string} Common base directory
 */
function findCommonBase(paths) {
  // TODO: Implement this function
  // Hints:
  // - Split all paths into segments
  // - Find common prefix
  // - Join back into path
}

// Test cases
console.log('=== Exercise 2: Relative Path Calculation ===\n');

console.log('Test 1: Basic Relative Paths');
const pathPairs = [
  {
    from: '/project/src/components/Button.js',
    to: '/project/src/utils/helpers.js'
  },
  {
    from: '/project/src/pages/index.js',
    to: '/project/src/components/Header.js'
  },
  {
    from: '/project/lib/utils.js',
    to: '/project/src/app.js'
  }
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
const files = [
  '/project/src/app.js',
  '/project/lib/utils.js',
  '/project/test/app.test.js'
];

files.forEach(file => {
  const relative = getProjectRelativePath(file, projectRoot);
  console.log(`  ${file}`);
  console.log(`  → '${relative}'`);
});
console.log();

console.log('Test 4: Path Matrix');
const matrixFiles = [
  '/project/src/app.js',
  '/project/src/utils.js',
  '/project/lib/helpers.js'
];

const matrix = createPathMatrix(matrixFiles);
console.log('  Path relationships:');
console.log(JSON.stringify(matrix, null, 2));
console.log();

console.log('Test 5: Common Base');
const pathGroups = [
  ['/home/user/docs/a.txt', '/home/user/docs/b.txt', '/home/user/docs/sub/c.txt'],
  ['/var/log/app.log', '/var/log/system.log', '/var/log/error.log']
];

pathGroups.forEach(group => {
  const common = findCommonBase(group);
  console.log('  Paths:');
  group.forEach(p => console.log(`    ${p}`));
  console.log(`  Common base: '${common}'`);
  console.log();
});

// Expected output format:
// Test 1: Basic Relative Paths
//   From: /project/src/components/Button.js
//   To:   /project/src/utils/helpers.js
//   Relative: '../utils/helpers.js'
//
// Test 2: Import Paths
//   From: Button.js
//   To:   helpers.js
//   Import: import { something } from '../utils/helpers';
//
// Test 3: Project Relative Paths
//   /project/src/app.js
//   → 'src/app.js'
