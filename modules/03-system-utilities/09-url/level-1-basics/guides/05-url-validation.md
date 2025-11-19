# Basic URL Validation

This guide explains how to validate URLs safely and effectively.

## Why Validate URLs?

URL validation is crucial for:
- **Security**: Prevent malicious URLs (XSS, open redirects, etc.)
- **Data integrity**: Ensure URLs are well-formed
- **User experience**: Catch errors early
- **API reliability**: Validate external URLs before using them

## Basic Validation

### Using try-catch

The simplest way to validate a URL:

```javascript
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

// Test
console.log(isValidUrl('https://example.com'));     // true
console.log(isValidUrl('not a url'));               // false
console.log(isValidUrl('javascript:alert(1)'));     // true (but dangerous!)
```

### Getting Error Messages

```javascript
function validateUrl(string) {
  try {
    const url = new URL(string);
    return { valid: true, url, error: null };
  } catch (err) {
    return { valid: false, url: null, error: err.message };
  }
}

const result = validateUrl('invalid-url');
if (!result.valid) {
  console.log('Error:', result.error);
}
```

## Protocol Validation

### Allowing Specific Protocols

For security, often you only want HTTP/HTTPS:

```javascript
function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

console.log(isValidHttpUrl('https://example.com'));       // true
console.log(isValidHttpUrl('http://example.com'));        // true
console.log(isValidHttpUrl('ftp://example.com'));         // false
console.log(isValidHttpUrl('javascript:alert(1)'));       // false ✓
```

### Requiring HTTPS

For production security:

```javascript
function isSecureUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

console.log(isSecureUrl('https://example.com'));  // true
console.log(isSecureUrl('http://example.com'));   // false
```

## Domain Validation

### Checking Allowed Domains

Whitelist trusted domains:

```javascript
function isAllowedDomain(urlString, allowedDomains) {
  try {
    const url = new URL(urlString);
    return allowedDomains.includes(url.hostname);
  } catch (err) {
    return false;
  }
}

const allowed = ['example.com', 'api.example.com', 'cdn.example.com'];

console.log(isAllowedDomain('https://example.com/page', allowed));       // true
console.log(isAllowedDomain('https://api.example.com/data', allowed));   // true
console.log(isAllowedDomain('https://evil.com/page', allowed));          // false
```

### Checking Domain Patterns

```javascript
function matchesDomainPattern(urlString, pattern) {
  try {
    const url = new URL(urlString);
    return pattern.test(url.hostname);
  } catch (err) {
    return false;
  }
}

// Only allow *.example.com subdomains
const pattern = /^[a-z0-9-]+\.example\.com$/;

console.log(matchesDomainPattern('https://api.example.com', pattern));   // true
console.log(matchesDomainPattern('https://cdn.example.com', pattern));   // true
console.log(matchesDomainPattern('https://example.com', pattern));       // false
console.log(matchesDomainPattern('https://evil.com', pattern));          // false
```

## Parameter Validation

### Checking Required Parameters

```javascript
function hasRequiredParams(urlString, requiredParams) {
  try {
    const url = new URL(urlString);
    return requiredParams.every(param => url.searchParams.has(param));
  } catch (err) {
    return false;
  }
}

const url = 'https://example.com/search?q=nodejs&page=1';
console.log(hasRequiredParams(url, ['q']));          // true
console.log(hasRequiredParams(url, ['q', 'page']));  // true
console.log(hasRequiredParams(url, ['q', 'limit'])); // false
```

### Validating Parameter Values

```javascript
function validateParams(urlString, validators) {
  try {
    const url = new URL(urlString);

    for (const [param, validator] of Object.entries(validators)) {
      const value = url.searchParams.get(param);

      if (!validator(value)) {
        return { valid: false, param };
      }
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

// Usage
const result = validateParams('https://example.com?page=5&limit=20', {
  page: (val) => val && !isNaN(val) && parseInt(val) > 0,
  limit: (val) => val && !isNaN(val) && parseInt(val) <= 100
});

console.log(result.valid);
```

## Comprehensive Validation

### All-in-One Validator

```javascript
function validateUrl(urlString, options = {}) {
  const {
    protocols = ['http:', 'https:'],
    allowedDomains = null,
    requiredParams = [],
    maxLength = 2048,
    requireSecure = false
  } = options;

  // Check length
  if (urlString.length > maxLength) {
    return {
      valid: false,
      errors: [`URL exceeds maximum length of ${maxLength}`]
    };
  }

  try {
    const url = new URL(urlString);
    const errors = [];

    // Check protocol
    if (!protocols.includes(url.protocol)) {
      errors.push(`Protocol must be one of: ${protocols.join(', ')}`);
    }

    // Check secure protocol
    if (requireSecure && url.protocol !== 'https:') {
      errors.push('HTTPS required');
    }

    // Check allowed domains
    if (allowedDomains && !allowedDomains.includes(url.hostname)) {
      errors.push(`Domain must be one of: ${allowedDomains.join(', ')}`);
    }

    // Check required parameters
    const missingParams = requiredParams.filter(
      param => !url.searchParams.has(param)
    );
    if (missingParams.length > 0) {
      errors.push(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      url,
      errors
    };
  } catch (err) {
    return {
      valid: false,
      url: null,
      errors: [err.message]
    };
  }
}

// Usage examples
const result1 = validateUrl('https://api.example.com/data?key=value', {
  protocols: ['https:'],
  allowedDomains: ['api.example.com'],
  requiredParams: ['key']
});

console.log(result1.valid); // true

const result2 = validateUrl('http://example.com', {
  requireSecure: true
});

console.log(result2.valid);  // false
console.log(result2.errors); // ['HTTPS required']
```

## Common Security Patterns

### Preventing Open Redirects

```javascript
function getSafeRedirectUrl(redirectUrl, allowedDomains) {
  const defaultUrl = '/'; // Safe fallback

  try {
    const url = new URL(redirectUrl);

    // Only allow http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return defaultUrl;
    }

    // Check if domain is allowed
    if (allowedDomains.includes(url.hostname)) {
      return url.href;
    }

    return defaultUrl;
  } catch (err) {
    return defaultUrl;
  }
}

// Usage
const allowed = ['example.com', 'app.example.com'];

console.log(getSafeRedirectUrl('https://example.com/page', allowed));
// 'https://example.com/page'

console.log(getSafeRedirectUrl('https://evil.com', allowed));
// '/' (blocked!)

console.log(getSafeRedirectUrl('javascript:alert(1)', allowed));
// '/' (blocked!)
```

### Preventing XSS via URLs

```javascript
function isSafeForDisplay(urlString) {
  try {
    const url = new URL(urlString);

    // Block dangerous protocols
    const dangerousProtocols = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:'
    ];

    return !dangerousProtocols.includes(url.protocol);
  } catch (err) {
    return false;
  }
}

console.log(isSafeForDisplay('https://example.com'));       // true
console.log(isSafeForDisplay('javascript:alert(1)'));       // false
console.log(isSafeForDisplay('data:text/html,<script>'));   // false
```

## Practical Examples

### Example 1: API URL Validator

```javascript
function validateApiUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Must be HTTPS
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'API URLs must use HTTPS' };
    }

    // Must have /api/ in path
    if (!url.pathname.startsWith('/api/')) {
      return { valid: false, error: 'Path must start with /api/' };
    }

    // Must have version in path
    if (!/\/v\d+\//.test(url.pathname)) {
      return { valid: false, error: 'API version required (e.g., /v1/)' };
    }

    return { valid: true, url };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

console.log(validateApiUrl('https://api.example.com/api/v1/users'));
// { valid: true, url: [URL object] }

console.log(validateApiUrl('http://api.example.com/api/v1/users'));
// { valid: false, error: 'API URLs must use HTTPS' }
```

### Example 2: Form URL Validator

```javascript
function validateUserUrl(input) {
  // Trim whitespace
  const trimmed = input.trim();

  // Check length
  if (trimmed.length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'URL is too long (max 500 characters)' };
  }

  // Try to parse
  try {
    const url = new URL(trimmed);

    // Only allow http/https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    return { valid: true, url: url.href };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Usage in a form handler
function handleFormSubmit(formData) {
  const urlValidation = validateUserUrl(formData.website);

  if (!urlValidation.valid) {
    console.error('Validation error:', urlValidation.error);
    return;
  }

  console.log('Valid URL:', urlValidation.url);
  // Proceed with form submission
}
```

## Summary

**Key validation techniques:**
- ✓ Use try-catch for basic validation
- ✓ Always validate protocol (prefer https:)
- ✓ Whitelist allowed domains for security
- ✓ Check required query parameters
- ✓ Enforce length limits
- ✓ Prevent dangerous protocols (javascript:, data:, etc.)
- ✓ Validate before redirects to prevent open redirect attacks

**Best practices:**
- Never trust user input
- Validate early and often
- Use whitelists, not blacklists
- Provide clear error messages
- Test with malicious input
- Document validation rules

Proper URL validation is essential for building secure applications!
