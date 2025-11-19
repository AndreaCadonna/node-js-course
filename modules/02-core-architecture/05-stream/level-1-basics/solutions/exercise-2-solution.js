/**
 * Exercise 2 Solution: Write Log Entries
 *
 * This solution demonstrates:
 * - Creating and writing to a writable stream
 * - Formatting data before writing
 * - Handling backpressure with drain event
 * - Properly closing streams with finish event
 * - Error handling in writable streams
 */

const fs = require('fs');
const path = require('path');

// File path
const LOG_FILE = path.join(__dirname, 'app.log');

/**
 * Format a log entry with timestamp
 *
 * @param {string} level - Log level (INFO, DEBUG, WARN, ERROR)
 * @param {string} message - Log message
 * @returns {string} Formatted log entry
 */
function formatLogEntry(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] ${level.padEnd(5)}: ${message}\n`;
}

/**
 * Write log entries to file using a writable stream
 * This demonstrates proper handling of backpressure
 */
function writeLogEntries() {
  console.log('Writing log entries...\n');

  // Create a writable stream
  const writeStream = fs.createWriteStream(LOG_FILE, {
    flags: 'w', // 'w' = write (overwrite), 'a' = append
    encoding: 'utf8'
  });

  // Sample log entries
  const logEntries = [
    { level: 'INFO', message: 'Application started' },
    { level: 'DEBUG', message: 'Loading configuration from config.json' },
    { level: 'INFO', message: 'Database connection established' },
    { level: 'WARN', message: 'High memory usage detected: 85%' },
    { level: 'ERROR', message: 'Failed to fetch user data from API' },
    { level: 'INFO', message: 'Request processed successfully' },
    { level: 'DEBUG', message: 'Cache cleared for user session' },
    { level: 'WARN', message: 'Deprecated API endpoint called' },
    { level: 'ERROR', message: 'Database query timeout after 30s' },
    { level: 'INFO', message: 'Application shutdown initiated' }
  ];

  let entriesWritten = 0;

  /**
   * Write the next log entry
   * This function handles backpressure properly
   */
  function writeNext(index) {
    // Check if we've written all entries
    if (index >= logEntries.length) {
      // End the stream - this triggers 'finish' event
      writeStream.end();
      return;
    }

    const entry = logEntries[index];
    const formattedEntry = formatLogEntry(entry.level, entry.message);

    // Write returns true if buffer has space, false if full
    const canContinue = writeStream.write(formattedEntry);

    entriesWritten++;
    console.log(`Written [${entry.level}]: ${entry.message}`);

    if (canContinue) {
      // Buffer has space, write next entry immediately
      writeNext(index + 1);
    } else {
      // Buffer is full, wait for 'drain' event
      console.log('  (Buffer full, waiting for drain...)');
      writeStream.once('drain', () => {
        console.log('  (Drained, continuing...)');
        writeNext(index + 1);
      });
    }
  }

  // Listen for 'finish' event - fires when all data is written and stream is closed
  writeStream.on('finish', () => {
    console.log('\n=== Writing Complete ===');
    console.log(`Total entries written: ${entriesWritten}`);
    console.log(`Log file: ${LOG_FILE}`);

    // Read and display the file content
    displayLogFile();
  });

  // Listen for 'error' event
  writeStream.on('error', (error) => {
    console.error('Error writing to file:', error.message);
  });

  // Optional: Listen to 'open' event
  writeStream.on('open', (fd) => {
    console.log(`Log file opened (file descriptor: ${fd})\n`);
  });

  // Start writing
  writeNext(0);
}

/**
 * Alternative simpler implementation for when backpressure is not a concern
 * Good for small amounts of data
 */
function writeLogEntriesSimple() {
  console.log('\n\n=== Simple Implementation (without backpressure handling) ===\n');

  const writeStream = fs.createWriteStream(
    path.join(__dirname, 'app-simple.log'),
    'utf8'
  );

  const entries = [
    { level: 'INFO', message: 'Server started on port 3000' },
    { level: 'DEBUG', message: 'Database pool initialized' },
    { level: 'ERROR', message: 'Authentication failed' },
    { level: 'INFO', message: 'Request completed' }
  ];

  // Simple approach: write all entries
  entries.forEach(entry => {
    writeStream.write(formatLogEntry(entry.level, entry.message));
  });

  // End the stream
  writeStream.end();

  writeStream.on('finish', () => {
    console.log('Simple write completed\n');
  });
}

/**
 * Display the contents of the log file
 */
function displayLogFile() {
  console.log('\n--- Log File Contents ---\n');

  try {
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    console.log(content);
  } catch (error) {
    console.error('Error reading log file:', error.message);
  }
}

/**
 * Demonstrate appending to an existing log file
 */
function appendToLog() {
  console.log('=== Appending to Existing Log ===\n');

  const appendStream = fs.createWriteStream(LOG_FILE, {
    flags: 'a', // 'a' for append mode
    encoding: 'utf8'
  });

  const newEntries = [
    { level: 'INFO', message: 'Application restarted' },
    { level: 'DEBUG', message: 'Configuration reloaded' }
  ];

  newEntries.forEach(entry => {
    appendStream.write(formatLogEntry(entry.level, entry.message));
    console.log(`Appended [${entry.level}]: ${entry.message}`);
  });

  appendStream.end();

  appendStream.on('finish', () => {
    console.log('\nAppend completed\n');
    displayLogFile();
  });
}

/**
 * Main execution
 */
function main() {
  console.log('=== Log Writer Solution ===\n');

  // Write log entries with backpressure handling
  writeLogEntries();

  // Wait a bit, then demonstrate simple implementation
  setTimeout(() => {
    writeLogEntriesSimple();
  }, 500);

  // Wait more, then demonstrate appending
  setTimeout(() => {
    appendToLog();
  }, 1000);
}

// Run the program
main();

/**
 * KEY LEARNING POINTS:
 *
 * 1. Writable Stream Methods:
 *    - write(data): Write data to stream, returns true/false
 *    - end(): Signal that no more data will be written
 *    - end(data): Write final data and end stream
 *
 * 2. Writable Stream Events:
 *    - 'drain': Buffer is ready for more data
 *    - 'finish': All data has been written
 *    - 'error': An error occurred
 *    - 'close': Stream has been closed
 *
 * 3. Backpressure:
 *    - write() returns false when buffer is full
 *    - Wait for 'drain' event before writing more
 *    - Important for memory management with large data
 *
 * 4. File Modes:
 *    - 'w': Write (overwrite existing file)
 *    - 'a': Append (add to existing file)
 *    - 'wx': Write (fail if file exists)
 *
 * 5. Best Practices:
 *    - Always call end() when done writing
 *    - Handle backpressure for large data
 *    - Always handle 'error' event
 *    - Use 'finish' event to know when writing is complete
 */
