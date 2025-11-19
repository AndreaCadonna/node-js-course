/**
 * 04-fan-out-fan-in.js
 * ====================
 * Demonstrates fan-out and fan-in patterns for parallel processing
 *
 * Key Concepts:
 * - Broadcasting to multiple destinations (fan-out)
 * - Merging from multiple sources (fan-in)
 * - Parallel processing
 * - Load balancing
 * - Results aggregation
 *
 * Run: node 04-fan-out-fan-in.js
 */

const { Transform, PassThrough, Readable, Writable, pipeline } = require('stream');

console.log('=== Fan-Out and Fan-In Patterns ===\n');

// =============================================================================
// Example 1: Basic Fan-Out
// =============================================================================

class FanOut extends PassThrough {
  constructor(options) {
    super(options);
    this.destinations = [];
  }

  addDestination(stream, name) {
    this.destinations.push({ stream, name });
    console.log(`  📤 Added destination: ${name}`);

    stream.on('error', (err) => {
      console.error(`  ❌ Destination ${name} error:`, err.message);
    });

    return this;
  }

  _write(chunk, encoding, callback) {
    let pending = this.destinations.length;

    if (pending === 0) {
      callback();
      return;
    }

    let callbackCalled = false;

    this.destinations.forEach(({ stream, name }) => {
      stream.write(chunk, encoding, (err) => {
        if (err && !callbackCalled) {
          callbackCalled = true;
          callback(err);
          return;
        }

        pending--;

        if (pending === 0 && !callbackCalled) {
          callback();
        }
      });
    });
  }

  _final(callback) {
    console.log('\n  🏁 Fan-out ending all destinations');

    this.destinations.forEach(({ stream }) => stream.end());
    callback();
  }
}

function example1() {
  console.log('--- Example 1: Basic Fan-Out ---\n');

  const fanOut = new FanOut();

  // Create multiple destination streams
  const dest1 = new Writable({
    write(chunk, encoding, callback) {
      console.log(`  [Dest-1] ${chunk.toString().trim()}`);
      callback();
    }
  });

  const dest2 = new Writable({
    write(chunk, encoding, callback) {
      console.log(`  [Dest-2] ${chunk.toString().trim()}`);
      callback();
    }
  });

  const dest3 = new Writable({
    write(chunk, encoding, callback) {
      console.log(`  [Dest-3] ${chunk.toString().trim()}`);
      callback();
    }
  });

  fanOut.addDestination(dest1, 'Destination-1');
  fanOut.addDestination(dest2, 'Destination-2');
  fanOut.addDestination(dest3, 'Destination-3');

  const source = Readable.from(['Item 1\n', 'Item 2\n', 'Item 3\n']);

  console.log('\nFan-out output (same data to all):\n');

  source.pipe(fanOut);

  dest1.on('finish', () => {
    console.log('\n✓ Example 1 complete\n');
    example2();
  });
}

// =============================================================================
// Example 2: Basic Fan-In
// =============================================================================

class FanIn extends PassThrough {
  constructor(options) {
    super(options);
    this.sources = [];
    this.activeSources = 0;
    this.ended = false;
  }

  addSource(stream, name) {
    this.sources.push({ stream, name });
    this.activeSources++;

    console.log(`  📥 Added source: ${name}`);

    stream.on('data', (chunk) => {
      if (!this.ended) {
        this.write(chunk);
      }
    });

    stream.on('end', () => {
      console.log(`  ✓ Source ${name} ended`);
      this.activeSources--;
      this.checkIfDone();
    });

    stream.on('error', (err) => {
      console.error(`  ❌ Source ${name} error:`, err.message);
      this.destroy(err);
    });

    return this;
  }

  checkIfDone() {
    if (this.activeSources === 0 && !this.ended) {
      console.log('\n  🏁 All sources complete - ending fan-in');
      this.ended = true;
      this.end();
    }
  }
}

function example2() {
  console.log('--- Example 2: Basic Fan-In ---\n');

  const fanIn = new FanIn();

  const source1 = Readable.from(['A1\n', 'A2\n', 'A3\n']);
  const source2 = Readable.from(['B1\n', 'B2\n', 'B3\n']);
  const source3 = Readable.from(['C1\n', 'C2\n', 'C3\n']);

  fanIn.addSource(source1, 'Source-A');
  fanIn.addSource(source2, 'Source-B');
  fanIn.addSource(source3, 'Source-C');

  console.log('\nFan-in output (merged from all):\n');

  fanIn.on('data', (chunk) => {
    console.log(`  ${chunk.toString().trim()}`);
  });

  fanIn.on('end', () => {
    console.log('\n✓ Example 2 complete\n');
    example3();
  });
}

// =============================================================================
// Example 3: Parallel Processing (Fan-Out + Process + Fan-In)
// =============================================================================

class Worker extends Transform {
  constructor(id, delay, options) {
    super({ objectMode: true, ...options });
    this.id = id;
    this.delay = delay;
    this.processed = 0;
  }

  async _transform(item, encoding, callback) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, this.delay));

    this.processed++;

    const result = {
      ...item,
      workerId: this.id,
      processedAt: Date.now()
    };

    console.log(`  [Worker ${this.id}] Processed item ${item.id}`);

    callback(null, result);
  }

  _flush(callback) {
    console.log(`  ✓ Worker ${this.id} completed ${this.processed} items`);
    callback();
  }
}

function example3() {
  console.log('--- Example 3: Parallel Processing with Workers ---\n');

  const numWorkers = 3;
  const workers = [];
  const fanIn = new FanIn();

  // Create workers
  for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(i + 1, 50); // 50ms processing time
    workers.push(worker);

    // Connect worker output to fan-in
    fanIn.addSource(worker, `Worker-${i + 1}`);
  }

  console.log('\nProcessing items in parallel:\n');

  // Create source data
  const items = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, data: `Item ${i + 1}` }));
  const source = Readable.from(items);

  // Distribute to workers round-robin
  let workerIndex = 0;

  source.on('data', (item) => {
    const worker = workers[workerIndex];
    worker.write(item);

    workerIndex = (workerIndex + 1) % numWorkers;
  });

  source.on('end', () => {
    workers.forEach(w => w.end());
  });

  // Collect results
  const results = [];

  fanIn.on('data', (result) => {
    results.push(result);
  });

  fanIn.on('end', () => {
    console.log(`\n📊 Results: Processed ${results.length} items`);

    // Analyze distribution
    const distribution = {};
    results.forEach(r => {
      distribution[r.workerId] = (distribution[r.workerId] || 0) + 1;
    });

    console.log('\nWork distribution:');
    Object.entries(distribution).forEach(([worker, count]) => {
      console.log(`  Worker ${worker}: ${count} items`);
    });

    console.log('\n✓ Example 3 complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Conditional Fan-Out (Router)
// =============================================================================

class Router extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.routes = new Map();
  }

  addRoute(predicate, destination, name) {
    this.routes.set(predicate, { destination, name });
    console.log(`  🛣️  Added route: ${name}`);
    return this;
  }

  _transform(item, encoding, callback) {
    let routed = false;

    for (const [predicate, { destination, name }] of this.routes) {
      if (predicate(item)) {
        console.log(`  → Item ${item.id} routed to ${name}`);
        destination.write(item);
        routed = true;
        break; // Route to first match only
      }
    }

    if (!routed) {
      console.log(`  ⚠️  Item ${item.id} not routed (no matching route)`);
    }

    callback();
  }

  _flush(callback) {
    // End all destinations
    for (const { destination } of this.routes.values()) {
      destination.end();
    }
    callback();
  }
}

function example4() {
  console.log('--- Example 4: Conditional Fan-Out (Router) ---\n');

  const router = new Router();

  // Create destination streams
  const evenStream = new PassThrough({ objectMode: true });
  const oddStream = new PassThrough({ objectMode: true });
  const largeStream = new PassThrough({ objectMode: true });

  router
    .addRoute((item) => item.value > 50, largeStream, 'Large Values')
    .addRoute((item) => item.value % 2 === 0, evenStream, 'Even Values')
    .addRoute((item) => item.value % 2 === 1, oddStream, 'Odd Values');

  // Listen to destinations
  evenStream.on('data', (item) => {
    console.log(`  [Even] Item ${item.id}: value=${item.value}`);
  });

  oddStream.on('data', (item) => {
    console.log(`  [Odd] Item ${item.id}: value=${item.value}`);
  });

  largeStream.on('data', (item) => {
    console.log(`  [Large] Item ${item.id}: value=${item.value}`);
  });

  // Create test data
  const items = [
    { id: 1, value: 10 },
    { id: 2, value: 15 },
    { id: 3, value: 60 },
    { id: 4, value: 25 },
    { id: 5, value: 80 },
    { id: 6, value: 30 }
  ];

  const source = Readable.from(items);

  console.log('\nRouting based on conditions:\n');

  source.pipe(router);

  evenStream.on('end', () => {
    console.log('\n✓ Example 4 complete\n');
    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Fan-Out/Fan-In Summary ===\n');
  console.log('Patterns:');
  console.log('1. Fan-Out - Broadcast same data to multiple destinations');
  console.log('2. Fan-In - Merge data from multiple sources');
  console.log('3. Parallel Processing - Fan-out → Process → Fan-in');
  console.log('4. Routing - Conditional fan-out based on data');
  console.log('\nUse Cases:');
  console.log('- Parallel processing with multiple workers');
  console.log('- Load balancing across processors');
  console.log('- Duplicate data to multiple destinations');
  console.log('- Aggregate results from distributed processing');
  console.log('- Route data based on content or rules');
  console.log('\nBest Practices:');
  console.log('- Handle backpressure from slowest destination');
  console.log('- Monitor work distribution across workers');
  console.log('- Clean up resources when streams end');
  console.log('- Handle errors in all branches');
  console.log('\n✓ All fan-out/fan-in examples completed!\n');
}

// Start examples
example1();
