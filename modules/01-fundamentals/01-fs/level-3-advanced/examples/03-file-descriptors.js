/**
 * Example 3: File Descriptors and Low-Level Operations
 *
 * Demonstrates precise file control with file descriptors.
 *
 * Key Concepts:
 * - fs.open() for getting file descriptors
 * - Reading/writing at specific positions
 * - File modes and flags
 * - Direct buffer manipulation
 * - Proper descriptor cleanup
 */

const fs = require('fs').promises;
const path = require('path');

async function demonstrateFileDescriptors() {
  console.log('File Descriptors Demonstration\n');
  console.log('═'.repeat(50));

  const testDir = path.join(__dirname, 'test-fd');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // Example 1: Opening and closing files
    console.log('\n1. Opening and Closing Files');
    console.log('─'.repeat(50));

    const testFile = path.join(testDir, 'test.txt');
    await fs.writeFile(testFile, 'Hello, World!');

    // Open for reading
    const fd = await fs.open(testFile, 'r');
    console.log(`✓ Opened file (descriptor: ${fd.fd})`);

    // Always close!
    await fd.close();
    console.log('✓ Closed file descriptor');

    // Example 2: File open modes
    console.log('\n2. File Open Modes');
    console.log('─'.repeat(50));

    const modes = {
      'r': 'Read only (file must exist)',
      'r+': 'Read and write (file must exist)',
      'w': 'Write only (creates or truncates)',
      'w+': 'Read and write (creates or truncates)',
      'a': 'Append only (creates if not exists)',
      'a+': 'Read and append (creates if not exists)'
    };

    console.log('Available modes:');
    Object.entries(modes).forEach(([flag, desc]) => {
      console.log(`  ${flag.padEnd(4)} - ${desc}`);
    });

    // Example 3: Reading with file descriptor
    console.log('\n3. Reading with File Descriptor');
    console.log('─'.repeat(50));

    const readFd = await fs.open(testFile, 'r');

    try {
      const buffer = Buffer.alloc(13); // Allocate buffer
      const { bytesRead } = await readFd.read(buffer, 0, 13, 0);

      console.log(`  Bytes read: ${bytesRead}`);
      console.log(`  Content: "${buffer.toString()}"`);
    } finally {
      await readFd.close();
    }

    // Example 4: Writing with file descriptor
    console.log('\n4. Writing with File Descriptor');
    console.log('─'.repeat(50));

    const writeFd = await fs.open(path.join(testDir, 'write-test.txt'), 'w');

    try {
      const data = Buffer.from('File Descriptor Write Test');
      const { bytesWritten } = await writeFd.write(data, 0, data.length, 0);

      console.log(`  Bytes written: ${bytesWritten}`);
    } finally {
      await writeFd.close();
    }

    console.log('  ✓ File written successfully');

    // Example 5: Reading at specific positions
    console.log('\n5. Random Access Reading');
    console.log('─'.repeat(50));

    const dataFile = path.join(testDir, 'data.bin');
    await fs.writeFile(dataFile, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    const randomFd = await fs.open(dataFile, 'r');

    try {
      // Read from different positions
      const positions = [0, 10, 20, 30];

      for (const pos of positions) {
        const buffer = Buffer.alloc(5);
        await randomFd.read(buffer, 0, 5, pos);
        console.log(`  Position ${pos}: "${buffer.toString()}"`);
      }
    } finally {
      await randomFd.close();
    }

    // Example 6: Writing at specific positions
    console.log('\n6. Random Access Writing');
    console.log('─'.repeat(50));

    const patchFile = path.join(testDir, 'patch.txt');
    await fs.writeFile(patchFile, 'XXXXXXXXXXXXXXXXXXXX'); // 20 X's

    const patchFd = await fs.open(patchFile, 'r+');

    try {
      // Write at specific positions
      await patchFd.write(Buffer.from('START'), 0, 5, 0);
      await patchFd.write(Buffer.from('MIDDLE'), 0, 6, 7);
      await patchFd.write(Buffer.from('END'), 0, 3, 17);

      // Read result
      const result = await patchFd.readFile('utf8');
      console.log(`  Result: "${result}"`);
    } finally {
      await patchFd.close();
    }

    // Example 7: File stats from descriptor
    console.log('\n7. Getting File Stats from Descriptor');
    console.log('─'.repeat(50));

    const statsFd = await fs.open(testFile, 'r');

    try {
      const stats = await statsFd.stat();

      console.log('  File information:');
      console.log(`    Size: ${stats.size} bytes`);
      console.log(`    Mode: ${stats.mode.toString(8)}`);
      console.log(`    UID: ${stats.uid}`);
      console.log(`    GID: ${stats.gid}`);
      console.log(`    Modified: ${stats.mtime.toLocaleString()}`);
    } finally {
      await statsFd.close();
    }

    // Example 8: Truncating file
    console.log('\n8. Truncating File');
    console.log('─'.repeat(50));

    const truncFile = path.join(testDir, 'truncate.txt');
    await fs.writeFile(truncFile, 'This is a long file that will be truncated');

    const truncFd = await fs.open(truncFile, 'r+');

    try {
      console.log(`  Original size: ${(await truncFd.stat()).size} bytes`);

      // Truncate to 10 bytes
      await truncFd.truncate(10);

      console.log(`  After truncate: ${(await truncFd.stat()).size} bytes`);

      const content = await truncFd.readFile('utf8');
      console.log(`  Content: "${content}"`);
    } finally {
      await truncFd.close();
    }

    // Example 9: File syncing
    console.log('\n9. File Syncing (fsync)');
    console.log('─'.repeat(50));

    const syncFile = path.join(testDir, 'sync.txt');
    const syncFd = await fs.open(syncFile, 'w');

    try {
      // Write data
      await syncFd.write(Buffer.from('Important data'));

      // Force write to disk
      await syncFd.sync();
      console.log('  ✓ Data synced to disk (fsync)');

      // Sync only data (not metadata)
      await syncFd.write(Buffer.from(' - More data'));
      await syncFd.datasync();
      console.log('  ✓ Data synced (fdatasync)');
    } finally {
      await syncFd.close();
    }

    // Example 10: Building a simple record-based file
    console.log('\n10. Record-Based File Access');
    console.log('─'.repeat(50));

    const recordFile = path.join(testDir, 'records.dat');
    const recordSize = 32; // Each record is 32 bytes

    // Create file with 5 records
    const recordFd = await fs.open(recordFile, 'w+');

    try {
      // Write 5 records
      for (let i = 0; i < 5; i++) {
        const record = Buffer.alloc(recordSize);
        record.write(`Record ${i}`, 0, 'utf8');
        await recordFd.write(record, 0, recordSize, i * recordSize);
      }

      console.log('  ✓ Created 5 records');

      // Read specific records
      console.log('\n  Reading specific records:');
      const recordsToRead = [0, 2, 4];

      for (const recordNum of recordsToRead) {
        const buffer = Buffer.alloc(recordSize);
        await recordFd.read(buffer, 0, recordSize, recordNum * recordSize);
        const content = buffer.toString('utf8').replace(/\0/g, '').trim();
        console.log(`    Record ${recordNum}: "${content}"`);
      }

      // Update a specific record
      const updateBuffer = Buffer.alloc(recordSize);
      updateBuffer.write('Updated Record 2', 0, 'utf8');
      await recordFd.write(updateBuffer, 0, recordSize, 2 * recordSize);

      console.log('\n  ✓ Updated record 2');

      // Read updated record
      const verifyBuffer = Buffer.alloc(recordSize);
      await recordFd.read(verifyBuffer, 0, recordSize, 2 * recordSize);
      const updated = verifyBuffer.toString('utf8').replace(/\0/g, '').trim();
      console.log(`    Verified: "${updated}"`);

    } finally {
      await recordFd.close();
    }

    // Example 11: File descriptor properties
    console.log('\n11. File Descriptor Properties');
    console.log('─'.repeat(50));

    const propsFd = await fs.open(testFile, 'r');

    try {
      console.log('  Descriptor properties:');
      console.log(`    FD number: ${propsFd.fd}`);

      // Check if FD is valid
      try {
        await propsFd.stat();
        console.log('    Status: Valid and open');
      } catch {
        console.log('    Status: Invalid or closed');
      }
    } finally {
      await propsFd.close();
      console.log('    After close: Descriptor released');
    }

    // Example 12: Multiple concurrent operations
    console.log('\n12. Concurrent Operations on Same File');
    console.log('─'.repeat(50));

    const concFile = path.join(testDir, 'concurrent.txt');
    await fs.writeFile(concFile, 'Initial content here');

    const fd1 = await fs.open(concFile, 'r');
    const fd2 = await fs.open(concFile, 'r');

    try {
      const buf1 = Buffer.alloc(7);
      const buf2 = Buffer.alloc(7);

      // Read different parts simultaneously
      const [read1, read2] = await Promise.all([
        fd1.read(buf1, 0, 7, 0),
        fd2.read(buf2, 0, 7, 8)
      ]);

      console.log(`  FD1 read: "${buf1.toString()}"`);
      console.log(`  FD2 read: "${buf2.toString()}"`);
    } finally {
      await Promise.all([fd1.close(), fd2.close()]);
    }

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

demonstrateFileDescriptors();

/**
 * File Descriptor Best Practices:
 *
 * ✓ Always close descriptors (use try/finally)
 * ✓ Use high-level APIs when possible
 * ✓ Be careful with concurrent access
 * ✓ Sync when data must be durable
 * ✓ Handle errors gracefully
 *
 * ✗ Don't leak file descriptors
 * ✗ Don't assume write order
 * ✗ Don't forget position parameter
 * ✗ Don't use for simple operations
 */

/**
 * When to Use File Descriptors:
 *
 * Use FDs when you need:
 * - Random access to file positions
 * - Multiple operations on same file
 * - Low-level control (truncate, sync)
 * - Record-based file structures
 * - Performance-critical code
 *
 * Use high-level APIs (readFile, etc.) for:
 * - Simple read/write operations
 * - Small files
 * - Sequential access
 * - Simpler code
 */

/**
 * File Flags Explained:
 *
 * r   - Read. Fails if file doesn't exist
 * r+  - Read/Write. Fails if file doesn't exist
 * w   - Write. Creates or truncates file
 * w+  - Read/Write. Creates or truncates file
 * a   - Append. Creates if doesn't exist
 * a+  - Read/Append. Creates if doesn't exist
 * wx  - Write exclusively. Fails if exists
 * ax  - Append exclusively. Fails if exists
 */

/**
 * Performance Considerations:
 *
 * File descriptors are faster when:
 * - Making multiple operations
 * - Reading/writing specific positions
 * - Avoiding repeated open/close
 *
 * Trade-offs:
 * - More complex code
 * - Must manage cleanup
 * - Easy to leak descriptors
 * - Limited number available (ulimit -n)
 */
