/**
 * Solution: Exercise 1 - Create Backward Compatible API
 * =======================================================
 *
 * This solution demonstrates how to build an API that supports both callback
 * and promise interfaces, allowing users to gradually migrate from callbacks
 * to promises without breaking existing code.
 *
 * Key techniques used:
 * - util.callbackify() for promise-to-callback conversion
 * - util.deprecate() for backward compatibility warnings
 * - Dual API pattern for automatic style detection
 * - Proper error handling for both paradigms
 */

const util = require('util');

// =============================================================================
// SOLUTION: UserService with Backward Compatibility
// =============================================================================

/**
 * STEP 1: Create base UserService with promise-based methods
 *
 * This is the modern implementation. We implement everything with async/await
 * and promises, then provide backward compatibility for callbacks.
 */
class UserService {
  constructor() {
    // Initialize with sample data
    this.users = new Map([
      [1, { id: 1, name: 'Alice', email: 'alice@example.com' }],
      [2, { id: 2, name: 'Bob', email: 'bob@example.com' }],
    ]);
    this.nextId = 3;
  }

  /**
   * Get user by ID (promise-based)
   * @param {number} id - User ID
   * @returns {Promise<Object>} User object
   * @throws {Error} If user not found
   */
  async getUserById(id) {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));

    // Validate input
    if (typeof id !== 'number') {
      throw new TypeError('User ID must be a number');
    }

    // Get user
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    return user;
  }

  /**
   * Create new user (promise-based)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    await new Promise(resolve => setTimeout(resolve, 10));

    // Validate input
    if (!userData || typeof userData !== 'object') {
      throw new TypeError('User data must be an object');
    }

    if (!userData.name || !userData.email) {
      throw new Error('User must have name and email');
    }

    // Create user
    const newUser = {
      id: this.nextId++,
      name: userData.name,
      email: userData.email,
      createdAt: new Date()
    };

    this.users.set(newUser.id, newUser);
    return newUser;
  }

  /**
   * Update user (promise-based)
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(id, updates) {
    await new Promise(resolve => setTimeout(resolve, 10));

    // Get existing user
    const user = await this.getUserById(id);

    // Validate updates
    if (!updates || typeof updates !== 'object') {
      throw new TypeError('Updates must be an object');
    }

    // Apply updates
    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Don't allow ID changes
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete user (promise-based)
   * @param {number} id - User ID
   * @returns {Promise<Object>} Deleted user
   */
  async deleteUser(id) {
    await new Promise(resolve => setTimeout(resolve, 10));

    // Get user before deleting
    const user = await this.getUserById(id);

    // Delete user
    this.users.delete(id);
    return user;
  }
}

// =============================================================================
// STEP 2: Add callback versions using util.callbackify()
// =============================================================================

/**
 * Create callback versions for backward compatibility
 * We use util.callbackify() to convert promise-based methods to callbacks
 */
function addCallbackSupport(service) {
  // Create callbackified versions
  const getUserByIdCallback = util.callbackify(service.getUserById.bind(service));
  const createUserCallback = util.callbackify(service.createUser.bind(service));
  const updateUserCallback = util.callbackify(service.updateUser.bind(service));
  const deleteUserCallback = util.callbackify(service.deleteUser.bind(service));

  // Add deprecation warnings (users should migrate to promises)
  service.getUserByIdCallback = util.deprecate(
    getUserByIdCallback,
    'getUserById(id, callback) is deprecated. Use getUserById(id) with promises instead.',
    'DEP_USER_SERVICE_001'
  );

  service.createUserCallback = util.deprecate(
    createUserCallback,
    'createUser(data, callback) is deprecated. Use createUser(data) with promises instead.',
    'DEP_USER_SERVICE_002'
  );

  service.updateUserCallback = util.deprecate(
    updateUserCallback,
    'updateUser(id, updates, callback) is deprecated. Use updateUser(id, updates) with promises instead.',
    'DEP_USER_SERVICE_003'
  );

  service.deleteUserCallback = util.deprecate(
    deleteUserCallback,
    'deleteUser(id, callback) is deprecated. Use deleteUser(id) with promises instead.',
    'DEP_USER_SERVICE_004'
  );

  return service;
}

// =============================================================================
// STEP 3: Create Dual API wrapper (automatic detection)
// =============================================================================

/**
 * DualAPIUserService automatically detects callback vs promise usage
 *
 * This provides the best developer experience:
 * - getUserById(1) -> returns Promise
 * - getUserById(1, callback) -> calls callback (with deprecation warning)
 */
class DualAPIUserService extends UserService {
  constructor(options = {}) {
    super();
    this.strict = options.strict || false;
    this.trackUsage = options.trackUsage || false;

    // Usage tracking
    this.usageStats = {
      callbackCalls: 0,
      promiseCalls: 0,
      deprecationWarnings: 0
    };

    // Create callbackified versions with deprecation
    this._getUserByIdCallback = this._createDeprecatedCallback(
      'getUserById',
      super.getUserById.bind(this),
      'DEP_USER_SERVICE_001'
    );

    this._createUserCallback = this._createDeprecatedCallback(
      'createUser',
      super.createUser.bind(this),
      'DEP_USER_SERVICE_002'
    );

    this._updateUserCallback = this._createDeprecatedCallback(
      'updateUser',
      super.updateUser.bind(this),
      'DEP_USER_SERVICE_003'
    );

    this._deleteUserCallback = this._createDeprecatedCallback(
      'deleteUser',
      super.deleteUser.bind(this),
      'DEP_USER_SERVICE_004'
    );
  }

  /**
   * Helper to create deprecated callback version
   */
  _createDeprecatedCallback(methodName, promiseMethod, deprecationCode) {
    const callbackified = util.callbackify(promiseMethod);

    return util.deprecate(
      callbackified,
      `${methodName}(..., callback) is deprecated. Use ${methodName}(...) with promises/async-await instead.`,
      deprecationCode
    );
  }

  /**
   * Track API usage
   */
  _trackCall(isCallback) {
    if (this.trackUsage) {
      if (isCallback) {
        this.usageStats.callbackCalls++;
        this.usageStats.deprecationWarnings++;
      } else {
        this.usageStats.promiseCalls++;
      }
    }
  }

  /**
   * Dual API: getUserById
   * Supports both getUserById(id) and getUserById(id, callback)
   */
  getUserById(id, callback) {
    // Check if callback provided
    if (typeof callback === 'function') {
      // Strict mode: throw error instead of allowing callbacks
      if (this.strict) {
        throw new Error(
          'Callback API is disabled in strict mode. Use promises/async-await instead.'
        );
      }

      // Track usage
      this._trackCall(true);

      // Use deprecated callback version
      return this._getUserByIdCallback(id, callback);
    }

    // Track usage
    this._trackCall(false);

    // Return promise
    return super.getUserById(id);
  }

  /**
   * Dual API: createUser
   */
  createUser(userData, callback) {
    if (typeof callback === 'function') {
      if (this.strict) {
        throw new Error(
          'Callback API is disabled in strict mode. Use promises/async-await instead.'
        );
      }

      this._trackCall(true);
      return this._createUserCallback(userData, callback);
    }

    this._trackCall(false);
    return super.createUser(userData);
  }

  /**
   * Dual API: updateUser
   */
  updateUser(id, updates, callback) {
    if (typeof callback === 'function') {
      if (this.strict) {
        throw new Error(
          'Callback API is disabled in strict mode. Use promises/async-await instead.'
        );
      }

      this._trackCall(true);
      return this._updateUserCallback(id, updates, callback);
    }

    this._trackCall(false);
    return super.updateUser(id, updates);
  }

  /**
   * Dual API: deleteUser
   */
  deleteUser(id, callback) {
    if (typeof callback === 'function') {
      if (this.strict) {
        throw new Error(
          'Callback API is disabled in strict mode. Use promises/async-await instead.'
        );
      }

      this._trackCall(true);
      return this._deleteUserCallback(id, callback);
    }

    this._trackCall(false);
    return super.deleteUser(id);
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return { ...this.usageStats };
  }

  /**
   * Generate migration guide based on usage
   */
  generateMigrationGuide() {
    const stats = this.getUsageStats();
    const total = stats.callbackCalls + stats.promiseCalls;
    const callbackPercentage = total > 0 ? (stats.callbackCalls / total * 100).toFixed(1) : 0;

    return {
      summary: `${stats.callbackCalls} callback calls, ${stats.promiseCalls} promise calls`,
      callbackPercentage: `${callbackPercentage}%`,
      recommendation: callbackPercentage > 50
        ? 'High callback usage detected. Plan migration strategy.'
        : callbackPercentage > 0
          ? 'Some callback usage. Continue gradual migration.'
          : 'All promise-based. Consider removing callback support.',
      migrationSteps: [
        '1. Identify all callback usage locations',
        '2. Convert callbacks to async/await',
        '3. Test thoroughly',
        '4. Remove callback code',
        '5. Update documentation'
      ]
    };
  }
}

// =============================================================================
// TEST CASES
// =============================================================================

async function testBothAPIs() {
  console.log('=== Testing Promise API ===\n');

  const service = new DualAPIUserService({ trackUsage: true });

  try {
    // Test 1: Get existing user
    const user1 = await service.getUserById(1);
    console.log('✓ Got user:', user1);

    // Test 2: Create new user
    const newUser = await service.createUser({
      name: 'Charlie',
      email: 'charlie@example.com'
    });
    console.log('✓ Created user:', newUser);

    // Test 3: Update user
    const updatedUser = await service.updateUser(1, {
      name: 'Alice Updated'
    });
    console.log('✓ Updated user:', updatedUser);

    // Test 4: Delete user
    const deletedUser = await service.deleteUser(newUser.id);
    console.log('✓ Deleted user:', deletedUser);

    // Test 5: Error handling
    try {
      await service.getUserById(999);
    } catch (err) {
      console.log('✓ Error handled:', err.message);
    }

  } catch (err) {
    console.error('❌ Promise API error:', err);
  }

  console.log('\n=== Testing Callback API (Deprecated) ===\n');

  // Test callback API
  service.getUserById(2, (err, user) => {
    if (err) {
      console.error('❌ Callback error:', err.message);
      return;
    }
    console.log('✓ Got user via callback:', user);
  });

  // Test error handling with callback
  setTimeout(() => {
    service.getUserById(999, (err, user) => {
      if (err) {
        console.log('✓ Error handled in callback:', err.message);
      } else {
        console.log('User:', user);
      }
    });
  }, 100);

  // Show usage stats
  setTimeout(() => {
    console.log('\n=== Usage Statistics ===\n');
    const stats = service.getUsageStats();
    console.log('Callback calls:', stats.callbackCalls);
    console.log('Promise calls:', stats.promiseCalls);
    console.log('Deprecation warnings:', stats.deprecationWarnings);

    console.log('\n=== Migration Guide ===\n');
    const guide = service.generateMigrationGuide();
    console.log('Summary:', guide.summary);
    console.log('Callback usage:', guide.callbackPercentage);
    console.log('Recommendation:', guide.recommendation);
    console.log('\nMigration steps:');
    guide.migrationSteps.forEach(step => console.log('  ', step));
  }, 200);
}

// Test strict mode
async function testStrictMode() {
  console.log('\n\n=== Testing Strict Mode ===\n');

  const service = new DualAPIUserService({ strict: true });

  try {
    // This should throw error
    service.getUserById(1, (err, user) => {
      console.log('This should not be reached');
    });
  } catch (err) {
    console.log('✓ Strict mode error:', err.message);
  }

  // Promise style should still work
  try {
    const user = await service.getUserById(1);
    console.log('✓ Promise style works in strict mode:', user);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Run tests
if (require.main === module) {
  testBothAPIs().then(() => {
    testStrictMode();
  });
}

// =============================================================================
// ALTERNATIVE SOLUTION: Decorator Pattern
// =============================================================================

/**
 * ALTERNATIVE APPROACH: Use a decorator to wrap methods
 *
 * This approach is more flexible and allows dynamic wrapping of methods.
 * It's especially useful if you have many methods to wrap.
 */

function createDualAPIDecorator(options = {}) {
  return function(target) {
    const methodNames = Object.getOwnPropertyNames(target.prototype)
      .filter(name => {
        return name !== 'constructor' &&
               typeof target.prototype[name] === 'function' &&
               target.prototype[name].constructor.name === 'AsyncFunction';
      });

    methodNames.forEach(methodName => {
      const originalMethod = target.prototype[methodName];
      const callbackified = util.callbackify(originalMethod);
      const deprecated = util.deprecate(
        callbackified,
        `${methodName}(..., callback) is deprecated.`,
        `DEP_${methodName.toUpperCase()}`
      );

      target.prototype[methodName] = function(...args) {
        const callback = args[args.length - 1];

        if (typeof callback === 'function') {
          if (options.strict) {
            throw new Error('Callbacks not allowed in strict mode');
          }
          return deprecated.call(this, ...args);
        }

        return originalMethod.call(this, ...args);
      };
    });

    return target;
  };
}

// Usage:
// @createDualAPIDecorator({ strict: false })
// class MyService { ... }

module.exports = {
  UserService,
  DualAPIUserService,
  addCallbackSupport,
  createDualAPIDecorator
};

// =============================================================================
// KEY LEARNING POINTS
// =============================================================================

/**
 * 1. BACKWARD COMPATIBILITY STRATEGY
 *    When modernizing APIs, support both old and new styles during transition.
 *    Use deprecation warnings to guide users toward the new API without
 *    breaking their existing code immediately.
 *
 * 2. UTIL.CALLBACKIFY() MECHANICS
 *    - Converts promise-based functions to callback style
 *    - Promise resolution → callback(null, result)
 *    - Promise rejection → callback(error)
 *    - Always use .bind() to preserve context
 *    - Create wrapper once, not in loops
 *
 * 3. DUAL API PATTERN
 *    Detect callback vs promise usage by checking if last argument is a function.
 *    This provides seamless migration path:
 *    - myMethod(arg) → returns Promise
 *    - myMethod(arg, callback) → calls callback
 *
 * 4. DEPRECATION BEST PRACTICES
 *    - Provide clear migration messages
 *    - Use deprecation codes for tracking
 *    - Combine with util.callbackify for smooth transitions
 *    - Track usage statistics to plan removal timeline
 *
 * 5. STRICT MODE FOR ENFORCEMENT
 *    During final migration phase, use strict mode to catch remaining
 *    callback usage and force migration completion.
 *
 * 6. USAGE TRACKING
 *    Track callback vs promise calls to understand migration progress
 *    and identify areas that still need conversion.
 *
 * 7. CONTEXT PRESERVATION
 *    Always use .bind(this) when creating callbackified versions to
 *    ensure methods can access instance properties correctly.
 */

// =============================================================================
// COMMON MISTAKES
// =============================================================================

/**
 * MISTAKE 1: Creating callbackified version in hot path
 * ❌ BAD:
 */
function badExample() {
  getUserById(id, callback) {
    if (callback) {
      return util.callbackify(this._getUserById).call(this, id, callback);
    }
    return this._getUserById(id);
  }
}
/**
 * This creates a new wrapper every time! Very inefficient.
 *
 * ✅ GOOD: Create wrapper once in constructor
 */
function goodExample() {
  constructor() {
    this._getUserByIdCallback = util.callbackify(this._getUserById.bind(this));
  }
}

/**
 * MISTAKE 2: Forgetting to bind context
 * ❌ BAD:
 */
function badBinding() {
  const callback = util.callbackify(this.getUserById);
  // 'this' will be undefined when callback is called!
}
/**
 * ✅ GOOD: Always bind context
 */
function goodBinding() {
  const callback = util.callbackify(this.getUserById.bind(this));
}

/**
 * MISTAKE 3: Not handling both error styles
 * ❌ BAD:
 */
function badErrorHandling() {
  service.getUserById(1, (user) => {  // Missing error parameter!
    console.log(user);
  });
}
/**
 * ✅ GOOD: Always check error first in callbacks
 */
function goodErrorHandling() {
  service.getUserById(1, (err, user) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log(user);
  });
}

/**
 * MISTAKE 4: Not validating callback is function
 * ❌ BAD:
 */
function badValidation(id, callback) {
  if (callback) {  // What if callback is truthy but not a function?
    this.callbackVersion(id, callback);
  }
}
/**
 * ✅ GOOD: Check typeof
 */
function goodValidation(id, callback) {
  if (typeof callback === 'function') {
    this.callbackVersion(id, callback);
  }
}

// =============================================================================
// GOING FURTHER - Advanced Challenges
// =============================================================================

/**
 * CHALLENGE 1: Automatic Migration Tool
 * Build a tool that analyzes code and automatically converts callback
 * usage to async/await:
 *
 * Input:
 *   service.getUserById(1, (err, user) => {
 *     if (err) return console.error(err);
 *     console.log(user);
 *   });
 *
 * Output:
 *   try {
 *     const user = await service.getUserById(1);
 *     console.log(user);
 *   } catch (err) {
 *     console.error(err);
 *   }
 *
 * Hint: Use AST parsing (like @babel/parser) to transform code.
 */

/**
 * CHALLENGE 2: Progressive Deprecation System
 * Implement a deprecation system with phases:
 * - Phase 1: Warn on usage (current behavior)
 * - Phase 2: Warn and log to monitoring system
 * - Phase 3: Rate limit (slow down callback calls)
 * - Phase 4: Throw error
 *
 * Allow configuration per environment:
 * - Development: Phase 1
 * - Staging: Phase 2
 * - Production: Phase 3 (with gradual rollout)
 */

/**
 * CHALLENGE 3: Smart Migration Analytics
 * Build analytics system that tracks:
 * - Which methods use callbacks most
 * - Which users/services need migration
 * - Estimated migration effort (lines of code)
 * - Success rate of migrations (tests passing)
 * - Generate migration priority list
 */

/**
 * CHALLENGE 4: Callback-to-Promise Polyfill
 * Create a wrapper that works in reverse - takes callback API
 * and makes it support promises:
 *
 * const promisified = autoPolyfill(legacyService);
 * await promisified.oldMethod(args);  // Works with promises!
 * promisified.oldMethod(args, callback);  // Still works with callbacks!
 */

/**
 * CHALLENGE 5: Type-Safe Dual API
 * Using TypeScript, create type definitions that:
 * - Correctly type both promise and callback versions
 * - Show deprecation warnings in IDE
 * - Enforce strict mode at compile time
 * - Provide autocomplete for migration methods
 *
 * Example:
 * interface DualAPI<T> {
 *   (args): Promise<T>;
 *   (args, callback: Callback<T>): void;
 * }
 */

/**
 * BONUS: Run with NODE_OPTIONS to suppress deprecation warnings during testing:
 * NODE_OPTIONS='--no-deprecation' node exercise-1-solution.js
 *
 * Or to turn them into errors (strict testing):
 * NODE_OPTIONS='--throw-deprecation' node exercise-1-solution.js
 */
