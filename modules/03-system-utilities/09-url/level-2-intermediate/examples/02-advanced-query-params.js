/**
 * Example 2: Advanced Query Parameter Handling
 *
 * Demonstrates complex query parameter operations including
 * nested structures, arrays, and serialization patterns.
 */

console.log('=== Advanced Query Parameter Handling ===\n');

// Example 1: Building complex filter queries
console.log('1. Complex Filter Queries');

function buildFilterQuery(baseUrl, filters) {
  const url = new URL(baseUrl);

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return; // Skip null/undefined
    }

    if (Array.isArray(value)) {
      // Multiple values for same key
      value.forEach(v => url.searchParams.append(key, v));
    } else if (typeof value === 'object') {
      // Nested object - flatten with dot notation
      Object.entries(value).forEach(([subKey, subValue]) => {
        url.searchParams.set(`${key}.${subKey}`, subValue);
      });
    } else {
      url.searchParams.set(key, value);
    }
  });

  return url.href;
}

const filterUrl = buildFilterQuery('https://api.example.com/products', {
  category: 'electronics',
  price: { min: 100, max: 500 },
  brands: ['Sony', 'Samsung', 'LG'],
  inStock: true,
  discount: null // Will be skipped
});

console.log('Filter URL:', filterUrl);
console.log('');

// Example 2: Parsing complex query strings
console.log('2. Parsing Complex Queries');

function parseComplexQuery(urlString) {
  const url = new URL(urlString);
  const parsed = {};

  for (const [key, value] of url.searchParams) {
    // Check if key contains dot notation
    if (key.includes('.')) {
      const [mainKey, subKey] = key.split('.');
      if (!parsed[mainKey]) {
        parsed[mainKey] = {};
      }
      parsed[mainKey][subKey] = value;
    } else {
      // Check if we already have this key (multiple values)
      const existing = parsed[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          parsed[key] = [existing, value];
        }
      } else {
        parsed[key] = value;
      }
    }
  }

  return parsed;
}

const complexUrl = 'https://api.example.com/search?query=laptop&price.min=500&price.max=2000&brand=Dell&brand=HP';
const parsed = parseComplexQuery(complexUrl);
console.log('Parsed structure:', JSON.stringify(parsed, null, 2));
console.log('');

// Example 3: Query parameter merging strategies
console.log('3. Merge Strategies');

function mergeQueryParams(url1String, url2String) {
  const url1 = new URL(url1String);
  const url2 = new URL(url2String);

  // Merge all params from url2 into url1
  for (const [key, value] of url2.searchParams) {
    url1.searchParams.set(key, value);
  }

  return url1.href;
}

const base = 'https://example.com/search?q=original&page=1';
const updates = 'https://example.com/search?page=2&sort=date';
const merged = mergeQueryParams(base, updates);

console.log('Base:', base);
console.log('Updates:', updates);
console.log('Merged:', merged);
console.log('');

// Example 4: Conditional parameters
console.log('4. Conditional Parameters');

function buildUrlWithConditions(baseUrl, params, conditions) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    const condition = conditions[key];

    if (condition === undefined || condition === true) {
      // No condition or condition is true - add parameter
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  });

  return url.href;
}

const apiUrl = buildUrlWithConditions(
  'https://api.example.com/users',
  {
    role: 'admin',
    status: 'active',
    includeDeleted: true,
    debug: true
  },
  {
    role: true,
    status: true,
    includeDeleted: false, // Won't be added
    debug: process.env.NODE_ENV === 'development' // Conditional on environment
  }
);

console.log('Conditional URL:', apiUrl);
console.log('');

// Example 5: Query string templates
console.log('5. Query String Templates');

class QueryBuilder {
  constructor(baseUrl) {
    this.url = new URL(baseUrl);
  }

  where(field, operator, value) {
    this.url.searchParams.append('filter', `${field}${operator}${value}`);
    return this;
  }

  orderBy(field, direction = 'asc') {
    this.url.searchParams.set('sort', field);
    this.url.searchParams.set('order', direction);
    return this;
  }

  paginate(page, limit) {
    this.url.searchParams.set('page', page);
    this.url.searchParams.set('limit', limit);
    return this;
  }

  fields(...fields) {
    this.url.searchParams.set('fields', fields.join(','));
    return this;
  }

  build() {
    return this.url.href;
  }
}

const queryUrl = new QueryBuilder('https://api.example.com/users')
  .where('age', '>=', 18)
  .where('status', '=', 'active')
  .orderBy('createdAt', 'desc')
  .paginate(1, 20)
  .fields('id', 'name', 'email')
  .build();

console.log('Query Builder URL:', queryUrl);
console.log('');

// Example 6: Parameter encoding edge cases
console.log('6. Encoding Edge Cases');

const specialChars = {
  spaces: 'hello world',
  special: 'a+b=c&d',
  unicode: 'Hello 世界 🌍',
  url: 'https://example.com/path?key=value',
  email: 'user@example.com'
};

const url = new URL('https://example.com/test');
Object.entries(specialChars).forEach(([key, value]) => {
  url.searchParams.set(key, value);
});

console.log('URL with special chars:', url.href);
console.log('\nDecoded values:');
Object.keys(specialChars).forEach(key => {
  console.log(`  ${key}: ${url.searchParams.get(key)}`);
});
console.log('');

// Example 7: Sorting and normalizing parameters
console.log('7. Parameter Normalization');

function normalizeQueryParams(urlString) {
  const url = new URL(urlString);

  // Get all params and sort alphabetically
  const params = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b));

  // Clear and rebuild
  url.search = '';
  params.forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.href;
}

const messy = 'https://example.com?zebra=1&apple=2&mango=3&banana=4';
const normalized = normalizeQueryParams(messy);

console.log('Original:', messy);
console.log('Normalized:', normalized);
console.log('');

// Example 8: Query parameter validation
console.log('8. Parameter Validation');

function validateQueryParams(urlString, schema) {
  const url = new URL(urlString);
  const errors = [];

  Object.entries(schema).forEach(([param, validator]) => {
    const value = url.searchParams.get(param);

    if (validator.required && !value) {
      errors.push(`${param} is required`);
      return;
    }

    if (value && validator.type) {
      switch (validator.type) {
        case 'number':
          if (isNaN(value)) {
            errors.push(`${param} must be a number`);
          }
          break;
        case 'enum':
          if (!validator.values.includes(value)) {
            errors.push(`${param} must be one of: ${validator.values.join(', ')}`);
          }
          break;
        case 'pattern':
          if (!validator.pattern.test(value)) {
            errors.push(`${param} format is invalid`);
          }
          break;
      }
    }

    if (value && validator.min !== undefined && parseFloat(value) < validator.min) {
      errors.push(`${param} must be >= ${validator.min}`);
    }

    if (value && validator.max !== undefined && parseFloat(value) > validator.max) {
      errors.push(`${param} must be <= ${validator.max}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

const testUrl = 'https://example.com/api?page=5&limit=150&sort=invalid';
const validation = validateQueryParams(testUrl, {
  page: { required: true, type: 'number', min: 1 },
  limit: { required: true, type: 'number', min: 1, max: 100 },
  sort: { required: false, type: 'enum', values: ['name', 'date', 'price'] }
});

console.log('URL:', testUrl);
console.log('Valid:', validation.valid);
if (!validation.valid) {
  console.log('Errors:', validation.errors);
}
console.log('');

// Summary
console.log('=== Summary ===');
console.log('Advanced query parameter techniques:');
console.log('✓ Complex filter structures');
console.log('✓ Nested parameters with dot notation');
console.log('✓ Array parameter handling');
console.log('✓ Conditional parameter inclusion');
console.log('✓ Query builder patterns');
console.log('✓ Special character encoding');
console.log('✓ Parameter normalization');
console.log('✓ Schema-based validation');
