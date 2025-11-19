/**
 * 03-command-line-args.js
 * ========================
 * Demonstrates how to parse and use command-line arguments in Node.js
 *
 * Key Concepts:
 * - Understanding process.argv array
 * - Parsing command-line arguments
 * - Implementing flags and options
 * - Building simple CLI tools
 * - Handling different argument formats
 *
 * Run: node 03-command-line-args.js
 * Run with args: node 03-command-line-args.js --name John --age 30 --verbose
 * Run with args: node 03-command-line-args.js build --output dist --minify
 */

console.log('=== Command-Line Arguments Example ===\n');

// =============================================================================
// UNDERSTANDING PROCESS.ARGV
// =============================================================================

console.log('--- Understanding process.argv ---\n');

// process.argv: An array containing command-line arguments
// argv[0]: Path to Node.js executable
// argv[1]: Path to the JavaScript file being executed
// argv[2+]: Additional arguments passed by the user

console.log('Raw process.argv array:');
process.argv.forEach((arg, index) => {
  console.log(`  [${index}] ${arg}`);
});
console.log();

// Breaking it down
console.log('Breaking down process.argv:');
console.log(`  Node executable: ${process.argv[0]}`);
console.log(`  Script path: ${process.argv[1]}`);
console.log(`  User arguments: ${process.argv.slice(2).join(', ') || '(none)'}`);
console.log();

// =============================================================================
// EXTRACTING USER ARGUMENTS
// =============================================================================

console.log('--- Extracting User Arguments ---\n');

// Get only the user-provided arguments (skip node and script path)
const args = process.argv.slice(2);

console.log(`Number of arguments: ${args.length}`);
if (args.length > 0) {
  console.log('Arguments:');
  args.forEach((arg, index) => {
    console.log(`  ${index + 1}. ${arg}`);
  });
} else {
  console.log('No arguments provided');
  console.log('\nTry running:');
  console.log('  node 03-command-line-args.js hello world');
  console.log('  node 03-command-line-args.js --name John --age 30');
}
console.log();

// =============================================================================
// PARSING SIMPLE POSITIONAL ARGUMENTS
// =============================================================================

console.log('--- Parsing Positional Arguments ---\n');

// Positional arguments: Arguments based on their position
// Example: node script.js <command> <file> <destination>

if (args.length >= 2) {
  const command = args[0];
  const file = args[1];
  const destination = args[2] || 'default-destination';

  console.log('Positional arguments:');
  console.log(`  Command: ${command}`);
  console.log(`  File: ${file}`);
  console.log(`  Destination: ${destination}`);
} else {
  console.log('Example of positional arguments:');
  console.log('  node 03-command-line-args.js copy source.txt dest.txt');
  console.log('  Command: copy');
  console.log('  File: source.txt');
  console.log('  Destination: dest.txt');
}
console.log();

// =============================================================================
// PARSING FLAGS AND OPTIONS
// =============================================================================

console.log('--- Parsing Flags and Options ---\n');

// Flags: Boolean switches (--verbose, -v)
// Options: Key-value pairs (--name John, --port 3000)

function parseArgs(args) {
  const parsed = {
    flags: {},
    options: {},
    positional: [],
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      // Long form option: --name or --name=value
      const option = arg.substring(2);

      if (option.includes('=')) {
        // Format: --name=value
        const [key, value] = option.split('=');
        parsed.options[key] = value;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Format: --name value
        parsed.options[option] = args[i + 1];
        i++; // Skip next argument
      } else {
        // Format: --verbose (boolean flag)
        parsed.flags[option] = true;
      }
    } else if (arg.startsWith('-') && arg.length === 2) {
      // Short form option: -v or -n value
      const option = arg.substring(1);

      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        // Format: -n value
        parsed.options[option] = args[i + 1];
        i++; // Skip next argument
      } else {
        // Format: -v (boolean flag)
        parsed.flags[option] = true;
      }
    } else {
      // Positional argument
      parsed.positional.push(arg);
    }
  }

  return parsed;
}

const parsedArgs = parseArgs(args);

console.log('Parsed arguments:');
console.log(JSON.stringify(parsedArgs, null, 2));
console.log();

// =============================================================================
// PRACTICAL EXAMPLE: SIMPLE CLI TOOL
// =============================================================================

console.log('--- Practical CLI Tool Example ---\n');

// Example: A simple file processor CLI
// Usage: node 03-command-line-args.js <command> [options]

function runCLI(parsedArgs) {
  const { positional, options, flags } = parsedArgs;
  const command = positional[0];
  const verbose = flags.verbose || flags.v;

  if (verbose) {
    console.log('[VERBOSE MODE ENABLED]');
    console.log(`Command: ${command || 'none'}`);
    console.log(`Options:`, options);
    console.log(`Flags:`, flags);
    console.log();
  }

  switch (command) {
    case 'build':
      console.log('Running build command...');
      console.log(`  Output: ${options.output || options.o || 'dist'}`);
      console.log(`  Minify: ${flags.minify ? 'yes' : 'no'}`);
      console.log(`  Source maps: ${flags.sourcemaps ? 'yes' : 'no'}`);
      break;

    case 'serve':
      console.log('Starting development server...');
      console.log(`  Port: ${options.port || options.p || '3000'}`);
      console.log(`  Host: ${options.host || 'localhost'}`);
      console.log(`  Open browser: ${flags.open ? 'yes' : 'no'}`);
      break;

    case 'test':
      console.log('Running tests...');
      console.log(`  Pattern: ${options.pattern || options.p || '**/*.test.js'}`);
      console.log(`  Watch mode: ${flags.watch || flags.w ? 'yes' : 'no'}`);
      console.log(`  Coverage: ${flags.coverage ? 'yes' : 'no'}`);
      break;

    case 'help':
    case undefined:
      console.log('Available commands:');
      console.log('  build   - Build the project');
      console.log('  serve   - Start development server');
      console.log('  test    - Run tests');
      console.log('');
      console.log('Options:');
      console.log('  --output, -o <dir>    Output directory (default: dist)');
      console.log('  --port, -p <port>     Server port (default: 3000)');
      console.log('  --pattern <pattern>   Test pattern (default: **/*.test.js)');
      console.log('');
      console.log('Flags:');
      console.log('  --verbose, -v         Enable verbose logging');
      console.log('  --minify              Minify output');
      console.log('  --watch, -w           Watch for changes');
      console.log('  --help                Show this help message');
      console.log('');
      console.log('Examples:');
      console.log('  node 03-command-line-args.js build --output dist --minify');
      console.log('  node 03-command-line-args.js serve --port 8080 --open');
      console.log('  node 03-command-line-args.js test --watch --coverage');
      break;

    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run with "help" command to see available commands');
  }
}

console.log('Executing CLI:');
console.log('─'.repeat(50));
runCLI(parsedArgs);
console.log('─'.repeat(50));
console.log();

// =============================================================================
// HANDLING SPECIAL CASES
// =============================================================================

console.log('--- Handling Special Cases ---\n');

// 1. Arguments with spaces (must be quoted in shell)
console.log('1. Arguments with spaces:');
console.log('   node script.js --message "Hello World"');
console.log('   Result: options.message = "Hello World"');
console.log();

// 2. Multiple values for one option
console.log('2. Multiple values:');
console.log('   node script.js --files file1.js file2.js file3.js');
console.log('   (Requires custom parsing logic)');
console.log();

// 3. Combined short flags
console.log('3. Combined short flags:');
console.log('   node script.js -abc  (equivalent to -a -b -c)');
console.log('   (Requires custom parsing logic)');
console.log();

// 4. Double dash separator
console.log('4. Double dash separator (--):');
console.log('   node script.js --option value -- positional args');
console.log('   Everything after -- is treated as positional');
console.log();

// =============================================================================
// VALIDATION EXAMPLE
// =============================================================================

console.log('--- Argument Validation ---\n');

function validateArgs(parsedArgs) {
  const errors = [];

  // Check if port is a valid number
  if (parsedArgs.options.port) {
    const port = parseInt(parsedArgs.options.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('Port must be a number between 1 and 65535');
    }
  }

  // Check if required arguments are present
  if (parsedArgs.positional[0] === 'build' && !parsedArgs.options.output) {
    // This is just a warning, not an error
    console.log('WARNING: No output directory specified, using default');
  }

  return errors;
}

const validationErrors = validateArgs(parsedArgs);
if (validationErrors.length > 0) {
  console.log('Validation errors:');
  validationErrors.forEach((error) => console.log(`  - ${error}`));
} else {
  console.log('Arguments validated successfully');
}
console.log();

console.log('=== Key Takeaways ===');
console.log('• process.argv[0] is node executable, argv[1] is script path');
console.log('• User arguments start at process.argv[2]');
console.log('• Flags are boolean switches (--verbose, -v)');
console.log('• Options are key-value pairs (--port 3000)');
console.log('• Always validate and provide defaults for arguments');
console.log('• For complex CLIs, consider using libraries like commander or yargs');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * COMMON ARGUMENT PATTERNS:
 *
 * 1. Positional Arguments:
 *    node script.js command file destination
 *    Best for: Simple, required arguments with clear order
 *
 * 2. Named Options:
 *    node script.js --name value --port 3000
 *    Best for: Optional or many arguments
 *
 * 3. Boolean Flags:
 *    node script.js --verbose --force --dry-run
 *    Best for: Enable/disable features
 *
 * 4. Short Forms:
 *    node script.js -v -p 3000
 *    Best for: Frequently used options
 *
 * 5. Combined Format:
 *    node script.js build --output dist --verbose
 *    Best for: Real-world CLIs (command + options + flags)
 *
 * POPULAR CLI LIBRARIES:
 *
 * 1. commander
 *    - Full-featured CLI framework
 *    - Automatic help generation
 *    - Subcommands support
 *
 * 2. yargs
 *    - Powerful argument parsing
 *    - Automatic validation
 *    - Rich help formatting
 *
 * 3. minimist
 *    - Lightweight parser
 *    - Simple and flexible
 *    - No dependencies
 *
 * 4. meow
 *    - Minimal and elegant
 *    - Good for simple CLIs
 *    - Built-in help text
 *
 * Example with commander:
 * ```js
 * const { program } = require('commander');
 *
 * program
 *   .option('-v, --verbose', 'verbose output')
 *   .option('-p, --port <number>', 'port number', 3000)
 *   .parse(process.argv);
 *
 * console.log(program.opts());
 * ```
 */
