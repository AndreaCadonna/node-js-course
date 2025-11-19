/**
 * Solution: Exercise 1 - Custom Number Generator Stream
 * ======================================================
 *
 * This solution demonstrates:
 * - Creating a custom Readable stream
 * - Implementing _read() method
 * - Tracking statistics
 * - Handling backpressure
 * - Emitting custom events
 */

const { Readable } = require('stream');

class NumberGeneratorStream extends Readable {
  constructor(start, end, step = 1, options) {
    super(options);

    this.current = start;
    this.end = end;
    this.step = step;

    // Initialize statistics
    this.stats = {
      count: 0,
      sum: 0,
      min: start,
      max: start
    };
  }

  _read(size) {
    // Determine if we should continue based on step direction
    const shouldContinue = this.step > 0
      ? this.current <= this.end
      : this.current >= this.end;

    if (shouldContinue) {
      // Generate the next number
      const number = this.current;

      // Update statistics
      this.stats.count++;
      this.stats.sum += number;
      this.stats.min = Math.min(this.stats.min, number);
      this.stats.max = Math.max(this.stats.max, number);

      // Push the number as a string with newline
      const data = `${number}\n`;
      const canContinue = this.push(data);

      // Move to next number
      this.current += this.step;

      if (!canContinue) {
        // Backpressure - stream will call _read() again when ready
        return;
      }
    } else {
      // Emit 'done' event with statistics before ending
      this.emit('done', {
        ...this.stats,
        average: this.stats.count > 0 ? this.stats.sum / this.stats.count : 0
      });

      // Signal end of stream
      this.push(null);
    }
  }
}

// =============================================================================
// Test Cases
// =============================================================================

function test1() {
  console.log('Test 1: Numbers 1 to 10\n');

  const generator = new NumberGeneratorStream(1, 10);

  generator.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });

  generator.on('done', (stats) => {
    console.log('\nStatistics:');
    console.log(`  Count: ${stats.count}`);
    console.log(`  Sum: ${stats.sum}`);
    console.log(`  Min: ${stats.min}`);
    console.log(`  Max: ${stats.max}`);
    console.log(`  Average: ${stats.average}`);
  });

  generator.on('end', () => {
    console.log('\n✓ Test 1 complete\n');
    test2();
  });
}

function test2() {
  console.log('Test 2: Even numbers 0 to 20 (step 2)\n');

  const generator = new NumberGeneratorStream(0, 20, 2);

  generator.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });

  generator.on('done', (stats) => {
    console.log('\nStatistics:');
    console.log(`  Count: ${stats.count}`);
    console.log(`  Sum: ${stats.sum}`);
    console.log(`  Min: ${stats.min}`);
    console.log(`  Max: ${stats.max}`);
    console.log(`  Average: ${stats.average}`);
  });

  generator.on('end', () => {
    console.log('\n✓ Test 2 complete\n');
    test3();
  });
}

function test3() {
  console.log('Test 3: Countdown 10 to 1 (step -1)\n');

  const generator = new NumberGeneratorStream(10, 1, -1);

  generator.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });

  generator.on('done', (stats) => {
    console.log('\nStatistics:');
    console.log(`  Count: ${stats.count}`);
    console.log(`  Sum: ${stats.sum}`);
    console.log(`  Min: ${stats.min}`);
    console.log(`  Max: ${stats.max}`);
    console.log(`  Average: ${stats.average}`);
  });

  generator.on('end', () => {
    console.log('\n✓ Test 3 complete\n');
    test4();
  });
}

function test4() {
  console.log('Test 4: Backpressure Test (large range)\n');

  const generator = new NumberGeneratorStream(1, 1000, 1, {
    highWaterMark: 16 // Small buffer to trigger backpressure
  });

  let count = 0;
  let backpressureTriggered = false;

  const originalRead = generator._read.bind(generator);
  generator._read = function(size) {
    const result = originalRead(size);
    if (result === undefined && this.current <= this.end) {
      if (!backpressureTriggered) {
        console.log(`  Backpressure triggered at number ${this.current - this.step}`);
        backpressureTriggered = true;
      }
    }
    return result;
  };

  generator.on('data', () => {
    count++;
  });

  generator.on('done', (stats) => {
    console.log(`\n  Generated ${count} numbers`);
    console.log(`  Backpressure was ${backpressureTriggered ? '' : 'NOT '}triggered`);
    console.log(`  Sum: ${stats.sum}`);
  });

  generator.on('end', () => {
    console.log('\n✓ All tests complete!\n');
    showSummary();
  });
}

function showSummary() {
  console.log('=== Key Learning Points ===\n');
  console.log('1. _read() is called when stream needs data');
  console.log('2. push() returns false when buffer is full (backpressure)');
  console.log('3. push(null) signals end of stream');
  console.log('4. Custom events can provide metadata');
  console.log('5. Support both positive and negative steps');
  console.log('\n✓ Solution demonstrates all requirements!\n');
}

// Run tests
test1();

/**
 * EXPLANATION:
 *
 * 1. Constructor:
 *    - Initialize current position, end, and step
 *    - Set up statistics tracking
 *
 * 2. _read():
 *    - Check if we should continue based on step direction
 *    - Generate next number and update stats
 *    - Push data and check backpressure
 *    - Emit 'done' event before ending
 *
 * 3. Backpressure:
 *    - push() returns false when buffer is full
 *    - Return early to pause generation
 *    - Stream calls _read() again when ready
 *
 * 4. Statistics:
 *    - Track count, sum, min, max during generation
 *    - Calculate average in 'done' event
 *    - Emit before push(null)
 *
 * 5. Bidirectional support:
 *    - Handle positive step (ascending)
 *    - Handle negative step (descending)
 *    - Use appropriate comparison
 */
