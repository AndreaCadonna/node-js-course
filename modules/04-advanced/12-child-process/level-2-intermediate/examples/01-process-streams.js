/**
 * EXAMPLE 1: Working with Process Streams
 *
 * This example demonstrates:
 * - Reading from and writing to process streams
 * - Piping between processes
 * - Stream transformation
 * - Handling backpressure
 * - Error handling in streams
 */

const { spawn } = require('child_process');
const { Transform } = require('stream');

console.log('=== Process Streams Examples ===\n');

// Example 1: Basic Stream Piping
function basicPiping() {
  console.log('1. Basic Stream Piping');
  console.log('   Creating pipeline: echo -> uppercase\n');

  const echo = spawn('echo', ['hello world from streams']);

  // Create a transform stream to uppercase the data
  const uppercase = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk.toString().toUpperCase());
      callback();
    }
  });

  // Pipe: echo -> uppercase -> stdout
  echo.stdout.pipe(uppercase).pipe(process.stdout);

  echo.on('close', (code) => {
    console.log(`   Echo process exited with code ${code}\n`);
    example2();
  });
}

// Example 2: Multi-Process Pipeline
function example2() {
  console.log('2. Multi-Process Pipeline');
  console.log('   Creating: cat -> grep -> wc\n');

  // Create a temp file first
  const fs = require('fs');
  const tmpFile = '/tmp/sample-log.txt';

  fs.writeFileSync(tmpFile, `
ERROR: Failed to connect
INFO: Server started
ERROR: Database timeout
WARNING: High memory usage
INFO: Request processed
ERROR: Network error
  `.trim());

  const cat = spawn('cat', [tmpFile]);
  const grep = spawn('grep', ['ERROR']);
  const wc = spawn('wc', ['-l']);

  // Build the pipeline
  cat.stdout.pipe(grep.stdin);
  grep.stdout.pipe(wc.stdin);

  let result = '';
  wc.stdout.on('data', (data) => {
    result += data.toString();
  });

  wc.on('close', (code) => {
    console.log(`   Found ${result.trim()} ERROR lines`);
    console.log(`   Pipeline completed with code ${code}\n`);
    example3();
  });

  // Handle errors in the pipeline
  cat.on('error', (err) => console.error('Cat error:', err));
  grep.on('error', (err) => console.error('Grep error:', err));
  wc.on('error', (err) => console.error('Wc error:', err));
}

// Example 3: Writing to Child Process stdin
function example3() {
  console.log('3. Writing to Child Process stdin');
  console.log('   Sending data to grep via stdin\n');

  const grep = spawn('grep', ['important']);

  // Collect output
  let output = '';
  grep.stdout.on('data', (data) => {
    output += data.toString();
  });

  grep.on('close', (code) => {
    console.log('   Filtered output:');
    console.log('   ' + output.trim().replace(/\n/g, '\n   '));
    console.log(`   Grep exited with code ${code}\n`);
    example4();
  });

  // Write multiple lines to grep's stdin
  grep.stdin.write('This is important\n');
  grep.stdin.write('This is not\n');
  grep.stdin.write('Another important line\n');
  grep.stdin.write('Skip this one\n');
  grep.stdin.end(); // Close stdin to signal EOF
}

// Example 4: Stream Transformation with Backpressure
function example4() {
  console.log('4. Stream Transformation with Backpressure Handling');
  console.log('   Processing large data with flow control\n');

  // Create a process that generates data
  const yes = spawn('yes', ['data-chunk']);

  let chunkCount = 0;
  const maxChunks = 100;

  // Transform stream with backpressure handling
  const processor = new Transform({
    highWaterMark: 16384, // 16KB buffer
    transform(chunk, encoding, callback) {
      chunkCount++;

      if (chunkCount >= maxChunks) {
        // Stop reading from source
        yes.kill();
      }

      // Simulate slow processing
      setTimeout(() => {
        this.push(`Processed chunk ${chunkCount}\n`);
        callback();
      }, 10);
    }
  });

  // Pipe with backpressure
  yes.stdout.pipe(processor);

  processor.on('data', (data) => {
    if (chunkCount % 25 === 0) {
      console.log(`   ${data.toString().trim()}`);
    }
  });

  yes.on('close', () => {
    console.log(`   Processed ${chunkCount} chunks with backpressure`);
    console.log('   Yes process terminated\n');
    example5();
  });

  yes.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      console.error('Error:', err);
    }
  });
}

// Example 5: Bidirectional Communication
function example5() {
  console.log('5. Bidirectional Communication');
  console.log('   Interactive communication with bc (calculator)\n');

  const bc = spawn('bc');

  let results = [];

  bc.stdout.on('data', (data) => {
    const result = data.toString().trim();
    results.push(result);
    console.log(`   Result: ${result}`);

    if (results.length === 3) {
      bc.stdin.end(); // Close when done
    }
  });

  bc.on('close', (code) => {
    console.log(`   Calculator exited with code ${code}\n`);
    example6();
  });

  // Send calculations
  console.log('   Sending: 5 + 3');
  bc.stdin.write('5 + 3\n');

  setTimeout(() => {
    console.log('   Sending: 10 * 7');
    bc.stdin.write('10 * 7\n');
  }, 100);

  setTimeout(() => {
    console.log('   Sending: 100 / 4');
    bc.stdin.write('100 / 4\n');
  }, 200);
}

// Example 6: Error Stream Handling
function example6() {
  console.log('6. Separate Handling of stdout and stderr');
  console.log('   Running a script that outputs to both streams\n');

  // Create a test script
  const fs = require('fs');
  const scriptPath = '/tmp/test-streams.sh';

  fs.writeFileSync(scriptPath, `#!/bin/bash
echo "This goes to stdout"
echo "This goes to stderr" >&2
echo "More stdout"
echo "More stderr" >&2
exit 0
  `);
  fs.chmodSync(scriptPath, 0o755);

  const child = spawn('bash', [scriptPath]);

  console.log('   STDOUT:');
  child.stdout.on('data', (data) => {
    console.log(`     ${data.toString().trim()}`);
  });

  console.log('   STDERR:');
  child.stderr.on('data', (data) => {
    console.log(`     ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    console.log(`\n   Process exited with code ${code}`);
    example7();
  });
}

// Example 7: Stream Multiplexing
function example7() {
  console.log('\n7. Stream Multiplexing');
  console.log('   Combining multiple process outputs\n');

  const { PassThrough } = require('stream');

  // Create a combined output stream
  const combined = new PassThrough();

  // Tag output with process name
  function createTaggedStream(tag) {
    return new Transform({
      transform(chunk, encoding, callback) {
        const lines = chunk.toString().split('\n');
        const tagged = lines
          .filter(line => line.length > 0)
          .map(line => `[${tag}] ${line}`)
          .join('\n') + '\n';
        this.push(tagged);
        callback();
      }
    });
  }

  // Start multiple processes
  const date = spawn('date');
  const whoami = spawn('whoami');
  const pwd = spawn('pwd');

  // Tag and merge outputs
  date.stdout.pipe(createTaggedStream('DATE')).pipe(combined);
  whoami.stdout.pipe(createTaggedStream('USER')).pipe(combined);
  pwd.stdout.pipe(createTaggedStream('PWD')).pipe(combined);

  // Collect all output
  combined.on('data', (data) => {
    console.log(`   ${data.toString().trim()}`);
  });

  // Wait for all to complete
  let completed = 0;
  const onClose = () => {
    completed++;
    if (completed === 3) {
      console.log('\n   All processes completed');
      console.log('\n=== All Examples Completed ===');
    }
  };

  date.on('close', onClose);
  whoami.on('close', onClose);
  pwd.on('close', onClose);
}

// Start the examples
basicPiping();
