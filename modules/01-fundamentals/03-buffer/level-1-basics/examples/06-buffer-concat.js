/**
 * Example 6: Buffer Concatenation
 *
 * Demonstrates how to join multiple buffers efficiently.
 */

console.log('=== Buffer Concatenation ===\n');

// 1. Basic concatenation
console.log('1. Basic Buffer.concat()');
const buf1 = Buffer.from('Hello ');
const buf2 = Buffer.from('World');

const combined = Buffer.concat([buf1, buf2]);
console.log('buf1:', buf1.toString());
console.log('buf2:', buf2.toString());
console.log('Combined:', combined.toString());
console.log('');

// 2. Multiple buffers
console.log('2. Concatenating multiple buffers');
const parts = [
  Buffer.from('Node'),
  Buffer.from('.'),
  Buffer.from('js'),
  Buffer.from(' '),
  Buffer.from('Buffers')
];

const result = Buffer.concat(parts);
console.log('Parts:', parts.map(p => p.toString()).join(', '));
console.log('Result:', result.toString());
console.log('Total length:', result.length);
console.log('');

// 3. Specifying total length
console.log('3. Pre-calculating length for performance');
const chunk1 = Buffer.from('Fast');
const chunk2 = Buffer.from('Concat');

// Calculate total length
const totalLength = chunk1.length + chunk2.length;
const fast = Buffer.concat([chunk1, chunk2], totalLength);

console.log('With length:', fast.toString());
console.log('Total length:', fast.length);
console.log('⚡ Specifying length is more efficient!');
console.log('');

// 4. Truncation with total length
console.log('4. Truncation when length is too small');
const a = Buffer.from('Hello ');
const b = Buffer.from('World');
const truncated = Buffer.concat([a, b], 8);

console.log('Expected: "Hello World" (11 bytes)');
console.log('With length=8:', truncated.toString());
console.log('⚠️  Truncated to first 8 bytes');
console.log('');

// 5. Padding with extra length
console.log('5. Padding when length is too large');
const x = Buffer.from('Hi');
const padded = Buffer.concat([x], 5);

console.log('Original:', x.toString(), `(${x.length} bytes)`);
console.log('Padded buffer:', padded);
console.log('Padded length:', padded.length);
console.log('As string:', `"${padded.toString()}"`);
console.log('Extra bytes are zeros');
console.log('');

// 6. Collecting chunks efficiently
console.log('6. Efficient pattern: Collect then concatenate');

// BAD: Repeatedly concatenating
console.time('Bad: Repeated concat');
let bad = Buffer.alloc(0);
for (let i = 0; i < 100; i++) {
  bad = Buffer.concat([bad, Buffer.from('x')]);
}
console.timeEnd('Bad: Repeated concat');

// GOOD: Collect then concatenate once
console.time('Good: Collect then concat');
const chunks = [];
for (let i = 0; i < 100; i++) {
  chunks.push(Buffer.from('x'));
}
const good = Buffer.concat(chunks);
console.timeEnd('Good: Collect then concat');
console.log('✓ Much faster!');
console.log('');

// 7. Building binary data
console.log('7. Building binary protocol messages');

function buildMessage(type, payload) {
  const header = Buffer.alloc(4);
  header.writeUInt8(type, 0);           // Type (1 byte)
  header.writeUInt8(0, 1);              // Flags (1 byte)
  header.writeUInt16LE(payload.length, 2); // Length (2 bytes)

  return Buffer.concat([header, payload]);
}

const message1 = buildMessage(1, Buffer.from('Hello'));
const message2 = buildMessage(2, Buffer.from('World'));

console.log('Message 1:', message1);
console.log('Message 2:', message2);
console.log('');

// 8. Adding separators
console.log('8. Joining with separator');

function joinWithSeparator(buffers, separator) {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const parts = [];
  for (let i = 0; i < buffers.length; i++) {
    parts.push(buffers[i]);
    if (i < buffers.length - 1) {
      parts.push(separator);
    }
  }
  return Buffer.concat(parts);
}

const words = [
  Buffer.from('apple'),
  Buffer.from('banana'),
  Buffer.from('cherry')
];
const comma = Buffer.from(',');

const csv = joinWithSeparator(words, comma);
console.log('CSV:', csv.toString());
console.log('');

// 9. Practical: HTTP response builder
console.log('9. Practical: Building HTTP response');

function buildHTTPResponse(status, headers, body) {
  const statusLine = Buffer.from(`HTTP/1.1 ${status}\r\n`);

  const headerLines = Object.entries(headers)
    .map(([key, value]) => Buffer.from(`${key}: ${value}\r\n`));

  const headerEnd = Buffer.from('\r\n');
  const bodyBuffer = Buffer.from(body);

  return Buffer.concat([
    statusLine,
    ...headerLines,
    headerEnd,
    bodyBuffer
  ]);
}

const response = buildHTTPResponse(
  '200 OK',
  {
    'Content-Type': 'text/plain',
    'Content-Length': '12'
  },
  'Hello World!'
);

console.log('HTTP Response:');
console.log(response.toString());
console.log('Total size:', response.length, 'bytes');
console.log('');

// 10. Buffer builder helper class
console.log('10. Practical: Buffer Builder class');

class BufferBuilder {
  constructor() {
    this.parts = [];
    this.length = 0;
  }

  append(buffer) {
    this.parts.push(buffer);
    this.length += buffer.length;
    return this; // For chaining
  }

  appendString(str, encoding = 'utf8') {
    const buf = Buffer.from(str, encoding);
    return this.append(buf);
  }

  build() {
    return Buffer.concat(this.parts, this.length);
  }

  reset() {
    this.parts = [];
    this.length = 0;
  }
}

const builder = new BufferBuilder();
builder
  .appendString('Hello ')
  .appendString('World')
  .append(Buffer.from('!'));

const built = builder.build();
console.log('Built:', built.toString());
console.log('Length:', built.length);
console.log('');

// 11. Empty array handling
console.log('11. Edge case: Empty array');
const empty = Buffer.concat([]);
console.log('Empty concat:', empty);
console.log('Length:', empty.length);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use Buffer.concat(list) to join buffers');
console.log('✓ Specify totalLength for better performance');
console.log('✓ Collect chunks first, then concat once');
console.log('✓ Never repeatedly concatenate in a loop');
console.log('✓ Can truncate or pad with totalLength parameter');
console.log('✓ Use BufferBuilder pattern for multiple appends');
