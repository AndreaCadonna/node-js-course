/**
 * Example 8: Advanced Path Parsing
 *
 * Demonstrates complex path parsing scenarios and manipulation.
 * Learn to handle edge cases, extract multiple components,
 * and work with non-standard path formats.
 *
 * Key Points:
 * - Use path.parse() for detailed component extraction
 * - Handle multiple file extensions
 * - Work with version numbers in filenames
 * - Parse structured filenames
 * - Handle edge cases and malformed paths
 */

const path = require('path');

console.log('=== Advanced Path Parsing ===\n');

// 1. Deep dive into path.parse()
console.log('1. Understanding path.parse() components:');

function explainParse(filepath) {
  const parsed = path.parse(filepath);
  console.log(`  Path: '${filepath}'`);
  console.log('  Parsed components:');
  console.log(`    root: '${parsed.root}'     - Root of the path`);
  console.log(`    dir:  '${parsed.dir}'      - Directory path`);
  console.log(`    base: '${parsed.base}'     - File with extension`);
  console.log(`    name: '${parsed.name}'     - File without extension`);
  console.log(`    ext:  '${parsed.ext}'      - Extension including .`);
  console.log();
}

explainParse('/home/user/documents/report.pdf');
explainParse('C:\\Users\\John\\file.txt');
explainParse('relative/path/file.tar.gz');

// 2. Handling multiple extensions
console.log('2. Handling multiple file extensions:');

function getAllExtensions(filepath) {
  const basename = path.basename(filepath);
  const parts = basename.split('.');

  if (parts.length <= 1) {
    return [];
  }

  // Remove the filename, keep only extensions
  return parts.slice(1).map(ext => '.' + ext);
}

function getFullExtension(filepath) {
  const exts = getAllExtensions(filepath);
  return exts.join('');
}

const multiExtTests = [
  'file.tar.gz',
  'archive.tar.bz2',
  'backup.2024-01-15.sql.gz',
  'document.pdf',
  'noextension'
];

console.log('  Parsing multiple extensions:');
multiExtTests.forEach(file => {
  const all = getAllExtensions(file);
  const full = getFullExtension(file);
  const standard = path.extname(file);
  console.log(`  '${file}':`);
  console.log(`    path.extname():      '${standard}'`);
  console.log(`    All extensions:      [${all.join(', ')}]`);
  console.log(`    Full extension:      '${full}'`);
  console.log();
});

// 3. Parsing versioned filenames
console.log('3. Parsing versioned filenames:');

function parseVersionedFilename(filepath) {
  const parsed = path.parse(filepath);
  const name = parsed.name;

  // Pattern: filename-v1.2.3 or filename-1.2.3
  const versionPattern = /^(.+?)[-_]v?(\d+\.\d+\.\d+)$/;
  const match = name.match(versionPattern);

  if (match) {
    return {
      dir: parsed.dir,
      basename: match[1],
      version: match[2],
      ext: parsed.ext,
      fullPath: filepath
    };
  }

  return {
    dir: parsed.dir,
    basename: name,
    version: null,
    ext: parsed.ext,
    fullPath: filepath
  };
}

const versionedFiles = [
  'app-v1.2.3.tar.gz',
  'library-2.0.0.js',
  'document-v3.1.4.pdf',
  'regular-file.txt'
];

console.log('  Extracting version numbers:');
versionedFiles.forEach(file => {
  const info = parseVersionedFilename(file);
  console.log(`  '${file}':`);
  console.log(`    Basename: '${info.basename}'`);
  console.log(`    Version:  ${info.version || 'none'}`);
  console.log(`    Ext:      '${info.ext}'`);
  console.log();
});

// 4. Parsing structured filenames
console.log('4. Parsing structured filenames (pattern-based):');

function parseStructuredFilename(filepath, pattern) {
  // Pattern: {date}_{category}_{id}_{description}.{ext}
  // Example: 2024-01-15_invoice_12345_office-supplies.pdf

  const basename = path.basename(filepath, path.extname(filepath));
  const parts = basename.split('_');

  if (pattern === 'date_category_id_desc') {
    return {
      date: parts[0] || null,
      category: parts[1] || null,
      id: parts[2] || null,
      description: parts.slice(3).join('_') || null,
      ext: path.extname(filepath),
      dir: path.dirname(filepath)
    };
  }

  return null;
}

const structuredFiles = [
  '2024-01-15_invoice_12345_office-supplies.pdf',
  '2024-02-20_report_67890_quarterly-review.docx',
  '2024-03-10_image_11111_product-photo.jpg'
];

console.log('  Pattern: {date}_{category}_{id}_{description}');
structuredFiles.forEach(file => {
  const info = parseStructuredFilename(file, 'date_category_id_desc');
  console.log(`  '${file}':`);
  console.log(`    Date:        ${info.date}`);
  console.log(`    Category:    ${info.category}`);
  console.log(`    ID:          ${info.id}`);
  console.log(`    Description: ${info.description}`);
  console.log();
});

// 5. Extracting date from filename
console.log('5. Extracting dates from filenames:');

function extractDateFromFilename(filepath) {
  const basename = path.basename(filepath);

  // Common date patterns
  const patterns = [
    /(\d{4}-\d{2}-\d{2})/,           // YYYY-MM-DD
    /(\d{4}\d{2}\d{2})/,              // YYYYMMDD
    /(\d{2}-\d{2}-\d{4})/,           // DD-MM-YYYY
    /(\d{2}\/\d{2}\/\d{4})/,         // DD/MM/YYYY
  ];

  for (const pattern of patterns) {
    const match = basename.match(pattern);
    if (match) {
      return {
        found: true,
        date: match[1],
        pattern: pattern.source
      };
    }
  }

  return { found: false, date: null };
}

const dateFiles = [
  'backup-2024-01-15.sql',
  'report_20240315.pdf',
  'log-15-03-2024.txt',
  'nodates.txt'
];

console.log('  Extracting dates:');
dateFiles.forEach(file => {
  const result = extractDateFromFilename(file);
  console.log(`  '${file}': ${result.found ? result.date : 'No date found'}`);
});
console.log();

// 6. Parsing file sequences
console.log('6. Parsing file sequences:');

function parseSequenceFilename(filepath) {
  const parsed = path.parse(filepath);
  const name = parsed.name;

  // Pattern: filename_001, filename-part-05, etc.
  const patterns = [
    { regex: /^(.+?)[-_](\d+)$/, type: 'simple' },
    { regex: /^(.+?)[-_]part[-_](\d+)$/, type: 'part' },
    { regex: /^(.+?)[-_]page[-_](\d+)$/, type: 'page' }
  ];

  for (const { regex, type } of patterns) {
    const match = name.match(regex);
    if (match) {
      return {
        base: match[1],
        sequence: parseInt(match[2], 10),
        type,
        ext: parsed.ext,
        dir: parsed.dir
      };
    }
  }

  return null;
}

const sequenceFiles = [
  'video_001.mp4',
  'document-part-05.pdf',
  'scan-page-12.jpg',
  'regular-file.txt'
];

console.log('  Parsing sequence numbers:');
sequenceFiles.forEach(file => {
  const info = parseSequenceFilename(file);
  if (info) {
    console.log(`  '${file}':`);
    console.log(`    Base: '${info.base}', Sequence: ${info.sequence}, Type: ${info.type}`);
  } else {
    console.log(`  '${file}': Not a sequence file`);
  }
});
console.log();

// 7. Handling special characters in filenames
console.log('7. Handling special characters:');

function analyzeSpecialChars(filepath) {
  const basename = path.basename(filepath);

  return {
    hasSpaces: / /.test(basename),
    hasParens: /[()]/.test(basename),
    hasBrackets: /[\[\]]/.test(basename),
    hasDots: /\./.test(basename),
    hasUnicode: /[^\x00-\x7F]/.test(basename),
    hasNumbers: /\d/.test(basename)
  };
}

const specialCharFiles = [
  'file with spaces.txt',
  'file(copy).txt',
  'file[2024].txt',
  'file.name.with.dots.txt',
  'файл.txt',
  'file123.txt'
];

console.log('  Analyzing special characters:');
specialCharFiles.forEach(file => {
  const analysis = analyzeSpecialChars(file);
  console.log(`  '${file}':`);
  console.log(`    Spaces: ${analysis.hasSpaces}, Parentheses: ${analysis.hasParens}`);
  console.log(`    Brackets: ${analysis.hasBrackets}, Multiple dots: ${analysis.hasDots}`);
  console.log(`    Unicode: ${analysis.hasUnicode}, Numbers: ${analysis.hasNumbers}`);
  console.log();
});

// 8. Deep path analysis
console.log('8. Deep path analysis:');

function analyzePathStructure(filepath) {
  const normalized = path.normalize(filepath);
  const parsed = path.parse(normalized);
  const components = normalized.split(path.sep).filter(c => c);

  return {
    isAbsolute: path.isAbsolute(filepath),
    depth: components.length,
    hasExtension: parsed.ext !== '',
    root: parsed.root,
    segments: components,
    filename: parsed.base,
    size: filepath.length,
    hasSpecialDirs: /\.\.|\./.test(filepath),
    isHidden: parsed.base.startsWith('.') && parsed.base !== '.' && parsed.base !== '..'
  };
}

const analyzePaths = [
  '/home/user/documents/report.pdf',
  '../relative/path/file.txt',
  '.hidden',
  'C:\\Windows\\System32\\config'
];

console.log('  Deep structure analysis:');
analyzePaths.forEach(p => {
  const analysis = analyzePathStructure(p);
  console.log(`  '${p}':`);
  console.log(`    Absolute: ${analysis.isAbsolute}, Depth: ${analysis.depth}`);
  console.log(`    Has ext: ${analysis.hasExtension}, Hidden: ${analysis.isHidden}`);
  console.log(`    Segments: [${analysis.segments.join(', ')}]`);
  console.log();
});

// 9. Building paths from parsed components
console.log('9. Reconstructing paths from components:');

function buildPathFromComponents(components) {
  return path.format(components);
}

const componentSets = [
  { dir: '/home/user', base: 'file.txt' },
  { root: '/', dir: '/home/user', name: 'document', ext: '.pdf' },
  { dir: 'relative/path', name: 'file', ext: '.js' }
];

console.log('  Building from components:');
componentSets.forEach(comp => {
  const built = buildPathFromComponents(comp);
  console.log(`  Components:`, comp);
  console.log(`  Built path: '${built}'`);
  console.log();
});

// 10. Advanced parsing utility class
console.log('10. Advanced Path Parser Class:');

class PathParser {
  constructor(filepath) {
    this.original = filepath;
    this.normalized = path.normalize(filepath);
    this.parsed = path.parse(this.normalized);
  }

  getAllExtensions() {
    return getAllExtensions(this.original);
  }

  getFullExtension() {
    return getFullExtension(this.original);
  }

  getVersion() {
    const info = parseVersionedFilename(this.original);
    return info.version;
  }

  extractDate() {
    return extractDateFromFilename(this.original);
  }

  getSequenceInfo() {
    return parseSequenceFilename(this.original);
  }

  analyzeStructure() {
    return analyzePathStructure(this.original);
  }

  getComponents() {
    return {
      root: this.parsed.root,
      dir: this.parsed.dir,
      base: this.parsed.base,
      name: this.parsed.name,
      ext: this.parsed.ext
    };
  }

  reconstruct(changes = {}) {
    return path.format({
      ...this.parsed,
      ...changes,
      base: undefined // Let format use name + ext
    });
  }
}

const parser = new PathParser('backup-v2.1.0-2024-01-15.tar.gz');
console.log(`  Parsing: '${parser.original}'`);
console.log(`  All extensions: [${parser.getAllExtensions().join(', ')}]`);
console.log(`  Version: ${parser.getVersion()}`);
console.log(`  Date: ${parser.extractDate().date}`);
console.log(`  Reconstructed with new name:`);
console.log(`    '${parser.reconstruct({ name: 'backup-v2.2.0-2024-02-01' })}'`);
console.log();

// 11. Edge cases
console.log('11. Handling edge cases:');

const edgeCases = [
  '',                          // Empty
  '.',                         // Current dir
  '..',                        // Parent dir
  '.hidden',                   // Hidden file
  '..hidden',                  // Double dot prefix
  'no_extension',              // No extension
  '..',                        // Just dots
  '...multiple...dots...',     // Many dots
  'trailing-slash/',           // Trailing slash
];

console.log('  Edge case parsing:');
edgeCases.forEach(p => {
  try {
    const parsed = path.parse(p);
    console.log(`  '${p}':`);
    console.log(`    name: '${parsed.name}', ext: '${parsed.ext}', base: '${parsed.base}'`);
  } catch (error) {
    console.log(`  '${p}': Error - ${error.message}`);
  }
});
console.log();

// 12. Best practices
console.log('12. Advanced Parsing Best Practices:');
console.log('  ✅ Use path.parse() for component extraction');
console.log('  ✅ Handle multiple extensions explicitly');
console.log('  ✅ Normalize paths before parsing');
console.log('  ✅ Test with edge cases');
console.log('  ✅ Use regex for pattern matching');
console.log('  ✅ Document expected filename formats');
console.log('  ✅ Provide fallback values for missing components');
console.log('  ✅ Consider locale-specific patterns (dates, etc.)');
console.log('  ❌ Don\'t assume single extensions');
console.log('  ❌ Don\'t rely on string splitting alone');
console.log('  ❌ Don\'t forget to handle empty/malformed paths');
console.log('  ❌ Don\'t ignore platform differences');
