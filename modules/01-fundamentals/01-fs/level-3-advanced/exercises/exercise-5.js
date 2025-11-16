/**
 * Exercise 5: Virtual File System
 *
 * DIFFICULTY: ⭐⭐⭐ Advanced
 * TIME: 40-50 minutes
 *
 * OBJECTIVE:
 * Build a complete in-memory virtual file system with a familiar API
 * that can be used for testing, sandboxing, or as a custom storage layer.
 *
 * REQUIREMENTS:
 * 1. Implement core fs operations (read, write, mkdir, etc.)
 * 2. Support directory tree structure
 * 3. Track file metadata (size, timestamps, permissions)
 * 4. Implement path resolution (., .., /)
 * 5. Support symbolic links
 * 6. Implement file permissions (read, write, execute)
 * 7. Track current working directory
 * 8. Support both sync and async APIs
 *
 * API TO IMPLEMENT:
 * - writeFile(path, data)
 * - readFile(path)
 * - mkdir(path, options)
 * - readdir(path, options)
 * - stat(path)
 * - unlink(path)
 * - rmdir(path)
 * - rename(oldPath, newPath)
 * - symlink(target, path)
 * - readlink(path)
 * - chmod(path, mode)
 * - chown(path, uid, gid)
 *
 * EXAMPLE USAGE:
 * const vfs = new VirtualFileSystem();
 *
 * await vfs.mkdir('/home/user');
 * await vfs.writeFile('/home/user/file.txt', 'content');
 * const data = await vfs.readFile('/home/user/file.txt');
 * const files = await vfs.readdir('/home/user');
 *
 * // Path resolution
 * vfs.cwd('/home/user');
 * await vfs.writeFile('./local.txt', 'data');
 *
 * // Symlinks
 * await vfs.symlink('/home/user/file.txt', '/tmp/link.txt');
 *
 * BONUS CHALLENGES:
 * - Implement hard links
 * - Add inode numbers
 * - Support file watchers
 * - Implement access control lists (ACLs)
 * - Add quota management
 * - Support transactions (begin/commit/rollback)
 * - Implement copy-on-write
 * - Add persistence (serialize to disk)
 * - Support mounting virtual drives
 * - Implement file search/indexing
 *
 * HINTS:
 * - Use Map or object for file tree
 * - Store directories as Map<name, Node>
 * - Store files as { content, metadata }
 * - Normalize paths with path.normalize()
 * - Check permissions before operations
 */

const path = require('path');
const { EventEmitter } = require('events');

// TODO: Implement your solution here

/**
 * File system node (base class)
 */
class FSNode {
  constructor(type) {
    this.type = type; // 'file', 'directory', 'symlink'
    this.mode = type === 'directory' ? 0o755 : 0o644;
    this.uid = 0;
    this.gid = 0;
    this.ctime = new Date();
    this.mtime = new Date();
    this.atime = new Date();
  }

  isFile() {
    return this.type === 'file';
  }

  isDirectory() {
    return this.type === 'directory';
  }

  isSymbolicLink() {
    return this.type === 'symlink';
  }

  canRead(uid, gid) {
    // TODO: Check read permission
  }

  canWrite(uid, gid) {
    // TODO: Check write permission
  }

  canExecute(uid, gid) {
    // TODO: Check execute permission
  }
}

/**
 * File node
 */
class FileNode extends FSNode {
  constructor(content = '') {
    super('file');
    this.content = content;
    this.size = content.length;
  }

  write(data) {
    // TODO: Write data to file
  }

  read() {
    // TODO: Read file content
  }
}

/**
 * Directory node
 */
class DirectoryNode extends FSNode {
  constructor() {
    super('directory');
    this.entries = new Map(); // name → FSNode
  }

  add(name, node) {
    // TODO: Add entry to directory
  }

  remove(name) {
    // TODO: Remove entry from directory
  }

  get(name) {
    // TODO: Get entry by name
  }

  list() {
    // TODO: List all entries
  }

  isEmpty() {
    // TODO: Check if directory is empty
  }
}

/**
 * Symbolic link node
 */
class SymlinkNode extends FSNode {
  constructor(target) {
    super('symlink');
    this.target = target;
  }
}

/**
 * Virtual File System
 */
class VirtualFileSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.root = new DirectoryNode();
    this.currentDir = '/';
    this.uid = options.uid || 0;
    this.gid = options.gid || 0;
    this.followSymlinks = options.followSymlinks !== false;
  }

  // Path operations

  resolvePath(filePath) {
    // TODO: Resolve relative paths to absolute
    // Handle . and ..
    // Join with cwd if relative
  }

  parsePath(filePath) {
    // TODO: Split path into components
    // Return array of directory names
  }

  cwd(newPath) {
    // TODO: Get or set current working directory
  }

  // Core file operations

  async writeFile(filePath, data, options = {}) {
    // TODO: Write file
    // 1. Resolve path
    // 2. Navigate to parent directory
    // 3. Create or update file
    // 4. Update timestamps
  }

  async readFile(filePath, options = {}) {
    // TODO: Read file
    // 1. Resolve path
    // 2. Navigate to file
    // 3. Check permissions
    // 4. Return content
  }

  async mkdir(dirPath, options = {}) {
    // TODO: Create directory
    // Support recursive option
  }

  async readdir(dirPath, options = {}) {
    // TODO: List directory entries
    // Support withFileTypes option
  }

  async stat(filePath) {
    // TODO: Get file statistics
    // Return object with: size, mtime, ctime, isFile(), isDirectory(), etc.
  }

  async unlink(filePath) {
    // TODO: Delete file
  }

  async rmdir(dirPath) {
    // TODO: Remove directory
    // Must be empty
  }

  async rename(oldPath, newPath) {
    // TODO: Rename/move file or directory
  }

  async symlink(target, linkPath) {
    // TODO: Create symbolic link
  }

  async readlink(linkPath) {
    // TODO: Read symlink target
  }

  async chmod(filePath, mode) {
    // TODO: Change file permissions
  }

  async chown(filePath, uid, gid) {
    // TODO: Change file owner
  }

  // Helper methods

  navigateToNode(filePath, followLinks = true) {
    // TODO: Navigate path and return node
    // Handle symlinks if followLinks is true
  }

  navigateToParent(filePath) {
    // TODO: Navigate to parent directory
    // Return { dir, basename }
  }

  checkPermission(node, operation) {
    // TODO: Check if current user has permission
    // operation: 'read', 'write', 'execute'
  }

  // Serialization

  serialize() {
    // TODO: Convert VFS to JSON
    // For persistence
  }

  deserialize(data) {
    // TODO: Load VFS from JSON
  }

  // Debugging

  printTree(dirPath = '/', prefix = '') {
    // TODO: Print directory tree
  }
}

/**
 * Testing and demonstration
 */
async function testVFS() {
  console.log('Virtual File System Test\n');
  console.log('='.repeat(50));

  const vfs = new VirtualFileSystem();

  try {
    // Test basic operations
    console.log('\n1. Basic File Operations');
    console.log('-'.repeat(50));

    await vfs.mkdir('/home');
    await vfs.mkdir('/home/user');
    console.log('✓ Created directories');

    await vfs.writeFile('/home/user/file.txt', 'Hello, VFS!');
    await vfs.writeFile('/home/user/data.json', '{"key":"value"}');
    console.log('✓ Created files');

    const content = await vfs.readFile('/home/user/file.txt');
    console.log(`File content: ${content}`);

    const files = await vfs.readdir('/home/user');
    console.log(`Files in /home/user: ${files.join(', ')}`);

    // Test path resolution
    console.log('\n2. Path Resolution');
    console.log('-'.repeat(50));

    vfs.cwd('/home/user');
    await vfs.writeFile('./local.txt', 'Local file');
    await vfs.writeFile('../global.txt', 'Parent file');

    console.log(`CWD: ${vfs.cwd()}`);
    console.log(`Files: ${(await vfs.readdir('.')).join(', ')}`);

    // Test symlinks
    console.log('\n3. Symbolic Links');
    console.log('-'.repeat(50));

    await vfs.symlink('/home/user/file.txt', '/tmp-link.txt');
    const linkTarget = await vfs.readlink('/tmp-link.txt');
    console.log(`Link target: ${linkTarget}`);

    const linkedContent = await vfs.readFile('/tmp-link.txt');
    console.log(`Content via link: ${linkedContent}`);

    // Test permissions
    console.log('\n4. Permissions');
    console.log('-'.repeat(50));

    await vfs.chmod('/home/user/file.txt', 0o444); // Read-only
    const stats = await vfs.stat('/home/user/file.txt');
    console.log(`File mode: ${stats.mode.toString(8)}`);

    // Try to write (should fail)
    try {
      await vfs.writeFile('/home/user/file.txt', 'New content');
      console.log('✗ Write succeeded (unexpected)');
    } catch (err) {
      console.log(`✓ Write blocked: ${err.message}`);
    }

    // Test tree printing
    console.log('\n5. Directory Tree');
    console.log('-'.repeat(50));

    vfs.printTree('/');

    // Test serialization
    console.log('\n6. Serialization');
    console.log('-'.repeat(50));

    const serialized = vfs.serialize();
    console.log(`Serialized size: ${JSON.stringify(serialized).length} bytes`);

    const vfs2 = new VirtualFileSystem();
    vfs2.deserialize(serialized);

    const files2 = await vfs2.readdir('/home/user');
    console.log(`Restored files: ${files2.join(', ')}`);

    console.log('\n✓ All tests passed');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

// testVFS();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Basic test:
 *    node exercise-5.js
 *
 * 2. Stress test:
 *    - Create 1000 directories
 *    - Create 10000 files
 *    - Verify all accessible
 *
 * 3. Permission test:
 *    - Create file with restricted permissions
 *    - Try to read/write as different user
 *
 * 4. Serialization test:
 *    - Create complex file tree
 *    - Serialize and deserialize
 *    - Verify integrity
 */

/**
 * PATH RESOLUTION EXAMPLE:
 *
 * function resolvePath(currentDir, filePath) {
 *   // Make absolute
 *   const absolute = path.isAbsolute(filePath)
 *     ? filePath
 *     : path.join(currentDir, filePath);
 *
 *   // Normalize (handle . and ..)
 *   const normalized = path.normalize(absolute);
 *
 *   return normalized;
 * }
 */

/**
 * NAVIGATION EXAMPLE:
 *
 * function navigateToNode(startNode, pathParts) {
 *   let current = startNode;
 *
 *   for (const part of pathParts) {
 *     if (part === '.') continue;
 *     if (part === '..') {
 *       // Navigate to parent
 *       continue;
 *     }
 *
 *     if (!current.isDirectory()) {
 *       throw new Error('Not a directory');
 *     }
 *
 *     current = current.get(part);
 *     if (!current) {
 *       throw new Error('No such file or directory');
 *     }
 *   }
 *
 *   return current;
 * }
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - How does a file system organize data in memory?
 * - What is the difference between hard links and symlinks?
 * - How do permissions work in Unix-like systems?
 * - Why is path normalization important?
 * - What are the challenges of implementing a VFS?
 */
