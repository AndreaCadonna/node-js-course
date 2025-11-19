# Working with Special Characters

Learn how to safely handle special characters in query strings.

## Characters That Need Encoding

### Reserved Characters

These have special meaning in URLs and must be encoded:

```javascript
const qs = require('querystring');

// Separators
qs.escape('&');  // '%26' - Parameter separator
qs.escape('=');  // '%3D' - Key-value separator
qs.escape('?');  // '%3F' - Query string start

// URL structure
qs.escape(':');  // '%3A' - Protocol/port separator
qs.escape('/');  // '%2F' - Path separator
qs.escape('#');  // '%23' - Fragment identifier

// Other special
qs.escape('@');  // '%40' - Used in URLs
qs.escape('+');  // '%2B' - Space alternative
```

### Common Special Characters

```javascript
// Whitespace
qs.escape(' ');   // '%20' - Space
qs.escape('\t');  // '%09' - Tab
qs.escape('\n');  // '%0A' - Newline

// Punctuation
qs.escape(',');   // '%2C'
qs.escape(';');   // '%3B'
qs.escape('"');   // '%22'
qs.escape("'");   // '%27'
qs.escape('!');   // '!'    - Safe in values

// Math and symbols
qs.escape('%');   // '%25' - Important!
qs.escape('$');   // '%24'
qs.escape('<');   // '%3C'
qs.escape('>');   // '%3E'
```

## Problem Scenarios

### Ampersand in Values

```javascript
// ❌ WRONG - Ampersand breaks parsing
const bad = 'name=Tom & Jerry&category=TV';
qs.parse(bad);
// { name: 'Tom ', ' Jerry': '', category: 'TV' }
// "Tom & Jerry" is split into two parameters!

// ✅ CORRECT - Encoded ampersand
const good = 'name=Tom%20%26%20Jerry&category=TV';
qs.parse(good);
// { name: 'Tom & Jerry', category: 'TV' }
```

### Equals Sign in Values

```javascript
// ❌ WRONG - Equals sign confuses parser
const bad = 'equation=2+2=4';
// Unclear where value ends

// ✅ CORRECT
const params = { equation: '2+2=4' };
const good = qs.stringify(params);
// 'equation=2%2B2%3D4'
```

### Question Mark in Values

```javascript
// ❌ WRONG - Extra ? confuses URL parsing
const bad = 'question=What is Node.js?&page=1';

// ✅ CORRECT
const params = { question: 'What is Node.js?', page: 1 };
const good = qs.stringify(params);
// 'question=What%20is%20Node.js%3F&page=1'
```

### Hash/Fragment in Values

```javascript
// ❌ WRONG - # starts a fragment, truncates query
const url = '/page?id=123&tag=#nodejs';
// Everything after # is lost!

// ✅ CORRECT
const params = { id: 123, tag: '#nodejs' };
const good = `/page?${qs.stringify(params)}`;
// '/page?id=123&tag=%23nodejs'
```

## Handling User Input

Always encode user input:

```javascript
function buildSearchUrl(userInput) {
  // ❌ DANGEROUS - Direct interpolation
  const bad = `/search?q=${userInput}`;
  // If userInput = "a&b=c", URL is broken!

  // ✅ SAFE - Use stringify
  const good = `/search?${qs.stringify({ q: userInput })}`;
  return good;
}

// Safe with any input
buildSearchUrl('Tom & Jerry');        // Works
buildSearchUrl('2+2=4');               // Works
buildSearchUrl('user@example.com');   // Works
buildSearchUrl('What is Node.js?');   // Works
```

## Percent Sign (Special Case)

The percent sign is tricky because it's used for encoding:

```javascript
// Literal percent sign
qs.escape('100%');    // '100%25'
qs.unescape('100%25'); // '100%'

// In a value
const params = { discount: '20% off' };
qs.stringify(params);
// 'discount=20%25%20off'

qs.parse('discount=20%25%20off');
// { discount: '20% off' }
```

## Email Addresses

```javascript
const email = 'user@example.com';

// ✅ Correct encoding
const params = { email };
const query = qs.stringify(params);
// 'email=user%40example.com'

// ✅ Automatic decoding
const parsed = qs.parse(query);
// { email: 'user@example.com' }
```

## URLs as Parameters

```javascript
const redirectUrl = 'https://example.com/page?id=123&ref=home';

// ✅ Encode the entire URL
const params = { redirect: redirectUrl };
const query = qs.stringify(params);
// 'redirect=https%3A%2F%2Fexample.com%2Fpage%3Fid%3D123%26ref%3Dhome'

// Full URL
const fullUrl = `/login?${query}`;
// '/login?redirect=https%3A%2F%2Fexample.com%2Fpage%3Fid%3D123%26ref%3Dhome'
```

## Unicode and International Characters

```javascript
// Chinese characters
qs.escape('你好');
// '%E4%BD%A0%E5%A5%BD'

// Spanish characters
qs.escape('¿Hola cómo estás?');
// '%C2%BFHola%20c%C3%B3mo%20est%C3%A1s%3F'

// Emoji
qs.escape('Hello 👋 World 🌍');
// 'Hello%20%F0%9F%91%8B%20World%20%F0%9F%8C%8D'

// All decode correctly
qs.unescape('%E4%BD%A0%E5%A5%BD');
// '你好'
```

## Best Practices

### ✅ Do

```javascript
// Use stringify for automatic encoding
const params = { search: 'Tom & Jerry' };
const url = `/search?${qs.stringify(params)}`;

// Validate user input first
function buildUrl(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error('Invalid input');
  }
  return `/search?${qs.stringify({ q: userInput })}`;
}
```

### ❌ Don't

```javascript
// Don't manually construct query strings with special chars
const bad = `/search?q=${userInput}&page=1`;

// Don't forget to encode
const bad = `/api?callback=myFunc(a,b,c)`;

// Don't double-encode
const encoded = qs.escape('Hello World');
const doubleEncoded = qs.escape(encoded);
// 'Hello%2520World' - Broken!
```

## Complete Example

```javascript
const querystring = require('querystring');

class SafeUrlBuilder {
  static build(path, params) {
    // Validate params
    if (typeof params !== 'object' || params === null) {
      throw new Error('Invalid params');
    }

    // Clean undefined/null values
    const clean = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        clean[key] = value;
      }
    }

    // Build safely
    const query = querystring.stringify(clean);
    return query ? `${path}?${query}` : path;
  }
}

// Safe with any input
SafeUrlBuilder.build('/search', {
  q: 'Tom & Jerry',
  category: 'TV Shows',
  rating: '5+',
  tags: ['comedy', 'classic']
});
// '/search?q=Tom%20%26%20Jerry&category=TV%20Shows&rating=5%2B&tags=comedy&tags=classic'
```

## Summary

- Always encode special characters: `& = ? # @ + %`
- Use `stringify()` for automatic encoding
- Never manually concatenate query strings with user input
- Email addresses need encoding (`@` → `%40`)
- URLs as parameters need full encoding
- Percent sign must be encoded (`%` → `%25`)
- Unicode and emoji are automatically handled
- Validate and clean user input before encoding
