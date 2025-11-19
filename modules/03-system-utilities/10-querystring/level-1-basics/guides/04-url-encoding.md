# URL Encoding Explained

Learn why URL encoding is necessary and how to use `escape()` and `unescape()`.

## Why URL Encoding?

URLs can only contain certain characters. Special characters must be encoded to be safely transmitted in URLs.

### Valid URL Characters

**Unreserved (safe, no encoding needed):**
- Letters: `A-Z a-z`
- Numbers: `0-9`
- Special: `-` `_` `.` `~`

**Reserved (have special meaning):**
- `:` `/` `?` `#` `[` `]` `@`
- `!` `$` `&` `'` `(` `)` `*` `+` `,` `;` `=`

## The escape() Method

Encodes a string for use in URLs:

```javascript
const qs = require('querystring');

const encoded = qs.escape('Hello World!');
console.log(encoded); // 'Hello%20World!'
```

### Common Encodings

```javascript
qs.escape(' ');   // '%20' (space)
qs.escape('@');   // '%40'
qs.escape('#');   // '%23'
qs.escape('&');   // '%26'
qs.escape('=');   // '%3D'
qs.escape('+');   // '%2B'
qs.escape('/');   // '%2F'
```

### How It Works

Characters are converted to their hexadecimal byte value:

```
Character → Hex Value → Encoded
@         → 40        → %40
#         → 23        → %23
Space     → 20        → %20
```

## The unescape() Method

Decodes a URL-encoded string:

```javascript
const qs = require('querystring');

const decoded = qs.unescape('Hello%20World!');
console.log(decoded); // 'Hello World!'
```

### Examples

```javascript
qs.unescape('user%40example.com'); // 'user@example.com'
qs.unescape('100%25');              // '100%'
qs.unescape('A%26B');               // 'A&B'
```

## Why Encoding Matters

### Breaking URLs Without Encoding

```javascript
// ❌ WRONG - Ampersand breaks the URL
const bad = `/search?q=Tom & Jerry&category=TV`;
// Parsed as:
// q = "Tom "
// " Jerry" = ""  (invalid key!)
// category = "TV"

// ✅ CORRECT - Properly encoded
const params = { q: 'Tom & Jerry', category: 'TV' };
const good = `/search?${qs.stringify(params)}`;
// '/search?q=Tom%20%26%20Jerry&category=TV'
```

### Email Addresses

```javascript
const email = 'user@example.com';

// ❌ WRONG - @ has special meaning
const bad = `/subscribe?email=${email}`;
// Might be misinterpreted

// ✅ CORRECT
const good = `/subscribe?email=${qs.escape(email)}`;
// '/subscribe?email=user%40example.com'
```

## Automatic vs Manual Encoding

### Use stringify() - Not escape()

```javascript
const params = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello & welcome!'
};

// ❌ NOT RECOMMENDED - Manual encoding
const manual = `name=${qs.escape(params.name)}&email=${qs.escape(params.email)}&message=${qs.escape(params.message)}`;

// ✅ RECOMMENDED - Automatic encoding
const automatic = qs.stringify(params);

// Both produce same result, but stringify is cleaner
```

## Common Scenarios

### Space Encoding

```javascript
// querystring uses %20 for spaces
qs.escape('Hello World'); // 'Hello%20World'

// Note: URLSearchParams uses + for spaces
const params = new URLSearchParams();
params.append('q', 'Hello World');
params.toString(); // 'q=Hello+World'
```

### Unicode and Emoji

```javascript
qs.escape('Hello 世界'); // 'Hello%20%E4%B8%96%E7%95%8C'
qs.escape('👋 🌍');      // '%F0%9F%91%8B%20%F0%9F%8C%8D'

// Decodes correctly
qs.unescape('%F0%9F%91%8B%20%F0%9F%8C%8D'); // '👋 🌍'
```

### URL as Parameter

```javascript
const url = 'https://example.com/page?id=123';
const encoded = qs.escape(url);
// 'https%3A%2F%2Fexample.com%2Fpage%3Fid%3D123'

const apiUrl = `/redirect?url=${encoded}`;
// The URL is safely passed as a parameter
```

## Round-Trip Encoding

```javascript
const original = 'user@example.com';

// Encode
const step1 = qs.escape(original);
console.log(step1); // 'user%40example.com'

// Decode
const step2 = qs.unescape(step1);
console.log(step2); // 'user@example.com'

// Verify
console.log(original === step2); // true
```

## When NOT to Encode

Characters that don't need encoding:

```javascript
const safe = 'ABCabc123-_.~';
const encoded = qs.escape(safe);
console.log(safe === encoded); // true (unchanged)
```

## Real-World Example

```javascript
function buildSearchUrl(query, filters = {}) {
  // DON'T manually escape - let stringify handle it
  const params = { q: query, ...filters };
  return `/search?${qs.stringify(params)}`;
}

// These all work correctly with automatic encoding
buildSearchUrl('node.js');
// '/search?q=node.js'

buildSearchUrl('C++ & Python');
// '/search?q=C%2B%2B%20%26%20Python'

buildSearchUrl('user@example.com', { type: 'email' });
// '/search?q=user%40example.com&type=email'
```

## Summary

- URL encoding converts special characters to %XX format
- Use `escape()` to encode, `unescape()` to decode
- **Prefer `stringify()` over manual escaping**
- Space becomes `%20`
- `@` becomes `%40`
- `&` becomes `%26`
- Encoding prevents URL parsing errors
- All special characters except `-_.~` need encoding
- Always encode user input before adding to URLs
