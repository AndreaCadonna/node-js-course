/**
 * Text Processor Plugin
 * Demonstrates storage and crypto permissions
 */

let config = {
  cacheEnabled: true,
  maxCacheSize: 100
};

// Initialize plugin
async function init() {
  console.log('Text Processor plugin initialized');

  // Load configuration from storage
  const savedConfig = await __api__.storage.get('config');
  if (savedConfig) {
    config = { ...config, ...savedConfig };
    console.log('Loaded configuration from storage');
  }
}

// Configure plugin
async function configure(newConfig) {
  config = { ...config, ...newConfig };

  // Save configuration to storage
  await __api__.storage.set('config', config);

  console.log('Configuration updated');
  return config;
}

// Main execution function
async function execute(options = {}) {
  const { text, operation = 'hash', algorithm = 'sha256' } = options;

  if (!text) {
    throw new Error('Text is required');
  }

  let result;

  switch (operation) {
    case 'hash':
      result = await hashText(text, algorithm);
      break;

    case 'reverse':
      result = reverseText(text);
      break;

    case 'uppercase':
      result = text.toUpperCase();
      break;

    case 'lowercase':
      result = text.toLowerCase();
      break;

    case 'wordcount':
      result = countWords(text);
      break;

    case 'stats':
      result = getTextStats(text);
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  // Cache result if enabled
  if (config.cacheEnabled) {
    const cacheKey = `cache:${operation}:${text.substring(0, 20)}`;
    await __api__.storage.set(cacheKey, result);
  }

  return {
    operation,
    input: text.length > 50 ? text.substring(0, 50) + '...' : text,
    result,
    timestamp: __api__.utils.timestamp()
  };
}

// Hash text using crypto
async function hashText(text, algorithm) {
  const hash = __api__.crypto.createHash(algorithm);
  hash.update(text);
  return hash.digest('hex');
}

// Reverse text
function reverseText(text) {
  return text.split('').reverse().join('');
}

// Count words
function countWords(text) {
  const words = text.trim().split(/\s+/);
  return {
    count: words.length,
    words: words.slice(0, 10) // First 10 words
  };
}

// Get text statistics
function getTextStats(text) {
  const chars = text.length;
  const words = text.trim().split(/\s+/).length;
  const lines = text.split('\n').length;
  const spaces = (text.match(/\s/g) || []).length;

  return {
    characters: chars,
    words,
    lines,
    spaces,
    alphanumeric: (text.match(/[a-zA-Z0-9]/g) || []).length
  };
}

// Cleanup
async function destroy() {
  console.log('Text Processor plugin destroyed');
}

module.exports = {
  init,
  configure,
  execute,
  destroy
};
