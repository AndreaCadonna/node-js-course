/**
 * Example 8: Production Path Patterns
 *
 * Demonstrates real-world production patterns for path handling
 * including configuration management, framework integration,
 * and deployment considerations.
 *
 * Key Points:
 * - Real-world production scenarios
 * - Framework integration patterns
 * - Configuration management
 * - Deployment considerations
 * - Monitoring and logging
 */

const path = require('path');
const fs = require('fs');

console.log('=== Production Path Patterns ===\n');

// 1. Configuration Management Pattern
console.log('1. Configuration Management:');

class PathConfig {
  constructor(baseDir) {
    this.paths = {
      base: path.resolve(baseDir),
      src: null,
      build: null,
      public: null,
      uploads: null,
      temp: null,
      logs: null
    };

    this._initialize();
  }

  _initialize() {
    this.paths.src = path.join(this.paths.base, 'src');
    this.paths.build = path.join(this.paths.base, 'dist');
    this.paths.public = path.join(this.paths.base, 'public');
    this.paths.uploads = path.join(this.paths.base, 'uploads');
    this.paths.temp = path.join(this.paths.base, 'tmp');
    this.paths.logs = path.join(this.paths.base, 'logs');
  }

  get(key) {
    if (!this.paths[key]) {
      throw new Error(`Unknown path key: ${key}`);
    }
    return this.paths[key];
  }

  resolve(key, ...segments) {
    return path.resolve(this.get(key), ...segments);
  }

  relative(key, filepath) {
    return path.relative(this.get(key), filepath);
  }

  validate() {
    const missing = [];

    for (const [key, dirPath] of Object.entries(this.paths)) {
      if (key !== 'base' && !fs.existsSync(dirPath)) {
        missing.push({ key, path: dirPath });
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  toJSON() {
    return this.paths;
  }
}

const config = new PathConfig('/app');

console.log('  Application path configuration:');
console.log(`    Base:    ${config.get('base')}`);
console.log(`    Source:  ${config.get('src')}`);
console.log(`    Build:   ${config.get('build')}`);
console.log(`    Public:  ${config.get('public')}`);
console.log(`    Uploads: ${config.get('uploads')}`);
console.log(`    Temp:    ${config.get('temp')}`);
console.log(`    Logs:    ${config.get('logs')}`);
console.log();

// 2. File Upload Handler Pattern
console.log('2. File Upload Handler Pattern:');

class FileUploadHandler {
  constructor(uploadDir, options = {}) {
    this.uploadDir = path.resolve(uploadDir);
    this.options = {
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
      allowedExtensions: options.allowedExtensions || ['.jpg', '.png', '.pdf'],
      generateUniqueNames: options.generateUniqueNames !== false,
      createSubdirectories: options.createSubdirectories || true,
      ...options
    };
  }

  validateUpload(filename, size) {
    const errors = [];

    // Size check
    if (size > this.options.maxSize) {
      errors.push(`File size ${size} exceeds maximum ${this.options.maxSize}`);
    }

    // Extension check
    const ext = path.extname(filename).toLowerCase();
    if (!this.options.allowedExtensions.includes(ext)) {
      errors.push(`Extension ${ext} not allowed`);
    }

    // Filename check
    if (filename.includes('..')) {
      errors.push('Invalid filename');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  generateFilename(originalName) {
    if (!this.options.generateUniqueNames) {
      return originalName;
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const basename = path.basename(originalName, ext);

    return `${basename}-${timestamp}-${random}${ext}`;
  }

  getUploadPath(filename, subdir = null) {
    let uploadPath = this.uploadDir;

    if (this.options.createSubdirectories && subdir) {
      uploadPath = path.join(uploadPath, subdir);
    }

    const finalFilename = this.generateFilename(filename);
    return path.join(uploadPath, finalFilename);
  }

  getRelativePath(fullPath) {
    return path.relative(this.uploadDir, fullPath);
  }
}

const uploadHandler = new FileUploadHandler('/app/uploads', {
  allowedExtensions: ['.jpg', '.png', '.pdf'],
  generateUniqueNames: true
});

console.log('  File upload handler:');
const uploadTests = [
  { name: 'photo.jpg', size: 5000000 },
  { name: 'document.pdf', size: 3000000 },
  { name: 'script.exe', size: 1000000 },
  { name: '../../../etc/passwd', size: 100 }
];

uploadTests.forEach(test => {
  const validation = uploadHandler.validateUpload(test.name, test.size);
  if (validation.valid) {
    const uploadPath = uploadHandler.getUploadPath(test.name, 'user123');
    console.log(`    ✓ ${test.name} → ${uploadPath}`);
  } else {
    console.log(`    ✗ ${test.name} → ${validation.errors.join(', ')}`);
  }
});
console.log();

// 3. Asset Pipeline Pattern
console.log('3. Asset Pipeline Pattern:');

class AssetPipeline {
  constructor(config) {
    this.config = config;
  }

  getSrcPath(assetPath) {
    return path.join(this.config.get('src'), 'assets', assetPath);
  }

  getBuildPath(assetPath) {
    return path.join(this.config.get('build'), 'assets', assetPath);
  }

  getPublicPath(assetPath) {
    // Return URL-friendly path
    return '/assets/' + assetPath.split(path.sep).join('/');
  }

  processAsset(srcPath) {
    const relativePath = path.relative(
      path.join(this.config.get('src'), 'assets'),
      srcPath
    );

    return {
      src: srcPath,
      build: this.getBuildPath(relativePath),
      public: this.getPublicPath(relativePath),
      relative: relativePath
    };
  }
}

const assetPipeline = new AssetPipeline(config);

console.log('  Asset pipeline processing:');
const assets = [
  'images/logo.png',
  'css/style.css',
  'js/app.js'
];

assets.forEach(asset => {
  const processed = assetPipeline.processAsset(
    path.join(config.get('src'), 'assets', asset)
  );
  console.log(`    ${asset}:`);
  console.log(`      Build:  ${processed.build}`);
  console.log(`      Public: ${processed.public}`);
});
console.log();

// 4. Secure File Access Service
console.log('4. Secure File Access Service:');

class SecureFileService {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      followSymlinks: options.followSymlinks || false,
      validateAll: options.validateAll !== false,
      maxPathDepth: options.maxPathDepth || 10,
      ...options
    };

    this.accessLog = [];
  }

  async readFile(filepath) {
    // Validate
    const validation = this._validate(filepath);
    if (!validation.valid) {
      this._logAccess(filepath, 'denied', validation.errors);
      throw new Error(`Access denied: ${validation.errors.join(', ')}`);
    }

    // Resolve
    const fullPath = path.resolve(this.baseDir, filepath);

    // Check symlinks
    if (!this.options.followSymlinks) {
      const stats = await fs.promises.lstat(fullPath);
      if (stats.isSymbolicLink()) {
        this._logAccess(filepath, 'denied', ['Symlinks not allowed']);
        throw new Error('Symlinks not allowed');
      }
    }

    // Read file
    try {
      const content = await fs.promises.readFile(fullPath, 'utf8');
      this._logAccess(filepath, 'granted');
      return content;
    } catch (error) {
      this._logAccess(filepath, 'error', [error.message]);
      throw error;
    }
  }

  _validate(filepath) {
    const errors = [];

    // Null byte check
    if (filepath.includes('\0')) {
      errors.push('Null byte detected');
    }

    // Traversal check
    if (filepath.includes('..')) {
      errors.push('Traversal pattern detected');
    }

    // Boundary check
    const resolved = path.resolve(this.baseDir, filepath);
    if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
      errors.push('Path outside base directory');
    }

    // Depth check
    const depth = filepath.split(path.sep).filter(p => p).length;
    if (depth > this.options.maxPathDepth) {
      errors.push('Path depth exceeds maximum');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  _logAccess(filepath, status, errors = []) {
    this.accessLog.push({
      timestamp: new Date(),
      filepath,
      status,
      errors
    });
  }

  getAccessLog() {
    return this.accessLog;
  }
}

const fileService = new SecureFileService('/app/data');

console.log('  Secure file service:');
console.log('    • Validates all file paths');
console.log('    • Checks symlinks');
console.log('    • Logs all access attempts');
console.log('    • Enforces boundary restrictions');
console.log();

// 5. Multi-Tenant Path Manager
console.log('5. Multi-Tenant Path Manager:');

class MultiTenantPathManager {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
    this.tenants = new Map();
  }

  registerTenant(tenantId, config = {}) {
    const tenantDir = path.join(this.baseDir, tenantId);

    this.tenants.set(tenantId, {
      id: tenantId,
      baseDir: tenantDir,
      uploads: path.join(tenantDir, 'uploads'),
      data: path.join(tenantDir, 'data'),
      temp: path.join(tenantDir, 'temp'),
      config
    });

    return this.tenants.get(tenantId);
  }

  getTenantPath(tenantId, type, ...segments) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Unknown tenant: ${tenantId}`);
    }

    if (!tenant[type]) {
      throw new Error(`Unknown path type: ${type}`);
    }

    return path.join(tenant[type], ...segments);
  }

  validateTenantPath(tenantId, filepath) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { valid: false, error: 'Unknown tenant' };
    }

    const resolved = path.resolve(filepath);

    if (!resolved.startsWith(tenant.baseDir + path.sep)) {
      return { valid: false, error: 'Path outside tenant directory' };
    }

    return { valid: true };
  }
}

const tenantManager = new MultiTenantPathManager('/app/tenants');

console.log('  Multi-tenant setup:');
['tenant1', 'tenant2'].forEach(id => {
  tenantManager.registerTenant(id);
  console.log(`    Registered: ${id}`);
  console.log(`      Uploads: ${tenantManager.getTenantPath(id, 'uploads')}`);
  console.log(`      Data:    ${tenantManager.getTenantPath(id, 'data')}`);
});
console.log();

// 6. Cache-Backed Path Resolution
console.log('6. Cache-Backed Path Resolution:');

class CachedPathResolver {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 60000; // 1 minute
  }

  resolve(...segments) {
    const key = segments.join('|');
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.value;
    }

    const result = path.resolve(...segments);

    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value: result,
      timestamp: Date.now()
    });

    return result;
  }

  clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

const cachedResolver = new CachedPathResolver({ maxSize: 100, ttl: 5000 });

console.log('  Cached path resolver:');
console.log('    • LRU cache with TTL');
console.log('    • Automatic expiration');
console.log('    • Size-limited cache');
console.log();

// 7. Production Best Practices Summary
console.log('7. Production Best Practices:');
console.log();
console.log('  Configuration:');
console.log('    • Centralize path configuration');
console.log('    • Use environment-specific configs');
console.log('    • Validate configuration on startup');
console.log();
console.log('  Security:');
console.log('    • Validate all user inputs');
console.log('    • Use whitelisting over blacklisting');
console.log('    • Log access attempts');
console.log('    • Implement rate limiting');
console.log();
console.log('  Performance:');
console.log('    • Cache frequently accessed paths');
console.log('    • Use batch operations');
console.log('    • Monitor performance metrics');
console.log();
console.log('  Monitoring:');
console.log('    • Log all file operations');
console.log('    • Track access patterns');
console.log('    • Monitor error rates');
console.log('    • Set up alerts for anomalies');
console.log();
console.log('  Multi-Tenancy:');
console.log('    • Isolate tenant data');
console.log('    • Enforce strict boundaries');
console.log('    • Implement quota management');
console.log();

console.log('✅ Production path patterns complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Centralize path configuration');
console.log('  • Implement comprehensive security');
console.log('  • Use caching for performance');
console.log('  • Log and monitor all operations');
console.log('  • Handle multi-tenancy carefully');
console.log('  • Plan for deployment scenarios');
