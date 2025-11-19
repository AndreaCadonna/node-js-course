/**
 * Exercise 2: Environment Config Reader
 *
 * OBJECTIVE:
 * Learn to work with environment variables and process.env to manage application configuration.
 *
 * REQUIREMENTS:
 * 1. Read environment variables from process.env
 * 2. Set default values for missing variables
 * 3. Validate required environment variables
 * 4. Parse different data types (string, number, boolean)
 * 5. Display configuration in a structured format
 * 6. Handle missing required variables with proper error messages
 *
 * LEARNING GOALS:
 * - Understanding process.env
 * - Working with environment variables
 * - Validating and parsing configuration
 * - Setting defaults for optional variables
 * - Error handling for missing configuration
 */

/**
 * TODO 1: Implement function to get environment variable with default
 *
 * Steps:
 * 1. Check if the variable exists in process.env
 * 2. If it exists, return its value
 * 3. If it doesn't exist, return the default value
 * 4. Trim whitespace from the value
 *
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Default value if not found
 * @returns {string} The environment variable value or default
 */
function getEnv(key, defaultValue = '') {
  // Your code here
}

/**
 * TODO 2: Implement function to get environment variable as number
 *
 * Steps:
 * 1. Get the value using getEnv()
 * 2. Parse it as an integer using parseInt()
 * 3. Check if the result is NaN
 * 4. If NaN, return the default value
 * 5. Otherwise, return the parsed number
 *
 * @param {string} key - Environment variable name
 * @param {number} defaultValue - Default value if not found or invalid
 * @returns {number} The parsed number or default
 */
function getEnvAsNumber(key, defaultValue = 0) {
  // Your code here
}

/**
 * TODO 3: Implement function to get environment variable as boolean
 *
 * Steps:
 * 1. Get the value using getEnv()
 * 2. Convert to lowercase for comparison
 * 3. Return true if value is 'true', '1', 'yes', or 'on'
 * 4. Return false otherwise
 *
 * @param {string} key - Environment variable name
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean} The parsed boolean or default
 */
function getEnvAsBoolean(key, defaultValue = false) {
  // Your code here
}

/**
 * TODO 4: Implement function to validate required variables
 *
 * Steps:
 * 1. Accept an array of required variable names
 * 2. Check each variable in process.env
 * 3. Collect all missing variables in an array
 * 4. If any are missing, throw an error with the list
 * 5. If all exist, return true
 *
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variables are missing
 */
function validateRequiredEnv(requiredVars) {
  // Your code here
}

/**
 * TODO 5: Implement function to load application configuration
 *
 * Steps:
 * 1. Define required variables array
 * 2. Validate required variables first
 * 3. Load all configuration with appropriate types:
 *    - APP_NAME (string, required)
 *    - APP_ENV (string, default: 'development')
 *    - PORT (number, default: 3000)
 *    - DEBUG (boolean, default: false)
 *    - MAX_CONNECTIONS (number, default: 100)
 *    - DATABASE_URL (string, required)
 * 4. Return configuration object
 * 5. Handle validation errors with try/catch
 */
function loadConfig() {
  console.log('Loading configuration from environment variables...\n');

  try {
    // Your code here
    // Return config object like:
    // return {
    //   appName: ...,
    //   appEnv: ...,
    //   port: ...,
    //   debug: ...,
    //   maxConnections: ...,
    //   databaseUrl: ...
    // };
  } catch (error) {
    // Handle error here
  }
}

/**
 * TODO 6: Implement function to display configuration
 *
 * Steps:
 * 1. Accept a config object
 * 2. Display each configuration key and value
 * 3. Format nicely with alignment
 * 4. Hide sensitive values (like DATABASE_URL) by showing only first/last few characters
 *
 * Hint: For DATABASE_URL, show like "postgres://use...@localhost:5432/mydb"
 */
function displayConfig(config) {
  console.log('--- Application Configuration ---');
  // Your code here
}

// TODO 7: Test the configuration loader
// Try running with different environment variables

console.log('=== Environment Config Reader ===\n');

// Example: Set some test environment variables
// Uncomment and modify these for testing:
// process.env.APP_NAME = 'MyApp';
// process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/mydb';
// process.env.PORT = '8080';
// process.env.DEBUG = 'true';

// Call your functions here

console.log('\nTip: Run this script with environment variables:');
console.log('APP_NAME=MyApp DATABASE_URL=postgres://localhost/db node exercise-2.js');
