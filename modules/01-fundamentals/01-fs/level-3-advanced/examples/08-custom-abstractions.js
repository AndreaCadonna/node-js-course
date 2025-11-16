/**
 * Example 8: Custom File System Abstractions
 *
 * Demonstrates building custom FS wrappers and abstractions.
 *
 * Key Concepts:
 * - Virtual file systems
 * - FS abstraction layers
 * - Mockable file operations
 * - Plugin architectures
 * - Custom storage backends
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Virtual File System (in-memory)
 */
class VirtualFS {
  constructor() {
    this.files = new Map();
    this.directories = new Set(['/']);
  }

  async writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!this.directories.has(dir)) {
      throw new Error(`ENOENT: Directory does not exist: ${dir}`);
    }

    this.files.set(filePath, {
      content: content,
      mtime: new Date(),
      ctime: new Date(),
      size: content.length
    });
  }

  async readFile(filePath, encoding = 'utf8') {
    if (!this.files.has(filePath)) {
      throw new Error(`ENOENT: File does not exist: ${filePath}`);
    }

    const file = this.files.get(filePath);
    return encoding ? file.content.toString(encoding) : file.content;
  }

  async mkdir(dirPath, options = {}) {
    if (options.recursive) {
      const parts = dirPath.split(path.sep).filter(Boolean);
      let current = '/';

      for (const part of parts) {
        current = path.join(current, part);
        this.directories.add(current);
      }
    } else {
      const parent = path.dirname(dirPath);
      if (!this.directories.has(parent)) {
        throw new Error(`ENOENT: Parent directory does not exist: ${parent}`);
      }
      this.directories.add(dirPath);
    }
  }

  async readdir(dirPath) {
    if (!this.directories.has(dirPath)) {
      throw new Error(`ENOENT: Directory does not exist: ${dirPath}`);
    }

    const entries = [];

    // Find files in this directory
    for (const [filePath] of this.files) {
      if (path.dirname(filePath) === dirPath) {
        entries.push(path.basename(filePath));
      }
    }

    // Find subdirectories
    for (const dir of this.directories) {
      if (path.dirname(dir) === dirPath && dir !== dirPath) {
        entries.push(path.basename(dir));
      }
    }

    return entries;
  }

  async stat(filePath) {
    if (this.files.has(filePath)) {
      const file = this.files.get(filePath);
      return {
        isFile: () => true,
        isDirectory: () => false,
        size: file.size,
        mtime: file.mtime,
        ctime: file.ctime
      };
    }

    if (this.directories.has(filePath)) {
      return {
        isFile: () => false,
        isDirectory: () => true,
        size: 0,
        mtime: new Date(),
        ctime: new Date()
      };
    }

    throw new Error(`ENOENT: No such file or directory: ${filePath}`);
  }

  async unlink(filePath) {
    if (!this.files.has(filePath)) {
      throw new Error(`ENOENT: File does not exist: ${filePath}`);
    }
    this.files.delete(filePath);
  }

  async rmdir(dirPath) {
    if (!this.directories.has(dirPath)) {
      throw new Error(`ENOENT: Directory does not exist: ${dirPath}`);
    }

    // Check if directory is empty
    const entries = await this.readdir(dirPath);
    if (entries.length > 0) {
      throw new Error(`ENOTEMPTY: Directory not empty: ${dirPath}`);
    }

    this.directories.delete(dirPath);
  }

  clear() {
    this.files.clear();
    this.directories.clear();
    this.directories.add('/');
  }
}

/**
 * Logged File System (wrapper with logging)
 */
class LoggedFS {
  constructor(baseFS = fs) {
    this.fs = baseFS;
    this.logs = [];
  }

  async writeFile(filePath, content) {
    this.log('writeFile', filePath, { size: content.length });
    return await this.fs.writeFile(filePath, content);
  }

  async readFile(filePath, encoding) {
    this.log('readFile', filePath);
    return await this.fs.readFile(filePath, encoding);
  }

  async mkdir(dirPath, options) {
    this.log('mkdir', dirPath, options);
    return await this.fs.mkdir(dirPath, options);
  }

  async readdir(dirPath, options) {
    this.log('readdir', dirPath);
    return await this.fs.readdir(dirPath, options);
  }

  async stat(filePath) {
    this.log('stat', filePath);
    return await this.fs.stat(filePath);
  }

  async unlink(filePath) {
    this.log('unlink', filePath);
    return await this.fs.unlink(filePath);
  }

  log(operation, filePath, metadata = {}) {
    this.logs.push({
      timestamp: new Date(),
      operation,
      path: filePath,
      metadata
    });
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

/**
 * Cached File System
 */
class CachedFS {
  constructor(baseFS = fs, ttl = 5000) {
    this.fs = baseFS;
    this.cache = new Map();
    this.ttl = ttl;
  }

  async readFile(filePath, encoding = 'utf8') {
    const cacheKey = `${filePath}:${encoding}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.time < this.ttl) {
      return cached.content;
    }

    const content = await this.fs.readFile(filePath, encoding);
    this.cache.set(cacheKey, {
      content,
      time: Date.now()
    });

    return content;
  }

  async writeFile(filePath, content) {
    const result = await this.fs.writeFile(filePath, content);

    // Invalidate cache
    for (const key of this.cache.keys()) {
      if (key.startsWith(filePath + ':')) {
        this.cache.delete(key);
      }
    }

    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Storage Adapter Interface
 */
class StorageAdapter extends EventEmitter {
  async read(key) {
    throw new Error('Not implemented');
  }

  async write(key, value) {
    throw new Error('Not implemented');
  }

  async delete(key) {
    throw new Error('Not implemented');
  }

  async list(prefix) {
    throw new Error('Not implemented');
  }
}

/**
 * File System Storage Adapter
 */
class FileSystemAdapter extends StorageAdapter {
  constructor(basePath) {
    super();
    this.basePath = basePath;
  }

  async read(key) {
    const filePath = path.join(this.basePath, key);
    return await fs.readFile(filePath, 'utf8');
  }

  async write(key, value) {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, value);
    this.emit('write', key);
  }

  async delete(key) {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath);
    this.emit('delete', key);
  }

  async list(prefix = '') {
    const dirPath = path.join(this.basePath, prefix);
    try {
      return await fs.readdir(dirPath);
    } catch {
      return [];
    }
  }
}

/**
 * Memory Storage Adapter
 */
class MemoryAdapter extends StorageAdapter {
  constructor() {
    super();
    this.storage = new Map();
  }

  async read(key) {
    if (!this.storage.has(key)) {
      throw new Error(`Key not found: ${key}`);
    }
    return this.storage.get(key);
  }

  async write(key, value) {
    this.storage.set(key, value);
    this.emit('write', key);
  }

  async delete(key) {
    this.storage.delete(key);
    this.emit('delete', key);
  }

  async list(prefix = '') {
    const keys = Array.from(this.storage.keys());
    return keys.filter(key => key.startsWith(prefix));
  }
}

async function demonstrateCustomAbstractions() {
  console.log('Custom File System Abstractions\n');
  console.log('═'.repeat(50));

  try {
    // Example 1: Virtual File System
    console.log('\n1. Virtual File System (In-Memory)');
    console.log('─'.repeat(50));

    const vfs = new VirtualFS();

    await vfs.mkdir('/app', { recursive: true });
    await vfs.mkdir('/app/data', { recursive: true });
    await vfs.writeFile('/app/config.json', '{"version": "1.0"}');
    await vfs.writeFile('/app/data/file.txt', 'Hello, Virtual FS!');

    console.log('  Created virtual file system structure');

    const files = await vfs.readdir('/app');
    console.log(`  Files in /app: ${files.join(', ')}`);

    const content = await vfs.readFile('/app/config.json');
    console.log(`  Config content: ${content}`);

    const stats = await vfs.stat('/app/data/file.txt');
    console.log(`  File size: ${stats.size} bytes`);

    // Example 2: Logged File System
    console.log('\n2. Logged File System');
    console.log('─'.repeat(50));

    const testDir = path.join(__dirname, 'test-abstractions');
    await fs.mkdir(testDir, { recursive: true });

    const loggedFS = new LoggedFS();

    await loggedFS.mkdir(path.join(testDir, 'logs'), { recursive: true });
    await loggedFS.writeFile(path.join(testDir, 'file1.txt'), 'content 1');
    await loggedFS.writeFile(path.join(testDir, 'file2.txt'), 'content 2');
    await loggedFS.readFile(path.join(testDir, 'file1.txt'), 'utf8');

    const logs = loggedFS.getLogs();
    console.log(`  Operations logged: ${logs.length}`);

    logs.forEach(log => {
      console.log(`    ${log.operation}: ${path.basename(log.path)}`);
    });

    // Example 3: Cached File System
    console.log('\n3. Cached File System');
    console.log('─'.repeat(50));

    const cachedFS = new CachedFS(fs, 10000);

    const cachedFile = path.join(testDir, 'cached.txt');
    await fs.writeFile(cachedFile, 'Cached content');

    // First read (from disk)
    const start1 = Date.now();
    await cachedFS.readFile(cachedFile);
    const time1 = Date.now() - start1;
    console.log(`  First read (from disk): ${time1}ms`);

    // Second read (from cache)
    const start2 = Date.now();
    await cachedFS.readFile(cachedFile);
    const time2 = Date.now() - start2;
    console.log(`  Second read (from cache): ${time2}ms`);
    console.log(`  Cache speedup: ${(time1 / Math.max(time2, 0.1)).toFixed(2)}x`);

    // Example 4: Storage Adapters
    console.log('\n4. Storage Adapters (Pluggable)');
    console.log('─'.repeat(50));

    // File system adapter
    const fsAdapter = new FileSystemAdapter(path.join(testDir, 'storage'));

    fsAdapter.on('write', (key) => {
      console.log(`  FS Adapter wrote: ${key}`);
    });

    await fsAdapter.write('users/user1.json', '{"name": "Alice"}');
    await fsAdapter.write('users/user2.json', '{"name": "Bob"}');

    const users = await fsAdapter.list('users');
    console.log(`  Users stored: ${users.length}`);

    // Memory adapter (same interface)
    const memAdapter = new MemoryAdapter();

    memAdapter.on('write', (key) => {
      console.log(`  Memory Adapter wrote: ${key}`);
    });

    await memAdapter.write('users/user1.json', '{"name": "Alice"}');
    await memAdapter.write('users/user2.json', '{"name": "Bob"}');

    const memUsers = await memAdapter.list('users');
    console.log(`  Users in memory: ${memUsers.length}`);

    // Example 5: Switchable backends
    console.log('\n5. Switchable Storage Backend');
    console.log('─'.repeat(50));

    class DataStore {
      constructor(adapter) {
        this.adapter = adapter;
      }

      async save(key, data) {
        await this.adapter.write(key, JSON.stringify(data));
      }

      async load(key) {
        const data = await this.adapter.read(key);
        return JSON.parse(data);
      }

      async list(prefix) {
        return await this.adapter.list(prefix);
      }

      switchBackend(newAdapter) {
        this.adapter = newAdapter;
      }
    }

    // Start with file system
    const store = new DataStore(fsAdapter);
    await store.save('config/app.json', { setting: 'value1' });
    console.log('  Saved to file system');

    // Switch to memory
    store.switchBackend(memAdapter);
    await store.save('config/app.json', { setting: 'value2' });
    console.log('  Saved to memory');

    const memConfig = await store.load('config/app.json');
    console.log(`  Loaded from memory: ${JSON.stringify(memConfig)}`);

    // Example 6: Virtual FS with transactions
    console.log('\n6. Virtual FS with Transactions');
    console.log('─'.repeat(50));

    class TransactionalVFS extends VirtualFS {
      constructor() {
        super();
        this.transaction = null;
      }

      beginTransaction() {
        this.transaction = {
          files: new Map(this.files),
          directories: new Set(this.directories)
        };
        console.log('  Transaction started');
      }

      async commit() {
        this.transaction = null;
        console.log('  Transaction committed');
      }

      async rollback() {
        if (this.transaction) {
          this.files = this.transaction.files;
          this.directories = this.transaction.directories;
          this.transaction = null;
          console.log('  Transaction rolled back');
        }
      }
    }

    const txVFS = new TransactionalVFS();
    await txVFS.mkdir('/data', { recursive: true });
    await txVFS.writeFile('/data/original.txt', 'original');

    txVFS.beginTransaction();
    await txVFS.writeFile('/data/new.txt', 'new file');
    await txVFS.writeFile('/data/original.txt', 'modified');

    console.log(`  Files before rollback: ${(await txVFS.readdir('/data')).length}`);

    await txVFS.rollback();

    const filesAfter = await txVFS.readdir('/data');
    console.log(`  Files after rollback: ${filesAfter.length}`);
    console.log(`  Original content: ${await txVFS.readFile('/data/original.txt')}`);

    // Example 7: Namespace isolation
    console.log('\n7. Namespace Isolation');
    console.log('─'.repeat(50));

    class NamespacedFS {
      constructor(baseFS, namespace) {
        this.fs = baseFS;
        this.namespace = namespace;
      }

      resolvePath(filePath) {
        return path.join(this.namespace, filePath);
      }

      async writeFile(filePath, content) {
        return await this.fs.writeFile(this.resolvePath(filePath), content);
      }

      async readFile(filePath, encoding) {
        return await this.fs.readFile(this.resolvePath(filePath), encoding);
      }

      async mkdir(dirPath, options) {
        return await this.fs.mkdir(this.resolvePath(dirPath), options);
      }
    }

    const ns1 = new NamespacedFS(vfs, '/namespace1');
    const ns2 = new NamespacedFS(vfs, '/namespace2');

    await vfs.mkdir('/namespace1', { recursive: true });
    await vfs.mkdir('/namespace2', { recursive: true });

    await ns1.writeFile('file.txt', 'Namespace 1');
    await ns2.writeFile('file.txt', 'Namespace 2');

    console.log(`  NS1 file: ${await ns1.readFile('file.txt')}`);
    console.log(`  NS2 file: ${await ns2.readFile('file.txt')}`);
    console.log('  ✓ Namespaces isolated');

    // Example 8: Validation layer
    console.log('\n8. Validation Layer');
    console.log('─'.repeat(50));

    class ValidatedFS {
      constructor(baseFS) {
        this.fs = baseFS;
        this.maxFileSize = 1024 * 1024; // 1MB
        this.allowedExtensions = ['.txt', '.json', '.md'];
      }

      async writeFile(filePath, content) {
        // Validate file size
        if (content.length > this.maxFileSize) {
          throw new Error(`File too large: ${content.length} bytes`);
        }

        // Validate extension
        const ext = path.extname(filePath);
        if (!this.allowedExtensions.includes(ext)) {
          throw new Error(`Extension not allowed: ${ext}`);
        }

        console.log(`  ✓ Validation passed for ${path.basename(filePath)}`);
        return await this.fs.writeFile(filePath, content);
      }
    }

    const validatedFS = new ValidatedFS(vfs);

    try {
      await validatedFS.writeFile('/test.txt', 'Valid content');
      console.log('  Valid file written successfully');
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }

    try {
      await validatedFS.writeFile('/test.exe', 'Invalid extension');
    } catch (err) {
      console.log(`  ✓ Blocked invalid extension: ${err.message}`);
    }

    // Cleanup
    console.log('\n9. Cleanup');
    console.log('─'.repeat(50));

    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

demonstrateCustomAbstractions();

/**
 * Benefits of Abstractions:
 *
 * 1. Testability:
 *    - Mock file system in tests
 *    - No real I/O needed
 *    - Faster tests
 *
 * 2. Flexibility:
 *    - Switch backends easily
 *    - Add features without changing code
 *    - Plugin architecture
 *
 * 3. Security:
 *    - Validation layers
 *    - Access control
 *    - Sandboxing
 *
 * 4. Debugging:
 *    - Logging wrappers
 *    - Performance monitoring
 *    - Error tracking
 *
 * 5. Consistency:
 *    - Unified interface
 *    - Hide platform differences
 *    - Easier maintenance
 */

/**
 * Abstraction Patterns:
 *
 * 1. Wrapper:
 *    - Delegate to underlying FS
 *    - Add functionality
 *    - Maintain interface
 *
 * 2. Adapter:
 *    - Common interface
 *    - Multiple backends
 *    - Swappable implementations
 *
 * 3. Decorator:
 *    - Layer features
 *    - Chain wrappers
 *    - Composable
 *
 * 4. Virtual:
 *    - In-memory implementation
 *    - Testing and mocking
 *    - Sandboxed execution
 */

/**
 * Real-World Applications:
 *
 * - Test frameworks (mock-fs)
 * - Build tools (memfs)
 * - Bundlers (virtual FS)
 * - Cloud storage adapters
 * - Version control systems
 * - Content management systems
 */
