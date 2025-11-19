# Array Parameter Conventions

Understanding different ways to handle arrays in query strings.

## Why Multiple Conventions?

Different frameworks and languages handle array parameters differently. Understanding these conventions helps you:
- Work with various APIs
- Choose the right approach for your needs
- Migrate between systems
- Maintain compatibility

## Convention 1: Repeated Keys (Standard)

The most common and widely supported approach.

### Format
```
?color=red&color=blue&color=green
```

### Usage
```javascript
const qs = require('querystring');

// Parse
const params = qs.parse('color=red&color=blue&color=green');
console.log(params.color); // ['red', 'blue', 'green']

// Build
const obj = { color: ['red', 'blue', 'green'] };
const str = qs.stringify(obj);
// 'color=red&color=blue&color=green'
```

### Pros and Cons
✅ **Pros**:
- Standard and widely supported
- Parsed automatically by most frameworks
- Works with querystring and URLSearchParams
- Clear and unambiguous

❌ **Cons**:
- Longer URLs with many values
- Must handle both string and array types

## Convention 2: Bracket Notation (PHP-style)

Common in PHP applications.

### Format
```
?color[]=red&color[]=blue&color[]=green
```

### Usage
```javascript
const qs = require('querystring');

// Parse (note: brackets become part of key name)
const params = qs.parse('color[]=red&color[]=blue');
console.log(params['color[]']); // ['red', 'blue']

// Clean the key
function cleanBrackets(params) {
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    const cleanKey = key.replace(/\[\]$/, '');
    clean[cleanKey] = value;
  }
  return clean;
}
```

### Pros and Cons
✅ **Pros**:
- Clear array indicator
- PHP compatible
- Self-documenting

❌ **Cons**:
- Not natively supported by querystring module
- Requires manual parsing/cleaning
- Not as universal

## Convention 3: Comma-Separated

Compact format for simple arrays.

### Format
```
?colors=red,blue,green
```

### Usage
```javascript
const qs = require('querystring');

// Parse and split
const params = qs.parse('colors=red,blue,green');
const colors = params.colors.split(',');
// ['red', 'blue', 'green']

// Build
const colors = ['red', 'blue', 'green'];
const str = qs.stringify({ colors: colors.join(',') });
// 'colors=red,blue,green'
```

### Pros and Cons
✅ **Pros**:
- Compact URLs
- Human-readable
- Good for simple lists

❌ **Cons**:
- Problems if values contain commas
- Requires manual splitting
- Type ambiguity

## Convention 4: Indexed Parameters

Explicitly numbered parameters.

### Format
```
?color[0]=red&color[1]=blue&color[2]=green
```

### Usage
```javascript
const qs = require('querystring');

// Parse
const params = qs.parse('color[0]=red&color[1]=blue');
// { 'color[0]': 'red', 'color[1]': 'blue' }

// Convert to array
function indexedToArray(params, key) {
  const arr = [];
  let i = 0;
  while (params[`${key}[${i}]`] !== undefined) {
    arr.push(params[`${key}[${i}]`]);
    i++;
  }
  return arr;
}
```

### Pros and Cons
✅ **Pros**:
- Preserves order explicitly
- Clear structure
- No ambiguity

❌ **Cons**:
- Very verbose
- Manual parsing required
- Not widely used

## Choosing the Right Convention

### Use Repeated Keys When:
- Maximum compatibility needed
- Working with standard tools
- Building new applications
- Following REST API standards

### Use Bracket Notation When:
- Integrating with PHP systems
- Need explicit array markers
- Working with legacy code

### Use Comma-Separated When:
- URLs must be short
- Values never contain commas
- Simple string lists
- Human readability is priority

### Use Indexed When:
- Order is critical
- Need explicit positioning
- Working with complex structures

## Best Practices

1. **Be Consistent**: Choose one convention and stick with it
2. **Document Your Choice**: Make it clear in API docs
3. **Handle Both Types**: Always check if value is array or string
4. **Validate Input**: Check array values are expected type
5. **Provide Helpers**: Create utility functions for conversion

## Example: Flexible Array Handler

```javascript
const qs = require('querystring');

class ArrayHandler {
  static parse(queryStr, arrayKeys = []) {
    const params = qs.parse(queryStr);

    // Handle comma-separated
    arrayKeys.forEach(key => {
      if (params[key] && typeof params[key] === 'string' && params[key].includes(',')) {
        params[key] = params[key].split(',').map(v => v.trim());
      }
    });

    // Ensure arrays
    for (const [key, value] of Object.entries(params)) {
      if (arrayKeys.includes(key) && !Array.isArray(value)) {
        params[key] = value ? [value] : [];
      }
    }

    return params;
  }

  static stringify(obj, useCommas = false) {
    if (useCommas) {
      const converted = {};
      for (const [key, value] of Object.entries(obj)) {
        converted[key] = Array.isArray(value) ? value.join(',') : value;
      }
      return qs.stringify(converted);
    }
    return qs.stringify(obj);
  }
}

// Usage
const params = ArrayHandler.parse('colors=red,blue&sizes=M&sizes=L', ['colors']);
// { colors: ['red', 'blue'], sizes: ['M', 'L'] }
```

## Summary

- **Repeated Keys**: Standard, widely supported
- **Bracket Notation**: PHP-compatible, explicit
- **Comma-Separated**: Compact, simple
- **Indexed**: Explicit order, verbose

Choose based on your requirements, and always handle both single values and arrays safely.
