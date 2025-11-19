/**
 * Example 1: Network Interfaces
 *
 * This example demonstrates how to retrieve and work with
 * network interface information.
 */

const os = require('os');

console.log('=== Network Interfaces ===\n');

// Get all network interfaces
const interfaces = os.networkInterfaces();

console.log('Available network interfaces:', Object.keys(interfaces));
console.log('');

// Display all interfaces with details
for (const [name, addresses] of Object.entries(interfaces)) {
  console.log(`Interface: ${name}`);

  addresses.forEach((addr, index) => {
    console.log(`  Address ${index + 1}:`);
    console.log('    Family:', addr.family);
    console.log('    Address:', addr.address);
    console.log('    Netmask:', addr.netmask);
    console.log('    MAC:', addr.mac);
    console.log('    Internal:', addr.internal);
    console.log('    CIDR:', addr.cidr);
    console.log('');
  });
}

console.log('=== IPv4 Addresses Only ===\n');

// Filter for IPv4 addresses
function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    addrs.forEach(addr => {
      if (addr.family === 'IPv4') {
        addresses.push({
          interface: name,
          address: addr.address,
          internal: addr.internal,
          cidr: addr.cidr
        });
      }
    });
  }

  return addresses;
}

const ipv4Addresses = getIPv4Addresses();
ipv4Addresses.forEach(addr => {
  const type = addr.internal ? 'Internal' : 'External';
  console.log(`${addr.interface} (${type}): ${addr.address}`);
});

console.log('\n=== External Network Addresses ===\n');

// Get external (non-loopback) addresses
function getExternalAddresses() {
  const interfaces = os.networkInterfaces();
  const external = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    addrs.forEach(addr => {
      if (!addr.internal) {
        external.push({
          interface: name,
          family: addr.family,
          address: addr.address,
          mac: addr.mac
        });
      }
    });
  }

  return external;
}

const externalAddrs = getExternalAddresses();
console.log('External addresses:');
externalAddrs.forEach(addr => {
  console.log(`  ${addr.interface}: ${addr.address} (${addr.family})`);
  console.log(`    MAC: ${addr.mac}`);
});

console.log('\n=== Network Summary ===\n');

function getNetworkSummary() {
  const interfaces = os.networkInterfaces();
  let totalInterfaces = 0;
  let ipv4Count = 0;
  let ipv6Count = 0;
  let internalCount = 0;
  let externalCount = 0;

  for (const addrs of Object.values(interfaces)) {
    totalInterfaces++;
    addrs.forEach(addr => {
      if (addr.family === 'IPv4') ipv4Count++;
      if (addr.family === 'IPv6') ipv6Count++;
      if (addr.internal) internalCount++;
      else externalCount++;
    });
  }

  return {
    interfaces: totalInterfaces,
    ipv4Addresses: ipv4Count,
    ipv6Addresses: ipv6Count,
    internal: internalCount,
    external: externalCount
  };
}

const summary = getNetworkSummary();
console.log('Network Summary:');
console.log('Interfaces:', summary.interfaces);
console.log('IPv4 Addresses:', summary.ipv4Addresses);
console.log('IPv6 Addresses:', summary.ipv6Addresses);
console.log('Internal Addresses:', summary.internal);
console.log('External Addresses:', summary.external);
