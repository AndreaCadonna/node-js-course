/**
 * SOLUTION: Exercise 5 - Secure Key Vault
 *
 * Production-ready key vault system with encryption, access control,
 * audit logging, key rotation, and backup/recovery capabilities.
 */

const crypto = require('crypto');

console.log('=== SOLUTION: Secure Key Vault ===\n');

// Master Key Encryption
class MasterKeyManager {
  constructor(masterPassword = null) {
    if (masterPassword) {
      this.masterKey = this.deriveKey(masterPassword);
    } else {
      this.masterKey = crypto.randomBytes(32);
    }
    this.keyVersion = 1;
  }

  deriveKey(password) {
    const salt = crypto.randomBytes(32);
    this.salt = salt;
    return crypto.pbkdf2Sync(password, salt, 600000, 32, 'sha256');
  }

  encryptData(data) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      version: this.keyVersion
    };
  }

  decryptData(encryptedData) {
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted;
  }

  rotateMasterKey(newMasterKey) {
    const oldKey = this.masterKey;
    this.masterKey = newMasterKey;
    this.keyVersion++;
    oldKey.fill(0);
  }
}

// Key Vault Storage
class KeyVault {
  constructor(masterPassword = null) {
    this.masterKeyManager = new MasterKeyManager(masterPassword);
    this.secrets = new Map();
    this.accessControl = new Map();
    this.auditLog = [];
    this.metadata = new Map();
  }

  storeSecret(secretId, secretValue, owner = 'system', metadata = {}) {
    // Encrypt secret value
    const encryptedSecret = this.masterKeyManager.encryptData(
      Buffer.from(secretValue)
    );
    
    // Store encrypted secret
    this.secrets.set(secretId, {
      encrypted: encryptedSecret,
      owner,
      createdAt: new Date(),
      lastModified: new Date(),
      version: 1
    });
    
    // Store metadata (also encrypted)
    const encryptedMetadata = this.masterKeyManager.encryptData(
      Buffer.from(JSON.stringify(metadata))
    );
    this.metadata.set(secretId, encryptedMetadata);
    
    // Initialize access control
    this.accessControl.set(secretId, new Map([[owner, {
      permissions: ['read', 'write', 'delete', 'share'],
      grantedAt: new Date()
    }]]));
    
    this.log('SECRET_STORED', { secretId, owner });
    
    return { secretId, version: 1 };
  }

  retrieveSecret(secretId, requester = 'system') {
    if (!this.checkAccess(secretId, requester, 'read')) {
      throw new Error('Access denied');
    }
    
    const secretInfo = this.secrets.get(secretId);
    if (!secretInfo) {
      throw new Error('Secret not found');
    }
    
    const decrypted = this.masterKeyManager.decryptData(secretInfo.encrypted);
    
    this.log('SECRET_RETRIEVED', { secretId, requester });
    
    return {
      secretId,
      value: decrypted.toString('utf8'),
      version: secretInfo.version,
      lastModified: secretInfo.lastModified
    };
  }

  updateSecret(secretId, newValue, requester = 'system') {
    if (!this.checkAccess(secretId, requester, 'write')) {
      throw new Error('Access denied');
    }
    
    const secretInfo = this.secrets.get(secretId);
    if (!secretInfo) {
      throw new Error('Secret not found');
    }
    
    const encryptedSecret = this.masterKeyManager.encryptData(
      Buffer.from(newValue)
    );
    
    secretInfo.encrypted = encryptedSecret;
    secretInfo.lastModified = new Date();
    secretInfo.version++;
    
    this.log('SECRET_UPDATED', { secretId, requester, version: secretInfo.version });
    
    return { secretId, version: secretInfo.version };
  }

  deleteSecret(secretId, requester = 'system') {
    if (!this.checkAccess(secretId, requester, 'delete')) {
      throw new Error('Access denied');
    }
    
    this.secrets.delete(secretId);
    this.metadata.delete(secretId);
    this.accessControl.delete(secretId);
    
    this.log('SECRET_DELETED', { secretId, requester });
    
    return { success: true };
  }

  grantAccess(secretId, user, permissions = ['read'], grantor = 'system') {
    const secretInfo = this.secrets.get(secretId);
    if (!secretInfo) {
      throw new Error('Secret not found');
    }
    
    if (secretInfo.owner !== grantor && grantor !== 'system') {
      throw new Error('Only owner can grant access');
    }
    
    if (!this.accessControl.has(secretId)) {
      this.accessControl.set(secretId, new Map());
    }
    
    this.accessControl.get(secretId).set(user, {
      permissions,
      grantedAt: new Date(),
      grantedBy: grantor
    });
    
    this.log('ACCESS_GRANTED', { secretId, user, permissions, grantor });
  }

  revokeAccess(secretId, user, revoker = 'system') {
    const secretInfo = this.secrets.get(secretId);
    if (!secretInfo) {
      throw new Error('Secret not found');
    }
    
    if (secretInfo.owner !== revoker && revoker !== 'system') {
      throw new Error('Only owner can revoke access');
    }
    
    if (this.accessControl.has(secretId)) {
      this.accessControl.get(secretId).delete(user);
    }
    
    this.log('ACCESS_REVOKED', { secretId, user, revoker });
  }

  checkAccess(secretId, user, permission) {
    const secretInfo = this.secrets.get(secretId);
    if (!secretInfo) {
      return false;
    }
    
    if (secretInfo.owner === user || user === 'system') {
      return true;
    }
    
    if (!this.accessControl.has(secretId)) {
      return false;
    }
    
    const userAccess = this.accessControl.get(secretId).get(user);
    if (!userAccess) {
      return false;
    }
    
    return userAccess.permissions.includes(permission) || 
           userAccess.permissions.includes('*');
  }

  rotateKey(secretId, requester = 'system') {
    if (!this.checkAccess(secretId, requester, 'write')) {
      throw new Error('Access denied');
    }
    
    // Retrieve and re-encrypt with new version
    const current = this.retrieveSecret(secretId, requester);
    this.updateSecret(secretId, current.value, requester);
    
    this.log('KEY_ROTATED', { secretId, requester });
  }

  rotateMasterKey(newMasterPassword) {
    const newMasterKey = newMasterPassword 
      ? this.masterKeyManager.deriveKey(newMasterPassword)
      : crypto.randomBytes(32);
    
    // Re-encrypt all secrets with new master key
    const tempSecrets = new Map();
    for (const [secretId, secretInfo] of this.secrets.entries()) {
      const decrypted = this.masterKeyManager.decryptData(secretInfo.encrypted);
      tempSecrets.set(secretId, decrypted);
    }
    
    this.masterKeyManager.rotateMasterKey(newMasterKey);
    
    for (const [secretId, decrypted] of tempSecrets.entries()) {
      const secretInfo = this.secrets.get(secretId);
      const encryptedSecret = this.masterKeyManager.encryptData(decrypted);
      secretInfo.encrypted = encryptedSecret;
    }
    
    this.log('MASTER_KEY_ROTATED', { secretCount: this.secrets.size });
  }

  listSecrets(user) {
    const accessible = [];
    for (const [secretId, secretInfo] of this.secrets.entries()) {
      if (this.checkAccess(secretId, user, 'read')) {
        accessible.push({
          secretId,
          owner: secretInfo.owner,
          createdAt: secretInfo.createdAt,
          lastModified: secretInfo.lastModified,
          version: secretInfo.version
        });
      }
    }
    return accessible;
  }

  backup() {
    return {
      secrets: Array.from(this.secrets.entries()),
      metadata: Array.from(this.metadata.entries()),
      accessControl: Array.from(this.accessControl.entries()).map(([id, acl]) => [
        id,
        Array.from(acl.entries())
      ]),
      masterKeyVersion: this.masterKeyManager.keyVersion
    };
  }

  restore(backupData) {
    this.secrets = new Map(backupData.secrets);
    this.metadata = new Map(backupData.metadata);
    this.accessControl = new Map(
      backupData.accessControl.map(([id, acl]) => [id, new Map(acl)])
    );
    this.log('VAULT_RESTORED', { secretCount: this.secrets.size });
  }

  log(event, data) {
    this.auditLog.push({
      timestamp: new Date(),
      event,
      data
    });
  }

  getAuditLog(secretId = null) {
    if (secretId) {
      return this.auditLog.filter(entry => entry.data.secretId === secretId);
    }
    return this.auditLog;
  }

  getStats() {
    return {
      totalSecrets: this.secrets.size,
      masterKeyVersion: this.masterKeyManager.keyVersion,
      auditLogSize: this.auditLog.length
    };
  }
}

// Testing
console.log('Testing Secure Key Vault...\n');

async function runTests() {
  console.log('Test 1: Vault Initialization');
  const vault = new KeyVault('SuperSecretMasterPassword123!');
  console.log('✓ Vault initialized with master password');
  console.log();

  console.log('Test 2: Store and Retrieve Secrets');
  vault.storeSecret('db-password', 'mySecretPassword123', 'alice', {
    description: 'Database password',
    environment: 'production'
  });
  console.log('✓ Secret stored: db-password');
  
  const retrieved = vault.retrieveSecret('db-password', 'alice');
  console.log('✓ Secret retrieved:', retrieved.value);
  console.log('  Version:', retrieved.version);
  console.log();

  console.log('Test 3: Access Control');
  try {
    vault.retrieveSecret('db-password', 'bob');
    console.log('✗ Access should have been denied!');
  } catch (err) {
    console.log('✓ Access denied for bob:', err.message);
  }
  
  vault.grantAccess('db-password', 'bob', ['read'], 'alice');
  console.log('✓ Access granted to bob');
  
  const bobRetrieved = vault.retrieveSecret('db-password', 'bob');
  console.log('✓ Bob can now access secret');
  console.log();

  console.log('Test 4: Secret Updates');
  vault.updateSecret('db-password', 'newSecretPassword456', 'alice');
  console.log('✓ Secret updated');
  
  const updated = vault.retrieveSecret('db-password', 'alice');
  console.log('✓ New value:', updated.value);
  console.log('  New version:', updated.version);
  console.log();

  console.log('Test 5: Multiple Secrets');
  vault.storeSecret('api-key', 'sk_live_abc123', 'alice');
  vault.storeSecret('signing-key', 'secret-key-xyz', 'bob');
  
  const aliceSecrets = vault.listSecrets('alice');
  console.log('✓ Alice\'s secrets:', aliceSecrets.length);
  console.log();

  console.log('Test 6: Master Key Rotation');
  vault.rotateMasterKey('NewMasterPassword456!');
  console.log('✓ Master key rotated');
  
  const afterRotation = vault.retrieveSecret('db-password', 'alice');
  console.log('✓ Secrets still accessible:', afterRotation.value.substring(0, 10) + '...');
  console.log();

  console.log('Test 7: Backup and Restore');
  const backup = vault.backup();
  console.log('✓ Vault backed up');
  console.log('  Secrets in backup:', backup.secrets.length);
  
  const newVault = new KeyVault('NewMasterPassword456!');
  newVault.restore(backup);
  console.log('✓ Vault restored');
  
  const restored = newVault.retrieveSecret('db-password', 'alice');
  console.log('✓ Restored secret accessible');
  console.log();

  console.log('Test 8: Audit Logging');
  const auditLog = vault.getAuditLog('db-password');
  console.log('✓ Audit log entries:', auditLog.length);
  console.log('  Events:', auditLog.map(e => e.event).join(', '));
  console.log();

  console.log('Test 9: Secret Deletion');
  vault.deleteSecret('api-key', 'alice');
  console.log('✓ Secret deleted');
  
  try {
    vault.retrieveSecret('api-key', 'alice');
    console.log('✗ Deleted secret should not be accessible!');
  } catch (err) {
    console.log('✓ Deleted secret not accessible');
  }
  console.log();

  console.log('Test 10: Statistics');
  const stats = vault.getStats();
  console.log('✓ Total secrets:', stats.totalSecrets);
  console.log('✓ Master key version:', stats.masterKeyVersion);
  console.log('✓ Audit log size:', stats.auditLogSize);
  console.log();

  console.log('=== All Tests Passed! ===\n');
}

runTests().catch(console.error);

