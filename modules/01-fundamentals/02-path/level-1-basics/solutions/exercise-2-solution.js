/**
 * Solution: Exercise 2 - Extract Filename from Full Path
 */

const path = require('path');

function getFilename(filepath) {
  return path.basename(filepath);
}

// Test cases
console.log('Testing getFilename:\n');

const testPaths = [
  '/home/user/documents/report.pdf',
  'C:\\Users\\john\\Desktop\\photo.jpg',
  'config/database.json',
  '../data/users.csv',
  'just-a-file.txt'
];

testPaths.forEach(filepath => {
  const filename = getFilename(filepath);
  console.log(`Path: ${filepath}`);
  console.log(`Filename: ${filename}`);
  console.log();
});

// Bonus: Get filename without extension
function getFilenameWithoutExtension(filepath) {
  const filename = path.basename(filepath);
  const ext = path.extname(filename);
  return path.basename(filename, ext);
}

console.log('Filenames without extensions:\n');
testPaths.forEach(filepath => {
  const nameOnly = getFilenameWithoutExtension(filepath);
  console.log(`${filepath} -> ${nameOnly}`);
});
