# Framework Integration Guide

## Overview

This guide covers integration patterns for using query strings with popular Node.js frameworks and libraries.

## Table of Contents

1. [Express.js Integration](#expressjs-integration)
2. [Fastify Integration](#fastify-integration)
3. [Koa Integration](#koa-integration)
4. [REST API Patterns](#rest-api-patterns)
5. [GraphQL Integration](#graphql-integration)
6. [WebSocket Integration](#websocket-integration)

## Express.js Integration

### Basic Middleware Setup

```javascript
const express = require('express');
const querystring = require('querystring');

const app = express();

// Custom query parser middleware
app.use((req, res, next) => {
  if (req.url.includes('?')) {
    const [path, queryStr] = req.url.split('?');
    req.queryRaw = queryStr;
    req.queryParsed = querystring.parse(queryStr);
  }
  next();
});
```

### Validation Middleware

```javascript
class ExpressQueryValidator {
  static validate(schema) {
    return (req, res, next) => {
      const errors = [];

      for (const [param, rules] of Object.entries(schema)) {
        const value = req.query[param];

        // Required check
        if (rules.required && !value) {
          errors.push(`Missing required parameter: ${param}`);
          continue;
        }

        if (!value) continue;

        // Type validation
        if (rules.type) {
          try {
            req.query[param] = this.coerce(value, rules.type);
          } catch (error) {
            errors.push(`Invalid type for ${param}: ${error.message}`);
          }
        }

        // Range validation
        if (rules.min !== undefined && req.query[param] < rules.min) {
          errors.push(`${param} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && req.query[param] > rules.max) {
          errors.push(`${param} must be at most ${rules.max}`);
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(req.query[param])) {
          errors.push(`${param} must be one of: ${rules.enum.join(', ')}`);
        }

        // Custom validator
        if (rules.validate && !rules.validate(req.query[param])) {
          errors.push(`${param} failed validation`);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      next();
    };
  }

  static coerce(value, type) {
    switch (type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error('Expected number');
        return num;

      case 'boolean':
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error('Expected boolean');

      case 'integer':
        const int = parseInt(value);
        if (isNaN(int)) throw new Error('Expected integer');
        return int;

      case 'array':
        return Array.isArray(value) ? value : [value];

      default:
        return value;
    }
  }
}

// Usage
app.get('/api/products',
  ExpressQueryValidator.validate({
    page: { type: 'integer', min: 1, default: 1 },
    limit: { type: 'integer', min: 1, max: 100, default: 20 },
    category: { type: 'string', enum: ['electronics', 'books', 'clothing'] },
    sort: { type: 'string', default: 'createdAt' },
    order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
  }),
  (req, res) => {
    // Query params are now validated and coerced
    const { page, limit, category, sort, order } = req.query;
    // ... handle request
  }
);
```

### Pagination Helper

```javascript
class ExpressPagination {
  static middleware(options = {}) {
    return (req, res, next) => {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(
        parseInt(req.query.limit) || options.defaultLimit || 20,
        options.maxLimit || 100
      );

      req.pagination = {
        page,
        limit,
        offset: (page - 1) * limit,

        // Helper to build response
        buildResponse(data, total) {
          const totalPages = Math.ceil(total / limit);
          const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;

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
                first: ExpressPagination.buildPageUrl(baseUrl, req.query, 1),
                prev: page > 1 ? ExpressPagination.buildPageUrl(baseUrl, req.query, page - 1) : null,
                current: ExpressPagination.buildPageUrl(baseUrl, req.query, page),
                next: page < totalPages ? ExpressPagination.buildPageUrl(baseUrl, req.query, page + 1) : null,
                last: ExpressPagination.buildPageUrl(baseUrl, req.query, totalPages)
              }
            }
          };
        },

        // Set Link header (RFC 5988)
        setLinkHeader(total) {
          const totalPages = Math.ceil(total / limit);
          const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
          const links = [];

          links.push(`<${ExpressPagination.buildPageUrl(baseUrl, req.query, 1)}>; rel="first"`);

          if (page > 1) {
            links.push(`<${ExpressPagination.buildPageUrl(baseUrl, req.query, page - 1)}>; rel="prev"`);
          }

          if (page < totalPages) {
            links.push(`<${ExpressPagination.buildPageUrl(baseUrl, req.query, page + 1)}>; rel="next"`);
          }

          links.push(`<${ExpressPagination.buildPageUrl(baseUrl, req.query, totalPages)}>; rel="last"`);

          res.set('Link', links.join(', '));
        }
      };

      next();
    };
  }

  static buildPageUrl(baseUrl, query, page) {
    const params = { ...query, page };
    return `${baseUrl}?${querystring.stringify(params)}`;
  }
}

// Usage
app.get('/api/products',
  ExpressPagination.middleware({ defaultLimit: 20, maxLimit: 100 }),
  async (req, res) => {
    const { page, limit, offset } = req.pagination;

    const products = await db.products.findAll({
      limit,
      offset
    });

    const total = await db.products.count();

    // Option 1: JSON response with pagination
    res.json(req.pagination.buildResponse(products, total));

    // Option 2: Set Link header
    req.pagination.setLinkHeader(total);
  }
);
```

### Query Filter Builder

```javascript
class ExpressQueryFilter {
  static parse(req, options = {}) {
    const { prefix = 'filter_', separator = '__' } = options;

    const filters = {};
    const sorts = [];

    for (const [key, value] of Object.entries(req.query)) {
      if (key.startsWith(prefix)) {
        // Parse filter: filter_price__gte=100
        const fieldPath = key.substring(prefix.length);

        if (fieldPath.includes(separator)) {
          const [field, operator] = fieldPath.split(separator);
          if (!filters[field]) filters[field] = {};
          filters[field][operator] = value;
        } else {
          filters[fieldPath] = { eq: value };
        }
      } else if (key === 'sort') {
        // Parse sort: sort=-price,name
        const sortFields = Array.isArray(value) ? value : [value];
        for (const field of sortFields) {
          if (field.startsWith('-')) {
            sorts.push({ field: field.substring(1), order: 'DESC' });
          } else {
            sorts.push({ field, order: 'ASC' });
          }
        }
      }
    }

    return { filters, sorts };
  }

  static toSequelize(filters) {
    const where = {};

    for (const [field, conditions] of Object.entries(filters)) {
      for (const [operator, value] of Object.entries(conditions)) {
        switch (operator) {
          case 'eq':
            where[field] = value;
            break;
          case 'ne':
            where[field] = { [Op.ne]: value };
            break;
          case 'gt':
            where[field] = { [Op.gt]: value };
            break;
          case 'gte':
            where[field] = { [Op.gte]: value };
            break;
          case 'lt':
            where[field] = { [Op.lt]: value };
            break;
          case 'lte':
            where[field] = { [Op.lte]: value };
            break;
          case 'like':
            where[field] = { [Op.like]: `%${value}%` };
            break;
          case 'in':
            where[field] = { [Op.in]: Array.isArray(value) ? value : [value] };
            break;
        }
      }
    }

    return where;
  }
}

// Usage
app.get('/api/products', async (req, res) => {
  // Parse: /api/products?filter_price__gte=100&filter_category=electronics&sort=-price
  const { filters, sorts } = ExpressQueryFilter.parse(req);

  const products = await db.products.findAll({
    where: ExpressQueryFilter.toSequelize(filters),
    order: sorts.map(s => [s.field, s.order])
  });

  res.json(products);
});
```

## Fastify Integration

### Query Validation with JSON Schema

```javascript
const fastify = require('fastify')();

// Define schema
const productListSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      category: { type: 'string', enum: ['electronics', 'books', 'clothing'] },
      minPrice: { type: 'number', minimum: 0 },
      maxPrice: { type: 'number', minimum: 0 },
      sort: { type: 'string', enum: ['price', 'name', 'date'], default: 'date' },
      order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
    }
  }
};

fastify.get('/api/products', { schema: productListSchema }, async (request, reply) => {
  // Query params are automatically validated and coerced
  const { page, limit, category, minPrice, maxPrice, sort, order } = request.query;

  // ... handle request
});
```

### Custom Query Parser Plugin

```javascript
const fp = require('fastify-plugin');

async function queryParserPlugin(fastify, options) {
  fastify.decorateRequest('parsedQuery', null);

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url.includes('?')) {
      const [_, queryStr] = request.url.split('?');

      request.parsedQuery = {
        raw: queryStr,
        params: querystring.parse(queryStr),
        normalized: normalizeQuery(queryStr),
        fingerprint: createFingerprint(queryStr)
      };
    }
  });
}

function normalizeQuery(queryStr) {
  const params = querystring.parse(queryStr);
  const sorted = Object.keys(params).sort();
  return querystring.stringify(
    sorted.reduce((acc, key) => ({ ...acc, [key]: params[key] }), {})
  );
}

function createFingerprint(queryStr) {
  const params = querystring.parse(queryStr);
  return Object.keys(params).sort().join(',');
}

module.exports = fp(queryParserPlugin);
```

## Koa Integration

### Query Validation Middleware

```javascript
const Koa = require('koa');
const app = new Koa();

function validateQuery(schema) {
  return async (ctx, next) => {
    const errors = [];

    for (const [param, rules] of Object.entries(schema)) {
      const value = ctx.query[param];

      if (rules.required && !value) {
        errors.push(`Missing required parameter: ${param}`);
        continue;
      }

      if (value && rules.type) {
        try {
          ctx.query[param] = coerceType(value, rules.type);
        } catch (error) {
          errors.push(`Invalid type for ${param}`);
        }
      }

      if (rules.validate && !rules.validate(ctx.query[param])) {
        errors.push(`Validation failed for ${param}`);
      }
    }

    if (errors.length > 0) {
      ctx.status = 400;
      ctx.body = { errors };
      return;
    }

    await next();
  };
}

// Usage
app.use(validateQuery({
  page: { type: 'integer', min: 1 },
  limit: { type: 'integer', min: 1, max: 100 }
}));

app.use(async ctx => {
  const { page, limit } = ctx.query;
  // ... handle request
});
```

## REST API Patterns

### JSON:API Specification

```javascript
class JSONAPIQueryParser {
  static parse(query) {
    return {
      // Sparse fieldsets: fields[articles]=title,body&fields[people]=name
      fields: this.parseFields(query),

      // Filtering: filter[status]=published&filter[author]=john
      filters: this.parseFilters(query),

      // Sorting: sort=-created,title
      sort: this.parseSort(query),

      // Pagination: page[number]=2&page[size]=10
      page: this.parsePage(query),

      // Inclusion: include=author,comments.author
      include: this.parseInclude(query)
    };
  }

  static parseFields(query) {
    const fields = {};

    for (const [key, value] of Object.entries(query)) {
      const match = key.match(/^fields\[(\w+)\]$/);
      if (match) {
        fields[match[1]] = value.split(',');
      }
    }

    return fields;
  }

  static parseFilters(query) {
    const filters = {};

    for (const [key, value] of Object.entries(query)) {
      const match = key.match(/^filter\[(\w+)\]$/);
      if (match) {
        filters[match[1]] = value;
      }
    }

    return filters;
  }

  static parseSort(query) {
    if (!query.sort) return [];

    return query.sort.split(',').map(field => {
      if (field.startsWith('-')) {
        return { field: field.substring(1), direction: 'desc' };
      }
      return { field, direction: 'asc' };
    });
  }

  static parsePage(query) {
    const page = {};

    for (const [key, value] of Object.entries(query)) {
      const match = key.match(/^page\[(\w+)\]$/);
      if (match) {
        page[match[1]] = parseInt(value) || value;
      }
    }

    return page;
  }

  static parseInclude(query) {
    if (!query.include) return [];
    return query.include.split(',');
  }

  static buildResponse(data, meta = {}, links = {}) {
    return {
      data,
      meta,
      links
    };
  }
}

// Usage
app.get('/api/articles', (req, res) => {
  const parsed = JSONAPIQueryParser.parse(req.query);

  // Example: /api/articles?
  //   filter[status]=published&
  //   fields[articles]=title,body&
  //   include=author,comments&
  //   sort=-created&
  //   page[number]=2&
  //   page[size]=10

  const articles = db.articles.find({
    where: parsed.filters,
    attributes: parsed.fields.articles,
    include: parsed.include,
    order: parsed.sort.map(s => [s.field, s.direction]),
    limit: parsed.page.size,
    offset: (parsed.page.number - 1) * parsed.page.size
  });

  res.json(JSONAPIQueryParser.buildResponse(articles));
});
```

### OData Query Support

```javascript
class ODataQueryParser {
  static parse(query) {
    return {
      filter: this.parseFilter(query.$filter),
      select: this.parseSelect(query.$select),
      orderby: this.parseOrderBy(query.$orderby),
      top: parseInt(query.$top) || 20,
      skip: parseInt(query.$skip) || 0,
      count: query.$count === 'true'
    };
  }

  static parseFilter(filterStr) {
    if (!filterStr) return null;

    // Simple implementation - parse basic filters
    // Example: "status eq 'published' and price gt 100"
    const conditions = [];

    const parts = filterStr.split(' and ');
    for (const part of parts) {
      const match = part.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+'?([^']+)'?/);
      if (match) {
        conditions.push({
          field: match[1],
          operator: match[2],
          value: match[3]
        });
      }
    }

    return conditions;
  }

  static parseSelect(selectStr) {
    if (!selectStr) return null;
    return selectStr.split(',');
  }

  static parseOrderBy(orderbyStr) {
    if (!orderbyStr) return null;

    return orderbyStr.split(',').map(field => {
      const [name, direction = 'asc'] = field.trim().split(' ');
      return { field: name, direction };
    });
  }
}
```

## GraphQL Integration

### Query String to GraphQL Variables

```javascript
class GraphQLQueryMapper {
  static toVariables(query) {
    const variables = {};

    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('var_')) {
        const varName = key.substring(4);
        variables[varName] = this.parseValue(value);
      }
    }

    return variables;
  }

  static parseValue(value) {
    // Try to parse as JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    // Try to parse as number
    if (!isNaN(value)) {
      return Number(value);
    }

    // Parse booleans
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }

  static fromVariables(variables) {
    const query = {};

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'object') {
        query[`var_${key}`] = JSON.stringify(value);
      } else {
        query[`var_${key}`] = String(value);
      }
    }

    return querystring.stringify(query);
  }
}

// Usage in GraphQL resolver
const resolvers = {
  Query: {
    products: (parent, args, context) => {
      // Parse variables from query string
      const variables = GraphQLQueryMapper.toVariables(context.req.query);

      // Use variables in resolver
      return db.products.findAll({
        where: variables.filters,
        limit: variables.limit || 20
      });
    }
  }
};
```

## WebSocket Integration

### WebSocket Query Handler

```javascript
const WebSocket = require('ws');

class WebSocketQueryHandler {
  static parseUpgradeRequest(req) {
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const params = querystring.parse(url.search.substring(1));

    return {
      path: url.pathname,
      query: params,
      token: params.token,
      room: params.room,
      userId: params.userId
    };
  }

  static validateConnection(params) {
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

// Usage
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  try {
    const params = WebSocketQueryHandler.parseUpgradeRequest(req);
    WebSocketQueryHandler.validateConnection(params);

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.params = params;
      wss.emit('connection', ws, req);
    });
  } catch (error) {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('Client connected:', ws.params);

  // Join room based on query parameter
  joinRoom(ws, ws.params.room);
});
```

## Best Practices

1. **Validate early**: Validate query parameters at the entry point
2. **Use schemas**: Define schemas for expected query parameters
3. **Type coercion**: Automatically coerce types where appropriate
4. **Provide defaults**: Set sensible defaults for optional parameters
5. **Document your API**: Clearly document expected query parameters
6. **Version your API**: Include version in URL or headers
7. **Rate limit**: Implement rate limiting per endpoint
8. **Cache responses**: Cache responses based on query parameters
9. **Use middleware**: Centralize query handling logic
10. **Test thoroughly**: Test with various query combinations

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Fastify Documentation](https://www.fastify.io/)
- [JSON:API Specification](https://jsonapi.org/)
- [OData Protocol](https://www.odata.org/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
