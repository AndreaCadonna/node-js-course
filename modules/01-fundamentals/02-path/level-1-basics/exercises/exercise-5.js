/**
 * Exercise 5: Create Cross-Platform File Paths
 *
 * Task:
 * Write a PathBuilder class that helps build cross-platform file paths.
 *
 * Requirements:
 * - Provide methods to build paths relative to a base directory
 * - Support building paths with multiple segments
 * - Allow getting the filename and extension
 * - Be completely cross-platform compatible
 *
 * Example:
 * const builder = new PathBuilder('/var/app');
 * builder.build('data', 'users.json')  // '/var/app/data/users.json'
 */

const path = require('path');

class PathBuilder {
  constructor(baseDir) {
    // TODO: Store the base directory
    // Hint: Use path.resolve() to ensure it's absolute
  }

  build(...segments) {
    // TODO: Build a path by joining base directory with segments
    // Hint: Use path.join() with this.baseDir and segments
  }

  getFilename(filepath) {
    // TODO: Extract the filename from a path
    // Hint: Use path.basename()
  }

  getExtension(filepath) {
    // TODO: Get the file extension
    // Hint: Use path.extname()
  }

  getDirectory(filepath) {
    // TODO: Get the directory path
    // Hint: Use path.dirname()
  }

  isUnderBase(filepath) {
    // TODO: Check if filepath is under the base directory
    // Hint: Resolve both paths and check if filepath starts with baseDir
  }
}

// Test cases
console.log('Testing PathBuilder:\n');

const builder = new PathBuilder('/var/app');

console.log('1. Building paths:');
console.log(`  build('data', 'users.json'): ${builder.build('data', 'users.json')}`);
console.log(`  build('config', 'db.json'): ${builder.build('config', 'db.json')}`);
console.log();

console.log('2. Extracting components:');
const testPath = '/home/user/documents/report.pdf';
console.log(`  Path: ${testPath}`);
console.log(`  Filename: ${builder.getFilename(testPath)}`);
console.log(`  Extension: ${builder.getExtension(testPath)}`);
console.log(`  Directory: ${builder.getDirectory(testPath)}`);
console.log();

console.log('3. Checking if path is under base:');
const paths = [
  '/var/app/data/file.txt',
  '/var/other/file.txt',
  '../../../etc/passwd'
];

paths.forEach(p => {
  const isUnder = builder.isUnderBase(p);
  console.log(`  ${p}`);
  console.log(`    Under /var/app: ${isUnder}`);
});

// Expected output:
// 1. Building paths:
//   build('data', 'users.json'): /var/app/data/users.json
//   build('config', 'db.json'): /var/app/config/db.json
//
// 2. Extracting components:
//   Path: /home/user/documents/report.pdf
//   Filename: report.pdf
//   Extension: .pdf
//   Directory: /home/user/documents
//
// 3. Checking if path is under base:
//   /var/app/data/file.txt
//     Under /var/app: true
//   /var/other/file.txt
//     Under /var/app: false
//   ../../../etc/passwd
//     Under /var/app: false
