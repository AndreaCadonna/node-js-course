/**
 * Example 3: Streaming Binary Data
 *
 * Demonstrates handling binary data streams, chunked processing,
 * and building streaming parsers.
 */

const { Readable, Writable, Transform } = require('stream');

console.log('=== Streaming Binary Data ===\n');

// 1. Chunked binary data problem
console.log('1. The Chunking Problem');

class MessageParser {
  constructor() {
    this.buffer = Buffer.alloc(0);
    this.messageLength = 8; // Fixed message length for demo
  }

  addChunk(chunk) {
    // Accumulate chunks
    this.buffer = Buffer.concat([this.buffer, chunk]);
    console.log(`Added ${chunk.length} bytes, total: ${this.buffer.length}`);
  }

  getMessages() {
    const messages = [];

    while (this.buffer.length >= this.messageLength) {
      // Extract one message
      const message = this.buffer.slice(0, this.messageLength);
      messages.push(message);

      // Remove from buffer
      this.buffer = this.buffer.slice(this.messageLength);
    }

    console.log(`Extracted ${messages.length} messages, ${this.buffer.length} bytes remaining`);
    return messages;
  }
}

const parser = new MessageParser();

// Simulate chunks arriving
parser.addChunk(Buffer.from([1, 2, 3, 4, 5])); // Partial
const msgs1 = parser.getMessages();

parser.addChunk(Buffer.from([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])); // Complete + partial
const msgs2 = parser.getMessages();

parser.addChunk(Buffer.from([17, 18, 19, 20, 21, 22, 23, 24])); // Complete
const msgs3 = parser.getMessages();

console.log('Total messages extracted:', msgs1.length + msgs2.length + msgs3.length);
console.log('');

// 2. Length-prefixed messages
console.log('2. Length-Prefixed Message Stream');

class LengthPrefixedParser {
  constructor() {
    this.buffer = Buffer.alloc(0);
    this.headerSize = 4; // 4-byte length prefix
  }

  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
  }

  read() {
    const messages = [];

    while (true) {
      // Need at least header
      if (this.buffer.length < this.headerSize) {
        break;
      }

      // Read message length
      const messageLength = this.buffer.readUInt32LE(0);

      // Check if we have complete message
      const totalSize = this.headerSize + messageLength;
      if (this.buffer.length < totalSize) {
        break; // Wait for more data
      }

      // Extract message
      const message = this.buffer.slice(this.headerSize, totalSize);
      messages.push(message);

      // Remove processed message
      this.buffer = this.buffer.slice(totalSize);
    }

    return messages;
  }
}

// Create test messages
function createMessage(data) {
  const length = Buffer.byteLength(data);
  const buf = Buffer.alloc(4 + length);
  buf.writeUInt32LE(length, 0);
  buf.write(data, 4);
  return buf;
}

const lpParser = new LengthPrefixedParser();

const msg1 = createMessage('Hello');
const msg2 = createMessage('World');
const combined = Buffer.concat([msg1, msg2]);

// Simulate partial arrival
lpParser.push(combined.slice(0, 7));
console.log('After chunk 1:', lpParser.read().length, 'messages');

lpParser.push(combined.slice(7));
const extractedMsgs = lpParser.read();
console.log('After chunk 2:', extractedMsgs.length, 'messages');
extractedMsgs.forEach(msg => console.log('  Message:', msg.toString()));
console.log('');

// 3. Binary Transform Stream
console.log('3. Binary Transform Stream');

class BinaryLengthPrefixStream extends Transform {
  constructor(options) {
    super(options);
    this.buffer = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= 4) {
      const length = this.buffer.readUInt32LE(0);
      const totalSize = 4 + length;

      if (this.buffer.length < totalSize) {
        break; // Wait for more data
      }

      // Extract and emit message
      const message = this.buffer.slice(4, totalSize);
      this.push(message);

      // Remove from buffer
      this.buffer = this.buffer.slice(totalSize);
    }

    callback();
  }

  _flush(callback) {
    // Handle remaining data
    if (this.buffer.length > 0) {
      this.emit('error', new Error('Incomplete message at end of stream'));
    }
    callback();
  }
}

// Test the transform stream
const transform = new BinaryLengthPrefixStream();

transform.on('data', (message) => {
  console.log('Stream message:', message.toString());
});

transform.write(msg1);
transform.write(msg2);
transform.end();

console.log('');

// 4. Backpressure handling
console.log('4. Backpressure Handling');

class BackpressureAwareParser extends Readable {
  constructor(data, options) {
    super(options);
    this.data = data;
    this.offset = 0;
    this.chunkSize = 10;
  }

  _read(size) {
    if (this.offset >= this.data.length) {
      this.push(null); // EOF
      return;
    }

    // Send chunk
    const chunk = this.data.slice(this.offset, this.offset + this.chunkSize);
    this.offset += this.chunkSize;

    const shouldContinue = this.push(chunk);

    if (!shouldContinue) {
      console.log('Backpressure detected, pausing...');
    }
  }
}

const testData = Buffer.alloc(100).fill(0xAA);
const backpressureStream = new BackpressureAwareParser(testData);

let chunks = 0;
backpressureStream.on('data', (chunk) => {
  chunks++;
  // Simulate slow consumer
});

backpressureStream.on('end', () => {
  console.log(`Received ${chunks} chunks with backpressure handling`);
});

console.log('');

// 5. Efficient streaming parser
console.log('5. High-Performance Streaming Parser');

class BinaryProtocolParser {
  constructor() {
    this.reset();
  }

  reset() {
    this.buffer = Buffer.alloc(0);
    this.state = 'HEADER';
    this.messageLength = 0;
  }

  parse(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    const messages = [];

    while (true) {
      if (this.state === 'HEADER') {
        if (this.buffer.length < 8) break;

        // Parse header
        const magic = this.buffer.readUInt32BE(0);
        this.messageLength = this.buffer.readUInt32BE(4);

        if (magic !== 0xDEADBEEF) {
          throw new Error('Invalid magic number');
        }

        this.buffer = this.buffer.slice(8);
        this.state = 'PAYLOAD';
      }

      if (this.state === 'PAYLOAD') {
        if (this.buffer.length < this.messageLength) break;

        // Extract payload
        const payload = this.buffer.slice(0, this.messageLength);
        messages.push(payload);

        this.buffer = this.buffer.slice(this.messageLength);
        this.state = 'HEADER';
        this.messageLength = 0;
      }
    }

    return messages;
  }
}

const protoParser = new BinaryProtocolParser();

// Create test message
const testMsg = Buffer.alloc(18);
testMsg.writeUInt32BE(0xDEADBEEF, 0);
testMsg.writeUInt32BE(10, 4);
testMsg.write('HelloWorld', 8);

// Parse in chunks
protoParser.parse(testMsg.slice(0, 5));
protoParser.parse(testMsg.slice(5, 12));
const results = protoParser.parse(testMsg.slice(12));

console.log('Parsed messages:', results.length);
results.forEach(msg => console.log('  Payload:', msg.toString()));
console.log('');

// 6. Memory-efficient large file processing
console.log('6. Memory-Efficient Large File Processing');

class ChunkedProcessor {
  constructor(chunkSize = 1024) {
    this.chunkSize = chunkSize;
    this.stats = {
      chunksProcessed: 0,
      bytesProcessed: 0,
      errors: 0
    };
  }

  async processStream(readable, processFn) {
    return new Promise((resolve, reject) => {
      readable.on('data', (chunk) => {
        try {
          processFn(chunk);
          this.stats.chunksProcessed++;
          this.stats.bytesProcessed += chunk.length;
        } catch (err) {
          this.stats.errors++;
          readable.destroy(err);
        }
      });

      readable.on('end', () => {
        resolve(this.stats);
      });

      readable.on('error', reject);
    });
  }
}

// Simulate processing
const processor = new ChunkedProcessor(16);
const simulatedData = Buffer.alloc(100).fill(0xBB);
const simulatedStream = Readable.from([
  simulatedData.slice(0, 30),
  simulatedData.slice(30, 70),
  simulatedData.slice(70)
]);

processor.processStream(simulatedStream, (chunk) => {
  // Process each chunk
  console.log(`Processing chunk: ${chunk.length} bytes`);
}).then(stats => {
  console.log('Processing complete:', stats);
  console.log('');
});

// Allow async operation to complete
setTimeout(() => {
  // 7. Best practices
  console.log('7. Streaming Binary Data Best Practices');

  console.log('✓ Accumulate chunks until message is complete');
  console.log('✓ Use length prefixes for variable-length messages');
  console.log('✓ Handle backpressure to prevent memory issues');
  console.log('✓ Process data incrementally, not all at once');
  console.log('✓ Use state machines for complex protocols');
  console.log('✓ Clear buffers after processing');
  console.log('⚠️  Always validate message boundaries!');
  console.log('');

  // Summary
  console.log('=== Summary ===');
  console.log('✓ Streams handle data in chunks');
  console.log('✓ Accumulate chunks until complete message');
  console.log('✓ Length prefixes solve framing problem');
  console.log('✓ Transform streams for protocol decoding');
  console.log('✓ Handle backpressure for memory efficiency');
  console.log('✓ State machines for complex parsing');
}, 100);
