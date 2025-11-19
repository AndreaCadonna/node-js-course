/**
 * SOLUTION: Exercise 3 - CLI Calculator
 *
 * This solution demonstrates professional command-line argument parsing and processing
 * using process.argv. It showcases input validation, error handling, and creating
 * user-friendly CLI tools.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Parsing process.argv for command-line arguments
 * - Input validation and error handling
 * - Working with variable numbers of arguments
 * - Using process.exit() with proper exit codes
 * - Creating helpful usage documentation
 * - Functional programming with reduce()
 *
 * PRODUCTION FEATURES:
 * - Comprehensive input validation
 * - Clear, helpful error messages
 * - Support for multiple operands
 * - Division by zero protection
 * - Usage examples and documentation
 * - Proper exit codes (0 = success, 1 = error)
 */

/**
 * Displays comprehensive usage instructions
 *
 * This function provides users with all the information they need to use
 * the calculator correctly, including syntax, operations, and examples.
 */
function showUsage() {
  // Extract script name from process.argv for dynamic usage display
  const scriptName = process.argv[1].split('/').pop();

  console.log('╔════════════════════════════════════════════╗');
  console.log('║           CLI Calculator                   ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log();
  console.log('USAGE:');
  console.log(`  node ${scriptName} <operation> <number1> <number2> [number3...]`);
  console.log();
  console.log('OPERATIONS:');
  console.log('  add        - Add all numbers together');
  console.log('  subtract   - Subtract all numbers from the first');
  console.log('  multiply   - Multiply all numbers together');
  console.log('  divide     - Divide the first number by all others');
  console.log();
  console.log('EXAMPLES:');
  console.log(`  node ${scriptName} add 5 10 15 20`);
  console.log('    Result: 50');
  console.log();
  console.log(`  node ${scriptName} subtract 100 25 10`);
  console.log('    Result: 65 (100 - 25 - 10)');
  console.log();
  console.log(`  node ${scriptName} multiply 2 3 4`);
  console.log('    Result: 24');
  console.log();
  console.log(`  node ${scriptName} divide 100 2 5`);
  console.log('    Result: 10 (100 / 2 / 5)');
  console.log();
  console.log('NOTES:');
  console.log('  - All operations support multiple numbers (2 or more)');
  console.log('  - Decimal numbers are supported (e.g., 3.14, -5.5)');
  console.log('  - Division by zero will result in an error');
  console.log('  - Negative numbers are supported (e.g., -10, -3.5)');
  console.log();
}

/**
 * Parses command-line arguments from process.argv
 *
 * process.argv structure:
 *   [0] - Path to Node.js executable
 *   [1] - Path to the script being executed
 *   [2+] - User-provided arguments
 *
 * @returns {Object|null} Object with operation and arguments, or null if none
 */
function parseArguments() {
  // Get user arguments (skip node path and script path)
  const args = process.argv.slice(2);

  // Check if any arguments were provided
  if (args.length === 0) {
    return null;
  }

  // First argument is the operation
  const operation = args[0].toLowerCase();

  // Remaining arguments are the number strings
  const numberArgs = args.slice(1);

  return {
    operation,
    numberArgs
  };
}

/**
 * Validates if the operation is supported
 *
 * @param {string} operation - The operation to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidOperation(operation) {
  const validOperations = ['add', 'subtract', 'multiply', 'divide'];
  return validOperations.includes(operation.toLowerCase());
}

/**
 * Parses and validates an array of number strings
 *
 * This function converts string arguments to numbers and validates that
 * all conversions were successful.
 *
 * @param {string[]} args - Array of string arguments
 * @returns {number[]|null} Array of numbers if all valid, null otherwise
 */
function parseNumbers(args) {
  // Check if we have any arguments
  if (!args || args.length === 0) {
    return null;
  }

  const numbers = [];
  const invalidArgs = [];

  // Parse each argument as a number
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const num = parseFloat(arg);

    // Check if parsing was successful
    if (isNaN(num)) {
      invalidArgs.push(arg);
    } else {
      numbers.push(num);
    }
  }

  // If any arguments were invalid, report them and return null
  if (invalidArgs.length > 0) {
    console.error('❌ Error: Invalid number(s) detected:');
    invalidArgs.forEach(arg => {
      console.error(`   - "${arg}" is not a valid number`);
    });
    return null;
  }

  return numbers;
}

/**
 * Performs the calculation based on operation and numbers
 *
 * This function uses Array.reduce() for elegant functional programming.
 * Each operation processes all numbers sequentially.
 *
 * @param {string} operation - The operation to perform
 * @param {number[]} numbers - Array of numbers to operate on
 * @returns {number} The calculation result
 * @throws {Error} If division by zero is attempted
 */
function calculate(operation, numbers) {
  switch (operation) {
    case 'add':
      // Sum all numbers
      // reduce starts with 0 and adds each number
      return numbers.reduce((sum, num) => sum + num, 0);

    case 'subtract':
      // Subtract all numbers from the first
      // Start with first number, subtract rest
      return numbers.reduce((result, num, index) => {
        return index === 0 ? num : result - num;
      });

    case 'multiply':
      // Multiply all numbers together
      // reduce starts with 1 and multiplies each number
      return numbers.reduce((product, num) => product * num, 1);

    case 'divide':
      // Divide first number by all others
      return numbers.reduce((result, num, index) => {
        // First number is the starting dividend
        if (index === 0) {
          return num;
        }

        // Check for division by zero
        if (num === 0) {
          throw new Error('Division by zero is not allowed');
        }

        return result / num;
      });

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Formats the calculation result for display
 *
 * @param {string} operation - The operation performed
 * @param {number[]} numbers - The numbers used
 * @param {number} result - The calculation result
 */
function displayResult(operation, numbers, result) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              Calculation Result            ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log();

  // Build the expression string
  let expression = '';
  const operators = {
    'add': '+',
    'subtract': '-',
    'multiply': '×',
    'divide': '÷'
  };

  const symbol = operators[operation] || operation;
  expression = numbers.join(` ${symbol} `);

  console.log('  Operation:', operation.toUpperCase());
  console.log('  Expression:', expression);
  console.log('  Result:', result);
  console.log();
  console.log('═'.repeat(46));
}

/**
 * Validates that enough numbers were provided for the operation
 *
 * @param {number[]} numbers - Array of numbers
 * @returns {boolean} True if valid count, false otherwise
 */
function validateNumberCount(numbers) {
  // All operations require at least 2 numbers
  const minRequired = 2;

  if (numbers.length < minRequired) {
    console.error(`❌ Error: ${numbers.length < 1 ? 'No' : 'Not enough'} numbers provided`);
    console.error(`   All operations require at least ${minRequired} numbers`);
    console.error(`   You provided: ${numbers.length} number(s)`);
    return false;
  }

  return true;
}

/**
 * Main function - orchestrates the entire calculator logic
 *
 * This function demonstrates a clean flow:
 * 1. Parse arguments
 * 2. Validate input
 * 3. Perform calculation
 * 4. Display result
 * 5. Handle errors
 * 6. Exit with appropriate code
 */
function main() {
  try {
    // Parse command-line arguments
    const parsed = parseArguments();

    // Check if arguments were provided
    if (!parsed) {
      console.error('❌ Error: No arguments provided\n');
      showUsage();
      process.exit(1);
    }

    const { operation, numberArgs } = parsed;

    // Validate operation
    if (!isValidOperation(operation)) {
      console.error(`❌ Error: Unknown operation "${operation}"\n`);
      showUsage();
      process.exit(1);
    }

    // Parse and validate numbers
    const numbers = parseNumbers(numberArgs);
    if (!numbers) {
      console.error('\n💡 Tip: Make sure all arguments after the operation are valid numbers');
      process.exit(1);
    }

    // Validate number count
    if (!validateNumberCount(numbers)) {
      console.error('\n💡 Tip: Provide at least 2 numbers for any operation');
      process.exit(1);
    }

    // Perform calculation
    const result = calculate(operation, numbers);

    // Display result
    displayResult(operation, numbers, result);

    // Exit successfully
    process.exit(0);

  } catch (error) {
    // Handle any errors that occurred during calculation
    console.error('\n❌ Calculation Error:', error.message);

    // Provide helpful context
    if (error.message.includes('Division by zero')) {
      console.error('\n💡 Tip: Make sure you are not dividing by zero');
    }

    // Exit with error code
    process.exit(1);
  }
}

// Execute the calculator
main();

/**
 * LEARNING NOTES:
 *
 * 1. process.argv is an array containing command-line arguments
 *    - process.argv[0]: Path to Node.js executable
 *    - process.argv[1]: Path to the script file
 *    - process.argv[2+]: User-provided arguments
 *
 * 2. All command-line arguments are strings - parse as needed
 *
 * 3. process.exit(code) terminates the process:
 *    - 0 indicates success
 *    - Non-zero (typically 1) indicates error
 *
 * 4. Exit codes are important for shell scripts and automation
 *
 * BEST PRACTICES:
 *
 * 1. Always validate user input thoroughly
 * 2. Provide clear, actionable error messages
 * 3. Include usage instructions for help
 * 4. Use appropriate exit codes
 * 5. Handle edge cases (division by zero, invalid input, etc.)
 * 6. Make error messages specific to the problem
 * 7. Consider adding a --help flag in production tools
 *
 * FUNCTIONAL PROGRAMMING:
 *
 * 1. reduce() is powerful for sequential operations:
 *    - Starts with an initial value
 *    - Applies function to each element
 *    - Accumulates result
 *
 * 2. Common reduce patterns:
 *    - Sum: reduce((sum, n) => sum + n, 0)
 *    - Product: reduce((prod, n) => prod * n, 1)
 *    - Sequential operations: use index to handle first element
 *
 * COMMON USE CASES:
 *
 * 1. CLI tools and utilities
 * 2. Build scripts and automation
 * 3. DevOps and deployment tools
 * 4. Code generators
 * 5. Data processing pipelines
 * 6. Testing and validation tools
 *
 * ENHANCEMENTS FOR PRODUCTION:
 *
 * 1. Add --help and --version flags
 * 2. Support additional operations (power, modulo, etc.)
 * 3. Add interactive mode
 * 4. Support reading from stdin for piping
 * 5. Add expression parsing (e.g., "2 + 3 * 4")
 * 6. Support different number formats (hex, binary, etc.)
 * 7. Use a library like 'commander' or 'yargs' for complex CLIs
 */
