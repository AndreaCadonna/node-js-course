/**
 * 07-error-handling.js
 * =====================
 * Demonstrates error handling patterns in streams
 *
 * Key Concepts:
 * - Why error handling is critical in streams
 * - Handling errors in readable streams
 * - Handling errors in writable streams
 * - Error propagation issues with pipe()
 * - Using pipeline() for better error handling
 *
 * Run: node 07-error-handling.js
 */

const fs = require('fs');
const path = require('path');
const { pipeline, Transform } = require('stream');
const zlib = require('zlib');

console.log('=== Stream Error Handling ===\n');

/**
 * IMPORTANT: Streams emit 'error' events but DON'T throw exceptions.
 * If you don't handle the error event, your Node.js process will crash!
 */

// =============================================================================
// EXAMPLE 1: What Happens WITHOUT Error Handling
// =============================================================================

console.log('--- Example 1: Without Error Handling (DANGEROUS) ---\n');

function example1WithoutHandling() {
  console.log('⚠️  WARNING: This example demonstrates why error handling is critical\n');

  // Try to read a file that doesn't exist
  const nonExistentPath = path.join(__dirname, 'this-file-does-not-exist.txt');

  console.log('Attempting to read non-existent file WITHOUT error handler...');
  console.log('(Error will be caught by our safety wrapper)\n');

  // We'll wrap this in try-catch at the process level
  const readable = fs.createReadStream(nonExistentPath);

  // Add a temporary error handler to prevent crash (for demo purposes)
  readable.on('error', (error) => {
    console.error('❌ Error occurred:', error.code);
    console.error('   Message:', error.message);
    console.log('\n💡 Without this error handler, the process would CRASH!\n');

    example2WithHandling();
  });

  readable.on('data', (chunk) => {
    console.log('This will never execute');
  });
}

// =============================================================================
// EXAMPLE 2: CORRECT - With Error Handling
// =============================================================================

function example2WithHandling() {
  console.log('--- Example 2: With Error Handling (CORRECT) ---\n');

  const nonExistentPath = path.join(__dirname, 'does-not-exist.txt');

  console.log('Attempting to read non-existent file WITH error handler...\n');

  const readable = fs.createReadStream(nonExistentPath);

  // CORRECT: Always add error handler
  readable.on('error', (error) => {
    console.log('✓ Error caught gracefully:', error.code);
    console.log('✓ Process continues running');
    console.log('✓ We can handle this error (log, retry, notify user, etc.)\n');

    example3WritableErrors();
  });

  readable.on('data', (chunk) => {
    console.log('Data received:', chunk);
  });
}

// =============================================================================
// EXAMPLE 3: Writable Stream Errors
// =============================================================================

function example3WritableErrors() {
  console.log('--- Example 3: Writable Stream Errors ---\n');

  // Try to write to a path we don't have permission for
  const invalidPath = '/root/cannot-write-here/file.txt';

  console.log('Attempting to write to invalid path WITH error handler...\n');

  const writable = fs.createWriteStream(invalidPath);

  // Handle writable errors
  writable.on('error', (error) => {
    console.log('✓ Write error caught:', error.code);
    console.log('✓ Error message:', error.message);
    console.log('✓ Can handle gracefully (use fallback path, notify user, etc.)\n');

    example4PipeErrors();
  });

  writable.write('This will not be written\n');
  writable.end();
}

// =============================================================================
// EXAMPLE 4: Error Handling with pipe() - THE PROBLEM
// =============================================================================

function example4PipeErrors() {
  console.log('--- Example 4: Errors with pipe() (PROBLEMATIC) ---\n');

  const sourcePath = path.join(__dirname, 'pipe-error-source.txt');
  fs.writeFileSync(sourcePath, 'Sample data for pipe error demo');

  const destPath = '/root/cannot-write/dest.txt'; // Will fail

  console.log('Using pipe() with invalid destination...\n');

  const readable = fs.createReadStream(sourcePath);
  const writable = fs.createWriteStream(destPath);

  // Problem: pipe() doesn't propagate errors!
  // You need to handle errors on BOTH streams
  readable.on('error', (error) => {
    console.error('❌ Readable error:', error.code);
  });

  writable.on('error', (error) => {
    console.error('❌ Writable error:', error.code);
    console.log('\n💡 Problem: pipe() does NOT propagate errors!');
    console.log('💡 You must add error handlers to EACH stream in the chain\n');

    // Clean up
    readable.destroy();

    example5MultipleStreamErrors();
  });

  readable.pipe(writable);
}

// =============================================================================
// EXAMPLE 5: Multiple Streams - Error Handling Complexity
// =============================================================================

function example5MultipleStreamErrors() {
  console.log('--- Example 5: Multiple Streams (Complex Error Handling) ---\n');

  const sourcePath = path.join(__dirname, 'pipe-error-source.txt');

  // Create a transform that might throw an error
  class ErrorProneTransform extends Transform {
    constructor(options) {
      super(options);
      this.chunkCount = 0;
    }

    _transform(chunk, encoding, callback) {
      this.chunkCount++;

      // Simulate an error on the 3rd chunk
      if (this.chunkCount === 3) {
        callback(new Error('Transform error on chunk 3!'));
        return;
      }

      this.push(chunk.toString().toUpperCase());
      callback();
    }
  }

  const outputPath = path.join(__dirname, 'multi-error-output.txt');

  const readable = fs.createReadStream(sourcePath);
  const transform = new ErrorProneTransform();
  const writable = fs.createWriteStream(outputPath);

  console.log('Chaining streams with error-prone transform...\n');

  // PROBLEM: Need to add error handler to EVERY stream!
  readable.on('error', (error) => {
    console.error('❌ Read error:', error.message);
    cleanup();
  });

  transform.on('error', (error) => {
    console.error('❌ Transform error:', error.message);
    console.log('\n💡 This is getting tedious...');
    console.log('💡 Need a better way to handle errors in chains!\n');

    // Clean up other streams
    readable.destroy();
    writable.destroy();

    example6PipelineFunction();
  });

  writable.on('error', (error) => {
    console.error('❌ Write error:', error.message);
    cleanup();
  });

  // Chain the streams
  readable.pipe(transform).pipe(writable);

  function cleanup() {
    try {
      fs.unlinkSync(sourcePath);
      fs.unlinkSync(outputPath);
    } catch (err) {
      // Ignore
    }
  }
}

// =============================================================================
// EXAMPLE 6: Using pipeline() - BEST PRACTICE
// =============================================================================

function example6PipelineFunction() {
  console.log('--- Example 6: Using pipeline() (BEST PRACTICE) ---\n');

  const sourcePath = path.join(__dirname, 'pipeline-source.txt');
  fs.writeFileSync(sourcePath, 'Sample data for pipeline demo\n'.repeat(10));

  const outputPath = path.join(__dirname, 'pipeline-output.txt.gz');

  console.log('Using pipeline() for better error handling...\n');

  // pipeline() is like pipe() but with:
  // 1. Automatic error handling
  // 2. Automatic cleanup on errors
  // 3. Single callback for all errors
  // 4. Proper stream destruction

  pipeline(
    fs.createReadStream(sourcePath),
    zlib.createGzip(),
    fs.createWriteStream(outputPath),
    (error) => {
      if (error) {
        console.error('❌ Pipeline error:', error.message);
        console.log('✓ All streams automatically cleaned up');
      } else {
        console.log('✓ Pipeline completed successfully!');
        console.log('✓ Single error handler for entire chain');
        console.log('✓ Automatic cleanup on errors');
        console.log('✓ Proper stream destruction\n');

        // Clean up
        fs.unlinkSync(sourcePath);
        fs.unlinkSync(outputPath);

        example7PipelineWithError();
      }
    }
  );
}

// =============================================================================
// EXAMPLE 7: pipeline() Handling Errors
// =============================================================================

function example7PipelineWithError() {
  console.log('--- Example 7: pipeline() with Error ---\n');

  const sourcePath = path.join(__dirname, 'does-not-exist-for-pipeline.txt');
  const outputPath = path.join(__dirname, 'pipeline-error-output.txt');

  console.log('Using pipeline() with non-existent source file...\n');

  pipeline(
    fs.createReadStream(sourcePath),  // This will fail
    zlib.createGzip(),
    fs.createWriteStream(outputPath),
    (error) => {
      if (error) {
        console.log('✓ Error caught by pipeline:', error.code);
        console.log('✓ All streams cleaned up automatically');
        console.log('✓ No resource leaks');
        console.log('✓ Simple and clean!\n');

        example8PipelineVsPromises();
      } else {
        console.log('Success (unexpected)');
      }
    }
  );
}

// =============================================================================
// EXAMPLE 8: pipeline() with Promises (Node.js 15+)
// =============================================================================

function example8PipelineVsPromises() {
  console.log('--- Example 8: pipeline() with Promises ---\n');

  const { pipeline: pipelinePromise } = require('stream/promises');
  const sourcePath = path.join(__dirname, 'promise-source.txt');
  fs.writeFileSync(sourcePath, 'Data for promise-based pipeline');

  const outputPath = path.join(__dirname, 'promise-output.txt.gz');

  console.log('Using promise-based pipeline() (async/await style)...\n');

  (async () => {
    try {
      await pipelinePromise(
        fs.createReadStream(sourcePath),
        zlib.createGzip(),
        fs.createWriteStream(outputPath)
      );

      console.log('✓ Pipeline completed successfully!');
      console.log('✓ Used with async/await');
      console.log('✓ Cleaner error handling with try-catch');
      console.log('✓ Modern JavaScript pattern\n');

      // Clean up
      fs.unlinkSync(sourcePath);
      fs.unlinkSync(outputPath);

      printKeyTakeaways();
      finalCleanup();

    } catch (error) {
      console.error('❌ Pipeline error:', error.message);
    }
  })();
}

// =============================================================================
// Key Takeaways
// =============================================================================

function printKeyTakeaways() {
  console.log('=== Key Takeaways ===');
  console.log('\n1. ALWAYS handle stream errors:');
  console.log('   stream.on("error", (err) => { /* handle */ })');
  console.log('\n2. pipe() does NOT propagate errors:');
  console.log('   - Must add error handlers to EACH stream');
  console.log('   - Error in one stream doesn\'t affect others');
  console.log('\n3. Use pipeline() instead of pipe():');
  console.log('   - Single error handler for entire chain');
  console.log('   - Automatic cleanup on errors');
  console.log('   - Proper stream destruction');
  console.log('   - Available as callback or promise-based');
  console.log('\n4. Error handling patterns:');
  console.log('   Callback: pipeline(s1, s2, s3, (err) => {})');
  console.log('   Promise:  await pipeline(s1, s2, s3)');
  console.log('\n5. Common stream errors:');
  console.log('   - ENOENT: File not found');
  console.log('   - EACCES: Permission denied');
  console.log('   - EPIPE: Broken pipe');
  console.log('   - Custom errors from transforms');
  console.log('\n6. Without error handlers:');
  console.log('   - Unhandled error event crashes process');
  console.log('   - Resources may leak');
  console.log('   - No graceful degradation\n');
}

// =============================================================================
// Cleanup
// =============================================================================

function finalCleanup() {
  const filesToDelete = [
    'pipe-error-source.txt',
    'multi-error-output.txt',
    'pipeline-source.txt',
    'pipeline-output.txt.gz',
    'promise-source.txt',
    'promise-output.txt.gz'
  ];

  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(path.join(__dirname, file));
    } catch (error) {
      // Ignore
    }
  });
}

// Start the examples
example1WithoutHandling();

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * ERROR HANDLING COMPARISON:
 *
 * Using pipe() (TEDIOUS):
 * ----------------------
 * const r = fs.createReadStream('in.txt');
 * const t = zlib.createGzip();
 * const w = fs.createWriteStream('out.gz');
 *
 * r.on('error', handleError);
 * t.on('error', handleError);
 * w.on('error', handleError);
 *
 * r.pipe(t).pipe(w);
 *
 * Using pipeline() (BETTER):
 * -------------------------
 * pipeline(
 *   fs.createReadStream('in.txt'),
 *   zlib.createGzip(),
 *   fs.createWriteStream('out.gz'),
 *   (err) => {
 *     if (err) handleError(err);
 *   }
 * );
 *
 * Using pipeline with Promises (BEST):
 * -----------------------------------
 * try {
 *   await pipeline(
 *     fs.createReadStream('in.txt'),
 *     zlib.createGzip(),
 *     fs.createWriteStream('out.gz')
 *   );
 * } catch (err) {
 *   handleError(err);
 * }
 *
 * BENEFITS OF pipeline():
 * - Single error handler
 * - Automatic cleanup
 * - Proper destruction
 * - Forward and backward error propagation
 * - Handles 'close' and 'finish' properly
 * - Prevents resource leaks
 */
