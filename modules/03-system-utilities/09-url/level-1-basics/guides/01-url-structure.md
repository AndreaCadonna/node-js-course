# Understanding URL Structure

This guide explains the anatomy of URLs and how each component works together.

## What is a URL?

A **URL** (Uniform Resource Locator) is a reference to a web resource that specifies its location and how to access it. It's the address you type in your browser or use in your applications to locate resources on the internet or local network.

## Complete URL Anatomy

```
https://user:pass@subdomain.example.com:8080/path/to/resource?key=value&foo=bar#section
│       │    │    │                      │    │                │                  │
│       │    │    │                      │    │                │                  └─ Hash/Fragment
│       │    │    │                      │    │                └──────────────────── Query/Search
│       │    │    │                      │    └───────────────────────────────────── Path
│       │    │    │                      └────────────────────────────────────────── Port
│       │    │    └───────────────────────────────────────────────────────────────── Hostname
│       │    └────────────────────────────────────────────────────────────────────── Password
│       └─────────────────────────────────────────────────────────────────────────── Username
└───────────────────────────────────────────────────────────────────────────────────Scheme/Protocol
```

## URL Components Explained

### 1. Protocol/Scheme

**What it is**: Defines how to access the resource

**Format**: `protocol:` (always includes colon)

**Common protocols**:
- `http:` - Hypertext Transfer Protocol
- `https:` - HTTP Secure (encrypted)
- `ftp:` - File Transfer Protocol
- `file:` - Local file system
- `ws:` - WebSocket
- `wss:` - WebSocket Secure

**Example**:
```javascript
const url = new URL('https://example.com');
console.log(url.protocol); // 'https:'
```

**When to use**:
- Use `https:` for secure web communication (default for production)
- Use `http:` only for local development
- Use `file:` for local file paths
- Use `ws:` or `wss:` for WebSocket connections

### 2. Authentication (Username & Password)

**What it is**: Credentials for basic HTTP authentication

**Format**: `username:password@`

**Example**:
```javascript
const url = new URL('https://admin:secret@example.com');
console.log(url.username); // 'admin'
console.log(url.password); // 'secret'
```

**Security warning**: ⚠️
- Credentials in URLs are visible in logs, browser history, and network traffic
- Modern applications use Authorization headers instead
- Rarely used today except for specific legacy systems

### 3. Hostname

**What it is**: Domain name or IP address of the server

**Format**: Domain name (e.g., `example.com`) or IP address (e.g., `192.168.1.1`)

**Examples**:
```javascript
const url1 = new URL('https://example.com');
console.log(url1.hostname); // 'example.com'

const url2 = new URL('https://www.example.com');
console.log(url2.hostname); // 'www.example.com'

const url3 = new URL('https://api.subdomain.example.com');
console.log(url3.hostname); // 'api.subdomain.example.com'
```

**Common patterns**:
- `example.com` - Root domain
- `www.example.com` - WWW subdomain
- `api.example.com` - API subdomain
- `staging.example.com` - Staging environment

### 4. Port

**What it is**: Network port number for the service

**Format**: `:port` (number from 1-65535)

**Default ports**:
- HTTP: `80`
- HTTPS: `443`
- FTP: `21`

**Example**:
```javascript
const url1 = new URL('https://example.com');
console.log(url1.port); // '' (empty - using default 443)

const url2 = new URL('https://example.com:8080');
console.log(url2.port); // '8080'
```

**When to specify**:
- Development servers: `localhost:3000`, `localhost:8080`
- Custom ports: `example.com:8080`
- Default ports are usually omitted

### 5. Pathname

**What it is**: Path to the specific resource on the server

**Format**: `/path/to/resource` (always starts with `/`)

**Examples**:
```javascript
const url1 = new URL('https://example.com/');
console.log(url1.pathname); // '/'

const url2 = new URL('https://example.com/products/123');
console.log(url2.pathname); // '/products/123'

const url3 = new URL('https://example.com/api/v2/users.json');
console.log(url3.pathname); // '/api/v2/users.json'
```

**Common patterns**:
- `/` - Root/home page
- `/about` - Static page
- `/products/123` - Resource with ID
- `/api/v1/users` - API endpoint
- `/path/file.html` - File with extension

### 6. Query String/Search

**What it is**: Parameters passed to the resource

**Format**: `?key1=value1&key2=value2`

**Example**:
```javascript
const url = new URL('https://example.com/search?q=nodejs&limit=10');
console.log(url.search); // '?q=nodejs&limit=10'
console.log(url.searchParams.get('q')); // 'nodejs'
console.log(url.searchParams.get('limit')); // '10'
```

**Structure**:
- Starts with `?`
- Key-value pairs separated by `&`
- Format: `key=value`
- Values are URL-encoded

**Common uses**:
- Search queries: `?q=search+term`
- Pagination: `?page=2&limit=20`
- Filters: `?category=electronics&price=100-500`
- Sorting: `?sort=price&order=asc`

### 7. Hash/Fragment

**What it is**: Reference to a specific section within the resource

**Format**: `#section-id`

**Example**:
```javascript
const url = new URL('https://example.com/page#comments');
console.log(url.hash); // '#comments'
```

**Common uses**:
- Jumping to page sections: `#introduction`
- Single Page App routing: `#/dashboard`
- Fragment identifiers in documents: `#chapter-3`

**Note**: Hash is NOT sent to the server - it's client-side only

## URL Composition

### Minimal URL

The smallest valid URL has just protocol and hostname:

```javascript
const url = new URL('https://example.com');

console.log(url.protocol); // 'https:'
console.log(url.hostname); // 'example.com'
console.log(url.pathname); // '/' (default)
console.log(url.port);     // '' (default)
console.log(url.search);   // ''
console.log(url.hash);     // ''
```

### Complete URL

A URL with all components:

```javascript
const url = new URL('https://user:pass@example.com:8080/path?key=value#section');

console.log(url.protocol);  // 'https:'
console.log(url.username);  // 'user'
console.log(url.password);  // 'pass'
console.log(url.hostname);  // 'example.com'
console.log(url.port);      // '8080'
console.log(url.pathname);  // '/path'
console.log(url.search);    // '?key=value'
console.log(url.hash);      // '#section'
```

## Special Properties

### Origin

The origin is a read-only property combining protocol, hostname, and port:

```javascript
const url = new URL('https://example.com:8080/path');
console.log(url.origin); // 'https://example.com:8080'
```

Used for:
- CORS (Cross-Origin Resource Sharing)
- Security checks
- Comparing URL origins

### Host vs Hostname

**Host**: Hostname + port (if non-default)
**Hostname**: Just the domain name

```javascript
const url = new URL('https://example.com:8080');
console.log(url.host);     // 'example.com:8080'
console.log(url.hostname); // 'example.com'
console.log(url.port);     // '8080'
```

## Real-World Examples

### 1. Simple Website URL
```
https://www.example.com/about
```
- Protocol: `https:`
- Hostname: `www.example.com`
- Pathname: `/about`

### 2. API Endpoint with Parameters
```
https://api.example.com/v1/users?role=admin&status=active
```
- Protocol: `https:`
- Hostname: `api.example.com`
- Pathname: `/v1/users`
- Query: `role=admin&status=active`

### 3. Local Development Server
```
http://localhost:3000/dashboard#settings
```
- Protocol: `http:`
- Hostname: `localhost`
- Port: `3000`
- Pathname: `/dashboard`
- Hash: `#settings`

### 4. File URL
```
file:///Users/name/documents/report.pdf
```
- Protocol: `file:`
- Pathname: `/Users/name/documents/report.pdf`

## Best Practices

1. **Always use HTTPS in production** for security
2. **Use meaningful paths** that reflect resource hierarchy
3. **Keep URLs human-readable** when possible
4. **Use hyphens** in URLs, not underscores: `/my-page` not `/my_page`
5. **Keep URLs short** but descriptive
6. **Be consistent** with trailing slashes
7. **Use lowercase** for better compatibility
8. **Encode special characters** in query parameters

## Summary

Understanding URL structure is fundamental to web development:
- **Protocol** determines how to access the resource
- **Hostname** identifies the server
- **Port** specifies the service (often default)
- **Pathname** locates the resource on the server
- **Query** passes parameters to the resource
- **Hash** identifies sections within the resource

Master these components and you'll be able to work with any URL confidently!
