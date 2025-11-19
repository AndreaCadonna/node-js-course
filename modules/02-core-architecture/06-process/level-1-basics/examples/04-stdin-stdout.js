/**
 * 04-stdin-stdout.js
 * ===================
 * Demonstrates reading from stdin and writing to stdout using process streams
 *
 * Key Concepts:
 * - Understanding standard input (stdin)
 * - Writing to standard output (stdout)
 * - Interactive CLI programs
 * - Piping data between programs
 * - Building command-line filters
 *
 * Run: node 04-stdin-stdout.js
 * Run with pipe: echo "Hello World" | node 04-stdin-stdout.js
 * Run with redirect: node 04-stdin-stdout.js < input.txt
 */

console.log('=== Standard Input/Output Example ===\n');

// =============================================================================
// UNDERSTANDING STDIN AND STDOUT
// =============================================================================

console.log('--- Understanding stdin and stdout ---\n');

// process.stdin: A readable stream for standard input
// process.stdout: A writable stream for standard output

console.log('Standard streams:');
console.log(`  stdin is a Readable stream: ${process.stdin.readable}`);
console.log(`  stdout is a Writable stream: ${process.stdout.writable}`);
console.log(`  stdin is TTY: ${process.stdin.isTTY}`); // TTY = terminal
console.log(`  stdout is TTY: ${process.stdout.isTTY}`);
console.log();

// =============================================================================
// WRITING TO STDOUT
// =============================================================================

console.log('--- Writing to stdout ---\n');

// Method 1: console.log() - Most common, adds newline
console.log('Using console.log()');

// Method 2: process.stdout.write() - No automatic newline, more control
process.stdout.write('Using process.stdout.write() - ');
process.stdout.write('same line!\n');

// Difference between console.log and process.stdout.write
console.log('\nDifference demonstration:');
process.stdout.write('1');
process.stdout.write('2');
process.stdout.write('3');
process.stdout.write('\n'); // Manual newline needed

console.log('4');
console.log('5');
console.log('6');
console.log(); // Empty line

// =============================================================================
// READING FROM STDIN
// =============================================================================

console.log('--- Reading from stdin ---\n');

// Check if data is being piped to stdin
if (!process.stdin.isTTY) {
  // Data is being piped or redirected
  console.log('Detected piped input. Reading data...\n');

  // Set encoding to get strings instead of buffers
  process.stdin.setEncoding('utf8');

  let inputData = '';

  // Listen for data chunks
  process.stdin.on('data', (chunk) => {
    console.log(`[Received chunk: ${chunk.length} bytes]`);
    inputData += chunk;
  });

  // Listen for end of input
  process.stdin.on('end', () => {
    console.log('\n[End of input reached]');
    console.log(`\nTotal data received: ${inputData.length} bytes`);
    console.log('Data content:');
    console.log('─'.repeat(50));
    console.log(inputData.trim());
    console.log('─'.repeat(50));
  });
} else {
  // Running interactively in terminal
  console.log('Running in interactive mode.');
  console.log('You can type input and press Enter (Ctrl+D to end).\n');

  // Enable interactive input
  process.stdin.setEncoding('utf8');

  console.log('Type something:');

  let lineCount = 0;

  process.stdin.on('data', (data) => {
    lineCount++;
    const input = data.trim();

    console.log(`You typed: "${input}"`);
    console.log(`Length: ${input.length} characters`);
    console.log(`Line count: ${lineCount}\n`);

    // Exit condition
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('Goodbye!');
      process.exit(0);
    }

    console.log('Type something (or "exit" to quit):');
  });

  process.stdin.on('end', () => {
    console.log('\nReceived EOF (Ctrl+D). Exiting...');
    process.exit(0);
  });
}

// =============================================================================
// PRACTICAL EXAMPLE: LINE-BY-LINE PROCESSING
// =============================================================================

// Note: The following example shows how to process stdin line-by-line
// For actual implementation, consider using 'readline' module

/**
 * Simple line processor using stdin
 */
function createLineProcessor() {
  let buffer = '';

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    buffer += chunk;

    // Split buffer into lines
    let lines = buffer.split('\n');

    // Keep the last incomplete line in the buffer
    buffer = lines.pop() || '';

    // Process complete lines
    lines.forEach((line) => {
      processLine(line);
    });
  });

  process.stdin.on('end', () => {
    // Process any remaining data in buffer
    if (buffer.length > 0) {
      processLine(buffer);
    }
  });
}

function processLine(line) {
  // Example processing: echo line with line number
  // (This would be called if stdin is not a TTY)
  // Commented out to avoid interference with the main example
  // process.stdout.write(`Processed: ${line}\n`);
}

// =============================================================================
// Additional Notes:
// =============================================================================

console.log('\n=== Key Takeaways ===');
console.log('• process.stdin is a readable stream for input');
console.log('• process.stdout is a writable stream for output');
console.log('• console.log() writes to stdout with automatic newline');
console.log('• process.stdout.write() gives more control (no auto newline)');
console.log('• Check process.stdin.isTTY to detect piped vs terminal input');
console.log('• Use setEncoding() to receive strings instead of buffers');

console.log('\n=== Try These Commands ===');
console.log('1. Pipe text to this script:');
console.log('   echo "Hello World" | node 04-stdin-stdout.js');
console.log('');
console.log('2. Pipe file contents:');
console.log('   cat package.json | node 04-stdin-stdout.js');
console.log('');
console.log('3. Redirect file as input:');
console.log('   node 04-stdin-stdout.js < package.json');
console.log('');
console.log('4. Chain multiple commands:');
console.log('   ls -la | node 04-stdin-stdout.js');
console.log('');
console.log('5. Interactive mode:');
console.log('   node 04-stdin-stdout.js');
console.log('   (Then type and press Enter)');

/**
 * ADVANCED PATTERNS:
 *
 * 1. Building a grep-like filter:
 *    process.stdin.on('data', (chunk) => {
 *      const lines = chunk.toString().split('\n');
 *      lines.forEach(line => {
 *        if (line.includes(searchTerm)) {
 *          process.stdout.write(line + '\n');
 *        }
 *      });
 *    });
 *
 * 2. Building a word count tool:
 *    let wordCount = 0;
 *    process.stdin.on('data', (chunk) => {
 *      const words = chunk.toString().split(/\s+/).filter(Boolean);
 *      wordCount += words.length;
 *    });
 *    process.stdin.on('end', () => {
 *      console.log(`Total words: ${wordCount}`);
 *    });
 *
 * 3. Building a JSON validator:
 *    let jsonString = '';
 *    process.stdin.on('data', (chunk) => {
 *      jsonString += chunk;
 *    });
 *    process.stdin.on('end', () => {
 *      try {
 *        JSON.parse(jsonString);
 *        console.log('Valid JSON');
 *        process.exit(0);
 *      } catch (error) {
 *        console.error('Invalid JSON:', error.message);
 *        process.exit(1);
 *      }
 *    });
 *
 * 4. Interactive prompt (better with readline module):
 *    const readline = require('readline');
 *    const rl = readline.createInterface({
 *      input: process.stdin,
 *      output: process.stdout
 *    });
 *
 *    rl.question('What is your name? ', (answer) => {
 *      console.log(`Hello, ${answer}!`);
 *      rl.close();
 *    });
 *
 * 5. Progress indicator:
 *    let progress = 0;
 *    const interval = setInterval(() => {
 *      process.stdout.clearLine(0);
 *      process.stdout.cursorTo(0);
 *      process.stdout.write(`Processing: ${progress}%`);
 *      progress += 10;
 *      if (progress > 100) clearInterval(interval);
 *    }, 100);
 *
 * PIPING AND REDIRECTION:
 *
 * Pipe output to another command:
 *   node script.js | grep "pattern"
 *   node script.js | wc -l
 *   node script.js | tee output.txt
 *
 * Redirect output to file:
 *   node script.js > output.txt        (overwrite)
 *   node script.js >> output.txt       (append)
 *
 * Redirect stderr separately:
 *   node script.js 2> errors.txt       (errors only)
 *   node script.js > out.txt 2> err.txt (separate files)
 *   node script.js > all.txt 2>&1      (combine stdout and stderr)
 *
 * Redirect input from file:
 *   node script.js < input.txt
 *
 * Combine input and output:
 *   node script.js < input.txt > output.txt
 */
