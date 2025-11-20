/**
 * Exercise 4: API Authentication with HMAC
 *
 * OBJECTIVE:
 * Build a production-ready API authentication system using HMAC-based
 * request signing, signature verification, replay attack prevention,
 * and rate limiting.
 *
 * REQUIREMENTS:
 * 1. Implement HMAC-based request signing
 * 2. Create signature verification middleware
 * 3. Implement replay attack prevention with nonces
 * 4. Add timestamp validation
 * 5. Implement rate limiting and throttling
 *
 * LEARNING GOALS:
 * - Understanding HMAC for message authentication
 * - Implementing secure API authentication
 * - Preventing common API attacks
 * - Building production-ready middleware
 */

const crypto = require('crypto');

console.log('=== Exercise 4: API Authentication with HMAC ===\n');

// Task 1: Implement HMAC Request Signing
console.log('Task 1: HMAC request signing');

/**
 * TODO 1: Generate API credentials
 *
 * Creates API key (identifier) and secret (for signing).
 *
 * Steps:
 * 1. Generate random API key (32 bytes, hex encoded)
 * 2. Generate random API secret (32 bytes, hex encoded)
 * 3. Return both
 *
 * Hint: API key is public (like username), secret is private (like password)
 *
 * @returns {Object} { apiKey, apiSecret }
 */
function generateApiCredentials() {
  // Your code here
  // Example:
  // const apiKey = crypto.randomBytes(32).toString('hex');
  // const apiSecret = crypto.randomBytes(32).toString('hex');
  // return { apiKey, apiSecret };
}

/**
 * TODO 2: Create canonical request string
 *
 * Canonical form ensures same request produces same signature.
 *
 * Steps:
 * 1. Normalize HTTP method to uppercase
 * 2. Normalize path (remove query string)
 * 3. Sort query parameters alphabetically
 * 4. Hash request body with SHA-256
 * 5. Combine: METHOD\nPATH\nQUERY\nBODY_HASH\nTIMESTAMP
 *
 * Hint: Canonical form prevents signature bypass attacks
 * Hint: Include timestamp to prevent replay attacks
 *
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @param {Object} query - Query parameters
 * @param {string} body - Request body
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Canonical request string
 */
function createCanonicalRequest(method, path, query, body, timestamp) {
  // Your code here
  // Example structure:
  // const normalizedMethod = method.toUpperCase();
  //
  // // Sort query parameters
  // const sortedQuery = Object.keys(query || {})
  //   .sort()
  //   .map(key => `${key}=${query[key]}`)
  //   .join('&');
  //
  // // Hash body
  // const bodyHash = crypto.createHash('sha256')
  //   .update(body || '')
  //   .digest('hex');
  //
  // return [
  //   normalizedMethod,
  //   path,
  //   sortedQuery,
  //   bodyHash,
  //   timestamp
  // ].join('\n');
}

/**
 * TODO 3: Sign request with HMAC
 *
 * Creates HMAC signature of canonical request.
 *
 * Steps:
 * 1. Create canonical request string
 * 2. Create HMAC with SHA-256
 * 3. Use API secret as key
 * 4. Sign canonical request
 * 5. Return signature as hex string
 *
 * Hint: HMAC ensures both authenticity and integrity
 * Hint: Only holder of secret can create valid signature
 *
 * @param {string} canonicalRequest - Canonical request string
 * @param {string} apiSecret - API secret
 * @returns {string} HMAC signature
 */
function signRequest(canonicalRequest, apiSecret) {
  // Your code here
  // const hmac = crypto.createHmac('sha256', apiSecret);
  // hmac.update(canonicalRequest);
  // return hmac.digest('hex');
}

/**
 * TODO 4: Create complete signed request
 *
 * Combines all request signing steps.
 *
 * @param {Object} request - Request object
 * @param {string} apiKey - API key
 * @param {string} apiSecret - API secret
 * @returns {Object} Signed request with headers
 */
function createSignedRequest(request, apiKey, apiSecret) {
  // Your code here
  // const timestamp = Math.floor(Date.now() / 1000);
  // const nonce = crypto.randomBytes(16).toString('hex');
  //
  // const canonical = createCanonicalRequest(
  //   request.method,
  //   request.path,
  //   request.query,
  //   request.body,
  //   timestamp
  // );
  //
  // const signature = signRequest(canonical, apiSecret);
  //
  // return {
  //   ...request,
  //   headers: {
  //     ...request.headers,
  //     'X-API-Key': apiKey,
  //     'X-API-Signature': signature,
  //     'X-API-Timestamp': timestamp.toString(),
  //     'X-API-Nonce': nonce
  //   }
  // };
}

// Test Task 1
try {
  const credentials = generateApiCredentials();
  console.log('API Key:', credentials.apiKey ? credentials.apiKey.substring(0, 16) + '...' : 'Missing');
  console.log('API Secret:', credentials.apiSecret ? credentials.apiSecret.substring(0, 16) + '...' : 'Missing');

  const request = {
    method: 'POST',
    path: '/api/users',
    query: { page: '1', limit: '10' },
    body: JSON.stringify({ name: 'John' }),
    headers: {}
  };

  const signedRequest = createSignedRequest(request, credentials.apiKey, credentials.apiSecret);
  console.log('Signature:', signedRequest?.headers?.['X-API-Signature']?.substring(0, 16) + '...' || 'Missing');
  console.log('Timestamp:', signedRequest?.headers?.['X-API-Timestamp'] || 'Missing');
  console.log('Nonce:', signedRequest?.headers?.['X-API-Nonce']?.substring(0, 16) + '...' || 'Missing');

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Verify Request Signatures
console.log('Task 2: Signature verification');

/**
 * TODO 5: Verify request signature
 *
 * Verifies that request was signed by holder of API secret.
 *
 * Steps:
 * 1. Extract signature from headers
 * 2. Extract timestamp and validate (not too old)
 * 3. Recreate canonical request
 * 4. Compute expected signature
 * 5. Compare signatures (constant-time comparison!)
 * 6. Return validation result
 *
 * Hint: Use crypto.timingSafeEqual for constant-time comparison
 * Hint: Reject requests older than 5 minutes
 *
 * @param {Object} request - Request object with headers
 * @param {string} apiSecret - API secret
 * @returns {Object} { valid, error }
 */
function verifySignature(request, apiSecret) {
  // Your code here
  // Example structure:
  // const signature = request.headers['X-API-Signature'];
  // const timestamp = parseInt(request.headers['X-API-Timestamp']);
  //
  // if (!signature || !timestamp) {
  //   return { valid: false, error: 'Missing signature or timestamp' };
  // }
  //
  // // Check timestamp (within 5 minutes)
  // const now = Math.floor(Date.now() / 1000);
  // const maxAge = 300; // 5 minutes
  // if (Math.abs(now - timestamp) > maxAge) {
  //   return { valid: false, error: 'Request expired' };
  // }
  //
  // // Recreate canonical request
  // const canonical = createCanonicalRequest(
  //   request.method,
  //   request.path,
  //   request.query,
  //   request.body,
  //   timestamp
  // );
  //
  // // Compute expected signature
  // const expectedSignature = signRequest(canonical, apiSecret);
  //
  // // Constant-time comparison
  // const signatureBuffer = Buffer.from(signature, 'hex');
  // const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  //
  // if (signatureBuffer.length !== expectedBuffer.length) {
  //   return { valid: false, error: 'Invalid signature' };
  // }
  //
  // const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  //
  // return {
  //   valid: isValid,
  //   error: isValid ? null : 'Invalid signature'
  // };
}

// Test Task 2
try {
  const credentials = generateApiCredentials();

  const request = {
    method: 'POST',
    path: '/api/users',
    query: { page: '1' },
    body: JSON.stringify({ name: 'Alice' }),
    headers: {}
  };

  const signedRequest = createSignedRequest(request, credentials.apiKey, credentials.apiSecret);

  // Verify valid signature
  const result1 = verifySignature(signedRequest, credentials.apiSecret);
  console.log('Valid signature:', result1?.valid || false);

  // Tamper with request
  signedRequest.body = JSON.stringify({ name: 'Bob' });
  const result2 = verifySignature(signedRequest, credentials.apiSecret);
  console.log('Tampered request:', result2?.valid === false ? 'Rejected' : 'Not detected!');

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Implement Replay Attack Prevention
console.log('Task 3: Replay attack prevention');

/**
 * TODO 6: Build nonce tracker
 *
 * Tracks used nonces to prevent replay attacks.
 *
 * Requirements:
 * - Store recently used nonces
 * - Check if nonce was already used
 * - Automatically expire old nonces
 * - Handle high-volume scenarios
 */
class NonceTracker {
  constructor(expirationMs = 300000) { // 5 minutes
    this.nonces = new Map();
    this.expirationMs = expirationMs;
  }

  /**
   * TODO 7: Check and record nonce
   *
   * Steps:
   * 1. Check if nonce exists
   * 2. If exists, return false (replay attack!)
   * 3. If new, store with timestamp
   * 4. Clean up expired nonces
   * 5. Return true
   *
   * Hint: Nonce = "number used once"
   *
   * @param {string} nonce - Request nonce
   * @returns {boolean} True if nonce is new and valid
   */
  checkAndRecord(nonce) {
    // Your code here
    // if (this.nonces.has(nonce)) {
    //   return false; // Replay attack!
    // }
    //
    // this.nonces.set(nonce, Date.now());
    // this.cleanup();
    // return true;
  }

  /**
   * TODO 8: Clean up expired nonces
   *
   * Removes nonces older than expiration time
   */
  cleanup() {
    // Your code here
    // const now = Date.now();
    // for (const [nonce, timestamp] of this.nonces) {
    //   if (now - timestamp > this.expirationMs) {
    //     this.nonces.delete(nonce);
    //   }
    // }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeNonces: this.nonces.size,
      expirationMs: this.expirationMs
    };
  }
}

// Test Task 3
try {
  const tracker = new NonceTracker();

  const nonce1 = crypto.randomBytes(16).toString('hex');
  const nonce2 = crypto.randomBytes(16).toString('hex');

  console.log('First use of nonce1:', tracker.checkAndRecord(nonce1) ? 'Accepted' : 'Rejected');
  console.log('Second use of nonce1:', tracker.checkAndRecord(nonce1) ? 'Accepted (BAD!)' : 'Rejected (GOOD)');
  console.log('First use of nonce2:', tracker.checkAndRecord(nonce2) ? 'Accepted' : 'Rejected');

  console.log('Stats:', tracker.getStats());

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Implement Rate Limiting
console.log('Task 4: Rate limiting');

/**
 * TODO 9: Build rate limiter
 *
 * Prevents abuse by limiting request rate per API key.
 *
 * Requirements:
 * - Track requests per API key
 * - Implement sliding window
 * - Support different rate limits per endpoint
 * - Handle burst traffic
 */
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map(); // apiKey -> array of timestamps
  }

  /**
   * TODO 10: Check if request is allowed
   *
   * Steps:
   * 1. Get request history for API key
   * 2. Remove requests outside time window
   * 3. Check if under limit
   * 4. If allowed, record request
   * 5. Return result with remaining quota
   *
   * Hint: Sliding window is more accurate than fixed window
   *
   * @param {string} apiKey - API key
   * @returns {Object} { allowed, remaining, resetAt }
   */
  checkLimit(apiKey) {
    // Your code here
    // const now = Date.now();
    // const windowStart = now - this.windowMs;
    //
    // // Get or create request history
    // if (!this.requests.has(apiKey)) {
    //   this.requests.set(apiKey, []);
    // }
    //
    // const history = this.requests.get(apiKey);
    //
    // // Remove old requests
    // const recentRequests = history.filter(time => time > windowStart);
    // this.requests.set(apiKey, recentRequests);
    //
    // // Check limit
    // const allowed = recentRequests.length < this.maxRequests;
    //
    // if (allowed) {
    //   recentRequests.push(now);
    // }
    //
    // return {
    //   allowed,
    //   remaining: Math.max(0, this.maxRequests - recentRequests.length),
    //   resetAt: recentRequests.length > 0 ? recentRequests[0] + this.windowMs : now + this.windowMs
    // };
  }

  /**
   * TODO 11: Get rate limit info for API key
   */
  getInfo(apiKey) {
    // Your code here
    // const history = this.requests.get(apiKey) || [];
    // const now = Date.now();
    // const windowStart = now - this.windowMs;
    // const recentCount = history.filter(time => time > windowStart).length;
    //
    // return {
    //   limit: this.maxRequests,
    //   used: recentCount,
    //   remaining: Math.max(0, this.maxRequests - recentCount),
    //   windowMs: this.windowMs
    // };
  }
}

// Test Task 4
try {
  const limiter = new RateLimiter(5, 10000); // 5 requests per 10 seconds

  const apiKey = 'test-api-key';

  for (let i = 1; i <= 7; i++) {
    const result = limiter.checkLimit(apiKey);
    console.log(`Request ${i}: ${result?.allowed ? 'Allowed' : 'Rate limited'}, Remaining: ${result?.remaining || 0}`);
  }

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Build Complete API Authentication Middleware
console.log('Task 5: Complete authentication system');

/**
 * TODO 12: Build production-ready API authentication system
 *
 * Requirements:
 * - Manage API credentials
 * - Verify all incoming requests
 * - Prevent replay attacks
 * - Enforce rate limits
 * - Provide detailed logging
 * - Support credential rotation
 */
class ApiAuthenticationSystem {
  constructor(config = {}) {
    this.credentials = new Map(); // apiKey -> { secret, metadata }
    this.nonceTracker = new NonceTracker(config.nonceExpiration);
    this.rateLimiter = new RateLimiter(
      config.rateLimit || 100,
      config.rateLimitWindow || 60000
    );
    this.requestLog = [];
    this.maxLogSize = config.maxLogSize || 1000;
  }

  /**
   * TODO 13: Create API credentials
   *
   * @param {Object} metadata - Client metadata (name, tier, etc.)
   * @returns {Object} { apiKey, apiSecret }
   */
  createCredentials(metadata = {}) {
    // Your code here
    // const { apiKey, apiSecret } = generateApiCredentials();
    //
    // this.credentials.set(apiKey, {
    //   secret: apiSecret,
    //   metadata: {
    //     ...metadata,
    //     createdAt: Date.now(),
    //     lastUsed: null
    //   }
    // });
    //
    // return { apiKey, apiSecret };
  }

  /**
   * TODO 14: Authenticate request (middleware function)
   *
   * Steps:
   * 1. Extract API key from headers
   * 2. Verify API key exists
   * 3. Check rate limit
   * 4. Extract and verify nonce
   * 5. Verify signature
   * 6. Log request
   * 7. Return result
   *
   * @param {Object} request - Request object
   * @returns {Object} { authenticated, error, details }
   */
  authenticate(request) {
    // Your code here
    // const apiKey = request.headers['X-API-Key'];
    //
    // if (!apiKey) {
    //   return { authenticated: false, error: 'Missing API key' };
    // }
    //
    // const credential = this.credentials.get(apiKey);
    // if (!credential) {
    //   return { authenticated: false, error: 'Invalid API key' };
    // }
    //
    // // Check rate limit
    // const rateLimit = this.rateLimiter.checkLimit(apiKey);
    // if (!rateLimit.allowed) {
    //   return {
    //     authenticated: false,
    //     error: 'Rate limit exceeded',
    //     rateLimit
    //   };
    // }
    //
    // // Check nonce
    // const nonce = request.headers['X-API-Nonce'];
    // if (!nonce || !this.nonceTracker.checkAndRecord(nonce)) {
    //   return { authenticated: false, error: 'Invalid or reused nonce' };
    // }
    //
    // // Verify signature
    // const verification = verifySignature(request, credential.secret);
    // if (!verification.valid) {
    //   return { authenticated: false, error: verification.error };
    // }
    //
    // // Update last used
    // credential.metadata.lastUsed = Date.now();
    //
    // // Log request
    // this.logRequest(apiKey, request, true);
    //
    // return {
    //   authenticated: true,
    //   apiKey,
    //   metadata: credential.metadata,
    //   rateLimit
    // };
  }

  /**
   * TODO 15: Revoke API credentials
   */
  revokeCredentials(apiKey) {
    // Your code here
    // return this.credentials.delete(apiKey);
  }

  /**
   * TODO 16: Rotate API secret
   *
   * Generates new secret while keeping same API key
   */
  rotateSecret(apiKey) {
    // Your code here
    // const credential = this.credentials.get(apiKey);
    // if (!credential) {
    //   throw new Error('API key not found');
    // }
    //
    // const newSecret = crypto.randomBytes(32).toString('hex');
    // credential.secret = newSecret;
    // credential.metadata.lastRotated = Date.now();
    //
    // return { apiKey, apiSecret: newSecret };
  }

  /**
   * TODO 17: Log request
   */
  logRequest(apiKey, request, authenticated) {
    // Your code here
    // const logEntry = {
    //   timestamp: Date.now(),
    //   apiKey,
    //   method: request.method,
    //   path: request.path,
    //   authenticated,
    //   ip: request.headers['X-Forwarded-For'] || 'unknown'
    // };
    //
    // this.requestLog.push(logEntry);
    //
    // // Limit log size
    // if (this.requestLog.length > this.maxLogSize) {
    //   this.requestLog.shift();
    // }
  }

  /**
   * TODO 18: Get authentication statistics
   */
  getStats() {
    // Your code here
    // return {
    //   totalCredentials: this.credentials.size,
    //   activeNonces: this.nonceTracker.getStats().activeNonces,
    //   totalRequests: this.requestLog.length,
    //   recentRequests: this.requestLog.slice(-10)
    // };
  }
}

// Test Task 5
try {
  const auth = new ApiAuthenticationSystem({
    rateLimit: 10,
    rateLimitWindow: 60000
  });

  // Create credentials
  const creds = auth.createCredentials({ name: 'Test Client', tier: 'premium' });
  console.log('Credentials created:', creds ? 'Yes' : 'No');

  // Create and authenticate request
  const request = {
    method: 'GET',
    path: '/api/data',
    query: {},
    body: '',
    headers: {}
  };

  const signedRequest = createSignedRequest(request, creds.apiKey, creds.apiSecret);
  const authResult = auth.authenticate(signedRequest);

  console.log('Authentication:', authResult?.authenticated ? 'Success' : 'Failed');
  console.log('Rate limit remaining:', authResult?.rateLimit?.remaining);

  // Try replay attack
  const replayResult = auth.authenticate(signedRequest);
  console.log('Replay attack prevented:', !replayResult?.authenticated ? 'Yes' : 'No');

  // Get stats
  const stats = auth.getStats();
  console.log('Total credentials:', stats?.totalCredentials || 0);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenges
console.log('=== Bonus Challenges ===\n');

console.log('Bonus 1: Implement OAuth 2.0 Flow');
console.log('- Add authorization code grant');
console.log('- Implement token exchange');
console.log('- Support refresh tokens\n');

console.log('Bonus 2: Add Scope-Based Authorization');
console.log('- Define resource scopes');
console.log('- Enforce scope-based access control');
console.log('- Support scope inheritance\n');

console.log('Bonus 3: Implement Request Signing with Multiple Algorithms');
console.log('- Support HMAC-SHA256, HMAC-SHA512');
console.log('- Add RSA signature option');
console.log('- Implement algorithm negotiation\n');

console.log('Bonus 4: Add Webhook Signature Verification');
console.log('- Sign outgoing webhook payloads');
console.log('- Provide verification utilities');
console.log('- Handle webhook retries\n');

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Security:
 *    - Store API secrets hashed (like passwords)
 *    - Implement secret rotation policies
 *    - Add IP whitelisting option
 *    - Support mutual TLS
 *
 * 2. Performance:
 *    - Use Redis for distributed nonce tracking
 *    - Implement efficient rate limiting (token bucket)
 *    - Cache credential lookups
 *    - Use async verification
 *
 * 3. Monitoring:
 *    - Track authentication failures
 *    - Alert on suspicious patterns
 *    - Log all authentication events
 *    - Implement metrics collection
 *
 * 4. Scalability:
 *    - Distribute nonce tracking
 *    - Use distributed rate limiting
 *    - Implement credential sharding
 *    - Support horizontal scaling
 *
 * 5. Developer Experience:
 *    - Provide SDK for request signing
 *    - Clear error messages
 *    - Interactive API documentation
 *    - Testing utilities
 */

console.log('\n=== Exercise 4 Complete ===');
console.log('This exercise covers API authentication');
console.log('Similar to AWS Signature V4, Stripe API authentication\n');
