# Environment Variables

Learn to manage environment variables effectively and securely when working with child processes.

## Table of Contents
- [Introduction](#introduction)
- [Basics](#basics)
- [Inheritance Patterns](#inheritance-patterns)
- [Custom Environments](#custom-environments)
- [Configuration Management](#configuration-management)
- [Security Considerations](#security-considerations)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

---

## Introduction

Environment variables are key-value pairs that affect process behavior. They're a standard way to configure applications without changing code.

### Why Environment Variables?

- **Configuration**: Different settings per environment (dev, staging, prod)
- **Secrets**: API keys, passwords (with proper security)
- **System Info**: PATH, HOME, USER
- **Feature Flags**: Enable/disable features
- **Process Control**: DEBUG, NODE_ENV

---

## Basics

### Accessing Environment Variables

```javascript
// In Node.js
console.log(process.env.PATH);
console.log(process.env.HOME);
console.log(process.env.USER);

// Custom variables
console.log(process.env.NODE_ENV);
console.log(process.env.API_KEY);

// Check if variable exists
if (process.env.DEBUG) {
  console.log('Debug mode enabled');
}

// With default value
const port = process.env.PORT || 3000;
const env = process.env.NODE_ENV || 'development';
```

### Setting Environment Variables

```javascript
// In parent process (before spawning child)
process.env.CUSTOM_VAR = 'value';
process.env.NODE_ENV = 'production';

// These changes only affect current process and its children
```

### Child Process Environment

```javascript
const { spawn } = require('child_process');

// Child inherits parent's environment by default
const child = spawn('node', ['script.js']);

// script.js can access all parent environment variables
```

---

## Inheritance Patterns

### Full Inheritance (Default)

```javascript
// Child gets ALL parent environment variables
const child = spawn('command', args);
// Implicitly uses: { env: process.env }

// script.js receives:
// - PATH
// - HOME
// - USER
// - All custom variables
```

### Explicit Inheritance

```javascript
// Be explicit about inheritance
const child = spawn('command', args, {
  env: process.env
});

// Same as default, but intention is clear
```

### No Inheritance (Empty Environment)

```javascript
// Child starts with NO environment variables
const child = spawn('command', args, {
  env: {}
});

// Child will have:
// - No PATH (most commands won't work!)
// - No HOME
// - Nothing
```

### Minimal Environment

```javascript
// Provide only what's needed
const child = spawn('node', ['script.js'], {
  env: {
    NODE_ENV: 'production',
    PATH: process.env.PATH  // Usually needed for finding executables
  }
});

// Child has minimal, controlled environment
```

---

## Custom Environments

### Adding Variables

```javascript
// Parent environment + custom variables
const child = spawn('node', ['script.js'], {
  env: {
    ...process.env,        // Spread parent environment
    CUSTOM_VAR: 'value',   // Add new variable
    NODE_ENV: 'production', // Override existing
    DEBUG: '*'             // Add debug flag
  }
});
```

### Removing Variables

```javascript
// Inherit most, but exclude specific variables
const { SENSITIVE_VAR, SECRET_KEY, ...safeEnv } = process.env;

const child = spawn('command', args, {
  env: {
    ...safeEnv,
    // SENSITIVE_VAR and SECRET_KEY not included
    PUBLIC_VAR: 'value'
  }
});
```

### Environment Builder

```javascript
class EnvironmentBuilder {
  constructor() {
    this.env = {};
  }

  inherit() {
    this.env = { ...process.env };
    return this;
  }

  set(key, value) {
    this.env[key] = value;
    return this;
  }

  setMany(vars) {
    Object.assign(this.env, vars);
    return this;
  }

  remove(key) {
    delete this.env[key];
    return this;
  }

  removeMany(keys) {
    keys.forEach(key => delete this.env[key]);
    return this;
  }

  requirePath() {
    if (!this.env.PATH) {
      this.env.PATH = process.env.PATH;
    }
    return this;
  }

  build() {
    return this.env;
  }
}

// Usage
const env = new EnvironmentBuilder()
  .inherit()
  .set('NODE_ENV', 'production')
  .set('PORT', '8080')
  .remove('DEBUG')
  .build();

const child = spawn('node', ['app.js'], { env });
```

---

## Configuration Management

### Environment-Based Configuration

```javascript
// config.js
const configs = {
  development: {
    NODE_ENV: 'development',
    PORT: '3000',
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    LOG_LEVEL: 'debug',
    CACHE_ENABLED: 'false'
  },

  staging: {
    NODE_ENV: 'staging',
    PORT: '8080',
    DB_HOST: 'staging-db.example.com',
    DB_PORT: '5432',
    LOG_LEVEL: 'info',
    CACHE_ENABLED: 'true'
  },

  production: {
    NODE_ENV: 'production',
    PORT: '80',
    DB_HOST: 'prod-db.example.com',
    DB_PORT: '5432',
    LOG_LEVEL: 'error',
    CACHE_ENABLED: 'true'
  }
};

function getConfig(environment) {
  return {
    ...process.env,        // Keep system vars
    ...configs[environment] // Override with config
  };
}

// Usage
const child = spawn('node', ['app.js'], {
  env: getConfig('production')
});
```

### Template-Based Configuration

```javascript
function buildEnvironment(template, values) {
  const env = {};

  for (const [key, template] of Object.entries(template)) {
    // Replace placeholders: ${VAR_NAME}
    env[key] = template.replace(/\$\{(\w+)\}/g, (_, name) => {
      return values[name] || process.env[name] || '';
    });
  }

  return env;
}

// Usage
const template = {
  DATABASE_URL: 'postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}',
  LOG_FILE: '/var/log/${APP_NAME}-${ENVIRONMENT}.log',
  CACHE_URL: 'redis://${REDIS_HOST}:${REDIS_PORT}'
};

const values = {
  APP_NAME: 'myapp',
  ENVIRONMENT: 'production',
  DB_USER: 'admin',
  DB_PASS: 'secret',
  DB_HOST: 'db.example.com',
  DB_PORT: '5432',
  DB_NAME: 'mydb',
  REDIS_HOST: 'cache.example.com',
  REDIS_PORT: '6379'
};

const env = buildEnvironment(template, values);
// env.DATABASE_URL = 'postgresql://admin:secret@db.example.com:5432/mydb'
```

### Loading from .env Files

```javascript
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};

  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    line = line.trim();
    if (!line || line.startsWith('#')) {
      return;
    }

    // Parse KEY=value
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');

      env[key] = value;
    }
  });

  return env;
}

// Usage
// .env file:
// NODE_ENV=production
// PORT=8080
// DB_HOST=localhost

const env = {
  ...process.env,
  ...loadEnvFile('.env')
};

const child = spawn('node', ['app.js'], { env });
```

---

## Security Considerations

### Avoid Leaking Secrets

```javascript
// DANGEROUS - passes ALL variables, including secrets
const child = spawn('untrusted-command', [], {
  env: process.env  // Might include API_KEY, DB_PASSWORD, etc.
});

// SAFE - whitelist approach
const child = spawn('untrusted-command', [], {
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USER: process.env.USER
    // No secrets passed
  }
});
```

### Filtering Sensitive Variables

```javascript
function createSafeEnvironment() {
  const sensitiveKeys = [
    'API_KEY',
    'SECRET_KEY',
    'PASSWORD',
    'TOKEN',
    'PRIVATE_KEY',
    'AWS_SECRET',
    'DB_PASSWORD'
  ];

  const safe = {};

  for (const [key, value] of Object.entries(process.env)) {
    // Skip if key contains sensitive terms
    const isSensitive = sensitiveKeys.some(term =>
      key.toUpperCase().includes(term)
    );

    if (!isSensitive) {
      safe[key] = value;
    }
  }

  return safe;
}

// Usage
const child = spawn('command', [], {
  env: createSafeEnvironment()
});
```

### Environment Isolation

```javascript
// Create isolated environments for different trust levels

class EnvironmentIsolation {
  static trusted() {
    // Trusted processes get full environment
    return process.env;
  }

  static semiTrusted() {
    // Semi-trusted: exclude critical secrets
    const { AWS_SECRET_ACCESS_KEY, DB_PASSWORD, ...env } = process.env;
    return env;
  }

  static untrusted() {
    // Untrusted: minimal environment
    return {
      PATH: '/usr/bin:/bin',
      HOME: '/tmp',
      USER: 'nobody'
    };
  }
}

// Usage
const trustedChild = spawn('internal-tool', [], {
  env: EnvironmentIsolation.trusted()
});

const untrustedChild = spawn('user-script', [], {
  env: EnvironmentIsolation.untrusted()
});
```

---

## Common Patterns

### NODE_ENV Pattern

```javascript
function spawnWithNodeEnv(script, nodeEnv = 'development') {
  return spawn('node', [script], {
    env: {
      ...process.env,
      NODE_ENV: nodeEnv
    }
  });
}

// Usage
const devProcess = spawnWithNodeEnv('app.js', 'development');
const prodProcess = spawnWithNodeEnv('app.js', 'production');
```

### Debug Mode

```javascript
function spawnWithDebug(script, debugPattern = '*') {
  return spawn('node', [script], {
    env: {
      ...process.env,
      DEBUG: debugPattern,
      NODE_ENV: 'development'
    }
  });
}

// Usage
const child = spawnWithDebug('app.js', 'app:*');
```

### Feature Flags

```javascript
function spawnWithFeatures(script, features = {}) {
  const env = { ...process.env };

  // Convert feature flags to environment variables
  for (const [feature, enabled] of Object.entries(features)) {
    env[`FEATURE_${feature.toUpperCase()}`] = enabled ? 'true' : 'false';
  }

  return spawn('node', [script], { env });
}

// Usage
const child = spawnWithFeatures('app.js', {
  newUI: true,
  betaFeatures: false,
  analytics: true
});

// In app.js:
// const newUIEnabled = process.env.FEATURE_NEWUI === 'true';
```

### Path Manipulation

```javascript
function spawnWithCustomPath(command, args, additionalPaths = []) {
  const paths = [
    ...additionalPaths,
    process.env.PATH
  ].filter(Boolean).join(path.delimiter);

  return spawn(command, args, {
    env: {
      ...process.env,
      PATH: paths
    }
  });
}

// Usage
const child = spawnWithCustomPath('mycommand', [], [
  '/opt/custom/bin',
  '/usr/local/custom/bin'
]);
```

---

## Best Practices

### 1. Use Whitelist for Untrusted Processes

```javascript
// GOOD - explicitly list safe variables
const child = spawn('untrusted', [], {
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: process.env.LANG
  }
});

// BAD - passes everything
const child = spawn('untrusted', [], {
  env: process.env
});
```

### 2. Never Hard-Code Secrets

```javascript
// BAD
const child = spawn('app', [], {
  env: {
    API_KEY: 'hardcoded-secret'  // Don't do this!
  }
});

// GOOD - load from secure source
const apiKey = loadSecretFromVault();
const child = spawn('app', [], {
  env: {
    API_KEY: apiKey
  }
});
```

### 3. Validate Environment Variables

```javascript
function validateEnv(required = []) {
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Usage
validateEnv(['DATABASE_URL', 'API_KEY', 'NODE_ENV']);

const child = spawn('app', [], {
  env: process.env
});
```

### 4. Provide PATH for Most Commands

```javascript
// GOOD - include PATH for finding executables
const child = spawn('git', ['status'], {
  env: {
    PATH: process.env.PATH,  // Needed to find 'git'
    GIT_AUTHOR_NAME: 'Bot'
  }
});

// BAD - missing PATH
const child = spawn('git', ['status'], {
  env: {
    GIT_AUTHOR_NAME: 'Bot'  // 'git' won't be found!
  }
});
```

### 5. Document Environment Requirements

```javascript
/**
 * Spawns the worker process
 *
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - REDIS_URL: Redis connection string
 * - NODE_ENV: 'development' | 'production'
 *
 * Optional environment variables:
 * - LOG_LEVEL: Log verbosity (default: 'info')
 * - WORKER_THREADS: Number of threads (default: CPU count)
 */
function spawnWorker() {
  validateEnv(['DATABASE_URL', 'REDIS_URL', 'NODE_ENV']);

  return spawn('node', ['worker.js'], {
    env: {
      ...process.env,
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      WORKER_THREADS: process.env.WORKER_THREADS || os.cpus().length
    }
  });
}
```

### 6. Use Type Coercion Carefully

```javascript
// Environment variables are always strings!

// BAD
const enabled = process.env.FEATURE_ENABLED;
if (enabled) {  // 'false' is truthy!
  // This runs even when FEATURE_ENABLED='false'
}

// GOOD
const enabled = process.env.FEATURE_ENABLED === 'true';
if (enabled) {
  // Only runs when truly enabled
}

// For numbers
const port = parseInt(process.env.PORT || '3000', 10);

// For booleans
const debug = process.env.DEBUG === 'true';
```

---

## Summary

Key takeaways:
- Environment variables configure processes without code changes
- Child processes inherit parent environment by default
- Use whitelist approach for untrusted processes
- Never hard-code secrets in code
- Always include PATH for most commands
- Environment variables are always strings
- Validate required variables before spawning
- Filter sensitive variables for external processes
- Document environment requirements
- Use configuration builders for complex scenarios

Proper environment variable management is crucial for security and maintainability!
