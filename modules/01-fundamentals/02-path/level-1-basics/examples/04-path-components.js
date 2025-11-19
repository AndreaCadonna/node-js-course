/**
 * Example 4: Extracting Path Components
 *
 * Demonstrates how to extract different components from a file path.
 * The path module provides several methods for parsing paths.
 *
 * Key Points:
 * - basename(): Get the filename
 * - dirname(): Get the directory path
 * - extname(): Get the file extension
 * - These work with any path (file doesn't need to exist)
 */

const path = require('path');

console.log('=== Extracting Path Components ===\n');

// Sample paths for demonstration
const unixPath = '/home/user/documents/report.pdf';
const windowsPath = 'C:\\Users\\john\\Desktop\\photo.jpg';
const relativePath = 'config/database.json';

// 1. basename() - Get filename
console.log('1. path.basename() - Extract filename:\n');

console.log('  Unix path:', unixPath);
console.log('  basename:', path.basename(unixPath));
console.log();

console.log('  Windows path:', windowsPath);
console.log('  basename:', path.basename(windowsPath));
console.log();

console.log('  Relative path:', relativePath);
console.log('  basename:', path.basename(relativePath));
console.log();

// basename() with extension removal
console.log('2. basename() with extension removed:\n');

const filename = 'document.pdf';
const fullPath = '/path/to/document.pdf';

console.log('  path.basename("document.pdf", ".pdf")');
console.log('  Result:', path.basename(filename, '.pdf'));
console.log();

console.log('  path.basename("/path/to/document.pdf", ".pdf")');
console.log('  Result:', path.basename(fullPath, '.pdf'));
console.log();

// Automatic extension detection
console.log('  Using extname() to remove any extension:');
const anyFile = 'report.docx';
const nameOnly = path.basename(anyFile, path.extname(anyFile));
console.log(`  File: ${anyFile}`);
console.log(`  Name only: ${nameOnly}`);
console.log();

// 3. dirname() - Get directory path
console.log('3. path.dirname() - Extract directory:\n');

console.log('  Unix path:', unixPath);
console.log('  dirname:', path.dirname(unixPath));
console.log();

console.log('  Windows path:', windowsPath);
console.log('  dirname:', path.dirname(windowsPath));
console.log();

console.log('  Relative path:', relativePath);
console.log('  dirname:', path.dirname(relativePath));
console.log();

// dirname() on edge cases
console.log('4. dirname() edge cases:\n');

console.log('  path.dirname("/file.txt")');
console.log('  Result:', path.dirname('/file.txt'));
console.log('  (Root directory)');
console.log();

console.log('  path.dirname("file.txt")');
console.log('  Result:', path.dirname('file.txt'));
console.log('  (Current directory)');
console.log();

// 5. extname() - Get file extension
console.log('5. path.extname() - Extract extension:\n');

const files = [
  'document.pdf',
  'photo.jpg',
  'archive.tar.gz',
  'README',
  '.gitignore',
  'file.test.js'
];

files.forEach(file => {
  console.log(`  ${file.padEnd(20)} -> "${path.extname(file)}"`);
});
console.log();

// 6. Combining methods
console.log('6. Combining methods:\n');

const samplePath = '/var/www/html/index.html';
console.log('  Full path:', samplePath);
console.log('  Directory:', path.dirname(samplePath));
console.log('  Filename:', path.basename(samplePath));
console.log('  Name only:', path.basename(samplePath, path.extname(samplePath)));
console.log('  Extension:', path.extname(samplePath));
console.log();

// 7. Practical example: File type checking
console.log('7. Practical example - File type checking:\n');

function getFileType(filepath) {
  const ext = path.extname(filepath).toLowerCase();

  const types = {
    '.jpg': 'Image',
    '.jpeg': 'Image',
    '.png': 'Image',
    '.pdf': 'Document',
    '.doc': 'Document',
    '.docx': 'Document',
    '.txt': 'Text',
    '.js': 'JavaScript',
    '.json': 'JSON',
    '.html': 'HTML'
  };

  return types[ext] || 'Unknown';
}

const testFiles = [
  'photo.jpg',
  'report.pdf',
  'script.js',
  'data.json',
  'readme.txt'
];

testFiles.forEach(file => {
  console.log(`  ${file.padEnd(15)} -> ${getFileType(file)}`);
});
console.log();

// 8. Practical example: Filename sanitization
console.log('8. Practical example - Extract safe filename:\n');

function getSafeFilename(filepath) {
  // Extract just the filename, ignore any directory components
  return path.basename(filepath);
}

const userInputs = [
  '../../../etc/passwd',
  'normal-file.txt',
  'path/to/file.jpg',
  'C:\\Windows\\System32\\config.sys'
];

console.log('  User input -> Safe filename:');
userInputs.forEach(input => {
  console.log(`  ${input}`);
  console.log(`    -> ${getSafeFilename(input)}`);
});
console.log();

// 9. Getting parent directory
console.log('9. Getting parent directory:\n');

function getParentDir(filepath) {
  return path.dirname(filepath);
}

const paths = [
  '/home/user/documents/file.txt',
  'config/app.json',
  '/etc/config'
];

paths.forEach(p => {
  console.log(`  Path: ${p}`);
  console.log(`  Parent: ${getParentDir(p)}`);
});
console.log();

// 10. Changing file extension
console.log('10. Changing file extension:\n');

function changeExtension(filepath, newExt) {
  const dir = path.dirname(filepath);
  const name = path.basename(filepath, path.extname(filepath));
  return path.join(dir, name + newExt);
}

console.log('  Original: photo.jpg');
console.log('  To PNG:', changeExtension('photo.jpg', '.png'));
console.log();

console.log('  Original: /path/to/document.docx');
console.log('  To PDF:', changeExtension('/path/to/document.docx', '.pdf'));
