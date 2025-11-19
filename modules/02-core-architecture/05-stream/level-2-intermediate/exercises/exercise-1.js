/**
 * Exercise 1: Custom Number Generator Stream
 * ===========================================
 *
 * Difficulty: Medium
 *
 * Task:
 * Create a Readable stream that generates a sequence of numbers with the following features:
 * - Accepts start, end, and step parameters
 * - Handles backpressure properly
 * - Can be paused and resumed
 * - Emits a 'done' event with statistics when complete
 *
 * Requirements:
 * 1. Create a NumberGeneratorStream class extending Readable
 * 2. Constructor should accept (start, end, step, options)
 * 3. Generate numbers from start to end with the given step
 * 4. Track statistics: count, sum, min, max
 * 5. Emit 'done' event with statistics before 'end' event
 * 6. Handle backpressure (check push() return value)
 * 7. Support pause/resume
 *
 * Test your implementation:
 * - Generate numbers 1 to 100, step 1
 * - Generate numbers 0 to 100, step 5
 * - Generate numbers 10 to 1, step -1
 *
 * Run: node exercise-1.js
 */

const { Readable } = require('stream');

// TODO: Implement NumberGeneratorStream class
class NumberGeneratorStream extends Readable {
  constructor(start, end, step = 1, options) {
    super(options);

    // TODO: Initialize instance variables
    // - this.current
    // - this.end
    // - this.step
    // - this.stats (count, sum, min, max)
  }

  _read(size) {
    // TODO: Implement number generation
    // 1. Check if we've reached the end
    // 2. Generate the next number
    // 3. Update statistics
    // 4. Push the number as a string with newline
    // 5. Check push() return value for backpressure
    // 6. If done, emit 'done' event with stats, then push(null)
  }
}

// =============================================================================
// Test Cases
// =============================================================================

function test1() {
  console.log('Test 1: Numbers 1 to 10\n');

  const generator = new NumberGeneratorStream(1, 10);

  // TODO: Listen to 'data' event and log each number

  // TODO: Listen to 'done' event and log statistics

  // TODO: Listen to 'end' event and move to test2()
}

function test2() {
  console.log('\n\nTest 2: Even numbers 0 to 20 (step 2)\n');

  const generator = new NumberGeneratorStream(0, 20, 2);

  // TODO: Implement test case similar to test1
  // Then call test3()
}

function test3() {
  console.log('\n\nTest 3: Countdown 10 to 1 (step -1)\n');

  const generator = new NumberGeneratorStream(10, 1, -1);

  // TODO: Implement test case similar to test1
  // Then call test4()
}

function test4() {
  console.log('\n\nTest 4: Backpressure Test (large range)\n');

  const generator = new NumberGeneratorStream(1, 1000, 1, {
    highWaterMark: 16 // Small buffer to trigger backpressure
  });

  let count = 0;

  // TODO: Implement test that demonstrates backpressure handling
  // Log when backpressure occurs
  // Then show summary
}

// Start tests
test1();

// =============================================================================
// Expected Output Example:
// =============================================================================

/**
 * Test 1: Numbers 1 to 10
 *
 * 1
 * 2
 * 3
 * 4
 * 5
 * 6
 * 7
 * 8
 * 9
 * 10
 *
 * Statistics:
 *   Count: 10
 *   Sum: 55
 *   Min: 1
 *   Max: 10
 *   Average: 5.5
 *
 *
 * Test 2: Even numbers 0 to 20 (step 2)
 *
 * 0
 * 2
 * 4
 * ...
 * 20
 *
 * Statistics:
 *   Count: 11
 *   Sum: 110
 *   Min: 0
 *   Max: 20
 *   Average: 10
 *
 * ... etc
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Statistics tracking
 * Keep running totals:
 * - this.stats.count++
 * - this.stats.sum += number
 * - this.stats.min = Math.min(this.stats.min, number)
 * - this.stats.max = Math.max(this.stats.max, number)
 *
 * Hint 2: Handling different step directions
 * Check if step is positive or negative:
 * - if (step > 0): continue while current <= end
 * - if (step < 0): continue while current >= end
 *
 * Hint 3: Backpressure
 * const ok = this.push(data);
 * if (!ok) {
 *   // Buffer is full - _read() will be called again when ready
 *   return;
 * }
 *
 * Hint 4: 'done' event
 * Before push(null):
 * this.emit('done', {
 *   count: this.stats.count,
 *   sum: this.stats.sum,
 *   min: this.stats.min,
 *   max: this.stats.max,
 *   average: this.stats.sum / this.stats.count
 * });
 */
