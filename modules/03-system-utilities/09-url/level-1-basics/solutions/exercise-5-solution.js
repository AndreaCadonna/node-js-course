// Exercise 5 Solutions - Practical Operations
const { URL } = require('url');

function buildApiUrl(baseUrl, endpoint, filters = {}) {
  const url = new URL(endpoint, baseUrl);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, value);
    }
  });
  return url.href;
}

function parseRequestUrl(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    hash: url.hash,
    fullUrl: url.href
  };
}

function getSafeRedirectUrl(redirectUrl, allowedDomains) {
  try {
    const url = new URL(redirectUrl);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && 
        allowedDomains.includes(url.hostname)) {
      return url.href;
    }
  } catch {}
  return '/';
}

function normalizeUrl(urlString) {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === 'http:' && url.port === '80') || 
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const params = [...url.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));
  url.search = '';
  params.forEach(([k, v]) => url.searchParams.append(k, v));
  return url.href;
}

function groupQueryParams(urlString) {
  const url = new URL(urlString);
  const single = {}, multiple = {};
  const counts = new Map();
  
  for (const [key] of url.searchParams) {
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  
  for (const [key, count] of counts) {
    if (count === 1) {
      single[key] = url.searchParams.get(key);
    } else {
      multiple[key] = url.searchParams.getAll(key);
    }
  }
  
  return { single, multiple };
}

console.log('Exercise 5 Solutions - See source code for implementations');
