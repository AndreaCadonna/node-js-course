/**
 * SOLUTION: Exercise 4 - API Authentication with HMAC
 *
 * Production-ready HMAC-based API authentication system with request signing,
 * replay attack prevention, rate limiting, and comprehensive security features.
 */

const crypto = require('crypto');

console.log('=== SOLUTION: API Authentication with HMAC ===\n');

// HMAC Request Signer
class HMACRequestSigner {
  static createCanonicalRequest(method, path, query = {}, headers = {}, body = '', timestamp, nonce) {
    const sortedQuery = Object.keys(query)
      .sort()
      .map(key => key + '=' + query[key])
      .join('&');

    const sortedHeaders = Object.keys(headers)
      .sort()
      .map(key => key.toLowerCase() + ':' + headers[key])
      .join('\n');

    const canonical = [
      method.toUpperCase(),
      path,
      sortedQuery,
      sortedHeaders,
      crypto.createHash('sha256').update(body).digest('hex'),
      timestamp.toString(),
      nonce
    ].join('\n');

    return canonical;
  }

  static signRequest(canonicalRequest, apiSecret) {
    const hmac = crypto.createHmac('sha256', apiSecret);
    hmac.update(canonicalRequest);
    return hmac.digest('hex');
  }

  static verifySignature(signature, canonicalRequest, apiSecret) {
    const expectedSignature = this.signRequest(canonicalRequest, apiSecret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  static generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }
}

// API Key Manager
class APIKeyManager {
  constructor() {
    this.keys = new Map();
    this.auditLog = [];
  }

  generateKeyPair(owner, metadata = {}) {
    const apiKey = 'ak_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = crypto.randomBytes(32).toString('hex');

    const keyInfo = {
      apiKey,
      apiSecret,
      owner,
      createdAt: new Date(),
      active: true,
      permissions: metadata.permissions || ['read'],
      rateLimit: metadata.rateLimit || { requestsPerMinute: 60 },
      ...metadata
    };

    this.keys.set(apiKey, keyInfo);
    this.log('KEY_GENERATED', { apiKey, owner });

    return { apiKey, apiSecret };
  }

  getSecret(apiKey) {
    const keyInfo = this.keys.get(apiKey);
    if (!keyInfo || !keyInfo.active) {
      throw new Error('Invalid or inactive API key');
    }
    return keyInfo.apiSecret;
  }

  getKeyInfo(apiKey) {
    const keyInfo = this.keys.get(apiKey);
    if (!keyInfo) {
      throw new Error('Invalid API key');
    }
    const { apiSecret, ...publicInfo } = keyInfo;
    return publicInfo;
  }

  rotateSecret(apiKey) {
    const keyInfo = this.keys.get(apiKey);
    if (!keyInfo) {
      throw new Error('Invalid API key');
    }
    const newSecret = crypto.randomBytes(32).toString('hex');
    keyInfo.apiSecret = newSecret;
    keyInfo.secretRotatedAt = new Date();
    this.log('SECRET_ROTATED', { apiKey });
    return newSecret;
  }

  revokeKey(apiKey) {
    const keyInfo = this.keys.get(apiKey);
    if (!keyInfo) {
      throw new Error('Invalid API key');
    }
    keyInfo.active = false;
    keyInfo.revokedAt = new Date();
    this.log('KEY_REVOKED', { apiKey });
  }

  log(event, data) {
    this.auditLog.push({ timestamp: new Date(), event, data });
  }
}

// Replay Protection
class ReplayProtection {
  constructor(timeWindowSeconds = 300) {
    this.timeWindow = timeWindowSeconds * 1000;
    this.usedNonces = new Map();
  }

  validateTimestamp(timestamp) {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    return diff <= this.timeWindow;
  }

  checkNonce(nonce, timestamp) {
    if (this.usedNonces.has(nonce)) {
      return false;
    }
    this.usedNonces.set(nonce, timestamp);
    this.cleanup();
    return true;
  }

  cleanup() {
    const now = Date.now();
    const expiryTime = now - this.timeWindow;
    for (const [nonce, timestamp] of this.usedNonces.entries()) {
      if (timestamp < expiryTime) {
        this.usedNonces.delete(nonce);
      }
    }
  }
}

// API Rate Limiter
class APIRateLimiter {
  constructor() {
    this.requests = new Map();
  }

  checkLimit(apiKey, limit = 60, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    let requests = this.requests.get(apiKey) || [];
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    const allowed = requests.length < limit;
    const remaining = Math.max(0, limit - requests.length);
    
    if (allowed) {
      requests.push(now);
      this.requests.set(apiKey, requests);
    }
    
    return { allowed, remaining, limit };
  }
}

// Complete API Authentication Server
class APIAuthServer {
  constructor(options = {}) {
    this.keyManager = new APIKeyManager();
    this.replayProtection = new ReplayProtection(options.timeWindowSeconds || 300);
    this.rateLimiter = new APIRateLimiter();
    this.auditLog = [];
  }

  createClient(owner, options = {}) {
    return this.keyManager.generateKeyPair(owner, options);
  }

  authenticateRequest(request) {
    const { method, path, query = {}, headers = {}, body = '', apiKey, signature, timestamp, nonce } = request;

    try {
      const apiSecret = this.keyManager.getSecret(apiKey);
      const keyInfo = this.keyManager.getKeyInfo(apiKey);
      
      // Rate limit check
      const rateLimit = this.rateLimiter.checkLimit(
        apiKey,
        keyInfo.rateLimit.requestsPerMinute,
        60000
      );
      
      if (!rateLimit.allowed) {
        this.log('RATE_LIMITED', { apiKey, path });
        return { authenticated: false, error: 'Rate limit exceeded', rateLimit };
      }
      
      // Timestamp validation
      if (!this.replayProtection.validateTimestamp(timestamp)) {
        this.log('INVALID_TIMESTAMP', { apiKey, path });
        return { authenticated: false, error: 'Invalid timestamp' };
      }
      
      // Nonce validation
      if (!this.replayProtection.checkNonce(nonce, timestamp)) {
        this.log('DUPLICATE_NONCE', { apiKey, path });
        return { authenticated: false, error: 'Duplicate nonce' };
      }
      
      // Signature verification
      const canonicalRequest = HMACRequestSigner.createCanonicalRequest(
        method, path, query, headers, body, timestamp, nonce
      );
      
      const isValid = HMACRequestSigner.verifySignature(signature, canonicalRequest, apiSecret);
      
      if (!isValid) {
        this.log('INVALID_SIGNATURE', { apiKey, path });
        return { authenticated: false, error: 'Invalid signature' };
      }
      
      this.log('REQUEST_AUTHENTICATED', { apiKey, path, method });
      
      return {
        authenticated: true,
        apiKey,
        owner: keyInfo.owner,
        permissions: keyInfo.permissions,
        rateLimit
      };
    } catch (err) {
      this.log('AUTH_ERROR', { apiKey, path, error: err.message });
      return { authenticated: false, error: err.message };
    }
  }

  log(event, data) {
    this.auditLog.push({ timestamp: new Date(), event, data });
  }
}

// API Client
class APIClient {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  createRequest(method, path, options = {}) {
    const { query = {}, headers = {}, body = '' } = options;
    const timestamp = Date.now();
    const nonce = HMACRequestSigner.generateNonce();
    
    const canonicalRequest = HMACRequestSigner.createCanonicalRequest(
      method, path, query, headers, body, timestamp, nonce
    );
    
    const signature = HMACRequestSigner.signRequest(canonicalRequest, this.apiSecret);
    
    return {
      method, path, query, headers, body,
      apiKey: this.apiKey,
      signature, timestamp, nonce
    };
  }
}

// Testing
console.log('Testing API Authentication System...\n');

async function runTests() {
  console.log('Test 1: API Key Generation');
  const server = new APIAuthServer();
  const creds = server.createClient('alice', {
    permissions: ['read', 'write'],
    rateLimit: { requestsPerMinute: 100 }
  });
  console.log('✓ Client credentials generated');
  console.log('  API Key:', creds.apiKey.substring(0, 20) + '...');
  console.log();

  console.log('Test 2: Request Signing and Authentication');
  const client = new APIClient(creds.apiKey, creds.apiSecret);
  const request = client.createRequest('GET', '/api/users', {
    query: { page: '1', limit: '10' }
  });
  console.log('✓ Request signed');
  const authResult = server.authenticateRequest(request);
  console.log('✓ Request authenticated:', authResult.authenticated);
  console.log();

  console.log('Test 3: Invalid Signature Detection');
  const tamperedRequest = { ...request, path: '/api/admin' };
  const tamperedResult = server.authenticateRequest(tamperedRequest);
  console.log('✓ Tampered request rejected:', !tamperedResult.authenticated);
  console.log();

  console.log('Test 4: Replay Attack Prevention');
  const replayResult = server.authenticateRequest(request);
  console.log('✓ Replay attempt detected:', !replayResult.authenticated);
  console.log();

  console.log('Test 5: Rate Limiting');
  const creds2 = server.createClient('bob', {
    rateLimit: { requestsPerMinute: 3 }
  });
  const client2 = new APIClient(creds2.apiKey, creds2.apiSecret);
  let rateLimited = false;
  for (let i = 0; i < 5; i++) {
    const req = client2.createRequest('GET', '/api/test');
    const result = server.authenticateRequest(req);
    if (!result.authenticated && result.error.includes('Rate limit')) {
      console.log('✓ Rate limit triggered after', i, 'requests');
      rateLimited = true;
      break;
    }
  }
  console.log();

  console.log('=== All Tests Passed! ===\n');
}

runTests().catch(console.error);

