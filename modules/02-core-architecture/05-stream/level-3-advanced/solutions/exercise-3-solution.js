/**
 * Solution: Exercise 3 - Multi-Source Data Aggregator
 * =====================================================
 * Production-ready aggregator with fan-out/fan-in patterns
 */

const { Transform, PassThrough, Readable, Writable } = require('stream');

class Worker extends Transform {
  constructor(workerId, options) {
    super({ objectMode: true, ...options });
    this.workerId = workerId;
    this.processed = 0;
    this.errors = 0;
  }

  async _transform(item, encoding, callback) {
    try {
      await this.validate(item);
      const enriched = await this.enrich(item);
      const transformed = this.transform(enriched);
      this.processed++;
      callback(null, transformed);
    } catch (err) {
      this.errors++;
      callback(); // Skip errors
    }
  }

  async validate(item) {
    if (!item || !item.id) throw new Error('Invalid item');
  }

  async enrich(item) {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { ...item, enriched: true, workerId: this.workerId };
  }

  transform(item) {
    return { ...item, processedAt: new Date() };
  }

  getStatistics() {
    return { workerId: this.workerId, processed: this.processed, errors: this.errors };
  }
}

class DataAggregator {
  constructor(numWorkers = 3) {
    this.numWorkers = numWorkers;
    this.workers = [];
    this.sources = [];
    this.fanIn = new PassThrough({ objectMode: true });
    this.createWorkerPool();
  }

  createWorkerPool() {
    for (let i = 0; i < this.numWorkers; i++) {
      const worker = new Worker(i + 1);
      this.workers.push(worker);
      worker.pipe(this.fanIn, { end: false });
    }
  }

  addSource(stream, name, priority) {
    this.sources.push({ stream, name, priority });
    console.log(`  Added source: ${name} (priority: ${priority})`);
  }

  async process() {
    let workerIndex = 0;
    let activeSources = this.sources.length;

    this.sources.forEach(({ stream }) => {
      stream.on('data', (item) => {
        const worker = this.workers[workerIndex];
        worker.write(item);
        workerIndex = (workerIndex + 1) % this.numWorkers;
      });

      stream.on('end', () => {
        activeSources--;
        if (activeSources === 0) {
          this.workers.forEach(w => w.end());
        }
      });
    });

    let endedWorkers = 0;
    this.workers.forEach(worker => {
      worker.on('finish', () => {
        endedWorkers++;
        if (endedWorkers === this.numWorkers) {
          this.fanIn.end();
        }
      });
    });

    return this.fanIn;
  }

  getStatistics() {
    return this.workers.map(w => w.getStatistics());
  }
}

// Test
async function test() {
  console.log('=== Multi-Source Data Aggregator ===\n');

  const aggregator = new DataAggregator(3);

  const users = Readable.from(Array.from({ length: 100 }, (_, i) => ({
    type: 'user', id: i + 1, name: `User ${i + 1}`
  })));

  const transactions = Readable.from(Array.from({ length: 200 }, (_, i) => ({
    type: 'transaction', id: i + 1, amount: Math.random() * 1000
  })));

  aggregator.addSource(users, 'Users', 'high');
  aggregator.addSource(transactions, 'Transactions', 'medium');

  const output = await aggregator.process();

  let count = 0;
  output.on('data', () => count++);
  await new Promise(resolve => output.on('end', resolve));

  console.log(`\nProcessed ${count} items`);
  console.log('\nWorker statistics:');
  aggregator.getStatistics().forEach(stats => {
    console.log(`  Worker ${stats.workerId}: ${stats.processed} items`);
  });

  console.log('\n✓ Aggregation complete');
}

test();
