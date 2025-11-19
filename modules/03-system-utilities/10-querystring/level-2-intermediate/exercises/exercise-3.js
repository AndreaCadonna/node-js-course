/**
 * Level 2 Exercise 3: Custom Separators
 *
 * Practice working with custom separators and formats.
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 3: Custom Separators ===\n');

// Task 1: Parse cookie-style format
console.log('Task 1: Cookie parser');
function parseCookie(cookieStr) {
  // TODO: Parse cookie format (semicolon and space separated)
  // Example: "sessionId=abc123; userId=42; theme=dark"
}

// Test Task 1
try {
  const cookie = 'sessionId=abc123; userId=42; theme=dark';
  const parsed = parseCookie(cookie);
  console.log('Should parse cookie format correctly\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 2: Build log entry format
console.log('Task 2: Log entry builder');
function buildLogEntry(logData) {
  // TODO: Build log format with pipes and equals
  // Example: level=ERROR | message=Failed | code=500
}

// Test Task 2
try {
  const log = {
    timestamp: '2024-01-15T10:30:00',
    level: 'ERROR',
    message: 'Connection failed',
    code: 500
  };
  const entry = buildLogEntry(log);
  console.log('Should create pipe-separated log entry\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

// Task 3: Auto-detect and parse format
console.log('Task 3: Format auto-detection');
function smartParse(str) {
  // TODO: Detect format (standard, semicolon, pipe) and parse
  // Return parsed object regardless of format
}

// Test Task 3
try {
  console.log(smartParse('a=1&b=2')); // Standard
  console.log(smartParse('a=1;b=2')); // Semicolon
  console.log(smartParse('a=1|b=2')); // Pipe
  console.log('\n');
} catch (err) {
  console.log('Error:', err.message, '\n');
}

console.log('Implement the functions and test your solutions!');
