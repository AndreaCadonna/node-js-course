/**
 * Exercise 1: Create Backward Compatible API
 *
 * DIFFICULTY: ⭐⭐ Intermediate
 * TIME: 25-30 minutes
 *
 * OBJECTIVE:
 * Build an API that supports both callback and promise interfaces, allowing
 * users to gradually migrate from callback-based code to promises. This is
 * a real-world scenario when modernizing legacy APIs.
 *
 * REQUIREMENTS:
 * 1. Create a UserService class with promise-based methods
 * 2. Add callback versions using util.callbackify()
 * 3. Support dual API (detect callback vs promise usage)
 * 4. Add deprecation warnings for callback usage
 * 5. Implement proper error handling for both styles
 *
 * BONUS CHALLENGES:
 * - Add a migration helper that detects callback usage
 * - Create documentation showing migration path
 * - Implement a "strict mode" that throws on callback usage
 * - Add metrics to track callback vs promise usage
 *
 * HINTS:
 * - Use util.callbackify to convert promises to callbacks
 * - Use util.deprecate to warn about old API usage
 * - Check typeof callback parameter to detect usage style
 * - Remember callback signature: (error, result)
 */

const util = require('util');

// TODO 1: Create UserService class with promise-based methods
class UserService {
  constructor() {
    this.users = new Map([
      [1, { id: 1, name: 'Alice', email: 'alice@example.com' }],
      [2, { id: 2, name: 'Bob', email: 'bob@example.com' }],
    ]);
  }

  // TODO: Implement async getUserById(id)
  // Should validate id and return user or throw error
  async getUserById(id) {
    // Your code here
  }

  // TODO: Implement async createUser(userData)
  // Should validate data, create user, and return created user
  async createUser(userData) {
    // Your code here
  }

  // TODO: Implement async updateUser(id, updates)
  // Should validate id and updates, update user, return updated user
  async updateUser(id, updates) {
    // Your code here
  }

  // TODO: Implement async deleteUser(id)
  // Should validate id, delete user, return deleted user
  async deleteUser(id) {
    // Your code here
  }
}

// TODO 2: Create callback versions using util.callbackify()
// Attach as .callback property to each method
// Example: userService.getUserById.callback = util.callbackify(...)

// TODO 3: Create a dual API wrapper
// Should detect if last argument is callback and route appropriately
class DualAPIUserService extends UserService {
  // TODO: Implement getUserById that supports both styles
  // getUserById(id) -> Promise
  // getUserById(id, callback) -> void
  getUserById(id, callback) {
    // Your code here:
    // 1. Check if callback is provided
    // 2. If yes, use callbackified version (with deprecation)
    // 3. If no, return promise
  }

  // TODO: Repeat for createUser, updateUser, deleteUser
}

// TODO 4: Add deprecation warnings
// Use util.deprecate to warn when callback API is used
// Provide clear migration path in warning message

// TODO 5: Test both APIs
async function testBothAPIs() {
  const service = new DualAPIUserService();

  console.log('=== Testing Promise API ===\n');

  // TODO: Test promise-based API
  // - Get user by ID
  // - Create new user
  // - Update user
  // - Delete user
  // - Handle errors

  console.log('\n=== Testing Callback API (Deprecated) ===\n');

  // TODO: Test callback-based API
  // - Get user by ID with callback
  // - Create user with callback
  // - Handle errors in callback
  // - Notice deprecation warnings
}

// TODO 6: Create migration helper
function createMigrationHelper(service) {
  // Your code here:
  // Track which methods are called with callbacks
  // Provide report on callback usage
  // Suggest migration strategies
}

// Uncomment to run:
// testBothAPIs();

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Run your solution:
 *    node exercise-1.js
 *
 * 2. Expected behavior:
 *    - Promise API works without warnings
 *    - Callback API works but shows deprecation warnings
 *    - Dual API detects usage style automatically
 *    - Errors are handled properly in both styles
 *
 * 3. Test cases to verify:
 *    ✓ Promise: Get existing user
 *    ✓ Promise: Get non-existent user (error)
 *    ✓ Promise: Create new user
 *    ✓ Promise: Update user
 *    ✓ Promise: Delete user
 *    ✓ Callback: Get existing user
 *    ✓ Callback: Error handling
 *    ✓ Deprecation warnings appear for callbacks
 *
 * EXAMPLE OUTPUT:
 * ───────────────────────────────────────
 * === Testing Promise API ===
 *
 * ✓ Got user: { id: 1, name: 'Alice', email: 'alice@example.com' }
 * ✓ Created user: { id: 3, name: 'Charlie', ... }
 * ✓ Updated user: { id: 1, name: 'Alice Updated', ... }
 * ✓ Deleted user: { id: 3, name: 'Charlie', ... }
 * ✓ Error handled: User not found
 *
 * === Testing Callback API (Deprecated) ===
 *
 * (node:12345) [DEP0001] DeprecationWarning:
 * getUserById(id, callback) is deprecated.
 * Use getUserById(id) with promises instead.
 *
 * ✓ Got user via callback: { id: 1, name: 'Alice', ... }
 * ✓ Error handled in callback: User not found
 * ───────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - When should you use util.callbackify vs keeping separate implementations?
 * - How do you deprecate APIs without breaking existing code?
 * - What's the best way to support dual APIs during migrations?
 * - How can you track usage to plan deprecation timelines?
 * - What makes a good deprecation warning message?
 */

/**
 * BONUS IMPLEMENTATION IDEAS:
 *
 * 1. Strict Mode:
 *    const service = new DualAPIUserService({ strict: true });
 *    // Throws error if callbacks are used
 *
 * 2. Usage Tracking:
 *    service.getUsageStats()
 *    // { callbackCalls: 5, promiseCalls: 20, deprecationWarnings: 5 }
 *
 * 3. Migration Helper:
 *    service.generateMigrationGuide()
 *    // Outputs code transformation suggestions
 *
 * 4. Automatic Conversion:
 *    convertCallbackToPromise(code)
 *    // Converts callback code to promise code
 */
