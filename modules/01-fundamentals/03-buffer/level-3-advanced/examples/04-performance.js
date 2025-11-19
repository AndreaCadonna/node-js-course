/**
 * Example 4: Performance Optimization
 *
 * Demonstrates profiling and optimizing buffer operations
 * for production performance.
 */

console.log('=== Performance Optimization ===\n');

// 1. Allocation strategies
console.log('1. Allocation Performance');

const iterations = 100000;

// alloc() - zeroed
console.time('Buffer.alloc() × ' + iterations);
for (let i = 0; i < iterations; i++) {
  const buf = Buffer.alloc(1024);
  if (buf.length === 0) console.log('Never');
}
console.timeEnd('Buffer.alloc() × ' + iterations);

// allocUnsafe() - uninitialized
console.time('Buffer.allocUnsafe() × ' + iterations);
for (let i = 0; i < iterations; i++) {
  const buf = Buffer.allocUnsafe(1024);
  if (buf.length === 0) console.log('Never');
}
console.timeEnd('Buffer.allocUnsafe() × ' + iterations);

console.log('✅ allocUnsafe() is faster but must be filled!');
console.log('');

// 2. Concatenation performance
console.log('2. Buffer Concatenation Optimization');

const pieces = [];
for (let i = 0; i < 1000; i++) {
  pieces.push(Buffer.from('test'));
}

// Slow: repeated concat
console.time('Repeated Buffer.concat');
let slow = Buffer.alloc(0);
pieces.forEach(piece => {
  slow = Buffer.concat([slow, piece]);
});
console.timeEnd('Repeated Buffer.concat');

// Fast: single concat
console.time('Single Buffer.concat');
const fast = Buffer.concat(pieces);
console.timeEnd('Single Buffer.concat');

console.log('✅ Collect then concat once!');
console.log('');

// 3. Reading/writing optimization
console.log('3. Read/Write Performance');

const testBuf = Buffer.alloc(1000000);

// TypedArray vs Buffer methods
console.time('Buffer.readUInt32LE × 100000');
for (let i = 0; i < 100000; i++) {
  testBuf.readUInt32LE(i * 4);
}
console.timeEnd('Buffer.readUInt32LE × 100000');

const uint32View = new Uint32Array(testBuf.buffer, testBuf.byteOffset, testBuf.length / 4);

console.time('Uint32Array access × 100000');
for (let i = 0; i < 100000; i++) {
  const val = uint32View[i];
  if (val < 0) console.log('Never');
}
console.timeEnd('Uint32Array access × 100000');

console.log('✅ TypedArray faster for bulk operations!');
console.log('');

// 4. String conversion performance
console.log('4. String Conversion Optimization');

const str = 'x'.repeat(10000);

console.time('toString() × 1000');
for (let i = 0; i < 1000; i++) {
  const buf = Buffer.from(str);
  buf.toString();
}
console.timeEnd('toString() × 1000');

console.time('toString(start, end) × 1000');
for (let i = 0; i < 1000; i++) {
  const buf = Buffer.from(str);
  buf.toString('utf8', 0, buf.length);
}
console.timeEnd('toString(start, end) × 1000');

console.log('✅ Partial conversion when possible');
console.log('');

// 5. Buffer pooling impact
console.log('5. Buffer Pool Performance Impact');

class FastBufferPool {
  constructor(size, count) {
    this.buffers = Array(count).fill(null).map(() => Buffer.allocUnsafe(size));
    this.index = 0;
  }

  get() {
    const buf = this.buffers[this.index];
    this.index = (this.index + 1) % this.buffers.length;
    return buf;
  }
}

const pool = new FastBufferPool(4096, 100);

console.time('With pool × 10000');
for (let i = 0; i < 10000; i++) {
  const buf = pool.get();
  buf[0] = i & 0xFF;
}
console.timeEnd('With pool × 10000');

console.time('Without pool × 10000');
for (let i = 0; i < 10000; i++) {
  const buf = Buffer.allocUnsafe(4096);
  buf[0] = i & 0xFF;
}
console.timeEnd('Without pool × 10000');

console.log('');

// 6. Efficient binary encoding
console.log('6. Encoding Strategy Comparison');

const data = { id: 12345, value: 42.5, name: 'Test' };

// JSON
console.time('JSON encoding × 10000');
for (let i = 0; i < 10000; i++) {
  JSON.stringify(data);
}
console.timeEnd('JSON encoding × 10000');

// Binary
function encodeBinary(obj) {
  const nameBuf = Buffer.from(obj.name);
  const buf = Buffer.alloc(13 + nameBuf.length);
  buf.writeUInt32LE(obj.id, 0);
  buf.writeFloatLE(obj.value, 4);
  buf.writeUInt8(nameBuf.length, 8);
  nameBuf.copy(buf, 9);
  return buf;
}

console.time('Binary encoding × 10000');
for (let i = 0; i < 10000; i++) {
  encodeBinary(data);
}
console.timeEnd('Binary encoding × 10000');

const jsonSize = Buffer.byteLength(JSON.stringify(data));
const binarySize = encodeBinary(data).length;
console.log(`Size: JSON=${jsonSize} bytes, Binary=${binarySize} bytes`);
console.log('');

// 7. Profiling utilities
console.log('7. Profiling Utilities');

class BufferProfiler {
  constructor() {
    this.allocations = 0;
    this.deallocations = 0;
    this.bytesAllocated = 0;
    this.times = [];
  }

  trackAllocation(size) {
    const start = process.hrtime.bigint();
    const buf = Buffer.allocUnsafe(size);
    const end = process.hrtime.bigint();

    this.allocations++;
    this.bytesAllocated += size;
    this.times.push(Number(end - start));

    return buf;
  }

  getStats() {
    const avgTime = this.times.reduce((a, b) => a + b, 0) / this.times.length;
    return {
      allocations: this.allocations,
      totalBytes: this.bytesAllocated,
      avgTimeNs: avgTime,
      avgTimeMicro: (avgTime / 1000).toFixed(2)
    };
  }
}

const profiler = new BufferProfiler();

for (let i = 0; i < 1000; i++) {
  profiler.trackAllocation(4096);
}

console.log('Profiler stats:', profiler.getStats());
console.log('');

// 8. Optimization guidelines
console.log('8. Optimization Guidelines');

console.log('Allocation:');
console.log('  ✓ Use allocUnsafe() when you fill immediately');
console.log('  ✓ Pool buffers for high-frequency operations');
console.log('  ✓ Pre-allocate if size is known');
console.log('');

console.log('Concatenation:');
console.log('  ✓ Collect parts, concat once');
console.log('  ✓ Pre-calculate total size');
console.log('  ✗ Avoid repeated Buffer.concat()');
console.log('');

console.log('Reading/Writing:');
console.log('  ✓ Use TypedArray for bulk numeric ops');
console.log('  ✓ Use Buffer methods for mixed data');
console.log('  ✓ Reuse offset variable');
console.log('');

console.log('String Operations:');
console.log('  ✓ Convert partial buffers when possible');
console.log('  ✓ Cache byteLength calculations');
console.log('  ✗ Avoid repeated toString() calls');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ allocUnsafe() faster than alloc()');
console.log('✓ Collect + concat once vs repeated concat');
console.log('✓ TypedArray for bulk numeric operations');
console.log('✓ Buffer pooling for high-frequency use');
console.log('✓ Binary encoding smaller and faster than JSON');
console.log('✓ Profile to find actual bottlenecks');
