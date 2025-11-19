/**
 * Example 6: Advanced URL Normalization
 */

console.log('=== URL Normalization ===\n');

function normalizeUrl(urlString) {
  const url = new URL(urlString);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  
  // Remove default ports
  if ((url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')) {
    url.port = '';
  }
  
  // Normalize path
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  
  // Sort params
  const params = [...url.searchParams.entries()].sort();
  url.search = '';
  params.forEach(([k, v]) => url.searchParams.append(k, v));
  
  return url.href;
}

console.log(normalizeUrl('HTTPS://EXAMPLE.COM:443/Path/?z=1&a=2'));
console.log('✓ Normalized for comparison');
