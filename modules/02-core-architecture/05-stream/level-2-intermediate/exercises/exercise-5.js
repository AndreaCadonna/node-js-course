/**
 * Exercise 5: Multi-Source Stream Merger
 * =======================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Create a system that reads from multiple sources, merges streams in sorted order,
 * handles different data rates, propagates errors, and closes when all sources complete.
 *
 * Requirements:
 * 1. Create a MergeStream class (Readable) that merges multiple sources
 * 2. Merge streams in sorted order (by timestamp or id)
 * 3. Handle different data rates (some fast, some slow)
 * 4. Propagate errors from any source
 * 5. End when ALL sources have ended
 * 6. Handle backpressure properly
 * 7. Track statistics from each source
 *
 * Run: node exercise-5.js
 */

const { Readable, Writable } = require('stream');

// =============================================================================
// TODO: Implement MergeStream class
// =============================================================================

class MergeStream extends Readable {
  constructor(sources, compareFn, options) {
    // TODO: Call super with object mode
    super({ objectMode: true, ...options });

    // TODO: Initialize instance variables
    // - this.sources (array of readable streams)
    // - this.compareFn (function to compare items for sorting)
    // - this.buffers (Map: source -> array of buffered items)
    // - this.ended (Set of sources that have ended)
    // - this.stats (Map: source -> { count, errors })
  }

  _construct(callback) {
    // TODO: Set up event listeners for each source
    // 1. 'data' event: buffer incoming data
    // 2. 'end' event: mark source as ended
    // 3. 'error' event: propagate error and destroy
    callback();
  }

  _read() {
    // TODO: Implement merge logic
    // 1. Find next item across all sources (using compareFn)
    // 2. Push that item
    // 3. If item's source needs more data, pause it
    // 4. If all sources ended and buffers empty, push null
  }

  getNextItem() {
    // TODO: Find next item in sorted order
    // 1. Look at buffered items from all sources
    // 2. Use compareFn to find smallest/earliest
    // 3. Remove and return that item
    // 4. Return null if no items available
  }

  allSourcesEnded() {
    // TODO: Check if all sources have ended
  }

  allBuffersEmpty() {
    // TODO: Check if all buffers are empty
  }

  _destroy(err, callback) {
    // TODO: Clean up: destroy all source streams
    callback(err);
  }
}

// =============================================================================
// Helper: Create test data source
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

    // Simulate different speeds
    await new Promise(resolve => setTimeout(resolve, this.delay));

    this.push({
      value: this.current,
      timestamp: Date.now(),
      source: this.delay // Identify source by delay
    });

    this.current++;
  }
}

// =============================================================================
// Test Cases
// =============================================================================

function test1() {
  console.log('Test 1: Basic Merging (2 sources)\n');

  // Two sources with different speeds
  const source1 = new NumberStream(1, 5, 50); // Fast: 1,2,3,4,5
  const source2 = new NumberStream(6, 10, 100); // Slow: 6,7,8,9,10

  const merger = new MergeStream(
    [source1, source2],
    (a, b) => a.value - b.value // Sort by value
  );

  // TODO: Listen to 'data' event
  // TODO: Log items showing which source they came from
  // TODO: Verify merged output

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

  // Create sources that emit in different orders
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

  // Sources emit events at different timestamps
  const stream1 = new TimestampedStream('A', [100, 300, 500, 700]);
  const stream2 = new TimestampedStream('B', [200, 400, 600, 800]);
  const stream3 = new TimestampedStream('C', [150, 350, 550, 750]);

  const merger = new MergeStream(
    [stream1, stream2, stream3],
    (a, b) => a.timestamp - b.timestamp // Sort by timestamp
  );

  // TODO: Implement test
  // TODO: Verify events are emitted in timestamp order
  // TODO: Handle all 3 sources

  // Then call test3()
}

function test3() {
  console.log('\nTest 3: Error Propagation\n');

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
  const badSource = new ErrorStream(3); // Errors at item 3

  const merger = new MergeStream(
    [goodSource, badSource],
    (a, b) => a.value - b.value
  );

  // TODO: Implement test
  // TODO: Verify error is propagated from badSource
  // TODO: Verify merger stops processing

  // Then call test4()
}

function test4() {
  console.log('\nTest 4: Complete Pipeline with Statistics\n');

  // TODO: Create merger with multiple sources
  // TODO: Pipe to transform that processes data
  // TODO: Pipe to writable that counts items
  // TODO: Track statistics for each source
  // TODO: Report final statistics

  // Then show summary
}

// Start tests
test1();

// =============================================================================
// Expected Output Example:
// =============================================================================

/**
 * Test 1: Basic Merging (2 sources)
 *
 * Item 1 (from source 50)
 * Item 2 (from source 50)
 * Item 3 (from source 50)
 * Item 4 (from source 50)
 * Item 5 (from source 50)
 * Item 6 (from source 100)
 * Item 7 (from source 100)
 * Item 8 (from source 100)
 * Item 9 (from source 100)
 * Item 10 (from source 100)
 *
 * ✓ Test 1 complete
 *
 *
 * Test 2: Sorted Merge by Timestamp
 *
 * [100ms] Event from source A
 * [150ms] Event from source C
 * [200ms] Event from source B
 * [300ms] Event from source A
 * [350ms] Event from source C
 * [400ms] Event from source B
 * ... (in timestamp order)
 *
 * ✓ Test 2 complete
 *
 *
 * Test 3: Error Propagation
 *
 * Item 1 (from good source)
 * Item 2 (from bad source)
 * ✗ Error: Error at item 3
 * Merger destroyed
 *
 * ✓ Test 3 complete
 *
 *
 * Test 4: Complete Pipeline with Statistics
 *
 * ... processing ...
 *
 * Statistics:
 *   Source 1: 100 items
 *   Source 2: 100 items
 *   Source 3: 100 items
 *   Total: 300 items
 *   Errors: 0
 *
 * ✓ Test 4 complete
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Buffering data from sources
 * Set up listeners in _construct:
 *
 * for (const source of this.sources) {
 *   this.buffers.set(source, []);
 *
 *   source.on('data', (item) => {
 *     this.buffers.get(source).push(item);
 *     // Pause source if buffer too large
 *     if (this.buffers.get(source).length > 10) {
 *       source.pause();
 *     }
 *   });
 *
 *   source.on('end', () => {
 *     this.ended.add(source);
 *   });
 *
 *   source.on('error', (err) => {
 *     this.destroy(err);
 *   });
 * }
 *
 * Hint 2: Finding next item in sorted order
 * getNextItem() {
 *   let minItem = null;
 *   let minSource = null;
 *
 *   for (const [source, buffer] of this.buffers) {
 *     if (buffer.length === 0) continue;
 *
 *     if (!minItem || this.compareFn(buffer[0], minItem) < 0) {
 *       minItem = buffer[0];
 *       minSource = source;
 *     }
 *   }
 *
 *   if (minItem) {
 *     this.buffers.get(minSource).shift();
 *     minSource.resume(); // Resume reading
 *   }
 *
 *   return minItem;
 * }
 *
 * Hint 3: _read implementation
 * _read() {
 *   const item = this.getNextItem();
 *
 *   if (item) {
 *     this.push(item);
 *   } else if (this.allSourcesEnded() && this.allBuffersEmpty()) {
 *     this.push(null);
 *   }
 * }
 *
 * Hint 4: Checking all sources ended
 * allSourcesEnded() {
 *   return this.ended.size === this.sources.length;
 * }
 *
 * Hint 5: Error handling
 * When any source errors, destroy the merger:
 * source.on('error', (err) => {
 *   this.destroy(err);
 * });
 *
 * Hint 6: Cleanup
 * _destroy(err, callback) {
 *   for (const source of this.sources) {
 *     if (!source.destroyed) {
 *       source.destroy();
 *     }
 *   }
 *   callback(err);
 * }
 */

function showSummary() {
  console.log('\n=== Summary ===\n');
  console.log('Multi-source merging patterns:');
  console.log('1. Buffer data from each source independently');
  console.log('2. Use compareFn to find next item in order');
  console.log('3. Pause sources when buffers are full');
  console.log('4. Resume sources when buffers drain');
  console.log('5. Propagate errors from any source');
  console.log('6. End when all sources end and buffers empty');
  console.log('\nUse cases:');
  console.log('• Log aggregation from multiple servers');
  console.log('• Merging sorted database queries');
  console.log('• Combining multiple API responses');
  console.log('• Time-series data merging');
  console.log('\n✓ All tests complete!\n');
}
