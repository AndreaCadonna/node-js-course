/**
 * Level 3 Exercise 4 Solution: Framework Integration
 */

const querystring = require('querystring');

// Task 1: Express Middleware Suite
class QueryMiddleware {
  static validation(schema) {
    return (req, res, next) => {
      const errors = [];

      for (const [param, rules] of Object.entries(schema)) {
        const value = req.query[param];

        // Required check
        if (rules.required && !value) {
          errors.push(`Missing required parameter: ${param}`);
          continue;
        }

        if (!value) {
          // Apply default
          if (rules.default !== undefined) {
            req.query[param] = rules.default;
          }
          continue;
        }

        // Type coercion
        if (rules.type) {
          try {
            req.query[param] = this.coerceType(value, rules.type);
          } catch (error) {
            errors.push(`Invalid type for ${param}: ${error.message}`);
            continue;
          }
        }

        // Validation
        if (rules.validator && !rules.validator(req.query[param])) {
          errors.push(`Validation failed for ${param}`);
        }

        // Min/Max
        if (rules.min !== undefined && req.query[param] < rules.min) {
          errors.push(`${param} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && req.query[param] > rules.max) {
          errors.push(`${param} must be at most ${rules.max}`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      next();
    };
  }

  static sanitization(options = {}) {
    return (req, res, next) => {
      const { maxLength = 1000, trimValues = true, removeEmpty = true } = options;

      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          let sanitized = value;

          if (trimValues) sanitized = sanitized.trim();
          if (sanitized.length > maxLength) sanitized = sanitized.substring(0, maxLength);

          // Basic XSS protection
          sanitized = sanitized.replace(/[<>]/g, '');

          if (removeEmpty && sanitized === '') {
            delete req.query[key];
          } else {
            req.query[key] = sanitized;
          }
        }
      }

      next();
    };
  }

  static parsing(options = {}) {
    return (req, res, next) => {
      // Store original query string
      const urlParts = req.url.split('?');
      req.queryRaw = urlParts[1] || '';

      // Parse nested objects
      if (options.parseNested) {
        req.query = this.parseNested(req.query);
      }

      next();
    };
  }

  static rateLimit(options = {}) {
    const { maxRequests = 100, windowMs = 60000 } = options;
    const store = new Map();

    return (req, res, next) => {
      const key = req.ip || req.connection.remoteAddress;
      const now = Date.now();

      // Clean old entries
      for (const [k, v] of store.entries()) {
        if (now > v.resetAt) store.delete(k);
      }

      let record = store.get(key);

      if (!record) {
        record = { count: 0, resetAt: now + windowMs };
        store.set(key, record);
      }

      if (record.count >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((record.resetAt - now) / 1000)
        });
      }

      record.count++;
      next();
    };
  }

  static logger(options = {}) {
    return (req, res, next) => {
      const { excludeParams = ['password', 'token', 'secret'] } = options;

      const sanitized = { ...req.query };
      excludeParams.forEach(param => {
        if (sanitized[param]) sanitized[param] = '[REDACTED]';
      });

      console.log(`[Query] ${req.method} ${req.path}`, sanitized);

      next();
    };
  }

  static coerceType(value, type) {
    switch (type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error('Expected number');
        return num;

      case 'integer':
        const int = parseInt(value);
        if (isNaN(int)) throw new Error('Expected integer');
        return int;

      case 'boolean':
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error('Expected boolean');

      case 'array':
        return Array.isArray(value) ? value : [value];

      default:
        return value;
    }
  }

  static parseNested(obj) {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      if (key.includes('.')) {
        const keys = key.split('.');
        let current = result;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

// Task 2: REST API Query Builder
class RestQueryBuilder {
  constructor() {
    this.params = {};
  }

  filter(field, operator, value) {
    const key = `filter[${field}][${operator}]`;
    this.params[key] = value;
    return this;
  }

  sort(field, direction = 'asc') {
    const prefix = direction === 'desc' ? '-' : '';
    this.params.sort = this.params.sort
      ? `${this.params.sort},${prefix}${field}`
      : `${prefix}${field}`;
    return this;
  }

  include(...relations) {
    this.params.include = relations.join(',');
    return this;
  }

  fields(resource, ...fieldList) {
    this.params[`fields[${resource}]`] = fieldList.join(',');
    return this;
  }

  page(number, size = 20) {
    this.params['page[number]'] = number;
    this.params['page[size]'] = size;
    return this;
  }

  build() {
    return querystring.stringify(this.params);
  }

  buildUrl(baseUrl) {
    const qs = this.build();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  parse(queryStr) {
    const params = querystring.parse(queryStr);
    this.params = params;
    return this;
  }
}

// Task 3: API Response Pagination
class PaginationHelper {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.style = options.style || 'page';
    this.pageParam = options.pageParam || 'page';
    this.limitParam = options.limitParam || 'limit';
  }

  paginate(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        links: {
          first: this.buildPageUrl(1, limit),
          prev: page > 1 ? this.buildPageUrl(page - 1, limit) : null,
          current: this.buildPageUrl(page, limit),
          next: page < totalPages ? this.buildPageUrl(page + 1, limit) : null,
          last: this.buildPageUrl(totalPages, limit)
        }
      }
    };
  }

  buildPageUrl(page, limit) {
    return `${this.baseUrl}?${this.pageParam}=${page}&${this.limitParam}=${limit}`;
  }

  getLinkHeader(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const links = [];

    links.push(`<${this.buildPageUrl(1, limit)}>; rel="first"`);

    if (page > 1) {
      links.push(`<${this.buildPageUrl(page - 1, limit)}>; rel="prev"`);
    }

    if (page < totalPages) {
      links.push(`<${this.buildPageUrl(page + 1, limit)}>; rel="next"`);
    }

    links.push(`<${this.buildPageUrl(totalPages, limit)}>; rel="last"`);

    return links.join(', ');
  }

  getMetadata(page, limit, total) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
  }
}

// Task 4: API Client
class ApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.version = config.version || 'v1';
    this.timeout = config.timeout || 30000;
  }

  buildRequest(endpoint, options = {}) {
    const params = {};

    // Add filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params[`filter[${key}]`] = value;
      });
    }

    // Add pagination
    if (options.page) params.page = options.page;
    if (options.limit) params.limit = options.limit;

    // Add sorting
    if (options.sort) params.sort = options.sort;

    // Add API key
    if (this.apiKey) params.api_key = this.apiKey;

    // Add version
    params.v = this.version;

    const queryStr = querystring.stringify(params);
    return `${this.baseUrl}${endpoint}${queryStr ? '?' + queryStr : ''}`;
  }

  signRequest(url, secret) {
    const crypto = require('crypto');
    const urlObj = new URL(url);

    // Sign query parameters
    const params = Object.fromEntries(urlObj.searchParams);
    const sorted = Object.keys(params).sort();
    const toSign = sorted.map(k => `${k}=${params[k]}`).join('&');

    const signature = crypto
      .createHmac('sha256', secret)
      .update(toSign)
      .digest('hex');

    urlObj.searchParams.set('signature', signature);

    return urlObj.toString();
  }

  async retry(fn, options = {}) {
    const { maxRetries = 3, delay = 1000 } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) throw error;

        await new Promise(resolve =>
          setTimeout(resolve, delay * Math.pow(2, attempt))
        );
      }
    }
  }
}

// Task 5: GraphQL Variable Mapper
class GraphQLVariableMapper {
  static toQueryString(variables) {
    const params = {};

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'object') {
        params[`var_${key}`] = JSON.stringify(value);
      } else {
        params[`var_${key}`] = String(value);
      }
    }

    return querystring.stringify(params);
  }

  static fromQueryString(queryStr) {
    const params = querystring.parse(queryStr);
    const variables = {};

    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('var_')) {
        const varName = key.substring(4);
        variables[varName] = this.parseValue(value);
      }
    }

    return variables;
  }

  static parseValue(value) {
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    if (!isNaN(value)) return Number(value);
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }
}

// Task 6: WebSocket Query Handler
class WebSocketQueryHandler {
  static parse(url) {
    const urlObj = new URL(url, 'ws://localhost');
    const params = querystring.parse(urlObj.search.substring(1));

    return {
      path: urlObj.pathname,
      query: params,
      token: params.token,
      room: params.room,
      userId: params.userId
    };
  }

  static validate(params) {
    const errors = [];

    if (!params.token) {
      errors.push('Missing authentication token');
    }

    if (!params.room) {
      errors.push('Missing room parameter');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }
}

// Test implementations
console.log('=== Level 3 Exercise 4 Solutions ===\\n');

// Test Task 1: Express Middleware
console.log('Task 1: Express Middleware Suite');
try {
  const mockReq = {
    query: { page: '2', limit: '20', sort: 'price' },
    url: '/products?page=2&limit=20&sort=price',
    method: 'GET',
    path: '/products'
  };
  const mockRes = {
    status: (code) => ({ json: (data) => ({ code, data }) })
  };
  const mockNext = () => console.log('  Middleware passed');

  const validate = QueryMiddleware.validation({
    page: { type: 'integer', min: 1 },
    limit: { type: 'integer', min: 1, max: 100 }
  });

  validate(mockReq, mockRes, mockNext);

  console.log('✓ Task 1 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 2: REST Query Builder
console.log('Task 2: REST API Query Builder');
try {
  const query = new RestQueryBuilder()
    .filter('status', 'eq', 'active')
    .filter('price', 'gte', 100)
    .sort('created_at', 'desc')
    .include('author', 'comments')
    .fields('posts', 'title', 'body')
    .page(2, 20)
    .build();

  console.log('Built query:', query);
  console.log('✓ Task 2 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 3: Pagination Helper
console.log('Task 3: API Response Pagination');
try {
  const paginator = new PaginationHelper('https://api.example.com/posts');
  const response = paginator.paginate(
    [{ id: 1 }, { id: 2 }],
    2,
    10,
    50
  );

  console.log('Paginated response:', JSON.stringify(response.pagination, null, 2));
  console.log('✓ Task 3 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 4: API Client
console.log('Task 4: API Client');
try {
  const client = new ApiClient({
    baseUrl: 'https://api.example.com',
    apiKey: 'secret',
    version: 'v2'
  });

  const url = client.buildRequest('/posts', {
    filters: { status: 'published' },
    page: 1,
    limit: 20
  });

  console.log('Request URL:', url);
  console.log('✓ Task 4 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 5: GraphQL Variables
console.log('Task 5: GraphQL Variable Mapper');
try {
  const variables = {
    userId: 123,
    filters: { status: 'active', tags: ['js', 'node'] },
    limit: 10
  };

  const queryStr = GraphQLVariableMapper.toQueryString(variables);
  console.log('Query string:', queryStr);

  const parsed = GraphQLVariableMapper.fromQueryString(queryStr);
  console.log('Parsed back:', parsed);
  console.log('✓ Task 5 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

// Test Task 6: WebSocket Query Handler
console.log('Task 6: WebSocket Query Handler');
try {
  const params = WebSocketQueryHandler.parse(
    '/ws?token=abc123&room=lobby&userId=john'
  );

  console.log('WebSocket params:', params);
  WebSocketQueryHandler.validate(params);
  console.log('✓ Validation passed');
  console.log('✓ Task 6 complete\\n');
} catch (error) {
  console.error('Error:', error.message);
}

console.log('=== All Solutions Complete ===');

module.exports = {
  QueryMiddleware,
  RestQueryBuilder,
  PaginationHelper,
  ApiClient,
  GraphQLVariableMapper,
  WebSocketQueryHandler
};
