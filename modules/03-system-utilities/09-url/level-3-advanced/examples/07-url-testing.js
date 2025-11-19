/**
 * Example 7: URL Testing Strategies
 */

console.log('=== URL Testing ===\n');

function testURLValidator(validator, testCases) {
  const results = { passed: 0, failed: 0 };
  
  testCases.forEach(({ url, expected, description }) => {
    const result = validator(url);
    if (result === expected) {
      console.log(`✓ ${description}`);
      results.passed++;
    } else {
      console.log(`✗ ${description}`);
      results.failed++;
    }
  });
  
  return results;
}

function isValid(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

const tests = [
  { url: 'https://example.com', expected: true, description: 'Valid HTTPS URL' },
  { url: 'invalid', expected: false, description: 'Invalid URL' }
];

console.log('Test Results:', testURLValidator(isValid, tests));
console.log('✓ Comprehensive testing');
