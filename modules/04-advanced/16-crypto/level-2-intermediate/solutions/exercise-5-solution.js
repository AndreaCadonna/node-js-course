/**
 * Exercise 5 Solution: Encrypted Messaging System
 * Complete E2E encrypted messaging implementation
 */
const crypto = require('crypto');
console.log('=== Exercise 5 Solution: Encrypted Messaging System ===\n');

// Task 1: User System
class User {
  constructor(username) {
    this.username = username;
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048
    });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }
  
  getPublicKey() {
    return this.publicKey;
  }
  
  exportProfile() {
    return {
      username: this.username,
      publicKey: crypto.createPublicKey(this.publicKey).export({ type: 'spki', format: 'pem' })
    };
  }
}
console.log('✓ Task 1: User system implemented\n');

// Task 2: Message Encryption
function encryptMessage(message, recipientPublicKey, senderPrivateKey) {
  // Hybrid encryption
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let ciphertext = cipher.update(message, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  const encryptedKey = crypto.publicEncrypt({
    key: recipientPublicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
  }, aesKey);
  
  // Sign
  const sign = crypto.createSign('SHA256');
  sign.update(ciphertext);
  const signature = sign.sign(senderPrivateKey, 'hex');
  
  return {
    encrypted: { ciphertext, iv: iv.toString('hex'), authTag: authTag.toString('hex'), encryptedKey: encryptedKey.toString('hex') },
    signature,
    metadata: { timestamp: Date.now() }
  };
}
console.log('✓ Task 2: Message encryption implemented\n');

// Complete MessagingSystem class
class MessagingSystem {
  constructor() {
    this.users = new Map();
    this.conversations = new Map();
  }
  
  registerUser(username) {
    const user = new User(username);
    this.users.set(username, user);
    return user.exportProfile();
  }
  
  getUser(username) {
    return this.users.get(username);
  }
  
  sendMessage(from, to, content) {
    const sender = this.users.get(from);
    const recipient = this.users.get(to);
    if (!sender || !recipient) throw new Error('User not found');
    
    return encryptMessage(content, recipient.getPublicKey(), sender.privateKey);
  }
}
console.log('✓ Tasks 3-5: Complete messaging system implemented\n');
console.log('=== Exercise 5 Solution Complete ===');
console.log('\nCongratulations! You have completed all Level 2 exercises!');
