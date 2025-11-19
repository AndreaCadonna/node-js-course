/**
 * Example 3: __dirname and __filename
 *
 * Demonstrates the use of __dirname and __filename global variables.
 * These variables provide the absolute path to the current file and its directory.
 *
 * Key Points:
 * - __dirname: Absolute path to the directory containing this file
 * - __filename: Absolute path to this file
 * - Available in CommonJS (not directly in ES modules)
 * - Useful for building file-relative paths
 */

const path = require('path');

console.log('=== __dirname and __filename ===\n');

// Basic usage
console.log('1. Basic values:');
console.log(`  __dirname:  ${__dirname}`);
console.log(`  __filename: ${__filename}\n`);

// Breaking down __filename
console.log('2. Breaking down __filename:');
console.log(`  Full path: ${__filename}`);
console.log(`  Directory: ${path.dirname(__filename)}`);
console.log(`  Filename:  ${path.basename(__filename)}`);
console.log(`  Extension: ${path.extname(__filename)}\n`);

// Verify __dirname equals dirname(__filename)
console.log('3. Verifying __dirname:');
console.log(`  __dirname === path.dirname(__filename)`);
console.log(`  ${__dirname === path.dirname(__filename)}\n`);

// Building paths relative to current file
console.log('4. Building relative paths:');

// Config file in same directory
const configPath = path.join(__dirname, 'config.json');
console.log(`  Config in same dir: ${configPath}`);

// Data file in sibling directory
const dataPath = path.join(__dirname, '..', 'data', 'users.json');
console.log(`  Data in parent/data: ${dataPath}`);

// Public folder two levels up
const publicPath = path.join(__dirname, '..', '..', 'public', 'index.html');
console.log(`  Public two levels up: ${publicPath}\n`);

// Practical example: Loading config
console.log('5. Practical example - Loading config files:');

function loadConfig(configName) {
  // Build path relative to current file, not working directory
  const configPath = path.join(__dirname, 'config', configName);
  console.log(`  Loading config from: ${configPath}`);
  return configPath;
}

loadConfig('database.json');
loadConfig('server.json');
console.log();

// Why this matters
console.log('6. Why __dirname matters:');
console.log('  Current working directory: ' + process.cwd());
console.log('  Current file directory:    ' + __dirname);

if (process.cwd() !== __dirname) {
  console.log('  ⚠️  These are different!');
  console.log('  If we use process.cwd(), behavior changes based on where script is run from.');
  console.log('  Using __dirname ensures paths are always relative to this file.\n');
} else {
  console.log('  (They happen to be the same right now)\n');
}

// Comparison with process.cwd()
console.log('7. __dirname vs process.cwd():');

const pathFromCwd = path.join(process.cwd(), 'file.txt');
const pathFromDir = path.join(__dirname, 'file.txt');

console.log(`  From cwd: ${pathFromCwd}`);
console.log(`  From __dirname: ${pathFromDir}`);
console.log('  Note: process.cwd() depends on where you run the script!');
console.log('        __dirname is always the directory of THIS file.\n');

// Common patterns
console.log('8. Common patterns:');

// Pattern 1: Loading modules
const modulePath = path.join(__dirname, 'modules', 'helper.js');
console.log(`  Loading module: ${modulePath}`);

// Pattern 2: Reading static files
const templatePath = path.join(__dirname, 'templates', 'email.html');
console.log(`  Reading template: ${templatePath}`);

// Pattern 3: Writing logs
const logPath = path.join(__dirname, 'logs', 'app.log');
console.log(`  Writing logs: ${logPath}\n`);

// Getting parent directories
console.log('9. Getting parent directories:');
console.log(`  Current directory: ${__dirname}`);
console.log(`  Parent directory:  ${path.dirname(__dirname)}`);
console.log(`  Grandparent:       ${path.dirname(path.dirname(__dirname))}\n`);

// Building cross-platform paths
console.log('10. Cross-platform safety:');
console.log('  ❌ Wrong (hardcoded separator):');
console.log(`     ${__dirname}/config/app.json`);
console.log('  ✅ Correct (using path.join):');
console.log(`     ${path.join(__dirname, 'config', 'app.json')}`);
console.log('  This works correctly on Windows, Mac, and Linux!\n');

// Note about ES modules
console.log('11. Note about ES Modules:');
console.log('  In ES modules (.mjs), __dirname and __filename are not available.');
console.log('  Instead, use:');
console.log('    import { fileURLToPath } from "url";');
console.log('    import { dirname } from "path";');
console.log('    const __filename = fileURLToPath(import.meta.url);');
console.log('    const __dirname = dirname(__filename);');
