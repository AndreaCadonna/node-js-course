/**
 * Exercise 4: Password Manager
 *
 * OBJECTIVE:
 * Learn to securely hash and verify passwords using PBKDF2 with salt.
 *
 * REQUIREMENTS:
 * 1. Hash passwords with salt using PBKDF2
 * 2. Verify passwords against stored hashes
 * 3. Understand salt generation and storage
 * 4. Implement proper password storage format
 * 5. Build a simple user authentication system
 *
 * LEARNING GOALS:
 * - Understanding why passwords need special hashing
 * - Using crypto.pbkdf2() for password hashing
 * - Understanding salt and why it's important
 * - Understanding iterations and key length
 * - Implementing secure password verification
 * - Understanding the difference between hashing and encryption
 */

const crypto = require('crypto');

console.log('=== Exercise 4: Password Manager ===\n');

// Task 1: Hash password with salt
console.log('Task 1: Hash password with PBKDF2');
/**
 * TODO 1: Implement function to hash password with salt
 *
 * Steps:
 * 1. Generate random salt using crypto.randomBytes()
 * 2. Use crypto.pbkdf2Sync() to hash password with salt
 * 3. Convert hash to hexadecimal string
 * 4. Return object with hash and salt
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations (default 100000)
 * @returns {Object} Object with { hash, salt }
 *
 * Hint: crypto.randomBytes(16) for salt
 * Hint: crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest)
 * Hint: Use 64 bytes for keyLength, 'sha512' for digest
 */
function hashPassword(password, iterations = 100000) {
  // Your code here
}

// Test Task 1
try {
  const password1 = 'mySecurePassword123!';
  const hashed1 = hashPassword(password1);
  const hashed2 = hashPassword(password1); // Same password

  console.log('Password:', password1);
  console.log('Hash:', hashed1?.hash?.substring(0, 32) + '...');
  console.log('Salt:', hashed1?.salt?.substring(0, 16) + '...');
  console.log('Hash length:', hashed1?.hash?.length || 0, '(expected: 128)');
  console.log('Salt length:', hashed1?.salt?.length || 0, '(expected: 32)');
  console.log('Different salts:', hashed1?.salt !== hashed2?.salt, '(should be true)');
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Verify password
console.log('Task 2: Verify password against hash');
/**
 * TODO 2: Implement function to verify password
 *
 * Steps:
 * 1. Hash the provided password with the stored salt
 * 2. Compare the result with stored hash
 * 3. Use timing-safe comparison
 * 4. Return true if passwords match
 *
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored password hash
 * @param {string} storedSalt - Stored salt
 * @param {number} iterations - Number of iterations used
 * @returns {boolean} True if password matches
 *
 * Hint: Hash password with storedSalt the same way as hashPassword
 * Hint: Use crypto.timingSafeEqual() to compare hashes
 * Hint: Convert hex strings to Buffer for comparison
 */
function verifyPassword(password, storedHash, storedSalt, iterations = 100000) {
  // Your code here
}

// Test Task 2
try {
  const password = 'correctPassword123';
  const hashed = hashPassword(password);

  const validLogin = verifyPassword(password, hashed?.hash || '', hashed?.salt || '');
  const invalidLogin = verifyPassword('wrongPassword', hashed?.hash || '', hashed?.salt || '');

  console.log('Correct password verified:', validLogin, '(should be true)');
  console.log('Wrong password rejected:', !invalidLogin, '(should be true)');
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Store password in combined format
console.log('Task 3: Create combined storage format');
/**
 * TODO 3: Implement function to create combined hash string
 *
 * Steps:
 * 1. Hash the password
 * 2. Combine algorithm, iterations, salt, and hash into single string
 * 3. Use format: algorithm:iterations:salt:hash
 * 4. Return the combined string
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations
 * @returns {string} Combined hash string
 *
 * Example format: "pbkdf2:100000:salt_here:hash_here"
 *
 * Hint: Use hashPassword from Task 1
 * Hint: Template literal: `pbkdf2:${iterations}:${salt}:${hash}`
 */
function createPasswordHash(password, iterations = 100000) {
  // Your code here
}

// Test Task 3
try {
  const password = 'testPassword456';
  const combined = createPasswordHash(password, 50000);

  console.log('Combined format:', combined?.substring(0, 50) + '...');
  const parts = combined?.split(':') || [];
  console.log('Has 4 parts:', parts.length === 4, '(should be true)');
  console.log('Algorithm:', parts[0], '(expected: pbkdf2)');
  console.log('Iterations:', parts[1], '(expected: 50000)');
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Verify combined format password
console.log('Task 4: Verify password from combined format');
/**
 * TODO 4: Implement function to verify password from combined hash
 *
 * Steps:
 * 1. Parse the combined hash string
 * 2. Extract algorithm, iterations, salt, and hash
 * 3. Verify the password using extracted values
 * 4. Return true if password matches
 *
 * @param {string} password - Password to verify
 * @param {string} combinedHash - Combined hash string (from createPasswordHash)
 * @returns {boolean} True if password matches
 *
 * Hint: Split by ':' to get parts
 * Hint: Parts are: [algorithm, iterations, salt, hash]
 * Hint: Convert iterations to number: parseInt()
 */
function verifyPasswordFromHash(password, combinedHash) {
  // Your code here
}

// Test Task 4
try {
  const password = 'myPassword789';
  const stored = createPasswordHash(password);

  const valid = verifyPasswordFromHash(password, stored || '');
  const invalid = verifyPasswordFromHash('wrongPassword', stored || '');

  console.log('Correct password:', valid, '(should be true)');
  console.log('Wrong password:', invalid, '(should be false)');
  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: User authentication system
console.log('Task 5: User authentication system');
/**
 * TODO 5: Implement PasswordManager class
 *
 * This simulates a simple user authentication system
 */
class PasswordManager {
  constructor() {
    // TODO: Initialize storage for users
    // Use Map or object to store: username -> hashedPassword
  }

  /**
   * TODO: Register new user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {boolean} True if registration successful
   *
   * Hint: Check if user already exists
   * Hint: Hash password using createPasswordHash
   * Hint: Store in this.users
   */
  register(username, password) {
    // Your code here
  }

  /**
   * TODO: Authenticate user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {boolean} True if authentication successful
   *
   * Hint: Check if user exists
   * Hint: Verify password using verifyPasswordFromHash
   */
  authenticate(username, password) {
    // Your code here
  }

  /**
   * TODO: Change user password
   * @param {string} username - Username
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} True if password changed
   *
   * Hint: First authenticate with old password
   * Hint: Then hash and store new password
   */
  changePassword(username, oldPassword, newPassword) {
    // Your code here
  }

  /**
   * TODO: Get user count
   * @returns {number} Number of registered users
   */
  getUserCount() {
    // Your code here
  }
}

// Test Task 5
try {
  const manager = new PasswordManager();

  // Register users
  const reg1 = manager.register('alice', 'alicePassword123');
  const reg2 = manager.register('bob', 'bobPassword456');
  const reg3 = manager.register('alice', 'differentPassword'); // Duplicate

  console.log('Alice registered:', reg1, '(should be true)');
  console.log('Bob registered:', reg2, '(should be true)');
  console.log('Duplicate rejected:', !reg3, '(should be true)');
  console.log('User count:', manager.getUserCount(), '(expected: 2)');

  // Authenticate
  const auth1 = manager.authenticate('alice', 'alicePassword123');
  const auth2 = manager.authenticate('alice', 'wrongPassword');
  const auth3 = manager.authenticate('charlie', 'anyPassword');

  console.log('Valid login:', auth1, '(should be true)');
  console.log('Invalid password:', auth2, '(should be false)');
  console.log('Unknown user:', auth3, '(should be false)');

  // Change password
  const change1 = manager.changePassword('alice', 'alicePassword123', 'newPassword999');
  const change2 = manager.changePassword('alice', 'alicePassword123', 'another'); // Old password wrong now
  const auth4 = manager.authenticate('alice', 'newPassword999');

  console.log('Password changed:', change1, '(should be true)');
  console.log('Old password fails:', !change2, '(should be true)');
  console.log('New password works:', auth4, '(should be true)');
  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenge: Async password hashing
console.log('Bonus Challenge: Async password hashing');
/**
 * TODO BONUS: Implement async password hashing
 *
 * Steps:
 * 1. Use crypto.pbkdf2() (async version, not Sync)
 * 2. Return a Promise
 * 3. Handle errors properly
 *
 * @param {string} password - Password to hash
 * @param {number} iterations - Number of iterations
 * @returns {Promise<Object>} Promise resolving to { hash, salt }
 *
 * Hint: Wrap crypto.pbkdf2 callback in Promise
 * Hint: crypto.pbkdf2(password, salt, iterations, keyLen, digest, callback)
 */
async function hashPasswordAsync(password, iterations = 100000) {
  // Your code here
  // Return new Promise((resolve, reject) => { ... })
}

// Test Bonus
(async () => {
  try {
    const password = 'asyncPassword';
    const result = await hashPasswordAsync(password);

    console.log('Async hash created:', !!result?.hash);
    console.log('Has salt:', !!result?.salt);
    console.log('✓ Bonus implementation needed\n');
  } catch (err) {
    console.log('✗ Error:', err.message, '\n');
  }

  console.log('=== Exercise 4 Complete ===');
  console.log('Implement all functions and run again to test your solutions!');
  console.log('\nKey Takeaways:');
  console.log('- NEVER use simple hashing (SHA-256) for passwords');
  console.log('- Always use PBKDF2, bcrypt, or Argon2 for passwords');
  console.log('- Each password must have a unique random salt');
  console.log('- Store both salt and hash (they\'re not secret)');
  console.log('- Use high iteration counts (100,000+) for security');
  console.log('- Use timing-safe comparison to prevent timing attacks');
})();
