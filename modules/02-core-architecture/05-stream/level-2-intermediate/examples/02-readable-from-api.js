/**
 * 02-readable-from-api.js
 * ========================
 * Demonstrates streaming data from a REST API with pagination
 *
 * Key Concepts:
 * - Fetching paginated API data
 * - Async _read() implementation
 * - Rate limiting
 * - Error handling
 * - Object mode streams
 *
 * Run: node 02-readable-from-api.js
 */

const { Readable } = require('stream');
const https = require('https');

console.log('=== API Streaming Examples ===\n');

// =============================================================================
// Example 1: Basic Paginated API Stream
// =============================================================================

class PaginatedAPIStream extends Readable {
  constructor(baseUrl, options) {
    super({ objectMode: true, ...options });
    this.baseUrl = baseUrl;
    this.page = 1;
    this.pageSize = 10;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      console.log(`  Fetching page ${this.page}...`);
      const data = await this.fetchPage(this.page);

      if (data.items.length === 0) {
        // No more data
        console.log('  No more pages available');
        this.push(null);
        this.done = true;
        return;
      }

      // Push each item
      for (const item of data.items) {
        if (!this.push(item)) {
          // Backpressure - wait for next _read() call
          break;
        }
      }

      this.page++;
    } catch (err) {
      this.destroy(err);
    }
  }

  async fetchPage(page) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = [];
        const maxPages = 5;

        if (page <= maxPages) {
          for (let i = 0; i < this.pageSize; i++) {
            const id = (page - 1) * this.pageSize + i + 1;
            items.push({
              id,
              title: `Item ${id}`,
              page
            });
          }
        }

        resolve({ items, page, totalPages: maxPages });
      }, 100);
    });
  }
}

console.log('--- Example 1: Basic Paginated API ---\n');

const apiStream = new PaginatedAPIStream('https://api.example.com/items');

let itemCount = 0;

apiStream.on('data', (item) => {
  itemCount++;
  if (itemCount <= 5 || itemCount % 10 === 0) {
    console.log(`  Item #${item.id}: ${item.title}`);
  }
});

apiStream.on('end', () => {
  console.log(`\n✓ Streamed ${itemCount} items from API\n`);
  example2();
});

apiStream.on('error', (err) => {
  console.error('API Stream Error:', err.message);
});

// =============================================================================
// Example 2: Rate-Limited API Stream
// =============================================================================

class RateLimitedAPIStream extends Readable {
  constructor(baseUrl, requestsPerSecond, options) {
    super({ objectMode: true, ...options });
    this.baseUrl = baseUrl;
    this.requestsPerSecond = requestsPerSecond;
    this.minInterval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
    this.page = 1;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      // Rate limiting
      await this.rateLimit();

      const data = await this.fetchPage(this.page);

      if (data.items.length === 0) {
        this.push(null);
        this.done = true;
        return;
      }

      for (const item of data.items) {
        if (!this.push(item)) break;
      }

      this.page++;
    } catch (err) {
      this.destroy(err);
    }
  }

  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      const delay = this.minInterval - timeSinceLastRequest;
      console.log(`  [Rate limit: waiting ${delay}ms]`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequest = Date.now();
  }

  async fetchPage(page) {
    const timestamp = Date.now();
    console.log(`  [${timestamp}] Fetching page ${page}`);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = [];
        const maxPages = 3;

        if (page <= maxPages) {
          for (let i = 0; i < 5; i++) {
            items.push({
              id: (page - 1) * 5 + i + 1,
              title: `Item ${(page - 1) * 5 + i + 1}`
            });
          }
        }

        resolve({ items, page });
      }, 50);
    });
  }
}

function example2() {
  console.log('--- Example 2: Rate-Limited API Stream ---\n');
  console.log('Rate limit: 2 requests per second\n');

  const rateLimited = new RateLimitedAPIStream(
    'https://api.example.com/items',
    2 // 2 requests per second
  );

  let count = 0;

  rateLimited.on('data', (item) => {
    count++;
  });

  rateLimited.on('end', () => {
    console.log(`\n✓ Fetched ${count} items with rate limiting\n`);
    example3();
  });
}

// =============================================================================
// Example 3: API Stream with Retry Logic
// =============================================================================

class ResilientAPIStream extends Readable {
  constructor(baseUrl, options) {
    super({ objectMode: true, ...options });
    this.baseUrl = baseUrl;
    this.page = 1;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      const data = await this.fetchWithRetry(this.page);

      if (data.items.length === 0) {
        this.push(null);
        this.done = true;
        return;
      }

      for (const item of data.items) {
        if (!this.push(item)) break;
      }

      this.page++;
    } catch (err) {
      console.error(`Failed after ${this.maxRetries} retries:`, err.message);
      this.destroy(err);
    }
  }

  async fetchWithRetry(page, attempt = 0) {
    try {
      return await this.fetchPage(page);
    } catch (err) {
      if (attempt >= this.maxRetries) {
        throw err;
      }

      const delay = this.retryDelay * Math.pow(2, attempt);
      console.log(`  Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));

      return this.fetchWithRetry(page, attempt + 1);
    }
  }

  async fetchPage(page) {
    // Simulate API call that might fail
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 30% chance of failure for demonstration
        if (Math.random() < 0.3) {
          reject(new Error('API request failed'));
          return;
        }

        const items = [];
        const maxPages = 3;

        if (page <= maxPages) {
          for (let i = 0; i < 5; i++) {
            items.push({
              id: (page - 1) * 5 + i + 1,
              title: `Item ${(page - 1) * 5 + i + 1}`
            });
          }
        }

        resolve({ items });
      }, 100);
    });
  }
}

function example3() {
  console.log('--- Example 3: API Stream with Retry Logic ---\n');

  const resilient = new ResilientAPIStream('https://api.example.com/items');

  let count = 0;

  resilient.on('data', (item) => {
    count++;
  });

  resilient.on('end', () => {
    console.log(`\n✓ Successfully fetched ${count} items with retries\n`);
    example4();
  });

  resilient.on('error', (err) => {
    console.error('Stream failed:', err.message);
    example4();
  });
}

// =============================================================================
// Example 4: Real GitHub API Example
// =============================================================================

class GitHubRepoStream extends Readable {
  constructor(username, options) {
    super({ objectMode: true, ...options });
    this.username = username;
    this.page = 1;
    this.perPage = 30;
    this.done = false;
  }

  async _read() {
    if (this.done) return;

    try {
      const repos = await this.fetchRepos(this.page);

      if (repos.length === 0) {
        this.push(null);
        this.done = true;
        return;
      }

      for (const repo of repos) {
        const simplified = {
          name: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          url: repo.html_url
        };

        if (!this.push(simplified)) break;
      }

      this.page++;
    } catch (err) {
      this.destroy(err);
    }
  }

  fetchRepos(page) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/users/${this.username}/repos?page=${page}&per_page=${this.perPage}`,
        headers: {
          'User-Agent': 'Node.js Stream Example'
        }
      };

      https.get(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const repos = JSON.parse(data);
              resolve(repos);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`API returned ${res.statusCode}`));
          }
        });
      }).on('error', reject);
    });
  }
}

function example4() {
  console.log('--- Example 4: GitHub API Stream ---\n');
  console.log('Note: This makes real API calls. Uncomment to test.\n');

  // Uncomment to test with real GitHub API:
  /*
  const github = new GitHubRepoStream('nodejs');

  let count = 0;

  github.on('data', (repo) => {
    count++;
    if (count <= 5) {
      console.log(`  ${count}. ${repo.name} - ⭐ ${repo.stars}`);
      console.log(`     ${repo.description || 'No description'}`);
    }
  });

  github.on('end', () => {
    console.log(`\n✓ Fetched ${count} repositories\n`);
    showSummary();
  });

  github.on('error', (err) => {
    console.error('GitHub API Error:', err.message);
    showSummary();
  });
  */

  // Skip to summary
  showSummary();
}

// =============================================================================
// Summary
// =============================================================================

function showSummary() {
  console.log('\n=== Summary ===\n');
  console.log('Key Patterns:');
  console.log('1. Use async _read() for API calls');
  console.log('2. Implement pagination to stream all results');
  console.log('3. Add rate limiting to respect API limits');
  console.log('4. Implement retry logic for resilience');
  console.log('5. Use object mode for structured API responses');
  console.log('6. Handle backpressure with push() return value');
  console.log('7. Always destroy() stream on fatal errors');
  console.log('\nBest Practices:');
  console.log('• Set appropriate User-Agent headers');
  console.log('• Respect rate limits');
  console.log('• Implement exponential backoff for retries');
  console.log('• Use environment variables for API keys');
  console.log('• Log API requests for debugging');
  console.log('\n✓ All API streaming examples completed!\n');
}

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Authentication:
 *    - Store API keys in environment variables
 *    - Use OAuth tokens when available
 *    - Refresh tokens before expiry
 *
 * 2. Rate Limiting:
 *    - Check API rate limit headers
 *    - Implement token bucket algorithm
 *    - Queue requests when limit reached
 *
 * 3. Error Handling:
 *    - Retry on 5xx errors
 *    - Don't retry on 4xx errors (except 429)
 *    - Implement circuit breaker pattern
 *
 * 4. Monitoring:
 *    - Log all API requests
 *    - Track success/failure rates
 *    - Monitor response times
 *
 * 5. Testing:
 *    - Mock API responses for unit tests
 *    - Test retry logic
 *    - Test rate limiting behavior
 */
