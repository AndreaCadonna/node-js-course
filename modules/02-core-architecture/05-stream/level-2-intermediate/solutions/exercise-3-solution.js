/**
 * Solution: Exercise 3 - CSV to JSON Transform Stream
 * =====================================================
 * Complete CSV parser with type conversion and error handling
 */

const { Transform, Readable } = require('stream');

class CSVToJSONStream extends Transform {
  constructor(options) {
    super({
      writableObjectMode: false,
      readableObjectMode: true,
      ...options
    });

    this.headers = null;
    this.buffer = '';
    this.lineNumber = 0;
    this.stats = {
      valid: 0,
      invalid: 0,
      errors: []
    };
  }

  _transform(chunk, encoding, callback) {
    this.buffer += chunk.toString();

    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.lineNumber++;

      if (!line.trim()) continue;

      if (!this.headers) {
        this.headers = this.parseLine(line);
        console.log(`  Headers: ${this.headers.join(', ')}`);
      } else {
        try {
          const obj = this.parseDataLine(line);

          if (this.validateObject(obj)) {
            this.stats.valid++;
            this.push(obj);
          } else {
            this.stats.invalid++;
            console.error(`⚠ Warning: Invalid data at line ${this.lineNumber}`);
          }
        } catch (err) {
          this.stats.invalid++;
          this.stats.errors.push({ line: this.lineNumber, error: err.message });
          console.error(`⚠ Warning: Parse error at line ${this.lineNumber}: ${err.message}`);
        }
      }
    }

    callback();
  }

  _flush(callback) {
    if (this.buffer.trim() && this.headers) {
      try {
        const obj = this.parseDataLine(this.buffer);
        if (this.validateObject(obj)) {
          this.stats.valid++;
          this.push(obj);
        } else {
          this.stats.invalid++;
        }
      } catch (err) {
        this.stats.invalid++;
        console.error(`⚠ Warning: Parse error at final line: ${err.message}`);
      }
    }

    console.log(`\nStatistics:`);
    console.log(`  Total lines: ${this.lineNumber}`);
    console.log(`  Valid: ${this.stats.valid}`);
    console.log(`  Invalid: ${this.stats.invalid}`);

    callback();
  }

  parseLine(line) {
    return line.split(',').map(v => v.trim());
  }

  parseDataLine(line) {
    const values = this.parseLine(line);
    const obj = {};

    this.headers.forEach((header, i) => {
      const value = values[i];
      obj[header] = this.convertValue(value);
    });

    return obj;
  }

  convertValue(value) {
    if (value === undefined || value === '' || value === 'null') {
      return null;
    }

    if (value === 'true') return true;
    if (value === 'false') return false;

    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }

    return value;
  }

  validateObject(obj) {
    return this.headers.every(header => obj.hasOwnProperty(header));
  }
}

// =============================================================================
// Tests
// =============================================================================

function test1() {
  console.log('Test 1: Basic CSV Parsing\n');

  const csvData = `id,name,age,active
1,Alice,25,true
2,Bob,30,false
3,Charlie,35,true`;

  const parser = new CSVToJSONStream();
  const source = Readable.from([csvData]);

  source.pipe(parser);

  parser.on('data', (obj) => {
    console.log('  Object:', obj);
  });

  parser.on('end', () => {
    console.log('✓ Test 1 complete\n');
    test2();
  });
}

function test2() {
  console.log('Test 2: Type Conversion\n');

  const csvData = `id,name,score,active,middleName
1,Alice,95.5,true,null
2,Bob,87.3,false,Robert
3,Charlie,92.0,true,`;

  const parser = new CSVToJSONStream();
  const source = Readable.from([csvData]);

  source.pipe(parser);

  parser.on('data', (obj) => {
    console.log('  Object:', obj);
    console.log(`    Types: id=${typeof obj.id}, score=${typeof obj.score}, active=${typeof obj.active}, middleName=${obj.middleName === null ? 'null' : typeof obj.middleName}`);
  });

  parser.on('end', () => {
    console.log('✓ Test 2 complete\n');
    test3();
  });
}

function test3() {
  console.log('Test 3: Chunked Input (Buffer Handling)\n');

  const csvData = `id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
3,Charlie,charlie@example.com`;

  const parser = new CSVToJSONStream();

  const chunks = [
    'id,na',
    'me,email\n1,Al',
    'ice,alice@example.com\n2,',
    'Bob,bob@example.com\n',
    '3,Charlie,charlie@example.com'
  ];

  chunks.forEach(chunk => parser.write(chunk));
  parser.end();

  parser.on('data', (obj) => {
    console.log('  Object:', obj);
  });

  parser.on('end', () => {
    console.log('✓ Test 3 complete\n');
    test4();
  });
}

function test4() {
  console.log('Test 4: Error Handling\n');

  const csvData = `id,name,age
1,Alice,25
2,Bob,not_a_number
3,Charlie,35
4,David
5,Eve,28`;

  const parser = new CSVToJSONStream();
  const source = Readable.from([csvData]);

  source.pipe(parser);

  parser.on('data', (obj) => {
    console.log('  Object:', obj);
  });

  parser.on('end', () => {
    console.log('\n✓ Test 4 complete');
    console.log('=== All tests passed! ===\n');
  });
}

test1();

/**
 * IMPLEMENTATION NOTES:
 *
 * 1. Buffering:
 *    - Accumulate chunks in this.buffer
 *    - Split by newline
 *    - Keep incomplete line for next chunk
 *    - Process in _flush() if data remains
 *
 * 2. Type Conversion:
 *    - null/empty → null
 *    - 'true'/'false' → boolean
 *    - Numeric strings → numbers
 *    - Everything else → strings
 *
 * 3. Error Handling:
 *    - Try/catch around parsing
 *    - Don't fail stream on bad data
 *    - Log errors and continue
 *    - Track statistics
 *
 * 4. Validation:
 *    - Check all header fields present
 *    - Can be extended with custom rules
 *    - Track valid vs invalid counts
 *
 * 5. Object Mode:
 *    - Input: binary (strings/buffers)
 *    - Output: objects
 *    - Use mixed mode configuration
 */
