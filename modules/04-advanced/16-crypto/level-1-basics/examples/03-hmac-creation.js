/**
 * HMAC (Hash-based Message Authentication Code) Examples
 *
 * Demonstrates how to create and verify HMACs for message authentication.
 * HMAC ensures message integrity and authenticity using a shared secret.
 */

const crypto = require('crypto');

console.log('=== HMAC Creation Examples ===\n');

// Example 1: Basic HMAC Creation
console.log('1. Basic HMAC Creation:');
const message = 'Important message';
const secret = 'my-secret-key';

const hmac = crypto.createHmac('sha256', secret);
hmac.update(message);
const signature = hmac.digest('hex');

console.log('Message: ', message);
console.log('Secret:  ', secret);
console.log('HMAC:    ', signature);
console.log();

// Example 2: Verifying HMAC
console.log('2. Verifying HMAC:');
function verifyHMAC(message, signature, secret) {
  const expectedHmac = crypto.createHmac('sha256', secret);
  expectedHmac.update(message);
  const expectedSignature = expectedHmac.digest('hex');

  return signature === expectedSignature;
}

const receivedMessage = 'Important message';
const receivedSignature = signature; // From Example 1

if (verifyHMAC(receivedMessage, receivedSignature, secret)) {
  console.log('✓ Message is authentic');
} else {
  console.log('✗ Message has been tampered with');
}
console.log();

// Example 3: Detecting Tampering
console.log('3. Detecting Tampering:');
const tamperedMessage = 'Important message MODIFIED';

if (verifyHMAC(tamperedMessage, receivedSignature, secret)) {
  console.log('✓ Message is authentic');
} else {
  console.log('✗ Message has been tampered with');
  console.log('Original: "Important message"');
  console.log('Received: "Important message MODIFIED"');
}
console.log();

// Example 4: Different Secret = Different HMAC
console.log('4. Different Secret = Different HMAC:');
const msg = 'Test message';
const secret1 = 'secret-1';
const secret2 = 'secret-2';

const hmac1 = crypto.createHmac('sha256', secret1).update(msg).digest('hex');
const hmac2 = crypto.createHmac('sha256', secret2).update(msg).digest('hex');

console.log('Message:  ', msg);
console.log('Secret 1: ', secret1);
console.log('HMAC 1:   ', hmac1);
console.log('Secret 2: ', secret2);
console.log('HMAC 2:   ', hmac2);
console.log('Notice: Different secrets = different HMACs');
console.log();

// Example 5: HMAC with Different Algorithms
console.log('5. HMAC with Different Algorithms:');
const data = 'Data to authenticate';
const key = 'shared-secret';

const hmacSHA256 = crypto.createHmac('sha256', key).update(data).digest('hex');
const hmacSHA512 = crypto.createHmac('sha512', key).update(data).digest('hex');
const hmacSHA1 = crypto.createHmac('sha1', key).update(data).digest('hex');

console.log('Data:', data);
console.log('SHA-256:', hmacSHA256);
console.log('SHA-512:', hmacSHA512);
console.log('SHA-1:  ', hmacSHA1, '(DON\'T USE - deprecated)');
console.log();

// Example 6: API Request Signing
console.log('6. API Request Signing:');
function signAPIRequest(method, url, body, apiSecret) {
  const payload = `${method}${url}${JSON.stringify(body)}`;
  const hmac = crypto.createHmac('sha256', apiSecret);
  hmac.update(payload);
  return hmac.digest('hex');
}

const apiSecret = 'api-secret-key-12345';
const requestData = {
  method: 'POST',
  url: '/api/users',
  body: { username: 'john', email: 'john@example.com' }
};

const requestSignature = signAPIRequest(
  requestData.method,
  requestData.url,
  requestData.body,
  apiSecret
);

console.log('Request:', requestData);
console.log('Signature:', requestSignature);
console.log('Use case: Secure API requests');
console.log();

// Example 7: Verifying API Request
console.log('7. Verifying API Request:');
function verifyAPIRequest(method, url, body, signature, apiSecret) {
  const expectedSignature = signAPIRequest(method, url, body, apiSecret);
  return signature === expectedSignature;
}

const isValidRequest = verifyAPIRequest(
  'POST',
  '/api/users',
  { username: 'john', email: 'john@example.com' },
  requestSignature,
  apiSecret
);

console.log('Request valid:', isValidRequest ? '✓ Yes' : '✗ No');
console.log();

// Example 8: Webhook Signature Verification
console.log('8. Webhook Signature Verification (like GitHub, Stripe):');
function createWebhookSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return 'sha256=' + hmac.digest('hex');
}

const webhookPayload = {
  event: 'payment.succeeded',
  amount: 1000,
  currency: 'USD'
};
const webhookSecret = 'whsec_webhook_secret_key';

const webhookSignature = createWebhookSignature(webhookPayload, webhookSecret);

console.log('Webhook payload:', webhookPayload);
console.log('Signature:', webhookSignature);
console.log('Use case: Verify webhooks from third-party services');
console.log();

// Example 9: Timing-Safe Comparison
console.log('9. Timing-Safe Comparison:');
function timingSafeVerify(message, signature, secret) {
  const expectedHmac = crypto.createHmac('sha256', secret);
  expectedHmac.update(message);
  const expectedSignature = expectedHmac.digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

const testMessage = 'Test message';
const testSignature = crypto.createHmac('sha256', secret).update(testMessage).digest('hex');

console.log('Timing-safe verification:', timingSafeVerify(testMessage, testSignature, secret));
console.log('Use case: Prevent timing attacks on token verification');
console.log();

// Example 10: Multiple Data Updates
console.log('10. Multiple Data Updates:');
const hmacMultiple = crypto.createHmac('sha256', 'secret');
hmacMultiple.update('Part 1');
hmacMultiple.update('Part 2');
hmacMultiple.update('Part 3');
const multipleSignature = hmacMultiple.digest('hex');

const hmacSingle = crypto.createHmac('sha256', 'secret');
hmacSingle.update('Part 1Part 2Part 3');
const singleSignature = hmacSingle.digest('hex');

console.log('Multiple updates:', multipleSignature);
console.log('Single update:   ', singleSignature);
console.log('Match:', multipleSignature === singleSignature);
console.log();

// Example 11: JWT-like Token Creation
console.log('11. JWT-like Token Creation:');
function createSimpleToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

const tokenPayload = {
  userId: 123,
  username: 'john',
  exp: Date.now() + 3600000 // 1 hour
};

const token = createSimpleToken(tokenPayload, 'jwt-secret');
console.log('Token:', token);
console.log('Use case: Simplified JWT-style authentication');
console.log();

// Example 12: HMAC with Binary Data
console.log('12. HMAC with Binary Data:');
const binaryData = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]);
const binarySecret = Buffer.from('binary-secret');

const binaryHmac = crypto.createHmac('sha256', binarySecret);
binaryHmac.update(binaryData);
const binarySignature = binaryHmac.digest('hex');

console.log('Binary data:', binaryData);
console.log('HMAC:', binarySignature);
console.log('Use case: File integrity, binary protocols');
console.log();

// Example 13: Available HMAC Algorithms
console.log('13. Available HMAC Algorithms:');
const hmacAlgorithms = crypto.getHashes();
console.log('Total available:', hmacAlgorithms.length);
console.log('Recommended:', ['sha256', 'sha384', 'sha512']);
console.log('Avoid:', ['md5', 'sha1']);
console.log();

// Example 14: HMAC Output Formats
console.log('14. HMAC Output Formats:');
const testData = 'Format test';
const formatSecret = 'format-secret';

const hexHmac = crypto.createHmac('sha256', formatSecret).update(testData).digest('hex');
const base64Hmac = crypto.createHmac('sha256', formatSecret).update(testData).digest('base64');
const bufferHmac = crypto.createHmac('sha256', formatSecret).update(testData).digest();

console.log('Hex:    ', hexHmac);
console.log('Base64: ', base64Hmac);
console.log('Buffer: ', bufferHmac);
console.log('Length: ', bufferHmac.length, 'bytes');
console.log();

// Example 15: Performance Comparison
console.log('15. Performance - Hash vs HMAC:');
const iterations = 10000;
const perfData = 'Performance test data';

const startHash = Date.now();
for (let i = 0; i < iterations; i++) {
  crypto.createHash('sha256').update(perfData).digest('hex');
}
const endHash = Date.now();

const startHmac = Date.now();
for (let i = 0; i < iterations; i++) {
  crypto.createHmac('sha256', 'secret').update(perfData).digest('hex');
}
const endHmac = Date.now();

console.log(`${iterations} iterations:`);
console.log('Hash time:', endHash - startHash, 'ms');
console.log('HMAC time:', endHmac - startHmac, 'ms');
console.log('Notice: HMAC is slightly slower due to key processing');
