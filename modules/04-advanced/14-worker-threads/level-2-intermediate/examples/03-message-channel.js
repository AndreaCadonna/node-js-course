/**
 * Level 2 Example 3: MessageChannel for Worker-to-Worker Communication
 *
 * Demonstrates:
 * - Creating MessageChannel
 * - Transferring ports to workers
 * - Direct worker-to-worker communication
 * - Building a processing pipeline
 */

const { Worker, isMainThread, parentPort, MessageChannel } = require('worker_threads');

if (isMainThread) {
  console.log('=== MessageChannel Example: Processing Pipeline ===\n');

  // Create three workers for a processing pipeline
  console.log('Creating processing pipeline: Filter → Transform → Aggregate\n');

  const filterWorker = new Worker(__filename, { workerData: { role: 'filter' } });
  const transformWorker = new Worker(__filename, { workerData: { role: 'transform' } });
  const aggregateWorker = new Worker(__filename, { workerData: { role: 'aggregate' } });

  // Create channels to connect workers
  const { port1: filterOut, port2: transformIn } = new MessageChannel();
  const { port1: transformOut, port2: aggregateIn } = new MessageChannel();

  // Connect filter → transform
  console.log('Connecting Filter → Transform');
  filterWorker.postMessage({ type: 'setup', outputPort: filterOut }, [filterOut]);
  transformWorker.postMessage({ type: 'setup', inputPort: transformIn }, [transformIn]);

  // Connect transform → aggregate
  console.log('Connecting Transform → Aggregate');
  transformWorker.postMessage({ type: 'setup', outputPort: transformOut }, [transformOut]);
  aggregateWorker.postMessage({ type: 'setup', inputPort: aggregateIn }, [aggregateIn]);

  // Listen for final result from aggregate worker
  aggregateWorker.on('message', (message) => {
    if (message.type === 'result') {
      console.log('\n=== Pipeline Complete ===');
      console.log('Final Result:', JSON.stringify(message.data, null, 2));

      // Cleanup
      setTimeout(() => {
        filterWorker.terminate();
        transformWorker.terminate();
        aggregateWorker.terminate();
      }, 100);
    }
  });

  console.log('Pipeline connected!\n');

  // Send data into the pipeline
  const inputData = [
    { id: 1, value: 10, category: 'A' },
    { id: 2, value: 5, category: 'B' },
    { id: 3, value: 15, category: 'A' },
    { id: 4, value: 3, category: 'C' },
    { id: 5, value: 20, category: 'A' },
    { id: 6, value: 8, category: 'B' }
  ];

  console.log('Sending data into pipeline:', inputData);
  filterWorker.postMessage({ type: 'data', data: inputData });

} else {
  // === WORKER THREAD CODE ===
  const { workerData } = require('worker_threads');
  const role = workerData.role;

  let inputPort, outputPort;

  parentPort.on('message', (message) => {
    if (message.type === 'setup') {
      if (message.inputPort) {
        inputPort = message.inputPort;
        console.log(`[${role}] Input port received`);

        // Listen for data on input port
        inputPort.on('message', (data) => {
          console.log(`[${role}] Received data from previous worker`);
          processData(data);
        });
      }

      if (message.outputPort) {
        outputPort = message.outputPort;
        console.log(`[${role}] Output port received`);
      }

    } else if (message.type === 'data') {
      console.log(`[${role}] Received data from main thread`);
      processData(message.data);
    }
  });

  function processData(data) {
    let result;

    switch (role) {
      case 'filter':
        // Filter: Keep only items with value >= 10
        result = data.filter(item => item.value >= 10);
        console.log(`[${role}] Filtered ${data.length} → ${result.length} items`);

        if (outputPort) {
          outputPort.postMessage(result);
        }
        break;

      case 'transform':
        // Transform: Double all values
        result = data.map(item => ({
          ...item,
          value: item.value * 2
        }));
        console.log(`[${role}] Transformed ${data.length} items (doubled values)`);

        if (outputPort) {
          outputPort.postMessage(result);
        }
        break;

      case 'aggregate':
        // Aggregate: Sum by category
        result = data.reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = { category: item.category, total: 0, count: 0 };
          }
          acc[item.category].total += item.value;
          acc[item.category].count++;
          return acc;
        }, {});

        console.log(`[${role}] Aggregated ${data.length} items into ${Object.keys(result).length} categories`);

        // Send final result back to main thread
        parentPort.postMessage({
          type: 'result',
          data: Object.values(result)
        });
        break;
    }
  }
}
