/**
 * Solution: Exercise 2 - Resilient API Stream Client
 * ====================================================
 * See exercise-1-solution.js for detailed implementation patterns.
 * This solution demonstrates retry, circuit breaker, and rate limiting.
 */

const { Readable } = require('stream');

class MockAPI {
  constructor(failureRate = 0.1) {
    this.failureRate = failureRate;
    this.requestCount = 0;
    this.totalPages = 10;
    this.itemsPerPage = 100;
  }

  async fetchPage(page) {
    this.requestCount++;
    await new Promise(resolve => setTimeout(resolve, 50));

    if (Math.random() < this.failureRate) {
      const errors = [
        { code: 'ETIMEDOUT', message: 'Request timeout' },
        { code: 429, message: 'Rate limit exceeded' },
        { code: 500, message: 'Internal server error' }
      ];
      const error = errors[Math.floor(Math.random() * errors.length)];
      const err = new Error(error.message);
      err.code = error.code;
      throw err;
    }

    if (page > this.totalPages) {
      return { items: [], hasMore: false };
    }

    const items = Array.from({ length: this.itemsPerPage }, (_, i) => ({
      id: (page - 1) * this.itemsPerPage + i + 1,
      data: `Item ${(page - 1) * this.itemsPerPage + i + 1}`
    }));

    return { items, page, hasMore: page < this.totalPages };
  }
}

class APIStreamClient extends Readable {
  constructor(api, options = {}) {
    super({ objectMode: true, ...options });
    this.api = api;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 5;
    this.circuitBreakerTimeout = options.circuitBreakerTimeout || 60000;
    this.rateLimit = options.rateLimit || 10;
    this.currentPage = 1;
    this.circuitBreakerState = 'CLOSED';
    this.circuitBreakerFailures = 0;
    this.circuitBreakerNextAttempt = Date.now();
    this.tokens = this.rateLimit;
    this.lastRefill = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriesAttempted: 0,
      circuitBreakerActivations: 0,
      totalDuration: 0
    };
  }

  async _read() {
    try {
      if (!this.checkCircuitBreaker()) {
        console.log('  🔴 Circuit breaker OPEN');
        this.push(null);
        return;
      }

      await this.applyRateLimit();
      const result = await this.fetchPageWithRetry(this.currentPage);

      if (!result || result.items.length === 0) {
        this.push(null);
        return;
      }

      for (const item of result.items) {
        this.push(item);
      }

      this.currentPage++;
      if (!result.hasMore) this.push(null);
    } catch (err) {
      this.destroy(err);
    }
  }

  async fetchPageWithRetry(page) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        const result = await this.api.fetchPage(page);
        this.metrics.successfulRequests++;
        this.metrics.totalDuration += Date.now() - startTime;
        this.updateCircuitBreaker(true);
        return result;
      } catch (err) {
        lastError = err;
        this.metrics.failedRequests++;
        this.updateCircuitBreaker(false);
        if (attempt < this.maxRetries) {
          this.metrics.retriesAttempted++;
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }

  checkCircuitBreaker() {
    if (this.circuitBreakerState === 'OPEN') {
      if (Date.now() < this.circuitBreakerNextAttempt) {
        return false;
      }
      this.circuitBreakerState = 'HALF_OPEN';
      return true;
    }
    return true;
  }

  updateCircuitBreaker(success) {
    if (success) {
      if (this.circuitBreakerState === 'HALF_OPEN') {
        this.circuitBreakerState = 'CLOSED';
        this.circuitBreakerFailures = 0;
      }
    } else {
      this.circuitBreakerFailures++;
      if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
        this.circuitBreakerState = 'OPEN';
        this.circuitBreakerNextAttempt = Date.now() + this.circuitBreakerTimeout;
        this.metrics.circuitBreakerActivations++;
      }
    }
  }

  async applyRateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.rateLimit;
    this.tokens = Math.min(this.rateLimit, this.tokens + tokensToAdd);
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.rateLimit) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens = 0;
    } else {
      this.tokens -= 1;
    }
  }

  _destroy(error, callback) {
    if (!error) {
      console.log('\n📊 Metrics:', this.metrics);
    }
    callback(error);
  }
}

// Run simple test
async function test() {
  const api = new MockAPI(0.1);
  const client = new APIStreamClient(api);
  let count = 0;
  client.on('data', () => count++);
  await new Promise(resolve => client.on('end', resolve));
  console.log(`✓ Processed ${count} items`);
}

test();
