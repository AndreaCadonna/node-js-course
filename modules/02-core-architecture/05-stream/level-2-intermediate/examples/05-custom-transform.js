/**
 * 05-custom-transform.js
 * =======================
 * Demonstrates CSV to JSON transformation with stateful parsing
 *
 * Key Concepts:
 * - Extending Transform class
 * - Implementing _transform() and _flush()
 * - Stateful parsing (buffering incomplete data)
 * - Object mode streams
 * - Error handling
 *
 * Run: node 05-custom-transform.js
 */

const { Transform, Readable, Writable } = require('stream');
const { pipeline } = require('stream/promises');

console.log('=== Custom Transform Stream Examples ===\n');

// =============================================================================
// Example 1: Simple Uppercase Transform
// =============================================================================

class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    const uppercased = chunk.toString().toUpperCase();
    this.push(uppercased);
    callback();
  }
}

console.log('--- Example 1: Simple Uppercase Transform ---\n');

const upper = new UpperCaseTransform();

upper.write('hello ');
upper.write('world\n');
upper.end();

upper.on('data', (chunk) => {
  process.stdout.write(chunk);
});

upper.on('end', () => {
  console.log('✓ Transform complete\n');
  example2();
});

// =============================================================================
// Example 2: CSV to JSON Transform
// =============================================================================

class CSVToJSON extends Transform {
  constructor(options) {
    super({ ...options, writableObjectMode: false, readableObjectMode: true });
    this.headers = null;
    this.buffer = '';
    this.lineNumber = 0;
  }

  _transform(chunk, encoding, callback) {
    // Add chunk to buffer
    this.buffer += chunk.toString();

    // Split into lines
    const lines = this.buffer.split('\n');

    // Keep incomplete line in buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      this.lineNumber++;

      if (!line.trim()) continue;

      if (!this.headers) {
        // First line = headers
        this.headers = line.split(',').map(h => h.trim());
        console.log(`  Headers: ${this.headers.join(', ')}`);
      } else {
        // Data line
        const obj = this.parseLine(line);
        this.push(obj);
      }
    }

    callback();
  }

  _flush(callback) {
    // Process remaining buffer
    if (this.buffer.trim() && this.headers) {
      const obj = this.parseLine(this.buffer);
      this.push(obj);
    }

    console.log(`  Parsed ${this.lineNumber} lines\n`);
    callback();
  }

  parseLine(line) {
    const values = line.split(',').map(v => v.trim());
    const obj = {};

    this.headers.forEach((header, i) => {
      const value = values[i] || null;

      // Type conversion
      if (value === null || value === '') {
        obj[header] = null;
      } else if (!isNaN(value)) {
        obj[header] = Number(value);
      } else {
        obj[header] = value;
      }
    });

    return obj;
  }
}

async function example2() {
  console.log('--- Example 2: CSV to JSON Transform ---\n');

  // Create CSV data
  const csvData = `id,name,age,email
1,Alice,25,alice@example.com
2,Bob,30,bob@example.com
3,Charlie,35,charlie@example.com`;

  const source = Readable.from([csvData]);
  const parser = new CSVToJSON();

  source.pipe(parser);

  parser.on('data', (obj) => {
    console.log('  Object:', JSON.stringify(obj));
  });

  parser.on('end', () => {
    console.log('✓ CSV parsing complete\n');
    example3();
  });
}

// =============================================================================
// Example 3: JSON Lines to CSV Transform
// =============================================================================

class JSONToCSV extends Transform {
  constructor(fields, options) {
    super({ ...options, writableObjectMode: true, readableObjectMode: false });
    this.fields = fields;
    this.headerWritten = false;
  }

  _transform(obj, encoding, callback) {
    if (!this.headerWritten) {
      // Write CSV header
      const header = this.fields.join(',') + '\n';
      this.push(header);
      this.headerWritten = true;
    }

    // Write data row
    const values = this.fields.map(field => {
      const value = obj[field];
      if (value === null || value === undefined) {
        return '';
      }
      // Quote strings that contain commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return String(value);
    });

    const row = values.join(',') + '\n';
    this.push(row);

    callback();
  }
}

function example3() {
  console.log('--- Example 3: JSON to CSV Transform ---\n');

  const converter = new JSONToCSV(['id', 'name', 'age']);

  const objects = [
    { id: 1, name: 'Alice', age: 25 },
    { id: 2, name: 'Bob', age: 30 },
    { id: 3, name: 'Charlie', age: 35 }
  ];

  objects.forEach(obj => converter.write(obj));
  converter.end();

  converter.on('data', (chunk) => {
    process.stdout.write(chunk.toString());
  });

  converter.on('end', () => {
    console.log('✓ JSON to CSV complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Filter Transform
// =============================================================================

class FilterTransform extends Transform {
  constructor(predicate, options) {
    super({ objectMode: true, ...options });
    this.predicate = predicate;
    this.passed = 0;
    this.filtered = 0;
  }

  _transform(item, encoding, callback) {
    if (this.predicate(item)) {
      this.passed++;
      this.push(item);
    } else {
      this.filtered++;
    }

    callback();
  }

  _flush(callback) {
    console.log(`\n  Stats: ${this.passed} passed, ${this.filtered} filtered\n`);
    callback();
  }
}

function example4() {
  console.log('--- Example 4: Filter Transform ---\n');

  const numbers = Readable.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const filter = new FilterTransform(n => n % 2 === 0); // Even numbers only

  numbers.pipe(filter);

  filter.on('data', (n) => {
    console.log(`  Even number: ${n}`);
  });

  filter.on('end', () => {
    console.log('✓ Filter complete\n');
    example5();
  });
}

// =============================================================================
// Example 5: Aggregation Transform
// =============================================================================

class AggregateTransform extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.sum = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  _transform(number, encoding, callback) {
    this.sum += number;
    this.count++;
    this.min = Math.min(this.min, number);
    this.max = Math.max(this.max, number);

    // Pass through
    this.push(number);

    callback();
  }

  _flush(callback) {
    // Emit final statistics
    const stats = {
      sum: this.sum,
      count: this.count,
      average: this.count > 0 ? this.sum / this.count : 0,
      min: this.min === Infinity ? null : this.min,
      max: this.max === -Infinity ? null : this.max
    };

    this.push(stats);

    callback();
  }
}

function example5() {
  console.log('--- Example 5: Aggregation Transform ---\n');

  const numbers = Readable.from([5, 10, 15, 20, 25]);
  const aggregator = new AggregateTransform();

  numbers.pipe(aggregator);

  aggregator.on('data', (data) => {
    if (typeof data === 'number') {
      console.log(`  Number: ${data}`);
    } else {
      console.log('  Statistics:', JSON.stringify(data, null, 2));
    }
  });

  aggregator.on('end', () => {
    console.log('\n✓ Aggregation complete\n');
    example6();
  });
}

// =============================================================================
// Example 6: Multi-Line Parser Transform
// =============================================================================

class BlockParser extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.buffer = '';
    this.inBlock = false;
    this.blockCount = 0;
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    while (this.buffer.length > 0) {
      if (!this.inBlock) {
        // Look for block start
        const startIdx = this.buffer.indexOf('<<START>>');

        if (startIdx === -1) {
          // No start marker found, discard everything
          this.buffer = '';
          break;
        }

        // Remove everything before start marker
        this.buffer = this.buffer.slice(startIdx + 9);
        this.inBlock = true;
      } else {
        // Look for block end
        const endIdx = this.buffer.indexOf('<<END>>');

        if (endIdx === -1) {
          // No end marker yet, wait for more data
          break;
        }

        // Extract block content
        const blockContent = this.buffer.slice(0, endIdx);
        this.buffer = this.buffer.slice(endIdx + 7);
        this.inBlock = false;

        // Emit parsed block
        this.blockCount++;
        this.push({
          blockNumber: this.blockCount,
          content: blockContent.trim()
        });
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.inBlock && this.buffer) {
      console.log('  Warning: Incomplete block at end');
    }

    console.log(`\n  Parsed ${this.blockCount} blocks\n`);
    callback();
  }
}

function example6() {
  console.log('--- Example 6: Block Parser Transform ---\n');

  const data = `
Some text before
<<START>>
This is block 1
with multiple lines
<<END>>
Text in between
<<START>>
This is block 2
<<END>>
More text after
`;

  const source = Readable.from([data]);
  const parser = new BlockParser();

  source.pipe(parser);

  parser.on('data', (block) => {
    console.log(`  Block ${block.blockNumber}:`);
    console.log(`    ${block.content.replace(/\n/g, '\n    ')}`);
  });

  parser.on('end', () => {
    console.log('✓ Block parsing complete\n');
    showSummary();
  });
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Summary ===\n');
  console.log('Key Points:');
  console.log('1. _transform() processes each chunk');
  console.log('2. _flush() emits final data');
  console.log('3. Buffer incomplete data between chunks');
  console.log('4. Use object mode for structured data');
  console.log('5. Can push multiple times per chunk');
  console.log('6. Can push nothing (filter)');
  console.log('7. Always call callback()');
  console.log('\nCommon Patterns:');
  console.log('• Line-based parsing (buffer incomplete lines)');
  console.log('• Format conversion (CSV, JSON, XML)');
  console.log('• Filtering and mapping');
  console.log('• Aggregation and statistics');
  console.log('• Multi-line protocol parsing');
  console.log('\n✓ All examples completed!\n');
}

/**
 * TRANSFORM STREAM PATTERNS:
 *
 * 1. Stateless Transform:
 *    - No buffering between chunks
 *    - Each chunk independent
 *    - Example: uppercase, encryption
 *
 * 2. Stateful Transform:
 *    - Buffers data between chunks
 *    - Maintains parsing state
 *    - Example: CSV parser, protocol parser
 *
 * 3. Filtering Transform:
 *    - May not push for every input
 *    - Still must call callback()
 *    - Example: filter, deduplicate
 *
 * 4. Aggregating Transform:
 *    - Collects data throughout
 *    - Emits summary in _flush()
 *    - Example: sum, statistics
 *
 * 5. One-to-Many Transform:
 *    - Pushes multiple chunks per input
 *    - Example: split lines, chunk splitter
 *
 * 6. Many-to-One Transform:
 *    - Buffers multiple inputs
 *    - Emits in batches
 *    - Example: batcher, merger
 */
