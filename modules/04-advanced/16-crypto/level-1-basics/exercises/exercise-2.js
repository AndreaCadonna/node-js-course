/**
 * Exercise 2: Secure Token Generator
 *
 * OBJECTIVE:
 * Learn to generate cryptographically secure random data for tokens, session IDs, and API keys.
 *
 * REQUIREMENTS:
 * 1. Generate secure random tokens
 * 2. Create UUIDs for unique identifiers
 * 3. Generate random numbers within a range
 * 4. Create API keys with specific formats
 * 5. Build session tokens with expiration
 *
 * LEARNING GOALS:
 * - Understanding cryptographic randomness vs Math.random()
 * - Using crypto.randomBytes() for secure tokens
 * - Using crypto.randomUUID() for unique identifiers
 * - Using crypto.randomInt() for random numbers
 * - Formatting tokens for different use cases
 */

const crypto = require('crypto');

console.log('=== Exercise 2: Secure Token Generator ===\n');

// Task 1: Generate secure random token
console.log('Task 1: Generate secure random token');
/**
 * TODO 1: Implement function to generate secure random token
 *
 * Steps:
 * 1. Use crypto.randomBytes() to generate random data
 * 2. Convert to hexadecimal string
 * 3. Return the token
 *
 * @param {number} length - Number of random bytes to generate
 * @returns {string} Hexadecimal token string
 *
 * Hint: crypto.randomBytes(length).toString('hex')
 * Hint: Hex string will be 2x the byte length (16 bytes = 32 chars)
 */
function generateToken(length = 32) {
  // Your code here
}

// Test Task 1
try {
  const token1 = generateToken(16);
  const token2 = generateToken(32);

  console.log('16-byte token:', token1);
  console.log('Token length:', token1?.length || 0, '(expected: 32 characters)');
  console.log('32-byte token:', token2);
  console.log('Token length:', token2?.length || 0, '(expected: 64 characters)');
  console.log('Tokens are unique:', token1 !== token2);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Generate UUID
console.log('Task 2: Generate UUID v4');
/**
 * TODO 2: Implement function to generate UUID v4
 *
 * Steps:
 * 1. Use crypto.randomUUID() to generate a UUID
 * 2. Return the UUID string
 *
 * @returns {string} UUID v4 string
 *
 * Hint: crypto.randomUUID() is the easiest way
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
function generateUUID() {
  // Your code here
}

// Test Task 2
try {
  const uuid1 = generateUUID();
  const uuid2 = generateUUID();

  console.log('UUID 1:', uuid1);
  console.log('UUID 2:', uuid2);
  console.log('UUID length:', uuid1?.length || 0, '(expected: 36 characters)');
  console.log('Contains dashes:', uuid1?.includes('-') || false);
  console.log('UUIDs are unique:', uuid1 !== uuid2);
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Generate random number in range
console.log('Task 3: Generate secure random number');
/**
 * TODO 3: Implement function to generate random number in range
 *
 * Steps:
 * 1. Use crypto.randomInt() to generate random number
 * 2. Specify min (inclusive) and max (exclusive)
 * 3. Return the random number
 *
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Random number in range
 *
 * Hint: crypto.randomInt(min, max)
 * Hint: Max is exclusive, so randomInt(0, 100) gives 0-99
 */
function generateRandomNumber(min, max) {
  // Your code here
}

// Test Task 3
try {
  const numbers = [];
  for (let i = 0; i < 10; i++) {
    numbers.push(generateRandomNumber(1, 101)); // 1-100
  }

  console.log('10 random numbers (1-100):', numbers);
  const allInRange = numbers.every(n => n >= 1 && n <= 100);
  console.log('All numbers in range:', allInRange, '(should be true)');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Generate API key with prefix
console.log('Task 4: Generate formatted API key');
/**
 * TODO 4: Implement function to generate API key with prefix
 *
 * Steps:
 * 1. Accept a prefix (e.g., 'sk_live_', 'pk_test_')
 * 2. Generate secure random token
 * 3. Combine prefix with token
 * 4. Return formatted API key
 *
 * @param {string} prefix - API key prefix
 * @param {number} length - Number of random bytes (default 32)
 * @returns {string} Formatted API key
 *
 * Hint: Use generateToken() from Task 1
 * Example: 'sk_live_' + token
 */
function generateAPIKey(prefix = 'sk_', length = 32) {
  // Your code here
}

// Test Task 4
try {
  const liveKey = generateAPIKey('sk_live_', 24);
  const testKey = generateAPIKey('pk_test_', 24);

  console.log('Live secret key:', liveKey);
  console.log('Test public key:', testKey);
  console.log('Starts with prefix:', liveKey?.startsWith('sk_live_') || false);
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Generate session token with metadata
console.log('Task 5: Generate session token with expiration');
/**
 * TODO 5: Implement SessionToken class
 *
 * Steps:
 * 1. Generate unique session ID
 * 2. Store creation timestamp
 * 3. Calculate expiration time
 * 4. Provide method to check if valid
 */
class SessionToken {
  /**
   * TODO: Initialize session token
   * @param {number} expiryMinutes - Minutes until expiration
   */
  constructor(expiryMinutes = 60) {
    // Your code here
    // Generate session ID (use crypto.randomUUID())
    // Store createdAt timestamp
    // Calculate expiresAt timestamp
  }

  /**
   * TODO: Check if token is still valid
   * @returns {boolean} True if token hasn't expired
   */
  isValid() {
    // Your code here
    // Compare current time with expiresAt
  }

  /**
   * TODO: Get remaining time in minutes
   * @returns {number} Minutes until expiration (or 0 if expired)
   */
  getRemainingTime() {
    // Your code here
    // Calculate difference between expiresAt and now
    // Convert to minutes and return
  }

  /**
   * TODO: Get token information
   * @returns {Object} Token details
   */
  getInfo() {
    // Your code here
    // Return object with: sessionId, createdAt, expiresAt, isValid
  }
}

// Test Task 5
try {
  const session = new SessionToken(30); // 30 minutes

  console.log('Session info:', session.getInfo());
  console.log('Is valid:', session.isValid());
  console.log('Remaining time (minutes):', session.getRemainingTime());

  // Create expired session (for testing)
  const expiredSession = new SessionToken(-1); // Already expired
  console.log('Expired session valid:', expiredSession.isValid(), '(should be false)');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Generate base64 URL-safe token
console.log('Bonus Challenge 1: URL-safe base64 token');
/**
 * TODO BONUS 1: Generate URL-safe base64 token
 *
 * Steps:
 * 1. Generate random bytes
 * 2. Convert to base64 string
 * 3. Make URL-safe by replacing +, /, = characters
 *
 * @param {number} length - Number of bytes
 * @returns {string} URL-safe base64 token
 *
 * Hint: Use base64url encoding or replace: + with -, / with _, remove =
 */
function generateURLSafeToken(length = 32) {
  // Your code here
  // Convert to base64: .toString('base64')
  // Replace: + with -, / with _, remove =
}

// Test Bonus 1
try {
  const urlToken = generateURLSafeToken(24);
  console.log('URL-safe token:', urlToken);
  console.log('No + or / or =:', !/[+/=]/.test(urlToken || ''));
  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Generate OTP (One-Time Password)
console.log('Bonus Challenge 2: Generate numeric OTP');
/**
 * TODO BONUS 2: Generate numeric one-time password
 *
 * Steps:
 * 1. Accept digit length (e.g., 6 digits)
 * 2. Generate secure random number
 * 3. Format to specified length with leading zeros
 * 4. Return OTP string
 *
 * @param {number} digits - Number of digits (default 6)
 * @returns {string} Numeric OTP
 *
 * Hint: Use crypto.randomInt(0, 10 ** digits)
 * Hint: Use String.padStart() to add leading zeros
 */
function generateOTP(digits = 6) {
  // Your code here
}

// Test Bonus 2
try {
  const otp6 = generateOTP(6);
  const otp8 = generateOTP(8);

  console.log('6-digit OTP:', otp6);
  console.log('8-digit OTP:', otp8);
  console.log('Correct length:', otp6?.length === 6 && otp8?.length === 8);
  console.log('Only digits:', /^\d+$/.test(otp6 || ''));
  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 2 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('\nKey Takeaways:');
console.log('- Always use crypto.randomBytes() for security (never Math.random())');
console.log('- crypto.randomUUID() creates standard v4 UUIDs');
console.log('- crypto.randomInt() generates secure random numbers in a range');
console.log('- Tokens should be long enough (at least 16-32 bytes)');
console.log('- Different formats serve different purposes (hex, base64, UUID)');
