# Real-time File Monitor

A powerful file and directory monitoring system with real-time notifications, advanced filtering, and a beautiful web dashboard. Detect file changes instantly and track your filesystem activity.

## Features

- **Real-time Monitoring**: Instant detection of file changes using `fs.watch`
- **Recursive Watching**: Monitor entire directory trees
- **Advanced Filtering**: Filter by extension, pattern, size, and change type
- **Web Dashboard**: Live updates via Server-Sent Events
- **Change History**: Track and review file change history
- **Statistics**: Detailed metrics on file system activity
- **Debouncing**: Prevent duplicate events from rapid changes
- **Graceful Shutdown**: Proper cleanup on exit
- **Multiple Paths**: Watch multiple directories simultaneously
- **Configurable**: JSON configuration files or command-line args

## Architecture

This project integrates multiple Node.js core modules:

- **fs.watch**: OS-level file system monitoring
- **events**: EventEmitter for change notifications
- **process**: Graceful shutdown on signals
- **http**: Web server for dashboard
- **fs**: File system operations
- **path**: Path manipulation

## Directory Structure

```
06-realtime-file-monitor/
├── src/
│   ├── watcher.js      - Low-level fs.watch wrapper
│   ├── filter.js       - Change filtering logic
│   ├── monitor.js      - High-level monitoring with history
│   └── server.js       - HTTP server with SSE
├── public/
│   ├── index.html      - Dashboard UI
│   ├── styles.css      - Dashboard styles
│   └── app.js          - Client-side JavaScript
├── config/
│   └── example.json    - Example configuration
├── watched/            - Default watched directory
├── test/
│   └── simulate-changes.js - Change simulator for testing
├── index.js            - Main entry point
└── README.md
```

## Installation

No dependencies required! Uses only Node.js core modules.

```bash
cd 06-realtime-file-monitor
```

## Usage

### Basic Usage

Watch current directory:
```bash
node index.js ./watched
```

Watch multiple paths:
```bash
node index.js ./src ./public ./config
```

### Configuration File

Create a JSON config file:
```bash
node index.js --config config/example.json
```

Example configuration:
```json
{
  "port": 3000,
  "paths": ["./watched", "./src"],
  "recursive": true,
  "ignoreHidden": true,
  "ignorePaths": ["node_modules", ".git"],
  "excludeExtensions": [".log", ".tmp"],
  "debounceTime": 100,
  "maxHistory": 1000
}
```

### Custom Port

```bash
PORT=8080 node index.js ./watched
```

### Help

```bash
node index.js --help
```

## Web Dashboard

Once running, open http://localhost:3000 to access the dashboard.

### Dashboard Features

- **Control Panel**: Add/remove watched paths
- **Real-time Feed**: Live stream of file changes
- **Statistics**: Metrics and change type breakdown
- **Filter Settings**: Configure what changes to track
- **History**: Review past changes
- **Pause/Resume**: Pause change notifications

## API Endpoints

### Watch Path
```http
POST /api/watch
Content-Type: application/json

{ "path": "/path/to/watch" }
```

### Unwatch Path
```http
POST /api/unwatch
Content-Type: application/json

{ "path": "/path/to/unwatch" }
```

### Get Watched Paths
```http
GET /api/paths

Returns: ["/path1", "/path2"]
```

### Get Change History
```http
GET /api/history?limit=100

Returns: Array of change events
```

### Get Statistics
```http
GET /api/stats

Returns: {
  totalChanges: 123,
  filteredChanges: 45,
  watchedPaths: 2,
  trackedFiles: 567,
  byType: {
    created: 30,
    modified: 80,
    deleted: 13
  }
}
```

### Update Filter
```http
POST /api/filter
Content-Type: application/json

{
  "ignoreHidden": true,
  "includeExtensions": [".js", ".txt"],
  "excludeExtensions": [".log"],
  "changeTypes": ["created", "modified"]
}
```

### Real-time Events
```http
GET /api/events
Content-Type: text/event-stream

Events:
  - change
  - watching
  - unwatched
  - stats
  - filter-updated
```

### Reset Statistics
```http
POST /api/reset

Returns: { "success": true }
```

## Change Event Structure

```javascript
{
  type: 'modified',           // created, modified, deleted, directory-created
  path: '/full/path/to/file',
  filename: 'file.txt',
  directory: '/full/path/to',
  timestamp: Date,
  stats: {
    size: 1234,
    mtime: Date,
    ctime: Date,
    isDirectory: false
  },
  oldStats: { /* previous stats */ }
}
```

## Filter Options

### Extension Filtering
```javascript
{
  includeExtensions: ['.js', '.ts', '.json'], // Only these extensions
  excludeExtensions: ['.log', '.tmp']         // Exclude these
}
```

### Pattern Filtering
```javascript
{
  includePatterns: ['*.test.js', 'src/**'],   // Glob patterns
  excludePatterns: ['*.min.js', 'dist/**']
}
```

### Size Filtering
```javascript
{
  minSize: 1024,          // Minimum file size in bytes
  maxSize: 10485760       // Maximum file size (10MB)
}
```

### Change Type Filtering
```javascript
{
  changeTypes: ['created', 'modified']  // Only these types
}
```

### Path Filtering
```javascript
{
  ignorePaths: ['node_modules', '.git', 'dist'],  // Ignore these paths
  ignoreHidden: true                              // Ignore hidden files
}
```

## Testing

### Manual Testing

1. **Start Monitor**
   ```bash
   node index.js ./watched
   ```

2. **Open Dashboard**
   http://localhost:3000

3. **Make Changes**
   ```bash
   # In another terminal
   echo "test" > watched/test.txt
   echo "more" >> watched/test.txt
   rm watched/test.txt
   ```

### Automated Testing

Run the change simulator:

```bash
# Single simulation
node test/simulate-changes.js

# Continuous simulation
node test/simulate-changes.js --loop
```

The simulator will:
- Create multiple files
- Modify files
- Create directories
- Delete files and directories
- Generate predictable change patterns

### What to Verify

1. **Detection**: All changes detected immediately
2. **Filtering**: Filters work correctly
3. **Dashboard**: UI updates in real-time
4. **Statistics**: Counts are accurate
5. **History**: Past changes tracked correctly
6. **Performance**: No lag with many changes
7. **Memory**: No memory leaks over time

## Implementation Details

### FileWatcher (src/watcher.js)

Low-level wrapper around `fs.watch`:
- Handles file and directory watching
- Tracks file stats for change detection
- Emits structured change events
- Manages watcher lifecycle

### ChangeFilter (src/filter.js)

Filtering engine:
- Extension matching
- Pattern matching with regex
- Size range checking
- Hidden file detection
- Path ignore lists

### FileMonitor (src/monitor.js)

High-level monitoring:
- Combines watcher and filter
- Debounces rapid changes
- Maintains change history
- Tracks statistics
- Provides query methods

### MonitorServer (src/server.js)

Web interface:
- Serves dashboard
- REST API endpoints
- Server-Sent Events for real-time updates
- Broadcasts changes to all clients

## Performance

- **Efficient**: Uses OS-level file watching (no polling)
- **Scalable**: Handles thousands of files
- **Low overhead**: Minimal CPU and memory usage
- **Debounced**: Prevents event storms
- **Optimized**: Smart filtering reduces processing

## Best Practices Demonstrated

1. **fs.watch Usage**: Proper file system monitoring
2. **Event Architecture**: Decoupled components
3. **Graceful Shutdown**: SIGINT/SIGTERM handling
4. **Resource Management**: Cleanup watchers on exit
5. **Error Handling**: Robust error recovery
6. **Debouncing**: Prevent duplicate events
7. **Server-Sent Events**: Efficient real-time updates
8. **Modular Design**: Clear separation of concerns

## Common Issues

### Too Many File Handles

Watching very large directories may hit OS limits.

**Solution**: Increase file descriptor limit
```bash
ulimit -n 10000
```

### Changes Not Detected

Some editors (vim, emacs) use atomic writes that may not trigger events.

**Solution**: Check editor settings or use debouncing

### Permission Denied

Watching protected directories requires permissions.

**Solution**: Run with appropriate privileges or watch accessible paths

### High CPU Usage

Watching too many files or directories can impact performance.

**Solution**: Use filters to reduce monitored files

## Configuration Examples

### Watch Source Code Only
```json
{
  "paths": ["./src"],
  "includeExtensions": [".js", ".ts", ".jsx", ".tsx"],
  "ignoreHidden": true,
  "ignorePaths": ["node_modules", "dist", "build"]
}
```

### Monitor Log Directory
```json
{
  "paths": ["/var/log/myapp"],
  "includeExtensions": [".log"],
  "changeTypes": ["created", "modified"],
  "maxHistory": 5000
}
```

### Development Mode
```json
{
  "paths": ["./src", "./public", "./config"],
  "recursive": true,
  "ignoreHidden": true,
  "excludeExtensions": [".swp", ".tmp", "~"],
  "debounceTime": 200
}
```

## Graceful Shutdown

The monitor handles shutdown signals properly:

```javascript
// On SIGINT (Ctrl+C) or SIGTERM:
1. Stop accepting new events
2. Close all watchers
3. Stop HTTP server
4. Display final statistics
5. Exit cleanly
```

## Extensions

Ideas for enhancement:
- Email/Slack notifications
- Change persistence to database
- File diff generation
- Backup trigger on changes
- Build system integration
- Git commit automation
- File synchronization
- Change rollback
- Audit logging
- Metrics export (Prometheus)

## Learning Objectives

This project teaches:
- File system watching with `fs.watch`
- Event-driven architecture
- Process signal handling
- Graceful shutdown patterns
- Real-time web updates with SSE
- Debouncing techniques
- Filter pattern implementation
- Resource management

## Production Considerations

Before deploying:

1. **Resource Limits**: Monitor file descriptor usage
2. **Error Handling**: Log all errors
3. **Security**: Validate paths, prevent traversal
4. **Performance**: Limit history size
5. **Monitoring**: Track CPU and memory
6. **Alerts**: Integrate notification systems
7. **Persistence**: Save important changes
8. **Scaling**: Consider distributed monitoring

## Troubleshooting

### Monitor Not Starting
- Check port availability
- Verify paths exist and are readable
- Check configuration file syntax

### Changes Not Appearing
- Verify path is being watched
- Check filter settings
- Review change types configuration
- Check browser console for errors

### Dashboard Not Loading
- Verify server is running
- Check correct URL (http://localhost:3000)
- Check browser developer console
- Verify firewall settings

## License

MIT - Educational purposes

## Author

Part of the Node.js Core Modules Course
