# Guide 4: User and Directories

Understanding user information and system directories in Node.js.

## Table of Contents
- [User Information](#user-information)
- [System Directories](#system-directories)
- [Cross-Platform Paths](#cross-platform-paths)
- [Best Practices](#best-practices)

---

## User Information

### Getting User Information

The `os.userInfo()` method returns information about the currently logged-in user:

```javascript
const os = require('os');

const userInfo = os.userInfo();
console.log(userInfo);
```

### User Info Object Structure

```javascript
{
  username: 'johndoe',          // Username
  uid: 1000,                    // User ID (Unix only)
  gid: 1000,                    // Group ID (Unix only)
  shell: '/bin/bash',           // Default shell (Unix only)
  homedir: '/home/johndoe'      // Home directory
}
```

### Platform Differences

**Unix/Linux/macOS**:
- Provides `uid` (User ID)
- Provides `gid` (Group ID)
- Provides `shell` (default shell)

**Windows**:
- `uid` and `gid` are `undefined` or `-1`
- `shell` is `undefined` or `null`
- Still provides `username` and `homedir`

```javascript
const os = require('os');

const userInfo = os.userInfo();

if (os.platform() === 'win32') {
  console.log('Windows User:', userInfo.username);
  console.log('UID/GID not available on Windows');
} else {
  console.log('Unix User:', userInfo.username);
  console.log('UID:', userInfo.uid);
  console.log('GID:', userInfo.gid);
  console.log('Shell:', userInfo.shell);
}
```

---

## System Directories

### Home Directory

The home directory is the user's personal directory:

```javascript
const os = require('os');

const homeDir = os.homedir();
console.log('Home Directory:', homeDir);

// Examples:
// Windows: C:\Users\username
// macOS: /Users/username
// Linux: /home/username
```

### Temporary Directory

The temporary directory is for temporary files:

```javascript
const os = require('os');

const tmpDir = os.tmpdir();
console.log('Temp Directory:', tmpDir);

// Examples:
// Windows: C:\Users\username\AppData\Local\Temp
// macOS: /var/folders/...
// Linux: /tmp
```

### Current Working Directory

Get the current working directory using `process.cwd()`:

```javascript
const process = require('process');

const cwd = process.cwd();
console.log('Current Working Directory:', cwd);
```

### Directory Summary

```javascript
const os = require('os');

function getDirectories() {
  return {
    home: os.homedir(),
    temp: os.tmpdir(),
    current: process.cwd(),
    user: os.userInfo().username
  };
}

const dirs = getDirectories();
console.log('Directories:', dirs);
```

---

## Cross-Platform Paths

### Application Data Directories

Different platforms store application data in different locations:

```javascript
const os = require('os');
const path = require('path');

function getAppDataDir(appName) {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\username\AppData\Roaming\appname
      return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), appName);

    case 'darwin':
      // macOS: /Users/username/Library/Application Support/appname
      return path.join(home, 'Library', 'Application Support', appName);

    case 'linux':
      // Linux: /home/username/.config/appname
      return path.join(home, '.config', appName);

    default:
      // Fallback: /home/username/.appname
      return path.join(home, '.' + appName);
  }
}

console.log('Config path:', getAppDataDir('myapp'));
```

### Cache Directories

```javascript
const os = require('os');
const path = require('path');

function getCacheDir(appName) {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\username\AppData\Local\appname\cache
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      return path.join(localAppData, appName, 'cache');

    case 'darwin':
      // macOS: /Users/username/Library/Caches/appname
      return path.join(home, 'Library', 'Caches', appName);

    case 'linux':
      // Linux: /home/username/.cache/appname
      return path.join(home, '.cache', appName);

    default:
      return path.join(home, '.' + appName, 'cache');
  }
}
```

### Log Directories

```javascript
const os = require('os');
const path = require('path');

function getLogDir(appName) {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\username\AppData\Local\appname\logs
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      return path.join(localAppData, appName, 'logs');

    case 'darwin':
      // macOS: /Users/username/Library/Logs/appname
      return path.join(home, 'Library', 'Logs', appName);

    case 'linux':
      // Linux: /home/username/.local/share/appname/logs
      return path.join(home, '.local', 'share', appName, 'logs');

    default:
      return path.join(home, '.' + appName, 'logs');
  }
}
```

### Complete Path Helper

```javascript
const os = require('os');
const path = require('path');

function getAppPaths(appName) {
  const platform = os.platform();
  const home = os.homedir();

  const paths = {
    config: '',
    data: '',
    cache: '',
    logs: '',
    temp: path.join(os.tmpdir(), appName)
  };

  switch (platform) {
    case 'win32':
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

      paths.config = path.join(appData, appName, 'config');
      paths.data = path.join(localAppData, appName, 'data');
      paths.cache = path.join(localAppData, appName, 'cache');
      paths.logs = path.join(localAppData, appName, 'logs');
      break;

    case 'darwin':
      paths.config = path.join(home, 'Library', 'Application Support', appName);
      paths.data = path.join(home, 'Library', 'Application Support', appName, 'data');
      paths.cache = path.join(home, 'Library', 'Caches', appName);
      paths.logs = path.join(home, 'Library', 'Logs', appName);
      break;

    case 'linux':
      paths.config = path.join(home, '.config', appName);
      paths.data = path.join(home, '.local', 'share', appName);
      paths.cache = path.join(home, '.cache', appName);
      paths.logs = path.join(home, '.local', 'share', appName, 'logs');
      break;

    default:
      const baseDir = path.join(home, '.' + appName);
      paths.config = path.join(baseDir, 'config');
      paths.data = path.join(baseDir, 'data');
      paths.cache = path.join(baseDir, 'cache');
      paths.logs = path.join(baseDir, 'logs');
  }

  return paths;
}

// Usage
const appPaths = getAppPaths('myapp');
console.log('Application Paths:');
console.log('Config:', appPaths.config);
console.log('Data:', appPaths.data);
console.log('Cache:', appPaths.cache);
console.log('Logs:', appPaths.logs);
console.log('Temp:', appPaths.temp);
```

---

## Best Practices

### 1. Always Use os.homedir()

Never construct home directory paths manually:

```javascript
// ❌ WRONG - doesn't work cross-platform
const home = '/home/' + os.userInfo().username;

// ❌ WRONG - doesn't work on Windows
const home = process.env.HOME;

// ✅ CORRECT - works everywhere
const home = os.homedir();
```

### 2. Use Path Module for Path Construction

Always use `path.join()` to construct paths:

```javascript
const os = require('os');
const path = require('path');

// ❌ WRONG - hardcoded separators
const configPath = os.homedir() + '/.config/myapp';

// ✅ CORRECT - platform-independent
const configPath = path.join(os.homedir(), '.config', 'myapp');
```

### 3. Handle Missing Environment Variables

Environment variables might not be set:

```javascript
const os = require('os');
const path = require('path');

function getAppDataDir() {
  if (os.platform() === 'win32') {
    // APPDATA might not be set
    const appData = process.env.APPDATA;
    if (!appData) {
      // Fallback to default location
      return path.join(os.homedir(), 'AppData', 'Roaming');
    }
    return appData;
  }
  return os.homedir();
}
```

### 4. Create Directories Before Use

Paths returned by these functions may not exist:

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

const configDir = ensureDir(path.join(os.homedir(), '.config', 'myapp'));
console.log('Config directory ready:', configDir);
```

### 5. Use Temp Directory for Temporary Files

Always use `os.tmpdir()` for temporary files:

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

function createTempFile(prefix = 'temp') {
  const tmpDir = os.tmpdir();
  const filename = `${prefix}-${Date.now()}.tmp`;
  const filepath = path.join(tmpDir, filename);

  return filepath;
}

const tempFile = createTempFile('myapp');
fs.writeFileSync(tempFile, 'temporary data');
console.log('Created temp file:', tempFile);
```

---

## Common Patterns

### 1. Config File Path

```javascript
const os = require('os');
const path = require('path');

function getConfigFilePath(appName) {
  const configDir = getAppDataDir(appName);
  return path.join(configDir, 'config.json');
}

const configPath = getConfigFilePath('myapp');
console.log('Config file:', configPath);
```

### 2. User Data Directory

```javascript
const os = require('os');
const path = require('path');

function getUserDataPath(appName, filename) {
  const dataDir = getAppPaths(appName).data;
  return path.join(dataDir, filename);
}

const dbPath = getUserDataPath('myapp', 'database.db');
console.log('Database:', dbPath);
```

### 3. Session-Specific Temp Directory

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

function getSessionTempDir(appName) {
  const sessionId = Date.now().toString();
  const tempDir = path.join(os.tmpdir(), appName, sessionId);

  fs.mkdirSync(tempDir, { recursive: true });

  return tempDir;
}

const sessionTemp = getSessionTempDir('myapp');
console.log('Session temp:', sessionTemp);
```

---

## Summary

- Use `os.userInfo()` to get current user information
- Use `os.homedir()` to get the user's home directory
- Use `os.tmpdir()` to get the temporary directory
- Handle platform differences in directory structures
- Always use `path.join()` to construct paths
- Create platform-appropriate application directories
- Remember that UID/GID are Unix-only
- Environment variables may not always be set

Understanding user and directory information helps you build applications that store data in the appropriate platform-specific locations, making your application feel native to each operating system.
