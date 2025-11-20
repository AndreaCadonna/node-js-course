# Level 2 Examples - Crypto Intermediate

This directory contains practical examples demonstrating intermediate cryptographic operations in Node.js.

## Examples Overview

### 01. AES-GCM Encryption
**File**: `01-aes-gcm-encryption.js`

Learn authenticated encryption with AES-GCM mode.

**Topics covered:**
- AES-256-GCM encryption and decryption
- Authentication tags for integrity
- Additional Authenticated Data (AAD)
- Tamper detection
- Proper IV/nonce management
- Complete encryption utility
- Storage format patterns
- Real-world use cases

**Run it:**
```bash
node 01-aes-gcm-encryption.js
```

### 02. RSA Encryption
**File**: `02-rsa-encryption.js`

Master asymmetric encryption with RSA key pairs.

**Topics covered:**
- RSA key pair generation
- Public key encryption
- Private key decryption
- Different padding schemes (OAEP, PKCS1)
- Key size limitations
- Hybrid encryption (RSA + AES)
- Password-protected private keys
- Key export and import formats
- Performance characteristics

**Run it:**
```bash
node 02-rsa-encryption.js
```

### 03. Digital Signatures
**File**: `03-digital-signatures.js`

Create and verify digital signatures for authentication.

**Topics covered:**
- Creating signatures with private keys
- Verifying signatures with public keys
- Tamper detection
- Different signature algorithms
- Streaming signature creation
- Signing JSON documents
- API request signing
- Multi-party signatures
- Detached signatures
- Code signing patterns

**Run it:**
```bash
node 03-digital-signatures.js
```

### 04. Key Derivation
**File**: `04-key-derivation.js`

Advanced key derivation with HKDF and scrypt.

**Topics covered:**
- HKDF for key expansion
- Deriving multiple keys from master key
- scrypt for password-based derivation
- scrypt vs PBKDF2 comparison
- Parameter tuning for security
- Password storage systems
- Key rotation patterns
- Context-specific keys
- Performance considerations

**Run it:**
```bash
node 04-key-derivation.js
```

### 05. Certificate Handling
**File**: `05-certificate-handling.js`

Work with X.509 certificates and public key infrastructure.

**Topics covered:**
- Public key extraction
- Key pair verification
- Self-signed certificates
- Certificate chain verification
- Public key fingerprints
- Key pinning
- Certificate expiry validation
- Certificate management utilities
- Trust hierarchies

**Run it:**
```bash
node 05-certificate-handling.js
```

### 06. Advanced Patterns
**File**: `06-advanced-patterns.js`

Real-world cryptographic patterns for production systems.

**Topics covered:**
- Secure envelope pattern (hybrid encryption)
- Password-based encryption systems
- Authenticated key exchange
- Encrypt-then-MAC pattern
- Versioned encryption for key rotation
- Secure token generation
- Multi-layer encryption
- Secure random utilities
- Production-ready implementations

**Run it:**
```bash
node 06-advanced-patterns.js
```

## Running All Examples

To run all examples in sequence:

```bash
for file in 0*.js; do
  echo "=== Running $file ==="
  node "$file"
  echo ""
done
```

Or on Windows:
```cmd
for %f in (0*.js) do (
  echo === Running %f ===
  node "%f"
  echo.
)
```

## Key Concepts Demonstrated

### AES-GCM
- Authenticated encryption (encryption + authentication)
- Authentication tags verify data integrity
- AAD authenticates metadata without encryption
- Prevents tampering attacks
- Single-pass encryption and authentication

### RSA Asymmetric Cryptography
- Public/private key pairs
- Public key encrypts, private key decrypts
- Limited data size (use hybrid encryption)
- OAEP padding for security
- Key export/import in PEM and DER formats

### Digital Signatures
- Sign with private key, verify with public key
- Provides authentication and non-repudiation
- Detects any data tampering
- Can sign any data type
- Streaming supports large data

### Key Derivation
- HKDF expands one key into multiple keys
- scrypt for password-based key derivation
- Memory-hard functions resist attacks
- Context info creates unique keys
- Enables key rotation strategies

### Certificates
- Bind public keys to identities
- X.509 standard format
- Certificate chains establish trust
- Fingerprints verify key identity
- Expiry dates require validation

### Advanced Patterns
- Hybrid encryption for large data
- Encrypt-then-MAC for defense in depth
- Key versioning enables rotation
- Authenticated key exchange prevents MITM
- Multi-layer encryption adds redundancy

## Security Best Practices

✅ **Do:**
- Use AES-GCM for authenticated encryption
- Generate new IV for each encryption
- Use OAEP padding for RSA encryption
- Verify signatures and auth tags
- Use scrypt or PBKDF2 for passwords
- Derive keys with HKDF when needed
- Check certificate expiry
- Use timing-safe comparisons
- Handle errors properly

❌ **Don't:**
- Reuse IVs/nonces with same key
- Encrypt large data directly with RSA
- Skip signature verification
- Use weak key derivation
- Ignore authentication tags
- Hardcode keys in source code
- Use predictable randomness
- Trust expired certificates

## Common Use Cases

1. **Secure Data Storage**
   - Encrypt with AES-GCM
   - Password-based key derivation
   - Versioned encryption for rotation
   - Authentication tags for integrity

2. **Secure Communication**
   - RSA for key exchange
   - AES-GCM for message encryption
   - Signatures for authentication
   - Certificate-based trust

3. **API Security**
   - Request signing
   - Token generation and validation
   - Key-based authentication
   - Timestamp validation

4. **Identity Verification**
   - Digital signatures
   - Certificate validation
   - Public key pinning
   - Multi-party signing

5. **Key Management**
   - HKDF for key derivation
   - Key versioning for rotation
   - Password-based encryption
   - Secure key exchange

## Performance Considerations

### AES-GCM
- Fast encryption and authentication
- Hardware acceleration available
- Single-pass operation
- Scales well with data size

### RSA
- Slow compared to symmetric crypto
- Key generation is expensive
- Use hybrid encryption for large data
- 2048-bit adequate, 4096-bit for high security

### Signatures
- Verification faster than creation
- Streaming efficient for large data
- SHA-256 adequate for most uses
- Choose algorithm based on requirements

### Key Derivation
- scrypt intentionally slow
- Adjust parameters for security/speed balance
- HKDF is fast (not password-based)
- Use async to avoid blocking

## Next Steps

After studying these examples:

1. **Complete the exercises** in the `exercises/` directory
2. **Read the conceptual guides** in the `guides/` directory
3. **Review the solutions** after attempting exercises
4. **Experiment** with different parameters and options
5. **Build your own projects** using these patterns

## Questions?

- Review the [README.md](../README.md) for level overview
- Check [CONCEPTS.md](../../CONCEPTS.md) for foundational concepts
- Read the relevant guides for deeper understanding
- Try modifying the examples to see effects
- Compare with Level 1 basics

## Important Security Note

⚠️ These examples are for educational purposes. In production:

- Use environment variables for secrets
- Implement comprehensive error handling
- Follow OWASP security guidelines
- Use established libraries when possible
- Keep dependencies updated
- Perform regular security audits
- Consider HSM for key storage
- Implement proper access controls
- Log security events
- Plan for key rotation

Remember: Intermediate cryptography requires careful attention to detail. Understanding these patterns will help you build secure, production-ready applications!
