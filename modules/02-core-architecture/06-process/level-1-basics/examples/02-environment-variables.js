/**
 * 02-environment-variables.js
 * ============================
 * Demonstrates how to read and work with environment variables in Node.js
 *
 * Key Concepts:
 * - Accessing environment variables with process.env
 * - Reading common system environment variables
 * - Setting environment variables at runtime
 * - Using environment variables for configuration
 * - Best practices for environment variable usage
 *
 * Run: node 02-environment-variables.js
 * Run with custom env: NODE_ENV=production PORT=8080 node 02-environment-variables.js
 */

console.log('=== Environment Variables Example ===\n');

// =============================================================================
// READING ENVIRONMENT VARIABLES
// =============================================================================

console.log('--- Reading Environment Variables ---\n');

// process.env: An object containing all environment variables
// Environment variables are key-value pairs available to all processes

// Common system environment variables
console.log('Common System Variables:');
console.log(`  USER: ${process.env.USER || process.env.USERNAME || 'not set'}`);
console.log(`  HOME: ${process.env.HOME || process.env.USERPROFILE || 'not set'}`);
console.log(`  PATH: ${process.env.PATH?.substring(0, 50)}... (truncated)`);
console.log(`  SHELL: ${process.env.SHELL || 'not set'}`);
console.log(`  LANG: ${process.env.LANG || 'not set'}`);
console.log();

// Node.js specific environment variables
console.log('Node.js Specific Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  NODE_PATH: ${process.env.NODE_PATH || 'not set'}`);
console.log(`  NODE_OPTIONS: ${process.env.NODE_OPTIONS || 'not set'}`);
console.log();

// =============================================================================
// CUSTOM ENVIRONMENT VARIABLES
// =============================================================================

console.log('--- Custom Environment Variables ---\n');

// In production applications, you typically use environment variables for:
// - API keys and secrets
// - Database connection strings
// - Port numbers
// - Feature flags
// - Environment-specific configuration

// Check if custom variables are set
console.log('Application Configuration (from environment):');
console.log(`  PORT: ${process.env.PORT || '3000 (default)'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL || 'not set'}`);
console.log(`  API_KEY: ${process.env.API_KEY ? '***hidden***' : 'not set'}`);
console.log(`  LOG_LEVEL: ${process.env.LOG_LEVEL || 'info (default)'}`);
console.log();

// =============================================================================
// SETTING ENVIRONMENT VARIABLES AT RUNTIME
// =============================================================================

console.log('--- Setting Environment Variables at Runtime ---\n');

// You can modify process.env during runtime
// WARNING: This only affects the current process and its children
console.log('Setting variables at runtime...');

process.env.CUSTOM_VARIABLE = 'Hello from Node.js';
process.env.APP_VERSION = '1.0.0';
process.env.FEATURE_FLAG = 'true';

console.log(`  CUSTOM_VARIABLE: ${process.env.CUSTOM_VARIABLE}`);
console.log(`  APP_VERSION: ${process.env.APP_VERSION}`);
console.log(`  FEATURE_FLAG: ${process.env.FEATURE_FLAG}`);
console.log();

// =============================================================================
// ENVIRONMENT-BASED CONFIGURATION
// =============================================================================

console.log('--- Environment-Based Configuration ---\n');

// Common pattern: Different behavior based on NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Current Environment: ${NODE_ENV}`);
console.log();

// Configuration object based on environment
const config = {
  environment: NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',

  // Port configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'localhost:5432',
    poolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 10,
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'error' : 'debug'),
    enabled: process.env.LOGGING !== 'false',
  },

  // Feature flags
  features: {
    beta: process.env.FEATURE_BETA === 'true',
    analytics: process.env.FEATURE_ANALYTICS !== 'false', // Default enabled
  },
};

console.log('Application Configuration:');
console.log(JSON.stringify(config, null, 2));
console.log();

// =============================================================================
// CHECKING FOR REQUIRED VARIABLES
// =============================================================================

console.log('--- Validating Required Variables ---\n');

// In production apps, you should validate that required env vars are set
function checkRequiredEnvVars(requiredVars) {
  const missing = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

// Example: Check for required variables
const requiredInProduction = ['DATABASE_URL', 'API_KEY', 'SECRET_KEY'];

console.log('Checking for required variables...');
const missingVars = checkRequiredEnvVars(requiredInProduction);

if (missingVars.length > 0) {
  console.log(`  Missing variables: ${missingVars.join(', ')}`);
  if (NODE_ENV === 'production') {
    console.log('  WARNING: These variables are required in production!');
  } else {
    console.log('  (Not in production, so this is just a warning)');
  }
} else {
  console.log('  All required variables are set');
}
console.log();

// =============================================================================
// ENVIRONMENT VARIABLE TYPES
// =============================================================================

console.log('--- Working with Different Types ---\n');

// Environment variables are always STRINGS
// You need to parse them for other types

// String (default)
const apiUrl = process.env.API_URL || 'http://localhost:3000';
console.log(`API URL (string): ${apiUrl}`);

// Number
const port = parseInt(process.env.PORT || '3000', 10);
console.log(`Port (number): ${port} (type: ${typeof port})`);

// Boolean
// Common patterns: 'true'/'false', '1'/'0', 'yes'/'no'
const debugMode = process.env.DEBUG === 'true';
console.log(`Debug Mode (boolean): ${debugMode} (type: ${typeof debugMode})`);

// Array (comma-separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'localhost,127.0.0.1').split(',');
console.log(`Allowed Origins (array): ${JSON.stringify(allowedOrigins)}`);

// JSON (for complex configuration)
try {
  const complexConfig = JSON.parse(process.env.CONFIG || '{"key":"value"}');
  console.log(`Complex Config (JSON): ${JSON.stringify(complexConfig)}`);
} catch (error) {
  console.log('Complex Config: Invalid JSON in CONFIG env var');
}
console.log();

// =============================================================================
// BEST PRACTICES
// =============================================================================

console.log('--- Best Practices ---\n');

// 1. Use default values
const timeout = parseInt(process.env.TIMEOUT || '5000', 10);
console.log(`1. Default values: timeout = ${timeout}ms`);

// 2. Never commit secrets to version control
console.log('2. Never commit secrets to version control');
console.log('   Use .env files (with .gitignore) or secret management tools');

// 3. Document required variables
console.log('3. Document required environment variables in README.md');

// 4. Validate early
console.log('4. Validate required variables at application startup');

// 5. Use meaningful names
console.log('5. Use clear, consistent naming (e.g., DATABASE_URL, not DB)');

// 6. Group related variables
console.log('6. Group related variables with prefixes (e.g., DB_*, AWS_*)');

console.log();

// =============================================================================
// LISTING ALL ENVIRONMENT VARIABLES
// =============================================================================

console.log('--- Listing All Environment Variables ---\n');

// Get all environment variable names
const envVarNames = Object.keys(process.env).sort();
console.log(`Total environment variables: ${envVarNames.length}`);
console.log('\nFirst 10 variables:');

envVarNames.slice(0, 10).forEach((name) => {
  // Truncate long values for display
  const value = process.env[name] || '';
  const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
  console.log(`  ${name}: ${displayValue}`);
});

console.log('\n(Use console.log(process.env) to see all variables)');
console.log();

console.log('=== Key Takeaways ===');
console.log('• Environment variables are accessed via process.env');
console.log('• All environment variables are strings - parse as needed');
console.log('• Use environment variables for configuration, not secrets in code');
console.log('• Always provide default values for optional variables');
console.log('• Validate required variables at application startup');
console.log('• Use NODE_ENV to control environment-specific behavior');

// =============================================================================
// Additional Notes:
// =============================================================================

/**
 * SETTING ENVIRONMENT VARIABLES:
 *
 * 1. Command Line (temporary, for that execution only):
 *    # Linux/macOS
 *    NODE_ENV=production PORT=8080 node app.js
 *
 *    # Windows (cmd)
 *    set NODE_ENV=production && node app.js
 *
 *    # Windows (PowerShell)
 *    $env:NODE_ENV="production"; node app.js
 *
 * 2. .env File (using dotenv package):
 *    # .env file
 *    NODE_ENV=development
 *    PORT=3000
 *    DATABASE_URL=postgres://localhost/mydb
 *
 *    // JavaScript
 *    require('dotenv').config();
 *    console.log(process.env.DATABASE_URL);
 *
 * 3. System-wide (persistent):
 *    # Linux/macOS (~/.bashrc or ~/.zshrc)
 *    export NODE_ENV=production
 *
 *    # Windows (System Properties > Environment Variables)
 *
 * 4. Docker:
 *    docker run -e NODE_ENV=production -e PORT=8080 myapp
 *
 * 5. Cloud Platforms:
 *    Most cloud platforms (Heroku, AWS, Azure, etc.) provide
 *    web interfaces or CLI tools to set environment variables
 *
 * SECURITY NOTES:
 * - Never commit .env files to version control (add to .gitignore)
 * - Never log sensitive environment variables
 * - Use secret management services for production (AWS Secrets Manager, etc.)
 * - Rotate secrets regularly
 * - Limit access to environment variables in production
 */
