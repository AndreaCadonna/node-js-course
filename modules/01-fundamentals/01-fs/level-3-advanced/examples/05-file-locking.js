/**
 * Example 5: File Locking and Coordination
 *
 * Demonstrates techniques for coordinating file access between processes.
 *
 * Key Concepts:
 * - Lock files for exclusive access
 * - Atomic rename for safe updates
 * - PID-based locking
 * - Lock cleanup and timeouts
 * - Handling stale locks
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Simple file-based lock implementation
 */
class FileLock {
  constructor(lockPath, options = {}) {
    this.lockPath = lockPath;
    this.locked = false;
    this.pid = process.pid;
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.checkInterval = options.checkInterval || 100;
  }

  async acquire(maxWait = 10000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      try {
        // Try to create lock file exclusively
        const lockData = JSON.stringify({
          pid: this.pid,
          time: Date.now(),
          hostname: require('os').hostname()
        });

        await fs.writeFile(this.lockPath, lockData, { flag: 'wx' });
        this.locked = true;
        return true;
      } catch (err) {
        if (err.code !== 'EEXIST') {
          throw err;
        }

        // Lock exists, check if stale
        try {
          const content = await fs.readFile(this.lockPath, 'utf8');
          const lockInfo = JSON.parse(content);

          if (Date.now() - lockInfo.time > this.timeout) {
            console.log(`  Removing stale lock (PID: ${lockInfo.pid})`);
            await this.forceRelease();
            continue;
          }
        } catch {
          // Couldn't read lock, might be being written
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      }
    }

    return false; // Couldn't acquire lock
  }

  async release() {
    if (!this.locked) return;

    try {
      // Verify we still own the lock
      const content = await fs.readFile(this.lockPath, 'utf8');
      const lockInfo = JSON.parse(content);

      if (lockInfo.pid === this.pid) {
        await fs.unlink(this.lockPath);
        this.locked = false;
      }
    } catch (err) {
      // Lock already released or doesn't exist
      this.locked = false;
    }
  }

  async forceRelease() {
    try {
      await fs.unlink(this.lockPath);
      this.locked = false;
    } catch {
      // Already released
    }
  }
}

/**
 * Atomic file writer using tmp + rename
 */
class AtomicWriter {
  constructor(filePath) {
    this.filePath = filePath;
    this.tmpPath = filePath + '.tmp.' + process.pid;
  }

  async write(data) {
    try {
      // Write to temporary file
      await fs.writeFile(this.tmpPath, data);

      // Atomically replace original
      await fs.rename(this.tmpPath, this.filePath);

      return true;
    } catch (err) {
      // Clean up temp file on error
      try {
        await fs.unlink(this.tmpPath);
      } catch {
        // Ignore cleanup errors
      }
      throw err;
    }
  }
}

async function demonstrateFileLocking() {
  console.log('File Locking Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-locking');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Example 1: Basic lock file
    console.log('\n1. Basic Lock File');
    console.log('─'.repeat(50));

    const lockFile = path.join(testDir, 'app.lock');
    const lock = new FileLock(lockFile);

    const acquired = await lock.acquire();
    if (acquired) {
      console.log('  ✓ Lock acquired');
      console.log(`  Lock file: ${path.basename(lockFile)}`);

      // Do some work
      await new Promise(resolve => setTimeout(resolve, 100));

      await lock.release();
      console.log('  ✓ Lock released');
    } else {
      console.log('  ✗ Could not acquire lock');
    }

    // Example 2: Concurrent access simulation
    console.log('\n2. Concurrent Access Simulation');
    console.log('─'.repeat(50));

    const sharedFile = path.join(testDir, 'shared.txt');
    const sharedLock = path.join(testDir, 'shared.lock');

    await fs.writeFile(sharedFile, '0');

    // Simulate multiple "processes" trying to increment
    async function incrementFile(id) {
      const lock = new FileLock(sharedLock);

      for (let i = 0; i < 3; i++) {
        if (await lock.acquire(2000)) {
          try {
            // Read current value
            const current = parseInt(await fs.readFile(sharedFile, 'utf8'));

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 10));

            // Write new value
            await fs.writeFile(sharedFile, (current + 1).toString());

            console.log(`  Process ${id}: ${current} → ${current + 1}`);
          } finally {
            await lock.release();
          }
        } else {
          console.log(`  Process ${id}: timeout waiting for lock`);
        }
      }
    }

    await Promise.all([
      incrementFile('A'),
      incrementFile('B'),
      incrementFile('C')
    ]);

    const finalValue = await fs.readFile(sharedFile, 'utf8');
    console.log(`  Final value: ${finalValue} (expected: 9)`);

    // Example 3: Atomic file updates
    console.log('\n3. Atomic File Updates');
    console.log('─'.repeat(50));

    const configFile = path.join(testDir, 'config.json');
    const writer = new AtomicWriter(configFile);

    console.log('  Writing configuration atomically...');

    await writer.write(JSON.stringify({
      version: '1.0.0',
      setting: 'value'
    }, null, 2));

    console.log('  ✓ First write complete');

    // Update atomically
    await writer.write(JSON.stringify({
      version: '1.1.0',
      setting: 'updated',
      newFeature: true
    }, null, 2));

    console.log('  ✓ Update complete (atomically replaced)');

    const config = JSON.parse(await fs.readFile(configFile, 'utf8'));
    console.log(`  Current version: ${config.version}`);

    // Example 4: Lock with timeout handling
    console.log('\n4. Lock Timeout Handling');
    console.log('─'.repeat(50));

    const timeoutLock = path.join(testDir, 'timeout.lock');
    const lock1 = new FileLock(timeoutLock, { timeout: 2000 });
    const lock2 = new FileLock(timeoutLock, { timeout: 2000 });

    // First lock acquires
    await lock1.acquire();
    console.log('  Lock 1: Acquired');

    // Second lock tries to acquire (will fail quickly)
    const acquired2 = await lock2.acquire(500); // Only wait 500ms
    console.log(`  Lock 2: ${acquired2 ? 'Acquired' : 'Timeout (expected)'}`);

    // Release first lock
    await lock1.release();
    console.log('  Lock 1: Released');

    // Now lock 2 can acquire
    const acquired2retry = await lock2.acquire(500);
    console.log(`  Lock 2: ${acquired2retry ? 'Acquired on retry' : 'Failed'}`);
    await lock2.release();

    // Example 5: Stale lock detection
    console.log('\n5. Stale Lock Detection');
    console.log('─'.repeat(50));

    const staleLockPath = path.join(testDir, 'stale.lock');

    // Create a lock that appears old
    const staleLockData = JSON.stringify({
      pid: 99999, // Fake PID
      time: Date.now() - 60000, // 1 minute ago
      hostname: 'old-host'
    });

    await fs.writeFile(staleLockPath, staleLockData);
    console.log('  Created stale lock (60 seconds old)');

    // Try to acquire - should detect and clean stale lock
    const staleLock = new FileLock(staleLockPath, { timeout: 5000 });
    const acquiredStale = await staleLock.acquire(2000);

    console.log(`  ${acquiredStale ? '✓ Acquired (stale lock removed)' : '✗ Failed'}`);
    await staleLock.release();

    // Example 6: Read-write pattern
    console.log('\n6. Safe Read-Modify-Write Pattern');
    console.log('─'.repeat(50));

    const dataFile = path.join(testDir, 'data.json');
    const dataLock = path.join(testDir, 'data.lock');

    // Initialize data
    await fs.writeFile(dataFile, JSON.stringify({ counter: 0, items: [] }));

    async function safeUpdate(updateFn) {
      const lock = new FileLock(dataLock);

      if (await lock.acquire(5000)) {
        try {
          // Read
          const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));

          // Modify
          updateFn(data);

          // Write atomically
          const writer = new AtomicWriter(dataFile);
          await writer.write(JSON.stringify(data));

          return true;
        } finally {
          await lock.release();
        }
      }

      return false;
    }

    // Multiple updates
    await safeUpdate(data => {
      data.counter++;
      data.items.push('item1');
    });
    console.log('  ✓ Update 1 complete');

    await safeUpdate(data => {
      data.counter++;
      data.items.push('item2');
    });
    console.log('  ✓ Update 2 complete');

    const finalData = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    console.log(`  Final state: counter=${finalData.counter}, items=${finalData.items.length}`);

    // Example 7: Directory-level locking
    console.log('\n7. Directory-Level Locking');
    console.log('─'.repeat(50));

    const workDir = path.join(testDir, 'work-dir');
    await fs.mkdir(workDir, { recursive: true });

    const dirLock = path.join(workDir, '.lock');

    async function processDirectory(id) {
      const lock = new FileLock(dirLock);

      if (await lock.acquire(2000)) {
        try {
          console.log(`  Worker ${id}: Processing directory...`);

          // Create a file in the directory
          const file = path.join(workDir, `result-${id}.txt`);
          await fs.writeFile(file, `Processed by worker ${id}`);

          await new Promise(resolve => setTimeout(resolve, 50));

          console.log(`  Worker ${id}: Done`);
        } finally {
          await lock.release();
        }
      } else {
        console.log(`  Worker ${id}: Could not acquire lock`);
      }
    }

    await Promise.all([
      processDirectory('A'),
      processDirectory('B'),
      processDirectory('C')
    ]);

    const results = await fs.readdir(workDir);
    console.log(`  Files created: ${results.filter(f => f.startsWith('result')).length}`);

    // Example 8: Lock with automatic cleanup
    console.log('\n8. Lock with Automatic Cleanup');
    console.log('─'.repeat(50));

    const autoLockPath = path.join(testDir, 'auto.lock');

    async function withLock(lockPath, fn) {
      const lock = new FileLock(lockPath);

      if (await lock.acquire(5000)) {
        try {
          return await fn();
        } finally {
          await lock.release();
        }
      } else {
        throw new Error('Could not acquire lock');
      }
    }

    const result = await withLock(autoLockPath, async () => {
      console.log('  Inside locked section');
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'Success';
    });

    console.log(`  ✓ ${result} (lock auto-released)`);

    // Example 9: Lock monitoring
    console.log('\n9. Lock Status Monitoring');
    console.log('─'.repeat(50));

    const monitorLock = path.join(testDir, 'monitor.lock');

    async function getLockInfo(lockPath) {
      try {
        const content = await fs.readFile(lockPath, 'utf8');
        const info = JSON.parse(content);
        const age = Date.now() - info.time;

        return {
          exists: true,
          pid: info.pid,
          age: age,
          ageSeconds: Math.floor(age / 1000)
        };
      } catch {
        return { exists: false };
      }
    }

    // Create a lock
    const monLock = new FileLock(monitorLock);
    await monLock.acquire();

    const lockInfo = await getLockInfo(monitorLock);
    console.log('  Lock status:');
    console.log(`    Exists: ${lockInfo.exists}`);
    console.log(`    PID: ${lockInfo.pid}`);
    console.log(`    Age: ${lockInfo.ageSeconds}s`);

    await monLock.release();

    const afterRelease = await getLockInfo(monitorLock);
    console.log(`  After release: ${afterRelease.exists ? 'Still exists' : 'Removed'}`);

    // Cleanup
    console.log('\n10. Cleanup');
    console.log('─'.repeat(50));

    // Clean up any remaining locks
    const files = await fs.readdir(testDir);
    const locks = files.filter(f => f.endsWith('.lock'));

    for (const lock of locks) {
      await fs.unlink(path.join(testDir, lock));
    }

    console.log(`  Removed ${locks.length} lock files`);

    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

demonstrateFileLocking();

/**
 * File Locking Strategies:
 *
 * 1. Lock File:
 *    - Create exclusive file (wx flag)
 *    - Simple and portable
 *    - Need to handle stale locks
 *
 * 2. Atomic Rename:
 *    - Write to temp, rename
 *    - Atomic on most systems
 *    - No lock needed for single write
 *
 * 3. Advisory Locks (flock):
 *    - OS-level locking
 *    - Not available in Node.js core
 *    - Requires native modules
 *
 * 4. Database/Redis:
 *    - Distributed locking
 *    - More robust
 *    - Additional dependency
 */

/**
 * Best Practices:
 *
 * ✓ Always release locks in finally block
 * ✓ Implement timeout for lock acquisition
 * ✓ Detect and clean stale locks
 * ✓ Store PID in lock for debugging
 * ✓ Use atomic operations when possible
 *
 * ✗ Don't hold locks longer than necessary
 * ✗ Don't forget to handle process crashes
 * ✗ Don't assume lock is still valid
 * ✗ Don't use locks for distributed systems
 */

/**
 * Common Pitfalls:
 *
 * 1. Stale Locks:
 *    Process crashes without releasing
 *    Solution: Timeout-based cleanup
 *
 * 2. Race Conditions:
 *    Check-then-act pattern
 *    Solution: Atomic operations
 *
 * 3. Deadlocks:
 *    Multiple locks acquired in different order
 *    Solution: Consistent lock ordering
 *
 * 4. Lock Not Released:
 *    Exception before release
 *    Solution: try/finally blocks
 */
