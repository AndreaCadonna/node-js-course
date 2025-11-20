/**
 * Random Data Generation Examples
 *
 * Demonstrates how to generate cryptographically secure random data.
 * Never use Math.random() for security-related purposes!
 */

const crypto = require('crypto');

console.log('=== Random Data Generation Examples ===\n');

// Example 1: Generate Random Bytes
console.log('1. Generate Random Bytes:');
const randomBytes = crypto.randomBytes(16);
console.log('Buffer:', randomBytes);
console.log('Hex:   ', randomBytes.toString('hex'));
console.log('Base64:', randomBytes.toString('base64'));
console.log('Length:', randomBytes.length, 'bytes');
console.log();

// Example 2: Different Byte Lengths
console.log('2. Different Byte Lengths:');
console.log('16 bytes (128 bits):', crypto.randomBytes(16).toString('hex'));
console.log('32 bytes (256 bits):', crypto.randomBytes(32).toString('hex'));
console.log('64 bytes (512 bits):', crypto.randomBytes(64).toString('hex'));
console.log();

// Example 3: Generate UUID (v4)
console.log('3. Generate UUID (v4):');
console.log('UUID 1:', crypto.randomUUID());
console.log('UUID 2:', crypto.randomUUID());
console.log('UUID 3:', crypto.randomUUID());
console.log('Notice: Each UUID is unique');
console.log();

// Example 4: Random Integer
console.log('4. Random Integer:');
console.log('Random 0-9:      ', crypto.randomInt(10));
console.log('Random 0-99:     ', crypto.randomInt(100));
console.log('Random 1-100:    ', crypto.randomInt(1, 101));
console.log('Random 1000-9999:', crypto.randomInt(1000, 10000));
console.log();

// Example 5: Session Token Generation
console.log('5. Session Token Generation:');
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('Session Token 1:', generateSessionToken());
console.log('Session Token 2:', generateSessionToken());
console.log('Session Token 3:', generateSessionToken());
console.log('Use case: User session management');
console.log();

// Example 6: API Key Generation
console.log('6. API Key Generation:');
function generateApiKey() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('API Key 1:', generateApiKey());
console.log('API Key 2:', generateApiKey());
console.log('API Key 3:', generateApiKey());
console.log('Use case: API authentication');
console.log();

// Example 7: Password Reset Token
console.log('7. Password Reset Token:');
function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  // Hash the token before storing in database
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

const resetToken = generateResetToken();
console.log('Token (send to user):', resetToken.token);
console.log('Hash (store in DB):  ', resetToken.hash);
console.log('Use case: Password reset emails');
console.log();

// Example 8: Random PIN Generation
console.log('8. Random PIN Generation:');
function generatePIN(length = 6) {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += crypto.randomInt(0, 10);
  }
  return pin;
}

console.log('6-digit PIN:', generatePIN(6));
console.log('4-digit PIN:', generatePIN(4));
console.log('8-digit PIN:', generatePIN(8));
console.log('Use case: 2FA codes, ATM PINs');
console.log();

// Example 9: Random Password Generation
console.log('9. Random Password Generation:');
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    password += chars[randomIndex];
  }

  return password;
}

console.log('Password 1:', generatePassword(16));
console.log('Password 2:', generatePassword(16));
console.log('Password 3:', generatePassword(20));
console.log('Use case: Temporary passwords');
console.log();

// Example 10: Comparison with Math.random() (INSECURE)
console.log('10. Comparison - crypto vs Math.random():');
console.log('\n❌ INSECURE - Math.random():');
console.log('Random 1:', Math.random());
console.log('Random 2:', Math.random());
console.log('Random 3:', Math.random());
console.log('⚠️  NOT cryptographically secure - DO NOT USE for security!');

console.log('\n✅ SECURE - crypto.randomInt():');
console.log('Random 1:', crypto.randomInt(0, 1000000) / 1000000);
console.log('Random 2:', crypto.randomInt(0, 1000000) / 1000000);
console.log('Random 3:', crypto.randomInt(0, 1000000) / 1000000);
console.log('✓ Cryptographically secure - SAFE for security');
console.log();

// Example 11: Random Salt for Password Hashing
console.log('11. Random Salt for Password Hashing:');
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

console.log('Salt 1:', generateSalt());
console.log('Salt 2:', generateSalt());
console.log('Salt 3:', generateSalt());
console.log('Use case: Password hashing with pbkdf2/scrypt');
console.log();

// Example 12: Async Random Bytes (Non-blocking)
console.log('12. Async Random Bytes (Non-blocking):');
crypto.randomBytes(32, (err, buffer) => {
  if (err) {
    console.error('Error generating random bytes:', err);
    return;
  }
  console.log('Async random bytes:', buffer.toString('hex'));
  console.log('Use case: Non-blocking operations in production');
});

// Synchronous version
const syncBytes = crypto.randomBytes(32);
console.log('Sync random bytes: ', syncBytes.toString('hex'));
console.log();

// Example 13: CSRF Token Generation
console.log('13. CSRF Token Generation:');
function generateCSRFToken() {
  return crypto.randomBytes(24).toString('base64');
}

console.log('CSRF Token 1:', generateCSRFToken());
console.log('CSRF Token 2:', generateCSRFToken());
console.log('CSRF Token 3:', generateCSRFToken());
console.log('Use case: Cross-Site Request Forgery protection');
console.log();

// Example 14: Random File Names
console.log('14. Random File Names:');
function generateFileName(extension = 'jpg') {
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}.${extension}`;
}

console.log('File 1:', generateFileName('jpg'));
console.log('File 2:', generateFileName('png'));
console.log('File 3:', generateFileName('pdf'));
console.log('Use case: Uploaded file storage');
console.log();

// Example 15: Performance Test
console.log('15. Performance Test:');
const iterations = 10000;

const start1 = Date.now();
for (let i = 0; i < iterations; i++) {
  crypto.randomBytes(32);
}
const end1 = Date.now();

console.log(`Generated ${iterations} random tokens`);
console.log(`Time taken: ${end1 - start1}ms`);
console.log(`Average: ${((end1 - start1) / iterations).toFixed(3)}ms per token`);
