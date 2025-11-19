/**
 * Example 6: Binary Serialization
 *
 * Demonstrates serializing JavaScript objects to binary format
 * and deserializing them back.
 */

console.log('=== Binary Serialization ===\n');

// 1. Simple value serialization
console.log('1. Simple Value Serialization');

// Type tags
const TYPE_NULL = 0x00;
const TYPE_BOOLEAN = 0x01;
const TYPE_NUMBER = 0x02;
const TYPE_STRING = 0x03;
const TYPE_ARRAY = 0x04;
const TYPE_OBJECT = 0x05;

function serializeValue(value) {
  if (value === null) {
    return Buffer.from([TYPE_NULL]);
  }

  if (typeof value === 'boolean') {
    return Buffer.from([TYPE_BOOLEAN, value ? 1 : 0]);
  }

  if (typeof value === 'number') {
    const buf = Buffer.alloc(9);
    buf.writeUInt8(TYPE_NUMBER, 0);
    buf.writeDoubleLE(value, 1);
    return buf;
  }

  if (typeof value === 'string') {
    const strBuf = Buffer.from(value, 'utf8');
    const buf = Buffer.alloc(3 + strBuf.length);
    buf.writeUInt8(TYPE_STRING, 0);
    buf.writeUInt16LE(strBuf.length, 1);
    strBuf.copy(buf, 3);
    return buf;
  }

  throw new Error('Unsupported type');
}

function deserializeValue(buf) {
  const type = buf.readUInt8(0);

  switch (type) {
    case TYPE_NULL:
      return null;

    case TYPE_BOOLEAN:
      return buf.readUInt8(1) === 1;

    case TYPE_NUMBER:
      return buf.readDoubleLE(1);

    case TYPE_STRING:
      const length = buf.readUInt16LE(1);
      return buf.toString('utf8', 3, 3 + length);

    default:
      throw new Error('Unknown type');
  }
}

console.log('Serialize null:', serializeValue(null));
console.log('Serialize true:', serializeValue(true));
console.log('Serialize 42.5:', serializeValue(42.5));
console.log('Serialize "Hello":', serializeValue('Hello'));
console.log('');

// Test round-trip
const testValues = [null, true, false, 42, 3.14, 'Hello World'];
testValues.forEach(val => {
  const serialized = serializeValue(val);
  const deserialized = deserializeValue(serialized);
  console.log(`${JSON.stringify(val)} → ${serialized.length} bytes → ${JSON.stringify(deserialized)}`);
});
console.log('');

// 2. Object serialization
console.log('2. Object Serialization');

function serializeObject(obj) {
  const entries = Object.entries(obj);
  const buffers = [];

  // Header: type + entry count
  const header = Buffer.alloc(3);
  header.writeUInt8(TYPE_OBJECT, 0);
  header.writeUInt16LE(entries.length, 1);
  buffers.push(header);

  // Serialize each entry
  for (const [key, value] of entries) {
    // Key (length-prefixed string)
    const keyBuf = Buffer.from(key, 'utf8');
    const keyHeader = Buffer.alloc(2);
    keyHeader.writeUInt16LE(keyBuf.length, 0);
    buffers.push(keyHeader, keyBuf);

    // Value
    buffers.push(serializeValue(value));
  }

  return Buffer.concat(buffers);
}

function deserializeObject(buf) {
  let offset = 0;

  const type = buf.readUInt8(offset);
  offset += 1;

  if (type !== TYPE_OBJECT) {
    throw new Error('Not an object');
  }

  const entryCount = buf.readUInt16LE(offset);
  offset += 2;

  const obj = {};

  for (let i = 0; i < entryCount; i++) {
    // Read key
    const keyLen = buf.readUInt16LE(offset);
    offset += 2;

    const key = buf.toString('utf8', offset, offset + keyLen);
    offset += keyLen;

    // Read value type to determine value length
    const valueType = buf.readUInt8(offset);
    let value;
    let valueSize;

    if (valueType === TYPE_NULL) {
      value = null;
      valueSize = 1;
    } else if (valueType === TYPE_BOOLEAN) {
      value = buf.readUInt8(offset + 1) === 1;
      valueSize = 2;
    } else if (valueType === TYPE_NUMBER) {
      value = buf.readDoubleLE(offset + 1);
      valueSize = 9;
    } else if (valueType === TYPE_STRING) {
      const strLen = buf.readUInt16LE(offset + 1);
      value = buf.toString('utf8', offset + 3, offset + 3 + strLen);
      valueSize = 3 + strLen;
    }

    offset += valueSize;
    obj[key] = value;
  }

  return obj;
}

const person = {
  name: 'Alice',
  age: 30,
  active: true,
  score: 95.5
};

const serializedObj = serializeObject(person);
const deserializedObj = deserializeObject(serializedObj);

console.log('Original:', person);
console.log('Serialized:', serializedObj.length, 'bytes');
console.log('Deserialized:', deserializedObj);
console.log('');

// 3. Array serialization
console.log('3. Array Serialization');

function serializeArray(arr) {
  const buffers = [];

  // Header: type + element count
  const header = Buffer.alloc(5);
  header.writeUInt8(TYPE_ARRAY, 0);
  header.writeUInt32LE(arr.length, 1);
  buffers.push(header);

  // Serialize each element
  for (const item of arr) {
    buffers.push(serializeValue(item));
  }

  return Buffer.concat(buffers);
}

function deserializeArray(buf) {
  let offset = 0;

  const type = buf.readUInt8(offset);
  offset += 1;

  if (type !== TYPE_ARRAY) {
    throw new Error('Not an array');
  }

  const length = buf.readUInt32LE(offset);
  offset += 4;

  const arr = [];

  for (let i = 0; i < length; i++) {
    const itemType = buf.readUInt8(offset);
    let item;
    let itemSize;

    if (itemType === TYPE_NULL) {
      item = null;
      itemSize = 1;
    } else if (itemType === TYPE_BOOLEAN) {
      item = buf.readUInt8(offset + 1) === 1;
      itemSize = 2;
    } else if (itemType === TYPE_NUMBER) {
      item = buf.readDoubleLE(offset + 1);
      itemSize = 9;
    } else if (itemType === TYPE_STRING) {
      const strLen = buf.readUInt16LE(offset + 1);
      item = buf.toString('utf8', offset + 3, offset + 3 + strLen);
      itemSize = 3 + strLen;
    }

    offset += itemSize;
    arr.push(item);
  }

  return arr;
}

const numbers = [1, 2, 3, 4, 5];
const serializedArr = serializeArray(numbers);
const deserializedArr = deserializeArray(serializedArr);

console.log('Original array:', numbers);
console.log('Serialized:', serializedArr.length, 'bytes');
console.log('Deserialized:', deserializedArr);
console.log('');

// 4. Compact integer encoding (varint)
console.log('4. Compact Integer Encoding (Variable-Length)');

/**
 * Varint encoding (like Protocol Buffers):
 * - Uses 1 byte for values 0-127
 * - MSB=1 means more bytes follow
 */
function encodeVarint(value) {
  const bytes = [];

  while (value > 0x7F) {
    bytes.push((value & 0x7F) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7F);

  return Buffer.from(bytes);
}

function decodeVarint(buf, offset = 0) {
  let value = 0;
  let shift = 0;
  let bytesRead = 0;

  while (offset < buf.length) {
    const byte = buf.readUInt8(offset++);
    bytesRead++;

    value |= (byte & 0x7F) << shift;

    if ((byte & 0x80) === 0) {
      break;
    }

    shift += 7;
  }

  return { value, bytesRead };
}

const varintTests = [0, 127, 128, 16383, 16384, 2097151];
varintTests.forEach(num => {
  const encoded = encodeVarint(num);
  const { value } = decodeVarint(encoded);
  console.log(`${num} → ${encoded.length} byte(s): [${Array.from(encoded).map(b => '0x' + b.toString(16)).join(', ')}] → ${value}`);
});
console.log('');

// 5. Struct-like serialization
console.log('5. Struct-Like Serialization (Fixed Layout)');

/**
 * User struct:
 * - id: uint32 (4 bytes)
 * - age: uint8 (1 byte)
 * - score: float (4 bytes)
 * - active: bool (1 byte)
 * Total: 10 bytes (fixed size)
 */

class UserStruct {
  static SIZE = 10;

  static serialize(user) {
    const buf = Buffer.alloc(UserStruct.SIZE);
    let offset = 0;

    buf.writeUInt32LE(user.id, offset); offset += 4;
    buf.writeUInt8(user.age, offset); offset += 1;
    buf.writeFloatLE(user.score, offset); offset += 4;
    buf.writeUInt8(user.active ? 1 : 0, offset); offset += 1;

    return buf;
  }

  static deserialize(buf) {
    let offset = 0;

    const id = buf.readUInt32LE(offset); offset += 4;
    const age = buf.readUInt8(offset); offset += 1;
    const score = buf.readFloatLE(offset); offset += 4;
    const active = buf.readUInt8(offset) === 1; offset += 1;

    return { id, age, score, active };
  }

  static serializeArray(users) {
    const buffers = users.map(u => UserStruct.serialize(u));
    return Buffer.concat(buffers);
  }

  static deserializeArray(buf) {
    const users = [];
    for (let i = 0; i < buf.length; i += UserStruct.SIZE) {
      users.push(UserStruct.deserialize(buf.slice(i, i + UserStruct.SIZE)));
    }
    return users;
  }
}

const users = [
  { id: 1, age: 25, score: 95.5, active: true },
  { id: 2, age: 30, score: 87.3, active: false },
  { id: 3, age: 22, score: 92.1, active: true }
];

const usersBuf = UserStruct.serializeArray(users);
const usersRestored = UserStruct.deserializeArray(usersBuf);

console.log('Serialized', users.length, 'users to', usersBuf.length, 'bytes');
console.log('Bytes per user:', UserStruct.SIZE);
console.log('Restored:', usersRestored);
console.log('');

// 6. Size comparison
console.log('6. Size Comparison: JSON vs Binary');

const testObj = {
  id: 12345,
  name: 'Test User',
  score: 95.5,
  active: true,
  count: 42
};

const jsonSize = Buffer.byteLength(JSON.stringify(testObj), 'utf8');
const binarySize = serializeObject(testObj).length;

console.log('Object:', testObj);
console.log('JSON size:', jsonSize, 'bytes');
console.log('Binary size:', binarySize, 'bytes');
console.log('Savings:', ((1 - binarySize / jsonSize) * 100).toFixed(1) + '%');
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Binary serialization is more compact than JSON');
console.log('✓ Type tags identify value types');
console.log('✓ Fixed-size structs are fastest to parse');
console.log('✓ Variable-length encoding saves space');
console.log('✓ Length prefixes handle variable data');
console.log('✓ Trade-off: size vs human readability');
console.log('⚠️  Schema evolution requires careful planning');
