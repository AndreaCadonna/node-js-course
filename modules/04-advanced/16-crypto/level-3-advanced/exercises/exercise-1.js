/**
 * Exercise 1: Complete JWT Authentication System
 *
 * OBJECTIVE:
 * Build a production-ready JWT authentication system with access tokens,
 * refresh tokens, token rotation, and secure session management.
 *
 * REQUIREMENTS:
 * 1. Implement JWT signing with RS256
 * 2. Create access and refresh token system
 * 3. Implement token validation
 * 4. Add refresh token rotation
 * 5. Implement token revocation
 * 6. Add rate limiting
 *
 * LEARNING GOALS:
 * - Understanding JWT structure and security
 * - Implementing token-based authentication
 * - Managing token lifecycle
 * - Security best practices
 */

const crypto = require('crypto');

console.log('=== Exercise 1: JWT Authentication System ===\n');

// Task 1: Implement Base64URL Encoding/Decoding
console.log('Task 1: Base64URL encoding/decoding');

/**
 * TODO 1: Implement Base64URL encoding
 *
 * Base64URL is like Base64 but URL-safe (uses - and _ instead of + and /)
 *
 * Steps:
 * 1. Convert data to JSON string
 * 2. Create Buffer from string
 * 3. Convert to base64
 * 4. Replace +  with -, / with _, remove =
 *
 * @param {Object} data - Data to encode
 * @returns {string} Base64URL encoded string
 */
function base64UrlEncode(data) {
  // Your code here
}

/**
 * TODO 2: Implement Base64URL decoding
 *
 * Reverse of encoding
 *
 * @param {string} str - Base64URL encoded string
 * @returns {Object} Decoded data
 */
function base64UrlDecode(str) {
  // Your code here
}

// Test Task 1
try {
  const testData = { sub: 'user-123', name: 'Test User' };
  const encoded = base64UrlEncode(testData);
  const decoded = base64UrlDecode(encoded);

  console.log('Original:', testData);
  console.log('Encoded:', encoded);
  console.log('Decoded:', decoded);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Generate RSA Key Pair for JWT
console.log('Task 2: Generate RSA key pair');

/**
 * TODO 3: Generate RSA key pair for signing JWTs
 *
 * Steps:
 * 1. Use crypto.generateKeyPairSync('rsa', options)
 * 2. Set modulusLength to 2048
 * 3. Export public key as SPKI/PEM
 * 4. Export private key as PKCS8/PEM
 *
 * @returns {Object} { publicKey, privateKey }
 */
function generateKeyPair() {
  // Your code here
}

// Test Task 2
try {
  const keys = generateKeyPair();
  console.log('Public key:', keys.publicKey ? 'Generated' : 'Missing');
  console.log('Private key:', keys.privateKey ? 'Generated' : 'Missing');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Sign JWT with RS256
console.log('Task 3: Sign JWT token');

/**
 * TODO 4: Sign JWT with RS256
 *
 * JWT structure: header.payload.signature
 *
 * Steps:
 * 1. Create header { alg: 'RS256', typ: 'JWT' }
 * 2. Encode header with base64UrlEncode
 * 3. Add iat (issued at) and exp (expiration) to payload
 * 4. Encode payload with base64UrlEncode
 * 5. Create message: encodedHeader.encodedPayload
 * 6. Sign message with private key using RSA-SHA256
 * 7. Encode signature as base64url
 * 8. Return header.payload.signature
 *
 * @param {Object} payload - Token payload
 * @param {string} privateKey - RSA private key
 * @param {number} expiresIn - Expiration in seconds
 * @returns {string} JWT token
 */
function signJWT(payload, privateKey, expiresIn = 3600) {
  // Your code here
}

// Test Task 3
try {
  const keys = generateKeyPair();
  const payload = { sub: 'user-123', role: 'admin' };
  const token = signJWT(payload, keys.privateKey, 900);

  console.log('Token:', token ? token.substring(0, 50) + '...' : 'Not generated');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Verify JWT
console.log('Task 4: Verify JWT token');

/**
 * TODO 5: Verify JWT token
 *
 * Steps:
 * 1. Split token by '.'
 * 2. Extract header, payload, signature
 * 3. Create message: header.payload
 * 4. Verify signature using public key
 * 5. Decode payload
 * 6. Check expiration (exp claim)
 * 7. Return decoded payload if valid
 *
 * @param {string} token - JWT token
 * @param {string} publicKey - RSA public key
 * @returns {Object} Decoded payload
 */
function verifyJWT(token, publicKey) {
  // Your code here
}

// Test Task 4
try {
  const keys = generateKeyPair();
  const payload = { sub: 'user-456', role: 'user' };
  const token = signJWT(payload, keys.privateKey, 900);
  const decoded = verifyJWT(token, keys.publicKey);

  console.log('Original payload:', payload);
  console.log('Decoded payload:', decoded);
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Implement Complete Auth System
console.log('Task 5: Complete authentication system');

/**
 * TODO 6: Implement complete authentication system
 *
 * Requirements:
 * - login(username, password) - Returns { accessToken, refreshToken }
 * - refresh(refreshToken) - Returns new accessToken
 * - logout(refreshToken) - Revokes refresh token
 * - verifyAccess(accessToken) - Validates access token
 *
 * Features:
 * - Access tokens expire in 15 minutes
 * - Refresh tokens expire in 30 days
 * - Refresh token rotation (new token on each refresh)
 * - Token revocation support
 */
class AuthenticationSystem {
  constructor() {
    // Generate keys
    const keys = generateKeyPair();
    this.publicKey = keys.publicKey;
    this.privateKey = keys.privateKey;

    // Storage (in production: use Redis/database)
    this.users = new Map();
    this.refreshTokens = new Map();
    this.revokedTokens = new Set();
  }

  /**
   * TODO 7: Register user
   *
   * Steps:
   * 1. Check if user exists
   * 2. Hash password with pbkdf2
   * 3. Generate salt
   * 4. Store user with hash and salt
   */
  async registerUser(username, password) {
    // Your code here
  }

  /**
   * TODO 8: Login user
   *
   * Steps:
   * 1. Verify user credentials
   * 2. Create access token (15 min expiry)
   * 3. Create refresh token (30 day expiry)
   * 4. Store refresh token
   * 5. Return both tokens
   */
  async login(username, password) {
    // Your code here
  }

  /**
   * TODO 9: Refresh access token
   *
   * Steps:
   * 1. Verify refresh token
   * 2. Check if revoked
   * 3. Create new access token
   * 4. Rotate refresh token (optional but recommended)
   * 5. Return new tokens
   */
  async refresh(refreshToken) {
    // Your code here
  }

  /**
   * TODO 10: Logout user
   *
   * Steps:
   * 1. Verify refresh token
   * 2. Add to revoked list
   * 3. Remove from active tokens
   */
  async logout(refreshToken) {
    // Your code here
  }

  /**
   * TODO 11: Verify access token
   *
   * Steps:
   * 1. Verify JWT signature
   * 2. Check expiration
   * 3. Check if revoked
   * 4. Return payload
   */
  verifyAccess(accessToken) {
    // Your code here
  }
}

// Test Task 5
async function testAuthSystem() {
  try {
    const auth = new AuthenticationSystem();

    // Register user
    await auth.registerUser('alice', 'SecurePassword123!');
    console.log('User registered');

    // Login
    const tokens = await auth.login('alice', 'SecurePassword123!');
    console.log('Login successful, tokens received');

    // Verify access token
    const payload = auth.verifyAccess(tokens.accessToken);
    console.log('Access token verified:', payload?.sub || 'Failed');

    // Refresh token
    const newTokens = await auth.refresh(tokens.refreshToken);
    console.log('Token refreshed');

    // Logout
    await auth.logout(newTokens.refreshToken);
    console.log('Logout successful');

    console.log('✓ Task 5 implementation needed\n');
  } catch (err) {
    console.log('✗ Error:', err.message, '\n');
  }
}

testAuthSystem();

// Bonus: Implement rate limiting for authentication
console.log('Bonus: Add rate limiting to prevent brute force');

/**
 * BONUS TODO: Implement rate limiter
 *
 * Requirements:
 * - Limit login attempts per user (5 per minute)
 * - Track failed attempts
 * - Implement exponential backoff
 * - Reset on successful login
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  /**
   * BONUS TODO: Check if request is allowed
   */
  checkLimit(identifier) {
    // Your code here
  }

  /**
   * BONUS TODO: Record failed attempt
   */
  recordAttempt(identifier) {
    // Your code here
  }

  /**
   * BONUS TODO: Reset attempts
   */
  reset(identifier) {
    // Your code here
  }
}

console.log('\n=== Exercise 1 Complete ===');
console.log('Run this file and implement all TODOs');
console.log('Then compare with solution file\n');
