# Production Architecture Guide

## Overview

This guide covers architectural patterns and best practices for using query strings in production applications at scale.

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [System Design Patterns](#system-design-patterns)
3. [Scalability Considerations](#scalability-considerations)
4. [Performance Optimization](#performance-optimization)
5. [Monitoring and Observability](#monitoring-and-observability)
6. [Deployment Strategies](#deployment-strategies)

## Architecture Principles

### Separation of Concerns

```
┌─────────────────┐
│   Presentation  │ ← URL generation, display
├─────────────────┤
│    Business     │ ← Query parsing, validation
├─────────────────┤
│   Data Access   │ ← Filter application
└─────────────────┘
```

**Best Practices:**
- Keep URL generation separate from business logic
- Centralize query parameter validation
- Abstract query parsing from data access layer
- Use dependency injection for testability

### Single Responsibility

Each component should handle one aspect of query string processing:

```javascript
// ❌ Bad: Mixed responsibilities
function handleSearch(url) {
  const params = parse(url);
  validate(params);
  const results = database.query(params);
  return formatResponse(results);
}

// ✅ Good: Single responsibility
class QueryParser {
  parse(url) { /* ... */ }
}

class QueryValidator {
  validate(params) { /* ... */ }
}

class SearchService {
  search(params) { /* ... */ }
}
```

### Immutability

Treat parsed query parameters as immutable:

```javascript
// ✅ Good: Immutable approach
class QueryBuilder {
  constructor(params = {}) {
    this._params = Object.freeze({ ...params });
  }

  withParam(key, value) {
    return new QueryBuilder({
      ...this._params,
      [key]: value
    });
  }

  build() {
    return querystring.stringify(this._params);
  }
}
```

## System Design Patterns

### 1. Query Parameter Middleware Pattern

```javascript
// Middleware pipeline for query processing
class QueryPipeline {
  constructor() {
    this.middleware = [];
  }

  use(fn) {
    this.middleware.push(fn);
    return this;
  }

  async process(queryStr, context = {}) {
    let result = querystring.parse(queryStr);

    for (const fn of this.middleware) {
      result = await fn(result, context);
    }

    return result;
  }
}

// Usage
const pipeline = new QueryPipeline();
pipeline
  .use(validateMiddleware)
  .use(sanitizeMiddleware)
  .use(transformMiddleware);

const params = await pipeline.process(req.query);
```

### 2. Strategy Pattern for Parsing

```javascript
class QueryParsingStrategy {
  parse(queryStr) {
    throw new Error('Must implement parse');
  }
}

class StandardStrategy extends QueryParsingStrategy {
  parse(queryStr) {
    return querystring.parse(queryStr);
  }
}

class JSONAPIStrategy extends QueryParsingStrategy {
  parse(queryStr) {
    const params = querystring.parse(queryStr);
    return this.transformToJSONAPI(params);
  }

  transformToJSONAPI(params) {
    // Transform to JSON:API format
    return {
      filters: this.extractFilters(params),
      includes: this.extractIncludes(params),
      sort: this.extractSort(params)
    };
  }
}

class QueryParser {
  constructor(strategy) {
    this.strategy = strategy;
  }

  parse(queryStr) {
    return this.strategy.parse(queryStr);
  }
}
```

### 3. Builder Pattern for URL Construction

```javascript
class URLBuilder {
  constructor(base) {
    this.base = base;
    this.params = new Map();
  }

  param(key, value) {
    this.params.set(key, value);
    return this;
  }

  params(obj) {
    Object.entries(obj).forEach(([k, v]) => {
      this.params.set(k, v);
    });
    return this;
  }

  removeParam(key) {
    this.params.delete(key);
    return this;
  }

  build() {
    if (this.params.size === 0) return this.base;

    const entries = Object.fromEntries(this.params);
    const queryStr = querystring.stringify(entries);
    return `${this.base}?${queryStr}`;
  }
}

// Usage
const url = new URLBuilder('/api/products')
  .param('category', 'electronics')
  .param('sort', 'price')
  .build();
```

### 4. Factory Pattern for Query Builders

```javascript
class QueryBuilderFactory {
  static create(type, options = {}) {
    switch (type) {
      case 'search':
        return new SearchQueryBuilder(options);
      case 'filter':
        return new FilterQueryBuilder(options);
      case 'pagination':
        return new PaginationQueryBuilder(options);
      default:
        throw new Error(`Unknown builder type: ${type}`);
    }
  }
}

// Usage
const searchBuilder = QueryBuilderFactory.create('search', {
  fuzzy: true,
  boost: ['title']
});
```

## Scalability Considerations

### Caching Strategy

```javascript
class DistributedQueryCache {
  constructor(redis) {
    this.redis = redis;
    this.ttl = 300; // 5 minutes
  }

  async get(queryStr) {
    const key = this.generateKey(queryStr);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(queryStr, result) {
    const key = this.generateKey(queryStr);
    await this.redis.setex(
      key,
      this.ttl,
      JSON.stringify(result)
    );
  }

  generateKey(queryStr) {
    // Normalize query string for consistent keys
    const params = querystring.parse(queryStr);
    const sorted = Object.keys(params).sort();
    const normalized = sorted.map(k =>
      `${k}=${params[k]}`
    ).join('&');

    return `query:${hash(normalized)}`;
  }
}
```

### Load Balancing

```
             ┌─────────────┐
             │ Load        │
             │ Balancer    │
             └──────┬──────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼───┐  ┌───▼────┐  ┌───▼────┐
   │ App    │  │ App    │  │ App    │
   │ Server │  │ Server │  │ Server │
   └────┬───┘  └───┬────┘  └───┬────┘
        │          │           │
        └──────────┼───────────┘
                   │
            ┌──────▼──────┐
            │ Shared      │
            │ Cache       │
            └─────────────┘
```

**Considerations:**
- Use sticky sessions for stateful query processing
- Implement distributed caching
- Share query parsing results across servers
- Monitor query patterns for hot spots

### Database Optimization

```javascript
class OptimizedQueryExecutor {
  async execute(filters) {
    // Build optimized database query
    const query = this.buildQuery(filters);

    // Use prepared statements
    const stmt = await this.db.prepare(query.sql);

    // Add query hints
    stmt.hint('USE INDEX (category_price_idx)');

    // Execute with timeout
    return await stmt.execute(query.params, {
      timeout: 5000
    });
  }

  buildQuery(filters) {
    // Generate optimized SQL with proper indexes
    const conditions = [];
    const params = [];

    if (filters.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    if (filters.minPrice) {
      conditions.push('price >= ?');
      params.push(filters.minPrice);
    }

    return {
      sql: `SELECT * FROM products
            WHERE ${conditions.join(' AND ')}
            ORDER BY ${this.buildOrderBy(filters.sort)}
            LIMIT ? OFFSET ?`,
      params: [...params, filters.limit, filters.offset]
    };
  }
}
```

## Performance Optimization

### Query String Parsing Optimization

```javascript
class OptimizedQueryParser {
  constructor() {
    this.cache = new LRUCache(1000);
  }

  parse(queryStr) {
    // Check cache first
    if (this.cache.has(queryStr)) {
      return this.cache.get(queryStr);
    }

    // Parse and cache
    const result = querystring.parse(queryStr);
    this.cache.set(queryStr, result);

    return result;
  }

  // Lazy parsing for large query strings
  parseLazy(queryStr) {
    let parsed = null;

    return new Proxy({}, {
      get(target, prop) {
        if (!parsed) {
          parsed = querystring.parse(queryStr);
        }
        return parsed[prop];
      }
    });
  }
}
```

### Request Batching

```javascript
class QueryBatcher {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 10;
    this.queue = [];
    this.timer = null;
  }

  add(queryStr) {
    return new Promise((resolve, reject) => {
      this.queue.push({ queryStr, resolve, reject });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0);
    if (batch.length === 0) return;

    try {
      const results = await this.processBatch(
        batch.map(item => item.queryStr)
      );

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  }

  async processBatch(queries) {
    // Process multiple queries efficiently
    return queries.map(q => querystring.parse(q));
  }
}
```

## Monitoring and Observability

### Metrics Collection

```javascript
class QueryMetrics {
  constructor(metricsClient) {
    this.client = metricsClient;
  }

  recordParse(queryStr, duration) {
    this.client.histogram('query.parse.duration', duration, {
      complexity: this.calculateComplexity(queryStr)
    });

    this.client.increment('query.parse.count', {
      has_filters: queryStr.includes('filter'),
      has_sort: queryStr.includes('sort')
    });
  }

  recordError(error, queryStr) {
    this.client.increment('query.error.count', {
      error_type: error.constructor.name,
      query_length: queryStr.length
    });
  }

  calculateComplexity(queryStr) {
    const params = querystring.parse(queryStr);
    const count = Object.keys(params).length;

    if (count < 5) return 'simple';
    if (count < 15) return 'medium';
    return 'complex';
  }
}
```

### Logging Strategy

```javascript
class QueryLogger {
  log(level, message, context) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      query: this.sanitizeQuery(context.query),
      userId: context.userId,
      requestId: context.requestId,
      duration: context.duration
    };

    this.output(entry);
  }

  sanitizeQuery(queryStr) {
    // Remove sensitive data
    const params = querystring.parse(queryStr);
    const sanitized = { ...params };

    // Redact sensitive fields
    ['password', 'token', 'secret', 'apiKey'].forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return querystring.stringify(sanitized);
  }

  output(entry) {
    console.log(JSON.stringify(entry));
  }
}
```

## Deployment Strategies

### Blue-Green Deployment

```javascript
class QueryParserVersionManager {
  constructor() {
    this.versions = {
      blue: new QueryParserV1(),
      green: new QueryParserV2()
    };
    this.active = 'blue';
  }

  parse(queryStr) {
    return this.versions[this.active].parse(queryStr);
  }

  switchVersion() {
    this.active = this.active === 'blue' ? 'green' : 'blue';
  }

  rollback() {
    this.switchVersion();
  }
}
```

### Feature Flags

```javascript
class FeatureFlaggedParser {
  constructor(featureFlags) {
    this.flags = featureFlags;
  }

  parse(queryStr, userId) {
    let params = querystring.parse(queryStr);

    if (this.flags.isEnabled('new-array-parsing', userId)) {
      params = this.parseArraysV2(params);
    }

    if (this.flags.isEnabled('strict-validation', userId)) {
      this.validateStrict(params);
    }

    return params;
  }
}
```

## Best Practices

1. **Always validate and sanitize** query parameters at the entry point
2. **Use caching** for frequently accessed query patterns
3. **Implement rate limiting** per query pattern to prevent abuse
4. **Monitor query complexity** and set limits
5. **Use prepared statements** when converting to database queries
6. **Log suspicious patterns** for security analysis
7. **Version your query API** for backward compatibility
8. **Document query parameter schemas** for API consumers
9. **Test edge cases** including malformed and malicious input
10. **Implement circuit breakers** for failing query operations

## Common Pitfalls

- Not normalizing query strings before caching
- Missing validation on nested parameters
- Exposing internal database structure in query parameters
- Not setting maximum query string length
- Forgetting to decode values properly
- Not handling arrays consistently
- Missing error handling for malformed queries
- Not considering encoding differences across platforms
- Exposing sensitive data in query parameters
- Not implementing proper CORS for cross-origin requests

## Additional Resources

- [REST API Best Practices](https://restfulapi.net/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [JSON:API Specification](https://jsonapi.org/)
- [RFC 3986 - URI Spec](https://tools.ietf.org/html/rfc3986)
