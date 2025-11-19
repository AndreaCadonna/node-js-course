# URL Components Deep Dive

This guide provides an in-depth look at each URL component and how to work with them using the URL API.

## Overview of Components

A URL consists of several distinct components, each serving a specific purpose:

```javascript
const url = new URL('https://user:pass@example.com:8080/path?key=value#section');

console.log({
  protocol: url.protocol,   // 'https:'
  username: url.username,   // 'user'
  password: url.password,   // 'pass'
  hostname: url.hostname,   // 'example.com'
  port: url.port,           // '8080'
  host: url.host,           // 'example.com:8080'
  pathname: url.pathname,   // '/path'
  search: url.search,       // '?key=value'
  hash: url.hash,           // '#section'
  origin: url.origin,       // 'https://example.com:8080'
  href: url.href            // Full URL
});
```

## Protocol (Scheme)

### What It Is

The protocol defines how to access the resource.

### Format

Always includes a colon: `protocol:`

### Common Protocols

```javascript
// Web protocols
const https = new URL('https://example.com');
console.log(https.protocol); // 'https:'

const http = new URL('http://example.com');
console.log(http.protocol); // 'http:'

// File protocol
const file = new URL('file:///path/to/file.txt');
console.log(file.protocol); // 'file:'

// WebSocket
const ws = new URL('ws://example.com');
console.log(ws.protocol); // 'ws:'
```

### Modifying Protocol

```javascript
const url = new URL('http://example.com');
url.protocol = 'https:'; // Don't forget the colon!

console.log(url.href); // 'https://example.com'
```

### Best Practices

- Use `https:` for production (secure)
- Use `http:` only for local development
- Always include the colon when setting
- Validate protocol for security

## Authentication (Username & Password)

### What It Is

Credentials for basic HTTP authentication.

### Reading Credentials

```javascript
const url = new URL('https://admin:secret@example.com');

console.log(url.username); // 'admin'
console.log(url.password); // 'secret'
```

### Setting Credentials

```javascript
const url = new URL('https://example.com');
url.username = 'admin';
url.password = 'secret';

console.log(url.href);
// 'https://admin:secret@example.com'
```

### Security Warning

⚠️ **Don't use credentials in URLs!**
- Visible in logs
- Visible in browser history
- Transmitted in plaintext (even with HTTPS)
- Use Authorization headers instead

### Removing Credentials

```javascript
const url = new URL('https://user:pass@example.com');
url.username = '';
url.password = '';

console.log(url.href); // 'https://example.com'
```

## Hostname

### What It Is

The domain name or IP address of the server.

### Examples

```javascript
// Domain name
const domain = new URL('https://example.com');
console.log(domain.hostname); // 'example.com'

// Subdomain
const sub = new URL('https://www.example.com');
console.log(sub.hostname); // 'www.example.com'

// Multiple subdomains
const api = new URL('https://api.v2.example.com');
console.log(api.hostname); // 'api.v2.example.com'

// IP address
const ip = new URL('https://192.168.1.1');
console.log(ip.hostname); // '192.168.1.1'
```

### Modifying Hostname

```javascript
const url = new URL('https://old.com');
url.hostname = 'new.com';

console.log(url.href); // 'https://new.com'
```

### Case Sensitivity

Hostnames are case-insensitive and normalized to lowercase:

```javascript
const url = new URL('https://EXAMPLE.COM');
console.log(url.hostname); // 'example.com' (lowercased)
```

## Port

### What It Is

The network port number for the service.

### Default Ports

Different protocols have default ports:

```javascript
// HTTP - default port 80
const http = new URL('http://example.com');
console.log(http.port); // '' (empty, using default)

// HTTPS - default port 443
const https = new URL('https://example.com');
console.log(https.port); // '' (empty, using default)

// Explicit default port
const explicit = new URL('https://example.com:443');
console.log(explicit.port); // '443' (shown when explicit)
```

### Custom Ports

```javascript
const url = new URL('https://example.com:8080');
console.log(url.port); // '8080'
```

### Modifying Port

```javascript
const url = new URL('https://example.com');
url.port = '3000';

console.log(url.href); // 'https://example.com:3000'
```

### Removing Port

```javascript
const url = new URL('https://example.com:8080');
url.port = ''; // Empty string removes port

console.log(url.href); // 'https://example.com'
```

## Host vs Hostname

### The Difference

- **hostname**: Just the domain/IP
- **host**: Hostname + port (if non-default)

```javascript
const url = new URL('https://example.com:8080');

console.log(url.hostname); // 'example.com'
console.log(url.host);     // 'example.com:8080'
console.log(url.port);     // '8080'
```

### When Port is Default

```javascript
const url = new URL('https://example.com');

console.log(url.hostname); // 'example.com'
console.log(url.host);     // 'example.com' (same as hostname)
console.log(url.port);     // '' (empty)
```

### Modifying Host

```javascript
const url = new URL('https://example.com');
url.host = 'newsite.com:9000';

console.log(url.hostname); // 'newsite.com'
console.log(url.port);     // '9000'
```

## Pathname

### What It Is

The path to the resource on the server.

### Always Starts with /

```javascript
const url1 = new URL('https://example.com');
console.log(url1.pathname); // '/' (default)

const url2 = new URL('https://example.com/path');
console.log(url2.pathname); // '/path'
```

### Complex Paths

```javascript
const url = new URL('https://example.com/api/v1/users/123/posts');
console.log(url.pathname); // '/api/v1/users/123/posts'
```

### Modifying Pathname

```javascript
const url = new URL('https://example.com');
url.pathname = '/new/path';

console.log(url.href); // 'https://example.com/new/path'

// Automatically adds leading /
url.pathname = 'auto-slash';
console.log(url.pathname); // '/auto-slash'
```

### Path with File Extension

```javascript
const url = new URL('https://example.com/document.pdf');
console.log(url.pathname); // '/document.pdf'
```

## Search/Query String

### What It Is

Parameters passed to the resource.

### Format

Starts with `?`, key-value pairs separated by `&`:

```javascript
const url = new URL('https://example.com/search?q=nodejs&limit=10');
console.log(url.search); // '?q=nodejs&limit=10'
```

### Use searchParams Instead

Instead of manipulating the search string directly, use `searchParams`:

```javascript
const url = new URL('https://example.com/search');

// Add parameters
url.searchParams.set('q', 'nodejs');
url.searchParams.set('limit', '10');

console.log(url.search); // '?q=nodejs&limit=10'
```

### Reading Query String

```javascript
const url = new URL('https://example.com?foo=bar&baz=qux');
console.log(url.search); // '?foo=bar&baz=qux'
```

## Hash/Fragment

### What It Is

A reference to a specific section within the resource.

### Format

Starts with `#`:

```javascript
const url = new URL('https://example.com/page#section-3');
console.log(url.hash); // '#section-3'
```

### Common Uses

```javascript
// Page sections
const section = new URL('https://example.com/docs#installation');

// SPA routing
const spa = new URL('https://app.example.com/#/dashboard');

// Document references
const doc = new URL('https://example.com/article#chapter-2');
```

### Modifying Hash

```javascript
const url = new URL('https://example.com/page');
url.hash = '#comments';

console.log(url.href); // 'https://example.com/page#comments'
```

### Removing Hash

```javascript
const url = new URL('https://example.com/page#section');
url.hash = '';

console.log(url.href); // 'https://example.com/page'
```

### Important Note

The hash is NOT sent to the server - it's processed client-side only.

## Origin (Read-Only)

### What It Is

Combination of protocol + hostname + port.

### Reading Origin

```javascript
const url = new URL('https://example.com:8080/path');
console.log(url.origin); // 'https://example.com:8080'
```

### Cannot Be Modified

```javascript
const url = new URL('https://example.com');
url.origin = 'https://other.com'; // Does nothing!

console.log(url.origin); // Still 'https://example.com'
```

### To Change Origin

Modify protocol, hostname, or port individually:

```javascript
const url = new URL('https://example.com');
url.protocol = 'http:';
url.hostname = 'newsite.com';
url.port = '8080';

console.log(url.origin); // 'http://newsite.com:8080'
```

### Use Cases

- CORS checks
- Security validation
- Comparing URLs

## Href (Complete URL)

### What It Is

The complete URL as a string.

### Reading

```javascript
const url = new URL('https://example.com/path?key=value#section');
console.log(url.href);
// 'https://example.com/path?key=value#section'
```

### Same as toString()

```javascript
const url = new URL('https://example.com');
console.log(url.href === url.toString()); // true
```

### Setting href

You can replace the entire URL:

```javascript
const url = new URL('https://example.com');
url.href = 'https://newsite.com/path';

console.log(url.hostname); // 'newsite.com'
console.log(url.pathname); // '/path'
```

## Summary

Understanding each component allows you to:
- Parse URLs accurately
- Modify specific parts
- Validate URL structure
- Build URLs programmatically
- Handle different protocols
- Work with query parameters
- Navigate page sections

Master these components to work confidently with any URL!
