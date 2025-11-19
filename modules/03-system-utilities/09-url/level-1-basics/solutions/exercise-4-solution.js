// Exercise 4 Solutions - URL Validation
const { URL } = require('url');

function validateUrl(urlString) {
  try {
    const url = new URL(urlString);
    return { valid: true, error: null, url };
  } catch (err) {
    return { valid: false, error: err.message, url: null };
  }
}

function isHttpUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedDomain(urlString, allowedDomains) {
  try {
    const url = new URL(urlString);
    return allowedDomains.includes(url.hostname);
  } catch {
    return false;
  }
}

function validateRequiredParams(urlString, requiredParams) {
  try {
    const url = new URL(urlString);
    const missing = requiredParams.filter(p => !url.searchParams.has(p));
    return { valid: missing.length === 0, missing };
  } catch {
    return { valid: false, missing: requiredParams };
  }
}

function comprehensiveValidate(urlString, options = {}) {
  const { requireHttps = false, allowedDomains = null, maxLength = 2000 } = options;
  const errors = [];
  
  if (urlString.length > maxLength) errors.push(`Exceeds max length of ${maxLength}`);
  
  try {
    const url = new URL(urlString);
    if (requireHttps && url.protocol !== 'https:') errors.push('HTTPS required');
    if (allowedDomains && !allowedDomains.includes(url.hostname)) errors.push('Domain not allowed');
  } catch (err) {
    errors.push(err.message);
  }
  
  return { valid: errors.length === 0, errors };
}

console.log('Exercise 4 Solutions - See source code for implementations');
