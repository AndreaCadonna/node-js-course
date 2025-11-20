/**
 * Exercise 3: Digital Signature System
 *
 * OBJECTIVE:
 * Implement a document signing and verification system.
 *
 * REQUIREMENTS:
 * 1. Create digital signatures
 * 2. Verify signatures
 * 3. Sign JSON documents
 * 4. Implement API request signing
 * 5. Build multi-signature system
 *
 * LEARNING GOALS:
 * - Master digital signature creation
 * - Understand signature verification
 * - Detect tampering attempts
 * - Implement real-world signing patterns
 * - Build authentication systems
 */

const crypto = require('crypto');

console.log('=== Exercise 3: Digital Signature System ===\n');

// Task 1: Basic Signature Functions
console.log('Task 1: Create and Verify Signatures');
/**
 * TODO 1: Create signature for data
 * @param {string} data - Data to sign
 * @param {string|KeyObject} privateKey - Private key
 * @returns {string} Signature as hex string
 */
function createSignature(data, privateKey) {
  // Your code here
  // Use SHA-256 algorithm
}

function verifySignature(data, signature, publicKey) {
  // Your code here
  // Return true if valid, false otherwise
}

console.log('✓ Task 1 implementation needed\n');

// Task 2: Document Signing
console.log('Task 2: Sign JSON Documents');
/**
 * TODO 2: Sign a JSON document
 * Add signature field to document
 * @param {Object} document - Document to sign
 * @param {KeyObject} privateKey - Private key
 * @returns {Object} Document with signature field
 */
function signDocument(document, privateKey) {
  // Your code here
  // Stringify document, create signature, add to document
}

function verifyDocument(signedDocument, publicKey) {
  // Your code here
  // Extract signature, verify against document data
}

console.log('✓ Task 2 implementation needed\n');

// Task 3: API Request Signing
console.log('Task 3: API Request Signing');
/**
 * TODO 3: Sign API requests with timestamp and nonce
 * Prevents replay attacks
 */
function signAPIRequest(method, path, body, privateKey) {
  // Your code here
  // Include timestamp, nonce, create signature
}

function verifyAPIRequest(request, publicKey, maxAge = 300000) {
  // Your code here
  // Check timestamp, verify signature
}

console.log('✓ Task 3 implementation needed\n');

// Task 4: Multi-Signature System
console.log('Task 4: Multi-Party Signatures');
/**
 * TODO 4: Implement multi-signature document
 */
class MultiSignatureDocument {
  constructor(content) {
    this.content = content;
    this.signatures = [];
  }

  addSignature(signerName, privateKey) {
    // Add signature from a signer
  }

  verifySignature(signerName, publicKey) {
    // Verify specific signer's signature
  }

  verifyAll(publicKeys) {
    // Verify all signatures
    // publicKeys is object: { signerName: publicKey }
  }

  isFullySigned(requiredSigners) {
    // Check if all required signers have signed
  }
}

console.log('✓ Task 4 implementation needed\n');

// Task 5: Signature Utilities
console.log('Task 5: Build Signature Utility Class');
/**
 * TODO 5: Complete signature utility
 */
class SignatureSystem {
  constructor() {
    this.keyPairs = new Map();
  }

  generateKeyPair(id) {
    // Generate and store key pair
  }

  sign(id, data) {
    // Sign data with stored private key
  }

  verify(id, data, signature) {
    // Verify signature with stored public key
  }

  exportPublicKey(id) {
    // Export public key for sharing
  }
}

console.log('✓ Task 5 implementation needed\n');

console.log('=== Exercise 3 Complete ===');
console.log('\nKey Takeaways:');
console.log('- Signatures provide authentication and non-repudiation');
console.log('- Sign with private key, verify with public key');
console.log('- Always include timestamps to prevent replay attacks');
console.log('- Multi-signature enables contract-like agreements');
console.log('- Signatures detect any data tampering');
