/**
 * Exercise 2: Write Log Entries
 *
 * OBJECTIVE:
 * Learn to work with writable streams by creating a log file writer.
 *
 * REQUIREMENTS:
 * 1. Create a writable stream to a log file
 * 2. Write multiple log entries with timestamps
 * 3. Format each log entry as: [TIMESTAMP] LEVEL: message
 * 4. Handle the 'finish' event to confirm completion
 * 5. Handle backpressure properly (check write() return value)
 * 6. Handle errors properly
 *
 * EXAMPLE OUTPUT FORMAT:
 * [2025-11-19T10:30:45.123Z] INFO: Application started
 * [2025-11-19T10:30:45.456Z] DEBUG: Configuration loaded
 * [2025-11-19T10:30:45.789Z] ERROR: Connection failed
 *
 * LEARNING GOALS:
 * - Understanding writable streams
 * - Working with write() method and backpressure
 * - Handling 'finish' and 'drain' events
 * - Properly closing streams
 */

const fs = require('fs');
const path = require('path');

// File path
const LOG_FILE = path.join(__dirname, 'app.log');

/**
 * TODO 1: Create a function to format log entries
 *
 * @param {string} level - Log level (INFO, DEBUG, WARN, ERROR)
 * @param {string} message - Log message
 * @returns {string} Formatted log entry with timestamp
 *
 * Format: [ISO_TIMESTAMP] LEVEL: message\n
 */
function formatLogEntry(level, message) {
  // Your code here
}

/**
 * TODO 2: Implement the log writer function
 *
 * Steps:
 * 1. Create a writable stream using fs.createWriteStream()
 * 2. Create an array of log entries to write (at least 5 entries)
 * 3. For each log entry:
 *    - Format it using formatLogEntry()
 *    - Write it to the stream
 *    - Check the return value of write() for backpressure
 *    - If false is returned, wait for 'drain' event
 * 4. After all writes, call stream.end()
 * 5. Listen to 'finish' event to confirm completion
 * 6. Handle 'error' event
 */
function writeLogEntries() {
  // Your code here

  // Sample log entries you can use:
  const logEntries = [
    { level: 'INFO', message: 'Application started' },
    { level: 'DEBUG', message: 'Loading configuration' },
    { level: 'INFO', message: 'Database connected' },
    { level: 'WARN', message: 'High memory usage detected' },
    { level: 'ERROR', message: 'Failed to fetch user data' },
    { level: 'INFO', message: 'Request processed successfully' },
    { level: 'DEBUG', message: 'Cache cleared' },
    { level: 'INFO', message: 'Application stopped' }
  ];

  // Your implementation here
}

// TODO 3: Run the program
console.log('=== Log Writer Exercise ===\n');

// Call your function here
