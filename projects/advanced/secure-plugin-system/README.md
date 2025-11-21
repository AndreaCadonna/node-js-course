# Secure Plugin System

A production-ready plugin system with sandboxed execution, signature verification, and comprehensive security measures. Built entirely with Node.js core modules.

## Features

- **Sandboxed Execution**: Plugins run in isolated VM contexts
- **Permission System**: Granular control over plugin capabilities
- **Signature Verification**: RSA-based plugin signing and verification
- **Resource Limits**: Memory, timeout, and CPU constraints
- **Error Isolation**: Plugin errors don't crash the system
- **Security Scanning**: Automatic detection of dangerous code patterns
- **Plugin API**: Safe interfaces for file system, network, storage, and events
- **Hot Reloading**: Load, unload, and reload plugins at runtime
- **Dependency Management**: Plugin dependency resolution
- **Event-Driven**: Plugin communication via event bus

## Architecture

```
┌─────────────────────────────────────┐
│      Plugin Manager                 │ (Orchestrator)
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┬─────────┬────────┐
    │             │         │        │
┌───▼───┐  ┌─────▼─────┐  ┌▼──────┐ ┌▼────────┐
│Plugin │  │  Security │  │Plugin │ │Sandbox  │
│Loader │  │   (crypto)│  │  API  │ │  (vm)   │
└───────┘  └───────────┘  └───────┘ └─────────┘
```

## Core Components

### 1. Plugin
Represents a plugin with metadata and state.

**Lifecycle States**:
```
unloaded → loading → loaded → active → disabled
                      ↓
                    error
```

**Features**:
- Manifest validation
- Permission management
- Execution statistics
- Resource limit enforcement

### 2. Sandbox
Isolated execution environment using Node.js VM.

**Security Measures**:
- No access to `require()`
- No `eval()` or `Function()` constructor
- Restricted global objects
- Custom `console` for logging
- Safe timer functions
- Permission-based API access

**Context Isolation**:
- Separate global scope per plugin
- Code generation disabled
- WebAssembly disabled
- Frozen security boundaries

### 3. Plugin Loader
Manages plugin discovery, loading, and lifecycle.

**Responsibilities**:
- Plugin discovery
- Dependency resolution
- Circular dependency detection
- Load/unload/reload operations
- Status tracking

### 4. Plugin API
Safe interfaces for plugins to interact with the system.

**Available APIs** (permission-based):
- **File System**: Sandboxed to plugin directory
- **Network**: HTTP/HTTPS requests with domain filtering
- **Storage**: Key-value store per plugin
- **Events**: Inter-plugin communication
- **Crypto**: Hash generation and random bytes
- **Utils**: Safe utility functions

### 5. Security
Signature verification and security scanning.

**Features**:
- RSA key pair generation
- Plugin signing
- Signature verification
- Code pattern scanning
- Integrity checking
- Security reports

## Installation

```bash
cd secure-plugin-system
npm install  # No dependencies - uses Node.js core modules only!
```

## Quick Start

### Basic Usage

```javascript
const { PluginManager } = require('./src');
const path = require('path');

// Create plugin manager
const pluginManager = new PluginManager({
  pluginsDir: path.join(__dirname, 'plugins'),
  dataDir: path.join(__dirname, 'data'),
  autoActivate: true,
  scanPlugins: true,
  requireSignature: false
});

// Initialize and load plugins
await pluginManager.initialize();
await pluginManager.loadPlugins();

// Execute plugin
const result = await pluginManager.execute('plugin-id', arg1, arg2);
console.log(result);
```

### Creating a Plugin

**1. Create plugin directory**:
```
plugins/
└── my-plugin/
    ├── plugin.json
    └── index.js
```

**2. Define manifest** (`plugin.json`):
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "My awesome plugin",
  "author": "Your Name",
  "main": "index.js",
  "permissions": ["storage", "crypto"],
  "dependencies": [],
  "resourceLimits": {
    "memory": 52428800,
    "timeout": 10000,
    "cpu": 2000
  }
}
```

**3. Implement plugin** (`index.js`):
```javascript
// Optional: Initialize plugin
function init() {
  console.log('Plugin initialized');
}

// Required: Main execution function
async function execute(input) {
  // Access plugin API
  const stored = await __api__.storage.get('data');
  const hash = __api__.crypto.createHash('sha256');
  hash.update(input);

  const result = {
    input,
    hash: hash.digest('hex'),
    timestamp: __api__.utils.timestamp()
  };

  await __api__.storage.set('data', result);
  return result;
}

// Optional: Configuration
async function configure(config) {
  console.log('Plugin configured:', config);
}

// Optional: Cleanup
function destroy() {
  console.log('Plugin destroyed');
}

module.exports = {
  init,
  execute,
  configure,
  destroy
};
```

## Plugin API Reference

### Context Objects

Plugins have access to special context objects:

#### `__plugin__`
```javascript
{
  id: 'plugin-id',
  name: 'Plugin Name',
  version: '1.0.0'
}
```

#### `__api__`
Safe API interfaces (permission-based).

### File System API
**Permission**: `fs`

```javascript
// Read file (sandboxed to plugin directory)
const content = await __api__.fs.readFile('data.txt');

// Write file
await __api__.fs.writeFile('output.txt', 'content');

// Check existence
const exists = await __api__.fs.exists('file.txt');

// List files
const files = await __api__.fs.listFiles('directory');
```

### Network API
**Permission**: `network`

```javascript
// Fetch data
const response = await __api__.network.fetch('https://api.example.com/data', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
});

console.log(response.status); // 200
console.log(response.body);   // Response data
```

### Storage API
**Permission**: `storage`

```javascript
// Get value
const value = await __api__.storage.get('key');

// Set value
await __api__.storage.set('key', { data: 'value' });

// Delete value
await __api__.storage.delete('key');

// List all keys
const keys = await __api__.storage.list();
```

### Events API
**Permission**: `events`

```javascript
// Emit event
__api__.events.emit('my-event', { data: 'value' });

// Listen to event
__api__.events.on('my-event', (data) => {
  console.log('Event received:', data);
});

// Remove listener
__api__.events.off('my-event', handler);
```

### Crypto API
**Always available**

```javascript
// Generate random bytes
const bytes = __api__.crypto.randomBytes(16);

// Create hash
const hash = __api__.crypto.createHash('sha256');
hash.update('data');
const digest = hash.digest('hex');

// Generate UUID
const uuid = __api__.crypto.randomUUID();
```

### Utils API
**Always available**

```javascript
// Sleep
await __api__.utils.sleep(1000); // Max 10 seconds

// Get timestamp
const timestamp = __api__.utils.timestamp();

// Get ISO date
const date = __api__.utils.date();
```

### Standard Globals

Available in plugin sandbox:
- `console` (safe version)
- `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`
- `Promise`, `Error`, `TypeError`, `RangeError`
- `JSON`, `Math`, `Date`
- `Array`, `Object`, `String`, `Number`, `Boolean`, `RegExp`
- `Map`, `Set`, `WeakMap`, `WeakSet`
- `Buffer` (limited API)

## Security

### Permission System

Plugins must declare required permissions in `plugin.json`:

```json
{
  "permissions": ["fs", "network", "storage", "events"]
}
```

**Available Permissions**:
- `fs` - File system access (sandboxed)
- `network` - Network requests
- `storage` - Key-value storage
- `events` - Event bus access
- `*` - All permissions (use cautiously)

### Resource Limits

Protect against resource exhaustion:

```json
{
  "resourceLimits": {
    "memory": 52428800,  // 50MB
    "timeout": 10000,    // 10 seconds
    "cpu": 2000          // 2 seconds CPU time
  }
}
```

### Plugin Signing

Generate and verify plugin signatures:

**1. Generate keys**:
```bash
node examples/sign-plugin.js --generate-keys
```

**2. Sign plugin**:
```bash
node examples/sign-plugin.js --sign my-plugin
```

**3. Verify signature**:
```bash
node examples/sign-plugin.js --verify my-plugin
```

**4. Enable signature verification**:
```javascript
const pluginManager = new PluginManager({
  pluginsDir: './plugins',
  publicKeyPath: './keys/public.pem',
  requireSignature: true
});
```

### Security Scanning

Automatic detection of dangerous patterns:

**High Severity**:
- `eval()` usage
- `Function()` constructor
- Direct module requires (fs, child_process, etc.)
- Process manipulation
- File system exposure

**Medium Severity**:
- Global object modification
- Prototype pollution
- Suspicious patterns

Plugins failing security scans are automatically disabled.

### Best Practices

1. **Minimal Permissions**: Request only needed permissions
2. **Validate Input**: Sanitize all user input
3. **Error Handling**: Always catch and handle errors
4. **Resource Awareness**: Stay within resource limits
5. **Secure Dependencies**: Carefully vet plugin dependencies

## Running Examples

### Complete Example

Demonstrates all features:

```bash
cd examples
node complete-example.js
```

Output includes:
- Plugin loading and activation
- Permission-based execution
- Configuration
- Statistics and monitoring
- Security reports
- Hot reloading

### Sign Plugins

```bash
# Generate keys
node examples/sign-plugin.js --generate-keys

# Sign a plugin
node examples/sign-plugin.js --sign hello-world

# Verify signature
node examples/sign-plugin.js --verify hello-world
```

## Example Plugins

Three example plugins are included:

### 1. Hello World (`hello-world`)
Basic plugin demonstrating:
- Plugin structure
- Init/execute/destroy lifecycle
- Basic API usage
- No special permissions

### 2. Text Processor (`text-processor`)
Demonstrates:
- Storage API for configuration
- Crypto API for hashing
- Configuration support
- Text processing operations

**Permissions**: `storage`, `crypto`

### 3. Data Fetcher (`data-fetcher`)
Demonstrates:
- Network API for HTTP requests
- File system API for saving data
- Storage API for statistics
- Error handling

**Permissions**: `fs`, `network`, `storage`

## Testing

Run the test suite:

```bash
cd tests
node plugin.test.js
```

## Configuration

### Plugin Manager Options

```javascript
{
  pluginsDir: './plugins',           // Plugin directory
  dataDir: './data',                 // Data directory
  autoActivate: true,                // Auto-activate loaded plugins
  scanPlugins: true,                 // Enable security scanning
  requireSignature: false,           // Require plugin signatures
  publicKeyPath: './keys/public.pem', // Public key for verification
  privateKeyPath: './keys/private.pem', // Private key for signing
  allowedDomains: [],                // Allowed network domains
  blockedDomains: [],                // Blocked network domains
  maxRequestSize: 10485760,          // 10MB max request size
  requestTimeout: 30000              // 30s request timeout
}
```

## Advanced Usage

### Hot Reloading

```javascript
// Reload plugin from disk
await pluginManager.reload('plugin-id');

// Plugin is reloaded with latest code
const result = await pluginManager.execute('plugin-id', args);
```

### Plugin Configuration

```javascript
// Configure plugin
await pluginManager.configure('plugin-id', {
  option1: 'value1',
  option2: 'value2'
});
```

### Event Monitoring

```javascript
pluginManager.on('plugin:loaded', (plugin) => {
  console.log(`Loaded: ${plugin.name}`);
});

pluginManager.on('plugin:error', ({ plugin, error }) => {
  console.error(`Error in ${plugin.id}:`, error);
});

pluginManager.on('plugin:execution', ({ pluginId, executionTime }) => {
  console.log(`${pluginId} executed in ${executionTime}ms`);
});

pluginManager.on('security:scan-failed', ({ plugin, issues }) => {
  console.warn(`Security issues in ${plugin.id}:`, issues);
});
```

### Security Reports

```javascript
const report = await pluginManager.createSecurityReport('plugin-id');

console.log('Security Report:');
console.log('  Overall:', report.passed ? 'PASSED' : 'FAILED');
console.log('  Code Scan:', report.checks.codeScan.passed);
console.log('  Permissions:', report.checks.permissions.passed);
console.log('  Integrity:', report.checks.integrity.passed);

if (!report.passed) {
  console.log('  Issues:', report.checks.codeScan.issues);
}
```

### Statistics

```javascript
const stats = pluginManager.getStats();

console.log('Total Plugins:', stats.plugins.total);
console.log('Active:', stats.plugins.byStatus.active);
console.log('Disabled:', stats.plugins.byStatus.disabled);

stats.plugins.plugins.forEach(plugin => {
  console.log(`${plugin.name}:`);
  console.log(`  Executions: ${plugin.executions}`);
  console.log(`  Avg Time: ${plugin.avgExecutionTime}ms`);
  console.log(`  Error Rate: ${(plugin.errorRate * 100).toFixed(2)}%`);
});
```

### Resource Monitoring

```javascript
const pluginInfo = pluginManager.getPluginInfo('plugin-id');

console.log('Resource Usage:');
console.log('  Memory:', pluginInfo.resourceUsage.memoryUsage);
console.log('  Memory Limit:', pluginInfo.resourceUsage.memoryLimit);
console.log('  CPU Time:', pluginInfo.resourceUsage.cpuTime);
console.log('  Memory %:', pluginInfo.resourceUsage.memoryPercent);
console.log('  CPU %:', pluginInfo.resourceUsage.cpuPercent);
```

## Production Deployment

### Security Checklist

- [ ] Enable signature verification (`requireSignature: true`)
- [ ] Enable security scanning (`scanPlugins: true`)
- [ ] Set appropriate resource limits
- [ ] Configure network domain restrictions
- [ ] Use minimal permissions for plugins
- [ ] Regular security audits
- [ ] Monitor plugin execution statistics
- [ ] Keep keys secure (never commit private keys)

### Performance

- **Plugin Loading**: O(n) where n = number of plugins
- **Execution Overhead**: ~1-2ms per plugin call
- **Memory**: ~2-5MB per plugin + resource usage
- **Sandbox Creation**: ~10-20ms per plugin

### Best Practices

1. **Lazy Loading**: Load plugins on-demand
2. **Permission Auditing**: Regular permission reviews
3. **Resource Monitoring**: Track resource usage
4. **Error Logging**: Comprehensive error tracking
5. **Version Management**: Use semantic versioning
6. **Documentation**: Document plugin APIs
7. **Testing**: Test plugins in isolation

## Troubleshooting

### Plugin Won't Load

**Check**:
- Manifest is valid JSON
- Required fields present (id, name, version, main)
- Main file exists
- Syntax errors in plugin code

### Permission Denied

**Solution**:
- Add required permission to `plugin.json`
- Verify permission name is correct
- Check plugin is activated

### Resource Limit Exceeded

**Solution**:
- Increase limits in `plugin.json`
- Optimize plugin code
- Check for memory leaks
- Reduce timeout for operations

### Signature Verification Failed

**Check**:
- Plugin hasn't been modified
- Correct public key being used
- Signature file exists
- Re-sign if needed

## Module Usage

This project demonstrates advanced usage of:

- **vm**: Sandboxed code execution
- **crypto**: Signing, verification, hashing
- **fs**: Plugin loading and storage
- **events**: Inter-plugin communication
- **http/https**: Network requests

## License

MIT

## Contributing

Contributions welcome! This is an educational project demonstrating Node.js core modules.

## Learning Objectives

After completing this project, you should understand:

1. VM-based sandboxing and isolation
2. Permission-based security systems
3. RSA signature generation and verification
4. Code pattern security scanning
5. Resource limit enforcement
6. Plugin architecture patterns
7. Event-driven plugin communication
8. Safe API design for untrusted code

## Next Steps

Extend this project by adding:

1. **Plugin Marketplace**: Discovery and installation
2. **Version Management**: Multiple plugin versions
3. **Hooks System**: Lifecycle hooks for extensibility
4. **Plugin Testing**: Automated plugin tests
5. **Performance Profiling**: Detailed performance metrics
6. **Plugin Communication**: RPC between plugins
7. **Sandbox Policies**: CSP-like security policies
8. **Plugin Dependencies**: NPM-like dependency management

## Resources

- [Node.js VM Documentation](https://nodejs.org/api/vm.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Plugin Architecture Patterns](https://martinfowler.com/articles/plugins.html)
- [Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
