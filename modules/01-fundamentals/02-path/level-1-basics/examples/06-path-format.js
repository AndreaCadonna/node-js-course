/**
 * Example 6: Building Paths with path.format()
 *
 * Demonstrates how to build paths from component objects using path.format().
 * This is the inverse operation of path.parse().
 *
 * Key Points:
 * - format() builds a path from an object
 * - Input object can have: root, dir, base, name, ext
 * - base takes precedence over name + ext
 * - Useful for constructing paths programmatically
 */

const path = require('path');

console.log('=== path.format() - Building Paths ===\n');

// 1. Basic formatting
console.log('1. Basic path formatting:\n');

const pathObj1 = {
  root: '/',
  dir: '/home/user',
  base: 'file.txt'
};

const formatted1 = path.format(pathObj1);
console.log('  Input object:', pathObj1);
console.log('  Formatted path:', formatted1);
console.log();

// 2. Using name and ext instead of base
console.log('2. Using name and ext:\n');

const pathObj2 = {
  root: '/',
  dir: '/home/user',
  name: 'document',
  ext: '.pdf'
};

const formatted2 = path.format(pathObj2);
console.log('  Input object:', pathObj2);
console.log('  Formatted path:', formatted2);
console.log();

// 3. Priority: base vs name + ext
console.log('3. Priority - base takes precedence:\n');

const pathObj3 = {
  dir: '/home/user',
  base: 'file.txt',      // This will be used
  name: 'ignored',        // These will be ignored
  ext: '.ignored'         // because base is present
};

const formatted3 = path.format(pathObj3);
console.log('  Input object:', pathObj3);
console.log('  Formatted path:', formatted3);
console.log('  Note: base takes priority over name + ext');
console.log();

// 4. Root vs dir
console.log('4. Using root vs dir:\n');

// Just root
const pathObj4a = {
  root: '/',
  base: 'file.txt'
};
console.log('  With root only:', pathObj4a);
console.log('  Result:', path.format(pathObj4a));

// Just dir
const pathObj4b = {
  dir: '/home/user',
  base: 'file.txt'
};
console.log('  With dir:', pathObj4b);
console.log('  Result:', path.format(pathObj4b));

// Both (dir takes precedence)
const pathObj4c = {
  root: '/ignored',
  dir: '/home/user',  // This takes precedence
  base: 'file.txt'
};
console.log('  With both (dir wins):', pathObj4c);
console.log('  Result:', path.format(pathObj4c));
console.log();

// 5. Windows paths
console.log('5. Windows-style paths:\n');

const winPath = {
  root: 'C:\\',
  dir: 'C:\\Users\\john',
  base: 'document.txt'
};

const formattedWin = path.format(winPath);
console.log('  Input object:', winPath);
console.log('  Formatted path:', formattedWin);
console.log();

// 6. Relative paths
console.log('6. Relative paths (no root or dir):\n');

const relPath = {
  base: 'config.json'
};

const formattedRel = path.format(relPath);
console.log('  Input object:', relPath);
console.log('  Formatted path:', formattedRel);
console.log();

// 7. Parse and format round-trip
console.log('7. Round-trip: parse() then format():\n');

const originalPath = '/home/user/documents/report.pdf';
console.log('  Original path:', originalPath);

const parsed = path.parse(originalPath);
console.log('  After parse():', parsed);

const reformatted = path.format(parsed);
console.log('  After format():', reformatted);

console.log('  Match:', originalPath === reformatted);
console.log();

// 8. Practical example: Changing file extension
console.log('8. Practical example - Change extension:\n');

function changeExtension(filepath, newExt) {
  const parsed = path.parse(filepath);
  return path.format({
    ...parsed,
    base: undefined, // Clear base so name + ext is used
    ext: newExt
  });
}

const oldPath = '/documents/photo.jpg';
const newPath = changeExtension(oldPath, '.png');

console.log('  Original:', oldPath);
console.log('  Changed:', newPath);
console.log();

// 9. Practical example: Adding suffix to filename
console.log('9. Practical example - Add suffix to filename:\n');

function addSuffix(filepath, suffix) {
  const parsed = path.parse(filepath);
  return path.format({
    ...parsed,
    name: parsed.name + suffix,
    base: undefined // Clear base
  });
}

const original = '/images/photo.jpg';
const withSuffix = addSuffix(original, '-thumbnail');

console.log('  Original:', original);
console.log('  With suffix:', withSuffix);
console.log();

// 10. Practical example: Building paths programmatically
console.log('10. Practical example - Build paths programmatically:\n');

function buildFilePath(directory, filename, extension) {
  return path.format({
    dir: directory,
    name: filename,
    ext: extension.startsWith('.') ? extension : '.' + extension
  });
}

const built1 = buildFilePath('/var/log', 'app', 'log');
const built2 = buildFilePath('/home/user', 'config', '.json');

console.log('  buildFilePath("/var/log", "app", "log")');
console.log('    Result:', built1);
console.log('  buildFilePath("/home/user", "config", ".json")');
console.log('    Result:', built2);
console.log();

// 11. Minimal format object
console.log('11. Minimal format objects:\n');

// Just filename
const min1 = path.format({ base: 'file.txt' });
console.log('  { base: "file.txt" }');
console.log('    Result:', min1);

// Name and extension
const min2 = path.format({ name: 'file', ext: '.txt' });
console.log('  { name: "file", ext: ".txt" }');
console.log('    Result:', min2);

// Empty object
const min3 = path.format({});
console.log('  {}');
console.log('    Result:', min3, '(empty string)');
console.log();

// 12. Complex transformation example
console.log('12. Complex transformation:\n');

const sourcePath = '/projects/myapp/src/components/Button.jsx';
console.log('  Source:', sourcePath);

// Parse it
const srcParsed = path.parse(sourcePath);

// Transform: src -> dist, .jsx -> .js
const distPath = path.format({
  dir: srcParsed.dir.replace('/src/', '/dist/'),
  name: srcParsed.name,
  ext: '.js'
});

console.log('  Transformed:', distPath);
console.log('  Changes: src -> dist, .jsx -> .js');
