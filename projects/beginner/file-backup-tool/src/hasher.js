/**
 * File Hasher - Calculate checksums for file integrity verification
 * Uses crypto module (Node.js core) for hash generation
 */

const crypto = require('crypto');
const fs = require('fs');

class FileHasher {
  /**
   * Calculate hash of a file using streams for memory efficiency
   * @param {string} filePath - Path to file
   * @param {string} algorithm - Hash algorithm (sha256, md5, etc.)
   * @returns {Promise<string>} Hex hash string
   */
  static calculateHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Calculate hash of a buffer
   * @param {Buffer} buffer - Buffer to hash
   * @param {string} algorithm - Hash algorithm
   * @returns {string} Hex hash string
   */
  static calculateBufferHash(buffer, algorithm = 'sha256') {
    const hash = crypto.createHash(algorithm);
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * Verify file integrity by comparing hashes
   * @param {string} filePath - Path to file to verify
   * @param {string} expectedHash - Expected hash value
   * @param {string} algorithm - Hash algorithm
   * @returns {Promise<boolean>} True if hashes match
   */
  static async verifyFile(filePath, expectedHash, algorithm = 'sha256') {
    try {
      const actualHash = await this.calculateHash(filePath, algorithm);
      return actualHash === expectedHash;
    } catch (error) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
}

module.exports = FileHasher;
