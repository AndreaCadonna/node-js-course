# Level 1 Examples - Crypto Basics

This directory contains practical examples demonstrating fundamental cryptographic operations in Node.js.

## Examples Overview

### 01. Basic Hashing
**File**: `01-basic-hashing.js`

Learn how to create cryptographic hashes for data integrity and fingerprinting.

**Topics covered:**
- Creating SHA-256 hashes
- Different hash algorithms
- Deterministic nature of hashing
- Avalanche effect
- Output formats (hex, base64, buffer)
- Data integrity verification
- Available hash algorithms

**Run it:**
```bash
node 01-basic-hashing.js
```

### 02. Random Generation
**File**: `02-random-generation.js`

Generate cryptographically secure random data for tokens, IDs, and passwords.

**Topics covered:**
- Generating random bytes
- Creating UUIDs
- Random integers
- Session token generation
- API key creation
- Password reset tokens
- Random PINs and passwords
- Comparison with Math.random()

**Run it:**
```bash
node 02-random-generation.js
```

### 03. HMAC Creation
**File**: `03-hmac-creation.js`

Create and verify HMACs for message authentication and integrity.

**Topics covered:**
- Basic HMAC creation
- Message verification
- Detecting tampering
- API request signing
- Webhook verification
- Timing-safe comparison
- JWT-like tokens
- Different HMAC algorithms

**Run it:**
```bash
node 03-hmac-creation.js
```

### 04. Password Hashing
**File**: `04-password-hashing.js`

Securely hash and verify passwords using pbkdf2.

**Topics covered:**
- PBKDF2 password hashing
- Salt generation and storage
- Password verification
- Complete authentication system
- Iteration count impact
- Why salt matters
- User registration/login simulation
- Async vs sync operations

**Run it:**
```bash
node 04-password-hashing.js
```

### 05. Basic Encryption
**File**: `05-basic-encryption.js`

Encrypt and decrypt data using symmetric encryption (AES).

**Topics covered:**
- AES-256-CBC encryption
- Encryption and decryption
- Keys and initialization vectors
- Password-based encryption
- Key derivation from passwords
- Encrypting JSON data
- Available cipher algorithms
- Common encryption mistakes

**Run it:**
```bash
node 05-basic-encryption.js
```

### 06. Practical Examples
**File**: `06-practical-examples.js`

Real-world applications combining multiple cryptographic operations.

**Topics covered:**
- Session token management
- API key generation and validation
- Password reset tokens
- File integrity checking
- Signed message system
- Encrypted storage
- OTP generation
- Rate limiting
- Data anonymization
- License key generation
- Challenge-response authentication

**Run it:**
```bash
node 06-practical-examples.js
```

## Running All Examples

To run all examples in sequence:

```bash
for file in *.js; do
  echo "=== Running $file ==="
  node "$file"
  echo ""
done
```

Or on Windows:
```cmd
for %f in (*.js) do (
  echo === Running %f ===
  node "%f"
  echo.
)
```

## Key Concepts Demonstrated

### Hashing
- One-way transformation of data
- Fixed-size output
- Deterministic results
- Used for integrity verification

### Random Generation
- Cryptographically secure randomness
- Never use Math.random() for security
- UUIDs, tokens, salts, IVs

### HMAC
- Message authentication
- Requires shared secret
- Verifies authenticity and integrity

### Password Hashing
- Use pbkdf2 or scrypt
- Always use unique salt
- High iteration count
- Store salt with hash

### Encryption
- Symmetric encryption (same key)
- Requires key and IV
- IV must be random and unique
- Store IV with encrypted data

## Security Best Practices

✅ **Do:**
- Use strong algorithms (SHA-256, AES-256)
- Generate new IVs for each encryption
- Use unique salts for passwords
- High iteration counts (100,000+)
- Timing-safe comparisons
- Handle errors properly

❌ **Don't:**
- Use MD5 or SHA-1 for security
- Hardcode keys or secrets
- Reuse IVs
- Use Math.random() for security
- Store passwords in plain text
- Ignore error handling

## Common Use Cases

1. **Password Storage**
   - Hash with pbkdf2
   - Use unique salt
   - Store salt:hash

2. **Session Management**
   - Random session tokens
   - UUID session IDs
   - HMAC for verification

3. **API Security**
   - API key generation
   - Request signing (HMAC)
   - Token validation

4. **Data Protection**
   - Encrypt sensitive data
   - File encryption
   - Database encryption

5. **Data Integrity**
   - File checksums
   - Data verification
   - Tamper detection

## Next Steps

After studying these examples:

1. **Complete the exercises** in the `exercises/` directory
2. **Read the conceptual guides** in the `guides/` directory
3. **Review the solutions** after attempting exercises
4. **Experiment** with variations of these examples
5. **Build your own projects** using these patterns

## Questions?

- Review the [README.md](../README.md) for level overview
- Check [CONCEPTS.md](../../CONCEPTS.md) for foundational concepts
- Read the relevant guides for deeper understanding
- Try modifying the examples to see how they work

## Important Security Note

⚠️ These examples are for educational purposes. In production:

- Use environment variables for secrets
- Implement proper error handling
- Follow OWASP security guidelines
- Consider using battle-tested libraries
- Keep dependencies updated
- Perform security audits

Remember: Cryptography is powerful but must be used correctly. Always follow security best practices!
