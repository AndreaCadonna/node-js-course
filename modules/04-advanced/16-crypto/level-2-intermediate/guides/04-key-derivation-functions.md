# Key Derivation Functions

Understanding HKDF, scrypt, and PBKDF2 for secure key generation.

## Types of KDFs

### 1. HKDF (HMAC-based)

**Purpose**: Expand one key into multiple keys

```javascript
// Derive multiple keys from master key
const encKey = hkdf(masterKey, 'encryption')
const macKey = hkdf(masterKey, 'mac')
const signKey = hkdf(masterKey, 'signing')
```

**When to use**: Key expansion, not passwords

### 2. scrypt

**Purpose**: Password-based key derivation

```javascript
// Memory-hard function
// Resists GPU/ASIC attacks
const key = scrypt(password, salt, N=16384, r=8, p=1)
```

**When to use**: Deriving keys from passwords

### 3. PBKDF2

**Purpose**: Password-based (older standard)

```javascript
// Iteration-based
const key = pbkdf2(password, salt, iterations=100000)
```

**When to use**: Legacy systems, wide compatibility

## Comparison

| Feature | HKDF | scrypt | PBKDF2 |
|---------|------|--------|--------|
| **Speed** | Fast | Slow | Medium |
| **Memory** | Low | High | Low |
| **Purpose** | Key expansion | Passwords | Passwords |
| **Security** | N/A | Highest | Good |

## Best Practices

✅ Use HKDF for key expansion  
✅ Use scrypt for new password systems  
✅ Use unique salts  
✅ Tune parameters for security/UX balance  

## Summary

Different KDFs for different purposes - choose based on your needs!
