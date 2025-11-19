# Guide 1: Platform and Architecture

Understanding platform detection and CPU architecture in Node.js.

## Table of Contents
- [What is a Platform?](#what-is-a-platform)
- [Platform Identifiers](#platform-identifiers)
- [CPU Architecture](#cpu-architecture)
- [Practical Applications](#practical-applications)
- [Best Practices](#best-practices)

---

## What is a Platform?

A **platform** refers to the operating system on which your Node.js application is running. Different operating systems have different behaviors, file systems, and system calls.

### Why It Matters

- **Cross-platform compatibility**: Write code that works on Windows, macOS, and Linux
- **Platform-specific features**: Use OS-specific APIs when needed
- **Path handling**: Different path separators (`/` vs `\`)
- **Line endings**: Different text file formats (CRLF vs LF)
- **System commands**: Different shell commands and tools

---

## Platform Identifiers

### Getting Platform Information

```javascript
const os = require('os');

const platform = os.platform();
console.log('Platform:', platform);
```

### Platform Values

| Platform Value | Operating System | Description |
|---------------|------------------|-------------|
| `'win32'` | Windows | All Windows versions (including 64-bit) |
| `'darwin'` | macOS | macOS and OS X |
| `'linux'` | Linux | All Linux distributions |
| `'freebsd'` | FreeBSD | FreeBSD Unix |
| `'openbsd'` | OpenBSD | OpenBSD Unix |
| `'sunos'` | SunOS | Solaris and illumos |
| `'aix'` | AIX | IBM AIX |

### Common Pitfall

**Important**: Windows always returns `'win32'`, even on 64-bit systems!

```javascript
// ❌ WRONG
if (os.platform() === 'win64') {
  // This will NEVER match!
}

// ✅ CORRECT
if (os.platform() === 'win32') {
  // This matches all Windows systems
}
```

### Platform Detection Patterns

```javascript
const os = require('os');

function detectPlatform() {
  const platform = os.platform();

  return {
    isWindows: platform === 'win32',
    isMac: platform === 'darwin',
    isLinux: platform === 'linux',
    isUnix: platform !== 'win32', // Unix-like systems
    platform: platform
  };
}

const env = detectPlatform();
if (env.isWindows) {
  console.log('Running on Windows');
} else if (env.isMac) {
  console.log('Running on macOS');
} else if (env.isLinux) {
  console.log('Running on Linux');
}
```

---

## CPU Architecture

### What is Architecture?

CPU architecture refers to the design and instruction set of the processor. Different architectures have different capabilities and instruction sets.

### Getting Architecture Information

```javascript
const os = require('os');

const arch = os.arch();
console.log('Architecture:', arch);
```

### Architecture Values

| Architecture | Description | Common In |
|-------------|-------------|-----------|
| `'x64'` | 64-bit Intel/AMD | Most modern PCs, servers |
| `'arm64'` | 64-bit ARM | Apple M1/M2, newer Raspberry Pi |
| `'arm'` | 32-bit ARM | Older Raspberry Pi, embedded |
| `'ia32'` | 32-bit Intel/AMD | Legacy systems |
| `'mips'` | MIPS processors | Some embedded systems |
| `'ppc'` | PowerPC | Older Macs, some servers |
| `'s390'` | IBM System/390 | Mainframes |

### Architecture Detection

```javascript
const os = require('os');

function getArchitectureInfo() {
  const arch = os.arch();

  return {
    architecture: arch,
    is64Bit: ['x64', 'arm64', 'ppc64', 's390x'].includes(arch),
    is32Bit: ['arm', 'ia32', 'mips', 'ppc'].includes(arch),
    isARM: arch.startsWith('arm'),
    isIntel: arch === 'x64' || arch === 'ia32'
  };
}

const archInfo = getArchitectureInfo();
console.log('64-bit system:', archInfo.is64Bit);
console.log('ARM processor:', archInfo.isARM);
```

---

## Practical Applications

### 1. Cross-Platform Path Handling

```javascript
const os = require('os');
const path = require('path');

function getConfigPath(appName) {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\username\AppData\Roaming\appname
      return path.join(process.env.APPDATA, appName);

    case 'darwin':
      // macOS: /Users/username/Library/Application Support/appname
      return path.join(home, 'Library', 'Application Support', appName);

    case 'linux':
      // Linux: /home/username/.config/appname
      return path.join(home, '.config', appName);

    default:
      // Fallback
      return path.join(home, '.' + appName);
  }
}
```

### 2. Platform-Specific Commands

```javascript
const os = require('os');
const { exec } = require('child_process');

function openFile(filePath) {
  const platform = os.platform();

  let command;
  switch (platform) {
    case 'win32':
      command = `start "" "${filePath}"`;
      break;
    case 'darwin':
      command = `open "${filePath}"`;
      break;
    case 'linux':
      command = `xdg-open "${filePath}"`;
      break;
    default:
      throw new Error('Unsupported platform');
  }

  exec(command);
}
```

### 3. Architecture-Specific Optimizations

```javascript
const os = require('os');

function getOptimalBufferSize() {
  const arch = os.arch();

  // 64-bit systems can handle larger buffers
  if (arch === 'x64' || arch === 'arm64') {
    return 64 * 1024; // 64KB
  } else {
    return 16 * 1024; // 16KB
  }
}
```

### 4. Platform Feature Detection

```javascript
const os = require('os');

function checkPlatformFeatures() {
  const platform = os.platform();

  return {
    supportsSymlinks: platform !== 'win32' || process.version >= 'v10.0.0',
    caseSensitiveFS: platform !== 'win32' && platform !== 'darwin',
    hasShell: platform !== 'win32',
    pathSeparator: platform === 'win32' ? '\\' : '/',
    lineEnding: platform === 'win32' ? '\r\n' : '\n'
  };
}
```

---

## Best Practices

### 1. Always Use os.platform()

Never try to detect platform through environment variables or other means:

```javascript
// ❌ WRONG
const isWindows = process.env.OS === 'Windows_NT';

// ✅ CORRECT
const isWindows = os.platform() === 'win32';
```

### 2. Use Path Module for Paths

Don't hardcode path separators:

```javascript
// ❌ WRONG
const filePath = 'folder/subfolder/file.txt'; // Only works on Unix

// ✅ CORRECT
const filePath = path.join('folder', 'subfolder', 'file.txt');
```

### 3. Handle All Major Platforms

Always include fallback for unknown platforms:

```javascript
function getPlatformName() {
  switch (os.platform()) {
    case 'win32': return 'Windows';
    case 'darwin': return 'macOS';
    case 'linux': return 'Linux';
    default: return 'Unknown';
  }
}
```

### 4. Cache Static Information

Platform and architecture don't change during execution:

```javascript
// Cache at module load
const IS_WINDOWS = os.platform() === 'win32';
const IS_64_BIT = os.arch() === 'x64';

// Use cached values
if (IS_WINDOWS) {
  // Windows-specific code
}
```

---

## Common Use Cases

### 1. Conditional Imports

```javascript
const os = require('os');

let platformModule;
if (os.platform() === 'win32') {
  platformModule = require('./windows-specific');
} else {
  platformModule = require('./unix-specific');
}
```

### 2. Platform-Specific Configurations

```javascript
const os = require('os');

const config = {
  maxConnections: os.platform() === 'win32' ? 1000 : 10000,
  useNativeModules: os.arch() === 'x64',
  enableFeatureX: os.platform() === 'linux'
};
```

### 3. System Compatibility Checks

```javascript
function checkCompatibility() {
  const platform = os.platform();
  const arch = os.arch();

  if (platform === 'win32' && arch === 'ia32') {
    console.warn('32-bit Windows support is deprecated');
  }

  if (!['win32', 'darwin', 'linux'].includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

---

## Summary

- Use `os.platform()` to detect the operating system
- Use `os.arch()` to detect CPU architecture
- Windows is always `'win32'`, even on 64-bit systems
- Handle cross-platform differences gracefully
- Cache platform information for better performance
- Always provide fallbacks for unknown platforms

Understanding platform and architecture is fundamental to writing portable Node.js applications that work correctly across different operating systems and hardware configurations.
