/**
 * Exercise 3: File Synchronization Tool
 *
 * DIFFICULTY: ⭐⭐⭐ Advanced
 * TIME: 40-50 minutes
 *
 * OBJECTIVE:
 * Build a file synchronization tool that keeps two directories in sync,
 * similar to Dropbox or rsync.
 *
 * REQUIREMENTS:
 * 1. Accept source and destination directory paths
 * 2. Detect new, modified, and deleted files
 * 3. Copy/update/delete files to keep directories in sync
 * 4. Handle subdirectories recursively
 * 5. Show progress for large operations
 * 6. Support different sync modes (mirror, update, two-way)
 * 7. Implement efficient change detection
 * 8. Handle conflicts (both sides modified)
 *
 * SYNC MODES:
 * - mirror: Make dest exactly like source (delete extra files)
 * - update: Copy new/modified from source, don't delete
 * - two-way: Sync changes in both directions
 *
 * CHANGE DETECTION:
 * Compare files based on:
 * - Modification time (mtime)
 * - File size
 * - Optional: Content hash (MD5/SHA256)
 *
 * EXAMPLE USAGE:
 * const syncer = new FileSyncer({
 *   source: './source-dir',
 *   dest: './dest-dir',
 *   mode: 'mirror',
 *   delete: true,
 *   dryRun: false
 * });
 *
 * await syncer.sync();
 *
 * OUTPUT:
 * File Sync Report
 * ================
 * Source: ./source-dir
 * Dest: ./dest-dir
 * Mode: mirror
 *
 * Changes:
 *   New files: 15
 *   Updated files: 3
 *   Deleted files: 2
 *   Unchanged: 45
 *
 * Data transferred: 2.5 MB
 * Time: 1.2s
 *
 * BONUS CHALLENGES:
 * - Add --watch mode for continuous sync
 * - Implement conflict resolution strategies
 * - Support .syncignore file (like .gitignore)
 * - Add bandwidth throttling
 * - Create sync snapshots/history
 * - Parallel file copying
 * - Progress bars for individual files
 * - Network sync (sync over SSH/FTP)
 *
 * HINTS:
 * - Build file tree for both directories
 * - Compare trees to find differences
 * - Use mtime and size for quick comparison
 * - Use streams for copying large files
 * - Handle errors gracefully (permissions, etc.)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

// TODO: Implement your solution here

/**
 * File tree node
 */
class FileNode {
  constructor(relativePath, stats) {
    this.path = relativePath;
    this.isDirectory = stats.isDirectory();
    this.size = stats.size;
    this.mtime = stats.mtime;
    this.hash = null; // Computed on demand
  }

  async computeHash(basePath) {
    // TODO: Compute file hash for content comparison
  }
}

/**
 * File synchronizer
 */
class FileSyncer {
  constructor(options) {
    this.source = options.source;
    this.dest = options.dest;
    this.mode = options.mode || 'mirror'; // mirror, update, two-way
    this.delete = options.delete !== false;
    this.dryRun = options.dryRun || false;
    this.useHash = options.useHash || false;

    this.stats = {
      newFiles: 0,
      updatedFiles: 0,
      deletedFiles: 0,
      unchanged: 0,
      bytesTransferred: 0
    };
  }

  async sync() {
    // TODO: Main sync logic
    // 1. Scan both directories
    // 2. Compare file trees
    // 3. Determine required actions
    // 4. Execute actions (copy/update/delete)
    // 5. Return summary
  }

  async scanDirectory(dirPath, basePath = dirPath) {
    // TODO: Build file tree recursively
    // Return Map<relativePath, FileNode>
  }

  compareFiles(sourceNode, destNode) {
    // TODO: Determine if files are different
    // Return: 'same', 'source-newer', 'dest-newer', 'conflict'
  }

  async copyFile(sourcePath, destPath, showProgress = false) {
    // TODO: Copy file with progress tracking
  }

  async deleteFile(filePath) {
    // TODO: Delete file or directory
  }

  async planActions(sourceTree, destTree) {
    // TODO: Determine what needs to be done
    // Return list of actions: { type, source, dest, node }
  }

  async executeActions(actions) {
    // TODO: Execute planned actions
  }

  generateReport() {
    // TODO: Create sync report
  }
}

/**
 * Watch mode for continuous sync
 */
class SyncWatcher {
  constructor(syncer, pollInterval = 5000) {
    this.syncer = syncer;
    this.pollInterval = pollInterval;
    this.running = false;
    this.watcher = null;
  }

  async start() {
    // TODO: Start watching for changes
  }

  stop() {
    // TODO: Stop watching
  }
}

/**
 * Ignore pattern handler (like .gitignore)
 */
class SyncIgnore {
  constructor(ignoreFilePath) {
    this.patterns = [];
    // TODO: Load and parse ignore patterns
  }

  shouldIgnore(filePath) {
    // TODO: Check if path matches any pattern
  }

  parsePattern(pattern) {
    // TODO: Convert glob pattern to regex
  }
}

/**
 * Testing and demonstration
 */
async function testSync() {
  console.log('File Synchronization Tool Test\n');
  console.log('='.repeat(50));

  const testDir = path.join(__dirname, 'test-sync');
  const sourceDir = path.join(testDir, 'source');
  const destDir = path.join(testDir, 'dest');

  try {
    // Setup test directories
    await fs.mkdir(sourceDir, { recursive: true });
    await fs.mkdir(destDir, { recursive: true });

    // Create test files
    await fs.writeFile(path.join(sourceDir, 'file1.txt'), 'Content 1');
    await fs.writeFile(path.join(sourceDir, 'file2.txt'), 'Content 2');
    await fs.mkdir(path.join(sourceDir, 'subdir'), { recursive: true });
    await fs.writeFile(path.join(sourceDir, 'subdir', 'file3.txt'), 'Content 3');

    // Initial sync
    console.log('\n1. Initial Sync');
    console.log('-'.repeat(50));

    const syncer = new FileSyncer({
      source: sourceDir,
      dest: destDir,
      mode: 'mirror',
      delete: true,
      dryRun: false
    });

    await syncer.sync();
    console.log(syncer.generateReport());

    // Modify source
    console.log('\n2. After Modifications');
    console.log('-'.repeat(50));

    await fs.appendFile(path.join(sourceDir, 'file1.txt'), ' - Modified');
    await fs.writeFile(path.join(sourceDir, 'new-file.txt'), 'New content');
    await fs.unlink(path.join(sourceDir, 'file2.txt'));

    await syncer.sync();
    console.log(syncer.generateReport());

    // Cleanup
    await fs.rm(testDir, { recursive: true, force: true });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

// testSync();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Create test directories:
 *    mkdir source dest
 *    echo "test" > source/file1.txt
 *
 * 2. Run sync:
 *    node exercise-3.js source dest --mode mirror
 *
 * 3. Verify:
 *    diff -r source dest
 *
 * 4. Test update detection:
 *    echo "modified" > source/file1.txt
 *    node exercise-3.js source dest --mode update
 *
 * 5. Test deletion:
 *    rm source/file1.txt
 *    node exercise-3.js source dest --mode mirror --delete
 */

/**
 * FILE COMPARISON EXAMPLE:
 *
 * function filesAreDifferent(sourceStats, destStats) {
 *   // Size difference
 *   if (sourceStats.size !== destStats.size) {
 *     return true;
 *   }
 *
 *   // Modification time (with tolerance for file system precision)
 *   const timeDiff = Math.abs(
 *     sourceStats.mtime.getTime() - destStats.mtime.getTime()
 *   );
 *
 *   return timeDiff > 1000; // 1 second tolerance
 * }
 */

/**
 * STREAMING COPY EXAMPLE:
 *
 * async function copyFileWithProgress(source, dest) {
 *   const stat = await fs.stat(source);
 *   let copied = 0;
 *
 *   const readStream = fsSync.createReadStream(source);
 *   const writeStream = fsSync.createWriteStream(dest);
 *
 *   readStream.on('data', (chunk) => {
 *     copied += chunk.length;
 *     const percent = (copied / stat.size * 100).toFixed(1);
 *     process.stdout.write(`\rCopying: ${percent}%`);
 *   });
 *
 *   await pipeline(readStream, writeStream);
 * }
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How do you efficiently detect file changes?
 * - What are the challenges of two-way sync?
 * - How do you handle conflicts?
 * - Why is mtime comparison tricky?
 * - What are the benefits of hash-based comparison?
 */
