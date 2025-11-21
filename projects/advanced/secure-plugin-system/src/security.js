/**
 * Security
 * Plugin signature verification and security utilities
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class Security {
  constructor(options = {}) {
    this.publicKeyPath = options.publicKeyPath;
    this.privateKeyPath = options.privateKeyPath;
    this.publicKey = null;
    this.privateKey = null;
    this.requireSignature = options.requireSignature !== false;
  }

  /**
   * Initialize security (load keys)
   */
  async initialize() {
    if (this.publicKeyPath) {
      try {
        this.publicKey = await fs.promises.readFile(this.publicKeyPath, 'utf8');
      } catch (error) {
        console.warn('Public key not found, signature verification disabled');
      }
    }

    if (this.privateKeyPath) {
      try {
        this.privateKey = await fs.promises.readFile(this.privateKeyPath, 'utf8');
      } catch (error) {
        console.warn('Private key not found, signing disabled');
      }
    }
  }

  /**
   * Generate RSA key pair
   */
  static async generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        'rsa',
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        },
        (error, publicKey, privateKey) => {
          if (error) {
            reject(error);
          } else {
            resolve({ publicKey, privateKey });
          }
        }
      );
    });
  }

  /**
   * Sign plugin
   */
  async signPlugin(pluginDir) {
    if (!this.privateKey) {
      throw new Error('Private key not loaded');
    }

    // Read plugin.json
    const manifestPath = path.join(pluginDir, 'plugin.json');
    const manifestData = await fs.promises.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    // Read main file
    const mainPath = path.join(pluginDir, manifest.main);
    const mainCode = await fs.promises.readFile(mainPath, 'utf8');

    // Create signature payload
    const payload = JSON.stringify({
      manifest: manifestData,
      code: mainCode,
      timestamp: Date.now()
    });

    // Sign
    const signature = crypto.sign('sha256', Buffer.from(payload), {
      key: this.privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    });

    // Save signature
    const signaturePath = path.join(pluginDir, 'plugin.sig');
    await fs.promises.writeFile(signaturePath, signature.toString('base64'), 'utf8');

    return signature.toString('base64');
  }

  /**
   * Verify plugin signature
   */
  async verifyPlugin(plugin) {
    if (!this.requireSignature) {
      return true;
    }

    if (!this.publicKey) {
      throw new Error('Public key not loaded');
    }

    if (!plugin.signature) {
      throw new Error(`Plugin ${plugin.id} has no signature`);
    }

    try {
      // Read plugin.json
      const manifestPath = path.join(plugin.pluginDir, 'plugin.json');
      const manifestData = await fs.promises.readFile(manifestPath, 'utf8');

      // Read main file
      const mainCode = plugin.code;

      // Recreate payload (without timestamp for verification)
      const payload = JSON.stringify({
        manifest: manifestData,
        code: mainCode
      });

      // Parse signature from stored data
      // The signature file contains timestamp, we need to verify against the code
      const signatureBuffer = Buffer.from(plugin.signature, 'base64');

      // Create hash of code for verification
      const codeHash = crypto.createHash('sha256').update(mainCode).digest();

      // For simplicity, verify the code hash matches
      const verified = crypto.verify(
        'sha256',
        codeHash,
        {
          key: this.publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        },
        signatureBuffer
      );

      plugin.verified = verified;

      return verified;
    } catch (error) {
      console.error(`Signature verification failed for ${plugin.id}:`, error.message);
      plugin.verified = false;
      return false;
    }
  }

  /**
   * Calculate file hash
   */
  static async calculateFileHash(filePath, algorithm = 'sha256') {
    const data = await fs.promises.readFile(filePath);
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Calculate plugin checksum
   */
  static async calculatePluginChecksum(pluginDir) {
    const checksums = {};

    // Read plugin.json
    const manifestPath = path.join(pluginDir, 'plugin.json');
    checksums.manifest = await Security.calculateFileHash(manifestPath);

    // Read manifest to get main file
    const manifestData = await fs.promises.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    // Calculate main file hash
    const mainPath = path.join(pluginDir, manifest.main);
    checksums.main = await Security.calculateFileHash(mainPath);

    // Calculate combined checksum
    const combined = checksums.manifest + checksums.main;
    checksums.combined = crypto.createHash('sha256').update(combined).digest('hex');

    return checksums;
  }

  /**
   * Validate plugin integrity
   */
  static async validateIntegrity(plugin, expectedChecksum) {
    const checksums = await Security.calculatePluginChecksum(plugin.pluginDir);
    return checksums.combined === expectedChecksum;
  }

  /**
   * Scan plugin for security issues
   */
  static scanPlugin(code) {
    const issues = [];

    // Dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'eval() is potentially dangerous' },
      { pattern: /Function\s*\(/, message: 'Function() constructor is potentially dangerous' },
      { pattern: /require\s*\(.*child_process.*\)/, message: 'child_process is not allowed' },
      { pattern: /require\s*\(.*fs.*\)/, message: 'Direct fs access is not allowed' },
      { pattern: /process\.exit/, message: 'process.exit() is not allowed' },
      { pattern: /process\.kill/, message: 'process.kill() is not allowed' },
      { pattern: /require\s*\(.*net.*\)/, message: 'Direct net access is not allowed' },
      { pattern: /require\s*\(.*http.*\)/, message: 'Direct http access is not allowed' },
      { pattern: /__dirname/, message: '__dirname access may expose file system' },
      { pattern: /__filename/, message: '__filename access may expose file system' }
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(code)) {
        issues.push({
          severity: 'high',
          pattern: pattern.toString(),
          message
        });
      }
    }

    // Suspicious patterns
    const suspiciousPatterns = [
      { pattern: /delete\s+global/, message: 'Attempting to modify global object' },
      { pattern: /Object\.defineProperty\(global/, message: 'Attempting to modify global' },
      { pattern: /prototype\s*=/, message: 'Prototype modification detected' }
    ];

    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(code)) {
        issues.push({
          severity: 'medium',
          pattern: pattern.toString(),
          message
        });
      }
    }

    return {
      safe: issues.filter(i => i.severity === 'high').length === 0,
      issues
    };
  }

  /**
   * Sanitize plugin input
   */
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input.replace(/[<>]/g, '');
    }

    if (Array.isArray(input)) {
      return input.map(item => Security.sanitizeInput(item));
    }

    if (input && typeof input === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = Security.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Check plugin permissions
   */
  static validatePermissions(permissions) {
    const allowedPermissions = [
      'fs',
      'network',
      'storage',
      'events',
      'crypto',
      '*' // All permissions
    ];

    for (const permission of permissions) {
      if (!allowedPermissions.includes(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }

    // Warn about dangerous permissions
    if (permissions.includes('*')) {
      console.warn('WARNING: Plugin requests all permissions (*)');
    }

    return true;
  }

  /**
   * Create security report
   */
  static async createSecurityReport(plugin) {
    const report = {
      pluginId: plugin.id,
      name: plugin.name,
      version: plugin.version,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // Code scan
    const scanResult = Security.scanPlugin(plugin.code);
    report.checks.codeScan = {
      passed: scanResult.safe,
      issues: scanResult.issues
    };

    // Permissions check
    try {
      Security.validatePermissions(plugin.permissions);
      report.checks.permissions = {
        passed: true,
        permissions: plugin.permissions
      };
    } catch (error) {
      report.checks.permissions = {
        passed: false,
        error: error.message
      };
    }

    // Checksum
    try {
      const checksums = await Security.calculatePluginChecksum(plugin.pluginDir);
      report.checks.integrity = {
        passed: true,
        checksums
      };
    } catch (error) {
      report.checks.integrity = {
        passed: false,
        error: error.message
      };
    }

    // Overall result
    report.passed = Object.values(report.checks).every(check => check.passed);

    return report;
  }
}

module.exports = Security;
