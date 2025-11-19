/**
 * Example 2: String to Buffer Conversion
 *
 * Demonstrates converting between strings and buffers
 * with different encodings.
 */

console.log('=== String to Buffer Conversion ===\n');

// 1. Basic conversion
console.log('1. Basic UTF-8 conversion');
const text = 'Hello World';
const buffer = Buffer.from(text, 'utf8');
console.log('String:', text);
console.log('Buffer:', buffer);
console.log('Back to string:', buffer.toString('utf8'));
console.log('');

// 2. Different encodings
console.log('2. Same string, different encodings');
const str = 'Hello';

const utf8 = Buffer.from(str, 'utf8');
const ascii = Buffer.from(str, 'ascii');
const hex = Buffer.from(str).toString('hex');
const base64 = Buffer.from(str).toString('base64');

console.log('UTF-8:', utf8, '→', utf8.length, 'bytes');
console.log('ASCII:', ascii, '→', ascii.length, 'bytes');
console.log('As Hex:', hex);
console.log('As Base64:', base64);
console.log('');

// 3. Multi-byte characters
console.log('3. Unicode characters (multi-byte)');
const emoji = 'Hello 😀';
const emojiBuf = Buffer.from(emoji, 'utf8');

console.log('String:', emoji);
console.log('String length:', emoji.length, 'characters');
console.log('Buffer length:', emojiBuf.length, 'bytes');
console.log('Byte breakdown:');
console.log('  "Hello " = 6 bytes');
console.log('  "😀" = 4 bytes (UTF-8)');
console.log('');

// 4. Language examples
console.log('4. Different languages');
const languages = {
  English: 'Hello',
  Spanish: 'Hola',
  Chinese: '你好',
  Japanese: 'こんにちは',
  Arabic: 'مرحبا',
  Russian: 'Привет'
};

Object.entries(languages).forEach(([lang, text]) => {
  const buf = Buffer.from(text, 'utf8');
  console.log(`${lang.padEnd(10)}: ${text.padEnd(15)} → ${buf.length} bytes`);
});
console.log('');

// 5. Buffer.byteLength() vs string.length
console.log('5. String length vs Byte length');
const testStrings = [
  'A',           // 1 char, 1 byte
  'é',           // 1 char, 2 bytes
  '中',          // 1 char, 3 bytes
  '😀',          // 2 chars (JS), 4 bytes
  'Hello 世界'   // Mixed
];

testStrings.forEach(str => {
  const byteLen = Buffer.byteLength(str, 'utf8');
  console.log(`"${str}"`);
  console.log(`  String length: ${str.length}`);
  console.log(`  Byte length: ${byteLen}`);
  console.log('');
});

// 6. Encoding/Decoding cycle
console.log('6. Encoding and decoding cycle');
const original = 'Node.js Buffers';
console.log('Original:', original);

// Encode to buffer
const encoded = Buffer.from(original, 'utf8');
console.log('Encoded to buffer:', encoded);

// Decode back to string
const decoded = encoded.toString('utf8');
console.log('Decoded back:', decoded);
console.log('Match:', original === decoded);
console.log('');

// 7. Partial conversion
console.log('7. Partial buffer to string');
const longText = Buffer.from('Hello World, this is a test!');
console.log('Full:', longText.toString());
console.log('First 5:', longText.toString('utf8', 0, 5));
console.log('Bytes 6-11:', longText.toString('utf8', 6, 11));
console.log('');

// 8. Handling encoding errors
console.log('8. Encoding limitations');
try {
  // ASCII can only handle 0-127
  const chinese = '你好';
  const asciiBuf = Buffer.from(chinese, 'ascii');
  console.log('Chinese as ASCII:', asciiBuf);
  console.log('Decoded:', asciiBuf.toString('ascii'));
  console.log('⚠️  Data lost! Use UTF-8 for non-ASCII text');
} catch (err) {
  console.log('Error:', err.message);
}
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Use Buffer.from(string, encoding) to convert string → buffer');
console.log('✓ Use buffer.toString(encoding) to convert buffer → string');
console.log('✓ UTF-8 is the default and supports all characters');
console.log('✓ Use Buffer.byteLength() for accurate byte count');
console.log('⚠️  String length ≠ Buffer length for multi-byte characters');
