/**
 * Exercise 4 Solution: Secure Key Exchange
 */
const crypto = require('crypto');
console.log('=== Exercise 4 Solution: Secure Key Exchange ===\n');

// Task 1: Basic Key Exchange
function initiateKeyExchange(senderPrivateKey, recipientPublicKey) {
  const sessionKey = crypto.randomBytes(32);
  const encryptedSessionKey = crypto.publicEncrypt({
    key: recipientPublicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, sessionKey);
  return { sessionKey, encryptedSessionKey };
}

function receiveKeyExchange(encryptedSessionKey, recipientPrivateKey) {
  return crypto.privateDecrypt({
    key: recipientPrivateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, encryptedSessionKey);
}
console.log('✓ Task 1: Basic key exchange implemented\n');

// Task 2: Authenticated Key Exchange
function authenticatedKeyExchange(senderPrivateKey, recipientPublicKey) {
  const { sessionKey, encryptedSessionKey } = initiateKeyExchange(senderPrivateKey, recipientPublicKey);
  const sign = crypto.createSign('SHA256');
  sign.update(encryptedSessionKey);
  const signature = sign.sign(senderPrivateKey);
  return { encryptedKey: encryptedSessionKey, signature, _sessionKey: sessionKey };
}

function verifyAndReceiveKey(exchange, senderPublicKey, recipientPrivateKey) {
  const verify = crypto.createVerify('SHA256');
  verify.update(exchange.encryptedKey);
  if (!verify.verify(senderPublicKey, exchange.signature)) {
    throw new Error('Invalid signature - MITM attack detected!');
  }
  return receiveKeyExchange(exchange.encryptedKey, recipientPrivateKey);
}
console.log('✓ Task 2: Authenticated exchange implemented\n');

// Task 3: Key Derivation
function deriveSessionKeys(sessionKey) {
  const salt = crypto.randomBytes(16);
  const encryptionKey = crypto.hkdfSync('sha256', sessionKey, salt, Buffer.from('encryption'), 32);
  const macKey = crypto.hkdfSync('sha256', sessionKey, salt, Buffer.from('mac'), 32);
  return { encryptionKey, macKey, salt };
}
console.log('✓ Task 3: Key derivation implemented\n');
console.log('=== Exercise 4 Solution Complete ===');
