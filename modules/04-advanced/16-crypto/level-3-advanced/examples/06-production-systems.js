/**
 * Production Cryptographic Systems
 *
 * Real-world production patterns combining authentication,
 * encryption, monitoring, and compliance requirements.
 */

const crypto = require('crypto');
const EventEmitter = require('events');

console.log('=== Production Cryptographic Systems ===\n');

// Example 1: Complete Authentication System
console.log('1. Production Authentication System:');

class ProductionAuthSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      accessTokenTTL: config.accessTokenTTL || 900, // 15 minutes
      refreshTokenTTL: config.refreshTokenTTL || 2592000, // 30 days
      sessionTimeout: config.sessionTimeout || 1800000, // 30 minutes
      ...config
    };

    // Generate RSA keys for JWT
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    this.users = new Map();
    this.sessions = new Map();
    this.refreshTokens = new Map();
    this.revokedTokens = new Set();

    console.log('Production auth system initialized');
  }

  // Register new user
  async register(username, password, metadata = {}) {
    if (this.users.has(username)) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = crypto.randomBytes(16);
    const hash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
        if (err) reject(err);
        else resolve(key);
      });
    });

    const user = {
      userId: crypto.randomUUID(),
      username,
      passwordHash: hash.toString('hex'),
      salt: salt.toString('hex'),
      createdAt: Date.now(),
      lastLogin: null,
      metadata
    };

    this.users.set(username, user);
    this.emit('user:registered', { userId: user.userId, username });

    return {
      userId: user.userId,
      username: user.username
    };
  }

  // Login user
  async login(username, password, clientInfo = {}) {
    const user = this.users.get(username);
    if (!user) {
      // Prevent timing attacks - still hash
      await new Promise((resolve, reject) => {
        crypto.pbkdf2('dummy', 'salt', 100000, 64, 'sha512', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      throw new Error('Invalid credentials');
    }

    // Verify password
    const hash = await new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        Buffer.from(user.salt, 'hex'),
        100000,
        64,
        'sha512',
        (err, key) => {
          if (err) reject(err);
          else resolve(key);
        }
      );
    });

    if (!crypto.timingSafeEqual(hash, Buffer.from(user.passwordHash, 'hex'))) {
      this.emit('auth:failed', { username });
      throw new Error('Invalid credentials');
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user, sessionId);

    const session = {
      sessionId,
      userId: user.userId,
      username: user.username,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      clientInfo
    };

    this.sessions.set(sessionId, session);
    this.refreshTokens.set(refreshToken.jti, {
      userId: user.userId,
      sessionId,
      createdAt: Date.now()
    });

    user.lastLogin = Date.now();
    this.emit('auth:success', { userId: user.userId, sessionId });

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: this.config.accessTokenTTL
    };
  }

  createAccessToken(user) {
    const payload = {
      sub: user.userId,
      username: user.username,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.accessTokenTTL,
      jti: crypto.randomUUID()
    };

    return this.signJWT(payload);
  }

  createRefreshToken(user, sessionId) {
    const jti = crypto.randomUUID();
    const payload = {
      sub: user.userId,
      type: 'refresh',
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.config.refreshTokenTTL,
      jti
    };

    return {
      token: this.signJWT(payload),
      jti
    };
  }

  signJWT(payload) {
    const header = { alg: 'RS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header))
      .toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload))
      .toString('base64url');

    const message = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64url');

    return `${message}.${signature}`;
  }

  verifyJWT(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const isValid = crypto
      .createVerify('RSA-SHA256')
      .update(message)
      .verify(this.publicKey, signature, 'base64url');

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url'));

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }

    // Check revocation
    if (this.revokedTokens.has(payload.jti)) {
      throw new Error('Token revoked');
    }

    return payload;
  }

  // Verify access token
  verifyAccessToken(token) {
    const payload = this.verifyJWT(token);

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    this.emit('token:verified', { userId: payload.sub });
    return payload;
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    const payload = this.verifyJWT(refreshToken);

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const tokenData = this.refreshTokens.get(payload.jti);
    if (!tokenData) {
      throw new Error('Refresh token not found');
    }

    const user = Array.from(this.users.values())
      .find(u => u.userId === payload.sub);

    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = this.createAccessToken(user);
    this.emit('token:refreshed', { userId: user.userId });

    return {
      accessToken,
      expiresIn: this.config.accessTokenTTL
    };
  }

  // Logout
  logout(refreshToken) {
    try {
      const payload = this.verifyJWT(refreshToken);
      this.refreshTokens.delete(payload.jti);
      this.revokedTokens.add(payload.jti);

      if (payload.sessionId) {
        this.sessions.delete(payload.sessionId);
      }

      this.emit('auth:logout', { userId: payload.sub });
      return true;
    } catch (err) {
      return false;
    }
  }

  // Get metrics
  getMetrics() {
    return {
      totalUsers: this.users.size,
      activeSessions: this.sessions.size,
      activeRefreshTokens: this.refreshTokens.size,
      revokedTokens: this.revokedTokens.size
    };
  }
}

const authSystem = new ProductionAuthSystem();

// Listen to auth events
authSystem.on('user:registered', (data) => {
  console.log('[Event] User registered:', data.username);
});

authSystem.on('auth:success', (data) => {
  console.log('[Event] Login successful:', data.userId);
});

// Register and login
(async () => {
  try {
    // Register user
    await authSystem.register('alice', 'SecurePassword123!', {
      email: 'alice@example.com'
    });

    // Login
    const tokens = await authSystem.login('alice', 'SecurePassword123!', {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0'
    });

    console.log('Access token issued');

    // Verify access token
    const payload = authSystem.verifyAccessToken(tokens.accessToken);
    console.log('Token verified for user:', payload.username);

    // Get metrics
    const metrics = authSystem.getMetrics();
    console.log('System metrics:', metrics);

    console.log('✓ Production auth system operational\n');
  } catch (err) {
    console.error('Error:', err.message);
  }
})();

// Example 2: Encrypted Data Storage with Compliance
console.log('2. Compliance-Ready Encrypted Storage:');

class ComplianceDataStore extends EventEmitter {
  constructor(encryptionKey) {
    super();
    this.encryptionKey = encryptionKey;
    this.data = new Map();
    this.auditLog = [];
    this.metadata = new Map();
  }

  // Store encrypted data with audit
  async store(dataId, data, classification = 'confidential') {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const record = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      createdAt: Date.now(),
      classification
    };

    this.data.set(dataId, record);
    this.metadata.set(dataId, {
      dataId,
      classification,
      createdAt: record.createdAt,
      accessCount: 0,
      lastAccessed: null
    });

    this.audit('CREATE', dataId, { classification });
    this.emit('data:stored', { dataId, classification });

    return dataId;
  }

  // Retrieve and decrypt data
  async retrieve(dataId, userId) {
    const record = this.data.get(dataId);
    if (!record) {
      this.audit('ACCESS_DENIED', dataId, { userId, reason: 'Not found' });
      throw new Error('Data not found');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(record.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(record.authTag, 'hex'));

    let decrypted = decipher.update(record.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const metadata = this.metadata.get(dataId);
    metadata.accessCount++;
    metadata.lastAccessed = Date.now();

    this.audit('ACCESS', dataId, { userId });
    this.emit('data:accessed', { dataId, userId });

    return JSON.parse(decrypted);
  }

  // Delete data (GDPR right to be forgotten)
  async delete(dataId, userId) {
    const record = this.data.get(dataId);
    if (!record) {
      return false;
    }

    // Securely wipe
    record.encrypted = '0'.repeat(record.encrypted.length);

    this.data.delete(dataId);
    this.metadata.delete(dataId);

    this.audit('DELETE', dataId, { userId, reason: 'GDPR deletion' });
    this.emit('data:deleted', { dataId, userId });

    return true;
  }

  // Audit logging
  audit(action, dataId, details = {}) {
    const entry = {
      timestamp: Date.now(),
      action,
      dataId,
      details
    };

    this.auditLog.push(entry);
    this.emit('audit', entry);
  }

  // Get compliance report
  getComplianceReport() {
    const report = {
      totalRecords: this.data.size,
      dataByClassification: {},
      auditEntries: this.auditLog.length,
      recentAccess: []
    };

    for (const [dataId, metadata] of this.metadata) {
      const classification = metadata.classification;
      report.dataByClassification[classification] =
        (report.dataByClassification[classification] || 0) + 1;

      if (metadata.lastAccessed) {
        report.recentAccess.push({
          dataId,
          lastAccessed: metadata.lastAccessed,
          accessCount: metadata.accessCount
        });
      }
    }

    report.recentAccess.sort((a, b) => b.lastAccessed - a.lastAccessed);
    report.recentAccess = report.recentAccess.slice(0, 10);

    return report;
  }
}

const dataStore = new ComplianceDataStore(crypto.randomBytes(32));

(async () => {
  // Store data
  const dataId = await dataStore.store('user-001', {
    name: 'John Doe',
    ssn: '123-45-6789',
    email: 'john@example.com'
  }, 'pii');

  console.log('[Compliance] Data stored with encryption');

  // Retrieve data
  const data = await dataStore.retrieve(dataId, 'admin-user');
  console.log('[Compliance] Data retrieved:', data.name);

  // Get compliance report
  const report = dataStore.getComplianceReport();
  console.log('[Compliance] Report:', report);

  console.log('✓ Compliance-ready storage operational\n');
})();

// Example 3: Health Monitoring and Metrics
console.log('3. Crypto Operations Monitoring:');

class CryptoMonitor {
  constructor() {
    this.metrics = {
      operations: {
        encrypt: 0,
        decrypt: 0,
        sign: 0,
        verify: 0,
        hash: 0
      },
      errors: {
        encryptionFailed: 0,
        decryptionFailed: 0,
        signatureFailed: 0,
        verificationFailed: 0
      },
      performance: {
        avgEncryptTime: 0,
        avgDecryptTime: 0,
        avgSignTime: 0,
        avgVerifyTime: 0
      },
      startTime: Date.now()
    };
  }

  async recordOperation(type, operation) {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.metrics.operations[type]++;
      this.updateAverage(type, duration);

      return result;
    } catch (err) {
      this.metrics.errors[`${type}Failed`]++;
      throw err;
    }
  }

  updateAverage(type, duration) {
    const key = `avg${type.charAt(0).toUpperCase() + type.slice(1)}Time`;
    const count = this.metrics.operations[type];
    const currentAvg = this.metrics.performance[key];

    this.metrics.performance[key] =
      (currentAvg * (count - 1) + duration) / count;
  }

  getHealthStatus() {
    const totalOps = Object.values(this.metrics.operations)
      .reduce((sum, val) => sum + val, 0);
    const totalErrors = Object.values(this.metrics.errors)
      .reduce((sum, val) => sum + val, 0);

    const errorRate = totalOps > 0 ? (totalErrors / totalOps) * 100 : 0;
    const uptime = Date.now() - this.metrics.startTime;

    return {
      status: errorRate < 1 ? 'healthy' : 'degraded',
      uptime,
      totalOperations: totalOps,
      errorRate: errorRate.toFixed(2) + '%',
      metrics: this.metrics
    };
  }
}

const monitor = new CryptoMonitor();

// Simulate monitored operations
(async () => {
  const key = crypto.randomBytes(32);

  for (let i = 0; i < 100; i++) {
    await monitor.recordOperation('encrypt', async () => {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.update('test data');
      cipher.final();
      return true;
    });
  }

  const health = monitor.getHealthStatus();
  console.log('[Monitor] Health status:', health.status);
  console.log('[Monitor] Total operations:', health.totalOperations);
  console.log('[Monitor] Avg encrypt time:', health.metrics.performance.avgEncryptTime.toFixed(2), 'ms');

  console.log('✓ Monitoring system operational\n');
})();

// Example 4: Production Best Practices
console.log('4. Production Deployment Checklist:');

const productionChecklist = {
  'Security': [
    'Use environment variables for keys',
    'Implement key rotation',
    'Enable audit logging',
    'Use HSM for master keys',
    'Implement rate limiting',
    'Use TLS for all connections'
  ],
  'Performance': [
    'Use async crypto operations',
    'Implement connection pooling',
    'Cache public keys',
    'Use streaming for large files',
    'Monitor operation latency',
    'Optimize algorithm choice'
  ],
  'Compliance': [
    'Encrypt PII at rest',
    'Log data access',
    'Implement data retention',
    'Support right to deletion',
    'Geographic data controls',
    'Regular compliance audits'
  ],
  'Operations': [
    'Health checks',
    'Metrics and alerting',
    'Backup and recovery',
    'Disaster recovery plan',
    'Incident response',
    'Regular security updates'
  ],
  'Monitoring': [
    'Track error rates',
    'Monitor performance',
    'Alert on anomalies',
    'Log security events',
    'Track key usage',
    'Audit trail retention'
  ]
};

console.log('Production Deployment Checklist:');
for (const [category, items] of Object.entries(productionChecklist)) {
  console.log(`\n${category}:`);
  items.forEach(item => console.log(`  ✓ ${item}`));
}

console.log('\n=== Production Cryptographic Systems Complete ===');
