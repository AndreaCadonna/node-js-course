/**
 * Example 5: String Formatting with util.format()
 *
 * Learn how to format strings using printf-style placeholders.
 * util.format() is perfect for building log messages and output.
 *
 * Key Concepts:
 * - Different placeholder types (%s, %d, %i, %f, %j, %o, %O, %%)
 * - String interpolation
 * - Formatting numbers and objects
 * - Building dynamic messages
 */

const util = require('util');

// ===== EXAMPLE 1: Basic String Placeholder (%s) =====
console.log('=== Example 1: String Placeholder %s ===\n');

const name = 'Alice';
const city = 'New York';

// %s converts to string
const message1 = util.format('Hello, %s!', name);
console.log(message1);

const message2 = util.format('%s lives in %s', name, city);
console.log(message2);

// %s works with any type (converts to string)
console.log(util.format('Number as string: %s', 42));
console.log(util.format('Boolean as string: %s', true));
console.log(util.format('Object as string: %s', { key: 'value' }));

// ===== EXAMPLE 2: Integer Placeholder (%d and %i) =====
console.log('\n=== Example 2: Integer Placeholders %d and %i ===\n');

const age = 30;
const count = 42;

// %d and %i are the same - both for integers
console.log(util.format('Age: %d years', age));
console.log(util.format('Count: %i items', count));

// Non-numbers become NaN
console.log(util.format('Not a number: %d', 'hello'));  // NaN

// Floats are truncated
console.log(util.format('Truncated: %d', 42.7));  // 42

// ===== EXAMPLE 3: Float Placeholder (%f) =====
console.log('\n=== Example 3: Float Placeholder %f ===\n');

const price = 19.99;
const pi = Math.PI;

// %f for floating point numbers
console.log(util.format('Price: $%f', price));
console.log(util.format('Pi: %f', pi));

// Strings become NaN
console.log(util.format('Not a float: %f', 'text'));

// ===== EXAMPLE 4: JSON Placeholder (%j) =====
console.log('\n=== Example 4: JSON Placeholder %j ===\n');

const user = {
  name: 'Bob',
  age: 25,
  active: true
};

const numbers = [1, 2, 3, 4, 5];

// %j converts to JSON
console.log(util.format('User: %j', user));
console.log(util.format('Numbers: %j', numbers));

// Useful for logging structured data
console.log(util.format('API Response: %j', {
  status: 'success',
  data: { id: 123 },
  timestamp: Date.now()
}));

// ===== EXAMPLE 5: Object Inspection (%o and %O) =====
console.log('\n=== Example 5: Object Inspection %o and %O ===\n');

const complex = {
  nested: {
    deep: {
      value: 'hidden'
    }
  }
};

// %o - util.inspect() without colors
console.log('Using %o:');
console.log(util.format('Object: %o', complex));

// %O - util.inspect() with defaults
console.log('\nUsing %O:');
console.log(util.format('Object: %O', complex));

// Compare with %j (JSON)
console.log('\nUsing %j (JSON):');
console.log(util.format('Object: %j', complex));

// ===== EXAMPLE 6: Literal Percent (%%) =====
console.log('\n=== Example 6: Literal Percent %% ===\n');

// Use %% to show a literal %
console.log(util.format('Discount: 50%% off'));
console.log(util.format('Progress: %d%%', 75));
console.log(util.format('Success rate: %f%%', 98.5));

// ===== EXAMPLE 7: Multiple Placeholders =====
console.log('\n=== Example 7: Multiple Placeholders ===\n');

// Mix different placeholder types
console.log(util.format(
  'User %s (age %d) purchased %d items for $%f',
  'Charlie',
  28,
  3,
  45.99
));

// Order matters!
console.log(util.format(
  '%s scored %d points in %s',
  'Alice',
  100,
  'level 5'
));

// ===== EXAMPLE 8: Extra Arguments =====
console.log('\n=== Example 8: Extra Arguments ===\n');

// Extra arguments are concatenated
console.log(util.format('Hello', 'World', 'Extra', 'Args'));

// Placeholders consume arguments left to right
console.log(util.format('Name: %s, Age: %d', 'Diana', 35, 'extra', 'args'));

// Missing arguments show placeholder
console.log(util.format('Name: %s, Age: %d', 'Eve'));  // Missing age

// ===== EXAMPLE 9: Building Log Messages =====
console.log('\n=== Example 9: Building Log Messages ===\n');

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const formatted = util.format(message, ...args);
  return util.format('[%s] %s: %s', timestamp, level, formatted);
}

console.log(log('INFO', 'Server started on port %d', 3000));
console.log(log('WARN', 'User %s attempted invalid action', 'bob123'));
console.log(log('ERROR', 'Failed to connect to %s: %s', 'database', 'timeout'));

// ===== EXAMPLE 10: Practical Examples =====
console.log('\n=== Example 10: Practical Use Cases ===\n');

// API logging
function logAPICall(method, endpoint, statusCode, duration) {
  return util.format(
    '%s %s - Status: %d - Duration: %fms',
    method,
    endpoint,
    statusCode,
    duration
  );
}

console.log(logAPICall('GET', '/api/users', 200, 45.3));
console.log(logAPICall('POST', '/api/orders', 201, 123.7));

// Error messages
function formatError(code, message, details) {
  return util.format(
    'Error [%s]: %s\nDetails: %j',
    code,
    message,
    details
  );
}

console.log(formatError('E001', 'Validation failed', {
  field: 'email',
  reason: 'Invalid format'
}));

// Progress reporting
function reportProgress(taskName, completed, total) {
  const percentage = ((completed / total) * 100).toFixed(1);
  return util.format(
    'Task "%s": %d/%d (%s%%)',
    taskName,
    completed,
    total,
    percentage
  );
}

console.log(reportProgress('Data Migration', 75, 100));
console.log(reportProgress('File Processing', 234, 500));

/**
 * Important Notes:
 *
 * 1. Placeholder Types:
 *    - %s: String (converts anything to string)
 *    - %d, %i: Integer (truncates decimals)
 *    - %f: Float (keeps decimals)
 *    - %j: JSON.stringify()
 *    - %o: util.inspect() without colors
 *    - %O: util.inspect() with defaults
 *    - %%: Literal percent sign
 *
 * 2. Argument Handling:
 *    - Placeholders consume args left to right
 *    - Extra args are concatenated
 *    - Missing args show placeholder
 *
 * 3. When to Use What:
 *    - %s: General purpose, user messages
 *    - %d: Counts, IDs, integers
 *    - %f: Prices, percentages, measurements
 *    - %j: Logging data structures
 *    - %o: Debugging complex objects
 *
 * 4. Comparison with Template Literals:
 *    - Template literals: `Hello ${name}` (modern)
 *    - util.format: 'Hello %s', name (classic)
 *    - util.format better for dynamic format strings
 *    - Template literals better for known strings
 */

/**
 * Try This:
 *
 * 1. Create a logger function with different log levels
 * 2. Format database query results for display
 * 3. Build a progress bar using util.format
 * 4. Compare performance: template literals vs util.format
 * 5. Create a table formatter using util.format
 */
