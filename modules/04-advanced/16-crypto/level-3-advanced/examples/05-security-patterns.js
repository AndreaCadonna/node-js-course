/**
 * Advanced Security Patterns
 *
 * Production security patterns including defense in depth,
 * timing attack prevention, rate limiting, and secure defaults.
 */

const crypto = require('crypto');

console.log('=== Advanced Security Patterns ===\n');

// Example 1: Timing-Safe Operations
console.log('1. Timing-Safe Comparisons:');

class TimingSafety {
  // Vulnerable comparison (timing attack possible)
  static unsafeCompare(a, b) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false; // Early exit leaks information
    }
    return true;
  }

  // Safe comparison (constant time)
  static safeCompare(a, b) {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    if (bufferA.length !== bufferB.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  // Timing-safe HMAC verification
  static verifyHMAC(message, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest();

    const providedSignature = Buffer.from(signature, 'hex');

    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedSignature, providedSignature);
  }

  // Constant-time string equality
  static constantTimeStringEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    return crypto.timingSafeEqual(bufA, bufB);
  }
}

const secret = 'secret-key-123';
const message = 'Important message';
const validSignature = crypto.createHmac('sha256', secret).update(message).digest('hex');
const invalidSignature = '0' + validSignature.substring(1);

console.log('Valid signature:', TimingSafety.verifyHMAC(message, validSignature, secret));
console.log('Invalid signature:', TimingSafety.verifyHMAC(message, invalidSignature, secret));
console.log('✓ Timing-safe operations prevent timing attacks\n');

// Example 2: Rate Limiting and Throttling
console.log('2. Rate Limiting for Crypto Operations:');

class RateLimiter {
  constructor(maxAttempts, windowMs) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  checkLimit(identifier) {
    const now = Date.now();
    const key = identifier;

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const userAttempts = this.attempts.get(key);

    // Remove old attempts outside window
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.windowMs
    );

    this.attempts.set(key, recentAttempts);

    // Check if limit exceeded
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const retryAfter = this.windowMs - (now - oldestAttempt);

      return {
        allowed: false,
        retryAfter,
        remaining: 0
      };
    }

    // Record attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return {
      allowed: true,
      retryAfter: 0,
      remaining: this.maxAttempts - recentAttempts.length
    };
  }

  reset(identifier) {
    this.attempts.delete(identifier);
  }
}

class SecureAuthenticator {
  constructor() {
    this.rateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
    this.users = new Map();
  }

  async verifyPassword(username, password) {
    // Check rate limit first
    const rateLimit = this.rateLimiter.checkLimit(username);

    if (!rateLimit.allowed) {
      throw new Error(`Too many attempts. Retry after ${Math.ceil(rateLimit.retryAfter / 1000)}s`);
    }

    // Simulate password check
    const user = this.users.get(username);
    if (!user) {
      // Still perform hash to prevent timing attacks
      crypto.pbkdf2Sync('dummy', 'salt', 100000, 64, 'sha512');
      return false;
    }

    // Verify password
    const hash = crypto.pbkdf2Sync(
      password,
      Buffer.from(user.salt, 'hex'),
      100000,
      64,
      'sha512'
    );

    const isValid = crypto.timingSafeEqual(
      hash,
      Buffer.from(user.hash, 'hex')
    );

    if (isValid) {
      this.rateLimiter.reset(username); // Reset on success
    }

    return isValid;
  }

  registerUser(username, password) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

    this.users.set(username, {
      hash: hash.toString('hex'),
      salt: salt.toString('hex')
    });
  }
}

const authenticator = new SecureAuthenticator();
authenticator.registerUser('alice', 'password123');

// Simulate failed attempts
console.log('Testing rate limiting:');
for (let i = 0; i < 7; i++) {
  try {
    const result = authenticator.verifyPassword('alice', 'wrongpassword');
    console.log(`Attempt ${i + 1}: Failed`);
  } catch (err) {
    console.log(`Attempt ${i + 1}: ${err.message}`);
  }
}

console.log('✓ Rate limiting prevents brute force attacks\n');

// Example 3: Secure Session Management
console.log('3. Secure Session Management:');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  createSession(userId, metadata = {}) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const session = {
      sessionId,
      userId,
      csrfToken,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      rotationCount: 0
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      csrfToken
    };
  }

  validateSession(sessionId, csrfToken) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    // Check expiration
    const now = Date.now();
    if (now - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    // Check CSRF token
    if (!crypto.timingSafeEqual(
      Buffer.from(session.csrfToken),
      Buffer.from(csrfToken)
    )) {
      return { valid: false, reason: 'Invalid CSRF token' };
    }

    // Update last activity
    session.lastActivity = now;

    return {
      valid: true,
      userId: session.userId,
      session
    };
  }

  rotateSession(oldSessionId) {
    const oldSession = this.sessions.get(oldSessionId);
    if (!oldSession) {
      throw new Error('Session not found');
    }

    // Create new session
    const newSessionId = crypto.randomBytes(32).toString('hex');
    const newCsrfToken = crypto.randomBytes(32).toString('hex');

    const newSession = {
      ...oldSession,
      sessionId: newSessionId,
      csrfToken: newCsrfToken,
      rotationCount: oldSession.rotationCount + 1,
      lastActivity: Date.now()
    };

    // Delete old session
    this.sessions.delete(oldSessionId);

    // Store new session
    this.sessions.set(newSessionId, newSession);

    return {
      sessionId: newSessionId,
      csrfToken: newCsrfToken
    };
  }

  destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    return cleaned;
  }
}

const sessionMgr = new SessionManager();

// Create session
const session = sessionMgr.createSession('user-123', {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0'
});

console.log('Session created:', session.sessionId.substring(0, 16) + '...');

// Validate session
const validation = sessionMgr.validateSession(session.sessionId, session.csrfToken);
console.log('Session valid:', validation.valid);

// Rotate session
const newSession = sessionMgr.rotateSession(session.sessionId);
console.log('Session rotated to:', newSession.sessionId.substring(0, 16) + '...');

console.log('✓ Secure session management implemented\n');

// Example 4: Defense in Depth
console.log('4. Defense in Depth Strategy:');

class DefenseInDepth {
  constructor() {
    this.layers = [];
  }

  addLayer(name, validator) {
    this.layers.push({ name, validator });
  }

  async validateRequest(request) {
    const results = [];

    for (const layer of this.layers) {
      try {
        const result = await layer.validator(request);
        results.push({
          layer: layer.name,
          passed: result.valid,
          message: result.message
        });

        if (!result.valid) {
          return {
            allowed: false,
            failedLayer: layer.name,
            results
          };
        }
      } catch (err) {
        results.push({
          layer: layer.name,
          passed: false,
          error: err.message
        });

        return {
          allowed: false,
          failedLayer: layer.name,
          results
        };
      }
    }

    return {
      allowed: true,
      results
    };
  }
}

const defense = new DefenseInDepth();

// Layer 1: Rate limiting
defense.addLayer('Rate Limit', async (req) => {
  // Simulate rate limit check
  return {
    valid: true,
    message: 'Within rate limit'
  };
});

// Layer 2: Request signature verification
defense.addLayer('Signature', async (req) => {
  if (!req.signature) {
    return { valid: false, message: 'Missing signature' };
  }

  const expectedSig = crypto
    .createHmac('sha256', 'secret')
    .update(JSON.stringify(req.body))
    .digest('hex');

  return {
    valid: req.signature === expectedSig,
    message: req.signature === expectedSig ? 'Valid signature' : 'Invalid signature'
  };
});

// Layer 3: Input validation
defense.addLayer('Input Validation', async (req) => {
  return {
    valid: req.body && typeof req.body === 'object',
    message: 'Input validated'
  };
});

// Layer 4: Authorization
defense.addLayer('Authorization', async (req) => {
  return {
    valid: req.userId !== undefined,
    message: 'User authorized'
  };
});

// Test defense layers
const testRequest = {
  userId: 'user-123',
  body: { action: 'transfer', amount: 100 },
  signature: crypto.createHmac('sha256', 'secret')
    .update(JSON.stringify({ action: 'transfer', amount: 100 }))
    .digest('hex')
};

defense.validateRequest(testRequest).then(result => {
  console.log('Defense layers result:', result.allowed ? 'ALLOWED' : 'DENIED');
  console.log('Layers passed:', result.results.filter(r => r.passed).length);
  console.log('✓ Multi-layered defense working');
});

console.log();

// Example 5: Secure Error Handling
console.log('5. Secure Error Handling:');

class SecureErrorHandler {
  static sanitizeError(error, isDevelopment = false) {
    // Never expose sensitive information in production
    if (isDevelopment) {
      return {
        message: error.message,
        stack: error.stack,
        details: error
      };
    }

    // Generic error messages in production
    const publicErrors = {
      'Authentication failed': 'Invalid credentials',
      'Token expired': 'Session expired, please login again',
      'Invalid signature': 'Request validation failed',
      'Rate limit exceeded': 'Too many requests, please try again later'
    };

    return {
      message: publicErrors[error.message] || 'An error occurred',
      code: error.code || 'INTERNAL_ERROR'
    };
  }

  static async safeExecute(operation, errorHandler) {
    try {
      return await operation();
    } catch (error) {
      // Log error internally (with full details)
      console.error('[Internal Error]:', error);

      // Return sanitized error to user
      const sanitized = this.sanitizeError(error, false);

      if (errorHandler) {
        errorHandler(sanitized);
      }

      throw new Error(sanitized.message);
    }
  }
}

// Example usage
async function riskyOperation() {
  throw new Error('Database connection failed: Connection to 192.168.1.100:5432 refused');
}

SecureErrorHandler.safeExecute(riskyOperation, (error) => {
  console.log('User sees:', error.message);
}).catch(() => {
  // Error already handled
});

console.log('✓ Errors sanitized before exposure\n');

// Example 6: Security Best Practices Summary
console.log('6. Security Patterns Best Practices:');

const bestPractices = {
  'Use timing-safe comparisons': 'Prevent timing attacks on secrets',
  'Implement rate limiting': 'Prevent brute force and DoS attacks',
  'Rotate sessions regularly': 'Limit impact of session hijacking',
  'Use CSRF tokens': 'Prevent cross-site request forgery',
  'Implement defense in depth': 'Multiple security layers',
  'Sanitize error messages': 'Never expose sensitive info',
  'Log security events': 'Monitor for attacks and anomalies',
  'Use secure random': 'crypto.randomBytes for all tokens',
  'Validate all inputs': 'Never trust user input',
  'Principle of least privilege': 'Minimal permissions required',
  'Fail securely': 'Deny by default',
  'Keep dependencies updated': 'Patch security vulnerabilities'
};

console.log('Security Patterns Best Practices:');
for (const [practice, description] of Object.entries(bestPractices)) {
  console.log(`✓ ${practice}: ${description}`);
}

console.log('\n=== Advanced Security Patterns Complete ===');
