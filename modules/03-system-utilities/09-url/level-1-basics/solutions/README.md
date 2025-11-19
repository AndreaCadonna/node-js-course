# Level 1: Solutions

This directory contains complete solutions to all Level 1 exercises.

## How to Use These Solutions

1. **Try the exercises first** - Don't look at solutions immediately
2. **Compare approaches** - Your solution may differ but still be correct
3. **Learn from differences** - Understand why certain approaches are better
4. **Run the solutions** - Execute them to see the output

## Solutions Overview

### Exercise 1: URL Parsing and Component Extraction
**File**: `exercise-1-solution.js`

Demonstrates:
- Parsing URLs with try-catch
- Extracting all URL components
- Converting query params to objects
- Checking protocols
- Comparing origins

### Exercise 2: Working with Query Parameters
**File**: `exercise-2-solution.js`

Demonstrates:
- Adding query parameters with `set()`
- Updating existing parameters
- Removing parameters with `delete()`
- Handling array parameters with `append()`
- Using `getAll()` for multiple values

### Exercise 3: URL Building and Modification
**File**: `exercise-3-solution.js`

Demonstrates:
- Building URLs from components
- Modifying protocols, hostnames, paths
- Cloning URLs before modification
- Building pagination URLs
- Programmatic URL construction

### Exercise 4: URL Validation
**File**: `exercise-4-solution.js`

Demonstrates:
- Basic URL validation with error messages
- Protocol validation (HTTP/HTTPS only)
- Domain whitelisting
- Required parameter validation
- Comprehensive multi-criteria validation

### Exercise 5: Practical URL Operations
**File**: `exercise-5-solution.js`

Demonstrates:
- Building API URLs with filters
- Parsing HTTP request URLs
- Safe redirect validation
- URL normalization
- Grouping query parameters

## Running Solutions

```bash
# Run individual solutions
node exercise-1-solution.js
node exercise-2-solution.js
node exercise-3-solution.js
node exercise-4-solution.js
node exercise-5-solution.js

# Run all solutions
for file in exercise-*-solution.js; do
  echo "Running $file"
  node "$file"
  echo ""
done
```

## Key Takeaways

From these solutions, you should understand:

1. **Error Handling**: Always use try-catch when parsing URLs
2. **URLSearchParams**: Use it for all query parameter operations
3. **Immutability**: Clone URLs before modifying if you need the original
4. **Validation**: Never trust user input - validate everything
5. **Security**: Whitelist protocols and domains for redirects

## Common Patterns

### Safe URL Parsing
```javascript
try {
  const url = new URL(urlString);
  // Use url
} catch (err) {
  // Handle invalid URL
}
```

### Query Parameter Manipulation
```javascript
const url = new URL('https://example.com');
url.searchParams.set('key', 'value');    // Set/replace
url.searchParams.append('tag', 'value'); // Add multiple
url.searchParams.delete('key');           // Remove
```

### URL Validation
```javascript
function isValid(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

## Next Steps

After reviewing these solutions:
1. Retry the exercises if you struggled
2. Experiment with variations
3. Move on to Level 2: Intermediate
4. Apply these patterns in real projects

Happy coding!
