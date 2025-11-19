# Guide: Production-Ready Path Handling Patterns

**Reading Time**: 40 minutes
**Difficulty**: Advanced
**Prerequisites**: Understanding of Node.js, production systems

---

## Introduction

This guide covers real-world patterns for handling paths in production applications. These patterns have been battle-tested in high-traffic systems and cover common scenarios like file uploads, configuration management, multi-tenancy, and more.

### What You'll Learn

- File upload handling patterns
- Configuration file management
- Multi-tenant file organization
- Caching strategies for paths
- Error handling patterns
- Monitoring and logging
- Backup and recovery
- Testing in production environments

---

## Table of Contents

1. [File Upload Patterns](#file-upload-patterns)
2. [Configuration Management](#configuration-management)
3. [Multi-Tenancy](#multi-tenancy)
4. [Caching Strategies](#caching-strategies)
5. [Error Handling](#error-handling)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Testing Patterns](#testing-patterns)
9. [Deployment Considerations](#deployment-considerations)
10. [Production Checklist](#production-checklist)

---

## File Upload Patterns

### Pattern 1: Secure File Upload Handler

```javascript
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

class SecureFileUploader {
  constructor(options = {}) {
    this.uploadDir = path.resolve(options.uploadDir || '/app/uploads');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedExtensions = options.allowedExtensions || ['.jpg', '.png', '.pdf'];
    this.validateContent = options.validateContent !== false;
  }

  async upload(file, userId) {
    // 1. Validate file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large: ${file.size} > ${this.maxFileSize}`);
    }

    // 2. Validate extension
    const ext = path.extname(file.originalName).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new Error(`Invalid file type: ${ext}`);
    }

    // 3. Generate safe filename
    const safeFilename = this.generateSafeFilename(file.originalName, userId);

    // 4. Determine storage path
    const storagePath = this.getStoragePath(userId, safeFilename);

    // 5. Ensure directory exists
    await fs.mkdir(path.dirname(storagePath), { recursive: true });

    // 6. Write file
    await fs.writeFile(storagePath, file.buffer);

    // 7. Validate content (magic bytes)
    if (this.validateContent) {
      await this.validateFileContent(storagePath, ext);
    }

    // 8. Return file info
    return {
      filename: safeFilename,
      path: storagePath,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      userId
    };
  }

  generateSafeFilename(originalName, userId) {
    // Extract extension
    const ext = path.extname(originalName);

    // Generate unique ID
    const uniqueId = crypto.randomBytes(16).toString('hex');

    // Create timestamp
    const timestamp = Date.now();

    // Combine: timestamp-uniqueId-userId.ext
    return `${timestamp}-${uniqueId}-${userId}${ext}`;
  }

  getStoragePath(userId, filename) {
    // Organize by user and date for easier management
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return path.join(
      this.uploadDir,
      String(userId),
      String(year),
      month,
      filename
    );
  }

  async validateFileContent(filepath, expectedExt) {
    // Read first few bytes (magic bytes)
    const fd = await fs.open(filepath, 'r');
    const buffer = Buffer.alloc(12);
    await fd.read(buffer, 0, 12, 0);
    await fd.close();

    // Validate based on extension
    const magicBytes = {
      '.jpg': [[0xFF, 0xD8, 0xFF]],
      '.png': [[0x89, 0x50, 0x4E, 0x47]],
      '.pdf': [[0x25, 0x50, 0x44, 0x46]],  // %PDF
      '.gif': [[0x47, 0x49, 0x46, 0x38]]   // GIF8
    };

    const expected = magicBytes[expectedExt];
    if (!expected) {
      return true;  // No validation for this type
    }

    const matches = expected.some(magic =>
      magic.every((byte, i) => buffer[i] === byte)
    );

    if (!matches) {
      // Delete invalid file
      await fs.unlink(filepath);
      throw new Error('File content does not match extension');
    }

    return true;
  }
}

// Usage
const uploader = new SecureFileUploader({
  uploadDir: '/app/uploads',
  maxFileSize: 5 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.png', '.pdf']
});

app.post('/upload', async (req, res) => {
  try {
    const result = await uploader.upload(req.file, req.user.id);
    res.json({ success: true, file: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

---

### Pattern 2: Temporary File Handling

```javascript
const os = require('os');

class TempFileManager {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'myapp-temp');
    this.cleanupInterval = 60 * 60 * 1000; // 1 hour
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours

    // Start cleanup process
    this.startCleanup();
  }

  async createTempFile(data, ext = '.tmp') {
    // Ensure temp directory exists
    await fs.mkdir(this.tempDir, { recursive: true });

    // Generate unique filename
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(this.tempDir, filename);

    // Write file
    await fs.writeFile(filepath, data);

    // Return path and cleanup function
    return {
      path: filepath,
      cleanup: async () => {
        try {
          await fs.unlink(filepath);
        } catch (error) {
          // File might already be deleted
        }
      }
    };
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(this.tempDir, file);
        const stat = await fs.stat(filepath);

        // Delete if older than maxAge
        if (now - stat.mtimeMs > this.maxAge) {
          await fs.unlink(filepath);
          console.log(`Cleaned up old temp file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  startCleanup() {
    setInterval(() => this.cleanupOldFiles(), this.cleanupInterval);
  }
}

// Usage
const tempManager = new TempFileManager();

async function processData(data) {
  const temp = await tempManager.createTempFile(data, '.json');

  try {
    // Process file
    await doSomethingWith(temp.path);
  } finally {
    // Always cleanup
    await temp.cleanup();
  }
}
```

---

## Configuration Management

### Pattern 1: Hierarchical Configuration Files

```javascript
class ConfigurationManager {
  constructor(configDir) {
    this.configDir = path.resolve(configDir);
    this.configs = new Map();
  }

  async load(environment = 'development') {
    const configs = [
      'default.json',                    // Base config
      `${environment}.json`,              // Environment-specific
      `${environment}.local.json`,        // Local overrides
      '.env'                              // Environment variables
    ];

    let merged = {};

    for (const configFile of configs) {
      const filepath = path.join(this.configDir, configFile);

      try {
        const config = await this.loadFile(filepath);
        merged = this.deepMerge(merged, config);
      } catch (error) {
        // Config file might not exist
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    this.configs.set(environment, merged);
    return merged;
  }

  async loadFile(filepath) {
    const ext = path.extname(filepath);

    switch (ext) {
      case '.json':
        const json = await fs.readFile(filepath, 'utf8');
        return JSON.parse(json);

      case '.env':
        const env = await fs.readFile(filepath, 'utf8');
        return this.parseEnvFile(env);

      default:
        throw new Error(`Unsupported config format: ${ext}`);
    }
  }

  parseEnvFile(content) {
    const config = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();

      // Remove quotes
      config[key.trim()] = value.replace(/^["']|["']$/g, '');
    }

    return config;
  }

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  get(key, defaultValue) {
    const config = this.configs.get(process.env.NODE_ENV || 'development');
    const keys = key.split('.');
    let value = config;

    for (const k of keys) {
      value = value?.[k];
    }

    return value !== undefined ? value : defaultValue;
  }
}

// Usage
const config = new ConfigurationManager('/app/config');
await config.load(process.env.NODE_ENV);

const dbHost = config.get('database.host', 'localhost');
const dbPort = config.get('database.port', 5432);
```

---

## Multi-Tenancy

### Pattern: Tenant-Isolated File Storage

```javascript
class MultiTenantStorage {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
  }

  getTenantDir(tenantId) {
    // Validate tenant ID
    if (!this.isValidTenantId(tenantId)) {
      throw new Error('Invalid tenant ID');
    }

    return path.join(this.baseDir, 'tenants', String(tenantId));
  }

  isValidTenantId(tenantId) {
    // Only alphanumeric and hyphens
    return /^[a-zA-Z0-9-]+$/.test(tenantId);
  }

  async ensureTenantDir(tenantId) {
    const tenantDir = this.getTenantDir(tenantId);
    await fs.mkdir(tenantDir, { recursive: true });
    return tenantDir;
  }

  async saveFile(tenantId, filename, data) {
    const tenantDir = await this.ensureTenantDir(tenantId);

    // Sanitize filename
    const safeFilename = path.basename(filename);

    // Prevent directory traversal
    const filepath = path.join(tenantDir, safeFilename);
    if (!filepath.startsWith(tenantDir + path.sep)) {
      throw new Error('Invalid filename');
    }

    await fs.writeFile(filepath, data);

    return {
      tenantId,
      filename: safeFilename,
      path: filepath
    };
  }

  async getFile(tenantId, filename) {
    const tenantDir = this.getTenantDir(tenantId);
    const filepath = path.join(tenantDir, path.basename(filename));

    // Validate path is within tenant directory
    if (!filepath.startsWith(tenantDir + path.sep)) {
      throw new Error('Invalid filename');
    }

    return await fs.readFile(filepath);
  }

  async listFiles(tenantId) {
    const tenantDir = this.getTenantDir(tenantId);

    try {
      const files = await fs.readdir(tenantDir);
      return files;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];  // Tenant has no files yet
      }
      throw error;
    }
  }

  async deleteTenant(tenantId) {
    const tenantDir = this.getTenantDir(tenantId);

    // Recursive delete
    await fs.rm(tenantDir, { recursive: true, force: true });
  }
}

// Usage
const storage = new MultiTenantStorage('/app/data');

app.post('/files', async (req, res) => {
  const { tenantId } = req.user;
  const result = await storage.saveFile(
    tenantId,
    req.file.originalname,
    req.file.buffer
  );
  res.json(result);
});
```

---

## Caching Strategies

### Pattern: Path Resolution Cache

```javascript
class PathCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 60000; // 1 minute
    this.cache = new Map();
  }

  set(key, value) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Cached path resolver
class CachedPathResolver {
  constructor(baseDir) {
    this.baseDir = path.resolve(baseDir);
    this.cache = new PathCache({ maxSize: 5000, ttl: 300000 });
  }

  resolve(userPath) {
    const cacheKey = `resolve:${userPath}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // Do expensive resolution
    const resolved = this.doResolve(userPath);

    // Cache result
    this.cache.set(cacheKey, resolved);

    return resolved;
  }

  doResolve(userPath) {
    const normalized = path.normalize(userPath);
    const resolved = path.resolve(this.baseDir, normalized);

    // Validate boundary
    if (!resolved.startsWith(this.baseDir + path.sep)) {
      throw new Error('Path outside boundary');
    }

    return resolved;
  }

  invalidatePath(userPath) {
    this.cache.invalidate(userPath);
  }
}
```

---

## Error Handling

### Pattern: Comprehensive Error Handler

```javascript
class PathError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PathError';
    this.code = code;
    this.details = details;
  }
}

class PathOperationHandler {
  async safeOperation(operation, errorContext = {}) {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, errorContext);
    }
  }

  handleError(error, context) {
    // Log error with context
    logger.error('Path operation failed', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      ...context
    });

    // Map filesystem errors to user-friendly messages
    const errorMap = {
      'ENOENT': 'File or directory not found',
      'EACCES': 'Permission denied',
      'EEXIST': 'File already exists',
      'ENOTDIR': 'Not a directory',
      'EISDIR': 'Is a directory',
      'EMFILE': 'Too many open files',
      'ENOSPC': 'No space left on device'
    };

    const userMessage = errorMap[error.code] || 'File operation failed';

    throw new PathError(userMessage, error.code, {
      originalError: error.message,
      ...context
    });
  }
}

// Usage
const handler = new PathOperationHandler();

app.get('/files/:filename', async (req, res) => {
  try {
    const content = await handler.safeOperation(
      () => fs.readFile(getFilePath(req.params.filename)),
      { userId: req.user.id, filename: req.params.filename }
    );

    res.send(content);
  } catch (error) {
    if (error instanceof PathError) {
      res.status(400).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

---

## Monitoring and Logging

### Pattern: Path Operation Metrics

```javascript
class PathMetrics {
  constructor() {
    this.metrics = {
      operations: new Map(),
      errors: new Map(),
      latencies: []
    };
  }

  recordOperation(operation, duration, success) {
    const key = `${operation}:${success ? 'success' : 'error'}`;
    const count = this.metrics.operations.get(key) || 0;
    this.metrics.operations.set(key, count + 1);

    if (success) {
      this.metrics.latencies.push({ operation, duration });

      // Keep only last 1000
      if (this.metrics.latencies.length > 1000) {
        this.metrics.latencies.shift();
      }
    }
  }

  recordError(operation, error) {
    const key = `${operation}:${error.code}`;
    const count = this.metrics.errors.get(key) || 0;
    this.metrics.errors.set(key, count + 1);
  }

  getMetrics() {
    return {
      operations: Object.fromEntries(this.metrics.operations),
      errors: Object.fromEntries(this.metrics.errors),
      averageLatency: this.calculateAverageLatency()
    };
  }

  calculateAverageLatency() {
    const byOperation = new Map();

    for (const { operation, duration } of this.metrics.latencies) {
      if (!byOperation.has(operation)) {
        byOperation.set(operation, []);
      }
      byOperation.get(operation).push(duration);
    }

    const result = {};
    for (const [operation, durations] of byOperation) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      result[operation] = Math.round(avg);
    }

    return result;
  }
}

// Instrumented operations
const metrics = new PathMetrics();

async function instrumentedReadFile(filepath) {
  const start = Date.now();
  let success = false;

  try {
    const result = await fs.readFile(filepath);
    success = true;
    return result;
  } catch (error) {
    metrics.recordError('readFile', error);
    throw error;
  } finally {
    const duration = Date.now() - start;
    metrics.recordOperation('readFile', duration, success);
  }
}

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});
```

---

## Summary

**Production Patterns Covered:**
- Secure file upload handling
- Temporary file management
- Hierarchical configuration
- Multi-tenant storage isolation
- Path resolution caching
- Comprehensive error handling
- Operation metrics and monitoring

**Key Takeaways:**
- Always validate and sanitize user input
- Use secure, unique filenames
- Implement proper cleanup
- Cache expensive operations
- Monitor and log everything
- Handle errors gracefully
- Test in production-like environments

**Next Steps:**
- Implement these patterns in your application
- Set up monitoring and alerting
- Create runbooks for common issues
- Test disaster recovery procedures

---

**Further Reading:**
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Production-Ready Node.js](https://nodejs.org/en/docs/guides/simple-profiling/)
