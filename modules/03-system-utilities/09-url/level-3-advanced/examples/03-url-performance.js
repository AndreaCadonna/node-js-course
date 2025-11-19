/**
 * Example 3: URL Performance Optimization
 */

console.log('=== Performance Optimization ===\n');

// Batch URL processing
function batchProcessUrls(urls) {
  const results = [];
  for (const urlString of urls) {
    try {
      const url = new URL(urlString);
      results.push({ url: url.href, valid: true });
    } catch {
      results.push({ url: urlString, valid: false });
    }
  }
  return results;
}

const testUrls = ['https://example.com', 'invalid', 'https://test.com'];
console.log('Batch processed:', batchProcessUrls(testUrls).length, 'URLs');
console.log('✓ Efficient batch processing');
