/**
 * Exercise 2: Resilient API Stream Client
 * ========================================
 *
 * Difficulty: Hard
 *
 * Task:
 * Build a resilient streaming API client that fetches data from a paginated API
 * with comprehensive error handling, retry logic, circuit breaker pattern, and
 * rate limiting. The client must be production-ready and handle various failure scenarios.
 *
 * Requirements:
 * 1. Create APIStreamClient class that extends Readable
 * 2. Fetch paginated data from API (simulated)
 * 3. Implement retry logic with exponential backoff (max 3 retries)
 * 4. Implement circuit breaker (threshold: 5 failures, timeout: 60s)
 * 5. Implement rate limiting (max 10 requests/second)
 * 6. Handle network errors gracefully
 * 7. Track and report metrics (requests, failures, retries)
 * 8. Implement graceful shutdown
 *
 * Failure Scenarios to Handle:
 * - Network timeouts
 * - Rate limit exceeded (429)
 * - Server errors (500)
 * - Invalid responses
 * - Connection failures
 *
 * Metrics to Track:
 * - Total requests made
 * - Successful requests
 * - Failed requests
 * - Retries attempted
 * - Circuit breaker state changes
 * - Average response time
 *
 * Run: node exercise-2.js
 */

const { Readable, Writable, pipeline } = require('stream');

// Simulated API (with controlled failures)
class MockAPI {
  constructor(failureRate = 0.1) {
    this.failureRate = failureRate;
    this.requestCount = 0;
    this.totalPages = 10;
    this.itemsPerPage = 100;
  }

  async fetchPage(page) {
    this.requestCount++;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate random failures
    if (Math.random() < this.failureRate) {
      const errorTypes = [
        { code: 'ETIMEDOUT', message: 'Request timeout' },
        { code: 429, message: 'Rate limit exceeded' },
        { code: 500, message: 'Internal server error' },
        { code: 'ECONNREFUSED', message: 'Connection refused' }
      ];

      const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const err = new Error(error.message);
      err.code = error.code;
      throw err;
    }

    // Return page data
    if (page > this.totalPages) {
      return { items: [], hasMore: false };
    }

    const items = Array.from({ length: this.itemsPerPage }, (_, i) => ({
      id: (page - 1) * this.itemsPerPage + i + 1,
      data: `Item ${(page - 1) * this.itemsPerPage + i + 1}`
    }));

    return {
      items,
      page,
      hasMore: page < this.totalPages
    };
  }
}

// TODO: Implement APIStreamClient class
class APIStreamClient extends Readable {
  constructor(api, options = {}) {
    super({ objectMode: true, ...options });

    this.api = api;

    // Retry configuration
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    // Circuit breaker configuration
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 60000;

    // Rate limiting
    this.rateLimit = options.rateLimit || 10; // requests per second

    // TODO: Initialize instance variables
    // - Current page
    // - Circuit breaker state
    // - Rate limiter state
    // - Metrics
  }

  async _read() {
    // TODO: Implement data fetching with resilience
    // 1. Check circuit breaker state
    // 2. Apply rate limiting
    // 3. Fetch page with retry logic
    // 4. Handle errors appropriately
    // 5. Update metrics
    // 6. Push items or end stream
  }

  async fetchPageWithRetry(page) {
    // TODO: Implement retry logic with exponential backoff
    // Track retry attempts in metrics
  }

  checkCircuitBreaker() {
    // TODO: Implement circuit breaker check
    // States: CLOSED, OPEN, HALF_OPEN
  }

  updateCircuitBreaker(success) {
    // TODO: Update circuit breaker state based on success/failure
  }

  async applyRateLimit() {
    // TODO: Implement rate limiting using token bucket
  }

  updateMetrics(success, retries = 0, duration = 0) {
    // TODO: Update request metrics
  }

  getMetrics() {
    // TODO: Return current metrics
  }

  _destroy(error, callback) {
    // TODO: Cleanup and report final metrics
    callback(error);
  }
}

// =============================================================================
// Test Cases
// =============================================================================

async function test1() {
  console.log('Test 1: Normal Operation (Low Failure Rate)\n');

  // TODO: Create API client with 5% failure rate
  // TODO: Process all data
  // TODO: Display metrics
  // TODO: Verify all data received

  console.log('\n✓ Test 1 complete\n');
  test2();
}

async function test2() {
  console.log('Test 2: High Failure Rate with Retries\n');

  // TODO: Create API client with 30% failure rate
  // TODO: Enable detailed logging
  // TODO: Process data
  // TODO: Verify retries occurred
  // TODO: Display retry statistics

  console.log('\n✓ Test 2 complete\n');
  test3();
}

async function test3() {
  console.log('Test 3: Circuit Breaker Activation\n');

  // TODO: Create API client with 60% failure rate
  // TODO: Process data until circuit breaker opens
  // TODO: Verify circuit breaker opened
  // TODO: Verify circuit breaker recovered

  console.log('\n✓ Test 3 complete\n');
  test4();
}

async function test4() {
  console.log('Test 4: Rate Limiting\n');

  // TODO: Create API client with strict rate limit (5 req/sec)
  // TODO: Monitor request timing
  // TODO: Verify rate limit is respected

  console.log('\n✓ Test 4 complete\n');
  showSummary();
}

function showSummary() {
  console.log('=== Exercise 2 Summary ===\n');
  console.log('TODO: Implement the following:');
  console.log('1. Retry logic with exponential backoff');
  console.log('2. Circuit breaker pattern (CLOSED/OPEN/HALF_OPEN)');
  console.log('3. Rate limiting with token bucket');
  console.log('4. Comprehensive error handling');
  console.log('5. Metrics tracking and reporting');
  console.log('6. Graceful degradation');
  console.log('\nResilience Patterns:');
  console.log('- Retry: 3 attempts with exponential backoff');
  console.log('- Circuit Breaker: Open after 5 failures');
  console.log('- Rate Limit: 10 requests/second');
  console.log('\nHints:');
  console.log('- Use async/await in _read()');
  console.log('- Track timestamp for rate limiting');
  console.log('- Use setTimeout for retry delays');
  console.log('- Emit events for monitoring');
  console.log('- Handle all error types appropriately');
}

// Start tests
test1();

// =============================================================================
// Expected Output Format:
// =============================================================================

/**
 * Test 1: Normal Operation
 *
 * Processing data from API...
 *
 * Metrics:
 *   Total requests: 10
 *   Successful: 9
 *   Failed: 1
 *   Retries: 1
 *   Circuit breaker state: CLOSED
 *   Items received: 1000
 *   Avg response time: 52ms
 *
 * ✓ Test 1 complete
 *
 * Test 3: Circuit Breaker Activation
 *
 * Processing with high failure rate...
 *
 *   ❌ Request failed: 500
 *   ❌ Request failed: timeout
 *   ❌ Request failed: 500
 *   ❌ Request failed: timeout
 *   ❌ Request failed: 500
 *   🔴 Circuit breaker OPEN
 *   🟡 Circuit breaker HALF_OPEN (testing recovery)
 *   🟢 Circuit breaker CLOSED (recovered)
 *
 * Metrics:
 *   Circuit breaker activations: 1
 *   Recovery time: 62.5s
 *
 * ✓ Test 3 complete
 */
