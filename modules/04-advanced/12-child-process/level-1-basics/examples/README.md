# Level 1 Examples - Child Process Basics

This directory contains practical examples demonstrating fundamental child process operations in Node.js.

## Examples Overview

### 01-basic-exec.js
**Demonstrates:** Using `exec()` to execute shell commands

**Key concepts:**
- Simple command execution
- Buffered output handling
- Shell features (pipes, redirects)
- Custom options
- Error handling

**Run it:**
```bash
node 01-basic-exec.js
```

---

### 02-basic-spawn.js
**Demonstrates:** Using `spawn()` to spawn child processes with streaming

**Key concepts:**
- Spawning processes with arguments
- Streaming data handling
- Process lifecycle events
- stdin/stdout interaction
- Silent mode

**Run it:**
```bash
node 02-basic-spawn.js
```

---

### 03-basic-execFile.js
**Demonstrates:** Using `execFile()` for direct file execution

**Key concepts:**
- Direct execution without shell
- Security benefits
- Handling arguments safely
- Timeout configuration
- Shell injection prevention

**Run it:**
```bash
node 03-basic-execFile.js
```

---

### 04-basic-fork.js
**Demonstrates:** Using `fork()` to create Node.js child processes

**Key concepts:**
- Forking Node.js processes
- Inter-process communication (IPC)
- Message passing
- Silent mode for stdio capture
- Process lifecycle management

**Run it:**
```bash
node 04-basic-fork.js
```

**Note:** This example creates a temporary worker file and cleans it up automatically.

---

### 05-handling-output.js
**Demonstrates:** Different ways to handle process output

**Key concepts:**
- stdout and stderr streams
- Collecting vs streaming output
- Exit codes and their meanings
- Exit vs close events
- Signal handling
- Buffered vs streaming comparison

**Run it:**
```bash
node 05-handling-output.js
```

---

### 06-error-handling.js
**Demonstrates:** Comprehensive error handling patterns

**Key concepts:**
- Spawn errors (ENOENT, EACCES)
- Runtime errors
- Timeout implementation
- maxBuffer exceeded
- Graceful degradation
- Fallback strategies
- Best practices

**Run it:**
```bash
node 06-error-handling.js
```

---

## Learning Path

**Recommended order:**
1. Start with `01-basic-exec.js` - Simplest method
2. Move to `02-basic-spawn.js` - Understand streaming
3. Study `03-basic-execFile.js` - Learn security benefits
4. Explore `04-basic-fork.js` - IPC communication
5. Master `05-handling-output.js` - Output handling
6. Complete with `06-error-handling.js` - Error patterns

## Running All Examples

To run all examples in sequence:

```bash
# Run each example with a pause between them
for file in 0*.js; do
  echo "Running $file..."
  node "$file"
  echo ""
  echo "Press Enter to continue..."
  read
done
```

## Key Takeaways

After studying these examples, you should understand:

- ✅ When to use each method (exec, spawn, execFile, fork)
- ✅ How to handle process output and errors
- ✅ The difference between buffered and streaming approaches
- ✅ Security considerations (shell injection)
- ✅ Process lifecycle and events
- ✅ Basic inter-process communication

## Common Patterns

### Pattern: Promise Wrapper for exec()
```javascript
const util = require('util');
const execPromise = util.promisify(require('child_process').exec);

const { stdout } = await execPromise('ls -lh');
console.log(stdout);
```

### Pattern: Collecting spawn() Output
```javascript
const child = spawn('command');
let output = '';

child.stdout.on('data', (data) => {
  output += data.toString();
});

child.on('close', (code) => {
  console.log('Output:', output);
});
```

### Pattern: Timeout Wrapper
```javascript
function execWithTimeout(command, timeout = 5000) {
  const child = exec(command, callback);
  setTimeout(() => child.kill(), timeout);
}
```

## Troubleshooting

**Problem:** Examples don't run
- **Solution:** Make sure you're in the examples directory
- **Solution:** Check Node.js is installed: `node --version`

**Problem:** Permission errors
- **Solution:** Some commands may require different permissions
- **Solution:** Try with appropriate commands for your OS

**Problem:** Command not found
- **Solution:** Examples use common Unix commands
- **Solution:** Adapt for your operating system (Windows users may need different commands)

## Next Steps

After completing these examples:
1. Complete the [exercises](../exercises/README.md)
2. Read the [conceptual guides](../guides/)
3. Study the [solutions](../solutions/README.md)
4. Move to [Level 2: Intermediate](../../level-2-intermediate/README.md)

---

**Note:** These examples are designed for learning. In production code, always add proper error handling, input validation, and security measures.
