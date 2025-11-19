/**
 * Example 4: Type Handling in Query Strings
 *
 * Demonstrates how to handle different data types when working
 * with query strings (everything becomes strings!).
 */

const querystring = require('querystring');

console.log('=== Type Handling in Query Strings ===\n');

// 1. All parsed values are strings
console.log('1. All parsed values are STRINGS');
const parsed = querystring.parse('page=1&limit=20&price=99.99');
console.log('Parsed:', parsed);
console.log('typeof page:', typeof parsed.page);
console.log('typeof limit:', typeof parsed.limit);
console.log('typeof price:', typeof parsed.price);
console.log('All are strings, not numbers!');
console.log('');

// 2. Converting to numbers
console.log('2. Converting strings to numbers');
const params = querystring.parse('page=2&limit=50&offset=100');
console.log('Original:', params);

// Convert to integers
const page = parseInt(params.page, 10);
const limit = parseInt(params.limit, 10);
const offset = parseInt(params.offset, 10);

console.log('Converted:');
console.log('  page:', page, typeof page);
console.log('  limit:', limit, typeof limit);
console.log('  offset:', offset, typeof offset);
console.log('');

// 3. Converting to floats
console.log('3. Converting to floating point numbers');
const priceParams = querystring.parse('min=19.99&max=199.99&tax=0.08');
console.log('Original:', priceParams);

const minPrice = parseFloat(priceParams.min);
const maxPrice = parseFloat(priceParams.max);
const taxRate = parseFloat(priceParams.tax);

console.log('Converted:');
console.log('  minPrice:', minPrice, typeof minPrice);
console.log('  maxPrice:', maxPrice, typeof maxPrice);
console.log('  taxRate:', taxRate, typeof taxRate);
console.log('');

// 4. Boolean values
console.log('4. Boolean values (tricky!)');
const boolParams = querystring.parse('active=true&verified=false&premium=1');
console.log('Parsed:', boolParams);
console.log('typeof active:', typeof boolParams.active); // string "true"
console.log('typeof verified:', typeof boolParams.verified); // string "false"

// Common mistake
if (boolParams.verified) {
  console.log('❌ This runs even though verified is "false"!');
  console.log('   Because "false" is a non-empty string (truthy)');
}

// Correct conversion
const isActive = boolParams.active === 'true';
const isVerified = boolParams.verified === 'true';
const isPremium = boolParams.premium === '1';

console.log('Correct boolean conversions:');
console.log('  isActive:', isActive, typeof isActive);
console.log('  isVerified:', isVerified, typeof isVerified);
console.log('  isPremium:', isPremium, typeof isPremium);
console.log('');

// 5. Helper function for safe conversions
console.log('5. Safe conversion helper functions');

function toInt(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

function toFloat(value, defaultValue = 0.0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null) return defaultValue;
  return value === 'true' || value === '1';
}

// Test with good values
const good = querystring.parse('page=5&price=29.99&active=true');
console.log('Good values:', good);
console.log('  page:', toInt(good.page, 1));
console.log('  price:', toFloat(good.price, 0));
console.log('  active:', toBool(good.active, false));
console.log('');

// Test with bad values
const bad = querystring.parse('page=abc&price=xyz&active=maybe');
console.log('Bad values:', bad);
console.log('  page:', toInt(bad.page, 1)); // Uses default
console.log('  price:', toFloat(bad.price, 0)); // Uses default
console.log('  active:', toBool(bad.active, false)); // Uses default
console.log('');

// 6. Arrays in query strings
console.log('6. Arrays (single vs multiple values)');
const singleColor = querystring.parse('color=red');
const multiColor = querystring.parse('color=red&color=blue');

console.log('Single value:', singleColor.color);
console.log('Is array?', Array.isArray(singleColor.color));

console.log('Multiple values:', multiColor.color);
console.log('Is array?', Array.isArray(multiColor.color));

// Safe array handling
function toArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

console.log('Safe conversion:');
console.log('  Single:', toArray(singleColor.color));
console.log('  Multiple:', toArray(multiColor.color));
console.log('  Missing:', toArray(undefined));
console.log('');

// 7. Dates
console.log('7. Date handling');
const dateParams = querystring.parse('startDate=2024-01-01&endDate=2024-12-31');
console.log('Parsed:', dateParams);

const startDate = new Date(dateParams.startDate);
const endDate = new Date(dateParams.endDate);

console.log('Converted:');
console.log('  startDate:', startDate);
console.log('  endDate:', endDate);
console.log('  Valid?', !isNaN(startDate.getTime()));
console.log('');

// 8. JSON in query strings (not recommended but possible)
console.log('8. JSON in query strings');
const jsonParam = querystring.parse('data=%7B%22name%22%3A%22John%22%2C%22age%22%3A30%7D');
console.log('Encoded JSON:', jsonParam.data);

try {
  const parsed = JSON.parse(jsonParam.data);
  console.log('Parsed JSON:', parsed);
} catch (err) {
  console.log('Error parsing JSON:', err.message);
}
console.log('Note: JSON in query strings is ugly and error-prone!');
console.log('');

// 9. Building query strings with types
console.log('9. Building query strings (types auto-converted)');
const objWithTypes = {
  page: 5,              // number
  active: true,         // boolean
  price: 99.99,         // float
  tags: ['a', 'b'],     // array
  name: 'Product'       // string
};

const str = querystring.stringify(objWithTypes);
console.log('Object:', objWithTypes);
console.log('Query string:', str);
console.log('Note: All values converted to strings');
console.log('');

// 10. Complete example: Search parameters
console.log('10. Complete example: Search with type conversions');

function parseSearchParams(queryStr) {
  const raw = querystring.parse(queryStr);

  return {
    query: raw.q || '',
    page: toInt(raw.page, 1),
    limit: toInt(raw.limit, 20),
    sort: raw.sort || 'relevance',
    filters: toArray(raw.filter),
    includeArchived: toBool(raw.archived, false),
    minPrice: toFloat(raw.minPrice, 0),
    maxPrice: toFloat(raw.maxPrice, Number.MAX_VALUE)
  };
}

const search1 = parseSearchParams('q=nodejs&page=3&limit=50&filter=tutorial&filter=free&archived=true&minPrice=0&maxPrice=99.99');
console.log('Parsed search params:', search1);
console.log('');

const search2 = parseSearchParams('q=javascript'); // Minimal params
console.log('Parsed with defaults:', search2);
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ All parsed values are strings!');
console.log('✓ Use parseInt() for integers');
console.log('✓ Use parseFloat() for decimals');
console.log('✓ Compare strings for booleans ("true", "false")');
console.log('✓ Arrays: check with Array.isArray()');
console.log('✓ Always validate and provide defaults');
console.log('✓ Create helper functions for safe conversions');
