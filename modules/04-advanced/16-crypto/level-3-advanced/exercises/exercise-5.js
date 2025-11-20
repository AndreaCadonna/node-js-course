/**
 * Exercise 5: Secure Key Vault (Capstone Project)
 *
 * OBJECTIVE:
 * Build a production-ready key management system (KMS) similar to HashiCorp Vault,
 * AWS KMS, or Azure Key Vault. This capstone integrates all crypto concepts:
 * encryption, key derivation, authentication, access control, and auditing.
 *
 * REQUIREMENTS:
 * 1. Implement key encryption keys (KEK) architecture
 * 2. Build secure key storage and retrieval
 * 3. Create automated key rotation mechanism
 * 4. Implement role-based access control (RBAC)
 * 5. Add comprehensive audit logging
 * 6. Support multiple key types and algorithms
 *
 * LEARNING GOALS:
 * - Understanding key management systems
 * - Implementing envelope encryption
 * - Building secure multi-tenant systems
 * - Designing for compliance and auditability
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('=== Exercise 5: Secure Key Vault (Capstone) ===\n');

// Task 1: Implement Key Encryption Key (KEK) System
console.log('Task 1: Key encryption key architecture');

/**
 * TODO 1: Create master key from passphrase
 *
 * The master key encrypts all other keys (envelope encryption).
 * This allows key rotation without re-encrypting all data.
 *
 * Steps:
 * 1. Use scrypt to derive key from passphrase
 * 2. Use high work factors (N=2^17, r=8, p=1)
 * 3. Derive 32-byte master key
 * 4. Store salt securely
 *
 * Hint: Master key should never be stored on disk
 * Hint: Consider using HSM for production
 *
 * @param {string} passphrase - Master passphrase
 * @param {Buffer} [salt] - Optional salt
 * @returns {Object} { masterKey, salt, params }
 */
function deriveMasterKey(passphrase, salt = null) {
  // Your code here
  // Example structure:
  // const N = 131072; // 2^17
  // const r = 8;
  // const p = 1;
  //
  // if (!salt) {
  //   salt = crypto.randomBytes(32);
  // }
  //
  // const masterKey = crypto.scryptSync(passphrase, salt, 32, { N, r, p });
  //
  // return {
  //   masterKey,
  //   salt,
  //   params: { N, r, p }
  // };
}

/**
 * TODO 2: Generate data encryption key (DEK)
 *
 * DEKs are used to encrypt actual data.
 * Each DEK is encrypted with the master key.
 *
 * Steps:
 * 1. Generate random 32-byte DEK
 * 2. Generate random IV
 * 3. Encrypt DEK with master key using AES-256-GCM
 * 4. Return both plaintext and encrypted DEK
 *
 * Hint: Plaintext DEK is used immediately, then discarded
 * Hint: Only encrypted DEK is stored
 *
 * @param {Buffer} masterKey - Master encryption key
 * @returns {Object} { dek, encryptedDek, iv, authTag }
 */
function generateDataKey(masterKey) {
  // Your code here
  // const dek = crypto.randomBytes(32);
  // const iv = crypto.randomBytes(16);
  //
  // const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  // const encryptedDek = Buffer.concat([
  //   cipher.update(dek),
  //   cipher.final()
  // ]);
  // const authTag = cipher.getAuthTag();
  //
  // return {
  //   dek,
  //   encryptedDek,
  //   iv,
  //   authTag
  // };
}

/**
 * TODO 3: Decrypt data encryption key
 *
 * Recovers DEK from encrypted form using master key.
 *
 * @param {Buffer} encryptedDek - Encrypted DEK
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @param {Buffer} masterKey - Master key
 * @returns {Buffer} Decrypted DEK
 */
function decryptDataKey(encryptedDek, iv, authTag, masterKey) {
  // Your code here
  // const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  // decipher.setAuthTag(authTag);
  //
  // return Buffer.concat([
  //   decipher.update(encryptedDek),
  //   decipher.final()
  // ]);
}

// Test Task 1
try {
  const passphrase = 'SuperSecureMasterPassphrase!2024';

  const { masterKey, salt } = deriveMasterKey(passphrase);
  console.log('Master key derived:', masterKey ? masterKey.toString('hex').substring(0, 32) + '...' : 'Missing');

  const { dek, encryptedDek, iv, authTag } = generateDataKey(masterKey);
  console.log('DEK generated:', dek ? dek.toString('hex').substring(0, 32) + '...' : 'Missing');

  const decryptedDek = decryptDataKey(encryptedDek, iv, authTag, masterKey);
  console.log('DEK decrypted:', decryptedDek && dek.equals(decryptedDek) ? 'Success' : 'Failed');

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Build Key Storage System
console.log('Task 2: Secure key storage');

/**
 * TODO 4: Implement encrypted key metadata
 *
 * Stores key metadata with encryption and integrity protection.
 *
 * Metadata includes:
 * - Key ID, name, description
 * - Key type (symmetric, asymmetric)
 * - Algorithm
 * - Creation/expiration dates
 * - Rotation schedule
 * - Access policies
 */
class KeyMetadata {
  constructor(keyId, name, type, algorithm, options = {}) {
    this.keyId = keyId;
    this.name = name;
    this.type = type; // 'symmetric', 'asymmetric'
    this.algorithm = algorithm; // 'AES-256-GCM', 'RSA-2048', etc.
    this.createdAt = Date.now();
    this.expiresAt = options.expiresAt || null;
    this.rotationPeriodDays = options.rotationPeriodDays || 90;
    this.lastRotated = null;
    this.version = 1;
    this.enabled = true;
    this.tags = options.tags || {};
  }

  /**
   * TODO 5: Serialize metadata for encryption
   */
  serialize() {
    // Your code here
    // return JSON.stringify({
    //   keyId: this.keyId,
    //   name: this.name,
    //   type: this.type,
    //   algorithm: this.algorithm,
    //   createdAt: this.createdAt,
    //   expiresAt: this.expiresAt,
    //   rotationPeriodDays: this.rotationPeriodDays,
    //   lastRotated: this.lastRotated,
    //   version: this.version,
    //   enabled: this.enabled,
    //   tags: this.tags
    // });
  }

  /**
   * TODO 6: Deserialize metadata
   */
  static deserialize(data) {
    // Your code here
    // const parsed = JSON.parse(data);
    // const metadata = new KeyMetadata(
    //   parsed.keyId,
    //   parsed.name,
    //   parsed.type,
    //   parsed.algorithm
    // );
    // Object.assign(metadata, parsed);
    // return metadata;
  }

  /**
   * Check if key needs rotation
   */
  needsRotation() {
    if (!this.rotationPeriodDays) return false;
    const lastRotation = this.lastRotated || this.createdAt;
    const daysSince = (Date.now() - lastRotation) / (1000 * 60 * 60 * 24);
    return daysSince >= this.rotationPeriodDays;
  }

  /**
   * Check if key is expired
   */
  isExpired() {
    return this.expiresAt && Date.now() > this.expiresAt;
  }
}

/**
 * TODO 7: Implement secure key storage
 *
 * Stores encrypted keys with metadata and versioning.
 */
class KeyStorage {
  constructor(masterKey, storageDir = '/tmp/key-vault') {
    this.masterKey = masterKey;
    this.storageDir = storageDir;

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  /**
   * TODO 8: Store encrypted key
   *
   * Steps:
   * 1. Encrypt key material with DEK
   * 2. Encrypt DEK with master key
   * 3. Encrypt metadata
   * 4. Compute HMAC of everything
   * 5. Save to disk
   *
   * @param {KeyMetadata} metadata - Key metadata
   * @param {Buffer} keyMaterial - Actual key material
   */
  storeKey(metadata, keyMaterial) {
    // Your code here
    // // Generate DEK for this key
    // const { dek, encryptedDek, iv: dekIv, authTag: dekAuthTag } = generateDataKey(this.masterKey);
    //
    // // Encrypt key material
    // const keyIv = crypto.randomBytes(16);
    // const keyCipher = crypto.createCipheriv('aes-256-gcm', dek, keyIv);
    // const encryptedKey = Buffer.concat([
    //   keyCipher.update(keyMaterial),
    //   keyCipher.final()
    // ]);
    // const keyAuthTag = keyCipher.getAuthTag();
    //
    // // Encrypt metadata
    // const metaIv = crypto.randomBytes(16);
    // const metaCipher = crypto.createCipheriv('aes-256-gcm', dek, metaIv);
    // const metadataStr = metadata.serialize();
    // const encryptedMeta = Buffer.concat([
    //   metaCipher.update(metadataStr, 'utf8'),
    //   metaCipher.final()
    // ]);
    // const metaAuthTag = metaCipher.getAuthTag();
    //
    // // Create storage package
    // const package = {
    //   version: 1,
    //   keyId: metadata.keyId,
    //   encryptedDek,
    //   dekIv,
    //   dekAuthTag,
    //   keyIv,
    //   encryptedKey,
    //   keyAuthTag,
    //   metaIv,
    //   encryptedMeta,
    //   metaAuthTag,
    //   storedAt: Date.now()
    // };
    //
    // // Save to disk
    // const keyPath = path.join(this.storageDir, `${metadata.keyId}.json`);
    // fs.writeFileSync(keyPath, JSON.stringify(package, null, 2));
  }

  /**
   * TODO 9: Retrieve and decrypt key
   *
   * @param {string} keyId - Key ID
   * @returns {Object} { metadata, keyMaterial }
   */
  retrieveKey(keyId) {
    // Your code here
  }

  /**
   * TODO 10: List all keys (metadata only)
   */
  listKeys() {
    // Your code here
  }

  /**
   * TODO 11: Delete key securely
   */
  deleteKey(keyId) {
    // Your code here
  }
}

// Test Task 2
try {
  const passphrase = 'MasterPassphrase!2024';
  const { masterKey } = deriveMasterKey(passphrase);

  const storage = new KeyStorage(masterKey);

  const metadata = new KeyMetadata(
    'key-001',
    'database-encryption-key',
    'symmetric',
    'AES-256-GCM',
    { rotationPeriodDays: 30, tags: { environment: 'production' } }
  );

  const keyMaterial = crypto.randomBytes(32);
  storage.storeKey(metadata, keyMaterial);

  console.log('Key stored successfully');

  const retrieved = storage.retrieveKey('key-001');
  console.log('Key retrieved:', retrieved ? 'Success' : 'Failed');

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Implement Automated Key Rotation
console.log('Task 3: Automated key rotation');

/**
 * TODO 12: Build key rotation manager
 *
 * Automatically rotates keys based on schedule.
 *
 * Requirements:
 * - Check rotation schedule
 * - Generate new key version
 * - Maintain old versions for decryption
 * - Update metadata
 * - Log rotation events
 */
class KeyRotationManager {
  constructor(keyStorage) {
    this.keyStorage = keyStorage;
    this.rotationLog = [];
  }

  /**
   * TODO 13: Rotate key
   *
   * Steps:
   * 1. Retrieve current key
   * 2. Generate new key material
   * 3. Increment version
   * 4. Store new version
   * 5. Keep old version(s) for grace period
   * 6. Log rotation
   *
   * @param {string} keyId - Key to rotate
   * @returns {Object} Rotation result
   */
  rotateKey(keyId) {
    // Your code here
    // const current = this.keyStorage.retrieveKey(keyId);
    // if (!current) {
    //   throw new Error('Key not found');
    // }
    //
    // // Generate new key material
    // const newKeyMaterial = crypto.randomBytes(32);
    //
    // // Update metadata
    // current.metadata.version++;
    // current.metadata.lastRotated = Date.now();
    //
    // // Store new version
    // this.keyStorage.storeKey(current.metadata, newKeyMaterial);
    //
    // // Log rotation
    // this.rotationLog.push({
    //   keyId,
    //   timestamp: Date.now(),
    //   oldVersion: current.metadata.version - 1,
    //   newVersion: current.metadata.version
    // });
    //
    // return {
    //   keyId,
    //   newVersion: current.metadata.version
    // };
  }

  /**
   * TODO 14: Check and rotate expired keys
   *
   * Scans all keys and rotates those that need it
   */
  rotateExpiredKeys() {
    // Your code here
    // const keys = this.keyStorage.listKeys();
    // const rotated = [];
    //
    // for (const key of keys) {
    //   if (key.needsRotation()) {
    //     this.rotateKey(key.keyId);
    //     rotated.push(key.keyId);
    //   }
    // }
    //
    // return rotated;
  }

  /**
   * Get rotation history
   */
  getRotationHistory(keyId = null) {
    if (keyId) {
      return this.rotationLog.filter(entry => entry.keyId === keyId);
    }
    return this.rotationLog;
  }
}

// Test Task 3
try {
  console.log('Key rotation: Implementation needed');
  console.log('Would automatically rotate keys based on schedule');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Implement Role-Based Access Control
console.log('Task 4: Access control and permissions');

/**
 * TODO 15: Build RBAC system
 *
 * Controls who can access which keys and perform what operations.
 *
 * Operations: create, read, update, delete, rotate, encrypt, decrypt
 */
class AccessControlManager {
  constructor() {
    this.roles = new Map();
    this.userRoles = new Map();
    this.policies = new Map();
  }

  /**
   * TODO 16: Define role with permissions
   *
   * @param {string} roleName - Role name
   * @param {Array<string>} permissions - List of permissions
   */
  defineRole(roleName, permissions) {
    // Your code here
    // this.roles.set(roleName, {
    //   name: roleName,
    //   permissions: new Set(permissions),
    //   createdAt: Date.now()
    // });
  }

  /**
   * TODO 17: Assign role to user
   *
   * @param {string} userId - User ID
   * @param {string} roleName - Role name
   */
  assignRole(userId, roleName) {
    // Your code here
    // if (!this.roles.has(roleName)) {
    //   throw new Error('Role not found');
    // }
    //
    // if (!this.userRoles.has(userId)) {
    //   this.userRoles.set(userId, new Set());
    // }
    //
    // this.userRoles.get(userId).add(roleName);
  }

  /**
   * TODO 18: Create key-specific policy
   *
   * @param {string} keyId - Key ID
   * @param {Object} policy - Access policy
   */
  createPolicy(keyId, policy) {
    // Your code here
    // this.policies.set(keyId, {
    //   keyId,
    //   allowedRoles: policy.allowedRoles || [],
    //   allowedUsers: policy.allowedUsers || [],
    //   allowedOperations: policy.allowedOperations || [],
    //   deniedUsers: policy.deniedUsers || [],
    //   conditions: policy.conditions || {},
    //   createdAt: Date.now()
    // });
  }

  /**
   * TODO 19: Check if user has permission
   *
   * Steps:
   * 1. Check if user is explicitly denied
   * 2. Check if user is explicitly allowed
   * 3. Check user's roles
   * 4. Check key-specific policy
   * 5. Evaluate conditions (time, IP, etc.)
   *
   * @param {string} userId - User ID
   * @param {string} keyId - Key ID
   * @param {string} operation - Operation to perform
   * @param {Object} context - Request context
   * @returns {Object} { allowed, reason }
   */
  checkPermission(userId, keyId, operation, context = {}) {
    // Your code here
    // const policy = this.policies.get(keyId);
    //
    // if (!policy) {
    //   return { allowed: false, reason: 'No policy defined for key' };
    // }
    //
    // // Check denied list
    // if (policy.deniedUsers.includes(userId)) {
    //   return { allowed: false, reason: 'User explicitly denied' };
    // }
    //
    // // Check allowed users
    // if (policy.allowedUsers.includes(userId)) {
    //   if (policy.allowedOperations.includes(operation)) {
    //     return { allowed: true };
    //   }
    // }
    //
    // // Check user roles
    // const userRoles = this.userRoles.get(userId) || new Set();
    // for (const roleName of userRoles) {
    //   if (policy.allowedRoles.includes(roleName)) {
    //     const role = this.roles.get(roleName);
    //     if (role && role.permissions.has(operation)) {
    //       return { allowed: true };
    //     }
    //   }
    // }
    //
    // return { allowed: false, reason: 'Insufficient permissions' };
  }

  /**
   * TODO 20: Revoke user access to key
   */
  revokeAccess(userId, keyId) {
    // Your code here
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId) {
    const userRoles = this.userRoles.get(userId) || new Set();
    const permissions = new Set();

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (role) {
        for (const perm of role.permissions) {
          permissions.add(perm);
        }
      }
    }

    return Array.from(permissions);
  }
}

// Test Task 4
try {
  const acl = new AccessControlManager();

  // Define roles
  acl.defineRole('admin', ['create', 'read', 'update', 'delete', 'rotate', 'encrypt', 'decrypt']);
  acl.defineRole('developer', ['read', 'encrypt', 'decrypt']);
  acl.defineRole('auditor', ['read']);

  // Assign roles
  acl.assignRole('user-alice', 'admin');
  acl.assignRole('user-bob', 'developer');

  // Create policy
  acl.createPolicy('key-001', {
    allowedRoles: ['admin', 'developer'],
    allowedOperations: ['read', 'encrypt', 'decrypt']
  });

  // Check permissions
  const check1 = acl.checkPermission('user-alice', 'key-001', 'delete');
  console.log('Admin can delete:', check1?.allowed || false);

  const check2 = acl.checkPermission('user-bob', 'key-001', 'delete');
  console.log('Developer cannot delete:', !check2?.allowed || false);

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Build Complete Key Vault System
console.log('Task 5: Complete key vault integration');

/**
 * TODO 21: Integrate all components into production-ready vault
 *
 * This is the capstone that brings everything together.
 */
class SecureKeyVault {
  constructor(masterPassphrase, config = {}) {
    const { masterKey, salt } = deriveMasterKey(masterPassphrase);
    this.masterKey = masterKey;
    this.salt = salt;

    this.storage = new KeyStorage(masterKey, config.storageDir);
    this.rotationManager = new KeyRotationManager(this.storage);
    this.accessControl = new AccessControlManager();
    this.auditLog = [];

    // Initialize default roles
    this._initializeDefaultRoles();
  }

  /**
   * Initialize default roles
   */
  _initializeDefaultRoles() {
    this.accessControl.defineRole('vault-admin', [
      'create', 'read', 'update', 'delete', 'rotate', 'encrypt', 'decrypt', 'admin'
    ]);
    this.accessControl.defineRole('key-admin', [
      'create', 'read', 'update', 'rotate', 'encrypt', 'decrypt'
    ]);
    this.accessControl.defineRole('encryption-user', [
      'read', 'encrypt', 'decrypt'
    ]);
    this.accessControl.defineRole('auditor', ['read']);
  }

  /**
   * TODO 22: Create new encryption key
   *
   * @param {string} userId - User creating the key
   * @param {string} name - Key name
   * @param {Object} options - Key options
   * @returns {string} Key ID
   */
  createKey(userId, name, options = {}) {
    // Your code here
    // // Check permission
    // const canCreate = this.getUserPermissions(userId).includes('create');
    // if (!canCreate) {
    //   throw new Error('Permission denied');
    // }
    //
    // // Generate key ID
    // const keyId = 'key-' + crypto.randomBytes(16).toString('hex');
    //
    // // Create metadata
    // const metadata = new KeyMetadata(
    //   keyId,
    //   name,
    //   options.type || 'symmetric',
    //   options.algorithm || 'AES-256-GCM',
    //   options
    // );
    //
    // // Generate key material
    // const keyMaterial = crypto.randomBytes(32);
    //
    // // Store key
    // this.storage.storeKey(metadata, keyMaterial);
    //
    // // Create default policy
    // this.accessControl.createPolicy(keyId, {
    //   allowedUsers: [userId],
    //   allowedOperations: ['read', 'encrypt', 'decrypt', 'update', 'delete', 'rotate']
    // });
    //
    // // Audit log
    // this.logAudit(userId, 'create-key', keyId, { success: true });
    //
    // return keyId;
  }

  /**
   * TODO 23: Encrypt data with key
   *
   * @param {string} userId - User performing encryption
   * @param {string} keyId - Key to use
   * @param {Buffer|string} data - Data to encrypt
   * @returns {Object} Encrypted package
   */
  encrypt(userId, keyId, data) {
    // Your code here
    // // Check permission
    // const check = this.accessControl.checkPermission(userId, keyId, 'encrypt');
    // if (!check.allowed) {
    //   this.logAudit(userId, 'encrypt', keyId, { success: false, reason: check.reason });
    //   throw new Error(`Permission denied: ${check.reason}`);
    // }
    //
    // // Retrieve key
    // const { keyMaterial, metadata } = this.storage.retrieveKey(keyId);
    //
    // // Check if key is enabled and not expired
    // if (!metadata.enabled) {
    //   throw new Error('Key is disabled');
    // }
    // if (metadata.isExpired()) {
    //   throw new Error('Key is expired');
    // }
    //
    // // Encrypt data
    // const iv = crypto.randomBytes(16);
    // const cipher = crypto.createCipheriv('aes-256-gcm', keyMaterial, iv);
    //
    // const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    // const encrypted = Buffer.concat([
    //   cipher.update(dataBuffer),
    //   cipher.final()
    // ]);
    // const authTag = cipher.getAuthTag();
    //
    // // Audit log
    // this.logAudit(userId, 'encrypt', keyId, { success: true, dataSize: dataBuffer.length });
    //
    // return {
    //   keyId,
    //   version: metadata.version,
    //   iv,
    //   data: encrypted,
    //   authTag
    // };
  }

  /**
   * TODO 24: Decrypt data
   *
   * @param {string} userId - User performing decryption
   * @param {Object} encryptedPackage - Encrypted package
   * @returns {Buffer} Decrypted data
   */
  decrypt(userId, encryptedPackage) {
    // Your code here
  }

  /**
   * TODO 25: Rotate key
   */
  rotateKey(userId, keyId) {
    // Your code here
  }

  /**
   * TODO 26: Grant access to key
   */
  grantAccess(userId, keyId, targetUserId, operations) {
    // Your code here
  }

  /**
   * TODO 27: Revoke access to key
   */
  revokeAccess(userId, keyId, targetUserId) {
    // Your code here
  }

  /**
   * Audit logging
   */
  logAudit(userId, operation, keyId, details) {
    const entry = {
      timestamp: Date.now(),
      userId,
      operation,
      keyId,
      details,
      ip: details.ip || 'unknown'
    };

    this.auditLog.push(entry);

    // Limit log size
    if (this.auditLog.length > 10000) {
      this.auditLog.shift();
    }
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters = {}) {
    let logs = this.auditLog;

    if (filters.userId) {
      logs = logs.filter(e => e.userId === filters.userId);
    }
    if (filters.keyId) {
      logs = logs.filter(e => e.keyId === filters.keyId);
    }
    if (filters.operation) {
      logs = logs.filter(e => e.operation === filters.operation);
    }

    return logs;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId) {
    return this.accessControl.getUserPermissions(userId);
  }

  /**
   * Get vault statistics
   */
  getStats() {
    return {
      totalKeys: this.storage.listKeys()?.length || 0,
      totalAuditEntries: this.auditLog.length,
      rotationHistory: this.rotationManager.getRotationHistory().length
    };
  }
}

// Test Task 5
try {
  const vault = new SecureKeyVault('UltraSecureMasterPassphrase!2024');

  // Assign admin role
  vault.accessControl.assignRole('admin-user', 'vault-admin');

  // Create key
  const keyId = vault.createKey('admin-user', 'production-database-key', {
    rotationPeriodDays: 30,
    tags: { environment: 'production', service: 'database' }
  });

  console.log('Key created:', keyId ? keyId.substring(0, 16) + '...' : 'Failed');

  // Encrypt data
  const plaintext = 'Sensitive customer data';
  const encrypted = vault.encrypt('admin-user', keyId, plaintext);
  console.log('Data encrypted:', encrypted ? 'Success' : 'Failed');

  // Decrypt data
  const decrypted = vault.decrypt('admin-user', encrypted);
  console.log('Data decrypted:', decrypted?.toString() || 'Failed');
  console.log('Match:', decrypted && decrypted.toString() === plaintext);

  // Get stats
  const stats = vault.getStats();
  console.log('Vault stats:', stats);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenges
console.log('=== Bonus Challenges ===\n');

console.log('Bonus 1: Implement Key Versioning');
console.log('- Maintain multiple key versions');
console.log('- Allow decryption with old versions');
console.log('- Automatic version cleanup\n');

console.log('Bonus 2: Add Hardware Security Module (HSM) Support');
console.log('- Interface with PKCS#11');
console.log('- Use HSM for master key');
console.log('- Hardware-based key generation\n');

console.log('Bonus 3: Implement Key Import/Export');
console.log('- Export keys with wrapping');
console.log('- Import external keys');
console.log('- Support key backup/restore\n');

console.log('Bonus 4: Add Multi-Region Replication');
console.log('- Replicate keys across regions');
console.log('- Handle eventual consistency');
console.log('- Implement conflict resolution\n');

console.log('Bonus 5: Implement Threshold Cryptography');
console.log('- Split master key using Shamir Secret Sharing');
console.log('- Require M of N key holders to unseal vault');
console.log('- Support distributed key ceremonies\n');

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Security:
 *    - Use HSM for master key
 *    - Implement key sharding
 *    - Support multiple authentication factors
 *    - Implement auto-unseal mechanisms
 *    - Add tamper detection
 *
 * 2. Availability:
 *    - High availability deployment
 *    - Automatic failover
 *    - Backup and disaster recovery
 *    - Health checks and monitoring
 *
 * 3. Performance:
 *    - Cache decrypted keys (with TTL)
 *    - Batch operations
 *    - Async encryption/decryption
 *    - Connection pooling
 *
 * 4. Compliance:
 *    - Complete audit trail
 *    - Compliance reporting
 *    - Key escrow (if required)
 *    - Data residency controls
 *    - Certified cryptography (FIPS 140-2)
 *
 * 5. Operations:
 *    - Monitoring and alerting
 *    - Key usage metrics
 *    - Automated rotation
 *    - Capacity planning
 *    - Incident response procedures
 *
 * 6. Integration:
 *    - RESTful API
 *    - SDK for multiple languages
 *    - CLI tools
 *    - Integration with CI/CD
 *    - Plugin architecture
 */

console.log('\n=== Exercise 5 Complete ===');
console.log('This capstone integrates all cryptography concepts');
console.log('Similar to HashiCorp Vault, AWS KMS, Azure Key Vault');
console.log('\nCongratulations on completing the Crypto module!');
console.log('You now understand production-grade cryptography.\n');
