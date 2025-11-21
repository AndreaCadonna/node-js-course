# Content Management System (CMS)

**Final Capstone Project** - A full-featured CMS using all 16 Node.js core modules.

## Features

### 1. Content Management
- Create, read, update, delete posts
- File-based storage (JSON/Markdown)
- Media uploads with processing
- Draft and publish workflow

### 2. User System
- Registration and login
- Password hashing (crypto)
- Session management
- Role-based access (admin, editor, viewer)

### 3. API Server
- RESTful API
- Authentication middleware
- Rate limiting
- CORS support

### 4. Template Engine
- Custom template syntax
- Safe execution (vm)
- Template caching

### 5. Media Processing
- Image upload and storage
- Resize with worker threads
- Stream large files
- File validation

### 6. Performance
- Clustered deployment
- File caching
- Gzip compression
- Asset optimization

### 7. Monitoring
- System metrics
- Error logging
- Performance tracking
- Health checks

## Quick Start

```bash
node src/server.js
# Open http://localhost:3000
```

## Modules Used (All 16!)

- **fs**: Content storage
- **path**: Path operations
- **buffer**: Binary data
- **events**: Real-time updates
- **stream**: Large file handling
- **process**: Lifecycle management
- **http**: Web server and API
- **os**: System information
- **url/querystring**: Request parsing
- **util**: Utilities
- **child_process**: External tools
- **cluster**: Horizontal scaling
- **worker_threads**: Image processing
- **vm**: Template rendering
- **crypto**: Authentication

## Project Structure

```
cms/
├── src/
│   ├── server.js           - Main HTTP server
│   ├── auth/               - Authentication
│   ├── content/            - Content management
│   ├── media/              - Media handling
│   ├── templates/          - Template engine
│   ├── workers/            - Worker threads
│   └── utils/              - Utilities
├── storage/
│   ├── content/            - Content files
│   ├── media/              - Uploaded files
│   └── users/              - User data
├── templates/              - HTML templates
└── tests/                  - Test files
```

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `POST /api/media/upload` - Upload media
- `GET /api/health` - Health check

## Learning Outcomes

This capstone demonstrates:
- Full-stack development with Node.js core
- Security best practices
- Performance optimization
- Production deployment patterns
- Integration of all 16 modules

**The ultimate Node.js core modules showcase!**
