/**
 * Example 5: Security Considerations
 *
 * Demonstrates buffer security vulnerabilities and safe practices.
 */

console.log('=== Buffer Security ===\n');

// 1. Memory disclosure (allocUnsafe)
console.log('1. Memory Disclosure Risk');

// ❌ DANGEROUS: Uninitialized memory may contain secrets
const unsafeBuf = Buffer.allocUnsafe(20);
console.log('Uninitialized buffer:', unsafeBuf);
console.log('⚠️  May contain previous memory contents!');
console.log('');

// ✅ SAFE: Always initialize or fill
const safeBuf = Buffer.alloc(20); // Zeroed
console.log('Safe (zeroed) buffer:', safeBuf);

const safeBuf2 = Buffer.allocUnsafe(20);
safeBuf2.fill(0); // Explicitly fill
console.log('Safe (filled) buffer:', safeBuf2);
console.log('');

// 2. Buffer overflow/underflow
console.log('2. Buffer Overflow Protection');

function unsafeRead(buffer, offset) {
  // ❌ No bounds checking
  return buffer.readUInt32LE(offset);
}

function safeRead(buffer, offset) {
  // ✅ Validate bounds
  if (offset < 0 || offset + 4 > buffer.length) {
    throw new RangeError('Read out of bounds');
  }
  return buffer.readUInt32LE(offset);
}

const testBuf = Buffer.alloc(10);

try {
  console.log('Unsafe read at offset 20:');
  unsafeRead(testBuf, 20);
} catch (err) {
  console.log('Error:', err.message);
}

try {
  console.log('Safe read at offset 20:');
  safeRead(testBuf, 20);
} catch (err) {
  console.log('Error:', err.message);
}
console.log('');

// 3. Integer overflow in length calculations
console.log('3. Integer Overflow in Lengths');

function unsafeAlloc(userLength) {
  // ❌ No validation
  return Buffer.alloc(userLength);
}

function safeAlloc(userLength) {
  // ✅ Validate input
  if (typeof userLength !== 'number') {
    throw new TypeError('Length must be a number');
  }
  if (userLength < 0) {
    throw new RangeError('Length must be non-negative');
  }
  if (userLength > 1024 * 1024 * 100) { // 100MB limit
    throw new RangeError('Length exceeds maximum');
  }
  return Buffer.alloc(userLength);
}

try {
  safeAlloc(-1);
} catch (err) {
  console.log('Rejected negative length:', err.message);
}

try {
  safeAlloc(1024 * 1024 * 200); // 200MB
} catch (err) {
  console.log('Rejected excessive length:', err.message);
}
console.log('');

// 4. Injection attacks
console.log('4. Command/Path Injection Prevention');

// ❌ VULNERABLE: Unsanitized input
function vulnerableFileRead(userPath) {
  // Attacker could use '../../../etc/passwd'
  const path = `/data/${userPath}`;
  console.log('Reading from:', path);
  return path;
}

// ✅ SAFE: Validate and sanitize
function safeFileRead(userPath) {
  // Remove path traversal
  const sanitized = userPath.replace(/\.\./g, '');

  // Validate allowed characters
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new Error('Invalid path characters');
  }

  const path = `/data/${sanitized}`;
  console.log('Reading from:', path);
  return path;
}

try {
  vulnerableFileRead('../../../etc/passwd');
} catch (err) {
  console.log('Error:', err.message);
}

try {
  safeFileRead('../../../etc/passwd');
} catch (err) {
  console.log('Blocked:', err.message);
}
console.log('');

// 5. Timing attacks
console.log('5. Timing Attack Prevention');

// ❌ VULNERABLE: Early exit reveals information
function vulnerableCompare(buf1, buf2) {
  if (buf1.length !== buf2.length) {
    return false;
  }

  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] !== buf2[i]) {
      return false; // Early exit!
    }
  }

  return true;
}

// ✅ SAFE: Constant-time comparison
function safeCompare(buf1, buf2) {
  if (buf1.length !== buf2.length) {
    return false;
  }

  let mismatch = 0;

  for (let i = 0; i < buf1.length; i++) {
    mismatch |= buf1[i] ^ buf2[i];
  }

  return mismatch === 0;
}

// Node.js built-in (also constant-time)
const crypto = require('crypto');
function cryptoSafeCompare(buf1, buf2) {
  return crypto.timingSafeEqual(buf1, buf2);
}

const secret1 = Buffer.from('secret123');
const secret2 = Buffer.from('secret124');

console.log('Vulnerable compare:', vulnerableCompare(secret1, secret2));
console.log('Safe compare:', safeCompare(secret1, secret2));
console.log('Crypto compare:', cryptoSafeCompare(secret1, secret2));
console.log('');

// 6. Sensitive data handling
console.log('6. Secure Sensitive Data Handling');

class SecureBuffer {
  constructor(size) {
    this.buffer = Buffer.allocUnsafe(size);
    this.buffer.fill(0);
    this.destroyed = false;
  }

  write(data, offset = 0) {
    if (this.destroyed) {
      throw new Error('Buffer has been destroyed');
    }
    data.copy(this.buffer, offset);
  }

  read() {
    if (this.destroyed) {
      throw new Error('Buffer has been destroyed');
    }
    return this.buffer;
  }

  destroy() {
    // Overwrite with random data
    crypto.randomFillSync(this.buffer);
    // Then zero
    this.buffer.fill(0);
    this.destroyed = true;
  }
}

const secureBuf = new SecureBuffer(32);
secureBuf.write(Buffer.from('sensitive password'));
console.log('Stored:', secureBuf.read().toString());

secureBuf.destroy();
console.log('After destroy:', secureBuf.read);

try {
  secureBuf.read();
} catch (err) {
  console.log('Destroyed buffer is inaccessible');
}
console.log('');

// 7. Input validation
console.log('7. Comprehensive Input Validation');

function validateBinaryMessage(buffer) {
  const errors = [];

  // Check minimum size
  if (buffer.length < 8) {
    errors.push('Message too small (minimum 8 bytes)');
  }

  // Check maximum size
  if (buffer.length > 1024 * 1024) {
    errors.push('Message too large (maximum 1MB)');
  }

  // Validate magic number
  if (buffer.length >= 4) {
    const magic = buffer.readUInt32BE(0);
    if (magic !== 0xDEADBEEF) {
      errors.push('Invalid magic number');
    }
  }

  // Validate version
  if (buffer.length >= 5) {
    const version = buffer.readUInt8(4);
    if (version > 1) {
      errors.push('Unsupported version');
    }
  }

  // Validate length field
  if (buffer.length >= 8) {
    const declaredLength = buffer.readUInt16BE(6);
    const actualLength = buffer.length - 8;

    if (declaredLength !== actualLength) {
      errors.push('Length mismatch');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const validMsg = Buffer.alloc(13);
validMsg.writeUInt32BE(0xDEADBEEF, 0);
validMsg.writeUInt8(1, 4);
validMsg.writeUInt16BE(5, 6);
validMsg.write('Hello', 8);

const result = validateBinaryMessage(validMsg);
console.log('Valid message:', result);

const invalidMsg = Buffer.from([1, 2, 3]);
const result2 = validateBinaryMessage(invalidMsg);
console.log('Invalid message:', result2);
console.log('');

// 8. Security checklist
console.log('8. Buffer Security Checklist');

console.log('Allocation:');
console.log('  ✓ Use alloc() or fill allocUnsafe() immediately');
console.log('  ✓ Clear buffers before returning to pool');
console.log('  ✓ Limit maximum allocation size');
console.log('');

console.log('Input Validation:');
console.log('  ✓ Validate all lengths and offsets');
console.log('  ✓ Check magic numbers and versions');
console.log('  ✓ Sanitize file paths and commands');
console.log('  ✓ Set maximum message sizes');
console.log('');

console.log('Comparisons:');
console.log('  ✓ Use crypto.timingSafeEqual() for secrets');
console.log('  ✗ Never early-exit secret comparisons');
console.log('');

console.log('Sensitive Data:');
console.log('  ✓ Overwrite before releasing');
console.log('  ✓ Use constant-time operations');
console.log('  ✓ Clear buffers after use');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Initialize all buffers (or fill immediately)');
console.log('✓ Validate bounds for all read/write operations');
console.log('✓ Limit allocation sizes to prevent DoS');
console.log('✓ Use timingSafeEqual() for secret comparison');
console.log('✓ Sanitize user input for paths/commands');
console.log('✓ Clear sensitive data when done');
console.log('⚠️  Security is not optional in production!');
