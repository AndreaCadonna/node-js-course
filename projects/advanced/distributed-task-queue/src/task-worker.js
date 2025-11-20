/**
 * Task Worker
 * Worker thread that executes tasks
 */

const { parentPort, workerData } = require('worker_threads');

// Worker state
const workerId = workerData.workerId;
const taskHandlers = new Map();

// Load task handlers
for (const [type, handlerPath] of Object.entries(workerData.taskHandlers)) {
  try {
    const handler = require(handlerPath);
    taskHandlers.set(type, handler);
  } catch (error) {
    console.error(`Failed to load handler for ${type}:`, error);
  }
}

/**
 * Send message to parent
 */
function sendMessage(type, data) {
  parentPort.postMessage({
    type,
    workerId,
    ...data
  });
}

/**
 * Log message
 */
function log(level, message) {
  sendMessage('log', { level, message });
}

/**
 * Update task progress
 */
function updateProgress(taskId, progress) {
  sendMessage('progress', { taskId, progress });
}

/**
 * Execute task
 */
async function executeTask(task) {
  const startTime = Date.now();

  try {
    log('info', `Executing task ${task.id} of type ${task.type}`);

    // Get handler for task type
    const handler = taskHandlers.get(task.type);

    if (!handler) {
      throw new Error(`No handler found for task type: ${task.type}`);
    }

    // Create task context
    const context = {
      taskId: task.id,
      workerId,
      progress: (progress) => updateProgress(task.id, progress),
      log: (message) => log('info', message)
    };

    // Execute handler
    let result;
    if (typeof handler === 'function') {
      result = await handler(task.payload, context);
    } else if (handler.execute && typeof handler.execute === 'function') {
      result = await handler.execute(task.payload, context);
    } else {
      throw new Error(`Invalid handler for task type: ${task.type}`);
    }

    const executionTime = Date.now() - startTime;

    sendMessage('success', {
      taskId: task.id,
      result,
      executionTime
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    log('error', `Task ${task.id} failed: ${error.message}`);

    sendMessage('error', {
      taskId: task.id,
      error: error.message,
      stack: error.stack,
      executionTime
    });
  }
}

// Listen for messages from parent
parentPort.on('message', async (message) => {
  switch (message.type) {
    case 'execute':
      await executeTask(message.task);
      break;

    default:
      log('warn', `Unknown message type: ${message.type}`);
  }
});

// Signal ready
sendMessage('ready', {});
