/**
 * Exercise 3: Get File Extension
 *
 * Task:
 * Write a function that extracts the file extension from a filepath.
 * The extension should be lowercase for consistency.
 *
 * Requirements:
 * - Use path.extname() to get the extension
 * - Convert to lowercase
 * - Return empty string if no extension
 *
 * Example:
 * getFileExtension('document.PDF')
 * should return: '.pdf'
 */

const path = require('path');

function getFileExtension(filepath) {
  // TODO: Implement this function
  // Hint: Use path.extname() and .toLowerCase()
}

// Bonus: Write a function to check if a file is an image
function isImageFile(filepath) {
  // TODO: Implement this function
  // Hint: Use getFileExtension() and check against image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
}

// Test cases
console.log('Testing getFileExtension:\n');

const testFiles = [
  'document.PDF',
  'photo.JPG',
  'archive.tar.gz',
  'README',
  '.gitignore',
  '/path/to/file.txt'
];

testFiles.forEach(file => {
  const ext = getFileExtension(file);
  const isImage = isImageFile(file);
  console.log(`File: ${file}`);
  console.log(`Extension: ${ext || '(none)'}`);
  console.log(`Is image: ${isImage}`);
  console.log();
});

// Expected output:
// File: document.PDF
// Extension: .pdf
// Is image: false
//
// File: photo.JPG
// Extension: .jpg
// Is image: true
//
// File: archive.tar.gz
// Extension: .gz
// Is image: false
//
// File: README
// Extension: (none)
// Is image: false
//
// File: .gitignore
// Extension: .gitignore
// Is image: false
//
// File: /path/to/file.txt
// Extension: .txt
// Is image: false
