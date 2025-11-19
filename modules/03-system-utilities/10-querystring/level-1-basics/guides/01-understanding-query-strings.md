# Understanding Query Strings

Learn what query strings are, their format, and common use cases.

## What is a Query String?

A query string is a part of a URL that contains data in key-value pairs. It starts after a question mark (`?`) and contains parameters separated by ampersands (`&`).

### Anatomy of a URL with Query String

```
https://example.com/search?q=nodejs&category=tutorial&page=2
└─────┬────────┘ └──┬──┘ └────────────────┬──────────────────┘
   Protocol    Path         Query String
```

### Components

- **Protocol**: `https://`
- **Host**: `example.com`
- **Path**: `/search`
- **Query String**: `?q=nodejs&category=tutorial&page=2`

## Query String Format

### Basic Structure

```
?key1=value1&key2=value2&key3=value3
```

- **`?`** - Starts the query string (separates path from parameters)
- **`key=value`** - Individual parameter
- **`&`** - Separates multiple parameters

### Examples

```javascript
// Simple search
?q=nodejs

// Multiple parameters
?name=John&age=30&city=NYC

// Empty value
?search=&filter=all

// No value (flag)
?debug

// Multiple values (same key)
?color=red&color=blue&color=green
```

## Common Use Cases

### 1. Search Queries

```
https://google.com/search?q=nodejs+tutorial
https://amazon.com/s?k=laptop&min=500&max=1000
```

### 2. Pagination

```
https://example.com/products?page=2&limit=20
https://api.example.com/users?offset=40&limit=20
```

### 3. Filtering

```
https://shop.com/products?category=electronics&brand=Apple&inStock=true
```

### 4. Sorting

```
https://example.com/items?sort=price&order=asc
```

### 5. Analytics/Tracking

```
https://example.com?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale
```

## Why Use Query Strings?

### 1. Bookmarkable

URLs with query strings can be saved and shared:
```
https://maps.google.com?q=New+York&zoom=12
```

### 2. SEO-Friendly

Search engines can index pages with different parameters:
```
https://blog.com/posts?category=javascript&tag=tutorial
```

### 3. Stateless

Each request contains all needed information:
```
https://api.example.com/data?format=json&limit=100
```

### 4. Simple

Easy to construct and understand:
```javascript
const url = `/search?q=${searchTerm}`;
```

## Best Practices

### ✅ Do

- Use descriptive parameter names (`category`, not `cat`)
- Keep query strings readable
- Encode special characters
- Use consistent naming (camelCase or snake_case)

### ❌ Don't

- Put sensitive data in query strings (passwords, tokens)
- Create extremely long query strings (use POST)
- Use unclear abbreviations
- Mix naming conventions

## Real-World Example

```javascript
// E-commerce product search
const searchUrl = buildUrl('/products', {
  q: 'laptop',           // Search term
  category: 'electronics', // Filter
  minPrice: 500,         // Range filter
  maxPrice: 2000,        // Range filter
  sort: 'price',         // Sort field
  order: 'asc',          // Sort direction
  page: 1,               // Pagination
  limit: 20              // Results per page
});

// Result:
// /products?q=laptop&category=electronics&minPrice=500&maxPrice=2000&sort=price&order=asc&page=1&limit=20
```

## Summary

- Query strings pass data via URLs
- Format: `?key1=value1&key2=value2`
- Used for search, filters, pagination, tracking
- Should be bookmarkable and shareable
- Never put sensitive data in query strings
