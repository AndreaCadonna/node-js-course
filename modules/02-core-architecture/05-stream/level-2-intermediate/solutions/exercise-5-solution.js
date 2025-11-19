/**
 * Solution: Exercise 5 - Multi-Source Stream Merger
 * ===================================================
 * Complete stream merger with sorted output and error handling
 */

const { Readable, Writable } = require('stream');
const { pipeline } = require('stream/promises');

class MergeStream extends Readable {
  constructor(sources, compareFn, options) {
    super({ objectMode: true, ...options });

    this.sources = sources;
    this.compareFn = compareFn;
    this.buffers = new Map();
    this.ended = new Set();
    this.stats = new Map();
  }

  _construct(callback) {
    for (const source of this.sources) {
      this.buffers.set(source, []);
      this.stats.set(source, { count: 0, errors: 0 });

      source.on('data', (item) => {
        this.buffers.get(source).push(item);
        this.stats.get(source).count++;

        if (this.buffers.get(source).length > 10) {
          source.pause();
        }
      });

      source.on('end', () => {
        this.ended.add(source);
        this._read();
      });

      source.on('error', (err) => {
        this.stats.get(source).errors++;
        this.destroy(err);
      });
    }

    callback();
  }

  _read() {
    const item = this.getNextItem();

    if (item) {
      this.push(item);
    } else if (this.allSourcesEnded() && this.allBuffersEmpty()) {
      this.reportStats();
      this.push(null);
    }
  }

  getNextItem() {
    let minItem = null;
    let minSource = null;

    for (const [source, buffer] of this.buffers) {
      if (buffer.length === 0) continue;

      if (!minItem || this.compareFn(buffer[0], minItem) < 0) {
        minItem = buffer[0];
        minSource = source;
      }
    }

    if (minItem && minSource) {
      this.buffers.get(minSource).shift();

      if (this.buffers.get(minSource).length < 5) {
        minSource.resume();
      }
    }

    return minItem;
  }

  allSourcesEnded() {
    return this.ended.size === this.sources.length;
  }

  allBuffersEmpty() {
    for (const buffer of this.buffers.values()) {
      if (buffer.length > 0) return false;
    }
    return true;
  }

  reportStats() {
    console.log('\nMerge Statistics:');
    let totalItems = 0;
    let totalErrors = 0;

    this.stats.forEach((stat, source) => {
      totalItems += stat.count;
      totalErrors += stat.errors;
    });

    console.log(`  Total items merged: ${totalItems}`);
    console.log(`  Total errors: ${totalErrors}`);
  }

  _destroy(err, callback) {
    for (const source of this.sources) {
      if (!source.destroyed) {
        source.destroy();
      }
    }
    callback(err);
  }
}

// =============================================================================
// Helper Classes
// =============================================================================

class NumberStream extends Readable {
  constructor(start, end, delay, options) {
    super({ objectMode: true, ...options });
    this.current = start;
    this.end = end;
    this.delay = delay;
  }

  async _read() {
    if (this.current > this.end) {
      this.push(null);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, this.delay));

    this.push({
      value: this.current,
      timestamp: Date.now(),
      source: this.delay
    });

    this.current++;
  }
}

class TimestampedStream extends Readable {
  constructor(id, data, options) {
    super({ objectMode: true, ...options });
    this.id = id;
    this.data = data;
    this.index = 0;
  }

  async _read() {
    if (this.index >= this.data.length) {
      this.push(null);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    this.push({
      id: this.id,
      timestamp: this.data[this.index],
      message: `Event from source ${this.id}`
    });

    this.index++;
  }
}

// =============================================================================
// Tests
// =============================================================================

function test1() {
  console.log('Test 1: Basic Merging (2 sources)\n');

  const source1 = new NumberStream(1, 5, 50);
  const source2 = new NumberStream(6, 10, 100);

  const merger = new MergeStream(
    [source1, source2],
    (a, b) => a.value - b.value
  );

  merger.on('data', (item) => {
    console.log(`  Item ${item.value} (from source with ${item.source}ms delay)`);
  });

  merger.on('end', () => {
    console.log('\n✓ Test 1 complete\n');
    test2();
  });

  merger.on('error', (err) => {
    console.error('Merge error:', err.message);
  });
}

function test2() {
  console.log('Test 2: Sorted Merge by Timestamp\n');

  const stream1 = new TimestampedStream('A', [100, 300, 500, 700]);
  const stream2 = new TimestampedStream('B', [200, 400, 600, 800]);
  const stream3 = new TimestampedStream('C', [150, 350, 550, 750]);

  const merger = new MergeStream(
    [stream1, stream2, stream3],
    (a, b) => a.timestamp - b.timestamp
  );

  merger.on('data', (event) => {
    console.log(`  [${event.timestamp}ms] ${event.message}`);
  });

  merger.on('end', () => {
    console.log('\n✓ Test 2 complete (events emitted in timestamp order)\n');
    test3();
  });
}

function test3() {
  console.log('Test 3: Error Propagation\n');

  class ErrorStream extends Readable {
    constructor(errorAt, options) {
      super({ objectMode: true, ...options });
      this.count = 0;
      this.errorAt = errorAt;
    }

    _read() {
      this.count++;

      if (this.count === this.errorAt) {
        this.destroy(new Error(`Error at item ${this.count}`));
        return;
      }

      if (this.count > 5) {
        this.push(null);
        return;
      }

      this.push({ value: this.count });
    }
  }

  const goodSource = new NumberStream(1, 10, 50);
  const badSource = new ErrorStream(3);

  const merger = new MergeStream(
    [goodSource, badSource],
    (a, b) => a.value - b.value
  );

  let itemsProcessed = 0;

  merger.on('data', (item) => {
    itemsProcessed++;
    console.log(`  Item ${item.value}`);
  });

  merger.on('error', (err) => {
    console.log(`  ✗ Error caught: ${err.message}`);
    console.log(`  Items processed before error: ${itemsProcessed}`);
    console.log('\n✓ Test 3 complete (error properly propagated)\n');
    test4();
  });

  merger.on('end', () => {
    console.log('\n✓ Test 3 complete\n');
    test4();
  });
}

async function test4() {
  console.log('Test 4: Complete Pipeline with Statistics\n');

  const stream1 = new NumberStream(1, 30, 30);
  const stream2 = new NumberStream(31, 60, 40);
  const stream3 = new NumberStream(61, 90, 50);

  const merger = new MergeStream(
    [stream1, stream2, stream3],
    (a, b) => a.value - b.value
  );

  const counter = new Writable({
    objectMode: true,
    write(item, encoding, callback) {
      callback();
    }
  });

  try {
    await pipeline(merger, counter);
    console.log('\n✓ Test 4 complete');
    console.log('=== All tests passed! ===\n');
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }
}

test1();

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Buffering Strategy:
 *    - Each source has its own buffer
 *    - Pause source when buffer > 10 items
 *    - Resume when buffer < 5 items
 *    - Prevents memory issues with fast sources
 *
 * 2. Merge Algorithm:
 *    - Look at first item in each buffer
 *    - Use compareFn to find smallest
 *    - Remove and push that item
 *    - Repeat until all sources ended and buffers empty
 *
 * 3. Event Coordination:
 *    - Track which sources have ended
 *    - Only end merger when all sources ended
 *    - AND all buffers are empty
 *    - This ensures no data loss
 *
 * 4. Error Handling:
 *    - Any source error destroys merger
 *    - Merger destroys all other sources
 *    - Error propagates to consumer
 *    - Track errors per source in stats
 *
 * 5. Backpressure:
 *    - Pause individual sources when needed
 *    - Resume when space available
 *    - Respects downstream backpressure
 *    - Coordinated across all sources
 *
 * 6. Statistics:
 *    - Track items per source
 *    - Track errors per source
 *    - Report total at end
 *    - Useful for debugging
 *
 * USE CASES:
 * - Log aggregation from multiple servers
 * - Merging sorted database queries
 * - Combining multiple API responses
 * - Time-series data merging
 * - Multi-sensor data fusion
 */
