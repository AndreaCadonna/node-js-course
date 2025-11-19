# Environment Variables

## Introduction

This guide provides a comprehensive deep dive into environment variables in Node.js. You'll learn what they are, why they're essential, how to use them securely, and best practices for configuration management.

---

## What Are Environment Variables?

### Definition

Environment variables are **key-value pairs** set outside your code that configure how your application runs. They exist in the shell environment where your Node.js process runs.

```javascript
// Accessing environment variables
const port = process.env.PORT;
const dbUrl = process.env.DATABASE_URL;
const nodeEnv = process.env.NODE_ENV;

console.log(port);    // '3000'
console.log(dbUrl);   // 'postgresql://localhost/mydb'
console.log(nodeEnv); // 'development'
```

### Key Characteristics

1. **String values** - Always strings, never numbers or booleans
2. **Set outside code** - Configured in shell, config files, or hosting platforms
3. **Process-scoped** - Each process has its own set
4. **Inherited** - Child processes inherit parent's environment
5. **Runtime configuration** - Change behavior without changing code

---

## Real-World Analogies

### Analogy 1: Recipe Adjustments

**Your code is a recipe:**

```
Recipe: Chocolate Chip Cookies
- Mix flour, sugar, butter
- Bake at [TEMPERATURE]°F for [TIME] minutes
- Makes [SERVINGS] cookies

Environment variables = temperature, time, servings
```

The recipe (code) stays the same, but you adjust variables based on:
- Your oven (production vs. development)
- How many people you're serving (scale)
- Altitude and humidity (environment conditions)

### Analogy 2: Car Dashboard Settings

**Your app is a car, environment variables are settings:**

- **Seat position** → Database URL (where you connect)
- **Mirror angles** → Logging level (what you see)
- **Climate control** → Performance settings
- **Radio station** → API endpoints

Different drivers (environments) need different settings, but the car (code) is the same.

### Analogy 3: Movie Theater Settings

**Your application is a movie:**

- **Volume** → Log verbosity
- **Brightness** → Debug mode
- **Subtitles** → Localization
- **Theater** → Server location

Same movie, different viewing experience based on settings.

---

## Why Use Environment Variables?

### Problem Without Environment Variables

```javascript
// hardcoded-config.js
const config = {
  port: 3000,
  database: 'postgresql://localhost:5432/mydb',
  apiKey: 'sk_live_abc123xyz',
  debug: true,
};

// Problems:
// 1. Secrets in code (security risk)
// 2. Same config for all environments
// 3. Must change code to change config
// 4. Can't deploy the same code everywhere
// 5. Secrets end up in git history
```

### Solution With Environment Variables

```javascript
// config.js
const config = {
  port: process.env.PORT || 3000,
  database: process.env.DATABASE_URL,
  apiKey: process.env.API_KEY,
  debug: process.env.DEBUG === 'true',
};

// Benefits:
// 1. No secrets in code
// 2. Different config per environment
// 3. Change config without changing code
// 4. Same code deploys everywhere
// 5. Secrets never committed to git
```

---

## How Environment Variables Work

### The Environment

Every process runs in an "environment" - a collection of key-value pairs:

```bash
# In your shell
export PORT=3000
export NODE_ENV=development
export API_KEY=secret123

# Now start Node.js
node app.js
```

```javascript
// app.js can read these
console.log(process.env.PORT);      // '3000'
console.log(process.env.NODE_ENV);  // 'development'
console.log(process.env.API_KEY);   // 'secret123'
```

### Visualization

```
┌─────────────────────────────────────┐
│      Operating System Shell         │
│                                     │
│  Environment Variables:             │
│  ┌────────────────────────────┐    │
│  │ PORT=3000                  │    │
│  │ NODE_ENV=development       │    │
│  │ API_KEY=secret123          │    │
│  │ PATH=/usr/bin:/bin         │    │
│  │ HOME=/home/user            │    │
│  └────────────┬───────────────┘    │
│               │ Inherited           │
│               ↓                     │
│  ┌────────────────────────────┐    │
│  │   Node.js Process          │    │
│  │                            │    │
│  │   process.env = {          │    │
│  │     PORT: '3000',          │    │
│  │     NODE_ENV: 'dev...',    │    │
│  │     API_KEY: 'secret...',  │    │
│  │     ...                    │    │
│  │   }                        │    │
│  └────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Setting Environment Variables

### Method 1: Inline (Unix/Linux/Mac)

```bash
# Set for single command
PORT=3000 node app.js

# Multiple variables
PORT=3000 NODE_ENV=production node app.js
```

### Method 2: Export in Shell (Unix/Linux/Mac)

```bash
# Set in current shell session
export PORT=3000
export NODE_ENV=development

# Now available for all commands
node app.js
```

### Method 3: Windows Command Prompt

```cmd
# Set for session
set PORT=3000
set NODE_ENV=development
node app.js
```

### Method 4: Windows PowerShell

```powershell
# Set for session
$env:PORT=3000
$env:NODE_ENV="development"
node app.js
```

### Method 5: .env Files (Development)

```bash
# .env file
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost/mydb
API_KEY=dev_key_123
SECRET=super_secret
```

```javascript
// app.js
require('dotenv').config(); // Load .env file

console.log(process.env.PORT);        // '3000'
console.log(process.env.DATABASE_URL); // 'postgresql://...'
```

### Method 6: System-Wide (Unix/Linux)

```bash
# ~/.bashrc or ~/.zshrc
export NODE_ENV=development
export EDITOR=vim

# Available in all new shells
```

### Method 7: Cloud Platforms

```bash
# Heroku
heroku config:set PORT=3000
heroku config:set NODE_ENV=production

# AWS
aws lambda update-function-configuration \
  --environment Variables={NODE_ENV=production}

# Vercel
vercel env add NODE_ENV production
```

---

## Common Environment Variables

### NODE_ENV

**The most important Node.js environment variable:**

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Different behavior based on environment
if (isProduction) {
  // Enable caching, minification, error tracking
  app.use(compression());
  app.use(helmet());
} else {
  // Enable detailed logging, hot reload
  app.use(logger('dev'));
  app.use(errorhandler());
}
```

**Common values:**
- `development` - Local development
- `production` - Live deployment
- `test` - Running tests
- `staging` - Pre-production testing

### PORT

```javascript
// Server port
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Why it matters:
// - Cloud platforms assign ports dynamically
// - Can't hardcode port in deployed apps
```

### Database URLs

```javascript
// Database connection strings
const dbUrl = process.env.DATABASE_URL ||
  'postgresql://localhost:5432/mydb';

const redisUrl = process.env.REDIS_URL ||
  'redis://localhost:6379';

// Keeps credentials out of code
```

### API Keys and Secrets

```javascript
// External service credentials
const stripeKey = process.env.STRIPE_API_KEY;
const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
const jwtSecret = process.env.JWT_SECRET;

// NEVER hardcode these in your code!
```

### Logging and Debug

```javascript
// Logging level
const logLevel = process.env.LOG_LEVEL || 'info';

// Debug flags
const debug = process.env.DEBUG === 'true';
const verbose = process.env.VERBOSE === 'true';
```

---

## Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
secrets.json
```

```javascript
// BAD: Secrets in code
const apiKey = 'sk_live_abc123xyz';

// GOOD: Secrets from environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable required');
}
```

### 2. Provide Example Files

```bash
# .env.example (commit this)
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost/mydb
API_KEY=your_api_key_here
SECRET=your_secret_here

# README.md
To run this project:
1. Copy .env.example to .env
2. Fill in your actual values
3. npm start
```

### 3. Validate Required Variables

```javascript
// config/env.js
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Validate at startup
const config = {
  apiKey: requireEnv('API_KEY'),
  databaseUrl: requireEnv('DATABASE_URL'),
  port: process.env.PORT || 3000, // Optional with default
};

module.exports = config;
```

### 4. Type Conversion

```javascript
// Remember: All env vars are strings!

// BAD: Treating as boolean
if (process.env.DEBUG) { // Always truthy if set!
  // This runs even if DEBUG=false
}

// GOOD: Explicit conversion
const debug = process.env.DEBUG === 'true';
const verbose = process.env.VERBOSE === '1';

// BAD: Treating as number
const port = process.env.PORT || 3000; // '8080' || 3000 = '8080' (string!)

// GOOD: Parse as number
const port = parseInt(process.env.PORT || '3000', 10);

// Better: With validation
function parsePort(value, defaultValue) {
  const parsed = parseInt(value || defaultValue, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return parsed;
}

const port = parsePort(process.env.PORT, 3000);
```

### 5. Use Descriptive Names

```javascript
// BAD: Unclear names
process.env.KEY
process.env.URL
process.env.VAL

// GOOD: Clear, descriptive names
process.env.API_KEY
process.env.DATABASE_URL
process.env.MAX_RETRY_ATTEMPTS
```

### 6. Group by Purpose

```javascript
// Database
DATABASE_URL
DATABASE_POOL_SIZE
DATABASE_TIMEOUT

// Redis
REDIS_URL
REDIS_PASSWORD
REDIS_TTL

// AWS
AWS_REGION
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME

// App
NODE_ENV
PORT
LOG_LEVEL
```

---

## Security Best Practices

### 1. Principle of Least Privilege

```javascript
// BAD: Using admin credentials everywhere
AWS_ACCESS_KEY_ID=admin_key
AWS_SECRET_ACCESS_KEY=admin_secret

// GOOD: Use limited-scope credentials
AWS_ACCESS_KEY_ID=readonly_key  // Can only read S3
AWS_SECRET_ACCESS_KEY=readonly_secret
```

### 2. Rotate Credentials Regularly

```javascript
// Use short-lived tokens when possible
const token = await getShortLivedToken(
  process.env.API_KEY
);

// Refresh tokens before they expire
setInterval(refreshToken, 3600000); // Every hour
```

### 3. Never Log Secrets

```javascript
// BAD: Logs contain secrets
console.log('Starting with config:', process.env);

// GOOD: Redact sensitive values
function sanitizeEnv(env) {
  const safe = { ...env };
  const sensitiveKeys = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN'];

  Object.keys(safe).forEach(key => {
    if (sensitiveKeys.some(s => key.includes(s))) {
      safe[key] = '***REDACTED***';
    }
  });

  return safe;
}

console.log('Starting with config:', sanitizeEnv(process.env));
```

### 4. Validate Format

```javascript
// Validate environment variables at startup
function validateConfig() {
  // Check required variables exist
  const required = ['API_KEY', 'DATABASE_URL'];
  required.forEach(key => {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  });

  // Validate format
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }

  // Validate API key format
  if (!/^sk_live_[a-zA-Z0-9]{32}$/.test(process.env.API_KEY)) {
    throw new Error('API_KEY has invalid format');
  }
}

// Call at startup
validateConfig();
```

### 5. Use Secret Management Services

```javascript
// For production, use dedicated secret managers

// AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(name) {
  const data = await secretsManager
    .getSecretValue({ SecretId: name })
    .promise();

  return JSON.parse(data.SecretString);
}

// Usage
const dbCreds = await getSecret('prod/database');
```

---

## Advanced Patterns

### Pattern 1: Environment-Specific Configuration

```javascript
// config/index.js
const configs = {
  development: {
    port: 3000,
    database: 'postgresql://localhost/mydb_dev',
    logLevel: 'debug',
    cacheEnabled: false,
  },

  test: {
    port: 3001,
    database: 'postgresql://localhost/mydb_test',
    logLevel: 'error',
    cacheEnabled: false,
  },

  production: {
    port: process.env.PORT,
    database: process.env.DATABASE_URL,
    logLevel: 'info',
    cacheEnabled: true,
  },
};

const env = process.env.NODE_ENV || 'development';
const config = configs[env];

// Override with environment variables
if (process.env.PORT) {
  config.port = parseInt(process.env.PORT, 10);
}

module.exports = config;
```

### Pattern 2: Configuration Validation with Schema

```javascript
// config/validate.js
const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number()
    .port()
    .default(3000),

  DATABASE_URL: Joi.string()
    .uri()
    .required(),

  API_KEY: Joi.string()
    .pattern(/^sk_live_[a-zA-Z0-9]{32}$/)
    .required(),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  MAX_CONNECTIONS: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10),
});

function validateConfig() {
  const { error, value } = schema.validate(process.env, {
    allowUnknown: true, // Allow other env vars
    abortEarly: false,  // Check all rules
  });

  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    throw new Error(`Config validation error: ${messages}`);
  }

  return value;
}

module.exports = validateConfig();
```

### Pattern 3: Typed Configuration

```javascript
// config/typed.js
class Config {
  constructor() {
    this.nodeEnv = this.getEnv('NODE_ENV', 'development');
    this.port = this.getNumber('PORT', 3000);
    this.isDevelopment = this.nodeEnv === 'development';
    this.isProduction = this.nodeEnv === 'production';
    this.databaseUrl = this.getRequired('DATABASE_URL');
    this.apiKey = this.getRequired('API_KEY');
    this.logLevel = this.getEnv('LOG_LEVEL', 'info');
    this.enableCache = this.getBoolean('ENABLE_CACHE', false);
  }

  getEnv(key, defaultValue) {
    return process.env[key] || defaultValue;
  }

  getRequired(key) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required env var: ${key}`);
    }
    return value;
  }

  getNumber(key, defaultValue) {
    const value = process.env[key];
    if (!value) return defaultValue;

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`${key} must be a number, got: ${value}`);
    }

    return parsed;
  }

  getBoolean(key, defaultValue) {
    const value = process.env[key];
    if (!value) return defaultValue;

    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;

    throw new Error(`${key} must be true/false, got: ${value}`);
  }
}

module.exports = new Config();
```

### Pattern 4: Feature Flags

```javascript
// config/features.js
class FeatureFlags {
  constructor() {
    this.flags = this.parseFeatureFlags();
  }

  parseFeatureFlags() {
    // Format: FEATURES=feature1,feature2,feature3
    const featuresStr = process.env.FEATURES || '';
    const features = featuresStr.split(',').filter(Boolean);

    return new Set(features);
  }

  isEnabled(feature) {
    return this.flags.has(feature);
  }

  enable(feature) {
    this.flags.add(feature);
  }

  disable(feature) {
    this.flags.delete(feature);
  }
}

const features = new FeatureFlags();

// Usage
if (features.isEnabled('newUI')) {
  // Use new UI
} else {
  // Use old UI
}

// Or use specific env vars
const NEW_DASHBOARD = process.env.FEATURE_NEW_DASHBOARD === 'true';
const BETA_API = process.env.FEATURE_BETA_API === 'true';
```

---

## Working with .env Files

### Using dotenv

```bash
# Install
npm install dotenv
```

```javascript
// At the very beginning of your app
require('dotenv').config();

// Or with options
require('dotenv').config({
  path: '.env.local',  // Custom path
  debug: true,         // Log what's being loaded
});

// Now use variables
console.log(process.env.API_KEY);
```

### Multiple .env Files

```javascript
// Load multiple env files with priority
require('dotenv').config({ path: '.env.local' });  // Highest priority
require('dotenv').config({ path: '.env' });        // Default

// Or create custom loader
function loadEnv() {
  const fs = require('fs');
  const path = require('path');

  const files = [
    '.env.local',
    `.env.${process.env.NODE_ENV}`,
    '.env',
  ];

  files.forEach(file => {
    const filepath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filepath)) {
      require('dotenv').config({ path: filepath });
    }
  });
}

loadEnv();
```

### .env File Structure

```bash
# .env

# Comments are supported
# Use SCREAMING_SNAKE_CASE for variable names

# Application
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgresql://localhost:5432/mydb
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=3600

# External APIs
STRIPE_API_KEY=sk_test_abc123
STRIPE_WEBHOOK_SECRET=whsec_xyz789

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Feature Flags
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_API=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# No quotes needed for simple values
# Use quotes for values with spaces or special characters
MESSAGE="Hello, World!"
SPECIAL_CHARS="value=with=equals"
```

---

## Testing with Environment Variables

### Test Setup

```javascript
// test/setup.js
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://localhost/test_db';
process.env.API_KEY = 'test_api_key';

// tests run with these values
```

### Mocking Environment Variables

```javascript
// test/config.test.js
describe('Config', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should use PORT from environment', () => {
    process.env.PORT = '5000';

    // Re-require to get new config
    delete require.cache[require.resolve('../config')];
    const config = require('../config');

    expect(config.port).toBe(5000);
  });

  it('should throw if API_KEY missing', () => {
    delete process.env.API_KEY;

    delete require.cache[require.resolve('../config')];

    expect(() => {
      require('../config');
    }).toThrow('Missing required env var: API_KEY');
  });
});
```

---

## Common Pitfalls

### Pitfall 1: Type Confusion

```javascript
// WRONG: Treating strings as other types
if (process.env.DEBUG) {
  // This is ALWAYS true if DEBUG is set, even if DEBUG=false
}

const port = process.env.PORT || 3000;
// If PORT='8080', port is '8080' (string), not 8080 (number)

// CORRECT:
const debug = process.env.DEBUG === 'true';
const port = parseInt(process.env.PORT || '3000', 10);
```

### Pitfall 2: Missing Variables

```javascript
// WRONG: Assuming variable exists
const apiKey = process.env.API_KEY;
callAPI(apiKey); // Might be undefined!

// CORRECT: Validate first
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable required');
}
callAPI(apiKey);
```

### Pitfall 3: Hardcoded Defaults

```javascript
// WRONG: Hardcoded production values
const dbUrl = process.env.DATABASE_URL || 'prod.db.com';

// CORRECT: Safe defaults or explicit requirement
const dbUrl = process.env.DATABASE_URL || 'localhost';
// Or
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL required');
}
```

### Pitfall 4: Committing .env Files

```bash
# WRONG: .env in git
git add .env
git commit -m "Add config"  # NO!

# CORRECT: .env in .gitignore
echo ".env" >> .gitignore
git add .env.example  # Commit example instead
```

### Pitfall 5: Logging Secrets

```javascript
// WRONG: Secrets in logs
console.log('Config:', process.env);
logger.info({ config: process.env });

// CORRECT: Redact sensitive data
const safeEnv = { ...process.env };
['API_KEY', 'SECRET', 'PASSWORD'].forEach(key => {
  if (safeEnv[key]) safeEnv[key] = '***';
});
console.log('Config:', safeEnv);
```

---

## Summary

### Key Takeaways

1. **Configuration outside code** - Keep config separate from code
2. **Secrets never committed** - Use .env files, add to .gitignore
3. **Always strings** - Convert types explicitly
4. **Validate early** - Check required variables at startup
5. **Environment-specific** - Different values for dev/prod/test
6. **Security first** - Never log secrets, use least privilege

### Quick Decision Tree

```
Need configuration value?
  ↓
Is it a secret?
  ↓ YES: Use environment variable
      - Never hardcode
      - Add to .env (not .env.example)
      - Add .env to .gitignore
  ↓ NO: Is it environment-specific?
      ↓ YES: Use environment variable
            - Document in .env.example
      ↓ NO: Can hardcode or use config file
```

### Next Steps

1. [Command-Line Arguments Guide](./03-command-line-arguments.md)
2. [Standard Streams Guide](./04-standard-streams.md)
3. [Process Lifecycle Guide](./05-process-lifecycle.md)

---

## Quick Reference

```javascript
// Reading environment variables
process.env.VARIABLE_NAME         // Always a string or undefined

// Type conversion
parseInt(process.env.PORT || '3000', 10)           // Number
process.env.DEBUG === 'true'                       // Boolean
parseFloat(process.env.TIMEOUT || '30.5')         // Float
process.env.ITEMS?.split(',')                     // Array

// Validation
function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing: ${name}`);
  return value;
}

// Using dotenv
require('dotenv').config();

// Setting (in code - for testing only!)
process.env.TEST_VAR = 'value';

// Common variables
NODE_ENV              // 'development', 'production', 'test'
PORT                  // Server port number
DATABASE_URL          // Database connection string
API_KEY               // External API keys
LOG_LEVEL             // 'debug', 'info', 'warn', 'error'
```

Ready to master command-line arguments? Continue to the [Command-Line Arguments Guide](./03-command-line-arguments.md)!
