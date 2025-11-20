/**
 * Exercise 4: Secure Key Exchange
 *
 * OBJECTIVE:
 * Build a key exchange system using asymmetric cryptography.
 *
 * REQUIREMENTS:
 * 1. Implement RSA-based key exchange
 * 2. Use HKDF for key derivation
 * 3. Create session key management
 * 4. Implement authenticated key exchange
 * 5. Build complete secure channel
 *
 * LEARNING GOALS:
 * - Master key exchange protocols
 * - Combine asymmetric and symmetric crypto
 * - Understand session key management
 * - Prevent man-in-the-middle attacks
 * - Build secure communication channels
 */

const crypto = require('crypto');

console.log('=== Exercise 4: Secure Key Exchange ===\n');

// Task 1: Basic Key Exchange
console.log('Task 1: Implement Basic Key Exchange');
/**
 * TODO 1: Exchange session key between two parties
 * @param {KeyObject} senderPrivateKey
 * @param {KeyObject} recipientPublicKey
 * @returns {Object} { sessionKey, encryptedSessionKey }
 */
function initiateKeyExchange(senderPrivateKey, recipientPublicKey) {
  // Your code here
  // Generate session key
  // Encrypt with recipient's public key
}

function receiveKeyExchange(encryptedSessionKey, recipientPrivateKey) {
  // Your code here
  // Decrypt session key
}

console.log('✓ Task 1 implementation needed\n');

// Task 2: Authenticated Key Exchange
console.log('Task 2: Add Authentication to Key Exchange');
/**
 * TODO 2: Sign the encrypted session key
 */
function authenticatedKeyExchange(senderPrivateKey, recipientPublicKey) {
  // Your code here
  // Generate session key
  // Encrypt it
  // Sign the encrypted key
  // Return { encryptedKey, signature }
}

function verifyAndReceiveKey(exchange, senderPublicKey, recipientPrivateKey) {
  // Your code here
  // Verify signature first
  // Then decrypt session key
}

console.log('✓ Task 2 implementation needed\n');

// Task 3: Derive Multiple Keys from Session Key
console.log('Task 3: Key Derivation from Session Key');
/**
 * TODO 3: Use HKDF to derive encryption and MAC keys
 */
function deriveSessionKeys(sessionKey) {
  // Your code here
  // Derive encryption key
  // Derive MAC key
  // Return { encryptionKey, macKey }
}

console.log('✓ Task 3 implementation needed\n');

// Task 4: Secure Channel
console.log('Task 4: Build Secure Communication Channel');
/**
 * TODO 4: Complete secure channel class
 */
class SecureChannel {
  constructor(ownKeyPair) {
    this.keyPair = ownKeyPair;
    this.sessionKeys = null;
  }

  initiateChannel(recipientPublicKey) {
    // Initiate key exchange
    // Derive session keys
    // Return exchange data
  }

  acceptChannel(exchange, senderPublicKey) {
    // Accept key exchange
    // Verify authentication
    // Derive session keys
  }

  sendMessage(message) {
    // Encrypt message with session keys
  }

  receiveMessage(encrypted) {
    // Decrypt message with session keys
  }

  rotateKeys() {
    // Generate new session keys
  }
}

console.log('✓ Task 4 implementation needed\n');

// Task 5: Complete Key Exchange Protocol
console.log('Task 5: Implement Full Protocol');
/**
 * TODO 5: Complete key exchange system with forward secrecy
 */
class KeyExchangeProtocol {
  constructor(id) {
    this.id = id;
    this.keyPair = null;
    this.sessions = new Map();
  }

  initialize() {
    // Generate long-term key pair
  }

  createSession(partnerId, partnerPublicKey) {
    // Create new session
    // Generate ephemeral session key
    // Return session ID and exchange data
  }

  acceptSession(sessionId, exchange, partnerPublicKey) {
    // Accept session request
    // Verify and establish session
  }

  encrypt(sessionId, data) {
    // Encrypt data for session
  }

  decrypt(sessionId, encrypted) {
    // Decrypt data from session
  }

  closeSession(sessionId) {
    // Close and cleanup session
  }
}

console.log('✓ Task 5 implementation needed\n');

console.log('=== Exercise 4 Complete ===');
console.log('\nKey Takeaways:');
console.log('- Key exchange enables secure communication');
console.log('- Asymmetric crypto exchanges symmetric keys');
console.log('- Authentication prevents man-in-the-middle attacks');
console.log('- HKDF derives multiple keys from one session key');
console.log('- Session keys should be rotated periodically');
