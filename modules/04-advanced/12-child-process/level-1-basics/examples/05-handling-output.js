/**
 * Example 5: Handling Process Output
 *
 * Demonstrates different ways to handle stdout, stderr, and exit codes
 * from child processes.
 */

const { spawn, exec } = require('child_process');

console.log('=== Handling Process Output ===\n');

// 1. Basic stdout handling
console.log('1. Handling stdout');
const echo = spawn('echo', ['Hello World']);

echo.stdout.on('data', (data) => {
  console.log(`stdout (raw): ${data}`);
  console.log(`stdout (trimmed): ${data.toString().trim()}`);
});

echo.on('close', (code) => {
  console.log(`Exit code: ${code}\n`);
});

// 2. Handling stderr
setTimeout(() => {
  console.log('2. Handling stderr');
  const nodeErr = spawn('node', ['-e', 'console.error("This is an error message")']);

  nodeErr.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  nodeErr.stderr.on('data', (data) => {
    console.error(`stderr: ${data.toString().trim()}`);
  });

  nodeErr.on('close', (code) => {
    console.log(`Exit code: ${code}\n`);
  });
}, 500);

// 3. Collecting all output
setTimeout(() => {
  console.log('3. Collecting all output');
  const ls = spawn('ls', ['-lh']);

  let stdout = '';
  let stderr = '';

  ls.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  ls.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  ls.on('close', (code) => {
    console.log('All output collected:');
    console.log(stdout);
    if (stderr) {
      console.error('Errors:', stderr);
    }
    console.log(`Exit code: ${code}\n`);
  });
}, 1000);

// 4. Handling chunked output
setTimeout(() => {
  console.log('4. Handling chunked output');
  const find = spawn('find', ['.', '-name', '*.js']);

  let chunkCount = 0;
  let lineCount = 0;

  find.stdout.on('data', (chunk) => {
    chunkCount++;
    const lines = chunk.toString().split('\n').filter(l => l);
    lineCount += lines.length;
    console.log(`Chunk #${chunkCount}: ${lines.length} files`);
  });

  find.on('close', (code) => {
    console.log(`Total files: ${lineCount}`);
    console.log(`Received in ${chunkCount} chunks`);
    console.log(`Exit code: ${code}\n`);
  });
}, 1500);

// 5. Different exit codes
setTimeout(() => {
  console.log('5. Understanding exit codes');

  // Success (exit code 0)
  exec('exit 0', (error, stdout, stderr) => {
    console.log('Command "exit 0":');
    console.log(`  Error: ${error}`);
    console.log(`  Exit code: 0 (success)\n`);
  });

  // Failure (exit code 1)
  setTimeout(() => {
    exec('exit 1', (error, stdout, stderr) => {
      console.log('Command "exit 1":');
      console.log(`  Error exists: ${!!error}`);
      console.log(`  Exit code: ${error ? error.code : 'N/A'}`);
      console.log(`  Meaning: General error\n`);
    });
  }, 300);

  // Command not found (exit code 127)
  setTimeout(() => {
    exec('nonexistentcommand', (error, stdout, stderr) => {
      console.log('Command "nonexistentcommand":');
      console.log(`  Error: ${error.message}`);
      console.log(`  Exit code: ${error.code}`);
      console.log(`  Meaning: Command not found\n`);
    });
  }, 600);
}, 3000);

// 6. Exit event vs close event
setTimeout(() => {
  console.log('6. Exit vs Close events');
  const sleep = spawn('sleep', ['1']);

  sleep.on('exit', (code, signal) => {
    console.log(`Exit event - code: ${code}, signal: ${signal}`);
  });

  sleep.on('close', (code, signal) => {
    console.log(`Close event - code: ${code}, signal: ${signal}`);
    console.log('Note: Close fires after stdio streams are closed\n');
  });
}, 4500);

// 7. Handling process signals
setTimeout(() => {
  console.log('7. Process killed by signal');
  const longProcess = spawn('sleep', ['10']);

  // Kill it after 500ms
  setTimeout(() => {
    console.log('Sending SIGTERM...');
    longProcess.kill('SIGTERM');
  }, 500);

  longProcess.on('exit', (code, signal) => {
    console.log(`Process terminated:`);
    console.log(`  Exit code: ${code}`);
    console.log(`  Signal: ${signal}\n`);
  });
}, 6500);

// 8. Buffered vs streaming output comparison
setTimeout(() => {
  console.log('8. Buffered (exec) vs Streaming (spawn)');

  console.log('Using exec (buffered):');
  const startExec = Date.now();
  exec('ls -lh', (error, stdout, stderr) => {
    const timeExec = Date.now() - startExec;
    console.log(`  Received all output at once (${stdout.length} bytes)`);
    console.log(`  Time: ${timeExec}ms\n`);

    // Now compare with spawn
    console.log('Using spawn (streaming):');
    const startSpawn = Date.now();
    const lsSpawn = spawn('ls', ['-lh']);
    let totalBytes = 0;
    let chunks = 0;

    lsSpawn.stdout.on('data', (data) => {
      totalBytes += data.length;
      chunks++;
    });

    lsSpawn.on('close', () => {
      const timeSpawn = Date.now() - startSpawn;
      console.log(`  Received in ${chunks} chunks (${totalBytes} bytes)`);
      console.log(`  Time: ${timeSpawn}ms\n`);

      showNotes();
    });
  });
}, 8000);

function showNotes() {
  setTimeout(() => {
    console.log('=== Important Notes ===');
    console.log('stdout:');
    console.log('  ✓ Standard output stream');
    console.log('  ✓ Normal program output');
    console.log('  ✓ Listen with .stdout.on("data", ...)');
    console.log('');
    console.log('stderr:');
    console.log('  ✓ Standard error stream');
    console.log('  ✓ Error messages and diagnostics');
    console.log('  ✓ Listen with .stderr.on("data", ...)');
    console.log('  ✓ stderr output does NOT mean the command failed');
    console.log('');
    console.log('Exit codes:');
    console.log('  ✓ 0 = Success');
    console.log('  ✓ 1 = General error');
    console.log('  ✓ 2 = Misuse of shell command');
    console.log('  ✓ 126 = Command cannot execute');
    console.log('  ✓ 127 = Command not found');
    console.log('  ✓ null = Killed by signal');
    console.log('');
    console.log('Events:');
    console.log('  ✓ "exit" = Process finished (code/signal available)');
    console.log('  ✓ "close" = All stdio streams closed');
    console.log('  ✓ "close" fires after "exit"');
    console.log('  ✓ Usually listen to "close" for completion');
  }, 500);
}
