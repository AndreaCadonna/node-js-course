/**
 * Basic Encryption and Decryption Examples
 *
 * Demonstrates symmetric encryption using the crypto module.
 * Encryption protects data confidentiality.
 */

const crypto = require('crypto');

console.log('=== Basic Encryption Examples ===\n');

// Example 1: Simple AES-256-CBC Encryption
console.log('1. Simple AES-256-CBC Encryption:');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(16);  // 128 bits

const plaintext = 'This is a secret message';

// Encrypt
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update(plaintext, 'utf8', 'hex');
encrypted += cipher.final('hex');

console.log('Plaintext: ', plaintext);
console.log('Encrypted: ', encrypted);
console.log('Key length:', key.length, 'bytes');
console.log('IV length: ', iv.length, 'bytes');
console.log();

// Example 2: Decryption
console.log('2. Decryption:');
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');

console.log('Encrypted: ', encrypted);
console.log('Decrypted: ', decrypted);
console.log('Match:', plaintext === decrypted ? '✓' : '✗');
console.log();

// Example 3: Encryption Function
console.log('3. Encryption Function:');
function encrypt(text, password) {
  // Derive key from password
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');

  // Encrypt
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Return everything needed for decryption
  return {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex')
  };
}

const password = 'mySecurePassword123';
const message = 'Confidential information';
const encryptedData = encrypt(message, password);

console.log('Original:  ', message);
console.log('Password:  ', password);
console.log('Encrypted: ', encryptedData.encrypted);
console.log('Salt:      ', encryptedData.salt);
console.log('IV:        ', encryptedData.iv);
console.log();

// Example 4: Decryption Function
console.log('4. Decryption Function:');
function decrypt(encrypted, password, salt, iv) {
  // Derive same key from password
  const saltBuffer = Buffer.from(salt, 'hex');
  const key = crypto.pbkdf2Sync(password, saltBuffer, 100000, 32, 'sha512');

  // Decrypt
  const ivBuffer = Buffer.from(iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuffer);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

const decryptedMessage = decrypt(
  encryptedData.encrypted,
  password,
  encryptedData.salt,
  encryptedData.iv
);

console.log('Encrypted: ', encryptedData.encrypted);
console.log('Decrypted: ', decryptedMessage);
console.log('Match:', message === decryptedMessage ? '✓' : '✗');
console.log();

// Example 5: Wrong Password
console.log('5. Wrong Password:');
try {
  const wrongPassword = decrypt(
    encryptedData.encrypted,
    'wrongPassword',
    encryptedData.salt,
    encryptedData.iv
  );
  console.log('Decrypted:', wrongPassword);
} catch (error) {
  console.log('✗ Decryption failed with wrong password');
  console.log('Error:', error.message);
}
console.log();

// Example 6: Different IV = Different Ciphertext
console.log('6. Different IV = Different Ciphertext:');
const testKey = crypto.randomBytes(32);
const testMessage = 'Same message';

function encryptWithIV(text, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const iv1 = crypto.randomBytes(16);
const iv2 = crypto.randomBytes(16);

const encrypted1 = encryptWithIV(testMessage, testKey, iv1);
const encrypted2 = encryptWithIV(testMessage, testKey, iv2);

console.log('Message:    ', testMessage);
console.log('Encrypted 1:', encrypted1);
console.log('Encrypted 2:', encrypted2);
console.log('Different ciphertexts:', encrypted1 !== encrypted2);
console.log('Security: Different IV prevents pattern recognition');
console.log();

// Example 7: Available Cipher Algorithms
console.log('7. Available Cipher Algorithms:');
const ciphers = crypto.getCiphers();
console.log('Total available:', ciphers.length);
console.log('Recommended:', ['aes-256-cbc', 'aes-256-gcm', 'aes-256-ctr']);
console.log('Common AES variants:');
console.log('- aes-128-cbc (128-bit key)');
console.log('- aes-192-cbc (192-bit key)');
console.log('- aes-256-cbc (256-bit key) ← Most secure');
console.log('- aes-256-gcm (with authentication)');
console.log();

// Example 8: Encryption Class
console.log('8. Encryption Class:');
class SimpleEncryption {
  constructor(password) {
    this.password = password;
    this.algorithm = 'aes-256-cbc';
  }

  encrypt(text) {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(this.password, salt, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedData) {
    const [salt, iv, encrypted] = encryptedData.split(':');

    const key = crypto.pbkdf2Sync(
      this.password,
      Buffer.from(salt, 'hex'),
      100000,
      32,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

const encryptor = new SimpleEncryption('masterPassword123');
const secretData = 'Top secret information';
const encryptedSecret = encryptor.encrypt(secretData);
const decryptedSecret = encryptor.decrypt(encryptedSecret);

console.log('Original: ', secretData);
console.log('Encrypted:', encryptedSecret);
console.log('Decrypted:', decryptedSecret);
console.log();

// Example 9: Encrypting JSON Data
console.log('9. Encrypting JSON Data:');
function encryptJSON(obj, password) {
  const json = JSON.stringify(obj);
  return encrypt(json, password);
}

function decryptJSON(encryptedData, password) {
  const json = decrypt(
    encryptedData.encrypted,
    password,
    encryptedData.salt,
    encryptedData.iv
  );
  return JSON.parse(json);
}

const userData = {
  id: 123,
  username: 'john',
  email: 'john@example.com',
  ssn: '123-45-6789'
};

const encryptedUser = encryptJSON(userData, 'encryptionKey123');
console.log('Original:', userData);
console.log('Encrypted:', encryptedUser.encrypted);

const decryptedUser = decryptJSON(encryptedUser, 'encryptionKey123');
console.log('Decrypted:', decryptedUser);
console.log();

// Example 10: File-like Encryption
console.log('10. File-like Encryption Simulation:');
function encryptFile(content, password) {
  const result = encrypt(content, password);

  return {
    metadata: {
      algorithm: 'aes-256-cbc',
      salt: result.salt,
      iv: result.iv,
      encryptedAt: new Date().toISOString()
    },
    data: result.encrypted
  };
}

const fileContent = 'Important document content\nLine 2\nLine 3';
const encryptedFile = encryptFile(fileContent, 'filePassword');

console.log('Encrypted file structure:');
console.log('Metadata:', encryptedFile.metadata);
console.log('Data:', encryptedFile.data.substring(0, 50) + '...');
console.log();

// Example 11: Multiple Encryptions
console.log('11. Multiple Encryptions (same data, different results):');
const data = 'Encrypt me';
const pass = 'password123';

const enc1 = encrypt(data, pass);
const enc2 = encrypt(data, pass);
const enc3 = encrypt(data, pass);

console.log('Original:', data);
console.log('Encryption 1:', enc1.encrypted);
console.log('Encryption 2:', enc2.encrypted);
console.log('Encryption 3:', enc3.encrypted);
console.log('All different due to random IV and salt');
console.log();

// Example 12: Binary Data Encryption
console.log('12. Binary Data Encryption:');
const binaryData = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
const binaryKey = crypto.randomBytes(32);
const binaryIV = crypto.randomBytes(16);

const binaryCipher = crypto.createCipheriv('aes-256-cbc', binaryKey, binaryIV);
const encryptedBinary = Buffer.concat([
  binaryCipher.update(binaryData),
  binaryCipher.final()
]);

console.log('Original binary:', binaryData);
console.log('Original string:', binaryData.toString());
console.log('Encrypted:', encryptedBinary);
console.log();

// Example 13: Stream-like Encryption (Multiple Updates)
console.log('13. Stream-like Encryption (Multiple Updates):');
const streamKey = crypto.randomBytes(32);
const streamIV = crypto.randomBytes(16);
const streamCipher = crypto.createCipheriv('aes-256-cbc', streamKey, streamIV);

let streamEncrypted = '';
streamEncrypted += streamCipher.update('Part 1 ', 'utf8', 'hex');
streamEncrypted += streamCipher.update('Part 2 ', 'utf8', 'hex');
streamEncrypted += streamCipher.update('Part 3', 'utf8', 'hex');
streamEncrypted += streamCipher.final('hex');

console.log('Encrypted stream:', streamEncrypted);

const streamDecipher = crypto.createDecipheriv('aes-256-cbc', streamKey, streamIV);
let streamDecrypted = '';
streamDecrypted += streamDecipher.update(streamEncrypted, 'hex', 'utf8');
streamDecrypted += streamDecipher.final('utf8');

console.log('Decrypted:', streamDecrypted);
console.log();

// Example 14: Key Size Impact
console.log('14. Key Size Impact:');
function testKeySize(keySize, algorithm) {
  const key = crypto.randomBytes(keySize);
  const iv = crypto.randomBytes(16);
  const data = 'Test data';

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return encrypted;
}

console.log('Same data, different key sizes:');
console.log('AES-128:', testKeySize(16, 'aes-128-cbc'));
console.log('AES-192:', testKeySize(24, 'aes-192-cbc'));
console.log('AES-256:', testKeySize(32, 'aes-256-cbc'));
console.log('Recommendation: Use AES-256 for maximum security');
console.log();

// Example 15: Common Mistakes
console.log('15. Common Mistakes to Avoid:');
console.log('❌ Hardcoding encryption keys');
console.log('❌ Reusing the same IV');
console.log('❌ Not storing IV and salt with encrypted data');
console.log('❌ Using weak key derivation');
console.log('❌ Ignoring encryption errors');
console.log('');
console.log('✅ Generate random keys and IVs');
console.log('✅ New IV for each encryption');
console.log('✅ Store IV and salt with encrypted data');
console.log('✅ Use pbkdf2/scrypt for key derivation');
console.log('✅ Handle errors properly');
