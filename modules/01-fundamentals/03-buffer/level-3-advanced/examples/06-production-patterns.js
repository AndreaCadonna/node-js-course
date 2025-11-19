/**
 * Example 6: Production Patterns
 *
 * Demonstrates production-ready patterns for error handling,
 * logging, testing, and deployment.
 */

console.log('=== Production Patterns ===\n');

// 1. Error handling
console.log('1. Robust Error Handling');

class BinaryParser {
  constructor() {
    this.errors = [];
  }

  parse(buffer) {
    try {
      return this.parseInternal(buffer);
    } catch (err) {
      this.logError('Parse error', err, { bufferLength: buffer.length });
      throw new Error(`Failed to parse buffer: ${err.message}`);
    }
  }

  parseInternal(buffer) {
    // Validate
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('Input must be a Buffer');
    }

    if (buffer.length < 8) {
      throw new RangeError('Buffer too small');
    }

    // Parse with error context
    try {
      const type = buffer.readUInt32BE(0);
      const length = buffer.readUInt32BE(4);

      if (length > buffer.length - 8) {
        throw new RangeError('Invalid length field');
      }

      return { type, length };
    } catch (err) {
      err.buffer = buffer.toString('hex').substring(0, 40);
      throw err;
    }
  }

  logError(message, error, context) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message,
      error: error.message,
      stack: error.stack,
      context
    };
    this.errors.push(errorInfo);
    console.error('ERROR:', JSON.stringify(errorInfo, null, 2));
  }
}

const parser = new BinaryParser();

try {
  parser.parse('not a buffer');
} catch (err) {
  console.log('Caught:', err.message);
}

try {
  parser.parse(Buffer.from([1, 2]));
} catch (err) {
  console.log('Caught:', err.message);
}

console.log('Total errors logged:', parser.errors.length);
console.log('');

// 2. Logging and debugging
console.log('2. Debug Logging Utilities');

class BufferLogger {
  static hexDump(buffer, maxBytes = 64) {
    const bytes = buffer.slice(0, maxBytes);
    const hex = bytes.toString('hex').match(/.{1,2}/g).join(' ');
    const ascii = Array.from(bytes)
      .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
      .join('');

    return {
      hex,
      ascii,
      length: buffer.length,
      truncated: buffer.length > maxBytes
    };
  }

  static logOperation(operation, buffer, details = {}) {
    console.log('─'.repeat(50));
    console.log(`Operation: ${operation}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Buffer length: ${buffer.length} bytes`);

    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
      });
    }

    const dump = this.hexDump(buffer, 32);
    console.log(`Hex: ${dump.hex}`);
    console.log(`ASCII: ${dump.ascii}`);
    if (dump.truncated) console.log('(truncated)');
    console.log('─'.repeat(50));
  }
}

const testData = Buffer.from('Hello, Production!');
BufferLogger.logOperation('TEST', testData, { operation: 'parse', version: 1 });
console.log('');

// 3. Buffer validation middleware
console.log('3. Validation Middleware Pattern');

class BufferValidator {
  constructor() {
    this.validators = [];
  }

  use(validator) {
    this.validators.push(validator);
    return this;
  }

  validate(buffer) {
    const results = [];

    for (const validator of this.validators) {
      try {
        validator(buffer);
        results.push({ validator: validator.name, passed: true });
      } catch (err) {
        results.push({
          validator: validator.name,
          passed: false,
          error: err.message
        });
        throw err; // Fail fast
      }
    }

    return results;
  }
}

// Define validators
function validateSize(buffer) {
  if (buffer.length < 8 || buffer.length > 1024) {
    throw new Error('Invalid size');
  }
}

function validateMagic(buffer) {
  if (buffer.readUInt32BE(0) !== 0xCAFEBABE) {
    throw new Error('Invalid magic number');
  }
}

function validateChecksum(buffer) {
  const checksum = buffer.readUInt16BE(buffer.length - 2);
  if (checksum === 0) {
    throw new Error('Invalid checksum');
  }
}

const validator = new BufferValidator();
validator
  .use(validateSize)
  .use(validateMagic)
  .use(validateChecksum);

const validBuffer = Buffer.alloc(10);
validBuffer.writeUInt32BE(0xCAFEBABE, 0);
validBuffer.writeUInt16BE(1234, 8);

try {
  const results = validator.validate(validBuffer);
  console.log('Validation passed:', results);
} catch (err) {
  console.log('Validation failed:', err.message);
}
console.log('');

// 4. Resource management
console.log('4. Resource Management with Cleanup');

class ManagedBufferPool {
  constructor(bufferSize, maxPoolSize) {
    this.bufferSize = bufferSize;
    this.maxPoolSize = maxPoolSize;
    this.available = [];
    this.inUse = new Set();
    this.stats = { acquired: 0, released: 0, leaked: 0 };
  }

  acquire() {
    let buffer;

    if (this.available.length > 0) {
      buffer = this.available.pop();
    } else {
      buffer = Buffer.allocUnsafe(this.bufferSize);
    }

    this.inUse.add(buffer);
    this.stats.acquired++;

    return buffer;
  }

  release(buffer) {
    if (!this.inUse.has(buffer)) {
      console.warn('Releasing buffer not from this pool');
      return;
    }

    this.inUse.delete(buffer);
    this.stats.released++;

    if (this.available.length < this.maxPoolSize) {
      buffer.fill(0);
      this.available.push(buffer);
    }
  }

  cleanup() {
    const leaked = this.inUse.size;
    if (leaked > 0) {
      console.warn(`Cleaning up ${leaked} unreleased buffers`);
      this.stats.leaked += leaked;
      this.inUse.clear();
    }
  }

  getHealth() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      stats: this.stats,
      leaked: this.stats.acquired - this.stats.released
    };
  }
}

const managedPool = new ManagedBufferPool(1024, 10);

// Acquire and forget to release (leak)
managedPool.acquire();
managedPool.acquire();

console.log('Before cleanup:', managedPool.getHealth());
managedPool.cleanup();
console.log('After cleanup:', managedPool.getHealth());
console.log('');

// 5. Testing utilities
console.log('5. Testing Utilities');

class BufferTestUtils {
  static createRandom(size) {
    return require('crypto').randomBytes(size);
  }

  static createPattern(size, pattern) {
    const buf = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buf[i] = pattern[i % pattern.length];
    }
    return buf;
  }

  static assertEqual(buf1, buf2, message = 'Buffers should be equal') {
    if (!buf1.equals(buf2)) {
      throw new Error(`${message}: ${buf1.toString('hex')} !== ${buf2.toString('hex')}`);
    }
  }

  static assertThrows(fn, errorType = Error, message = 'Should throw') {
    try {
      fn();
      throw new Error(message + ' but did not throw');
    } catch (err) {
      if (!(err instanceof errorType)) {
        throw new Error(`${message} ${errorType.name} but threw ${err.constructor.name}`);
      }
    }
  }
}

// Test examples
const buf1 = BufferTestUtils.createPattern(10, [0xAA, 0xBB]);
const buf2 = BufferTestUtils.createPattern(10, [0xAA, 0xBB]);

BufferTestUtils.assertEqual(buf1, buf2);
console.log('✓ Pattern buffers are equal');

BufferTestUtils.assertThrows(() => {
  safeRead(Buffer.alloc(5), 10);
}, RangeError);
console.log('✓ Out of bounds throws RangeError');
console.log('');

// 6. Monitoring and metrics
console.log('6. Metrics Collection');

class BufferMetrics {
  constructor() {
    this.reset();
  }

  reset() {
    this.operations = {
      allocations: 0,
      reads: 0,
      writes: 0,
      copies: 0
    };
    this.bytes = {
      allocated: 0,
      read: 0,
      written: 0,
      copied: 0
    };
    this.errors = 0;
  }

  recordAllocation(size) {
    this.operations.allocations++;
    this.bytes.allocated += size;
  }

  recordRead(size) {
    this.operations.reads++;
    this.bytes.read += size;
  }

  recordWrite(size) {
    this.operations.writes++;
    this.bytes.written += size;
  }

  recordError() {
    this.errors++;
  }

  getReport() {
    return {
      operations: this.operations,
      bytes: this.bytes,
      errors: this.errors,
      avgAllocationSize: this.bytes.allocated / this.operations.allocations || 0
    };
  }
}

const metrics = new BufferMetrics();

// Simulate operations
metrics.recordAllocation(1024);
metrics.recordAllocation(2048);
metrics.recordWrite(512);
metrics.recordRead(256);
metrics.recordError();

console.log('Metrics report:', metrics.getReport());
console.log('');

// 7. Configuration management
console.log('7. Configuration Management');

class BufferConfig {
  static get defaults() {
    return {
      maxBufferSize: 1024 * 1024, // 1MB
      poolSize: 50,
      enableLogging: false,
      validateInputs: true,
      clearOnRelease: true
    };
  }

  static create(overrides = {}) {
    return { ...this.defaults, ...overrides };
  }

  static validate(config) {
    const errors = [];

    if (config.maxBufferSize <= 0) {
      errors.push('maxBufferSize must be positive');
    }

    if (config.poolSize < 0) {
      errors.push('poolSize cannot be negative');
    }

    return errors;
  }
}

const config = BufferConfig.create({ poolSize: 100, enableLogging: true });
console.log('Config:', config);

const configErrors = BufferConfig.validate(config);
console.log('Config valid:', configErrors.length === 0);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Comprehensive error handling with context');
console.log('✓ Debug logging for troubleshooting');
console.log('✓ Validation middleware pattern');
console.log('✓ Resource cleanup to prevent leaks');
console.log('✓ Testing utilities for reliability');
console.log('✓ Metrics for monitoring');
console.log('✓ Configuration management');
console.log('⚠️  Production requires all of these!');
