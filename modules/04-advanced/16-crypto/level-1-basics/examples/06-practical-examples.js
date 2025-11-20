/**
 * Practical Crypto Examples
 *
 * Real-world applications combining various cryptographic operations.
 */

const crypto = require('crypto');
const fs = require('fs');

console.log('=== Practical Crypto Examples ===\n');

// Example 1: Secure Session Token Generator
console.log('1. Secure Session Token Generator:');
class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(userId) {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');

    this.sessions.set(sessionId, {
      userId,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 hour
    });

    return { sessionId, token };
  }

  validateSession(sessionId, token) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    if (session.token !== token) {
      return { valid: false, reason: 'Invalid token' };
    }

    return { valid: true, userId: session.userId };
  }
}

const sessionMgr = new SessionManager();
const session = sessionMgr.createSession(12345);
console.log('Created session:', session);

const validation = sessionMgr.validateSession(session.sessionId, session.token);
console.log('Validation result:', validation);
console.log();

// Example 2: API Key Generator and Validator
console.log('2. API Key Generator and Validator:');
class APIKeyManager {
  static generate(userId, keyName) {
    const prefix = 'ak'; // API key prefix
    const key = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    // Store hash in database, return key to user
    return {
      key: `${prefix}_${key}`,
      hash: hash,
      userId: userId,
      keyName: keyName,
      createdAt: new Date().toISOString()
    };
  }

  static validate(apiKey, storedHash) {
    if (!apiKey.startsWith('ak_')) {
      return false;
    }

    const key = apiKey.substring(3);
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(storedHash)
    );
  }
}

const apiKey = APIKeyManager.generate(123, 'Production Key');
console.log('Generated API key:', apiKey.key);
console.log('Store this hash:', apiKey.hash);

const isValid = APIKeyManager.validate(apiKey.key, apiKey.hash);
console.log('Key validation:', isValid ? '✓ Valid' : '✗ Invalid');
console.log();

// Example 3: Password Reset Token System
console.log('3. Password Reset Token System:');
class PasswordResetManager {
  static generateResetToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = Date.now() + 3600000; // 1 hour

    return {
      token: token, // Send this in email
      hash: hash,   // Store this in database
      email: email,
      expiresAt: expiresAt
    };
  }

  static validateResetToken(token, storedData) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    if (Date.now() > storedData.expiresAt) {
      return { valid: false, reason: 'Token expired' };
    }

    if (hash !== storedData.hash) {
      return { valid: false, reason: 'Invalid token' };
    }

    return { valid: true, email: storedData.email };
  }
}

const resetData = PasswordResetManager.generateResetToken('user@example.com');
console.log('Reset token (send in email):', resetData.token);
console.log('Token hash (store in DB):', resetData.hash);

const resetValidation = PasswordResetManager.validateResetToken(
  resetData.token,
  { hash: resetData.hash, expiresAt: resetData.expiresAt, email: resetData.email }
);
console.log('Token validation:', resetValidation);
console.log();

// Example 4: File Checksum Verifier
console.log('4. File Checksum Verifier:');
class FileIntegrity {
  static calculateChecksum(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static verifyChecksum(filePath, expectedChecksum) {
    const actualChecksum = this.calculateChecksum(filePath);
    return actualChecksum === expectedChecksum;
  }

  static generateManifest(files) {
    const manifest = {};
    files.forEach(file => {
      if (fs.existsSync(file)) {
        manifest[file] = this.calculateChecksum(file);
      }
    });
    return manifest;
  }
}

// Simulate file content
const testFile = '/tmp/test-file.txt';
fs.writeFileSync(testFile, 'Important file content');

const checksum = FileIntegrity.calculateChecksum(testFile);
console.log('File:', testFile);
console.log('Checksum:', checksum);

const isIntact = FileIntegrity.verifyChecksum(testFile, checksum);
console.log('File integrity:', isIntact ? '✓ Verified' : '✗ Corrupted');

// Clean up
fs.unlinkSync(testFile);
console.log();

// Example 5: Signed Message System
console.log('5. Signed Message System:');
class MessageSigner {
  constructor(secret) {
    this.secret = secret;
  }

  sign(message) {
    const timestamp = Date.now();
    const payload = JSON.stringify({ message, timestamp });

    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(payload);
    const signature = hmac.digest('hex');

    return {
      message,
      timestamp,
      signature
    };
  }

  verify(signedMessage, maxAge = 300000) { // 5 minutes default
    const { message, timestamp, signature } = signedMessage;

    // Check age
    if (Date.now() - timestamp > maxAge) {
      return { valid: false, reason: 'Message too old' };
    }

    // Verify signature
    const payload = JSON.stringify({ message, timestamp });
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }

    return { valid: true, message };
  }
}

const signer = new MessageSigner('shared-secret-key');
const signedMsg = signer.sign('Hello, this is a signed message');
console.log('Signed message:', signedMsg);

const msgVerification = signer.verify(signedMsg);
console.log('Verification:', msgVerification);
console.log();

// Example 6: Encrypted Storage System
console.log('6. Encrypted Storage System:');
class SecureStorage {
  constructor(masterPassword) {
    this.masterPassword = masterPassword;
    this.storage = {};
  }

  set(key, value) {
    const salt = crypto.randomBytes(16);
    const derivedKey = crypto.pbkdf2Sync(this.masterPassword, salt, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
    let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    this.storage[key] = {
      data: encrypted,
      salt: salt.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  get(key) {
    const stored = this.storage[key];
    if (!stored) return null;

    const derivedKey = crypto.pbkdf2Sync(
      this.masterPassword,
      Buffer.from(stored.salt, 'hex'),
      100000,
      32,
      'sha512'
    );

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      derivedKey,
      Buffer.from(stored.iv, 'hex')
    );

    let decrypted = decipher.update(stored.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

const storage = new SecureStorage('masterPassword123');
storage.set('creditCard', { number: '1234-5678-9012-3456', cvv: '123' });
storage.set('ssn', '123-45-6789');

console.log('Stored encrypted data');
console.log('Retrieved credit card:', storage.get('creditCard'));
console.log('Retrieved SSN:', storage.get('ssn'));
console.log();

// Example 7: One-Time Password (OTP) Generator
console.log('7. One-Time Password (OTP) Generator:');
class OTPGenerator {
  static generate(length = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += crypto.randomInt(0, 10);
    }
    return otp;
  }

  static generateWithExpiry(length = 6, validityMs = 300000) {
    const otp = this.generate(length);
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    return {
      otp: otp,        // Send to user
      hash: hash,      // Store in database
      expiresAt: Date.now() + validityMs
    };
  }

  static verify(otp, storedData) {
    if (Date.now() > storedData.expiresAt) {
      return { valid: false, reason: 'OTP expired' };
    }

    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    if (hash !== storedData.hash) {
      return { valid: false, reason: 'Invalid OTP' };
    }

    return { valid: true };
  }
}

const otpData = OTPGenerator.generateWithExpiry(6);
console.log('Generated OTP:', otpData.otp);
console.log('Store hash:', otpData.hash);

const otpVerification = OTPGenerator.verify(otpData.otp, otpData);
console.log('OTP verification:', otpVerification);
console.log();

// Example 8: Rate Limiting Token Bucket
console.log('8. Rate Limiting with Hashed IPs:');
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  hashIP(ip) {
    // Hash IP for privacy
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  checkLimit(ip) {
    const hashedIP = this.hashIP(ip);
    const now = Date.now();
    let bucket = this.buckets.get(hashedIP);

    if (!bucket || now - bucket.startTime > this.windowMs) {
      bucket = { count: 0, startTime: now };
      this.buckets.set(hashedIP, bucket);
    }

    bucket.count++;

    return {
      allowed: bucket.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - bucket.count),
      resetAt: bucket.startTime + this.windowMs
    };
  }
}

const limiter = new RateLimiter(5, 60000); // 5 requests per minute
const clientIP = '192.168.1.100';

for (let i = 1; i <= 7; i++) {
  const result = limiter.checkLimit(clientIP);
  console.log(`Request ${i}:`, result.allowed ? '✓ Allowed' : '✗ Blocked',
    `(${result.remaining} remaining)`);
}
console.log();

// Example 9: Secure Comparison Function
console.log('9. Secure Comparison (Timing-Safe):');
function insecureCompare(a, b) {
  // ❌ Vulnerable to timing attacks
  return a === b;
}

function secureCompare(a, b) {
  // ✅ Timing-safe comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (e) {
    return false;
  }
}

const secret1 = 'secret-token-123456';
const secret2 = 'secret-token-123456';
const secret3 = 'wrong-token-123456';

console.log('Insecure compare (correct):', insecureCompare(secret1, secret2));
console.log('Secure compare (correct):  ', secureCompare(secret1, secret2));
console.log('Secure compare (wrong):    ', secureCompare(secret1, secret3));
console.log('Use case: Prevent timing attacks on token verification');
console.log();

// Example 10: Data Anonymization
console.log('10. Data Anonymization:');
class DataAnonymizer {
  static anonymize(data, salt = '') {
    return crypto.createHash('sha256')
      .update(data + salt)
      .digest('hex');
  }

  static anonymizeEmail(email, salt = '') {
    const hash = this.anonymize(email, salt);
    return hash.substring(0, 16) + '@anonymized.local';
  }

  static anonymizeUser(user, salt = '') {
    return {
      id: this.anonymize(user.id.toString(), salt),
      email: this.anonymizeEmail(user.email, salt),
      name: this.anonymize(user.name, salt).substring(0, 8)
    };
  }
}

const userData = {
  id: 12345,
  email: 'john.doe@example.com',
  name: 'John Doe'
};

const anonymized = DataAnonymizer.anonymizeUser(userData, 'privacy-salt');
console.log('Original:', userData);
console.log('Anonymized:', anonymized);
console.log('Use case: GDPR compliance, analytics');
console.log();

// Example 11: License Key Generator
console.log('11. License Key Generator:');
class LicenseKeyGenerator {
  static generate(productId, customerId) {
    const data = `${productId}:${customerId}:${Date.now()}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');

    // Format as XXXXX-XXXXX-XXXXX-XXXXX
    const key = hash.substring(0, 20).toUpperCase();
    return key.match(/.{1,5}/g).join('-');
  }

  static verify(licenseKey, productId, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(licenseKey + productId);
    return hmac.digest('hex');
  }
}

const licenseKey = LicenseKeyGenerator.generate('PROD-001', 'CUST-12345');
console.log('License key:', licenseKey);
console.log('Use case: Software licensing');
console.log();

// Example 12: Secure Random Password Generator
console.log('12. Secure Random Password Generator:');
class PasswordGenerator {
  static generate(length = 16, options = {}) {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true
    } = options;

    let charset = '';
    if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  static generateMultiple(count = 5, length = 16) {
    const passwords = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generate(length));
    }
    return passwords;
  }
}

console.log('Generated passwords:');
PasswordGenerator.generateMultiple(5, 16).forEach((pwd, i) => {
  console.log(`${i + 1}. ${pwd}`);
});
console.log();

// Example 13: Challenge-Response Authentication
console.log('13. Challenge-Response Authentication:');
class ChallengeAuth {
  static createChallenge() {
    return crypto.randomBytes(32).toString('hex');
  }

  static createResponse(challenge, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(challenge);
    return hmac.digest('hex');
  }

  static verifyResponse(challenge, response, secret) {
    const expectedResponse = this.createResponse(challenge, secret);
    return crypto.timingSafeEqual(
      Buffer.from(response),
      Buffer.from(expectedResponse)
    );
  }
}

const challenge = ChallengeAuth.createChallenge();
const sharedSecret = 'client-server-secret';
const response = ChallengeAuth.createResponse(challenge, sharedSecret);

console.log('Challenge:', challenge);
console.log('Response:', response);

const authValid = ChallengeAuth.verifyResponse(challenge, response, sharedSecret);
console.log('Authentication:', authValid ? '✓ Valid' : '✗ Invalid');
console.log();

console.log('=== All Examples Completed ===');
