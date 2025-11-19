/**
 * Example 6: Real-World Application Patterns
 *
 * Complete examples of query string usage in production applications.
 */

const querystring = require('querystring');

// E-commerce Product Filter System
class ProductFilterSystem {
  constructor() {
    this.products = this.generateSampleProducts();
  }

  generateSampleProducts() {
    return [
      { id: 1, name: 'Laptop', category: 'electronics', price: 999, brand: 'TechCo', rating: 4.5 },
      { id: 2, name: 'Mouse', category: 'electronics', price: 29, brand: 'TechCo', rating: 4.2 },
      { id: 3, name: 'Desk', category: 'furniture', price: 299, brand: 'HomeCo', rating: 4.0 },
      { id: 4, name: 'Chair', category: 'furniture', price: 199, brand: 'HomeCo', rating: 4.7 },
      { id: 5, name: 'Monitor', category: 'electronics', price: 399, brand: 'TechCo', rating: 4.8 }
    ];
  }

  search(queryStr) {
    const filters = this.parseFilters(queryStr);
    let results = [...this.products];

    // Apply filters
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }

    if (filters.brand) {
      results = results.filter(p => p.brand === filters.brand);
    }

    if (filters.minPrice) {
      results = results.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.minRating) {
      results = results.filter(p => p.rating >= filters.minRating);
    }

    // Sort
    if (filters.sort) {
      results.sort((a, b) => {
        const order = filters.order === 'desc' ? -1 : 1;
        return (a[filters.sort] - b[filters.sort]) * order;
      });
    }

    // Paginate
    const total = results.length;
    const start = (filters.page - 1) * filters.limit;
    const end = start + filters.limit;
    results = results.slice(start, end);

    return {
      products: results,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      },
      filters: filters,
      filterUrl: this.buildFilterUrl(filters)
    };
  }

  parseFilters(queryStr) {
    const params = querystring.parse(queryStr);

    return {
      category: params.category || null,
      brand: params.brand || null,
      minPrice: params.minPrice ? Number(params.minPrice) : null,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : null,
      minRating: params.minRating ? Number(params.minRating) : null,
      sort: params.sort || 'price',
      order: params.order || 'asc',
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 10
    };
  }

  buildFilterUrl(filters) {
    const params = {};

    if (filters.category) params.category = filters.category;
    if (filters.brand) params.brand = filters.brand;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.minRating) params.minRating = filters.minRating;
    if (filters.sort) params.sort = filters.sort;
    if (filters.order !== 'asc') params.order = filters.order;
    if (filters.page > 1) params.page = filters.page;
    if (filters.limit !== 10) params.limit = filters.limit;

    return '/products?' + querystring.stringify(params);
  }
}

// Analytics Event Tracker
class AnalyticsTracker {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.events = [];
  }

  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      properties
    };

    this.events.push(event);
    return this.buildTrackingUrl(event);
  }

  buildTrackingUrl(event) {
    const params = {
      e: event.name,
      t: event.timestamp,
      ...this.flattenProperties(event.properties)
    };

    return `${this.baseUrl}?${querystring.stringify(params)}`;
  }

  flattenProperties(obj, prefix = 'p') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const paramKey = `${prefix}_${key}`;

      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenProperties(value, paramKey));
      } else {
        result[paramKey] = value;
      }
    }

    return result;
  }

  parseTrackingUrl(url) {
    const [_, queryStr] = url.split('?');
    const params = querystring.parse(queryStr);

    return {
      name: params.e,
      timestamp: params.t,
      properties: this.unflattenProperties(params)
    };
  }

  unflattenProperties(params) {
    const result = {};

    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('p_')) {
        const propKey = key.substring(2);
        result[propKey] = value;
      }
    }

    return result;
  }
}

// Search Engine with Advanced Features
class SearchEngine {
  constructor() {
    this.documents = this.generateSampleDocuments();
  }

  generateSampleDocuments() {
    return [
      { id: 1, title: 'Node.js Guide', content: 'Learn Node.js fundamentals', tags: ['nodejs', 'javascript'] },
      { id: 2, title: 'Express Tutorial', content: 'Build web apps with Express', tags: ['nodejs', 'express', 'web'] },
      { id: 3, title: 'React Basics', content: 'Getting started with React', tags: ['react', 'javascript', 'frontend'] },
      { id: 4, title: 'TypeScript Deep Dive', content: 'Master TypeScript', tags: ['typescript', 'javascript'] }
    ];
  }

  search(queryStr) {
    const params = this.parseSearchParams(queryStr);
    let results = [...this.documents];

    // Text search
    if (params.q) {
      const query = params.q.toLowerCase();
      results = results.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.content.toLowerCase().includes(query)
      );
    }

    // Tag filtering
    if (params.tags && params.tags.length > 0) {
      results = results.filter(doc =>
        params.tags.some(tag => doc.tags.includes(tag))
      );
    }

    // Highlighting
    if (params.highlight && params.q) {
      results = results.map(doc => ({
        ...doc,
        highlightedTitle: this.highlight(doc.title, params.q),
        highlightedContent: this.highlight(doc.content, params.q)
      }));
    }

    return {
      query: params.q,
      results: results,
      count: results.length,
      searchUrl: this.buildSearchUrl(params),
      suggestions: this.generateSuggestions(params.q)
    };
  }

  parseSearchParams(queryStr) {
    const params = querystring.parse(queryStr);

    return {
      q: params.q || '',
      tags: params.tags ? (Array.isArray(params.tags) ? params.tags : [params.tags]) : [],
      highlight: params.highlight === 'true',
      page: params.page ? Number(params.page) : 1,
      limit: params.limit ? Number(params.limit) : 10
    };
  }

  buildSearchUrl(params) {
    const urlParams = {};

    if (params.q) urlParams.q = params.q;
    if (params.tags.length > 0) urlParams.tags = params.tags;
    if (params.highlight) urlParams.highlight = 'true';
    if (params.page > 1) urlParams.page = params.page;
    if (params.limit !== 10) urlParams.limit = params.limit;

    return '/search?' + querystring.stringify(urlParams);
  }

  highlight(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  generateSuggestions(query) {
    // Simple suggestion system
    const allTags = new Set();
    this.documents.forEach(doc => doc.tags.forEach(tag => allTags.add(tag)));

    return Array.from(allTags)
      .filter(tag => tag.includes(query.toLowerCase()))
      .slice(0, 5);
  }
}

// API Client with Query Builder
class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  buildRequest(endpoint, options = {}) {
    const {
      filters = {},
      sort = null,
      include = [],
      fields = {},
      page = null,
      limit = null
    } = options;

    const params = {};

    // Filters
    for (const [key, value] of Object.entries(filters)) {
      params[`filter[${key}]`] = value;
    }

    // Sort
    if (sort) {
      params.sort = sort;
    }

    // Include relationships
    if (include.length > 0) {
      params.include = include.join(',');
    }

    // Sparse fieldsets
    for (const [resource, fieldList] of Object.entries(fields)) {
      params[`fields[${resource}]`] = fieldList.join(',');
    }

    // Pagination
    if (page) params['page[number]'] = page;
    if (limit) params['page[size]'] = limit;

    const queryStr = querystring.stringify(params);
    return `${this.baseUrl}${endpoint}${queryStr ? '?' + queryStr : ''}`;
  }
}

// Demo
console.log('=== Real-World Application Patterns ===\n');

// E-commerce filtering
console.log('1. E-commerce Product Filtering:');
const shop = new ProductFilterSystem();
const searchResults = shop.search('category=electronics&minPrice=100&sort=price&order=asc');
console.log('Products found:', searchResults.products.length);
console.log('Filter URL:', searchResults.filterUrl);
console.log('First product:', searchResults.products[0]);
console.log('');

// Analytics tracking
console.log('2. Analytics Event Tracking:');
const tracker = new AnalyticsTracker('https://analytics.example.com/track');
const trackingUrl = tracker.track('page_view', {
  page: '/products',
  user: { id: 123, tier: 'premium' },
  device: 'mobile'
});
console.log('Tracking URL:', trackingUrl);
console.log('');

// Search engine
console.log('3. Search Engine:');
const search = new SearchEngine();
const searchResult = search.search('q=node&tags=javascript&highlight=true');
console.log('Search query:', searchResult.query);
console.log('Results:', searchResult.count);
console.log('Search URL:', searchResult.searchUrl);
console.log('Suggestions:', searchResult.suggestions);
console.log('');

// API client
console.log('4. REST API Client:');
const api = new ApiClient('https://api.example.com');
const requestUrl = api.buildRequest('/articles', {
  filters: { status: 'published', author: 'john' },
  sort: '-created_at',
  include: ['author', 'comments'],
  fields: { articles: ['title', 'body'], author: ['name'] },
  page: 2,
  limit: 20
});
console.log('API Request URL:', requestUrl);

console.log('\n✓ Real-world patterns demonstrate production-ready implementations!');

module.exports = {
  ProductFilterSystem,
  AnalyticsTracker,
  SearchEngine,
  ApiClient
};
