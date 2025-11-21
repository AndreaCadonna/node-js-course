/**
 * Simple Logger Demo
 * Demonstrates various logging capabilities
 */

const Logger = require('../src/logger');
const path = require('path');

// Demo 1: Basic logging
async function demo1_basicLogging() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 1: Basic Logging');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    console: true,
    colorize: true
  });

  console.log('Logging messages at different levels:\n');

  await logger.debug('This is a debug message');
  await logger.info('Application started successfully');
  await logger.warn('Low disk space warning');
  await logger.error('Failed to connect to database');
  await logger.fatal('Critical system failure');

  console.log('\nCheck the demo-logs directory to see the log files!');
}

// Demo 2: Logging with metadata
async function demo2_logMetadata() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 2: Logging with Metadata');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    console: true,
    metadata: { app: 'demo-app', version: '1.0.0' }
  });

  console.log('Logging with contextual metadata:\n');

  await logger.info('User logged in', { userId: '12345', username: 'john_doe' });
  await logger.info('File uploaded', { fileName: 'report.pdf', size: '2.5MB' });
  await logger.error('Payment failed', { orderId: '9876', amount: '$99.99', reason: 'Invalid card' });

  console.log('\nMetadata helps track context for each log entry!');
}

// Demo 3: Child loggers
async function demo3_childLoggers() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 3: Child Loggers');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    console: true,
    metadata: { app: 'my-app' }
  });

  console.log('Creating child loggers for different modules:\n');

  // Create child loggers for different modules
  const authLogger = logger.child({ module: 'auth' });
  const dbLogger = logger.child({ module: 'database' });
  const apiLogger = logger.child({ module: 'api' });

  await authLogger.info('Login attempt', { username: 'alice' });
  await authLogger.warn('Failed login attempt', { username: 'bob', attempts: 3 });

  await dbLogger.info('Database connection established');
  await dbLogger.error('Query timeout', { query: 'SELECT * FROM users' });

  await apiLogger.info('API request received', { endpoint: '/api/users', method: 'GET' });
  await apiLogger.info('API response sent', { status: 200, duration: '45ms' });

  console.log('\nChild loggers inherit parent metadata and add their own!');
}

// Demo 4: Log levels and filtering
async function demo4_logLevels() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 4: Log Levels and Filtering');
  console.log('='.repeat(60) + '\n');

  // Create logger with WARN level (only WARN, ERROR, FATAL will be logged)
  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    logFile: 'warnings.log',
    level: 'WARN',
    console: true
  });

  console.log('Logger set to WARN level (DEBUG and INFO will be ignored):\n');

  await logger.debug('This debug message will NOT be logged');
  await logger.info('This info message will NOT be logged');
  await logger.warn('This warning WILL be logged');
  await logger.error('This error WILL be logged');

  const stats = logger.getStats();
  console.log(`\nTotal logs written: ${stats.totalLogs}`);
  console.log('Only WARN and ERROR were logged!');
}

// Demo 5: Log rotation
async function demo5_logRotation() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 5: Log Rotation');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    logFile: 'rotating.log',
    console: false,
    maxSize: 500, // Small size to trigger rotation quickly
    maxFiles: 3
  });

  console.log('Writing logs to trigger rotation...\n');

  // Write enough logs to trigger rotation
  for (let i = 1; i <= 30; i++) {
    await logger.info(`Log message number ${i} - This is a longer message to fill up the log file faster`);
  }

  const stats = logger.getStats();
  console.log(`Logs written: ${stats.totalLogs}`);
  console.log(`Log rotations: ${stats.rotations}`);
  console.log('\nCheck demo-logs directory for rotating.log and its backups (rotating.1.log, etc.)');
}

// Demo 6: Separate error logs
async function demo6_separateErrorLogs() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 6: Separate Error Logs');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    logFile: 'app.log',
    console: true,
    separateErrorFile: true
  });

  console.log('Logging various messages:\n');

  await logger.info('Application started');
  await logger.info('Processing request');
  await logger.error('Database connection failed');
  await logger.warn('Slow query detected');
  await logger.fatal('Out of memory');

  const stats = logger.getStats();
  console.log('\nLog files created:');
  console.log(`  Main log: ${stats.currentLogFile}`);
  console.log(`  Error log: ${stats.currentErrorFile}`);
  console.log('\nErrors are written to both files!');
}

// Demo 7: Reading logs
async function demo7_readingLogs() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 7: Reading Logs');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    logFile: 'readable.log',
    console: false
  });

  // Write some logs
  await logger.info('First message');
  await logger.warn('Second message');
  await logger.error('Third message');
  await logger.info('Fourth message');
  await logger.info('Fifth message');

  console.log('Reading all logs:\n');
  const allLogs = await logger.readLogs();
  allLogs.forEach(log => console.log(log));

  console.log('\n' + '-'.repeat(60));
  console.log('Reading last 2 logs:\n');
  const lastTwo = await logger.readLogs({ lines: 2 });
  lastTwo.forEach(log => console.log(log));

  console.log('\n' + '-'.repeat(60));
  console.log('Reading only ERROR logs:\n');
  const errorLogs = await logger.readLogs({ level: 'ERROR' });
  errorLogs.forEach(log => console.log(log));
}

// Demo 8: Real-world application simulation
async function demo8_realWorldApp() {
  console.log('\n' + '='.repeat(60));
  console.log('DEMO 8: Real-World Application Simulation');
  console.log('='.repeat(60) + '\n');

  const logger = new Logger({
    logDir: path.join(__dirname, 'demo-logs'),
    logFile: 'app.log',
    console: true,
    metadata: { app: 'e-commerce', env: 'production' }
  });

  console.log('Simulating an e-commerce application:\n');

  // Application startup
  await logger.info('Application starting up');
  await logger.info('Loading configuration');
  await logger.info('Connecting to database');
  await logger.info('Database connection established', { host: 'db.example.com' });

  // User actions
  const requestLogger = logger.child({ module: 'http' });
  await requestLogger.info('Request received', { method: 'GET', path: '/api/products', ip: '192.168.1.1' });
  await requestLogger.info('Response sent', { status: 200, duration: '25ms' });

  // Business logic
  const orderLogger = logger.child({ module: 'orders' });
  await orderLogger.info('Order created', { orderId: 'ORD-12345', userId: 'USR-789', total: '$149.99' });
  await orderLogger.warn('Low inventory warning', { productId: 'PROD-456', stock: 3 });

  // Payment processing
  const paymentLogger = logger.child({ module: 'payment' });
  await paymentLogger.info('Payment initiated', { orderId: 'ORD-12345', amount: '$149.99' });
  await paymentLogger.error('Payment gateway timeout', { orderId: 'ORD-12345', gateway: 'stripe' });
  await paymentLogger.info('Payment retry successful', { orderId: 'ORD-12345', attempt: 2 });

  // Error scenarios
  await logger.error('Cache connection failed', { cache: 'redis', error: 'ECONNREFUSED' });
  await logger.warn('High memory usage', { usage: '85%', threshold: '80%' });

  // Shutdown
  await logger.info('Graceful shutdown initiated');
  await logger.info('Closing database connections');
  await logger.info('Application stopped');

  const stats = logger.getStats();
  console.log('\nApplication Metrics:');
  console.log(`  Total log entries: ${stats.totalLogs}`);
  console.log('  By level:');
  Object.entries(stats.logsByLevel).forEach(([level, count]) => {
    if (count > 0) {
      console.log(`    ${level}: ${count}`);
    }
  });
}

// Main demo runner
async function runAllDemos() {
  console.log('\n' + '='.repeat(60));
  console.log('SIMPLE LOGGER - INTERACTIVE DEMOS');
  console.log('='.repeat(60));

  try {
    await demo1_basicLogging();
    await delay(2000);

    await demo2_logMetadata();
    await delay(2000);

    await demo3_childLoggers();
    await delay(2000);

    await demo4_logLevels();
    await delay(2000);

    await demo5_logRotation();
    await delay(2000);

    await demo6_separateErrorLogs();
    await delay(2000);

    await demo7_readingLogs();
    await delay(2000);

    await demo8_realWorldApp();

    console.log('\n' + '='.repeat(60));
    console.log('ALL DEMOS COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nCheck the examples/demo-logs directory to see all log files.');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✓ Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)');
    console.log('  ✓ Colored console output');
    console.log('  ✓ Metadata and context tracking');
    console.log('  ✓ Child loggers for modular logging');
    console.log('  ✓ Log level filtering');
    console.log('  ✓ Automatic log rotation');
    console.log('  ✓ Separate error log files');
    console.log('  ✓ Reading and filtering logs');
    console.log('  ✓ Real-world application patterns');
    console.log('\nTo clean up, run: rm -rf examples/demo-logs');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\nDemo failed:', error.message);
    process.exit(1);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos();
}

module.exports = {
  demo1_basicLogging,
  demo2_logMetadata,
  demo3_childLoggers,
  demo4_logLevels,
  demo5_logRotation,
  demo6_separateErrorLogs,
  demo7_readingLogs,
  demo8_realWorldApp
};
