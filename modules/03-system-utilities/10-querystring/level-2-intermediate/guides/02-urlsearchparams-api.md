# URLSearchParams Complete API Reference

Comprehensive guide to the URLSearchParams API.

## Overview

URLSearchParams is the modern WHATWG standard for query string handling, providing a rich API for manipulation.

## Creating URLSearchParams

```javascript
// From string
const params1 = new URLSearchParams('name=John&age=30');

// From object
const params2 = new URLSearchParams({ name: 'John', age: '30' });

// From array of pairs
const params3 = new URLSearchParams([['name', 'John'], ['age', '30']]);

// Empty
const params4 = new URLSearchParams();
```

## Reading Methods

### get(key)
Returns first value for key, or null if not found.

```javascript
const params = new URLSearchParams('name=John&age=30');
console.log(params.get('name')); // 'John'
console.log(params.get('missing')); // null
```

### getAll(key)
Returns array of all values for key.

```javascript
const params = new URLSearchParams('tag=a&tag=b&tag=c');
console.log(params.getAll('tag')); // ['a', 'b', 'c']
console.log(params.getAll('missing')); // []
```

### has(key)
Checks if key exists.

```javascript
const params = new URLSearchParams('name=John');
console.log(params.has('name')); // true
console.log(params.has('age')); // false
```

## Writing Methods

### set(key, value)
Sets key to single value (replaces all existing).

```javascript
const params = new URLSearchParams('a=1&a=2');
params.set('a', '3');
console.log(params.toString()); // 'a=3'
```

### append(key, value)
Adds value to key (creates array).

```javascript
const params = new URLSearchParams();
params.append('tag', 'a');
params.append('tag', 'b');
console.log(params.toString()); // 'tag=a&tag=b'
```

### delete(key)
Removes all values for key.

```javascript
const params = new URLSearchParams('a=1&b=2&c=3');
params.delete('b');
console.log(params.toString()); // 'a=1&c=3'
```

## Iteration Methods

### forEach(callback)
```javascript
params.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});
```

### entries()
```javascript
for (const [key, value] of params.entries()) {
  console.log(key, value);
}
```

### keys()
```javascript
for (const key of params.keys()) {
  console.log(key);
}
```

### values()
```javascript
for (const value of params.values()) {
  console.log(value);
}
```

## Utility Methods

### sort()
Sorts parameters alphabetically by key.

```javascript
const params = new URLSearchParams('z=3&a=1&m=2');
params.sort();
console.log(params.toString()); // 'a=1&m=2&z=3'
```

### toString()
Converts to query string.

```javascript
const params = new URLSearchParams({ a: '1', b: '2' });
console.log(params.toString()); // 'a=1&b=2'
```

## Best Practices

1. Use `getAll()` when expecting arrays
2. Use `set()` to replace, `append()` to add
3. Always check `has()` before `get()`
4. Use iteration for processing all parameters
5. Call `sort()` for consistent ordering
6. Prefer URLSearchParams for new code

## Common Patterns

### Convert to Object
```javascript
const obj = Object.fromEntries(params);
```

### Clone Parameters
```javascript
const clone = new URLSearchParams(params.toString());
```

### Merge Parameters
```javascript
const merged = new URLSearchParams(params1);
params2.forEach((value, key) => merged.append(key, value));
```

URLSearchParams provides a powerful, standard API for modern query string handling.
