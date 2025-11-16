/**
 * Example 2: Transform Streams
 *
 * Demonstrates creating custom transform streams for data processing.
 *
 * Key Concepts:
 * - Creating custom Transform streams
 * - Chaining multiple transformations
 * - Object mode vs buffer mode
 * - Stream processing patterns
 */

const fs = require('fs');
const path = require('path');
const { Transform, pipeline } = require('stream');

/**
 * Custom Transform: Convert text to uppercase
 */
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
}

/**
 * Custom Transform: Count lines and words
 */
class StatsTransform extends Transform {
  constructor(options) {
    super(options);
    this.lines = 0;
    this.words = 0;
    this.bytes = 0;
  }

  _transform(chunk, encoding, callback) {
    const text = chunk.toString();
    this.bytes += chunk.length;
    this.lines += (text.match(/\n/g) || []).length;
    this.words += (text.match(/\w+/g) || []).length;

    // Pass through unchanged
    this.push(chunk);
    callback();
  }

  _flush(callback) {
    console.log('\nStats:');
    console.log(`  Lines: ${this.lines.toLocaleString()}`);
    console.log(`  Words: ${this.words.toLocaleString()}`);
    console.log(`  Bytes: ${this.bytes.toLocaleString()}`);
    callback();
  }
}

/**
 * Custom Transform: Filter lines matching pattern
 */
class GrepTransform extends Transform {
  constructor(pattern, options) {
    super(options);
    this.pattern = pattern;
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    // Add to buffer
    this.buffer += chunk.toString();

    // Process complete lines
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line

    // Filter and output matching lines
    for (const line of lines) {
      if (this.pattern.test(line)) {
        this.push(line + '\n');
      }
    }

    callback();
  }

  _flush(callback) {
    // Process remaining buffer
    if (this.buffer && this.pattern.test(this.buffer)) {
      this.push(this.buffer);
    }
    callback();
  }
}

/**
 * Custom Transform: Line numbers
 */
class LineNumberTransform extends Transform {
  constructor(options) {
    super(options);
    this.lineNumber = 0;
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.lineNumber++;
      this.push(`${this.lineNumber.toString().padStart(6, ' ')}: ${line}\n`);
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer) {
      this.lineNumber++;
      this.push(`${this.lineNumber.toString().padStart(6, ' ')}: ${this.buffer}\n`);
    }
    callback();
  }
}

/**
 * Custom Transform: CSV to JSON (object mode)
 */
class CsvToJsonTransform extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.headers = null;
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());

      if (!this.headers) {
        this.headers = values;
      } else {
        const obj = {};
        this.headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        this.push(obj);
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim() && this.headers) {
      const values = this.buffer.split(',').map(v => v.trim());
      const obj = {};
      this.headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });
      this.push(obj);
    }
    callback();
  }
}

/**
 * Custom Transform: Progress indicator
 */
class ProgressTransform extends Transform {
  constructor(totalSize, options) {
    super(options);
    this.totalSize = totalSize;
    this.processedBytes = 0;
    this.lastPercent = 0;
  }

  _transform(chunk, encoding, callback) {
    this.processedBytes += chunk.length;
    const percent = Math.floor((this.processedBytes / this.totalSize) * 100);

    if (percent > this.lastPercent && percent % 10 === 0) {
      process.stdout.write(`\r  Progress: ${percent}%`);
      this.lastPercent = percent;
    }

    this.push(chunk);
    callback();
  }

  _flush(callback) {
    console.log('\r  Progress: 100% ✓');
    callback();
  }
}

async function demonstrateTransformStreams() {
  console.log('Transform Streams Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-transforms');
  fs.mkdirSync(testDir, { recursive: true });

  try {
    // Create test file
    const testFile = path.join(testDir, 'input.txt');
    const content = `Hello World
This is a test file
Node.js streams are powerful
We can transform data efficiently
Error: Something went wrong
Warning: Check this line
Info: Everything is fine
Error: Another problem
Success: Operation completed
The quick brown fox jumps
`;

    fs.writeFileSync(testFile, content);

    // Example 1: Uppercase transformation
    console.log('\n1. Uppercase Transformation');
    console.log('─'.repeat(50));

    const upperCase = new UpperCaseTransform();
    const outputUpper = path.join(testDir, 'uppercase.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(testFile),
        upperCase,
        fs.createWriteStream(outputUpper),
        (err) => err ? reject(err) : resolve()
      );
    });

    console.log(`✓ Created: ${outputUpper}`);
    console.log('Sample:', fs.readFileSync(outputUpper, 'utf8').split('\n')[0]);

    // Example 2: Stats collection
    console.log('\n2. Statistics Collection');
    console.log('─'.repeat(50));

    const stats = new StatsTransform();
    const outputStats = path.join(testDir, 'with-stats.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(testFile),
        stats,
        fs.createWriteStream(outputStats),
        (err) => err ? reject(err) : resolve()
      );
    });

    // Example 3: Grep (filter lines)
    console.log('\n3. Filtering Lines (grep)');
    console.log('─'.repeat(50));

    const grep = new GrepTransform(/Error/);
    const outputGrep = path.join(testDir, 'errors-only.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(testFile),
        grep,
        fs.createWriteStream(outputGrep),
        (err) => err ? reject(err) : resolve()
      );
    });

    const errors = fs.readFileSync(outputGrep, 'utf8');
    console.log('Filtered lines:');
    console.log(errors);

    // Example 4: Line numbers
    console.log('4. Adding Line Numbers');
    console.log('─'.repeat(50));

    const lineNumbers = new LineNumberTransform();
    const outputNumbered = path.join(testDir, 'numbered.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(testFile),
        lineNumbers,
        fs.createWriteStream(outputNumbered),
        (err) => err ? reject(err) : resolve()
      );
    });

    console.log('First 3 lines:');
    const numbered = fs.readFileSync(outputNumbered, 'utf8').split('\n').slice(0, 3);
    numbered.forEach(line => console.log(line));

    // Example 5: CSV to JSON
    console.log('\n5. CSV to JSON Transformation');
    console.log('─'.repeat(50));

    const csvFile = path.join(testDir, 'data.csv');
    fs.writeFileSync(csvFile, `name,age,city
Alice,30,New York
Bob,25,London
Charlie,35,Paris
Diana,28,Tokyo
`);

    const csvToJson = new CsvToJsonTransform();
    const jsonObjects = [];

    csvToJson.on('data', (obj) => {
      jsonObjects.push(obj);
    });

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(csvFile),
        csvToJson,
        (err) => err ? reject(err) : resolve()
      );
    });

    console.log('Parsed objects:');
    jsonObjects.forEach(obj => console.log('  ', JSON.stringify(obj)));

    // Example 6: Chained transformations
    console.log('\n6. Chained Transformations');
    console.log('─'.repeat(50));

    const grepErrors = new GrepTransform(/Error|Warning/);
    const addLineNumbers = new LineNumberTransform();
    const toUpperCase = new UpperCaseTransform();
    const outputChained = path.join(testDir, 'chained.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(testFile),
        grepErrors,
        addLineNumbers,
        toUpperCase,
        fs.createWriteStream(outputChained),
        (err) => err ? reject(err) : resolve()
      );
    });

    console.log('Result (filtered + numbered + uppercase):');
    console.log(fs.readFileSync(outputChained, 'utf8'));

    // Example 7: Progress tracking
    console.log('7. Progress Tracking');
    console.log('─'.repeat(50));

    // Create larger file
    const largeFile = path.join(testDir, 'large.txt');
    const largeWriter = fs.createWriteStream(largeFile);
    for (let i = 0; i < 1000; i++) {
      largeWriter.write('Line ' + i + ': ' + 'x'.repeat(100) + '\n');
    }
    largeWriter.end();
    await new Promise(resolve => largeWriter.on('finish', resolve));

    const fileSize = fs.statSync(largeFile).size;
    const progress = new ProgressTransform(fileSize);
    const outputLarge = path.join(testDir, 'large-copy.txt');

    await new Promise((resolve, reject) => {
      pipeline(
        fs.createReadStream(largeFile),
        progress,
        fs.createWriteStream(outputLarge),
        (err) => err ? reject(err) : resolve()
      );
    });

    // Example 8: Custom JSON stringifier
    console.log('\n8. Object to JSON Lines');
    console.log('─'.repeat(50));

    class JsonStringifyTransform extends Transform {
      constructor(options) {
        super({ ...options, objectMode: true });
      }

      _transform(obj, encoding, callback) {
        this.push(JSON.stringify(obj) + '\n');
        callback();
      }
    }

    const jsonStringify = new JsonStringifyTransform();
    const jsonLinesOutput = path.join(testDir, 'output.jsonl');

    const objectSource = new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        // Simulate object source
        callback();
      }
    });

    // Manually push objects
    jsonObjects.forEach(obj => jsonStringify.write(obj));
    jsonStringify.end();

    const jsonLinesWriter = fs.createWriteStream(jsonLinesOutput);
    jsonStringify.pipe(jsonLinesWriter);

    await new Promise(resolve => jsonLinesWriter.on('finish', resolve));

    console.log('JSON Lines output:');
    console.log(fs.readFileSync(jsonLinesOutput, 'utf8'));

    // Cleanup
    console.log('\n9. Cleanup');
    console.log('─'.repeat(50));

    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

demonstrateTransformStreams();

/**
 * Transform Stream Patterns:
 *
 * 1. Pass-through (identity):
 *    _transform(chunk, enc, cb) {
 *      this.push(chunk);
 *      cb();
 *    }
 *
 * 2. Filter:
 *    _transform(chunk, enc, cb) {
 *      if (shouldInclude(chunk)) {
 *        this.push(chunk);
 *      }
 *      cb();
 *    }
 *
 * 3. Map (transform):
 *    _transform(chunk, enc, cb) {
 *      this.push(transform(chunk));
 *      cb();
 *    }
 *
 * 4. Split (one to many):
 *    _transform(chunk, enc, cb) {
 *      const parts = split(chunk);
 *      parts.forEach(p => this.push(p));
 *      cb();
 *    }
 *
 * 5. Aggregate (many to one):
 *    _transform(chunk, enc, cb) {
 *      this.buffer.push(chunk);
 *      cb();
 *    }
 *    _flush(cb) {
 *      this.push(aggregate(this.buffer));
 *      cb();
 *    }
 */

/**
 * Object Mode:
 *
 * Regular streams:
 * - Work with Buffer/String
 * - Good for file I/O
 *
 * Object mode streams:
 * - Work with any JavaScript object
 * - Good for data processing
 * - Enable objectMode in options
 * - Example: CSV → objects → JSON
 */

/**
 * Real-World Uses:
 *
 * - Log processing (filter, format)
 * - Data ETL pipelines
 * - File compression/encryption
 * - Protocol implementation
 * - Data validation
 * - Format conversion
 */
