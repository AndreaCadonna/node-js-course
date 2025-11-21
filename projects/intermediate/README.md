# Intermediate Projects

This directory contains three comprehensive projects that integrate multiple Node.js core modules. Each project demonstrates real-world application development using only Node.js built-in modules.

## Projects Overview

### Project 4: Log Analyzer
**Complexity**: ⭐⭐⭐⭐
**Time**: 5-6 hours
**Modules**: stream, events, fs, http

Parse and analyze log files in real-time with a web dashboard.

**Key Features**:
- Stream processing of large log files
- Multiple log format parsing (Apache, JSON, application logs)
- Real-time analysis with Server-Sent Events
- Web dashboard with live updates
- Pattern-based alerting system
- HTTP status code and IP tracking

**Learning Focus**:
- Transform streams
- Event-driven architecture
- Server-Sent Events (SSE)
- HTTP server implementation
- Regular expression parsing

[View Project →](./04-log-analyzer/)

---

### Project 5: File Upload Service
**Complexity**: ⭐⭐⭐⭐⭐
**Time**: 6-7 hours
**Modules**: http, stream, fs, events, crypto

HTTP server for handling file uploads with progress tracking.

**Key Features**:
- Multipart form data parsing
- Stream-based file uploads
- Real-time progress tracking
- File validation (size, type)
- Drag-and-drop web interface
- Upload management (view, download, delete)

**Learning Focus**:
- Multipart/form-data parsing
- Streaming file uploads
- Progress tracking techniques
- File system security
- Event-driven uploads

[View Project →](./05-file-upload-service/)

---

### Project 6: Real-time File Monitor
**Complexity**: ⭐⭐⭐⭐
**Time**: 5-6 hours
**Modules**: fs.watch, events, process, http

Monitor directories for file changes with configurable filters.

**Key Features**:
- Real-time file system monitoring
- Recursive directory watching
- Advanced filtering (extensions, patterns, size)
- Change history and statistics
- Graceful shutdown handling
- Web dashboard with live updates

**Learning Focus**:
- File system watching
- Process signal handling
- Graceful shutdown patterns
- Debouncing techniques
- Filter pattern implementation

[View Project →](./06-realtime-file-monitor/)

---

## Getting Started

### Prerequisites

- Node.js v14 or higher
- Basic understanding of:
  - File system operations
  - Streams
  - Events
  - HTTP basics
  - Promises/async-await

### Recommended Order

1. **Log Analyzer** - Start with stream processing and parsing
2. **File Upload Service** - Build on streaming knowledge
3. **File Monitor** - Apply event patterns and process handling

### Time Investment

- **Log Analyzer**: 5-6 hours
- **File Upload Service**: 6-7 hours
- **File Monitor**: 5-6 hours
- **Total**: 16-19 hours

## Common Patterns

All three projects demonstrate these core patterns:

### 1. Event-Driven Architecture
```javascript
class MyClass extends EventEmitter {
  processData(data) {
    this.emit('progress', { percentage: 50 });
    this.emit('complete', result);
  }
}
```

### 2. Stream Processing
```javascript
const { Transform, pipeline } = require('stream');

pipeline(
  readStream,
  transformStream,
  writeStream,
  (err) => {
    if (err) console.error('Pipeline failed', err);
  }
);
```

### 3. Server-Sent Events
```javascript
res.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
});

res.write(`event: update\n`);
res.write(`data: ${JSON.stringify(data)}\n\n`);
```

### 4. Graceful Shutdown
```javascript
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await cleanup();
  process.exit(0);
});
```

### 5. HTTP Server with Routing
```javascript
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/data') {
    handleAPI(req, res);
  } else {
    serveStatic(req, res);
  }
});
```

## Module Integration Map

| Module | Log Analyzer | Upload Service | File Monitor |
|--------|-------------|----------------|--------------|
| **stream** | ✅ Transform | ✅ Upload | ❌ |
| **events** | ✅ Updates | ✅ Progress | ✅ Changes |
| **fs** | ✅ Read logs | ✅ Write files | ✅ Watch |
| **http** | ✅ Dashboard | ✅ Upload API | ✅ Dashboard |
| **process** | ❌ | ❌ | ✅ Signals |
| **crypto** | ❌ | ✅ File IDs | ❌ |
| **path** | ✅ Paths | ✅ Security | ✅ Paths |

## Skills Development

### After Log Analyzer, you will:
- ✅ Parse complex text formats
- ✅ Implement transform streams
- ✅ Build real-time dashboards
- ✅ Use Server-Sent Events
- ✅ Handle large files efficiently

### After File Upload Service, you will:
- ✅ Parse multipart/form-data
- ✅ Stream file uploads
- ✅ Track upload progress
- ✅ Implement file validation
- ✅ Handle security concerns

### After File Monitor, you will:
- ✅ Use fs.watch effectively
- ✅ Implement graceful shutdown
- ✅ Build filtering systems
- ✅ Handle process signals
- ✅ Manage system resources

## Testing Your Projects

### Manual Testing Checklist

For each project:
- [ ] Starts without errors
- [ ] Web dashboard loads correctly
- [ ] Real-time updates work
- [ ] All features functional
- [ ] Error handling works
- [ ] Graceful shutdown works
- [ ] Performance is acceptable
- [ ] Memory usage is stable

### Performance Benchmarks

**Log Analyzer**:
- Should process 100,000+ lines/second
- Memory usage should stay constant

**File Upload Service**:
- Should handle 10MB+ files smoothly
- Progress updates should be real-time

**File Monitor**:
- Should detect changes instantly
- Should handle 1000+ files without lag

## Troubleshooting

### Common Issues

**Port Already in Use**:
```bash
PORT=8080 node index.js
```

**Permission Denied**:
```bash
# Ensure files are readable
chmod +r logfile.log

# Ensure directories are writable
chmod +w uploads/
```

**Memory Issues**:
- Use streams, not loading entire files
- Implement proper cleanup
- Limit history/cache sizes

**Changes Not Detected** (File Monitor):
- Check file system events are supported
- Verify paths exist
- Review filter settings

## Best Practices Learned

1. **Streams**: Use streams for large data
2. **Events**: Decouple with EventEmitter
3. **Error Handling**: Always handle errors
4. **Security**: Validate all inputs
5. **Resources**: Clean up properly
6. **Performance**: Profile and optimize
7. **Testing**: Test edge cases
8. **Documentation**: Comment complex code

## Code Quality Checklist

- [ ] Modular code organization
- [ ] Clear function/variable names
- [ ] Comprehensive error handling
- [ ] Input validation
- [ ] Resource cleanup
- [ ] Code comments
- [ ] Consistent style
- [ ] README documentation

## Portfolio Showcase

These projects are perfect for your portfolio:

1. **GitHub**: Create separate repos
2. **README**: Include screenshots
3. **Demo**: Record GIF/video demo
4. **Blog**: Write about learnings
5. **Talk**: Present at meetups

## Next Steps

After completing these projects:

1. **Review**: Go through your code
2. **Refactor**: Improve based on learnings
3. **Extend**: Add new features
4. **Test**: Write automated tests
5. **Deploy**: Host online (if applicable)
6. **Share**: Get feedback from community

## Advanced Challenges

Want more? Try these extensions:

### Log Analyzer
- [ ] Export reports to PDF
- [ ] Save analysis to database
- [ ] Email alerts
- [ ] Compare multiple log files
- [ ] Machine learning anomaly detection

### File Upload Service
- [ ] Image thumbnails
- [ ] Resumable uploads
- [ ] Cloud storage integration (S3)
- [ ] User authentication
- [ ] Upload quotas

### File Monitor
- [ ] File diff generation
- [ ] Backup on change
- [ ] Git integration
- [ ] Build trigger
- [ ] Slack notifications

## Resources

### Documentation
- [Node.js Stream Handbook](https://github.com/substack/stream-handbook)
- [Node.js Events API](https://nodejs.org/api/events.html)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)

### Related Modules
- Review Module 4: Events
- Review Module 5: Stream
- Review Module 6: Process
- Review Module 7: HTTP

## Getting Help

If you're stuck:

1. **Review Modules**: Go back to relevant lessons
2. **Debug**: Use console.log and debugger
3. **Read Docs**: Check Node.js documentation
4. **Search**: Look for similar problems
5. **Ask**: Community forums and chat

## Completion Certificate

Once you've completed all three projects:

✅ You've mastered intermediate Node.js patterns
✅ You can build real-world applications
✅ You understand stream processing
✅ You can create HTTP servers
✅ You know event-driven architecture
✅ You're ready for advanced projects!

---

**Ready to build?** Pick a project and start coding!

For questions or issues, refer to individual project READMEs.
