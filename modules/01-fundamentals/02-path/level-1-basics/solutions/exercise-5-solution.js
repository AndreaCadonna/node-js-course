/**
 * Solution: Exercise 5 - Create Cross-Platform File Paths
 */

const path = require('path');

class PathBuilder {
  constructor(baseDir) {
    // Store base directory as absolute path
    this.baseDir = path.resolve(baseDir);
  }

  build(...segments) {
    // Join base directory with provided segments
    return path.join(this.baseDir, ...segments);
  }

  getFilename(filepath) {
    return path.basename(filepath);
  }

  getExtension(filepath) {
    return path.extname(filepath);
  }

  getDirectory(filepath) {
    return path.dirname(filepath);
  }

  isUnderBase(filepath) {
    // Resolve the filepath to absolute
    const resolved = path.resolve(this.baseDir, filepath);
    // Check if it starts with base directory
    return resolved.startsWith(this.baseDir + path.sep) || resolved === this.baseDir;
  }
}

// Test cases
console.log('Testing PathBuilder:\n');

const builder = new PathBuilder('/var/app');

console.log('1. Building paths:');
console.log(`  build('data', 'users.json'): ${builder.build('data', 'users.json')}`);
console.log(`  build('config', 'db.json'): ${builder.build('config', 'db.json')}`);
console.log(`  build('logs', 'error.log'): ${builder.build('logs', 'error.log')}`);
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
  'data/file.txt',           // Relative to base
  '/var/app/data/file.txt',  // Under base (absolute)
  '/var/other/file.txt',     // Outside base
  '../../../etc/passwd'      // Trying to escape (dangerous!)
];

paths.forEach(p => {
  const isUnder = builder.isUnderBase(p);
  const resolved = path.resolve(builder.baseDir, p);
  console.log(`  ${p}`);
  console.log(`    Resolves to: ${resolved}`);
  console.log(`    Under /var/app: ${isUnder}`);
  console.log();
});

// Enhanced version with additional features
class EnhancedPathBuilder extends PathBuilder {
  changeExtension(filepath, newExt) {
    const parsed = path.parse(filepath);
    return path.format({
      ...parsed,
      base: undefined,
      ext: newExt.startsWith('.') ? newExt : '.' + newExt
    });
  }

  addSuffix(filepath, suffix) {
    const parsed = path.parse(filepath);
    return path.format({
      ...parsed,
      name: parsed.name + suffix,
      base: undefined
    });
  }

  replaceDirectory(filepath, newDir) {
    const filename = path.basename(filepath);
    return path.join(newDir, filename);
  }

  normalize(filepath) {
    return path.normalize(filepath);
  }
}

console.log('4. Enhanced PathBuilder features:\n');
const enhanced = new EnhancedPathBuilder('/var/app');

const filePath = '/images/photo.jpg';
console.log(`Original: ${filePath}`);
console.log(`Changed extension to .png: ${enhanced.changeExtension(filePath, '.png')}`);
console.log(`Added suffix '-thumb': ${enhanced.addSuffix(filePath, '-thumb')}`);
console.log(`Moved to /uploads: ${enhanced.replaceDirectory(filePath, '/uploads')}`);
console.log();

const messyPath = 'folder//subfolder/./file.txt';
console.log(`Messy path: ${messyPath}`);
console.log(`Normalized: ${enhanced.normalize(messyPath)}`);
