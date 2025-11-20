# Level 3 Examples - Advanced Crypto Operations

Production-ready examples demonstrating advanced cryptographic systems and security patterns.

## Examples Overview

### 01. JWT Authentication
**File**: `01-jwt-authentication.js`

Complete JWT authentication system with access tokens, refresh tokens, and security best practices.

**Topics covered:**
- JWT generation with RS256
- Token payload design
- Access and refresh token patterns
- Token verification and validation
- Token revocation strategies
- Claims validation
- Token expiration handling
- Multi-audience support
- Key rotation
- Security best practices

**Run it:**
```bash
node 01-jwt-authentication.js
```

### 02. End-to-End Encryption
**File**: `02-e2e-encryption.js`

End-to-end encryption system using Diffie-Hellman key exchange and authenticated encryption.

**Topics covered:**
- Diffie-Hellman key exchange (X25519)
- Shared secret derivation
- Authenticated encryption (AES-GCM)
- Forward secrecy
- Multi-party encryption
- Message authentication
- Key management for E2E
- Session establishment
- Encrypted messaging
- Public key distribution

**Run it:**
```bash
node 02-e2e-encryption.js
```

### 03. Key Management
**File**: `03-key-management.js`

Enterprise-grade key management system with secure storage, rotation, and recovery.

**Topics covered:**
- Key vault implementation
- Master key encryption
- Key derivation hierarchies
- Key rotation strategies
- Secure key storage
- Key recovery mechanisms
- Access control for keys
- Audit logging
- Key lifecycle management
- HSM simulation
- Secrets management

**Run it:**
```bash
node 03-key-management.js
```

### 04. Streaming Cryptography
**File**: `04-streaming-crypto.js`

Efficient encryption and decryption of large files using streams.

**Topics covered:**
- Stream-based encryption
- Stream-based decryption
- Memory-efficient crypto
- Chunked processing
- Hash computation on streams
- Authenticated streaming encryption
- Progress tracking
- Error handling in streams
- Backpressure management
- File integrity with streams

**Run it:**
```bash
node 04-streaming-crypto.js
```

### 05. Security Patterns
**File**: `05-security-patterns.js`

Advanced security patterns and defense mechanisms for production systems.

**Topics covered:**
- Defense in depth
- Timing attack prevention
- Rate limiting and throttling
- Secure session management
- API request signing
- CSRF protection
- Replay attack prevention
- Constant-time operations
- Secure random generation
- Error handling without leaks
- Security headers
- Input validation and sanitization

**Run it:**
```bash
node 05-security-patterns.js
```

### 06. Production Systems
**File**: `06-production-systems.js`

Real-world production patterns combining multiple security concepts.

**Topics covered:**
- Complete authentication system
- Encrypted data storage
- Secure API design
- Compliance logging
- Performance optimization
- Error handling
- Health checks
- Metrics and monitoring
- Graceful degradation
- Circuit breakers for crypto
- Multi-region key management
- Disaster recovery

**Run it:**
```bash
node 06-production-systems.js
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

### JWT Authentication
- Industry-standard token format
- Asymmetric signing for scalability
- Proper claims validation
- Token lifecycle management
- Refresh token rotation

### End-to-End Encryption
- Zero-knowledge architecture
- Perfect forward secrecy
- Authenticated encryption
- Key agreement protocols
- Multi-device support

### Key Management
- Hierarchical key derivation
- Key wrapping and unwrapping
- Rotation without data re-encryption
- Secure backup and recovery
- Audit trails

### Streaming Crypto
- Constant memory usage
- Real-time encryption
- Efficient for large files
- Progress tracking
- Graceful error handling

### Security Patterns
- Multiple layers of defense
- Timing-safe operations
- Rate limiting
- Attack surface reduction
- Secure defaults

### Production Systems
- High availability
- Performance optimization
- Comprehensive monitoring
- Compliance requirements
- Disaster recovery

## Security Best Practices

✅ **Do:**
- Use asymmetric algorithms for JWT (RS256, ES256)
- Implement proper token validation
- Use authenticated encryption (GCM mode)
- Implement key rotation
- Log security events
- Use timing-safe comparisons
- Validate all inputs
- Handle errors securely
- Monitor crypto operations
- Plan for key recovery

❌ **Don't:**
- Use HS256 with weak secrets
- Store sensitive data in JWT payload
- Skip token validation
- Hardcode encryption keys
- Ignore performance implications
- Expose detailed error messages
- Use deprecated algorithms
- Reuse nonces/IVs
- Skip audit logging
- Ignore compliance requirements

## Common Use Cases

1. **API Authentication**
   - JWT-based auth
   - API key management
   - Request signing
   - Token refresh

2. **Secure Communication**
   - E2E encrypted messaging
   - Secure file transfer
   - Encrypted APIs
   - VPN-like tunnels

3. **Data Protection**
   - Database encryption
   - File encryption at rest
   - Backup encryption
   - Cloud storage encryption

4. **Compliance**
   - GDPR data protection
   - PCI-DSS requirements
   - HIPAA encryption
   - SOC 2 controls

5. **Enterprise Security**
   - Single sign-on (SSO)
   - Multi-factor authentication
   - Secrets management
   - Certificate management

## Performance Considerations

### JWT Operations
```javascript
// RS256 sign: ~1-2ms per token
// RS256 verify: ~0.5-1ms per token
// Use caching for public keys
// Consider ES256 for better performance
```

### Streaming Encryption
```javascript
// AES-256-GCM: ~100-500 MB/s
// Memory usage: O(1) - constant
// Ideal for files > 10MB
// Use workers for parallel processing
```

### Key Management
```javascript
// Cache derived keys
// Use key hierarchies
// Minimize crypto operations
// Lazy key loading
```

## Advanced Patterns

### 1. Zero-Knowledge Architecture
```javascript
// Server never sees plaintext
// Client-side encryption
// Encrypted search capability
// Secure key exchange
```

### 2. Multi-Tenant Security
```javascript
// Tenant isolation
// Per-tenant keys
// Cross-tenant prevention
// Audit per tenant
```

### 3. Hardware Security Modules
```javascript
// Key generation in HSM
// Signing in HSM
// HSM-backed key storage
// PKCS#11 integration
```

### 4. Distributed Systems
```javascript
// Consistent key distribution
// Cluster-wide rotation
// High availability
// Geographic distribution
```

## Testing Production Crypto

### Unit Tests
- Test each crypto function
- Test error conditions
- Test edge cases
- Mock external dependencies

### Integration Tests
- Test complete flows
- Test key rotation
- Test failure scenarios
- Test performance

### Security Tests
- Penetration testing
- Vulnerability scanning
- Code review
- Compliance audits

### Performance Tests
- Load testing
- Stress testing
- Benchmark crypto ops
- Profile memory usage

## Monitoring and Debugging

### Metrics to Track
```javascript
- Token generation rate
- Token validation failures
- Encryption/decryption duration
- Key rotation events
- Authentication failures
- Rate limit violations
```

### Logging Best Practices
```javascript
- Log security events
- Don't log secrets
- Include request IDs
- Log performance metrics
- Structured logging
- Retention policies
```

### Debugging Tips
- Use crypto.getCiphers() to list available ciphers
- Check Node.js crypto support
- Verify key formats and lengths
- Test with known test vectors
- Use OpenSSL for validation
- Check for timing issues

## Next Steps

After studying these examples:

1. **Complete the exercises** in the `exercises/` directory
2. **Read the conceptual guides** in the `guides/` directory
3. **Study the solutions** after attempting exercises
4. **Build production systems** using these patterns
5. **Contribute improvements** based on real-world experience

## Questions?

- Review the [README.md](../README.md) for level overview
- Check [CONCEPTS.md](../../CONCEPTS.md) for theory
- Read the relevant guides for deeper understanding
- Study OWASP security guidelines
- Consult Node.js crypto documentation
- Review production security standards

## Important Security Note

⚠️ These examples demonstrate production patterns but should be:

- Reviewed by security experts before production use
- Tested thoroughly in your specific environment
- Adapted to your compliance requirements
- Monitored and audited regularly
- Updated with security patches
- Part of a comprehensive security strategy

**Key Principles:**
- Defense in depth
- Principle of least privilege
- Secure by default
- Fail securely
- Keep it simple
- Assume breach

Remember: Cryptography is a critical component of security, but it's not the only component. Combine crypto with secure architecture, proper access controls, monitoring, and incident response!
