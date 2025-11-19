/**
 * Example 8: Practical Buffer Use Cases
 *
 * Real-world examples of buffer usage.
 */

const crypto = require('crypto');

console.log('=== Practical Buffer Use Cases ===\n');

// 1. Base64 encoding for data URLs
console.log('1. Creating Data URLs for images');

function createDataURL(imageBuffer, mimeType) {
  const base64 = imageBuffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

// Simulated small image (4 pixel, 1-bit monochrome)
const tinyImage = Buffer.from([
  0x42, 0x4D,             // BMP signature
  0x3E, 0x00, 0x00, 0x00, // File size
  0x00, 0x00, 0x00, 0x00, // Reserved
  0x3E, 0x00, 0x00, 0x00  // Pixel data offset
]);

const dataURL = createDataURL(tinyImage, 'image/bmp');
console.log('Data URL:', dataURL.substring(0, 60) + '...');
console.log('Use in HTML: <img src="' + dataURL + '">');
console.log('');

// 2. Password hashing
console.log('2. Password hashing with salt');

function hashPassword(password, salt) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex')
  };
}

function verifyPassword(password, hashHex, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const storedHash = Buffer.from(hashHex, 'hex');
  const inputHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return crypto.timingSafeEqual(storedHash, inputHash);
}

const password = 'mySecurePassword123';
const salt = crypto.randomBytes(16);

console.log('Password:', password);
const { hash, salt: saltHex } = hashPassword(password, salt);
console.log('Salt:', saltHex.substring(0, 20) + '...');
console.log('Hash:', hash.substring(0, 20) + '...');

const isValid = verifyPassword(password, hash, saltHex);
console.log('Verification:', isValid ? '✓ Valid' : '✗ Invalid');

const isInvalid = verifyPassword('wrongPassword', hash, saltHex);
console.log('Wrong password:', isInvalid ? '✓ Valid' : '✗ Invalid');
console.log('');

// 3. Generating random tokens
console.log('3. Generating secure random tokens');

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateURLSafeToken(bytes = 32) {
  return crypto.randomBytes(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

console.log('Hex token:', generateToken(16));
console.log('URL-safe token:', generateURLSafeToken(16));
console.log('Use for: session IDs, API keys, reset tokens');
console.log('');

// 4. Checksums and file integrity
console.log('4. Computing file checksums');

function computeChecksum(data, algorithm = 'sha256') {
  const hash = crypto.createHash(algorithm);
  hash.update(data);
  return hash.digest('hex');
}

const fileData = Buffer.from('Important file contents');
const checksum = computeChecksum(fileData);

console.log('Data:', fileData.toString());
console.log('SHA-256:', checksum);
console.log('Use for: Verifying downloads, detecting corruption');
console.log('');

// Verify integrity
const receivedData = Buffer.from('Important file contents');
const receivedChecksum = computeChecksum(receivedData);
console.log('Integrity check:', checksum === receivedChecksum ? '✓ Valid' : '✗ Corrupted');
console.log('');

// 5. Simple encryption/decryption
console.log('5. Symmetric encryption (AES)');

function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encrypted
  };
}

function decrypt(encrypted, key, ivHex) {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const secretKey = crypto.randomBytes(32); // 256-bit key
const plaintext = 'Secret message';

console.log('Plaintext:', plaintext);
const { iv, encrypted } = encrypt(plaintext, secretKey);
console.log('Encrypted:', encrypted.substring(0, 20) + '...');
console.log('IV:', iv);

const decrypted = decrypt(encrypted, secretKey, iv);
console.log('Decrypted:', decrypted);
console.log('Match:', plaintext === decrypted);
console.log('');

// 6. UUID generation
console.log('6. Generating UUIDs');

function generateUUID() {
  const bytes = crypto.randomBytes(16);

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

console.log('UUID v4:', generateUUID());
console.log('UUID v4:', generateUUID());
console.log('UUID v4:', generateUUID());
console.log('Use for: Unique identifiers, database keys');
console.log('');

// 7. Color manipulation
console.log('7. Working with color values');

class Color {
  constructor(r, g, b) {
    this.buffer = Buffer.from([r, g, b]);
  }

  toHex() {
    return '#' + this.buffer.toString('hex').toUpperCase();
  }

  toRGB() {
    return `rgb(${this.buffer[0]}, ${this.buffer[1]}, ${this.buffer[2]})`;
  }

  lighten(amount) {
    for (let i = 0; i < 3; i++) {
      this.buffer[i] = Math.min(255, this.buffer[i] + amount);
    }
    return this;
  }

  static fromHex(hex) {
    const clean = hex.replace('#', '');
    const buffer = Buffer.from(clean, 'hex');
    return new Color(buffer[0], buffer[1], buffer[2]);
  }
}

const red = new Color(255, 0, 0);
console.log('Red:', red.toHex(), red.toRGB());

const lightRed = new Color(255, 0, 0);
lightRed.lighten(50);
console.log('Light red:', lightRed.toHex(), lightRed.toRGB());

const blue = Color.fromHex('#0000FF');
console.log('Blue:', blue.toHex(), blue.toRGB());
console.log('');

// 8. Binary protocol messages
console.log('8. Simple binary protocol');

class Message {
  static encode(type, payload) {
    const header = Buffer.alloc(6);
    const payloadBuf = Buffer.from(payload, 'utf8');

    header.writeUInt16BE(0xCAFE, 0);           // Magic
    header.writeUInt8(type, 2);                 // Type
    header.writeUInt8(0, 3);                    // Flags
    header.writeUInt16BE(payloadBuf.length, 4); // Length

    return Buffer.concat([header, payloadBuf]);
  }

  static decode(buffer) {
    const magic = buffer.readUInt16BE(0);
    if (magic !== 0xCAFE) {
      throw new Error('Invalid message');
    }

    return {
      type: buffer.readUInt8(2),
      flags: buffer.readUInt8(3),
      length: buffer.readUInt16BE(4),
      payload: buffer.toString('utf8', 6)
    };
  }
}

const msg = Message.encode(1, 'Hello, World!');
console.log('Encoded message:', msg);
console.log('Message size:', msg.length, 'bytes');

const decoded = Message.decode(msg);
console.log('Decoded:', decoded);
console.log('');

// 9. Base64 utilities
console.log('9. Base64 encoding utilities');

class Base64 {
  static encode(str) {
    return Buffer.from(str, 'utf8').toString('base64');
  }

  static decode(base64) {
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  static encodeURL(str) {
    return Buffer.from(str, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static decodeURL(base64url) {
    let base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    return Buffer.from(base64, 'base64').toString('utf8');
  }
}

const text = 'Hello, World!';
const encoded = Base64.encode(text);
console.log('Original:', text);
console.log('Base64:', encoded);
console.log('Decoded:', Base64.decode(encoded));
console.log('');

const urlText = 'test@example.com';
const urlEncoded = Base64.encodeURL(urlText);
console.log('URL-safe:', urlEncoded);
console.log('Decoded:', Base64.decodeURL(urlEncoded));
console.log('');

// 10. Memory-efficient string comparison
console.log('10. Secure string comparison');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

const token1 = 'secret-token-123';
const token2 = 'secret-token-123';
const token3 = 'wrong-token-456';

console.log('token1 === token2:', timingSafeEqual(token1, token2));
console.log('token1 === token3:', timingSafeEqual(token1, token3));
console.log('Use for: Comparing passwords, tokens, secrets');
console.log('Prevents timing attacks!');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Base64 for data URLs and binary-in-JSON');
console.log('✓ Crypto operations (hashing, encryption)');
console.log('✓ Random token generation');
console.log('✓ Checksums for file integrity');
console.log('✓ Binary protocols for network communication');
console.log('✓ Color manipulation');
console.log('✓ UUID generation');
console.log('✓ Secure comparison for secrets');
