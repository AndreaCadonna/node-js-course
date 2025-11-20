/**
 * Key Derivation Examples
 *
 * Demonstrates advanced key derivation functions: HKDF and scrypt.
 * Key derivation is used to create cryptographic keys from passwords or other keys.
 */

const crypto = require('crypto');

console.log('=== Advanced Key Derivation ===\n');

// Example 1: HKDF Basics
console.log('1. HKDF (HMAC-based Key Derivation Function):');

const inputKeyMaterial = crypto.randomBytes(32); // IKM - initial key material
const salt = crypto.randomBytes(16);
const info = Buffer.from('application-specific-context');
const keyLength = 32; // 256 bits

// Derive key using HKDF
const derivedKey = crypto.hkdfSync(
  'sha256',      // Hash algorithm
  inputKeyMaterial,  // Input key material
  salt,          // Salt (optional but recommended)
  info,          // Context/application specific info
  keyLength      // Desired output length
);

console.log('Input key material:', inputKeyMaterial.toString('hex'));
console.log('Salt:', salt.toString('hex'));
console.log('Info:', info.toString('utf8'));
console.log('Derived key:', derivedKey.toString('hex'));
console.log('Derived key length:', derivedKey.length, 'bytes');
console.log();

// Example 2: Deriving Multiple Keys from One Master Key
console.log('2. Deriving Multiple Keys from Master Key:');

const masterKey = crypto.randomBytes(32);
const sharedSalt = crypto.randomBytes(16);

// Derive different keys for different purposes
const encryptionKey = crypto.hkdfSync(
  'sha256',
  masterKey,
  sharedSalt,
  Buffer.from('encryption'),
  32
);

const authenticationKey = crypto.hkdfSync(
  'sha256',
  masterKey,
  sharedSalt,
  Buffer.from('authentication'),
  32
);

const signingKey = crypto.hkdfSync(
  'sha256',
  masterKey,
  sharedSalt,
  Buffer.from('signing'),
  32
);

console.log('Master key:', masterKey.toString('hex'));
console.log('\nDerived keys:');
console.log('  Encryption:', encryptionKey.toString('hex'));
console.log('  Authentication:', authenticationKey.toString('hex'));
console.log('  Signing:', signingKey.toString('hex'));
console.log('\nNote: All different despite same master key!');
console.log();

// Example 3: scrypt for Password-Based Key Derivation
console.log('3. scrypt Password-Based Key Derivation:');

const password = 'user-strong-password';
const scryptSalt = crypto.randomBytes(16);

// Derive key from password using scrypt (synchronous)
const scryptKey = crypto.scryptSync(
  password,
  scryptSalt,
  32,           // Key length
  {
    N: 16384,   // CPU/memory cost (must be power of 2)
    r: 8,       // Block size
    p: 1        // Parallelization
  }
);

console.log('Password:', password);
console.log('Salt:', scryptSalt.toString('hex'));
console.log('Derived key:', scryptKey.toString('hex'));
console.log('Parameters: N=16384, r=8, p=1 (moderate security)');
console.log();

// Example 4: scrypt Async for Non-Blocking
console.log('4. scrypt Async (Recommended for Production):');

crypto.scrypt(password, scryptSalt, 32, { N: 16384, r: 8, p: 1 }, (err, key) => {
  if (err) {
    console.log('Error:', err.message);
    return;
  }
  console.log('Async scrypt completed');
  console.log('Derived key:', key.toString('hex'));
  console.log('✓ Async prevents blocking the event loop');
});

// Give async time to complete
setTimeout(() => {
  console.log();

  // Example 5: scrypt vs PBKDF2 Comparison
  console.log('5. scrypt vs PBKDF2 Comparison:');

  const testPassword = 'test-password';
  const testSalt = crypto.randomBytes(16);

  // PBKDF2 (from Level 1)
  const startPBKDF2 = Date.now();
  const pbkdf2Key = crypto.pbkdf2Sync(testPassword, testSalt, 100000, 32, 'sha256');
  const timePBKDF2 = Date.now() - startPBKDF2;

  // scrypt
  const startScrypt = Date.now();
  const scryptKey2 = crypto.scryptSync(testPassword, testSalt, 32, { N: 16384, r: 8, p: 1 });
  const timeScrypt = Date.now() - startScrypt;

  console.log('PBKDF2 (100,000 iterations):');
  console.log('  Time:', timePBKDF2, 'ms');
  console.log('  Key:', pbkdf2Key.toString('hex'));

  console.log('\nscrypt (N=16384, r=8, p=1):');
  console.log('  Time:', timeScrypt, 'ms');
  console.log('  Key:', scryptKey2.toString('hex'));

  console.log('\nscrypt is generally more secure due to memory hardness');
  console.log('Makes brute-force attacks more difficult and expensive');
  console.log();

  continueExamples();
}, 100);

function continueExamples() {
  // Example 6: Different scrypt Parameters
  console.log('6. scrypt Parameter Impact:');

  const pwd = 'password123';
  const slt = crypto.randomBytes(16);

  // Low security (fast but weak)
  const startLow = Date.now();
  const keyLow = crypto.scryptSync(pwd, slt, 32, { N: 1024, r: 8, p: 1 });
  const timeLow = Date.now() - startLow;

  // Medium security (recommended for most uses)
  const startMed = Date.now();
  const keyMed = crypto.scryptSync(pwd, slt, 32, { N: 16384, r: 8, p: 1 });
  const timeMed = Date.now() - startMed;

  // High security (slow but strong)
  const startHigh = Date.now();
  const keyHigh = crypto.scryptSync(pwd, slt, 32, { N: 65536, r: 8, p: 1 });
  const timeHigh = Date.now() - startHigh;

  console.log('Low security (N=1024):    ', timeLow, 'ms');
  console.log('Medium security (N=16384):', timeMed, 'ms');
  console.log('High security (N=65536):  ', timeHigh, 'ms');
  console.log('\nHigher N = more secure but slower');
  console.log('Choose based on your security requirements and UX tolerance');
  console.log();

  // Example 7: Complete Password Storage System
  console.log('7. Complete Password Storage with scrypt:');

  function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });

    return {
      hash: key.toString('hex'),
      salt: salt.toString('hex'),
      params: { N: 16384, r: 8, p: 1 }
    };
  }

  function verifyPassword(password, storedHash) {
    const salt = Buffer.from(storedHash.salt, 'hex');
    const key = crypto.scryptSync(
      password,
      salt,
      64,
      storedHash.params
    );

    const hashBuffer = Buffer.from(storedHash.hash, 'hex');
    return crypto.timingSafeEqual(hashBuffer, key);
  }

  // Test password storage
  const userPassword = 'MySecurePassword123!';
  const stored = hashPassword(userPassword);

  console.log('Stored password hash:');
  console.log('  Hash:', stored.hash.slice(0, 40) + '...');
  console.log('  Salt:', stored.salt);
  console.log('  Params:', JSON.stringify(stored.params));
  console.log();

  const correctPassword = verifyPassword('MySecurePassword123!', stored);
  const wrongPassword = verifyPassword('WrongPassword', stored);

  console.log('Correct password:', correctPassword ? '✓' : '✗');
  console.log('Wrong password:', wrongPassword ? '✗ (correctly rejected)' : '✓');
  console.log();

  // Example 8: HKDF for Key Expansion
  console.log('8. HKDF Key Expansion Pattern:');

  function expandKey(masterSecret, numKeys, keyLength = 32) {
    const keys = [];
    const salt = crypto.randomBytes(16);

    for (let i = 0; i < numKeys; i++) {
      const key = crypto.hkdfSync(
        'sha256',
        masterSecret,
        salt,
        Buffer.from(`key-${i}`),
        keyLength
      );
      keys.push(key);
    }

    return { keys, salt };
  }

  const masterSecret = crypto.randomBytes(32);
  const { keys, salt: expandSalt } = expandKey(masterSecret, 5);

  console.log('Expanded', keys.length, 'keys from one master secret');
  keys.forEach((key, i) => {
    console.log(`  Key ${i}:`, key.toString('hex').slice(0, 32) + '...');
  });
  console.log();

  // Example 9: Derive Encryption and HMAC Keys
  console.log('9. Encrypt-then-MAC Pattern with Derived Keys:');

  function encryptWithDerivedKeys(plaintext, password) {
    // Derive master key from password
    const salt = crypto.randomBytes(16);
    const masterKey = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });

    // Derive encryption and HMAC keys from master key
    const encKey = crypto.hkdfSync('sha256', masterKey, salt, Buffer.from('enc'), 32);
    const hmacKey = crypto.hkdfSync('sha256', masterKey, salt, Buffer.from('hmac'), 32);

    // Encrypt with AES-GCM
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', encKey, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Create HMAC of ciphertext
    const hmac = crypto.createHmac('sha256', hmacKey);
    hmac.update(ciphertext + iv.toString('hex') + authTag.toString('hex'));
    const mac = hmac.digest('hex');

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      mac,
      salt: salt.toString('hex')
    };
  }

  function decryptWithDerivedKeys(encrypted, password) {
    // Derive master key
    const salt = Buffer.from(encrypted.salt, 'hex');
    const masterKey = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });

    // Derive encryption and HMAC keys
    const encKey = crypto.hkdfSync('sha256', masterKey, salt, Buffer.from('enc'), 32);
    const hmacKey = crypto.hkdfSync('sha256', masterKey, salt, Buffer.from('hmac'), 32);

    // Verify HMAC
    const hmac = crypto.createHmac('sha256', hmacKey);
    hmac.update(encrypted.ciphertext + encrypted.iv + encrypted.authTag);
    const expectedMac = hmac.digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedMac), Buffer.from(encrypted.mac))) {
      throw new Error('HMAC verification failed');
    }

    // Decrypt
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encKey,
      Buffer.from(encrypted.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  }

  const secretData = 'Highly confidential information';
  const userPwd = 'user-encryption-password';

  const enc = encryptWithDerivedKeys(secretData, userPwd);
  console.log('Encrypted with derived keys:');
  console.log('  Ciphertext:', enc.ciphertext.slice(0, 40) + '...');
  console.log('  MAC:', enc.mac.slice(0, 40) + '...');
  console.log();

  const dec = decryptWithDerivedKeys(enc, userPwd);
  console.log('Decrypted:', dec);
  console.log('Match:', secretData === dec ? '✓' : '✗');
  console.log();

  // Example 10: Key Rotation with HKDF
  console.log('10. Key Rotation Pattern:');

  function deriveKeyVersion(masterKey, version, purpose) {
    const info = Buffer.from(`${purpose}-v${version}`);
    return crypto.hkdfSync('sha256', masterKey, null, info, 32);
  }

  const rotationMaster = crypto.randomBytes(32);

  const keyV1 = deriveKeyVersion(rotationMaster, 1, 'data-encryption');
  const keyV2 = deriveKeyVersion(rotationMaster, 2, 'data-encryption');
  const keyV3 = deriveKeyVersion(rotationMaster, 3, 'data-encryption');

  console.log('Key rotation using version numbers:');
  console.log('  Version 1:', keyV1.toString('hex').slice(0, 32) + '...');
  console.log('  Version 2:', keyV2.toString('hex').slice(0, 32) + '...');
  console.log('  Version 3:', keyV3.toString('hex').slice(0, 32) + '...');
  console.log('\nAll derived from same master key, easy rotation!');
  console.log();

  // Example 11: Context-Specific Keys
  console.log('11. Context-Specific Key Derivation:');

  function deriveContextKey(masterKey, context) {
    return crypto.hkdfSync(
      'sha256',
      masterKey,
      null,
      Buffer.from(JSON.stringify(context)),
      32
    );
  }

  const appMasterKey = crypto.randomBytes(32);

  const userKey = deriveContextKey(appMasterKey, {
    type: 'user-data',
    userId: '12345'
  });

  const sessionKey = deriveContextKey(appMasterKey, {
    type: 'session',
    sessionId: 'abc-def-ghi',
    timestamp: Date.now()
  });

  const apiKey = deriveContextKey(appMasterKey, {
    type: 'api',
    endpoint: '/api/secure',
    method: 'POST'
  });

  console.log('Context-specific keys:');
  console.log('  User key:', userKey.toString('hex').slice(0, 32) + '...');
  console.log('  Session key:', sessionKey.toString('hex').slice(0, 32) + '...');
  console.log('  API key:', apiKey.toString('hex').slice(0, 32) + '...');
  console.log();

  // Example 12: Performance Comparison
  console.log('12. Performance Comparison:');

  const perfPwd = 'performance-test-password';
  const perfSalt = crypto.randomBytes(16);
  const iterations = 10;

  // PBKDF2
  const startPBKDF2Perf = Date.now();
  for (let i = 0; i < iterations; i++) {
    crypto.pbkdf2Sync(perfPwd, perfSalt, 100000, 32, 'sha256');
  }
  const timePBKDF2Perf = Date.now() - startPBKDF2Perf;

  // scrypt
  const startScryptPerf = Date.now();
  for (let i = 0; i < iterations; i++) {
    crypto.scryptSync(perfPwd, perfSalt, 32, { N: 16384, r: 8, p: 1 });
  }
  const timeScryptPerf = Date.now() - startScryptPerf;

  // HKDF
  const perfIkm = crypto.randomBytes(32);
  const startHKDFPerf = Date.now();
  for (let i = 0; i < iterations; i++) {
    crypto.hkdfSync('sha256', perfIkm, perfSalt, Buffer.from('test'), 32);
  }
  const timeHKDFPerf = Date.now() - startHKDFPerf;

  console.log(`${iterations} iterations each:`);
  console.log('  PBKDF2 (100k iter):', timePBKDF2Perf, 'ms');
  console.log('  scrypt (N=16384):', timeScryptPerf, 'ms');
  console.log('  HKDF:', timeHKDFPerf, 'ms');
  console.log('\nHKDF is fastest (not password-based)');
  console.log('scrypt and PBKDF2 are intentionally slow (password-based)');
  console.log();

  // Example 13: Error Handling
  console.log('13. Error Handling:');

  function safeScrypt(password, options = {}) {
    try {
      if (!password) throw new Error('Password required');

      const salt = options.salt || crypto.randomBytes(16);
      const keyLength = options.keyLength || 32;
      const params = options.params || { N: 16384, r: 8, p: 1 };

      const key = crypto.scryptSync(password, salt, keyLength, params);

      return {
        success: true,
        key: key.toString('hex'),
        salt: salt.toString('hex'),
        params
      };
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  }

  const result1 = safeScrypt('valid-password');
  console.log('Valid scrypt:', result1.success ? '✓' : '✗');

  const result2 = safeScrypt('', { params: { N: 1024, r: 8, p: 1 } });
  console.log('Invalid scrypt:', result2.success ? '✗' : '✓ (correctly rejected)');
  console.log('Error:', result2.error);

  console.log('\n=== Key Takeaways ===');
  console.log('✓ HKDF derives multiple keys from one master key');
  console.log('✓ scrypt is more secure than PBKDF2 for passwords');
  console.log('✓ scrypt has memory-hardness to resist attacks');
  console.log('✓ Use HKDF for key expansion, not password hashing');
  console.log('✓ Use scrypt/PBKDF2 for password-based keys');
  console.log('✓ Higher scrypt N parameter = more security');
  console.log('✓ Always use unique salts');
  console.log('✓ Context info in HKDF creates different keys');
  console.log('✓ Async operations prevent blocking in production');
  console.log('✓ Key derivation enables key rotation strategies');
}
