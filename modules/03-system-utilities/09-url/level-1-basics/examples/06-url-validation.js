/**
 * Example 6: URL Validation
 *
 * Demonstrates how to validate URLs and handle errors.
 * Essential for working with user input or external data.
 */

console.log('=== URL Validation Examples ===\n');

// Example 1: Basic URL validation
console.log('1. Basic URL Validation');

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

const testUrls = [
  'https://example.com',
  'http://localhost:3000',
  'not a url',
  'ftp://files.example.com',
  'example.com',  // Missing protocol
  '/path/only'    // Relative URL without base
];

testUrls.forEach(url => {
  console.log(`"${url}" - Valid: ${isValidUrl(url)}`);
});
console.log('');

// Example 2: Validating with protocol check
console.log('2. Validating HTTP/HTTPS URLs Only');

function isValidHttpUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

const httpTests = [
  'https://example.com',          // Valid
  'http://example.com',           // Valid
  'ftp://example.com',            // Invalid (not HTTP/HTTPS)
  'javascript:alert(1)',          // Invalid (security risk!)
  'data:text/html,<script>',      // Invalid
  'not-a-url'                     // Invalid
];

httpTests.forEach(url => {
  const valid = isValidHttpUrl(url);
  console.log(`${valid ? '✓' : '✗'} "${url}"`);
});
console.log('');

// Example 3: Error messages
console.log('3. Getting Error Messages');

function validateUrl(string) {
  try {
    const url = new URL(string);
    return { valid: true, url, error: null };
  } catch (err) {
    return { valid: false, url: null, error: err.message };
  }
}

const validationTests = [
  'https://example.com',
  'not a url',
  '/relative/path',
  'http://'
];

validationTests.forEach(test => {
  const result = validateUrl(test);
  if (result.valid) {
    console.log(`✓ "${test}"`);
  } else {
    console.log(`✗ "${test}"`);
    console.log(`  Error: ${result.error}`);
  }
});
console.log('');

// Example 4: Validating URL components
console.log('4. Validating Specific Components');

function validateUrlComponents(urlString, requirements = {}) {
  try {
    const url = new URL(urlString);
    const errors = [];

    // Check protocol
    if (requirements.protocols) {
      if (!requirements.protocols.includes(url.protocol)) {
        errors.push(`Protocol must be one of: ${requirements.protocols.join(', ')}`);
      }
    }

    // Check hostname pattern
    if (requirements.hostnamePattern) {
      if (!requirements.hostnamePattern.test(url.hostname)) {
        errors.push('Hostname does not match required pattern');
      }
    }

    // Check port
    if (requirements.noPort && url.port) {
      errors.push('Port not allowed');
    }

    // Check pathname
    if (requirements.pathPattern) {
      if (!requirements.pathPattern.test(url.pathname)) {
        errors.push('Pathname does not match required pattern');
      }
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

const apiUrl = 'https://api.example.com/v1/users';
const result = validateUrlComponents(apiUrl, {
  protocols: ['https:'],
  hostnamePattern: /^api\./,
  pathPattern: /^\/v\d+\//
});

console.log('URL:', apiUrl);
console.log('Valid:', result.valid);
if (!result.valid) {
  console.log('Errors:', result.errors);
}
console.log('');

// Example 5: Domain whitelist validation
console.log('5. Domain Whitelist Validation');

function isAllowedDomain(urlString, allowedDomains) {
  try {
    const url = new URL(urlString);
    return allowedDomains.includes(url.hostname);
  } catch (err) {
    return false;
  }
}

const allowedDomains = ['example.com', 'api.example.com', 'cdn.example.com'];
const domainTests = [
  'https://example.com/page',
  'https://api.example.com/data',
  'https://evil.com/page',
  'https://example.com.evil.com/page'
];

domainTests.forEach(url => {
  const allowed = isAllowedDomain(url, allowedDomains);
  console.log(`${allowed ? '✓' : '✗'} ${url}`);
});
console.log('');

// Example 6: Checking for required parameters
console.log('6. Validating Required Query Parameters');

function hasRequiredParams(urlString, requiredParams) {
  try {
    const url = new URL(urlString);
    return requiredParams.every(param => url.searchParams.has(param));
  } catch (err) {
    return false;
  }
}

const searchUrl = 'https://example.com/search?q=nodejs&page=1&limit=10';
const required = ['q', 'page'];

console.log('URL:', searchUrl);
console.log('Required params:', required);
console.log('Has all required:', hasRequiredParams(searchUrl, required));

const missing = hasRequiredParams(searchUrl, ['q', 'category']);
console.log('Has q and category:', missing);
console.log('');

// Example 7: Comprehensive URL validator
console.log('7. Comprehensive URL Validator');

function validateFullUrl(urlString, options = {}) {
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

    // Check secure protocol if required
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

// Test comprehensive validator
const testCases = [
  {
    url: 'https://api.example.com/search?q=test',
    options: {
      protocols: ['https:'],
      allowedDomains: ['api.example.com'],
      requiredParams: ['q']
    }
  },
  {
    url: 'http://example.com/page',
    options: {
      requireSecure: true
    }
  },
  {
    url: 'https://evil.com/page',
    options: {
      allowedDomains: ['example.com']
    }
  }
];

testCases.forEach(({ url, options }, index) => {
  console.log(`Test ${index + 1}: ${url}`);
  const result = validateFullUrl(url, options);
  console.log('Valid:', result.valid);
  if (!result.valid) {
    console.log('Errors:', result.errors);
  }
  console.log('');
});

// Summary
console.log('=== Summary ===');
console.log('URL validation techniques:');
console.log('✓ try-catch for basic validation');
console.log('✓ Protocol whitelisting (http:, https: only)');
console.log('✓ Domain whitelisting for security');
console.log('✓ Component validation (hostname, path patterns)');
console.log('✓ Required parameter checking');
console.log('✓ Length limits');
console.log('✓ HTTPS enforcement');
console.log('');
console.log('Always validate user-provided URLs!');
