# Log Analyzer

A powerful real-time log analysis tool with a web dashboard. Stream and analyze large log files efficiently, track errors, monitor HTTP traffic, and get instant alerts on critical patterns.

## Features

- **Stream Processing**: Handle log files of any size with Node.js streams
- **Multiple Formats**: Parse Apache/Nginx, JSON, and application logs automatically
- **Real-time Analysis**: Live statistics and updates via Server-Sent Events
- **Web Dashboard**: Beautiful, responsive UI with charts and metrics
- **Alert System**: Configure patterns to alert on errors, status codes, or keywords
- **HTTP Analytics**: Track status codes, methods, paths, and IP addresses
- **Error Tracking**: Automatic error detection and reporting
- **Performance Metrics**: Lines per second, error rates, and duration tracking

## Architecture

This project integrates multiple Node.js core modules:

- **stream**: Transform streams for efficient log processing
- **events**: EventEmitter for real-time updates
- **fs**: File system operations for reading logs
- **http**: Web server for dashboard and API
- **path**: Path manipulation for file handling

## Directory Structure

```
04-log-analyzer/
├── src/
│   ├── parser.js       - Log parsing transform stream
│   ├── analyzer.js     - Analysis engine with statistics
│   └── dashboard.js    - HTTP server with SSE support
├── public/
│   ├── index.html      - Dashboard UI
│   ├── styles.css      - Styles
│   └── app.js          - Client-side JavaScript
├── logs/
│   └── sample.log      - Sample log file
├── test/
│   └── generate-logs.js - Log generator for testing
├── index.js            - Main entry point
└── README.md
```

## Installation

No dependencies required! Uses only Node.js core modules.

```bash
cd 04-log-analyzer
```

## Usage

### Basic Usage

```bash
node index.js logs/sample.log
```

This will:
1. Start analyzing the log file
2. Launch web dashboard at http://localhost:3000
3. Display real-time statistics in the browser

### Custom Port

```bash
PORT=8080 node index.js logs/sample.log
```

### Generate Test Logs

Create a large log file for testing:

```bash
# Generate 10,000 lines
node test/generate-logs.js

# Generate 100,000 lines
node test/generate-logs.js 100000

# Custom output file
node test/generate-logs.js 50000 logs/large.log
```

### Help

```bash
node index.js --help
```

## API Endpoints

The dashboard server provides several API endpoints:

- `GET /` - Web dashboard
- `GET /api/stats` - Current statistics (JSON)
- `GET /api/alerts` - Alert history (JSON)
- `GET /api/events` - Server-Sent Events stream
- `POST /api/reset` - Reset statistics

## Supported Log Formats

### Apache/Nginx Combined Format
```
192.168.1.1 - - [20/Nov/2024:10:00:00 +0000] "GET /api/users HTTP/1.1" 200 1234 "-" "Mozilla/5.0"
```

### Application Log Format
```
2024-11-20 10:00:00 [INFO] Application started
2024-11-20 10:00:05 [ERROR] Database connection failed
```

### JSON Format
```json
{"timestamp":"2024-11-20T10:00:00Z","level":"INFO","message":"Request processed"}
```

## Alert Configuration

Alerts are configured in `index.js`. Default patterns include:

```javascript
{
  name: '5xx Server Errors',
  statusRange: [500, 599]
},
{
  name: 'ERROR Level',
  level: 'ERROR'
},
{
  name: 'Database Error',
  regex: 'database|mysql|postgres'
}
```

Add custom patterns:
- `level`: Match log level (INFO, WARN, ERROR)
- `status`: Match specific HTTP status code
- `statusRange`: Match status code range [min, max]
- `regex`: Match message content (case-insensitive)

## Dashboard Features

### Overview Section
- Total lines processed
- Error and warning counts
- Error rate percentage
- Processing speed (lines/sec)
- Duration

### Analytics
- HTTP status code distribution
- Top accessed paths
- Most active IP addresses
- HTTP method usage
- Log level breakdown

### Monitoring
- Recent alerts with timestamps
- Recent errors with context
- Live log stream
- Real-time updates via SSE

## Implementation Details

### Log Parser (src/parser.js)

A Transform stream that:
1. Buffers incoming data
2. Splits by newlines
3. Applies regex patterns to identify format
4. Outputs structured objects

```javascript
const parser = new LogParser();
readStream.pipe(parser).on('data', (entry) => {
  // entry is parsed log object
});
```

### Log Analyzer (src/analyzer.js)

EventEmitter that:
1. Receives parsed log entries
2. Maintains statistics
3. Checks alert patterns
4. Emits events for updates

```javascript
const analyzer = new LogAnalyzer({
  alertPatterns: [/* ... */]
});

analyzer.on('alert', (alert) => {
  console.log('Alert:', alert);
});

analyzer.analyzeFile('logs/app.log');
```

### Dashboard Server (src/dashboard.js)

HTTP server that:
1. Serves static files
2. Provides JSON API
3. Streams updates via SSE
4. Broadcasts analyzer events

```javascript
const dashboard = new DashboardServer(analyzer, {
  port: 3000
});

dashboard.start();
```

## Performance

- Processes **100,000+ lines/second** on modern hardware
- Handles multi-GB log files with constant memory usage
- Real-time dashboard updates with minimal overhead
- Efficient backpressure handling in stream pipeline

## Error Handling

- File not found errors
- Invalid file paths
- Stream errors
- Parse errors (unparseable logs still processed)
- HTTP server errors
- Client disconnect handling

## Testing

### Manual Testing

```bash
# Test with sample log
node index.js logs/sample.log

# Test with large generated file
node test/generate-logs.js 100000
node index.js logs/generated.log

# Test with real logs
node index.js /var/log/nginx/access.log
```

### What to Verify

1. **Parsing**: All log formats detected correctly
2. **Statistics**: Counts match expected values
3. **Dashboard**: UI updates in real-time
4. **Alerts**: Patterns trigger correctly
5. **Performance**: Large files process quickly
6. **Memory**: No memory leaks with large files

## Best Practices Demonstrated

1. **Stream Processing**: Efficient handling of large files
2. **Event Architecture**: Decoupled components
3. **Error Handling**: Graceful degradation
4. **Server-Sent Events**: Real-time updates
5. **Security**: Path traversal prevention
6. **Performance**: Backpressure handling
7. **Clean Code**: Modular design
8. **Documentation**: Clear comments

## Common Issues

### Port Already in Use
```bash
# Use different port
PORT=8080 node index.js logs/sample.log
```

### Permission Denied
```bash
# Ensure log file is readable
chmod +r logs/sample.log
```

### Browser Not Connecting
- Check firewall settings
- Ensure server started successfully
- Verify correct URL (http://localhost:3000)

## Extensions

Ideas for enhancement:
- Export reports to CSV/PDF
- Save statistics to database
- Email/Slack alert notifications
- Log file rotation handling
- Multiple file analysis
- Comparison mode
- Custom dashboard widgets
- WebSocket support
- Authentication

## Learning Objectives

This project teaches:
- Transform streams for data processing
- EventEmitter patterns
- HTTP server implementation
- Server-Sent Events (SSE)
- Real-time web dashboards
- Regular expression parsing
- Stream backpressure
- Error handling strategies

## License

MIT - Educational purposes

## Author

Part of the Node.js Core Modules Course
