const { Writable } = require('stream');
const EventEmitter = require('events');

/**
 * Multipart Form Data Parser
 * Parses multipart/form-data requests and emits file and field events
 */
class MultipartParser extends EventEmitter {
  constructor(boundary) {
    super();
    this.boundary = Buffer.from('\r\n--' + boundary);
    this.boundaryEnd = Buffer.from('\r\n--' + boundary + '--');
    this.buffer = Buffer.alloc(0);
    this.currentPart = null;
    this.headerComplete = false;
  }

  /**
   * Parse chunk of data
   */
  write(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.parse();
  }

  /**
   * Signal end of data
   */
  end() {
    // Process any remaining data
    if (this.currentPart && this.currentPart.data.length > 0) {
      this.emitPart();
    }
    this.emit('end');
  }

  /**
   * Parse buffered data
   */
  parse() {
    while (this.buffer.length > 0) {
      if (!this.currentPart) {
        // Look for boundary
        const boundaryIndex = this.buffer.indexOf(this.boundary);

        if (boundaryIndex === -1) {
          // No boundary found, wait for more data
          break;
        }

        // Skip boundary and CRLF
        this.buffer = this.buffer.slice(boundaryIndex + this.boundary.length);

        // Check for end boundary
        if (this.buffer.indexOf(Buffer.from('--')) === 0) {
          this.buffer = this.buffer.slice(2);
          break;
        }

        // Skip CRLF after boundary
        if (this.buffer.indexOf(Buffer.from('\r\n')) === 0) {
          this.buffer = this.buffer.slice(2);
        }

        // Start new part
        this.currentPart = {
          headers: {},
          data: Buffer.alloc(0)
        };
        this.headerComplete = false;
      }

      if (!this.headerComplete) {
        // Parse headers
        const headerEndIndex = this.buffer.indexOf(Buffer.from('\r\n\r\n'));

        if (headerEndIndex === -1) {
          // Headers incomplete, wait for more data
          break;
        }

        // Extract and parse headers
        const headerData = this.buffer.slice(0, headerEndIndex).toString();
        this.parseHeaders(headerData);

        // Skip headers and empty line
        this.buffer = this.buffer.slice(headerEndIndex + 4);
        this.headerComplete = true;
      }

      // Look for next boundary
      const nextBoundaryIndex = this.buffer.indexOf(this.boundary);

      if (nextBoundaryIndex === -1) {
        // No boundary yet, all remaining data is part content
        this.currentPart.data = Buffer.concat([
          this.currentPart.data,
          this.buffer
        ]);
        this.buffer = Buffer.alloc(0);
        break;
      }

      // Found boundary, extract part data
      this.currentPart.data = Buffer.concat([
        this.currentPart.data,
        this.buffer.slice(0, nextBoundaryIndex)
      ]);

      // Emit the part
      this.emitPart();

      // Reset for next part
      this.currentPart = null;
      this.headerComplete = false;

      // Keep remaining buffer
      this.buffer = this.buffer.slice(nextBoundaryIndex);
    }
  }

  /**
   * Parse part headers
   */
  parseHeaders(headerData) {
    const lines = headerData.split('\r\n');

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const name = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      this.currentPart.headers[name] = value;

      // Parse Content-Disposition header
      if (name === 'content-disposition') {
        this.parseContentDisposition(value);
      }
    }
  }

  /**
   * Parse Content-Disposition header
   */
  parseContentDisposition(value) {
    // Extract name
    const nameMatch = value.match(/name="([^"]+)"/);
    if (nameMatch) {
      this.currentPart.name = nameMatch[1];
    }

    // Extract filename
    const filenameMatch = value.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      this.currentPart.filename = filenameMatch[1];
      this.currentPart.isFile = true;
    }
  }

  /**
   * Emit parsed part
   */
  emitPart() {
    if (!this.currentPart) return;

    if (this.currentPart.isFile) {
      // Emit file part
      this.emit('file', {
        name: this.currentPart.name,
        filename: this.currentPart.filename,
        contentType: this.currentPart.headers['content-type'] || 'application/octet-stream',
        data: this.currentPart.data
      });
    } else {
      // Emit field part
      this.emit('field', {
        name: this.currentPart.name,
        value: this.currentPart.data.toString('utf8')
      });
    }
  }

  /**
   * Extract boundary from Content-Type header
   */
  static getBoundary(contentType) {
    if (!contentType) return null;

    const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/);
    return match ? (match[1] || match[2]) : null;
  }
}

/**
 * Streaming Multipart Parser
 * Returns a writable stream for streaming file uploads
 */
class StreamingMultipartParser extends Writable {
  constructor(boundary, options = {}) {
    super();
    this.parser = new MultipartParser(boundary);
    this.maxFileSize = options.maxFileSize || Infinity;
    this.currentFileSize = 0;

    // Forward parser events
    this.parser.on('file', (file) => this.emit('file', file));
    this.parser.on('field', (field) => this.emit('field', field));
    this.parser.on('end', () => this.emit('finish'));
  }

  _write(chunk, encoding, callback) {
    try {
      this.currentFileSize += chunk.length;

      if (this.currentFileSize > this.maxFileSize) {
        callback(new Error('File size exceeds limit'));
        return;
      }

      this.parser.write(chunk);
      callback();
    } catch (err) {
      callback(err);
    }
  }

  _final(callback) {
    this.parser.end();
    callback();
  }
}

module.exports = { MultipartParser, StreamingMultipartParser };
