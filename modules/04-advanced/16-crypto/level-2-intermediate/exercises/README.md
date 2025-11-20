# Level 2 Exercises - Crypto Intermediate

Hands-on exercises to practice intermediate cryptographic operations. Each exercise builds on previous concepts.

## Exercises Overview

### Exercise 1: AES-GCM Encryption Utility
**File**: `exercise-1.js`

Build a complete AES-GCM encryption/decryption utility.

**Tasks:**
1. Implement basic AES-256-GCM encryption
2. Implement basic AES-256-GCM decryption
3. Add Additional Authenticated Data (AAD) support
4. Verify tamper detection works correctly
5. Build complete encryption service class
6. **Bonus:** Password-based encryption with scrypt

**Skills practiced:**
- AES-GCM authenticated encryption
- Authentication tag handling
- AAD for metadata
- Tamper detection
- Error handling

**Estimated time:** 30-45 minutes

---

### Exercise 2: RSA Key Pair Generator and Encryptor
**File**: `exercise-2.js`

Create a system for RSA key generation and hybrid encryption.

**Tasks:**
1. Generate RSA key pairs with different sizes
2. Implement RSA encryption and decryption
3. Build hybrid encryption (RSA + AES)
4. Generate password-protected private keys
5. Build complete key management system

**Skills practiced:**
- RSA key pair generation
- Public/private key operations
- Hybrid encryption pattern
- Key protection with passphrases
- Key export/import

**Estimated time:** 30-45 minutes

---

### Exercise 3: Digital Signature System
**File**: `exercise-3.js`

Implement a document signing and verification system.

**Tasks:**
1. Create and verify basic signatures
2. Sign JSON documents with signatures
3. Implement API request signing with timestamps
4. Build multi-signature document system
5. Create complete signature utility class

**Skills practiced:**
- Digital signature creation
- Signature verification
- Tamper detection
- Multi-party signatures
- Authentication patterns

**Estimated time:** 30-45 minutes

---

### Exercise 4: Secure Key Exchange
**File**: `exercise-4.js`

Build a key exchange system using asymmetric cryptography.

**Tasks:**
1. Implement basic RSA key exchange
2. Add authentication to prevent MITM attacks
3. Use HKDF to derive multiple session keys
4. Build secure communication channel
5. Implement complete key exchange protocol

**Skills practiced:**
- Key exchange protocols
- Authenticated key exchange
- HKDF key derivation
- Session key management
- Secure channels

**Estimated time:** 45-60 minutes

---

### Exercise 5: Encrypted Messaging System
**File**: `exercise-5.js`

Create an end-to-end encrypted messaging system (capstone project).

**Tasks:**
1. Implement user registration with key pairs
2. Create message encryption system
3. Add message authentication
4. Build conversation management
5. Complete messaging platform

**Skills practiced:**
- End-to-end encryption
- Combining all Level 2 concepts
- Real-world security implementation
- Complete cryptographic workflow
- Production-ready patterns

**Estimated time:** 60-90 minutes

---

## Getting Started

### Before You Begin

1. **Review the examples** in the `examples/` directory
2. **Read the guides** in the `guides/` directory
3. **Have Node.js documentation handy**

### Running Exercises

```bash
# Run an exercise
node exercise-1.js

# Your implementation should pass all tests
# Compare with solutions afterward
```

### Recommended Sequence

1. **Start with Exercise 1** - Foundational GCM encryption
2. **Move to Exercise 2** - RSA and hybrid encryption
3. **Complete Exercise 3** - Digital signatures
4. **Tackle Exercise 4** - Key exchange protocols
5. **Finish with Exercise 5** - Capstone messaging system

Each exercise builds on concepts from previous ones.

---

## Tips for Success

### General Tips

- ✅ Read the TODO comments carefully
- ✅ Implement functions one at a time
- ✅ Test each function before moving on
- ✅ Handle errors appropriately
- ✅ Use the examples as reference
- ✅ Don't look at solutions immediately

### Common Mistakes to Avoid

❌ Forgetting to set authentication tags in GCM
❌ Trying to encrypt large data with RSA directly
❌ Not verifying signatures before trusting data
❌ Reusing IVs with the same key
❌ Hardcoding keys or secrets
❌ Skipping error handling

### Debugging Tips

1. **Check your IV/key lengths** - AES-256 needs 32-byte key
2. **Verify auth tag order** - Set auth tag BEFORE updating in decryption
3. **Test with small data first** - Easier to debug
4. **Print intermediate values** - See what's happening
5. **Compare with examples** - Use examples as reference

---

## Success Criteria

You've successfully completed the exercises when you can:

### Exercise 1
- [ ] Encrypt and decrypt with AES-GCM
- [ ] Use AAD for metadata authentication
- [ ] Detect tampering attempts
- [ ] Build reusable encryption utilities

### Exercise 2
- [ ] Generate RSA key pairs
- [ ] Implement hybrid encryption
- [ ] Protect private keys
- [ ] Export and import keys

### Exercise 3
- [ ] Create and verify signatures
- [ ] Sign complex documents
- [ ] Detect tampering
- [ ] Implement multi-signature

### Exercise 4
- [ ] Exchange keys securely
- [ ] Prevent MITM attacks
- [ ] Derive session keys
- [ ] Build secure channels

### Exercise 5
- [ ] Register users with keys
- [ ] Encrypt messages E2E
- [ ] Authenticate messages
- [ ] Manage conversations

---

## After Completing Exercises

1. **Check solutions** in the `solutions/` directory
2. **Compare your approach** with the solution
3. **Try different variations** of your implementation
4. **Build a mini-project** using these concepts
5. **Review security best practices**

---

## Mini-Projects for Extra Practice

Want more challenge? Try these:

### 1. Secure File Vault
- Encrypt files with AES-GCM
- Password-based access
- Metadata encryption
- File integrity verification

### 2. Secure API Client
- Request signing
- Response verification
- Token management
- Replay attack prevention

### 3. Certificate Authority
- Generate certificates
- Sign certificates
- Verify certificate chains
- Manage trust relationships

### 4. Secure Chat Application
- User registration
- Key exchange
- Message encryption
- Forward secrecy

---

## Need Help?

- Re-read the relevant **guide** in `guides/` directory
- Check the **examples** for similar patterns
- Review **Level 1** basics if needed
- Study the **solution** for hints (but try first!)
- Read the **main README.md** for concepts

---

## Security Reminders

⚠️ **Important:**

- Never commit keys or secrets to version control
- Always validate input before encryption/decryption
- Use environment variables for production keys
- Handle errors without leaking information
- Test with invalid/tampered data
- Consider timing attacks for production
- Keep dependencies updated

---

## Progress Tracking

Mark your progress:

- [ ] Exercise 1: AES-GCM Encryption Utility
- [ ] Exercise 2: RSA Key Pair Generator
- [ ] Exercise 3: Digital Signature System
- [ ] Exercise 4: Secure Key Exchange
- [ ] Exercise 5: Encrypted Messaging System

---

**Good luck! Remember: security requires attention to detail. Take your time to understand each concept before moving on.**
