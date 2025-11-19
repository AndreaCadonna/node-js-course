/**
 * Exercise 3: CLI Calculator
 *
 * OBJECTIVE:
 * Build a command-line calculator that processes arguments using process.argv.
 *
 * REQUIREMENTS:
 * 1. Parse command-line arguments from process.argv
 * 2. Support basic operations: add, subtract, multiply, divide
 * 3. Handle variable number of operands (e.g., add 1 2 3 4)
 * 4. Validate input and show helpful error messages
 * 5. Display usage instructions when arguments are invalid
 * 6. Exit with appropriate exit codes (0 for success, 1 for errors)
 *
 * LEARNING GOALS:
 * - Understanding process.argv
 * - Parsing command-line arguments
 * - Input validation
 * - Using process.exit()
 * - Error handling and user feedback
 */

/**
 * TODO 1: Implement function to display usage instructions
 *
 * Steps:
 * 1. Show the program name and purpose
 * 2. Display usage syntax
 * 3. List all supported operations
 * 4. Provide examples for each operation
 * 5. Use process.argv[1] to show the script name
 */
function showUsage() {
  console.log('CLI Calculator');
  console.log('==============\n');
  console.log('Usage:');
  // Your code here
  // Show: node exercise-3.js <operation> <number1> <number2> [number3...]
  // Operations: add, subtract, multiply, divide
  // Examples for each operation
}

/**
 * TODO 2: Implement function to parse arguments
 *
 * Steps:
 * 1. Get arguments from process.argv (skip first 2 elements)
 * 2. First argument should be the operation
 * 3. Remaining arguments should be numbers
 * 4. Return an object with operation and numbers array
 * 5. Return null if no arguments provided
 *
 * Hint: process.argv[0] is node, process.argv[1] is script name
 *
 * @returns {Object|null} { operation: string, numbers: number[] }
 */
function parseArguments() {
  // Your code here
}

/**
 * TODO 3: Implement function to validate operation
 *
 * Steps:
 * 1. Check if operation is one of: add, subtract, multiply, divide
 * 2. Return true if valid
 * 3. Return false if invalid
 *
 * @param {string} operation - The operation to validate
 * @returns {boolean}
 */
function isValidOperation(operation) {
  // Your code here
}

/**
 * TODO 4: Implement function to validate and parse numbers
 *
 * Steps:
 * 1. Take array of string arguments
 * 2. Try to parse each as a number
 * 3. Check if parsing resulted in valid numbers (not NaN)
 * 4. Return array of numbers if all valid
 * 5. Return null if any invalid numbers found
 *
 * @param {string[]} args - Array of string arguments
 * @returns {number[]|null} Array of numbers or null if invalid
 */
function parseNumbers(args) {
  // Your code here
}

/**
 * TODO 5: Implement calculator operations
 *
 * Steps:
 * 1. Implement add: sum all numbers
 * 2. Implement subtract: subtract all from the first
 * 3. Implement multiply: multiply all numbers
 * 4. Implement divide: divide first by all others
 * 5. For divide, check for division by zero
 * 6. Return the result
 *
 * @param {string} operation - The operation to perform
 * @param {number[]} numbers - Array of numbers
 * @returns {number} The calculation result
 */
function calculate(operation, numbers) {
  // Your code here
  // Hint: Use reduce() for elegant solutions
}

/**
 * TODO 6: Implement main function
 *
 * Steps:
 * 1. Parse command-line arguments
 * 2. If no arguments, show usage and exit with code 1
 * 3. Validate the operation
 * 4. Parse and validate numbers
 * 5. Check minimum number requirements:
 *    - add/multiply: at least 2 numbers
 *    - subtract/divide: at least 2 numbers
 * 6. Perform calculation
 * 7. Display result
 * 8. Handle errors with try/catch
 * 9. Exit with code 0 on success, 1 on error
 */
function main() {
  try {
    // Your code here

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// TODO 7: Run the calculator
// Call main function

console.log('=== CLI Calculator ===\n');

// Call your main function here

// Test examples (comment out when running with real arguments):
// node exercise-3.js add 5 10 15
// node exercise-3.js subtract 100 25 10
// node exercise-3.js multiply 2 3 4
// node exercise-3.js divide 100 2 5
