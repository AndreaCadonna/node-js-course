/**
 * Example 4: Framework Integration Patterns
 *
 * Integration with popular frameworks like Express, Fastify, etc.
 */

const querystring = require('querystring');

// Express-style middleware
class QueryMiddleware {
  // Validate query parameters
  static validate(schema) {
    return (req, res, next) => {
      try {
        const validated = {};

        for (const [key, rules] of Object.entries(schema)) {
          const value = req.query[key];

          // Required check
          if (rules.required && !value) {
            throw new Error(`Missing required parameter: ${key}`);
          }

          // Type validation
          if (value && rules.type) {
            validated[key] = this.validateType(value, rules.type);
          }

          // Custom validator
          if (value && rules.validator) {
            if (!rules.validator(value)) {
              throw new Error(`Invalid value for ${key}: ${value}`);
            }
          }

          // Default value
          if (!value && rules.default !== undefined) {
            validated[key] = rules.default;
          }
        }

        req.validatedQuery = validated;
        next();
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    };
  }

  static validateType(value, type) {
    switch (type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error(`Expected number, got: ${value}`);
        return num;
      case 'boolean':
        return value === 'true' || value === '1';
      case 'array':
        return Array.isArray(value) ? value : [value];
      case 'string':
        return String(value);
      default:
        return value;
    }
  }

  // Sanitize query parameters
  static sanitize(options = {}) {
    return (req, res, next) => {
      const { maxLength = 1000, removeEmpty = true, trimValues = true } = options;

      const sanitized = {};

      for (const [key, value] of Object.entries(req.query)) {
        let sanitizedValue = value;

        if (typeof sanitizedValue === 'string') {
          // Trim whitespace
          if (trimValues) {
            sanitizedValue = sanitizedValue.trim();
          }

          // Limit length
          if (sanitizedValue.length > maxLength) {
            sanitizedValue = sanitizedValue.substring(0, maxLength);
          }

          // Remove empty
          if (removeEmpty && sanitizedValue === '') {
            continue;
          }

          // XSS protection
          sanitizedValue = sanitizedValue
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        }

        sanitized[key] = sanitizedValue;
      }

      req.query = sanitized;
      next();
    };
  }

  // Parse nested objects
  static parseNested() {
    return (req, res, next) => {
      const parsed = {};

      for (const [key, value] of Object.entries(req.query)) {
        if (key.includes('.')) {
          // Handle dot notation
          const keys = key.split('.');
          let current = parsed;

          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }

          current[keys[keys.length - 1]] = value;
        } else {
          parsed[key] = value;
        }
      }

      req.query = parsed;
      next();
    };
  }
}

// API Response Builder
class ApiResponseBuilder {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Build paginated response
  buildPaginatedResponse(data, page, limit, total) {
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
    const params = querystring.stringify({ page, limit });
    return `${this.baseUrl}?${params}`;
  }

  // Build search response with filters
  buildSearchResponse(results, filters) {
    return {
      results,
      filters: filters,
      meta: {
        count: results.length,
        url: this.buildSearchUrl(filters)
      }
    };
  }

  buildSearchUrl(filters) {
    const params = querystring.stringify(filters);
    return `${this.baseUrl}?${params}`;
  }
}

// Query Builder for REST APIs
class RestQueryBuilder {
  constructor() {
    this.params = {};
  }

  filter(field, value) {
    this.params[`filter[${field}]`] = value;
    return this;
  }

  sort(field, order = 'asc') {
    this.params.sort = order === 'desc' ? `-${field}` : field;
    return this;
  }

  include(...relations) {
    this.params.include = relations.join(',');
    return this;
  }

  fields(resource, ...fields) {
    this.params[`fields[${resource}]`] = fields.join(',');
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
}

// GraphQL-style query parser
class GraphQLQueryParser {
  static parseVariables(queryStr) {
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
    // Try to parse as JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}

// Demo
console.log('=== Framework Integration Demo ===\n');

// Middleware schema example
console.log('Query Validation Schema:');
const schema = {
  page: { type: 'number', default: 1, validator: (v) => v > 0 },
  limit: { type: 'number', default: 20, validator: (v) => v > 0 && v <= 100 },
  sort: { type: 'string', default: 'date' },
  active: { type: 'boolean', required: false }
};
console.log(schema);
console.log('');

// REST API query builder
console.log('REST API Query Builder:');
const restQuery = new RestQueryBuilder()
  .filter('status', 'published')
  .filter('author', 'john')
  .sort('created_at', 'desc')
  .include('comments', 'author')
  .fields('articles', 'title', 'body', 'created_at')
  .page(2, 10)
  .buildUrl('/api/articles');

console.log('Query URL:', restQuery);
console.log('');

// API response builder
console.log('Paginated API Response:');
const apiBuilder = new ApiResponseBuilder('/api/products');
const response = apiBuilder.buildPaginatedResponse(
  [{ id: 1, name: 'Product A' }, { id: 2, name: 'Product B' }],
  2,
  10,
  45
);
console.log(JSON.stringify(response, null, 2));
console.log('');

// GraphQL variables
console.log('GraphQL Variables from Query String:');
const gqlVars = GraphQLQueryParser.parseVariables(
  'var_userId=123&var_limit=10&var_filters={"status":"active"}'
);
console.log('Parsed variables:', gqlVars);

console.log('\n✓ Framework integration patterns ready for production!');

module.exports = {
  QueryMiddleware,
  ApiResponseBuilder,
  RestQueryBuilder,
  GraphQLQueryParser
};
