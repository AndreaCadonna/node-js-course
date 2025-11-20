/**
 * EXAMPLE 6: Piping Between Processes
 *
 * This example demonstrates:
 * - Creating process pipelines
 * - Chaining multiple processes
 * - Error handling in pipelines
 * - Complex data flow patterns
 * - Stream composition
 */

const { spawn } = require('child_process');
const { Transform, pipeline } = require('stream');
const fs = require('fs');

console.log('=== Piping Between Processes Examples ===\n');

// Example 1: Basic Two-Process Pipeline
function basicPipeline() {
  console.log('1. Basic Two-Process Pipeline');
  console.log('   cat | grep pattern\n');

  // Create sample file
  fs.writeFileSync('/tmp/sample.txt', `
apple
banana
apricot
grape
avocado
orange
  `.trim());

  const cat = spawn('cat', ['/tmp/sample.txt']);
  const grep = spawn('grep', ['^a']); // Lines starting with 'a'

  // Pipe cat output to grep input
  cat.stdout.pipe(grep.stdin);

  console.log('   Results:');
  grep.stdout.on('data', (data) => {
    console.log(`   ${data.toString().trim()}`);
  });

  grep.on('close', (code) => {
    console.log(`   Pipeline completed with code ${code}\n`);
    example2();
  });

  // Handle errors
  cat.on('error', (err) => console.error('Cat error:', err));
  grep.on('error', (err) => console.error('Grep error:', err));
}

// Example 2: Three-Process Pipeline
function example2() {
  console.log('2. Three-Process Pipeline');
  console.log('   cat | grep | wc\n');

  fs.writeFileSync('/tmp/log.txt', `
ERROR: Connection failed
INFO: Server started
ERROR: Database timeout
WARNING: High CPU
ERROR: Memory leak
INFO: Request completed
ERROR: Network error
  `.trim());

  const cat = spawn('cat', ['/tmp/log.txt']);
  const grep = spawn('grep', ['ERROR']);
  const wc = spawn('wc', ['-l']);

  // Build pipeline
  cat.stdout.pipe(grep.stdin);
  grep.stdout.pipe(wc.stdin);

  let count = '';
  wc.stdout.on('data', (data) => {
    count += data.toString();
  });

  wc.on('close', (code) => {
    console.log(`   Found ${count.trim()} ERROR lines`);
    console.log(`   Pipeline exit code: ${code}\n`);
    example3();
  });
}

// Example 3: Pipeline with Transformation
function example3() {
  console.log('3. Pipeline with Transform Stream');
  console.log('   cat | transform | process\n');

  fs.writeFileSync('/tmp/numbers.txt', '1\n2\n3\n4\n5\n6\n7\n8\n9\n10');

  const cat = spawn('cat', ['/tmp/numbers.txt']);

  // Transform stream to square numbers
  const squareTransform = new Transform({
    transform(chunk, encoding, callback) {
      const lines = chunk.toString().split('\n');
      const squared = lines
        .filter(line => line.trim())
        .map(line => {
          const num = parseInt(line);
          return `${num} -> ${num * num}`;
        })
        .join('\n') + '\n';

      this.push(squared);
      callback();
    }
  });

  console.log('   Squared numbers:');
  cat.stdout
    .pipe(squareTransform)
    .pipe(process.stdout);

  cat.on('close', () => {
    console.log('   Transformation complete\n');
    example4();
  });
}

// Example 4: Bidirectional Piping
function example4() {
  console.log('4. Bidirectional Communication Pipeline');
  console.log('   Node -> bc (calculator) -> Node\n');

  const bc = spawn('bc');

  // Transform for calculations
  const calculations = ['5 + 3', '10 * 7', '100 / 4', 'quit'];
  let index = 0;

  bc.stdout.on('data', (data) => {
    const result = data.toString().trim();
    if (result) {
      console.log(`   ${calculations[index - 1]} = ${result}`);
    }
  });

  // Send calculations
  const interval = setInterval(() => {
    if (index < calculations.length) {
      const calc = calculations[index];
      console.log(`   Sending: ${calc}`);
      bc.stdin.write(calc + '\n');
      index++;
    } else {
      clearInterval(interval);
      bc.stdin.end();
    }
  }, 200);

  bc.on('close', () => {
    console.log('   Calculator pipeline closed\n');
    example5();
  });
}

// Example 5: Complex Multi-Stage Pipeline
function example5() {
  console.log('5. Complex Multi-Stage Pipeline');
  console.log('   Processing log files with multiple stages\n');

  // Create complex log file
  fs.writeFileSync('/tmp/access.log', `
192.168.1.1 - - [01/Jan/2025:10:00:00] "GET /api/users" 200
192.168.1.2 - - [01/Jan/2025:10:00:01] "POST /api/login" 401
192.168.1.1 - - [01/Jan/2025:10:00:02] "GET /api/data" 500
192.168.1.3 - - [01/Jan/2025:10:00:03] "GET /api/users" 200
192.168.1.2 - - [01/Jan/2025:10:00:04] "POST /api/login" 200
192.168.1.4 - - [01/Jan/2025:10:00:05] "GET /api/admin" 403
192.168.1.1 - - [01/Jan/2025:10:00:06] "DELETE /api/user/1" 500
  `.trim());

  console.log('   Stage 1: Extract error responses (4xx, 5xx)');
  console.log('   Stage 2: Extract IP addresses');
  console.log('   Stage 3: Count unique IPs\n');

  const cat = spawn('cat', ['/tmp/access.log']);
  const grepErrors = spawn('grep', ['-E', '" (4|5)[0-9][0-9]$']);
  const cutIp = spawn('cut', ['-d', ' ', '-f', '1']);
  const sort = spawn('sort');
  const uniq = spawn('uniq', ['-c']);

  // Build the pipeline
  cat.stdout.pipe(grepErrors.stdin);
  grepErrors.stdout.pipe(cutIp.stdin);
  cutIp.stdout.pipe(sort.stdin);
  sort.stdout.pipe(uniq.stdin);

  console.log('   Error IPs (count IP):');
  uniq.stdout.on('data', (data) => {
    console.log(`   ${data.toString().trim()}`);
  });

  uniq.on('close', (code) => {
    console.log(`   Pipeline completed with code ${code}\n`);
    example6();
  });
}

// Example 6: Error Handling in Pipelines
function example6() {
  console.log('6. Error Handling in Pipelines');
  console.log('   Handling failures at different stages\n');

  // Simulate a failing pipeline
  const goodProcess = spawn('echo', ['hello']);
  const badProcess = spawn('nonexistent-command');
  const finalProcess = spawn('cat');

  let errorOccurred = false;

  // Try to build pipeline
  goodProcess.stdout.pipe(badProcess.stdin);
  badProcess.stdout.pipe(finalProcess.stdin);

  // Handle errors at each stage
  goodProcess.on('error', (err) => {
    console.log(`   Stage 1 error: ${err.message}`);
    errorOccurred = true;
  });

  badProcess.on('error', (err) => {
    console.log(`   Stage 2 error: ${err.message}`);
    errorOccurred = true;
  });

  finalProcess.on('error', (err) => {
    console.log(`   Stage 3 error: ${err.message}`);
    errorOccurred = true;
  });

  // Cleanup on any exit
  const onExit = (stage) => {
    return (code, signal) => {
      if (code !== 0 && code !== null) {
        console.log(`   Stage ${stage} exited with code ${code}`);
      }
    };
  };

  goodProcess.on('exit', onExit(1));
  badProcess.on('exit', onExit(2));
  finalProcess.on('exit', onExit(3));

  setTimeout(() => {
    if (errorOccurred) {
      console.log('   Pipeline failed, cleaning up...');
    }

    // Kill any remaining processes
    [goodProcess, badProcess, finalProcess].forEach(p => {
      if (!p.killed) p.kill();
    });

    example7();
  }, 1000);
}

// Example 7: Using Node.js pipeline() for Better Error Handling
function example7() {
  console.log('\n7. Using Node.js pipeline() Utility');
  console.log('   Better error handling and cleanup\n');

  fs.writeFileSync('/tmp/data.txt', 'hello\nworld\nfrom\npipeline');

  const cat = spawn('cat', ['/tmp/data.txt']);
  const tr = spawn('tr', ['a-z', 'A-Z']); // Convert to uppercase

  // Create a writable destination
  const output = [];
  const { Writable } = require('stream');
  const destination = new Writable({
    write(chunk, encoding, callback) {
      output.push(chunk.toString());
      callback();
    }
  });

  // Use pipeline for automatic error handling
  pipeline(
    cat.stdout,
    tr.stdin,
    tr.stdout,
    destination,
    (err) => {
      if (err) {
        console.error('   Pipeline error:', err.message);
      } else {
        console.log('   Pipeline succeeded!');
        console.log('   Output:', output.join('').trim());
      }

      // Cleanup
      [cat, tr].forEach(p => {
        if (!p.killed) p.kill();
      });

      example8();
    }
  );
}

// Example 8: Dynamic Pipeline Construction
function example8() {
  console.log('\n8. Dynamic Pipeline Construction');
  console.log('   Building pipelines programmatically\n');

  class PipelineBuilder {
    constructor() {
      this.stages = [];
    }

    add(command, args = []) {
      this.stages.push({ command, args });
      return this;
    }

    execute(callback) {
      if (this.stages.length === 0) {
        return callback(new Error('Empty pipeline'));
      }

      console.log('   Pipeline stages:');
      this.stages.forEach((stage, i) => {
        console.log(`     ${i + 1}. ${stage.command} ${stage.args.join(' ')}`);
      });
      console.log();

      // Spawn all processes
      const processes = this.stages.map(stage =>
        spawn(stage.command, stage.args)
      );

      // Connect the pipeline
      for (let i = 0; i < processes.length - 1; i++) {
        processes[i].stdout.pipe(processes[i + 1].stdin);
      }

      // Collect output from last process
      let output = '';
      const lastProcess = processes[processes.length - 1];

      lastProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      lastProcess.on('close', (code) => {
        // Kill all processes
        processes.forEach(p => {
          if (!p.killed) p.kill();
        });

        callback(null, output, code);
      });

      // Error handling
      processes.forEach((proc, i) => {
        proc.on('error', (err) => {
          callback(new Error(`Stage ${i + 1} error: ${err.message}`));
        });
      });
    }
  }

  // Example: Create a dynamic pipeline
  fs.writeFileSync('/tmp/words.txt', 'apple\nbanana\napricot\navocado\ngrape');

  const builder = new PipelineBuilder()
    .add('cat', ['/tmp/words.txt'])
    .add('grep', ['^a'])
    .add('sort')
    .add('wc', ['-l']);

  builder.execute((err, output, code) => {
    if (err) {
      console.error('   Error:', err.message);
    } else {
      console.log(`   Result: ${output.trim()} words starting with 'a'`);
      console.log(`   Exit code: ${code}`);
    }

    console.log('\n=== All Examples Completed ===');
    console.log('\nKey Concepts:');
    console.log('- Process pipelines chain stdout to stdin');
    console.log('- Transform streams can modify data in pipeline');
    console.log('- Error handling critical in multi-stage pipelines');
    console.log('- pipeline() utility provides better error handling');
    console.log('- Pipelines can be constructed dynamically');
  });
}

// Start the examples
basicPipeline();
