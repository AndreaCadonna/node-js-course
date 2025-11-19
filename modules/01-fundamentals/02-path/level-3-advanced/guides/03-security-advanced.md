# Guide: Advanced Path Security Patterns

**Reading Time**: 40 minutes
**Difficulty**: Advanced
**Prerequisites**: Level 2 completed, understanding of security principles

---

## Introduction

Path handling is one of the most common sources of security vulnerabilities in web applications. Path traversal attacks rank consistently in the OWASP Top 10, and improper path handling can lead to unauthorized file access, code execution, and data breaches.

This guide covers advanced security patterns, attack vectors, and defense-in-depth strategies for production systems.

### What You'll Learn

- Common path-based attack vectors
- Defense-in-depth strategies
- Encoding attack techniques
- Race condition vulnerabilities
- Security validation layers
- Production security checklist
- Incident response patterns
- Security testing approaches

---

## Table of Contents

1. [Threat Model](#threat-model)
2. [Attack Vector Analysis](#attack-vector-analysis)
3. [Defense-in-Depth](#defense-in-depth)
4. [Encoding Attacks](#encoding-attacks)
5. [Race Conditions](#race-conditions)
6. [Validation Layers](#validation-layers)
7. [Security Checklist](#security-checklist)
8. [Testing Security](#testing-security)
9. [Incident Response](#incident-response)
10. [Production Hardening](#production-hardening)

---

## Threat Model

### Attacker Goals

1. **Read unauthorized files**
   - Configuration files (`.env`, `config.json`)
   - Source code
   - System files (`/etc/passwd`, `win.ini`)
   - Other users' data

2. **Write to unauthorized locations**
   - Overwrite system files
   - Plant malicious files
   - Modify application code

3. **Denial of Service**
   - Circular symlinks
   - Massive path lengths
   - Resource exhaustion

4. **Information Disclosure**
   - Error messages revealing paths
   - Directory listings
   - File existence checks

### Attacker Capabilities

**Low-skill attacker:**
- Uses basic traversal patterns (`../../../etc/passwd`)
- URL encoding (`%2e%2e%2f`)
- Common payloads from tutorials

**Medium-skill attacker:**
- Double encoding (`%252e%252e%252f`)
- Mixed encoding
- Null byte injection
- Symlink attacks

**High-skill attacker:**
- Unicode normalization attacks
- Race conditions (TOCTOU)
- Platform-specific exploits
- Chained vulnerabilities
- Zero-day techniques

---

## Attack Vector Analysis

### Vector 1: Basic Path Traversal

**Attack:**
```javascript
// Vulnerable code
app.get('/download', (req, res) => {
  const filename = req.query.file;
  const filepath = path.join('/app/uploads', filename);
  res.sendFile(filepath);
});

// Attacker requests:
GET /download?file=../../../etc/passwd
```

**Result:** Reads `/etc/passwd`

**Defense:**
```javascript
// Secure code
app.get('/download', (req, res) => {
  const filename = req.query.file;

  // Validate input
  if (!filename || filename.includes('..')) {
    return res.status(400).send('Invalid filename');
  }

  const filepath = path.join('/app/uploads', filename);

  // Validate resolved path
  const realpath = fs.realpathSync(filepath);
  if (!realpath.startsWith('/app/uploads')) {
    return res.status(403).send('Access denied');
  }

  res.sendFile(realpath);
});
```

---

### Vector 2: URL Encoding

**Attack:**
```javascript
// Attacker encodes the traversal
GET /download?file=%2e%2e%2f%2e%2e%2fetc%2fpasswd
// Decodes to: ../../etc/passwd
```

**Why it works:**
Many frameworks automatically decode URLs, but the validation happens before decoding.

**Defense:**
```javascript
// Decode input before validation
const filename = decodeURIComponent(req.query.file);

// Then validate
if (filename.includes('..')) {
  return res.status(400).send('Invalid filename');
}
```

---

### Vector 3: Double Encoding

**Attack:**
```javascript
// Attacker double-encodes
GET /download?file=%252e%252e%252f%252e%252e%252fetc%252fpasswd
// First decode: %2e%2e%2f%2e%2e%2fetc%2fpasswd
// Second decode: ../../etc/passwd
```

**Why it works:**
Some systems decode once, validate, then decode again before use.

**Defense:**
```javascript
// Decode until no more encoding
function fullyDecode(input) {
  let decoded = input;
  let previous;

  do {
    previous = decoded;
    decoded = decodeURIComponent(decoded);
  } while (decoded !== previous && iterations++ < 10);

  return decoded;
}

const filename = fullyDecode(req.query.file);
// Now validate the fully decoded value
```

---

### Vector 4: Null Byte Injection

**Attack:**
```javascript
// Attacker adds null byte
GET /download?file=../../../../etc/passwd%00.jpg

// Code checks extension
if (filename.endsWith('.jpg')) {
  // Passes check
}

// But C functions stop at null byte
// Actual file read: ../../../../etc/passwd
```

**Why it works (historical):**
Older systems and some C-based libraries treat null byte as string terminator.

**Defense:**
```javascript
// Reject null bytes
if (filename.includes('\0') || filename.includes('%00')) {
  return res.status(400).send('Invalid filename');
}

// Use Node.js built-in validation (throws on null bytes)
try {
  fs.accessSync(filepath);
} catch (error) {
  if (error.code === 'ERR_INVALID_ARG_VALUE') {
    return res.status(400).send('Invalid filename');
  }
}
```

---

### Vector 5: Unicode Normalization

**Attack:**
```javascript
// Different Unicode representations of same character
const attack1 = 'file\u002e\u002e';  // Unicode dots
const attack2 = 'file..';             // Regular dots

// After normalization, both become 'file..'
attack1.normalize('NFC') === attack2.normalize('NFC');  // true
```

**Why it works:**
Validation on one form, but filesystem uses normalized form.

**Defense:**
```javascript
// Normalize before validation
const filename = req.query.file.normalize('NFC');

// Then validate normalized form
if (filename.includes('..')) {
  return res.status(400).send('Invalid filename');
}
```

---

### Vector 6: Symlink Attacks

**Attack:**
```javascript
// Attacker uploads file and creates symlink
fs.writeFileSync('/app/uploads/innocent.txt', 'data');
fs.symlinkSync('/etc/passwd', '/app/uploads/evil.txt');

// Your code reads "uploaded file"
const content = fs.readFileSync('/app/uploads/evil.txt');
// Actually reads /etc/passwd
```

**Defense:**
```javascript
// Check if file is a symlink before reading
const stat = fs.lstatSync(filepath);
if (stat.isSymbolicLink()) {
  return res.status(403).send('Symlinks not allowed');
}

// Or follow symlink and validate
const realpath = fs.realpathSync(filepath);
if (!realpath.startsWith('/app/uploads/')) {
  return res.status(403).send('Access denied');
}
```

---

### Vector 7: Case Sensitivity Bypass

**Attack:**
```javascript
// On case-insensitive filesystem (Windows)
GET /download?file=../../../WINDOWS/System32/config/sam

// Validation checks for 'windows'
if (filepath.toLowerCase().includes('windows')) {
  return res.status(403).send('Blocked');
}

// But Windows filesystem is case-insensitive
// File still accessible as WINDOWS, Windows, WiNdOwS, etc.
```

**Defense:**
```javascript
// Normalize case for validation on all platforms
const normalized = filepath.toLowerCase();
const blocklist = ['windows', 'system32', 'etc', 'passwd'];

if (blocklist.some(blocked => normalized.includes(blocked))) {
  return res.status(403).send('Blocked');
}
```

---

## Defense-in-Depth

### Layer 1: Input Validation

**Purpose:** Reject obviously malicious input

```javascript
function validateInput(filename) {
  const errors = [];

  // Check type
  if (typeof filename !== 'string') {
    errors.push('Filename must be a string');
  }

  // Check length
  if (filename.length === 0) {
    errors.push('Filename cannot be empty');
  }
  if (filename.length > 255) {
    errors.push('Filename too long');
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    errors.push('Null byte not allowed');
  }

  // Check for obvious traversal
  if (filename.includes('..')) {
    errors.push('Parent directory reference not allowed');
  }

  // Check for absolute paths
  if (path.isAbsolute(filename)) {
    errors.push('Absolute paths not allowed');
  }

  return { valid: errors.length === 0, errors };
}
```

---

### Layer 2: Encoding Detection

**Purpose:** Detect encoded attacks

```javascript
function detectEncodingAttacks(input) {
  const threats = [];

  // URL encoding
  if (/%[0-9a-fA-F]{2}/.test(input)) {
    const decoded = decodeURIComponent(input);
    if (decoded.includes('..') || decoded.includes('\0')) {
      threats.push('URL-encoded attack pattern');
    }
  }

  // Double encoding
  if (/%25[0-9a-fA-F]{2}/.test(input)) {
    threats.push('Double URL encoding detected');
  }

  // Unicode encoding
  if (/\\u[0-9a-fA-F]{4}/.test(input)) {
    threats.push('Unicode encoding detected');
  }

  // Hex encoding
  if (/\\x[0-9a-fA-F]{2}/.test(input)) {
    threats.push('Hex encoding detected');
  }

  return threats;
}
```

---

### Layer 3: Normalization

**Purpose:** Convert to canonical form

```javascript
function normalizePath(filepath) {
  // Unicode normalization
  let normalized = filepath.normalize('NFC');

  // Path normalization
  normalized = path.normalize(normalized);

  // Case normalization (for validation only)
  const forValidation = normalized.toLowerCase();

  return { normalized, forValidation };
}
```

---

### Layer 4: Boundary Enforcement

**Purpose:** Ensure path stays within allowed directory

```javascript
function enforceBoundary(filepath, baseDir) {
  const resolved = path.resolve(baseDir, filepath);
  const base = path.resolve(baseDir);

  // Check if resolved path starts with base
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error('Path outside boundary');
  }

  return resolved;
}
```

---

### Layer 5: Symlink Validation

**Purpose:** Handle symlinks safely

```javascript
function validateSymlinks(filepath, baseDir) {
  // Check if it's a symlink
  const stat = fs.lstatSync(filepath);

  if (stat.isSymbolicLink()) {
    // Get real path
    const realpath = fs.realpathSync(filepath);

    // Validate real path is within boundary
    if (!realpath.startsWith(baseDir + path.sep)) {
      throw new Error('Symlink points outside boundary');
    }

    return { isSymlink: true, realpath };
  }

  return { isSymlink: false, realpath: filepath };
}
```

---

### Layer 6: File Type Validation

**Purpose:** Ensure file type is expected

```javascript
function validateFileType(filepath, allowedExtensions) {
  const ext = path.extname(filepath).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File type ${ext} not allowed`);
  }

  // Check actual file content (magic bytes)
  const fd = fs.openSync(filepath, 'r');
  const buffer = Buffer.alloc(4);
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  // Example: Check for PNG
  if (ext === '.png') {
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
    if (!buffer.equals(pngMagic)) {
      throw new Error('File is not a valid PNG');
    }
  }

  return true;
}
```

---

### Layer 7: Access Control

**Purpose:** Verify user has permission

```javascript
async function checkPermissions(filepath, userId) {
  // Check file ownership
  const stat = fs.statSync(filepath);
  const fileInfo = await db.files.findOne({ path: filepath });

  if (fileInfo.ownerId !== userId) {
    throw new Error('Access denied');
  }

  // Check user permissions
  const user = await db.users.findOne({ id: userId });

  if (!user.permissions.includes('read')) {
    throw new Error('Insufficient permissions');
  }

  return true;
}
```

---

### Layer 8: Audit Logging

**Purpose:** Track all file access

```javascript
function logFileAccess(filepath, userId, action, result) {
  logger.info('File access', {
    timestamp: new Date().toISOString(),
    userId,
    filepath,
    action,
    result,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log to security log
  if (result === 'denied' || result === 'error') {
    securityLogger.warn('Suspicious file access', {
      userId,
      filepath,
      result
    });
  }
}
```

---

## Race Conditions

### TOCTOU (Time-of-Check-Time-of-Use)

**Vulnerability:**
```javascript
// Vulnerable code
if (fs.existsSync(filepath)) {
  // Attacker can change file here!
  const content = fs.readFileSync(filepath);
}
```

**Attack:**
```javascript
// Attacker's script
while (true) {
  fs.unlinkSync('/app/uploads/file.txt');
  fs.symlinkSync('/etc/passwd', '/app/uploads/file.txt');
}
```

**Defense:**
```javascript
// Use file descriptors
const fd = fs.openSync(filepath, 'r');
try {
  // File is now locked (on some filesystems)
  const stat = fs.fstatSync(fd);

  // Verify it's not a symlink
  if (stat.isSymbolicLink()) {
    throw new Error('Symlink detected');
  }

  // Read using file descriptor
  const buffer = Buffer.alloc(stat.size);
  fs.readSync(fd, buffer, 0, stat.size, 0);

  return buffer;
} finally {
  fs.closeSync(fd);
}
```

---

## Validation Layers

### Complete Validation Pipeline

```javascript
class SecurePathValidator {
  constructor(baseDir, options = {}) {
    this.baseDir = path.resolve(baseDir);
    this.options = options;
  }

  async validate(filepath, context = {}) {
    const pipeline = [
      () => this.validateInput(filepath),
      () => this.detectEncoding(filepath),
      () => this.normalizePath(filepath),
      () => this.enforceBoundary(filepath),
      () => this.checkSymlinks(filepath),
      () => this.validateFileType(filepath),
      () => this.checkPermissions(filepath, context.userId),
      () => this.logAccess(filepath, context)
    ];

    for (const step of pipeline) {
      await step();
    }

    return { valid: true, filepath: this.resolvedPath };
  }

  validateInput(filepath) {
    if (!filepath || typeof filepath !== 'string') {
      throw new ValidationError('Invalid input');
    }

    if (filepath.includes('\0')) {
      throw new SecurityError('Null byte detected');
    }

    if (filepath.includes('..')) {
      throw new SecurityError('Traversal pattern detected');
    }
  }

  // ... other methods
}
```

---

## Security Checklist

### Pre-Production Checklist

- [ ] Input validation implemented
- [ ] Encoding attacks detected
- [ ] Path normalization applied
- [ ] Boundary enforcement active
- [ ] Symlink handling configured
- [ ] File type validation enabled
- [ ] Access control implemented
- [ ] Audit logging active
- [ ] Error messages sanitized
- [ ] Security tests passing
- [ ] Penetration testing completed
- [ ] Code review performed
- [ ] Security documentation written
- [ ] Incident response plan ready

### Runtime Checklist

- [ ] Monitor for attack patterns
- [ ] Review security logs
- [ ] Track failed access attempts
- [ ] Update attack signatures
- [ ] Patch vulnerabilities promptly
- [ ] Review access patterns
- [ ] Test disaster recovery
- [ ] Update security docs

---

## Testing Security

### Unit Tests

```javascript
describe('Path Security', () => {
  it('should block path traversal', () => {
    expect(() => {
      validatePath('../../../etc/passwd');
    }).to.throw('Traversal pattern detected');
  });

  it('should detect URL encoding', () => {
    expect(() => {
      validatePath('%2e%2e%2fetc%2fpasswd');
    }).to.throw('Encoded attack detected');
  });

  it('should reject null bytes', () => {
    expect(() => {
      validatePath('file\0.txt');
    }).to.throw('Null byte detected');
  });
});
```

### Integration Tests

```javascript
describe('File Access', () => {
  it('should prevent unauthorized access', async () => {
    const response = await request(app)
      .get('/download?file=../../../etc/passwd')
      .expect(403);

    expect(response.body.error).to.include('Access denied');
  });

  it('should log security violations', async () => {
    await request(app)
      .get('/download?file=../../../etc/passwd');

    const logs = await getSecurityLogs();
    expect(logs).to.have.length(1);
    expect(logs[0]).to.include('Traversal pattern');
  });
});
```

### Penetration Testing

```javascript
// Attack scenarios for manual/automated testing
const attackVectors = [
  '../../../etc/passwd',
  '%2e%2e%2fetc%2fpasswd',
  '%252e%252e%252fetc%252fpasswd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  'file\0.jpg',
  '../../../../etc/passwd%00.jpg',
  'file\u002e\u002e',
  '..//..//..//etc/passwd',
  'etc/passwd',  // Try without traversal
  '....//....//etc/passwd',
  '..\\..\\..\\./../etc/passwd'
];

// Test each vector
attackVectors.forEach(vector => {
  test(`should block: ${vector}`, () => {
    expect(() => validatePath(vector)).to.throw();
  });
});
```

---

## Summary

**Key Security Principles:**
- Never trust user input
- Implement defense-in-depth
- Validate at every layer
- Log all security events
- Test with real attacks
- Update regularly
- Have incident response ready

**Common Mistakes:**
- Single-layer validation
- Validating before decoding
- Forgetting symlinks
- Trusting path.normalize() alone
- Not logging security events
- Inadequate testing

**Next Steps:**
- Audit your path handling code
- Implement multiple validation layers
- Add comprehensive logging
- Test with attack vectors
- Create incident response plan

---

**Further Reading:**
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [CWE-22: Path Traversal](https://cwe.mitre.org/data/definitions/22.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
