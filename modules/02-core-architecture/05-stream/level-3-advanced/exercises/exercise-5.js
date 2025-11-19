/**
 * Exercise 5: Production ETL Pipeline
 * ====================================
 *
 * Difficulty: Expert
 *
 * Task:
 * Build a complete production-grade ETL (Extract, Transform, Load) pipeline that
 * processes data from multiple sources, applies complex transformations, handles
 * errors gracefully, and loads results into a destination. This exercise combines
 * ALL concepts from the advanced level.
 *
 * Requirements:
 *
 * EXTRACTION:
 * 1. Support multiple input sources (CSV files, JSON streams, API endpoints)
 * 2. Handle different data formats
 * 3. Implement source connection pooling
 *
 * TRANSFORMATION:
 * 4. Parse and validate all input data
 * 5. Apply business rules and transformations
 * 6. Enrich data from external sources
 * 7. Deduplicate records
 * 8. Aggregate statistics
 *
 * LOADING:
 * 9. Batch writes for efficiency
 * 10. Handle write failures with retry
 * 11. Implement idempotent writes
 *
 * RESILIENCE:
 * 12. Retry logic with exponential backoff
 * 13. Circuit breaker for external services
 * 14. Dead letter queue for failed records
 * 15. Graceful degradation
 *
 * SECURITY:
 * 16. Input validation and sanitization
 * 17. Rate limiting
 * 18. Size limits
 * 19. PII redaction in logs
 *
 * PERFORMANCE:
 * 20. Parallel processing with worker pool
 * 21. Performance monitoring
 * 22. Backpressure handling
 * 23. Memory efficiency
 *
 * MONITORING:
 * 24. Real-time metrics
 * 25. Error tracking
 * 26. Progress reporting
 * 27. Final statistics
 *
 * OPERATIONAL:
 * 28. Graceful shutdown on SIGINT
 * 29. Checkpoint/resume capability
 * 30. Comprehensive logging
 *
 * Run: node exercise-5.js
 */

const { Transform, Readable, Writable, pipeline } = require('stream');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  // Sources
  sources: {
    csv: './data/users.csv',
    json: './data/transactions.json',
    api: 'https://api.example.com/data'
  },

  // Performance
  batchSize: 100,
  workerCount: 4,
  highWaterMark: 64 * 1024,

  // Security
  maxRecordSize: 1024 * 1024,
  rateLimit: 100,
  allowedFields: ['id', 'name', 'email', 'amount', 'date'],

  // Resilience
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000,

  // Monitoring
  metricsInterval: 5000,
  checkpointInterval: 10000,

  // Output
  destination: './output/results.jsonl',
  deadLetterQueue: './output/failed.jsonl'
};

// =============================================================================
// TODO: Implement Pipeline Components
// =============================================================================

// TODO: 1. Metrics Collector
class MetricsCollector extends EventEmitter {
  constructor() {
    super();
    // TODO: Initialize metrics
    // - Records processed
    // - Records failed
    // - Throughput
    // - Error rates
    // - Memory usage
  }

  // TODO: Implement metric tracking methods
  increment(metric, value = 1) {
  }

  record(metric, value) {
  }

  report() {
    // TODO: Emit metrics report
  }

  stop() {
    // TODO: Final report and cleanup
  }
}

// TODO: 2. CSV Parser
class CSVParser extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize parser state
  }

  _transform(line, encoding, callback) {
    // TODO: Parse CSV line
    // - Handle headers
    // - Parse data rows
    // - Handle quoted fields
    // - Emit structured objects
    callback();
  }
}

// TODO: 3. JSON Parser
class JSONParser extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize parser state
  }

  _transform(chunk, encoding, callback) {
    // TODO: Parse JSON
    // - Handle streaming JSON
    // - Support arrays and objects
    // - Handle partial chunks
    callback();
  }
}

// TODO: 4. Validator
class DataValidator extends Transform {
  constructor(schema, metrics, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize validator
  }

  _transform(record, encoding, callback) {
    // TODO: Validate record
    // - Check required fields
    // - Validate data types
    // - Check constraints
    // - Sanitize input
    // - Emit valid records only
    callback();
  }
}

// TODO: 5. Enricher
class DataEnricher extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize enricher
  }

  async _transform(record, encoding, callback) {
    // TODO: Enrich data
    // - Lookup additional data
    // - Calculate derived fields
    // - Add metadata
    callback();
  }
}

// TODO: 6. Deduplicator
class Deduplicator extends Transform {
  constructor(keyField, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize deduplicator
    // - Track seen keys
    // - Handle memory efficiently
  }

  _transform(record, encoding, callback) {
    // TODO: Check for duplicates
    // - Emit only unique records
    // - Track duplicate count
    callback();
  }
}

// TODO: 7. Aggregator
class DataAggregator extends Transform {
  constructor(options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize aggregator
  }

  _transform(record, encoding, callback) {
    // TODO: Aggregate statistics
    // - Group by categories
    // - Calculate sums, averages
    // - Emit aggregated data
    callback();
  }
}

// TODO: 8. Retry Handler
class RetryHandler extends Transform {
  constructor(maxRetries, metrics, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize retry handler
  }

  async _transform(record, encoding, callback) {
    // TODO: Process with retry
    // - Attempt processing
    // - Retry on failure
    // - Track retry attempts
    callback();
  }
}

// TODO: 9. Circuit Breaker
class CircuitBreaker extends Transform {
  constructor(config, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize circuit breaker
  }

  async _transform(record, encoding, callback) {
    // TODO: Implement circuit breaker
    // - Check state (CLOSED/OPEN/HALF_OPEN)
    // - Process or fail fast
    // - Update state based on results
    callback();
  }
}

// TODO: 10. Dead Letter Queue
class DeadLetterQueue extends Transform {
  constructor(filePath, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize DLQ
  }

  async _transform(record, encoding, callback) {
    // TODO: Handle failed records
    // - Write to dead letter file
    // - Log failure details
    // - Continue processing
    callback();
  }
}

// TODO: 11. Rate Limiter
class RateLimiter extends Transform {
  constructor(rateLimit, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize rate limiter
  }

  async _transform(record, encoding, callback) {
    // TODO: Enforce rate limit
    // - Token bucket algorithm
    // - Delay if needed
    callback();
  }
}

// TODO: 12. Batch Writer
class BatchWriter extends Writable {
  constructor(destination, batchSize, options) {
    super({ objectMode: true, ...options });
    // TODO: Initialize batch writer
  }

  _write(record, encoding, callback) {
    // TODO: Add to batch
    // - Accumulate records
    // - Flush when batch is full
    callback();
  }

  async flush() {
    // TODO: Write batch to destination
    // - Write all records
    // - Handle write errors
    // - Clear batch
  }

  _final(callback) {
    // TODO: Flush remaining records
    callback();
  }
}

// TODO: 13. Checkpoint Manager
class CheckpointManager {
  constructor(filePath) {
    this.filePath = filePath;
    // TODO: Initialize checkpoint manager
  }

  save(state) {
    // TODO: Save checkpoint
  }

  load() {
    // TODO: Load checkpoint
  }
}

// TODO: 14. Main ETL Pipeline
class ETLPipeline {
  constructor(config) {
    this.config = config;
    // TODO: Initialize pipeline
  }

  async run() {
    // TODO: Build and run pipeline
    // 1. Create metrics collector
    // 2. Create source streams
    // 3. Create transformation pipeline
    // 4. Create destination
    // 5. Connect everything
    // 6. Handle errors and shutdown
  }

  createSourceStream(type, path) {
    // TODO: Create appropriate source stream
  }

  shutdown() {
    // TODO: Graceful shutdown
    // - Stop accepting new data
    // - Flush pending data
    // - Save checkpoint
    // - Close resources
    // - Report final metrics
  }
}

// =============================================================================
// Test Data Generation
// =============================================================================

function generateTestData() {
  // TODO: Generate test CSV file
  // TODO: Generate test JSON file
  // TODO: Create output directories
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('=== Production ETL Pipeline ===\n');

  // Generate test data
  generateTestData();

  // Create pipeline
  const pipeline = new ETLPipeline(CONFIG);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    await pipeline.shutdown();
    process.exit(0);
  });

  // Run pipeline
  try {
    await pipeline.run();
    console.log('\n✅ ETL Pipeline completed successfully!');
  } catch (err) {
    console.error('\n❌ ETL Pipeline failed:', err.message);
    process.exit(1);
  }
}

main();

// =============================================================================
// Expected Output Format:
// =============================================================================

/**
 * === Production ETL Pipeline ===
 *
 * Initializing...
 *   ✓ Metrics collector
 *   ✓ Source: CSV (users.csv)
 *   ✓ Source: JSON (transactions.json)
 *   ✓ Validator
 *   ✓ Enricher
 *   ✓ Deduplicator
 *   ✓ Aggregator
 *   ✓ Rate limiter
 *   ✓ Batch writer
 *   ✓ Dead letter queue
 *
 * Processing...
 *
 * [00:05] Metrics:
 *   Records processed: 5,234
 *   Records failed: 12
 *   Duplicates removed: 45
 *   Throughput: 1,046 records/sec
 *   Memory: 78.2 MB
 *
 * [00:10] Metrics:
 *   Records processed: 10,890
 *   Records failed: 18
 *   Duplicates removed: 92
 *   Throughput: 1,089 records/sec
 *   Memory: 81.5 MB
 *
 * Completed!
 *
 * === Final Statistics ===
 *   Duration: 15.5s
 *   Total records: 15,000
 *   Successfully processed: 14,850
 *   Failed (in DLQ): 150
 *   Duplicates removed: 120
 *   Average throughput: 967 records/sec
 *   Peak memory: 85.2 MB
 *
 *   By source:
 *     CSV: 8,000
 *     JSON: 7,000
 *
 *   Error breakdown:
 *     Validation errors: 100
 *     Processing errors: 35
 *     Write errors: 15
 *
 * ✅ Output written to: ./output/results.jsonl
 * ✅ Failed records in: ./output/failed.jsonl
 */

// =============================================================================
// Implementation Checklist:
// =============================================================================

/**
 * [ ] Metrics collection and reporting
 * [ ] CSV parsing
 * [ ] JSON parsing
 * [ ] Data validation with schema
 * [ ] Data enrichment
 * [ ] Deduplication
 * [ ] Aggregation
 * [ ] Retry logic
 * [ ] Circuit breaker
 * [ ] Dead letter queue
 * [ ] Rate limiting
 * [ ] Batch writing
 * [ ] Checkpoint/resume
 * [ ] Graceful shutdown
 * [ ] Error handling
 * [ ] Performance monitoring
 * [ ] Memory efficiency
 * [ ] Security (validation, sanitization)
 * [ ] Comprehensive logging
 * [ ] Final statistics
 */
