/**
 * Exercise 2: End-to-End Encrypted Chat System
 *
 * OBJECTIVE:
 * Build a production-ready end-to-end encrypted chat system using
 * Diffie-Hellman key exchange, symmetric encryption, and forward secrecy.
 *
 * REQUIREMENTS:
 * 1. Implement Diffie-Hellman key exchange
 * 2. Create encrypted message sending/receiving
 * 3. Handle multiple participants
 * 4. Implement forward secrecy with session keys
 * 5. Add message authentication codes (MAC)
 *
 * LEARNING GOALS:
 * - Understanding public-key cryptography
 * - Implementing secure key exchange
 * - Working with hybrid encryption
 * - Managing session keys and forward secrecy
 */

const crypto = require('crypto');

console.log('=== Exercise 2: End-to-End Encrypted Chat System ===\n');

// Task 1: Implement Diffie-Hellman Key Exchange
console.log('Task 1: Diffie-Hellman key exchange');

/**
 * TODO 1: Create Diffie-Hellman instance and generate keys
 *
 * Diffie-Hellman allows two parties to establish a shared secret
 * over an insecure channel without exchanging the secret directly.
 *
 * Steps:
 * 1. Create DH instance with crypto.createDiffieHellman(2048)
 * 2. Generate keys with dh.generateKeys()
 * 3. Return both public key and DH instance
 * 4. Store prime and generator for sharing
 *
 * Hint: The public key can be shared openly, but keep the DH instance private
 *
 * @returns {Object} { dh, publicKey, prime, generator }
 */
function createKeyPair() {
  // Your code here
  // Example structure:
  // const dh = crypto.createDiffieHellman(2048);
  // dh.generateKeys();
  // return {
  //   dh,
  //   publicKey: dh.getPublicKey(),
  //   prime: dh.getPrime(),
  //   generator: dh.getGenerator()
  // };
}

/**
 * TODO 2: Compute shared secret from peer's public key
 *
 * This creates the shared secret that both parties will have
 * without ever transmitting it over the network.
 *
 * Steps:
 * 1. Use dh.computeSecret(peerPublicKey)
 * 2. Hash the shared secret with SHA-256 for consistent length
 * 3. Return the hashed shared secret
 *
 * Hint: Hashing ensures the secret is always 32 bytes (256 bits)
 *
 * @param {Object} dh - DH instance
 * @param {Buffer} peerPublicKey - Peer's public key
 * @returns {Buffer} Shared secret (32 bytes)
 */
function computeSharedSecret(dh, peerPublicKey) {
  // Your code here
}

// Test Task 1
try {
  const alice = createKeyPair();
  const bob = createKeyPair();

  // Alice and Bob exchange public keys and compute shared secret
  const aliceSecret = computeSharedSecret(alice.dh, bob.publicKey);
  const bobSecret = computeSharedSecret(bob.dh, alice.publicKey);

  console.log('Alice public key:', alice.publicKey ? alice.publicKey.toString('hex').substring(0, 32) + '...' : 'Missing');
  console.log('Bob public key:', bob.publicKey ? bob.publicKey.toString('hex').substring(0, 32) + '...' : 'Missing');
  console.log('Secrets match:', aliceSecret && bobSecret && aliceSecret.equals(bobSecret));
  console.log('✓ Task 1 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 2: Encrypt Messages with Authenticated Encryption
console.log('Task 2: Encrypt messages with AES-GCM');

/**
 * TODO 3: Encrypt message using AES-256-GCM with authentication
 *
 * AES-GCM provides both encryption and authentication,
 * protecting against tampering and ensuring message integrity.
 *
 * Steps:
 * 1. Generate random 12-byte IV (initialization vector)
 * 2. Create cipher with aes-256-gcm using shared secret as key
 * 3. Encrypt the message
 * 4. Get authentication tag from cipher
 * 5. Return IV, encrypted data, and auth tag
 *
 * Hint: The auth tag proves the message hasn't been tampered with
 * Hint: IV must be unique for each message but doesn't need to be secret
 *
 * @param {string} message - Message to encrypt
 * @param {Buffer} sharedSecret - Shared secret key
 * @returns {Object} { iv, encryptedData, authTag }
 */
function encryptMessage(message, sharedSecret) {
  // Your code here
  // Example structure:
  // const iv = crypto.randomBytes(12);
  // const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
  // let encrypted = cipher.update(message, 'utf8');
  // encrypted = Buffer.concat([encrypted, cipher.final()]);
  // const authTag = cipher.getAuthTag();
  // return { iv, encryptedData: encrypted, authTag };
}

/**
 * TODO 4: Decrypt and verify message
 *
 * Decrypts the message and verifies authentication tag
 * to ensure integrity and authenticity.
 *
 * Steps:
 * 1. Create decipher with aes-256-gcm
 * 2. Set the authentication tag
 * 3. Decrypt the data
 * 4. If auth tag is invalid, decipher.final() will throw
 * 5. Return decrypted message
 *
 * Hint: Always verify the auth tag before trusting the message
 *
 * @param {Buffer} encryptedData - Encrypted message
 * @param {Buffer} iv - Initialization vector
 * @param {Buffer} authTag - Authentication tag
 * @param {Buffer} sharedSecret - Shared secret key
 * @returns {string} Decrypted message
 */
function decryptMessage(encryptedData, iv, authTag, sharedSecret) {
  // Your code here
}

// Test Task 2
try {
  const alice = createKeyPair();
  const bob = createKeyPair();

  const sharedSecret = computeSharedSecret(alice.dh, bob.publicKey);

  const message = 'Hello Bob! This is a secret message.';
  const encrypted = encryptMessage(message, sharedSecret);
  const decrypted = decryptMessage(
    encrypted.encryptedData,
    encrypted.iv,
    encrypted.authTag,
    sharedSecret
  );

  console.log('Original:', message);
  console.log('Encrypted:', encrypted.encryptedData ? encrypted.encryptedData.toString('hex').substring(0, 32) + '...' : 'Missing');
  console.log('Decrypted:', decrypted);
  console.log('Match:', message === decrypted);
  console.log('✓ Task 2 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 3: Implement Session Keys for Forward Secrecy
console.log('Task 3: Session keys and forward secrecy');

/**
 * TODO 5: Derive session key from shared secret and nonce
 *
 * Forward secrecy means even if long-term keys are compromised,
 * past sessions remain secure. We do this by deriving unique
 * session keys for each conversation.
 *
 * Steps:
 * 1. Generate random 16-byte nonce
 * 2. Create HKDF (HMAC-based Key Derivation Function)
 * 3. Use shared secret as input key material
 * 4. Use nonce as salt
 * 5. Derive 32-byte session key with SHA-256
 * 6. Return session key and nonce
 *
 * Hint: HKDF is in crypto.hkdfSync(digest, ikm, salt, info, keylen)
 * Hint: Each session should have a unique nonce
 *
 * @param {Buffer} sharedSecret - Long-term shared secret
 * @returns {Object} { sessionKey, nonce }
 */
function deriveSessionKey(sharedSecret) {
  // Your code here
  // const nonce = crypto.randomBytes(16);
  // const sessionKey = crypto.hkdfSync(
  //   'sha256',
  //   sharedSecret,
  //   nonce,
  //   'chat-session',
  //   32
  // );
  // return { sessionKey, nonce };
}

// Test Task 3
try {
  const alice = createKeyPair();
  const bob = createKeyPair();

  const sharedSecret = computeSharedSecret(alice.dh, bob.publicKey);

  // Create multiple sessions
  const session1 = deriveSessionKey(sharedSecret);
  const session2 = deriveSessionKey(sharedSecret);

  console.log('Session 1 key:', session1.sessionKey ? session1.sessionKey.toString('hex').substring(0, 32) + '...' : 'Missing');
  console.log('Session 2 key:', session2.sessionKey ? session2.sessionKey.toString('hex').substring(0, 32) + '...' : 'Missing');
  console.log('Keys are unique:', session1.sessionKey && session2.sessionKey && !session1.sessionKey.equals(session2.sessionKey));
  console.log('✓ Task 3 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 4: Build Chat Participant Class
console.log('Task 4: Chat participant implementation');

/**
 * TODO 6: Implement chat participant
 *
 * Each participant can establish secure connections with others,
 * send encrypted messages, and manage multiple sessions.
 *
 * Requirements:
 * - Generate DH key pair on creation
 * - Establish secure connection with peer
 * - Send encrypted messages
 * - Receive and decrypt messages
 * - Manage multiple peer connections
 */
class ChatParticipant {
  constructor(name) {
    this.name = name;
    this.keyPair = createKeyPair();
    this.connections = new Map(); // Maps peer name to connection info
  }

  /**
   * TODO 7: Get public connection info to share with peer
   *
   * Returns information needed for peer to establish connection
   *
   * @returns {Object} Public connection information
   */
  getPublicInfo() {
    // Your code here
    // return {
    //   name: this.name,
    //   publicKey: this.keyPair.publicKey,
    //   prime: this.keyPair.prime,
    //   generator: this.keyPair.generator
    // };
  }

  /**
   * TODO 8: Establish secure connection with peer
   *
   * Steps:
   * 1. Compute shared secret using peer's public key
   * 2. Derive initial session key
   * 3. Store connection info
   *
   * @param {Object} peerInfo - Peer's public info
   */
  connect(peerInfo) {
    // Your code here
    // const sharedSecret = computeSharedSecret(
    //   this.keyPair.dh,
    //   peerInfo.publicKey
    // );
    // const { sessionKey, nonce } = deriveSessionKey(sharedSecret);
    // this.connections.set(peerInfo.name, {
    //   sharedSecret,
    //   sessionKey,
    //   nonce,
    //   messageCount: 0
    // });
  }

  /**
   * TODO 9: Send encrypted message to peer
   *
   * Steps:
   * 1. Get connection info for peer
   * 2. Encrypt message with session key
   * 3. Increment message count
   * 4. Return encrypted package
   *
   * @param {string} peerName - Recipient name
   * @param {string} message - Message to send
   * @returns {Object} Encrypted message package
   */
  sendMessage(peerName, message) {
    // Your code here
  }

  /**
   * TODO 10: Receive and decrypt message from peer
   *
   * Steps:
   * 1. Get connection info for peer
   * 2. Decrypt message using session key
   * 3. Return decrypted message
   *
   * @param {string} peerName - Sender name
   * @param {Object} encryptedPackage - Encrypted message
   * @returns {string} Decrypted message
   */
  receiveMessage(peerName, encryptedPackage) {
    // Your code here
  }

  /**
   * TODO 11: Rotate session key for forward secrecy
   *
   * Should be called periodically or after N messages
   *
   * @param {string} peerName - Peer to rotate key with
   */
  rotateSessionKey(peerName) {
    // Your code here
    // const connection = this.connections.get(peerName);
    // if (connection) {
    //   const { sessionKey, nonce } = deriveSessionKey(connection.sharedSecret);
    //   connection.sessionKey = sessionKey;
    //   connection.nonce = nonce;
    //   connection.messageCount = 0;
    // }
  }
}

// Test Task 4
try {
  const alice = new ChatParticipant('Alice');
  const bob = new ChatParticipant('Bob');

  // Exchange public info and connect
  alice.connect(bob.getPublicInfo());
  bob.connect(alice.getPublicInfo());

  // Alice sends message to Bob
  const encrypted = alice.sendMessage('Bob', 'Hello Bob!');
  console.log('Encrypted package:', encrypted ? 'Created' : 'Missing');

  // Bob receives and decrypts
  const decrypted = bob.receiveMessage('Alice', encrypted);
  console.log('Decrypted message:', decrypted);

  console.log('✓ Task 4 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Task 5: Build Complete Chat Room System
console.log('Task 5: Multi-participant chat room');

/**
 * TODO 12: Implement secure chat room
 *
 * Requirements:
 * - Support multiple participants
 * - Broadcast messages to all participants
 * - Maintain separate encryption for each pair
 * - Handle participants joining/leaving
 * - Implement message history (encrypted)
 */
class SecureChatRoom {
  constructor(roomName) {
    this.roomName = roomName;
    this.participants = new Map();
    this.messageHistory = [];
  }

  /**
   * TODO 13: Add participant to room
   *
   * Steps:
   * 1. Add participant to map
   * 2. Establish connections with all existing participants
   * 3. Have existing participants connect to new one
   */
  addParticipant(participant) {
    // Your code here
    // this.participants.set(participant.name, participant);
    //
    // // Connect new participant with existing ones
    // for (const [name, existingParticipant] of this.participants) {
    //   if (name !== participant.name) {
    //     participant.connect(existingParticipant.getPublicInfo());
    //     existingParticipant.connect(participant.getPublicInfo());
    //   }
    // }
  }

  /**
   * TODO 14: Broadcast message from sender to all participants
   *
   * Each message is encrypted separately for each recipient
   *
   * @param {string} senderName - Message sender
   * @param {string} message - Message to broadcast
   */
  broadcast(senderName, message) {
    // Your code here
    // const sender = this.participants.get(senderName);
    // if (!sender) {
    //   throw new Error('Sender not in room');
    // }
    //
    // const timestamp = Date.now();
    // const broadcasts = [];
    //
    // for (const [recipientName, recipient] of this.participants) {
    //   if (recipientName !== senderName) {
    //     const encrypted = sender.sendMessage(recipientName, message);
    //     broadcasts.push({
    //       to: recipientName,
    //       encrypted
    //     });
    //   }
    // }
    //
    // this.messageHistory.push({
    //   from: senderName,
    //   timestamp,
    //   broadcasts
    // });
  }

  /**
   * TODO 15: Remove participant from room
   */
  removeParticipant(participantName) {
    // Your code here
  }

  /**
   * TODO 16: Get room statistics
   */
  getStats() {
    // Your code here
    // return {
    //   roomName: this.roomName,
    //   participantCount: this.participants.size,
    //   messageCount: this.messageHistory.length,
    //   participants: Array.from(this.participants.keys())
    // };
  }
}

// Test Task 5
try {
  const room = new SecureChatRoom('Secret Room');

  const alice = new ChatParticipant('Alice');
  const bob = new ChatParticipant('Bob');
  const charlie = new ChatParticipant('Charlie');

  room.addParticipant(alice);
  room.addParticipant(bob);
  room.addParticipant(charlie);

  console.log('Room created with 3 participants');

  room.broadcast('Alice', 'Hello everyone!');
  console.log('Message broadcasted');

  const stats = room.getStats();
  console.log('Room stats:', stats);

  console.log('✓ Task 5 implementation needed\n');
} catch (err) {
  console.log('✗ Error:', err.message, '\n');
}

// Bonus Challenges
console.log('=== Bonus Challenges ===\n');

console.log('Bonus 1: Implement Perfect Forward Secrecy');
console.log('- Automatically rotate keys after N messages');
console.log('- Implement Double Ratchet algorithm (Signal Protocol)');
console.log('- Ensure old session keys are deleted\n');

console.log('Bonus 2: Add Message Ordering and Replay Protection');
console.log('- Include sequence numbers with messages');
console.log('- Detect and reject replayed messages');
console.log('- Handle out-of-order delivery\n');

console.log('Bonus 3: Implement Group Key Agreement');
console.log('- Use Diffie-Hellman for group key derivation');
console.log('- Handle members joining/leaving efficiently');
console.log('- Implement sender keys for scaling\n');

console.log('Bonus 4: Add Deniability');
console.log('- Implement deniable authentication');
console.log('- Use MAC instead of signatures for authentication');
console.log('- Ensure plausible deniability of messages\n');

/**
 * PRODUCTION CONSIDERATIONS:
 *
 * 1. Key Management:
 *    - Implement secure key storage
 *    - Handle key backup and recovery
 *    - Implement key expiration
 *
 * 2. Session Management:
 *    - Persist session state securely
 *    - Handle session recovery
 *    - Implement session timeouts
 *
 * 3. Security:
 *    - Protect against timing attacks
 *    - Implement rate limiting
 *    - Add audit logging
 *
 * 4. Scalability:
 *    - Use sender keys for large groups
 *    - Implement efficient key distribution
 *    - Handle offline message queuing
 *
 * 5. User Experience:
 *    - Show encryption status indicators
 *    - Verify key fingerprints
 *    - Handle device changes
 */

console.log('\n=== Exercise 2 Complete ===');
console.log('This exercise covers modern E2EE chat systems');
console.log('Similar to Signal, WhatsApp, and Telegram Secret Chats\n');
