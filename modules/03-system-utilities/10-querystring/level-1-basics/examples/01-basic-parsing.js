/**
 * Example 1: Basic Query String Parsing
 *
 * Demonstrates how to parse query strings into JavaScript objects
 * using the querystring.parse() method.
 */

const querystring = require('querystring');

console.log('=== Basic Query String Parsing ===\n');

// 1. Simple parsing
console.log('1. Simple query string');
const simple = querystring.parse('name=John&age=30');
console.log('Input: "name=John&age=30"');
console.log('Output:', simple);
console.log('Access name:', simple.name);
console.log('Access age:', simple.age);
console.log('');

// 2. Multiple parameters
console.log('2. Multiple parameters');
const multiple = querystring.parse('search=nodejs&category=tutorial&page=1&limit=10');
console.log('Input: "search=nodejs&category=tutorial&page=1&limit=10"');
console.log('Output:', multiple);
console.log('');

// 3. Empty values
console.log('3. Empty values');
const empty = querystring.parse('name=John&email=&active=');
console.log('Input: "name=John&email=&active="');
console.log('Output:', empty);
console.log('Email value:', empty.email); // Empty string
console.log('');

// 4. Parameters without values
console.log('4. Parameters without values');
const noValue = querystring.parse('debug&verbose&force');
console.log('Input: "debug&verbose&force"');
console.log('Output:', noValue);
console.log('debug value:', noValue.debug); // Empty string
console.log('');

// 5. Duplicate keys (creates array)
console.log('5. Duplicate keys create arrays');
const duplicate = querystring.parse('color=red&color=blue&color=green');
console.log('Input: "color=red&color=blue&color=green"');
console.log('Output:', duplicate);
console.log('Is array?', Array.isArray(duplicate.color));
console.log('Values:', duplicate.color);
console.log('');

// 6. Mixed single and multiple values
console.log('6. Mixed single and multiple values');
const mixed = querystring.parse('name=John&tag=nodejs&tag=javascript&tag=tutorial&age=30');
console.log('Input: "name=John&tag=nodejs&tag=javascript&tag=tutorial&age=30"');
console.log('Output:', mixed);
console.log('name (single):', mixed.name);
console.log('tag (array):', mixed.tag);
console.log('');

// 7. URL-encoded characters
console.log('7. URL-encoded characters');
const encoded = querystring.parse('name=John%20Doe&email=john%40example.com');
console.log('Input: "name=John%20Doe&email=john%40example.com"');
console.log('Output:', encoded);
console.log('Decoded name:', encoded.name); // Automatically decoded
console.log('Decoded email:', encoded.email);
console.log('');

// 8. Special characters in values
console.log('8. Special characters automatically decoded');
const special = querystring.parse('message=Hello%20World!&price=$100&percent=50%25');
console.log('Input: "message=Hello%20World!&price=$100&percent=50%25"');
console.log('Output:', special);
console.log('');

// 9. Plus signs (treated as spaces)
console.log('9. Plus signs in query strings');
const plusSigns = querystring.parse('name=John+Doe&city=New+York');
console.log('Input: "name=John+Doe&city=New+York"');
console.log('Output:', plusSigns);
console.log('Note: Plus signs are kept as-is in querystring module');
console.log('(URLSearchParams treats + as space)');
console.log('');

// 10. Real-world example: Search URL
console.log('10. Real-world search URL');
const searchUrl = 'q=nodejs+tutorial&sort=relevance&time=year&page=1';
const searchParams = querystring.parse(searchUrl);
console.log('Search URL:', searchUrl);
console.log('Parsed:', searchParams);
console.log('Search query:', searchParams.q);
console.log('Sort by:', searchParams.sort);
console.log('Time filter:', searchParams.time);
console.log('Page:', searchParams.page);
console.log('');

// Important notes
console.log('=== Important Notes ===');
console.log('✓ All values are strings (even numbers)');
console.log('✓ Duplicate keys create arrays');
console.log('✓ Empty values become empty strings');
console.log('✓ URL encoding is automatically decoded');
console.log('✓ The leading "?" should NOT be included');
console.log('');

// Common mistake: Including the ?
console.log('=== Common Mistake: Including ? ===');
const withQuestion = querystring.parse('?name=John&age=30');
console.log('Input: "?name=John&age=30"');
console.log('Output:', withQuestion);
console.log('Notice the first key is "?name" not "name"!');
console.log('');

// Correct way to handle full URL
console.log('=== Correct: Extracting from full URL ===');
const fullUrl = 'https://example.com/search?q=nodejs&page=2';
const queryPart = fullUrl.split('?')[1]; // Get part after ?
const correctParsed = querystring.parse(queryPart);
console.log('Full URL:', fullUrl);
console.log('Query part:', queryPart);
console.log('Parsed:', correctParsed);
