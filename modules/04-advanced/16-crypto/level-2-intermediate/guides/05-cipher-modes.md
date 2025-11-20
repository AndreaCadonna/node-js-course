# Cipher Modes Explained

Understanding different AES encryption modes: GCM, CBC, and CTR.

## Common Modes

### 1. GCM (Galois/Counter Mode)

**Features:**
- Authenticated encryption
- Parallel processing
- No padding needed
- Fast

**When to use**: Default choice for new applications

### 2. CBC (Cipher Block Chaining)

**Features:**
- Traditional mode
- Sequential processing
- Requires padding
- Needs separate MAC

**When to use**: Legacy systems only

### 3. CTR (Counter Mode)

**Features:**
- Streaming mode
- Parallel processing
- No padding
- Needs separate MAC

**When to use**: Streaming applications

## Mode Comparison

| Feature | GCM | CBC | CTR |
|---------|-----|-----|-----|
| **Authentication** | Built-in | Separate | Separate |
| **Speed** | Fast | Medium | Fast |
| **Parallel** | Yes | No | Yes |
| **Padding** | No | Yes | No |
| **Recommended** | ✓ Yes | Legacy | Sometimes |

## IV Requirements

- **GCM**: 96-bit IV, must be unique
- **CBC**: 128-bit IV, must be random
- **CTR**: 128-bit nonce, must be unique

## Best Practices

✅ Use GCM for new applications  
✅ Generate new IV/nonce each time  
✅ Add authentication if not using GCM  

❌ Don't reuse IVs  
❌ Don't use ECB mode (insecure)  

## Summary

GCM is the modern standard - use it unless you have specific requirements!
