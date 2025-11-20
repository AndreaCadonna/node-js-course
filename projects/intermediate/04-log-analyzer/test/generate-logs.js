#!/usr/bin/env node

/**
 * Log Generator - Generate test log files
 * Usage: node test/generate-logs.js [lines] [output-file]
 */

const fs = require('fs');
const path = require('path');

const LINES_DEFAULT = 10000;
const OUTPUT_DEFAULT = path.join(__dirname, '..', 'logs', 'generated.log');

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const paths = [
  '/api/users',
  '/api/products',
  '/api/orders',
  '/api/login',
  '/api/logout',
  '/api/dashboard',
  '/api/search',
  '/api/comments',
  '/admin',
  '/health'
];
const statusCodes = [200, 201, 304, 400, 401, 403, 404, 500, 502, 503];
const logLevels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const messages = [
  'Application started',
  'User logged in',
  'User logged out',
  'Database query executed',
  'Cache hit',
  'Cache miss',
  'Email sent',
  'Payment processed',
  'Order created',
  'Product updated',
  'Authentication failed',
  'Database connection lost',
  'Timeout occurred',
  'Invalid request',
  'Rate limit exceeded'
];

/**
 * Generate random IP address
 */
function randomIP() {
  return `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(0, 255)}`;
}

/**
 * Generate random integer
 */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random item from array
 */
function pick(array) {
  return array[rand(0, array.length - 1)];
}

/**
 * Format date for log
 */
function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Format date for Apache log
 */
function formatApacheDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toTimeString().slice(0, 8);
  return `${day}/${month}/${year}:${time} +0000`;
}

/**
 * Generate application log entry
 */
function generateAppLog(timestamp) {
  const level = pick(logLevels);
  const message = pick(messages);
  return `${formatDate(timestamp)} [${level}] ${message}\n`;
}

/**
 * Generate Apache/Nginx log entry
 */
function generateAccessLog(timestamp) {
  const ip = randomIP();
  const method = pick(methods);
  const path = pick(paths);
  const status = pick(statusCodes);
  const size = rand(50, 10000);
  const date = formatApacheDate(timestamp);

  return `${ip} - - [${date}] "${method} ${path} HTTP/1.1" ${status} ${size} "-" "Mozilla/5.0"\n`;
}

/**
 * Generate JSON log entry
 */
function generateJSONLog(timestamp) {
  const level = pick(logLevels);
  const message = pick(messages);

  const log = {
    timestamp: timestamp.toISOString(),
    level,
    message,
    service: 'api-server',
    pid: rand(1000, 9999)
  };

  return JSON.stringify(log) + '\n';
}

/**
 * Generate mixed log file
 */
async function generateLogFile(lines, outputFile) {
  console.log(`Generating ${lines.toLocaleString()} log lines...`);
  console.log(`Output: ${outputFile}\n`);

  const writeStream = fs.createWriteStream(outputFile);
  const startTime = Date.now();
  let currentTime = new Date();

  return new Promise((resolve, reject) => {
    let written = 0;

    function writeChunk() {
      let ok = true;

      while (written < lines && ok) {
        // Mix different log formats
        const format = rand(1, 3);
        let logLine;

        if (format === 1) {
          logLine = generateAppLog(currentTime);
        } else if (format === 2) {
          logLine = generateAccessLog(currentTime);
        } else {
          logLine = generateJSONLog(currentTime);
        }

        // Advance time by 1-10 seconds
        currentTime = new Date(currentTime.getTime() + rand(1000, 10000));

        if (written === lines - 1) {
          writeStream.write(logLine, 'utf8', () => {
            writeStream.end();
          });
        } else {
          ok = writeStream.write(logLine, 'utf8');
        }

        written++;

        if (written % 10000 === 0) {
          process.stdout.write(`\rGenerated: ${written.toLocaleString()} lines`);
        }
      }

      if (written < lines) {
        writeStream.once('drain', writeChunk);
      }
    }

    writeStream.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      console.log(`\n\nCompleted in ${duration.toFixed(2)}s`);
      console.log(`Speed: ${(lines / duration).toFixed(0)} lines/sec`);

      const stats = fs.statSync(outputFile);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`File size: ${sizeMB} MB`);

      resolve();
    });

    writeStream.on('error', reject);

    writeChunk();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Log Generator - Generate test log files

Usage:
  node test/generate-logs.js [lines] [output-file]

Arguments:
  lines          Number of log lines to generate (default: 10000)
  output-file    Output file path (default: logs/generated.log)

Examples:
  node test/generate-logs.js
  node test/generate-logs.js 100000
  node test/generate-logs.js 50000 logs/large.log
    `);
    return;
  }

  const lines = args[0] ? parseInt(args[0]) : LINES_DEFAULT;
  const outputFile = args[1] || OUTPUT_DEFAULT;

  if (isNaN(lines) || lines <= 0) {
    console.error('Error: Invalid number of lines');
    process.exit(1);
  }

  // Ensure logs directory exists
  const logsDir = path.dirname(outputFile);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  await generateLogFile(lines, outputFile);

  console.log('\nDone! You can now analyze it with:');
  console.log(`  node index.js ${outputFile}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
