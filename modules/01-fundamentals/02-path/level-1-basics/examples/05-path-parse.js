/**
 * Example 5: Parsing Paths with path.parse()
 *
 * Demonstrates how to parse a path into its component parts using path.parse().
 * This method returns an object with all path components.
 *
 * Key Points:
 * - parse() returns an object with path components
 * - Components: root, dir, base, name, ext
 * - Useful for complex path manipulation
 * - Inverse operation is path.format()
 */

const path = require('path');

console.log('=== path.parse() - Parsing Paths ===\n');

// 1. Basic parsing - Unix path
console.log('1. Parsing a Unix path:\n');

const unixPath = '/home/user/documents/report.pdf';
const parsedUnix = path.parse(unixPath);

console.log('  Path:', unixPath);
console.log('  Parsed object:');
console.log(parsedUnix);
console.log();

console.log('  Breakdown:');
console.log(`    root: "${parsedUnix.root}"     - Root of the path`);
console.log(`    dir:  "${parsedUnix.dir}"   - Directory path`);
console.log(`    base: "${parsedUnix.base}"      - Full filename`);
console.log(`    name: "${parsedUnix.name}"        - Filename without extension`);
console.log(`    ext:  "${parsedUnix.ext}"        - File extension`);
console.log();

// 2. Parsing Windows path
console.log('2. Parsing a Windows path:\n');

const windowsPath = 'C:\\Users\\john\\Desktop\\photo.jpg';
const parsedWindows = path.parse(windowsPath);

console.log('  Path:', windowsPath);
console.log('  Parsed object:');
console.log(parsedWindows);
console.log();

// 3. Parsing relative path
console.log('3. Parsing a relative path:\n');

const relativePath = 'config/database.json';
const parsedRelative = path.parse(relativePath);

console.log('  Path:', relativePath);
console.log('  Parsed object:');
console.log(parsedRelative);
console.log('  Note: root is empty for relative paths');
console.log();

// 4. Different file types
console.log('4. Parsing different file types:\n');

const files = [
  'document.pdf',
  'archive.tar.gz',
  'README',
  '.gitignore',
  'path/to/file.txt'
];

files.forEach(file => {
  const parsed = path.parse(file);
  console.log(`  ${file}`);
  console.log(`    name: "${parsed.name}", ext: "${parsed.ext}"`);
});
console.log();

// 5. Understanding multi-dot extensions
console.log('5. Handling multi-dot extensions:\n');

const tarGz = 'archive.tar.gz';
const parsed = path.parse(tarGz);

console.log('  File:', tarGz);
console.log(`  name: "${parsed.name}"    (archive.tar)`);
console.log(`  ext:  "${parsed.ext}"         (.gz)`);
console.log('  Note: Only the last extension is extracted');
console.log();

// 6. Files without extensions
console.log('6. Files without extensions:\n');

const noExt = '/path/to/README';
const parsedNoExt = path.parse(noExt);

console.log('  File:', noExt);
console.log(`  name: "${parsedNoExt.name}"`);
console.log(`  ext:  "${parsedNoExt.ext}"     (empty string)`);
console.log();

// 7. Hidden files (starting with dot)
console.log('7. Hidden files (starting with dot):\n');

const hiddenFile = '.gitignore';
const parsedHidden = path.parse(hiddenFile);

console.log('  File:', hiddenFile);
console.log(`  name: "${parsedHidden.name}"`);
console.log(`  ext:  "${parsedHidden.ext}"`);
console.log('  Note: The dot is part of the name, not a separator');
console.log();

// 8. Root-only path
console.log('8. Root directory:\n');

const rootPath = '/';
const parsedRoot = path.parse(rootPath);

console.log('  Path:', rootPath);
console.log('  Parsed:', parsedRoot);
console.log();

// 9. Practical example: Deconstructing and reconstructing paths
console.log('9. Practical example - Changing filename:\n');

const originalPath = '/home/user/old-name.txt';
const parsed1 = path.parse(originalPath);

console.log('  Original:', originalPath);
console.log('  Parsed:', parsed1);

// Change just the name
const newPath = path.format({
  ...parsed1,
  name: 'new-name',
  base: undefined // Clear base so name + ext is used
});

console.log('  Modified name to "new-name"');
console.log('  New path:', newPath);
console.log();

// 10. Practical example: Getting file info
console.log('10. Practical example - File information function:\n');

function getFileInfo(filepath) {
  const parsed = path.parse(filepath);

  return {
    fullPath: filepath,
    directory: parsed.dir || '(current directory)',
    filename: parsed.base,
    nameOnly: parsed.name,
    extension: parsed.ext || '(none)',
    isAbsolute: path.isAbsolute(filepath)
  };
}

const testPaths = [
  '/var/log/app.log',
  'config.json',
  '../data/users.csv'
];

testPaths.forEach(p => {
  console.log('  File:', p);
  const info = getFileInfo(p);
  console.log('    Directory:', info.directory);
  console.log('    Filename:', info.filename);
  console.log('    Name only:', info.nameOnly);
  console.log('    Extension:', info.extension);
  console.log('    Absolute:', info.isAbsolute);
  console.log();
});

// 11. Relationship with other methods
console.log('11. parse() vs individual methods:\n');

const testPath = '/home/user/file.txt';
const parsedPath = path.parse(testPath);

console.log('  Path:', testPath);
console.log('  Using parse():');
console.log(`    dir:  ${parsedPath.dir}`);
console.log(`    base: ${parsedPath.base}`);
console.log(`    ext:  ${parsedPath.ext}`);
console.log();

console.log('  Using individual methods:');
console.log(`    dirname():  ${path.dirname(testPath)}`);
console.log(`    basename(): ${path.basename(testPath)}`);
console.log(`    extname():  ${path.extname(testPath)}`);
console.log();

console.log('  parse() returns all components in one call!');
