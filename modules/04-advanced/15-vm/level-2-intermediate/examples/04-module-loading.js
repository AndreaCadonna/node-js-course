/**
 * Example 4: Custom Module Loading in VM Contexts
 *
 * This example demonstrates how to create custom module loading systems
 * for VM contexts, including implementing a custom require() function,
 * module resolution, caching, and circular dependency handling.
 *
 * Topics covered:
 * - Custom require() implementation
 * - Module path resolution
 * - Module caching
 * - Circular dependency handling
 * - Module sandboxing
 */

const vm = require('vm');
const path = require('path');
const fs = require('fs');

// ============================================================================
// 1. Basic Custom require()
// ============================================================================

console.log('=== 1. Basic Custom require() ===\n');

/**
 * Simple custom require implementation
 */
function createBasicRequire(context, allowedModules = []) {
  return function customRequire(moduleName) {
    // Check if module is allowed
    if (!allowedModules.includes(moduleName)) {
      throw new Error(`Module '${moduleName}' is not in the whitelist`);
    }

    // Load the actual module
    try {
      return require(moduleName);
    } catch (err) {
      throw new Error(`Failed to load module '${moduleName}': ${err.message}`);
    }
  };
}

// Demo basic require
const basicCtx = vm.createContext({
  console,
  require: createBasicRequire(null, ['path', 'util'])
});

console.log('Loading allowed module (path):');
vm.runInContext(`
  const path = require('path');
  console.log('path.join("a", "b"):', path.join('a', 'b'));
`, basicCtx);

console.log('\nAttempting to load disallowed module (fs):');
try {
  vm.runInContext(`
    const fs = require('fs');
  `, basicCtx);
} catch (err) {
  console.log('Error:', err.message);
}
console.log();

// ============================================================================
// 2. File-Based Module Loading
// ============================================================================

console.log('=== 2. File-Based Module Loading ===\n');

/**
 * Load modules from files
 */
class FileModuleLoader {
  constructor(basePath) {
    this.basePath = basePath;
    this.cache = new Map();
  }

  /**
   * Create require function for a context
   */
  createRequire(context) {
    return (modulePath) => {
      return this.loadModule(modulePath, context);
    };
  }

  /**
   * Resolve module path
   */
  resolvePath(modulePath) {
    // Handle relative paths
    if (modulePath.startsWith('.')) {
      return path.resolve(this.basePath, modulePath);
    }

    // Handle absolute paths
    if (path.isAbsolute(modulePath)) {
      return modulePath;
    }

    // Handle node_modules (simplified)
    return path.resolve(this.basePath, 'node_modules', modulePath);
  }

  /**
   * Load a module
   */
  loadModule(modulePath, context) {
    const fullPath = this.resolvePath(modulePath);

    // Check cache
    if (this.cache.has(fullPath)) {
      return this.cache.get(fullPath).exports;
    }

    // Create module object
    const module = {
      exports: {},
      id: fullPath,
      loaded: false
    };

    // Cache immediately to handle circular dependencies
    this.cache.set(fullPath, module);

    try {
      // Read module code
      const code = fs.readFileSync(fullPath, 'utf8');

      // Wrap in CommonJS format
      const wrapped = `(function(exports, require, module, __filename, __dirname) {
        ${code}
      })`;

      // Compile and execute
      const script = new vm.Script(wrapped, { filename: fullPath });
      const compiledWrapper = script.runInContext(context);

      // Call the wrapper
      compiledWrapper(
        module.exports,
        this.createRequire(context),
        module,
        fullPath,
        path.dirname(fullPath)
      );

      module.loaded = true;
      return module.exports;
    } catch (err) {
      // Remove from cache on error
      this.cache.delete(fullPath);
      throw new Error(`Failed to load module '${modulePath}': ${err.message}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      modules: Array.from(this.cache.keys())
    };
  }
}

// Create temporary test modules
const tempDir = '/tmp/vm-modules-test';
try {
  fs.mkdirSync(tempDir, { recursive: true });

  // Create a simple math module
  fs.writeFileSync(path.join(tempDir, 'math.js'), `
    exports.add = function(a, b) {
      return a + b;
    };

    exports.multiply = function(a, b) {
      return a * b;
    };
  `);

  // Create a greeting module
  fs.writeFileSync(path.join(tempDir, 'greeting.js'), `
    module.exports = function(name) {
      return 'Hello, ' + name + '!';
    };
  `);

  console.log('Created test modules in', tempDir);

  // Demo file-based loading
  const loader = new FileModuleLoader(tempDir);
  const fileCtx = vm.createContext({ console });

  vm.runInContext(`
    const math = require('./math.js');
    const greet = require('./greeting.js');

    console.log('math.add(2, 3):', math.add(2, 3));
    console.log('math.multiply(4, 5):', math.multiply(4, 5));
    console.log('greet("World"):', greet('World'));
  `, fileCtx);

  console.log('\nCache stats:', loader.getCacheStats());
} catch (err) {
  console.log('Error:', err.message);
}
console.log();

// ============================================================================
// 3. Module Resolution with Extensions
// ============================================================================

console.log('=== 3. Module Resolution with Extensions ===\n');

/**
 * Advanced module loader with extension handling
 */
class AdvancedModuleLoader {
  constructor(basePath, options = {}) {
    this.basePath = basePath;
    this.cache = new Map();
    this.extensions = options.extensions || ['.js', '.json'];
  }

  /**
   * Resolve module with extension handling
   */
  resolve(modulePath) {
    const fullPath = this.resolvePath(modulePath);

    // If path has extension, try it directly
    if (path.extname(fullPath)) {
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
      throw new Error(`Module not found: ${modulePath}`);
    }

    // Try with each extension
    for (const ext of this.extensions) {
      const pathWithExt = fullPath + ext;
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try index files
    for (const ext of this.extensions) {
      const indexPath = path.join(fullPath, 'index' + ext);
      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    throw new Error(`Cannot find module: ${modulePath}`);
  }

  resolvePath(modulePath) {
    if (modulePath.startsWith('.')) {
      return path.resolve(this.basePath, modulePath);
    }
    return path.resolve(this.basePath, modulePath);
  }

  /**
   * Load module with proper extension handling
   */
  load(modulePath, context) {
    const resolved = this.resolve(modulePath);
    const ext = path.extname(resolved);

    // Check cache
    if (this.cache.has(resolved)) {
      return this.cache.get(resolved).exports;
    }

    // Handle different file types
    if (ext === '.json') {
      return this.loadJSON(resolved);
    } else if (ext === '.js') {
      return this.loadJS(resolved, context);
    } else {
      throw new Error(`Unknown extension: ${ext}`);
    }
  }

  loadJSON(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    const exports = JSON.parse(content);

    this.cache.set(filepath, { exports, loaded: true });
    return exports;
  }

  loadJS(filepath, context) {
    const module = { exports: {}, loaded: false };
    this.cache.set(filepath, module);

    const code = fs.readFileSync(filepath, 'utf8');
    const wrapped = `(function(exports, require, module) {
      ${code}
    })`;

    const script = new vm.Script(wrapped, { filename: filepath });
    const fn = script.runInContext(context);

    fn(
      module.exports,
      (mod) => this.load(mod, context),
      module
    );

    module.loaded = true;
    return module.exports;
  }

  createRequire(context) {
    return (modulePath) => this.load(modulePath, context);
  }
}

// Demo advanced loading
try {
  // Create a JSON config file
  fs.writeFileSync(path.join(tempDir, 'config.json'), JSON.stringify({
    name: 'Test App',
    version: '1.0.0',
    port: 3000
  }));

  const advLoader = new AdvancedModuleLoader(tempDir);
  const advCtx = vm.createContext({ console });

  vm.runInContext(`
    const config = require('./config');
    const math = require('./math'); // .js is optional

    console.log('Config:', JSON.stringify(config));
    console.log('Math add:', math.add(10, 20));
  `, advCtx);
} catch (err) {
  console.log('Error:', err.message);
}
console.log();

// ============================================================================
// 4. Circular Dependency Handling
// ============================================================================

console.log('=== 4. Circular Dependency Handling ===\n');

try {
  // Create circular dependencies
  fs.writeFileSync(path.join(tempDir, 'a.js'), `
    console.log('Loading module A');
    const b = require('./b.js');
    exports.name = 'Module A';
    exports.getBName = function() {
      return b.name;
    };
  `);

  fs.writeFileSync(path.join(tempDir, 'b.js'), `
    console.log('Loading module B');
    const a = require('./a.js');
    exports.name = 'Module B';
    exports.getAName = function() {
      return a.name || 'A not ready yet';
    };
  `);

  console.log('Testing circular dependencies...\n');

  const circLoader = new AdvancedModuleLoader(tempDir);
  const circCtx = vm.createContext({ console });

  vm.runInContext(`
    const a = require('./a.js');
    const b = require('./b.js');

    console.log('\\nModule A name:', a.name);
    console.log('Module B name:', b.name);
    console.log('A knows B as:', a.getBName());
    console.log('B knows A as:', b.getAName());
  `, circCtx);
} catch (err) {
  console.log('Error:', err.message);
}
console.log();

// ============================================================================
// 5. Sandboxed Module System
// ============================================================================

console.log('=== 5. Sandboxed Module System ===\n');

/**
 * Complete sandboxed module system
 */
class SandboxedModuleSystem {
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.whitelist = options.whitelist || [];
    this.cache = new Map();
    this.globalContext = options.globalContext || {};
  }

  /**
   * Create a sandboxed context for module
   */
  createContext() {
    return vm.createContext({
      console,
      Buffer,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      ...this.globalContext
    });
  }

  /**
   * Load module in sandbox
   */
  require(modulePath) {
    // Check whitelist
    if (this.whitelist.length > 0 && !this.whitelist.includes(modulePath)) {
      throw new Error(`Module '${modulePath}' is not whitelisted`);
    }

    // Check cache
    if (this.cache.has(modulePath)) {
      return this.cache.get(modulePath).exports;
    }

    const fullPath = path.resolve(this.basePath, modulePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Module not found: ${modulePath}`);
    }

    const module = { exports: {}, loaded: false };
    this.cache.set(modulePath, module);

    const code = fs.readFileSync(fullPath, 'utf8');
    const context = this.createContext();

    const wrapped = `(function(exports, require, module) {
      ${code}
    })`;

    const script = new vm.Script(wrapped, {
      filename: fullPath,
      timeout: 5000
    });

    const fn = script.runInContext(context);

    fn(
      module.exports,
      (mod) => this.require(mod),
      module
    );

    module.loaded = true;
    return module.exports;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Demo sandboxed system
try {
  fs.writeFileSync(path.join(tempDir, 'safe-module.js'), `
    exports.greet = function(name) {
      return 'Hello, ' + name;
    };

    exports.timestamp = function() {
      return new Date().toISOString();
    };
  `);

  const sandbox = new SandboxedModuleSystem({
    basePath: tempDir,
    whitelist: ['safe-module.js', 'math.js']
  });

  console.log('Loading whitelisted module:');
  const safeModule = sandbox.require('safe-module.js');
  console.log(safeModule.greet('Sandbox'));

  console.log('\nAttempting to load non-whitelisted module:');
  try {
    sandbox.require('dangerous-module.js');
  } catch (err) {
    console.log('Error:', err.message);
  }
} catch (err) {
  console.log('Error:', err.message);
}
console.log();

// ============================================================================
// 6. Module System with Hooks
// ============================================================================

console.log('=== 6. Module System with Hooks ===\n');

/**
 * Module system with before/after load hooks
 */
class HookedModuleSystem {
  constructor() {
    this.cache = new Map();
    this.hooks = {
      beforeLoad: [],
      afterLoad: []
    };
  }

  /**
   * Register a hook
   */
  addHook(type, fn) {
    if (this.hooks[type]) {
      this.hooks[type].push(fn);
    }
  }

  /**
   * Run hooks
   */
  runHooks(type, data) {
    for (const hook of this.hooks[type]) {
      hook(data);
    }
  }

  /**
   * Load module with hooks
   */
  require(modulePath, context) {
    // Run beforeLoad hooks
    this.runHooks('beforeLoad', { modulePath });

    const startTime = Date.now();

    // Check cache
    if (this.cache.has(modulePath)) {
      const module = this.cache.get(modulePath);
      this.runHooks('afterLoad', {
        modulePath,
        cached: true,
        duration: 0
      });
      return module.exports;
    }

    // Load module
    const module = { exports: {} };
    this.cache.set(modulePath, module);

    const code = fs.readFileSync(modulePath, 'utf8');
    const wrapped = `(function(exports, module) { ${code} })`;

    const script = new vm.Script(wrapped);
    const fn = script.runInContext(context);
    fn(module.exports, module);

    const duration = Date.now() - startTime;

    // Run afterLoad hooks
    this.runHooks('afterLoad', {
      modulePath,
      cached: false,
      duration
    });

    return module.exports;
  }
}

// Demo hooked system
const hookedSystem = new HookedModuleSystem();

hookedSystem.addHook('beforeLoad', ({ modulePath }) => {
  console.log(`[HOOK] Loading: ${path.basename(modulePath)}`);
});

hookedSystem.addHook('afterLoad', ({ modulePath, cached, duration }) => {
  console.log(`[HOOK] Loaded: ${path.basename(modulePath)} (cached: ${cached}, ${duration}ms)`);
});

const hookCtx = vm.createContext({ console });
const mathPath = path.join(tempDir, 'math.js');

console.log('First load:');
hookedSystem.require(mathPath, hookCtx);

console.log('\nSecond load:');
hookedSystem.require(mathPath, hookCtx);
console.log();

// Cleanup
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('Cleaned up temporary directory');
} catch (err) {
  console.log('Cleanup warning:', err.message);
}

// ============================================================================
// Key Takeaways
// ============================================================================

console.log('\n=== Key Takeaways ===\n');
console.log('1. Custom require() enables controlled module loading');
console.log('2. Module caching prevents duplicate loading and handles circular deps');
console.log('3. Path resolution should handle extensions and index files');
console.log('4. Whitelist modules for security in sandboxed environments');
console.log('5. Hooks enable monitoring and customization of module loading');
console.log('6. CommonJS wrapper format: (function(exports, require, module) { ... })');
console.log();

console.log('Run this example with: node 04-module-loading.js');
