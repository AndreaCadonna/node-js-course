/**
 * Data Fetcher Plugin
 * Demonstrates fs, network, and storage permissions
 */

let stats = {
  totalFetches: 0,
  successfulFetches: 0,
  failedFetches: 0
};

// Initialize plugin
async function init() {
  console.log('Data Fetcher plugin initialized');

  // Load stats from storage
  const savedStats = await __api__.storage.get('stats');
  if (savedStats) {
    stats = savedStats;
    console.log('Loaded stats from storage:', stats);
  }
}

// Main execution function
async function execute(options = {}) {
  const { url, filename, method = 'GET' } = options;

  if (!url) {
    throw new Error('URL is required');
  }

  stats.totalFetches++;

  try {
    console.log(`Fetching data from ${url}...`);

    // Fetch data from URL
    const response = await __api__.network.fetch(url, { method });

    console.log(`Received response: ${response.status}`);

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.body}`);
    }

    // Save to file if filename provided
    let savedPath = null;
    if (filename) {
      savedPath = `downloads/${filename}`;
      await __api__.fs.writeFile(savedPath, response.body);
      console.log(`Saved to ${savedPath}`);
    }

    // Update stats
    stats.successfulFetches++;
    await saveStats();

    return {
      success: true,
      url,
      status: response.status,
      size: response.body.length,
      savedTo: savedPath,
      timestamp: __api__.utils.timestamp()
    };
  } catch (error) {
    stats.failedFetches++;
    await saveStats();

    throw error;
  }
}

// Get plugin statistics
async function getStats() {
  return {
    ...stats,
    successRate:
      stats.totalFetches > 0
        ? ((stats.successfulFetches / stats.totalFetches) * 100).toFixed(2) + '%'
        : '0%'
  };
}

// List downloaded files
async function listDownloads() {
  try {
    const files = await __api__.fs.listFiles('downloads');
    return files.filter(f => f.isFile);
  } catch (error) {
    return [];
  }
}

// Read downloaded file
async function readFile(filename) {
  const path = `downloads/${filename}`;
  const exists = await __api__.fs.exists(path);

  if (!exists) {
    throw new Error(`File not found: ${filename}`);
  }

  return await __api__.fs.readFile(path);
}

// Save stats to storage
async function saveStats() {
  await __api__.storage.set('stats', stats);
}

// Reset stats
async function resetStats() {
  stats = {
    totalFetches: 0,
    successfulFetches: 0,
    failedFetches: 0
  };
  await saveStats();
  return stats;
}

// Cleanup
async function destroy() {
  await saveStats();
  console.log('Data Fetcher plugin destroyed');
}

module.exports = {
  init,
  execute,
  getStats,
  listDownloads,
  readFile,
  resetStats,
  destroy
};
