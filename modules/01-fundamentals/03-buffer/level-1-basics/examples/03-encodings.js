/**
 * Example 3: Character Encodings
 *
 * Demonstrates different character encodings and their use cases.
 */

console.log('=== Character Encodings ===\n');

// 1. UTF-8 (Universal, default)
console.log('1. UTF-8 - Universal encoding');
const utf8Text = 'Hello 世界 🌍';
const utf8Buf = Buffer.from(utf8Text, 'utf8');
console.log('Text:', utf8Text);
console.log('UTF-8 buffer:', utf8Buf);
console.log('Bytes:', utf8Buf.length);
console.log('Breakdown:');
console.log('  "Hello " = 6 bytes (1 each)');
console.log('  "世" = 3 bytes');
console.log('  "界" = 3 bytes');
console.log('  " " = 1 byte');
console.log('  "🌍" = 4 bytes');
console.log('');

// 2. ASCII (Basic English only)
console.log('2. ASCII - Basic English (0-127)');
const asciiText = 'Hello World 123';
const asciiBuf = Buffer.from(asciiText, 'ascii');
console.log('Text:', asciiText);
console.log('ASCII buffer:', asciiBuf);
console.log('Each character = 1 byte');
console.log('');

// ASCII limitations
console.log('ASCII limitations:');
const nonAscii = 'Café'; // é is not ASCII
const asciiBuf2 = Buffer.from(nonAscii, 'ascii');
console.log('Original:', nonAscii);
console.log('As ASCII:', asciiBuf2.toString('ascii'));
console.log('⚠️  Lost the accent on "é"');
console.log('');

// 3. Latin1 (Western European)
console.log('3. Latin1 - Western European');
const latin1Text = 'Café, résumé, naïve';
const latin1Buf = Buffer.from(latin1Text, 'latin1');
console.log('Text:', latin1Text);
console.log('Latin1 buffer:', latin1Buf);
console.log('Supports accented characters');
console.log('');

// 4. Base64 (Binary to Text)
console.log('4. Base64 - Encoding binary as text');
const binaryData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG header
console.log('Binary data:', binaryData);
const base64 = binaryData.toString('base64');
console.log('As Base64:', base64);

const decoded = Buffer.from(base64, 'base64');
console.log('Decoded back:', decoded);
console.log('Match:', binaryData.equals(decoded));
console.log('Use case: Embedding images in JSON/XML');
console.log('');

// 5. Hex (Hexadecimal)
console.log('5. Hex - Human-readable binary');
const data = Buffer.from('Node.js');
console.log('Text:', 'Node.js');
const hexString = data.toString('hex');
console.log('As Hex:', hexString);

// Parse back
const fromHex = Buffer.from(hexString, 'hex');
console.log('Parsed back:', fromHex.toString());
console.log('Use case: Debugging, color codes, hashes');
console.log('');

// 6. Encoding comparison
console.log('6. Size comparison for different encodings');
const testText = 'Hello';
console.log('Text:', testText);

const encodings = ['utf8', 'ascii', 'latin1', 'base64', 'hex'];
encodings.forEach(enc => {
  if (enc === 'base64' || enc === 'hex') {
    // These are text representations of binary
    const encoded = Buffer.from(testText).toString(enc);
    console.log(`${enc.padEnd(10)}: ${encoded} (${encoded.length} chars)`);
  } else {
    const buf = Buffer.from(testText, enc);
    console.log(`${enc.padEnd(10)}: ${buf.length} bytes`);
  }
});
console.log('');

// 7. Real-world use cases
console.log('7. Real-world encoding use cases\n');

// Use case 1: API response with image
console.log('Use case 1: Sending binary data in JSON');
const imageData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG signature
const apiResponse = {
  filename: 'image.png',
  data: imageData.toString('base64')
};
console.log('API Response:', JSON.stringify(apiResponse, null, 2));
console.log('');

// Use case 2: Color codes
console.log('Use case 2: Color codes');
const red = Buffer.from([0xFF, 0x00, 0x00]);
const green = Buffer.from([0x00, 0xFF, 0x00]);
const blue = Buffer.from([0x00, 0x00, 0xFF]);

console.log('Red:', '#' + red.toString('hex').toUpperCase());
console.log('Green:', '#' + green.toString('hex').toUpperCase());
console.log('Blue:', '#' + blue.toString('hex').toUpperCase());
console.log('');

// Use case 3: Password hashing (hex representation)
console.log('Use case 3: Hash representation');
const crypto = require('crypto');
const password = 'myPassword123';
const hash = crypto.createHash('sha256').update(password).digest();
console.log('Password:', password);
console.log('SHA-256 hash (hex):', hash.toString('hex'));
console.log('SHA-256 hash (base64):', hash.toString('base64'));
console.log('');

// 8. Encoding conversion
console.log('8. Converting between encodings');
const text = 'Hello World';
console.log('Original:', text);

// UTF-8 → Base64 → UTF-8
const step1 = Buffer.from(text, 'utf8');
console.log('1. UTF-8 buffer:', step1);

const step2 = step1.toString('base64');
console.log('2. As Base64:', step2);

const step3 = Buffer.from(step2, 'base64');
console.log('3. Back to buffer:', step3);

const step4 = step3.toString('utf8');
console.log('4. Back to string:', step4);
console.log('Final matches original:', text === step4);
console.log('');

// Summary
console.log('=== Encoding Summary ===');
console.log('');
console.log('Text Encodings:');
console.log('  utf8     - Universal, 1-4 bytes per char (default)');
console.log('  ascii    - Basic English, 1 byte per char (0-127)');
console.log('  latin1   - Western European, 1 byte per char (0-255)');
console.log('  utf16le  - Windows/Java, 2-4 bytes per char');
console.log('');
console.log('Binary Representations:');
console.log('  base64   - Binary → Text (emails, JSON, URLs)');
console.log('  hex      - Binary → Hexadecimal (debugging, hashes)');
console.log('');
console.log('When to use:');
console.log('  ✓ UTF-8: Default choice (supports everything)');
console.log('  ✓ Base64: Embedding binary in text formats');
console.log('  ✓ Hex: Debugging, color codes, hashes');
console.log('  ✓ ASCII: Legacy systems, pure English text');
