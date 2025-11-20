/**
 * Password Hashing Examples
 *
 * Demonstrates secure password hashing using pbkdf2.
 * NEVER store passwords in plain text!
 */

const crypto = require('crypto');

console.log('=== Password Hashing Examples ===\n');

// Example 1: Basic Password Hashing with PBKDF2
console.log('1. Basic Password Hashing with PBKDF2:');
const password = 'userPassword123';
const salt = crypto.randomBytes(16).toString('hex');

crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;

  const hash = derivedKey.toString('hex');
  console.log('Password:', password);
  console.log('Salt:    ', salt);
  console.log('Hash:    ', hash);
  console.log('Hash length:', hash.length, 'characters');
  console.log();
});

// Example 2: Synchronous Password Hashing
console.log('2. Synchronous Password Hashing:');
function hashPasswordSync(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return {
    salt: salt,
    hash: hash.toString('hex')
  };
}

const result = hashPasswordSync('mySecurePassword');
console.log('Password: mySecurePassword');
console.log('Salt:', result.salt);
console.log('Hash:', result.hash);
console.log();

// Example 3: Storing Password (Combined Format)
console.log('3. Storing Password (Combined Format):');
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

  // Store salt and hash together, separated by ':'
  return `${salt}:${hash}`;
}

const storedPassword = hashPassword('userPassword123');
console.log('Password: userPassword123');
console.log('Stored format:', storedPassword);
console.log('Format: salt:hash');
console.log();

// Example 4: Verifying Password
console.log('4. Verifying Password:');
function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

console.log('Stored hash:', storedPassword);
console.log('Verify "userPassword123":', verifyPassword('userPassword123', storedPassword) ? '✓ Correct' : '✗ Wrong');
console.log('Verify "wrongPassword":', verifyPassword('wrongPassword', storedPassword) ? '✓ Correct' : '✗ Wrong');
console.log();

// Example 5: Complete Password Auth System
console.log('5. Complete Password Auth System:');
class PasswordAuth {
  static hash(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');

      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        const hash = derivedKey.toString('hex');
        resolve(`${salt}:${hash}`);
      });
    });
  }

  static verify(password, storedHash) {
    return new Promise((resolve, reject) => {
      const [salt, hash] = storedHash.split(':');

      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        const verifyHash = derivedKey.toString('hex');
        resolve(hash === verifyHash);
      });
    });
  }
}

// Usage
PasswordAuth.hash('securePassword123').then(hash => {
  console.log('Hashed password:', hash);

  PasswordAuth.verify('securePassword123', hash).then(isValid => {
    console.log('Correct password:', isValid ? '✓' : '✗');
  });

  PasswordAuth.verify('wrongPassword', hash).then(isValid => {
    console.log('Wrong password:', isValid ? '✓' : '✗');
  });
});
console.log();

// Example 6: Different Passwords = Different Hashes
console.log('6. Different Passwords = Different Hashes:');
const pass1 = hashPassword('password1');
const pass2 = hashPassword('password2');
const pass3 = hashPassword('password1'); // Same as pass1 but different salt

console.log('password1 (hash 1):', pass1);
console.log('password2:         ', pass2);
console.log('password1 (hash 2):', pass3);
console.log('Notice: Same password can have different hashes (due to different salts)');
console.log();

// Example 7: Iteration Count Impact
console.log('7. Iteration Count Impact:');
function testIterations(password, iterations) {
  const salt = 'same-salt-for-testing';
  const start = Date.now();
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  const end = Date.now();

  return {
    iterations,
    time: end - start,
    hash: hash.toString('hex').substring(0, 32) + '...'
  };
}

const testPass = 'testPassword';
console.log('Password:', testPass);
console.log('1,000 iterations:  ', testIterations(testPass, 1000).time, 'ms');
console.log('10,000 iterations: ', testIterations(testPass, 10000).time, 'ms');
console.log('100,000 iterations:', testIterations(testPass, 100000).time, 'ms');
console.log('Notice: Higher iterations = slower (more secure against brute force)');
console.log();

// Example 8: Why Salt Matters
console.log('8. Why Salt Matters:');
function hashWithoutSalt(password) {
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  return hash;
}

const commonPassword = 'password123';
const noSalt1 = hashWithoutSalt(commonPassword);
const noSalt2 = hashWithoutSalt(commonPassword);

console.log('❌ WITHOUT SALT:');
console.log('User 1 hash:', noSalt1);
console.log('User 2 hash:', noSalt2);
console.log('Problem: Same password = same hash (vulnerable to rainbow tables!)');

console.log('\n✅ WITH SALT:');
const withSalt1 = hashPassword(commonPassword);
const withSalt2 = hashPassword(commonPassword);
console.log('User 1 hash:', withSalt1);
console.log('User 2 hash:', withSalt2);
console.log('Secure: Same password = different hashes');
console.log();

// Example 9: User Registration Simulation
console.log('9. User Registration Simulation:');
const users = [];

function registerUser(username, password) {
  const passwordHash = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  return user;
}

const user1 = registerUser('alice', 'alicePassword123');
const user2 = registerUser('bob', 'bobPassword456');

console.log('Registered users:');
console.log('User 1:', { id: user1.id, username: user1.username });
console.log('  Hash:', user1.passwordHash);
console.log('User 2:', { id: user2.id, username: user2.username });
console.log('  Hash:', user2.passwordHash);
console.log();

// Example 10: User Login Simulation
console.log('10. User Login Simulation:');
function loginUser(username, password) {
  const user = users.find(u => u.username === username);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const isValid = verifyPassword(password, user.passwordHash);

  if (isValid) {
    return { success: true, user: { id: user.id, username: user.username } };
  } else {
    return { success: false, message: 'Invalid password' };
  }
}

console.log('Login attempt 1 (alice, correct password):');
console.log(loginUser('alice', 'alicePassword123'));

console.log('\nLogin attempt 2 (alice, wrong password):');
console.log(loginUser('alice', 'wrongPassword'));

console.log('\nLogin attempt 3 (charlie, non-existent user):');
console.log(loginUser('charlie', 'anyPassword'));
console.log();

// Example 11: Password Strength Impact
console.log('11. Password Strength Impact:');
const weakPass = hashPassword('123456');
const mediumPass = hashPassword('Password123');
const strongPass = hashPassword('P@ssw0rd!2023#Secure');

console.log('Weak password hash:  ', weakPass);
console.log('Medium password hash:', mediumPass);
console.log('Strong password hash:', strongPass);
console.log('Notice: Hash length is same, but stronger passwords resist brute force better');
console.log();

// Example 12: Different Hash Algorithms
console.log('12. Different Hash Algorithms:');
function hashWithAlgorithm(password, algorithm) {
  const salt = 'test-salt';
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, algorithm);
  return hash.toString('hex');
}

const testPassword = 'testPass123';
console.log('Password:', testPassword);
console.log('SHA-256:', hashWithAlgorithm(testPassword, 'sha256').substring(0, 40) + '...');
console.log('SHA-512:', hashWithAlgorithm(testPassword, 'sha512').substring(0, 40) + '...');
console.log('Recommended: SHA-512 for password hashing');
console.log();

// Example 13: Async vs Sync Performance
console.log('13. Async vs Sync Performance:');
const iterations = 100000;
const testSalt = crypto.randomBytes(16);

console.log('Hashing password with', iterations, 'iterations...');

// Synchronous (blocks)
const syncStart = Date.now();
const syncHash = crypto.pbkdf2Sync('password', testSalt, iterations, 64, 'sha512');
const syncEnd = Date.now();
console.log('Synchronous: ', syncEnd - syncStart, 'ms');

// Asynchronous (non-blocking)
const asyncStart = Date.now();
crypto.pbkdf2('password', testSalt, iterations, 64, 'sha512', (err, asyncHash) => {
  const asyncEnd = Date.now();
  console.log('Asynchronous:', asyncEnd - asyncStart, 'ms');
  console.log('Recommendation: Use async in production to avoid blocking');
});
console.log();

// Example 14: Memory Cost Consideration
console.log('14. Recommended PBKDF2 Settings (2023):');
console.log('Algorithm: SHA-512');
console.log('Salt length: 16 bytes (128 bits)');
console.log('Iterations: 100,000 minimum (OWASP recommends 310,000 for SHA-256)');
console.log('Output length: 64 bytes (512 bits)');
console.log();

// Example 15: Common Mistakes
console.log('15. Common Mistakes to Avoid:');
console.log('❌ Storing plain text passwords');
console.log('❌ Using simple hashing (MD5, SHA-256) without salt');
console.log('❌ Reusing the same salt for all passwords');
console.log('❌ Using too few iterations (<100,000)');
console.log('❌ Not handling errors in async operations');
console.log('');
console.log('✅ Use pbkdf2 or scrypt with unique salt per password');
console.log('✅ Use high iteration count (100,000+)');
console.log('✅ Store salt with the hash');
console.log('✅ Use strong hash algorithms (SHA-512)');
console.log('✅ Handle errors properly');
