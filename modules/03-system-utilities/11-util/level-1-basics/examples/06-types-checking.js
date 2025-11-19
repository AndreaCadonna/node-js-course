/**
 * Example 6: Type Checking with util.types
 *
 * Learn how to reliably check types in JavaScript using util.types.
 * These checks are more reliable than typeof or instanceof for many cases.
 *
 * Key Concepts:
 * - util.types methods for different types
 * - Comparison with typeof and instanceof
 * - Checking built-in types reliably
 * - Validating complex types
 */

const util = require('util');

// ===== EXAMPLE 1: Basic Type Checking =====
console.log('=== Example 1: Basic Type Checking ===\n');

// Create various types
const values = {
  date: new Date(),
  regex: /test/g,
  promise: Promise.resolve(),
  map: new Map(),
  set: new Set(),
  weakMap: new WeakMap(),
  weakSet: new WeakSet()
};

// Check each type
console.log('isDate:', util.types.isDate(values.date));
console.log('isRegExp:', util.types.isRegExp(values.regex));
console.log('isPromise:', util.types.isPromise(values.promise));
console.log('isMap:', util.types.isMap(values.map));
console.log('isSet:', util.types.isSet(values.set));
console.log('isWeakMap:', util.types.isWeakMap(values.weakMap));
console.log('isWeakSet:', util.types.isWeakSet(values.weakSet));

// ===== EXAMPLE 2: Comparison with typeof =====
console.log('\n=== Example 2: util.types vs typeof ===\n');

const testValues = [
  new Date(),
  /regex/,
  null,
  [],
  {}
];

console.log('Comparison table:');
console.log('─'.repeat(60));

testValues.forEach(val => {
  console.log(`Value: ${String(val).substring(0, 20)}`);
  console.log(`  typeof: ${typeof val}`);
  console.log(`  isDate: ${util.types.isDate(val)}`);
  console.log(`  isRegExp: ${util.types.isRegExp(val)}`);
  console.log();
});

// ===== EXAMPLE 3: Comparison with instanceof =====
console.log('=== Example 3: util.types vs instanceof ===\n');

// Create a fake Date object
const fakeDate = Object.create(Date.prototype);

console.log('Real Date:');
const realDate = new Date();
console.log('  instanceof Date:', realDate instanceof Date);
console.log('  util.types.isDate:', util.types.isDate(realDate));

console.log('\nFake Date (Object.create(Date.prototype)):');
console.log('  instanceof Date:', fakeDate instanceof Date);  // true (wrong!)
console.log('  util.types.isDate:', util.types.isDate(fakeDate));  // false (correct!)

console.log('\n✓ util.types is more reliable!\n');

// ===== EXAMPLE 4: Array and Typed Array Checking =====
console.log('=== Example 4: Array and Typed Array Checking ===\n');

const regularArray = [1, 2, 3];
const uint8Array = new Uint8Array([1, 2, 3]);
const uint16Array = new Uint16Array([1, 2, 3]);
const float32Array = new Float32Array([1.5, 2.5, 3.5]);

console.log('Regular Array:');
console.log('  Array.isArray:', Array.isArray(regularArray));
console.log('  isTypedArray:', util.types.isTypedArray(regularArray));

console.log('\nUint8Array:');
console.log('  Array.isArray:', Array.isArray(uint8Array));
console.log('  isTypedArray:', util.types.isTypedArray(uint8Array));
console.log('  isUint8Array:', util.types.isUint8Array(uint8Array));

console.log('\nUint16Array:');
console.log('  isTypedArray:', util.types.isTypedArray(uint16Array));
console.log('  isUint16Array:', util.types.isUint16Array(uint16Array));

console.log('\nFloat32Array:');
console.log('  isTypedArray:', util.types.isTypedArray(float32Array));
console.log('  isFloat32Array:', util.types.isFloat32Array(float32Array));

// ===== EXAMPLE 5: Buffer Checking =====
console.log('\n=== Example 5: Buffer Checking ===\n');

const buffer = Buffer.from('hello');
const arrayBuffer = new ArrayBuffer(10);
const dataView = new DataView(arrayBuffer);

console.log('Buffer:');
console.log('  Buffer.isBuffer:', Buffer.isBuffer(buffer));
console.log('  util.types.isUint8Array:', util.types.isUint8Array(buffer));

console.log('\nArrayBuffer:');
console.log('  isArrayBuffer:', util.types.isArrayBuffer(arrayBuffer));

console.log('\nDataView:');
console.log('  isDataView:', util.types.isDataView(dataView));

// ===== EXAMPLE 6: Async Function Checking =====
console.log('\n=== Example 6: Async Function Checking ===\n');

function regularFunction() { }
async function asyncFunction() { }
const arrowFunction = () => { };
const asyncArrowFunction = async () => { };
const generatorFunction = function* () { };
const asyncGeneratorFunction = async function* () { };

console.log('Regular function:');
console.log('  isAsyncFunction:', util.types.isAsyncFunction(regularFunction));
console.log('  isGeneratorFunction:', util.types.isGeneratorFunction(regularFunction));

console.log('\nAsync function:');
console.log('  isAsyncFunction:', util.types.isAsyncFunction(asyncFunction));

console.log('\nGenerator function:');
console.log('  isGeneratorFunction:', util.types.isGeneratorFunction(generatorFunction));

console.log('\nAsync generator function:');
console.log('  isAsyncFunction:', util.types.isAsyncFunction(asyncGeneratorFunction));
console.log('  isGeneratorFunction:', util.types.isGeneratorFunction(asyncGeneratorFunction));

// ===== EXAMPLE 7: Proxy and Other Special Types =====
console.log('\n=== Example 7: Proxy and Special Types ===\n');

const target = { name: 'Original' };
const proxy = new Proxy(target, {});

console.log('Proxy:');
console.log('  isProxy:', util.types.isProxy(proxy));
console.log('  isProxy (target):', util.types.isProxy(target));

const boxedPrimitive = new String('boxed');
console.log('\nBoxed String:');
console.log('  typeof:', typeof boxedPrimitive);
console.log('  isStringObject:', util.types.isStringObject(boxedPrimitive));
console.log('  isStringObject (primitive):', util.types.isStringObject('primitive'));

// ===== EXAMPLE 8: Building a Type Validator =====
console.log('\n=== Example 8: Building a Type Validator ===\n');

function validateType(value, expectedType) {
  const checks = {
    'date': util.types.isDate,
    'regexp': util.types.isRegExp,
    'promise': util.types.isPromise,
    'map': util.types.isMap,
    'set': util.types.isSet,
    'array': Array.isArray,
    'buffer': Buffer.isBuffer,
    'typedarray': util.types.isTypedArray
  };

  const checker = checks[expectedType.toLowerCase()];
  if (!checker) {
    return { valid: false, error: 'Unknown type' };
  }

  const valid = checker(value);
  return {
    valid,
    error: valid ? null : `Expected ${expectedType}, got ${typeof value}`
  };
}

// Test the validator
console.log('Validating types:');
console.log('Date:', validateType(new Date(), 'date'));
console.log('String as Date:', validateType('2024-01-01', 'date'));
console.log('RegExp:', validateType(/test/, 'regexp'));
console.log('Array:', validateType([1, 2, 3], 'array'));
console.log('Buffer:', validateType(Buffer.from('test'), 'buffer'));

// ===== EXAMPLE 9: Practical Use Case - Function Arguments =====
console.log('\n=== Example 9: Validating Function Arguments ===\n');

function processData(data, callback) {
  // Validate data is a Promise
  if (!util.types.isPromise(data)) {
    throw new TypeError('data must be a Promise');
  }

  // Validate callback is an async function
  if (!util.types.isAsyncFunction(callback)) {
    throw new TypeError('callback must be an async function');
  }

  return data.then(callback);
}

// Test with valid arguments
async function handleData(result) {
  console.log('✓ Processing:', result);
  return result.toUpperCase();
}

processData(Promise.resolve('hello'), handleData)
  .then(result => console.log('✓ Final result:', result))
  .catch(err => console.error('❌ Error:', err.message));

/**
 * Important Notes:
 *
 * 1. Why util.types is Better:
 *    - Checks actual internal type (C++ class)
 *    - Not fooled by prototype manipulation
 *    - More reliable than instanceof
 *    - Consistent across contexts/realms
 *
 * 2. Common Type Checks:
 *    - isDate, isRegExp, isPromise
 *    - isMap, isSet, isWeakMap, isWeakSet
 *    - isTypedArray, isUint8Array, etc.
 *    - isArrayBuffer, isDataView
 *    - isAsyncFunction, isGeneratorFunction
 *    - isProxy, isModuleNamespaceObject
 *
 * 3. When to Use What:
 *    - typeof: Basic primitives (string, number, boolean)
 *    - instanceof: Class hierarchies
 *    - Array.isArray: Arrays specifically
 *    - util.types: Built-in objects, reliable checks
 *
 * 4. Performance:
 *    - util.types is very fast (native code)
 *    - Slightly slower than typeof
 *    - Much more accurate for complex types
 */

/**
 * Try This:
 *
 * 1. Create a comprehensive type validator function
 * 2. Build a runtime type checker for function arguments
 * 3. Compare performance of typeof vs util.types
 * 4. Check types of Node.js built-in objects (process, Buffer, etc.)
 * 5. Build a type assertion library using util.types
 */
