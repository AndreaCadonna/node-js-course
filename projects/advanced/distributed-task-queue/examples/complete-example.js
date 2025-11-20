/**
 * Complete Example
 * Demonstrates all features of the distributed task queue
 */

const path = require('path');
const { TaskQueue, APIServer, Monitor } = require('../src');

// Configuration
const config = {
  queueDir: path.join(__dirname, '../queue'),
  poolSize: 4,
  taskHandlers: new Map([
    ['email', path.join(__dirname, 'handlers/email-handler.js')],
    ['image-processing', path.join(__dirname, 'handlers/image-processing-handler.js')],
    ['data-analysis', path.join(__dirname, 'handlers/data-analysis-handler.js')]
  ]),
  persistenceInterval: 5000,
  autoCleanup: true,
  cleanupAge: 60 * 60 * 1000 // 1 hour
};

async function main() {
  console.log('=== Distributed Task Queue - Complete Example ===\n');

  // Create task queue
  const taskQueue = new TaskQueue(config);

  // Create monitor
  const monitor = new Monitor(taskQueue, {
    logDir: path.join(__dirname, '../logs'),
    metricsInterval: 5000,
    alertThresholds: {
      queueSize: 50,
      failureRate: 0.1,
      avgExecutionTime: 30000,
      workerUtilization: 0.8
    }
  });

  // Setup event listeners
  setupEventListeners(taskQueue, monitor);

  // Initialize
  console.log('Initializing task queue...');
  await taskQueue.initialize();

  console.log('Starting monitor...');
  await monitor.start();

  // Start processing
  console.log('Starting task processing...');
  taskQueue.start();

  // Add sample tasks
  console.log('\nAdding sample tasks...\n');
  await addSampleTasks(taskQueue);

  // Start API server (optional)
  if (process.argv.includes('--api')) {
    console.log('\nStarting API server...');
    const apiServer = new APIServer(taskQueue, {
      port: 3000,
      clustered: true,
      numWorkers: 2
    });
    await apiServer.start();
    console.log('API server started on port 3000');
  }

  // Wait for tasks to complete
  console.log('\nProcessing tasks...\n');
  try {
    await taskQueue.waitForCompletion(60000); // 60 second timeout
    console.log('\n=== All tasks completed! ===\n');
  } catch (error) {
    console.error('\nError waiting for completion:', error.message);
  }

  // Display statistics
  displayStatistics(taskQueue, monitor);

  // Graceful shutdown
  console.log('\nShutting down...');
  await monitor.stop();
  await taskQueue.shutdown({ timeout: 10000 });
  console.log('Shutdown complete');

  process.exit(0);
}

/**
 * Setup event listeners
 */
function setupEventListeners(taskQueue, monitor) {
  // Task events
  taskQueue.on('task:added', (task) => {
    console.log(`✓ Task added: ${task.id} (${task.type})`);
  });

  taskQueue.on('task:started', (task) => {
    console.log(`▶ Task started: ${task.id}`);
  });

  taskQueue.on('task:completed', (task) => {
    console.log(`✓ Task completed: ${task.id} (${task.getExecutionTime()}ms)`);
  });

  taskQueue.on('task:failed', (data) => {
    console.log(`✗ Task failed: ${data.task.id} - ${data.task.error?.message}`);
  });

  taskQueue.on('task:progress', (data) => {
    console.log(`  Progress: ${data.task.id} - ${data.progress}%`);
  });

  // Monitor alerts
  monitor.on('alert', (alert) => {
    console.log(`\n⚠️  ALERT: ${alert.message}\n`);
  });

  // Error handling
  taskQueue.on('error', (error) => {
    console.error('Queue error:', error);
  });
}

/**
 * Add sample tasks
 */
async function addSampleTasks(taskQueue) {
  const tasks = [];

  // Add email tasks
  for (let i = 1; i <= 3; i++) {
    tasks.push(
      taskQueue.addTask({
        type: 'email',
        payload: {
          to: `user${i}@example.com`,
          subject: `Test Email ${i}`,
          body: `This is test email number ${i}`
        },
        priority: i,
        maxAttempts: 3
      })
    );
  }

  // Add image processing task
  tasks.push(
    taskQueue.addTask({
      type: 'image-processing',
      payload: {
        imagePath: '/images/photo.jpg',
        operations: [
          { type: 'resize', width: 800, height: 600 },
          { type: 'filter', filter: 'grayscale' },
          { type: 'compress', quality: 85 }
        ]
      },
      priority: 5,
      timeout: 30000
    })
  );

  // Add data analysis tasks
  for (let i = 1; i <= 2; i++) {
    tasks.push(
      taskQueue.addTask({
        type: 'data-analysis',
        payload: {
          dataSet: `dataset-${i}`,
          analysisType: ['statistics', 'aggregation'][i - 1]
        },
        priority: 3,
        timeout: 20000
      })
    );
  }

  // Add a task that will fail (for demonstration)
  tasks.push(
    taskQueue.addTask({
      type: 'non-existent-type',
      payload: { test: 'data' },
      priority: 1,
      maxAttempts: 2
    })
  );

  await Promise.all(tasks);
  console.log(`Added ${tasks.length} tasks to queue`);
}

/**
 * Display statistics
 */
function displayStatistics(taskQueue, monitor) {
  const stats = taskQueue.getStats();
  const metrics = monitor.getMetrics();
  const alerts = monitor.getAlerts(10);

  console.log('=== Statistics ===\n');

  console.log('Queue:');
  console.log(`  Total tasks: ${stats.queue.total}`);
  console.log(`  Pending: ${stats.queue.byStatus.pending}`);
  console.log(`  Processing: ${stats.queue.byStatus.processing}`);
  console.log(`  Completed: ${stats.queue.byStatus.completed}`);
  console.log(`  Failed: ${stats.queue.byStatus.failed}`);
  console.log(`  Avg waiting time: ${stats.queue.avgWaitingTime}ms`);
  console.log(`  Avg execution time: ${stats.queue.avgExecutionTime}ms`);

  console.log('\nWorkers:');
  console.log(`  Pool size: ${stats.workers.poolSize}`);
  console.log(`  Available: ${stats.workers.availableWorkers}`);
  console.log(`  Busy: ${stats.workers.busyWorkers}`);

  console.log('\nPerformance:');
  console.log(`  Avg throughput: ${metrics.summary.avgThroughput} tasks/min`);
  console.log(`  Avg worker utilization: ${(metrics.summary.avgWorkerUtilization * 100).toFixed(1)}%`);

  if (alerts.length > 0) {
    console.log('\nRecent Alerts:');
    alerts.forEach(alert => {
      console.log(`  - [${new Date(alert.timestamp).toLocaleTimeString()}] ${alert.message}`);
    });
  }

  console.log('');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
