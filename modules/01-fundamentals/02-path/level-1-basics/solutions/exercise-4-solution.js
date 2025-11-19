/**
 * Solution: Exercise 4 - Build Absolute Paths from Relative Ones
 */

const path = require('path');

function makeAbsolute(relativePath) {
  return path.resolve(relativePath);
}

function isPathAbsolute(filepath) {
  return path.isAbsolute(filepath);
}

// Test cases
console.log('Testing makeAbsolute:\n');
console.log(`Current directory: ${process.cwd()}\n`);

const testPaths = [
  'config/app.json',
  './data/users.json',
  '../parent/file.txt',
  'just-a-file.txt',
  '/already/absolute.txt'
];

testPaths.forEach(filepath => {
  const isAbsolute = isPathAbsolute(filepath);
  const absolute = makeAbsolute(filepath);
  console.log(`Input: ${filepath}`);
  console.log(`Already absolute: ${isAbsolute}`);
  console.log(`Absolute path: ${absolute}`);
  console.log();
});

// Bonus: Make absolute from a custom base directory
function makeAbsoluteFrom(basePath, relativePath) {
  return path.resolve(basePath, relativePath);
}

console.log('Making absolute from custom base:\n');
const baseDir = '/var/app';
const relativePaths = [
  'config/db.json',
  '../sibling/file.txt',
  'data/users.csv'
];

relativePaths.forEach(relPath => {
  const absolute = makeAbsoluteFrom(baseDir, relPath);
  console.log(`Base: ${baseDir}`);
  console.log(`Relative: ${relPath}`);
  console.log(`Absolute: ${absolute}`);
  console.log();
});

// Bonus: Convert absolute to relative
function makeRelative(from, to) {
  return path.relative(from, to);
}

console.log('Converting to relative paths:\n');
const from = '/home/user/project';
const targets = [
  '/home/user/project/src/index.js',
  '/home/user/data/file.txt',
  '/var/log/app.log'
];

targets.forEach(target => {
  const relative = makeRelative(from, target);
  console.log(`From: ${from}`);
  console.log(`To: ${target}`);
  console.log(`Relative: ${relative}`);
  console.log();
});
