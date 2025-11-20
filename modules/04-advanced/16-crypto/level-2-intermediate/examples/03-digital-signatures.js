/**
 * Digital Signatures Examples
 *
 * Demonstrates creating and verifying digital signatures.
 * Signatures provide authentication and non-repudiation.
 */

const crypto = require('crypto');

console.log('=== Digital Signatures ===\n');

// Example 1: Basic RSA Signature
console.log('1. Creating and Verifying RSA Signature:');

// Generate key pair for signing
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const message = 'Important contract: Transfer $1000 to account XYZ';

// Create signature with private key
const sign = crypto.createSign('SHA256');
sign.update(message);
sign.end();
const signature = sign.sign(privateKey, 'hex');

console.log('Message:', message);
console.log('Signature:', signature.slice(0, 60) + '...');
console.log('Signature length:', signature.length, 'chars');
console.log();

// Verify signature with public key
const verify = crypto.createVerify('SHA256');
verify.update(message);
verify.end();
const isValid = verify.verify(publicKey, signature, 'hex');

console.log('Signature valid:', isValid ? '✓' : '✗');
console.log();

// Example 2: Signature Prevents Tampering
console.log('2. Detecting Message Tampering:');

const originalMsg = 'Transfer $100';
const tamperedMsg = 'Transfer $999999'; // Attacker tries to modify

// Original signature
const signOrig = crypto.createSign('SHA256');
signOrig.update(originalMsg);
const sigOrig = signOrig.sign(privateKey, 'hex');

console.log('Original message:', originalMsg);
console.log('Signature created: ✓');

// Try to verify tampered message
const verifyTampered = crypto.createVerify('SHA256');
verifyTampered.update(tamperedMsg);
const isTamperedValid = verifyTampered.verify(publicKey, sigOrig, 'hex');

console.log('Tampered message:', tamperedMsg);
console.log('Signature valid:', isTamperedValid ? '✗ SECURITY BREACH!' : '✗ (correctly rejected)');
console.log('✓ Signature detected tampering!');
console.log();

// Example 3: Different Signature Algorithms
console.log('3. Different Signature Algorithms:');

const testData = 'Data to sign with different algorithms';

// RSA with SHA-256
const signSHA256 = crypto.createSign('SHA256');
signSHA256.update(testData);
const sigSHA256 = signSHA256.sign(privateKey, 'hex');

// RSA with SHA-512
const signSHA512 = crypto.createSign('SHA512');
signSHA512.update(testData);
const sigSHA512 = signSHA512.sign(privateKey, 'hex');

console.log('SHA-256 signature length:', sigSHA256.length, 'chars');
console.log('SHA-512 signature length:', sigSHA512.length, 'chars');
console.log('Note: Both produce same length (determined by RSA key size)');
console.log();

// Verify both
const verifySHA256 = crypto.createVerify('SHA256');
verifySHA256.update(testData);
console.log('SHA-256 verification:', verifySHA256.verify(publicKey, sigSHA256, 'hex') ? '✓' : '✗');

const verifySHA512 = crypto.createVerify('SHA512');
verifySHA512.update(testData);
console.log('SHA-512 verification:', verifySHA512.verify(publicKey, sigSHA512, 'hex') ? '✓' : '✗');
console.log();

// Example 4: Signing Binary Data
console.log('4. Signing Binary Data:');

const binaryData = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in binary

const signBinary = crypto.createSign('SHA256');
signBinary.update(binaryData);
const binarySig = signBinary.sign(privateKey);

console.log('Binary data:', binaryData);
console.log('Signature (base64):', binarySig.toString('base64').slice(0, 40) + '...');

const verifyBinary = crypto.createVerify('SHA256');
verifyBinary.update(binaryData);
console.log('Binary signature valid:', verifyBinary.verify(publicKey, binarySig) ? '✓' : '✗');
console.log();

// Example 5: Streaming Signature Creation
console.log('5. Streaming Signature (Large Data):');

// Simulate large file by signing in chunks
const signStream = crypto.createSign('SHA256');

const chunks = [
  'First chunk of data ',
  'Second chunk of data ',
  'Third chunk of data'
];

chunks.forEach(chunk => {
  signStream.update(chunk);
});

const streamSig = signStream.sign(privateKey, 'hex');
console.log('Streamed signature created');

// Verify with same data
const verifyStream = crypto.createVerify('SHA256');
chunks.forEach(chunk => {
  verifyStream.update(chunk);
});

const streamValid = verifyStream.verify(publicKey, streamSig, 'hex');
console.log('Stream signature valid:', streamValid ? '✓' : '✗');

// Verify it's same as signing all at once
const signAll = crypto.createSign('SHA256');
signAll.update(chunks.join(''));
const allSig = signAll.sign(privateKey, 'hex');

console.log('Streamed vs all-at-once:', streamSig === allSig ? '✓ Same' : '✗ Different');
console.log();

// Example 6: Utility Functions
console.log('6. Signature Utility Functions:');

/**
 * Sign data with private key
 */
function createSignature(data, privateKey, algorithm = 'SHA256') {
  const sign = crypto.createSign(algorithm);
  sign.update(data);
  return sign.sign(privateKey, 'hex');
}

/**
 * Verify signature with public key
 */
function verifySignature(data, signature, publicKey, algorithm = 'SHA256') {
  const verify = crypto.createVerify(algorithm);
  verify.update(data);
  return verify.verify(publicKey, signature, 'hex');
}

// Test utilities
const utilData = 'Test data for utilities';
const utilSig = createSignature(utilData, privateKey);
const utilValid = verifySignature(utilData, utilSig, publicKey);

console.log('Utility signature created:', utilSig.slice(0, 40) + '...');
console.log('Utility verification:', utilValid ? '✓' : '✗');
console.log();

// Example 7: Signed JSON Documents
console.log('7. Signing JSON Documents:');

const document = {
  type: 'transfer',
  from: 'alice',
  to: 'bob',
  amount: 1000,
  timestamp: new Date().toISOString()
};

// Sign the JSON
const docString = JSON.stringify(document);
const docSignature = createSignature(docString, privateKey);

const signedDocument = {
  ...document,
  signature: docSignature
};

console.log('Signed document:', JSON.stringify(signedDocument, null, 2));
console.log();

// Verify the document
function verifyDocument(signedDoc, publicKey) {
  const { signature, ...doc } = signedDoc;
  const docString = JSON.stringify(doc);
  return verifySignature(docString, signature, publicKey);
}

const docValid = verifyDocument(signedDocument, publicKey);
console.log('Document signature valid:', docValid ? '✓' : '✗');

// Try tampering
const tamperedDoc = { ...signedDocument, amount: 99999 };
const tamperedValid = verifyDocument(tamperedDoc, publicKey);
console.log('Tampered document valid:', tamperedValid ? '✗ BREACH' : '✗ (correctly rejected)');
console.log();

// Example 8: API Request Signing
console.log('8. API Request Signing:');

function signAPIRequest(method, path, body, privateKey) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Create signature base string
  const signatureBase = [
    method.toUpperCase(),
    path,
    timestamp,
    nonce,
    JSON.stringify(body)
  ].join('\n');

  const signature = createSignature(signatureBase, privateKey);

  return {
    method,
    path,
    body,
    timestamp,
    nonce,
    signature
  };
}

function verifyAPIRequest(request, publicKey, maxAge = 300000) {
  // Check timestamp (prevent replay attacks)
  const age = Date.now() - request.timestamp;
  if (age > maxAge || age < 0) {
    return { valid: false, reason: 'Request expired or timestamp invalid' };
  }

  // Verify signature
  const signatureBase = [
    request.method.toUpperCase(),
    request.path,
    request.timestamp,
    request.nonce,
    JSON.stringify(request.body)
  ].join('\n');

  const valid = verifySignature(signatureBase, request.signature, publicKey);

  return { valid, reason: valid ? 'Valid' : 'Invalid signature' };
}

// Test API signing
const apiRequest = signAPIRequest(
  'POST',
  '/api/transfer',
  { to: 'bob', amount: 500 },
  privateKey
);

console.log('API Request:');
console.log('  Method:', apiRequest.method);
console.log('  Path:', apiRequest.path);
console.log('  Body:', JSON.stringify(apiRequest.body));
console.log('  Timestamp:', new Date(apiRequest.timestamp).toISOString());
console.log('  Signature:', apiRequest.signature.slice(0, 40) + '...');
console.log();

const apiVerification = verifyAPIRequest(apiRequest, publicKey);
console.log('API Request valid:', apiVerification.valid ? '✓' : '✗');
console.log('Reason:', apiVerification.reason);
console.log();

// Example 9: Multi-party Signatures
console.log('9. Multi-party Signatures (Co-signing):');

// Generate key pairs for multiple signers
const alice = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const bob = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const charlie = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });

const contract = 'We agree to the terms of this partnership';

// Each party signs
const aliceSignature = createSignature(contract, alice.privateKey);
const bobSignature = createSignature(contract, bob.privateKey);
const charlieSignature = createSignature(contract, charlie.privateKey);

const multiSignedDoc = {
  contract,
  signatures: [
    { signer: 'alice', signature: aliceSignature },
    { signer: 'bob', signature: bobSignature },
    { signer: 'charlie', signature: charlieSignature }
  ]
};

console.log('Multi-signed contract:');
console.log('  Contract:', contract);
console.log('  Signers:', multiSignedDoc.signatures.length);

// Verify all signatures
const publicKeys = {
  alice: alice.publicKey,
  bob: bob.publicKey,
  charlie: charlie.publicKey
};

const verifications = multiSignedDoc.signatures.map(sig => {
  const valid = verifySignature(contract, sig.signature, publicKeys[sig.signer]);
  return { signer: sig.signer, valid };
});

console.log('Verifications:');
verifications.forEach(v => {
  console.log(`  ${v.signer}: ${v.valid ? '✓' : '✗'}`);
});

const allValid = verifications.every(v => v.valid);
console.log('All signatures valid:', allValid ? '✓' : '✗');
console.log();

// Example 10: Detached Signatures
console.log('10. Detached Signatures (Separate File):');

// In real world, you might sign a file and store signature separately
const fileContent = 'Contents of important document...';
const fileName = 'document.txt';

// Create detached signature
const detachedSig = createSignature(fileContent, privateKey);

// Store signature separately
const signatureFile = {
  fileName,
  algorithm: 'SHA256',
  signature: detachedSig,
  signedAt: new Date().toISOString()
};

console.log('Signature file:', JSON.stringify(signatureFile, null, 2));
console.log();

// Verify detached signature
function verifyDetachedSignature(fileContent, signatureFile, publicKey) {
  if (signatureFile.algorithm !== 'SHA256') {
    throw new Error('Unsupported algorithm');
  }

  return verifySignature(fileContent, signatureFile.signature, publicKey);
}

const detachedValid = verifyDetachedSignature(fileContent, signatureFile, publicKey);
console.log('Detached signature valid:', detachedValid ? '✓' : '✗');
console.log();

// Example 11: Code Signing Pattern
console.log('11. Code Signing Pattern:');

function signCode(code, metadata, privateKey) {
  const package = {
    code,
    metadata: {
      ...metadata,
      signedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  const signatureData = JSON.stringify(package);
  const signature = createSignature(signatureData, privateKey);

  return {
    ...package,
    signature
  };
}

function verifyCode(signedPackage, publicKey) {
  const { signature, ...package } = signedPackage;
  const signatureData = JSON.stringify(package);
  return verifySignature(signatureData, signature, publicKey);
}

const myCode = 'function hello() { return "Hello World"; }';
const codeMetadata = {
  author: 'alice@example.com',
  description: 'Hello function'
};

const signedCode = signCode(myCode, codeMetadata, privateKey);
console.log('Signed code package:');
console.log('  Code:', signedCode.code.slice(0, 30) + '...');
console.log('  Author:', signedCode.metadata.author);
console.log('  Signed at:', signedCode.metadata.signedAt);
console.log('  Signature:', signedCode.signature.slice(0, 40) + '...');
console.log();

const codeValid = verifyCode(signedCode, publicKey);
console.log('Code signature valid:', codeValid ? '✓' : '✗');
console.log();

// Example 12: Performance Testing
console.log('12. Signature Performance:');

const perfData = 'x'.repeat(1000); // 1KB data

// Time signature creation
const startSign = Date.now();
for (let i = 0; i < 100; i++) {
  const sign = crypto.createSign('SHA256');
  sign.update(perfData);
  sign.sign(privateKey);
}
const timeSign = Date.now() - startSign;

console.log('100 signatures (1KB data each):', timeSign, 'ms');
console.log('Average per signature:', (timeSign / 100).toFixed(2), 'ms');
console.log();

// Time verification
const perfSig = createSignature(perfData, privateKey);
const startVerify = Date.now();
for (let i = 0; i < 100; i++) {
  const verify = crypto.createVerify('SHA256');
  verify.update(perfData);
  verify.verify(publicKey, perfSig, 'hex');
}
const timeVerify = Date.now() - startVerify;

console.log('100 verifications:', timeVerify, 'ms');
console.log('Average per verification:', (timeVerify / 100).toFixed(2), 'ms');
console.log('Verification is', (timeSign / timeVerify).toFixed(2) + 'x faster than signing');
console.log();

// Example 13: Error Handling
console.log('13. Error Handling:');

function safeSign(data, privateKey) {
  try {
    if (!data) throw new Error('Data is required');
    if (!privateKey) throw new Error('Private key is required');

    return {
      success: true,
      signature: createSignature(data, privateKey)
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

function safeVerify(data, signature, publicKey) {
  try {
    if (!data || !signature || !publicKey) {
      throw new Error('Data, signature, and public key are required');
    }

    const valid = verifySignature(data, signature, publicKey);

    return {
      success: true,
      valid,
      message: valid ? 'Signature is valid' : 'Signature is invalid'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Test error handling
const signResult = safeSign('Valid data', privateKey);
console.log('Sign result:', signResult.success ? '✓' : '✗');

const verifyResult = safeVerify('Valid data', signResult.signature, publicKey);
console.log('Verify result:', verifyResult.success ? '✓' : '✗');
console.log('Message:', verifyResult.message);

console.log('\n=== Key Takeaways ===');
console.log('✓ Signatures provide authentication and non-repudiation');
console.log('✓ Sign with private key, verify with public key');
console.log('✓ Signatures detect any tampering with data');
console.log('✓ Can sign any data: text, binary, JSON, files');
console.log('✓ Streaming updates work for large data');
console.log('✓ Include timestamps to prevent replay attacks');
console.log('✓ SHA-256 is standard, SHA-512 for higher security');
console.log('✓ Verification is faster than signature creation');
console.log('✓ Signatures cannot be forged without private key');
console.log('✓ Use detached signatures for large files');
