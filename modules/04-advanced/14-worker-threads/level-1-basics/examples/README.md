# Level 1 Examples - Worker Threads Basics

This directory contains practical, runnable examples demonstrating worker thread fundamentals.

## Running the Examples

Each example is self-contained and can be run directly:

```bash
node 01-basic-worker.js
node 02-message-passing.js
# ... etc
```

## Examples Overview

### 01-basic-worker.js
**Concepts:** Creating workers, basic communication, termination
**Time:** 5 minutes
Simple worker creation and message exchange.

### 02-message-passing.js
**Concepts:** Two-way communication, multiple messages
**Time:** 5 minutes
Complete communication patterns between main and worker.

### 03-worker-data.js
**Concepts:** Initialization with workerData, configuration
**Time:** 5 minutes
Passing initial data and configuration to workers.

### 04-worker-lifecycle.js
**Concepts:** Worker events (online, message, error, exit)
**Time:** 7 minutes
Understanding the complete worker lifecycle.

### 05-error-handling.js
**Concepts:** Error handling, try-catch, error events
**Time:** 7 minutes
Proper error handling in workers.

### 06-cpu-intensive.js
**Concepts:** Offloading CPU work, performance comparison
**Time:** 7 minutes
Real-world CPU-intensive task example.

### 07-practical-example.js
**Concepts:** Complete practical application
**Time:** 10 minutes
Real-world data processing application.

## Learning Tips

1. **Read the code** before running - understand what it does
2. **Run each example** - observe the output
3. **Modify the examples** - experiment with changes
4. **Monitor CPU usage** - see parallelism in action
5. **Check timing** - compare single vs multi-threaded performance

## Next Steps

After studying these examples, complete the [exercises](../exercises/) to practice what you've learned.
