#!/usr/bin/env node

/**
 * Simulate file changes for testing the file monitor
 * Creates, modifies, and deletes files in the watched directory
 */

const fs = require('fs');
const path = require('path');

const WATCHED_DIR = path.join(__dirname, '..', 'watched');
const DELAY = 2000; // 2 seconds between operations

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensure watched directory exists
 */
function ensureWatchedDir() {
  if (!fs.existsSync(WATCHED_DIR)) {
    fs.mkdirSync(WATCHED_DIR, { recursive: true });
    console.log(`Created watched directory: ${WATCHED_DIR}`);
  }
}

/**
 * Create a test file
 */
async function createFile(filename, content) {
  const filePath = path.join(WATCHED_DIR, filename);
  await fs.promises.writeFile(filePath, content);
  console.log(`[CREATE] ${filename}`);
}

/**
 * Modify a test file
 */
async function modifyFile(filename, content) {
  const filePath = path.join(WATCHED_DIR, filename);
  await fs.promises.appendFile(filePath, content);
  console.log(`[MODIFY] ${filename}`);
}

/**
 * Delete a test file
 */
async function deleteFile(filename) {
  const filePath = path.join(WATCHED_DIR, filename);
  await fs.promises.unlink(filePath);
  console.log(`[DELETE] ${filename}`);
}

/**
 * Create a directory
 */
async function createDirectory(dirname) {
  const dirPath = path.join(WATCHED_DIR, dirname);
  await fs.promises.mkdir(dirPath, { recursive: true });
  console.log(`[CREATE DIR] ${dirname}`);
}

/**
 * Delete a directory
 */
async function deleteDirectory(dirname) {
  const dirPath = path.join(WATCHED_DIR, dirname);
  await fs.promises.rm(dirPath, { recursive: true, force: true });
  console.log(`[DELETE DIR] ${dirname}`);
}

/**
 * Run simulation
 */
async function simulate() {
  console.log('File Change Simulator');
  console.log('====================\n');
  console.log(`Target directory: ${WATCHED_DIR}`);
  console.log(`Delay between operations: ${DELAY}ms\n`);

  ensureWatchedDir();

  console.log('Starting simulation...\n');

  try {
    // Create files
    await createFile('test1.txt', 'Initial content for test1\n');
    await sleep(DELAY);

    await createFile('test2.txt', 'Initial content for test2\n');
    await sleep(DELAY);

    await createFile('test3.js', 'console.log("Hello, World!");\n');
    await sleep(DELAY);

    // Modify files
    await modifyFile('test1.txt', 'Additional line 1\n');
    await sleep(DELAY);

    await modifyFile('test1.txt', 'Additional line 2\n');
    await sleep(DELAY);

    await modifyFile('test2.txt', 'Modified content\n');
    await sleep(DELAY);

    // Create directory
    await createDirectory('subdir');
    await sleep(DELAY);

    // Create file in subdirectory
    await createFile('subdir/nested.txt', 'Nested file content\n');
    await sleep(DELAY);

    // Modify nested file
    await modifyFile('subdir/nested.txt', 'More content\n');
    await sleep(DELAY);

    // Delete files
    await deleteFile('test2.txt');
    await sleep(DELAY);

    await deleteFile('test3.js');
    await sleep(DELAY);

    // Delete directory
    await deleteDirectory('subdir');
    await sleep(DELAY);

    // Final cleanup
    await deleteFile('test1.txt');

    console.log('\nSimulation complete!');
    console.log('\nTo clean up, run:');
    console.log(`  rm -rf ${WATCHED_DIR}/*`);

  } catch (err) {
    console.error('Simulation error:', err);
    process.exit(1);
  }
}

/**
 * Continuous simulation mode
 */
async function continuousSimulation() {
  console.log('Continuous Simulation Mode');
  console.log('=========================\n');
  console.log('Press Ctrl+C to stop\n');

  ensureWatchedDir();

  let counter = 1;

  while (true) {
    try {
      const filename = `file-${counter}.txt`;
      const timestamp = new Date().toISOString();

      await createFile(filename, `Created at ${timestamp}\n`);
      await sleep(DELAY);

      await modifyFile(filename, `Modified at ${new Date().toISOString()}\n`);
      await sleep(DELAY);

      await deleteFile(filename);
      await sleep(DELAY);

      counter++;
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
File Change Simulator - Generate test file changes

Usage:
  node test/simulate-changes.js           Run single simulation
  node test/simulate-changes.js --loop    Run continuous simulation

Options:
  --loop    Run continuous simulation (Ctrl+C to stop)
  --help    Show this help message

Examples:
  node test/simulate-changes.js
  node test/simulate-changes.js --loop
    `);
    return;
  }

  if (args.includes('--loop')) {
    await continuousSimulation();
  } else {
    await simulate();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
