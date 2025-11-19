# Guide 1: Network Interfaces

Understanding network interface information in Node.js.

## Table of Contents
- [What are Network Interfaces?](#what-are-network-interfaces)
- [Getting Interface Information](#getting-interface-information)
- [Filtering and Processing](#filtering-and-processing)
- [Practical Applications](#practical-applications)

---

## What are Network Interfaces?

Network interfaces are hardware or software components that connect your computer to a network. Each interface can have multiple addresses (IPv4 and IPv6).

### Common Interface Types

- **Loopback (lo/lo0)**: Internal interface (127.0.0.1)
- **Ethernet (eth0, en0)**: Wired network connection
- **WiFi (wlan0, en1)**: Wireless network connection
- **Virtual (veth, docker0)**: Virtual/container interfaces

---

## Getting Interface Information

```javascript
const os = require('os');

const interfaces = os.networkInterfaces();

// Returns object like:
{
  lo: [{
    address: '127.0.0.1',
    netmask: '255.0.0.0',
    family: 'IPv4',
    mac: '00:00:00:00:00:00',
    internal: true,
    cidr: '127.0.0.1/8'
  }],
  eth0: [{
    address: '192.168.1.100',
    netmask: '255.255.255.0',
    family: 'IPv4',
    mac: 'a1:b2:c3:d4:e5:f6',
    internal: false,
    cidr: '192.168.1.100/24'
  }]
}
```

### Interface Properties

- **address**: IP address
- **netmask**: Subnet mask
- **family**: 'IPv4' or 'IPv6'
- **mac**: MAC (hardware) address
- **internal**: true for loopback
- **cidr**: CIDR notation (address/prefix)

---

## Filtering and Processing

### Get External IPv4 Addresses

```javascript
function getExternalIPv4() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push({
          interface: name,
          address: addr.address,
          mac: addr.mac
        });
      }
    }
  }

  return addresses;
}
```

### Get Primary Network Address

```javascript
function getPrimaryAddress() {
  const interfaces = os.networkInterfaces();

  for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }

  return null;
}
```

---

## Practical Applications

### 1. Server Binding Information

```javascript
function getServerBindInfo() {
  const interfaces = os.networkInterfaces();
  const bindings = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (!addr.internal && addr.family === 'IPv4') {
        bindings.push({
          interface: name,
          url: `http://${addr.address}:3000`
        });
      }
    }
  }

  return bindings;
}
```

### 2. Network Configuration Display

```javascript
function displayNetworkConfig() {
  const interfaces = os.networkInterfaces();

  console.log('Network Configuration:\n');

  for (const [name, addrs] of Object.entries(interfaces)) {
    console.log(`Interface: ${name}`);

    addrs.forEach(addr => {
      console.log(`  ${addr.family}: ${addr.address}`);
      if (addr.internal) {
        console.log('  (Internal/Loopback)');
      }
    });

    console.log('');
  }
}
```

---

## Summary

- Use `os.networkInterfaces()` to get network configuration
- Filter by `family` ('IPv4' or 'IPv6')
- Check `internal` property to exclude loopback
- Use for server binding, diagnostics, and configuration
