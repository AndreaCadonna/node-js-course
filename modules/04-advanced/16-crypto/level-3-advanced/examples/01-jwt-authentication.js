/**
 * JWT Authentication System
 *
 * Complete JWT implementation with access/refresh tokens,
 * key rotation, and production security best practices.
 */

const crypto = require('crypto');

console.log('=== JWT Authentication System ===\n');

// Example 1: Manual JWT Implementation (Understanding internals)
console.log('1. Manual JWT Implementation:');

class JWT {
  static base64UrlEncode(data) {
    return Buffer.from(JSON.stringify(data))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  static base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
  }

  static createToken(payload, secret, algorithm = 'HS256') {
    const header = { alg: algorithm, typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(header);
    const encodedPayload = this.base64UrlEncode(payload);

    const message = `${encodedHeader}.${encodedPayload}`;

    // Sign with HMAC
    const signature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signature}`;
  }

  static verifyToken(token, secret) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Timing-safe comparison
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new Error('Invalid signature');
    }

    const payload = this.base64UrlDecode(encodedPayload);

    // Verify expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    return payload;
  }
}

const secret = crypto.randomBytes(32).toString('hex');
const payload = {
  sub: 'user-123',
  name: 'John Doe',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

const token = JWT.createToken(payload, secret);
console.log('Token:', token);

try {
  const decoded = JWT.verifyToken(token, secret);
  console.log('Decoded:', decoded);
  console.log('✓ Manual JWT implementation works\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Example 2: JWT with RSA Signing (Production Pattern)
console.log('2. JWT with RSA Signing (RS256):');

class JWTManager {
  constructor() {
    // Generate RSA key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  createToken(payload, expiresIn = 3600) {
    const header = { alg: 'RS256', typ: 'JWT' };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: crypto.randomUUID() // Unique token ID
    };

    const encodedHeader = JWT.base64UrlEncode(header);
    const encodedPayload = JWT.base64UrlEncode(fullPayload);
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signature}`;
  }

  verifyToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    // Reconstruct signature for verification
    const sig = signature
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const isValid = crypto
      .createVerify('RSA-SHA256')
      .update(message)
      .verify(this.publicKey, sig, 'base64');

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const payload = JWT.base64UrlDecode(encodedPayload);

    // Validate claims
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    if (payload.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error('Token not yet valid');
    }

    return payload;
  }
}

const jwtManager = new JWTManager();
const rsaToken = jwtManager.createToken({
  sub: 'user-456',
  email: 'user@example.com',
  role: 'admin'
}, 3600);

console.log('RS256 Token:', rsaToken.substring(0, 50) + '...');

try {
  const decoded = jwtManager.verifyToken(rsaToken);
  console.log('Decoded payload:', decoded);
  console.log('✓ RS256 JWT verification successful\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Example 3: Access and Refresh Token Pattern
console.log('3. Access and Refresh Token Pattern:');

class AuthenticationSystem {
  constructor() {
    this.jwtManager = new JWTManager();
    this.refreshTokens = new Map(); // In production: use Redis
    this.revokedTokens = new Set(); // In production: use Redis
  }

  login(userId, metadata = {}) {
    // Short-lived access token (15 minutes)
    const accessToken = this.jwtManager.createToken({
      sub: userId,
      type: 'access',
      ...metadata
    }, 900); // 15 minutes

    // Long-lived refresh token (7 days)
    const refreshTokenId = crypto.randomUUID();
    const refreshToken = this.jwtManager.createToken({
      sub: userId,
      type: 'refresh',
      jti: refreshTokenId
    }, 7 * 24 * 3600); // 7 days

    // Store refresh token
    this.refreshTokens.set(refreshTokenId, {
      userId,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    try {
      const payload = this.jwtManager.verifyToken(token);

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      if (this.revokedTokens.has(payload.jti)) {
        throw new Error('Token has been revoked');
      }

      return payload;
    } catch (err) {
      throw new Error('Invalid access token: ' + err.message);
    }
  }

  refreshAccessToken(refreshToken) {
    try {
      const payload = this.jwtManager.verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists
      const tokenData = this.refreshTokens.get(payload.jti);
      if (!tokenData) {
        throw new Error('Refresh token not found');
      }

      // Update last used
      tokenData.lastUsed = Date.now();

      // Issue new access token
      const accessToken = this.jwtManager.createToken({
        sub: payload.sub,
        type: 'access'
      }, 900);

      return { accessToken };
    } catch (err) {
      throw new Error('Invalid refresh token: ' + err.message);
    }
  }

  revokeToken(tokenId) {
    this.revokedTokens.add(tokenId);
  }

  logout(refreshToken) {
    try {
      const payload = this.jwtManager.verifyToken(refreshToken);
      this.refreshTokens.delete(payload.jti);
      return true;
    } catch (err) {
      return false;
    }
  }
}

const authSystem = new AuthenticationSystem();

// Simulate login
const tokens = authSystem.login('user-789', {
  email: 'user@example.com',
  role: 'user'
});

console.log('Access Token:', tokens.accessToken.substring(0, 40) + '...');
console.log('Refresh Token:', tokens.refreshToken.substring(0, 40) + '...');

// Verify access token
try {
  const payload = authSystem.verifyAccessToken(tokens.accessToken);
  console.log('Access token valid for user:', payload.sub);
} catch (err) {
  console.log('Error:', err.message);
}

// Refresh access token
try {
  const newTokens = authSystem.refreshAccessToken(tokens.refreshToken);
  console.log('New access token issued:', newTokens.accessToken.substring(0, 40) + '...');
} catch (err) {
  console.log('Error:', err.message);
}

// Logout
authSystem.logout(tokens.refreshToken);
console.log('✓ User logged out successfully\n');

// Example 4: JWT Claims Validation
console.log('4. JWT Claims Validation:');

class JWTValidator {
  constructor(options = {}) {
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.clockTolerance = options.clockTolerance || 60; // 60 seconds
  }

  validate(payload) {
    const errors = [];
    const now = Math.floor(Date.now() / 1000);

    // Check issuer
    if (this.issuer && payload.iss !== this.issuer) {
      errors.push('Invalid issuer');
    }

    // Check audience
    if (this.audience) {
      if (Array.isArray(payload.aud)) {
        if (!payload.aud.includes(this.audience)) {
          errors.push('Invalid audience');
        }
      } else if (payload.aud !== this.audience) {
        errors.push('Invalid audience');
      }
    }

    // Check expiration
    if (payload.exp && now > payload.exp + this.clockTolerance) {
      errors.push('Token expired');
    }

    // Check not before
    if (payload.nbf && now < payload.nbf - this.clockTolerance) {
      errors.push('Token not yet valid');
    }

    // Check issued at
    if (payload.iat && now < payload.iat - this.clockTolerance) {
      errors.push('Token issued in the future');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

const validator = new JWTValidator({
  issuer: 'https://api.example.com',
  audience: 'web-app',
  clockTolerance: 60
});

const testPayload = {
  sub: 'user-123',
  iss: 'https://api.example.com',
  aud: 'web-app',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

const validation = validator.validate(testPayload);
console.log('Validation result:', validation);
console.log('✓ Claims validation complete\n');

// Example 5: Key Rotation
console.log('5. Key Rotation Strategy:');

class KeyRotationManager {
  constructor() {
    this.keys = new Map();
    this.currentKeyId = null;
    this.rotateKeys();
  }

  rotateKeys() {
    const keyId = crypto.randomUUID();
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.keys.set(keyId, {
      publicKey,
      privateKey,
      createdAt: Date.now(),
      rotatedAt: null
    });

    // Mark old key as rotated
    if (this.currentKeyId) {
      const oldKey = this.keys.get(this.currentKeyId);
      oldKey.rotatedAt = Date.now();
    }

    this.currentKeyId = keyId;

    // Clean up very old keys (keep for 30 days after rotation)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const [id, key] of this.keys) {
      if (key.rotatedAt && key.rotatedAt < thirtyDaysAgo) {
        this.keys.delete(id);
      }
    }

    return keyId;
  }

  signToken(payload) {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: this.currentKeyId
    };

    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
      exp: now + 3600
    };

    const encodedHeader = JWT.base64UrlEncode(header);
    const encodedPayload = JWT.base64UrlEncode(fullPayload);
    const message = `${encodedHeader}.${encodedPayload}`;

    const currentKey = this.keys.get(this.currentKeyId);
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(message)
      .sign(currentKey.privateKey, 'base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signature}`;
  }

  verifyToken(token) {
    const parts = token.split('.');
    const header = JWT.base64UrlDecode(parts[0]);

    const keyData = this.keys.get(header.kid);
    if (!keyData) {
      throw new Error('Unknown key ID');
    }

    const message = `${parts[0]}.${parts[1]}`;
    const sig = parts[2].replace(/-/g, '+').replace(/_/g, '/');

    const isValid = crypto
      .createVerify('RSA-SHA256')
      .update(message)
      .verify(keyData.publicKey, sig, 'base64');

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    return JWT.base64UrlDecode(parts[1]);
  }

  getPublicKeys() {
    // JWKS format for public key distribution
    const keys = [];
    for (const [kid, keyData] of this.keys) {
      keys.push({
        kid,
        kty: 'RSA',
        use: 'sig',
        alg: 'RS256',
        key: keyData.publicKey
      });
    }
    return { keys };
  }
}

const rotationManager = new KeyRotationManager();

// Create token with current key
const rotatedToken = rotationManager.signToken({
  sub: 'user-999',
  email: 'test@example.com'
});

console.log('Token with key rotation:', rotatedToken.substring(0, 40) + '...');

// Verify token
try {
  const decoded = rotationManager.verifyToken(rotatedToken);
  console.log('Token verified with key ID');
} catch (err) {
  console.log('Error:', err.message);
}

// Simulate key rotation
const oldKeyCount = rotationManager.keys.size;
rotationManager.rotateKeys();
const newKeyCount = rotationManager.keys.size;
console.log('Keys before rotation:', oldKeyCount);
console.log('Keys after rotation:', newKeyCount);

// Old token still verifiable
try {
  rotationManager.verifyToken(rotatedToken);
  console.log('✓ Old token still valid after rotation');
} catch (err) {
  console.log('Error:', err.message);
}

// Get public keys (for JWKS endpoint)
const jwks = rotationManager.getPublicKeys();
console.log('Public keys available:', jwks.keys.length);
console.log('✓ Key rotation system operational\n');

// Example 6: Production Best Practices
console.log('6. Production Best Practices:');

const bestPractices = {
  'Use RS256 or ES256': 'Asymmetric algorithms allow verification without secret',
  'Short-lived access tokens': '15 minutes maximum',
  'Longer refresh tokens': '7-30 days with rotation',
  'Include jti claim': 'Unique token ID for revocation',
  'Validate all claims': 'iss, aud, exp, nbf, iat',
  'Use HTTPS only': 'Never send tokens over HTTP',
  'Store tokens securely': 'HttpOnly cookies or secure storage',
  'Implement token rotation': 'Regular key rotation for security',
  'Use timing-safe compare': 'Prevent timing attacks',
  'Rate limit token endpoints': 'Prevent brute force attacks',
  'Monitor token usage': 'Detect anomalies and attacks',
  'Revocation strategy': 'Implement token blacklist or database check'
};

console.log('JWT Production Best Practices:');
for (const [practice, description] of Object.entries(bestPractices)) {
  console.log(`✓ ${practice}: ${description}`);
}

console.log('\n=== JWT Authentication System Complete ===');
