# Certificate Basics

Understanding X.509 certificates and Public Key Infrastructure (PKI).

## What is a Certificate?

A **certificate** binds a public key to an identity:

```
Certificate = {
  Public Key,
  Owner Info (CN, Org, etc),
  Issuer (who signed it),
  Valid dates,
  Signature (by issuer)
}
```

## X.509 Structure

```
Certificate:
├── Version
├── Serial Number
├── Subject (who owns it)
│   ├── Common Name (CN)
│   ├── Organization (O)
│   └── Country (C)
├── Issuer (who signed it)
├── Validity Period
│   ├── Not Before
│   └── Not After
├── Public Key
└── Signature (by issuer)
```

## Certificate Chain

```
Root CA (self-signed, trusted)
  ↓ signs
Intermediate CA
  ↓ signs
End Entity Certificate (your cert)
```

## Use Cases

1. **TLS/HTTPS**: Secure websites
2. **Email**: S/MIME encryption
3. **Code Signing**: Software authenticity
4. **VPN**: Secure connections

## Trust Models

### Self-Signed
- Issuer = Subject
- No chain of trust
- For testing only

### CA-Signed
- Signed by trusted CA
- Chain to root CA
- For production

## Key Concepts

### Public Key Pinning
```javascript
// Trust specific public key
const expectedFingerprint = hash(publicKey)
if (actualFingerprint !== expectedFingerprint) {
  throw new Error('Key mismatch!')
}
```

### Certificate Validation
1. Check expiry dates
2. Verify signature chain
3. Check revocation status
4. Validate hostname

## Best Practices

✅ Validate certificate chains  
✅ Check expiry dates  
✅ Pin certificates when possible  
✅ Use CA-signed certs in production  

❌ Don't skip validation  
❌ Don't ignore expiry  
❌ Don't trust self-signed in production  

## Summary

Certificates enable trust in public keys through a chain of signatures!
