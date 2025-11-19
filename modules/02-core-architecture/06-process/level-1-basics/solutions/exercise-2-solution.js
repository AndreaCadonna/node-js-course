/**
 * SOLUTION: Exercise 2 - Environment Config Reader
 *
 * This solution demonstrates professional configuration management using environment
 * variables through process.env. It showcases validation, type conversion, defaults,
 * and security best practices for handling application configuration.
 *
 * KEY CONCEPTS DEMONSTRATED:
 * - Reading from process.env
 * - Type conversion (string to number, boolean)
 * - Default value handling
 * - Configuration validation
 * - Required vs optional settings
 * - Secure display of sensitive data
 * - Error handling for missing configuration
 *
 * PRODUCTION FEATURES:
 * - Robust type conversion with validation
 * - Clear error messages for missing required variables
 * - Secure masking of sensitive values (passwords, tokens, URLs)
 * - Comprehensive configuration loading with defaults
 * - Well-structured configuration object
 */

/**
 * Retrieves an environment variable with optional default value
 *
 * This is the foundation function for all environment variable access.
 * It provides consistent handling of undefined variables and trimming.
 *
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Default value if variable not set
 * @returns {string} The environment variable value or default
 */
function getEnv(key, defaultValue = '') {
  // Check if the variable exists in process.env
  const value = process.env[key];

  // If undefined, return the default value
  if (value === undefined) {
    return defaultValue;
  }

  // Trim whitespace from the value to handle user errors
  // This prevents issues like "true " vs "true"
  return value.trim();
}

/**
 * Retrieves an environment variable and parses it as a number
 *
 * This function safely converts string environment variables to numbers,
 * with validation to ensure the result is a valid number.
 *
 * @param {string} key - Environment variable name
 * @param {number} defaultValue - Default value if not found or invalid
 * @returns {number} The parsed number or default value
 */
function getEnvAsNumber(key, defaultValue = 0) {
  // Get the string value
  const value = getEnv(key);

  // If empty string (variable not set), return default
  if (!value) {
    return defaultValue;
  }

  // Parse the value as an integer (base 10)
  const parsed = parseInt(value, 10);

  // Check if parsing resulted in NaN (Not a Number)
  // This happens when the value is not a valid number
  if (isNaN(parsed)) {
    console.warn(`⚠️  Warning: ${key}="${value}" is not a valid number, using default: ${defaultValue}`);
    return defaultValue;
  }

  return parsed;
}

/**
 * Retrieves an environment variable and parses it as a boolean
 *
 * This function converts common boolean representations to actual boolean values.
 * It's lenient and accepts multiple formats for user convenience.
 *
 * Truthy values: 'true', '1', 'yes', 'on' (case-insensitive)
 * Falsy values: anything else including 'false', '0', 'no', 'off', or empty
 *
 * @param {string} key - Environment variable name
 * @param {boolean} defaultValue - Default value if not found
 * @returns {boolean} The parsed boolean value
 */
function getEnvAsBoolean(key, defaultValue = false) {
  // Get the string value
  const value = getEnv(key);

  // If empty string (variable not set), return default
  if (!value) {
    return defaultValue;
  }

  // Convert to lowercase for case-insensitive comparison
  const lowerValue = value.toLowerCase();

  // Check against common truthy representations
  // This allows flexibility: TRUE, true, True, 1, YES, yes, ON, on, etc.
  return lowerValue === 'true' ||
         lowerValue === '1' ||
         lowerValue === 'yes' ||
         lowerValue === 'on';
}

/**
 * Validates that all required environment variables are set
 *
 * This function performs upfront validation to fail fast if required
 * configuration is missing. This prevents the application from starting
 * in an invalid state.
 *
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} If any required variables are missing
 * @returns {boolean} True if all required variables exist
 */
function validateRequiredEnv(requiredVars) {
  // Collect all missing variables
  const missing = [];

  for (const varName of requiredVars) {
    // Check if variable exists and is not empty after trimming
    const value = process.env[varName];
    if (value === undefined || value.trim() === '') {
      missing.push(varName);
    }
  }

  // If any variables are missing, throw a descriptive error
  if (missing.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      '',
      missing.map(v => `  - ${v}`).join('\n'),
      '',
      'Please set these variables before running the application.',
      'Example:',
      `  export ${missing[0]}=value`,
      `  # or`,
      `  ${missing[0]}=value node ${process.argv[1]}`
    ].join('\n');

    throw new Error(errorMessage);
  }

  return true;
}

/**
 * Masks sensitive values for secure display
 *
 * This function partially hides sensitive information like passwords,
 * API keys, and database URLs while keeping enough visible for verification.
 *
 * @param {string} value - The sensitive value to mask
 * @param {number} visibleStart - Characters to show at start (default: 8)
 * @param {number} visibleEnd - Characters to show at end (default: 4)
 * @returns {string} Masked value
 */
function maskSensitiveValue(value, visibleStart = 8, visibleEnd = 4) {
  if (!value) return '(not set)';

  // For very short values, just show asterisks
  if (value.length <= visibleStart + visibleEnd) {
    return '*'.repeat(value.length);
  }

  // Show beginning and end, mask the middle
  const start = value.substring(0, visibleStart);
  const end = value.substring(value.length - visibleEnd);
  const maskedLength = value.length - visibleStart - visibleEnd;

  return `${start}${'*'.repeat(Math.min(maskedLength, 20))}${end}`;
}

/**
 * Loads complete application configuration from environment variables
 *
 * This is the main configuration loading function that orchestrates
 * validation, parsing, and returns a typed configuration object.
 *
 * @returns {Object|null} Configuration object or null if validation fails
 */
function loadConfig() {
  console.log('📋 Loading configuration from environment variables...\n');

  try {
    // Step 1: Define which variables are required
    // These MUST be set or the application will not start
    const requiredVars = ['APP_NAME', 'DATABASE_URL'];

    // Step 2: Validate required variables
    // This will throw an error if any are missing
    validateRequiredEnv(requiredVars);

    // Step 3: Load all configuration with appropriate types and defaults
    const config = {
      // Required: Application name
      appName: getEnv('APP_NAME'),

      // Optional: Environment (development, staging, production)
      // Default: 'development'
      appEnv: getEnv('APP_ENV', 'development'),

      // Optional: Server port
      // Default: 3000
      port: getEnvAsNumber('PORT', 3000),

      // Optional: Debug mode flag
      // Default: false
      debug: getEnvAsBoolean('DEBUG', false),

      // Optional: Maximum concurrent connections
      // Default: 100
      maxConnections: getEnvAsNumber('MAX_CONNECTIONS', 100),

      // Required: Database connection URL
      databaseUrl: getEnv('DATABASE_URL'),

      // Optional: API timeout in milliseconds
      // Default: 30000 (30 seconds)
      apiTimeout: getEnvAsNumber('API_TIMEOUT', 30000),

      // Optional: Enable request logging
      // Default: false
      enableLogging: getEnvAsBoolean('ENABLE_LOGGING', false),

      // Optional: API base URL
      // Default: 'http://localhost:3000'
      apiBaseUrl: getEnv('API_BASE_URL', 'http://localhost:3000')
    };

    console.log('✅ Configuration loaded successfully!\n');
    return config;

  } catch (error) {
    // Handle validation errors
    console.error(error.message);
    console.error('\n💡 Tip: You can set environment variables in your shell or .env file');
    return null;
  }
}

/**
 * Displays configuration in a formatted, secure manner
 *
 * This function presents the configuration to the user while:
 * - Masking sensitive values
 * - Formatting for readability
 * - Adding helpful context
 *
 * @param {Object} config - Configuration object to display
 */
function displayConfig(config) {
  if (!config) {
    console.log('❌ No configuration to display (validation failed)');
    return;
  }

  console.log('╔════════════════════════════════════════════╗');
  console.log('║      Application Configuration             ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log();

  // Helper function to format key-value pairs with alignment
  const formatLine = (key, value, sensitive = false) => {
    const displayValue = sensitive ? maskSensitiveValue(value) : value;
    const paddedKey = key.padEnd(20, ' ');
    console.log(`  ${paddedKey} : ${displayValue}`);
  };

  // Display all configuration values
  formatLine('App Name', config.appName);
  formatLine('Environment', config.appEnv);
  formatLine('Port', config.port.toString());
  formatLine('Debug Mode', config.debug ? 'ENABLED' : 'DISABLED');
  formatLine('Max Connections', config.maxConnections.toString());
  formatLine('Database URL', config.databaseUrl, true); // Sensitive!
  formatLine('API Timeout', `${config.apiTimeout}ms`);
  formatLine('Request Logging', config.enableLogging ? 'ENABLED' : 'DISABLED');
  formatLine('API Base URL', config.apiBaseUrl);

  console.log();

  // Display environment-specific warnings
  if (config.appEnv === 'production' && config.debug) {
    console.log('⚠️  WARNING: Debug mode is enabled in production!');
  }

  if (config.appEnv !== 'production' && !config.debug) {
    console.log('💡 TIP: Enable DEBUG=true for development');
  }

  console.log('═'.repeat(46));
}

/**
 * Displays example usage and tips
 */
function displayUsageExamples() {
  console.log('\n📚 Usage Examples:\n');
  console.log('1. Set variables inline:');
  console.log('   APP_NAME=MyApp DATABASE_URL=postgres://localhost/db node exercise-2-solution.js\n');

  console.log('2. Export variables in shell:');
  console.log('   export APP_NAME=MyApp');
  console.log('   export DATABASE_URL=postgres://localhost/db');
  console.log('   node exercise-2-solution.js\n');

  console.log('3. Use a .env file (with dotenv package):');
  console.log('   # Create .env file with:');
  console.log('   APP_NAME=MyApp');
  console.log('   DATABASE_URL=postgres://localhost/db');
  console.log('   DEBUG=true\n');

  console.log('4. All available variables:');
  console.log('   APP_NAME          (required) - Application name');
  console.log('   DATABASE_URL      (required) - Database connection string');
  console.log('   APP_ENV           (optional) - Environment: development/staging/production');
  console.log('   PORT              (optional) - Server port number');
  console.log('   DEBUG             (optional) - Enable debug mode: true/false');
  console.log('   MAX_CONNECTIONS   (optional) - Maximum concurrent connections');
  console.log('   API_TIMEOUT       (optional) - API timeout in milliseconds');
  console.log('   ENABLE_LOGGING    (optional) - Enable request logging: true/false');
  console.log('   API_BASE_URL      (optional) - API base URL');
}

/**
 * Main execution function
 */
function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Environment Config Reader - Solution     ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log();

  // For demonstration, set some test values if none are set
  // In production, you would never hardcode these!
  if (!process.env.APP_NAME) {
    console.log('ℹ️  No environment variables detected. Setting test values...\n');
    process.env.APP_NAME = 'MyTestApp';
    process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/mydb';
    process.env.PORT = '8080';
    process.env.DEBUG = 'true';
    process.env.APP_ENV = 'development';
    process.env.ENABLE_LOGGING = 'yes';
  }

  // Load configuration
  const config = loadConfig();

  // Display configuration
  displayConfig(config);

  // Show usage examples
  if (config) {
    displayUsageExamples();
  }
}

// Execute the main function
main();

/**
 * LEARNING NOTES:
 *
 * 1. process.env contains all environment variables as strings
 * 2. All values in process.env are strings - type conversion is necessary
 * 3. Environment variables are a standard way to configure applications
 * 4. They allow different configurations without code changes
 * 5. Sensitive data should never be committed to version control
 * 6. Use .env files (with .gitignore) for local development
 *
 * BEST PRACTICES:
 *
 * 1. Always validate required environment variables at startup
 * 2. Provide sensible defaults for optional variables
 * 3. Fail fast if required configuration is missing
 * 4. Never log or display sensitive values in plain text
 * 5. Use type conversion functions to ensure correct data types
 * 6. Document all configuration options clearly
 * 7. Consider using a library like 'dotenv' for .env file support
 * 8. Use strong typing (TypeScript) in production applications
 *
 * SECURITY CONSIDERATIONS:
 *
 * 1. Never commit .env files to version control
 * 2. Mask sensitive values in logs and displays
 * 3. Validate input from environment variables
 * 4. Use different configurations for different environments
 * 5. Consider using secret management tools in production (e.g., Vault, AWS Secrets Manager)
 * 6. Limit who has access to production environment variables
 *
 * COMMON USE CASES:
 *
 * 1. Database connection strings
 * 2. API keys and secrets
 * 3. Feature flags
 * 4. Server ports and hostnames
 * 5. Third-party service URLs
 * 6. Environment-specific settings (dev/staging/prod)
 */
