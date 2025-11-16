/**
 * Example 4: Symbolic and Hard Links
 *
 * Demonstrates working with symlinks and hard links.
 *
 * Key Concepts:
 * - Creating symbolic links (symlinks)
 * - Creating hard links
 * - Following vs not following links
 * - Resolving link targets
 * - Link management and cleanup
 */

const fs = require('fs').promises;
const path = require('path');

async function demonstrateLinks() {
  console.log('Symbolic and Hard Links Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-links');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Example 1: Creating symbolic links
    console.log('\n1. Creating Symbolic Links');
    console.log('─'.repeat(50));

    const targetFile = path.join(testDir, 'original.txt');
    await fs.writeFile(targetFile, 'This is the original file');

    const symlink = path.join(testDir, 'link-to-original.txt');
    await fs.symlink(targetFile, symlink);

    console.log(`  ✓ Created symlink: ${path.basename(symlink)}`);
    console.log(`  → Points to: ${path.basename(targetFile)}`);

    // Read through symlink
    const content = await fs.readFile(symlink, 'utf8');
    console.log(`  Content via symlink: "${content}"`);

    // Example 2: Symlink types
    console.log('\n2. Symlink Types');
    console.log('─'.repeat(50));

    // File symlink (default)
    const fileLink = path.join(testDir, 'file-link.txt');
    await fs.symlink(targetFile, fileLink, 'file');
    console.log('  ✓ File symlink created');

    // Directory symlink
    const targetDir = path.join(testDir, 'original-dir');
    await fs.mkdir(targetDir);
    await fs.writeFile(path.join(targetDir, 'file.txt'), 'File in directory');

    const dirLink = path.join(testDir, 'dir-link');
    await fs.symlink(targetDir, dirLink, 'dir');
    console.log('  ✓ Directory symlink created');

    // Read through directory symlink
    const filesInLink = await fs.readdir(dirLink);
    console.log(`  Files in dir symlink: ${filesInLink.join(', ')}`);

    // Example 3: Hard links
    console.log('\n3. Creating Hard Links');
    console.log('─'.repeat(50));

    const hardLink = path.join(testDir, 'hardlink.txt');
    await fs.link(targetFile, hardLink);

    console.log('  ✓ Hard link created');
    console.log('  Note: Hard links share the same inode');

    // Modify via hard link
    await fs.appendFile(hardLink, '\nAdded via hard link');

    // Read from original
    const originalContent = await fs.readFile(targetFile, 'utf8');
    console.log(`  Original file now contains:\n    ${originalContent.replace(/\n/g, '\n    ')}`);

    // Example 4: Detecting links
    console.log('\n4. Detecting Links');
    console.log('─'.repeat(50));

    const files = [
      { name: 'original.txt', path: targetFile },
      { name: 'symlink', path: symlink },
      { name: 'hard link', path: hardLink }
    ];

    for (const file of files) {
      const lstat = await fs.lstat(file.path); // Don't follow symlinks
      const stat = await fs.stat(file.path);   // Follow symlinks

      console.log(`\n  ${file.name}:`);
      console.log(`    Is symbolic link: ${lstat.isSymbolicLink()}`);
      console.log(`    Is file: ${lstat.isFile()}`);
      console.log(`    Size: ${stat.size} bytes`);
      console.log(`    Inode: ${stat.ino}`);
    }

    // Example 5: Reading symlink target
    console.log('\n5. Reading Symlink Target');
    console.log('─'.repeat(50));

    const linkTarget = await fs.readlink(symlink);
    console.log(`  Symlink: ${path.basename(symlink)}`);
    console.log(`  Target: ${linkTarget}`);

    // Resolve to absolute path
    const realPath = await fs.realpath(symlink);
    console.log(`  Real path: ${realPath}`);

    // Example 6: Broken symlinks
    console.log('\n6. Broken Symlinks');
    console.log('─'.repeat(50));

    const nonExistent = path.join(testDir, 'does-not-exist.txt');
    const brokenLink = path.join(testDir, 'broken-link.txt');

    await fs.symlink(nonExistent, brokenLink);
    console.log('  ✓ Created broken symlink');

    // lstat works (doesn't follow link)
    const brokenLstat = await fs.lstat(brokenLink);
    console.log(`  lstat() works: ${brokenLstat.isSymbolicLink()}`);

    // stat fails (tries to follow link)
    try {
      await fs.stat(brokenLink);
      console.log('  stat() succeeded (unexpected)');
    } catch (err) {
      console.log(`  stat() failed: ${err.code} (expected for broken link)`);
    }

    // Can still read link target
    const brokenTarget = await fs.readlink(brokenLink);
    console.log(`  Points to (non-existent): ${path.basename(brokenTarget)}`);

    // Example 7: Relative vs absolute symlinks
    console.log('\n7. Relative vs Absolute Symlinks');
    console.log('─'.repeat(50));

    // Absolute symlink
    const absLink = path.join(testDir, 'abs-link.txt');
    await fs.symlink(targetFile, absLink);
    console.log(`  Absolute link target: ${await fs.readlink(absLink)}`);

    // Relative symlink
    const relLink = path.join(testDir, 'rel-link.txt');
    await fs.symlink('original.txt', relLink); // Relative path
    console.log(`  Relative link target: ${await fs.readlink(relLink)}`);

    // Both work the same way
    const absContent = await fs.readFile(absLink, 'utf8');
    const relContent = await fs.readFile(relLink, 'utf8');
    console.log(`  Both readable: ${absContent.split('\n')[0] === relContent.split('\n')[0]}`);

    // Example 8: Link chains
    console.log('\n8. Symlink Chains');
    console.log('─'.repeat(50));

    const link1 = path.join(testDir, 'link1.txt');
    const link2 = path.join(testDir, 'link2.txt');
    const link3 = path.join(testDir, 'link3.txt');

    await fs.symlink(targetFile, link1);
    await fs.symlink(link1, link2);
    await fs.symlink(link2, link3);

    console.log('  Created chain: link3 → link2 → link1 → original');

    // Resolve the chain
    const finalTarget = await fs.realpath(link3);
    console.log(`  Resolved to: ${path.basename(finalTarget)}`);

    // Read through chain
    const chainContent = await fs.readFile(link3, 'utf8');
    console.log(`  Content accessible: ${chainContent.split('\n')[0]}`);

    // Example 9: Comparing inodes
    console.log('\n9. Comparing Inodes');
    console.log('─'.repeat(50));

    const origStat = await fs.stat(targetFile);
    const hardLinkStat = await fs.stat(hardLink);
    const symLinkStat = await fs.stat(symlink); // Follows link

    console.log('  Inode comparison:');
    console.log(`    Original:  ${origStat.ino}`);
    console.log(`    Hard link: ${hardLinkStat.ino} (same inode)`);
    console.log(`    Symlink:   ${symLinkStat.ino} (follows to same inode)`);

    const symLinkLstat = await fs.lstat(symlink); // Don't follow
    console.log(`    Symlink (lstat): ${symLinkLstat.ino} (different - the link itself)`);

    // Example 10: Unlinking
    console.log('\n10. Unlinking');
    console.log('─'.repeat(50));

    // Remove symlink
    await fs.unlink(symlink);
    console.log('  ✓ Removed symlink');

    // Original still exists
    const stillExists = await fs.access(targetFile).then(() => true).catch(() => false);
    console.log(`  Original file still exists: ${stillExists}`);

    // Remove one hard link
    await fs.unlink(hardLink);
    console.log('  ✓ Removed hard link');

    // Original still exists (data removed when all links gone)
    const origStillExists = await fs.access(targetFile).then(() => true).catch(() => false);
    console.log(`  Original still exists: ${origStillExists}`);

    // Example 11: Finding all links to a file
    console.log('\n11. Finding Links to a File');
    console.log('─'.repeat(50));

    // Create multiple hard links
    const testHardFile = path.join(testDir, 'multi-link.txt');
    await fs.writeFile(testHardFile, 'File with multiple links');

    const link_a = path.join(testDir, 'link-a.txt');
    const link_b = path.join(testDir, 'link-b.txt');

    await fs.link(testHardFile, link_a);
    await fs.link(testHardFile, link_b);

    const stats = await fs.stat(testHardFile);
    console.log(`  Number of hard links: ${stats.nlink}`);

    // Find all files with same inode
    const allFiles = await fs.readdir(testDir);
    const sameInode = [];

    for (const file of allFiles) {
      const filePath = path.join(testDir, file);
      try {
        const fileStat = await fs.stat(filePath);
        if (fileStat.ino === stats.ino) {
          sameInode.push(file);
        }
      } catch {
        // Skip files we can't stat
      }
    }

    console.log(`  Files with same inode: ${sameInode.join(', ')}`);

    // Example 12: Practical use case - version links
    console.log('\n12. Practical Use Case: Version Links');
    console.log('─'.repeat(50));

    // Simulate versioned files
    const v1 = path.join(testDir, 'app-v1.0.0.js');
    const v2 = path.join(testDir, 'app-v1.1.0.js');
    const current = path.join(testDir, 'app.js');

    await fs.writeFile(v1, 'console.log("Version 1.0.0")');
    await fs.writeFile(v2, 'console.log("Version 1.1.0")');

    // Point 'current' to latest version
    await fs.symlink(v2, current);

    console.log('  Version structure:');
    console.log(`    app-v1.0.0.js (old)`);
    console.log(`    app-v1.1.0.js (latest)`);
    console.log(`    app.js → app-v1.1.0.js (symlink)`);

    const currentTarget = await fs.readlink(current);
    console.log(`  Current points to: ${path.basename(currentTarget)}`);

    // "Rollback" by changing symlink
    await fs.unlink(current);
    await fs.symlink(v1, current);

    const rolledBack = await fs.readlink(current);
    console.log(`  After rollback, points to: ${path.basename(rolledBack)}`);

    // Cleanup
    console.log('\n13. Cleanup');
    console.log('─'.repeat(50));

    await fs.rm(testDir, { recursive: true, force: true });
    console.log('✓ Cleanup complete');

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  }
}

demonstrateLinks();

/**
 * Symlink vs Hard Link:
 *
 * Symbolic Link (symlink):
 * - Pointer to path (can cross filesystems)
 * - Separate inode
 * - Can point to directories
 * - Can be broken if target deleted
 * - Shows as symlink in ls -l
 *
 * Hard Link:
 * - Direct reference to inode
 * - Same inode as target
 * - Can't cross filesystems
 * - Can't point to directories
 * - File deleted only when all links removed
 * - Looks like regular file
 */

/**
 * Use Cases:
 *
 * Symbolic Links:
 * - Version management (node → node-v18)
 * - Shortcuts/aliases
 * - Configuration files
 * - Cross-filesystem links
 *
 * Hard Links:
 * - Deduplication
 * - Atomic updates
 * - Backup systems
 * - Ensuring file availability
 */

/**
 * API Methods:
 *
 * fs.symlink(target, path, [type])
 * - Create symbolic link
 * - type: 'file', 'dir', 'junction' (Windows)
 *
 * fs.link(existingPath, newPath)
 * - Create hard link
 *
 * fs.readlink(path)
 * - Read symlink target
 *
 * fs.realpath(path)
 * - Resolve symlinks to absolute path
 *
 * fs.lstat(path)
 * - Get stats without following symlink
 *
 * fs.stat(path)
 * - Get stats, following symlinks
 */

/**
 * Common Patterns:
 *
 * 1. Check if symlink:
 *    const stats = await fs.lstat(path);
 *    if (stats.isSymbolicLink()) { ... }
 *
 * 2. Safely resolve symlink:
 *    try {
 *      const target = await fs.realpath(path);
 *    } catch {
 *      // Broken link
 *    }
 *
 * 3. Atomic file update:
 *    await fs.writeFile(newFile, data);
 *    await fs.unlink(linkPath);
 *    await fs.symlink(newFile, linkPath);
 */
