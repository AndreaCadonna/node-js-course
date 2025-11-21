/**
 * Log Levels Configuration
 * Defines logging levels and their properties
 */

const LOG_LEVELS = {
  DEBUG: {
    value: 0,
    name: 'DEBUG',
    color: '\x1b[36m', // Cyan
    label: '[DEBUG]'
  },
  INFO: {
    value: 1,
    name: 'INFO',
    color: '\x1b[32m', // Green
    label: '[INFO]'
  },
  WARN: {
    value: 2,
    name: 'WARN',
    color: '\x1b[33m', // Yellow
    label: '[WARN]'
  },
  ERROR: {
    value: 3,
    name: 'ERROR',
    color: '\x1b[31m', // Red
    label: '[ERROR]'
  },
  FATAL: {
    value: 4,
    name: 'FATAL',
    color: '\x1b[35m', // Magenta
    label: '[FATAL]'
  }
};

const RESET_COLOR = '\x1b[0m';

// Default log rotation settings
const ROTATION_DEFAULTS = {
  maxSize: 10 * 1024 * 1024,  // 10 MB
  maxFiles: 5,                  // Keep 5 backup files
  rotateDaily: false,           // Rotate based on size by default
  datePattern: 'YYYY-MM-DD'     // Date format for daily rotation
};

module.exports = {
  LOG_LEVELS,
  RESET_COLOR,
  ROTATION_DEFAULTS
};
