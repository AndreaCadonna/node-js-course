/**
 * Exercise 4 Solution: Type Validator
 *
 * This solution demonstrates:
 * - Using util.types for accurate type checking
 * - Building a comprehensive validation system
 * - Handling edge cases (null, undefined, NaN)
 * - Schema validation for objects
 * - Argument validation for functions
 */

const util = require('util');

/**
 * Step 1: Create comprehensive Validator class
 */
class Validator {
  /**
   * Step 2: Basic type checking methods
   */

  static isString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  static isNumber(value) {
    // Exclude NaN
    return typeof value === 'number' && !Number.isNaN(value);
  }

  static isBoolean(value) {
    return typeof value === 'boolean' || value instanceof Boolean;
  }

  static isArray(value) {
    return Array.isArray(value);
  }

  static isObject(value) {
    // Plain objects only, not arrays, dates, etc.
    return value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp);
  }

  static isFunction(value) {
    return typeof value === 'function';
  }

  static isPromise(value) {
    return util.types.isPromise(value);
  }

  static isDate(value) {
    return util.types.isDate(value);
  }

  static isBuffer(value) {
    return Buffer.isBuffer(value);
  }

  static isRegExp(value) {
    return util.types.isRegExp(value);
  }

  static isNull(value) {
    return value === null;
  }

  static isUndefined(value) {
    return value === undefined;
  }

  static isNaN(value) {
    return Number.isNaN(value);
  }

  static isMap(value) {
    return util.types.isMap(value);
  }

  static isSet(value) {
    return util.types.isSet(value);
  }

  static isArrayBuffer(value) {
    return util.types.isArrayBuffer(value);
  }

  /**
   * Step 3: Get descriptive type name
   */
  static getType(value) {
    // Handle null and undefined first
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Number.isNaN(value)) return 'NaN';

    // Check special types using util.types
    if (util.types.isPromise(value)) return 'promise';
    if (util.types.isDate(value)) return 'date';
    if (util.types.isRegExp(value)) return 'regexp';
    if (util.types.isMap(value)) return 'map';
    if (util.types.isSet(value)) return 'set';
    if (Buffer.isBuffer(value)) return 'buffer';
    if (util.types.isArrayBuffer(value)) return 'arraybuffer';

    // Check common types
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'function') return 'function';

    // Use typeof for primitives
    const type = typeof value;
    if (type === 'object') return 'object'; // Plain object
    return type; // string, number, boolean, symbol, bigint
  }

  /**
   * Step 4: Validate value against type string
   */
  static isType(value, type) {
    const normalizedType = type.toLowerCase();

    switch (normalizedType) {
      case 'string':
        return this.isString(value);
      case 'number':
        return this.isNumber(value);
      case 'boolean':
        return this.isBoolean(value);
      case 'array':
        return this.isArray(value);
      case 'object':
        return this.isObject(value);
      case 'function':
        return this.isFunction(value);
      case 'promise':
        return this.isPromise(value);
      case 'date':
        return this.isDate(value);
      case 'buffer':
        return this.isBuffer(value);
      case 'regexp':
        return this.isRegExp(value);
      case 'null':
        return this.isNull(value);
      case 'undefined':
        return this.isUndefined(value);
      case 'map':
        return this.isMap(value);
      case 'set':
        return this.isSet(value);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  /**
   * Step 5: Validate object against schema
   *
   * Schema format:
   * {
   *   fieldName: 'type',
   *   fieldName: { type: 'type', required: true/false, nullable: true/false }
   * }
   */
  static validateSchema(obj, schema) {
    const errors = [];

    // Check if obj is actually an object
    if (!this.isObject(obj) && !Array.isArray(obj)) {
      return {
        valid: false,
        errors: ['Value is not an object']
      };
    }

    // Validate each schema field
    for (const [field, definition] of Object.entries(schema)) {
      // Parse definition
      let type, required, nullable;

      if (typeof definition === 'string') {
        type = definition;
        required = true;
        nullable = false;
      } else {
        type = definition.type;
        required = definition.required !== false; // default true
        nullable = definition.nullable === true; // default false
      }

      const value = obj[field];

      // Check if field exists
      if (!(field in obj)) {
        if (required) {
          errors.push(`Field '${field}' is required but missing`);
        }
        continue;
      }

      // Check nullable
      if (value === null) {
        if (!nullable) {
          errors.push(`Field '${field}' cannot be null`);
        }
        continue;
      }

      // Check undefined
      if (value === undefined) {
        if (required) {
          errors.push(`Field '${field}' is required but undefined`);
        }
        continue;
      }

      // Validate type
      if (!this.isType(value, type)) {
        const actualType = this.getType(value);
        errors.push(
          `Field '${field}' expected ${type}, got ${actualType}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Step 6: Validate function arguments
   */
  static validateArgs(args, types) {
    if (!Array.isArray(args)) {
      throw new TypeError('Args must be an array');
    }

    if (!Array.isArray(types)) {
      throw new TypeError('Types must be an array');
    }

    if (args.length !== types.length) {
      throw new TypeError(
        `Expected ${types.length} arguments, got ${args.length}`
      );
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const expectedType = types[i];

      if (!this.isType(arg, expectedType)) {
        const actualType = this.getType(arg);
        throw new TypeError(
          `Argument ${i} expected ${expectedType}, got ${actualType}`
        );
      }
    }

    return true;
  }

  /**
   * BONUS: Validate array elements
   */
  static validateArray(arr, elementType) {
    if (!Array.isArray(arr)) {
      return {
        valid: false,
        errors: ['Value is not an array']
      };
    }

    const errors = [];

    arr.forEach((element, index) => {
      if (!this.isType(element, elementType)) {
        const actualType = this.getType(element);
        errors.push(
          `Element at index ${index} expected ${elementType}, got ${actualType}`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Test basic type checking
 */
function testBasicTypes() {
  console.log('=== Testing Basic Type Checking ===\n');

  // Strings
  console.log('--- Strings ---');
  console.log('isString("hello"):', Validator.isString('hello')); // true
  console.log('isString(123):', Validator.isString(123)); // false
  console.log('isString(new String("test")):', Validator.isString(new String('test'))); // true

  // Numbers
  console.log('\n--- Numbers ---');
  console.log('isNumber(42):', Validator.isNumber(42)); // true
  console.log('isNumber(3.14):', Validator.isNumber(3.14)); // true
  console.log('isNumber(NaN):', Validator.isNumber(NaN)); // false
  console.log('isNumber("123"):', Validator.isNumber('123')); // false

  // Booleans
  console.log('\n--- Booleans ---');
  console.log('isBoolean(true):', Validator.isBoolean(true)); // true
  console.log('isBoolean(false):', Validator.isBoolean(false)); // true
  console.log('isBoolean(1):', Validator.isBoolean(1)); // false

  // Arrays
  console.log('\n--- Arrays ---');
  console.log('isArray([1,2,3]):', Validator.isArray([1, 2, 3])); // true
  console.log('isArray({}):', Validator.isArray({})); // false

  // Objects
  console.log('\n--- Objects ---');
  console.log('isObject({}):', Validator.isObject({})); // true
  console.log('isObject([]):', Validator.isObject([])); // false
  console.log('isObject(new Date()):', Validator.isObject(new Date())); // false
  console.log('isObject(null):', Validator.isObject(null)); // false
}

/**
 * Test special types
 */
function testSpecialTypes() {
  console.log('\n=== Testing Special Types ===\n');

  console.log('--- Promises ---');
  const promise = Promise.resolve();
  console.log('isPromise(Promise.resolve()):', Validator.isPromise(promise)); // true
  console.log('isPromise({}):', Validator.isPromise({})); // false

  console.log('\n--- Dates ---');
  const date = new Date();
  console.log('isDate(new Date()):', Validator.isDate(date)); // true
  console.log('isDate("2024-01-01"):', Validator.isDate('2024-01-01')); // false

  console.log('\n--- Buffers ---');
  const buffer = Buffer.from('test');
  console.log('isBuffer(Buffer.from("test")):', Validator.isBuffer(buffer)); // true
  console.log('isBuffer([]):', Validator.isBuffer([])); // false

  console.log('\n--- Maps and Sets ---');
  const map = new Map();
  const set = new Set();
  console.log('isMap(new Map()):', Validator.isMap(map)); // true
  console.log('isSet(new Set()):', Validator.isSet(set)); // true

  console.log('\n--- Edge Cases ---');
  console.log('isNull(null):', Validator.isNull(null)); // true
  console.log('isUndefined(undefined):', Validator.isUndefined(undefined)); // true
  console.log('isNaN(NaN):', Validator.isNaN(NaN)); // true
  console.log('isNaN(123):', Validator.isNaN(123)); // false
}

/**
 * Test getType method
 */
function testGetType() {
  console.log('\n=== Testing Get Type Name ===\n');

  const testValues = [
    'hello',
    123,
    true,
    [],
    {},
    null,
    undefined,
    NaN,
    new Date(),
    Promise.resolve(),
    Buffer.from('test'),
    /regex/,
    new Map(),
    new Set(),
    () => { }
  ];

  testValues.forEach(value => {
    const type = Validator.getType(value);
    console.log(`getType(${util.inspect(value, { compact: true })}):\t${type}`);
  });
}

/**
 * Test schema validation
 */
function testSchemaValidation() {
  console.log('\n=== Testing Schema Validation ===\n');

  // Define schema
  const userSchema = {
    name: 'string',
    age: 'number',
    email: 'string',
    active: 'boolean',
    tags: 'array'
  };

  // Valid user
  console.log('--- Valid User ---');
  const validUser = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com',
    active: true,
    tags: ['admin', 'user']
  };

  const result1 = Validator.validateSchema(validUser, userSchema);
  console.log('Valid:', result1.valid);
  if (!result1.valid) {
    console.log('Errors:', result1.errors);
  }

  // Invalid user
  console.log('\n--- Invalid User ---');
  const invalidUser = {
    name: 'Jane Doe',
    age: '25', // Wrong type
    email: 'jane@example.com',
    // active: missing
    tags: 'tag1' // Wrong type
  };

  const result2 = Validator.validateSchema(invalidUser, userSchema);
  console.log('Valid:', result2.valid);
  if (!result2.valid) {
    console.log('Errors:');
    result2.errors.forEach(err => console.log('  -', err));
  }

  // Schema with advanced options
  console.log('\n--- Schema with Options ---');
  const advancedSchema = {
    id: { type: 'number', required: true },
    name: { type: 'string', required: true },
    nickname: { type: 'string', required: false },
    deletedAt: { type: 'date', nullable: true }
  };

  const user3 = {
    id: 1,
    name: 'Bob',
    deletedAt: null
  };

  const result3 = Validator.validateSchema(user3, advancedSchema);
  console.log('Valid:', result3.valid);
  console.log('User:', user3);
}

/**
 * Test argument validation
 */
function testArgumentValidation() {
  console.log('\n=== Testing Argument Validation ===\n');

  // Function that uses validation
  function createUser(name, age, email) {
    // Validate arguments
    try {
      Validator.validateArgs(
        [name, age, email],
        ['string', 'number', 'string']
      );
      console.log('✓ Arguments valid');
      return { name, age, email };
    } catch (err) {
      console.error('✗ Validation error:', err.message);
      return null;
    }
  }

  console.log('--- Valid Arguments ---');
  createUser('John', 30, 'john@example.com');

  console.log('\n--- Invalid Arguments ---');
  createUser('Jane', '25', 'jane@example.com');

  console.log('\n--- Wrong Number of Arguments ---');
  try {
    Validator.validateArgs(['John'], ['string', 'number']);
  } catch (err) {
    console.error('✗ Error:', err.message);
  }
}

/**
 * Practical example: User registration
 */
function practicalExample() {
  console.log('\n=== Practical Example: User Registration ===\n');

  // Define user schema
  const userSchema = {
    username: 'string',
    email: 'string',
    age: 'number',
    active: 'boolean',
    roles: 'array',
    profile: 'object',
    createdAt: 'date'
  };

  // Test users
  const users = [
    {
      username: 'john_doe',
      email: 'john@example.com',
      age: 30,
      active: true,
      roles: ['user', 'admin'],
      profile: { bio: 'Hello world' },
      createdAt: new Date()
    },
    {
      username: 'jane_doe',
      email: 'jane@example.com',
      age: '25', // Invalid: string instead of number
      active: true,
      roles: 'admin', // Invalid: string instead of array
      profile: { bio: 'Hi there' },
      createdAt: new Date()
    },
    {
      username: 'bob_smith',
      email: 'bob@example.com',
      // age: missing
      active: false,
      roles: [],
      profile: {},
      createdAt: '2024-01-01' // Invalid: string instead of Date
    }
  ];

  users.forEach((user, index) => {
    console.log(`--- User ${index + 1}: ${user.username} ---`);
    const result = Validator.validateSchema(user, userSchema);

    if (result.valid) {
      console.log('✓ Registration successful');
    } else {
      console.log('✗ Registration failed:');
      result.errors.forEach(err => console.log('  -', err));
    }
    console.log();
  });
}

/**
 * BONUS: Array validation
 */
function testArrayValidation() {
  console.log('=== Bonus: Array Element Validation ===\n');

  console.log('--- Valid Array ---');
  const numbers = [1, 2, 3, 4, 5];
  const result1 = Validator.validateArray(numbers, 'number');
  console.log('Array:', numbers);
  console.log('Valid:', result1.valid);

  console.log('\n--- Invalid Array ---');
  const mixed = [1, '2', 3, '4', 5];
  const result2 = Validator.validateArray(mixed, 'number');
  console.log('Array:', mixed);
  console.log('Valid:', result2.valid);
  if (!result2.valid) {
    console.log('Errors:');
    result2.errors.forEach(err => console.log('  -', err));
  }
}

/**
 * Main execution
 */
function runAllTests() {
  testBasicTypes();
  testSpecialTypes();
  testGetType();
  testSchemaValidation();
  testArgumentValidation();
  practicalExample();
  testArrayValidation();
}

// Run the tests
runAllTests();

/**
 * KEY LEARNING POINTS:
 *
 * 1. typeof Limitations:
 *    - typeof null === 'object' (historical bug)
 *    - typeof [] === 'object' (not specific)
 *    - typeof NaN === 'number' (technically correct)
 *
 * 2. util.types Benefits:
 *    - Accurate type detection
 *    - Detects Node.js specific types
 *    - Works with native objects
 *
 * 3. Type Checking Best Practices:
 *    - Use Array.isArray() for arrays
 *    - Use Number.isNaN() for NaN
 *    - Use util.types for special types
 *    - Handle null and undefined explicitly
 *
 * 4. Schema Validation:
 *    - Define structure upfront
 *    - Validate early (fail fast)
 *    - Provide clear error messages
 *    - Support optional and nullable fields
 *
 * 5. Production Use Cases:
 *    - API request validation
 *    - Configuration validation
 *    - Function argument checking
 *    - Data transformation pipelines
 */

/**
 * COMMON MISTAKES TO AVOID:
 *
 * ❌ Using typeof for everything:
 *    typeof [] === 'object' // Not helpful
 *    typeof null === 'object' // Wrong
 *
 * ✅ Use appropriate methods:
 *    Array.isArray([]) // true
 *    value === null // true
 *
 * ❌ Not handling NaN:
 *    typeof NaN === 'number' // true but NaN is not a valid number
 *
 * ✅ Use Number.isNaN:
 *    Number.isNaN(NaN) // true
 *
 * ❌ Shallow validation:
 *    typeof value === 'object' // Could be anything
 *
 * ✅ Deep validation:
 *    Validate each field with schema
 */

/**
 * GOING FURTHER:
 *
 * Try these challenges:
 * 1. Add support for custom type validators
 * 2. Implement nested schema validation
 * 3. Add type coercion (string -> number)
 * 4. Create TypeScript-like interface validation
 * 5. Build a runtime type checker decorator
 */
