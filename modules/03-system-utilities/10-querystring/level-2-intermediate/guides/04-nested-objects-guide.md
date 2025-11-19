# Nested Objects in Query Strings

Strategies for handling nested objects since querystring doesn't support them natively.

## The Problem

Query strings are flat, but applications often need nested data:
```javascript
const filters = {
  product: { category: 'electronics', price: { min: 100, max: 1000 }},
  sort: { by: 'price', order: 'asc' }
};
```

## Solution 1: Dot Notation

Flatten using dots:
```javascript
function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

// Result: { 'product.category': 'electronics', 'product.price.min': 100, ...}
```

## Solution 2: Bracket Notation

Use brackets like arrays:
```javascript
// product[category]=electronics&product[price][min]=100
```

## Solution 3: JSON Stringify

Simple but verbose:
```javascript
const params = { filters: JSON.stringify(nested) };
```

## Best Practices

1. Keep nesting shallow (2-3 levels max)
2. Use dot notation for simple cases
3. Use JSON for complex structures
4. Document your approach
5. Consider using POST for very complex data

Choose the right strategy based on complexity and compatibility needs!
