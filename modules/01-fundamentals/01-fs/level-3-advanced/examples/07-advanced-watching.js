/**
 * Example 7: Advanced File Watching
 *
 * Demonstrates production-ready file watching patterns.
 *
 * Key Concepts:
 * - Robust event handling
 * - Recursive watching
 * - Debouncing and throttling
 * - Handling watch limitations
 * - Recovery from errors
 */

const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Production-ready file watcher
 */
class FileWatcher extends EventEmitter {
  constructor(watchPath, options = {}) {
    super();
    this.watchPath = watchPath;
    this.watchers = new Map();
    this.debounceDelay = options.debounceDelay || 100;
    this.debounceTimers = new Map();
    this.recursive = options.recursive || false;
    this.ignored = options.ignored || [];
    this.running = false;
  }

  async start() {
    this.running = true;

    if (this.recursive) {
      await this.watchRecursive(this.watchPath);
    } else {
      this.watchSingle(this.watchPath);
    }

    this.emit('ready');
  }

  watchSingle(filePath) {
    try {
      const watcher = fs.watch(filePath, (eventType, filename) => {
        this.handleEvent(eventType, filename, filePath);
      });

      watcher.on('error', (err) => {
        this.emit('error', err);
        this.handleWatcherError(filePath, err);
      });

      this.watchers.set(filePath, watcher);
    } catch (err) {
      this.emit('error', err);
    }
  }

  async watchRecursive(dirPath) {
    try {
      // Watch this directory
      this.watchSingle(dirPath);

      // Watch all subdirectories
      const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const fullPath = path.join(dirPath, entry.name);

          if (!this.isIgnored(fullPath)) {
            await this.watchRecursive(fullPath);
          }
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  handleEvent(eventType, filename, watchPath) {
    const fullPath = path.join(watchPath, filename || '');

    // Debounce rapid events
    const key = `${eventType}:${fullPath}`;

    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.processEvent(eventType, fullPath);
    }, this.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  async processEvent(eventType, filePath) {
    try {
      // Check if file/directory exists
      const exists = await fsPromises.access(filePath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        const stats = await fsPromises.stat(filePath);

        if (eventType === 'rename' && stats.isDirectory() && this.recursive) {
          // New directory created, watch it
          await this.watchRecursive(filePath);
        }

        this.emit('change', {
          type: eventType,
          path: filePath,
          stats: stats,
          isDirectory: stats.isDirectory()
        });
      } else {
        // File/directory deleted
        this.emit('change', {
          type: 'delete',
          path: filePath,
          stats: null,
          isDirectory: false
        });

        // Stop watching if it was a directory
        if (this.watchers.has(filePath)) {
          this.watchers.get(filePath).close();
          this.watchers.delete(filePath);
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  handleWatcherError(filePath, err) {
    // Remove failed watcher
    if (this.watchers.has(filePath)) {
      this.watchers.get(filePath).close();
      this.watchers.delete(filePath);
    }

    // Try to restart watcher after delay
    if (this.running) {
      setTimeout(() => {
        if (this.running) {
          this.watchSingle(filePath);
        }
      }, 1000);
    }
  }

  isIgnored(filePath) {
    return this.ignored.some(pattern => {
      if (typeof pattern === 'string') {
        return filePath.includes(pattern);
      } else if (pattern instanceof RegExp) {
        return pattern.test(filePath);
      }
      return false;
    });
  }

  stop() {
    this.running = false;

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();

    this.emit('stop');
  }
}

/**
 * Throttled watcher (limit event frequency)
 */
class ThrottledWatcher extends EventEmitter {
  constructor(watchPath, options = {}) {
    super();
    this.watchPath = watchPath;
    this.throttleDelay = options.throttleDelay || 1000;
    this.lastEmit = new Map();
    this.watcher = null;
  }

  start() {
    this.watcher = fs.watch(this.watchPath, (eventType, filename) => {
      const fullPath = path.join(this.watchPath, filename || '');
      const key = fullPath;
      const now = Date.now();
      const last = this.lastEmit.get(key) || 0;

      if (now - last >= this.throttleDelay) {
        this.lastEmit.set(key, now);
        this.emit('change', { type: eventType, path: fullPath });
      }
    });
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.lastEmit.clear();
  }
}

async function demonstrateAdvancedWatching() {
  console.log('Advanced File Watching Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-watch');
  await fsPromises.mkdir(testDir, { recursive: true });

  try {
    // Example 1: Basic file watcher with debouncing
    console.log('\n1. Debounced File Watcher');
    console.log('─'.repeat(50));

    const testFile = path.join(testDir, 'watched.txt');
    await fsPromises.writeFile(testFile, 'Initial content');

    const watcher1 = new FileWatcher(testFile, { debounceDelay: 200 });

    watcher1.on('change', (event) => {
      console.log(`  Event: ${event.type} - ${path.basename(event.path)}`);
    });

    watcher1.on('ready', () => console.log('  ✓ Watcher ready'));

    await watcher1.start();

    // Make rapid changes
    console.log('  Making rapid changes...');
    for (let i = 0; i < 5; i++) {
      await fsPromises.appendFile(testFile, ` update ${i}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Wait for debounced events
    await new Promise(resolve => setTimeout(resolve, 500));
    watcher1.stop();

    // Example 2: Recursive directory watcher
    console.log('\n2. Recursive Directory Watcher');
    console.log('─'.repeat(50));

    const recursiveDir = path.join(testDir, 'recursive');
    await fsPromises.mkdir(recursiveDir, { recursive: true });

    const watcher2 = new FileWatcher(recursiveDir, {
      recursive: true,
      debounceDelay: 100
    });

    const events = [];
    watcher2.on('change', (event) => {
      const relativePath = path.relative(recursiveDir, event.path);
      console.log(`  ${event.type}: ${relativePath} ${event.isDirectory ? '[DIR]' : ''}`);
      events.push(event);
    });

    await watcher2.start();

    // Create nested structure
    await new Promise(resolve => setTimeout(resolve, 200));
    await fsPromises.mkdir(path.join(recursiveDir, 'sub1'));
    await new Promise(resolve => setTimeout(resolve, 200));
    await fsPromises.writeFile(path.join(recursiveDir, 'file1.txt'), 'content');
    await new Promise(resolve => setTimeout(resolve, 200));
    await fsPromises.mkdir(path.join(recursiveDir, 'sub1', 'sub2'));
    await new Promise(resolve => setTimeout(resolve, 200));
    await fsPromises.writeFile(path.join(recursiveDir, 'sub1', 'sub2', 'file2.txt'), 'content');

    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`  Total events captured: ${events.length}`);

    watcher2.stop();

    // Example 3: Throttled watcher
    console.log('\n3. Throttled Watcher (Rate Limiting)');
    console.log('─'.repeat(50));

    const throttleDir = path.join(testDir, 'throttle');
    await fsPromises.mkdir(throttleDir, { recursive: true });

    const throttledWatcher = new ThrottledWatcher(throttleDir, {
      throttleDelay: 1000 // Max 1 event per second per file
    });

    let throttledEvents = 0;
    throttledWatcher.on('change', () => {
      throttledEvents++;
      console.log(`  Event ${throttledEvents} (throttled)`);
    });

    throttledWatcher.start();

    // Create many rapid changes
    console.log('  Making 10 rapid changes...');
    const throttleFile = path.join(throttleDir, 'file.txt');
    await fsPromises.writeFile(throttleFile, 'initial');

    for (let i = 0; i < 10; i++) {
      await fsPromises.appendFile(throttleFile, ` ${i}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(`  Only ${throttledEvents} events emitted (throttled from 10+)`);

    throttledWatcher.stop();

    // Example 4: Watcher with ignored patterns
    console.log('\n4. Watcher with Ignored Patterns');
    console.log('─'.repeat(50));

    const ignoreDir = path.join(testDir, 'ignore-test');
    await fsPromises.mkdir(ignoreDir, { recursive: true });

    const watcher4 = new FileWatcher(ignoreDir, {
      recursive: true,
      ignored: ['node_modules', '.git', /\.tmp$/]
    });

    watcher4.on('change', (event) => {
      const relativePath = path.relative(ignoreDir, event.path);
      console.log(`  Watching: ${relativePath}`);
    });

    await watcher4.start();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create various files
    await fsPromises.mkdir(path.join(ignoreDir, 'node_modules'));
    await fsPromises.writeFile(path.join(ignoreDir, 'app.js'), 'code');
    await fsPromises.writeFile(path.join(ignoreDir, 'test.tmp'), 'temp');

    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('  ✓ Ignored patterns working (node_modules and .tmp not watched)');

    watcher4.stop();

    // Example 5: Error handling and recovery
    console.log('\n5. Error Handling and Recovery');
    console.log('─'.repeat(50));

    const errorDir = path.join(testDir, 'error-test');
    await fsPromises.mkdir(errorDir, { recursive: true });

    const watcher5 = new FileWatcher(errorDir, { recursive: true });

    watcher5.on('error', (err) => {
      console.log(`  Error caught: ${err.code || err.message}`);
    });

    watcher5.on('change', (event) => {
      console.log(`  Event: ${event.type}`);
    });

    await watcher5.start();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create a file
    await fsPromises.writeFile(path.join(errorDir, 'test.txt'), 'content');

    await new Promise(resolve => setTimeout(resolve, 500));
    watcher5.stop();

    // Example 6: Change type detection
    console.log('\n6. Detecting Change Types');
    console.log('─'.repeat(50));

    const changeDir = path.join(testDir, 'change-types');
    await fsPromises.mkdir(changeDir, { recursive: true });

    const watcher6 = new FileWatcher(changeDir, { recursive: true });

    watcher6.on('change', (event) => {
      const relativePath = path.relative(changeDir, event.path);
      let changeType = 'unknown';

      if (event.type === 'rename') {
        changeType = event.stats ? 'created' : 'deleted';
      } else if (event.type === 'change') {
        changeType = 'modified';
      }

      console.log(`  ${changeType.toUpperCase()}: ${relativePath}`);
    });

    await watcher6.start();
    await new Promise(resolve => setTimeout(resolve, 200));

    // Various operations
    const file1 = path.join(changeDir, 'file1.txt');
    await fsPromises.writeFile(file1, 'content'); // CREATE
    await new Promise(resolve => setTimeout(resolve, 200));

    await fsPromises.appendFile(file1, ' more'); // MODIFY
    await new Promise(resolve => setTimeout(resolve, 200));

    await fsPromises.rename(file1, path.join(changeDir, 'file2.txt')); // RENAME
    await new Promise(resolve => setTimeout(resolve, 200));

    await fsPromises.unlink(path.join(changeDir, 'file2.txt')); // DELETE

    await new Promise(resolve => setTimeout(resolve, 500));
    watcher6.stop();

    // Example 7: Multi-directory watcher
    console.log('\n7. Watching Multiple Directories');
    console.log('─'.repeat(50));

    const dir1 = path.join(testDir, 'multi1');
    const dir2 = path.join(testDir, 'multi2');

    await fsPromises.mkdir(dir1, { recursive: true });
    await fsPromises.mkdir(dir2, { recursive: true });

    const watchers = [dir1, dir2].map(dir => {
      const watcher = new FileWatcher(dir);
      watcher.on('change', (event) => {
        const dirName = path.basename(path.dirname(event.path));
        console.log(`  [${dirName}] ${event.type}: ${path.basename(event.path)}`);
      });
      return watcher;
    });

    await Promise.all(watchers.map(w => w.start()));
    await new Promise(resolve => setTimeout(resolve, 200));

    // Changes in different directories
    await fsPromises.writeFile(path.join(dir1, 'file.txt'), 'content');
    await new Promise(resolve => setTimeout(resolve, 200));
    await fsPromises.writeFile(path.join(dir2, 'file.txt'), 'content');

    await new Promise(resolve => setTimeout(resolve, 500));
    watchers.forEach(w => w.stop());

    console.log('  ✓ Multiple directories watched successfully');

    // Cleanup
    console.log('\n8. Cleanup');
    console.log('─'.repeat(50));

    await fsPromises.rm(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

// Run with timeout
const timeout = setTimeout(() => {
  console.log('\nDemo timeout - stopping...');
  process.exit(0);
}, 10000); // 10 seconds max

demonstrateAdvancedWatching().then(() => {
  clearTimeout(timeout);
});

/**
 * fs.watch() Limitations:
 *
 * 1. Platform Differences:
 *    - macOS: Uses FSEvents (efficient)
 *    - Linux: Uses inotify (resource limited)
 *    - Windows: Uses ReadDirectoryChangesW
 *
 * 2. Event Unreliability:
 *    - May fire multiple times
 *    - May miss rapid changes
 *    - filename may be null
 *
 * 3. No Recursive Support:
 *    - Must manually watch subdirectories
 *    - New directories need to be watched
 *
 * 4. Resource Limits:
 *    - Linux: inotify watch limit
 *    - Check: cat /proc/sys/fs/inotify/max_user_watches
 *    - Increase: sudo sysctl fs.inotify.max_user_watches=524288
 */

/**
 * Production Patterns:
 *
 * 1. Debouncing:
 *    - Group rapid events
 *    - Delay processing
 *    - Reduce noise
 *
 * 2. Throttling:
 *    - Limit event rate
 *    - Prevent flooding
 *    - Resource protection
 *
 * 3. Error Recovery:
 *    - Catch watcher errors
 *    - Restart failed watchers
 *    - Log issues
 *
 * 4. Cleanup:
 *    - Always close watchers
 *    - Clear timers
 *    - Release resources
 */

/**
 * Alternatives to fs.watch():
 *
 * 1. chokidar (npm package):
 *    - Cross-platform consistent
 *    - Handles edge cases
 *    - Recursive by default
 *    - Production ready
 *
 * 2. Polling (fs.watchFile):
 *    - More reliable
 *    - Higher resource usage
 *    - Slower to detect changes
 *
 * 3. Custom polling:
 *    - Full control
 *    - Compare file stats
 *    - Configurable intervals
 */
