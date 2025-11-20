# Digital Signatures

Understanding how signatures provide authentication and non-repudiation.

## What Are Digital Signatures?

**Digital signatures** prove:
1. **Authentication**: Message from claimed sender
2. **Integrity**: Message hasn't been modified
3. **Non-repudiation**: Sender can't deny sending

## How Signatures Work

```
Signing (Private Key):
1. Hash the message
2. Encrypt hash with private key
3. Result is the signature

Verification (Public Key):
1. Hash the message
2. Decrypt signature with public key
3. Compare hashes
```

## vs Encryption

| Feature | Encryption | Signature |
|---------|-----------|-----------|
| **Purpose** | Confidentiality | Authentication |
| **Encrypt with** | Public key | Private key |
| **Decrypt with** | Private key | Public key |
| **Protects** | Content | Identity |

## Use Cases

1. **Document Signing**: Contracts, certificates
2. **Code Signing**: Software authenticity
3. **API Authentication**: Request verification
4. **Email**: S/MIME, PGP

## Best Practices

✅ Include timestamps (prevent replay)  
✅ Use SHA-256 or better  
✅ Sign before encrypting  
✅ Verify signatures before trusting data  

## Summary

Signatures are the digital equivalent of handwritten signatures, but cryptographically secure!
