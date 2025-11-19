/**
 * Exercise 4: Type Validator
 *
 * DIFFICULTY: ⭐⭐ Intermediate
 * TIME: 20-30 minutes
 *
 * OBJECTIVE:
 * Create a robust type validation system using util.types to check
 * various JavaScript and Node.js specific types accurately.
 *
 * REQUIREMENTS:
 * 1. Create a Validator class that uses util.types for type checking
 * 2. Implement validation for primitives, objects, and special types
 * 3. Create a schema validator that checks object structure
 * 4. Provide detailed error messages for validation failures
 * 5. Handle edge cases (null, undefined, NaN, etc.)
 *
 * BONUS CHALLENGES:
 * - Add array validation with element type checking
 * - Support optional and nullable fields
 * - Create custom type validators that can be registered
 *
 * HINTS:
 * - util.types has many checkers: isPromise, isDate, isArrayBuffer, etc.
 * - typeof has limitations (null is 'object', arrays are 'object')
 * - Use Array.isArray() for arrays, not typeof
 */

const util = require('util');

// TODO 1: Create Validator class
class Validator {
  // TODO 2: Implement type checking methods
  static isString(value) {
    // Your code here:
    // Check if value is a string primitive or String object
  }

  static isNumber(value) {
    // Your code here:
    // Check if value is a number (excluding NaN)
  }

  static isBoolean(value) {
    // Your code here
  }

  static isArray(value) {
    // Your code here
  }

  static isObject(value) {
    // Your code here:
    // Check for plain objects (not arrays, dates, etc.)
  }

  static isFunction(value) {
    // Your code here
  }

  static isPromise(value) {
    // Your code here:
    // Use util.types.isPromise
  }

  static isDate(value) {
    // Your code here:
    // Use util.types.isDate
  }

  static isBuffer(value) {
    // Your code here:
    // Use util.types.isUint8Array or Buffer.isBuffer
  }

  static isNull(value) {
    // Your code here
  }

  static isUndefined(value) {
    // Your code here
  }

  // TODO 3: Get type name
  static getType(value) {
    // Your code here:
    // Return a string describing the type
    // Examples: 'string', 'number', 'array', 'date', 'promise', etc.
  }

  // TODO 4: Validate against schema
  static validateSchema(obj, schema) {
    // Your code here:
    // Schema format: { fieldName: 'type' }
    // Example: { name: 'string', age: 'number', active: 'boolean' }
    //
    // Returns: { valid: boolean, errors: string[] }
    //
    // Steps:
    // 1. Check each schema field exists in obj
    // 2. Validate type of each field
    // 3. Collect errors for failed validations
    // 4. Return result object
  }

  // TODO 5: Validate function arguments
  static validateArgs(args, types) {
    // Your code here:
    // Validate that arguments match expected types
    // args: array of values
    // types: array of type strings
    // Throw error if validation fails
  }
}

// TODO 6: Test the validator
function testValidator() {
  console.log('=== Testing Type Validator ===\n');

  // Test 1: Basic type checking
  console.log('--- Basic Type Checking ---');
  // Your code here:
  // Test isString, isNumber, isBoolean, etc.

  // Test 2: Special types
  console.log('\n--- Special Types ---');
  // Your code here:
  // Test isPromise, isDate, isBuffer

  // Test 3: Get type name
  console.log('\n--- Get Type Name ---');
  // Your code here:
  // Test getType with various values

  // Test 4: Schema validation
  console.log('\n--- Schema Validation ---');
  // Your code here:
  // Create test objects and schemas
  // Test both valid and invalid cases
}

// TODO 7: Create a practical example
function practicalExample() {
  console.log('\n=== Practical Example: User Registration ===\n');

  // Your code here:
  // 1. Define user schema
  // 2. Create test user objects (valid and invalid)
  // 3. Validate using schema
  // 4. Display results
}

// Uncomment to run:
// testValidator();
// practicalExample();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-4.js
 *
 * 2. Test cases to verify:
 *    - Primitive types (string, number, boolean)
 *    - Objects and arrays
 *    - Special types (Promise, Date, Buffer)
 *    - Edge cases (null, undefined, NaN)
 *    - Schema validation with valid/invalid data
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Type Validator ===
 *
 * --- Basic Type Checking ---
 * isString('hello'): true
 * isString(123): false
 * isNumber(42): true
 * isNumber(NaN): false
 *
 * --- Special Types ---
 * isPromise(Promise.resolve()): true
 * isDate(new Date()): true
 * isBuffer(Buffer.from('test')): true
 *
 * --- Get Type Name ---
 * getType('hello'): string
 * getType([1,2,3]): array
 * getType(new Date()): date
 *
 * --- Schema Validation ---
 * Valid user: ✓ Passed
 * Invalid user: ✗ Failed
 *   - Field 'age' expected number, got string
 *   - Field 'active' expected boolean, got undefined
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - What are the limitations of typeof?
 * - When should you use util.types vs typeof?
 * - How do you check for NaN properly?
 * - What's the difference between null and undefined?
 */
