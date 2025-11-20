/**
 * Exercise 3: Secure File Storage System
 *
 * OBJECTIVE:
 * Build a production-ready secure file storage system with encryption,
 * key derivation from passwords, integrity verification, and metadata protection.
 *
 * REQUIREMENTS:
 * 1. Implement secure key derivation from passwords
 * 2. Create file encryption/decryption with metadata
 * 3. Implement file integrity verification
 * 4. Handle multiple file formats
 * 5. Support key rotation and file re-encryption
 *
 * LEARNING GOALS:
 * - Password-based key derivation (PBKDF2, scrypt, argon2)
 * - File encryption best practices
 * - Integrity verification with HMAC
 * - Metadata protection
 * - Key management and rotation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('=== Exercise 3: Secure File Storage System ===\n');

// Task 1: Implement Secure Key Derivation
console.log('Task 1: Password-based key derivation');

/**
 * TODO 1: Derive encryption key from password using PBKDF2
 *
 * PBKDF2 makes brute-force attacks expensive by iterating
 * the hash function many times.
 *
 * Steps:
 * 1. Generate random 32-byte salt (or use provided)
 * 2. Use crypto.pbkdf2Sync with SHA-512
 * 3. Use at least 100,000 iterations (more is better)
 * 4. Derive 64 bytes (32 for encryption, 32 for HMAC)
 * 5. Return key and salt
 *
 * Hint: Higher iteration count = more secure but slower
 * Hint: Salt prevents rainbow table attacks
 *
 * @param {string} password - User password
 * @param {Buffer} [salt] - Optional salt (generates new if not provided)
 * @param {number} iterations - Number of iterations (default: 100000)
 * @returns {Object} { encryptionKey, hmacKey, salt, iterations }
 */
function deriveKeyFromPassword(password, salt = null, iterations = 100000) {
  // Your code here
  // Example structure:
  // if (!salt) {
  //   salt = crypto.randomBytes(32);
  // }
  //
  // const derivedKey = crypto.pbkdf2Sync(
  //   password,
  //   salt,
  //   iterations,
  //   64,
  //   'sha512'
  // );
  //
  // return {
  //   encryptionKey: derivedKey.slice(0, 32),
  //   hmacKey: derivedKey.slice(32, 64),
  //   salt,
  //   iterations
  // };
}

/**
 * TODO 2: Derive key using scrypt (stronger alternative to PBKDF2)
 *
 * Scrypt is memory-hard, making it more resistant to
 * hardware-based attacks.
 *
 * Steps:
 * 1. Generate random 32-byte salt
 * 2. Use crypto.scryptSync
 * 3. Set N (CPU/memory cost) to 2^14 or higher
 * 4. Set r (block size) to 8
 * 5. Set p (parallelization) to 1
 * 6. Derive 64 bytes
 *
 * Hint: Scrypt is better than PBKDF2 for password-based encryption
 * Hint: Higher N = more memory and CPU required
 *
 * @param {string} password - User password
 * @param {Buffer} [salt] - Optional salt
 * @returns {Object} { encryptionKey, hmacKey, salt, params }
 */
function deriveKeyWithScrypt(password, salt = null) {
  // Your code here
  // const N = 16384; // 2^14
  // const r = 8;
  // const p = 1;
  //
  // if (!salt) {
  //   salt = crypto.randomBytes(32);
  // }
  //
  // const derivedKey = crypto.scryptSync(password, salt, 64, { N, r, p });
  //
  // return {
  //   encryptionKey: derivedKey.slice(0, 32),
  //   hmacKey: derivedKey.slice(32, 64),
  //   salt,
  //   params: { N, r, p }
  // };
}

// Test Task 1
try {
  const password = 'MySecurePassword123!';

  const derived1 = deriveKeyFromPassword(password);
  console.log('PBKDF2 key:', derived1.encryptionKey ? derived1.encryptionKey.toString('hex').substring(0, 32) + '...' : 'Missing');

  const derived2 = deriveKeyWithScrypt(password);
  console.log('Scrypt key:', derived2.encryptionKey ? derived2.encryptionKey.toString('hex').substring(0, 32) + '...' : 'Missing');

  // Verify same password produces same key with same salt
  const derived3 = deriveKeyFromPassword(password, derived1.salt, derived1.iterations);
  console.log('Keys match:', derived1.encryptionKey && derived3.encryptionKey && derived1.encryptionKey.equals(derived3.encryptionKey));

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Encrypt Files with Metadata
console.log('Task 2: File encryption with metadata');

/**
 * TODO 3: Encrypt file with metadata
 *
 * Encrypts file content and metadata, ensuring both are protected.
 *
 * Steps:
 * 1. Generate random 16-byte IV
 * 2. Create metadata object (filename, size, type, timestamp)
 * 3. Encrypt file content with AES-256-GCM
 * 4. Encrypt metadata separately with same key but different IV
 * 5. Compute HMAC of entire encrypted package
 * 6. Return encrypted package
 *
 * Hint: Metadata can leak information, so encrypt it too
 * Hint: HMAC prevents tampering with encrypted data
 *
 * @param {Buffer} fileData - File content
 * @param {Object} metadata - File metadata
 * @param {Buffer} encryptionKey - Encryption key (32 bytes)
 * @param {Buffer} hmacKey - HMAC key (32 bytes)
 * @returns {Object} Encrypted package
 */
function encryptFile(fileData, metadata, encryptionKey, hmacKey) {
  // Your code here
  // Example structure:
  // const contentIv = crypto.randomBytes(16);
  // const metadataIv = crypto.randomBytes(16);
  //
  // // Encrypt file content
  // const contentCipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, contentIv);
  // const encryptedContent = Buffer.concat([
  //   contentCipher.update(fileData),
  //   contentCipher.final()
  // ]);
  // const contentAuthTag = contentCipher.getAuthTag();
  //
  // // Encrypt metadata
  // const metadataCipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, metadataIv);
  // const metadataJson = JSON.stringify(metadata);
  // const encryptedMetadata = Buffer.concat([
  //   metadataCipher.update(metadataJson, 'utf8'),
  //   metadataCipher.final()
  // ]);
  // const metadataAuthTag = metadataCipher.getAuthTag();
  //
  // // Create package
  // const package = {
  //   version: 1,
  //   contentIv,
  //   encryptedContent,
  //   contentAuthTag,
  //   metadataIv,
  //   encryptedMetadata,
  //   metadataAuthTag
  // };
  //
  // // Compute HMAC of entire package
  // const hmac = crypto.createHmac('sha256', hmacKey);
  // hmac.update(JSON.stringify(package));
  // package.hmac = hmac.digest();
  //
  // return package;
}

/**
 * TODO 4: Decrypt file and verify integrity
 *
 * Decrypts file, verifies HMAC and auth tags.
 *
 * Steps:
 * 1. Verify HMAC first
 * 2. Decrypt metadata
 * 3. Verify metadata auth tag
 * 4. Decrypt content
 * 5. Verify content auth tag
 * 6. Return decrypted file and metadata
 *
 * Hint: Always verify before decrypting (fail fast)
 * Hint: Throw error if any verification fails
 *
 * @param {Object} encryptedPackage - Encrypted package
 * @param {Buffer} encryptionKey - Encryption key
 * @param {Buffer} hmacKey - HMAC key
 * @returns {Object} { fileData, metadata }
 */
function decryptFile(encryptedPackage, encryptionKey, hmacKey) {
  // Your code here
}

// Test Task 2
try {
  const password = 'SecurePassword123!';
  const { encryptionKey, hmacKey } = deriveKeyFromPassword(password);

  const fileData = Buffer.from('This is my secret document content!');
  const metadata = {
    filename: 'secret.txt',
    size: fileData.length,
    type: 'text/plain',
    timestamp: Date.now()
  };

  const encrypted = encryptFile(fileData, metadata, encryptionKey, hmacKey);
  console.log('Encrypted package created:', encrypted ? 'Yes' : 'No');

  const decrypted = decryptFile(encrypted, encryptionKey, hmacKey);
  console.log('Original:', fileData.toString());
  console.log('Decrypted:', decrypted?.fileData?.toString() || 'Missing');
  console.log('Metadata match:', JSON.stringify(metadata) === JSON.stringify(decrypted?.metadata));

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Implement File Storage Manager
console.log('Task 3: File storage manager');

/**
 * TODO 5: Build secure file storage manager
 *
 * Manages encrypted file storage with master password.
 *
 * Requirements:
 * - Initialize with master password
 * - Store files encrypted
 * - Retrieve and decrypt files
 * - List files (show metadata only)
 * - Delete files securely
 * - Change master password (re-encrypt all files)
 */
class SecureFileStorage {
  constructor(masterPassword, storageDir = '/tmp/secure-storage') {
    this.storageDir = storageDir;

    // Derive master keys
    const derived = deriveKeyWithScrypt(masterPassword);
    this.encryptionKey = derived.encryptionKey;
    this.hmacKey = derived.hmacKey;
    this.salt = derived.salt;
    this.params = derived.params;

    // In-memory index (in production: persist encrypted)
    this.fileIndex = new Map();

    // Create storage directory if needed
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  /**
   * TODO 6: Store file securely
   *
   * Steps:
   * 1. Generate unique file ID
   * 2. Create metadata object
   * 3. Encrypt file with metadata
   * 4. Save encrypted package to disk
   * 5. Update file index
   * 6. Return file ID
   *
   * @param {string} filename - Original filename
   * @param {Buffer} fileData - File content
   * @returns {string} File ID
   */
  storeFile(filename, fileData) {
    // Your code here
    // const fileId = crypto.randomBytes(16).toString('hex');
    //
    // const metadata = {
    //   filename,
    //   originalSize: fileData.length,
    //   mimeType: this._getMimeType(filename),
    //   uploadedAt: Date.now(),
    //   checksum: crypto.createHash('sha256').update(fileData).digest('hex')
    // };
    //
    // const encrypted = encryptFile(fileData, metadata, this.encryptionKey, this.hmacKey);
    //
    // const filePath = path.join(this.storageDir, fileId);
    // fs.writeFileSync(filePath, JSON.stringify(encrypted));
    //
    // this.fileIndex.set(fileId, {
    //   filename,
    //   size: fileData.length,
    //   uploadedAt: metadata.uploadedAt
    // });
    //
    // return fileId;
  }

  /**
   * TODO 7: Retrieve and decrypt file
   *
   * Steps:
   * 1. Read encrypted package from disk
   * 2. Parse JSON
   * 3. Decrypt file
   * 4. Verify checksum
   * 5. Return file data and metadata
   *
   * @param {string} fileId - File ID
   * @returns {Object} { fileData, metadata }
   */
  retrieveFile(fileId) {
    // Your code here
  }

  /**
   * TODO 8: List all files (metadata only)
   *
   * Returns list of files without decrypting content
   *
   * @returns {Array} Array of file info
   */
  listFiles() {
    // Your code here
    // return Array.from(this.fileIndex.entries()).map(([id, info]) => ({
    //   id,
    //   ...info
    // }));
  }

  /**
   * TODO 9: Delete file securely
   *
   * Steps:
   * 1. Read file
   * 2. Overwrite with random data (secure deletion)
   * 3. Delete file
   * 4. Remove from index
   *
   * @param {string} fileId - File ID
   */
  deleteFile(fileId) {
    // Your code here
    // const filePath = path.join(this.storageDir, fileId);
    //
    // if (fs.existsSync(filePath)) {
    //   // Secure deletion: overwrite before deleting
    //   const stats = fs.statSync(filePath);
    //   const randomData = crypto.randomBytes(stats.size);
    //   fs.writeFileSync(filePath, randomData);
    //   fs.unlinkSync(filePath);
    // }
    //
    // this.fileIndex.delete(fileId);
  }

  /**
   * TODO 10: Change master password (re-encrypt all files)
   *
   * Steps:
   * 1. Derive new keys from new password
   * 2. For each file:
   *    a. Decrypt with old keys
   *    b. Encrypt with new keys
   *    c. Save back to disk
   * 3. Update master keys
   *
   * Hint: This is expensive but necessary for key rotation
   *
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   */
  changeMasterPassword(oldPassword, newPassword) {
    // Your code here
  }

  /**
   * Helper: Get MIME type from filename
   */
  _getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

// Test Task 3
try {
  const storage = new SecureFileStorage('MyMasterPassword123!');

  // Store files
  const fileId1 = storage.storeFile('document.txt', Buffer.from('Secret document content'));
  console.log('File 1 stored:', fileId1 ? fileId1.substring(0, 16) + '...' : 'Failed');

  const fileId2 = storage.storeFile('data.json', Buffer.from(JSON.stringify({ secret: 'data' })));
  console.log('File 2 stored:', fileId2 ? fileId2.substring(0, 16) + '...' : 'Failed');

  // List files
  const files = storage.listFiles();
  console.log('Files in storage:', files?.length || 0);

  // Retrieve file
  const retrieved = storage.retrieveFile(fileId1);
  console.log('Retrieved:', retrieved?.fileData?.toString() || 'Failed');

  // Delete file
  storage.deleteFile(fileId2);
  console.log('File deleted');

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Implement File Chunking for Large Files
console.log('Task 4: Large file handling with chunking');

/**
 * TODO 11: Encrypt large file in chunks
 *
 * For large files, encrypting in chunks prevents memory issues
 * and allows streaming.
 *
 * Steps:
 * 1. Split file into chunks (e.g., 64KB each)
 * 2. Generate master IV for file
 * 3. For each chunk:
 *    a. Derive chunk IV from master IV + chunk index
 *    b. Encrypt chunk
 *    c. Compute chunk HMAC
 * 4. Store chunks with metadata
 *
 * Hint: Use streaming to handle files larger than RAM
 * Hint: Include chunk index in IV to ensure uniqueness
 *
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output encrypted file
 * @param {Buffer} encryptionKey - Encryption key
 * @param {Buffer} hmacKey - HMAC key
 * @param {number} chunkSize - Chunk size in bytes
 */
function encryptFileInChunks(inputPath, outputPath, encryptionKey, hmacKey, chunkSize = 65536) {
  // Your code here
  // Example structure:
  // const masterIv = crypto.randomBytes(16);
  // const fileSize = fs.statSync(inputPath).size;
  // const numChunks = Math.ceil(fileSize / chunkSize);
  //
  // const metadata = {
  //   version: 1,
  //   masterIv,
  //   chunkSize,
  //   fileSize,
  //   numChunks
  // };
  //
  // const readStream = fs.createReadStream(inputPath, { highWaterMark: chunkSize });
  // const writeStream = fs.createWriteStream(outputPath);
  //
  // // Write metadata header
  // writeStream.write(JSON.stringify(metadata) + '\n');
  //
  // let chunkIndex = 0;
  // readStream.on('data', (chunk) => {
  //   // Derive chunk-specific IV
  //   const chunkIv = Buffer.alloc(16);
  //   masterIv.copy(chunkIv);
  //   // XOR chunk index into IV
  //   chunkIv.writeUInt32BE(chunkIndex, 12);
  //
  //   const cipher = crypto.createCipheriv('aes-256-ctr', encryptionKey, chunkIv);
  //   const encrypted = Buffer.concat([cipher.update(chunk), cipher.final()]);
  //
  //   // Compute HMAC for chunk
  //   const hmac = crypto.createHmac('sha256', hmacKey);
  //   hmac.update(encrypted);
  //   const chunkHmac = hmac.digest();
  //
  //   // Write chunk: length + hmac + data
  //   const chunkHeader = Buffer.alloc(4 + 32);
  //   chunkHeader.writeUInt32BE(encrypted.length, 0);
  //   chunkHmac.copy(chunkHeader, 4);
  //   writeStream.write(chunkHeader);
  //   writeStream.write(encrypted);
  //
  //   chunkIndex++;
  // });
  //
  // readStream.on('end', () => {
  //   writeStream.end();
  // });
}

/**
 * TODO 12: Decrypt large file in chunks
 *
 * @param {string} inputPath - Path to encrypted file
 * @param {string} outputPath - Path to output decrypted file
 * @param {Buffer} encryptionKey - Encryption key
 * @param {Buffer} hmacKey - HMAC key
 */
function decryptFileInChunks(inputPath, outputPath, encryptionKey, hmacKey) {
  // Your code here
}

// Test Task 4
try {
  console.log('Large file encryption: Implementation needed');
  console.log('This would handle files too large for memory');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Implement File Sharing with Access Control
console.log('Task 5: Secure file sharing');

/**
 * TODO 13: Implement file sharing system
 *
 * Allows sharing encrypted files with other users without
 * sharing the master password.
 *
 * Requirements:
 * - Generate file-specific encryption keys
 * - Wrap file keys with recipient's public key
 * - Support multiple recipients
 * - Implement access revocation
 * - Track access logs
 */
class SecureFileSharing {
  constructor() {
    this.files = new Map();
    this.userKeys = new Map();
  }

  /**
   * TODO 14: Register user with public key
   *
   * @param {string} userId - User ID
   * @param {string} publicKey - User's RSA public key
   */
  registerUser(userId, publicKey) {
    // Your code here
    // this.userKeys.set(userId, publicKey);
  }

  /**
   * TODO 15: Share file with user
   *
   * Steps:
   * 1. Get file's encryption key
   * 2. Get recipient's public key
   * 3. Encrypt file key with recipient's public key
   * 4. Store wrapped key
   * 5. Log access grant
   *
   * @param {string} fileId - File ID
   * @param {string} recipientId - Recipient user ID
   */
  shareFile(fileId, recipientId) {
    // Your code here
    // const fileKey = this.files.get(fileId)?.key;
    // const recipientPublicKey = this.userKeys.get(recipientId);
    //
    // if (!fileKey || !recipientPublicKey) {
    //   throw new Error('File or user not found');
    // }
    //
    // // Encrypt file key with recipient's public key
    // const wrappedKey = crypto.publicEncrypt(
    //   {
    //     key: recipientPublicKey,
    //     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    //     oaepHash: 'sha256'
    //   },
    //   fileKey
    // );
    //
    // if (!this.files.get(fileId).sharedWith) {
    //   this.files.get(fileId).sharedWith = new Map();
    // }
    //
    // this.files.get(fileId).sharedWith.set(recipientId, {
    //   wrappedKey,
    //   sharedAt: Date.now()
    // });
  }

  /**
   * TODO 16: Revoke file access
   *
   * Steps:
   * 1. Remove wrapped key for user
   * 2. Generate new file encryption key
   * 3. Re-encrypt file with new key
   * 4. Re-wrap for remaining users
   *
   * @param {string} fileId - File ID
   * @param {string} userId - User to revoke
   */
  revokeAccess(fileId, userId) {
    // Your code here
  }

  /**
   * TODO 17: Get access log for file
   */
  getAccessLog(fileId) {
    // Your code here
  }
}

// Test Task 5
try {
  const sharing = new SecureFileSharing();

  // Generate user keys
  const { publicKey: alicePublic } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  sharing.registerUser('alice', alicePublic);
  console.log('User registered');

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenges
console.log('=== Bonus Challenges ===\n');

console.log('Bonus 1: Implement Authenticated Encryption with Associated Data (AEAD)');
console.log('- Protect metadata without encrypting it');
console.log('- Use ChaCha20-Poly1305 for better performance');
console.log('- Support additional authenticated data\n');

console.log('Bonus 2: Add Deduplication');
console.log('- Hash files before storing');
console.log('- Store identical files only once');
console.log('- Maintain reference counting\n');

console.log('Bonus 3: Implement Versioning');
console.log('- Keep encrypted file history');
console.log('- Support rollback to previous versions');
console.log('- Efficient delta storage\n');

console.log('Bonus 4: Add Compression');
console.log('- Compress before encryption');
console.log('- Support multiple compression algorithms');
console.log('- Handle compression metadata\n');

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Performance:
 *    - Use streaming for large files
 *    - Implement parallel chunk processing
 *    - Consider hardware acceleration (AES-NI)
 *
 * 2. Security:
 *    - Implement secure key storage (HSM, KMS)
 *    - Add key rotation policies
 *    - Implement audit logging
 *    - Protect against timing attacks
 *
 * 3. Reliability:
 *    - Handle partial uploads/downloads
 *    - Implement checksums for data integrity
 *    - Support resume for interrupted transfers
 *
 * 4. Scalability:
 *    - Use content-addressable storage
 *    - Implement caching strategies
 *    - Support distributed storage
 *
 * 5. Compliance:
 *    - Support key escrow if required
 *    - Implement data retention policies
 *    - Add compliance reporting
 */

console.log('\n=== Exercise 3 Complete ===');
console.log('This exercise covers secure file storage');
console.log('Similar to Dropbox, Google Drive encryption features\n');
