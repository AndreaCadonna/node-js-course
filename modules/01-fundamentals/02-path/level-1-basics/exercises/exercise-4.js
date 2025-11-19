/**
 * Exercise 4: Build Absolute Paths from Relative Ones
 *
 * Task:
 * Write a function that converts relative paths to absolute paths.
 *
 * Requirements:
 * - Use path.resolve() to create absolute paths
 * - Handle relative paths like './' and '../'
 * - Return the full absolute path
 *
 * Example:
 * makeAbsolute('config/app.json')
 * should return: '/current/working/directory/config/app.json'
 */

const path = require('path');

function makeAbsolute(relativePath) {
  // TODO: Implement this function
  // Hint: Use path.resolve()
}

// Bonus: Check if a path is already absolute
function isPathAbsolute(filepath) {
  // TODO: Implement this function
  // Hint: Use path.isAbsolute()
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

// Expected output will vary based on your current directory
// Example:
// Input: config/app.json
// Already absolute: false
// Absolute path: /home/user/node-preparation/modules/01-fundamentals/02-path/level-1-basics/exercises/config/app.json
//
// Input: ./data/users.json
// Already absolute: false
// Absolute path: /home/user/node-preparation/modules/01-fundamentals/02-path/level-1-basics/exercises/data/users.json
//
// Input: /already/absolute.txt
// Already absolute: true
// Absolute path: /already/absolute.txt
