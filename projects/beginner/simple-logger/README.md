# Simple Logger

A flexible, production-ready logging utility for Node.js built using only core modules (`fs` and `path`). Features multiple log levels, automatic rotation, metadata support, and more.

## Features

- **5 Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Color-Coded Console Output**: Easy visual distinction between log levels
- **Automatic Log Rotation**: By size or date
- **Separate Error Files**: Optional dedicated error log
- **Metadata Support**: Add contextual information to logs
- **Child Loggers**: Create module-specific loggers with inherited metadata
- **Timestamp Support**: ISO 8601 formatted timestamps
- **Statistics Tracking**: Monitor logging activity
- **Log Reading & Filtering**: Query logs programmatically
- **Zero Dependencies**: Built with Node.js core modules only

## Project Structure

```
simple-logger/
├── src/
│   ├── logger.js          # Main Logger class
│   ├── log-levels.js      # Log level configuration
│   └── index.js           # CLI interface
├── tests/
│   └── test-logger.js     # Comprehensive test suite
├── examples/
│   └── demo.js            # Interactive demos
└── README.md              # This file
```

## Installation

No installation required! This project uses only Node.js core modules.

```bash
# Clone or download the project
cd simple-logger
```

## Quick Start

### Basic Usage

```javascript
const Logger = require('./src/logger');

const logger = new Logger();

logger.info('Application started');
logger.warn('Low disk space');
logger.error('Database connection failed');
```

### With Configuration

```javascript
const Logger = require('./src/logger');

const logger = new Logger({
  logDir: './logs',           // Log directory
  logFile: 'app.log',         // Log file name
  level: 'INFO',              // Minimum log level
  console: true,              // Log to console
  colorize: true,             // Colorize console output
  maxSize: 10 * 1024 * 1024,  // 10MB per file
  maxFiles: 5                 // Keep 5 backup files
});

await logger.info('Server started on port 3000');
```

## Command Line Interface

### Basic Commands

```bash
# Log a message
node src/index.js log "Application started"

# Log with specific level
node src/index.js log "Database error" --level ERROR

# Read logs
node src/index.js read

# Read last 20 entries
node src/index.js read --lines 20

# Read only errors
node src/index.js read --level ERROR

# View statistics
node src/index.js stats

# Clear all logs
node src/index.js clear
```

### CLI Options

```bash
-h, --help          Show help message
-l, --level LEVEL   Log level (DEBUG, INFO, WARN, ERROR, FATAL)
-d, --log-dir DIR   Log directory (default: ./logs)
-f, --log-file FILE Log file name (default: app.log)
-n, --lines N       Number of lines to read
```

## API Reference

### Constructor

```javascript
new Logger(options)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logDir` | string | `'./logs'` | Directory for log files |
| `logFile` | string | `'app.log'` | Log file name |
| `level` | string | `'INFO'` | Minimum log level to record |
| `console` | boolean | `true` | Also log to console |
| `colorize` | boolean | `true` | Colorize console output |
| `timestamp` | boolean | `true` | Include timestamps |
| `maxSize` | number | `10485760` | Max file size (10MB) |
| `maxFiles` | number | `5` | Number of backup files to keep |
| `rotateDaily` | boolean | `false` | Rotate daily instead of by size |
| `separateErrorFile` | boolean | `true` | Create separate error log |
| `metadata` | object | `{}` | Default metadata for all logs |

### Methods

#### Logging Methods

```javascript
// Log at different levels
await logger.debug(message, metadata)
await logger.info(message, metadata)
await logger.warn(message, metadata)
await logger.error(message, metadata)
await logger.fatal(message, metadata)

// Generic log method
await logger.log(level, message, metadata)
```

#### Utility Methods

```javascript
// Read logs
const logs = await logger.readLogs({
  lines: 10,           // Limit number of lines
  level: 'ERROR',      // Filter by level
  errorLog: false      // Read from error log
});

// Get statistics
const stats = logger.getStats();

// Clear all logs
const count = await logger.clearLogs();

// Create child logger
const childLogger = logger.child({ module: 'auth' });
```

## Log Levels

Logs are only recorded if they meet or exceed the configured level:

| Level | Value | Description | Color |
|-------|-------|-------------|-------|
| **DEBUG** | 0 | Detailed debugging information | Cyan |
| **INFO** | 1 | General informational messages | Green |
| **WARN** | 2 | Warning messages | Yellow |
| **ERROR** | 3 | Error messages | Red |
| **FATAL** | 4 | Fatal error messages | Magenta |

**Example:** If level is set to `WARN`, only WARN, ERROR, and FATAL will be logged.

## Usage Examples

### Example 1: Application Logging

```javascript
const Logger = require('./src/logger');

const logger = new Logger({
  logDir: './logs',
  logFile: 'app.log',
  metadata: { app: 'my-app', version: '1.0.0' }
});

// Application startup
await logger.info('Application starting');
await logger.info('Configuration loaded');
await logger.info('Server listening on port 3000');

// Normal operations
await logger.info('User logged in', { userId: '12345' });
await logger.warn('High memory usage', { usage: '85%' });

// Error handling
try {
  // Some operation
} catch (error) {
  await logger.error('Operation failed', {
    error: error.message,
    stack: error.stack
  });
}
```

### Example 2: Module-Specific Logging

```javascript
const Logger = require('./src/logger');

// Create main logger
const mainLogger = new Logger({
  metadata: { app: 'e-commerce' }
});

// Create child loggers for different modules
const authLogger = mainLogger.child({ module: 'auth' });
const dbLogger = mainLogger.child({ module: 'database' });
const apiLogger = mainLogger.child({ module: 'api' });

// Each logs with its own context
await authLogger.info('Login attempt', { username: 'john' });
await dbLogger.error('Query timeout', { query: 'SELECT * FROM users' });
await apiLogger.info('Request processed', { endpoint: '/api/users', duration: '45ms' });
```

**Output:**
```
[2025-11-20T10:30:45.123Z] [INFO] [app=e-commerce module=auth] Login attempt username=john
[2025-11-20T10:30:46.234Z] [ERROR] [app=e-commerce module=database] Query timeout query=SELECT * FROM users
[2025-11-20T10:30:47.345Z] [INFO] [app=e-commerce module=api] Request processed endpoint=/api/users duration=45ms
```

### Example 3: Log Rotation

```javascript
const Logger = require('./src/logger');

// Rotate by size
const logger = new Logger({
  maxSize: 10 * 1024 * 1024,  // 10 MB
  maxFiles: 5                   // Keep 5 backups
});

// When app.log reaches 10MB:
// app.log      -> renamed to app.1.log
// app.1.log    -> renamed to app.2.log
// app.2.log    -> renamed to app.3.log
// ...
// app.5.log    -> deleted
```

```javascript
// Rotate daily
const logger = new Logger({
  rotateDaily: true
});

// Creates files like:
// app-2025-11-20.log
// app-2025-11-21.log
// app-2025-11-22.log
```

### Example 4: Separate Error Logs

```javascript
const logger = new Logger({
  separateErrorFile: true
});

await logger.info('Normal operation');  // -> app.log
await logger.error('Error occurred');   // -> app.log AND app.error.log
await logger.fatal('Critical failure'); // -> app.log AND app.error.log
```

**Result:**
- `app.log`: Contains ALL log levels
- `app.error.log`: Contains ONLY ERROR and FATAL

### Example 5: Development vs Production

```javascript
// Development: Verbose logging
const devLogger = new Logger({
  level: 'DEBUG',
  console: true,
  colorize: true
});

// Production: Less verbose, file-focused
const prodLogger = new Logger({
  level: 'INFO',
  console: false,
  maxSize: 50 * 1024 * 1024,
  maxFiles: 10
});

const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
```

### Example 6: Reading and Filtering Logs

```javascript
const logger = new Logger();

// Write some logs
await logger.info('Message 1');
await logger.warn('Warning 1');
await logger.error('Error 1');

// Read all logs
const allLogs = await logger.readLogs();
console.log(allLogs);  // Array of all log lines

// Read last 10 logs
const recentLogs = await logger.readLogs({ lines: 10 });

// Read only errors
const errorLogs = await logger.readLogs({ level: 'ERROR' });

// Read from error log file
const errorFileContent = await logger.readLogs({ errorLog: true });
```

### Example 7: Statistics

```javascript
const logger = new Logger();

await logger.info('Message 1');
await logger.warn('Warning 1');
await logger.error('Error 1');

const stats = logger.getStats();

console.log(stats);
/*
{
  totalLogs: 3,
  logsByLevel: {
    DEBUG: 0,
    INFO: 1,
    WARN: 1,
    ERROR: 1,
    FATAL: 0
  },
  rotations: 0,
  errors: [],
  currentLogFile: './logs/app.log',
  currentErrorFile: './logs/app.error.log'
}
*/
```

## Log Format

### With Timestamp (default)

```
[2025-11-20T10:30:45.123Z] [INFO] Application started
[2025-11-20T10:30:46.234Z] [ERROR] [userId=123] Database connection failed
```

### Without Timestamp

```
[INFO] Application started
[ERROR] [userId=123] Database connection failed
```

### With Metadata

```
[2025-11-20T10:30:45.123Z] [INFO] [app=my-app version=1.0.0] Application started
[2025-11-20T10:30:46.234Z] [ERROR] [module=auth userId=123] Login failed
```

## Running Tests

Comprehensive test suite with 20+ test cases:

```bash
node tests/test-logger.js
```

**Test Coverage:**
- ✓ Logger initialization
- ✓ Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- ✓ Log level filtering
- ✓ Timestamps
- ✓ Metadata support
- ✓ Child loggers
- ✓ Separate error logs
- ✓ Log rotation
- ✓ Reading logs
- ✓ Filtering logs
- ✓ Statistics tracking
- ✓ Error handling
- ✓ Daily rotation
- ✓ Custom file names

## Running Demos

Interactive demonstrations:

```bash
node examples/demo.js
```

**Demos include:**
1. Basic logging
2. Logging with metadata
3. Child loggers
4. Log levels and filtering
5. Log rotation
6. Separate error logs
7. Reading logs
8. Real-world application simulation

## Best Practices

### 1. Use Appropriate Log Levels

```javascript
// DEBUG - Development/debugging only
await logger.debug('User object:', { user });

// INFO - Normal operations
await logger.info('Server started on port 3000');

// WARN - Potential issues
await logger.warn('Disk space low', { available: '5%' });

// ERROR - Errors that can be recovered
await logger.error('Failed to send email', { to: 'user@example.com' });

// FATAL - Critical errors requiring immediate attention
await logger.fatal('Database connection lost');
```

### 2. Add Context with Metadata

```javascript
// Bad - No context
await logger.error('Operation failed');

// Good - With context
await logger.error('Operation failed', {
  operation: 'createUser',
  userId: '12345',
  error: error.message
});
```

### 3. Use Child Loggers for Modules

```javascript
// auth.js
const authLogger = mainLogger.child({ module: 'auth' });
authLogger.info('Login attempt', { username });

// database.js
const dbLogger = mainLogger.child({ module: 'database' });
dbLogger.error('Query failed', { query });
```

### 4. Set Appropriate Rotation Limits

```javascript
// Small application
const logger = new Logger({
  maxSize: 5 * 1024 * 1024,   // 5 MB
  maxFiles: 3
});

// Large application
const logger = new Logger({
  maxSize: 50 * 1024 * 1024,  // 50 MB
  maxFiles: 10
});
```

### 5. Environment-Based Configuration

```javascript
const config = {
  development: {
    level: 'DEBUG',
    console: true,
    colorize: true
  },
  production: {
    level: 'INFO',
    console: false,
    maxSize: 50 * 1024 * 1024,
    maxFiles: 10
  }
};

const logger = new Logger(config[process.env.NODE_ENV || 'development']);
```

## Advanced Features

### Request Tracking

```javascript
// Track requests with unique IDs
function handleRequest(req, res) {
  const requestId = generateId();
  const requestLogger = logger.child({ requestId });

  requestLogger.info('Request received', { method: req.method, path: req.url });

  // ... handle request ...

  requestLogger.info('Response sent', { status: res.statusCode });
}
```

### Error Stack Traces

```javascript
try {
  // Some operation
} catch (error) {
  await logger.error('Operation failed', {
    message: error.message,
    stack: error.stack,
    code: error.code
  });
}
```

### Performance Monitoring

```javascript
const start = Date.now();

// Some operation

const duration = Date.now() - start;
await logger.info('Operation completed', { duration: `${duration}ms` });
```

## Troubleshooting

### Logs Not Appearing

1. Check log level configuration:
   ```javascript
   const logger = new Logger({ level: 'DEBUG' }); // Most verbose
   ```

2. Verify log directory permissions:
   ```bash
   ls -la logs/
   ```

### Log Rotation Not Working

1. Check file size threshold:
   ```javascript
   const stats = await fs.stat('./logs/app.log');
   console.log('File size:', stats.size);
   ```

2. Verify maxSize is set correctly:
   ```javascript
   const logger = new Logger({
     maxSize: 1024 * 1024 // 1 MB for testing
   });
   ```

### Performance Issues

1. Reduce console output in production:
   ```javascript
   const logger = new Logger({ console: false });
   ```

2. Increase rotation size to reduce I/O:
   ```javascript
   const logger = new Logger({
     maxSize: 50 * 1024 * 1024 // 50 MB
   });
   ```

## Learning Objectives

This project demonstrates:

- **File System Operations**: Writing, appending, reading, renaming files
- **Async/Await Patterns**: Modern asynchronous JavaScript
- **Error Handling**: Graceful degradation and error reporting
- **Code Organization**: Modular, maintainable architecture
- **Configuration Management**: Flexible options and defaults
- **CLI Development**: Building command-line interfaces
- **Testing**: Comprehensive test coverage

## Performance Considerations

- **Async Operations**: All I/O is asynchronous
- **Error Handling**: Logs errors internally, doesn't crash
- **Rotation**: Automatic cleanup of old files
- **Buffer Management**: Efficient file appending

## Future Enhancements

Possible additions (as learning exercises):

1. **Log Compression**: Compress rotated logs
2. **Remote Logging**: Send logs to remote server
3. **Log Parsing**: Parse structured log formats
4. **Web Dashboard**: View logs in browser
5. **Performance Monitoring**: Track logging overhead

## License

MIT License - Free to use and modify

## Author

Created as part of the Node.js Core Modules Course - Beginner Project 2

---

**Happy Logging! 📝**
