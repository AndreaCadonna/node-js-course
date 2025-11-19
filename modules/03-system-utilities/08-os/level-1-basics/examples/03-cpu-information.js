/**
 * Example 3: CPU Information
 *
 * This example demonstrates how to retrieve and display
 * CPU information including model, speed, and cores.
 */

const os = require('os');

console.log('=== CPU Information ===\n');

// Get all CPU cores
const cpus = os.cpus();

console.log('Number of CPU Cores:', cpus.length);
console.log('CPU Model:', cpus[0].model);
console.log('CPU Speed:', cpus[0].speed, 'MHz');

console.log('\n=== CPU Cores Details ===\n');

// Display information for each core
cpus.forEach((cpu, index) => {
  console.log(`Core ${index}:`);
  console.log('  Model:', cpu.model);
  console.log('  Speed:', cpu.speed, 'MHz');
  console.log('  Times:', cpu.times);
  console.log('');
});

console.log('=== CPU Times Explanation ===\n');

// Explain CPU times
const firstCPU = cpus[0].times;
console.log('CPU Time Metrics (in milliseconds):');
console.log('user  :', firstCPU.user, '- Time spent in user mode');
console.log('nice  :', firstCPU.nice, '- Time spent in nice mode (Unix)');
console.log('sys   :', firstCPU.sys, '- Time spent in system mode');
console.log('idle  :', firstCPU.idle, '- Time spent idle');
console.log('irq   :', firstCPU.irq, '- Time spent servicing interrupts');

console.log('\n=== Total CPU Time ===\n');

// Calculate total CPU time across all cores
function getTotalCPUTimes() {
  const totals = {
    user: 0,
    nice: 0,
    sys: 0,
    idle: 0,
    irq: 0
  };

  cpus.forEach(cpu => {
    totals.user += cpu.times.user;
    totals.nice += cpu.times.nice;
    totals.sys += cpu.times.sys;
    totals.idle += cpu.times.idle;
    totals.irq += cpu.times.irq;
  });

  return totals;
}

const totalTimes = getTotalCPUTimes();
console.log('Total CPU Times (all cores):');
console.log(totalTimes);

console.log('\n=== CPU Time Distribution ===\n');

// Calculate time distribution
const totalTime = totalTimes.user + totalTimes.nice + totalTimes.sys +
                  totalTimes.idle + totalTimes.irq;

console.log('Time Distribution:');
console.log('User   :', ((totalTimes.user / totalTime) * 100).toFixed(2) + '%');
console.log('System :', ((totalTimes.sys / totalTime) * 100).toFixed(2) + '%');
console.log('Idle   :', ((totalTimes.idle / totalTime) * 100).toFixed(2) + '%');

console.log('\n=== CPU Summary ===\n');

// Create CPU summary object
const cpuSummary = {
  model: cpus[0].model,
  speed: cpus[0].speed + ' MHz',
  cores: cpus.length,
  architecture: os.arch(),
  totalTimes: totalTimes,
  activeTime: totalTime - totalTimes.idle,
  idleTime: totalTimes.idle,
  activePercent: (((totalTime - totalTimes.idle) / totalTime) * 100).toFixed(2) + '%'
};

console.log('CPU Summary:');
console.log(JSON.stringify(cpuSummary, null, 2));

console.log('\n=== CPU Capabilities ===\n');

// Determine system capabilities based on CPU
const capabilities = {
  canHandleMultithreading: cpus.length > 1,
  isHighPerformance: cpus[0].speed > 2000, // > 2 GHz
  recommendedWorkers: Math.min(cpus.length, 8), // Cap at 8
  category: cpus.length >= 8 ? 'High-end' :
            cpus.length >= 4 ? 'Mid-range' : 'Entry-level'
};

console.log('System Capabilities:');
console.log('Can handle multithreading:', capabilities.canHandleMultithreading);
console.log('High performance CPU:', capabilities.isHighPerformance);
console.log('Recommended workers:', capabilities.recommendedWorkers);
console.log('System category:', capabilities.category);
