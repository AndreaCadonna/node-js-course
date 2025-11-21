# System Monitor & Alert Service

A production-ready system monitoring and alerting service built using only Node.js core modules. Monitor CPU, memory, disk usage, and receive alerts when thresholds are exceeded.

## Features

### Core Features
- **Real-time Monitoring**: Track CPU, memory, and disk usage
- **Alert System**: Configurable thresholds with webhook notifications
- **Web Dashboard**: Beautiful real-time dashboard with Server-Sent Events
- **Historical Data**: Store and analyze historical metrics
- **Clustered Deployment**: Horizontal scaling with cluster module
- **RESTful API**: Full API for integration with other tools
- **Graceful Shutdown**: Clean shutdown handling

### Technical Highlights
- **Zero Dependencies**: Built entirely with Node.js core modules
- **Event-Driven**: Efficient event-based architecture
- **Persistent**: Auto-save history and alerts to disk
- **Secure**: API key authentication
- **Production-Ready**: Comprehensive error handling and logging

## Quick Start

```bash
# Basic usage
node index.js

# Cluster mode with 4 workers
node index.js --cluster --workers=4

# Custom port
node index.js --port=8080

# With configuration file
node index.js --config=./config/production.json
```

Then open http://localhost:3000 in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     System Monitor                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Monitor    │───►│Alert Manager │───►│   Webhooks   │ │
│  │              │    │              │    │              │ │
│  │ - CPU        │    │ - Thresholds │    │ - HTTP POST  │ │
│  │ - Memory     │    │ - Cooldown   │    │              │ │
│  │ - Disk       │    │ - History    │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                     │                             │
│         │                     │                             │
│         ▼                     ▼                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              HTTP Server (+ Cluster)                  │  │
│  │                                                       │  │
│  │  - RESTful API                                       │  │
│  │  - Server-Sent Events                                │  │
│  │  - Web Dashboard                                     │  │
│  │  - Authentication                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Modules Used

This project demonstrates the use of 8 Node.js core modules:

- **os**: System information (CPU, memory, platform)
- **process**: Process metrics and signals
- **cluster**: Horizontal scaling with multiple processes
- **http/https**: Web server and webhook notifications
- **crypto**: API key generation
- **events**: Event-driven architecture
- **fs**: File operations for persistence
- **path**: Path manipulation

## Installation

No installation required! This project uses only Node.js core modules.

```bash
# Clone or copy the project
cd system-monitor

# Run immediately
node index.js
```

## Usage

### Command-Line Options

```bash
node index.js [options]

Options:
  --cluster           Run in cluster mode
  --workers=N         Number of worker processes (default: CPU count)
  --port=PORT         Server port (default: 3000)
  --interval=MS       Monitoring interval in ms (default: 5000)
  --config=FILE       Load configuration from JSON file
  --help, -h          Show help message
```

### Configuration File

Create a configuration file:

```json
{
  "monitor": {
    "interval": 5000,
    "maxHistorySize": 1000
  },
  "thresholds": {
    "cpu": { "warning": 70, "critical": 90 },
    "memory": { "warning": 80, "critical": 95 },
    "disk": { "warning": 85, "critical": 95 }
  },
  "webhooks": [
    "http://localhost:8080/webhook"
  ],
  "cooldownPeriod": 300000,
  "server": {
    "port": 3000,
    "enableAuth": true,
    "apiKey": "your-api-key-here"
  }
}
```

Then run:

```bash
node index.js --config=./config/production.json
```

## API Reference

### Authentication

All API endpoints (except `/` and `/health`) require authentication:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/metrics
```

The API key is displayed when the server starts.

### Endpoints

#### GET /
Web dashboard (no auth required)

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1700000000000
}
```

#### GET /api/metrics
Get current and historical metrics

**Query Parameters:**
- `limit` - Number of historical entries (default: 100)

**Response:**
```json
{
  "current": {
    "timestamp": 1700000000000,
    "cpu": {
      "usage": 45.2,
      "count": 8,
      "perCore": [42, 48, 44, 46, 45, 43, 47, 45]
    },
    "memory": {
      "total": 17179869184,
      "used": 8589934592,
      "usedPercentage": 50.0
    }
  },
  "history": [...],
  "count": 100
}
```

#### GET /api/stats
Get statistics

**Response:**
```json
{
  "monitoring": {
    "cpu": {
      "average": 45.5,
      "min": 20.0,
      "max": 85.0,
      "current": 45.2
    },
    "memory": {
      "average": 52.3,
      "min": 40.0,
      "max": 75.0,
      "current": 50.0
    }
  },
  "alerts": {
    "total": 15,
    "byMetric": { "cpu": 10, "memory": 5 },
    "bySeverity": { "warning": 12, "critical": 3 }
  }
}
```

#### GET /api/alerts
Get alert history

**Query Parameters:**
- `limit` - Number of alerts (default: 100)

**Response:**
```json
{
  "active": [
    {
      "metric": "cpu",
      "timestamp": 1700000000000,
      "age": 60000
    }
  ],
  "history": [
    {
      "metric": "cpu",
      "severity": "warning",
      "value": 75.5,
      "threshold": 70,
      "message": "CPU usage warning: 75.5% (threshold: 70%)",
      "timestamp": 1700000000000
    }
  ],
  "count": 15
}
```

#### GET /api/events
Server-Sent Events for real-time updates

**Events:**
- `connected` - Connection established
- `metrics` - New metrics data
- `alert` - New alert triggered

**Example:**
```javascript
const eventSource = new EventSource('/api/events');

eventSource.addEventListener('metrics', (e) => {
  const metrics = JSON.parse(e.data);
  console.log('CPU:', metrics.cpu.usage);
});

eventSource.addEventListener('alert', (e) => {
  const alert = JSON.parse(e.data);
  console.log('Alert:', alert.message);
});
```

## Alert System

### Thresholds

Configure alert thresholds in your config file:

```json
{
  "thresholds": {
    "cpu": {
      "warning": 70,
      "critical": 90
    },
    "memory": {
      "warning": 80,
      "critical": 95
    },
    "disk": {
      "warning": 85,
      "critical": 95
    }
  }
}
```

### Alert Levels

- **Warning**: Resource usage exceeds warning threshold
- **Critical**: Resource usage exceeds critical threshold
- **Resolved**: Resource usage returns to normal

### Cooldown Period

Prevents alert spam by enforcing a cooldown period (default: 5 minutes) between alerts for the same metric.

### Webhooks

Receive alerts via HTTP POST:

```json
{
  "webhooks": [
    "https://your-webhook-endpoint.com/alerts",
    "http://localhost:8080/webhook"
  ]
}
```

**Webhook Payload:**
```json
{
  "alert": {
    "metric": "cpu",
    "severity": "critical",
    "value": 92.5,
    "threshold": 90,
    "message": "CPU usage critical: 92.5% (threshold: 90%)",
    "timestamp": 1700000000000
  },
  "timestamp": "2024-11-20T12:00:00.000Z",
  "hostname": "server-01"
}
```

## Cluster Mode

Run multiple worker processes for high availability:

```bash
# Auto-detect CPU count
node index.js --cluster

# Specific number of workers
node index.js --cluster --workers=4
```

**Benefits:**
- High availability (worker crashes don't affect others)
- Better resource utilization
- Load balancing across cores

**How It Works:**
1. Master process forks worker processes
2. Each worker runs the full monitoring stack
3. If a worker crashes, master forks a replacement
4. Graceful shutdown handles all workers cleanly

## Production Deployment

### 1. Using systemd (Linux)

Create `/etc/systemd/system/system-monitor.service`:

```ini
[Unit]
Description=System Monitor Service
After=network.target

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/system-monitor
ExecStart=/usr/bin/node index.js --cluster --config=/etc/system-monitor/config.json
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable system-monitor
sudo systemctl start system-monitor
sudo systemctl status system-monitor
```

### 2. Using PM2

```bash
pm2 start index.js --name system-monitor -- --cluster --workers=4
pm2 save
pm2 startup
```

### 3. Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "index.js", "--cluster"]
```

Build and run:

```bash
docker build -t system-monitor .
docker run -d -p 3000:3000 --name monitor system-monitor
```

### 4. Reverse Proxy (nginx)

```nginx
server {
    listen 80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/events {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }
}
```

## Monitoring Best Practices

### 1. Appropriate Intervals

Choose monitoring intervals based on needs:
- **Development**: 5-10 seconds
- **Production**: 30-60 seconds
- **Low-priority systems**: 5 minutes

### 2. Threshold Configuration

Set thresholds based on your system:
- **CPU Warning**: 70-80%
- **CPU Critical**: 90%+
- **Memory Warning**: 80-85%
- **Memory Critical**: 95%+

### 3. Alert Management

- Enable cooldown periods to prevent spam
- Use webhooks for integration with incident management
- Review alert history regularly
- Adjust thresholds based on normal usage patterns

### 4. Data Retention

Configure history size based on available storage:
- Development: 100-1000 entries
- Production: 10,000+ entries
- Implement log rotation for long-term storage

## Troubleshooting

### High CPU Usage

```bash
# Check if monitoring interval is too aggressive
node index.js --interval=30000  # 30 seconds
```

### Memory Leaks

The monitor automatically trims history to prevent unbounded growth:

```json
{
  "monitor": {
    "maxHistorySize": 1000
  }
}
```

### Permission Errors

Ensure write permissions for logs and alerts directories:

```bash
chmod -R 755 logs alerts
```

### Worker Crashes in Cluster Mode

Check logs for errors:

```bash
# Workers automatically restart, but check for patterns
tail -f logs/history.json
tail -f alerts/history.json
```

## Examples

### 1. Basic Monitoring

```bash
node index.js
```

### 2. Production Deployment

```bash
node index.js \
  --cluster \
  --workers=4 \
  --port=3000 \
  --interval=30000 \
  --config=./config/production.json
```

### 3. Development with Verbose Output

```bash
NODE_ENV=development node index.js --interval=5000
```

### 4. Integration with Slack (via webhook)

```json
{
  "webhooks": [
    "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  ]
}
```

## Performance

### Resource Usage

- **CPU**: < 1% under normal load
- **Memory**: ~50-100MB per worker
- **Disk I/O**: Minimal (periodic saves only)

### Scalability

- Handles 1000+ concurrent SSE connections
- Sub-second response times for API requests
- Graceful degradation under high load

## Security Considerations

1. **API Authentication**: Always enable in production
2. **Webhook HTTPS**: Use HTTPS for webhook endpoints
3. **Input Validation**: All inputs are validated
4. **Path Traversal**: Protected against directory traversal
5. **DoS Protection**: Cooldown periods prevent alert spam

## Learning Outcomes

This project demonstrates:

- **System Monitoring**: Using `os` and `process` modules
- **Clustering**: Horizontal scaling with `cluster` module
- **Event Architecture**: Event-driven design with `events`
- **Real-time Updates**: Server-Sent Events with HTTP
- **API Development**: RESTful API design
- **Production Patterns**: Graceful shutdown, error handling
- **Security**: Authentication and authorization
- **Persistence**: File-based storage

## License

MIT

## Contributing

This is an educational project. Feel free to extend and modify for your learning!

## Support

For issues or questions:
1. Review this README
2. Check the troubleshooting section
3. Review Node.js documentation for the core modules used

---

**Built with ❤️ using only Node.js core modules**
