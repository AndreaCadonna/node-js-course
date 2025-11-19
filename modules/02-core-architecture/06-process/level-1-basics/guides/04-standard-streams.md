# Standard Streams

## Introduction

This guide provides an in-depth look at standard streams (stdin, stdout, stderr) in Node.js. You'll learn what they are, how they work, and how to use them effectively for input/output operations and building interactive CLI tools.

---

## What Are Standard Streams?

### Definition

Standard streams are **pre-opened communication channels** between your program and its environment. Every process has three standard streams:

1. **stdin** (standard input) - Input stream (file descriptor 0)
2. **stdout** (standard output) - Output stream (file descriptor 1)
3. **stderr** (standard error) - Error output stream (file descriptor 2)

```javascript
// Access in Node.js
process.stdin   // Readable stream
process.stdout  // Writable stream
process.stderr  // Writable stream

// They're always available, no require needed
```

### Key Characteristics

1. **Pre-opened** - Already connected when process starts
2. **File descriptors** - Low-level OS handles (0, 1, 2)
3. **Streams** - Readable/Writable stream objects
4. **Universal** - Work the same on all platforms
5. **Pipeable** - Can be redirected and piped

---

## Real-World Analogies

### Analogy 1: Restaurant Communication

**Your program is a restaurant kitchen:**

- **stdin** → Order tickets coming in (input from customers)
- **stdout** → Completed dishes going out (results to customers)
- **stderr** → Kitchen manager announcements (errors, warnings)

Orders come in, food goes out, problems announced separately.

### Analogy 2: Mail System

**Your program is a house:**

- **stdin** → Mailbox (receive mail)
- **stdout** → Outgoing mail slot (send mail)
- **stderr** → Emergency notification system (alerts)

Regular mail goes to the mailbox, urgent alerts use a separate channel.

### Analogy 3: TV Broadcasting

**Your program is a TV station:**

- **stdin** → Viewer feedback/input
- **stdout** → Main program broadcast
- **stderr** → Emergency broadcast system

Normal content on main channel, emergencies on separate system.

---

## Understanding the Three Streams

### Visual Model

```
┌─────────────────────────────────────┐
│     Terminal / Shell / User         │
│                                     │
│  User types here ──┐                │
│                    │                │
└────────────────────┼────────────────┘
                     │
              ┌──────▼──────┐
              │    stdin    │ (fd: 0)
              │  (Input)    │
              └──────┬──────┘
                     │
              ┌──────▼───────────────┐
              │   Your Node.js       │
              │   Application        │
              └──────┬───────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
    ┌────▼─────┐          ┌──────▼──────┐
    │  stdout  │          │   stderr    │
    │ (Output) │ (fd: 1)  │  (Errors)   │ (fd: 2)
    └────┬─────┘          └──────┬──────┘
         │                       │
         └───────────┬───────────┘
                     │
┌────────────────────▼────────────────┐
│        Terminal Display             │
│                                     │
│  Results and errors appear here    │
└─────────────────────────────────────┘
```

---

## process.stdout (Standard Output)

### What It Is

**stdout** is where your program writes its normal output - results, data, information.

```javascript
// These all use stdout
console.log('Hello');           // Uses stdout internally
process.stdout.write('Hello');  // Direct write to stdout

// Both appear in terminal/console
```

### Writing to stdout

```javascript
// Method 1: console.log
console.log('Hello, World!');           // Adds newline
console.log('Value:', 42);              // Multiple args
console.log({ name: 'John' });         // Objects formatted

// Method 2: process.stdout.write
process.stdout.write('Hello');          // No newline
process.stdout.write('Hello\n');        // Manual newline
process.stdout.write(Buffer.from('Hi')); // Binary data

// Difference:
console.log('Hi');           // "Hi\n" (adds newline)
process.stdout.write('Hi');  // "Hi" (no newline)
```

### When to Use stdout

```javascript
// Program results
console.log('Processing complete');
console.log('Total:', count);

// Data output
const users = getUsers();
console.log(JSON.stringify(users));

// Progress indicators
process.stdout.write(`Progress: ${percent}%\r`); // Overwrite line

// Piped data
data.forEach(item => {
  console.log(item); // Can be piped to other programs
});
```

---

## process.stderr (Standard Error)

### What It Is

**stderr** is a separate channel for error messages, warnings, and diagnostic information.

```javascript
// Error messages go to stderr
console.error('Error: File not found');
console.warn('Warning: Deprecated API');

// Direct write
process.stderr.write('Error!\n');
```

### Why Separate Stream?

Having a separate error stream allows:

1. **Filter errors separately** from output
2. **Redirect independently** (errors to log, output to file)
3. **Show errors immediately** (stderr usually unbuffered)
4. **Distinguish data from diagnostics**

```bash
# Redirect stdout to file, stderr to terminal
node app.js > output.txt

# Redirect both separately
node app.js > output.txt 2> errors.txt

# Discard stdout, show only errors
node app.js > /dev/null
```

### When to Use stderr

```javascript
// Errors
if (!file) {
  console.error('Error: File not found');
  process.exit(1);
}

// Warnings
console.warn('Warning: Using deprecated feature');

// Debug/diagnostic messages
if (verbose) {
  console.error('Debug: Processing file:', filename);
}

// Progress (so it doesn't mix with output data)
process.stderr.write(`Processing: ${current}/${total}\r`);

// Usage messages
function showHelp() {
  console.error('Usage: node app.js <file>');
  console.error('Options:');
  console.error('  --help    Show this message');
}
```

---

## process.stdin (Standard Input)

### What It Is

**stdin** is how your program receives input - from keyboard, pipe, or file redirection.

```javascript
// stdin is a Readable stream
process.stdin.on('data', (chunk) => {
  console.log('Received:', chunk.toString());
});

// Enable reading
process.stdin.resume();
```

### Reading from stdin

#### Line-by-Line Reading

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on('line', (line) => {
  console.log(`You typed: ${line}`);

  if (line === 'quit') {
    rl.close();
  }
});

rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});
```

#### Reading All Input

```javascript
// Read until EOF (Ctrl+D or pipe ends)
let data = '';

process.stdin.on('data', (chunk) => {
  data += chunk;
});

process.stdin.on('end', () => {
  console.log('Received:', data);
  // Process complete input
});
```

#### Prompting for Input

```javascript
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Using promises
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const name = await question('What is your name? ');
  const age = await question('How old are you? ');

  console.log(`Hello ${name}, you are ${age} years old`);

  rl.close();
}

main();
```

### When to Use stdin

```javascript
// Interactive CLI tools
rl.question('Enter filename: ', (filename) => {
  processFile(filename);
});

// Piped input
// echo "hello" | node app.js
process.stdin.on('data', processData);

// Reading from file redirection
// node app.js < input.txt
let content = '';
process.stdin.on('data', chunk => content += chunk);
process.stdin.on('end', () => process(content));

// Building filters (UNIX pipeline style)
// cat data.txt | node filter.js | node process.js
```

---

## Practical Examples

### Example 1: Simple Echo Program

```javascript
// echo.js - Echo user input
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

console.log('Echo program. Type "exit" to quit.');
rl.prompt();

rl.on('line', (line) => {
  const trimmed = line.trim();

  if (trimmed === 'exit') {
    console.log('Goodbye!');
    process.exit(0);
  }

  console.log(`You said: ${trimmed}`);
  rl.prompt();
});
```

### Example 2: Line Counter (wc -l clone)

```javascript
// count-lines.js - Count lines in input
let lineCount = 0;
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();

  // Count newlines
  const lines = buffer.split('\n');
  lineCount += lines.length - 1;

  // Keep incomplete line
  buffer = lines[lines.length - 1];
});

process.stdin.on('end', () => {
  // Count last line if exists
  if (buffer.length > 0) {
    lineCount++;
  }

  console.log(`Lines: ${lineCount}`);
});
```

```bash
# Usage
cat file.txt | node count-lines.js
node count-lines.js < file.txt
echo -e "line1\nline2\nline3" | node count-lines.js
```

### Example 3: Uppercase Filter

```javascript
// uppercase.js - Convert stdin to uppercase
process.stdin.on('data', (chunk) => {
  const uppercase = chunk.toString().toUpperCase();
  process.stdout.write(uppercase);
});

process.stdin.on('end', () => {
  process.stderr.write('Conversion complete\n');
});
```

```bash
# Usage
echo "hello world" | node uppercase.js
cat file.txt | node uppercase.js
node uppercase.js < input.txt > output.txt
```

### Example 4: Interactive Menu

```javascript
// menu.js - Interactive menu system
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function showMenu() {
  console.log('\n=== Main Menu ===');
  console.log('1. Option One');
  console.log('2. Option Two');
  console.log('3. Option Three');
  console.log('0. Exit');
  console.log('');
}

function handleChoice(choice) {
  switch (choice.trim()) {
    case '1':
      console.log('You selected Option One');
      break;
    case '2':
      console.log('You selected Option Two');
      break;
    case '3':
      console.log('You selected Option Three');
      break;
    case '0':
      console.log('Goodbye!');
      rl.close();
      return;
    default:
      console.error('Invalid choice');
  }

  promptChoice();
}

function promptChoice() {
  rl.question('Select option: ', handleChoice);
}

showMenu();
promptChoice();
```

### Example 5: Progress Bar

```javascript
// progress.js - Show progress bar
function showProgress(current, total, label = 'Progress') {
  const percent = Math.floor((current / total) * 100);
  const filled = Math.floor(percent / 2);
  const empty = 50 - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  // Write to stderr so it doesn't mix with stdout data
  process.stderr.write(`\r${label}: [${bar}] ${percent}%`);

  if (current >= total) {
    process.stderr.write('\n');
  }
}

// Example usage
async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    // Process item
    await processItem(items[i]);

    // Show progress on stderr
    showProgress(i + 1, items.length);

    // Output result on stdout (can be piped)
    console.log(items[i].result);
  }
}

// Usage allows: node progress.js > results.txt
// Progress shown in terminal, results in file
```

### Example 6: JSON Stream Processor

```javascript
// json-processor.js - Process JSON objects from stdin
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();

  // Process complete JSON objects
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newlineIndex);
    buffer = buffer.slice(newlineIndex + 1);

    if (line.trim()) {
      try {
        const obj = JSON.parse(line);

        // Process object
        obj.processed = true;
        obj.timestamp = Date.now();

        // Output to stdout
        console.log(JSON.stringify(obj));
      } catch (err) {
        // Errors to stderr
        console.error('Invalid JSON:', line);
      }
    }
  }
});

process.stdin.on('end', () => {
  process.stderr.write('Processing complete\n');
});
```

```bash
# Usage
echo '{"name":"John"}' | node json-processor.js
cat data.jsonl | node json-processor.js
```

---

## Stream Redirection

### Understanding Redirection

```bash
# Redirect stdout to file
node app.js > output.txt

# Redirect stderr to file
node app.js 2> errors.txt

# Redirect both to same file
node app.js > all.txt 2>&1

# Redirect both to different files
node app.js > output.txt 2> errors.txt

# Discard output
node app.js > /dev/null

# Discard errors
node app.js 2> /dev/null

# Discard everything
node app.js > /dev/null 2>&1
```

### Piping

```bash
# Pipe stdout to another program
node app.js | grep "error"

# Chain multiple programs
cat data.txt | node filter.js | node process.js | node output.js

# Tee (output to file AND screen)
node app.js | tee output.txt

# Separate stdout and stderr in pipeline
node app.js 2>&1 | grep "error"
```

### Example: Proper Separation

```javascript
// logger.js - Shows value of separate streams
function log(message) {
  // Data goes to stdout (can be piped)
  console.log(message);
}

function error(message) {
  // Errors to stderr (separate from data)
  console.error(message);
}

function process(data) {
  error('Processing started...');  // Status message

  data.forEach((item, i) => {
    if (item.valid) {
      log(JSON.stringify(item));  // Output data
    } else {
      error(`Warning: Invalid item at index ${i}`);  // Error
    }
  });

  error('Processing complete');  // Status message
}

// Usage:
// node logger.js > data.json
// Data goes to file, messages stay in terminal
```

---

## Advanced Techniques

### 1. TTY Detection

Check if running in terminal or being piped:

```javascript
// Check if stdout is a terminal (TTY)
if (process.stdout.isTTY) {
  // Running in terminal - can use colors, cursor movement
  console.log('\x1b[32mGreen text\x1b[0m');
  process.stdout.write('\rUpdating...');
} else {
  // Being piped or redirected - plain output
  console.log('Plain text only');
}

// Check stdin
if (process.stdin.isTTY) {
  // Reading from keyboard
  console.log('Interactive mode');
} else {
  // Reading from pipe or file
  console.log('Pipe mode');
}
```

### 2. Raw Mode (Terminal Input)

```javascript
// Raw mode for character-by-character input
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}

process.stdin.on('data', (chunk) => {
  const char = chunk.toString();

  if (char === '\u0003') { // Ctrl+C
    process.exit();
  }

  console.log('Key pressed:', char.charCodeAt(0));
});
```

### 3. Colors and Formatting

```javascript
// ANSI escape codes (only if TTY)
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function colorize(text, color) {
  if (process.stdout.isTTY) {
    return `${colors[color]}${text}${colors.reset}`;
  }
  return text;
}

console.log(colorize('Success!', 'green'));
console.error(colorize('Error!', 'red'));
```

### 4. Cursor Control

```javascript
// Cursor movement (only in TTY)
if (process.stdout.isTTY) {
  // Clear line
  process.stdout.write('\x1b[2K');

  // Move cursor to beginning
  process.stdout.write('\r');

  // Move cursor up
  process.stdout.write('\x1b[1A');

  // Clear screen
  process.stdout.write('\x1b[2J');
  process.stdout.write('\x1b[H');
}
```

---

## Best Practices

### 1. Use Appropriate Streams

```javascript
// GOOD: Data to stdout, messages to stderr
function processData(data) {
  console.error('Processing data...');  // Status
  console.log(JSON.stringify(data));    // Data
  console.error('Complete');            // Status
}

// BAD: Everything to stdout
function processData(data) {
  console.log('Processing data...');
  console.log(JSON.stringify(data));
  console.log('Complete');
}
// Can't separate data from messages
```

### 2. Handle Pipe Errors

```javascript
// Handle EPIPE (broken pipe)
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') {
    // Consumer stopped reading, exit gracefully
    process.exit(0);
  }
  throw err;
});
```

### 3. Flush Before Exit

```javascript
// Ensure all output written before exit
function safeExit(code = 0) {
  process.stdout.write('', () => {
    process.stderr.write('', () => {
      process.exit(code);
    });
  });
}
```

### 4. Detect TTY for Formatting

```javascript
// Only use formatting in terminal
function formatOutput(data) {
  if (process.stdout.isTTY) {
    // Pretty, colored output
    return JSON.stringify(data, null, 2);
  } else {
    // Compact, machine-readable
    return JSON.stringify(data);
  }
}
```

### 5. Provide Both Interactive and Pipe Modes

```javascript
// Support both modes
if (process.stdin.isTTY) {
  // Interactive mode - prompt user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter value: ', (answer) => {
    processValue(answer);
    rl.close();
  });
} else {
  // Pipe mode - read from stdin
  let data = '';
  process.stdin.on('data', chunk => data += chunk);
  process.stdin.on('end', () => processValue(data));
}
```

---

## Common Pitfalls

### Pitfall 1: Mixing Data and Status Messages

```javascript
// PROBLEM: Can't pipe output cleanly
console.log('Processing...');
console.log(JSON.stringify(data));
console.log('Done');

// SOLUTION: Messages to stderr
console.error('Processing...');
console.log(JSON.stringify(data));  // Only data to stdout
console.error('Done');
```

### Pitfall 2: Not Handling EOF

```javascript
// PROBLEM: Never processes input
process.stdin.on('data', chunk => {
  processChunk(chunk);
});
// Needs 'end' event to know input is complete

// SOLUTION: Handle end event
let buffer = '';
process.stdin.on('data', chunk => buffer += chunk);
process.stdin.on('end', () => {
  processCompleteInput(buffer);
});
```

### Pitfall 3: Forgetting to Resume stdin

```javascript
// PROBLEM: stdin starts paused
process.stdin.on('data', data => {
  console.log(data);
});
// Nothing happens!

// SOLUTION: Resume stdin
process.stdin.resume();
process.stdin.on('data', data => {
  console.log(data);
});
```

### Pitfall 4: Assuming TTY

```javascript
// PROBLEM: ANSI codes in pipes
console.log('\x1b[32mGreen\x1b[0m');
// Shows escape codes when piped

// SOLUTION: Check for TTY
const green = process.stdout.isTTY ? '\x1b[32m' : '';
const reset = process.stdout.isTTY ? '\x1b[0m' : '';
console.log(`${green}Green${reset}`);
```

---

## Summary

### Key Takeaways

1. **Three streams** - stdin (input), stdout (output), stderr (errors)
2. **Separate concerns** - Data to stdout, messages to stderr
3. **Pre-opened** - Always available, no setup needed
4. **Pipeable** - Can redirect and chain programs
5. **TTY aware** - Detect terminal for formatting
6. **Event-driven** - Listen for data, end, error events

### Quick Decision Guide

**Where should this output go?**

```
Is it program data/results?
  → stdout (console.log)

Is it an error/warning/status?
  → stderr (console.error)

Is it user interaction?
  → stdout for prompts, stdin for input
```

### Next Steps

1. [Process Lifecycle Guide](./05-process-lifecycle.md)

---

## Quick Reference

```javascript
// stdout - Program output
console.log('data');
process.stdout.write('data');

// stderr - Errors and messages
console.error('error');
console.warn('warning');
process.stderr.write('message');

// stdin - Input
process.stdin.on('data', chunk => {});
process.stdin.on('end', () => {});

// readline - Line-by-line input
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.on('line', line => {});

// TTY detection
process.stdout.isTTY  // Is terminal?
process.stdin.isTTY   // Is keyboard input?

// Error handling
process.stdout.on('error', err => {
  if (err.code === 'EPIPE') process.exit(0);
});
```

```bash
# Redirection
node app.js > output.txt        # stdout to file
node app.js 2> errors.txt       # stderr to file
node app.js > out.txt 2>&1      # both to file

# Piping
echo "data" | node app.js
cat file.txt | node app.js
node app.js | node other.js
```

Ready to master process lifecycle? Continue to the [Process Lifecycle Guide](./05-process-lifecycle.md)!
