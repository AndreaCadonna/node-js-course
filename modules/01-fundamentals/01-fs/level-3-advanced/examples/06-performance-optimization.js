/**
 * Example 6: Performance Optimization
 *
 * Demonstrates techniques for optimizing file system operations.
 *
 * Key Concepts:
 * - Parallel vs sequential operations
 * - Batch processing strategies
 * - Caching file metadata
 * - Minimizing syscalls
 * - Buffer reuse
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Simple metadata cache
 */
class StatCache {
  constructor(ttl = 5000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async getStat(filePath) {
    const cached = this.cache.get(filePath);

    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.stats;
    }

    const stats = await fs.stat(filePath);
    this.cache.set(filePath, { stats, time: Date.now() });
    return stats;
  }

  invalidate(filePath) {
    this.cache.delete(filePath);
  }

  clear() {
    this.cache.clear();
  }
}

async function demonstratePerformanceOptimization() {
  console.log('Performance Optimization Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-perf');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Create test files
    console.log('Setting up test files...');
    const fileCount = 100;
    const files = [];

    for (let i = 0; i < fileCount; i++) {
      const filename = path.join(testDir, `file-${i.toString().padStart(3, '0')}.txt`);
      await fs.writeFile(filename, `Content of file ${i}\n`.repeat(10));
      files.push(filename);
    }

    console.log(`✓ Created ${fileCount} test files\n`);

    // Example 1: Sequential vs Parallel
    console.log('1. Sequential vs Parallel Processing');
    console.log('─'.repeat(50));

    // Sequential
    const seqStart = Date.now();
    const seqResults = [];

    for (const file of files.slice(0, 50)) {
      const stats = await fs.stat(file);
      seqResults.push(stats.size);
    }

    const seqDuration = Date.now() - seqStart;
    console.log(`  Sequential (50 files): ${seqDuration}ms`);

    // Parallel
    const parStart = Date.now();

    const parResults = await Promise.all(
      files.slice(0, 50).map(async file => {
        const stats = await fs.stat(file);
        return stats.size;
      })
    );

    const parDuration = Date.now() - parStart;
    console.log(`  Parallel (50 files): ${parDuration}ms`);
    console.log(`  Speedup: ${(seqDuration / parDuration).toFixed(2)}x`);

    // Example 2: Controlled Concurrency
    console.log('\n2. Controlled Concurrency');
    console.log('─'.repeat(50));

    async function processInBatches(files, batchSize, processor) {
      const results = [];

      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
      }

      return results;
    }

    // Test different batch sizes
    const batchSizes = [10, 20, 50];

    for (const batchSize of batchSizes) {
      const start = Date.now();

      await processInBatches(
        files,
        batchSize,
        async file => await fs.stat(file)
      );

      const duration = Date.now() - start;
      console.log(`  Batch size ${batchSize.toString().padStart(2)}: ${duration}ms`);
    }

    // Example 3: Caching File Stats
    console.log('\n3. Caching File Stats');
    console.log('─'.repeat(50));

    const cache = new StatCache(10000); // 10 second TTL

    // First pass - no cache
    const noCacheStart = Date.now();
    for (const file of files.slice(0, 30)) {
      await fs.stat(file);
    }
    const noCacheDuration = Date.now() - noCacheStart;
    console.log(`  Without cache (first run): ${noCacheDuration}ms`);

    // Second pass - with cache
    const cacheStart = Date.now();
    for (const file of files.slice(0, 30)) {
      await cache.getStat(file);
    }
    const cacheDuration = Date.now() - cacheStart;
    console.log(`  Without cache (second run): ${cacheDuration}ms`);

    // Third pass - from cache
    const cachedStart = Date.now();
    for (const file of files.slice(0, 30)) {
      await cache.getStat(file);
    }
    const cachedDuration = Date.now() - cachedStart;
    console.log(`  With cache (third run): ${cachedDuration}ms`);
    console.log(`  Cache speedup: ${(noCacheDuration / cachedDuration).toFixed(2)}x`);

    // Example 4: Buffer Reuse
    console.log('\n4. Buffer Reuse');
    console.log('─'.repeat(50));

    const testFile = files[0];

    // Creating new buffers each time
    const newBufferStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      const buffer = Buffer.alloc(1024);
      // Simulate work
    }
    const newBufferDuration = Date.now() - newBufferStart;
    console.log(`  New buffer each time: ${newBufferDuration}ms`);

    // Reusing buffer
    const reuseBufferStart = Date.now();
    const reusableBuffer = Buffer.alloc(1024);
    for (let i = 0; i < 1000; i++) {
      reusableBuffer.fill(0);
      // Simulate work
    }
    const reuseBufferDuration = Date.now() - reuseBufferStart;
    console.log(`  Reusing buffer: ${reuseBufferDuration}ms`);
    console.log(`  Improvement: ${(newBufferDuration / reuseBufferDuration).toFixed(2)}x`);

    // Example 5: Minimizing Stat Calls
    console.log('\n5. Minimizing Stat Calls');
    console.log('─'.repeat(50));

    // Inefficient: stat() + readdir()
    const inefficientStart = Date.now();
    let inefficientFiles = await fs.readdir(testDir);
    inefficientFiles = await Promise.all(
      inefficientFiles.map(async file => {
        const stats = await fs.stat(path.join(testDir, file));
        return { name: file, size: stats.size };
      })
    );
    const inefficientDuration = Date.now() - inefficientStart;
    console.log(`  readdir() + stat(): ${inefficientDuration}ms`);

    // Efficient: readdir with withFileTypes
    const efficientStart = Date.now();
    const entries = await fs.readdir(testDir, { withFileTypes: true });
    const efficientFiles = await Promise.all(
      entries.map(async entry => {
        const stats = await fs.stat(path.join(testDir, entry.name));
        return { name: entry.name, size: stats.size };
      })
    );
    const efficientDuration = Date.now() - efficientStart;
    console.log(`  readdir(withFileTypes) + stat(): ${efficientDuration}ms`);
    console.log(`  Improvement: ${(inefficientDuration / efficientDuration).toFixed(2)}x`);

    // Example 6: Bulk Operations
    console.log('\n6. Bulk Operations');
    console.log('─'.repeat(50));

    const bulkDir = path.join(testDir, 'bulk');
    await fs.mkdir(bulkDir);

    // One-by-one
    const oneByOneStart = Date.now();
    for (let i = 0; i < 20; i++) {
      await fs.writeFile(
        path.join(bulkDir, `one-${i}.txt`),
        `File ${i}`
      );
    }
    const oneByOneDuration = Date.now() - oneByOneStart;
    console.log(`  One-by-one writes: ${oneByOneDuration}ms`);

    // Bulk parallel
    const bulkStart = Date.now();
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        fs.writeFile(
          path.join(bulkDir, `bulk-${i}.txt`),
          `File ${i}`
        )
      )
    );
    const bulkDuration = Date.now() - bulkStart;
    console.log(`  Bulk parallel writes: ${bulkDuration}ms`);
    console.log(`  Speedup: ${(oneByOneDuration / bulkDuration).toFixed(2)}x`);

    // Example 7: Stream vs Buffer for Large Files
    console.log('\n7. Stream vs Buffer for Large Files');
    console.log('─'.repeat(50));

    const largeFile = path.join(testDir, 'large.txt');
    const largeWriter = require('fs').createWriteStream(largeFile);

    // Create 10MB file
    for (let i = 0; i < 10000; i++) {
      largeWriter.write('x'.repeat(1024));
    }
    largeWriter.end();
    await new Promise(resolve => largeWriter.on('finish', resolve));

    // Buffer approach
    const bufferStart = Date.now();
    const allData = await fs.readFile(largeFile);
    const bufferDuration = Date.now() - bufferStart;
    console.log(`  Buffer (${(allData.length / 1024 / 1024).toFixed(2)}MB): ${bufferDuration}ms`);

    // Stream approach
    const streamStart = Date.now();
    let streamBytes = 0;
    const stream = require('fs').createReadStream(largeFile);

    await new Promise(resolve => {
      stream.on('data', chunk => streamBytes += chunk.length);
      stream.on('end', resolve);
    });

    const streamDuration = Date.now() - streamStart;
    console.log(`  Stream (${(streamBytes / 1024 / 1024).toFixed(2)}MB): ${streamDuration}ms`);

    // Example 8: Aggregating Results Efficiently
    console.log('\n8. Aggregating Results Efficiently');
    console.log('─'.repeat(50));

    // Inefficient: await in loop
    const ineffAggStart = Date.now();
    let totalSize1 = 0;
    for (const file of files.slice(0, 30)) {
      const stats = await fs.stat(file);
      totalSize1 += stats.size;
    }
    const ineffAggDuration = Date.now() - ineffAggStart;
    console.log(`  Await in loop: ${ineffAggDuration}ms`);

    // Efficient: Promise.all + reduce
    const effAggStart = Date.now();
    const sizes = await Promise.all(
      files.slice(0, 30).map(async file => {
        const stats = await fs.stat(file);
        return stats.size;
      })
    );
    const totalSize2 = sizes.reduce((sum, size) => sum + size, 0);
    const effAggDuration = Date.now() - effAggStart;
    console.log(`  Promise.all + reduce: ${effAggDuration}ms`);
    console.log(`  Speedup: ${(ineffAggDuration / effAggDuration).toFixed(2)}x`);

    // Example 9: Directory Scanning Strategies
    console.log('\n9. Directory Scanning Strategies');
    console.log('─'.repeat(50));

    async function scanRecursiveNaive(dir) {
      let count = 0;
      const entries = await fs.readdir(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          count += await scanRecursiveNaive(fullPath);
        } else {
          count++;
        }
      }

      return count;
    }

    async function scanRecursiveOptimized(dir) {
      let count = 0;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      const promises = entries.map(async entry => {
        if (entry.isDirectory()) {
          return scanRecursiveOptimized(path.join(dir, entry.name));
        }
        return 1;
      });

      const results = await Promise.all(promises);
      return results.reduce((sum, n) => sum + n, 0);
    }

    // Create nested structure
    const nestedDir = path.join(testDir, 'nested');
    await fs.mkdir(path.join(nestedDir, 'sub1', 'sub2'), { recursive: true });
    await fs.writeFile(path.join(nestedDir, 'file1.txt'), 'test');
    await fs.writeFile(path.join(nestedDir, 'sub1', 'file2.txt'), 'test');
    await fs.writeFile(path.join(nestedDir, 'sub1', 'sub2', 'file3.txt'), 'test');

    const naiveStart = Date.now();
    const naiveCount = await scanRecursiveNaive(nestedDir);
    const naiveDuration = Date.now() - naiveStart;
    console.log(`  Naive recursive: ${naiveDuration}ms (${naiveCount} files)`);

    const optimizedStart = Date.now();
    const optimizedCount = await scanRecursiveOptimized(nestedDir);
    const optimizedDuration = Date.now() - optimizedStart;
    console.log(`  Optimized recursive: ${optimizedDuration}ms (${optimizedCount} files)`);
    console.log(`  Speedup: ${(naiveDuration / optimizedDuration).toFixed(2)}x`);

    // Example 10: Performance Summary
    console.log('\n10. Performance Best Practices Summary');
    console.log('─'.repeat(50));

    console.log(`
  ✓ Use Promise.all() for independent operations
  ✓ Batch operations to control concurrency
  ✓ Cache frequently accessed metadata
  ✓ Reuse buffers when possible
  ✓ Use readdir with withFileTypes to avoid extra stats
  ✓ Use streams for large files
  ✓ Minimize filesystem syscalls
  ✓ Process results in parallel
  ✓ Use async/await efficiently
  ✓ Profile before optimizing
    `);

    // Cleanup
    console.log('11. Cleanup');
    console.log('─'.repeat(50));

    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

demonstratePerformanceOptimization();

/**
 * Performance Tips:
 *
 * 1. Parallel I/O:
 *    - Use Promise.all() for independent operations
 *    - Don't await in loops for parallel work
 *    - Control concurrency to avoid overwhelming system
 *
 * 2. Minimize Syscalls:
 *    - Use withFileTypes in readdir()
 *    - Batch stat() calls
 *    - Cache results when appropriate
 *
 * 3. Use Streams:
 *    - Files > 100MB should use streams
 *    - Reduces memory usage
 *    - Enables processing during I/O
 *
 * 4. Buffer Management:
 *    - Reuse buffers when possible
 *    - Use appropriate buffer sizes
 *    - Clear buffers between uses
 *
 * 5. Caching:
 *    - Cache file stats with TTL
 *    - Invalidate on changes
 *    - Balance memory vs speed
 */

/**
 * Common Performance Mistakes:
 *
 * ✗ await in loops (sequential when could be parallel)
 * ✗ Not controlling concurrency (too many parallel ops)
 * ✗ Using readFile() for large files
 * ✗ Unnecessary stat() calls
 * ✗ Creating new buffers repeatedly
 * ✗ Not caching frequently accessed data
 * ✗ Forgetting to close file descriptors
 * ✗ Synchronous operations in async code
 */

/**
 * Profiling File Operations:
 *
 * Use console.time():
 *   console.time('operation');
 *   await fs.readFile(file);
 *   console.timeEnd('operation');
 *
 * Use performance hooks:
 *   const { performance } = require('perf_hooks');
 *   const start = performance.now();
 *   await operation();
 *   console.log(performance.now() - start);
 *
 * Profile with --prof:
 *   node --prof script.js
 *   node --prof-process isolate-*.log
 */
