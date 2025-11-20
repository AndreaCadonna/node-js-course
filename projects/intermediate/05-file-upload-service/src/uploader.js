const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { Readable } = require('stream');

/**
 * File Uploader - Handles file uploads with streaming and progress tracking
 */
class FileUploader extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      uploadDir: options.uploadDir || path.join(process.cwd(), 'uploads'),
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB default
      maxFiles: options.maxFiles || 10,
      allowedExtensions: options.allowedExtensions || null, // null = all allowed
      generateFilename: options.generateFilename || this.defaultFilenameGenerator,
      ...options
    };

    this.uploads = new Map();
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDir() {
    if (!fs.existsSync(this.options.uploadDir)) {
      fs.mkdirSync(this.options.uploadDir, { recursive: true });
    }
  }

  /**
   * Default filename generator (timestamp + random hash + original extension)
   */
  defaultFilenameGenerator(originalFilename) {
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  /**
   * Upload file from buffer
   */
  async uploadFromBuffer(filename, buffer, metadata = {}) {
    const uploadId = this.generateUploadId();

    const upload = {
      id: uploadId,
      filename: filename,
      originalFilename: filename,
      size: buffer.length,
      uploadedBytes: 0,
      startTime: Date.now(),
      status: 'uploading',
      metadata
    };

    this.uploads.set(uploadId, upload);
    this.emit('start', { uploadId, filename, size: buffer.length });

    try {
      // Validate file
      await this.validateFile(filename, buffer.length);

      // Generate safe filename
      const safeFilename = this.options.generateFilename(filename);
      const filePath = path.join(this.options.uploadDir, safeFilename);

      upload.path = filePath;
      upload.safeFilename = safeFilename;

      // Write file
      await fs.promises.writeFile(filePath, buffer);

      upload.uploadedBytes = buffer.length;
      upload.status = 'complete';
      upload.endTime = Date.now();
      upload.duration = upload.endTime - upload.startTime;

      this.emit('complete', upload);
      this.emit('progress', {
        uploadId,
        uploadedBytes: buffer.length,
        totalBytes: buffer.length,
        percentage: 100
      });

      return upload;
    } catch (err) {
      upload.status = 'error';
      upload.error = err.message;
      this.emit('error', { uploadId, error: err });
      throw err;
    }
  }

  /**
   * Upload file from stream
   */
  async uploadFromStream(filename, stream, totalSize, metadata = {}) {
    const uploadId = this.generateUploadId();

    const upload = {
      id: uploadId,
      filename: filename,
      originalFilename: filename,
      size: totalSize,
      uploadedBytes: 0,
      startTime: Date.now(),
      status: 'uploading',
      metadata
    };

    this.uploads.set(uploadId, upload);
    this.emit('start', { uploadId, filename, size: totalSize });

    return new Promise(async (resolve, reject) => {
      try {
        // Validate file
        await this.validateFile(filename, totalSize);

        // Generate safe filename
        const safeFilename = this.options.generateFilename(filename);
        const filePath = path.join(this.options.uploadDir, safeFilename);

        upload.path = filePath;
        upload.safeFilename = safeFilename;

        // Create write stream
        const writeStream = fs.createWriteStream(filePath);
        let uploadedBytes = 0;

        // Track progress
        stream.on('data', (chunk) => {
          uploadedBytes += chunk.length;
          upload.uploadedBytes = uploadedBytes;

          const percentage = totalSize > 0
            ? ((uploadedBytes / totalSize) * 100).toFixed(2)
            : 0;

          this.emit('progress', {
            uploadId,
            uploadedBytes,
            totalBytes: totalSize,
            percentage: parseFloat(percentage)
          });
        });

        // Pipe stream to file
        pipeline(stream, writeStream, (err) => {
          if (err) {
            upload.status = 'error';
            upload.error = err.message;
            this.emit('error', { uploadId, error: err });

            // Clean up partial file
            fs.unlink(filePath, () => {});

            reject(err);
          } else {
            upload.uploadedBytes = uploadedBytes;
            upload.status = 'complete';
            upload.endTime = Date.now();
            upload.duration = upload.endTime - upload.startTime;

            this.emit('complete', upload);
            resolve(upload);
          }
        });
      } catch (err) {
        upload.status = 'error';
        upload.error = err.message;
        this.emit('error', { uploadId, error: err });
        reject(err);
      }
    });
  }

  /**
   * Validate file before upload
   */
  async validateFile(filename, size) {
    // Check file size
    if (size > this.options.maxFileSize) {
      throw new Error(
        `File size (${this.formatBytes(size)}) exceeds limit (${this.formatBytes(this.options.maxFileSize)})`
      );
    }

    // Check extension if restrictions exist
    if (this.options.allowedExtensions) {
      const ext = path.extname(filename).toLowerCase();
      if (!this.options.allowedExtensions.includes(ext)) {
        throw new Error(
          `File type ${ext} not allowed. Allowed types: ${this.options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Check total number of uploads
    const activeUploads = Array.from(this.uploads.values())
      .filter(u => u.status === 'uploading').length;

    if (activeUploads >= this.options.maxFiles) {
      throw new Error(`Too many concurrent uploads (max: ${this.options.maxFiles})`);
    }

    return true;
  }

  /**
   * Get upload status
   */
  getUpload(uploadId) {
    return this.uploads.get(uploadId);
  }

  /**
   * Get all uploads
   */
  getAllUploads() {
    return Array.from(this.uploads.values());
  }

  /**
   * Delete uploaded file
   */
  async deleteUpload(uploadId) {
    const upload = this.uploads.get(uploadId);

    if (!upload) {
      throw new Error('Upload not found');
    }

    if (upload.path && fs.existsSync(upload.path)) {
      await fs.promises.unlink(upload.path);
    }

    this.uploads.delete(uploadId);
    this.emit('deleted', { uploadId });

    return true;
  }

  /**
   * Clean up old uploads
   */
  async cleanup(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const deleted = [];

    for (const [uploadId, upload] of this.uploads) {
      if (upload.endTime && (now - upload.endTime) > maxAge) {
        try {
          await this.deleteUpload(uploadId);
          deleted.push(uploadId);
        } catch (err) {
          // Ignore errors
        }
      }
    }

    return deleted;
  }

  /**
   * Generate unique upload ID
   */
  generateUploadId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get upload statistics
   */
  getStats() {
    const uploads = this.getAllUploads();

    return {
      total: uploads.length,
      uploading: uploads.filter(u => u.status === 'uploading').length,
      complete: uploads.filter(u => u.status === 'complete').length,
      error: uploads.filter(u => u.status === 'error').length,
      totalBytes: uploads.reduce((sum, u) => sum + (u.uploadedBytes || 0), 0),
      averageDuration: uploads
        .filter(u => u.duration)
        .reduce((sum, u, _, arr) => sum + u.duration / arr.length, 0)
    };
  }
}

module.exports = FileUploader;
