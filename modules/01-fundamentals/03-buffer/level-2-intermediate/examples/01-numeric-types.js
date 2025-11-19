/**
 * Example 1: Reading and Writing Numeric Types
 *
 * Demonstrates how to work with different numeric data types
 * in buffers: integers (signed/unsigned) and floating-point numbers.
 */

console.log('=== Numeric Data Types in Buffers ===\n');

// 1. 8-bit integers (1 byte)
console.log('1. 8-bit Integers (1 byte)');
const buf8 = Buffer.alloc(4);

// Signed: -128 to 127
buf8.writeInt8(-128, 0);
buf8.writeInt8(127, 1);

// Unsigned: 0 to 255
buf8.writeUInt8(0, 2);
buf8.writeUInt8(255, 3);

console.log('Buffer:', buf8);
console.log('Int8 at 0:', buf8.readInt8(0));    // -128
console.log('Int8 at 1:', buf8.readInt8(1));    // 127
console.log('UInt8 at 2:', buf8.readUInt8(2));  // 0
console.log('UInt8 at 3:', buf8.readUInt8(3));  // 255
console.log('');

// 2. 16-bit integers (2 bytes)
console.log('2. 16-bit Integers (2 bytes)');
const buf16 = Buffer.alloc(8);

// Signed: -32,768 to 32,767
buf16.writeInt16LE(-32768, 0);
buf16.writeInt16LE(32767, 2);

// Unsigned: 0 to 65,535
buf16.writeUInt16LE(0, 4);
buf16.writeUInt16LE(65535, 6);

console.log('Buffer:', buf16);
console.log('Int16LE at 0:', buf16.readInt16LE(0));    // -32768
console.log('Int16LE at 2:', buf16.readInt16LE(2));    // 32767
console.log('UInt16LE at 4:', buf16.readUInt16LE(4));  // 0
console.log('UInt16LE at 6:', buf16.readUInt16LE(6));  // 65535
console.log('');

// 3. 32-bit integers (4 bytes)
console.log('3. 32-bit Integers (4 bytes)');
const buf32 = Buffer.alloc(16);

// Signed: -2,147,483,648 to 2,147,483,647
buf32.writeInt32LE(-2147483648, 0);
buf32.writeInt32LE(2147483647, 4);

// Unsigned: 0 to 4,294,967,295
buf32.writeUInt32LE(0, 8);
buf32.writeUInt32LE(4294967295, 12);

console.log('Buffer:', buf32);
console.log('Int32LE at 0:', buf32.readInt32LE(0));    // -2147483648
console.log('Int32LE at 4:', buf32.readInt32LE(4));    // 2147483647
console.log('UInt32LE at 8:', buf32.readUInt32LE(8));  // 0
console.log('UInt32LE at 12:', buf32.readUInt32LE(12)); // 4294967295
console.log('');

// 4. 64-bit integers (8 bytes) - BigInt
console.log('4. 64-bit Integers (8 bytes) - BigInt');
const buf64 = Buffer.alloc(16);

// BigInt support for 64-bit integers
buf64.writeBigInt64LE(-9223372036854775808n, 0);
buf64.writeBigInt64LE(9223372036854775807n, 8);

console.log('Buffer:', buf64);
console.log('BigInt64LE at 0:', buf64.readBigInt64LE(0));
console.log('BigInt64LE at 8:', buf64.readBigInt64LE(8));
console.log('');

// 5. Floating-point numbers
console.log('5. Floating-Point Numbers');
const bufFloat = Buffer.alloc(12);

// 32-bit float (4 bytes) - ~7 decimal digits precision
bufFloat.writeFloatLE(3.14159, 0);
bufFloat.writeFloatLE(-123.456, 4);

// 64-bit double (8 bytes) - ~15 decimal digits precision
bufFloat.writeDoubleLE(3.141592653589793, 8);

console.log('Buffer:', bufFloat);
console.log('Float at 0:', bufFloat.readFloatLE(0));
console.log('Float at 4:', bufFloat.readFloatLE(4));
console.log('Double at 8:', bufFloat.readDoubleLE(8));
console.log('');

// 6. Practical example: Sensor data
console.log('6. Practical Example: Sensor Data Packet');

/**
 * Sensor data packet format:
 * - sensor_id (uint8) - 1 byte
 * - timestamp (uint32) - 4 bytes
 * - temperature (float) - 4 bytes
 * - humidity (float) - 4 bytes
 * - pressure (double) - 8 bytes
 * Total: 21 bytes
 */
function createSensorPacket(sensorId, timestamp, temp, humidity, pressure) {
  const buf = Buffer.alloc(21);
  let offset = 0;

  buf.writeUInt8(sensorId, offset);
  offset += 1;

  buf.writeUInt32LE(timestamp, offset);
  offset += 4;

  buf.writeFloatLE(temp, offset);
  offset += 4;

  buf.writeFloatLE(humidity, offset);
  offset += 4;

  buf.writeDoubleLE(pressure, offset);
  offset += 8;

  return buf;
}

function parseSensorPacket(buf) {
  let offset = 0;

  const sensorId = buf.readUInt8(offset);
  offset += 1;

  const timestamp = buf.readUInt32LE(offset);
  offset += 4;

  const temperature = buf.readFloatLE(offset);
  offset += 4;

  const humidity = buf.readFloatLE(offset);
  offset += 4;

  const pressure = buf.readDoubleLE(offset);
  offset += 8;

  return {
    sensorId,
    timestamp,
    temperature,
    humidity,
    pressure
  };
}

// Create and parse sensor data
const sensorData = createSensorPacket(
  42,                    // sensor ID
  Date.now(),            // timestamp
  23.5,                  // temperature in °C
  65.2,                  // humidity in %
  1013.25                // pressure in hPa
);

console.log('Sensor packet (hex):', sensorData.toString('hex'));
console.log('Sensor packet (size):', sensorData.length, 'bytes');

const parsed = parseSensorPacket(sensorData);
console.log('Parsed data:', parsed);
console.log('');

// 7. Data type size comparison
console.log('7. Data Type Size Comparison');
const sizes = {
  'Int8/UInt8': 1,
  'Int16/UInt16': 2,
  'Int32/UInt32': 4,
  'BigInt64/BigUInt64': 8,
  'Float': 4,
  'Double': 8
};

console.log('Data Type Sizes:');
Object.entries(sizes).forEach(([type, size]) => {
  console.log(`  ${type.padEnd(20)}: ${size} byte${size > 1 ? 's' : ''}`);
});
console.log('');

// 8. Range demonstration
console.log('8. Numeric Ranges and Overflow');

// Demonstrating overflow behavior
const overflowBuf = Buffer.alloc(4);

// Int8 overflow: 127 + 1 = -128
overflowBuf.writeInt8(127, 0);
console.log('Int8 max:', overflowBuf.readInt8(0));
overflowBuf.writeInt8(128, 0); // Wraps to -128
console.log('Int8 max + 1 (wraps):', overflowBuf.readInt8(0));

// UInt8 overflow: 255 + 1 = 0
overflowBuf.writeUInt8(255, 1);
console.log('UInt8 max:', overflowBuf.readUInt8(1));
overflowBuf.writeUInt8(256, 1); // Wraps to 0
console.log('UInt8 max + 1 (wraps):', overflowBuf.readUInt8(1));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Signed integers can be negative, unsigned cannot');
console.log('✓ Larger types can store bigger numbers but take more space');
console.log('✓ Use smallest type that fits your data range');
console.log('✓ Float (32-bit) for ~7 decimal precision');
console.log('✓ Double (64-bit) for ~15 decimal precision');
console.log('✓ Always track offset when writing multiple values');
console.log('⚠️  Overflow wraps around, no error thrown!');
