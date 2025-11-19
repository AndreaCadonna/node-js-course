# Command-Line Arguments

## Introduction

This guide provides a comprehensive look at command-line arguments in Node.js. You'll learn how to parse, validate, and use arguments to create flexible, user-friendly CLI tools and applications.

---

## What Are Command-Line Arguments?

### Definition

Command-line arguments are **values passed to your program** when it starts. They allow users to customize behavior without changing code or environment variables.

```bash
# Running with arguments
node app.js arg1 arg2 arg3

# Arguments with flags
node app.js --port 3000 --verbose

# Mix of flags and values
node server.js start --port 8080 --host localhost
```

```javascript
// Access in Node.js
console.log(process.argv);
// [
//   '/usr/local/bin/node',           // Node executable
//   '/path/to/app.js',               // Script path
//   'arg1', 'arg2', 'arg3'           // Your arguments
// ]
```

### Key Characteristics

1. **Ordered array** - Arguments appear in order they're provided
2. **Always strings** - Like env vars, all values are strings
3. **First two items** - Node executable and script path
4. **User arguments** - Start at index 2
5. **Flexible format** - Can use flags, options, positional args

---

## Real-World Analogies

### Analogy 1: Restaurant Order

**Running a program is like ordering food:**

```bash
node pizza.js --size large --toppings pepperoni,mushrooms --delivery
```

- **Command** → "I want pizza"
- **Flags** → Size, toppings, delivery
- **Values** → Large, pepperoni/mushrooms

Same restaurant (code), different orders (arguments).

### Analogy 2: TV Remote Control

**Arguments are like buttons on a remote:**

- **Power button** → `node app.js start`
- **Channel number** → `node app.js --channel 5`
- **Volume** → `node app.js --volume 50`
- **Input source** → `node app.js --input hdmi`

Same TV (program), different settings (arguments).

### Analogy 3: Swiss Army Knife

**Your program is a Swiss Army knife:**

```bash
node tool.js cut      # Use knife blade
node tool.js open     # Use bottle opener
node tool.js screw    # Use screwdriver
```

One tool, many functions selected by arguments.

---

## Understanding process.argv

### The Array Structure

```bash
node app.js hello world --name John
```

```javascript
// process.argv contains:
[
  '/usr/local/bin/node',      // [0] Node executable path
  '/Users/you/app.js',        // [1] Script file path
  'hello',                    // [2] First argument
  'world',                    // [3] Second argument
  '--name',                   // [4] Flag
  'John'                      // [5] Flag value
]
```

### Why First Two Items?

The first two items provide context:

```javascript
const nodeExecutable = process.argv[0];
// Where is Node.js installed?
// Useful for spawning child processes

const scriptPath = process.argv[1];
// What script is running?
// Useful for relative paths or showing usage

const userArgs = process.argv.slice(2);
// What the user actually provided
// This is what you typically use
```

### Basic Parsing

```javascript
// app.js
const args = process.argv.slice(2);

console.log('Arguments:', args);
console.log('First arg:', args[0]);
console.log('Second arg:', args[1]);

// Run: node app.js hello world
// Output:
// Arguments: [ 'hello', 'world' ]
// First arg: hello
// Second arg: world
```

---

## Argument Patterns

### 1. Positional Arguments

Arguments identified by position:

```bash
node copy.js source.txt destination.txt
```

```javascript
// copy.js
const [source, destination] = process.argv.slice(2);

if (!source || !destination) {
  console.error('Usage: node copy.js <source> <destination>');
  process.exit(1);
}

console.log(`Copying ${source} to ${destination}`);
```

**Best for:**
- Required parameters
- Fixed number of arguments
- Clear, obvious order

### 2. Flags (Boolean Options)

Options without values:

```bash
node app.js --verbose --debug --force
```

```javascript
// app.js
const args = process.argv.slice(2);

const flags = {
  verbose: args.includes('--verbose'),
  debug: args.includes('--debug'),
  force: args.includes('--force'),
};

console.log(flags);
// { verbose: true, debug: true, force: true }

if (flags.verbose) {
  console.log('Verbose mode enabled');
}
```

**Best for:**
- On/off settings
- Optional features
- Mode switches

### 3. Options (Key-Value Pairs)

Options with values:

```bash
node app.js --port 3000 --host localhost --timeout 5000
```

```javascript
// app.js - Manual parsing
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1];
    options[key] = value;
    i++; // Skip next item (the value)
  }
}

console.log(options);
// { port: '3000', host: 'localhost', timeout: '5000' }
```

**Best for:**
- Configuration values
- Optional parameters
- Named settings

### 4. Short Flags

Single-letter shortcuts:

```bash
node app.js -v -p 3000 -h localhost
```

```javascript
// Map short flags to long names
const shortFlags = {
  'v': 'verbose',
  'p': 'port',
  'h': 'host',
  'd': 'debug',
};

// Parse short and long flags
function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long flag: --port 3000
      const key = arg.slice(2);
      const value = args[i + 1];
      options[key] = value;
      i++;
    } else if (arg.startsWith('-')) {
      // Short flag: -p 3000
      const short = arg.slice(1);
      const long = shortFlags[short];
      const value = args[i + 1];
      options[long] = value;
      i++;
    }
  }

  return options;
}
```

**Best for:**
- Frequently used options
- UNIX-style commands
- Power users

### 5. Combined Short Flags

Multiple flags together:

```bash
node app.js -vdf  # Same as -v -d -f
```

```javascript
function parseShortFlags(arg) {
  // -vdf → ['v', 'd', 'f']
  return arg.slice(1).split('');
}

// Parse: -vdf
const flags = parseShortFlags('-vdf');
// ['v', 'd', 'f']

flags.forEach(flag => {
  options[shortFlags[flag]] = true;
});
// { verbose: true, debug: true, force: true }
```

---

## Parsing Arguments

### Manual Parsing (Simple)

```javascript
// simple-parse.js
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long option: --key=value or --key value
      if (arg.includes('=')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value;
      } else {
        const key = arg.slice(2);
        const next = args[i + 1];

        if (next && !next.startsWith('-')) {
          options[key] = next;
          i++;
        } else {
          options[key] = true; // Flag
        }
      }
    } else if (arg.startsWith('-')) {
      // Short option: -k value
      const key = arg.slice(1);
      const next = args[i + 1];

      if (next && !next.startsWith('-')) {
        options[key] = next;
        i++;
      } else {
        options[key] = true; // Flag
      }
    } else {
      // Positional argument
      positional.push(arg);
    }
  }

  return { options, positional };
}

// Usage
const { options, positional } = parseArgs();
console.log('Options:', options);
console.log('Positional:', positional);
```

### Using minimist (Popular Library)

```bash
npm install minimist
```

```javascript
// Using minimist
const minimist = require('minimist');

const args = minimist(process.argv.slice(2));

console.log(args);

// node app.js --port 3000 -v input.txt
// {
//   _: ['input.txt'],           // Positional args
//   port: 3000,                 // Parsed as number!
//   v: true                     // Flag
// }
```

**minimist features:**
```javascript
const args = minimist(process.argv.slice(2), {
  // Default values
  default: {
    port: 3000,
    host: 'localhost',
  },

  // Aliases
  alias: {
    p: 'port',
    h: 'host',
    v: 'verbose',
  },

  // Boolean flags (don't consume next arg)
  boolean: ['verbose', 'debug', 'force'],

  // String values (even if they look like numbers)
  string: ['host', 'name'],
});
```

### Using yargs (Feature-Rich)

```bash
npm install yargs
```

```javascript
// Using yargs
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port to run server on',
    default: 3000,
  })
  .option('host', {
    alias: 'h',
    type: 'string',
    description: 'Host to bind to',
    default: 'localhost',
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .help()
  .argv;

console.log(argv);
```

**yargs features:**
- Automatic help generation
- Type validation
- Required options
- Choices validation
- Custom validation
- Commands and subcommands

---

## Practical Examples

### Example 1: Simple CLI Calculator

```javascript
// calc.js
const args = process.argv.slice(2);
const [operation, ...numbers] = args;

// Convert string numbers to actual numbers
const nums = numbers.map(n => parseFloat(n));

// Validate
if (!operation || nums.length === 0) {
  console.error('Usage: node calc.js <operation> <numbers...>');
  console.error('Example: node calc.js add 1 2 3');
  process.exit(1);
}

if (nums.some(isNaN)) {
  console.error('All arguments must be numbers');
  process.exit(1);
}

// Calculate
let result;
switch (operation) {
  case 'add':
    result = nums.reduce((a, b) => a + b, 0);
    break;
  case 'multiply':
    result = nums.reduce((a, b) => a * b, 1);
    break;
  case 'average':
    result = nums.reduce((a, b) => a + b, 0) / nums.length;
    break;
  default:
    console.error(`Unknown operation: ${operation}`);
    process.exit(1);
}

console.log(`Result: ${result}`);
```

```bash
# Usage
node calc.js add 1 2 3          # Result: 6
node calc.js multiply 2 3 4     # Result: 24
node calc.js average 10 20 30   # Result: 20
```

### Example 2: File Processor with Options

```javascript
// process.js
const fs = require('fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    input: null,
    output: null,
    verbose: false,
    uppercase: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--input':
      case '-i':
        config.input = args[++i];
        break;
      case '--output':
      case '-o':
        config.output = args[++i];
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--uppercase':
      case '-u':
        config.uppercase = true;
        break;
      default:
        if (!config.input) {
          config.input = arg;
        }
    }
  }

  return config;
}

function main() {
  const config = parseArgs();

  // Validate
  if (!config.input) {
    console.error('Usage: node process.js <input> [options]');
    console.error('Options:');
    console.error('  -o, --output <file>    Output file');
    console.error('  -u, --uppercase        Convert to uppercase');
    console.error('  -v, --verbose          Verbose output');
    process.exit(1);
  }

  if (config.verbose) {
    console.log('Configuration:', config);
  }

  // Read file
  let content = fs.readFileSync(config.input, 'utf8');

  // Transform
  if (config.uppercase) {
    content = content.toUpperCase();
  }

  // Output
  if (config.output) {
    fs.writeFileSync(config.output, content);
    if (config.verbose) {
      console.log(`Written to ${config.output}`);
    }
  } else {
    console.log(content);
  }
}

main();
```

```bash
# Usage
node process.js input.txt
node process.js input.txt -u
node process.js input.txt -o output.txt -u -v
node process.js -i input.txt -o output.txt --uppercase --verbose
```

### Example 3: Command-Based CLI

```javascript
// cli.js
const commands = {
  start: (args) => {
    const port = args.port || 3000;
    console.log(`Starting server on port ${port}...`);
    // Start server logic
  },

  stop: (args) => {
    console.log('Stopping server...');
    // Stop server logic
  },

  status: (args) => {
    console.log('Checking status...');
    // Status check logic
  },

  help: () => {
    console.log('Available commands:');
    console.log('  start [--port <number>]  Start the server');
    console.log('  stop                     Stop the server');
    console.log('  status                   Check server status');
    console.log('  help                     Show this help');
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      options[key] = value;
      i++;
    }
  }

  return { command, options };
}

function main() {
  const { command, options } = parseArgs();

  if (!command || !commands[command]) {
    console.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }

  commands[command](options);
}

main();
```

```bash
# Usage
node cli.js help
node cli.js start
node cli.js start --port 8080
node cli.js stop
node cli.js status
```

---

## Advanced Parsing with yargs

### Complete Example

```javascript
// server.js
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .command('start', 'Start the server', (yargs) => {
    return yargs
      .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port number',
        default: 3000,
      })
      .option('host', {
        alias: 'h',
        type: 'string',
        description: 'Host to bind to',
        default: 'localhost',
      });
  })
  .command('stop', 'Stop the server')
  .command('restart', 'Restart the server')
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
  })
  .option('config', {
    alias: 'c',
    type: 'string',
    description: 'Path to config file',
  })
  .demandCommand(1, 'You must provide a command')
  .help()
  .argv;

console.log('Command:', argv._[0]);
console.log('Options:', argv);
```

### Validation

```javascript
const argv = yargs(hideBin(process.argv))
  .option('port', {
    type: 'number',
    description: 'Port number',
    // Must be valid port number
    coerce: (port) => {
      if (port < 1 || port > 65535) {
        throw new Error('Port must be between 1 and 65535');
      }
      return port;
    },
  })
  .option('env', {
    type: 'string',
    description: 'Environment',
    // Must be one of these
    choices: ['development', 'production', 'test'],
    default: 'development',
  })
  .option('threads', {
    type: 'number',
    description: 'Number of threads',
    // Custom validation
    check: (threads) => {
      if (threads < 1 || threads > 16) {
        throw new Error('Threads must be between 1 and 16');
      }
      return true;
    },
  })
  .argv;
```

---

## Best Practices

### 1. Always Provide Help

```javascript
// Show help message
function showHelp() {
  console.log('Usage: node app.js [command] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  start    Start the application');
  console.log('  stop     Stop the application');
  console.log('');
  console.log('Options:');
  console.log('  -p, --port <number>    Port number (default: 3000)');
  console.log('  -h, --host <string>    Host name (default: localhost)');
  console.log('  -v, --verbose          Enable verbose output');
  console.log('  --help                 Show this help message');
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}
```

### 2. Validate Arguments

```javascript
function validateArgs(config) {
  // Check required arguments
  if (!config.input) {
    throw new Error('Input file is required');
  }

  // Validate file exists
  if (!fs.existsSync(config.input)) {
    throw new Error(`File not found: ${config.input}`);
  }

  // Validate number ranges
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }

  // Validate choices
  const validEnvs = ['dev', 'prod', 'test'];
  if (!validEnvs.includes(config.env)) {
    throw new Error(`Environment must be one of: ${validEnvs.join(', ')}`);
  }

  return config;
}
```

### 3. Provide Good Defaults

```javascript
const config = {
  // Sensible defaults
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  env: process.env.NODE_ENV || 'development',
  verbose: false,

  // Override with arguments
  ...parseArgs(),
};
```

### 4. Support Both Formats

```javascript
// Support both:
// --port 3000 (separate)
// --port=3000 (combined)

if (arg.startsWith('--')) {
  if (arg.includes('=')) {
    // --key=value
    const [key, value] = arg.slice(2).split('=');
    options[key] = value;
  } else {
    // --key value
    const key = arg.slice(2);
    const value = args[i + 1];
    options[key] = value;
    i++;
  }
}
```

### 5. Type Conversion

```javascript
function parseValue(value) {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Array (comma-separated)
  if (value.includes(',')) return value.split(',');

  // String
  return value;
}

// Usage
const port = parseValue('3000');        // 3000 (number)
const debug = parseValue('true');       // true (boolean)
const tags = parseValue('a,b,c');       // ['a', 'b', 'c'] (array)
const name = parseValue('hello');       // 'hello' (string)
```

---

## Common Patterns

### Pattern 1: Config File + Arguments

```javascript
// Arguments override config file
const fs = require('fs');

// Load config file
let config = { port: 3000, host: 'localhost' };

if (fs.existsSync('config.json')) {
  config = { ...config, ...JSON.parse(fs.readFileSync('config.json')) };
}

// Parse arguments
const args = parseArgs();

// Arguments override config
config = { ...config, ...args };

console.log('Final config:', config);
```

### Pattern 2: Environment Variables + Arguments

```javascript
// Priority: arguments > env vars > defaults
const config = {
  // Default values
  port: 3000,
  host: 'localhost',
};

// Override with environment variables
if (process.env.PORT) {
  config.port = parseInt(process.env.PORT, 10);
}
if (process.env.HOST) {
  config.host = process.env.HOST;
}

// Override with command-line arguments (highest priority)
const args = parseArgs();
Object.assign(config, args);
```

### Pattern 3: Interactive Prompts for Missing Args

```javascript
const readline = require('readline');

async function promptMissing(config) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise(resolve => {
    rl.question(q, resolve);
  });

  if (!config.username) {
    config.username = await question('Username: ');
  }

  if (!config.password) {
    config.password = await question('Password: ');
  }

  rl.close();
  return config;
}

// Usage
let config = parseArgs();
config = await promptMissing(config);
```

---

## Common Pitfalls

### Pitfall 1: Forgetting slice(2)

```javascript
// WRONG: Includes node and script path
const args = process.argv;
// ['/usr/bin/node', '/path/to/script.js', 'arg1', 'arg2']

// CORRECT: Only user arguments
const args = process.argv.slice(2);
// ['arg1', 'arg2']
```

### Pitfall 2: Type Confusion

```javascript
// WRONG: All arguments are strings!
const port = process.argv[2]; // '3000' (string)
server.listen(port); // Works but not ideal

// CORRECT: Convert types
const port = parseInt(process.argv[2], 10); // 3000 (number)
```

### Pitfall 3: No Validation

```javascript
// WRONG: No validation
const file = process.argv[2];
fs.readFileSync(file); // Crashes if missing!

// CORRECT: Validate first
const file = process.argv[2];
if (!file) {
  console.error('Error: File argument required');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`Error: File not found: ${file}`);
  process.exit(1);
}
```

### Pitfall 4: Poor Error Messages

```javascript
// WRONG: Unclear error
if (!args.input) {
  console.error('Error');
  process.exit(1);
}

// CORRECT: Helpful error
if (!args.input) {
  console.error('Error: Input file is required');
  console.error('Usage: node app.js --input <file>');
  process.exit(1);
}
```

---

## Summary

### Key Takeaways

1. **process.argv** - Array of arguments, slice(2) for user args
2. **Always strings** - Convert types explicitly
3. **Multiple patterns** - Positional, flags, options, commands
4. **Use libraries** - minimist or yargs for complex parsing
5. **Validate early** - Check arguments before using
6. **Provide help** - Always include usage information

### Argument Priority

```
1. Command-line arguments (highest)
2. Environment variables
3. Config files
4. Default values (lowest)
```

### Next Steps

1. [Standard Streams Guide](./04-standard-streams.md)
2. [Process Lifecycle Guide](./05-process-lifecycle.md)

---

## Quick Reference

```javascript
// Access arguments
process.argv                    // Full array
process.argv.slice(2)          // User arguments only

// Manual parsing (simple)
const args = process.argv.slice(2);
const [cmd, ...rest] = args;

// Check for flag
args.includes('--verbose')

// Using minimist
const minimist = require('minimist');
const args = minimist(process.argv.slice(2), {
  alias: { p: 'port', h: 'host' },
  default: { port: 3000 },
  boolean: ['verbose', 'debug'],
});

// Using yargs
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const argv = yargs(hideBin(process.argv))
  .option('port', {
    alias: 'p',
    type: 'number',
    default: 3000,
  })
  .help()
  .argv;

// Type conversion
parseInt(arg, 10)              // String to number
arg === 'true'                 // String to boolean
arg.split(',')                 // String to array
```

Ready to work with standard streams? Continue to the [Standard Streams Guide](./04-standard-streams.md)!
