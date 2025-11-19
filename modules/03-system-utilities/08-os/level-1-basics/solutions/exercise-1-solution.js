/**
 * Solution: Exercise 1 - System Information Display
 */

const os = require('os');

// Helper function to convert bytes to GB
function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

  return parts.join(', ');
}

// Main function to display system info
function displaySystemInfo() {
  const platform = os.platform();
  const arch = os.arch();
  const hostname = os.hostname();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const cpus = os.cpus();
  const uptime = os.uptime();
  const userInfo = os.userInfo();

  console.log('╔═══════════════════════════════╗');
  console.log('║    SYSTEM INFORMATION         ║');
  console.log('╚═══════════════════════════════╝\n');

  console.log('Platform:', platform);
  console.log('Architecture:', arch);
  console.log('Hostname:', hostname);

  console.log('\nMemory:');
  console.log('  Total:', bytesToGB(totalMem), 'GB');
  console.log('  Free:', bytesToGB(freeMem), 'GB');

  console.log('\nCPU:');
  console.log('  Model:', cpus[0].model);
  console.log('  Cores:', cpus.length);

  console.log('\nUptime:', formatUptime(uptime));

  console.log('\nUser:', userInfo.username);
  console.log('Home:', userInfo.homedir);
}

// Run the display function
displaySystemInfo();
