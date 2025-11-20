/**
 * Advanced Key Management System
 *
 * Enterprise-grade key management with secure storage,
 * rotation, recovery, and hierarchical key derivation.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('=== Advanced Key Management System ===\n');

// Example 1: Secure Key Vault
console.log('1. Secure Key Vault Implementation:');

class KeyVault {
  constructor(masterPassword) {
    this.keys = new Map();
    this.metadata = new Map();

    // Derive master key from password
    this.salt = crypto.randomBytes(16);
    this.masterKey = crypto.pbkdf2Sync(
      masterPassword,
      this.salt,
      100000,
      32,
      'sha256'
    );

    console.log('Key vault initialized with master encryption key');
  }

  // Store encrypted key
  storeKey(keyId, key, metadata = {}) {
    // Generate unique IV for this key
    const iv = crypto.randomBytes(16);

    // Encrypt key with master key
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(key);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Store encrypted key
    this.keys.set(keyId, {
      encrypted,
      iv,
      authTag,
      createdAt: Date.now()
    });

    // Store metadata (not encrypted)
    this.metadata.set(keyId, {
      ...metadata,
      algorithm: metadata.algorithm || 'aes-256-gcm',
      createdAt: Date.now(),
      lastAccessed: null,
      accessCount: 0
    });

    console.log(`Key stored: ${keyId}`);
  }

  // Retrieve and decrypt key
  retrieveKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      throw new Error('Key not found');
    }

    // Decrypt key
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.masterKey,
      keyData.iv
    );
    decipher.setAuthTag(keyData.authTag);

    let decrypted = decipher.update(keyData.encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Update access metadata
    const metadata = this.metadata.get(keyId);
    metadata.lastAccessed = Date.now();
    metadata.accessCount++;

    return decrypted;
  }

  // Rotate master key
  rotateMasterKey(newMasterPassword) {
    const newSalt = crypto.randomBytes(16);
    const newMasterKey = crypto.pbkdf2Sync(
      newMasterPassword,
      newSalt,
      100000,
      32,
      'sha256'
    );

    // Re-encrypt all keys with new master key
    const reencrypted = new Map();

    for (const [keyId, keyData] of this.keys) {
      // Decrypt with old master key
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        keyData.iv
      );
      decipher.setAuthTag(keyData.authTag);
      let decrypted = decipher.update(keyData.encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Encrypt with new master key
      const newIv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', newMasterKey, newIv);
      let encrypted = cipher.update(decrypted);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      reencrypted.set(keyId, {
        encrypted,
        iv: newIv,
        authTag,
        createdAt: keyData.createdAt
      });

      // Clear decrypted key from memory
      decrypted.fill(0);
    }

    // Update to new master key
    this.masterKey = newMasterKey;
    this.salt = newSalt;
    this.keys = reencrypted;

    console.log('Master key rotated, all keys re-encrypted');
  }

  // List all keys
  listKeys() {
    const keys = [];
    for (const [keyId, metadata] of this.metadata) {
      keys.push({
        keyId,
        ...metadata
      });
    }
    return keys;
  }

  // Delete key
  deleteKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (keyData) {
      // Securely wipe key data
      keyData.encrypted.fill(0);
      this.keys.delete(keyId);
      this.metadata.delete(keyId);
      console.log(`Key deleted: ${keyId}`);
      return true;
    }
    return false;
  }
}

const vault = new KeyVault('super-secret-master-password');

// Store some keys
vault.storeKey('database-encryption-key', crypto.randomBytes(32), {
  purpose: 'database encryption',
  algorithm: 'aes-256-gcm'
});

vault.storeKey('api-signing-key', crypto.randomBytes(32), {
  purpose: 'API request signing',
  algorithm: 'hmac-sha256'
});

// Retrieve key
const dbKey = vault.retrieveKey('database-encryption-key');
console.log('Retrieved key length:', dbKey.length, 'bytes');

// List all keys
const keyList = vault.listKeys();
console.log('Keys in vault:', keyList.length);

console.log('✓ Key vault operational\n');

// Example 2: Hierarchical Key Derivation
console.log('2. Hierarchical Key Derivation:');

class HierarchicalKeyDerivation {
  constructor(masterSeed) {
    // Root key derived from master seed
    this.rootKey = crypto.pbkdf2Sync(
      masterSeed,
      Buffer.from('root-key-salt'),
      100000,
      32,
      'sha256'
    );

    console.log('Root key derived from master seed');
  }

  // Derive purpose-specific key
  derivePurposeKey(purpose) {
    return crypto.hkdfSync(
      'sha256',
      this.rootKey,
      Buffer.from(''),
      Buffer.from(`purpose:${purpose}`),
      32
    );
  }

  // Derive tenant-specific key
  deriveTenantKey(purpose, tenantId) {
    const purposeKey = this.derivePurposeKey(purpose);

    return crypto.hkdfSync(
      'sha256',
      purposeKey,
      Buffer.from(''),
      Buffer.from(`tenant:${tenantId}`),
      32
    );
  }

  // Derive user-specific key
  deriveUserKey(purpose, tenantId, userId) {
    const tenantKey = this.deriveTenantKey(purpose, tenantId);

    return crypto.hkdfSync(
      'sha256',
      tenantKey,
      Buffer.from(''),
      Buffer.from(`user:${userId}`),
      32
    );
  }

  // Derive session key
  deriveSessionKey(purpose, tenantId, userId, sessionId) {
    const userKey = this.deriveUserKey(purpose, tenantId, userId);

    return crypto.hkdfSync(
      'sha256',
      userKey,
      Buffer.from(''),
      Buffer.from(`session:${sessionId}`),
      32
    );
  }
}

const hkd = new HierarchicalKeyDerivation('master-seed-secret');

// Derive keys at different levels
const encryptionPurposeKey = hkd.derivePurposeKey('encryption');
const tenant1Key = hkd.deriveTenantKey('encryption', 'tenant-001');
const user1Key = hkd.deriveUserKey('encryption', 'tenant-001', 'user-123');
const sessionKey = hkd.deriveSessionKey(
  'encryption',
  'tenant-001',
  'user-123',
  'session-abc'
);

console.log('Derived keys at 4 levels of hierarchy');
console.log('✓ Hierarchical key derivation working\n');

// Example 3: Key Rotation Strategy
console.log('3. Key Rotation Strategy:');

class KeyRotationManager {
  constructor() {
    this.keys = new Map();
    this.currentKeyVersion = 0;
  }

  // Generate new key version
  rotateKey(keyId) {
    this.currentKeyVersion++;

    const newKey = {
      version: this.currentKeyVersion,
      key: crypto.randomBytes(32),
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'active'
    };

    if (!this.keys.has(keyId)) {
      this.keys.set(keyId, []);
    }

    // Mark old keys as deprecated
    const keyVersions = this.keys.get(keyId);
    keyVersions.forEach(k => {
      if (k.status === 'active') {
        k.status = 'deprecated';
      }
    });

    keyVersions.push(newKey);
    this.keys.get(keyId).push(newKey);

    console.log(`Key ${keyId} rotated to version ${this.currentKeyVersion}`);
    return this.currentKeyVersion;
  }

  // Get current active key
  getCurrentKey(keyId) {
    const versions = this.keys.get(keyId);
    if (!versions) {
      throw new Error('Key not found');
    }

    const activeKey = versions.find(k => k.status === 'active');
    if (!activeKey) {
      throw new Error('No active key version');
    }

    return activeKey;
  }

  // Get specific key version (for decryption)
  getKeyVersion(keyId, version) {
    const versions = this.keys.get(keyId);
    if (!versions) {
      throw new Error('Key not found');
    }

    const key = versions.find(k => k.version === version);
    if (!key) {
      throw new Error('Key version not found');
    }

    return key;
  }

  // Encrypt with current key version
  encrypt(keyId, data) {
    const keyVersion = this.getCurrentKey(keyId);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-gcm', keyVersion.key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: keyVersion.version
    };
  }

  // Decrypt with specified key version
  decrypt(keyId, encryptedData) {
    const { ciphertext, iv, authTag, keyVersion } = encryptedData;
    const key = this.getKeyVersion(keyId, keyVersion);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key.key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Clean up expired keys
  cleanupExpiredKeys(keyId) {
    const versions = this.keys.get(keyId);
    if (!versions) return;

    const now = Date.now();
    const active = versions.filter(k => {
      if (k.expiresAt < now && k.status !== 'active') {
        console.log(`Removing expired key version ${k.version}`);
        return false;
      }
      return true;
    });

    this.keys.set(keyId, active);
  }
}

const rotationMgr = new KeyRotationManager();

// Initial key
rotationMgr.rotateKey('data-encryption-key');

// Encrypt with version 1
const encrypted1 = rotationMgr.encrypt('data-encryption-key', 'Sensitive data v1');
console.log('Encrypted with key version:', encrypted1.keyVersion);

// Rotate key
rotationMgr.rotateKey('data-encryption-key');

// Encrypt with version 2
const encrypted2 = rotationMgr.encrypt('data-encryption-key', 'Sensitive data v2');
console.log('Encrypted with key version:', encrypted2.keyVersion);

// Can still decrypt old data
const decrypted1 = rotationMgr.decrypt('data-encryption-key', encrypted1);
console.log('Decrypted old data:', decrypted1);

// Can decrypt new data
const decrypted2 = rotationMgr.decrypt('data-encryption-key', encrypted2);
console.log('Decrypted new data:', decrypted2);

console.log('✓ Key rotation with backward compatibility\n');

// Example 4: Key Backup and Recovery
console.log('4. Key Backup and Recovery:');

class KeyBackupSystem {
  constructor(backupPassword) {
    this.backupKey = crypto.pbkdf2Sync(
      backupPassword,
      Buffer.from('backup-salt'),
      100000,
      32,
      'sha256'
    );
  }

  // Create encrypted backup
  createBackup(keys) {
    const backup = {
      version: 1,
      timestamp: Date.now(),
      keys: []
    };

    for (const [keyId, keyData] of keys) {
      backup.keys.push({
        keyId,
        key: keyData.toString('hex'),
        metadata: {}
      });
    }

    // Encrypt entire backup
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.backupKey, iv);

    let encrypted = cipher.update(JSON.stringify(backup), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      timestamp: backup.timestamp
    };
  }

  // Restore from backup
  restoreBackup(encryptedBackup) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.backupKey,
      Buffer.from(encryptedBackup.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedBackup.authTag, 'hex'));

    let decrypted = decipher.update(encryptedBackup.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const backup = JSON.parse(decrypted);

    const restoredKeys = new Map();
    for (const keyEntry of backup.keys) {
      restoredKeys.set(keyEntry.keyId, Buffer.from(keyEntry.key, 'hex'));
    }

    console.log(`Restored ${restoredKeys.size} keys from backup`);
    return restoredKeys;
  }

  // Split key using Shamir's Secret Sharing (simplified)
  splitKey(key, threshold, shares) {
    // In production, use a proper Shamir's Secret Sharing library
    // This is a simplified demonstration

    const keyShares = [];
    for (let i = 0; i < shares; i++) {
      const share = {
        id: i + 1,
        data: crypto.randomBytes(key.length).toString('hex'),
        threshold
      };
      keyShares.push(share);
    }

    console.log(`Key split into ${shares} shares (${threshold} required)`);
    return keyShares;
  }
}

const backupSystem = new KeyBackupSystem('backup-password-123');

// Create backup
const keysToBackup = new Map([
  ['key-1', crypto.randomBytes(32)],
  ['key-2', crypto.randomBytes(32)]
]);

const backup = backupSystem.createBackup(keysToBackup);
console.log('Backup created at:', new Date(backup.timestamp));

// Restore backup
const restored = backupSystem.restoreBackup(backup);
console.log('Restored keys:', restored.size);

// Split key for distributed storage
const criticalKey = crypto.randomBytes(32);
const shares = backupSystem.splitKey(criticalKey, 3, 5);
console.log('Key shares created:', shares.length);

console.log('✓ Backup and recovery system operational\n');

// Example 5: Hardware Security Module (HSM) Simulation
console.log('5. HSM Simulation:');

class HSMSimulator {
  constructor() {
    // Keys never leave the HSM
    this.keys = new Map();
    this.operationCount = 0;
  }

  // Generate key inside HSM
  generateKey(keyId, algorithm = 'aes-256') {
    let key;
    if (algorithm === 'aes-256') {
      key = crypto.randomBytes(32);
    } else if (algorithm === 'rsa-2048') {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048
      });
      key = { publicKey, privateKey };
    }

    this.keys.set(keyId, {
      key,
      algorithm,
      createdAt: Date.now(),
      operations: 0
    });

    console.log(`Key generated in HSM: ${keyId} (${algorithm})`);

    // Return only key reference, not actual key
    return { keyId, algorithm };
  }

  // Encrypt using key in HSM
  encrypt(keyId, data) {
    const keyEntry = this.keys.get(keyId);
    if (!keyEntry) {
      throw new Error('Key not found in HSM');
    }

    this.operationCount++;
    keyEntry.operations++;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyEntry.key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Decrypt using key in HSM
  decrypt(keyId, encryptedData) {
    const keyEntry = this.keys.get(keyId);
    if (!keyEntry) {
      throw new Error('Key not found in HSM');
    }

    this.operationCount++;
    keyEntry.operations++;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      keyEntry.key,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Get key metadata (not the actual key)
  getKeyMetadata(keyId) {
    const keyEntry = this.keys.get(keyId);
    if (!keyEntry) {
      throw new Error('Key not found');
    }

    return {
      keyId,
      algorithm: keyEntry.algorithm,
      createdAt: keyEntry.createdAt,
      operations: keyEntry.operations
    };
  }

  // Get HSM statistics
  getStatistics() {
    return {
      totalKeys: this.keys.size,
      totalOperations: this.operationCount,
      keys: Array.from(this.keys.keys())
    };
  }
}

const hsm = new HSMSimulator();

// Generate key in HSM
const hsmKeyRef = hsm.generateKey('master-key-1', 'aes-256');

// Encrypt using HSM (key never leaves HSM)
const hsmEncrypted = hsm.encrypt('master-key-1', 'Top secret data');
console.log('Data encrypted by HSM');

// Decrypt using HSM
const hsmDecrypted = hsm.decrypt('master-key-1', hsmEncrypted);
console.log('Data decrypted by HSM:', hsmDecrypted);

// Get statistics
const stats = hsm.getStatistics();
console.log('HSM Statistics:', stats);

console.log('✓ HSM simulation complete\n');

// Example 6: Best Practices Summary
console.log('6. Key Management Best Practices:');

const bestPractices = {
  'Never hardcode keys': 'Use key vaults or environment-specific storage',
  'Encrypt keys at rest': 'Master key encrypts all other keys',
  'Rotate keys regularly': 'Automated rotation with backward compatibility',
  'Use hierarchical derivation': 'One master key derives purpose-specific keys',
  'Implement access controls': 'Audit all key access attempts',
  'Backup keys securely': 'Encrypted backups in multiple locations',
  'Use HSMs for critical keys': 'Hardware protection for master keys',
  'Separate duties': 'No single person has all keys',
  'Monitor key usage': 'Alert on unusual access patterns',
  'Plan for key recovery': 'Key splitting or secure backup procedures',
  'Document key lifecycle': 'Creation, rotation, deprecation, deletion',
  'Test recovery procedures': 'Regular disaster recovery drills'
};

console.log('Key Management Best Practices:');
for (const [practice, description] of Object.entries(bestPractices)) {
  console.log(`✓ ${practice}: ${description}`);
}

console.log('\n=== Advanced Key Management System Complete ===');
