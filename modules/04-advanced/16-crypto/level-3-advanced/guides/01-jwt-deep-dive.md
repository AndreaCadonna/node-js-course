# JWT Deep Dive

A comprehensive guide to JSON Web Tokens (JWT), their structure, security considerations, and production best practices.

## Table of Contents
- [What is JWT?](#what-is-jwt)
- [JWT Structure](#jwt-structure)
- [Signing Algorithms](#signing-algorithms)
- [Claims and Validation](#claims-and-validation)
- [Security Considerations](#security-considerations)
- [Best Practices](#best-practices)
- [Common Vulnerabilities](#common-vulnerabilities)

## What is JWT?

JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object. JWTs are:

- **Self-contained**: Contains all necessary information
- **Stateless**: No server-side session storage required
- **Compact**: Can be transmitted via URL, POST parameter, or HTTP header
- **Verifiable**: Digitally signed to verify authenticity

### Use Cases

1. **Authentication**: Single Sign-On (SSO), API authentication
2. **Information Exchange**: Securely transmit information
3. **Authorization**: Access control and permissions

## JWT Structure

A JWT consists of three parts separated by dots (.):

```
xxxxx.yyyyy.zzzzz
```

### Header

Contains metadata about the token:

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

- **alg**: Algorithm used for signing (HS256, RS256, ES256, etc.)
- **typ**: Token type (always "JWT")

### Payload

Contains claims (statements about the user):

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Signature

Ensures the token hasn't been tampered with:

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

## Signing Algorithms

### Symmetric Algorithms (HMAC)

**HS256 (HMAC-SHA256)**
- Same secret for signing and verification
- Faster than asymmetric
- Requires secret sharing
- Use for: Single-server applications

```javascript
const secret = crypto.randomBytes(32);
const signature = crypto.createHmac('sha256', secret)
  .update(data)
  .digest('base64url');
```

### Asymmetric Algorithms (RSA/ECDSA)

**RS256 (RSA-SHA256)**
- Private key for signing
- Public key for verification
- No secret sharing needed
- Use for: Distributed systems, microservices

```javascript
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048
});

// Sign
const signature = crypto.createSign('RSA-SHA256')
  .update(data)
  .sign(privateKey, 'base64url');

// Verify
const isValid = crypto.createVerify('RSA-SHA256')
  .update(data)
  .verify(publicKey, signature, 'base64url');
```

**ES256 (ECDSA-SHA256)**
- Elliptic curve cryptography
- Smaller keys than RSA
- Better performance
- Use for: Mobile apps, high-performance systems

### Algorithm Comparison

| Algorithm | Type | Key Size | Performance | Use Case |
|-----------|------|----------|-------------|----------|
| HS256 | Symmetric | 256 bits | Fastest | Single server |
| RS256 | Asymmetric | 2048 bits | Slower | Microservices |
| ES256 | Asymmetric | 256 bits | Fast | Mobile apps |

## Claims and Validation

### Registered Claims

Standard claims defined by JWT specification:

- **iss** (issuer): Who created the token
- **sub** (subject): Who the token is about (user ID)
- **aud** (audience): Who the token is for
- **exp** (expiration): When token expires
- **nbf** (not before): Token not valid before this time
- **iat** (issued at): When token was created
- **jti** (JWT ID): Unique identifier

### Validation Checklist

```javascript
function validateJWT(token, options) {
  const payload = verifySignature(token);

  // 1. Check signature ✓ (already done)

  // 2. Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('Token expired');
  }

  // 3. Check not-before
  if (payload.nbf && Date.now() < payload.nbf * 1000) {
    throw new Error('Token not yet valid');
  }

  // 4. Check issuer
  if (options.issuer && payload.iss !== options.issuer) {
    throw new Error('Invalid issuer');
  }

  // 5. Check audience
  if (options.audience) {
    if (Array.isArray(payload.aud)) {
      if (!payload.aud.includes(options.audience)) {
        throw new Error('Invalid audience');
      }
    } else if (payload.aud !== options.audience) {
      throw new Error('Invalid audience');
    }
  }

  // 6. Check issued-at (prevent future tokens)
  if (payload.iat && Date.now() < payload.iat * 1000) {
    throw new Error('Token from future');
  }

  return payload;
}
```

## Security Considerations

### 1. Algorithm Confusion Attack

**Vulnerability**: Attacker changes algorithm from RS256 to HS256

```javascript
// Attacker modifies header
{
  "alg": "HS256",  // Changed from RS256
  "typ": "JWT"
}
```

**Prevention**: Always specify allowed algorithms

```javascript
function verifyToken(token, publicKey) {
  const header = decodeHeader(token);

  // Reject if algorithm not in whitelist
  if (!['RS256', 'ES256'].includes(header.alg)) {
    throw new Error('Invalid algorithm');
  }

  // Verify with correct algorithm
  return verify(token, publicKey, header.alg);
}
```

### 2. Weak Secrets

**Vulnerability**: Weak HMAC secrets can be brute-forced

```javascript
// ❌ WRONG - Weak secret
const token = jwt.sign(payload, 'secret', { algorithm: 'HS256' });
```

**Prevention**: Use strong secrets or asymmetric algorithms

```javascript
// ✅ CORRECT - Strong secret (256 bits)
const secret = crypto.randomBytes(32);
const token = jwt.sign(payload, secret, { algorithm: 'HS256' });

// ✅ BETTER - Use RS256
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
```

### 3. Sensitive Data in Payload

**Vulnerability**: JWT payload is Base64-encoded, not encrypted

```javascript
// ❌ WRONG - Sensitive data in payload
const token = jwt.sign({
  sub: 'user-123',
  ssn: '123-45-6789',
  creditCard: '1234-5678-9012-3456'
}, secret);
```

**Prevention**: Don't store sensitive data in JWT

```javascript
// ✅ CORRECT - Only IDs and non-sensitive data
const token = jwt.sign({
  sub: 'user-123',
  role: 'admin',
  permissions: ['read', 'write']
}, secret);
```

### 4. Token Revocation

**Challenge**: JWTs are stateless - how to revoke?

**Solutions**:

1. **Short expiration** - Tokens expire quickly (15 minutes)
2. **Token blacklist** - Maintain revoked token list
3. **Token versioning** - Include version in payload
4. **Refresh token rotation** - New refresh token on each use

```javascript
class TokenRevocation {
  constructor() {
    this.revokedTokens = new Set();
  }

  revoke(tokenId) {
    this.revokedTokens.add(tokenId);
  }

  isRevoked(tokenId) {
    return this.revokedTokens.has(tokenId);
  }

  verify(token) {
    const payload = jwt.verify(token, publicKey);

    if (this.isRevoked(payload.jti)) {
      throw new Error('Token revoked');
    }

    return payload;
  }
}
```

## Best Practices

### 1. Use Appropriate Expiration

```javascript
// Access token: Short-lived
const accessToken = jwt.sign(payload, key, {
  expiresIn: '15m'
});

// Refresh token: Long-lived
const refreshToken = jwt.sign(payload, key, {
  expiresIn: '30d'
});
```

### 2. Validate All Claims

```javascript
const payload = jwt.verify(token, publicKey, {
  algorithms: ['RS256'],          // Whitelist algorithms
  issuer: 'https://auth.example.com',
  audience: 'https://api.example.com',
  maxAge: '1h',                   // Max token age
  clockTolerance: 60              // Clock skew tolerance
});
```

### 3. Use Refresh Token Rotation

```javascript
class RefreshTokenRotation {
  async refresh(oldRefreshToken) {
    // Verify old token
    const payload = jwt.verify(oldRefreshToken, publicKey);

    // Create new access token
    const accessToken = jwt.sign(
      { sub: payload.sub },
      privateKey,
      { expiresIn: '15m' }
    );

    // Create new refresh token
    const refreshToken = jwt.sign(
      { sub: payload.sub, jti: crypto.randomUUID() },
      privateKey,
      { expiresIn: '30d' }
    );

    // Revoke old refresh token
    this.revoke(payload.jti);

    return { accessToken, refreshToken };
  }
}
```

### 4. Implement Key Rotation

```javascript
class KeyRotation {
  constructor() {
    this.keys = new Map();
    this.currentKeyId = this.rotateKeys();
  }

  rotateKeys() {
    const keyId = crypto.randomUUID();
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    });

    this.keys.set(keyId, { publicKey, privateKey });
    return keyId;
  }

  sign(payload) {
    const currentKey = this.keys.get(this.currentKeyId);

    return jwt.sign(payload, currentKey.privateKey, {
      algorithm: 'RS256',
      keyid: this.currentKeyId
    });
  }

  verify(token) {
    const header = jwt.decode(token, { complete: true }).header;
    const key = this.keys.get(header.kid);

    if (!key) {
      throw new Error('Unknown key ID');
    }

    return jwt.verify(token, key.publicKey, {
      algorithms: ['RS256']
    });
  }
}
```

## Common Vulnerabilities

### 1. None Algorithm

```javascript
// ❌ Attacker sets alg to "none"
{
  "alg": "none",
  "typ": "JWT"
}
```

**Prevention**: Reject "none" algorithm

```javascript
const allowedAlgorithms = ['RS256', 'ES256'];
if (!allowedAlgorithms.includes(header.alg)) {
  throw new Error('Algorithm not allowed');
}
```

### 2. Key Confusion

**Prevention**: Never use public key as HMAC secret

```javascript
// ❌ WRONG
const isValid = crypto.createHmac('sha256', publicKey)
  .update(message)
  .digest('base64url') === signature;

// ✅ CORRECT
const isValid = crypto.createVerify('RSA-SHA256')
  .update(message)
  .verify(publicKey, signature, 'base64url');
```

### 3. Weak Key Strength

**Prevention**: Use minimum key sizes

- RSA: 2048 bits minimum
- ECDSA: 256 bits minimum
- HMAC: 256 bits minimum

## Summary

JWT is powerful but requires careful implementation:

✅ **Do:**
- Use RS256 or ES256 for distributed systems
- Validate all claims
- Keep tokens short-lived
- Implement refresh token rotation
- Rotate keys regularly
- Use strong secrets/keys

❌ **Don't:**
- Store sensitive data in payload
- Use weak secrets
- Accept "none" algorithm
- Skip claim validation
- Use tokens without expiration
- Expose private keys

**Remember**: JWTs are for authorization, not encryption. Never put sensitive data in the payload!
