/**
 * Example 7: Text Encoding and Decoding
 *
 * Learn how to encode text to bytes and decode bytes back to text using
 * TextEncoder and TextDecoder. These match the Web API standards.
 *
 * Key Concepts:
 * - Encoding text to Uint8Array (bytes)
 * - Decoding bytes back to text
 * - Understanding UTF-8 encoding
 * - Working with different encodings
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Text Encoding =====
console.log('=== Example 1: Basic Text Encoding ===\n');

// Create a TextEncoder (always UTF-8)
const encoder = new util.TextEncoder();

// Encode a simple string
const text = 'Hello, World!';
const bytes = encoder.encode(text);

console.log('Original text:', text);
console.log('Encoded bytes:', bytes);
console.log('Byte length:', bytes.length);
console.log('Type:', bytes.constructor.name);

// Show individual bytes
console.log('\nIndividual bytes:');
for (let i = 0; i < Math.min(bytes.length, 10); i++) {
  console.log(`  [${i}]: ${bytes[i]} (0x${bytes[i].toString(16)}) = '${text[i]}'`);
}

// ===== EXAMPLE 2: Basic Text Decoding =====
console.log('\n=== Example 2: Basic Text Decoding ===\n');

// Create a TextDecoder (default UTF-8)
const decoder = new util.TextDecoder();

// Decode the bytes back to text
const decoded = decoder.decode(bytes);

console.log('Decoded text:', decoded);
console.log('Matches original:', decoded === text);

// ===== EXAMPLE 3: Unicode and Emojis =====
console.log('\n=== Example 3: Unicode and Emojis ===\n');

const unicodeText = 'Hello 👋 World 🌍';
const unicodeBytes = encoder.encode(unicodeText);

console.log('Text:', unicodeText);
console.log('String length:', unicodeText.length);  // JavaScript length
console.log('Byte length:', unicodeBytes.length);   // Actual UTF-8 bytes

console.log('\nBreakdown:');
console.log('- "Hello " = 6 characters, 6 bytes');
console.log('- "👋" = 2 JS length, 4 bytes (UTF-8)');
console.log('- " World " = 7 characters, 7 bytes');
console.log('- "🌍" = 2 JS length, 4 bytes (UTF-8)');
console.log('Total: ' + unicodeText.length + ' JS length, ' + unicodeBytes.length + ' bytes');

// Decode back
const decodedUnicode = decoder.decode(unicodeBytes);
console.log('\nDecoded:', decodedUnicode);
console.log('Matches:', decodedUnicode === unicodeText);

// ===== EXAMPLE 4: Different Languages =====
console.log('\n=== Example 4: Different Languages ===\n');

const languages = {
  english: 'Hello',
  spanish: 'Hola',
  chinese: '你好',
  arabic: 'مرحبا',
  russian: 'Привет',
  japanese: 'こんにちは'
};

console.log('Text encoding across languages:\n');
Object.entries(languages).forEach(([lang, text]) => {
  const bytes = encoder.encode(text);
  console.log(`${lang}:`);
  console.log(`  Text: ${text}`);
  console.log(`  Char length: ${text.length}`);
  console.log(`  Byte length: ${bytes.length}`);
  console.log(`  Decoded: ${decoder.decode(bytes)}`);
  console.log();
});

// ===== EXAMPLE 5: Partial Decoding =====
console.log('=== Example 5: Partial Byte Sequence Decoding ===\n');

const longText = 'This is a longer text for partial decoding demonstration';
const allBytes = encoder.encode(longText);

// Decode in chunks
const chunkSize = 20;
console.log('Original:', longText);
console.log('\nDecoding in chunks of', chunkSize, 'bytes:');

for (let i = 0; i < allBytes.length; i += chunkSize) {
  const chunk = allBytes.slice(i, i + chunkSize);
  const decoded = decoder.decode(chunk, { stream: true });
  console.log(`Chunk ${Math.floor(i / chunkSize) + 1}:`, decoded);
}

// Final decode (flush remaining bytes)
const final = decoder.decode();
console.log('Final:', final);

// ===== EXAMPLE 6: Encoding Options =====
console.log('\n=== Example 6: Decoder with Different Encodings ===\n');

// TextDecoder supports various encodings
const encodings = ['utf-8', 'utf-16le', 'iso-8859-1'];

const testText = 'Test';
const utf8Bytes = encoder.encode(testText);

console.log('Decoding UTF-8 bytes with different decoders:\n');

encodings.forEach(encoding => {
  try {
    const decoder = new util.TextDecoder(encoding);
    const decoded = decoder.decode(utf8Bytes);
    console.log(`${encoding}:`, decoded);
  } catch (err) {
    console.log(`${encoding}: Error -`, err.message);
  }
});

// ===== EXAMPLE 7: Handling Errors =====
console.log('\n=== Example 7: Handling Invalid Byte Sequences ===\n');

// Create invalid UTF-8 sequence
const invalidBytes = new Uint8Array([0xFF, 0xFE, 0xFD]);

// Default: replaces invalid sequences with �
const decoderDefault = new util.TextDecoder();
console.log('Default (replacement):', decoderDefault.decode(invalidBytes));

// Fatal mode: throws on invalid sequences
try {
  const decoderFatal = new util.TextDecoder('utf-8', { fatal: true });
  const result = decoderFatal.decode(invalidBytes);
  console.log('Fatal mode:', result);
} catch (err) {
  console.log('Fatal mode error:', err.message);
}

// ===== EXAMPLE 8: Practical Use Case - Binary Protocol =====
console.log('\n=== Example 8: Binary Protocol with Text ===\n');

// Simulate a simple protocol: [length][text]
function encodeMessage(message) {
  const encoder = new util.TextEncoder();
  const textBytes = encoder.encode(message);

  // Create buffer with length prefix (4 bytes) + text
  const buffer = new Uint8Array(4 + textBytes.length);

  // Write length as 32-bit integer
  const view = new DataView(buffer.buffer);
  view.setUint32(0, textBytes.length, true);  // little-endian

  // Write text bytes
  buffer.set(textBytes, 4);

  return buffer;
}

function decodeMessage(buffer) {
  // Read length
  const view = new DataView(buffer.buffer);
  const length = view.getUint32(0, true);

  // Extract text bytes
  const textBytes = buffer.slice(4, 4 + length);

  // Decode text
  const decoder = new util.TextDecoder();
  return decoder.decode(textBytes);
}

const message = 'Hello, Protocol!';
console.log('Original message:', message);

const encoded = encodeMessage(message);
console.log('Encoded (length + text):', encoded);
console.log('Total bytes:', encoded.length);

const decoded = decodeMessage(encoded);
console.log('Decoded message:', decoded);
console.log('Matches:', decoded === message);

// ===== EXAMPLE 9: Comparison with Buffer =====
console.log('\n=== Example 9: TextEncoder vs Buffer ===\n');

const compareText = 'Hello, Buffer!';

// Using TextEncoder
const encoderBytes = encoder.encode(compareText);
console.log('TextEncoder:');
console.log('  Type:', encoderBytes.constructor.name);
console.log('  Bytes:', encoderBytes);

// Using Buffer
const bufferBytes = Buffer.from(compareText, 'utf8');
console.log('\nBuffer:');
console.log('  Type:', bufferBytes.constructor.name);
console.log('  Bytes:', bufferBytes);

// They're compatible!
console.log('\nAre they similar?');
console.log('  Same length:', encoderBytes.length === bufferBytes.length);
console.log('  Same values:', encoderBytes.every((b, i) => b === bufferBytes[i]));

/**
 * Important Notes:
 *
 * 1. TextEncoder:
 *    - Always encodes to UTF-8
 *    - Returns Uint8Array
 *    - Matches Web API standard
 *    - No encoding parameter
 *
 * 2. TextDecoder:
 *    - Supports multiple encodings
 *    - Default is UTF-8
 *    - Can handle streaming (partial decodes)
 *    - Has fatal mode for error handling
 *
 * 3. Common Encodings:
 *    - utf-8 (default): Universal encoding
 *    - utf-16le: Windows-style encoding
 *    - iso-8859-1: Latin-1 encoding
 *    - (Many others supported)
 *
 * 4. Comparison with Buffer:
 *    - Buffer is Node.js specific
 *    - TextEncoder/Decoder match Web APIs
 *    - Use TextEncoder/Decoder for portability
 *    - Use Buffer for Node.js-specific features
 *
 * 5. UTF-8 Byte Counts:
 *    - ASCII characters: 1 byte each
 *    - Latin extended: 2 bytes
 *    - Most other characters: 3 bytes
 *    - Emojis: usually 4 bytes
 */

/**
 * Try This:
 *
 * 1. Encode a long text file and measure byte size
 * 2. Build a simple text protocol with length prefixes
 * 3. Compare different encoding sizes (UTF-8 vs UTF-16)
 * 4. Handle streaming decoding of large text
 * 5. Create a text compression comparison tool
 */
