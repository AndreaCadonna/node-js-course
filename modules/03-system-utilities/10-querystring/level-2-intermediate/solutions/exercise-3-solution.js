/**
 * Level 2 Exercise 3 Solution: Custom Separators
 */

const querystring = require('querystring');

console.log('=== Level 2 Exercise 3 Solutions ===\n');

// Task 1: Parse cookie-style format
console.log('Task 1: Cookie parser');
function parseCookie(cookieStr) {
  return querystring.parse(cookieStr, '; ');
}

const cookie = 'sessionId=abc123; userId=42; theme=dark';
const parsed = parseCookie(cookie);
console.log('Cookie:', cookie);
console.log('Parsed:', parsed);
console.log('✓ Task 1 complete\n');

// Task 2: Build log entry format
console.log('Task 2: Log entry builder');
function buildLogEntry(logData) {
  return querystring.stringify(logData, ' | ');
}

const log = {
  timestamp: '2024-01-15T10:30:00',
  level: 'ERROR',
  message: 'Connection failed',
  code: 500
};
const entry = buildLogEntry(log);
console.log('Log entry:', entry);
console.log('✓ Task 2 complete\n');

// Task 3: Auto-detect and parse format
console.log('Task 3: Format auto-detection');
function smartParse(str) {
  if (str.includes(';')) {
    return querystring.parse(str, ';');
  } else if (str.includes('|')) {
    return querystring.parse(str, '|');
  } else {
    return querystring.parse(str);
  }
}

console.log('Standard:', smartParse('a=1&b=2'));
console.log('Semicolon:', smartParse('a=1;b=2'));
console.log('Pipe:', smartParse('a=1|b=2'));
console.log('✓ Task 3 complete\n');

console.log('=== All Solutions Complete ===');
