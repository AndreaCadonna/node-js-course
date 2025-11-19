/**
 * Exercise 4: Binary Serializer
 *
 * Practice binary serialization by implementing a serializer
 * that converts JavaScript objects to binary format and back.
 */

console.log('=== Exercise 4: Binary Serializer ===\n');

// Task 1: Serialize primitive values
console.log('Task 1: Serialize Primitive Values');
/**
 * Serialize a single value to binary format
 * Type tags:
 * - 0x00: null
 * - 0x01: boolean
 * - 0x02: number (float64)
 * - 0x03: string (length-prefixed, UTF-8)
 *
 * @param {any} value - Value to serialize
 * @returns {Buffer} Serialized binary data
 */
function serializeValue(value) {
  // TODO: Implement this function
  // Format for each type:
  // - null: [0x00]
  // - boolean: [0x01, value ? 1 : 0]
  // - number: [0x02, 8 bytes double LE]
  // - string: [0x03, 2 bytes length LE, UTF-8 bytes]
  // Your code here
}

/**
 * Deserialize a single value from binary format
 * @param {Buffer} buffer - Binary data
 * @param {number} offset - Starting offset
 * @returns {Object} { value, bytesRead }
 */
function deserializeValue(buffer, offset = 0) {
  // TODO: Implement this function
  // Read type tag and deserialize accordingly
  // Return both value and number of bytes consumed
  // Your code here
}

// Test Task 1
try {
  const tests = [null, true, false, 42, 3.14159, 'Hello'];

  tests.forEach(val => {
    const serialized = serializeValue(val);
    const { value, bytesRead } = deserializeValue(serialized, 0);
    console.log(`${JSON.stringify(val)} → ${serialized.length} bytes → ${JSON.stringify(value)}`);
  });

  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Serialize arrays
console.log('Task 2: Serialize Arrays');
/**
 * Serialize an array to binary format
 * Format:
 * - Type tag: 0x04
 * - Element count: 4 bytes (LE)
 * - Elements: serialized one after another
 *
 * @param {Array} array - Array to serialize
 * @returns {Buffer} Serialized binary data
 */
function serializeArray(array) {
  // TODO: Implement this function
  // Use serializeValue for each element
  // Your code here
}

/**
 * Deserialize an array from binary format
 * @param {Buffer} buffer - Binary data
 * @param {number} offset - Starting offset
 * @returns {Object} { value: array, bytesRead }
 */
function deserializeArray(buffer, offset = 0) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 2
try {
  const testArrays = [
    [1, 2, 3],
    ['a', 'b', 'c'],
    [true, false, null],
    [1, 'mixed', true, null]
  ];

  testArrays.forEach(arr => {
    const serialized = serializeArray(arr);
    const { value, bytesRead } = deserializeArray(serialized, 0);
    console.log(`${JSON.stringify(arr)} → ${serialized.length} bytes`);
    console.log(`  Restored: ${JSON.stringify(value)}`);
  });

  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Serialize objects
console.log('Task 3: Serialize Objects');
/**
 * Serialize an object to binary format
 * Format:
 * - Type tag: 0x05
 * - Property count: 2 bytes (LE)
 * - For each property:
 *   - Key length: 1 byte
 *   - Key: UTF-8 string
 *   - Value: serialized value
 *
 * @param {Object} obj - Object to serialize
 * @returns {Buffer} Serialized binary data
 */
function serializeObject(obj) {
  // TODO: Implement this function
  // Use serializeValue for each property value
  // Your code here
}

/**
 * Deserialize an object from binary format
 * @param {Buffer} buffer - Binary data
 * @param {number} offset - Starting offset
 * @returns {Object} { value: object, bytesRead }
 */
function deserializeObject(buffer, offset = 0) {
  // TODO: Implement this function
  // Your code here
}

// Test Task 3
try {
  const testObjects = [
    { name: 'Alice', age: 30 },
    { active: true, score: 95.5, role: null },
    { nested: { a: 1, b: 2 } }
  ];

  testObjects.forEach(obj => {
    const serialized = serializeObject(obj);
    const { value, bytesRead } = deserializeObject(serialized, 0);
    console.log(`${JSON.stringify(obj)} → ${serialized.length} bytes`);
    console.log(`  Restored: ${JSON.stringify(value)}`);
  });

  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Universal serializer
console.log('Task 4: Universal Serialize/Deserialize');
/**
 * Serialize any supported value type
 * Supports: null, boolean, number, string, array, object
 *
 * @param {any} data - Data to serialize
 * @returns {Buffer} Serialized binary data
 */
function serialize(data) {
  // TODO: Implement this function
  // Determine type and call appropriate serializer
  // Handle nested objects and arrays
  // Your code here
}

/**
 * Deserialize any value
 * @param {Buffer} buffer - Binary data
 * @returns {any} Deserialized value
 */
function deserialize(buffer) {
  // TODO: Implement this function
  // Read type tag and call appropriate deserializer
  // Your code here
}

// Test Task 4
try {
  const complexData = {
    name: 'Test',
    values: [1, 2, 3],
    metadata: {
      created: 123456789,
      active: true
    },
    tags: ['a', 'b', 'c']
  };

  const serialized = serialize(complexData);
  const deserialized = deserialize(serialized);

  console.log('Original:', JSON.stringify(complexData));
  console.log('Serialized:', serialized.length, 'bytes');
  console.log('Deserialized:', JSON.stringify(deserialized));
  console.log('Match:', JSON.stringify(complexData) === JSON.stringify(deserialized));

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Size comparison
console.log('Task 5: Compare Binary vs JSON Size');
/**
 * Compare serialization sizes
 * @param {any} data - Data to compare
 * @returns {Object} { jsonSize, binarySize, savings }
 */
function compareSerializationSize(data) {
  // TODO: Implement this function
  // Calculate JSON size
  // Calculate binary size
  // Calculate percentage savings
  // Your code here
}

// Test Task 5
try {
  const testData = [
    { id: 1, name: 'Alice', score: 95.5 },
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    { active: true, count: 42, label: 'test' }
  ];

  testData.forEach(data => {
    const comparison = compareSerializationSize(data);
    console.log('Data:', JSON.stringify(data).substring(0, 40) + '...');
    console.log(`  JSON: ${comparison.jsonSize} bytes`);
    console.log(`  Binary: ${comparison.binarySize} bytes`);
    console.log(`  Savings: ${comparison.savings}%`);
  });

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 1: Variable-length integer encoding
console.log('Bonus Challenge 1: Variable-Length Integer (Varint)');
/**
 * Encode integer using variable-length encoding
 * Uses fewer bytes for smaller numbers
 *
 * @param {number} value - Unsigned integer to encode
 * @returns {Buffer} Encoded bytes
 */
function encodeVarint(value) {
  // TODO: Implement this function
  // Use 7 bits per byte, MSB indicates continuation
  // Example: 300 = 0b100101100
  //   → [0xAC, 0x02] = [10101100, 00000010]
  // Your code here
}

/**
 * Decode variable-length integer
 * @param {Buffer} buffer - Encoded data
 * @param {number} offset - Starting offset
 * @returns {Object} { value, bytesRead }
 */
function decodeVarint(buffer, offset = 0) {
  // TODO: Implement this function
  // Your code here
}

// Test Bonus 1
try {
  const testInts = [0, 127, 128, 255, 256, 16383, 16384, 1000000];

  testInts.forEach(num => {
    const encoded = encodeVarint(num);
    const { value, bytesRead } = decodeVarint(encoded, 0);
    console.log(`${num} → ${encoded.length} byte(s) → ${value}`);
  });

  console.log('✓ Bonus 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge 2: Schema-based serializer
console.log('Bonus Challenge 2: Schema-Based Serializer');
/**
 * Serialize data according to a schema for smaller size
 * Schema defines field order and types
 */
class SchemaSerializer {
  constructor(schema) {
    // Schema format: { field1: 'type', field2: 'type', ... }
    // Types: 'uint8', 'uint16', 'uint32', 'int32', 'float', 'string'
    // TODO: Store schema
    // Your code here
  }

  serialize(obj) {
    // TODO: Serialize object according to schema
    // No field names in output (use schema order)
    // Your code here
  }

  deserialize(buffer) {
    // TODO: Deserialize using schema
    // Reconstruct field names from schema
    // Your code here
  }
}

// Test Bonus 2
try {
  const schema = {
    id: 'uint32',
    age: 'uint8',
    score: 'float',
    name: 'string'
  };

  const schemaSerializer = new SchemaSerializer(schema);

  const user = {
    id: 12345,
    age: 30,
    score: 95.5,
    name: 'Alice'
  };

  const schemaSerialized = schemaSerializer.serialize(user);
  const schemaDeserialized = schemaSerializer.deserialize(schemaSerialized);

  console.log('Schema serialized:', schemaSerialized.length, 'bytes');
  console.log('Regular serialized:', serialize(user).length, 'bytes');
  console.log('Savings:', serialize(user).length - schemaSerialized.length, 'bytes');
  console.log('Deserialized:', schemaDeserialized);

  console.log('✓ Bonus 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

console.log('=== Exercise 4 Complete ===');
console.log('Implement all functions and run again to test your solutions!');
console.log('');
console.log('💡 Tips:');
console.log('  • Type tags identify data types');
console.log('  • Length prefixes handle variable-size data');
console.log('  • Binary is more compact than JSON');
console.log('  • Schema-based encoding is most efficient');
console.log('  • Varint saves space for small integers');
