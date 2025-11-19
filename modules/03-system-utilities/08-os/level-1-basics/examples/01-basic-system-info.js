/**
 * Example 1: Basic System Information
 *
 * This example demonstrates how to retrieve and display
 * basic operating system information using the os module.
 */

const os = require('os');

console.log('=== Basic System Information ===\n');

// Platform information
console.log('Platform:', os.platform());
// Returns: 'linux', 'darwin', 'win32', 'freebsd', 'openbsd', 'sunos', 'aix'

console.log('Type:', os.type());
// Returns: 'Linux', 'Darwin', 'Windows_NT', etc.

console.log('Release:', os.release());
// Returns: OS version/release number

console.log('Architecture:', os.arch());
// Returns: 'x64', 'arm', 'arm64', 'ia32', etc.

console.log('Hostname:', os.hostname());
// Returns: computer/host name

console.log('Endianness:', os.endianness());
// Returns: 'BE' (big-endian) or 'LE' (little-endian)

// Platform-specific line ending
console.log('Line Ending:', JSON.stringify(os.EOL));
// Windows: '\r\n', Unix/Mac: '\n'

console.log('\n=== Platform Detection ===\n');

// Detect platform
const platform = os.platform();
if (platform === 'win32') {
  console.log('✓ Running on Windows');
} else if (platform === 'darwin') {
  console.log('✓ Running on macOS');
} else if (platform === 'linux') {
  console.log('✓ Running on Linux');
} else {
  console.log('✓ Running on:', platform);
}

// Detect architecture
const arch = os.arch();
if (arch === 'x64') {
  console.log('✓ 64-bit Intel/AMD architecture');
} else if (arch === 'arm64') {
  console.log('✓ 64-bit ARM architecture (e.g., Apple M1, M2)');
} else if (arch === 'arm') {
  console.log('✓ 32-bit ARM architecture');
} else {
  console.log('✓ Architecture:', arch);
}

console.log('\n=== System Characteristics ===\n');

// Combine information for system profile
const systemProfile = {
  platform: os.platform(),
  type: os.type(),
  release: os.release(),
  architecture: os.arch(),
  hostname: os.hostname(),
  endianness: os.endianness(),
  is64Bit: ['x64', 'arm64'].includes(os.arch()),
  isWindows: os.platform() === 'win32',
  isMac: os.platform() === 'darwin',
  isLinux: os.platform() === 'linux'
};

console.log('System Profile:', systemProfile);
