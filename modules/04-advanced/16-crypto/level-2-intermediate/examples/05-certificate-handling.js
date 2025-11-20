/**
 * Certificate Handling Examples
 *
 * Demonstrates working with X.509 certificates and public keys.
 * Certificates bind public keys to identities.
 */

const crypto = require('crypto');

console.log('=== Certificate Handling ===\n');

// Example 1: Generate Self-Signed Certificate
console.log('1. Creating Self-Signed Certificate:');

// First, generate a key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

console.log('Generated RSA key pair');
console.log('Public key type:', crypto.createPublicKey(publicKey).asymmetricKeyType);
console.log('Public key size:', crypto.createPublicKey(publicKey).asymmetricKeyDetails.modulusLength, 'bits');
console.log();

// Note: Creating actual X.509 certificates requires external tools like OpenSSL
// We'll demonstrate working with certificate-like structures

// Example 2: Extract Public Key from Certificate Format
console.log('2. Working with Public Keys:');

// Create a key object
const publicKeyObject = crypto.createPublicKey(publicKey);

// Export in different formats
const spkiPEM = publicKeyObject.export({ type: 'spki', format: 'pem' });
const spkiDER = publicKeyObject.export({ type: 'spki', format: 'der' });

console.log('Public key (PEM format):');
console.log(spkiPEM.substring(0, 100) + '...');
console.log('\nPublic key (DER format):');
console.log('Length:', spkiDER.length, 'bytes');
console.log('First 20 bytes:', spkiDER.slice(0, 20).toString('hex'));
console.log();

// Example 3: Verify Key Pair Match
console.log('3. Verifying Key Pair Match:');

function verifyKeyPairMatch(publicKey, privateKey) {
  // Encrypt with public key
  const testData = crypto.randomBytes(32);
  const encrypted = crypto.publicEncrypt(publicKey, testData);

  // Try to decrypt with private key
  try {
    const decrypted = crypto.privateDecrypt(privateKey, encrypted);
    return crypto.timingSafeEqual(testData, decrypted);
  } catch (err) {
    return false;
  }
}

const match = verifyKeyPairMatch(publicKey, privateKey);
console.log('Keys match:', match ? '✓' : '✗');

// Generate different key pair
const differentKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const mismatch = verifyKeyPairMatch(publicKey, differentKeys.privateKey);
console.log('Mismatched keys:', mismatch ? '✗ UNEXPECTED' : '✗ (correctly detected)');
console.log();

// Example 4: Certificate-Like Structure
console.log('4. Certificate-Like Metadata Structure:');

const certificateInfo = {
  version: 3,
  serialNumber: crypto.randomBytes(16).toString('hex'),
  subject: {
    commonName: 'example.com',
    organization: 'Example Corp',
    country: 'US'
  },
  issuer: {
    commonName: 'Example CA',
    organization: 'Example Corp',
    country: 'US'
  },
  notBefore: new Date(),
  notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  publicKey: publicKey,
  signatureAlgorithm: 'sha256WithRSAEncryption'
};

console.log('Certificate-like structure:');
console.log(JSON.stringify({
  ...certificateInfo,
  publicKey: '[Public Key PEM]',
  notBefore: certificateInfo.notBefore.toISOString(),
  notAfter: certificateInfo.notAfter.toISOString()
}, null, 2));
console.log();

// Example 5: Self-Signed Certificate Simulation
console.log('5. Self-Signed Certificate Simulation:');

function createSelfSignedCert(subject, keyPair) {
  const cert = {
    version: 3,
    serialNumber: crypto.randomBytes(16).toString('hex'),
    subject,
    issuer: subject, // Self-signed: issuer = subject
    notBefore: new Date(),
    notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    publicKey: keyPair.publicKey,
    extensions: {
      basicConstraints: { CA: false },
      keyUsage: ['digitalSignature', 'keyEncipherment']
    }
  };

  // Sign the certificate data with private key
  const certData = JSON.stringify({
    version: cert.version,
    serialNumber: cert.serialNumber,
    subject: cert.subject,
    issuer: cert.issuer,
    notBefore: cert.notBefore.toISOString(),
    notAfter: cert.notAfter.toISOString(),
    publicKey: cert.publicKey
  });

  const sign = crypto.createSign('SHA256');
  sign.update(certData);
  cert.signature = sign.sign(keyPair.privateKey, 'hex');

  return cert;
}

function verifyCertificate(cert) {
  // Reconstruct the signed data
  const certData = JSON.stringify({
    version: cert.version,
    serialNumber: cert.serialNumber,
    subject: cert.subject,
    issuer: cert.issuer,
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
    publicKey: cert.publicKey
  });

  // Verify signature with public key (from cert for self-signed)
  const verify = crypto.createVerify('SHA256');
  verify.update(certData);
  return verify.verify(cert.publicKey, cert.signature, 'hex');
}

const keyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const cert = createSelfSignedCert(
  { commonName: 'test.example.com', organization: 'Test Org' },
  keyPair
);

console.log('Self-signed certificate created:');
console.log('  Serial:', cert.serialNumber);
console.log('  Subject:', cert.subject.commonName);
console.log('  Valid from:', cert.notBefore.toISOString());
console.log('  Valid to:', cert.notAfter.toISOString());
console.log();

const certValid = verifyCertificate(cert);
console.log('Certificate signature valid:', certValid ? '✓' : '✗');
console.log();

// Example 6: Certificate Chain Verification (Simplified)
console.log('6. Certificate Chain Verification:');

// Root CA
const rootCA = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const rootCert = createSelfSignedCert(
  { commonName: 'Root CA', organization: 'Root Authority' },
  rootCA
);

// Intermediate CA (signed by root)
const intermediateCA = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const intermediateCert = {
  ...createSelfSignedCert(
    { commonName: 'Intermediate CA', organization: 'Intermediate Authority' },
    intermediateCA
  ),
  issuer: rootCert.subject // Issued by root
};

// Sign intermediate cert with root CA's private key
const intermediateData = JSON.stringify({
  subject: intermediateCert.subject,
  publicKey: intermediateCert.publicKey
});
const signIntermediate = crypto.createSign('SHA256');
signIntermediate.update(intermediateData);
intermediateCert.signature = signIntermediate.sign(rootCA.privateKey, 'hex');

console.log('Certificate chain:');
console.log('  Root CA:', rootCert.subject.commonName);
console.log('  ↓');
console.log('  Intermediate CA:', intermediateCert.subject.commonName);
console.log();

// Verify intermediate cert with root CA's public key
const verifyIntermediate = crypto.createVerify('SHA256');
verifyIntermediate.update(intermediateData);
const intermediateValid = verifyIntermediate.verify(rootCA.publicKey, intermediateCert.signature, 'hex');

console.log('Intermediate cert signed by root:', intermediateValid ? '✓' : '✗');
console.log();

// Example 7: Public Key Fingerprint
console.log('7. Public Key Fingerprint:');

function getPublicKeyFingerprint(publicKey, algorithm = 'sha256') {
  const keyDER = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
  return crypto.createHash(algorithm).update(keyDER).digest('hex');
}

const fingerprint = getPublicKeyFingerprint(publicKey);
const fingerprintSHA1 = getPublicKeyFingerprint(publicKey, 'sha1');

console.log('Public key fingerprints:');
console.log('  SHA-256:', fingerprint);
console.log('  SHA-1:', fingerprintSHA1);
console.log('\nFingerprints are used to verify key identity');
console.log();

// Example 8: Key Pinning Simulation
console.log('8. Public Key Pinning:');

const trustedFingerprints = new Set([
  getPublicKeyFingerprint(publicKey),
  getPublicKeyFingerprint(rootCA.publicKey)
]);

function isPinnedKey(publicKey) {
  const fingerprint = getPublicKeyFingerprint(publicKey);
  return trustedFingerprints.has(fingerprint);
}

console.log('Pinned keys:', trustedFingerprints.size);
console.log('Test key 1 pinned:', isPinnedKey(publicKey) ? '✓' : '✗');
console.log('Test key 2 pinned:', isPinnedKey(rootCA.publicKey) ? '✓' : '✗');

const unknownKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
console.log('Unknown key pinned:', isPinnedKey(unknownKey.publicKey) ? '✗ BREACH' : '✗ (correctly rejected)');
console.log();

// Example 9: Certificate Expiry Check
console.log('9. Certificate Expiry Validation:');

function isCertificateValid(cert) {
  const now = new Date();
  const notBefore = new Date(cert.notBefore);
  const notAfter = new Date(cert.notAfter);

  if (now < notBefore) {
    return { valid: false, reason: 'Certificate not yet valid' };
  }

  if (now > notAfter) {
    return { valid: false, reason: 'Certificate expired' };
  }

  return { valid: true, reason: 'Certificate is valid' };
}

const validity = isCertificateValid(cert);
console.log('Certificate validity:', validity.valid ? '✓' : '✗');
console.log('Reason:', validity.reason);

// Create expired certificate
const expiredCert = {
  ...cert,
  notBefore: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
  notAfter: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
};

const expiredValidity = isCertificateValid(expiredCert);
console.log('Expired cert valid:', expiredValidity.valid ? '✗ UNEXPECTED' : '✗ (correctly rejected)');
console.log('Reason:', expiredValidity.reason);
console.log();

// Example 10: Real-World Certificate Utilities
console.log('10. Certificate Management Utilities:');

class CertificateManager {
  constructor() {
    this.certificates = new Map();
  }

  addCertificate(id, cert) {
    this.certificates.set(id, cert);
  }

  getCertificate(id) {
    return this.certificates.get(id);
  }

  verifyCertificate(id) {
    const cert = this.certificates.get(id);
    if (!cert) return { valid: false, reason: 'Certificate not found' };

    // Check expiry
    const validity = isCertificateValid(cert);
    if (!validity.valid) return validity;

    // Check signature
    const signatureValid = verifyCertificate(cert);
    if (!signatureValid) return { valid: false, reason: 'Invalid signature' };

    return { valid: true, reason: 'Certificate is valid' };
  }

  listCertificates() {
    return Array.from(this.certificates.entries()).map(([id, cert]) => ({
      id,
      subject: cert.subject.commonName,
      issuer: cert.issuer.commonName,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter
    }));
  }
}

const manager = new CertificateManager();
manager.addCertificate('cert-1', cert);
manager.addCertificate('root-ca', rootCert);

console.log('Certificate manager:');
manager.listCertificates().forEach(c => {
  console.log(`  ${c.id}: ${c.subject} (expires: ${new Date(c.notAfter).toLocaleDateString()})`);
});
console.log();

const verification = manager.verifyCertificate('cert-1');
console.log('Cert-1 verification:', verification.valid ? '✓' : '✗');
console.log('Reason:', verification.reason);

console.log('\n=== Key Takeaways ===');
console.log('✓ Certificates bind public keys to identities');
console.log('✓ X.509 is the standard certificate format');
console.log('✓ Self-signed certificates sign their own data');
console.log('✓ Certificate chains establish trust hierarchies');
console.log('✓ Public key fingerprints verify key identity');
console.log('✓ Always check certificate expiry dates');
console.log('✓ Key pinning prevents man-in-the-middle attacks');
console.log('✓ Certificate signatures prove authenticity');
console.log('✓ Root CA certificates are the trust anchors');
console.log('✓ In production, use proper X.509 certificates');
