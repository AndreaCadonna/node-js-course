# File Upload Service

A production-ready HTTP file upload server with real-time progress tracking, drag-and-drop interface, and streaming support. Built using only Node.js core modules.

## Features

- **Multipart Form Data**: Full parsing of `multipart/form-data` requests
- **Stream Processing**: Efficient handling of large files with streams
- **Progress Tracking**: Real-time upload progress via Server-Sent Events
- **Web Interface**: Beautiful drag-and-drop UI with live updates
- **File Validation**: Size limits, type restrictions, and security checks
- **Upload Management**: View, download, and delete uploaded files
- **Statistics**: Track upload counts, sizes, and performance metrics
- **Security**: Path traversal prevention and input validation

## Architecture

This project integrates multiple Node.js core modules:

- **http**: Web server for uploads and API
- **stream**: Streaming file uploads and downloads
- **fs**: File system operations
- **events**: EventEmitter for upload lifecycle
- **crypto**: Random ID generation
- **path**: Safe file path handling

## Directory Structure

```
05-file-upload-service/
├── src/
│   ├── multipart-parser.js - Parse multipart/form-data
│   ├── uploader.js         - File upload handler with progress
│   └── server.js           - HTTP server and API
├── public/
│   ├── index.html          - Upload interface
│   ├── styles.css          - UI styles
│   └── app.js              - Client-side JavaScript
├── uploads/                - Uploaded files directory
├── test/
│   ├── test-upload.js      - CLI upload test tool
│   └── sample.txt          - Sample file for testing
├── index.js                - Main entry point
└── README.md
```

## Installation

No dependencies required! Uses only Node.js core modules.

```bash
cd 05-file-upload-service
```

## Usage

### Start Server

```bash
node index.js
```

Server will start at http://localhost:3000

### Custom Configuration

```bash
# Custom port
PORT=8080 node index.js

# Larger file size limit (50MB)
MAX_FILE_SIZE=52428800 node index.js

# Restrict file types
ALLOWED_EXTENSIONS=".jpg,.png,.pdf" node index.js

# Combined
PORT=8080 MAX_FILE_SIZE=52428800 node index.js
```

### Web Interface

1. Open http://localhost:3000 in your browser
2. Drag and drop files or click to browse
3. Watch real-time upload progress
4. View uploaded files
5. Download or delete files

### Command-Line Upload

Test uploads programmatically:

```bash
# Upload single file
node test/test-upload.js test/sample.txt

# Upload multiple files
node test/test-upload.js file1.jpg file2.pdf file3.txt

# Custom server
PORT=8080 node test/test-upload.js document.pdf
```

### Help

```bash
node index.js --help
```

## API Endpoints

### Upload File
```
POST /api/upload
Content-Type: multipart/form-data

Returns: {
  success: true,
  files: [
    {
      fieldName: "file",
      filename: "original.jpg",
      savedAs: "1234567890-abc123.jpg",
      size: 12345,
      uploadId: "...",
      path: "/uploads/1234567890-abc123.jpg"
    }
  ],
  fields: {}
}
```

### List Uploads
```
GET /api/uploads

Returns: [
  {
    id: "...",
    filename: "...",
    originalFilename: "...",
    size: 12345,
    status: "complete",
    ...
  }
]
```

### Get Statistics
```
GET /api/stats

Returns: {
  total: 10,
  uploading: 0,
  complete: 9,
  error: 1,
  totalBytes: 1234567,
  averageDuration: 1500
}
```

### Delete Upload
```
DELETE /api/uploads/:uploadId

Returns: {
  success: true
}
```

### Real-time Events
```
GET /api/events
Content-Type: text/event-stream

Events:
  - upload-start
  - upload-progress
  - upload-complete
  - upload-error
  - stats
```

### Download File
```
GET /uploads/:filename

Returns: File content with appropriate Content-Type
```

## Implementation Details

### Multipart Parser (src/multipart-parser.js)

Custom implementation that:
1. Parses multipart boundary
2. Extracts file and field parts
3. Handles headers (Content-Disposition, Content-Type)
4. Emits structured events

```javascript
const parser = new MultipartParser(boundary);

parser.on('file', (file) => {
  // file.name, file.filename, file.data, file.contentType
});

parser.on('field', (field) => {
  // field.name, field.value
});
```

### File Uploader (src/uploader.js)

EventEmitter that:
1. Validates file size and type
2. Generates unique filenames
3. Streams files to disk
4. Tracks progress
5. Manages upload state

```javascript
const uploader = new FileUploader({
  uploadDir: './uploads',
  maxFileSize: 10 * 1024 * 1024,
  allowedExtensions: ['.jpg', '.png']
});

uploader.on('progress', ({ uploadId, percentage }) => {
  console.log(`Upload ${uploadId}: ${percentage}%`);
});

uploader.on('complete', (upload) => {
  console.log('Complete:', upload.path);
});
```

### Upload Server (src/server.js)

HTTP server that:
1. Handles multipart requests
2. Serves static files
3. Provides REST API
4. Streams events via SSE
5. Manages file downloads

## Features in Detail

### Progress Tracking

Uses Server-Sent Events (SSE) to push real-time updates:
- Upload started
- Progress percentage
- Upload completed
- Error notifications

### File Validation

Validates before and during upload:
- File size limits
- Allowed extensions
- Concurrent upload limits
- Path traversal prevention

### Security

- Input sanitization
- Path traversal prevention
- Content-Type validation
- File size enforcement
- Safe filename generation

### Performance

- Stream-based processing (constant memory)
- Efficient multipart parsing
- Backpressure handling
- Minimal overhead

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| HOST | Server host | localhost |
| MAX_FILE_SIZE | Max file size in bytes | 10485760 (10MB) |
| ALLOWED_EXTENSIONS | Allowed file types | null (all) |

### Programmatic Configuration

```javascript
const server = new UploadServer({
  port: 3000,
  uploadDir: './uploads',
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.jpg', '.png', '.pdf'],
  maxFiles: 5 // Max concurrent uploads
});
```

## Error Handling

### File Size Exceeded
```json
{
  "error": "File size (15 MB) exceeds limit (10 MB)"
}
```

### Invalid File Type
```json
{
  "error": "File type .exe not allowed. Allowed types: .jpg, .png, .pdf"
}
```

### Too Many Uploads
```json
{
  "error": "Too many concurrent uploads (max: 10)"
}
```

## Testing

### Manual Testing

1. **Basic Upload**
   ```bash
   node test/test-upload.js test/sample.txt
   ```

2. **Large File**
   ```bash
   # Create 5MB test file
   dd if=/dev/zero of=large.bin bs=1M count=5
   node test/test-upload.js large.bin
   ```

3. **Multiple Files**
   ```bash
   node test/test-upload.js file1.txt file2.txt file3.txt
   ```

4. **Web Interface**
   - Open http://localhost:3000
   - Drag and drop multiple files
   - Verify progress tracking
   - Check uploaded files list

### What to Verify

- File uploads successfully
- Progress updates in real-time
- Files saved with unique names
- Original filenames preserved in metadata
- File validation works
- Download works correctly
- Delete removes file

## Best Practices Demonstrated

1. **Stream Processing**: Memory-efficient file handling
2. **Event Architecture**: Decoupled upload lifecycle
3. **Input Validation**: Security and data integrity
4. **Error Handling**: Graceful failure modes
5. **Server-Sent Events**: Real-time updates without WebSockets
6. **API Design**: RESTful endpoints
7. **Security**: Path traversal prevention
8. **Clean Code**: Modular, well-documented

## Common Issues

### Port Already in Use
```bash
PORT=8080 node index.js
```

### Permission Denied (Uploads Directory)
```bash
chmod 755 uploads
```

### File Too Large
```bash
MAX_FILE_SIZE=52428800 node index.js  # 50MB
```

### CORS Issues
Server sets permissive CORS headers for development. For production, restrict origins.

## Extensions

Ideas for enhancement:
- Image thumbnails with `sharp` (if allowing external modules)
- Upload resumption
- Chunked uploads
- Zip compression
- Cloud storage integration (S3, etc.)
- User authentication
- Upload quotas per user
- Virus scanning integration
- Database storage of metadata
- WebSocket support

## Learning Objectives

This project teaches:
- HTTP multipart/form-data parsing
- Stream-based file processing
- Server-Sent Events (SSE)
- File upload best practices
- Progress tracking techniques
- Security considerations
- Event-driven architecture
- REST API design

## Production Considerations

Before deploying to production:

1. **Add Authentication**: Protect upload endpoints
2. **Rate Limiting**: Prevent abuse
3. **Virus Scanning**: Scan uploaded files
4. **Persistent Storage**: Use database for metadata
5. **Cloud Storage**: Store files in S3/GCS
6. **Monitoring**: Add logging and metrics
7. **HTTPS**: Enable SSL/TLS
8. **Validation**: Strict file type checking
9. **Quotas**: Per-user upload limits
10. **Cleanup**: Auto-delete old files

## License

MIT - Educational purposes

## Author

Part of the Node.js Core Modules Course
