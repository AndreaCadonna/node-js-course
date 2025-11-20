/**
 * Exercise 3: Message Authenticator - SOLUTION
 *
 * This solution demonstrates:
 * - Creating HMAC signatures for message authentication
 * - Verifying message authenticity and integrity
 * - Detecting message tampering
 * - Signing API requests with timestamps
 * - Implementing webhook signature verification
 * - Understanding HMAC vs regular hashing
 */

const crypto = require('crypto');

console.log('=== Exercise 3: Message Authenticator - SOLUTION ===\n');

// ============================================================================
// Task 1: Create HMAC signature
// ============================================================================
console.log('Task 1: Create HMAC signature');

/**
 * Creates an HMAC signature for a message
 *
 * WHAT IS HMAC?
 * - Hash-based Message Authentication Code
 * - Combines a cryptographic hash with a secret key
 * - Provides BOTH integrity AND authenticity
 * - Cannot be forged without knowing the secret
 *
 * HMAC vs HASH:
 * - Hash: Anyone can verify (no secret)
 * - HMAC: Only those with secret can create/verify
 *
 * COMMON USES:
 * - API request signing
 * - Webhook verification
 * - JWT signatures
 * - Cookie integrity
 * - Message authentication
 *
 * @param {string} message - Message to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default 'sha256')
 * @returns {string} HMAC signature in hex format
 */
function createSignature(message, secret, algorithm = 'sha256') {
  // Create HMAC with algorithm and secret
  const hmac = crypto.createHmac(algorithm, secret);

  // Update with message data
  hmac.update(message);

  // Return digest as hexadecimal string
  return hmac.digest('hex');
}

// ALTERNATIVE APPROACH: One-liner using method chaining
function createSignatureOneLiner(message, secret, algorithm = 'sha256') {
  return crypto.createHmac(algorithm, secret).update(message).digest('hex');
}

// ALTERNATIVE APPROACH: With different output formats
function createSignatureMultiFormat(message, secret, algorithm = 'sha256') {
  return {
    hex: crypto.createHmac(algorithm, secret).update(message).digest('hex'),
    base64: crypto.createHmac(algorithm, secret).update(message).digest('base64'),
    buffer: crypto.createHmac(algorithm, secret).update(message).digest()
  };
}

// Test Task 1
try {
  const message1 = 'Important message';
  const secret1 = 'my-secret-key';

  const signature1 = createSignature(message1, secret1);
  const signature2 = createSignature(message1, secret1); // Same inputs
  const signature3 = createSignature(message1, 'different-key'); // Different key
  const signature4 = createSignature('Different message', secret1); // Different message

  console.log('Message:', message1);
  console.log('Secret:', secret1);
  console.log('Signature:', signature1);
  console.log('\nSignatures match (same inputs):', signature1 === signature2, '✓');
  console.log('Signatures differ (different key):', signature1 !== signature3, '✓');
  console.log('Signatures differ (different msg):', signature1 !== signature4, '✓');

  // Show multi-format
  const formats = createSignatureMultiFormat('test', 'secret');
  console.log('\nDifferent formats:');
  console.log('  Hex length:', formats.hex.length);
  console.log('  Base64 length:', formats.base64.length);
  console.log('  Buffer length:', formats.buffer.length, 'bytes');
  console.log('✓ Task 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 2: Verify message authenticity
// ============================================================================
console.log('Task 2: Verify message signature');

/**
 * Verifies an HMAC signature
 *
 * WHY TIMING-SAFE COMPARISON?
 * - Regular === comparison can leak timing information
 * - Attackers can measure how long comparison takes
 * - This reveals how many characters matched
 * - crypto.timingSafeEqual() always takes same time
 *
 * SECURITY IMPORTANCE:
 * - Prevents timing attacks
 * - Essential for cryptographic operations
 * - Always use for comparing secrets/signatures
 *
 * @param {string} message - Message to verify
 * @param {string} signature - Provided signature
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm
 * @returns {boolean} True if signature is valid
 */
function verifySignature(message, signature, secret, algorithm = 'sha256') {
  try {
    // Create expected signature
    const expectedSignature = createSignature(message, secret, algorithm);

    // Convert both to Buffers for timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(signature, 'hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (err) {
    // If lengths differ or invalid encoding, signatures don't match
    return false;
  }
}

// ALTERNATIVE APPROACH: Without timing-safe comparison (NOT recommended for production)
function verifySignatureSimple(message, signature, secret, algorithm = 'sha256') {
  const expectedSignature = createSignature(message, secret, algorithm);
  return expectedSignature === signature; // Vulnerable to timing attacks!
}

// Test Task 2
try {
  const message = 'Authentic message';
  const secret = 'shared-secret';
  const validSignature = createSignature(message, secret);
  const invalidSignature = createSignature('Tampered message', secret);

  const isValid = verifySignature(message, validSignature, secret);
  const isInvalid = verifySignature(message, invalidSignature, secret);
  const wrongSecret = verifySignature(message, validSignature, 'wrong-secret');

  console.log('Valid signature verified:', isValid, '✓');
  console.log('Invalid signature rejected:', !isInvalid, '✓');
  console.log('Wrong secret rejected:', !wrongSecret, '✓');

  // Test edge cases
  const emptyMsg = verifySignature('', createSignature('', secret), secret);
  console.log('Empty message works:', emptyMsg, '✓');

  // Demonstrate timing attack vulnerability
  console.log('\nTiming comparison:');
  console.log('  Safe comparison always takes same time');
  console.log('  Simple === can reveal partial matches (timing attack)');
  console.log('✓ Task 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 3: Sign API request
// ============================================================================
console.log('Task 3: Sign API request with timestamp');

/**
 * Signs an API request with timestamp
 *
 * WHY INCLUDE TIMESTAMP?
 * - Prevents replay attacks
 * - Signature becomes invalid after time window
 * - Attacker can't reuse captured requests
 * - Provides audit trail
 *
 * PAYLOAD FORMAT:
 * - Combines: method, path, body, timestamp
 * - All parts affect signature
 * - Changing any part invalidates signature
 *
 * REAL-WORLD USAGE:
 * - AWS request signing
 * - Stripe API
 * - GitHub webhooks
 * - OAuth signatures
 *
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @param {string} apiSecret - API secret key
 * @returns {Object} Object with signature and timestamp
 */
function signAPIRequest(method, path, body, apiSecret) {
  // Get current timestamp
  const timestamp = Date.now();

  // Stringify body for consistent representation
  const bodyString = JSON.stringify(body);

  // Create payload combining all parts
  // Format: METHOD:PATH:BODY:TIMESTAMP
  const payload = `${method}:${path}:${bodyString}:${timestamp}`;

  // Create HMAC signature of payload
  const signature = createSignature(payload, apiSecret);

  return {
    signature,
    timestamp
  };
}

// ALTERNATIVE APPROACH: With nonce for additional security
function signAPIRequestWithNonce(method, path, body, apiSecret) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex'); // Unique per request
  const bodyString = JSON.stringify(body);

  const payload = `${method}:${path}:${bodyString}:${timestamp}:${nonce}`;
  const signature = createSignature(payload, apiSecret);

  return {
    signature,
    timestamp,
    nonce
  };
}

// ALTERNATIVE APPROACH: Canonical request format (AWS-style)
function signAPIRequestCanonical(method, path, body, apiSecret, headers = {}) {
  const timestamp = new Date().toISOString();

  // Canonical format: method + path + sorted headers + body + timestamp
  const sortedHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n');

  const bodyString = JSON.stringify(body);
  const payload = [method, path, sortedHeaders, bodyString, timestamp].join('\n');

  const signature = createSignature(payload, apiSecret);

  return {
    signature,
    timestamp,
    headers: {
      ...headers,
      'X-Signature': signature,
      'X-Timestamp': timestamp
    }
  };
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
  console.log('Has signature:', requestData.signature.length === 64, '✓');
  console.log('Has timestamp:', typeof requestData.timestamp === 'number', '✓');

  // Test with nonce
  const withNonce = signAPIRequestWithNonce('GET', '/api/data', {}, apiSecret);
  console.log('\nWith nonce:', {
    signature: withNonce.signature.substring(0, 20) + '...',
    timestamp: withNonce.timestamp,
    nonce: withNonce.nonce.substring(0, 16) + '...'
  });

  // Test canonical format
  const canonical = signAPIRequestCanonical(
    'POST',
    '/api/resource',
    { data: 'value' },
    apiSecret,
    { 'content-type': 'application/json', 'x-api-key': 'key123' }
  );
  console.log('\nCanonical format headers:', canonical.headers);
  console.log('✓ Task 3 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 4: Verify API request
// ============================================================================
console.log('Task 4: Verify signed API request');

/**
 * Verifies a signed API request
 *
 * VERIFICATION STEPS:
 * 1. Check timestamp is recent (prevent replay)
 * 2. Reconstruct payload exactly as in signing
 * 3. Verify signature matches
 * 4. Return detailed result
 *
 * TIME WINDOW:
 * - Typically 5 minutes (300 seconds)
 * - Too short: legitimate requests fail
 * - Too long: replay attack window increases
 * - Adjust based on security needs
 *
 * @param {string} method - HTTP method
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @param {string} signature - Provided signature
 * @param {number} timestamp - Request timestamp
 * @param {string} apiSecret - API secret key
 * @returns {Object} { valid: boolean, reason: string }
 */
function verifyAPIRequest(method, path, body, signature, timestamp, apiSecret) {
  // Check if timestamp is recent (within 5 minutes)
  const now = Date.now();
  const age = now - timestamp;
  const maxAge = 5 * 60 * 1000; // 5 minutes in milliseconds

  if (age > maxAge) {
    return {
      valid: false,
      reason: 'Request timestamp too old (replay attack prevention)'
    };
  }

  if (age < 0) {
    return {
      valid: false,
      reason: 'Request timestamp is in the future'
    };
  }

  // Reconstruct payload exactly as in signing
  const bodyString = JSON.stringify(body);
  const payload = `${method}:${path}:${bodyString}:${timestamp}`;

  // Verify signature
  const isValid = verifySignature(payload, signature, apiSecret);

  if (!isValid) {
    return {
      valid: false,
      reason: 'Signature verification failed (tampered or wrong secret)'
    };
  }

  return {
    valid: true,
    reason: 'Request is authentic and recent'
  };
}

// ALTERNATIVE APPROACH: With configurable time window
function verifyAPIRequestConfigurable(method, path, body, signature, timestamp, apiSecret, options = {}) {
  const maxAge = options.maxAgeSeconds || 300; // Default 5 minutes
  const now = Date.now();
  const age = (now - timestamp) / 1000; // Age in seconds

  if (age > maxAge) {
    return {
      valid: false,
      reason: `Timestamp too old (${Math.floor(age)}s > ${maxAge}s)`,
      ageSeconds: age
    };
  }

  const bodyString = JSON.stringify(body);
  const payload = `${method}:${path}:${bodyString}:${timestamp}`;
  const isValid = verifySignature(payload, signature, apiSecret);

  return {
    valid: isValid,
    reason: isValid ? 'Valid' : 'Signature mismatch',
    ageSeconds: age
  };
}

// Test Task 4
try {
  const secret = 'test-secret';
  const signedReq = signAPIRequest('GET', '/api/data', {}, secret);

  // Test valid request
  const verification1 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    signedReq.signature,
    signedReq.timestamp,
    secret
  );
  console.log('Valid request:', verification1);

  // Test with wrong signature
  const verification2 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    'wrong-signature-12345678901234567890123456789012',
    signedReq.timestamp,
    secret
  );
  console.log('\nInvalid signature:', verification2);

  // Test with old timestamp
  const verification3 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    signedReq.signature,
    Date.now() - 10 * 60 * 1000, // 10 minutes ago
    secret
  );
  console.log('\nExpired timestamp:', verification3);

  // Test with future timestamp
  const verification4 = verifyAPIRequest(
    'GET',
    '/api/data',
    {},
    signedReq.signature,
    Date.now() + 60 * 1000, // 1 minute in future
    secret
  );
  console.log('\nFuture timestamp:', verification4);

  // Test tampered body
  const verification5 = verifyAPIRequest(
    'GET',
    '/api/data',
    { tampered: true }, // Different body
    signedReq.signature,
    signedReq.timestamp,
    secret
  );
  console.log('\nTampered body:', verification5);
  console.log('✓ Task 4 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 5: Webhook signature system
// ============================================================================
console.log('Task 5: Webhook signature system');

/**
 * Webhook signature verification system
 *
 * WEBHOOK SECURITY:
 * - Verifies webhook actually came from expected source
 * - Prevents attackers from forging webhooks
 * - Ensures data hasn't been tampered with
 * - Industry standard (GitHub, Stripe, etc.)
 *
 * IMPLEMENTATION PATTERNS:
 * - Provider signs payload with shared secret
 * - Receiver verifies signature
 * - Signature often sent in header (X-Signature)
 * - May include timestamp or nonce
 */
class WebhookVerifier {
  /**
   * Initialize with webhook secret
   * @param {string} webhookSecret - Secret key for webhooks
   */
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
    this.algorithm = 'sha256';
  }

  /**
   * Sign webhook payload
   * @param {Object} payload - Webhook data
   * @returns {string} Signature
   */
  sign(payload) {
    // Stringify payload for consistent representation
    const payloadString = JSON.stringify(payload);

    // Create HMAC signature
    return createSignature(payloadString, this.webhookSecret, this.algorithm);
  }

  /**
   * Verify webhook signature
   * @param {Object} payload - Webhook data
   * @param {string} signature - Provided signature
   * @returns {boolean} True if valid
   */
  verify(payload, signature) {
    const payloadString = JSON.stringify(payload);
    return verifySignature(payloadString, signature, this.webhookSecret, this.algorithm);
  }

  /**
   * Generate signed webhook event
   * @param {string} event - Event type
   * @param {Object} data - Event data
   * @returns {Object} Event with signature
   */
  createEvent(event, data) {
    const timestamp = Date.now();

    const payload = {
      event,
      data,
      timestamp
    };

    const signature = this.sign(payload);

    return {
      ...payload,
      signature
    };
  }
}

// ALTERNATIVE APPROACH: GitHub-style webhook verification
class GitHubWebhookVerifier extends WebhookVerifier {
  /**
   * Verify webhook in GitHub format
   * Header format: sha256=<signature>
   */
  verifyGitHubStyle(payload, signatureHeader) {
    // Extract algorithm and signature from header
    const match = signatureHeader.match(/^(\w+)=([0-9a-f]+)$/);
    if (!match) {
      return false;
    }

    const [, algorithm, signature] = match;
    const payloadString = JSON.stringify(payload);

    return verifySignature(payloadString, signature, this.webhookSecret, algorithm);
  }

  /**
   * Create GitHub-style signature header
   */
  createGitHubSignature(payload) {
    const signature = this.sign(payload);
    return `${this.algorithm}=${signature}`;
  }
}

// ALTERNATIVE APPROACH: Stripe-style with multiple signatures
class StripeWebhookVerifier extends WebhookVerifier {
  /**
   * Verify webhook with timestamp and multiple signature versions
   * Stripe format: t=<timestamp>,v1=<sig>,v0=<sig>
   */
  verifyStripeStyle(payloadString, signatureHeader, tolerance = 300) {
    // Parse signature header
    const parts = signatureHeader.split(',');
    const timestamp = parseInt(parts.find(p => p.startsWith('t='))?.split('=')[1] || '0');
    const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.split('=')[1]);

    // Check timestamp tolerance
    const age = (Date.now() - timestamp) / 1000;
    if (age > tolerance) {
      return false;
    }

    // Construct signed payload: timestamp.payloadString
    const signedPayload = `${timestamp}.${payloadString}`;

    // Verify against any of the signatures
    return signatures.some(sig =>
      verifySignature(signedPayload, sig, this.webhookSecret)
    );
  }
}

// Test Task 5
try {
  const webhookSecret = 'webhook-secret-key';
  const verifier = new WebhookVerifier(webhookSecret);

  // Create and verify webhook event
  const webhookEvent = verifier.createEvent('user.created', {
    id: 123,
    name: 'Jane Doe',
    email: 'jane@example.com'
  });

  console.log('Webhook event:', {
    event: webhookEvent.event,
    data: webhookEvent.data,
    timestamp: new Date(webhookEvent.timestamp).toISOString(),
    signature: webhookEvent.signature.substring(0, 20) + '...'
  });

  const isValid = verifier.verify(
    {
      event: webhookEvent.event,
      data: webhookEvent.data,
      timestamp: webhookEvent.timestamp
    },
    webhookEvent.signature
  );

  console.log('\nWebhook signature valid:', isValid, '✓');

  // Test with tampered data
  const tamperedValid = verifier.verify(
    {
      event: 'user.deleted', // Changed event type
      data: webhookEvent.data,
      timestamp: webhookEvent.timestamp
    },
    webhookEvent.signature
  );

  console.log('Tampered webhook rejected:', !tamperedValid, '✓');

  // Test GitHub-style
  const githubVerifier = new GitHubWebhookVerifier(webhookSecret);
  const githubPayload = { action: 'opened', pull_request: { id: 1 } };
  const githubSig = githubVerifier.createGitHubSignature(githubPayload);
  const githubValid = githubVerifier.verifyGitHubStyle(githubPayload, githubSig);

  console.log('\nGitHub-style signature:', githubSig.substring(0, 30) + '...');
  console.log('GitHub verification:', githubValid, '✓');
  console.log('✓ Task 5 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge: JWT-style signature
// ============================================================================
console.log('Bonus Challenge: Create simple JWT-style token');

/**
 * Creates a simplified JWT-style signed token
 *
 * JWT STRUCTURE:
 * - header.payload.signature
 * - Header: algorithm info
 * - Payload: actual data
 * - Signature: HMAC of header.payload
 *
 * NOTE: This is simplified for learning
 * Use a proper JWT library in production (jsonwebtoken, jose)
 *
 * @param {Object} payload - Token payload
 * @param {string} secret - Secret key
 * @returns {string} JWT-style token
 */
function createSimpleJWT(payload, secret) {
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Base64 encode header
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

  // Base64 encode payload
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

  // Create signature of "header.payload"
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64url');

  // Return combined token
  return `${dataToSign}.${signature}`;
}

// ALTERNATIVE APPROACH: With verification
function verifySimpleJWT(token, secret) {
  try {
    // Split token into parts
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      return { valid: false, reason: 'Invalid token format' };
    }

    // Recreate signature
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(dataToVerify)
      .digest('base64url');

    // Verify signature
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!valid) {
      return { valid: false, reason: 'Signature verification failed' };
    }

    // Decode payload
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());

    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp) {
      return { valid: false, reason: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
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
  console.log('Has 3 parts:', token.split('.').length === 3, '✓');

  // Verify token
  const verification = verifySimpleJWT(token, 'jwt-secret');
  console.log('\nToken verification:', verification.valid, '✓');
  console.log('Decoded payload:', verification.payload);

  // Test with wrong secret
  const wrongSecret = verifySimpleJWT(token, 'wrong-secret');
  console.log('\nWrong secret rejected:', !wrongSecret.valid, '✓');

  // Test expired token
  const expiredToken = createSimpleJWT({ exp: Date.now() - 1000 }, 'jwt-secret');
  const expiredVerify = verifySimpleJWT(expiredToken, 'jwt-secret');
  console.log('Expired token rejected:', !expiredVerify.valid, '✓');
  console.log('Reason:', expiredVerify.reason);
  console.log('✓ Bonus Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Additional Examples: Best Practices
// ============================================================================
console.log('=== Best Practices & Additional Examples ===\n');

// Example 1: API signature middleware (Express-style)
function createAPISignatureMiddleware(secret) {
  return (req, res, next) => {
    const { signature, timestamp } = req.headers;
    const method = req.method;
    const path = req.path;
    const body = req.body;

    const result = verifyAPIRequest(method, path, body, signature, timestamp, secret);

    if (!result.valid) {
      return res.status(401).json({ error: result.reason });
    }

    next();
  };
}

// Example 2: Webhook handler with retry logic
class WebhookHandler {
  constructor(secret, maxRetries = 3) {
    this.verifier = new WebhookVerifier(secret);
    this.maxRetries = maxRetries;
    this.processedEvents = new Set(); // Prevent duplicate processing
  }

  async handleWebhook(event, signature) {
    // Verify signature
    if (!this.verifier.verify(event, signature)) {
      throw new Error('Invalid webhook signature');
    }

    // Check for duplicate (idempotency)
    const eventId = `${event.event}-${event.timestamp}`;
    if (this.processedEvents.has(eventId)) {
      return { status: 'duplicate', message: 'Event already processed' };
    }

    // Process event
    this.processedEvents.add(eventId);
    return { status: 'success', message: 'Event processed' };
  }
}

// Example 3: Message authentication with compression
function signCompressedMessage(message, secret) {
  const zlib = require('zlib');

  // Compress message
  const compressed = zlib.gzipSync(message);

  // Sign compressed data
  const signature = crypto
    .createHmac('sha256', secret)
    .update(compressed)
    .digest('hex');

  return {
    data: compressed.toString('base64'),
    signature,
    compressed: true
  };
}

// Test examples
console.log('1. API middleware:', typeof createAPISignatureMiddleware('secret'));
console.log('2. Webhook handler:', new WebhookHandler('secret').maxRetries);
console.log('3. Compressed signing:', !!signCompressedMessage('Hello', 'secret').signature);

console.log('\n=== Exercise 3 Complete ===');
console.log('\nKey Takeaways:');
console.log('✓ HMAC provides both integrity AND authenticity (requires secret key)');
console.log('✓ Regular hash only provides integrity (no secret, anyone can verify)');
console.log('✓ ALWAYS use crypto.timingSafeEqual() to prevent timing attacks');
console.log('✓ Include timestamps to prevent replay attacks');
console.log('✓ HMAC is used in APIs, webhooks, JWTs, and more');
console.log('✓ Secret must be kept confidential (never expose in code/logs)');
console.log('✓ Verification should be fast but secure');
console.log('✓ Different services use different signature formats (GitHub, Stripe, AWS)');
console.log('✓ Always verify before processing webhook data');
