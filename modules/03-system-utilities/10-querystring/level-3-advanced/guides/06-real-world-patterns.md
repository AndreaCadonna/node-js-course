# Real-World Patterns Guide

## Overview

This guide covers real-world patterns and best practices for using query strings in production applications, with examples from popular services.

## Table of Contents

1. [E-Commerce Patterns](#e-commerce-patterns)
2. [Search Engine Patterns](#search-engine-patterns)
3. [Social Media Patterns](#social-media-patterns)
4. [Analytics Patterns](#analytics-patterns)
5. [API Design Patterns](#api-design-patterns)
6. [Mobile App Patterns](#mobile-app-patterns)

## E-Commerce Patterns

### Product Filtering

Real-world examples from major e-commerce sites:

```javascript
// Amazon-style filters
// /products?k=laptop&i=electronics&rh=p_36:50000-100000,p_72:1249807011
class AmazonStyleFilters {
  static parse(query) {
    return {
      keyword: query.k,
      category: query.i,
      refinements: this.parseRefinements(query.rh),
      page: parseInt(query.page) || 1,
      sort: query.s || 'relevance'
    };
  }

  static parseRefinements(rhString) {
    if (!rhString) return {};

    // rh format: "p_36:50000-100000,p_72:1249807011"
    const refinements = {};
    const parts = rhString.split(',');

    for (const part of parts) {
      const [key, value] = part.split(':');
      if (key === 'p_36') {
        // Price range
        const [min, max] = value.split('-');
        refinements.priceMin = parseInt(min);
        refinements.priceMax = parseInt(max);
      } else if (key === 'p_72') {
        // Customer review
        refinements.reviewRating = parseInt(value);
      }
    }

    return refinements;
  }

  static build(filters) {
    const params = {};

    if (filters.keyword) params.k = filters.keyword;
    if (filters.category) params.i = filters.category;
    if (filters.page > 1) params.page = filters.page;
    if (filters.sort !== 'relevance') params.s = filters.sort;

    // Build refinements
    const rh = [];
    if (filters.priceMin || filters.priceMax) {
      rh.push(`p_36:${filters.priceMin || 0}-${filters.priceMax || 999999}`);
    }
    if (filters.reviewRating) {
      rh.push(`p_72:${filters.reviewRating}`);
    }

    if (rh.length > 0) {
      params.rh = rh.join(',');
    }

    return querystring.stringify(params);
  }
}

// eBay-style filters
// /sch?_nkw=laptop&_sacat=58058&_udlo=500&_udhi=1000
class eBayStyleFilters {
  static parse(query) {
    return {
      keyword: query._nkw,
      category: query._sacat,
      priceMin: parseFloat(query._udlo),
      priceMax: parseFloat(query._udhi),
      condition: query._mPrRngCbx === '1', // New only
      buyItNow: query._sop === '10',
      localPickup: query._LH_PrefLoc === '2'
    };
  }
}

// Shopify-style filters
// /collections/all?filter.v.price.gte=50&filter.v.price.lte=200&sort_by=price-ascending
class ShopifyStyleFilters {
  static parse(query) {
    const filters = {};

    for (const [key, value] of Object.entries(query)) {
      if (key.startsWith('filter.v.')) {
        // Extract field and operator
        const parts = key.replace('filter.v.', '').split('.');
        const field = parts[0];
        const operator = parts[1];

        if (!filters[field]) filters[field] = {};
        filters[field][operator] = value;
      }
    }

    return {
      filters,
      sortBy: query.sort_by,
      page: parseInt(query.page) || 1
    };
  }
}
```

### Shopping Cart State

```javascript
class CartQueryManager {
  // Encode cart items in URL for sharing
  static encodeCart(items) {
    // Compact encoding: "id1:qty1,id2:qty2"
    const encoded = items
      .map(item => `${item.id}:${item.quantity}`)
      .join(',');

    return querystring.stringify({ cart: encoded });
  }

  static decodeCart(queryStr) {
    const params = querystring.parse(queryStr);
    if (!params.cart) return [];

    return params.cart.split(',').map(item => {
      const [id, quantity] = item.split(':');
      return {
        id: parseInt(id),
        quantity: parseInt(quantity)
      };
    });
  }

  // Alternative: Base64 encoding for complex cart data
  static encodeCartBase64(items) {
    const json = JSON.stringify(items);
    const encoded = Buffer.from(json).toString('base64');

    return querystring.stringify({ cart: encoded });
  }

  static decodeCartBase64(queryStr) {
    const params = querystring.parse(queryStr);
    if (!params.cart) return [];

    const json = Buffer.from(params.cart, 'base64').toString();
    return JSON.parse(json);
  }
}

// Usage: Shareable cart links
const shareableUrl = `/cart?${CartQueryManager.encodeCart([
  { id: 123, quantity: 2 },
  { id: 456, quantity: 1 }
])}`;
// Result: /cart?cart=123:2,456:1
```

### Price Range Slider

```javascript
class PriceRangeManager {
  static updateUrl(min, max) {
    const url = new URL(window.location);

    if (min > 0) {
      url.searchParams.set('price_min', min);
    } else {
      url.searchParams.delete('price_min');
    }

    if (max < Infinity) {
      url.searchParams.set('price_max', max);
    } else {
      url.searchParams.delete('price_max');
    }

    // Update URL without reload
    window.history.pushState({}, '', url);

    return url.search;
  }

  static syncFromUrl() {
    const params = new URLSearchParams(window.location.search);

    return {
      min: parseInt(params.get('price_min')) || 0,
      max: parseInt(params.get('price_max')) || Infinity
    };
  }

  // Debounced URL update
  static createDebouncedUpdater(delay = 500) {
    let timer;

    return (min, max) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.updateUrl(min, max);
      }, delay);
    };
  }
}
```

## Search Engine Patterns

### Google-style Search

```javascript
// Google query: ?q=node.js+tutorial&start=10&num=20&sort=date
class GoogleStyleSearch {
  static parse(query) {
    return {
      q: query.q?.replace(/\+/g, ' '), // Query terms
      start: parseInt(query.start) || 0, // Offset
      num: parseInt(query.num) || 10, // Results per page
      sort: query.sort || 'relevance',
      tbs: this.parseTimeRange(query.tbs), // Time-based search
      lr: query.lr, // Language restrict
      safe: query.safe === 'active' // Safe search
    };
  }

  static parseTimeRange(tbs) {
    if (!tbs) return null;

    // tbs format: "qdr:d" (day), "qdr:w" (week), "qdr:m" (month), "qdr:y" (year)
    const match = tbs.match(/qdr:([dwmy])/);
    if (!match) return null;

    const units = { d: 'day', w: 'week', m: 'month', y: 'year' };
    return units[match[1]];
  }

  static build(options) {
    const params = {};

    if (options.q) params.q = options.q.replace(/ /g, '+');
    if (options.start > 0) params.start = options.start;
    if (options.num !== 10) params.num = options.num;
    if (options.sort !== 'relevance') params.sort = options.sort;

    if (options.timeRange) {
      const units = { day: 'd', week: 'w', month: 'm', year: 'y' };
      params.tbs = `qdr:${units[options.timeRange]}`;
    }

    return querystring.stringify(params);
  }
}
```

### Faceted Search

```javascript
class FacetedSearch {
  static buildFacetedUrl(query, facets) {
    const params = {
      q: query,
      ...this.encodeFacets(facets)
    };

    return querystring.stringify(params);
  }

  static encodeFacets(facets) {
    const encoded = {};

    for (const [category, values] of Object.entries(facets)) {
      if (values.length === 1) {
        // Single value: facet_category=value
        encoded[`facet_${category}`] = values[0];
      } else if (values.length > 1) {
        // Multiple values: facet_category=value1,value2
        encoded[`facet_${category}`] = values.join(',');
      }
    }

    return encoded;
  }

  static parseFacets(params) {
    const facets = {};

    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('facet_')) {
        const category = key.substring(6);
        facets[category] = value.includes(',')
          ? value.split(',')
          : [value];
      }
    }

    return facets;
  }

  // Build facet toggle URL (add/remove facet value)
  static toggleFacet(currentUrl, category, value) {
    const url = new URL(currentUrl, 'http://localhost');
    const params = new URLSearchParams(url.search);

    const facetKey = `facet_${category}`;
    const current = params.get(facetKey);

    if (!current) {
      // Add facet
      params.set(facetKey, value);
    } else {
      const values = current.split(',');
      const index = values.indexOf(value);

      if (index === -1) {
        // Add value
        values.push(value);
        params.set(facetKey, values.join(','));
      } else {
        // Remove value
        values.splice(index, 1);

        if (values.length === 0) {
          params.delete(facetKey);
        } else {
          params.set(facetKey, values.join(','));
        }
      }
    }

    return url.pathname + '?' + params.toString();
  }
}
```

### Search Suggestions

```javascript
class SearchSuggestions {
  static buildSuggestionUrl(query, options = {}) {
    return querystring.stringify({
      q: query,
      suggest: 1,
      limit: options.limit || 10,
      types: options.types?.join(',') // products, categories, brands
    });
  }

  static trackSearchQuery(query, resultCount) {
    // Track for analytics
    return querystring.stringify({
      event: 'search',
      q: query,
      results: resultCount,
      timestamp: Date.now()
    });
  }
}
```

## Social Media Patterns

### Twitter-style Filters

```javascript
// Twitter: ?q=nodejs&f=live&since=2024-01-01&lang=en
class TwitterStyleFilters {
  static parse(query) {
    return {
      q: query.q, // Search query
      filter: query.f, // live, user, image, video
      since: query.since, // Date YYYY-MM-DD
      until: query.until,
      lang: query.lang, // Language code
      result_type: query.result_type // recent, popular, mixed
    };
  }

  static buildAdvancedSearch(options) {
    let query = options.words;

    // Exact phrase
    if (options.phrase) {
      query += ` "${options.phrase}"`;
    }

    // Exclude words
    if (options.exclude) {
      query += ` -${options.exclude}`;
    }

    // Hashtags
    if (options.hashtags) {
      query += ` #${options.hashtags}`;
    }

    // From user
    if (options.from) {
      query += ` from:${options.from}`;
    }

    // To user
    if (options.to) {
      query += ` to:${options.to}`;
    }

    // Minimum likes
    if (options.minLikes) {
      query += ` min_faves:${options.minLikes}`;
    }

    return querystring.stringify({
      q: query,
      f: options.filter,
      since: options.since,
      until: options.until,
      lang: options.lang
    });
  }
}
```

### Instagram-style Tags

```javascript
// Instagram uses hashtags in URLs: /explore/tags/nodejs/
class InstagramStyleTags {
  static buildTagUrl(tag) {
    return `/explore/tags/${encodeURIComponent(tag)}/`;
  }

  static buildMultiTagSearch(tags) {
    // Use query params for multiple tags
    return '/explore/?' + querystring.stringify({
      tags: tags.join(',')
    });
  }
}
```

## Analytics Patterns

### Google Analytics UTM Parameters

```javascript
class UTMParameters {
  static build(url, campaign) {
    const utmParams = {
      utm_source: campaign.source, // google, newsletter, facebook
      utm_medium: campaign.medium, // cpc, email, social
      utm_campaign: campaign.name, // spring_sale, product_launch
      utm_term: campaign.term, // paid keywords
      utm_content: campaign.content // ad_variant_a, link_1
    };

    // Remove undefined values
    Object.keys(utmParams).forEach(key =>
      utmParams[key] === undefined && delete utmParams[key]
    );

    const separator = url.includes('?') ? '&' : '?';
    return url + separator + querystring.stringify(utmParams);
  }

  static parse(url) {
    const urlObj = new URL(url);
    const params = Object.fromEntries(urlObj.searchParams);

    return {
      source: params.utm_source,
      medium: params.utm_medium,
      campaign: params.utm_campaign,
      term: params.utm_term,
      content: params.utm_content
    };
  }

  // Campaign URL builder
  static createCampaignUrl(baseUrl, campaign) {
    return this.build(baseUrl, {
      source: campaign.source,
      medium: campaign.medium,
      name: campaign.name,
      term: campaign.keywords,
      content: campaign.variation
    });
  }
}

// Usage
const campaignUrl = UTMParameters.createCampaignUrl(
  'https://example.com/product',
  {
    source: 'google',
    medium: 'cpc',
    name: 'spring_sale_2024',
    keywords: 'nodejs+course',
    variation: 'ad_variant_a'
  }
);
// Result: https://example.com/product?utm_source=google&utm_medium=cpc...
```

### Event Tracking

```javascript
class EventTracker {
  static buildTrackingPixel(event, properties) {
    const params = {
      e: event.name,
      t: Date.now(),
      uid: event.userId,
      sid: event.sessionId,
      ...this.flattenProperties(properties)
    };

    return `https://analytics.example.com/t.gif?${querystring.stringify(params)}`;
  }

  static flattenProperties(obj, prefix = 'p') {
    const result = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = `${prefix}_${key}`;

      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenProperties(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  // Batch events for efficiency
  static buildBatchUrl(events) {
    const encoded = events.map(e => {
      const params = {
        e: e.name,
        t: e.timestamp,
        ...this.flattenProperties(e.properties)
      };
      return querystring.stringify(params);
    }).join('|');

    return `https://analytics.example.com/batch?events=${encodeURIComponent(encoded)}`;
  }
}
```

## API Design Patterns

### Pagination Strategies

```javascript
// Offset-based (traditional)
class OffsetPagination {
  static build(page, limit) {
    return querystring.stringify({
      page,
      limit,
      offset: (page - 1) * limit
    });
  }
}

// Cursor-based (for large datasets)
class CursorPagination {
  static build(cursor, limit) {
    return querystring.stringify({
      cursor: cursor ? Buffer.from(cursor).toString('base64') : undefined,
      limit
    });
  }

  static parse(params) {
    return {
      cursor: params.cursor
        ? Buffer.from(params.cursor, 'base64').toString()
        : null,
      limit: parseInt(params.limit) || 20
    };
  }

  static createCursor(lastItem) {
    // Cursor typically includes the last item's ID and sort key
    return JSON.stringify({
      id: lastItem.id,
      sort: lastItem.createdAt
    });
  }
}

// Keyset pagination (most efficient for large datasets)
class KeysetPagination {
  static build(lastId, lastValue, limit) {
    return querystring.stringify({
      after_id: lastId,
      after_value: lastValue,
      limit
    });
  }
}
```

### Filtering DSL

```javascript
// MongoDB-style query language
class MongoStyleFilters {
  static build(filters) {
    // Convert to MongoDB query syntax
    const query = {};

    for (const [field, condition] of Object.entries(filters)) {
      if (typeof condition === 'object') {
        query[field] = condition; // { $gt: 100, $lt: 200 }
      } else {
        query[field] = condition;
      }
    }

    // Encode as JSON
    return querystring.stringify({
      q: JSON.stringify(query)
    });
  }

  static parse(params) {
    if (!params.q) return {};
    return JSON.parse(params.q);
  }
}

// Usage
const filterUrl = MongoStyleFilters.build({
  price: { $gte: 100, $lte: 1000 },
  category: 'electronics',
  rating: { $gte: 4 }
});
// Result: q={"price":{"$gte":100,"$lte":1000},"category":"electronics","rating":{"$gte":4}}
```

## Mobile App Patterns

### Deep Linking

```javascript
class DeepLinkBuilder {
  // Universal Links / App Links
  static buildUniversalLink(path, params) {
    return `https://example.com/${path}?${querystring.stringify({
      ...params,
      utm_source: 'app',
      utm_medium: 'deep_link'
    })}`;
  }

  // Custom URL scheme
  static buildCustomScheme(action, params) {
    return `myapp://${action}?${querystring.stringify(params)}`;
  }

  // Branch.io style deferred deep link
  static buildDeferredLink(destination, campaign) {
    return querystring.stringify({
      destination,
      campaign_id: campaign.id,
      feature: campaign.feature,
      channel: campaign.channel,
      tags: campaign.tags?.join(',')
    });
  }
}

// Usage
const productLink = DeepLinkBuilder.buildUniversalLink('products/123', {
  variant: 'red',
  size: 'large',
  source: 'email_campaign'
});

const appLink = DeepLinkBuilder.buildCustomScheme('product', {
  id: 123,
  action: 'view'
});
```

### App State Restoration

```javascript
class AppStateManager {
  static encodeState(state) {
    // Compress and encode app state for sharing
    const json = JSON.stringify(state);
    const compressed = this.compress(json);
    const encoded = Buffer.from(compressed).toString('base64url');

    return querystring.stringify({ state: encoded });
  }

  static decodeState(params) {
    if (!params.state) return null;

    const compressed = Buffer.from(params.state, 'base64url');
    const json = this.decompress(compressed);
    return JSON.parse(json);
  }

  static compress(str) {
    // Implement compression (e.g., using pako/zlib)
    return str; // Simplified
  }

  static decompress(buffer) {
    // Implement decompression
    return buffer.toString();
  }
}
```

## Best Practices Summary

1. **Keep URLs readable** - Use meaningful parameter names
2. **Be consistent** - Use the same patterns across your application
3. **Document your schema** - Clearly document expected parameters
4. **Handle backwards compatibility** - Support old parameter formats
5. **Validate input** - Always validate query parameters
6. **Limit URL length** - Stay under 2000 characters
7. **Use semantic names** - `sort` not `s`, `category` not `cat`
8. **Consider SEO** - Use clean, descriptive URLs when possible
9. **Enable sharing** - Make filtered/sorted URLs shareable
10. **Track usage** - Monitor which parameters are actually used

## Common Pitfalls to Avoid

1. Exposing internal database structure in parameters
2. Not handling special characters properly
3. Using ambiguous parameter names
4. Not providing defaults for optional parameters
5. Breaking bookmarked URLs with parameter changes
6. Not sanitizing user input
7. Creating overly complex parameter schemas
8. Not considering mobile URL length limits
9. Forgetting to encode/decode properly
10. Not testing edge cases

## Additional Resources

- [URL Design Best Practices](https://www.nngroup.com/articles/url-as-ui/)
- [REST API URL Design](https://restfulapi.net/resource-naming/)
- [Google URL Parameters](https://developers.google.com/custom-search/docs/xml_results)
- [UTM Parameters Guide](https://support.google.com/analytics/answer/1033863)
