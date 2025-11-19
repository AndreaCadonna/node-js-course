/**
 * Example 2: Promisifying File System Operations
 *
 * Real-world example of using util.promisify() with Node.js fs module.
 * Learn how to modernize file operations from callbacks to promises.
 *
 * Key Concepts:
 * - Promisifying fs module functions
 * - Working with promisified file operations
 * - Error handling in file operations
 * - Combining multiple async file operations
 */

const util = require('util');
const fs = require('fs');
const path = require('path');

// ===== EXAMPLE 1: Single File Operation =====
console.log('=== Example 1: Promisifying fs.readFile ===\n');

// Create promisified versions of fs functions
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

// Async function to demonstrate file reading
async function readPackageJson() {
  try {
    // Try to read package.json from the project root
    const data = await readFile('package.json', 'utf8');
    console.log('✓ Successfully read package.json');
    console.log('First 100 characters:', data.substring(0, 100) + '...');
  } catch (err) {
    // File might not exist in this directory
    console.log('ℹ Could not read package.json:', err.message);
    console.log('  (This is expected if run from this directory)');
  }
}

readPackageJson();

// ===== EXAMPLE 2: Write and Read =====
console.log('\n=== Example 2: Writing and Reading Files ===\n');

async function writeAndRead() {
  const testFile = path.join(__dirname, 'test-promisify.txt');
  const testData = 'Hello from promisified fs operations!\nThis is line 2.\nAnd line 3.';

  try {
    // Write file
    await writeFile(testFile, testData, 'utf8');
    console.log('✓ File written successfully');

    // Read it back
    const content = await readFile(testFile, 'utf8');
    console.log('✓ File read successfully');
    console.log('Content:');
    console.log(content);

    // Clean up
    await unlink(testFile);
    console.log('✓ Test file deleted');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

writeAndRead();

// ===== EXAMPLE 3: Multiple File Operations =====
console.log('\n=== Example 3: Sequential File Operations ===\n');

async function sequentialOperations() {
  const file1 = path.join(__dirname, 'file1.txt');
  const file2 = path.join(__dirname, 'file2.txt');
  const file3 = path.join(__dirname, 'combined.txt');

  try {
    // Create two files
    await writeFile(file1, 'Content from file 1', 'utf8');
    console.log('✓ Created file1.txt');

    await writeFile(file2, 'Content from file 2', 'utf8');
    console.log('✓ Created file2.txt');

    // Read both files
    const content1 = await readFile(file1, 'utf8');
    const content2 = await readFile(file2, 'utf8');
    console.log('✓ Read both files');

    // Combine and write to new file
    const combined = `${content1}\n${content2}`;
    await writeFile(file3, combined, 'utf8');
    console.log('✓ Created combined.txt');

    // Verify combined file
    const finalContent = await readFile(file3, 'utf8');
    console.log('\nCombined content:');
    console.log(finalContent);

    // Cleanup
    await unlink(file1);
    await unlink(file2);
    await unlink(file3);
    console.log('\n✓ All test files cleaned up');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

setTimeout(() => {
  sequentialOperations();
}, 500);

// ===== EXAMPLE 4: Parallel Operations =====
console.log('\n=== Example 4: Parallel File Operations ===\n');

async function parallelOperations() {
  const files = [
    { name: 'parallel1.txt', content: 'Parallel file 1' },
    { name: 'parallel2.txt', content: 'Parallel file 2' },
    { name: 'parallel3.txt', content: 'Parallel file 3' }
  ];

  try {
    // Write all files in parallel using Promise.all
    const writePaths = files.map(f => path.join(__dirname, f.name));

    await Promise.all(
      files.map((file, i) =>
        writeFile(writePaths[i], file.content, 'utf8')
      )
    );
    console.log('✓ All files written in parallel');

    // Read all files in parallel
    const contents = await Promise.all(
      writePaths.map(p => readFile(p, 'utf8'))
    );
    console.log('✓ All files read in parallel');

    contents.forEach((content, i) => {
      console.log(`  File ${i + 1}: "${content}"`);
    });

    // Cleanup in parallel
    await Promise.all(writePaths.map(p => unlink(p)));
    console.log('✓ All files cleaned up in parallel');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

setTimeout(() => {
  parallelOperations();
}, 1000);

// ===== EXAMPLE 5: Using fs.promises (Built-in Alternative) =====
console.log('\n=== Example 5: fs.promises (Modern Alternative) ===\n');

// Node.js 10+ provides fs.promises built-in
const fsPromises = fs.promises;

async function usingFsPromises() {
  const testFile = path.join(__dirname, 'fs-promises-test.txt');

  try {
    // No need to promisify - already promise-based!
    await fsPromises.writeFile(testFile, 'Using built-in fs.promises', 'utf8');
    console.log('✓ Written using fs.promises');

    const content = await fsPromises.readFile(testFile, 'utf8');
    console.log('✓ Read using fs.promises:', content);

    await fsPromises.unlink(testFile);
    console.log('✓ Cleaned up using fs.promises');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

setTimeout(() => {
  usingFsPromises();
}, 1500);

/**
 * Important Notes:
 *
 * 1. Modern Node.js (v10+) Provides fs.promises:
 *    - Don't need to promisify fs functions anymore
 *    - Use `const fs = require('fs').promises`
 *    - Or `const fsPromises = require('fs/promises')`
 *    - Still useful to know promisify for other modules
 *
 * 2. Performance Considerations:
 *    - Sequential: Operations run one after another (slower)
 *    - Parallel: Multiple operations at once (faster)
 *    - Use Promise.all() for independent operations
 *    - Use await for dependent operations
 *
 * 3. Error Handling:
 *    - Always wrap in try/catch
 *    - Handle specific error codes (ENOENT, EACCES, etc.)
 *    - Clean up resources even if errors occur
 */

/**
 * Try This:
 *
 * 1. Create a function that reads multiple files and combines them
 * 2. Implement a file copy function using promisified fs
 * 3. Build a directory listing function with promisified fs.readdir
 * 4. Compare performance of sequential vs parallel file operations
 * 5. Handle specific error codes (ENOENT, EACCES) differently
 */
