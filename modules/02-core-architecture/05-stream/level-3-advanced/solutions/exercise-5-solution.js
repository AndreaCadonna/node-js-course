/**
 * Solution: Exercise 5 - Production ETL Pipeline
 * ===============================================
 * Complete production-grade ETL implementation
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { EventEmitter } = require('events');

class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      recordsProcessed: 0,
      recordsFailed: 0,
      recordsValidated: 0,
      errors: 0,
      startTime: Date.now()
    };
    this.interval = setInterval(() => this.report(), 5000);
  }

  increment(metric, value = 1) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
  }

  report() {
    const elapsed = (Date.now() - this.metrics.startTime) / 1000;
    const throughput = (this.metrics.recordsProcessed / elapsed).toFixed(2);

    console.log('\n📊 Metrics:');
    console.log(`  Processed: ${this.metrics.recordsProcessed}`);
    console.log(`  Failed: ${this.metrics.recordsFailed}`);
    console.log(`  Throughput: ${throughput} records/sec`);
    this.emit('metrics', this.metrics);
  }

  stop() {
    clearInterval(this.interval);
    this.report();
  }
}

class LogParser extends Transform {
  constructor(metrics, options) {
    super({ objectMode: true, ...options });
    this.metrics = metrics;
  }

  _transform(line, encoding, callback) {
    try {
      const parts = line.toString().split('|');
      if (parts.length === 4) {
        callback(null, {
          timestamp: new Date(parts[0].trim()),
          level: parts[1].trim(),
          source: parts[2].trim(),
          message: parts[3].trim()
        });
      } else {
        this.metrics.increment('errors');
        callback();
      }
    } catch (err) {
      this.metrics.increment('errors');
      callback();
    }
  }
}

class Validator extends Transform {
  constructor(metrics, options) {
    super({ objectMode: true, ...options });
    this.metrics = metrics;
  }

  _transform(record, encoding, callback) {
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    if (!validLevels.includes(record.level) || !record.message) {
      this.metrics.increment('recordsFailed');
      callback();
    } else {
      this.metrics.increment('recordsValidated');
      callback(null, record);
    }
  }
}

class BatchWriter extends Writable {
  constructor(metrics, batchSize, options) {
    super({ objectMode: true, ...options });
    this.metrics = metrics;
    this.batchSize = batchSize;
    this.buffer = [];
  }

  _write(record, encoding, callback) {
    this.buffer.push(record);
    if (this.buffer.length >= this.batchSize) {
      this.flush(callback);
    } else {
      callback();
    }
  }

  async flush(callback) {
    if (this.buffer.length === 0) {
      if (callback) callback();
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    this.metrics.increment('recordsProcessed', this.buffer.length);
    this.buffer = [];
    if (callback) callback();
  }

  _final(callback) {
    this.flush(callback);
  }
}

class ETLPipeline {
  constructor() {
    this.metrics = new MetricsCollector();
  }

  async run() {
    console.log('=== Production ETL Pipeline ===\n');

    const testLogs = this.generateTestLogs(10000);
    const source = Readable.from(testLogs);
    const parser = new LogParser(this.metrics);
    const validator = new Validator(this.metrics);
    const destination = new BatchWriter(this.metrics, 100);

    return new Promise((resolve, reject) => {
      pipeline(source, parser, validator, destination, (err) => {
        this.metrics.stop();
        if (err) reject(err);
        else {
          console.log('\n✅ Pipeline completed');
          resolve();
        }
      });
    });
  }

  generateTestLogs(count) {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const sources = ['api-server', 'database', 'auth-service'];
    const messages = ['Request processed', 'Query executed', 'Auth completed'];

    return Array.from({ length: count }, (_, i) => {
      const ts = new Date().toISOString();
      const level = levels[Math.floor(Math.random() * levels.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      return `${ts}|${level}|${source}|${message}`;
    });
  }

  shutdown() {
    console.log('\n🛑 Shutting down...');
    this.metrics.stop();
  }
}

async function main() {
  const pipeline = new ETLPipeline();

  process.on('SIGINT', () => {
    pipeline.shutdown();
    process.exit(0);
  });

  try {
    await pipeline.run();
  } catch (err) {
    console.error('Pipeline failed:', err);
    process.exit(1);
  }
}

main();
