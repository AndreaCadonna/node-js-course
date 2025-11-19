/**
 * 06-exit-codes.js
 * =================
 * Demonstrates exit codes and process termination in Node.js
 *
 * Key Concepts:
 * - Understanding exit codes (0 = success, non-zero = error)
 * - Using process.exit() to terminate programs
 * - Setting exit codes with process.exitCode
 * - Common exit code conventions
 * - Graceful vs immediate shutdown
 *
 * Run: node 06-exit-codes.js
 * Run with args: node 06-exit-codes.js success
 * Run with args: node 06-exit-codes.js error
 * Check exit code: node 06-exit-codes.js error; echo $? (Linux/Mac)
 * Check exit code: node 06-exit-codes.js error & echo %ERRORLEVEL% (Windows)
 */

console.log('=== Exit Codes Example ===\n');

// =============================================================================
// UNDERSTANDING EXIT CODES
// =============================================================================

console.log('--- Understanding Exit Codes ---\n');

console.log('Exit Code Meanings:');
console.log('  0   = Success (no errors)');
console.log('  1   = General error');
console.log('  2   = Misuse of shell command');
console.log('  126 = Command cannot execute');
console.log('  127 = Command not found');
console.log('  128+n = Fatal error with signal n');
console.log('  130 = Terminated by Ctrl+C (SIGINT)');
console.log('  137 = Terminated by SIGKILL');
console.log('  143 = Terminated by SIGTERM');
console.log();

// =============================================================================
// GETTING THE CURRENT EXIT CODE
// =============================================================================

console.log('--- Current Exit Code ---\n');

// process.exitCode: Get or set the exit code (doesn't exit immediately)
console.log(`Current exit code: ${process.exitCode ?? 0}`);
console.log('(undefined means 0 - success)');
console.log();

// =============================================================================
// SETTING EXIT CODES
// =============================================================================

console.log('--- Setting Exit Codes ---\n');

// Method 1: process.exit(code) - Immediate exit
console.log('Method 1: process.exit(code)');
console.log('  - Exits immediately');
console.log('  - No pending operations complete');
console.log('  - No event loop processing');
console.log('  - Use sparingly!\n');

// Method 2: process.exitCode = code - Graceful exit
console.log('Method 2: process.exitCode = code');
console.log('  - Sets exit code but doesn\'t exit immediately');
console.log('  - Allows event loop to finish');
console.log('  - Preferred method');
console.log('  - Process exits naturally when event loop is empty\n');

// =============================================================================
// PRACTICAL EXAMPLES
// =============================================================================

console.log('--- Practical Examples ---\n');

/**
 * Example 1: Command-line tool with validation
 */
function validateAndProcess(args) {
  const command = args[0];

  console.log(`Command received: ${command || '(none)'}`);

  if (!command) {
    console.error('ERROR: No command specified');
    console.error('Usage: node 06-exit-codes.js <command>');
    console.error('Commands: success, error, warn');
    process.exitCode = 1; // Set error code
    return;
  }

  switch (command) {
    case 'success':
      console.log('Operation completed successfully!');
      process.exitCode = 0; // Explicit success (though 0 is default)
      break;

    case 'error':
      console.error('Operation failed!');
      process.exitCode = 1; // General error
      break;

    case 'warn':
      console.warn('Operation completed with warnings');
      process.exitCode = 0; // Warnings don't cause failure
      break;

    case 'not-found':
      console.error('Resource not found');
      process.exitCode = 2; // Specific error code
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exitCode = 1;
      break;
  }
}

const args = process.argv.slice(2);
validateAndProcess(args);
console.log();

// =============================================================================
// EXIT CODE PATTERNS
// =============================================================================

console.log('--- Common Exit Code Patterns ---\n');

/**
 * Pattern 1: File operations
 */
function processFile(filename) {
  if (!filename) {
    console.error('ERROR: Filename required');
    return 1; // Return exit code
  }

  // Simulate file check
  const fileExists = false;

  if (!fileExists) {
    console.error(`ERROR: File not found: ${filename}`);
    return 2; // Specific error for not found
  }

  console.log(`Processing ${filename}...`);
  return 0; // Success
}

console.log('1. File operation pattern:');
const exitCode1 = processFile('');
console.log(`   Exit code: ${exitCode1}\n`);

/**
 * Pattern 2: Network operations
 */
async function fetchData(url) {
  if (!url) {
    console.error('ERROR: URL required');
    return 1;
  }

  try {
    // Simulate network request
    const isOnline = true;
    if (!isOnline) {
      throw new Error('Network unavailable');
    }

    console.log(`Fetching data from ${url}...`);
    return 0;
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return 3; // Network error
  }
}

console.log('2. Network operation pattern:');
console.log('   (Simulated - exit code: 0)\n');

/**
 * Pattern 3: Validation with specific codes
 */
function validateInput(data) {
  if (!data) {
    console.error('ERROR: No data provided');
    return 1; // General error
  }

  if (typeof data !== 'object') {
    console.error('ERROR: Data must be an object');
    return 10; // Invalid type
  }

  if (!data.name) {
    console.error('ERROR: Missing required field: name');
    return 11; // Missing field
  }

  if (data.age && data.age < 0) {
    console.error('ERROR: Invalid value for age');
    return 12; // Invalid value
  }

  console.log('Validation passed');
  return 0;
}

console.log('3. Validation pattern with specific codes:');
const exitCode3 = validateInput({});
console.log(`   Exit code: ${exitCode3}\n`);

// =============================================================================
// GRACEFUL VS IMMEDIATE SHUTDOWN
// =============================================================================

console.log('--- Graceful vs Immediate Shutdown ---\n');

/**
 * Graceful shutdown: Let pending operations complete
 */
function gracefulShutdown(code) {
  console.log('Initiating graceful shutdown...');

  // Set the exit code
  process.exitCode = code;

  // Pending operations will complete
  setTimeout(() => {
    console.log('(This async operation completes)');
  }, 10);

  // Process will exit after event loop is empty
}

/**
 * Immediate shutdown: Exit right now
 */
function immediateShutdown(code) {
  console.log('Initiating immediate shutdown...');

  // Pending operations will NOT complete
  setTimeout(() => {
    console.log('(This will never print)');
  }, 10);

  // Exit immediately
  process.exit(code);
}

console.log('Graceful shutdown (RECOMMENDED):');
console.log('  process.exitCode = 1;');
console.log('  - Allows cleanup');
console.log('  - Completes pending operations');
console.log('  - Closes connections properly\n');

console.log('Immediate shutdown (USE WITH CAUTION):');
console.log('  process.exit(1);');
console.log('  - Exits immediately');
console.log('  - May lose data');
console.log('  - No cleanup');
console.log('  - Use only for critical errors\n');

// =============================================================================
// ERROR HANDLING WITH EXIT CODES
// =============================================================================

console.log('--- Error Handling with Exit Codes ---\n');

/**
 * Centralized error handler
 */
function handleError(error, exitCode = 1) {
  console.error('ERROR:', error.message);

  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }

  process.exitCode = exitCode;
}

/**
 * Example function that might throw
 */
function riskyOperation() {
  const shouldFail = false; // Change to true to see error

  if (shouldFail) {
    throw new Error('Operation failed');
  }

  console.log('Risky operation succeeded');
}

console.log('Error handling example:');
try {
  riskyOperation();
} catch (error) {
  handleError(error, 1);
}
console.log();

// =============================================================================
// CUSTOM EXIT CODE CONVENTIONS
// =============================================================================

console.log('--- Custom Exit Code Conventions ---\n');

// Define application-specific exit codes
const ExitCodes = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_ARGUMENT: 2,
  FILE_NOT_FOUND: 3,
  PERMISSION_DENIED: 4,
  NETWORK_ERROR: 5,
  TIMEOUT: 6,
  CONFIGURATION_ERROR: 7,
  DATABASE_ERROR: 8,
  AUTHENTICATION_ERROR: 9,
};

console.log('Application exit codes:');
Object.entries(ExitCodes).forEach(([name, code]) => {
  console.log(`  ${code}: ${name}`);
});
console.log();

/**
 * Using custom exit codes
 */
function processWithCustomCodes(operation) {
  switch (operation) {
    case 'success':
      return ExitCodes.SUCCESS;
    case 'file-not-found':
      console.error('File not found');
      return ExitCodes.FILE_NOT_FOUND;
    case 'network-error':
      console.error('Network error');
      return ExitCodes.NETWORK_ERROR;
    default:
      console.error('Unknown operation');
      return ExitCodes.GENERAL_ERROR;
  }
}

// =============================================================================
// CHECKING EXIT CODES IN SHELL
// =============================================================================

console.log('--- Checking Exit Codes in Shell ---\n');

console.log('After running a Node.js script, check the exit code:\n');

console.log('Linux/macOS (bash/zsh):');
console.log('  node script.js');
console.log('  echo $?         # Shows exit code of last command\n');

console.log('Windows (cmd):');
console.log('  node script.js');
console.log('  echo %ERRORLEVEL%   # Shows exit code\n');

console.log('Windows (PowerShell):');
console.log('  node script.js');
console.log('  echo $LASTEXITCODE  # Shows exit code\n');

console.log('Using exit codes in shell scripts:');
console.log('  node script.js');
console.log('  if [ $? -eq 0 ]; then');
console.log('    echo "Success"');
console.log('  else');
console.log('    echo "Failed"');
console.log('  fi\n');

console.log('=== Key Takeaways ===');
console.log('• Exit code 0 means success, non-zero means error');
console.log('• Use process.exitCode for graceful shutdown (PREFERRED)');
console.log('• Use process.exit() only for immediate termination');
console.log('• Define custom exit codes for specific error types');
console.log('• Check exit codes in shell scripts for error handling');
console.log('• Document exit codes in your application');

console.log('\n=== Final Exit Code ===');
console.log(`This script will exit with code: ${process.exitCode ?? 0}`);

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * EXIT CODE BEST PRACTICES:
 *
 * 1. Always use exit code 0 for success:
 *    if (success) {
 *      process.exitCode = 0;
 *    }
 *
 * 2. Use non-zero codes for errors:
 *    if (error) {
 *      console.error('Error occurred');
 *      process.exitCode = 1;
 *    }
 *
 * 3. Define meaningful exit codes:
 *    const EXIT_CODES = {
 *      SUCCESS: 0,
 *      INVALID_CONFIG: 1,
 *      NETWORK_ERROR: 2,
 *      DATABASE_ERROR: 3
 *    };
 *
 * 4. Document exit codes:
 *    Add a section in README.md listing all exit codes
 *    and their meanings
 *
 * 5. Prefer graceful shutdown:
 *    // GOOD: Allows cleanup
 *    process.exitCode = 1;
 *
 *    // BAD: Immediate exit
 *    process.exit(1);
 *
 * 6. Handle unhandled errors:
 *    process.on('uncaughtException', (error) => {
 *      console.error('Uncaught exception:', error);
 *      process.exitCode = 1;
 *    });
 *
 *    process.on('unhandledRejection', (reason) => {
 *      console.error('Unhandled rejection:', reason);
 *      process.exitCode = 1;
 *    });
 *
 * 7. Use in CI/CD:
 *    Exit codes are crucial for CI/CD pipelines.
 *    Non-zero exit codes indicate build/test failures.
 *
 * 8. Testing exit codes:
 *    const { execSync } = require('child_process');
 *    try {
 *      execSync('node script.js');
 *      console.log('Exit code: 0');
 *    } catch (error) {
 *      console.log('Exit code:', error.status);
 *    }
 *
 * COMMON CONVENTIONS:
 *
 * 0   - Success
 * 1   - General error
 * 2   - Misuse of shell command
 * 126 - Command cannot execute
 * 127 - Command not found
 * 128 - Invalid exit argument
 * 130 - Terminated by Ctrl+C
 * 255 - Exit status out of range
 *
 * Application-specific codes typically use 1-125
 */
