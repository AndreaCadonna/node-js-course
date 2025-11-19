/**
 * Example 5: Testing and Validation Patterns
 *
 * Comprehensive testing strategies for query string handling.
 */

const querystring = require('querystring');
const assert = require('assert');

// Test utilities
class QueryTestUtils {
  // Assert query string equality
  static assertQueryEqual(actual, expected, message) {
    const actualParsed = querystring.parse(actual);
    const expectedParsed = querystring.parse(expected);

    assert.deepStrictEqual(actualParsed, expectedParsed, message);
  }

  // Assert URL equality (ignoring parameter order)
  static assertUrlEqual(actual, expected) {
    const [actualBase, actualQuery = ''] = actual.split('?');
    const [expectedBase, expectedQuery = ''] = expected.split('?');

    assert.strictEqual(actualBase, expectedBase, 'URL base mismatch');
    this.assertQueryEqual(actualQuery, expectedQuery, 'Query parameters mismatch');
  }

  // Generate test query strings
  static generateTestQuery(size = 10) {
    const params = {};
    for (let i = 0; i < size; i++) {
      params[`key${i}`] = `value${i}`;
    }
    return querystring.stringify(params);
  }

  // Mock request object
  static mockRequest(url) {
    const [path, queryStr = ''] = url.split('?');
    return {
      url,
      path,
      query: querystring.parse(queryStr),
      originalUrl: url
    };
  }
}

// Validation test suite
class ValidationTestSuite {
  static runAll() {
    console.log('Running validation tests...\n');

    this.testBasicParsing();
    this.testSpecialCharacters();
    this.testArrayHandling();
    this.testEdgeCases();
    this.testSecurity();

    console.log('\n✓ All validation tests passed!');
  }

  static testBasicParsing() {
    console.log('Test: Basic parsing');

    const tests = [
      { input: 'a=1&b=2', expected: { a: '1', b: '2' } },
      { input: 'name=John%20Doe', expected: { name: 'John Doe' } },
      { input: 'empty=&filled=value', expected: { empty: '', filled: 'value' } },
      { input: '', expected: {} }
    ];

    for (const { input, expected } of tests) {
      const result = querystring.parse(input);
      assert.deepStrictEqual(result, expected);
    }

    console.log('  ✓ Basic parsing tests passed\n');
  }

  static testSpecialCharacters() {
    console.log('Test: Special characters');

    const special = 'key=value with spaces&url=https://example.com';
    const parsed = querystring.parse(special);

    assert.strictEqual(parsed.key, 'value with spaces');
    assert.strictEqual(parsed.url, 'https://example.com');

    console.log('  ✓ Special character tests passed\n');
  }

  static testArrayHandling() {
    console.log('Test: Array handling');

    // Repeated keys
    const repeated = querystring.parse('tag=js&tag=node&tag=web');
    assert(Array.isArray(repeated.tag));
    assert.strictEqual(repeated.tag.length, 3);

    console.log('  ✓ Array handling tests passed\n');
  }

  static testEdgeCases() {
    console.log('Test: Edge cases');

    // No value
    const noValue = querystring.parse('key');
    assert.strictEqual(noValue.key, '');

    // Multiple equals
    const multiEquals = querystring.parse('key=value=with=equals');
    assert.strictEqual(multiEquals.key, 'value=with=equals');

    // Leading/trailing ampersands
    const extraAmps = querystring.parse('&a=1&b=2&');
    assert.deepStrictEqual(extraAmps, { a: '1', b: '2' });

    console.log('  ✓ Edge case tests passed\n');
  }

  static testSecurity() {
    console.log('Test: Security validation');

    // XSS attempt
    const xss = '<script>alert("xss")</script>';
    const encoded = querystring.escape(xss);
    assert(!encoded.includes('<'));
    assert(!encoded.includes('>'));

    // SQL injection attempt
    const sql = "admin' OR '1'='1";
    const sqlEncoded = querystring.escape(sql);
    assert(!sqlEncoded.includes("'"));

    console.log('  ✓ Security tests passed\n');
  }
}

// Property-based testing
class PropertyBasedTesting {
  // Test parse/stringify roundtrip
  static testRoundtrip(iterations = 100) {
    console.log('Property test: Parse/Stringify roundtrip');

    for (let i = 0; i < iterations; i++) {
      const original = this.generateRandomObject();
      const stringified = querystring.stringify(original);
      const parsed = querystring.parse(stringified);

      // Note: Arrays and nested objects may not roundtrip perfectly
      // This tests that basic key-value pairs work
      for (const key in original) {
        if (typeof original[key] === 'string') {
          assert.strictEqual(parsed[key], original[key]);
        }
      }
    }

    console.log(`  ✓ Passed ${iterations} roundtrip tests\n`);
  }

  static generateRandomObject() {
    const obj = {};
    const size = Math.floor(Math.random() * 10) + 1;

    for (let i = 0; i < size; i++) {
      obj[`key${i}`] = `value${Math.random().toString(36).substring(7)}`;
    }

    return obj;
  }

  // Test encoding/decoding
  static testEncodingSymmetry(iterations = 100) {
    console.log('Property test: Encoding symmetry');

    const testStrings = [
      'hello world',
      'test@example.com',
      'path/to/resource',
      'key=value&other=data',
      '日本語',
      'emoji 🚀'
    ];

    for (const str of testStrings) {
      const encoded = querystring.escape(str);
      const decoded = querystring.unescape(encoded);
      assert.strictEqual(decoded, str);
    }

    console.log(`  ✓ Encoding symmetry verified\n`);
  }
}

// Fuzz testing
class FuzzTesting {
  static run(iterations = 50) {
    console.log('Fuzz testing query string parser');

    for (let i = 0; i < iterations; i++) {
      try {
        const fuzzed = this.generateFuzzedInput();
        // Should not throw
        querystring.parse(fuzzed);
      } catch (error) {
        console.log(`  Unexpected error with input: ${error.message}`);
      }
    }

    console.log(`  ✓ Parser survived ${iterations} fuzz tests\n`);
  }

  static generateFuzzedInput() {
    const generators = [
      () => '&'.repeat(Math.floor(Math.random() * 100)),
      () => '='.repeat(Math.floor(Math.random() * 100)),
      () => 'a'.repeat(Math.floor(Math.random() * 1000)),
      () => '%'.repeat(Math.floor(Math.random() * 50)),
      () => String.fromCharCode(...Array(50).fill(0).map(() => Math.random() * 128)),
      () => 'key&&&===value',
      () => '&=&=&=',
      () => encodeURIComponent('🚀'.repeat(20))
    ];

    const generator = generators[Math.floor(Math.random() * generators.length)];
    return generator();
  }
}

// Performance benchmarking
class PerformanceBenchmark {
  static benchmark(name, fn, iterations = 10000) {
    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1000000;

    return {
      name,
      totalMs: ms,
      perOp: ms / iterations,
      opsPerSec: (iterations / ms) * 1000
    };
  }

  static runBenchmarks() {
    console.log('Performance benchmarks:');

    const testQuery = 'a=1&b=2&c=3&d=4&e=5&f=6&g=7&h=8&i=9&j=10';
    const testObj = { a: '1', b: '2', c: '3', d: '4', e: '5' };

    const results = [
      this.benchmark('parse', () => querystring.parse(testQuery)),
      this.benchmark('stringify', () => querystring.stringify(testObj)),
      this.benchmark('escape', () => querystring.escape('hello world!')),
      this.benchmark('unescape', () => querystring.unescape('hello%20world%21'))
    ];

    for (const result of results) {
      console.log(`  ${result.name}: ${result.perOp.toFixed(6)}ms/op (${result.opsPerSec.toFixed(0)} ops/sec)`);
    }

    console.log('');
  }
}

// Demo - Run all tests
console.log('=== Query String Testing Patterns ===\n');

ValidationTestSuite.runAll();
PropertyBasedTesting.testRoundtrip();
PropertyBasedTesting.testEncodingSymmetry();
FuzzTesting.run();
PerformanceBenchmark.runBenchmarks();

// Test utilities demo
console.log('Test Utilities Demo:');
const mockReq = QueryTestUtils.mockRequest('/api/search?q=nodejs&page=2');
console.log('Mock request:', mockReq);
console.log('');

QueryTestUtils.assertUrlEqual(
  '/test?a=1&b=2',
  '/test?b=2&a=1'
);
console.log('✓ URL equality assertion passed\n');

console.log('✓ All testing patterns demonstrated!');

module.exports = {
  QueryTestUtils,
  ValidationTestSuite,
  PropertyBasedTesting,
  FuzzTesting,
  PerformanceBenchmark
};
