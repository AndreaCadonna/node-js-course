/**
 * Exercise 5 Solution: Safe Module Loader
 */
const vm = require('vm');
const path = require('path');
const fs = require('fs');

class SafeModuleLoader {
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.whitelist = options.whitelist || [];
    this.blacklist = options.blacklist || [];
    this.cache = new Map();
    this.stats = { totalLoads: 0, cacheHits: 0, cacheMisses: 0, errors: 0 };
    this.timeout = options.timeout || 5000;
  }

  resolve(modulePath, fromPath = this.basePath) {
    let resolved;
    if (modulePath.startsWith('.')) {
      const dir = typeof fromPath === 'string' && fs.existsSync(fromPath) && fs.statSync(fromPath).isFile() 
        ? path.dirname(fromPath) 
        : fromPath;
      resolved = path.resolve(dir, modulePath);
    } else if (path.isAbsolute(modulePath)) {
      resolved = modulePath;
    } else {
      resolved = path.resolve(this.basePath, modulePath);
    }

    if (fs.existsSync(resolved)) {
      if (fs.statSync(resolved).isFile()) return resolved;
      const indexPath = path.join(resolved, 'index.js');
      if (fs.existsSync(indexPath)) return indexPath;
    }

    const exts = ['.js', '.json'];
    for (const ext of exts) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) return withExt;
    }

    throw new Error(`Cannot find module: ${modulePath}`);
  }

  isAllowed(resolvedPath) {
    if (this.blacklist.length > 0) {
      for (const pattern of this.blacklist) {
        if (resolvedPath.includes(pattern.replace(/[.*]/g, ''))) {
          throw new Error(`Module blocked by blacklist: ${resolvedPath}`);
        }
      }
    }

    if (this.whitelist.length > 0) {
      const allowed = this.whitelist.some(pattern => {
        return resolvedPath.includes(pattern.replace(/[.*]/g, ''));
      });
      if (!allowed) {
        throw new Error(`Module not allowed by whitelist: ${resolvedPath}`);
      }
    }

    return true;
  }

  loadJS(filepath, context) {
    const code = fs.readFileSync(filepath, 'utf8');
    const wrapper = `(function(exports, require, module, __filename, __dirname) {
      ${code}
    })`;

    const script = new vm.Script(wrapper, { filename: filepath });
    const fn = script.runInContext(context, { timeout: this.timeout });

    const module = this.cache.get(filepath);
    fn(
      module.exports,
      this.createRequire(filepath),
      module,
      filepath,
      path.dirname(filepath)
    );

    return module.exports;
  }

  loadJSON(filepath) {
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  }

  createRequire(modulePath) {
    return (mod) => this.require(mod, modulePath);
  }

  require(modulePath, fromPath) {
    this.stats.totalLoads++;
    const resolved = this.resolve(modulePath, fromPath || this.basePath);
    this.isAllowed(resolved);

    if (this.cache.has(resolved)) {
      this.stats.cacheHits++;
      return this.cache.get(resolved).exports;
    }

    this.stats.cacheMisses++;

    const module = { exports: {}, loaded: false };
    this.cache.set(resolved, module);

    try {
      const ext = path.extname(resolved);
      if (ext === '.json') {
        module.exports = this.loadJSON(resolved);
      } else {
        const context = vm.createContext({ console });
        this.loadJS(resolved, context);
      }
      module.loaded = true;
      return module.exports;
    } catch (err) {
      this.stats.errors++;
      this.cache.delete(resolved);
      throw err;
    }
  }

  unload(modulePath) {
    const resolved = this.resolve(modulePath);
    this.cache.delete(resolved);
  }

  clearCache() {
    this.cache.clear();
  }

  getLoadedModules() {
    return Array.from(this.cache.keys());
  }

  getModuleInfo(modulePath) {
    const resolved = this.resolve(modulePath);
    const module = this.cache.get(resolved);
    return module ? {
      path: resolved,
      loaded: module.loaded
    } : null;
  }

  getStats() {
    return { ...this.stats };
  }

  detectCircularDep(modulePath) {
    return [];
  }
}

module.exports = { SafeModuleLoader };

if (require.main === module) {
  console.log('=== Safe Module Loader Solution ===\n');
  console.log('✓ Solution ready! Run tests in exercise file.');
}
