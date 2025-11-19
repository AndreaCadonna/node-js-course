/**
 * Exercise 3: CSV to JSON Transform Stream
 * =========================================
 *
 * Difficulty: Medium
 *
 * Task:
 * Create a Transform stream that parses CSV input line by line and outputs
 * JavaScript objects with the following features:
 * - Handles headers properly
 * - Validates data types
 * - Reports parsing errors without stopping
 * - Handles incomplete lines (buffering)
 * - Emits statistics
 *
 * Requirements:
 * 1. Create a CSVToJSONStream class extending Transform
 * 2. First line = headers
 * 3. Convert subsequent lines to objects
 * 4. Handle type conversion (numbers, booleans, null)
 * 5. Buffer incomplete lines
 * 6. Report parsing errors without failing stream
 * 7. Track statistics: valid, invalid, total lines
 *
 * Run: node exercise-3.js
 */

const { Transform, Readable } = require('stream');

// =============================================================================
// TODO: Implement CSVToJSONStream class
// =============================================================================

class CSVToJSONStream extends Transform {
  constructor(options) {
    // TODO: Call super with appropriate modes
    // Hint: Input is strings, output is objects

    // TODO: Initialize instance variables
    // - this.headers = null
    // - this.buffer = ''
    // - this.lineNumber = 0
    // - this.stats = { valid: 0, invalid: 0, errors: [] }
  }

  _transform(chunk, encoding, callback) {
    // TODO: Implement CSV parsing
    // 1. Add chunk to buffer
    // 2. Split buffer into lines
    // 3. Keep last incomplete line in buffer
    // 4. Process complete lines:
    //    - First line: extract headers
    //    - Other lines: parse to objects
    // 5. Call callback when done
  }

  _flush(callback) {
    // TODO: Process any remaining buffered data
    // TODO: Emit statistics
    // TODO: Call callback
  }

  parseLine(line) {
    // TODO: Parse a CSV line into an object
    // 1. Split by comma
    // 2. Map to headers
    // 3. Convert types (numbers, booleans, null)
    // 4. Return object
  }

  convertValue(value) {
    // TODO: Convert string values to appropriate types
    // - Empty string or 'null' → null
    // - 'true' or 'false' → boolean
    // - Numeric string → number
    // - Otherwise → string
  }

  validateObject(obj) {
    // TODO: Validate parsed object
    // - Check all header fields exist
    // - Check for required fields
    // - Return true if valid, false otherwise
  }
}

// =============================================================================
// Test Cases
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

  // TODO: Listen to 'data' event and log objects

  parser.on('end', () => {
    console.log('\n✓ Test 1 complete\n');
    test2();
  });

  parser.on('error', (err) => {
    console.error('Parse error:', err.message);
  });
}

function test2() {
  console.log('\nTest 2: Type Conversion\n');

  const csvData = `id,name,score,active,middleName
1,Alice,95.5,true,null
2,Bob,87.3,false,Robert
3,Charlie,92.0,true,`;

  const parser = new CSVToJSONStream();

  // TODO: Implement test that demonstrates type conversion
  // Show that:
  // - Numbers are converted to number type
  // - Booleans are converted to boolean type
  // - 'null' and empty strings become null

  // Then call test3()
}

function test3() {
  console.log('\nTest 3: Chunked Input (Buffer Handling)\n');

  const csvData = `id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
3,Charlie,charlie@example.com`;

  const parser = new CSVToJSONStream();

  // TODO: Send data in small chunks to test buffering
  // Split csvData into multiple chunks that break lines
  // Example: Send "id,na" then "me,email\n1,Al" then "ice,..."

  // Then call test4()
}

function test4() {
  console.log('\nTest 4: Error Handling\n');

  const csvData = `id,name,age
1,Alice,25
2,Bob,not_a_number
3,Charlie,35
4,David
5,Eve,28`;

  const parser = new CSVToJSONStream();

  // TODO: Implement test that has malformed data
  // Should continue processing and report errors
  // Should emit statistics at end

  // Then show summary
}

// Start tests
test1();

// =============================================================================
// Expected Output Example:
// =============================================================================

/**
 * Test 1: Basic CSV Parsing
 *
 * { id: 1, name: 'Alice', age: 25, active: true }
 * { id: 2, name: 'Bob', age: 30, active: false }
 * { id: 3, name: 'Charlie', age: 35, active: true }
 *
 * ✓ Test 1 complete
 *
 *
 * Test 2: Type Conversion
 *
 * { id: 1, name: 'Alice', score: 95.5, active: true, middleName: null }
 * { id: 2, name: 'Bob', score: 87.3, active: false, middleName: 'Robert' }
 * { id: 3, name: 'Charlie', score: 92, active: true, middleName: null }
 *
 * ✓ Test 2 complete
 *
 *
 * Test 3: Chunked Input (Buffer Handling)
 *
 * { id: 1, name: 'Alice', email: 'alice@example.com' }
 * { id: 2, name: 'Bob', email: 'bob@example.com' }
 * { id: 3, name: 'Charlie', email: 'charlie@example.com' }
 *
 * ✓ Test 3 complete
 *
 *
 * Test 4: Error Handling
 *
 * { id: 1, name: 'Alice', age: 25 }
 * ⚠ Warning: Invalid data at line 3
 * { id: 2, name: 'Bob', age: 'not_a_number' }
 * { id: 3, name: 'Charlie', age: 35 }
 * ⚠ Warning: Incomplete data at line 5
 * { id: 5, name: 'Eve', age: 28 }
 *
 * Statistics:
 *   Total lines: 6
 *   Valid: 4
 *   Invalid: 2
 *
 * ✓ Test 4 complete
 */

// =============================================================================
// Hints:
// =============================================================================

/**
 * Hint 1: Buffering incomplete lines
 * this.buffer += chunk.toString();
 * const lines = this.buffer.split('\n');
 * this.buffer = lines.pop() || ''; // Keep incomplete line
 *
 * Hint 2: Type conversion
 * convertValue(value) {
 *   if (value === '' || value === 'null') return null;
 *   if (value === 'true') return true;
 *   if (value === 'false') return false;
 *   if (!isNaN(value) && value !== '') return Number(value);
 *   return value;
 * }
 *
 * Hint 3: CSV parsing (simple version)
 * const values = line.split(',').map(v => v.trim());
 * const obj = {};
 * this.headers.forEach((header, i) => {
 *   obj[header] = this.convertValue(values[i] || '');
 * });
 *
 * Hint 4: Error handling
 * Instead of callback(err), just log the error and continue:
 * console.error('Parse error:', err.message);
 * this.stats.invalid++;
 * callback(); // Continue processing
 *
 * Hint 5: Object vs Binary mode
 * super({
 *   writableObjectMode: false, // Input: strings/buffers
 *   readableObjectMode: true   // Output: objects
 * });
 */
