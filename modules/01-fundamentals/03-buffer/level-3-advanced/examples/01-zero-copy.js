/**
 * Example 1: Zero-Copy Operations
 *
 * Demonstrates the difference between operations that copy data
 * versus those that share memory (zero-copy).
 */

console.log('=== Zero-Copy Operations ===\n');

// 1. Understanding copy vs reference
console.log('1. Copy vs Reference Behavior');

const original = Buffer.from('Hello World');
console.log('Original:', original.toString());
console.log('');

// slice() - creates a view (zero-copy)
const view1 = original.subarray(0, 5);
console.log('Created view with subarray(0, 5):', view1.toString());

// Modify the view
view1[0] = 0x4A; // Change 'H' to 'J'
console.log('After view[0] = 0x4A:');
console.log('  View:', view1.toString());
console.log('  Original:', original.toString());
console.log('✅ Original modified! (shared memory)');
console.log('');

// Reset
original[0] = 0x48; // Back to 'H'

// Buffer.from() - creates copy
const copy = Buffer.from(original.subarray(0, 5));
console.log('Created copy with Buffer.from(subarray(0, 5)):', copy.toString());

copy[0] = 0x4B; // Change to 'K'
console.log('After copy[0] = 0x4B:');
console.log('  Copy:', copy.toString());
console.log('  Original:', original.toString());
console.log('✅ Original unchanged! (independent copy)');
console.log('');

// 2. Performance comparison
console.log('2. Performance: Copy vs Zero-Copy');

const largeBuffer = Buffer.alloc(1024 * 1024); // 1 MB

// Test zero-copy
console.time('Zero-copy (subarray) × 10000');
for (let i = 0; i < 10000; i++) {
  const view = largeBuffer.subarray(0, 1000);
  // Use view to prevent optimization
  if (view.length === 0) console.log('Never');
}
console.timeEnd('Zero-copy (subarray) × 10000');

// Test copy
console.time('Copy (Buffer.from) × 10000');
for (let i = 0; i < 10000; i++) {
  const copy = Buffer.from(largeBuffer.subarray(0, 1000));
  // Use copy to prevent optimization
  if (copy.length === 0) console.log('Never');
}
console.timeEnd('Copy (Buffer.from) × 10000');

console.log('✅ Zero-copy is significantly faster!');
console.log('');

// 3. Dangerous side effects of shared memory
console.log('3. Side Effects of Shared Memory');

function dangerousParser(buffer) {
  // Extract header (zero-copy)
  const header = buffer.subarray(0, 10);

  // Store for later use
  return header;
}

const packet = Buffer.from('HEADER____payload data here');
const header = dangerousParser(packet);

console.log('Extracted header:', header.toString());

// Modify original packet
packet.fill(0x58, 0, 10); // Fill header with 'X'

console.log('After modifying original:');
console.log('  Header:', header.toString());
console.log('  Packet:', packet.toString());
console.log('⚠️  Stored header was modified!');
console.log('');

// Safe version
function safeParser(buffer) {
  // Extract header and make independent copy
  const headerView = buffer.subarray(0, 10);
  const header = Buffer.from(headerView);
  return header;
}

const packet2 = Buffer.from('HEADER____payload data here');
const safeHeader = safeParser(packet2);

console.log('Extracted header (safe):', safeHeader.toString());

packet2.fill(0x58, 0, 10);

console.log('After modifying original:');
console.log('  Header:', safeHeader.toString());
console.log('  Packet:', packet2.toString());
console.log('✅ Stored header is independent!');
console.log('');

// 4. When to use zero-copy
console.log('4. When to Use Zero-Copy');

// ✅ Good use case: Read-only processing
function processPackets(buffer) {
  const packets = [];
  let offset = 0;

  while (offset < buffer.length) {
    const length = buffer.readUInt16LE(offset);
    offset += 2;

    // Zero-copy: just read, don't store
    const payload = buffer.subarray(offset, offset + length);

    // Process immediately (read-only)
    console.log('Processing packet:', payload.toString());

    offset += length;
  }
}

// Create test data
const testData = Buffer.alloc(20);
testData.writeUInt16LE(5, 0);
testData.write('Hello', 2);
testData.writeUInt16LE(5, 7);
testData.write('World', 9);

processPackets(testData);
console.log('');

// ❌ Bad use case: Storing for later
const stored = [];

function badStorage(buffer) {
  for (let i = 0; i < 10; i++) {
    // Stores views that share memory!
    stored.push(buffer.subarray(i, i + 10));
  }
}

// ✅ Good: Make copies when storing
const storedCopies = [];

function goodStorage(buffer) {
  for (let i = 0; i < 10; i++) {
    // Store independent copies
    storedCopies.push(Buffer.from(buffer.subarray(i, i + 10)));
  }
}

console.log('');

// 5. Buffer.subarray() vs Buffer.slice()
console.log('5. subarray() vs slice()');

const source = Buffer.from('0123456789');

// Modern API: subarray() (zero-copy)
const sub = source.subarray(2, 7);
console.log('subarray(2, 7):', sub.toString());

// Legacy API: slice() (also zero-copy, deprecated name)
const sli = source.slice(2, 7);
console.log('slice(2, 7):', sli.toString());

// Both share memory
sub[0] = 0x58; // 'X'
console.log('After sub[0] = X:');
console.log('  Source:', source.toString());
console.log('  Sub:', sub.toString());
console.log('  Slice:', sli.toString());
console.log('✅ All modified (shared memory)');
console.log('');
console.log('💡 Prefer subarray() over slice() (more explicit)');
console.log('');

// 6. Practical: Building response without copying
console.log('6. Practical: Zero-Copy Response Builder');

class ZeroCopyResponseBuilder {
  constructor() {
    this.parts = [];
    this.totalLength = 0;
  }

  addHeader(buffer) {
    // Store reference, no copy
    this.parts.push(buffer);
    this.totalLength += buffer.length;
  }

  addBody(buffer) {
    this.parts.push(buffer);
    this.totalLength += buffer.length;
  }

  build() {
    // Only one copy at the end
    return Buffer.concat(this.parts, this.totalLength);
  }
}

const builder = new ZeroCopyResponseBuilder();
builder.addHeader(Buffer.from('HTTP/1.1 200 OK\r\n'));
builder.addHeader(Buffer.from('Content-Type: text/plain\r\n\r\n'));
builder.addBody(Buffer.from('Hello, World!'));

const response = builder.build();
console.log('Built response (' + response.length + ' bytes):');
console.log(response.toString());
console.log('✅ Only one allocation/copy in build()');
console.log('');

// 7. Memory sharing visualization
console.log('7. Memory Sharing Visualization');

const base = Buffer.from([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);

const view1a = base.subarray(0, 3);
const view2 = base.subarray(3, 6);

console.log('Base buffer:', base);
console.log('View 1 (0-3):', view1a);
console.log('View 2 (3-6):', view2);
console.log('');

// Modify through view 1
view1a[1] = 0x11;

console.log('After view1[1] = 0x11:');
console.log('Base buffer:', base);
console.log('View 1:', view1a);
console.log('View 2:', view2);
console.log('');

// Modify through view 2
view2[0] = 0x22;

console.log('After view2[0] = 0x22:');
console.log('Base buffer:', base);
console.log('View 1:', view1a);
console.log('View 2:', view2);
console.log('✅ All views see the same memory');
console.log('');

// 8. Guidelines
console.log('8. Zero-Copy Guidelines');

const guidelines = {
  'Use zero-copy when:': [
    'Processing data immediately (read-only)',
    'Passing to functions for temporary use',
    'Performance is critical',
    'Data lifetime is clear and short'
  ],
  'Make copies when:': [
    'Storing data for later use',
    'Data may be modified elsewhere',
    'Sending to async operations',
    'Lifetime is unclear or long'
  ]
};

Object.entries(guidelines).forEach(([category, items]) => {
  console.log(category);
  items.forEach(item => console.log(`  • ${item}`));
  console.log('');
});

// Summary
console.log('=== Summary ===');
console.log('✓ subarray() creates view (zero-copy, shares memory)');
console.log('✓ Buffer.from(view) creates independent copy');
console.log('✓ Zero-copy is faster but has shared memory risks');
console.log('✓ Use zero-copy for immediate read-only processing');
console.log('✓ Make copies when storing or async operations');
console.log('⚠️  Modifying views affects original and other views!');
