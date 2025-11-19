# Worker Data Initialization

## What is workerData?

`workerData` is a special mechanism for passing **initial configuration data** to a worker when it's created. Unlike `postMessage()` which sends messages after creation, `workerData` provides data that's available immediately when the worker starts.

## Basic Usage

### Sending workerData

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: {
    taskName: 'Processing Task',
    config: {
      timeout: 5000,
      retries: 3
    },
    inputData: [1, 2, 3, 4, 5]
  }
});
```

### Receiving workerData

```javascript
// worker.js
const { workerData } = require('worker_threads');

console.log('Task name:', workerData.taskName);
console.log('Timeout:', workerData.config.timeout);
console.log('Input data:', workerData.inputData);

// Use the data
processData(workerData.inputData);
```

## workerData vs postMessage

### Timing Difference

```javascript
// Using workerData - Available immediately
const worker = new Worker('./worker.js', {
  workerData: { init: 'value' }
});

// worker.js
const { workerData } = require('worker_threads');
console.log(workerData.init); // Available immediately
```

```javascript
// Using postMessage - Requires event listener
const worker = new Worker('./worker.js');
worker.postMessage({ init: 'value' });

// worker.js
const { parentPort } = require('worker_threads');
parentPort.on('message', (data) => {
  console.log(data.init); // Only available after message event
});
```

### When to Use Each

**Use workerData for:**
- Configuration that won't change
- Initial setup data
- Worker identification (ID, name)
- Constants and settings
- Data needed before any messages are received

**Use postMessage for:**
- Dynamic data during execution
- Multiple data transfers
- Responses to worker output
- Data that changes over time

## Common Use Cases

### Use Case 1: Worker Configuration

```javascript
// main.js
const { Worker } = require('worker_threads');

function createWorker(config) {
  return new Worker('./configurable-worker.js', {
    workerData: {
      logLevel: config.logLevel || 'info',
      maxMemory: config.maxMemory || 512,
      environment: process.env.NODE_ENV || 'development'
    }
  });
}

const worker = createWorker({
  logLevel: 'debug',
  maxMemory: 1024
});
```

```javascript
// configurable-worker.js
const { workerData, parentPort } = require('worker_threads');

// Use configuration
const logger = createLogger(workerData.logLevel);
setMemoryLimit(workerData.maxMemory);

logger.info(`Worker started in ${workerData.environment} mode`);
```

### Use Case 2: Worker Identification

```javascript
// main.js - Create worker pool with IDs
const workers = [];
for (let i = 0; i < 4; i++) {
  workers.push(new Worker('./worker.js', {
    workerData: {
      workerId: i,
      poolSize: 4
    }
  }));
}
```

```javascript
// worker.js
const { workerData, parentPort } = require('worker_threads');

console.log(`Worker ${workerData.workerId} of ${workerData.poolSize} starting`);

parentPort.on('message', (task) => {
  console.log(`Worker ${workerData.workerId} processing task:`, task);
  // Process task
});
```

### Use Case 3: Initial Dataset

```javascript
// main.js
const { Worker } = require('worker_threads');

// Pass large initial dataset
const initialData = loadLargeDataset();

const worker = new Worker('./processor.js', {
  workerData: {
    dataset: initialData,
    processingRules: {
      filter: 'active',
      sortBy: 'date'
    }
  }
});

worker.on('message', (result) => {
  console.log('Processed:', result);
});
```

```javascript
// processor.js
const { workerData, parentPort } = require('worker_threads');

// Dataset is immediately available
const { dataset, processingRules } = workerData;

// Process the data
const filtered = dataset.filter(item => item.status === processingRules.filter);
const sorted = filtered.sort((a, b) => a[processingRules.sortBy] - b[processingRules.sortBy]);

parentPort.postMessage(sorted);
```

### Use Case 4: Environment and Context

```javascript
// main.js
const { Worker } = require('worker_threads');
const path = require('path');

const worker = new Worker('./worker.js', {
  workerData: {
    cwd: process.cwd(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      API_KEY: process.env.API_KEY
    },
    paths: {
      data: path.join(process.cwd(), 'data'),
      output: path.join(process.cwd(), 'output')
    }
  }
});
```

```javascript
// worker.js
const { workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

async function processFiles() {
  const dataPath = workerData.paths.data;
  const outputPath = workerData.paths.output;

  // Read from data directory
  const files = await fs.readdir(dataPath);

  // Process and write to output directory
  for (const file of files) {
    const data = await fs.readFile(path.join(dataPath, file));
    const processed = processData(data);
    await fs.writeFile(path.join(outputPath, file), processed);
  }
}
```

## Immutability of workerData

### workerData is Read-Only (Sort Of)

```javascript
// worker.js
const { workerData } = require('worker_threads');

console.log('Initial:', workerData.value);

// You can modify the object
workerData.value = 'changed';
console.log('Modified:', workerData.value); // 'changed'

// But it doesn't affect the main thread
// and it's a copy, not a reference
```

**Important:** workerData is cloned like `postMessage()` data. Modifications in the worker don't affect the original.

### Avoiding Mutation

```javascript
// worker.js
const { workerData } = require('worker_threads');

// Good practice: create a local copy for modifications
const config = { ...workerData.config };

// Now modify the copy
config.processed = true;
config.timestamp = Date.now();
```

## Complex Data Types

### What Can Be Passed?

```javascript
// main.js
const { Worker } = require('worker_threads');

const worker = new Worker('./worker.js', {
  workerData: {
    // Primitives
    string: 'text',
    number: 42,
    boolean: true,
    null: null,
    undefined: undefined,

    // Objects and arrays
    object: { nested: { value: 1 } },
    array: [1, 2, 3],

    // Dates
    timestamp: new Date(),

    // Typed arrays and buffers
    buffer: Buffer.from('hello'),
    typedArray: new Uint8Array([1, 2, 3]),
    arrayBuffer: new ArrayBuffer(8),

    // Collections
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3])
  }
});
```

### What Cannot Be Passed?

```javascript
// ❌ These won't work in workerData
const worker = new Worker('./worker.js', {
  workerData: {
    func: () => {}, // ❌ Functions
    symbol: Symbol('sym'), // ❌ Symbols
    worker: new Worker('./other.js'), // ❌ Worker instances
    stream: fs.createReadStream('file.txt') // ❌ Streams
  }
});
```

## Combining workerData and postMessage

### Pattern: Configuration + Tasks

```javascript
// main.js
const { Worker } = require('worker_threads');

// Pass configuration via workerData
const worker = new Worker('./worker.js', {
  workerData: {
    apiKey: process.env.API_KEY,
    timeout: 5000,
    maxRetries: 3
  }
});

// Send tasks via postMessage
worker.postMessage({ type: 'FETCH', url: 'https://api.example.com/data' });
worker.postMessage({ type: 'PROCESS', data: [1, 2, 3] });

worker.on('message', (result) => {
  console.log('Result:', result);
});
```

```javascript
// worker.js
const { workerData, parentPort } = require('worker_threads');

// Use configuration from workerData
const config = {
  apiKey: workerData.apiKey,
  timeout: workerData.timeout,
  maxRetries: workerData.maxRetries
};

// Handle tasks from postMessage
parentPort.on('message', async (task) => {
  if (task.type === 'FETCH') {
    const result = await fetchWithRetry(task.url, config);
    parentPort.postMessage({ type: 'FETCH_RESULT', result });
  } else if (task.type === 'PROCESS') {
    const result = processData(task.data);
    parentPort.postMessage({ type: 'PROCESS_RESULT', result });
  }
});
```

## Validation and Type Checking

### Validate workerData

```javascript
// worker.js
const { workerData, parentPort } = require('worker_threads');

// Validate required fields
if (!workerData) {
  throw new Error('workerData is required');
}

if (!workerData.config) {
  throw new Error('config is required in workerData');
}

if (typeof workerData.config.timeout !== 'number') {
  throw new Error('config.timeout must be a number');
}

// Now safe to use
const { config } = workerData;
console.log('Configuration valid:', config);
```

### Default Values

```javascript
// worker.js
const { workerData } = require('worker_threads');

// Provide defaults for optional values
const config = {
  timeout: workerData?.timeout || 5000,
  maxRetries: workerData?.maxRetries || 3,
  logLevel: workerData?.logLevel || 'info',
  ...workerData?.config
};

console.log('Using config:', config);
```

## Common Patterns

### Pattern 1: Worker Factory with Configuration

```javascript
// worker-factory.js
const { Worker } = require('worker_threads');

function createWorker(type, config = {}) {
  const workerFile = `./workers/${type}-worker.js`;

  return new Worker(workerFile, {
    workerData: {
      type,
      config: {
        logLevel: config.logLevel || 'info',
        timeout: config.timeout || 5000,
        ...config
      },
      createdAt: new Date().toISOString()
    }
  });
}

// Usage
const imageWorker = createWorker('image', { quality: 80 });
const dataWorker = createWorker('data', { batchSize: 100 });
```

### Pattern 2: Shared Configuration Object

```javascript
// main.js
const { Worker } = require('worker_threads');

const sharedConfig = {
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  },
  cache: {
    ttl: 3600,
    maxSize: 1000
  }
};

// All workers get the same configuration
const workers = Array.from({ length: 4 }, (_, i) => {
  return new Worker('./worker.js', {
    workerData: {
      workerId: i,
      ...sharedConfig
    }
  });
});
```

## Best Practices

### 1. Use workerData for Static Configuration

```javascript
// ✅ Good: Static configuration
const worker = new Worker('./worker.js', {
  workerData: {
    env: process.env.NODE_ENV,
    apiEndpoint: 'https://api.example.com',
    maxConcurrent: 10
  }
});
```

### 2. Don't Use workerData for Large Datasets

```javascript
// ❌ Bad: Large dataset in workerData
const largeData = new Array(1000000).fill({});
const worker = new Worker('./worker.js', {
  workerData: { data: largeData } // Cloned immediately
});

// ✅ Better: Send via postMessage when needed
const worker = new Worker('./worker.js');
worker.postMessage({ data: largeData });
```

### 3. Document Expected workerData Structure

```javascript
// worker.js
/**
 * Expected workerData structure:
 * {
 *   workerId: number,
 *   config: {
 *     timeout: number,
 *     retries: number
 *   },
 *   environment: string
 * }
 */
const { workerData } = require('worker_threads');

// Validate structure matches documentation
validateWorkerData(workerData);
```

## Key Takeaways

1. **workerData passes initial configuration** when creating a worker
2. **Available immediately** - no need to wait for messages
3. **Data is cloned** - same as postMessage
4. **Use for configuration** - not for large datasets
5. **Combine with postMessage** - workerData for config, postMessage for tasks
6. **Always validate** - check required fields and types
7. **Provide defaults** - handle missing optional values

## Next Steps

Learn about [worker lifecycle and events](./05-worker-lifecycle.md) to understand the complete worker lifetime.
