/**
 * Example 7: Practical Data Processing
 *
 * Real-world scenario: Processing a large dataset
 *
 * Demonstrates:
 * - Practical use case for workers
 * - Processing large amounts of data
 * - Progress updates from worker
 * - Complete workflow from start to finish
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

// Generate sample data (simulating a large dataset)
function generateSampleData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      value: Math.random() * 1000,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      timestamp: Date.now() - Math.random() * 86400000
    });
  }
  return data;
}

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 7: Practical Data Processing ===\n');

  // Generate large dataset
  console.log('Generating dataset...');
  const dataCount = 50000;
  const dataset = generateSampleData(dataCount);
  console.log(`Generated ${dataset.length} records\n`);

  // Processing configuration
  const config = {
    filterCategory: 'A',
    minValue: 500,
    aggregateBy: 'category'
  };

  console.log('Processing configuration:');
  console.log('  Filter category:', config.filterCategory);
  console.log('  Minimum value:', config.minValue);
  console.log('  Aggregate by:', config.aggregateBy);
  console.log('');

  console.log('Starting worker to process data...\n');

  const startTime = Date.now();

  // Create worker with data and configuration
  const worker = new Worker(__filename, {
    workerData: {
      dataset,
      config
    }
  });

  // Handle progress updates
  worker.on('message', (message) => {
    if (message.type === 'progress') {
      // Progress update
      const progress = message.percent.toFixed(1);
      const bar = '='.repeat(Math.floor(progress / 2)) + ' '.repeat(50 - Math.floor(progress / 2));
      process.stdout.write(`\rProgress: [${bar}] ${progress}%`);

    } else if (message.type === 'result') {
      // Final result
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('\n\n=== Processing Complete ===');
      console.log('Time taken:', duration, 'ms');
      console.log('');

      console.log('Results:');
      console.log('  Filtered records:', message.result.filteredCount);
      console.log('  Total value:', message.result.totalValue.toFixed(2));
      console.log('  Average value:', message.result.avgValue.toFixed(2));
      console.log('  Max value:', message.result.maxValue.toFixed(2));
      console.log('  Min value:', message.result.minValue.toFixed(2));
      console.log('');

      if (message.result.aggregated) {
        console.log('Aggregated by category:');
        Object.entries(message.result.aggregated).forEach(([category, stats]) => {
          console.log(`  ${category}: ${stats.count} records, avg: ${stats.avg.toFixed(2)}`);
        });
      }

      worker.terminate();
    }
  });

  worker.on('error', (err) => {
    console.error('\nWorker error:', err);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Worker exited with error code ${code}`);
    }
  });

} else {
  // === WORKER THREAD CODE ===
  const { dataset, config } = workerData;

  console.log('Worker: Starting data processing');
  console.log('Worker: Processing', dataset.length, 'records\n');

  // Process the data
  const filtered = [];
  let lastProgressReport = 0;

  // Filter the data
  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];

    // Send progress updates every 10%
    const percent = (i / dataset.length) * 100;
    if (percent - lastProgressReport >= 10) {
      parentPort.postMessage({
        type: 'progress',
        percent: percent,
        processed: i
      });
      lastProgressReport = percent;
    }

    // Apply filters
    if (item.category === config.filterCategory && item.value >= config.minValue) {
      filtered.push(item);
    }
  }

  // Calculate statistics
  const totalValue = filtered.reduce((sum, item) => sum + item.value, 0);
  const values = filtered.map(item => item.value);

  const result = {
    filteredCount: filtered.length,
    totalValue: totalValue,
    avgValue: filtered.length > 0 ? totalValue / filtered.length : 0,
    maxValue: Math.max(...values),
    minValue: Math.min(...values)
  };

  // Aggregate by category if requested
  if (config.aggregateBy === 'category') {
    const aggregated = {};

    filtered.forEach(item => {
      if (!aggregated[item.category]) {
        aggregated[item.category] = {
          count: 0,
          total: 0,
          avg: 0
        };
      }

      aggregated[item.category].count++;
      aggregated[item.category].total += item.value;
    });

    // Calculate averages
    Object.keys(aggregated).forEach(category => {
      const stats = aggregated[category];
      stats.avg = stats.total / stats.count;
    });

    result.aggregated = aggregated;
  }

  // Send final result
  parentPort.postMessage({
    type: 'result',
    result: result
  });

  console.log('Worker: Processing complete');
}
