/**
 * Exercise 4: Password Manager - SOLUTION
 *
 * This solution demonstrates:
 * - Secure password hashing with PBKDF2 and salt
 * - Password verification with timing-safe comparison
 * - Combined storage format for hash metadata
 * - Building a simple user authentication system
 * - Understanding why passwords need special treatment
 */

const crypto = require('crypto');

console.log('=== Exercise 4: Password Manager - SOLUTION ===\n');

// ============================================================================
// Task 1: Hash password with salt
// ============================================================================
console.log('Task 1: Hash password with PBKDF2');

/**
 * Hashes a password with salt using PBKDF2
 *
 * WHY NOT SIMPLE HASHING?
 * - SHA-256 is TOO FAST (billions of hashes per second)
 * - Attackers can try millions of passwords quickly
 * - Rainbow tables can crack unsalted hashes instantly
 * - PBKDF2 is intentionally SLOW to slow down attacks
 *
 * WHAT IS SALT?
 * - Random data added to password before hashing
 * - Makes each hash unique even for same password
 * - Prevents rainbow table attacks
 * - NOT secret (stored with hash)
 *
 * PBKDF2 PARAMETERS:
 * - iterations: How many times to hash (100,000+ recommended)
 * - keyLength: Output length in bytes (32-64 bytes typical)
 * - digest: Hash algorithm (sha512 recommended)
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations (default 100000)
 * @returns {Object} Object with { hash, salt }
 */
function hashPassword(password, iterations = 100000) {
  // Generate random salt (16 bytes = 128 bits)
  const salt = crypto.randomBytes(16);

  // Use PBKDF2 to hash password with salt
  // Parameters: password, salt, iterations, keyLength, digest
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');

  // Return both hash and salt as hexadecimal strings
  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex')
  };
}

// ALTERNATIVE APPROACH: With configurable parameters
function hashPasswordConfigurable(password, options = {}) {
  const {
    iterations = 100000,
    keyLength = 64,
    digest = 'sha512',
    saltLength = 16
  } = options;

  const salt = crypto.randomBytes(saltLength);
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);

  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex'),
    iterations,
    keyLength,
    digest
  };
}

// ALTERNATIVE APPROACH: With cost factor (for future-proofing)
function hashPasswordWithCost(password, costFactor = 10) {
  // Cost factor determines iterations: 2^costFactor * 1000
  // Cost 10 = 1,024,000 iterations
  // Cost 11 = 2,048,000 iterations
  const iterations = Math.pow(2, costFactor) * 1000;
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');

  return {
    hash: hash.toString('hex'),
    salt: salt.toString('hex'),
    costFactor,
    iterations
  };
}

// Test Task 1
try {
  const password1 = 'mySecurePassword123!';
  const hashed1 = hashPassword(password1);
  const hashed2 = hashPassword(password1); // Same password

  console.log('Password:', password1);
  console.log('Hash:', hashed1.hash.substring(0, 32) + '...');
  console.log('Salt:', hashed1.salt.substring(0, 16) + '...');
  console.log('\nHash length:', hashed1.hash.length, '(expected: 128 chars = 64 bytes × 2)');
  console.log('Salt length:', hashed1.salt.length, '(expected: 32 chars = 16 bytes × 2)');
  console.log('Different salts:', hashed1.salt !== hashed2.salt, '✓');
  console.log('Different hashes:', hashed1.hash !== hashed2.hash, '✓');

  // Test configurable version
  const hashed3 = hashPasswordConfigurable('test', { iterations: 50000 });
  console.log('\nConfigurable version:');
  console.log('  Iterations:', hashed3.iterations);
  console.log('  Key length:', hashed3.keyLength);
  console.log('  Digest:', hashed3.digest);

  // Test cost factor version
  const hashed4 = hashPasswordWithCost('test', 10);
  console.log('\nCost factor version:');
  console.log('  Cost factor:', hashed4.costFactor);
  console.log('  Iterations:', hashed4.iterations.toLocaleString());
  console.log('✓ Task 1 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 2: Verify password
// ============================================================================
console.log('Task 2: Verify password against hash');

/**
 * Verifies a password against stored hash and salt
 *
 * VERIFICATION PROCESS:
 * 1. Hash the provided password with stored salt
 * 2. Compare result with stored hash
 * 3. Use timing-safe comparison (critical!)
 *
 * WHY TIMING-SAFE COMPARISON?
 * - Regular === comparison can leak information
 * - Attacker can measure comparison time
 * - Reveals how many bytes matched
 * - crypto.timingSafeEqual() prevents this
 *
 * SECURITY NOTES:
 * - Same iterations count must be used
 * - Salt must match exactly
 * - Even if password is wrong, don't reveal which part failed
 *
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored password hash
 * @param {string} storedSalt - Stored salt
 * @param {number} iterations - Number of iterations used
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, storedHash, storedSalt, iterations = 100000) {
  try {
    // Convert stored salt from hex to Buffer
    const saltBuffer = Buffer.from(storedSalt, 'hex');

    // Hash the provided password with the stored salt
    const hashBuffer = crypto.pbkdf2Sync(
      password,
      saltBuffer,
      iterations,
      64,
      'sha512'
    );

    // Convert stored hash from hex to Buffer
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(hashBuffer, storedHashBuffer);
  } catch (err) {
    // If anything fails (invalid encoding, etc.), password doesn't match
    return false;
  }
}

// ALTERNATIVE APPROACH: Without timing-safe comparison (INSECURE!)
function verifyPasswordInsecure(password, storedHash, storedSalt, iterations = 100000) {
  const saltBuffer = Buffer.from(storedSalt, 'hex');
  const hashBuffer = crypto.pbkdf2Sync(password, saltBuffer, iterations, 64, 'sha512');
  const computedHash = hashBuffer.toString('hex');

  // ❌ VULNERABLE to timing attacks!
  return computedHash === storedHash;
}

// Test Task 2
try {
  const password = 'correctPassword123';
  const hashed = hashPassword(password);

  const validLogin = verifyPassword(password, hashed.hash, hashed.salt);
  const invalidLogin = verifyPassword('wrongPassword', hashed.hash, hashed.salt);

  console.log('Correct password verified:', validLogin, '✓');
  console.log('Wrong password rejected:', !invalidLogin, '✓');

  // Test edge cases
  const emptyPassword = verifyPassword('', hashed.hash, hashed.salt);
  console.log('Empty password rejected:', !emptyPassword, '✓');

  // Test with invalid salt/hash
  const invalidSalt = verifyPassword(password, hashed.hash, 'invalid');
  console.log('Invalid salt handled:', !invalidSalt, '✓');

  // Demonstrate timing difference (conceptual)
  console.log('\nSecurity note:');
  console.log('  timingSafeEqual() prevents attackers from measuring');
  console.log('  comparison time to guess password characters');
  console.log('✓ Task 2 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 3: Store password in combined format
// ============================================================================
console.log('Task 3: Create combined storage format');

/**
 * Creates a combined hash string with all metadata
 *
 * WHY COMBINED FORMAT?
 * - Easy to store in single database column
 * - Includes all info needed for verification
 * - Can upgrade algorithm later
 * - Self-documenting format
 *
 * FORMAT:
 * algorithm:iterations:salt:hash
 * Example: pbkdf2:100000:abc123...:def456...
 *
 * BENEFITS:
 * - Easy to parse
 * - Version information included
 * - Can support multiple algorithms
 * - Common in password libraries (bcrypt, scrypt)
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations
 * @returns {string} Combined hash string
 */
function createPasswordHash(password, iterations = 100000) {
  // Hash the password
  const { hash, salt } = hashPassword(password, iterations);

  // Combine into single string with format: algorithm:iterations:salt:hash
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

// ALTERNATIVE APPROACH: With version and digest info
function createPasswordHashVersioned(password, iterations = 100000, version = 1) {
  const { hash, salt } = hashPassword(password, iterations);

  // Format: version:algorithm:iterations:digest:salt:hash
  return `v${version}:pbkdf2:${iterations}:sha512:${salt}:${hash}`;
}

// ALTERNATIVE APPROACH: With JSON format (more flexible)
function createPasswordHashJSON(password, iterations = 100000) {
  const { hash, salt } = hashPassword(password, iterations);

  const hashData = {
    algorithm: 'pbkdf2',
    iterations,
    digest: 'sha512',
    salt,
    hash,
    created: new Date().toISOString()
  };

  return JSON.stringify(hashData);
}

// Test Task 3
try {
  const password = 'testPassword456';
  const combined = createPasswordHash(password, 50000);

  console.log('Combined format:', combined.substring(0, 50) + '...');

  const parts = combined.split(':');
  console.log('\nParsed parts:');
  console.log('  Has 4 parts:', parts.length === 4, '✓');
  console.log('  Algorithm:', parts[0], '(expected: pbkdf2)');
  console.log('  Iterations:', parts[1], '(expected: 50000)');
  console.log('  Salt:', parts[2].substring(0, 10) + '...');
  console.log('  Hash:', parts[3].substring(0, 10) + '...');

  // Test versioned format
  const versioned = createPasswordHashVersioned('test', 100000);
  console.log('\nVersioned format:', versioned.substring(0, 50) + '...');
  console.log('Starts with version:', versioned.startsWith('v1:'), '✓');

  // Test JSON format
  const jsonFormat = createPasswordHashJSON('test', 100000);
  const parsed = JSON.parse(jsonFormat);
  console.log('\nJSON format:', {
    algorithm: parsed.algorithm,
    iterations: parsed.iterations,
    created: parsed.created
  });
  console.log('✓ Task 3 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 4: Verify combined format password
// ============================================================================
console.log('Task 4: Verify password from combined format');

/**
 * Verifies a password from combined hash string
 *
 * PARSING PROCESS:
 * 1. Split combined string by ':'
 * 2. Extract algorithm, iterations, salt, hash
 * 3. Verify password using extracted values
 * 4. Return true if matches
 *
 * ERROR HANDLING:
 * - Invalid format returns false
 * - Unknown algorithm returns false
 * - Corrupted data returns false
 *
 * @param {string} password - Password to verify
 * @param {string} combinedHash - Combined hash string
 * @returns {boolean} True if password matches
 */
function verifyPasswordFromHash(password, combinedHash) {
  try {
    // Split combined string
    const parts = combinedHash.split(':');

    if (parts.length !== 4) {
      return false; // Invalid format
    }

    const [algorithm, iterationsStr, salt, hash] = parts;

    // Verify algorithm is supported
    if (algorithm !== 'pbkdf2') {
      return false; // Unknown algorithm
    }

    // Parse iterations
    const iterations = parseInt(iterationsStr, 10);

    if (isNaN(iterations) || iterations < 1) {
      return false; // Invalid iterations
    }

    // Verify password
    return verifyPassword(password, hash, salt, iterations);
  } catch (err) {
    return false; // Any error means verification failed
  }
}

// ALTERNATIVE APPROACH: With detailed result
function verifyPasswordFromHashDetailed(password, combinedHash) {
  try {
    const parts = combinedHash.split(':');

    if (parts.length !== 4) {
      return {
        valid: false,
        reason: 'Invalid format',
        expected: 'algorithm:iterations:salt:hash'
      };
    }

    const [algorithm, iterationsStr, salt, hash] = parts;

    if (algorithm !== 'pbkdf2') {
      return {
        valid: false,
        reason: 'Unsupported algorithm',
        algorithm
      };
    }

    const iterations = parseInt(iterationsStr, 10);
    const valid = verifyPassword(password, hash, salt, iterations);

    return {
      valid,
      reason: valid ? 'Password verified' : 'Password mismatch',
      algorithm,
      iterations
    };
  } catch (err) {
    return {
      valid: false,
      reason: 'Verification error',
      error: err.message
    };
  }
}

// Test Task 4
try {
  const password = 'myPassword789';
  const stored = createPasswordHash(password);

  const valid = verifyPasswordFromHash(password, stored);
  const invalid = verifyPasswordFromHash('wrongPassword', stored);

  console.log('Correct password:', valid, '✓');
  console.log('Wrong password:', invalid, '(correctly rejected)');

  // Test detailed version
  const detailedValid = verifyPasswordFromHashDetailed(password, stored);
  const detailedInvalid = verifyPasswordFromHashDetailed('wrong', stored);

  console.log('\nDetailed verification (correct):', detailedValid);
  console.log('Detailed verification (wrong):', detailedInvalid);

  // Test error handling
  const invalidFormat = verifyPasswordFromHash('test', 'invalid:format');
  console.log('\nInvalid format handled:', !invalidFormat, '✓');

  const unknownAlgo = verifyPasswordFromHash('test', 'unknown:100000:abc:def');
  console.log('Unknown algorithm handled:', !unknownAlgo, '✓');
  console.log('✓ Task 4 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Task 5: User authentication system
// ============================================================================
console.log('Task 5: User authentication system');

/**
 * Complete password manager with user registration and authentication
 *
 * FEATURES:
 * - User registration with unique usernames
 * - Secure password storage
 * - Authentication with password verification
 * - Password change with old password verification
 * - User management
 *
 * SECURITY PRACTICES:
 * - Never store plaintext passwords
 * - Always hash with salt
 * - Verify old password before allowing change
 * - Prevent duplicate usernames
 * - Use timing-safe comparisons
 */
class PasswordManager {
  constructor() {
    // Store users: username -> hashedPassword
    this.users = new Map();
    this.iterations = 100000;
  }

  /**
   * Register new user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {boolean} True if registration successful
   */
  register(username, password) {
    // Validate inputs
    if (!username || !password) {
      return false;
    }

    // Check if user already exists
    if (this.users.has(username)) {
      return false; // User already exists
    }

    // Hash password
    const hashedPassword = createPasswordHash(password, this.iterations);

    // Store user
    this.users.set(username, hashedPassword);

    return true;
  }

  /**
   * Authenticate user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {boolean} True if authentication successful
   */
  authenticate(username, password) {
    // Check if user exists
    if (!this.users.has(username)) {
      return false; // User not found
    }

    // Get stored hash
    const storedHash = this.users.get(username);

    // Verify password
    return verifyPasswordFromHash(password, storedHash);
  }

  /**
   * Change user password
   * @param {string} username - Username
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} True if password changed
   */
  changePassword(username, oldPassword, newPassword) {
    // First authenticate with old password
    if (!this.authenticate(username, oldPassword)) {
      return false; // Old password incorrect
    }

    // Hash new password
    const hashedPassword = createPasswordHash(newPassword, this.iterations);

    // Update stored password
    this.users.set(username, hashedPassword);

    return true;
  }

  /**
   * Get user count
   * @returns {number} Number of registered users
   */
  getUserCount() {
    return this.users.size;
  }

  /**
   * Delete user
   * @param {string} username - Username
   * @returns {boolean} True if user deleted
   */
  deleteUser(username) {
    return this.users.delete(username);
  }

  /**
   * Get all usernames
   * @returns {Array} Array of usernames
   */
  getUsernames() {
    return Array.from(this.users.keys());
  }
}

// ALTERNATIVE APPROACH: Enhanced with additional features
class PasswordManagerAdvanced extends PasswordManager {
  constructor() {
    super();
    this.metadata = new Map(); // Store additional user data
    this.loginAttempts = new Map(); // Track failed login attempts
    this.maxAttempts = 5;
  }

  /**
   * Register with additional metadata
   */
  registerWithMetadata(username, password, metadata = {}) {
    if (!this.register(username, password)) {
      return false;
    }

    this.metadata.set(username, {
      ...metadata,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      passwordChangedAt: new Date().toISOString()
    });

    this.loginAttempts.set(username, 0);
    return true;
  }

  /**
   * Authenticate with rate limiting
   */
  authenticateWithRateLimit(username, password) {
    // Check failed attempts
    const attempts = this.loginAttempts.get(username) || 0;
    if (attempts >= this.maxAttempts) {
      return {
        success: false,
        reason: 'Account locked due to too many failed attempts'
      };
    }

    // Attempt authentication
    const success = this.authenticate(username, password);

    if (success) {
      // Reset attempts on success
      this.loginAttempts.set(username, 0);

      // Update metadata
      const meta = this.metadata.get(username);
      if (meta) {
        meta.lastLogin = new Date().toISOString();
      }

      return { success: true };
    } else {
      // Increment attempts on failure
      this.loginAttempts.set(username, attempts + 1);

      return {
        success: false,
        reason: 'Invalid credentials',
        attemptsRemaining: this.maxAttempts - attempts - 1
      };
    }
  }

  /**
   * Get user metadata
   */
  getUserMetadata(username) {
    return this.metadata.get(username);
  }

  /**
   * Reset failed login attempts
   */
  resetAttempts(username) {
    this.loginAttempts.set(username, 0);
  }
}

// Test Task 5
try {
  const manager = new PasswordManager();

  // Register users
  const reg1 = manager.register('alice', 'alicePassword123');
  const reg2 = manager.register('bob', 'bobPassword456');
  const reg3 = manager.register('alice', 'differentPassword'); // Duplicate

  console.log('Alice registered:', reg1, '✓');
  console.log('Bob registered:', reg2, '✓');
  console.log('Duplicate rejected:', !reg3, '✓');
  console.log('User count:', manager.getUserCount(), '(expected: 2)');

  // Authenticate
  const auth1 = manager.authenticate('alice', 'alicePassword123');
  const auth2 = manager.authenticate('alice', 'wrongPassword');
  const auth3 = manager.authenticate('charlie', 'anyPassword');

  console.log('\nValid login:', auth1, '✓');
  console.log('Invalid password:', auth2, '(correctly rejected)');
  console.log('Unknown user:', auth3, '(correctly rejected)');

  // Change password
  const change1 = manager.changePassword('alice', 'alicePassword123', 'newPassword999');
  const change2 = manager.changePassword('alice', 'alicePassword123', 'another'); // Old password wrong now
  const auth4 = manager.authenticate('alice', 'newPassword999');

  console.log('\nPassword changed:', change1, '✓');
  console.log('Old password fails:', !change2, '✓');
  console.log('New password works:', auth4, '✓');

  // Test advanced version
  console.log('\n--- Advanced Manager ---');
  const advManager = new PasswordManagerAdvanced();

  advManager.registerWithMetadata('user1', 'pass123', {
    email: 'user1@example.com',
    role: 'admin'
  });

  // Test rate limiting
  for (let i = 0; i < 6; i++) {
    const result = advManager.authenticateWithRateLimit('user1', 'wrongpass');
    console.log(`Attempt ${i + 1}:`, result.success ? 'Success' : result.reason);
  }

  const metadata = advManager.getUserMetadata('user1');
  console.log('\nUser metadata:', metadata);
  console.log('✓ Task 5 Complete\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// ============================================================================
// Bonus Challenge: Async password hashing
// ============================================================================
console.log('Bonus Challenge: Async password hashing');

/**
 * Asynchronous password hashing
 *
 * WHY ASYNC?
 * - PBKDF2 is CPU-intensive (intentionally slow)
 * - Sync version blocks event loop
 * - Async allows other operations to continue
 * - Better for web servers (don't block requests)
 *
 * WHEN TO USE:
 * - Web applications (Express, etc.)
 * - High-traffic scenarios
 * - When blocking is problematic
 *
 * TRADE-OFFS:
 * - More complex code (Promises/async-await)
 * - Slightly more overhead
 * - Better overall performance in servers
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations
 * @returns {Promise<Object>} Promise resolving to { hash, salt }
 */
async function hashPasswordAsync(password, iterations = 100000) {
  return new Promise((resolve, reject) => {
    // Generate random salt
    const salt = crypto.randomBytes(16);

    // Use async version of pbkdf2
    crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({
        hash: derivedKey.toString('hex'),
        salt: salt.toString('hex')
      });
    });
  });
}

// ALTERNATIVE APPROACH: Using util.promisify
async function hashPasswordAsyncPromisify(password, iterations = 100000) {
  const util = require('util');
  const pbkdf2Async = util.promisify(crypto.pbkdf2);

  const salt = crypto.randomBytes(16);
  const derivedKey = await pbkdf2Async(password, salt, iterations, 64, 'sha512');

  return {
    hash: derivedKey.toString('hex'),
    salt: salt.toString('hex')
  };
}

// Test Bonus
(async () => {
  try {
    console.log('Testing async hashing...');

    const password = 'asyncPassword';

    // Test Promise-based version
    const result1 = await hashPasswordAsync(password);
    console.log('Async hash created:', !!result1.hash, '✓');
    console.log('Has salt:', !!result1.salt, '✓');

    // Test promisify version
    const result2 = await hashPasswordAsyncPromisify(password);
    console.log('Promisify version works:', !!result2.hash, '✓');

    // Demonstrate non-blocking nature
    console.log('\nDemonstrating async behavior:');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(hashPasswordAsync(`password${i}`));
      console.log(`  Started hashing password ${i}`);
    }

    const results = await Promise.all(promises);
    console.log(`  All ${results.length} hashes completed ✓`);

    console.log('✓ Bonus Complete\n');
  } catch (err) {
    console.log('✗ Error:', err.message, '\n');
  }

  // ============================================================================
  // Additional Examples: Best Practices
  // ============================================================================
  console.log('=== Best Practices & Additional Examples ===\n');

  // Example 1: Password strength validator
  function validatePasswordStrength(password) {
    const checks = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;

    return {
      valid: strength >= 4,
      strength: strength >= 4 ? 'strong' : strength >= 3 ? 'medium' : 'weak',
      checks
    };
  }

  // Example 2: Password migration (upgrading iterations)
  function shouldUpgradePassword(combinedHash, targetIterations = 100000) {
    const parts = combinedHash.split(':');
    if (parts.length !== 4) return false;

    const currentIterations = parseInt(parts[1], 10);
    return currentIterations < targetIterations;
  }

  function upgradePassword(username, password, oldHash, manager) {
    // Verify old password first
    if (!verifyPasswordFromHash(password, oldHash)) {
      return false;
    }

    // Create new hash with higher iterations
    const newHash = createPasswordHash(password, 200000);

    // Update storage
    manager.users.set(username, newHash);

    return true;
  }

  // Example 3: Secure password comparison for admin reset
  function generatePasswordResetToken(username) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes

    return {
      username,
      token,
      expires,
      signature: crypto
        .createHmac('sha256', 'server-secret')
        .update(`${username}:${token}:${expires}`)
        .digest('hex')
    };
  }

  // Test examples
  console.log('1. Password strength:');
  console.log('   "password":', validatePasswordStrength('password').strength);
  console.log('   "Pass123!":', validatePasswordStrength('Pass123!').strength);

  console.log('\n2. Should upgrade:', shouldUpgradePassword('pbkdf2:50000:abc:def'));

  console.log('\n3. Reset token:', {
    token: generatePasswordResetToken('alice').token.substring(0, 20) + '...',
    expires: 'in 15 minutes'
  });

  console.log('\n=== Exercise 4 Complete ===');
  console.log('\nKey Takeaways:');
  console.log('✓ NEVER use simple hashing (SHA-256) for passwords');
  console.log('✓ ALWAYS use PBKDF2, bcrypt, or Argon2 for passwords');
  console.log('✓ Each password MUST have a unique random salt');
  console.log('✓ Store both salt and hash (they\'re not secret)');
  console.log('✓ Use high iteration counts (100,000+ for PBKDF2)');
  console.log('✓ ALWAYS use timing-safe comparison to prevent timing attacks');
  console.log('✓ Async hashing is better for web servers (non-blocking)');
  console.log('✓ Consider password strength requirements');
  console.log('✓ Support password upgrades (increasing iterations over time)');
  console.log('✓ Never log or expose password hashes');
})();
