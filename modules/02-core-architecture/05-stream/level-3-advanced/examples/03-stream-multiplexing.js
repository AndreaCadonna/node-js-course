/**
 * 03-stream-multiplexing.js
 * ==========================
 * Demonstrates multiplexing and demultiplexing patterns
 *
 * Key Concepts:
 * - Combining multiple streams into one (multiplexing)
 * - Splitting one stream into multiple (demultiplexing)
 * - Tagged stream data
 * - Synchronization
 * - Priority-based multiplexing
 *
 * Run: node 03-stream-multiplexing.js
 */

const { Transform, PassThrough, Readable, Writable, pipeline } = require('stream');

console.log('=== Stream Multiplexing and Demultiplexing ===\n');

// =============================================================================
// Example 1: Basic Multiplexer
// =============================================================================

class Multiplexer extends PassThrough {
  constructor(options) {
    super(options);
    this.sources = [];
    this.activeSources = 0;
    this.sourceId = 0;
  }

  addSource(stream, name) {
    const id = this.sourceId++;
    this.sources.push({ id, name, stream });
    this.activeSources++;

    console.log(`  📥 Added source: ${name} (ID: ${id})`);

    stream.on('data', (chunk) => {
      // Tag data with source ID
      const tagged = {
        sourceId: id,
        sourceName: name,
        data: chunk.toString(),
        timestamp: Date.now()
      };

      this.write(JSON.stringify(tagged) + '\n');
    });

    stream.on('end', () => {
      console.log(`  ✓ Source ${name} ended`);
      this.activeSources--;

      if (this.activeSources === 0) {
        console.log('  🏁 All sources complete - ending multiplexer');
        this.end();
      }
    });

    stream.on('error', (err) => {
      console.error(`  ❌ Source ${name} error:`, err.message);
      this.destroy(err);
    });

    return this;
  }
}

function example1() {
  console.log('--- Example 1: Basic Multiplexer ---\n');

  const mux = new Multiplexer();

  // Create multiple source streams
  const stream1 = Readable.from(['A1', 'A2', 'A3']);
  const stream2 = Readable.from(['B1', 'B2', 'B3']);
  const stream3 = Readable.from(['C1', 'C2', 'C3']);

  mux.addSource(stream1, 'Stream-A');
  mux.addSource(stream2, 'Stream-B');
  mux.addSource(stream3, 'Stream-C');

  console.log('\nMultiplexed output:');

  mux.on('data', (chunk) => {
    const message = JSON.parse(chunk);
    console.log(`  [${message.sourceName}] ${message.data}`);
  });

  mux.on('end', () => {
    console.log('\n✓ Example 1 complete\n');
    example2();
  });
}

// =============================================================================
// Example 2: Demultiplexer
// =============================================================================

class Demultiplexer extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.outputs = new Map();
  }

  getOutputStream(id, name) {
    if (!this.outputs.has(id)) {
      const stream = new PassThrough({ objectMode: true });
      this.outputs.set(id, { stream, name });
      console.log(`  📤 Created output stream for: ${name} (ID: ${id})`);
    }
    return this.outputs.get(id).stream;
  }

  _transform(chunk, encoding, callback) {
    try {
      const message = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;

      const output = this.getOutputStream(message.sourceId, message.sourceName);
      output.write(message.data);

      callback();
    } catch (err) {
      callback(err);
    }
  }

  _flush(callback) {
    console.log('\n  🏁 Demultiplexer ending all output streams');

    // End all output streams
    for (const { stream, name } of this.outputs.values()) {
      stream.end();
    }

    callback();
  }
}

function example2() {
  console.log('--- Example 2: Multiplexing → Demultiplexing ---\n');

  // Multiplex
  const mux = new Multiplexer();

  const stream1 = Readable.from(['X1', 'X2', 'X3']);
  const stream2 = Readable.from(['Y1', 'Y2', 'Y3']);
  const stream3 = Readable.from(['Z1', 'Z2', 'Z3']);

  mux.addSource(stream1, 'Stream-X');
  mux.addSource(stream2, 'Stream-Y');
  mux.addSource(stream3, 'Stream-Z');

  // Demultiplex
  const demux = new Demultiplexer();

  mux.pipe(demux);

  // Get output streams
  const outputX = demux.getOutputStream(0, 'Stream-X');
  const outputY = demux.getOutputStream(1, 'Stream-Y');
  const outputZ = demux.getOutputStream(2, 'Stream-Z');

  console.log('\nDemultiplexed outputs:\n');

  let completedStreams = 0;
  const checkComplete = () => {
    completedStreams++;
    if (completedStreams === 3) {
      console.log('\n✓ Example 2 complete\n');
      example3();
    }
  };

  outputX.on('data', (data) => console.log(`  [X] ${data}`));
  outputX.on('end', () => {
    console.log('  Stream X complete');
    checkComplete();
  });

  outputY.on('data', (data) => console.log(`  [Y] ${data}`));
  outputY.on('end', () => {
    console.log('  Stream Y complete');
    checkComplete();
  });

  outputZ.on('data', (data) => console.log(`  [Z] ${data}`));
  outputZ.on('end', () => {
    console.log('  Stream Z complete');
    checkComplete();
  });
}

// =============================================================================
// Example 3: Priority-Based Multiplexer
// =============================================================================

class PriorityMultiplexer extends PassThrough {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.queues = new Map(); // priority -> queue
    this.activeSources = 0;
    this.sourceId = 0;
    this.processing = false;
  }

  addSource(stream, name, priority = 0) {
    const id = this.sourceId++;
    this.activeSources++;

    console.log(`  📥 Added source: ${name} (Priority: ${priority})`);

    stream.on('data', (chunk) => {
      this.enqueue({
        sourceId: id,
        sourceName: name,
        priority,
        data: chunk.toString()
      });

      this.processQueues();
    });

    stream.on('end', () => {
      this.activeSources--;
      this.processQueues();
    });

    return this;
  }

  enqueue(message) {
    const priority = message.priority;

    if (!this.queues.has(priority)) {
      this.queues.set(priority, []);
    }

    this.queues.get(priority).push(message);
  }

  processQueues() {
    if (this.processing) return;

    this.processing = true;

    // Process highest priority first
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority);

      while (queue.length > 0) {
        const message = queue.shift();

        if (!this.write(message)) {
          // Backpressure - pause
          this.processing = false;
          return;
        }
      }
    }

    this.processing = false;

    // Check if all sources done
    if (this.activeSources === 0 && this.allQueuesEmpty()) {
      this.end();
    }
  }

  allQueuesEmpty() {
    for (const queue of this.queues.values()) {
      if (queue.length > 0) return false;
    }
    return true;
  }
}

function example3() {
  console.log('--- Example 3: Priority-Based Multiplexing ---\n');

  const mux = new PriorityMultiplexer();

  const highPriority = Readable.from(['HIGH-1', 'HIGH-2', 'HIGH-3']);
  const mediumPriority = Readable.from(['MED-1', 'MED-2', 'MED-3']);
  const lowPriority = Readable.from(['LOW-1', 'LOW-2', 'LOW-3']);

  mux.addSource(lowPriority, 'Low Priority', 0);
  mux.addSource(mediumPriority, 'Medium Priority', 5);
  mux.addSource(highPriority, 'High Priority', 10);

  console.log('\nPriority-ordered output:');

  mux.on('data', (message) => {
    console.log(`  [P${message.priority}] ${message.sourceName}: ${message.data}`);
  });

  mux.on('end', () => {
    console.log('\n✓ Example 3 complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Round-Robin Multiplexer
// =============================================================================

class RoundRobinMultiplexer extends PassThrough {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.sources = [];
    this.queues = new Map();
    this.currentIndex = 0;
    this.activeSources = 0;
    this.sourceId = 0;
  }

  addSource(stream, name) {
    const id = this.sourceId++;
    this.sources.push({ id, name });
    this.queues.set(id, []);
    this.activeSources++;

    console.log(`  📥 Added source: ${name}`);

    stream.on('data', (chunk) => {
      this.queues.get(id).push(chunk.toString());
      this.emitRoundRobin();
    });

    stream.on('end', () => {
      this.activeSources--;

      if (this.activeSources === 0) {
        this.drainQueues();
      }
    });

    return this;
  }

  emitRoundRobin() {
    // Emit one item from each source in round-robin fashion
    const source = this.sources[this.currentIndex];
    const queue = this.queues.get(source.id);

    if (queue.length > 0) {
      const data = queue.shift();
      this.write({
        sourceId: source.id,
        sourceName: source.name,
        data
      });
    }

    this.currentIndex = (this.currentIndex + 1) % this.sources.length;
  }

  drainQueues() {
    // Emit all remaining items
    for (const source of this.sources) {
      const queue = this.queues.get(source.id);

      while (queue.length > 0) {
        const data = queue.shift();
        this.write({
          sourceId: source.id,
          sourceName: source.name,
          data
        });
      }
    }

    this.end();
  }
}

function example4() {
  console.log('--- Example 4: Round-Robin Multiplexing ---\n');

  const mux = new RoundRobinMultiplexer();

  const stream1 = Readable.from(['A1', 'A2', 'A3', 'A4']);
  const stream2 = Readable.from(['B1', 'B2', 'B3']);
  const stream3 = Readable.from(['C1', 'C2']);

  mux.addSource(stream1, 'Stream-A');
  mux.addSource(stream2, 'Stream-B');
  mux.addSource(stream3, 'Stream-C');

  console.log('\nRound-robin output:');

  mux.on('data', (message) => {
    console.log(`  [${message.sourceName}] ${message.data}`);
  });

  mux.on('end', () => {
    console.log('\n✓ Example 4 complete\n');
    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Multiplexing Summary ===\n');
  console.log('Multiplexing Patterns:');
  console.log('1. Basic - Combine multiple streams, tag with source ID');
  console.log('2. Demultiplexing - Split tagged stream back to originals');
  console.log('3. Priority-based - Process high-priority items first');
  console.log('4. Round-robin - Fair distribution from all sources');
  console.log('\nUse Cases:');
  console.log('- Combining logs from multiple servers');
  console.log('- Merging data from multiple APIs');
  console.log('- Load balancing across workers');
  console.log('- Priority queuing systems');
  console.log('\n✓ All multiplexing examples completed!\n');
}

// Start examples
example1();
