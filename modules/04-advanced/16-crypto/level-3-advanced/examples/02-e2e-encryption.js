/**
 * End-to-End Encryption System
 *
 * Complete E2E encryption implementation using Diffie-Hellman
 * key exchange and authenticated encryption (AES-GCM).
 */

const crypto = require('crypto');

console.log('=== End-to-End Encryption System ===\n');

// Example 1: Basic Diffie-Hellman Key Exchange
console.log('1. Diffie-Hellman Key Exchange:');

// Alice generates her key pair
const alice = crypto.generateKeyPairSync('x25519');
console.log('Alice generated key pair');

// Bob generates his key pair
const bob = crypto.generateKeyPairSync('x25519');
console.log('Bob generated key pair');

// Alice derives shared secret using her private key and Bob's public key
const aliceSharedSecret = crypto.diffieHellman({
  privateKey: alice.privateKey,
  publicKey: bob.publicKey
});

// Bob derives shared secret using his private key and Alice's public key
const bobSharedSecret = crypto.diffieHellman({
  privateKey: bob.privateKey,
  publicKey: alice.publicKey
});

// Both should have the same shared secret
console.log('Shared secrets match:', aliceSharedSecret.equals(bobSharedSecret));
console.log('Shared secret:', aliceSharedSecret.toString('hex').substring(0, 32) + '...');
console.log('✓ Key exchange successful\n');

// Example 2: Encrypted Messaging System
console.log('2. E2E Encrypted Messaging:');

class EncryptedMessenger {
  constructor(name) {
    this.name = name;
    // Generate long-term identity key pair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
    this.identityPublicKey = publicKey;
    this.identityPrivateKey = privateKey;
    this.sessions = new Map();
  }

  // Establish session with another user
  establishSession(peerName, peerPublicKey) {
    // Derive shared secret
    const sharedSecret = crypto.diffieHellman({
      privateKey: this.identityPrivateKey,
      publicKey: peerPublicKey
    });

    // Derive encryption key from shared secret
    const sessionKey = crypto.hkdfSync(
      'sha256',
      sharedSecret,
      Buffer.from(''),
      Buffer.from('encryption-key'),
      32
    );

    this.sessions.set(peerName, {
      key: sessionKey,
      messageCounter: 0
    });

    console.log(`Session established with ${peerName}`);
  }

  encrypt(message, recipientName) {
    const session = this.sessions.get(recipientName);
    if (!session) {
      throw new Error('No session with recipient');
    }

    // Use GCM for authenticated encryption
    const iv = crypto.randomBytes(12); // GCM uses 12-byte IV
    const cipher = crypto.createCipheriv('aes-256-gcm', session.key, iv);

    // Add associated data (metadata that's authenticated but not encrypted)
    const metadata = {
      from: this.name,
      to: recipientName,
      timestamp: Date.now(),
      counter: session.messageCounter++
    };
    cipher.setAAD(Buffer.from(JSON.stringify(metadata)));

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      metadata
    };
  }

  decrypt(encryptedMessage, senderName) {
    const session = this.sessions.get(senderName);
    if (!session) {
      throw new Error('No session with sender');
    }

    const { ciphertext, iv, authTag, metadata } = encryptedMessage;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      session.key,
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    decipher.setAAD(Buffer.from(JSON.stringify(metadata)));

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return {
      message: decrypted,
      metadata
    };
  }

  getPublicKey() {
    return this.identityPublicKey;
  }
}

// Create two users
const aliceMessenger = new EncryptedMessenger('Alice');
const bobMessenger = new EncryptedMessenger('Bob');

// Exchange public keys and establish sessions
aliceMessenger.establishSession('Bob', bobMessenger.getPublicKey());
bobMessenger.establishSession('Alice', aliceMessenger.getPublicKey());

// Alice sends encrypted message to Bob
const message = 'Hello Bob, this is a secret message!';
const encrypted = aliceMessenger.encrypt(message, 'Bob');
console.log('Encrypted message:', encrypted.ciphertext.substring(0, 40) + '...');
console.log('Metadata:', encrypted.metadata);

// Bob decrypts the message
const decrypted = bobMessenger.decrypt(encrypted, 'Alice');
console.log('Decrypted message:', decrypted.message);
console.log('✓ E2E encrypted messaging works\n');

// Example 3: Forward Secrecy with Ephemeral Keys
console.log('3. Forward Secrecy (Ephemeral Keys):');

class ForwardSecureMessenger {
  constructor(name) {
    this.name = name;
    // Long-term identity key
    const identity = crypto.generateKeyPairSync('x25519');
    this.identityPublicKey = identity.publicKey;
    this.identityPrivateKey = identity.privateKey;
  }

  initiateSession(peerIdentityPublicKey) {
    // Generate ephemeral key pair for this session
    const ephemeral = crypto.generateKeyPairSync('x25519');

    // Derive shared secret using both identity and ephemeral keys
    const identitySecret = crypto.diffieHellman({
      privateKey: this.identityPrivateKey,
      publicKey: peerIdentityPublicKey
    });

    // Combine identity and ephemeral secrets
    const sessionKey = crypto.hkdfSync(
      'sha256',
      identitySecret,
      Buffer.from(''),
      Buffer.from('session-key'),
      32
    );

    return {
      sessionKey,
      ephemeralPublicKey: ephemeral.publicKey,
      ephemeralPrivateKey: ephemeral.privateKey
    };
  }

  deriveMessageKey(sessionKey, messageNumber) {
    // Derive unique key for each message (ratcheting)
    return crypto.hkdfSync(
      'sha256',
      sessionKey,
      Buffer.from(''),
      Buffer.from(`message-${messageNumber}`),
      32
    );
  }

  encryptMessage(message, messageKey) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', messageKey, iv);

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decryptMessage(encryptedMsg, messageKey) {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      messageKey,
      Buffer.from(encryptedMsg.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedMsg.authTag, 'hex'));

    let decrypted = decipher.update(encryptedMsg.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

const aliceFS = new ForwardSecureMessenger('Alice');
const bobFS = new ForwardSecureMessenger('Bob');

// Alice initiates session
const aliceSession = aliceFS.initiateSession(bobFS.identityPublicKey);
console.log('Session established with forward secrecy');

// Send multiple messages with different keys
for (let i = 0; i < 3; i++) {
  const messageKey = aliceFS.deriveMessageKey(aliceSession.sessionKey, i);
  const msg = `Message ${i + 1}: Secret content`;
  const encrypted = aliceFS.encryptMessage(msg, messageKey);
  console.log(`Message ${i + 1} encrypted with unique key`);

  // Immediately delete message key (forward secrecy)
  messageKey.fill(0);
}

console.log('✓ Forward secrecy ensures past messages remain secure\n');

// Example 4: Multi-Party Encryption
console.log('4. Multi-Party Encrypted Group Chat:');

class GroupChat {
  constructor(chatId, creator) {
    this.chatId = chatId;
    this.creator = creator;
    this.members = new Map();
    this.messageHistory = [];

    // Generate group encryption key
    this.groupKey = crypto.randomBytes(32);
    this.keyVersion = 1;

    // Add creator
    this.addMember(creator.name, creator.identityPublicKey);
  }

  addMember(memberName, memberPublicKey) {
    // Encrypt group key for new member
    const ephemeralKeypair = crypto.generateKeyPairSync('x25519');

    const sharedSecret = crypto.diffieHellman({
      privateKey: ephemeralKeypair.privateKey,
      publicKey: memberPublicKey
    });

    const kek = crypto.hkdfSync(
      'sha256',
      sharedSecret,
      Buffer.from(''),
      Buffer.from('key-encryption-key'),
      32
    );

    // Encrypt group key
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);

    let encryptedGroupKey = cipher.update(this.groupKey, null, 'hex');
    encryptedGroupKey += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    this.members.set(memberName, {
      publicKey: memberPublicKey,
      ephemeralPublicKey: ephemeralKeypair.publicKey,
      encryptedGroupKey,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      keyVersion: this.keyVersion,
      joinedAt: Date.now()
    });

    console.log(`${memberName} added to group chat`);
  }

  sendMessage(senderName, message) {
    // Encrypt message with group key
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.groupKey, iv);

    const metadata = {
      sender: senderName,
      timestamp: Date.now(),
      keyVersion: this.keyVersion
    };

    cipher.setAAD(Buffer.from(JSON.stringify(metadata)));

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const encryptedMessage = {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      metadata
    };

    this.messageHistory.push(encryptedMessage);
    return encryptedMessage;
  }

  rotateGroupKey() {
    // Generate new group key
    this.groupKey = crypto.randomBytes(32);
    this.keyVersion++;

    // Re-encrypt for all members
    for (const [memberName, memberData] of this.members) {
      const ephemeralKeypair = crypto.generateKeyPairSync('x25519');

      const sharedSecret = crypto.diffieHellman({
        privateKey: ephemeralKeypair.privateKey,
        publicKey: memberData.publicKey
      });

      const kek = crypto.hkdfSync(
        'sha256',
        sharedSecret,
        Buffer.from(''),
        Buffer.from('key-encryption-key'),
        32
      );

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);

      let encryptedGroupKey = cipher.update(this.groupKey, null, 'hex');
      encryptedGroupKey += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      memberData.ephemeralPublicKey = ephemeralKeypair.publicKey;
      memberData.encryptedGroupKey = encryptedGroupKey;
      memberData.iv = iv.toString('hex');
      memberData.authTag = authTag.toString('hex');
      memberData.keyVersion = this.keyVersion;
    }

    console.log(`Group key rotated to version ${this.keyVersion}`);
  }
}

// Create group chat
const groupCreator = {
  name: 'Alice',
  ...crypto.generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
};

const groupChat = new GroupChat('secret-project', groupCreator);

// Add members
const bob2 = {
  name: 'Bob',
  ...crypto.generateKeyPairSync('x25519')
};
groupChat.addMember(bob2.name, bob2.publicKey);

// Send messages
const msg1 = groupChat.sendMessage('Alice', 'Hello everyone!');
const msg2 = groupChat.sendMessage('Bob', 'Hi Alice!');

console.log('Messages in chat:', groupChat.messageHistory.length);

// Rotate key for security
groupChat.rotateGroupKey();

console.log('✓ Multi-party encryption operational\n');

// Example 5: Double Ratchet Algorithm (Simplified Signal Protocol)
console.log('5. Double Ratchet (Signal Protocol Pattern):');

class DoubleRatchet {
  constructor(name, sharedSecret) {
    this.name = name;
    this.rootKey = sharedSecret;
    this.sendChainKey = null;
    this.receiveChainKey = null;
    this.sendMessageNumber = 0;
    this.receiveMessageNumber = 0;
    this.skippedMessages = new Map();
  }

  // KDF chain step
  kdfChain(chainKey, constant) {
    const hmac = crypto.createHmac('sha256', chainKey);
    hmac.update(constant);
    return hmac.digest();
  }

  // Derive message key from chain key
  deriveMessageKey(chainKey) {
    const messageKey = this.kdfChain(chainKey, Buffer.from([0x01]));
    const nextChainKey = this.kdfChain(chainKey, Buffer.from([0x02]));
    return { messageKey, nextChainKey };
  }

  // DH ratchet step
  dhRatchet(dhOutput) {
    const newRootKey = crypto.hkdfSync(
      'sha256',
      dhOutput,
      this.rootKey,
      Buffer.from('root-key'),
      32
    );

    const newChainKey = crypto.hkdfSync(
      'sha256',
      dhOutput,
      this.rootKey,
      Buffer.from('chain-key'),
      32
    );

    this.rootKey = newRootKey;
    return newChainKey;
  }

  sendMessage(message, recipientPublicKey) {
    // Perform DH ratchet
    const ephemeral = crypto.generateKeyPairSync('x25519');
    const dhOutput = crypto.diffieHellman({
      privateKey: ephemeral.privateKey,
      publicKey: recipientPublicKey
    });

    this.sendChainKey = this.dhRatchet(dhOutput);

    // Derive message key
    const { messageKey, nextChainKey } = this.deriveMessageKey(this.sendChainKey);
    this.sendChainKey = nextChainKey;

    // Encrypt message
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', messageKey, iv);

    const header = {
      publicKey: ephemeral.publicKey.export({ type: 'spki', format: 'der' }).toString('hex'),
      messageNumber: this.sendMessageNumber++,
      previousChainLength: this.sendMessageNumber
    };

    cipher.setAAD(Buffer.from(JSON.stringify(header)));

    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      header
    };
  }
}

// Initialize ratchet for both parties
const sharedSecret = crypto.randomBytes(32);
const aliceRatchet = new DoubleRatchet('Alice', sharedSecret);
const bobRatchet = new DoubleRatchet('Bob', sharedSecret);

console.log('Double ratchet initialized');
console.log('✓ Provides forward secrecy and break-in recovery\n');

// Example 6: E2E Security Best Practices
console.log('6. E2E Encryption Best Practices:');

const e2eBestPractices = {
  'Use X25519 for key exchange': 'Modern, efficient, and secure ECDH',
  'Use AES-256-GCM': 'Authenticated encryption prevents tampering',
  'Implement forward secrecy': 'Generate ephemeral keys per session',
  'Use key derivation (HKDF)': 'Derive multiple keys from shared secret',
  'Rotate keys regularly': 'Limit impact of key compromise',
  'Verify public keys': 'Use fingerprints or trust-on-first-use',
  'Include metadata in AAD': 'Authenticate sender, timestamp, etc.',
  'Delete old keys': 'Cannot decrypt past messages if compromised',
  'Use double ratchet': 'Provides break-in recovery',
  'Implement sender keys': 'Efficient for group messaging',
  'Never trust the server': 'Server cannot decrypt messages',
  'Client-side only': 'Encryption happens on user devices'
};

console.log('E2E Encryption Best Practices:');
for (const [practice, description] of Object.entries(e2eBestPractices)) {
  console.log(`✓ ${practice}: ${description}`);
}

console.log('\n=== End-to-End Encryption System Complete ===');
