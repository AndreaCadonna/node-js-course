/**
 * Exercise 2: Extract Filename from Full Path
 *
 * Task:
 * Write a function that extracts just the filename from a full file path.
 *
 * Requirements:
 * - Use path.basename() to extract the filename
 * - Work with both absolute and relative paths
 * - Handle paths from different operating systems
 *
 * Example:
 * getFilename('/home/user/documents/report.pdf')
 * should return: 'report.pdf'
 */

const path = require('path');

function getFilename(filepath) {
  // TODO: Implement this function
  // Hint: Use path.basename()
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

// Expected output:
// Path: /home/user/documents/report.pdf
// Filename: report.pdf
//
// Path: C:\Users\john\Desktop\photo.jpg
// Filename: photo.jpg
//
// Path: config/database.json
// Filename: database.json
//
// Path: ../data/users.csv
// Filename: users.csv
//
// Path: just-a-file.txt
// Filename: just-a-file.txt
