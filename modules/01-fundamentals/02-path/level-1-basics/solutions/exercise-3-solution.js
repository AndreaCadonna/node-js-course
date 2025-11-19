/**
 * Solution: Exercise 3 - Get File Extension
 */

const path = require('path');

function getFileExtension(filepath) {
  return path.extname(filepath).toLowerCase();
}

function isImageFile(filepath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = getFileExtension(filepath);
  return imageExtensions.includes(ext);
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

// Bonus: Categorize files by type
function getFileType(filepath) {
  const ext = getFileExtension(filepath);

  const categories = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'],
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    spreadsheets: ['.xls', '.xlsx', '.csv'],
    archives: ['.zip', '.tar', '.gz', '.rar', '.7z'],
    code: ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs'],
    web: ['.html', '.css', '.scss', '.jsx', '.tsx']
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'other';
}

console.log('\nFile categorization:\n');
const testFiles2 = [
  'photo.jpg',
  'report.pdf',
  'data.csv',
  'archive.tar.gz',
  'script.js',
  'page.html'
];

testFiles2.forEach(file => {
  console.log(`${file.padEnd(20)} -> ${getFileType(file)}`);
});
