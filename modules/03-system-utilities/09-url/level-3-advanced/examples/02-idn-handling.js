/**
 * Example 2: Internationalized Domain Names (IDN)
 */

console.log('=== IDN Handling ===\n');

// Punycode domain handling
const idn = 'münchen.de';
const url = new URL(`https://${idn}`);

console.log('IDN:', idn);
console.log('Hostname:', url.hostname);
console.log('✓ Node.js handles IDN automatically');
