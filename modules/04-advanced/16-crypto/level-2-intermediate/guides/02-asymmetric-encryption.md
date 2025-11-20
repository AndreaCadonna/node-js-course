# Asymmetric Encryption (RSA)

Understanding public/private key cryptography with RSA.

## Overview

**Asymmetric encryption** uses two different but mathematically related keys:
- **Public key**: Encrypts data (can be shared publicly)
- **Private key**: Decrypts data (must be kept secret)

## How RSA Works

### Key Concepts

```
Alice wants to send message to Bob:
1. Bob generates key pair (public + private)
2. Bob shares public key with Alice
3. Alice encrypts message with Bob's public key
4. Only Bob's private key can decrypt it
```

### Mathematical Foundation

RSA security is based on factoring large primes:
- Easy: Multiply two large primes
- Hard: Factor the product back to primes

## Use Cases

### 1. Hybrid Encryption (Most Common)
```javascript
// Encrypt large data:
// 1. Generate random AES key
// 2. Encrypt data with AES (fast)
// 3. Encrypt AES key with RSA (secure)
// 4. Send both
```

### 2. Key Exchange
```javascript
// Securely share symmetric keys
```

### 3. Digital Signatures
```javascript
// Sign with private key, verify with public
```

## Key Sizes

- **1024-bit**: Deprecated (insecure)
- **2048-bit**: Standard (secure until ~2030)
- **4096-bit**: High security (slower, future-proof)

## Best Practices

✅ Use OAEP padding (not PKCS1)  
✅ Use 2048-bit minimum  
✅ Use hybrid encryption for large data  
✅ Protect private keys with passphrases  
✅ Rotate keys periodically  

❌ Don't encrypt large data directly  
❌ Don't share private keys  
❌ Don't use weak padding  

## Summary

RSA enables secure communication without pre-shared secrets!
