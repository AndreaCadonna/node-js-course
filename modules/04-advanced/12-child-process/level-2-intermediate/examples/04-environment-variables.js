/**
 * EXAMPLE 4: Environment Variables with Child Processes
 *
 * This example demonstrates:
 * - Passing environment variables to child processes
 * - Inheriting vs. isolating environment
 * - Modifying child process environment
 * - Security considerations with environment variables
 * - Environment variable best practices
 */

const { spawn, execFile } = require('child_process');
const fs = require('fs');

console.log('=== Environment Variables Examples ===\n');

// Example 1: Inheriting Parent Environment
function inheritingEnvironment() {
  console.log('1. Inheriting Parent Environment');
  console.log('   Child receives all parent environment variables\n');

  // Set some custom variables
  process.env.CUSTOM_VAR = 'from-parent';
  process.env.APP_ENV = 'development';

  // Create a script that reads environment
  const scriptPath = '/tmp/env-reader.sh';
  fs.writeFileSync(scriptPath, `#!/bin/bash
echo "   CUSTOM_VAR=$CUSTOM_VAR"
echo "   APP_ENV=$APP_ENV"
echo "   PATH=$PATH" | head -c 50
echo "..."
  `);
  fs.chmodSync(scriptPath, 0o755);

  const child = spawn(scriptPath, [], {
    env: process.env // Inherit all environment
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  child.on('close', () => {
    console.log('   (Child inherited all environment variables)\n');
    example2();
  });
}

// Example 2: Custom Environment (No Inheritance)
function example2() {
  console.log('2. Custom Environment Without Inheritance');
  console.log('   Providing only specific variables\n');

  const scriptPath = '/tmp/env-custom.sh';
  fs.writeFileSync(scriptPath, `#!/bin/bash
echo "   CUSTOM_VAR=$CUSTOM_VAR"
echo "   APP_ENV=$APP_ENV"
echo "   PATH=$PATH"
echo "   HOME=$HOME"
  `);
  fs.chmodSync(scriptPath, 0o755);

  const child = spawn(scriptPath, [], {
    env: {
      // Only provide specific variables
      CUSTOM_VAR: 'isolated',
      APP_ENV: 'production',
      PATH: '/usr/bin:/bin', // Minimal PATH
      // Note: No HOME, USER, etc.
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  child.on('close', () => {
    console.log('   (Child has isolated environment)\n');
    example3();
  });
}

// Example 3: Selective Inheritance
function example3() {
  console.log('3. Selective Environment Inheritance');
  console.log('   Inherit some, add custom, exclude sensitive\n');

  // Simulate sensitive variables in parent
  process.env.API_SECRET = 'super-secret-key';
  process.env.DB_PASSWORD = 'password123';

  const scriptPath = '/tmp/env-selective.sh';
  fs.writeFileSync(scriptPath, `#!/bin/bash
echo "   NODE_ENV=$NODE_ENV"
echo "   API_URL=$API_URL"
echo "   API_SECRET=$API_SECRET"
echo "   DB_PASSWORD=$DB_PASSWORD"
echo "   PATH exists: $([ -n "$PATH" ] && echo "yes" || echo "no")"
  `);
  fs.chmodSync(scriptPath, 0o755);

  const child = spawn(scriptPath, [], {
    env: {
      // Inherit PATH
      PATH: process.env.PATH,
      // Add custom variables
      NODE_ENV: 'production',
      API_URL: 'https://api.example.com',
      // Deliberately NOT passing API_SECRET or DB_PASSWORD
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  child.on('close', () => {
    console.log('   (Sensitive variables not passed to child)\n');
    example4();
  });
}

// Example 4: Environment for Different Node Processes
function example4() {
  console.log('4. Environment Variables for Node.js Child Processes');
  console.log('   Running Node scripts with different environments\n');

  const workerPath = '/tmp/env-node-worker.js';
  fs.writeFileSync(workerPath, `
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   DEBUG:', process.env.DEBUG);
console.log('   MAX_WORKERS:', process.env.MAX_WORKERS);
console.log('   API_KEY:', process.env.API_KEY ? 'SET' : 'NOT SET');

// Check if in production mode
if (process.env.NODE_ENV === 'production') {
  console.log('   Running in PRODUCTION mode');
} else {
  console.log('   Running in DEVELOPMENT mode');
}
  `);

  console.log('   Development Environment:');
  const devChild = spawn('node', [workerPath], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DEBUG: '*',
      MAX_WORKERS: '2'
    }
  });

  devChild.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  devChild.on('close', () => {
    console.log('\n   Production Environment:');

    const prodChild = spawn('node', [workerPath], {
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DEBUG: 'app:error',
        MAX_WORKERS: '8',
        API_KEY: 'prod-api-key'
      }
    });

    prodChild.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });

    prodChild.on('close', () => {
      console.log();
      example5();
    });
  });
}

// Example 5: Environment Variable Interpolation
function example5() {
  console.log('5. Environment Variable Interpolation');
  console.log('   Building environment from templates\n');

  const workerPath = '/tmp/env-interpolation.js';
  fs.writeFileSync(workerPath, `
console.log('   APP_NAME:', process.env.APP_NAME);
console.log('   APP_VERSION:', process.env.APP_VERSION);
console.log('   APP_FULL:', process.env.APP_FULL);
console.log('   LOG_FILE:', process.env.LOG_FILE);
  `);

  const appName = 'MyApp';
  const appVersion = '1.2.3';
  const environment = 'staging';

  const child = spawn('node', [workerPath], {
    env: {
      ...process.env,
      APP_NAME: appName,
      APP_VERSION: appVersion,
      APP_FULL: `${appName} v${appVersion}`,
      LOG_FILE: `/var/log/${appName}-${environment}.log`,
      ENVIRONMENT: environment
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  child.on('close', () => {
    console.log('   (Variables constructed from templates)\n');
    example6();
  });
}

// Example 6: Environment Configuration Patterns
function example6() {
  console.log('6. Configuration Pattern with Environment');
  console.log('   Simulating different deployment environments\n');

  const workerPath = '/tmp/env-config.js';
  fs.writeFileSync(workerPath, `
const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  cacheEnabled: process.env.CACHE_ENABLED === 'true',
  workers: parseInt(process.env.WORKERS) || 1
};

console.log('   Configuration:', JSON.stringify(config, null, 2));
  `);

  const environments = {
    development: {
      NODE_ENV: 'development',
      PORT: '3000',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      CACHE_ENABLED: 'false',
      WORKERS: '1'
    },
    staging: {
      NODE_ENV: 'staging',
      PORT: '8080',
      DB_HOST: 'staging-db.example.com',
      DB_PORT: '5432',
      CACHE_ENABLED: 'true',
      WORKERS: '2'
    },
    production: {
      NODE_ENV: 'production',
      PORT: '80',
      DB_HOST: 'prod-db.example.com',
      DB_PORT: '5432',
      CACHE_ENABLED: 'true',
      WORKERS: '8'
    }
  };

  let envNames = Object.keys(environments);
  let currentIndex = 0;

  function runNextEnvironment() {
    if (currentIndex >= envNames.length) {
      example7();
      return;
    }

    const envName = envNames[currentIndex];
    const envVars = environments[envName];

    console.log(`   ${envName.toUpperCase()} Environment:`);

    const child = spawn('node', [workerPath], {
      env: {
        PATH: process.env.PATH,
        ...envVars
      }
    });

    child.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) console.log('   ' + line);
      });
    });

    child.on('close', () => {
      console.log();
      currentIndex++;
      runNextEnvironment();
    });
  }

  runNextEnvironment();
}

// Example 7: Security Best Practices
function example7() {
  console.log('7. Security Best Practices');
  console.log('   Avoiding common security pitfalls\n');

  // Demonstrate safe vs unsafe practices
  const workerPath = '/tmp/env-security.js';
  fs.writeFileSync(workerPath, `
console.log('   Received environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.includes('SECRET') || key.includes('PASSWORD')) {
    console.log(\`   \${key}=***REDACTED***\`);
  } else {
    console.log(\`   \${key}=\${process.env[key]}\`);
  }
});
  `);

  // BAD: Passing everything (commented for demonstration)
  console.log('   BAD PRACTICE (not executed):');
  console.log('   spawn(cmd, [], { env: process.env })');
  console.log('   -> Leaks all secrets to child process\n');

  // GOOD: Whitelist approach
  console.log('   GOOD PRACTICE (executed):');
  console.log('   Only pass necessary variables:\n');

  process.env.DB_SECRET = 'secret-password';
  process.env.API_SECRET = 'secret-key';

  const child = spawn('node', [workerPath], {
    env: {
      // Only include safe variables
      PATH: process.env.PATH,
      NODE_ENV: 'production',
      APP_NAME: 'SecureApp',
      // Do NOT include secrets
    }
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  child.on('close', () => {
    console.log('\n=== All Examples Completed ===');
    console.log('\nBest Practices Summary:');
    console.log('- Use whitelist approach for environment variables');
    console.log('- Never pass secrets unless absolutely necessary');
    console.log('- Use minimal PATH in isolated environments');
    console.log('- Different environments = different configs');
    console.log('- Validate and sanitize environment values');
  });
}

// Start the examples
inheritingEnvironment();
