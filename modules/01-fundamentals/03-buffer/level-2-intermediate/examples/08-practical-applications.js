/**
 * Example 8: Practical Applications
 *
 * Real-world examples combining all Level 2 concepts:
 * numeric types, endianness, TypedArrays, file formats, and protocols.
 */

console.log('=== Practical Applications ===\n');

// 1. Network packet analyzer
console.log('1. Network Packet Analyzer');

/**
 * Ethernet Frame Structure:
 * - Destination MAC (6 bytes)
 * - Source MAC (6 bytes)
 * - EtherType (2 bytes)
 * - Payload (46-1500 bytes)
 * - CRC (4 bytes)
 */

class EthernetFrame {
  constructor(destMAC, srcMAC, etherType, payload) {
    this.destMAC = destMAC;
    this.srcMAC = srcMAC;
    this.etherType = etherType;
    this.payload = payload;
  }

  serialize() {
    const crc = this.calculateCRC();
    const buf = Buffer.alloc(18 + this.payload.length);
    let offset = 0;

    this.destMAC.copy(buf, offset);
    offset += 6;

    this.srcMAC.copy(buf, offset);
    offset += 6;

    buf.writeUInt16BE(this.etherType, offset);
    offset += 2;

    this.payload.copy(buf, offset);
    offset += this.payload.length;

    buf.writeUInt32BE(crc, offset);

    return buf;
  }

  static deserialize(buf) {
    let offset = 0;

    const destMAC = buf.slice(offset, offset + 6);
    offset += 6;

    const srcMAC = buf.slice(offset, offset + 6);
    offset += 6;

    const etherType = buf.readUInt16BE(offset);
    offset += 2;

    const payload = buf.slice(offset, buf.length - 4);
    offset += payload.length;

    const crc = buf.readUInt32BE(offset);

    return new EthernetFrame(destMAC, srcMAC, etherType, payload);
  }

  calculateCRC() {
    // Simplified CRC-32
    return 0x12345678;
  }

  formatMAC(mac) {
    return Array.from(mac)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':');
  }

  toString() {
    return `Ethernet Frame:
  Dest MAC: ${this.formatMAC(this.destMAC)}
  Src MAC: ${this.formatMAC(this.srcMAC)}
  EtherType: 0x${this.etherType.toString(16).padStart(4, '0')}
  Payload: ${this.payload.length} bytes`;
  }
}

const frame = new EthernetFrame(
  Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44, 0x55]),
  Buffer.from([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]),
  0x0800, // IPv4
  Buffer.from('Hello Ethernet')
);

console.log(frame.toString());
console.log('');

// 2. Binary log file format
console.log('2. Binary Log File Format');

/**
 * Log entry:
 * - Timestamp (8 bytes, double)
 * - Level (1 byte)
 * - Message length (2 bytes)
 * - Message (variable)
 */

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class BinaryLogger {
  constructor() {
    this.entries = [];
  }

  log(level, message) {
    const timestamp = Date.now();
    const msgBuf = Buffer.from(message, 'utf8');

    const entry = Buffer.alloc(11 + msgBuf.length);
    let offset = 0;

    entry.writeDoubleLE(timestamp, offset);
    offset += 8;

    entry.writeUInt8(level, offset);
    offset += 1;

    entry.writeUInt16LE(msgBuf.length, offset);
    offset += 2;

    msgBuf.copy(entry, offset);

    this.entries.push(entry);
  }

  serialize() {
    return Buffer.concat(this.entries);
  }

  static deserialize(buf) {
    const logger = new BinaryLogger();
    let offset = 0;

    while (offset < buf.length) {
      const timestamp = buf.readDoubleLE(offset);
      offset += 8;

      const level = buf.readUInt8(offset);
      offset += 1;

      const msgLen = buf.readUInt16LE(offset);
      offset += 2;

      const message = buf.toString('utf8', offset, offset + msgLen);
      offset += msgLen;

      logger.entries.push({ timestamp, level, message });
    }

    return logger;
  }

  print() {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

    this.entries.forEach((entry, i) => {
      if (Buffer.isBuffer(entry)) return; // Skip raw buffers

      const date = new Date(entry.timestamp);
      const time = date.toISOString();
      const level = levelNames[entry.level] || 'UNKNOWN';
      console.log(`[${i}] ${time} [${level}] ${entry.message}`);
    });
  }
}

const logger = new BinaryLogger();
logger.log(LogLevel.INFO, 'Application started');
logger.log(LogLevel.DEBUG, 'Loading configuration');
logger.log(LogLevel.WARN, 'Deprecated API used');
logger.log(LogLevel.ERROR, 'Connection failed');

const logData = logger.serialize();
console.log('Log file size:', logData.length, 'bytes');

const restoredLogger = BinaryLogger.deserialize(logData);
restoredLogger.print();
console.log('');

// 3. Bitmap graphics manipulation
console.log('3. Bitmap Graphics Manipulation');

class Bitmap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8ClampedArray(width * height * 4); // RGBA
  }

  setPixel(x, y, r, g, b, a = 255) {
    const index = (y * this.width + x) * 4;
    this.pixels[index] = r;
    this.pixels[index + 1] = g;
    this.pixels[index + 2] = b;
    this.pixels[index + 3] = a;
  }

  getPixel(x, y) {
    const index = (y * this.width + x) * 4;
    return {
      r: this.pixels[index],
      g: this.pixels[index + 1],
      b: this.pixels[index + 2],
      a: this.pixels[index + 3]
    };
  }

  fill(r, g, b, a = 255) {
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels[i] = r;
      this.pixels[i + 1] = g;
      this.pixels[i + 2] = b;
      this.pixels[i + 3] = a;
    }
  }

  drawRect(x, y, width, height, r, g, b, a = 255) {
    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  invert() {
    for (let i = 0; i < this.pixels.length; i += 4) {
      this.pixels[i] = 255 - this.pixels[i];         // R
      this.pixels[i + 1] = 255 - this.pixels[i + 1]; // G
      this.pixels[i + 2] = 255 - this.pixels[i + 2]; // B
      // Keep alpha unchanged
    }
  }

  grayscale() {
    for (let i = 0; i < this.pixels.length; i += 4) {
      const gray = Math.floor(
        this.pixels[i] * 0.299 +
        this.pixels[i + 1] * 0.587 +
        this.pixels[i + 2] * 0.114
      );
      this.pixels[i] = gray;
      this.pixels[i + 1] = gray;
      this.pixels[i + 2] = gray;
    }
  }
}

const bitmap = new Bitmap(10, 10);
bitmap.fill(255, 255, 255); // White background
bitmap.drawRect(2, 2, 6, 6, 255, 0, 0); // Red square

console.log('Created 10×10 bitmap');
console.log('Center pixel:', bitmap.getPixel(5, 5));

bitmap.grayscale();
console.log('After grayscale:', bitmap.getPixel(5, 5));
console.log('');

// 4. Audio processing
console.log('4. Audio Sample Processing');

class AudioProcessor {
  constructor(sampleRate, channels = 1) {
    this.sampleRate = sampleRate;
    this.channels = channels;
  }

  generateTone(frequency, duration, amplitude = 0.5) {
    const numSamples = Math.floor(this.sampleRate * duration);
    const samples = new Float32Array(numSamples * this.channels);

    for (let i = 0; i < numSamples; i++) {
      const t = i / this.sampleRate;
      const value = Math.sin(2 * Math.PI * frequency * t) * amplitude;

      for (let ch = 0; ch < this.channels; ch++) {
        samples[i * this.channels + ch] = value;
      }
    }

    return samples;
  }

  applyFade(samples, fadeInSamples, fadeOutSamples) {
    const total = samples.length / this.channels;

    for (let i = 0; i < fadeInSamples; i++) {
      const factor = i / fadeInSamples;
      for (let ch = 0; ch < this.channels; ch++) {
        samples[i * this.channels + ch] *= factor;
      }
    }

    for (let i = 0; i < fadeOutSamples; i++) {
      const sampleIdx = total - fadeOutSamples + i;
      const factor = (fadeOutSamples - i) / fadeOutSamples;
      for (let ch = 0; ch < this.channels; ch++) {
        samples[sampleIdx * this.channels + ch] *= factor;
      }
    }
  }

  mix(samples1, samples2, ratio = 0.5) {
    const length = Math.min(samples1.length, samples2.length);
    const mixed = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      mixed[i] = samples1[i] * ratio + samples2[i] * (1 - ratio);
    }

    return mixed;
  }

  toInt16(samples) {
    const int16 = new Int16Array(samples.length);

    for (let i = 0; i < samples.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit
      const clamped = Math.max(-1, Math.min(1, samples[i]));
      int16[i] = Math.floor(clamped * 32767);
    }

    return int16;
  }
}

const audio = new AudioProcessor(44100);

// Generate 440 Hz tone (A note) for 0.1 seconds
const tone = audio.generateTone(440, 0.1, 0.5);

console.log('Generated', tone.length, 'audio samples');
console.log('First 5 samples:', Array.from(tone.slice(0, 5)));

// Apply fade
audio.applyFade(tone, 1000, 1000);

// Convert to 16-bit PCM
const pcm = audio.toInt16(tone);
console.log('Converted to 16-bit PCM');
console.log('First 5 samples:', Array.from(pcm.slice(0, 5)));
console.log('');

// 5. Data compression (Run-Length Encoding)
console.log('5. Run-Length Encoding (Simple Compression)');

function rleEncode(data) {
  const result = [];
  let i = 0;

  while (i < data.length) {
    const value = data[i];
    let count = 1;

    // Count consecutive same values
    while (i + count < data.length && data[i + count] === value && count < 255) {
      count++;
    }

    result.push(count, value);
    i += count;
  }

  return Buffer.from(result);
}

function rleDecode(encoded) {
  const result = [];

  for (let i = 0; i < encoded.length; i += 2) {
    const count = encoded[i];
    const value = encoded[i + 1];

    for (let j = 0; j < count; j++) {
      result.push(value);
    }
  }

  return Buffer.from(result);
}

const original = Buffer.from([
  0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
  0x00, 0x00, 0x00,
  0xAA, 0xAA, 0xAA, 0xAA
]);

const compressed = rleEncode(original);
const decompressed = rleDecode(compressed);

console.log('Original:', original.length, 'bytes');
console.log('Compressed:', compressed.length, 'bytes');
console.log('Ratio:', (compressed.length / original.length * 100).toFixed(1) + '%');
console.log('Decompressed matches:', original.equals(decompressed));
console.log('');

// 6. Database index file
console.log('6. Database Index File');

/**
 * Index entry:
 * - Key (4 bytes, uint32)
 * - Offset (8 bytes, BigUInt64)
 * - Length (4 bytes, uint32)
 */

class DatabaseIndex {
  constructor() {
    this.entries = new Map();
  }

  add(key, offset, length) {
    this.entries.set(key, { offset, length });
  }

  serialize() {
    const buf = Buffer.alloc(this.entries.size * 16);
    let pos = 0;

    for (const [key, { offset, length }] of this.entries) {
      buf.writeUInt32LE(key, pos);
      pos += 4;

      buf.writeBigUInt64LE(BigInt(offset), pos);
      pos += 8;

      buf.writeUInt32LE(length, pos);
      pos += 4;
    }

    return buf;
  }

  static deserialize(buf) {
    const index = new DatabaseIndex();
    let pos = 0;

    while (pos < buf.length) {
      const key = buf.readUInt32LE(pos);
      pos += 4;

      const offset = Number(buf.readBigUInt64LE(pos));
      pos += 8;

      const length = buf.readUInt32LE(pos);
      pos += 4;

      index.add(key, offset, length);
    }

    return index;
  }

  lookup(key) {
    return this.entries.get(key);
  }
}

const index = new DatabaseIndex();
index.add(1, 0, 128);
index.add(2, 128, 256);
index.add(3, 384, 512);

const indexData = index.serialize();
console.log('Index size:', indexData.length, 'bytes');

const restoredIndex = DatabaseIndex.deserialize(indexData);
console.log('Lookup key 2:', restoredIndex.lookup(2));
console.log('');

// Summary
console.log('=== Summary ===');
console.log('✓ Network protocols use big-endian byte order');
console.log('✓ Binary logs are compact and fast to parse');
console.log('✓ TypedArrays excel at image/audio processing');
console.log('✓ RLE is simple but effective for certain data');
console.log('✓ Binary indexes provide O(1) lookups');
console.log('✓ Combining concepts solves real-world problems');
