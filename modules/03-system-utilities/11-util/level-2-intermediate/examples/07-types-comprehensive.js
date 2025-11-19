/**
 * Example 7: Comprehensive Guide to util.types
 *
 * Master all util.types methods for reliable type checking in Node.js.
 * These functions provide accurate type detection for both JavaScript
 * primitives and Node.js-specific types.
 *
 * Key Concepts:
 * - Checking JavaScript primitive types
 * - Detecting Node.js-specific objects
 * - Difference from typeof and instanceof
 * - Building robust type validators
 */

const util = require('util');

// ===== EXAMPLE 1: JavaScript Primitive Types =====
console.log('=== Example 1: Primitive Type Checking ===\n');

// BigInt detection
console.log('BigInt:');
console.log('util.types.isBigInt(123n):', util.types.isBigInt(123n));
console.log('util.types.isBigInt(123):', util.types.isBigInt(123));
console.log('typeof 123n:', typeof 123n, '\n');

// Boolean object vs primitive
console.log('Boolean:');
console.log('util.types.isBooleanObject(new Boolean(true)):',
  util.types.isBooleanObject(new Boolean(true)));
console.log('util.types.isBooleanObject(true):',
  util.types.isBooleanObject(true));
console.log('typeof true:', typeof true, '\n');

// Number object vs primitive
console.log('Number:');
console.log('util.types.isNumberObject(new Number(42)):',
  util.types.isNumberObject(new Number(42)));
console.log('util.types.isNumberObject(42):',
  util.types.isNumberObject(42));

// String object vs primitive
console.log('\nString:');
console.log('util.types.isStringObject(new String("hello")):',
  util.types.isStringObject(new String("hello")));
console.log('util.types.isStringObject("hello"):',
  util.types.isStringObject("hello"));

// Symbol object
console.log('\nSymbol:');
console.log('util.types.isSymbolObject(Object(Symbol())):',
  util.types.isSymbolObject(Object(Symbol())));
console.log('util.types.isSymbolObject(Symbol()):',
  util.types.isSymbolObject(Symbol()));

// ===== EXAMPLE 2: JavaScript Built-in Objects =====
console.log('\n=== Example 2: Built-in Object Types ===\n');

// Date
console.log('Date:');
const date = new Date();
console.log('util.types.isDate(new Date()):', util.types.isDate(date));
console.log('instanceof Date:', date instanceof Date);
console.log('typeof:', typeof date, '\n');

// RegExp
console.log('RegExp:');
const regex = /pattern/;
console.log('util.types.isRegExp(/pattern/):', util.types.isRegExp(regex));
console.log('instanceof RegExp:', regex instanceof RegExp);

// Error
console.log('\nError types:');
console.log('Error:', util.types.isNativeError(new Error('oops')));
console.log('TypeError:', util.types.isNativeError(new TypeError('oops')));
console.log('Custom Error:', util.types.isNativeError({ message: 'fake' }));

// Promise
console.log('\nPromise:');
const promise = Promise.resolve(42);
console.log('util.types.isPromise(Promise.resolve()):',
  util.types.isPromise(promise));
console.log('util.types.isPromise({ then: () => {} }):',
  util.types.isPromise({ then: () => {} })); // Not a real promise

// Map and Set
console.log('\nMap and Set:');
console.log('util.types.isMap(new Map()):', util.types.isMap(new Map()));
console.log('util.types.isSet(new Set()):', util.types.isSet(new Set()));
console.log('util.types.isWeakMap(new WeakMap()):', util.types.isWeakMap(new WeakMap()));
console.log('util.types.isWeakSet(new WeakSet()):', util.types.isWeakSet(new WeakSet()));

// ===== EXAMPLE 3: TypedArray Types =====
console.log('\n=== Example 3: TypedArray Detection ===\n');

// Various TypedArrays
console.log('TypedArrays:');
console.log('Int8Array:', util.types.isInt8Array(new Int8Array()));
console.log('Uint8Array:', util.types.isUint8Array(new Uint8Array()));
console.log('Uint8ClampedArray:', util.types.isUint8ClampedArray(new Uint8ClampedArray()));
console.log('Int16Array:', util.types.isInt16Array(new Int16Array()));
console.log('Uint16Array:', util.types.isUint16Array(new Uint16Array()));
console.log('Int32Array:', util.types.isInt32Array(new Int32Array()));
console.log('Uint32Array:', util.types.isUint32Array(new Uint32Array()));
console.log('Float32Array:', util.types.isFloat32Array(new Float32Array()));
console.log('Float64Array:', util.types.isFloat64Array(new Float64Array()));
console.log('BigInt64Array:', util.types.isBigInt64Array(new BigInt64Array()));
console.log('BigUint64Array:', util.types.isBigUint64Array(new BigUint64Array()));

// Generic check
console.log('\nGeneric TypedArray check:');
console.log('util.types.isTypedArray(new Uint8Array()):',
  util.types.isTypedArray(new Uint8Array()));
console.log('util.types.isTypedArray([1, 2, 3]):',
  util.types.isTypedArray([1, 2, 3]));

// ===== EXAMPLE 4: Buffer and ArrayBuffer =====
console.log('\n=== Example 4: Binary Data Types ===\n');

// Buffer
const buffer = Buffer.from('hello');
console.log('Buffer:');
console.log('util.types.isUint8Array(Buffer):', util.types.isUint8Array(buffer));
console.log('Buffer.isBuffer():', Buffer.isBuffer(buffer));

// ArrayBuffer
const arrayBuffer = new ArrayBuffer(10);
console.log('\nArrayBuffer:');
console.log('util.types.isArrayBuffer(new ArrayBuffer()):',
  util.types.isArrayBuffer(arrayBuffer));

// SharedArrayBuffer
console.log('\nSharedArrayBuffer:');
console.log('util.types.isSharedArrayBuffer(new SharedArrayBuffer(10)):',
  util.types.isSharedArrayBuffer(new SharedArrayBuffer(10)));

// DataView
const dataView = new DataView(arrayBuffer);
console.log('\nDataView:');
console.log('util.types.isDataView(new DataView()):',
  util.types.isDataView(dataView));

// ===== EXAMPLE 5: Async Types =====
console.log('\n=== Example 5: Async Function Types ===\n');

// Async function
async function asyncFunc() {}
console.log('AsyncFunction:');
console.log('util.types.isAsyncFunction(async () => {}):',
  util.types.isAsyncFunction(asyncFunc));
console.log('util.types.isAsyncFunction(() => {}):',
  util.types.isAsyncFunction(() => {}));

// Generator function
function* generatorFunc() { yield 1; }
console.log('\nGeneratorFunction:');
console.log('util.types.isGeneratorFunction(function*() {}):',
  util.types.isGeneratorFunction(generatorFunc));
console.log('util.types.isGeneratorFunction(function() {}):',
  util.types.isGeneratorFunction(function() {}));

// Generator object
const generator = generatorFunc();
console.log('\nGeneratorObject:');
console.log('util.types.isGeneratorObject(generator):',
  util.types.isGeneratorObject(generator));

// ===== EXAMPLE 6: Proxy and External =====
console.log('\n=== Example 6: Special Object Types ===\n');

// Proxy
const proxy = new Proxy({}, {});
console.log('Proxy:');
console.log('util.types.isProxy(new Proxy({}, {})):',
  util.types.isProxy(proxy));
console.log('util.types.isProxy({}):', util.types.isProxy({}));

// Arguments object
function testArgs() {
  console.log('\nArguments object:');
  console.log('util.types.isArgumentsObject(arguments):',
    util.types.isArgumentsObject(arguments));
  console.log('util.types.isArgumentsObject([]):',
    util.types.isArgumentsObject([]));
}
testArgs(1, 2, 3);

// ModuleNamespaceObject
console.log('\nModuleNamespaceObject:');
console.log('(Only available in ES modules)');

// ===== EXAMPLE 7: Building a Type Validator =====
console.log('\n=== Example 7: Custom Type Validator ===\n');

class TypeValidator {
  static validate(value, expectedType) {
    const validators = {
      'string': (v) => typeof v === 'string',
      'number': (v) => typeof v === 'number' && !isNaN(v),
      'boolean': (v) => typeof v === 'boolean',
      'array': (v) => Array.isArray(v),
      'object': (v) => typeof v === 'object' && v !== null && !Array.isArray(v),
      'function': (v) => typeof v === 'function',
      'date': (v) => util.types.isDate(v),
      'regexp': (v) => util.types.isRegExp(v),
      'promise': (v) => util.types.isPromise(v),
      'map': (v) => util.types.isMap(v),
      'set': (v) => util.types.isSet(v),
      'buffer': (v) => Buffer.isBuffer(v),
      'typedarray': (v) => util.types.isTypedArray(v),
      'bigint': (v) => util.types.isBigInt(v),
      'error': (v) => util.types.isNativeError(v),
      'asyncfunction': (v) => util.types.isAsyncFunction(v),
    };

    const validator = validators[expectedType.toLowerCase()];
    if (!validator) {
      throw new Error(`Unknown type: ${expectedType}`);
    }

    return validator(value);
  }

  static assertType(value, expectedType, message) {
    if (!this.validate(value, expectedType)) {
      throw new TypeError(
        message || `Expected ${expectedType}, got ${typeof value}`
      );
    }
  }

  static getType(value) {
    // Check util.types first for specific types
    if (util.types.isDate(value)) return 'Date';
    if (util.types.isRegExp(value)) return 'RegExp';
    if (util.types.isPromise(value)) return 'Promise';
    if (util.types.isMap(value)) return 'Map';
    if (util.types.isSet(value)) return 'Set';
    if (util.types.isTypedArray(value)) return 'TypedArray';
    if (util.types.isBigInt(value)) return 'BigInt';
    if (util.types.isNativeError(value)) return 'Error';
    if (Buffer.isBuffer(value)) return 'Buffer';
    if (Array.isArray(value)) return 'Array';

    // Fall back to typeof
    return typeof value;
  }
}

// Test the validator
console.log('Type validation:');
console.log('Is "hello" a string?', TypeValidator.validate('hello', 'string'));
console.log('Is 42 a number?', TypeValidator.validate(42, 'number'));
console.log('Is new Date() a date?', TypeValidator.validate(new Date(), 'date'));
console.log('Is Promise a promise?', TypeValidator.validate(Promise.resolve(), 'promise'));

console.log('\nType detection:');
console.log('Type of "hello":', TypeValidator.getType('hello'));
console.log('Type of new Map():', TypeValidator.getType(new Map()));
console.log('Type of Buffer:', TypeValidator.getType(Buffer.from('test')));

// ===== EXAMPLE 8: Comparison with typeof and instanceof =====
console.log('\n=== Example 8: typeof vs instanceof vs util.types ===\n');

const testValue = new Date();

console.log('For new Date():');
console.log('typeof:', typeof testValue);
console.log('instanceof Date:', testValue instanceof Date);
console.log('util.types.isDate():', util.types.isDate(testValue));

console.log('\nFor Promise.resolve():');
const prom = Promise.resolve();
console.log('typeof:', typeof prom);
console.log('instanceof Promise:', prom instanceof Promise);
console.log('util.types.isPromise():', util.types.isPromise(prom));

console.log('\nFor Buffer.from():');
const buf = Buffer.from('test');
console.log('typeof:', typeof buf);
console.log('instanceof Uint8Array:', buf instanceof Uint8Array);
console.log('Buffer.isBuffer():', Buffer.isBuffer(buf));
console.log('util.types.isUint8Array():', util.types.isUint8Array(buf));

// ===== EXAMPLE 9: Practical Use Cases =====
console.log('\n=== Example 9: Practical Validation ===\n');

function processData(data) {
  // Validate input types
  if (!util.types.isMap(data) && !util.types.isSet(data) && !Array.isArray(data)) {
    throw new TypeError('Expected Map, Set, or Array');
  }

  console.log('Processing', TypeValidator.getType(data));

  if (util.types.isMap(data)) {
    console.log('  Map with', data.size, 'entries');
  } else if (util.types.isSet(data)) {
    console.log('  Set with', data.size, 'values');
  } else {
    console.log('  Array with', data.length, 'items');
  }
}

processData(new Map([['key', 'value']]));
processData(new Set([1, 2, 3]));
processData([1, 2, 3]);

/**
 * Important Notes:
 *
 * 1. util.types vs typeof:
 *    - typeof: Basic JavaScript types only
 *    - util.types: Precise type detection including built-ins
 *    - util.types is more reliable for objects
 *
 * 2. util.types vs instanceof:
 *    - instanceof: Can be fooled by prototype manipulation
 *    - util.types: Checks internal slots (more reliable)
 *    - instanceof fails across realms/contexts
 *    - util.types works across contexts
 *
 * 3. Common Methods:
 *    Primitives:
 *      - isBigInt()
 *      - isBooleanObject(), isNumberObject(), isStringObject()
 *      - isSymbolObject()
 *
 *    Built-in Objects:
 *      - isDate(), isRegExp(), isNativeError()
 *      - isPromise(), isMap(), isSet()
 *      - isWeakMap(), isWeakSet()
 *
 *    TypedArrays:
 *      - isTypedArray() (generic)
 *      - isInt8Array(), isUint8Array(), etc.
 *      - isArrayBuffer(), isSharedArrayBuffer()
 *      - isDataView()
 *
 *    Functions:
 *      - isAsyncFunction()
 *      - isGeneratorFunction()
 *      - isGeneratorObject()
 *
 *    Special:
 *      - isProxy()
 *      - isArgumentsObject()
 *      - isModuleNamespaceObject()
 *
 * 4. Best Practices:
 *    ✅ Use util.types for reliable type checking
 *    ✅ Combine with typeof for primitives
 *    ✅ Build type validators for complex validation
 *    ✅ Use in function parameter validation
 *    ❌ Don't use instanceof for built-in types
 *    ❌ Don't rely on typeof for objects
 *
 * 5. Performance:
 *    - util.types methods are fast (C++ implementation)
 *    - Checking internal slots is faster than instanceof
 *    - No overhead for type checking in production
 */

/**
 * Try This:
 *
 * 1. Build a comprehensive type assertion library
 * 2. Create a function that validates complex object shapes
 * 3. Implement runtime type checking for function parameters
 * 4. Build a type-safe data structure using util.types
 * 5. Compare performance of typeof vs instanceof vs util.types
 */

/**
 * Complete util.types Methods:
 *
 * util.types.isAnyArrayBuffer(value)
 * util.types.isArgumentsObject(value)
 * util.types.isArrayBuffer(value)
 * util.types.isArrayBufferView(value)
 * util.types.isAsyncFunction(value)
 * util.types.isBigInt64Array(value)
 * util.types.isBigUint64Array(value)
 * util.types.isBooleanObject(value)
 * util.types.isBoxedPrimitive(value)
 * util.types.isDataView(value)
 * util.types.isDate(value)
 * util.types.isExternal(value)
 * util.types.isFloat32Array(value)
 * util.types.isFloat64Array(value)
 * util.types.isGeneratorFunction(value)
 * util.types.isGeneratorObject(value)
 * util.types.isInt8Array(value)
 * util.types.isInt16Array(value)
 * util.types.isInt32Array(value)
 * util.types.isMap(value)
 * util.types.isMapIterator(value)
 * util.types.isModuleNamespaceObject(value)
 * util.types.isNativeError(value)
 * util.types.isNumberObject(value)
 * util.types.isPromise(value)
 * util.types.isProxy(value)
 * util.types.isRegExp(value)
 * util.types.isSet(value)
 * util.types.isSetIterator(value)
 * util.types.isSharedArrayBuffer(value)
 * util.types.isStringObject(value)
 * util.types.isSymbolObject(value)
 * util.types.isTypedArray(value)
 * util.types.isUint8Array(value)
 * util.types.isUint8ClampedArray(value)
 * util.types.isUint16Array(value)
 * util.types.isUint32Array(value)
 * util.types.isWeakMap(value)
 * util.types.isWeakSet(value)
 */
