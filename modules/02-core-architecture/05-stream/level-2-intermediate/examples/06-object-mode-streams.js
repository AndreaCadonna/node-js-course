/**
 * 06-object-mode-streams.js
 * ==========================
 * Demonstrates object mode streams for working with JavaScript objects
 *
 * Key Concepts:
 * - Object mode vs binary mode
 * - highWaterMark in object mode
 * - Mixed mode streams
 * - Processing structured data
 *
 * Run: node 06-object-mode-streams.js
 */

const { Readable, Writable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

console.log('=== Object Mode Stream Examples ===\n');

// =============================================================================
// Example 1: Object Readable Stream
// =============================================================================

class ObjectGenerator extends Readable {
  constructor(count, options) {
    super({ objectMode: true, ...options });
    this.count = count;
    this.current = 0;
  }

  _read() {
    if (this.current >= this.count) {
      this.push(null);
      return;
    }

    this.current++;

    // Push JavaScript object directly
    this.push({
      id: this.current,
      timestamp: Date.now(),
      data: `Record ${this.current}`,
      metadata: {
        generated: true,
        version: 1
      }
    });
  }
}

console.log('--- Example 1: Object Readable Stream ---\n');

const generator = new ObjectGenerator(5);

generator.on('data', (obj) => {
  console.log('  Object:', JSON.stringify(obj, null, 2));
});

generator.on('end', () => {
  console.log('\n✓ Generated 5 objects\n');
  example2();
});

// =============================================================================
// Example 2: Object Writable Stream
// =============================================================================

class ObjectLogger extends Writable {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.objectCount = 0;
    this.totalSize = 0;
  }

  _write(obj, encoding, callback) {
    this.objectCount++;

    // Measure object size
    const size = JSON.stringify(obj).length;
    this.totalSize += size;

    console.log(`  [${this.objectCount}] ${obj.type}: ${obj.message}`);

    callback();
  }

  _final(callback) {
    const avgSize = this.totalSize / this.objectCount;
    console.log(`\n  Total objects: ${this.objectCount}`);
    console.log(`  Average size: ${avgSize.toFixed(0)} bytes\n`);
    callback();
  }
}

function example2() {
  console.log('--- Example 2: Object Writable Stream ---\n');

  const logger = new ObjectLogger();

  logger.write({ type: 'INFO', message: 'Application started' });
  logger.write({ type: 'DEBUG', message: 'Processing request' });
  logger.write({ type: 'ERROR', message: 'Connection failed' });
  logger.end({ type: 'INFO', message: 'Application stopped' });

  logger.on('finish', () => {
    console.log('✓ Logging complete\n');
    example3();
  });
}

// =============================================================================
// Example 3: Object Transform Stream
// =============================================================================

class ObjectEnricher extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.processedCount = 0;
  }

  _transform(obj, encoding, callback) {
    this.processedCount++;

    // Enrich the object
    const enriched = {
      ...obj,
      enriched: true,
      processedAt: new Date().toISOString(),
      processedBy: 'ObjectEnricher',
      sequenceNumber: this.processedCount
    };

    this.push(enriched);
    callback();
  }
}

function example3() {
  console.log('--- Example 3: Object Transform Stream ---\n');

  const enricher = new ObjectEnricher();

  const data = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];

  data.forEach(obj => enricher.write(obj));
  enricher.end();

  enricher.on('data', (obj) => {
    console.log('  Enriched:', JSON.stringify(obj, null, 2));
  });

  enricher.on('end', () => {
    console.log('\n✓ Enrichment complete\n');
    example4();
  });
}

// =============================================================================
// Example 4: Mixed Mode Transform (String → Object)
// =============================================================================

class JSONParser extends Transform {
  constructor(options) {
    super({
      writableObjectMode: false,  // Input: strings/buffers
      readableObjectMode: true,   // Output: objects
      ...options
    });
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    // Split into lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    // Parse each line as JSON
    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const obj = JSON.parse(line);
        this.push(obj); // Push object
      } catch (err) {
        console.error(`  Parse error: ${err.message}`);
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim()) {
      try {
        const obj = JSON.parse(this.buffer);
        this.push(obj);
      } catch (err) {
        console.error(`  Parse error: ${err.message}`);
      }
    }

    callback();
  }
}

function example4() {
  console.log('--- Example 4: Mixed Mode (String → Object) ---\n');

  const parser = new JSONParser();

  const jsonLines = `{"id":1,"name":"Alice"}
{"id":2,"name":"Bob"}
{"id":3,"name":"Charlie"}`;

  const source = Readable.from([jsonLines]);

  source.pipe(parser);

  parser.on('data', (obj) => {
    console.log(`  Parsed object: ID=${obj.id}, Name=${obj.name}`);
  });

  parser.on('end', () => {
    console.log('\n✓ Parsing complete\n');
    example5();
  });
}

// =============================================================================
// Example 5: Mixed Mode Transform (Object → String)
// =============================================================================

class JSONStringifier extends Transform {
  constructor(options) {
    super({
      writableObjectMode: true,   // Input: objects
      readableObjectMode: false,  // Output: strings/buffers
      ...options
    });
    this.first = true;
  }

  _transform(obj, encoding, callback) {
    try {
      // Convert object to JSON string
      const json = JSON.stringify(obj);
      const line = json + '\n';

      this.push(line); // Push string

      callback();
    } catch (err) {
      callback(err);
    }
  }
}

function example5() {
  console.log('--- Example 5: Mixed Mode (Object → String) ---\n');

  const stringifier = new JSONStringifier();

  const objects = [
    { id: 1, value: 100 },
    { id: 2, value: 200 },
    { id: 3, value: 300 }
  ];

  objects.forEach(obj => stringifier.write(obj));
  stringifier.end();

  stringifier.on('data', (chunk) => {
    process.stdout.write(`  JSON Line: ${chunk}`);
  });

  stringifier.on('end', () => {
    console.log('\n✓ Stringification complete\n');
    example6();
  });
}

// =============================================================================
// Example 6: Database-like Object Pipeline
// =============================================================================

class MockDatabaseReader extends Readable {
  constructor(query, options) {
    super({ objectMode: true, ...options });
    this.query = query;
    this.offset = 0;
    this.batchSize = 5;
    this.totalRecords = 15;
  }

  async _read() {
    if (this.offset >= this.totalRecords) {
      this.push(null);
      return;
    }

    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 50));

    const batch = [];
    for (let i = 0; i < this.batchSize && this.offset < this.totalRecords; i++) {
      batch.push({
        id: this.offset + 1,
        name: `User ${this.offset + 1}`,
        email: `user${this.offset + 1}@example.com`,
        age: 20 + Math.floor(Math.random() * 40)
      });
      this.offset++;
    }

    for (const record of batch) {
      if (!this.push(record)) break;
    }
  }
}

class AgeFilter extends Transform {
  constructor(minAge, options) {
    super({ objectMode: true, ...options });
    this.minAge = minAge;
    this.filtered = 0;
    this.passed = 0;
  }

  _transform(record, encoding, callback) {
    if (record.age >= this.minAge) {
      this.passed++;
      this.push(record);
    } else {
      this.filtered++;
    }

    callback();
  }

  _flush(callback) {
    console.log(`\n  Filter stats: ${this.passed} passed, ${this.filtered} filtered\n`);
    callback();
  }
}

class RecordFormatter extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
  }

  _transform(record, encoding, callback) {
    const formatted = {
      userId: record.id,
      displayName: record.name,
      contact: record.email,
      isAdult: record.age >= 18,
      ageGroup: record.age < 30 ? 'young' : record.age < 50 ? 'middle' : 'senior'
    };

    this.push(formatted);
    callback();
  }
}

class RecordCounter extends Writable {
  constructor(options) {
    super({ objectMode: true, ...options });
    this.count = 0;
  }

  _write(record, encoding, callback) {
    this.count++;
    console.log(`  ${this.count}. ${record.displayName} (${record.ageGroup})`);
    callback();
  }

  _final(callback) {
    console.log(`\n  Total records: ${this.count}\n`);
    callback();
  }
}

async function example6() {
  console.log('--- Example 6: Complete Object Pipeline ---\n');

  try {
    await pipeline(
      new MockDatabaseReader('SELECT * FROM users'),
      new AgeFilter(30),
      new RecordFormatter(),
      new RecordCounter()
    );

    console.log('✓ Pipeline complete\n');
    example7();
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }
}

// =============================================================================
// Example 7: highWaterMark in Object Mode
// =============================================================================

function example7() {
  console.log('--- Example 7: highWaterMark in Object Mode ---\n');

  // Binary mode - highWaterMark in bytes
  const binaryStream = new Readable({
    highWaterMark: 16384 // 16 KB
  });

  console.log('  Binary stream highWaterMark:', binaryStream.readableHighWaterMark, 'bytes');

  // Object mode - highWaterMark in number of objects
  const objectStream = new Readable({
    objectMode: true,
    highWaterMark: 10 // 10 objects
  });

  console.log('  Object stream highWaterMark:', objectStream.readableHighWaterMark, 'objects');

  // Large objects need smaller highWaterMark
  const largeObjectStream = new Readable({
    objectMode: true,
    highWaterMark: 5 // Fewer large objects
  });

  console.log('  Large object stream highWaterMark:', largeObjectStream.readableHighWaterMark, 'objects\n');

  console.log('✓ highWaterMark comparison complete\n');

  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('=== Summary ===\n');
  console.log('Key Points:');
  console.log('1. objectMode: true for JavaScript objects');
  console.log('2. highWaterMark = number of objects, not bytes');
  console.log('3. Can mix modes: writableObjectMode & readableObjectMode');
  console.log('4. Push/write objects directly (no Buffer conversion)');
  console.log('5. Perfect for structured data pipelines');
  console.log('6. Consider object size when setting highWaterMark');
  console.log('\nWhen to Use Object Mode:');
  console.log('✓ Database record streaming');
  console.log('✓ JSON/CSV data processing');
  console.log('✓ Event processing');
  console.log('✓ API response transformation');
  console.log('✗ File I/O (use binary)');
  console.log('✗ Network I/O (use binary)');
  console.log('\n✓ All examples completed!\n');
}

/**
 * OBJECT MODE BEST PRACTICES:
 *
 * 1. When to Use:
 *    - Processing structured data
 *    - Database queries
 *    - JSON/CSV parsing
 *    - Data transformation pipelines
 *
 * 2. Performance Considerations:
 *    - Objects create GC pressure
 *    - Larger objects = lower highWaterMark
 *    - Consider batching for efficiency
 *    - Monitor memory usage
 *
 * 3. highWaterMark Tuning:
 *    - Small objects (<1KB): highWaterMark 50-100
 *    - Medium objects (1-10KB): highWaterMark 10-50
 *    - Large objects (>10KB): highWaterMark 5-10
 *
 * 4. Mixed Mode Patterns:
 *    - String → Object: Parsing (JSON, CSV)
 *    - Object → String: Formatting, serialization
 *    - Object → Object: Transformation, filtering
 *
 * 5. Error Handling:
 *    - Validate objects early in pipeline
 *    - Handle serialization errors
 *    - Log malformed data
 */
