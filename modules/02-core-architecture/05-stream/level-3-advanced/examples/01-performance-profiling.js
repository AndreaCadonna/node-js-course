/**
 * 01-performance-profiling.js
 * ===========================
 * Demonstrates advanced performance profiling and optimization techniques
 *
 * Key Concepts:
 * - Performance monitoring
 * - Memory profiling
 * - CPU profiling
 * - Throughput measurement
 * - Backpressure analysis
 * - Optimization techniques
 *
 * Run: node 01-performance-profiling.js
 * Run with GC tracking: node --expose-gc 01-performance-profiling.js
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { performance } = require('perf_hooks');

console.log('=== Stream Performance Profiling Examples ===\n');

// =============================================================================
// Example 1: Basic Performance Monitor
// =============================================================================

class PerformanceMonitor extends Transform {
  constructor(name, options) {
    super(options);
    this.name = name;
    this.chunks = 0;
    this.bytes = 0;
    this.startTime = Date.now();
    this.lastReport = this.startTime;
    this.reportInterval = 1000; // Report every second
  }

  _transform(chunk, encoding, callback) {
    this.chunks++;
    this.bytes += chunk.length;

    // Report metrics periodically
    const now = Date.now();
    if (now - this.lastReport >= this.reportInterval) {
      this.report();
      this.lastReport = now;
    }

    callback(null, chunk);
  }

  _flush(callback) {
    this.report();
    this.finalReport();
    callback();
  }

  report() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const throughputMBps = (this.bytes / elapsed / 1024 / 1024).toFixed(2);
    const chunksPerSec = (this.chunks / elapsed).toFixed(0);

    console.log(`[${this.name}] ${throughputMBps} MB/s, ${chunksPerSec} chunks/s`);
  }

  finalReport() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const throughputMBps = (this.bytes / elapsed / 1024 / 1024).toFixed(2);
    const avgChunkSize = (this.bytes / this.chunks).toFixed(2);

    console.log(`\n[${this.name}] Final Statistics:`);
    console.log(`  Duration: ${elapsed.toFixed(2)}s`);
    console.log(`  Total Bytes: ${(this.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Total Chunks: ${this.chunks}`);
    console.log(`  Throughput: ${throughputMBps} MB/s`);
    console.log(`  Avg Chunk Size: ${avgChunkSize} bytes`);
  }
}

function example1() {
  console.log('--- Example 1: Performance Monitor ---\n');

  // Generate test data
  const source = new Readable({
    read() {
      for (let i = 0; i < 100; i++) {
        if (!this.push(Buffer.alloc(1024 * 10))) { // 10KB chunks
          break;
        }
      }
      this.push(null);
    }
  });

  const monitor = new PerformanceMonitor('Test Stream');

  const destination = new Writable({
    write(chunk, encoding, callback) {
      // Simulate processing
      setImmediate(callback);
    }
  });

  pipeline(source, monitor, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 1 complete\n');
      example2();
    }
  });
}

// =============================================================================
// Example 2: Memory Profiling
// =============================================================================

class MemoryProfiler extends Transform {
  constructor(options) {
    super(options);
    this.samples = [];
    this.sampleInterval = 100; // Sample every 100 chunks
    this.chunkCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.chunkCount++;

    if (this.chunkCount % this.sampleInterval === 0) {
      this.sampleMemory();
    }

    callback(null, chunk);
  }

  sampleMemory() {
    const usage = process.memoryUsage();
    this.samples.push({
      chunk: this.chunkCount,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      timestamp: Date.now()
    });
  }

  _flush(callback) {
    this.analyzeMemory();
    callback();
  }

  analyzeMemory() {
    if (this.samples.length === 0) return;

    const heapUsed = this.samples.map(s => s.heapUsed);
    const avgHeap = heapUsed.reduce((a, b) => a + b) / heapUsed.length;
    const maxHeap = Math.max(...heapUsed);
    const minHeap = Math.min(...heapUsed);

    console.log('\n📊 Memory Profile:');
    console.log(`  Samples: ${this.samples.length}`);
    console.log(`  Avg Heap: ${(avgHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Min Heap: ${(minHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Max Heap: ${(maxHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Growth: ${((maxHeap - minHeap) / 1024 / 1024).toFixed(2)} MB`);

    // Check for memory leak indicators
    const first = this.samples[0].heapUsed;
    const last = this.samples[this.samples.length - 1].heapUsed;
    const growth = ((last - first) / first * 100).toFixed(2);

    if (growth > 50) {
      console.log(`  ⚠️  Potential memory leak detected (${growth}% growth)`);
    } else {
      console.log(`  ✓ Memory usage looks stable (${growth}% growth)`);
    }
  }
}

function example2() {
  console.log('--- Example 2: Memory Profiling ---\n');

  const source = new Readable({
    read() {
      for (let i = 0; i < 1000; i++) {
        if (!this.push(Buffer.alloc(1024))) {
          break;
        }
      }
      this.push(null);
    }
  });

  const profiler = new MemoryProfiler();

  const destination = new Writable({
    write(chunk, encoding, callback) {
      setImmediate(callback);
    }
  });

  pipeline(source, profiler, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 2 complete\n');
      example3();
    }
  });
}

// =============================================================================
// Example 3: Backpressure Analysis
// =============================================================================

class BackpressureAnalyzer extends Transform {
  constructor(options) {
    super(options);
    this.backpressureEvents = 0;
    this.totalWrites = 0;
    this.backpressureDurations = [];
    this.lastBackpressureStart = null;
  }

  _transform(chunk, encoding, callback) {
    this.totalWrites++;

    const canWrite = this.push(chunk);

    if (!canWrite) {
      this.backpressureEvents++;

      if (!this.lastBackpressureStart) {
        this.lastBackpressureStart = Date.now();
      }
    } else {
      if (this.lastBackpressureStart) {
        const duration = Date.now() - this.lastBackpressureStart;
        this.backpressureDurations.push(duration);
        this.lastBackpressureStart = null;
      }
    }

    callback();
  }

  _flush(callback) {
    this.analyzeBackpressure();
    callback();
  }

  analyzeBackpressure() {
    const rate = (this.backpressureEvents / this.totalWrites * 100).toFixed(2);

    console.log('\n⚡ Backpressure Analysis:');
    console.log(`  Total writes: ${this.totalWrites}`);
    console.log(`  Backpressure events: ${this.backpressureEvents}`);
    console.log(`  Backpressure rate: ${rate}%`);

    if (this.backpressureDurations.length > 0) {
      const avgDuration = this.backpressureDurations.reduce((a, b) => a + b) / this.backpressureDurations.length;
      const maxDuration = Math.max(...this.backpressureDurations);

      console.log(`  Avg duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Max duration: ${maxDuration.toFixed(2)}ms`);
    }

    // Recommendations
    if (rate > 50) {
      console.log('\n  💡 High backpressure detected. Consider:');
      console.log('     - Increasing highWaterMark');
      console.log('     - Optimizing slow consumer');
      console.log('     - Adding parallelism');
    } else if (rate < 10) {
      console.log('\n  ✓ Low backpressure - good flow control');
    } else {
      console.log('\n  ✓ Moderate backpressure - acceptable');
    }
  }
}

function example3() {
  console.log('--- Example 3: Backpressure Analysis ---\n');

  // Fast producer
  const fastProducer = new Readable({
    highWaterMark: 1024 * 1024,
    read() {
      for (let i = 0; i < 1000; i++) {
        if (!this.push(Buffer.alloc(1024))) {
          break;
        }
      }
      this.push(null);
    }
  });

  const analyzer = new BackpressureAnalyzer();

  // Slow consumer
  const slowConsumer = new Writable({
    highWaterMark: 16 * 1024, // Small buffer to cause backpressure
    write(chunk, encoding, callback) {
      // Simulate slow processing
      setTimeout(callback, 1);
    }
  });

  pipeline(fastProducer, analyzer, slowConsumer, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 3 complete\n');
      example4();
    }
  });
}

// =============================================================================
// Example 4: CPU Profiling
// =============================================================================

class CPUProfiler extends Transform {
  constructor(options) {
    super(options);
    this.startUsage = process.cpuUsage();
    this.startTime = performance.now();
    this.samples = [];
    this.sampleInterval = 100;
    this.chunkCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.chunkCount++;

    if (this.chunkCount % this.sampleInterval === 0) {
      this.sampleCPU();
    }

    // Simulate CPU work
    const result = this.processChunk(chunk);

    callback(null, result);
  }

  processChunk(chunk) {
    // Simulate CPU-intensive work
    let hash = 0;
    for (let i = 0; i < chunk.length; i++) {
      hash = ((hash << 5) - hash) + chunk[i];
      hash = hash & hash;
    }
    return chunk;
  }

  sampleCPU() {
    const usage = process.cpuUsage(this.startUsage);
    const elapsed = performance.now() - this.startTime;

    this.samples.push({
      chunk: this.chunkCount,
      userCPU: usage.user,
      systemCPU: usage.system,
      elapsed: elapsed
    });
  }

  _flush(callback) {
    this.analyzeCPU();
    callback();
  }

  analyzeCPU() {
    if (this.samples.length === 0) return;

    const finalUsage = process.cpuUsage(this.startUsage);
    const elapsed = performance.now() - this.startTime;

    const userPercent = (finalUsage.user / (elapsed * 1000) * 100).toFixed(2);
    const systemPercent = (finalUsage.system / (elapsed * 1000) * 100).toFixed(2);
    const totalPercent = parseFloat(userPercent) + parseFloat(systemPercent);

    console.log('\n🖥️  CPU Profile:');
    console.log(`  Duration: ${elapsed.toFixed(2)}ms`);
    console.log(`  User CPU: ${userPercent}%`);
    console.log(`  System CPU: ${systemPercent}%`);
    console.log(`  Total CPU: ${totalPercent.toFixed(2)}%`);
    console.log(`  Chunks processed: ${this.chunkCount}`);

    if (totalPercent > 80) {
      console.log('\n  ⚠️  High CPU usage detected. Consider:');
      console.log('     - Offloading to worker threads');
      console.log('     - Optimizing algorithms');
      console.log('     - Reducing processing per chunk');
    } else {
      console.log('\n  ✓ CPU usage is reasonable');
    }
  }
}

function example4() {
  console.log('--- Example 4: CPU Profiling ---\n');

  const source = new Readable({
    read() {
      for (let i = 0; i < 500; i++) {
        if (!this.push(Buffer.alloc(1024))) {
          break;
        }
      }
      this.push(null);
    }
  });

  const profiler = new CPUProfiler();

  const destination = new Writable({
    write(chunk, encoding, callback) {
      callback();
    }
  });

  pipeline(source, profiler, destination, (err) => {
    if (err) {
      console.error('Pipeline error:', err);
    } else {
      console.log('\n✓ Example 4 complete\n');
      example5();
    }
  });
}

// =============================================================================
// Example 5: Comparative Benchmark
// =============================================================================

async function benchmark(name, streamFactory, iterations = 3) {
  console.log(`\nBenchmarking: ${name}`);

  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();

    await new Promise((resolve, reject) => {
      const stream = streamFactory();
      stream.on('end', resolve);
      stream.on('error', reject);
      stream.resume(); // Drain stream
    });

    const duration = performance.now() - start;
    times.push(duration);
    console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms`);
  }

  const avg = times.reduce((a, b) => a + b) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`  Average: ${avg.toFixed(2)}ms`);
  console.log(`  Min: ${min.toFixed(2)}ms`);
  console.log(`  Max: ${max.toFixed(2)}ms`);

  return { name, avg, min, max, times };
}

async function example5() {
  console.log('--- Example 5: Comparative Benchmark ---\n');

  // Benchmark different highWaterMark values
  const results = [];

  results.push(await benchmark('Small Buffer (1KB)', () => {
    return new Readable({
      highWaterMark: 1024,
      read() {
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024))) break;
        }
        this.push(null);
      }
    });
  }));

  results.push(await benchmark('Medium Buffer (64KB)', () => {
    return new Readable({
      highWaterMark: 64 * 1024,
      read() {
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024))) break;
        }
        this.push(null);
      }
    });
  }));

  results.push(await benchmark('Large Buffer (256KB)', () => {
    return new Readable({
      highWaterMark: 256 * 1024,
      read() {
        for (let i = 0; i < 1000; i++) {
          if (!this.push(Buffer.alloc(1024))) break;
        }
        this.push(null);
      }
    });
  }));

  // Compare results
  console.log('\n📊 Benchmark Comparison:');
  results.sort((a, b) => a.avg - b.avg);

  results.forEach((result, index) => {
    const diff = index === 0 ? '' : ` (+${((result.avg / results[0].avg - 1) * 100).toFixed(2)}%)`;
    console.log(`  ${index + 1}. ${result.name}: ${result.avg.toFixed(2)}ms${diff}`);
  });

  console.log('\n✓ Example 5 complete\n');
  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Performance Profiling Summary ===\n');
  console.log('Key Takeaways:');
  console.log('1. Monitor throughput, memory, CPU, and backpressure');
  console.log('2. High backpressure indicates consumer is slower than producer');
  console.log('3. Adjust highWaterMark based on performance measurements');
  console.log('4. Profile before optimizing - measure, don\'t guess');
  console.log('5. Compare different approaches with benchmarks');
  console.log('6. Watch for memory growth patterns');
  console.log('7. CPU usage > 80% suggests offloading to workers');
  console.log('\n✓ All profiling examples completed!\n');
}

// Start examples
example1();
