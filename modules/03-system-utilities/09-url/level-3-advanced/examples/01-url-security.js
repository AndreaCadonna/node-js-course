/**
 * Level 3 Example 1: URL Security Patterns
 * 
 * Demonstrates secure URL handling to prevent common vulnerabilities.
 */

console.log('=== URL Security Patterns ===\n');

// Prevent open redirect attacks
function safeRedirect(userProvidedUrl, allowedOrigins) {
  try {
    const url = new URL(userProvidedUrl);
    
    // Check protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return '/'; // Default safe redirect
    }
    
    // Check origin whitelist
    if (allowedOrigins.some(origin => url.origin === origin)) {
      return url.href;
    }
    
    console.log('❌ Blocked redirect to:', url.href);
    return '/'; // Safe default
  } catch (err) {
    console.log('❌ Invalid URL');
    return '/';
  }
}

// Test
const allowed = ['https://example.com', 'https://app.example.com'];

console.log('Safe redirect tests:');
console.log('✓', safeRedirect('https://example.com/page', allowed));
console.log('✗', safeRedirect('https://evil.com/phishing', allowed));
console.log('✗', safeRedirect('javascript:alert(1)', allowed));
console.log('\n✓ Level 3 content structure complete');
