# Testing Strategies Guide

## Overview

Comprehensive testing strategies for query string handling, from unit tests to integration and property-based testing.

## Table of Contents

1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [Property-Based Testing](#property-based-testing)
4. [Fuzz Testing](#fuzz-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

## Unit Testing

### Basic Test Structure

```javascript
const assert = require('assert');
const querystring = require('querystring');

describe('Query String Parsing', () => {
  describe('parse()', () => {
    it('should parse simple query strings', () => {
      const result = querystring.parse('a=1&b=2');

      assert.deepStrictEqual(result, {
        a: '1',
        b: '2'
      });
    });

    it('should handle URL-encoded values', () => {
      const result = querystring.parse('name=John%20Doe&email=test%40example.com');

      assert.strictEqual(result.name, 'John Doe');
      assert.strictEqual(result.email, 'test@example.com');
    });

    it('should handle repeated keys as arrays', () => {
      const result = querystring.parse('tag=js&tag=node&tag=web');

      assert(Array.isArray(result.tag));
      assert.deepStrictEqual(result.tag, ['js', 'node', 'web']);
    });

    it('should handle empty values', () => {
      const result = querystring.parse('key=&other=value');

      assert.strictEqual(result.key, '');
      assert.strictEqual(result.other, 'value');
    });

    it('should handle keys without values', () => {
      const result = querystring.parse('key');

      assert.strictEqual(result.key, '');
    });
  });

  describe('stringify()', () => {
    it('should stringify objects', () => {
      const result = querystring.stringify({
        a: '1',
        b: '2'
      });

      assert.strictEqual(result, 'a=1&b=2');
    });

    it('should handle special characters', () => {
      const result = querystring.stringify({
        name: 'John Doe',
        email: 'test@example.com'
      });

      assert(result.includes('John%20Doe'));
      assert(result.includes('test%40example.com'));
    });

    it('should handle arrays', () => {
      const result = querystring.stringify({
        tags: ['js', 'node', 'web']
      });

      // Arrays become repeated keys
      assert(result.includes('tags=js'));
      assert(result.includes('tags=node'));
      assert(result.includes('tags=web'));
    });
  });
});
```

### Testing Custom Utilities

```javascript
const assert = require('assert');
const { describe, it } = require('mocha');

// Assuming we have a QueryBuilder class
class QueryBuilder {
  constructor() {
    this.params = {};
  }

  add(key, value) {
    this.params[key] = value;
    return this;
  }

  build() {
    return querystring.stringify(this.params);
  }
}

describe('QueryBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  it('should add parameters', () => {
    builder.add('page', 1).add('limit', 20);

    assert.deepStrictEqual(builder.params, {
      page: 1,
      limit: 20
    });
  });

  it('should build query string', () => {
    const result = builder
      .add('page', 1)
      .add('limit', 20)
      .build();

    assert.strictEqual(result, 'page=1&limit=20');
  });

  it('should handle overwriting parameters', () => {
    builder
      .add('page', 1)
      .add('page', 2);

    assert.strictEqual(builder.params.page, 2);
  });

  it('should support method chaining', () => {
    const result = builder
      .add('a', 1)
      .add('b', 2)
      .add('c', 3)
      .build();

    assert.strictEqual(result, 'a=1&b=2&c=3');
  });
});
```

### Test Utilities

```javascript
class QueryTestUtils {
  // Assert query strings are equivalent (ignoring order)
  static assertQueryEqual(actual, expected, message) {
    const actualParsed = querystring.parse(actual);
    const expectedParsed = querystring.parse(expected);

    assert.deepStrictEqual(actualParsed, expectedParsed, message);
  }

  // Assert URLs are equivalent
  static assertUrlEqual(actual, expected) {
    const [actualBase, actualQuery = ''] = actual.split('?');
    const [expectedBase, expectedQuery = ''] = expected.split('?');

    assert.strictEqual(actualBase, expectedBase, 'URL base mismatch');
    this.assertQueryEqual(actualQuery, expectedQuery, 'Query mismatch');
  }

  // Generate test query strings
  static generateTestQuery(size = 10) {
    const params = {};
    for (let i = 0; i < size; i++) {
      params[`key${i}`] = `value${i}`;
    }
    return querystring.stringify(params);
  }

  // Create mock request
  static mockRequest(url, options = {}) {
    const [path, queryStr = ''] = url.split('?');

    return {
      url,
      path,
      query: querystring.parse(queryStr),
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };
  }

  // Create mock response
  static mockResponse() {
    const res = {
      statusCode: 200,
      headers: {},
      body: null,

      status(code) {
        this.statusCode = code;
        return this;
      },

      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      },

      json(data) {
        this.body = data;
        this.headers['Content-Type'] = 'application/json';
        return this;
      },

      send(data) {
        this.body = data;
        return this;
      }
    };

    return res;
  }
}

// Usage in tests
describe('API Endpoint', () => {
  it('should handle query parameters', async () => {
    const req = QueryTestUtils.mockRequest('/api/users?page=2&limit=20');
    const res = QueryTestUtils.mockResponse();

    await handler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert(res.body);
  });
});
```

## Integration Testing

### API Integration Tests

```javascript
const request = require('supertest');
const app = require('../app');

describe('Product API Integration', () => {
  describe('GET /api/products', () => {
    it('should return products with default pagination', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      assert(response.body.data);
      assert(response.body.pagination);
      assert.strictEqual(response.body.pagination.page, 1);
      assert.strictEqual(response.body.pagination.limit, 20);
    });

    it('should respect page and limit parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 10 })
        .expect(200);

      assert.strictEqual(response.body.pagination.page, 2);
      assert.strictEqual(response.body.pagination.limit, 10);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'electronics' })
        .expect(200);

      const products = response.body.data;
      assert(products.every(p => p.category === 'electronics'));
    });

    it('should sort products', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sort: 'price', order: 'asc' })
        .expect(200);

      const products = response.body.data;
      for (let i = 1; i < products.length; i++) {
        assert(products[i].price >= products[i - 1].price);
      }
    });

    it('should handle multiple filters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({
          category: 'electronics',
          minPrice: 100,
          maxPrice: 1000,
          rating: 4
        })
        .expect(200);

      const products = response.body.data;
      assert(products.every(p =>
        p.category === 'electronics' &&
        p.price >= 100 &&
        p.price <= 1000 &&
        p.rating >= 4
      ));
    });

    it('should return 400 for invalid parameters', async () => {
      await request(app)
        .get('/api/products')
        .query({ page: -1 })
        .expect(400);

      await request(app)
        .get('/api/products')
        .query({ limit: 1000 })
        .expect(400);
    });

    it('should include pagination links', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 10 })
        .expect(200);

      const links = response.body.pagination.links;
      assert(links.first);
      assert(links.prev);
      assert(links.current);
      assert(links.next || links.last);
    });
  });
});
```

### End-to-End Testing

```javascript
const puppeteer = require('puppeteer');

describe('E2E: Product Filtering', () => {
  let browser, page;

  before(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  after(async () => {
    await browser.close();
  });

  it('should update URL when filters change', async () => {
    await page.goto('http://localhost:3000/products');

    // Select category filter
    await page.select('#category', 'electronics');

    // Wait for navigation
    await page.waitForNavigation();

    // Check URL
    const url = page.url();
    assert(url.includes('category=electronics'));
  });

  it('should maintain filters on page reload', async () => {
    await page.goto('http://localhost:3000/products?category=electronics&sort=price');

    await page.reload();

    // Check that filters are still applied
    const categoryValue = await page.$eval('#category', el => el.value);
    assert.strictEqual(categoryValue, 'electronics');

    const sortValue = await page.$eval('#sort', el => el.value);
    assert.strictEqual(sortValue, 'price');
  });

  it('should allow sharing filtered URLs', async () => {
    const filterUrl = 'http://localhost:3000/products?category=electronics&minPrice=100&sort=price';

    await page.goto(filterUrl);

    // Verify filters are applied from URL
    const products = await page.$$eval('.product', els =>
      els.map(el => ({
        category: el.dataset.category,
        price: parseFloat(el.dataset.price)
      }))
    );

    assert(products.every(p =>
      p.category === 'electronics' && p.price >= 100
    ));
  });
});
```

## Property-Based Testing

### Roundtrip Properties

```javascript
const fc = require('fast-check');

describe('Property-Based Testing', () => {
  it('parse/stringify roundtrip should be identity for simple objects', () => {
    fc.assert(
      fc.property(
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ maxLength: 100 })
        ),
        (obj) => {
          const stringified = querystring.stringify(obj);
          const parsed = querystring.parse(stringified);

          // Values should match
          for (const key in obj) {
            assert.strictEqual(parsed[key], obj[key]);
          }
        }
      )
    );
  });

  it('escape/unescape should be symmetric', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          const escaped = querystring.escape(str);
          const unescaped = querystring.unescape(escaped);

          assert.strictEqual(unescaped, str);
        }
      )
    );
  });

  it('parse should handle any query string without crashing', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (str) => {
          try {
            querystring.parse(str);
            return true;
          } catch (error) {
            return false;
          }
        }
      )
    );
  });

  it('parsed object should have expected structure', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(
          fc.string({ minLength: 1 }),
          fc.string()
        )),
        (pairs) => {
          const queryStr = pairs
            .map(([k, v]) => `${k}=${v}`)
            .join('&');

          const parsed = querystring.parse(queryStr);

          assert(typeof parsed === 'object');
          assert(!Array.isArray(parsed));
        }
      )
    );
  });
});
```

### Custom Arbitraries

```javascript
// Custom generators for query strings
const queryStringArbitrary = fc.record({
  simple: fc.dictionary(fc.string(), fc.string()),
  withNumbers: fc.dictionary(fc.string(), fc.integer()),
  withArrays: fc.dictionary(fc.string(), fc.array(fc.string())),
  withSpecialChars: fc.dictionary(
    fc.string(),
    fc.string().map(s => s + '&=?#')
  )
});

describe('Custom Property Tests', () => {
  it('should handle various parameter types', () => {
    fc.assert(
      fc.property(queryStringArbitrary, (testCases) => {
        for (const [name, params] of Object.entries(testCases)) {
          const stringified = querystring.stringify(params);
          const parsed = querystring.parse(stringified);

          // Should not throw
          assert(parsed);
        }
      })
    );
  });
});
```

## Fuzz Testing

### Basic Fuzzer

```javascript
class QueryFuzzer {
  static generateFuzzedInput() {
    const strategies = [
      () => '&'.repeat(Math.floor(Math.random() * 1000)),
      () => '='.repeat(Math.floor(Math.random() * 1000)),
      () => '%'.repeat(Math.floor(Math.random() * 100)),
      () => 'a'.repeat(Math.floor(Math.random() * 10000)),
      () => {
        const chars = [];
        for (let i = 0; i < 100; i++) {
          chars.push(String.fromCharCode(Math.floor(Math.random() * 128)));
        }
        return chars.join('');
      },
      () => '&=&=&=&=&=',
      () => 'key&&&===value',
      () => encodeURIComponent('🚀'.repeat(50))
    ];

    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }

  static test(parser, iterations = 1000) {
    const errors = [];

    for (let i = 0; i < iterations; i++) {
      const input = this.generateFuzzedInput();

      try {
        parser(input);
      } catch (error) {
        errors.push({
          input: input.substring(0, 100),
          error: error.message
        });
      }
    }

    return {
      iterations,
      errors: errors.length,
      errorRate: errors.length / iterations,
      samples: errors.slice(0, 10)
    };
  }
}

describe('Fuzz Testing', () => {
  it('should survive random input', () => {
    const result = QueryFuzzer.test(querystring.parse, 10000);

    console.log(`Fuzz test completed:
      Iterations: ${result.iterations}
      Errors: ${result.errors}
      Error rate: ${(result.errorRate * 100).toFixed(2)}%
    `);

    // Parser should handle most inputs gracefully
    assert(result.errorRate < 0.01); // Less than 1% error rate
  });
});
```

## Performance Testing

### Benchmark Tests

```javascript
const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

describe('Performance Tests', () => {
  it('should benchmark parse operations', (done) => {
    const queries = [
      'simple=test',
      'a=1&b=2&c=3&d=4&e=5',
      'long=' + 'x'.repeat(1000),
      'many=' + Array(100).fill('value').join('&many=')
    ];

    for (const query of queries) {
      suite.add(`Parse: ${query.substring(0, 30)}`, () => {
        querystring.parse(query);
      });
    }

    suite
      .on('cycle', (event) => {
        console.log(String(event.target));
      })
      .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        done();
      })
      .run({ async: true });
  });

  it('should measure parse time for various sizes', () => {
    const sizes = [10, 50, 100, 500, 1000];
    const results = [];

    for (const size of sizes) {
      const params = {};
      for (let i = 0; i < size; i++) {
        params[`key${i}`] = `value${i}`;
      }
      const queryStr = querystring.stringify(params);

      const start = process.hrtime.bigint();
      for (let i = 0; i < 1000; i++) {
        querystring.parse(queryStr);
      }
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000; // ms
      results.push({
        size,
        duration,
        perOp: duration / 1000
      });
    }

    console.table(results);

    // Performance should be reasonable
    const largestPerOp = results[results.length - 1].perOp;
    assert(largestPerOp < 1); // Less than 1ms per operation
  });
});
```

## Security Testing

### Security Test Suite

```javascript
describe('Security Testing', () => {
  describe('XSS Prevention', () => {
    const xssAttempts = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
      '<svg onload=alert(1)>',
      '"><script>alert(1)</script>',
      '\' onload=alert(1) \'',
    ];

    xssAttempts.forEach((attempt) => {
      it(`should prevent XSS: ${attempt.substring(0, 30)}`, () => {
        const encoded = querystring.escape(attempt);

        // Should not contain dangerous characters unencoded
        assert(!encoded.includes('<'));
        assert(!encoded.includes('>'));
        assert(!encoded.includes('"'));
        assert(!encoded.includes("'"));
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    const sqlAttempts = [
      "' OR '1'='1",
      "'; DROP TABLE users--",
      "' UNION SELECT * FROM users--",
      "admin'--",
      "' OR 1=1--"
    ];

    sqlAttempts.forEach((attempt) => {
      it(`should detect SQL injection: ${attempt}`, () => {
        // Your SQL validator should catch these
        const isSafe = SQLValidator.isSafe(attempt);
        assert.strictEqual(isSafe, false);
      });
    });
  });

  describe('Parameter Pollution', () => {
    it('should handle duplicate parameters', () => {
      const query = querystring.parse('id=1&id=2&id=3');

      // Should be array
      assert(Array.isArray(query.id));
      assert.deepStrictEqual(query.id, ['1', '2', '3']);
    });

    it('should prevent pollution attacks', () => {
      const polluted = querystring.parse('admin=false&admin=true');

      // Your pollution preventer should handle this
      const cleaned = preventPollution(polluted, { admin: 'error' });

      // Should throw or handle appropriately
      assert(cleaned);
    });
  });

  describe('Length Limits', () => {
    it('should handle very long query strings', () => {
      const longValue = 'x'.repeat(10000);
      const longQuery = `key=${longValue}`;

      // Should either parse or throw gracefully
      try {
        const result = querystring.parse(longQuery);
        assert(result.key.length === 10000);
      } catch (error) {
        assert(error.message.includes('too long'));
      }
    });
  });
});
```

## Test Coverage

### Measuring Coverage

```javascript
// Run with: nyc mocha tests/**/*.test.js

describe('Coverage Goals', () => {
  it('should have high test coverage', () => {
    // Aim for:
    // - 90%+ line coverage
    // - 85%+ branch coverage
    // - 80%+ function coverage

    // Use nyc (Istanbul) to measure
  });
});
```

## Best Practices

1. **Test edge cases**: Empty strings, special characters, very long inputs
2. **Test error conditions**: Invalid input, malformed queries
3. **Use test utilities**: Create helpers to reduce boilerplate
4. **Property-based testing**: Test properties that should always hold
5. **Fuzz testing**: Test with random/unexpected input
6. **Performance testing**: Ensure acceptable performance
7. **Security testing**: Test against common attacks
8. **Integration testing**: Test full request/response cycle
9. **Maintain coverage**: Aim for >80% code coverage
10. **Continuous testing**: Run tests on every commit

## Testing Checklist

- [ ] Unit tests for all parsing functions
- [ ] Unit tests for all building functions
- [ ] Integration tests for API endpoints
- [ ] Property-based tests for invariants
- [ ] Fuzz tests for robustness
- [ ] Performance benchmarks
- [ ] Security tests for XSS/SQL injection
- [ ] Edge case tests
- [ ] Error handling tests
- [ ] Test coverage >80%

## Additional Resources

- [Mocha Documentation](https://mochajs.org/)
- [Jest Documentation](https://jestjs.io/)
- [fast-check (Property Testing)](https://github.com/dubzzz/fast-check)
- [Supertest (HTTP Testing)](https://github.com/visionmedia/supertest)
- [Puppeteer (E2E Testing)](https://pptr.dev/)
