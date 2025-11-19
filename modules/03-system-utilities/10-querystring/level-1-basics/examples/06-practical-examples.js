/**
 * Example 6: Practical Use Cases
 *
 * Real-world examples of using query strings in applications.
 */

const querystring = require('querystring');

console.log('=== Practical Query String Use Cases ===\n');

// 1. Search functionality
console.log('1. Search functionality');
function parseSearchQuery(queryStr) {
  const params = querystring.parse(queryStr);

  return {
    query: params.q || params.search || '',
    page: parseInt(params.page, 10) || 1,
    resultsPerPage: parseInt(params.limit || params.perPage, 10) || 20,
    sortBy: params.sort || 'relevance',
    filters: {
      category: params.category,
      dateRange: params.dateRange,
      author: params.author
    }
  };
}

const search = parseSearchQuery('q=nodejs&page=2&limit=50&sort=date&category=tutorials');
console.log('Search config:', search);
console.log('');

// 2. E-commerce filters
console.log('2. E-commerce product filters');
function buildFilterQuery(filters) {
  const params = {};

  // Category filter
  if (filters.category) params.cat = filters.category;

  // Price range
  if (filters.priceMin) params.min = filters.priceMin;
  if (filters.priceMax) params.max = filters.priceMax;

  // Brands (array)
  if (filters.brands && filters.brands.length) {
    params.brand = filters.brands;
  }

  // Rating
  if (filters.minRating) params.rating = filters.minRating;

  // Availability
  if (filters.inStockOnly) params.stock = 1;

  // Sort
  if (filters.sortBy) params.sort = filters.sortBy;

  return querystring.stringify(params);
}

const productFilters = {
  category: 'electronics',
  priceMin: 100,
  priceMax: 1000,
  brands: ['Apple', 'Samsung', 'Sony'],
  minRating: 4,
  inStockOnly: true,
  sortBy: 'price-asc'
};

const filterQuery = buildFilterQuery(productFilters);
console.log('Filter query:', filterQuery);
console.log('Full URL: /products?' + filterQuery);
console.log('');

// 3. Analytics tracking
console.log('3. Analytics/UTM parameters');
function buildTrackingUrl(destination, campaign) {
  const params = {
    utm_source: campaign.source,
    utm_medium: campaign.medium,
    utm_campaign: campaign.name
  };

  if (campaign.term) params.utm_term = campaign.term;
  if (campaign.content) params.utm_content = campaign.content;

  return `${destination}?${querystring.stringify(params)}`;
}

const trackingUrl = buildTrackingUrl('https://example.com/product', {
  source: 'facebook',
  medium: 'social',
  name: 'summer_sale_2024',
  content: 'banner_ad'
});

console.log('Tracking URL:', trackingUrl);
console.log('');

// 4. API pagination
console.log('4. API pagination and cursors');
class PaginationHelper {
  static buildQuery(page, limit = 20, cursor = null) {
    const params = { limit };

    if (cursor) {
      // Cursor-based pagination
      params.cursor = cursor;
    } else {
      // Offset-based pagination
      params.page = page;
      params.offset = (page - 1) * limit;
    }

    return querystring.stringify(params);
  }

  static parseQuery(queryStr) {
    const params = querystring.parse(queryStr);
    return {
      page: parseInt(params.page, 10) || 1,
      limit: parseInt(params.limit, 10) || 20,
      offset: parseInt(params.offset, 10) || 0,
      cursor: params.cursor || null
    };
  }
}

console.log('Page 1:', PaginationHelper.buildQuery(1, 20));
console.log('Page 3:', PaginationHelper.buildQuery(3, 50));
console.log('Cursor:', PaginationHelper.buildQuery(1, 20, 'abc123'));
console.log('');

// 5. Form submissions (application/x-www-form-urlencoded)
console.log('5. Form data parsing');
function parseFormData(formBody) {
  // Form data is sent as query string format in POST body
  const data = querystring.parse(formBody);

  return {
    username: data.username || '',
    email: data.email || '',
    password: data.password || '', // Should be encrypted!
    remember: data.remember === 'on' || data.remember === 'true',
    subscribe: data.subscribe === 'on'
  };
}

const formData = 'username=johndoe&email=john%40example.com&password=secret123&remember=on&subscribe=on';
const parsed = parseFormData(formData);
console.log('Form data:', formData);
console.log('Parsed:', parsed);
console.log('⚠️  Note: Never pass passwords in query strings!');
console.log('');

// 6. Shareable application state
console.log('6. Shareable application state');
class AppStateManager {
  static saveToUrl(state) {
    // Convert app state to query string
    const params = {
      view: state.viewMode,
      sort: state.sortBy,
      filter: state.activeFilter,
      selected: state.selectedItems
    };
    return querystring.stringify(params);
  }

  static loadFromUrl(queryStr) {
    const params = querystring.parse(queryStr);
    return {
      viewMode: params.view || 'grid',
      sortBy: params.sort || 'name',
      activeFilter: params.filter || 'all',
      selectedItems: Array.isArray(params.selected)
        ? params.selected
        : params.selected
        ? [params.selected]
        : []
    };
  }
}

const appState = {
  viewMode: 'list',
  sortBy: 'date',
  activeFilter: 'active',
  selectedItems: ['item1', 'item2', 'item3']
};

const stateQuery = AppStateManager.saveToUrl(appState);
console.log('State query:', stateQuery);
console.log('Restored state:', AppStateManager.loadFromUrl(stateQuery));
console.log('');

// 7. Multi-language support
console.log('7. Multi-language URLs');
function buildLocalizedUrl(path, locale, params = {}) {
  const allParams = { lang: locale, ...params };
  return `${path}?${querystring.stringify(allParams)}`;
}

console.log('English:', buildLocalizedUrl('/products', 'en', { category: 'books' }));
console.log('Spanish:', buildLocalizedUrl('/products', 'es', { category: 'books' }));
console.log('French:', buildLocalizedUrl('/products', 'fr', { category: 'books' }));
console.log('');

// 8. Debug and development flags
console.log('8. Debug and development flags');
function parseDebugFlags(queryStr) {
  const params = querystring.parse(queryStr);
  return {
    debug: params.debug === '1' || params.debug === 'true',
    verbose: params.verbose === '1',
    profile: params.profile === '1',
    mockData: params.mock === '1'
  };
}

const debugUrl = 'debug=1&verbose=1&profile=true&mock=1';
const debugFlags = parseDebugFlags(debugUrl);
console.log('Debug URL:', debugUrl);
console.log('Flags:', debugFlags);
console.log('');

// 9. API filtering and sorting
console.log('9. REST API query builder');
class ApiQueryBuilder {
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

  page(number, size = 20) {
    this.params['page[number]'] = number;
    this.params['page[size]'] = size;
    return this;
  }

  include(...relationships) {
    this.params.include = relationships.join(',');
    return this;
  }

  build() {
    return querystring.stringify(this.params);
  }
}

const apiQuery = new ApiQueryBuilder()
  .filter('status', 'published')
  .filter('author', 'john')
  .sort('createdAt', 'desc')
  .page(2, 50)
  .include('author', 'comments')
  .build();

console.log('API query:', apiQuery);
console.log('Full URL: /api/posts?' + apiQuery);
console.log('');

// 10. Social media sharing
console.log('10. Social media share URLs');
class SocialShareBuilder {
  static twitter(text, url, hashtags = []) {
    const params = {
      text: text,
      url: url
    };
    if (hashtags.length) {
      params.hashtags = hashtags.join(',');
    }
    return `https://twitter.com/intent/tweet?${querystring.stringify(params)}`;
  }

  static facebook(url) {
    return `https://www.facebook.com/sharer/sharer.php?${querystring.stringify({ u: url })}`;
  }

  static linkedin(url, title, summary) {
    const params = { url, title, summary };
    return `https://www.linkedin.com/sharing/share-offsite/?${querystring.stringify(params)}`;
  }
}

console.log('Twitter:', SocialShareBuilder.twitter(
  'Check out this article!',
  'https://example.com/article',
  ['nodejs', 'javascript']
));
console.log('');

// 11. Calendar event links
console.log('11. Google Calendar event link');
function buildCalendarLink(event) {
  const params = {
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startDate}/${event.endDate}`,
    details: event.description,
    location: event.location
  };
  return `https://calendar.google.com/calendar/render?${querystring.stringify(params)}`;
}

const calendarUrl = buildCalendarLink({
  title: 'Team Meeting',
  startDate: '20240615T100000Z',
  endDate: '20240615T110000Z',
  description: 'Quarterly review meeting',
  location: 'Conference Room A'
});

console.log('Calendar link:', calendarUrl);
console.log('');

// 12. Email links (mailto)
console.log('12. Mailto links with parameters');
function buildMailtoLink(to, subject, body, cc = [], bcc = []) {
  const params = {};
  if (subject) params.subject = subject;
  if (body) params.body = body;
  if (cc.length) params.cc = cc.join(',');
  if (bcc.length) params.bcc = bcc.join(',');

  const queryStr = querystring.stringify(params);
  return `mailto:${to}${queryStr ? '?' + queryStr : ''}`;
}

const emailLink = buildMailtoLink(
  'support@example.com',
  'Bug Report',
  'I found a bug...',
  ['manager@example.com'],
  []
);

console.log('Mailto link:', emailLink);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Search: q, page, limit, sort, filters');
console.log('✓ E-commerce: category, price range, brands, ratings');
console.log('✓ Analytics: UTM parameters for tracking');
console.log('✓ Pagination: page, limit, offset, cursor');
console.log('✓ State: Save/restore application state in URLs');
console.log('✓ APIs: Complex filtering and sorting queries');
console.log('✓ Sharing: Social media and calendar links');
