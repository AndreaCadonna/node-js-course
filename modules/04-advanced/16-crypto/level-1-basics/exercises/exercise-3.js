/**
 * Exercise 3: Message Authenticator
 *
 * OBJECTIVE:
 * Learn to create and verify message authentication codes (HMAC) for data integrity
 * and authenticity verification.
 *
 * REQUIREMENTS:
 * 1. Create HMAC signatures for messages
 * 2. Verify message authenticity
 * 3. Detect message tampering
 * 4. Build signed API requests
 * 5. Implement webhook signature verification
 *
 * LEARNING GOALS:
 * - Understanding HMAC (Hash-based Message Authentication Code)
 * - Using crypto.createHmac() with secret keys
 * - Verifying message authenticity and integrity
 * - Understanding the difference between hashing and HMAC
 * - Implementing timing-safe comparison
 */

const crypto = require('crypto');

console.log('=== Exercise 3: Message Authenticator ===\n');

// Task 1: Create HMAC signature
console.log('Task 1: Create HMAC signature');
/**
 * TODO 1: Implement function to create HMAC signature
 *
 * Steps:
 * 1. Create HMAC object using crypto.createHmac(algorithm, secret)
 * 2. Update with message data
 * 3. Generate digest as hexadecimal
 * 4. Return the signature
 *
 * @param {string} message - Message to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default 'sha256')
 * @returns {string} HMAC signature
 *
 * Hint: Similar to createHash, but createHmac needs a secret key
 */
function createSignature(message, secret, algorithm = 'sha256') {
  // Your code here
}

// Test Task 1
try {
  const message1 = 'Important message';
  const secret1 = 'my-secret-key';

  const signature1 = createSignature(message1, secret1);
  const signature2 = createSignature(message1, secret1); // Same inputs
  const signature3 = createSignature(message1, 'different-key'); // Different key

  console.log('Message:', message1);
  console.log('Signature:', signature1);
  console.log('Signatures match (same key):', signature1 === signature2);
  console.log('Signatures differ (different key):', signature1 !== signature3);
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Verify message authenticity
console.log('Task 2: Verify message signature');
/**
 * TODO 2: Implement function to verify HMAC signature
 *
 * Steps:
 * 1. Create HMAC signature of the message with the secret
 * 2. Compare with provided signature
 * 3. Use timing-safe comparison (crypto.timingSafeEqual)
 * 4. Return true if signatures match
 *
 * @param {string} message - Message to verify
 * @param {string} signature - Provided signature
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm
 * @returns {boolean} True if signature is valid
 *
 * Hint: Use createSignature from Task 1
 * Hint: Convert both signatures to Buffer for timingSafeEqual
 * Hint: crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
 */
function verifySignature(message, signature, secret, algorithm = 'sha256') {
  // Your code here
}

// Test Task 2
try {
  const message = 'Authentic message';
  const secret = 'shared-secret';
  const validSignature = createSignature(message, secret);
  const invalidSignature = createSignature('Tampered message', secret);

  const isValid = verifySignature(message, validSignature, secret);
  const isInvalid = verifySignature(message, invalidSignature, secret);

  console.log('Valid signature verified:', isValid, '(should be true)');
  console.log('Invalid signature rejected:', !isInvalid, '(should be true)');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Sign API request
console.log('Task 3: Sign API request with timestamp');
/**
 * TODO 3: Implement function to sign API request
 *
 * Steps:
 * 1. Combine method, path, body, and timestamp into payload
 * 2. Create HMAC signature of the payload
 * 3. Return object with signature and timestamp
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @param {string} apiSecret - API secret key
 * @returns {Object} Object with signature and timestamp
 *
 * Hint: Stringify body with JSON.stringify()
 * Hint: Include timestamp to prevent replay attacks
 * Format: `${method}:${path}:${bodyString}:${timestamp}`
 */
function signAPIRequest(method, path, body, apiSecret) {
  // Your code here
  // 1. Get current timestamp (Date.now())
  // 2. Create payload string combining all parts
  // 3. Create signature of payload
  // 4. Return { signature, timestamp }
}

// Test Task 3
try {
  const apiSecret = 'api-secret-key-12345';
  const requestData = signAPIRequest(
    'POST',
    '/api/users',
    { name: 'John Doe', email: 'john@example.com' },
    apiSecret
  );

  console.log('Signed API request:', requestData);
  console.log('Has signature:', !!requestData?.signature);
  console.log('Has timestamp:', !!requestData?.timestamp);
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Verify API request
console.log('Task 4: Verify signed API request');
/**
 * TODO 4: Implement function to verify signed API request
 *
 * Steps:
 * 1. Reconstruct the payload from request data
 * 2. Verify the signature matches
 * 3. Check timestamp is recent (within 5 minutes)
 * 4. Return object with valid status and reason
 *
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @param {string} signature - Provided signature
 * @param {number} timestamp - Request timestamp
 * @param {string} apiSecret - API secret key
 * @returns {Object} { valid: boolean, reason: string }
 *
 * Hint: Check timestamp age: (Date.now() - timestamp) < 5 * 60 * 1000
 */
function verifyAPIRequest(method, path, body, signature, timestamp, apiSecret) {
  // Your code here
  // 1. Check if timestamp is recent (within 5 minutes)
  // 2. Reconstruct payload same way as signAPIRequest
  // 3. Verify signature
  // 4. Return { valid: true/false, reason: '...' }
}

// Test Task 4
try {
  const secret = 'test-secret';
  const signedReq = signAPIRequest('GET', '/api/data', {}, secret);

  const verification1 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    signedReq?.signature || '',
    signedReq?.timestamp || 0,
    secret
  );

  console.log('Valid request:', verification1);

  // Test with wrong signature
  const verification2 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    'wrong-signature',
    signedReq?.timestamp || 0,
    secret
  );

  console.log('Invalid signature:', verification2);

  // Test with old timestamp
  const verification3 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    signedReq?.signature || '',
    Date.now() - 10 * 60 * 1000, // 10 minutes ago
    secret
  );

  console.log('Expired timestamp:', verification3);
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Webhook signature verification
console.log('Task 5: Webhook signature system');
/**
 * TODO 5: Implement WebhookVerifier class
 *
 * This simulates webhook systems like GitHub, Stripe, etc.
 */
class WebhookVerifier {
  /**
   * TODO: Initialize with webhook secret
   * @param {string} webhookSecret - Secret key for webhooks
   */
  constructor(webhookSecret) {
    // Your code here
  }

  /**
   * TODO: Sign webhook payload
   * @param {Object} payload - Webhook data
   * @returns {string} Signature
   *
   * Hint: Use SHA-256 HMAC
   * Hint: Stringify the payload object
   */
  sign(payload) {
    // Your code here
  }

  /**
   * TODO: Verify webhook signature
   * @param {Object} payload - Webhook data
   * @param {string} signature - Provided signature
   * @returns {boolean} True if valid
   *
   * Hint: Create signature of payload and compare
   */
  verify(payload, signature) {
    // Your code here
  }

  /**
   * TODO: Generate signed webhook event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {Object} Event with signature
   */
  createEvent(event, data) {
    // Your code here
    // Return object with: event, data, timestamp, signature
  }
}

// Test Task 5
try {
  const webhookSecret = 'webhook-secret-key';
  const verifier = new WebhookVerifier(webhookSecret);

  const webhookEvent = verifier.createEvent('user.created', {
    id: 123,
    name: 'Jane Doe',
    email: 'jane@example.com'
  });

  console.log('Webhook event:', webhookEvent);

  const isValid = verifier.verify(
    { event: webhookEvent?.event, data: webhookEvent?.data, timestamp: webhookEvent?.timestamp },
    webhookEvent?.signature || ''
  );

  console.log('Webhook signature valid:', isValid, '(should be true)');

  // Test with tampered data
  const tamperedValid = verifier.verify(
    { event: 'user.deleted', data: webhookEvent?.data, timestamp: webhookEvent?.timestamp },
    webhookEvent?.signature || ''
  );

  console.log('Tampered webhook rejected:', !tamperedValid, '(should be true)');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: JWT-style signature (simplified)
console.log('Bonus Challenge: Create simple JWT-style token');
/**
 * TODO BONUS: Create simplified JWT-style signed token
 *
 * JWT format: header.payload.signature
 * All parts are base64-encoded
 *
 * Steps:
 * 1. Create header object { alg: 'HS256', typ: 'JWT' }
 * 2. Encode header and payload as base64
 * 3. Create signature of "header.payload"
 * 4. Return "header.payload.signature"
 *
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key
 * @returns {string} JWT-style token
 *
 * Hint: Use Buffer.from(JSON.stringify(obj)).toString('base64')
 * Hint: Create signature of `${encodedHeader}.${encodedPayload}`
 */
function createSimpleJWT(payload, secret) {
  // Your code here
  // 1. Create header
  // 2. Base64 encode header
  // 3. Base64 encode payload
  // 4. Create signature
  // 5. Return combined token
}

// Test Bonus
try {
  const jwtPayload = {
    userId: 123,
    username: 'johndoe',
    exp: Date.now() + 3600000 // 1 hour
  };

  const token = createSimpleJWT(jwtPayload, 'jwt-secret');
  console.log('JWT token:', token);
  console.log('Has 3 parts:', (token?.split('.') || []).length === 3);
  console.log('✓ Bonus implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 3 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('\nKey Takeaways:');
console.log('- HMAC provides both integrity AND authenticity (requires secret key)');
console.log('- Regular hash only provides integrity (no secret, anyone can verify)');
console.log('- Use crypto.timingSafeEqual() to prevent timing attacks');
console.log('- Include timestamps to prevent replay attacks');
console.log('- HMAC is used in APIs, webhooks, JWTs, and more');
