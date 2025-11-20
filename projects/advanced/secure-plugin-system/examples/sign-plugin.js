/**
 * Plugin Signing Utility
 * Generate keys and sign plugins
 */

const path = require('path');
const fs = require('fs');
const { Security } = require('../src');

async function generateKeys() {
  console.log('Generating RSA key pair...');

  const { publicKey, privateKey } = await Security.generateKeyPair();

  const keysDir = path.join(__dirname, '../keys');
  await fs.promises.mkdir(keysDir, { recursive: true });

  await fs.promises.writeFile(path.join(keysDir, 'public.pem'), publicKey);
  await fs.promises.writeFile(path.join(keysDir, 'private.pem'), privateKey);

  console.log('Keys generated and saved to keys/ directory');
  console.log('  - public.pem (share this)');
  console.log('  - private.pem (keep this secret!)');
}

async function signPlugin(pluginId) {
  const keysDir = path.join(__dirname, '../keys');
  const privateKeyPath = path.join(keysDir, 'private.pem');

  // Check if private key exists
  try {
    await fs.promises.access(privateKeyPath);
  } catch {
    console.error('Private key not found. Run this script with --generate-keys first.');
    process.exit(1);
  }

  // Create security instance
  const security = new Security({
    privateKeyPath
  });

  await security.initialize();

  // Sign plugin
  const pluginDir = path.join(__dirname, '../plugins', pluginId);

  try {
    await fs.promises.access(pluginDir);
  } catch {
    console.error(`Plugin directory not found: ${pluginDir}`);
    process.exit(1);
  }

  console.log(`Signing plugin: ${pluginId}...`);

  try {
    const signature = await security.signPlugin(pluginDir);
    console.log('Plugin signed successfully!');
    console.log(`Signature saved to: ${pluginId}/plugin.sig`);
    console.log(`Signature: ${signature.substring(0, 50)}...`);
  } catch (error) {
    console.error('Signing failed:', error.message);
    process.exit(1);
  }
}

async function verifyPlugin(pluginId) {
  const keysDir = path.join(__dirname, '../keys');
  const publicKeyPath = path.join(keysDir, 'public.pem');

  // Check if public key exists
  try {
    await fs.promises.access(publicKeyPath);
  } catch {
    console.error('Public key not found.');
    process.exit(1);
  }

  // Create security instance
  const security = new Security({
    publicKeyPath,
    requireSignature: true
  });

  await security.initialize();

  // Load plugin
  const Plugin = require('../src/plugin');
  const pluginDir = path.join(__dirname, '../plugins', pluginId);

  try {
    const plugin = await Plugin.fromDirectory(pluginDir);
    await plugin.load();

    console.log(`Verifying plugin: ${pluginId}...`);

    const verified = await security.verifyPlugin(plugin);

    if (verified) {
      console.log('✓ Plugin signature is VALID');
    } else {
      console.log('✗ Plugin signature is INVALID');
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Plugin Signing Utility\n');
    console.log('Usage:');
    console.log('  node sign-plugin.js --generate-keys        Generate RSA key pair');
    console.log('  node sign-plugin.js --sign <plugin-id>     Sign a plugin');
    console.log('  node sign-plugin.js --verify <plugin-id>   Verify plugin signature');
    console.log('\nExamples:');
    console.log('  node sign-plugin.js --generate-keys');
    console.log('  node sign-plugin.js --sign hello-world');
    console.log('  node sign-plugin.js --verify hello-world');
    return;
  }

  if (args.includes('--generate-keys')) {
    await generateKeys();
  } else if (args.includes('--sign')) {
    const index = args.indexOf('--sign');
    const pluginId = args[index + 1];

    if (!pluginId) {
      console.error('Plugin ID is required');
      process.exit(1);
    }

    await signPlugin(pluginId);
  } else if (args.includes('--verify')) {
    const index = args.indexOf('--verify');
    const pluginId = args[index + 1];

    if (!pluginId) {
      console.error('Plugin ID is required');
      process.exit(1);
    }

    await verifyPlugin(pluginId);
  } else {
    console.error('Unknown command. Use --help for usage information.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
