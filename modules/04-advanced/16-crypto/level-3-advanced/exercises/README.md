# Level 3 Exercises: Advanced Crypto Operations

Advanced hands-on exercises to master production-ready cryptographic systems. Each exercise challenges you to build real-world, secure applications.

## Overview

These exercises cover advanced cryptographic implementations you'll use in production environments:

- **JWT Authentication** - Complete authentication systems
- **End-to-End Encryption** - Secure messaging platforms
- **File Storage Security** - Encrypted file systems
- **API Security** - HMAC-based authentication
- **Key Management** - Enterprise key vaults

## Exercises

### Exercise 1: Complete JWT Authentication System
**File:** `exercise-1.js`

Build a production-ready authentication system with JWT tokens, refresh token rotation, and secure session management.

**What you'll practice:**
- Generating and signing JWTs with RS256
- Implementing access and refresh token patterns
- Token validation and claims verification
- Token revocation strategies
- Refresh token rotation
- Secure session management
- Rate limiting for auth endpoints

**Skills covered:**
- JWT implementation from scratch
- Asymmetric cryptography (RSA)
- Token lifecycle management
- Security best practices
- Production patterns

**Key concepts:**
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (30 days)
- Token rotation on refresh
- Revocation via blacklist
- Secure token storage

---

### Exercise 2: End-to-End Encrypted Chat
**File:** `exercise-2.js`

Implement a secure messaging system with end-to-end encryption, key exchange, and forward secrecy.

**What you'll practice:**
- Diffie-Hellman key exchange (X25519)
- Deriving shared secrets
- Authenticated encryption (AES-GCM)
- Implementing forward secrecy
- Managing multiple conversations
- Public key distribution
- Message authentication

**Skills covered:**
- Key exchange protocols
- E2E encryption patterns
- Forward secrecy implementation
- Multi-party encryption
- Secure key management

**Key concepts:**
- Zero-knowledge architecture
- Ephemeral keys per session
- Perfect forward secrecy
- Client-side encryption
- Server cannot decrypt

---

### Exercise 3: Secure File Storage System
**File:** `exercise-3.js`

Create an encrypted file storage system with access control, metadata protection, and key management.

**What you'll practice:**
- Encrypting files at rest
- Metadata protection
- Per-file encryption keys
- Key derivation hierarchies
- Access control implementation
- Secure file deletion
- Audit logging

**Skills covered:**
- File encryption strategies
- Key management systems
- Access control patterns
- Compliance requirements
- Secure data deletion

**Key concepts:**
- Each file has unique key
- Master key encrypts file keys
- Metadata is also encrypted
- Access control per file
- Audit trail required

---

### Exercise 4: API Authentication with HMAC
**File:** `exercise-4.js`

Build a complete API authentication system using HMAC request signing, replay attack prevention, and rate limiting.

**What you'll practice:**
- HMAC request signing
- Signature verification
- Timestamp validation
- Replay attack prevention
- API key management
- Rate limiting
- Request throttling

**Skills covered:**
- HMAC-based authentication
- API security patterns
- Attack prevention
- Rate limiting strategies
- Secure API design

**Key concepts:**
- Sign entire request
- Include timestamp in signature
- Reject old timestamps
- One-time nonce per request
- Rate limit by API key

---

### Exercise 5: Secure Key Vault
**File:** `exercise-5.js`

Implement an enterprise-grade key vault with encryption, access control, audit logging, and key rotation.

**What you'll practice:**
- Secure key storage
- Master key encryption
- Key access control
- Audit logging
- Key rotation
- Backup and recovery
- Key lifecycle management

**Skills covered:**
- Key vault architecture
- Hierarchical key derivation
- Access control systems
- Audit trail implementation
- Key rotation strategies

**Key concepts:**
- Master key encrypts all keys
- Never expose keys directly
- Log all access attempts
- Regular key rotation
- Secure backup procedures

---

## How to Complete

### Step 1: Read Exercise Requirements
- Understand the objective
- Review the requirements
- Check the test cases
- Plan your approach

### Step 2: Implement Solutions
- Follow TODO comments
- Implement each function
- Use security best practices
- Handle errors properly

### Step 3: Test Your Implementation
```bash
node exercise-1.js
node exercise-2.js
node exercise-3.js
node exercise-4.js
node exercise-5.js
```

### Step 4: Verify Security
- Check for timing attacks
- Verify input validation
- Test error handling
- Review audit logging
- Test edge cases

### Step 5: Compare with Solutions
- Review solution implementation
- Compare approaches
- Note optimization techniques
- Study alternative patterns

---

## Learning Objectives

After completing these exercises, you should be able to:

- [ ] Build complete JWT authentication systems
- [ ] Implement end-to-end encryption
- [ ] Design secure file storage systems
- [ ] Create HMAC-based API authentication
- [ ] Build enterprise key vaults
- [ ] Apply security best practices
- [ ] Handle production scenarios
- [ ] Implement compliance requirements
- [ ] Design for scalability
- [ ] Monitor cryptographic operations

---

## Tips for Success

### General Tips

1. **Security first** - Don't compromise on security for convenience
2. **Test thoroughly** - Test both success and failure cases
3. **Read the guides** - Reference the guides for deep understanding
4. **Study examples** - Learn from the example implementations
5. **Think production** - Consider scalability and monitoring

### Security Considerations

1. **Timing attacks** - Use `crypto.timingSafeEqual()` for comparisons
2. **Input validation** - Validate all inputs
3. **Error handling** - Don't leak information in errors
4. **Rate limiting** - Prevent brute force attacks
5. **Audit logging** - Log security-relevant events

### Common Mistakes to Avoid

**JWT:**
- ❌ Using HS256 with weak secrets
- ❌ Not validating token claims
- ❌ Storing sensitive data in payload
- ✅ Use RS256 with strong keys
- ✅ Validate all claims
- ✅ Keep tokens short-lived

**E2E Encryption:**
- ❌ Using static keys
- ❌ Skipping forward secrecy
- ❌ Not authenticating messages
- ✅ Use ephemeral keys
- ✅ Implement forward secrecy
- ✅ Use AES-GCM for authentication

**Key Management:**
- ❌ Hardcoding encryption keys
- ❌ Not rotating keys
- ❌ Exposing keys in logs
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Never log keys

---

## Success Criteria

Your implementation should:

- ✓ Be production-ready
- ✓ Follow security best practices
- ✓ Handle errors gracefully
- ✓ Include audit logging
- ✓ Support key rotation
- ✓ Be well-documented
- ✓ Pass all test cases
- ✓ Be performant
- ✓ Be maintainable
- ✓ Meet compliance requirements

---

## Real-World Applications

### JWT Authentication
- Single Sign-On (SSO)
- API authentication
- Microservices auth
- Mobile app auth

### E2E Encryption
- Secure messaging (Signal, WhatsApp)
- Encrypted email
- Secure file sharing
- Healthcare communications

### File Storage
- Cloud storage (Dropbox, Google Drive)
- Encrypted backups
- Document management
- Media storage

### API Authentication
- Payment gateways
- Cloud APIs (AWS, Azure)
- Webhook verification
- Service-to-service auth

### Key Vault
- HashiCorp Vault
- AWS KMS
- Azure Key Vault
- Enterprise secrets management

---

## Additional Resources

### Official Documentation
- [Node.js Crypto API](https://nodejs.org/api/crypto.html)
- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

### Security Standards
- [NIST Cryptographic Standards](https://csrc.nist.gov/)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [GDPR Guidelines](https://gdpr.eu/)

### Tools
- JWT Debugger: https://jwt.io/
- OpenSSL: Crypto toolkit
- Wireshark: Network analysis

---

## Next Steps

After completing these exercises:

1. **Review solutions** - Compare with production implementations
2. **Build projects** - Create your own applications
3. **Read guides** - Deep dive into theory
4. **Practice more** - Implement variations
5. **Study compliance** - Understand regulatory requirements

---

## Questions?

- Review the [README.md](../README.md) for level overview
- Check [examples/](../examples/) for working code
- Read [guides/](../guides/) for deep understanding
- Study [solutions/](../solutions/) after attempting exercises
- Consult [CONCEPTS.md](../../CONCEPTS.md) for theory

---

## Important Notes

⚠️ **Security Warning**: These exercises teach production patterns, but:

- Always have security experts review production code
- Test thoroughly in your environment
- Follow your organization's security policies
- Keep dependencies updated
- Perform regular security audits
- Have incident response plans

**Remember**: Security is not a checkbox - it's an ongoing process!

---

**Good luck building secure, production-ready systems!**
