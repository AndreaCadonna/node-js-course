/**
 * Example 7: Composing Multiple Util Functions
 *
 * Demonstrates how to compose multiple util functions to create powerful
 * utility pipelines and reusable patterns.
 */

const util = require('util');
const fs = require('fs');
const { promisify } = util;

console.log('=== Utility Composition ===\n');

// =============================================================================
// 1. Composing Promisify with Validation
// =============================================================================
console.log('1. Promisify + Validation Composition\n');

function composePromisifyWithValidation(fn, validator) {
  // First promisify
  const promisified = util.promisify(fn);

  // Then wrap with validation
  return async function(...args) {
    // Validate input
    const error = validator(...args);
    if (error) {
      throw error;
    }

    // Call promisified function
    return await promisified(...args);
  };
}

// Example: Safe file operations
const safeReadFile = composePromisifyWithValidation(
  fs.readFile,
  (path) => {
    if (typeof path !== 'string') {
      return new TypeError('Path must be a string');
    }
    if (path.startsWith('/etc/') || path.includes('..')) {
      return new Error('Path not allowed');
    }
    return null;
  }
);

safeReadFile(__filename, 'utf8')
  .then(() => console.log('✅ Valid file read succeeded'))
  .catch(err => console.error('Error:', err.message));

safeReadFile('/etc/passwd', 'utf8')
  .catch(err => console.log('✅ Invalid path rejected:', err.message));

console.log('');

// =============================================================================
// 2. Inspect + Format Composition
// =============================================================================
setTimeout(() => {
  console.log('2. Inspect + Format Composition\n');

  function createFormatter(options = {}) {
    const inspectOptions = {
      depth: options.depth || 3,
      colors: options.colors !== false,
      compact: options.compact || false,
      ...options.inspectOptions
    };

    return function format(template, ...args) {
      // Inspect each argument
      const inspectedArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          return util.inspect(arg, inspectOptions);
        }
        return arg;
      });

      // Format with inspected args
      return util.format(template, ...inspectedArgs);
    };
  }

  const prettyFormat = createFormatter({ colors: true, depth: 5 });
  const compactFormat = createFormatter({ compact: true, colors: false });

  const data = {
    user: { id: 1, name: 'Alice', metadata: { role: 'admin', permissions: ['read', 'write'] } }
  };

  console.log('Pretty format:');
  console.log(prettyFormat('User data: %s', data));

  console.log('\nCompact format:');
  console.log(compactFormat('User data: %s', data));

  console.log('');
}, 100);

// =============================================================================
// 3. Debuglog + Custom Inspect Composition
// =============================================================================
setTimeout(() => {
  console.log('3. Debuglog + Custom Inspect Composition\n');

  class DebugInspectable {
    constructor(namespace, data) {
      this.namespace = namespace;
      this.data = data;
      this.debuglog = util.debuglog(namespace);
    }

    [util.inspect.custom](depth, options) {
      // Custom inspect that also debugs
      const inspected = util.inspect(this.data, { ...options, depth: depth - 1 });

      // Log to debuglog
      this.debuglog('Inspecting %s: %s', this.namespace, inspected);

      return `${this.namespace}: ${inspected}`;
    }

    get value() {
      return this.data;
    }
  }

  const debugData = new DebugInspectable('myapp', {
    operation: 'process',
    status: 'running',
    metrics: { cpu: 45, memory: 256 }
  });

  console.log('Object:', debugData);
  console.log('✅ Combines inspection with conditional debugging');
  console.log('');
}, 200);

// =============================================================================
// 4. Promisify Pipeline
// =============================================================================
setTimeout(() => {
  console.log('4. Promisify Pipeline\n');

  function createAsyncPipeline(...fns) {
    const promisified = fns.map(fn =>
      typeof fn === 'function' && fn.length > 1 ? util.promisify(fn) : fn
    );

    return async function(input) {
      let result = input;
      for (const fn of promisified) {
        result = await fn(result);
      }
      return result;
    };
  }

  // Example pipeline
  const readFile = util.promisify(fs.readFile);

  const pipeline = createAsyncPipeline(
    // Read file
    (path) => readFile(path, 'utf8'),
    // Count lines
    (content) => content.split('\n').length,
    // Format result
    (lineCount) => `File has ${lineCount} lines`
  );

  pipeline(__filename)
    .then(result => {
      console.log('Pipeline result:', result);
      console.log('✅ Composed async operations in pipeline');
      console.log('');
    });
}, 300);

// =============================================================================
// 5. Type-Checked Utility Wrapper
// =============================================================================
setTimeout(() => {
  console.log('5. Type Checking + Util Composition\n');

  function createTypedFunction(fn, typeChecks) {
    return function(...args) {
      // Validate arguments using util.types
      for (let i = 0; i < typeChecks.length; i++) {
        const check = typeChecks[i];
        const arg = args[i];

        if (check && !check(arg)) {
          throw new TypeError(
            `Argument ${i} failed type check. Got: ${util.inspect(arg, { depth: 0 })}`
          );
        }
      }

      return fn(...args);
    };
  }

  // Create typed function
  const processData = createTypedFunction(
    (id, name, options) => {
      return { id, name, options, processed: true };
    },
    [
      util.types.isNumberObject.bind(util.types, Number) || ((x) => typeof x === 'number'),
      (x) => typeof x === 'string',
      (x) => typeof x === 'object'
    ]
  );

  try {
    console.log('Valid call:');
    console.log(processData(123, 'Test', { flag: true }));
  } catch (err) {
    console.log('Error:', err.message);
  }

  try {
    console.log('\nInvalid call (wrong type):');
    processData('not-a-number', 'Test', {});
  } catch (err) {
    console.log('✅ Type check failed:', err.message);
  }

  console.log('');
}, 400);

// =============================================================================
// 6. Deep Equality + Validation Composition
// =============================================================================
setTimeout(() => {
  console.log('6. Deep Equality + Validation\n');

  function createSchemaValidator(schema) {
    return function validate(data) {
      const errors = [];

      for (const [key, validator] of Object.entries(schema)) {
        if (typeof validator === 'function') {
          if (!validator(data[key])) {
            errors.push(`Invalid value for ${key}`);
          }
        } else if (typeof validator === 'object') {
          // Deep equality check
          if (!util.isDeepStrictEqual(data[key], validator)) {
            errors.push(`Value for ${key} does not match expected: ${util.inspect(validator)}`);
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };
  }

  const userValidator = createSchemaValidator({
    type: 'user', // Exact match
    id: (val) => typeof val === 'number' && val > 0,
    name: (val) => typeof val === 'string' && val.length > 0,
    role: (val) => ['admin', 'user', 'guest'].includes(val)
  });

  const validUser = { type: 'user', id: 123, name: 'Alice', role: 'admin' };
  const invalidUser = { type: 'admin', id: -1, name: '', role: 'superuser' };

  console.log('Valid user:');
  console.log(userValidator(validUser));

  console.log('\nInvalid user:');
  console.log(userValidator(invalidUser));

  console.log('');
}, 500);

// =============================================================================
// 7. Logging + Timing Composition
// =============================================================================
setTimeout(() => {
  console.log('7. Logging + Timing Composition\n');

  function createTimedLogger(namespace) {
    const debuglog = util.debuglog(namespace);
    const timers = new Map();

    return {
      start(label, context = {}) {
        const start = process.hrtime.bigint();
        timers.set(label, { start, context });

        debuglog('Started: %s %O', label, context);
      },

      end(label, additionalContext = {}) {
        const timer = timers.get(label);
        if (!timer) {
          debuglog('No timer found for: %s', label);
          return;
        }

        const end = process.hrtime.bigint();
        const duration = Number(end - timer.start) / 1_000_000; // ms

        const fullContext = {
          ...timer.context,
          ...additionalContext,
          duration: `${duration.toFixed(2)}ms`
        };

        debuglog('Completed: %s %s', label, util.inspect(fullContext, {
          depth: 3,
          colors: true,
          compact: true
        }));

        timers.delete(label);
        return duration;
      }
    };
  }

  const logger = createTimedLogger('performance');

  logger.start('database-query', { query: 'SELECT * FROM users' });
  setTimeout(() => {
    logger.end('database-query', { rows: 150 });
    console.log('✅ Combined timing with debug logging');
    console.log('');
  }, 50);
}, 600);

// =============================================================================
// 8. Utility Class with Composition
// =============================================================================
setTimeout(() => {
  console.log('8. Complete Utility Class with Composition\n');

  class ComposedUtility {
    constructor(options = {}) {
      this.namespace = options.namespace || 'app';
      this.debuglog = util.debuglog(this.namespace);
      this.inspectOptions = options.inspectOptions || { depth: 3, colors: true };
    }

    // Promisify with context
    promisify(fn) {
      const promisified = util.promisify(fn);
      return async (...args) => {
        this.debuglog('Calling promisified function with args: %O', args);
        try {
          const result = await promisified(...args);
          this.debuglog('Result: %O', result);
          return result;
        } catch (err) {
          this.debuglog('Error: %s', err.message);
          throw err;
        }
      };
    }

    // Format with debug
    format(template, ...args) {
      const formatted = util.format(template, ...args);
      this.debuglog('Formatted: %s', formatted);
      return formatted;
    }

    // Inspect with debug
    inspect(obj) {
      const inspected = util.inspect(obj, this.inspectOptions);
      this.debuglog('Inspected object');
      return inspected;
    }

    // Deep equality with logging
    deepEqual(a, b) {
      const equal = util.isDeepStrictEqual(a, b);
      this.debuglog('Deep equality check: %s', equal);
      if (!equal) {
        this.debuglog('A: %O', a);
        this.debuglog('B: %O', b);
      }
      return equal;
    }

    // Timed operation
    async time(label, fn) {
      const start = process.hrtime.bigint();
      this.debuglog('Starting: %s', label);

      try {
        const result = await fn();
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000;

        this.debuglog('Completed: %s in %sms', label, duration.toFixed(2));
        return { result, duration };
      } catch (err) {
        this.debuglog('Failed: %s - %s', label, err.message);
        throw err;
      }
    }
  }

  const utility = new ComposedUtility({ namespace: 'myapp' });

  // Use composed utilities
  const readFile = utility.promisify(fs.readFile);

  utility.time('read-file', () => readFile(__filename, 'utf8'))
    .then(({ result, duration }) => {
      console.log(`✅ Read file in ${duration.toFixed(2)}ms`);
      console.log(`   Lines: ${result.split('\n').length}`);

      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };

      console.log(`   Deep equal: ${utility.deepEqual(obj1, obj2)}`);
      console.log('');
    });
}, 750);

// =============================================================================
// 9. Functional Composition Helpers
// =============================================================================
setTimeout(() => {
  console.log('9. Functional Composition Helpers\n');

  const compose = {
    // Compose multiple functions
    pipe: (...fns) => (x) => fns.reduce((v, f) => f(v), x),

    // Async pipe
    asyncPipe: (...fns) => (x) => fns.reduce(
      (promise, fn) => promise.then(fn),
      Promise.resolve(x)
    ),

    // Add inspection to function
    withInspect: (fn, options = {}) => {
      return function(...args) {
        if (options.logInput) {
          console.log('Input:', util.inspect(args, { depth: 3 }));
        }

        const result = fn(...args);

        if (options.logOutput) {
          console.log('Output:', util.inspect(result, { depth: 3 }));
        }

        return result;
      };
    },

    // Add timing to function
    withTiming: (fn, label) => {
      return function(...args) {
        const start = process.hrtime.bigint();
        const result = fn(...args);
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000;

        console.log(`${label}: ${duration.toFixed(2)}ms`);
        return result;
      };
    }
  };

  // Use composition
  const processNumber = compose.pipe(
    x => x * 2,
    x => x + 10,
    x => x / 2
  );

  console.log('Pipe result:', processNumber(5)); // (5 * 2 + 10) / 2 = 10

  // With inspection
  const inspectedFn = compose.withInspect(
    (x) => ({ value: x * 2, timestamp: new Date() }),
    { logInput: true, logOutput: true }
  );

  console.log('\nWith inspection:');
  inspectedFn({ input: 42 });

  console.log('');
}, 850);

// =============================================================================
// Key Takeaways
// =============================================================================
setTimeout(() => {
  console.log('=== Key Takeaways ===');
  console.log('1. Compose promisify with validation for safe async');
  console.log('2. Combine inspect + format for rich output');
  console.log('3. Merge debuglog + custom inspect for debug-aware objects');
  console.log('4. Create async pipelines with promisified functions');
  console.log('5. Add type checking to functions with util.types');
  console.log('6. Use deep equality in validation schemas');
  console.log('7. Combine logging with timing for observability');
  console.log('8. Build utility classes that compose multiple patterns');
  console.log('9. Use functional composition for reusable patterns');
  console.log('10. Composition creates powerful, maintainable utilities');
}, 950);
