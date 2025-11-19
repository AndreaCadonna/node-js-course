/**
 * Example 4: Conditional Debugging with util.debuglog()
 *
 * Learn how to use util.debuglog() for production-safe conditional logging.
 * This is the official Node.js way to add debug logging that can be enabled
 * via environment variables without performance impact when disabled.
 *
 * Key Concepts:
 * - Creating namespaced debug loggers
 * - Using NODE_DEBUG environment variable
 * - Zero overhead when disabled
 * - Production debugging patterns
 */

const util = require('util');

// ===== EXAMPLE 1: Basic debuglog =====
console.log('=== Example 1: Basic debuglog Usage ===\n');

// Create debug logger for 'myapp' namespace
const debugMyApp = util.debuglog('myapp');

console.log('Regular logs always show:');
console.log('Application starting...');

// Debug logs only show when NODE_DEBUG=myapp
debugMyApp('This only shows when NODE_DEBUG=myapp');
debugMyApp('Debug information: %s', 'some data');

console.log('\nTo see debug logs, run:');
console.log('  NODE_DEBUG=myapp node 04-debuglog-conditional.js\n');

// ===== EXAMPLE 2: Multiple Namespaces =====
console.log('=== Example 2: Multiple Debug Namespaces ===\n');

// Create different loggers for different subsystems
const debugDatabase = util.debuglog('database');
const debugCache = util.debuglog('cache');
const debugHttp = util.debuglog('http');

function queryDatabase(sql) {
  debugDatabase('Executing query: %s', sql);
  debugDatabase('Query parameters: %O', { limit: 10 });
  console.log('Query executed');
}

function getCached(key) {
  debugCache('Checking cache for key: %s', key);
  debugCache('Cache miss');
  console.log('Cache checked');
}

function makeRequest(url) {
  debugHttp('Making request to: %s', url);
  debugHttp('Request headers: %O', { 'User-Agent': 'MyApp' });
  console.log('Request made');
}

queryDatabase('SELECT * FROM users');
getCached('user:123');
makeRequest('http://api.example.com/data');

console.log('\nEnable specific subsystems:');
console.log('  NODE_DEBUG=database    - Only database logs');
console.log('  NODE_DEBUG=cache       - Only cache logs');
console.log('  NODE_DEBUG=database,cache - Multiple subsystems');
console.log('  NODE_DEBUG=*           - All debug logs\n');

// ===== EXAMPLE 3: Real-World Database Module =====
console.log('=== Example 3: Database Module with Debug Logging ===\n');

const debugDB = util.debuglog('db');

class Database {
  constructor(config) {
    this.config = config;
    debugDB('Database initialized with config: %O', config);
  }

  async connect() {
    debugDB('Connecting to database...');
    debugDB('Host: %s, Port: %d', this.config.host, this.config.port);

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 100));

    debugDB('Connected successfully');
    console.log('✓ Database connected');
  }

  async query(sql, params = []) {
    debugDB('Query: %s', sql);
    debugDB('Parameters: %O', params);

    const start = Date.now();

    // Simulate query
    await new Promise(resolve => setTimeout(resolve, 50));

    const duration = Date.now() - start;
    debugDB('Query completed in %dms', duration);

    return { rows: [], rowCount: 0 };
  }

  async disconnect() {
    debugDB('Disconnecting from database...');
    await new Promise(resolve => setTimeout(resolve, 50));
    debugDB('Disconnected');
    console.log('✓ Database disconnected');
  }
}

async function runDatabaseExample() {
  const db = new Database({
    host: 'localhost',
    port: 5432,
    database: 'myapp'
  });

  await db.connect();
  await db.query('SELECT * FROM users WHERE id = ?', [123]);
  await db.disconnect();
}

runDatabaseExample();

// ===== EXAMPLE 4: HTTP Server with Debug Logging =====
console.log('\n=== Example 4: HTTP Server Debugging ===\n');

const debugServer = util.debuglog('server');
const debugRequest = util.debuglog('request');
const debugResponse = util.debuglog('response');

class Server {
  constructor(port) {
    this.port = port;
    this.routes = new Map();
    debugServer('Server created on port %d', port);
  }

  addRoute(path, handler) {
    debugServer('Adding route: %s', path);
    this.routes.set(path, handler);
  }

  async handleRequest(path, data) {
    debugRequest('Incoming request: %s', path);
    debugRequest('Request data: %O', data);

    const handler = this.routes.get(path);

    if (!handler) {
      debugRequest('Route not found: %s', path);
      return { status: 404, body: 'Not Found' };
    }

    const response = await handler(data);

    debugResponse('Response status: %d', response.status);
    debugResponse('Response body: %O', response.body);

    return response;
  }
}

const server = new Server(3000);

server.addRoute('/api/users', async (data) => {
  return { status: 200, body: { users: [] } };
});

server.handleRequest('/api/users', { limit: 10 }).then(response => {
  console.log('✓ Request handled, status:', response.status);
});

console.log('\nDebug commands:');
console.log('  NODE_DEBUG=server   - Server-level logs');
console.log('  NODE_DEBUG=request  - Request logs');
console.log('  NODE_DEBUG=response - Response logs\n');

// ===== EXAMPLE 5: Performance-Sensitive Code =====
console.log('=== Example 5: Zero Overhead When Disabled ===\n');

const debugPerf = util.debuglog('perf');

function expensiveLoggingData() {
  console.log('  Computing expensive logging data...');
  // This would be slow if always executed
  return JSON.stringify({ huge: 'object', with: 'lots', of: 'data' });
}

function processItem(item) {
  // ❌ WRONG: Always computes expensive data
  // debugPerf('Processing: ' + expensiveLoggingData());

  // ✅ CORRECT: Only computes when debugging is enabled
  debugPerf('Processing item: %s', item);

  // For expensive computations, check if enabled
  if (util.debuglog('perf').enabled) {
    debugPerf('Expensive data: %s', expensiveLoggingData());
  }

  return item.toUpperCase();
}

console.log('Processing without debug:');
console.time('Without debug');
for (let i = 0; i < 1000; i++) {
  processItem('item' + i);
}
console.timeEnd('Without debug');
console.log('Notice: No expensive data computation happened\n');

// ===== EXAMPLE 6: Debugging with Sections =====
console.log('=== Example 6: Organized Debug Sections ===\n');

const debugInit = util.debuglog('app:init');
const debugRuntime = util.debuglog('app:runtime');
const debugShutdown = util.debuglog('app:shutdown');

class Application {
  constructor() {
    debugInit('Application constructor called');
  }

  async initialize() {
    debugInit('Starting initialization...');
    debugInit('Loading configuration');
    await new Promise(resolve => setTimeout(resolve, 50));

    debugInit('Connecting to services');
    await new Promise(resolve => setTimeout(resolve, 50));

    debugInit('Initialization complete');
    console.log('✓ Application initialized');
  }

  async run() {
    debugRuntime('Application running');
    debugRuntime('Processing requests');

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 100));

    debugRuntime('Request processing complete');
  }

  async shutdown() {
    debugShutdown('Shutdown initiated');
    debugShutdown('Closing connections');
    await new Promise(resolve => setTimeout(resolve, 50));

    debugShutdown('Cleanup complete');
    console.log('✓ Application shutdown');
  }
}

async function runApplication() {
  const app = new Application();
  await app.initialize();
  await app.run();
  await app.shutdown();
}

runApplication();

console.log('\nSection-specific debugging:');
console.log('  NODE_DEBUG=app:init    - Only initialization');
console.log('  NODE_DEBUG=app:runtime - Only runtime');
console.log('  NODE_DEBUG=app:*       - All app sections\n');

// ===== EXAMPLE 7: Checking if Debug is Enabled =====
console.log('=== Example 7: Conditional Debug Logic ===\n');

const debugConditional = util.debuglog('conditional');

function smartDebugFunction() {
  // Check if debugging is enabled before doing expensive work
  if (debugConditional.enabled) {
    debugConditional('Debug is enabled!');

    // Do expensive debug-only operations
    const diagnostics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      // ... other expensive data
    };

    debugConditional('Diagnostics: %O', diagnostics);
  }

  // Normal work continues regardless
  console.log('Function executed');
}

smartDebugFunction();

console.log('\nThe .enabled property allows conditional logic');
console.log('Only compute expensive data when debugging is active\n');

/**
 * Important Notes:
 *
 * 1. util.debuglog() Benefits:
 *    ✅ Zero overhead when disabled
 *    ✅ Standard Node.js debugging interface
 *    ✅ Namespace-based organization
 *    ✅ Process-wide enable/disable
 *    ✅ No production dependencies needed
 *
 * 2. When to Use:
 *    ✅ Production applications
 *    ✅ Libraries and modules
 *    ✅ Performance-critical code
 *    ✅ Detailed diagnostic logging
 *    ❌ User-facing messages (use console.log)
 *    ❌ Error messages (use console.error)
 *
 * 3. Naming Conventions:
 *    - Use lowercase for namespaces
 *    - Use colons for hierarchy: 'app:db:query'
 *    - Be specific: 'http:request' not just 'http'
 *    - Group related functionality
 *
 * 4. NODE_DEBUG Environment Variable:
 *    - Single namespace: NODE_DEBUG=myapp
 *    - Multiple: NODE_DEBUG=db,cache,http
 *    - Pattern matching: NODE_DEBUG=app:*
 *    - All debug logs: NODE_DEBUG=*
 *    - With other commands: NODE_DEBUG=myapp npm start
 *
 * 5. Format Specifiers:
 *    %s - String
 *    %d - Number
 *    %i - Integer
 *    %f - Float
 *    %j - JSON
 *    %o - Object (single-line)
 *    %O - Object (multi-line)
 *    %% - Literal %
 */

/**
 * Performance Comparison:
 *
 * util.debuglog():
 * - When disabled: Near-zero overhead (function call only)
 * - When enabled: Same as console.log
 * - No string formatting unless enabled
 * - Can check .enabled before expensive operations
 *
 * console.log():
 * - Always evaluates arguments
 * - Always formats strings
 * - Always has overhead
 * - Can't be selectively disabled
 *
 * debug npm package:
 * - More features (timestamps, colors)
 * - Requires dependency
 * - Slightly more overhead
 * - Better for development
 *
 * Use util.debuglog() for production-safe logging
 */

/**
 * Try This:
 *
 * 1. Add debug logging to an existing project
 * 2. Create a hierarchy of debug namespaces
 * 3. Measure performance with/without debug enabled
 * 4. Build a debug log viewer/parser
 * 5. Integrate with structured logging systems
 */

/**
 * Real-World Pattern:
 *
 * // logger.js
 * const util = require('util');
 *
 * module.exports = {
 *   db: util.debuglog('myapp:db'),
 *   cache: util.debuglog('myapp:cache'),
 *   http: util.debuglog('myapp:http'),
 *   auth: util.debuglog('myapp:auth')
 * };
 *
 * // database.js
 * const { db } = require('./logger');
 *
 * db('Query executed');
 *
 * // Enable all app debug logs:
 * // NODE_DEBUG=myapp:* node app.js
 */
