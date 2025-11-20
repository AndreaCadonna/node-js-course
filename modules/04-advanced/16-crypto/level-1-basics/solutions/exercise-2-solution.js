/**
 * Exercise 2: Secure Token Generator - SOLUTION
 *
 * This solution demonstrates:
 * - Generating cryptographically secure random data
 * - Creating UUIDs for unique identifiers
 * - Generating random numbers in ranges
 * - Building API keys with specific formats
 * - Creating session tokens with expiration
 */

const crypto = require('crypto');

console.log('=== Exercise 2: Secure Token Generator - SOLUTION ===\n');

// ============================================================================
// Task 1: Generate secure random token
// ============================================================================
console.log('Task 1: Generate secure random token');

/**
 * Generates a cryptographically secure random token
 *
 * SECURITY IMPORTANCE:
 * - NEVER use Math.random() for security purposes!
 * - Math.random() is predictable and can be exploited
 * - crypto.randomBytes() uses OS-level entropy (truly random)
 *
 * COMMON USES:
 * - Session tokens
 * - API keys
 * - Password reset tokens
 * - CSRF tokens
 *
 * OUTPUT FORMAT:
 * - Hexadecimal: 2 characters per byte (16 bytes = 32 chars)
 * - Base64: ~1.33 characters per byte (more compact)
 *
 * @param {number} length - Number of random bytes to generate
 * @returns {string} Hexadecimal token string
 */
function generateToken(length = 32) {
  // Generate random bytes and convert to hexadecimal
  return crypto.randomBytes(length).toString('hex');
}

// ALTERNATIVE APPROACH: Base64 encoding (more compact)
function generateTokenBase64(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// ALTERNATIVE APPROACH: URL-safe base64
function generateTokenURLSafe(length = 32) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Test Task 1
try {
  const token1 = generateToken(16);
  const token2 = generateToken(32);
  const token3 = generateTokenBase64(16);
  const token4 = generateTokenURLSafe(16);

  console.log('16-byte token (hex):', token1);
  console.log('Length:', token1.length, 'chars (16 bytes × 2)');
  console.log('\n32-byte token (hex):', token2);
  console.log('Length:', token2.length, 'chars (32 bytes × 2)');
  console.log('\n16-byte token (base64):', token3);
  console.log('Length:', token3.length, 'chars');
  console.log('\n16-byte token (URL-safe):', token4);
  console.log('No special chars:', !/[+/=]/.test(token4));
  console.log('\nTokens are unique:', token1 !== token2);
  console.log('✓ Task 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 2: Generate UUID
// ============================================================================
console.log('Task 2: Generate UUID v4');

/**
 * Generates a UUID v4 (universally unique identifier)
 *
 * UUID FORMAT:
 * - xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * - 36 characters including dashes
 * - Version 4 uses random data
 * - Extremely low collision probability
 *
 * WHEN TO USE UUIDs:
 * - Database primary keys
 * - Resource identifiers
 * - Distributed system IDs
 * - File/object names
 *
 * ADVANTAGES:
 * - No coordination needed between systems
 * - Can be generated offline
 * - Universally unique (collision ~impossible)
 * - Standard format recognized everywhere
 *
 * @returns {string} UUID v4 string
 */
function generateUUID() {
  return crypto.randomUUID();
}

// ALTERNATIVE APPROACH: Manual UUID v4 generation
function generateUUIDManual() {
  const bytes = crypto.randomBytes(16);

  // Set version (4) in byte 6
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set variant (RFC4122) in byte 8
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Format as UUID string
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-');
}

// Test Task 2
try {
  const uuid1 = generateUUID();
  const uuid2 = generateUUID();
  const uuid3 = generateUUIDManual();

  console.log('UUID 1:', uuid1);
  console.log('UUID 2:', uuid2);
  console.log('UUID 3 (manual):', uuid3);
  console.log('\nLength:', uuid1.length, 'characters');
  console.log('Contains dashes:', uuid1.includes('-'));
  console.log('Has 5 parts:', uuid1.split('-').length === 5);
  console.log('UUIDs are unique:', uuid1 !== uuid2);
  console.log('✓ Task 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 3: Generate random number in range
// ============================================================================
console.log('Task 3: Generate secure random number');

/**
 * Generates a cryptographically secure random number in range
 *
 * WHY NOT Math.random()?
 * - Math.random() is NOT cryptographically secure
 * - Can be predicted by attackers
 * - Should never be used for security
 *
 * IMPORTANT:
 * - Max is EXCLUSIVE (randomInt(0, 100) gives 0-99)
 * - Always use crypto.randomInt() for security needs
 * - No modulo bias (uniformly distributed)
 *
 * COMMON USES:
 * - OTP (one-time passwords)
 * - Random PINs
 * - Random indices
 * - Random delays (anti-bot)
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number in range
 */
function generateRandomNumber(min, max) {
  return crypto.randomInt(min, max);
}

// ALTERNATIVE APPROACH: With inclusive max
function generateRandomNumberInclusive(min, max) {
  // Make max inclusive by adding 1
  return crypto.randomInt(min, max + 1);
}

// ALTERNATIVE APPROACH: Using randomBytes (older Node.js versions)
function generateRandomNumberFallback(min, max) {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const randomValue = crypto.randomBytes(bytesNeeded).readUIntBE(0, bytesNeeded);

  // Avoid modulo bias
  if (randomValue >= maxValue - (maxValue % range)) {
    return generateRandomNumberFallback(min, max);
  }

  return min + (randomValue % range);
}

// Test Task 3
try {
  const numbers = [];
  for (let i = 0; i < 10; i++) {
    numbers.push(generateRandomNumber(1, 101)); // 1-100
  }

  console.log('10 random numbers (1-100):', numbers);
  const allInRange = numbers.every(n => n >= 1 && n <= 100);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);

  console.log('All numbers in range:', allInRange, '✓');
  console.log('Min:', min, '| Max:', max);

  // Test inclusive version
  const inclusive = [];
  for (let i = 0; i < 5; i++) {
    inclusive.push(generateRandomNumberInclusive(1, 10)); // 1-10 inclusive
  }
  console.log('Inclusive (1-10):', inclusive);
  console.log('✓ Task 3 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 4: Generate API key with prefix
// ============================================================================
console.log('Task 4: Generate formatted API key');

/**
 * Generates an API key with a specific prefix
 *
 * WHY USE PREFIXES?
 * - Easy identification (sk_ = secret key, pk_ = public key)
 * - Environment markers (live vs test)
 * - Prevents accidental exposure in logs/errors
 * - Matches industry standards (Stripe, GitHub, etc.)
 *
 * COMMON PREFIXES:
 * - sk_live_  : Secret key for production
 * - sk_test_  : Secret key for testing
 * - pk_live_  : Public key for production
 * - pk_test_  : Public key for testing
 * - ghp_      : GitHub personal access token
 *
 * @param {string} prefix - API key prefix
 * @param {number} length - Number of random bytes
 * @returns {string} Formatted API key
 */
function generateAPIKey(prefix = 'sk_', length = 32) {
  const token = crypto.randomBytes(length).toString('hex');
  return prefix + token;
}

// ALTERNATIVE APPROACH: With key validation
function generateAPIKeyValidated(prefix = 'sk_', length = 32) {
  if (length < 16) {
    throw new Error('Key length should be at least 16 bytes for security');
  }

  const token = crypto.randomBytes(length).toString('hex');
  return prefix + token;
}

// ALTERNATIVE APPROACH: With checksum (like credit cards)
function generateAPIKeyWithChecksum(prefix = 'sk_', length = 32) {
  const token = crypto.randomBytes(length).toString('hex');
  const fullKey = prefix + token;

  // Add simple checksum (last 8 chars of hash)
  const checksum = crypto
    .createHash('sha256')
    .update(fullKey)
    .digest('hex')
    .slice(0, 8);

  return `${fullKey}_${checksum}`;
}

// Test Task 4
try {
  const liveKey = generateAPIKey('sk_live_', 24);
  const testKey = generateAPIKey('pk_test_', 24);
  const githubStyle = generateAPIKey('ghp_', 20);
  const withChecksum = generateAPIKeyWithChecksum('sk_', 16);

  console.log('Live secret key:', liveKey);
  console.log('Test public key:', testKey);
  console.log('GitHub style:', githubStyle);
  console.log('With checksum:', withChecksum);
  console.log('\nStarts with prefix:', liveKey.startsWith('sk_live_'), '✓');
  console.log('Proper length:', liveKey.length > 50, '✓');
  console.log('✓ Task 4 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 5: Generate session token with metadata
// ============================================================================
console.log('Task 5: Generate session token with expiration');

/**
 * Session token with expiration and metadata
 *
 * SESSION MANAGEMENT:
 * - Each session needs unique identifier
 * - Must track creation and expiration
 * - Should be easy to validate
 * - Can store additional metadata
 *
 * SECURITY CONSIDERATIONS:
 * - Long random IDs prevent guessing
 * - Expiration prevents indefinite access
 * - Server-side validation required
 * - Should invalidate on logout
 */
class SessionToken {
  /**
   * Initialize session token
   * @param {number} expiryMinutes - Minutes until expiration
   */
  constructor(expiryMinutes = 60) {
    // Generate unique session ID
    this.sessionId = crypto.randomUUID();

    // Store timestamps
    this.createdAt = Date.now();
    this.expiresAt = this.createdAt + (expiryMinutes * 60 * 1000);

    // Metadata
    this.expiryMinutes = expiryMinutes;
  }

  /**
   * Check if token is still valid
   * @returns {boolean} True if token hasn't expired
   */
  isValid() {
    return Date.now() < this.expiresAt;
  }

  /**
   * Get remaining time in minutes
   * @returns {number} Minutes until expiration (or 0 if expired)
   */
  getRemainingTime() {
    const remaining = this.expiresAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 60000) : 0;
  }

  /**
   * Get token information
   * @returns {Object} Token details
   */
  getInfo() {
    return {
      sessionId: this.sessionId,
      createdAt: new Date(this.createdAt).toISOString(),
      expiresAt: new Date(this.expiresAt).toISOString(),
      isValid: this.isValid(),
      remainingMinutes: this.getRemainingTime()
    };
  }

  /**
   * Renew the session (extend expiration)
   * @param {number} additionalMinutes - Minutes to add
   */
  renew(additionalMinutes) {
    this.expiresAt = Date.now() + (additionalMinutes * 60 * 1000);
  }

  /**
   * Invalidate the session
   */
  invalidate() {
    this.expiresAt = Date.now() - 1; // Set to past
  }
}

// ALTERNATIVE APPROACH: Enhanced session with additional features
class SessionTokenAdvanced extends SessionToken {
  constructor(userId, expiryMinutes = 60) {
    super(expiryMinutes);
    this.userId = userId;
    this.accessCount = 0;
    this.lastAccessedAt = this.createdAt;
    this.ipAddress = null;
  }

  /**
   * Record session access
   */
  recordAccess(ipAddress = null) {
    this.accessCount++;
    this.lastAccessedAt = Date.now();
    if (ipAddress) this.ipAddress = ipAddress;
  }

  /**
   * Get full session details
   */
  getFullInfo() {
    return {
      ...super.getInfo(),
      userId: this.userId,
      accessCount: this.accessCount,
      lastAccessedAt: new Date(this.lastAccessedAt).toISOString(),
      ipAddress: this.ipAddress
    };
  }
}

// Test Task 5
try {
  const session = new SessionToken(30); // 30 minutes

  console.log('Session info:', session.getInfo());
  console.log('Is valid:', session.isValid(), '✓');
  console.log('Remaining time (minutes):', session.getRemainingTime());

  // Create expired session (for testing)
  const expiredSession = new SessionToken(-1); // Already expired
  console.log('\nExpired session valid:', expiredSession.isValid(), '(correctly expired)');
  console.log('Remaining time:', expiredSession.getRemainingTime(), 'minutes');

  // Test renewal
  session.renew(60); // Add 60 more minutes
  console.log('\nAfter renewal:', session.getRemainingTime(), 'minutes');

  // Test advanced session
  const advSession = new SessionTokenAdvanced('user123', 30);
  advSession.recordAccess('192.168.1.1');
  advSession.recordAccess('192.168.1.1');
  console.log('\nAdvanced session:', advSession.getFullInfo());
  console.log('✓ Task 5 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge 1: Generate base64 URL-safe token
// ============================================================================
console.log('Bonus Challenge 1: URL-safe base64 token');

/**
 * Generates a URL-safe base64 token
 *
 * WHY URL-SAFE?
 * - Standard base64 uses +, /, = which are special in URLs
 * - URL-safe base64 uses -, _, no padding
 * - Safe to use in URLs, filenames, HTML attributes
 *
 * CONVERSIONS:
 * - + → - (plus to dash)
 * - / → _ (slash to underscore)
 * - = → removed (padding removed)
 *
 * @param {number} length - Number of bytes
 * @returns {string} URL-safe base64 token
 */
function generateURLSafeToken(length = 32) {
  return crypto.randomBytes(length)
    .toString('base64')
    .replace(/\+/g, '-')   // Replace + with -
    .replace(/\//g, '_')   // Replace / with _
    .replace(/=/g, '');    // Remove padding
}

// ALTERNATIVE APPROACH: Using base64url (Node.js 14.18+)
function generateURLSafeTokenNative(length = 32) {
  // Modern Node.js has base64url encoding built-in
  return crypto.randomBytes(length).toString('base64url');
}

// Test Bonus 1
try {
  const urlToken = generateURLSafeToken(24);
  const urlTokenNative = generateURLSafeTokenNative(24);

  console.log('URL-safe token:', urlToken);
  console.log('Native base64url:', urlTokenNative);
  console.log('No special chars (+/=):', !/[+/=]/.test(urlToken), '✓');
  console.log('Safe for URLs:', !/[+/=]/.test(urlTokenNative), '✓');

  // Demonstrate usage in URL
  const exampleUrl = `https://api.example.com/verify?token=${urlToken}`;
  console.log('Example URL:', exampleUrl);
  console.log('✓ Bonus 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge 2: Generate OTP (One-Time Password)
// ============================================================================
console.log('Bonus Challenge 2: Generate numeric OTP');

/**
 * Generates a numeric one-time password
 *
 * OTP CHARACTERISTICS:
 * - Fixed length (usually 4-8 digits)
 * - Numeric only (easy to type)
 * - Time-limited validity
 * - Single use only
 *
 * COMMON USES:
 * - Two-factor authentication
 * - Email/SMS verification
 * - Password reset codes
 * - Transaction confirmation
 *
 * SECURITY NOTES:
 * - Longer OTPs are more secure (6+ digits recommended)
 * - Should expire quickly (5-10 minutes)
 * - Rate limit verification attempts
 * - Never reuse OTPs
 *
 * @param {number} digits - Number of digits
 * @returns {string} Numeric OTP
 */
function generateOTP(digits = 6) {
  // Generate random number in range [0, 10^digits)
  const max = Math.pow(10, digits);
  const otp = crypto.randomInt(0, max);

  // Pad with leading zeros to ensure correct length
  return otp.toString().padStart(digits, '0');
}

// ALTERNATIVE APPROACH: More efficient for large digits
function generateOTPEfficient(digits = 6) {
  // Generate digits one at a time
  let otp = '';
  for (let i = 0; i < digits; i++) {
    otp += crypto.randomInt(0, 10).toString();
  }
  return otp;
}

// ALTERNATIVE APPROACH: With checksum digit
function generateOTPWithChecksum(digits = 6) {
  // Generate OTP
  const otp = generateOTP(digits - 1);

  // Calculate checksum (simple sum mod 10)
  const sum = otp.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  const checksum = sum % 10;

  return otp + checksum;
}

// Test Bonus 2
try {
  const otp6 = generateOTP(6);
  const otp8 = generateOTP(8);
  const otpChecksum = generateOTPWithChecksum(6);

  console.log('6-digit OTP:', otp6);
  console.log('8-digit OTP:', otp8);
  console.log('OTP with checksum:', otpChecksum);
  console.log('\nCorrect length:', otp6.length === 6 && otp8.length === 8, '✓');
  console.log('Only digits:', /^\d+$/.test(otp6), '✓');
  console.log('Has leading zeros:', /^0/.test(generateOTP(6)), '(sometimes)');

  // Generate multiple to show variety
  console.log('\n10 sample OTPs:');
  for (let i = 0; i < 10; i++) {
    console.log(`  ${i + 1}. ${generateOTP(6)}`);
  }
  console.log('✓ Bonus 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Additional Examples: Best Practices
// ============================================================================
console.log('=== Best Practices & Additional Examples ===\n');

// Example 1: Token generator factory
class TokenGenerator {
  static session() {
    return new SessionToken(60);
  }

  static apiKey(environment = 'test') {
    const prefix = environment === 'live' ? 'sk_live_' : 'sk_test_';
    return generateAPIKey(prefix, 32);
  }

  static resetToken() {
    // Short-lived, URL-safe token for password reset
    const token = generateURLSafeToken(32);
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
    return { token, expires };
  }

  static otp() {
    return {
      code: generateOTP(6),
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
  }
}

// Example 2: Token validator
function validateToken(token, type = 'hex') {
  const patterns = {
    hex: /^[0-9a-f]+$/i,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    otp: /^\d{4,8}$/,
    base64url: /^[A-Za-z0-9_-]+$/
  };

  return patterns[type]?.test(token) || false;
}

// Example 3: Secure comparison for tokens
function compareTokens(token1, token2) {
  try {
    // Convert to buffers
    const buf1 = Buffer.from(token1);
    const buf2 = Buffer.from(token2);

    // Timing-safe comparison prevents timing attacks
    return crypto.timingSafeEqual(buf1, buf2);
  } catch {
    return false; // Different lengths or invalid
  }
}

// Test examples
console.log('1. Token factory:');
console.log('   Session:', TokenGenerator.session().sessionId);
console.log('   API Key:', TokenGenerator.apiKey('live').substring(0, 40) + '...');
console.log('   Reset:', TokenGenerator.resetToken().token.substring(0, 30) + '...');
console.log('   OTP:', TokenGenerator.otp().code);

console.log('\n2. Token validation:');
console.log('   Hex valid:', validateToken('abc123', 'hex'));
console.log('   UUID valid:', validateToken(crypto.randomUUID(), 'uuid'));
console.log('   OTP valid:', validateToken('123456', 'otp'));

console.log('\n3. Secure comparison:', compareTokens('abc', 'abc'));

console.log('\n=== Exercise 2 Complete ===');
console.log('\nKey Takeaways:');
console.log('✓ ALWAYS use crypto.randomBytes() for security (NEVER Math.random())');
console.log('✓ crypto.randomUUID() creates standard v4 UUIDs');
console.log('✓ crypto.randomInt() generates secure random numbers in a range');
console.log('✓ Tokens should be long enough (at least 16-32 bytes)');
console.log('✓ Different formats serve different purposes (hex, base64, UUID)');
console.log('✓ Use prefixes for API keys (sk_, pk_, etc.)');
console.log('✓ Sessions need expiration and validation logic');
console.log('✓ OTPs should be 6+ digits and time-limited');
console.log('✓ URL-safe tokens use base64url encoding (-, _, no =)');
