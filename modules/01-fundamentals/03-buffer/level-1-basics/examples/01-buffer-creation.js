/**
 * Example 1: Buffer Creation
 *
 * Demonstrates the three main ways to create buffers:
 * 1. Buffer.alloc() - Safe, initialized with zeros
 * 2. Buffer.from() - From existing data
 * 3. Buffer.allocUnsafe() - Fast but uninitialized
 */

console.log('=== Buffer Creation Examples ===\n');

// 1. Buffer.alloc() - Safe allocation
console.log('1. Buffer.alloc() - Safe allocation');
const buf1 = Buffer.alloc(10);
console.log('Buffer.alloc(10):', buf1);
console.log('All bytes are zero:', buf1.every(b => b === 0));

// Pre-fill with a value
const buf2 = Buffer.alloc(5, 0xFF);
console.log('Buffer.alloc(5, 0xFF):', buf2);
console.log('');

// 2. Buffer.from() - From string
console.log('2. Buffer.from() - From string');
const buf3 = Buffer.from('Hello World', 'utf8');
console.log('Buffer.from("Hello World"):', buf3);
console.log('As hex:', buf3.toString('hex'));
console.log('Back to string:', buf3.toString('utf8'));
console.log('');

// From array
console.log('3. Buffer.from() - From array');
const buf4 = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
console.log('Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]):', buf4);
console.log('As string:', buf4.toString());
console.log('');

// From another buffer (creates a copy)
console.log('4. Buffer.from() - Copy buffer');
const original = Buffer.from('Original');
const copy = Buffer.from(original);
copy[0] = 0x4D; // Change to 'M'
console.log('Original:', original.toString());
console.log('Copy:', copy.toString());
console.log('');

// 3. Buffer.allocUnsafe() - Fast but dangerous
console.log('5. Buffer.allocUnsafe() - Uninitialized memory');
const buf5 = Buffer.allocUnsafe(10);
console.log('Uninitialized buffer:', buf5);
console.log('⚠️  May contain old data from memory!');
console.log('');

// Safe usage: fill immediately
const buf6 = Buffer.allocUnsafe(10);
buf6.fill(0);
console.log('After fill(0):', buf6);
console.log('');

// 4. Pre-filling with strings
console.log('6. Pre-filling with repeating pattern');
const buf7 = Buffer.alloc(10, 'ab');
console.log('Buffer.alloc(10, "ab"):', buf7);
console.log('As string:', buf7.toString());
console.log('Pattern repeats: a b a b a b a b a b');
console.log('');

// 5. Creating from base64
console.log('7. Creating from base64 encoded string');
const base64String = 'SGVsbG8gV29ybGQ=';
const buf8 = Buffer.from(base64String, 'base64');
console.log('Base64:', base64String);
console.log('Decoded:', buf8.toString('utf8'));
console.log('');

// 6. Creating from hex string
console.log('8. Creating from hex string');
const hexString = '48656c6c6f';
const buf9 = Buffer.from(hexString, 'hex');
console.log('Hex:', hexString);
console.log('Decoded:', buf9.toString('utf8'));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Buffer.alloc(size) - Safe, filled with zeros');
console.log('✓ Buffer.from(data) - From existing data');
console.log('✓ Buffer.allocUnsafe(size) - Fast, must fill before use');
console.log('⚠️  Never use: new Buffer() (deprecated)');
