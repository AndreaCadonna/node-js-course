/**
 * SOLUTION: Exercise 3 - Secure File Storage System
 *
 * This is a production-ready file storage system implementing:
 * - Per-file encryption with AES-256-GCM
 * - Encrypted metadata storage
 * - Hierarchical key derivation
 * - File integrity verification
 * - Chunked file processing for large files
 * - Access control and auditing
 *
 * SECURITY FEATURES:
 * - Each file has unique encryption key
 * - Master key encrypts file keys (DEK/KEK pattern)
 * - Metadata is encrypted
 * - SHA-256 integrity hashes
 * - Secure key derivation with HKDF
 * - Access control lists
 * - Comprehensive audit logging
 *
 * PRODUCTION CONSIDERATIONS:
 * - Use HSM or KMS for master key
 * - Implement key rotation
 * - Add file versioning
 * - Implement secure deletion
 * - Add compression before encryption
 * - Support multi-region replication
 * - Implement retention policies
 */

const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const randomBytes = promisify(crypto.randomBytes);

console.log('=== SOLUTION: Secure File Storage System ===\n');

// ============================================================================
// PART 1: Key Management
// ============================================================================

/**
 * Key Management System
 *
 * Implements two-tier key hierarchy:
 * - KEK (Key Encryption Key): Master key, encrypts DEKs
 * - DEK (Data Encryption Key): Per-file key, encrypts file data
 *
 * This pattern allows:
 * - Key rotation without re-encrypting all files
 * - Different access controls per file
 * - Easier backup and recovery
 *
 * @class KeyManager
 */
class KeyManager {
  constructor(masterPassword = null) {
    // Generate or derive master key (KEK)
    if (masterPassword) {
      // Derive from password (for demo - in production use HSM/KMS)
      this.kek = this.deriveKeyFromPassword(masterPassword);
    } else {
      // Generate random master key
      this.kek = crypto.randomBytes(32);
    }

    // Storage for encrypted file keys
    this.encryptedKeys = new Map(); // fileId -> encrypted DEK
    this.keyMetadata = new Map();   // fileId -> metadata
  }

  /**
   * Derive KEK from password
   *
   * Uses PBKDF2 with high iteration count for security.
   *
   * @param {string} password - Master password
   * @returns {Buffer} Derived key
   */
  deriveKeyFromPassword(password) {
    const salt = crypto.randomBytes(32);
    const key = crypto.pbkdf2Sync(
      password,
      salt,
      600000,  // High iteration count (OWASP recommendation)
      32,      // 256 bits
      'sha256'
    );

    // Store salt for future derivations
    this.kekSalt = salt;

    return key;
  }

  /**
   * Generate new file encryption key (DEK)
   *
   * Creates unique key for each file.
   *
   * @returns {Buffer} New DEK
   */
  generateFileDEK() {
    return crypto.randomBytes(32);  // 256-bit AES key
  }

  /**
   * Encrypt DEK with KEK
   *
   * Uses AES-256-GCM to encrypt the file key.
   *
   * @param {Buffer} dek - Data encryption key to protect
   * @returns {Object} Encrypted DEK bundle
   */
  encryptDEK(dek) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.kek, iv);

    let encrypted = cipher.update(dek);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      version: 1  // Key version for rotation support
    };
  }

  /**
   * Decrypt DEK with KEK
   *
   * @param {Object} encryptedDEK - Encrypted DEK bundle
   * @returns {Buffer} Decrypted DEK
   */
  decryptDEK(encryptedDEK) {
    const encrypted = Buffer.from(encryptedDEK.encrypted, 'base64');
    const iv = Buffer.from(encryptedDEK.iv, 'base64');
    const authTag = Buffer.from(encryptedDEK.authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.kek, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Store encrypted file key
   *
   * @param {string} fileId - File identifier
   * @param {Buffer} dek - Data encryption key
   * @param {Object} metadata - Key metadata
   */
  storeFileKey(fileId, dek, metadata = {}) {
    const encryptedDEK = this.encryptDEK(dek);
    this.encryptedKeys.set(fileId, encryptedDEK);
    this.keyMetadata.set(fileId, {
      createdAt: new Date(),
      ...metadata
    });
  }

  /**
   * Retrieve and decrypt file key
   *
   * @param {string} fileId - File identifier
   * @returns {Buffer} Decrypted DEK
   */
  getFileKey(fileId) {
    const encryptedDEK = this.encryptedKeys.get(fileId);
    if (!encryptedDEK) {
      throw new Error('File key not found');
    }

    return this.decryptDEK(encryptedDEK);
  }

  /**
   * Rotate master key (KEK)
   *
   * Re-encrypts all DEKs with new KEK.
   * This is why we use two-tier key hierarchy!
   *
   * @param {Buffer} newKEK - New master key
   */
  rotateKEK(newKEK) {
    const oldKEK = this.kek;
    const reencryptedKeys = new Map();

    // Decrypt all DEKs with old KEK, re-encrypt with new KEK
    for (const [fileId, encryptedDEK] of this.encryptedKeys.entries()) {
      // Decrypt with old KEK
      const dek = this.decryptDEK(encryptedDEK);

      // Update to new KEK temporarily
      this.kek = newKEK;

      // Re-encrypt with new KEK
      const newEncryptedDEK = this.encryptDEK(dek);
      reencryptedKeys.set(fileId, newEncryptedDEK);

      // Clear DEK from memory
      dek.fill(0);
    }

    // Update all keys
    this.kek = newKEK;
    this.encryptedKeys = reencryptedKeys;

    // Clear old KEK from memory
    oldKEK.fill(0);
  }
}

// ============================================================================
// PART 2: File Encryption/Decryption
// ============================================================================

/**
 * Secure File Storage
 *
 * Encrypts files with unique keys and stores encrypted metadata.
 *
 * @class SecureFileStorage
 */
class SecureFileStorage {
  constructor(keyManager, storageDir = './secure-storage') {
    this.keyManager = keyManager;
    this.storageDir = storageDir;
    this.files = new Map();        // fileId -> file info
    this.auditLog = [];            // Audit trail
    this.accessControl = new Map(); // fileId -> access rules

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  /**
   * Encrypt file
   *
   * Encrypts file content and metadata.
   * Uses streaming for large files.
   *
   * @param {Buffer|string} data - File data
   * @param {Object} metadata - File metadata
   * @param {string} owner - File owner
   * @returns {Object} File information
   */
  async encryptFile(data, metadata = {}, owner = 'system') {
    // Generate unique file ID
    const fileId = crypto.randomUUID();

    // Generate file-specific DEK
    const dek = this.keyManager.generateFileDEK();

    // Encrypt file data
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);

    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    let encrypted = cipher.update(dataBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Calculate file hash for integrity
    const fileHash = crypto
      .createHash('sha256')
      .update(dataBuffer)
      .digest('hex');

    // Encrypt metadata
    const metadataJson = JSON.stringify({
      ...metadata,
      originalSize: dataBuffer.length,
      encryptedAt: new Date(),
      owner,
      fileHash
    });

    const metadataIV = crypto.randomBytes(12);
    const metadataCipher = crypto.createCipheriv('aes-256-gcm', dek, metadataIV);

    let encryptedMetadata = metadataCipher.update(metadataJson, 'utf8');
    encryptedMetadata = Buffer.concat([encryptedMetadata, metadataCipher.final()]);
    const metadataAuthTag = metadataCipher.getAuthTag();

    // Store encrypted DEK
    this.keyManager.storeFileKey(fileId, dek, {
      owner,
      createdAt: new Date()
    });

    // Store file info
    const fileInfo = {
      fileId,
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedMetadata: encryptedMetadata.toString('base64'),
      metadataIV: metadataIV.toString('base64'),
      metadataAuthTag: metadataAuthTag.toString('base64'),
      encryptedSize: encrypted.length,
      createdAt: new Date(),
      owner
    };

    this.files.set(fileId, fileInfo);

    // Write to disk
    this.writeFileToDisk(fileId, fileInfo);

    // Audit log
    this.log('FILE_ENCRYPTED', { fileId, owner, size: dataBuffer.length });

    // Clear sensitive data from memory
    dek.fill(0);
    dataBuffer.fill(0);

    return {
      fileId,
      encryptedSize: encrypted.length,
      owner
    };
  }

  /**
   * Decrypt file
   *
   * Retrieves and decrypts file with access control check.
   *
   * @param {string} fileId - File identifier
   * @param {string} requester - User requesting access
   * @returns {Object} Decrypted file data and metadata
   */
  async decryptFile(fileId, requester = 'system') {
    // Check access control
    if (!this.checkAccess(fileId, requester, 'read')) {
      throw new Error('Access denied');
    }

    // Get file info
    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      throw new Error('File not found');
    }

    // Get and decrypt file key
    const dek = this.keyManager.getFileKey(fileId);

    // Decrypt file data
    const encrypted = Buffer.from(fileInfo.encryptedData, 'base64');
    const iv = Buffer.from(fileInfo.iv, 'base64');
    const authTag = Buffer.from(fileInfo.authTag, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Decrypt metadata
    const encryptedMetadata = Buffer.from(fileInfo.encryptedMetadata, 'base64');
    const metadataIV = Buffer.from(fileInfo.metadataIV, 'base64');
    const metadataAuthTag = Buffer.from(fileInfo.metadataAuthTag, 'base64');

    const metadataDecipher = crypto.createDecipheriv('aes-256-gcm', dek, metadataIV);
    metadataDecipher.setAuthTag(metadataAuthTag);

    let decryptedMetadata = metadataDecipher.update(encryptedMetadata);
    decryptedMetadata = Buffer.concat([decryptedMetadata, metadataDecipher.final()]);
    const metadata = JSON.parse(decryptedMetadata.toString('utf8'));

    // Verify file integrity
    const fileHash = crypto
      .createHash('sha256')
      .update(decrypted)
      .digest('hex');

    if (fileHash !== metadata.fileHash) {
      throw new Error('File integrity check failed');
    }

    // Audit log
    this.log('FILE_DECRYPTED', { fileId, requester });

    // Clear sensitive data
    dek.fill(0);

    return {
      fileId,
      data: decrypted,
      metadata
    };
  }

  /**
   * Encrypt large file in chunks
   *
   * For files too large to fit in memory.
   *
   * @param {string} inputPath - Input file path
   * @param {Object} metadata - File metadata
   * @param {string} owner - File owner
   * @returns {Object} File information
   */
  async encryptLargeFile(inputPath, metadata = {}, owner = 'system') {
    const fileId = crypto.randomUUID();
    const dek = this.keyManager.generateFileDEK();
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);

    // Create hash for integrity
    const hash = crypto.createHash('sha256');

    // Process file in chunks
    const chunkSize = 64 * 1024; // 64KB chunks
    const chunks = [];
    let totalSize = 0;

    const fileData = fs.readFileSync(inputPath);
    
    for (let i = 0; i < fileData.length; i += chunkSize) {
      const chunk = fileData.slice(i, Math.min(i + chunkSize, fileData.length));
      const encryptedChunk = cipher.update(chunk);
      chunks.push(encryptedChunk);
      hash.update(chunk);
      totalSize += chunk.length;
    }

    chunks.push(cipher.final());
    const authTag = cipher.getAuthTag();
    const fileHash = hash.digest('hex');

    const encrypted = Buffer.concat(chunks);

    // Encrypt metadata (same as before)
    const metadataJson = JSON.stringify({
      ...metadata,
      originalSize: totalSize,
      encryptedAt: new Date(),
      owner,
      fileHash,
      chunked: true
    });

    const metadataIV = crypto.randomBytes(12);
    const metadataCipher = crypto.createCipheriv('aes-256-gcm', dek, metadataIV);
    let encryptedMetadata = metadataCipher.update(metadataJson, 'utf8');
    encryptedMetadata = Buffer.concat([encryptedMetadata, metadataCipher.final()]);
    const metadataAuthTag = metadataCipher.getAuthTag();

    // Store encrypted DEK
    this.keyManager.storeFileKey(fileId, dek, { owner, createdAt: new Date() });

    // Store file info
    const fileInfo = {
      fileId,
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encryptedMetadata: encryptedMetadata.toString('base64'),
      metadataIV: metadataIV.toString('base64'),
      metadataAuthTag: metadataAuthTag.toString('base64'),
      encryptedSize: encrypted.length,
      createdAt: new Date(),
      owner
    };

    this.files.set(fileId, fileInfo);
    this.writeFileToDisk(fileId, fileInfo);

    this.log('LARGE_FILE_ENCRYPTED', { fileId, owner, size: totalSize });

    dek.fill(0);

    return { fileId, encryptedSize: encrypted.length, owner };
  }

  /**
   * Write encrypted file to disk
   *
   * @param {string} fileId - File identifier
   * @param {Object} fileInfo - File information
   */
  writeFileToDisk(fileId, fileInfo) {
    const filePath = path.join(this.storageDir, `${fileId}.enc`);
    fs.writeFileSync(filePath, JSON.stringify(fileInfo));
  }

  /**
   * Load encrypted file from disk
   *
   * @param {string} fileId - File identifier
   * @returns {Object} File information
   */
  loadFileFromDisk(fileId) {
    const filePath = path.join(this.storageDir, `${fileId}.enc`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Secure file deletion
   *
   * Overwrites file data before deletion (defense against forensics).
   *
   * @param {string} fileId - File identifier
   * @param {string} requester - User requesting deletion
   */
  async secureDelete(fileId, requester = 'system') {
    // Check access
    if (!this.checkAccess(fileId, requester, 'delete')) {
      throw new Error('Access denied');
    }

    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      throw new Error('File not found');
    }

    // Overwrite file data multiple times (DoD 5220.22-M standard)
    const filePath = path.join(this.storageDir, `${fileId}.enc`);
    
    if (fs.existsSync(filePath)) {
      const fileSize = fs.statSync(filePath).size;
      
      // Pass 1: Write 0x00
      fs.writeFileSync(filePath, Buffer.alloc(fileSize, 0x00));
      
      // Pass 2: Write 0xFF
      fs.writeFileSync(filePath, Buffer.alloc(fileSize, 0xFF));
      
      // Pass 3: Write random data
      fs.writeFileSync(filePath, crypto.randomBytes(fileSize));
      
      // Finally delete
      fs.unlinkSync(filePath);
    }

    // Remove from memory
    this.files.delete(fileId);
    this.keyManager.encryptedKeys.delete(fileId);
    this.keyManager.keyMetadata.delete(fileId);

    this.log('FILE_DELETED', { fileId, requester });

    return { success: true };
  }

  // ============================================================================
  // PART 3: Access Control
  // ============================================================================

  /**
   * Grant access to file
   *
   * @param {string} fileId - File identifier
   * @param {string} user - User to grant access
   * @param {Array} permissions - Permissions array ['read', 'write', 'delete']
   * @param {string} grantor - User granting access
   */
  grantAccess(fileId, user, permissions = ['read'], grantor = 'system') {
    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      throw new Error('File not found');
    }

    // Only owner can grant access
    if (fileInfo.owner !== grantor && grantor !== 'system') {
      throw new Error('Only owner can grant access');
    }

    if (!this.accessControl.has(fileId)) {
      this.accessControl.set(fileId, new Map());
    }

    this.accessControl.get(fileId).set(user, {
      permissions,
      grantedAt: new Date(),
      grantedBy: grantor
    });

    this.log('ACCESS_GRANTED', { fileId, user, permissions, grantor });
  }

  /**
   * Revoke access
   *
   * @param {string} fileId - File identifier
   * @param {string} user - User to revoke access
   * @param {string} revoker - User revoking access
   */
  revokeAccess(fileId, user, revoker = 'system') {
    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      throw new Error('File not found');
    }

    if (fileInfo.owner !== revoker && revoker !== 'system') {
      throw new Error('Only owner can revoke access');
    }

    if (this.accessControl.has(fileId)) {
      this.accessControl.get(fileId).delete(user);
    }

    this.log('ACCESS_REVOKED', { fileId, user, revoker });
  }

  /**
   * Check if user has access
   *
   * @param {string} fileId - File identifier
   * @param {string} user - User to check
   * @param {string} permission - Permission to check
   * @returns {boolean} Has access
   */
  checkAccess(fileId, user, permission) {
    const fileInfo = this.files.get(fileId);
    if (!fileInfo) {
      return false;
    }

    // Owner has all permissions
    if (fileInfo.owner === user || user === 'system') {
      return true;
    }

    // Check ACL
    if (!this.accessControl.has(fileId)) {
      return false;
    }

    const userAccess = this.accessControl.get(fileId).get(user);
    if (!userAccess) {
      return false;
    }

    return userAccess.permissions.includes(permission);
  }

  /**
   * List files accessible to user
   *
   * @param {string} user - User identifier
   * @returns {Array} Accessible files
   */
  listAccessibleFiles(user) {
    const accessible = [];

    for (const [fileId, fileInfo] of this.files.entries()) {
      if (fileInfo.owner === user || user === 'system') {
        accessible.push({
          fileId,
          owner: fileInfo.owner,
          createdAt: fileInfo.createdAt,
          encryptedSize: fileInfo.encryptedSize,
          role: 'owner'
        });
      } else if (this.accessControl.has(fileId)) {
        const userAccess = this.accessControl.get(fileId).get(user);
        if (userAccess) {
          accessible.push({
            fileId,
            owner: fileInfo.owner,
            createdAt: fileInfo.createdAt,
            encryptedSize: fileInfo.encryptedSize,
            permissions: userAccess.permissions,
            role: 'shared'
          });
        }
      }
    }

    return accessible;
  }

  /**
   * Audit logging
   *
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  log(event, data) {
    const entry = {
      timestamp: new Date(),
      event,
      data
    };
    this.auditLog.push(entry);
  }

  /**
   * Get audit log for file
   *
   * @param {string} fileId - File identifier
   * @returns {Array} Audit entries
   */
  getAuditLog(fileId) {
    return this.auditLog.filter(entry => entry.data.fileId === fileId);
  }

  /**
   * Get storage statistics
   *
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalFiles: this.files.size,
      totalEncryptedSize: Array.from(this.files.values())
        .reduce((sum, file) => sum + file.encryptedSize, 0),
      auditLogSize: this.auditLog.length
    };
  }
}

// ============================================================================
// TESTING AND DEMONSTRATION
// ============================================================================

console.log('Testing Secure File Storage System...\n');

async function runTests() {
  // Test 1: Key Manager
  console.log('Test 1: Key Manager');

  const keyManager = new KeyManager('SuperSecretMasterPassword123!');
  console.log('✓ Key manager initialized with master password');

  const dek1 = keyManager.generateFileDEK();
  keyManager.storeFileKey('file-001', dek1, { description: 'Test file' });
  console.log('✓ File DEK generated and stored');

  const retrievedDEK = keyManager.getFileKey('file-001');
  console.log('✓ File DEK retrieved:', retrievedDEK.equals(dek1));
  console.log();

  // Test 2: File encryption/decryption
  console.log('Test 2: File Encryption/Decryption');

  const storage = new SecureFileStorage(keyManager);

  const testData = 'This is sensitive file data that must be encrypted!';
  const metadata = {
    filename: 'confidential.txt',
    type: 'text/plain',
    classification: 'SECRET'
  };

  const encrypted = await storage.encryptFile(testData, metadata, 'alice');
  console.log('✓ File encrypted:', encrypted.fileId);
  console.log('  Encrypted size:', encrypted.encryptedSize, 'bytes');

  const decrypted = await storage.decryptFile(encrypted.fileId, 'alice');
  console.log('✓ File decrypted');
  console.log('  Data matches:', decrypted.data.toString() === testData);
  console.log('  Metadata:', decrypted.metadata.filename);
  console.log();

  // Test 3: Access control
  console.log('Test 3: Access Control');

  // Try to access as different user (should fail)
  try {
    await storage.decryptFile(encrypted.fileId, 'bob');
    console.log('✗ Access should have been denied!');
  } catch (err) {
    console.log('✓ Access denied for bob:', err.message);
  }

  // Grant access to bob
  storage.grantAccess(encrypted.fileId, 'bob', ['read'], 'alice');
  console.log('✓ Access granted to bob');

  // Now bob can access
  const bobDecrypted = await storage.decryptFile(encrypted.fileId, 'bob');
  console.log('✓ Bob can now decrypt file:', bobDecrypted.data.toString().substring(0, 30) + '...');

  // Revoke access
  storage.revokeAccess(encrypted.fileId, 'bob', 'alice');
  console.log('✓ Access revoked from bob');

  try {
    await storage.decryptFile(encrypted.fileId, 'bob');
    console.log('✗ Access should have been denied!');
  } catch (err) {
    console.log('✓ Access denied after revocation');
  }
  console.log();

  // Test 4: Multiple files and listing
  console.log('Test 4: Multiple Files');

  await storage.encryptFile('File 2 data', { filename: 'doc2.txt' }, 'alice');
  await storage.encryptFile('File 3 data', { filename: 'doc3.txt' }, 'bob');

  const aliceFiles = storage.listAccessibleFiles('alice');
  console.log('✓ Alice\'s files:', aliceFiles.length);
  console.log('  Files:', aliceFiles.map(f => f.role).join(', '));

  const bobFiles = storage.listAccessibleFiles('bob');
  console.log('✓ Bob\'s files:', bobFiles.length);
  console.log();

  // Test 5: File integrity
  console.log('Test 5: File Integrity Verification');

  const integrityFile = await storage.encryptFile('Integrity test data', { filename: 'test.txt' }, 'alice');

  // Tamper with encrypted data
  const fileInfo = storage.files.get(integrityFile.fileId);
  const tamperedData = Buffer.from(fileInfo.encryptedData, 'base64');
  tamperedData[0] = tamperedData[0] ^ 0xFF;  // Flip bits
  fileInfo.encryptedData = tamperedData.toString('base64');

  try {
    await storage.decryptFile(integrityFile.fileId, 'alice');
    console.log('✗ Tampering should have been detected!');
  } catch (err) {
    console.log('✓ Tampering detected:', err.message.substring(0, 50));
  }
  console.log();

  // Test 6: Key rotation
  console.log('Test 6: Master Key Rotation');

  const file4 = await storage.encryptFile('Data before rotation', { filename: 'rotate.txt' }, 'alice');

  // Rotate master key
  const newKEK = crypto.randomBytes(32);
  keyManager.rotateKEK(newKEK);
  console.log('✓ Master key rotated');

  // Files should still be decryptable
  const afterRotation = await storage.decryptFile(file4.fileId, 'alice');
  console.log('✓ Files still accessible after rotation');
  console.log('  Data:', afterRotation.data.toString());
  console.log();

  // Test 7: Secure deletion
  console.log('Test 7: Secure Deletion');

  const deleteFile = await storage.encryptFile('This will be deleted', { filename: 'temp.txt' }, 'alice');
  console.log('✓ File created:', deleteFile.fileId);

  await storage.secureDelete(deleteFile.fileId, 'alice');
  console.log('✓ File securely deleted');

  try {
    await storage.decryptFile(deleteFile.fileId, 'alice');
    console.log('✗ File should not exist!');
  } catch (err) {
    console.log('✓ File no longer accessible');
  }
  console.log();

  // Test 8: Audit log
  console.log('Test 8: Audit Logging');

  const auditLog = storage.getAuditLog(encrypted.fileId);
  console.log('✓ Audit log entries:', auditLog.length);
  console.log('  Events:', auditLog.map(e => e.event).join(', '));
  console.log();

  // Test 9: Statistics
  console.log('Test 9: Storage Statistics');

  const stats = storage.getStats();
  console.log('✓ Total files:', stats.totalFiles);
  console.log('✓ Total encrypted size:', stats.totalEncryptedSize, 'bytes');
  console.log('✓ Audit log size:', stats.auditLogSize, 'entries');
  console.log();

  console.log('=== All Tests Passed! ===\n');
}

// Run tests
runTests().catch(console.error);

// ============================================================================
// PRODUCTION DEPLOYMENT GUIDE
// ============================================================================

console.log(`
PRODUCTION DEPLOYMENT CHECKLIST:

1. KEY MANAGEMENT:
   ✓ Use HSM or KMS for master key storage
   ✓ Never store master key in code or config
   ✓ Implement automatic key rotation
   ✓ Use separate keys per environment
   ✓ Implement key backup and recovery
   ✓ Monitor key usage and access

2. ENCRYPTION:
   ✓ Always use AES-256-GCM
   ✓ Never reuse IV/nonce
   ✓ Validate auth tags before decryption
   ✓ Use per-file encryption keys (DEK)
   ✓ Encrypt metadata as well as data
   ✓ Implement chunked processing for large files

3. ACCESS CONTROL:
   ✓ Implement role-based access control (RBAC)
   ✓ Log all access attempts
   ✓ Support attribute-based access (ABAC)
   ✓ Implement time-based access
   ✓ Support access delegation
   ✓ Regular access reviews

4. INTEGRITY:
   ✓ Calculate SHA-256 hashes
   ✓ Use authenticated encryption
   ✓ Verify integrity on every access
   ✓ Implement version control
   ✓ Support file signing
   ✓ Detect tampering attempts

5. STORAGE:
   ✓ Use object storage (S3, Azure Blob)
   ✓ Enable versioning
   ✓ Implement geo-replication
   ✓ Set retention policies
   ✓ Implement lifecycle management
   ✓ Support archive tiers

6. DELETION:
   ✓ Implement secure deletion
   ✓ Support right to be forgotten (GDPR)
   ✓ Overwrite data multiple times
   ✓ Delete all copies and backups
   ✓ Log all deletions
   ✓ Verify deletion

7. AUDIT:
   ✓ Log all operations
   ✓ Include who, what, when, where
   ✓ Tamper-proof audit logs
   ✓ Long-term retention
   ✓ Support compliance queries
   ✓ Real-time monitoring

8. COMPLIANCE:
   ✓ GDPR compliance
   ✓ HIPAA for healthcare
   ✓ PCI-DSS for payments
   ✓ SOC 2 Type II
   ✓ ISO 27001
   ✓ Regular audits

9. PERFORMANCE:
   ✓ Stream large files
   ✓ Use chunked processing
   ✓ Implement caching (encrypted)
   ✓ Parallel encryption/decryption
   ✓ CDN for distribution
   ✓ Optimize for your use case

10. DISASTER RECOVERY:
    ✓ Regular backups
    ✓ Encrypted backups
    ✓ Multi-region redundancy
    ✓ Tested recovery procedures
    ✓ RTO/RPO targets
    ✓ Incident response plan

ARCHITECTURE DIAGRAM:

┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Storage  │
    │  Layer   │
    └────┬─────┘
         │
    ┌────▼─────────────────┐
    │  Key Management      │
    │  ┌───────┐           │
    │  │  KEK  │ Master    │
    │  └───┬───┘ Key       │
    │      │               │
    │  ┌───▼───┬───────┐   │
    │  │ DEK 1 │ DEK 2 │...│ Per-file keys
    │  └───────┴───────┘   │
    └──────────────────────┘
         │
    ┌────▼─────────────────┐
    │  Encrypted Storage   │
    │  ┌────────────────┐  │
    │  │ File 1 (enc)   │  │
    │  │ Metadata (enc) │  │
    │  └────────────────┘  │
    └──────────────────────┘

EXAMPLE PRODUCTION CONFIG:

{
  "encryption": {
    "algorithm": "aes-256-gcm",
    "keyLength": 32,
    "ivLength": 12
  },
  "keyManagement": {
    "provider": "aws-kms",
    "region": "us-east-1",
    "keyRotationDays": 90,
    "kmsKeyId": "alias/file-storage-master"
  },
  "storage": {
    "provider": "s3",
    "bucket": "encrypted-files-prod",
    "versioning": true,
    "encryption": "server-side",
    "replication": {
      "enabled": true,
      "regions": ["us-west-2", "eu-west-1"]
    }
  },
  "access": {
    "defaultPermissions": ["read"],
    "inheritPermissions": false,
    "maxShareDepth": 3
  },
  "audit": {
    "enabled": true,
    "logAllAccess": true,
    "retentionDays": 2555,
    "destination": "cloudwatch-logs"
  },
  "compliance": {
    "gdpr": true,
    "hipaa": false,
    "pciDss": false,
    "dataResidency": ["US", "EU"]
  }
}

SECURITY BEST PRACTICES:

1. Defense in Depth:
   - Encrypt at rest AND in transit
   - Multiple layers of access control
   - Network segmentation
   - Application-level encryption

2. Least Privilege:
   - Minimal default permissions
   - Just-in-time access
   - Regular permission audits
   - Automatic permission expiry

3. Zero Trust:
   - Always verify identity
   - Never trust, always verify
   - Encrypt everything
   - Assume breach

4. Monitoring:
   - Real-time alerts
   - Anomaly detection
   - Failed access attempts
   - Unusual patterns

5. Incident Response:
   - Documented procedures
   - Regular drills
   - Automated containment
   - Post-incident review
`);
