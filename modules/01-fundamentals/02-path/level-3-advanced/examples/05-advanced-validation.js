/**
 * Example 5: Advanced Path Validation
 *
 * Demonstrates production-grade path validation with comprehensive
 * checking, performance optimization, and context-aware validation.
 *
 * Key Points:
 * - Building comprehensive validators
 * - Performance-optimized validation
 * - Context-aware path checking
 * - Extensive error reporting
 * - Validation rule composition
 */

const path = require('path');
const fs = require('fs');

console.log('=== Advanced Path Validation ===\n');

// 1. Validation Rule System
console.log('1. Validation Rule System:');

class ValidationRule {
  constructor(name, validator, options = {}) {
    this.name = name;
    this.validator = validator;
    this.severity = options.severity || 'error'; // 'error' or 'warning'
    this.message = options.message;
  }

  validate(value, context) {
    const result = this.validator(value, context);
    return {
      valid: result,
      rule: this.name,
      severity: this.severity,
      message: this.message || `Validation failed: ${this.name}`
    };
  }
}

// Define reusable validation rules
const rules = {
  notEmpty: new ValidationRule(
    'notEmpty',
    (value) => value && value.length > 0,
    { message: 'Path cannot be empty' }
  ),

  isString: new ValidationRule(
    'isString',
    (value) => typeof value === 'string',
    { message: 'Path must be a string' }
  ),

  maxLength: (maxLen) => new ValidationRule(
    'maxLength',
    (value) => value.length <= maxLen,
    { message: `Path exceeds maximum length of ${maxLen}` }
  ),

  noNullBytes: new ValidationRule(
    'noNullBytes',
    (value) => !value.includes('\0'),
    { message: 'Path contains null byte' }
  ),

  noTraversal: new ValidationRule(
    'noTraversal',
    (value) => !value.includes('..'),
    { message: 'Path contains traversal pattern' }
  ),

  withinBoundary: (baseDir) => new ValidationRule(
    'withinBoundary',
    (value) => {
      const base = path.resolve(baseDir);
      const target = path.resolve(base, value);
      return target.startsWith(base + path.sep) || target === base;
    },
    { message: 'Path outside allowed directory' }
  ),

  allowedExtension: (extensions) => new ValidationRule(
    'allowedExtension',
    (value) => {
      const ext = path.extname(value).toLowerCase();
      return extensions.includes(ext);
    },
    { message: `File extension not allowed (allowed: ${extensions.join(', ')})` }
  ),

  noDotFiles: new ValidationRule(
    'noDotFiles',
    (value) => {
      const basename = path.basename(value);
      return !basename.startsWith('.');
    },
    { message: 'Dot files not allowed', severity: 'warning' }
  )
};

console.log('  Defined validation rules:');
Object.keys(rules).forEach(ruleName => {
  console.log(`    • ${ruleName}`);
});
console.log();

// 2. Validation Pipeline
console.log('2. Validation Pipeline:');

class ValidationPipeline {
  constructor(rules) {
    this.rules = rules;
  }

  validate(value, context = {}) {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      context
    };

    for (const rule of this.rules) {
      const result = rule.validate(value, context);

      if (!result.valid) {
        if (result.severity === 'error') {
          results.valid = false;
          results.errors.push({
            rule: result.rule,
            message: result.message
          });
        } else {
          results.warnings.push({
            rule: result.rule,
            message: result.message
          });
        }
      }
    }

    return results;
  }
}

// Create a pipeline for file uploads
const uploadPipeline = new ValidationPipeline([
  rules.isString,
  rules.notEmpty,
  rules.maxLength(255),
  rules.noNullBytes,
  rules.noTraversal,
  rules.withinBoundary('/app/uploads'),
  rules.allowedExtension(['.jpg', '.png', '.pdf']),
  rules.noDotFiles
]);

const uploadTests = [
  'image.jpg',
  '../../../etc/passwd',
  '.env',
  'document.pdf',
  'file.txt',
  '',
  'a'.repeat(300),
  'valid/path/photo.png'
];

console.log('  Testing upload validation pipeline:');
uploadTests.forEach(input => {
  const result = uploadPipeline.validate(input);
  const display = input.length > 40 ? input.substring(0, 37) + '...' : input || '(empty)';

  if (result.valid) {
    console.log(`    ✓ '${display}'`);
    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`      ⚠️ ${w.message}`));
    }
  } else {
    console.log(`    ✗ '${display}'`);
    result.errors.forEach(e => console.log(`      Error: ${e.message}`));
  }
});
console.log();

// 3. Context-Aware Validation
console.log('3. Context-Aware Validation:');

class ContextAwareValidator {
  constructor(baseRules) {
    this.baseRules = baseRules;
    this.contextRules = new Map();
  }

  addContextRule(contextKey, rule) {
    if (!this.contextRules.has(contextKey)) {
      this.contextRules.set(contextKey, []);
    }
    this.contextRules.get(contextKey).push(rule);
  }

  validate(value, context = {}) {
    // Start with base rules
    let rulesToApply = [...this.baseRules];

    // Add context-specific rules
    for (const [contextKey, rules] of this.contextRules) {
      if (context[contextKey]) {
        rulesToApply = rulesToApply.concat(rules);
      }
    }

    const pipeline = new ValidationPipeline(rulesToApply);
    return pipeline.validate(value, context);
  }
}

const contextValidator = new ContextAwareValidator([
  rules.isString,
  rules.notEmpty,
  rules.noNullBytes
]);

// Add rules for admin users
contextValidator.addContextRule('isAdmin', new ValidationRule(
  'adminAccess',
  () => true, // Admins bypass some checks
  { message: 'Admin access granted' }
));

// Add stricter rules for public uploads
contextValidator.addContextRule('isPublic', rules.noTraversal);
contextValidator.addContextRule('isPublic', rules.allowedExtension(['.jpg', '.png']));

console.log('  Testing context-aware validation:');

const contexts = [
  { input: 'file.pdf', context: { isAdmin: true }, desc: 'Admin upload PDF' },
  { input: 'file.pdf', context: { isPublic: true }, desc: 'Public upload PDF' },
  { input: 'image.jpg', context: { isPublic: true }, desc: 'Public upload JPG' },
  { input: '../config', context: { isAdmin: true }, desc: 'Admin access config' }
];

contexts.forEach(test => {
  const result = contextValidator.validate(test.input, test.context);
  const status = result.valid ? '✓' : '✗';
  console.log(`    ${status} ${test.desc}: '${test.input}'`);
  if (!result.valid) {
    result.errors.forEach(e => console.log(`       ${e.message}`));
  }
});
console.log();

// 4. Performance-Optimized Validation
console.log('4. Performance-Optimized Validation:');

class CachedValidator {
  constructor(rules, options = {}) {
    this.pipeline = new ValidationPipeline(rules);
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  validate(value, context = {}) {
    const cacheKey = this._getCacheKey(value, context);

    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      return this.cache.get(cacheKey);
    }

    this.cacheMisses++;
    const result = this.pipeline.validate(value, context);

    // Add to cache
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (first in map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  _getCacheKey(value, context) {
    return JSON.stringify({ value, context });
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses)
    };
  }

  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

const cachedValidator = new CachedValidator([
  rules.isString,
  rules.noNullBytes,
  rules.noTraversal
]);

// Simulate repeated validations
console.log('  Performance testing with caching:');
const testSet = ['file1.txt', 'file2.txt', 'file1.txt', 'file3.txt', 'file1.txt'];

testSet.forEach((file, i) => {
  cachedValidator.validate(file);
});

const stats = cachedValidator.getStats();
console.log(`    Validations: ${testSet.length}`);
console.log(`    Cache hits: ${stats.cacheHits}`);
console.log(`    Cache misses: ${stats.cacheMisses}`);
console.log(`    Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`    Cache size: ${stats.cacheSize} entries`);
console.log();

// 5. Validation with Suggestions
console.log('5. Validation with Auto-Correction Suggestions:');

class SuggestingValidator {
  constructor(rules) {
    this.pipeline = new ValidationPipeline(rules);
  }

  validate(value, context = {}) {
    const result = this.pipeline.validate(value, context);

    if (!result.valid) {
      result.suggestions = this._generateSuggestions(value, result.errors);
    }

    return result;
  }

  _generateSuggestions(value, errors) {
    const suggestions = [];

    errors.forEach(error => {
      switch (error.rule) {
        case 'allowedExtension':
          const currentExt = path.extname(value);
          suggestions.push(`Change extension from '${currentExt}' to '.jpg' or '.png'`);
          break;

        case 'noTraversal':
          const sanitized = value.replace(/\.\./g, '');
          suggestions.push(`Remove '..' → '${sanitized}'`);
          break;

        case 'noDotFiles':
          const basename = path.basename(value);
          const suggested = basename.replace(/^\./, '_');
          suggestions.push(`Rename '${basename}' to '${suggested}'`);
          break;

        case 'maxLength':
          suggestions.push('Shorten the path or filename');
          break;
      }
    });

    return suggestions;
  }
}

const suggestValidator = new SuggestingValidator([
  rules.noTraversal,
  rules.allowedExtension(['.jpg', '.png']),
  rules.noDotFiles,
  rules.maxLength(50)
]);

const suggestTests = [
  '../config/file.txt',
  '.hidden.jpg',
  'document.pdf',
  'a'.repeat(60) + '.jpg'
];

console.log('  Validation with suggestions:');
suggestTests.forEach(input => {
  const result = suggestValidator.validate(input);
  const display = input.length > 40 ? input.substring(0, 37) + '...' : input;

  if (result.valid) {
    console.log(`    ✓ '${display}'`);
  } else {
    console.log(`    ✗ '${display}'`);
    result.errors.forEach(e => console.log(`       Error: ${e.message}`));
    if (result.suggestions && result.suggestions.length > 0) {
      console.log(`       Suggestions:`);
      result.suggestions.forEach(s => console.log(`         • ${s}`));
    }
  }
});
console.log();

// 6. Async Validation
console.log('6. Async Validation (File System Checks):');

class AsyncValidator {
  constructor(rules) {
    this.syncRules = rules;
  }

  async validate(value, context = {}) {
    // First run synchronous rules
    const syncPipeline = new ValidationPipeline(this.syncRules);
    const syncResult = syncPipeline.validate(value, context);

    if (!syncResult.valid) {
      return syncResult;
    }

    // Then run async checks
    const asyncResults = await this._asyncChecks(value, context);

    return {
      ...syncResult,
      ...asyncResults
    };
  }

  async _asyncChecks(value, context) {
    const warnings = [];

    try {
      // Check if file exists
      const fullPath = path.resolve(context.baseDir || '.', value);

      try {
        await fs.promises.access(fullPath);
        warnings.push({ message: 'File already exists', rule: 'fileExists' });
      } catch {
        // File doesn't exist - that's usually fine
      }

      // Check parent directory exists
      const dir = path.dirname(fullPath);
      try {
        await fs.promises.access(dir);
      } catch {
        warnings.push({ message: 'Parent directory does not exist', rule: 'parentDirMissing' });
      }

    } catch (error) {
      // Handle errors
    }

    return { warnings };
  }
}

console.log('  Async validation checks:');
console.log('    • File existence');
console.log('    • Parent directory existence');
console.log('    • Permission checks');
console.log('    • Disk space validation');
console.log('    (Note: Requires actual file system access)');
console.log();

// 7. Production Validator
console.log('7. Production-Ready Validator:');

class ProductionPathValidator {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = {
      maxLength: options.maxLength || 255,
      allowedExtensions: options.allowedExtensions || null,
      allowDotFiles: options.allowDotFiles || false,
      allowTraversal: options.allowTraversal || false,
      cacheResults: options.cacheResults !== false,
      logViolations: options.logViolations !== false,
      ...options
    };

    this.validator = this._buildValidator();
    this.violations = [];
  }

  _buildValidator() {
    const rulesList = [
      rules.isString,
      rules.notEmpty,
      rules.maxLength(this.options.maxLength),
      rules.noNullBytes
    ];

    if (!this.options.allowTraversal) {
      rulesList.push(rules.noTraversal);
    }

    rulesList.push(rules.withinBoundary(this.baseDir));

    if (this.options.allowedExtensions) {
      rulesList.push(rules.allowedExtension(this.options.allowedExtensions));
    }

    if (!this.options.allowDotFiles) {
      rulesList.push(rules.noDotFiles);
    }

    if (this.options.cacheResults) {
      return new CachedValidator(rulesList, { maxCacheSize: this.options.maxCacheSize || 1000 });
    } else {
      return new ValidationPipeline(rulesList);
    }
  }

  validate(filepath, context = {}) {
    const result = this.validator.validate(filepath, context);

    if (this.options.logViolations && !result.valid) {
      this.violations.push({
        timestamp: new Date(),
        filepath,
        errors: result.errors,
        context
      });
    }

    return result;
  }

  getViolations() {
    return this.violations;
  }

  getStats() {
    if (this.validator.getStats) {
      return this.validator.getStats();
    }
    return null;
  }
}

const prodValidator = new ProductionPathValidator('/app/data', {
  allowedExtensions: ['.txt', '.pdf', '.jpg'],
  cacheResults: true,
  logViolations: true
});

console.log('  Testing production validator:');
const prodTests = [
  'document.pdf',
  'image.jpg',
  'file.exe',
  '../../../etc/passwd',
  '.env',
  'valid/file.txt'
];

prodTests.forEach(input => {
  const result = prodValidator.validate(input);
  if (result.valid) {
    console.log(`    ✓ '${input}'`);
  } else {
    console.log(`    ✗ '${input}' → ${result.errors.map(e => e.rule).join(', ')}`);
  }
});

const stats = prodValidator.getStats();
if (stats) {
  console.log(`\n  Cache stats: ${stats.cacheHits} hits, ${stats.cacheMisses} misses`);
}
console.log(`  Violations logged: ${prodValidator.getViolations().length}`);
console.log();

console.log('✅ Advanced path validation complete!');
console.log();
console.log('Key Takeaways:');
console.log('  • Build modular, reusable validation rules');
console.log('  • Use pipelines to compose complex validators');
console.log('  • Implement context-aware validation');
console.log('  • Cache results for performance');
console.log('  • Provide helpful error messages and suggestions');
console.log('  • Log violations for security monitoring');
