/**
 * Example 3: Worker Data (Initialization Data)
 *
 * Demonstrates:
 * - Passing initial data via workerData
 * - Configuration patterns
 * - Worker identification
 * - Creating multiple workers with different data
 */

const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // === MAIN THREAD CODE ===
  console.log('=== Example 3: Worker Data ===\n');

  // Create multiple workers with different initialization data
  const workers = [];

  console.log('Creating 3 workers with different configurations...\n');

  for (let i = 0; i < 3; i++) {
    const worker = new Worker(__filename, {
      workerData: {
        workerId: i + 1,
        name: `Worker-${i + 1}`,
        config: {
          task: ['Process', 'Calculate', 'Transform'][i],
          priority: i + 1,
          timeout: (i + 1) * 1000
        },
        inputData: {
          numbers: [1, 2, 3, 4, 5],
          multiplier: i + 1
        }
      }
    });

    workers.push(worker);

    // Listen for messages from each worker
    worker.on('message', (message) => {
      console.log(`\nMain: Result from ${message.workerName}:`);
      console.log('  Task:', message.task);
      console.log('  Result:', message.result);
      console.log('  Processing time:', message.processingTime, 'ms');
    });

    worker.on('error', (err) => {
      console.error(`Worker ${i + 1} error:`, err);
    });

    worker.on('exit', (code) => {
      console.log(`Worker ${i + 1} exited with code ${code}`);
    });
  }

  // Terminate all workers after they finish
  setTimeout(() => {
    console.log('\n\nMain: Terminating all workers...');
    workers.forEach(worker => worker.terminate());
  }, 3000);

} else {
  // === WORKER THREAD CODE ===

  // Access the workerData passed during creation
  const { workerId, name, config, inputData } = workerData;

  console.log(`\n${name}: Started`);
  console.log(`${name}: Configuration:`, JSON.stringify(config, null, 2));
  console.log(`${name}: Input data:`, JSON.stringify(inputData, null, 2));

  const startTime = Date.now();

  // Use the workerData to customize behavior
  const { numbers, multiplier } = inputData;

  // Perform task based on configuration
  let result;
  switch (config.task) {
    case 'Process':
      result = numbers.map(n => n * multiplier);
      break;

    case 'Calculate':
      result = numbers.reduce((acc, n) => acc + (n * multiplier), 0);
      break;

    case 'Transform':
      result = numbers.map(n => Math.pow(n * multiplier, 2));
      break;

    default:
      result = numbers;
  }

  const endTime = Date.now();

  // Send result back with worker identification
  parentPort.postMessage({
    workerId,
    workerName: name,
    task: config.task,
    result,
    processingTime: endTime - startTime
  });

  console.log(`${name}: Task completed, result sent`);
}
