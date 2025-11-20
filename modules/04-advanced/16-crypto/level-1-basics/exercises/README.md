# Level 1 Exercises: Crypto Basics

Practice cryptographic operations with these hands-on exercises. Each exercise builds your understanding of essential crypto concepts and techniques.

## Overview

These exercises cover the fundamental cryptographic operations you'll use in real-world Node.js applications:

- **Hashing** - Create and verify data integrity
- **Random Generation** - Generate secure tokens and IDs
- **HMAC** - Authenticate messages
- **Password Hashing** - Securely store passwords
- **Encryption** - Protect confidential data

## Exercises

### Exercise 1: File Integrity Checker
**File:** `exercise-1.js`

Build a system to verify file integrity using cryptographic hashes.

**What you'll practice:**
- Creating hashes with `crypto.createHash()`
- Using different hash algorithms (SHA-256, SHA-512)
- Verifying data integrity by comparing hashes
- Detecting data tampering
- Working with hash digests in various formats
- Understanding hash properties (deterministic, one-way)

**Skills covered:**
- Hash function basics
- Integrity verification
- Data comparison techniques
- Streaming hash updates

**Key concepts:**
- Same input always produces same hash
- Tiny changes produce completely different hashes
- Hashes are one-way (cannot reverse)
- Different algorithms produce different lengths

---

### Exercise 2: Secure Token Generator
**File:** `exercise-2.js`

Create a token generation system for session IDs, API keys, and unique identifiers.

**What you'll practice:**
- Generating random bytes with `crypto.randomBytes()`
- Creating UUIDs with `crypto.randomUUID()`
- Generating random numbers with `crypto.randomInt()`
- Formatting tokens for different use cases
- Creating session tokens with expiration

**Skills covered:**
- Cryptographic randomness
- Token generation strategies
- UUID creation
- Secure random number generation
- Token formatting (hex, base64, URL-safe)

**Key concepts:**
- Never use `Math.random()` for security
- Tokens should be cryptographically random
- Different formats serve different purposes
- Proper token length is crucial (16-32 bytes minimum)

---

### Exercise 3: Message Authenticator
**File:** `exercise-3.js`

Implement HMAC-based message authentication for APIs and webhooks.

**What you'll practice:**
- Creating HMACs with `crypto.createHmac()`
- Verifying message authenticity
- Detecting message tampering
- Using timing-safe comparison
- Building signed API requests
- Implementing webhook verification

**Skills covered:**
- HMAC creation and verification
- Message authentication
- API request signing
- Webhook security
- Timing attack prevention

**Key concepts:**
- HMAC provides both integrity AND authenticity
- Requires a secret key (unlike simple hashing)
- Include timestamps to prevent replay attacks
- Use `crypto.timingSafeEqual()` for comparison

---

### Exercise 4: Password Manager
**File:** `exercise-4.js`

Build a secure password hashing and verification system using PBKDF2.

**What you'll practice:**
- Hashing passwords with `crypto.pbkdf2()`
- Generating and using salts
- Verifying passwords securely
- Storing password hashes properly
- Building user authentication systems

**Skills covered:**
- Password hashing with PBKDF2
- Salt generation and management
- Secure password verification
- Password storage formats
- Timing-safe password comparison

**Key concepts:**
- Never use simple hashes (SHA-256) for passwords
- Every password needs a unique random salt
- Use high iteration counts (100,000+)
- Store both hash and salt (they're not secret)
- Password hashing is different from regular hashing

---

### Exercise 5: Simple Encryption Tool
**File:** `exercise-5.js`

Create a text encryption and decryption utility using AES-256.

**What you'll practice:**
- Encrypting with `crypto.createCipheriv()`
- Decrypting with `crypto.createDecipheriv()`
- Working with encryption keys and IVs
- Deriving keys from passwords using PBKDF2
- Building complete encryption utilities

**Skills covered:**
- Symmetric encryption (AES-256-CBC)
- Key and IV management
- Password-based encryption
- Encryption/decryption workflows
- Proper data formatting

**Key concepts:**
- Encryption is reversible (unlike hashing)
- Never reuse IVs with the same key
- IV and salt are not secret (store with encrypted data)
- Use password derivation for password-based encryption
- Encryption protects confidentiality, hashing verifies integrity

---

## How to Complete

### Step 1: Read the Exercise File
Each exercise file contains:
- Clear objective and requirements
- Learning goals
- Multiple tasks with TODO comments
- Helpful hints and comments
- Test code to verify your implementation

### Step 2: Implement the TODOs
- Read each task description carefully
- Implement the function or class method
- Use the hints provided
- Don't look at solutions immediately

### Step 3: Run and Test
```bash
node exercise-1.js
node exercise-2.js
node exercise-3.js
node exercise-4.js
node exercise-5.js
```

### Step 4: Verify Output
- Check if your output matches the expected results
- Test edge cases
- Make sure error handling works

### Step 5: Review Solutions
After attempting each exercise:
- Compare with the solution file in `../solutions/`
- Understand different approaches
- Note best practices

---

## Learning Objectives

After completing these exercises, you should be able to:

- [ ] Create and verify cryptographic hashes
- [ ] Generate secure random data for various purposes
- [ ] Implement HMAC for message authentication
- [ ] Hash and verify passwords securely
- [ ] Encrypt and decrypt data with AES
- [ ] Understand when to use each cryptographic operation
- [ ] Avoid common security pitfalls
- [ ] Handle cryptographic operations properly

---

## Tips for Success

### General Tips

1. **Read the guides first** - The conceptual guides in `../guides/` explain the theory
2. **Experiment freely** - Try different inputs and see what happens
3. **Use the REPL** - Test small pieces of code in Node.js REPL (`node`)
4. **Read error messages** - They often tell you exactly what's wrong
5. **Check the docs** - [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)

### Crypto-Specific Tips

1. **Start simple** - Get basic functionality working first
2. **Print intermediate values** - Use `console.log()` to debug
3. **Understand the flow** - Know what each step does
4. **Test edge cases** - Try empty strings, long inputs, wrong keys
5. **Handle errors** - Wrap crypto operations in try-catch blocks

### Common Mistakes to Avoid

**Hash-related:**
- ❌ Using weak algorithms (MD5, SHA-1) for security
- ✅ Use SHA-256 or SHA-512

**Random data:**
- ❌ Using `Math.random()` for security tokens
- ✅ Use `crypto.randomBytes()` or `crypto.randomUUID()`

**Passwords:**
- ❌ Using simple hash functions for passwords
- ✅ Use PBKDF2, bcrypt, or Argon2
- ❌ Not using salt or reusing salts
- ✅ Generate unique random salt for each password

**Encryption:**
- ❌ Reusing IVs with the same key
- ✅ Generate new random IV for each encryption
- ❌ Using deprecated algorithms (DES, RC4)
- ✅ Use AES-256

---

## Difficulty Levels

Each exercise has tasks of increasing difficulty:

- **Tasks 1-3:** Basic concepts and implementation
- **Tasks 4-5:** More complex, real-world scenarios
- **Bonus challenges:** Advanced topics and edge cases

Don't worry if you can't complete everything immediately. Focus on understanding the concepts first.

---

## Getting Help

### If you're stuck:

1. **Re-read the task description** - Sometimes the answer is in the details
2. **Check the hints** - Each TODO has helpful hints
3. **Review the guides** - Go back to `../guides/` for theory
4. **Look at examples** - Check `../examples/` for working code
5. **Read the Node.js docs** - The crypto module has great documentation
6. **Experiment in REPL** - Test small pieces interactively

### Understanding vs Memorizing

Don't just copy code - make sure you understand:
- **Why** each step is necessary
- **What** each function does
- **When** to use each technique
- **How** the pieces fit together

---

## Testing Your Solutions

### Manual Testing
Run each exercise file and check output:
```bash
node exercise-1.js
```

Look for:
- ✓ Correct output values
- ✓ No error messages
- ✓ Expected behavior for edge cases

### Understanding Output
Each test shows:
- Input values
- Your output
- Expected output
- Whether tests pass

---

## Solution Files

Solution files are available in `../solutions/`:
- `solution-1.js` - File Integrity Checker
- `solution-2.js` - Secure Token Generator
- `solution-3.js` - Message Authenticator
- `solution-4.js` - Password Manager
- `solution-5.js` - Simple Encryption Tool

**When to look at solutions:**
1. After you've attempted the exercise
2. When you're completely stuck after trying for 15-20 minutes
3. To compare your approach with another solution
4. To learn alternative techniques

**How to use solutions:**
1. Try the exercise first
2. If stuck, look at one function at a time
3. Understand the solution, don't just copy
4. Try to implement it yourself after understanding
5. Compare your final solution

---

## Real-World Applications

These exercises teach skills used in:

### Hashing (Exercise 1)
- File integrity verification
- Data deduplication
- Cache keys
- Digital fingerprints

### Random Generation (Exercise 2)
- Session tokens
- API keys
- CSRF tokens
- Password reset tokens
- Unique identifiers

### HMAC (Exercise 3)
- API request signing
- Webhook verification
- JWT tokens
- Message authentication
- Data integrity

### Password Hashing (Exercise 4)
- User authentication
- Login systems
- Password storage
- Account security

### Encryption (Exercise 5)
- Data protection
- Secure communication
- File encryption
- Database encryption
- Privacy protection

---

## Next Steps

After completing these exercises:

1. **Review your code** - Can you improve it?
2. **Try the bonus challenges** - Push your understanding further
3. **Read the CONCEPTS.md** - Deepen your theoretical knowledge
4. **Move to Level 2** - Learn intermediate crypto operations
5. **Build a mini-project** - Combine multiple concepts

### Mini-Project Ideas

1. **Secure Notes App**
   - Encrypt notes with password
   - Hash for integrity checking
   - Session management

2. **API Authentication System**
   - Generate API keys
   - Sign requests with HMAC
   - Verify signatures

3. **File Vault**
   - Encrypt multiple files
   - Password-based access
   - Integrity verification

4. **Token Service**
   - Generate various token types
   - Manage expiration
   - Verify authenticity

---

## Progress Checklist

Track your progress:

- [ ] Exercise 1: File Integrity Checker
  - [ ] Task 1: Create hash
  - [ ] Task 2: Verify integrity
  - [ ] Task 3: Multiple algorithms
  - [ ] Task 4: Checksum utility
  - [ ] Task 5: Find duplicates
  - [ ] Bonus: Stream hashing

- [ ] Exercise 2: Secure Token Generator
  - [ ] Task 1: Generate token
  - [ ] Task 2: Generate UUID
  - [ ] Task 3: Random numbers
  - [ ] Task 4: API keys
  - [ ] Task 5: Session tokens
  - [ ] Bonus: URL-safe tokens & OTP

- [ ] Exercise 3: Message Authenticator
  - [ ] Task 1: Create HMAC
  - [ ] Task 2: Verify signature
  - [ ] Task 3: Sign API request
  - [ ] Task 4: Verify API request
  - [ ] Task 5: Webhook verification
  - [ ] Bonus: Simple JWT

- [ ] Exercise 4: Password Manager
  - [ ] Task 1: Hash password
  - [ ] Task 2: Verify password
  - [ ] Task 3: Combined format
  - [ ] Task 4: Verify combined
  - [ ] Task 5: Authentication system
  - [ ] Bonus: Async hashing

- [ ] Exercise 5: Simple Encryption Tool
  - [ ] Task 1: Encrypt
  - [ ] Task 2: Decrypt
  - [ ] Task 3: Password-based encryption
  - [ ] Task 4: Password-based decryption
  - [ ] Task 5: Encryption utility
  - [ ] Bonus: Batch encryption

---

## Additional Resources

### Official Documentation
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

### Security Best Practices
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### Learn More
- Read the main [README.md](../README.md) for overall level guidance
- Check [CONCEPTS.md](../../CONCEPTS.md) for deep-dive theory
- Explore [examples/](../examples/) for more code samples

---

## Need More Practice?

If you want additional practice:

1. **Modify the exercises** - Change requirements, add features
2. **Combine techniques** - Use multiple crypto operations together
3. **Build something real** - Create a small application
4. **Read the solutions** - Study different approaches
5. **Move to Level 2** - Tackle more advanced topics

---

## Summary

These exercises teach you the foundational cryptographic operations in Node.js:

1. **Hashing** for integrity verification
2. **Random generation** for tokens and IDs
3. **HMAC** for message authentication
4. **Password hashing** for secure storage
5. **Encryption** for data confidentiality

Master these basics, and you'll have a solid foundation for building secure applications!

**Good luck, and happy coding! 🔐**
