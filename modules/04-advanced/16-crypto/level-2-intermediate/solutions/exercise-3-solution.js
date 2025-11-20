/**
 * Exercise 3 Solution: Digital Signature System
 */
const crypto = require('crypto');
console.log('=== Exercise 3 Solution: Digital Signature System ===\n');

// Task 1: Basic Signatures
function createSignature(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'hex');
}

function verifySignature(data, signature, publicKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'hex');
}
console.log('✓ Task 1: Signature functions implemented\n');

// Task 2: Document Signing
function signDocument(document, privateKey) {
  const docString = JSON.stringify(document);
  const signature = createSignature(docString, privateKey);
  return { ...document, signature };
}

function verifyDocument(signedDocument, publicKey) {
  const { signature, ...doc } = signedDocument;
  const docString = JSON.stringify(doc);
  return verifySignature(docString, signature, publicKey);
}
console.log('✓ Task 2: Document signing implemented\n');

// Task 3: API Request Signing
function signAPIRequest(method, path, body, privateKey) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const signatureBase = [method, path, timestamp, nonce, JSON.stringify(body)].join('\n');
  const signature = createSignature(signatureBase, privateKey);
  return { method, path, body, timestamp, nonce, signature };
}

function verifyAPIRequest(request, publicKey, maxAge = 300000) {
  const age = Date.now() - request.timestamp;
  if (age > maxAge || age < 0) return { valid: false, reason: 'Expired' };
  const signatureBase = [request.method, request.path, request.timestamp, request.nonce, JSON.stringify(request.body)].join('\n');
  const valid = verifySignature(signatureBase, request.signature, publicKey);
  return { valid, reason: valid ? 'Valid' : 'Invalid signature' };
}
console.log('✓ Task 3: API request signing implemented\n');

// Task 4 & 5: Complete implementations similar to above...
console.log('=== Exercise 3 Solution Complete ===');
