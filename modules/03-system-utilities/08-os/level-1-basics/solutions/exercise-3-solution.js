/**
 * Solution: Exercise 3 - CPU Information Tool
 */

const os = require('os');

// Get CPU summary
function getCPUSummary() {
  const cpus = os.cpus();
  return {
    model: cpus[0].model,
    speed: cpus[0].speed,
    count: cpus.length
  };
}

// Display core details
function displayCoreDetails() {
  const cpus = os.cpus();
  console.log('\nCore Details:');
  cpus.forEach((cpu, index) => {
    console.log(`Core ${index}: ${cpu.speed} MHz`);
  });
}

// Calculate time distribution
function getCPUTimeDistribution() {
  const cpus = os.cpus();
  const totals = { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };

  cpus.forEach(cpu => {
    totals.user += cpu.times.user;
    totals.nice += cpu.times.nice;
    totals.sys += cpu.times.sys;
    totals.idle += cpu.times.idle;
    totals.irq += cpu.times.irq;
  });

  const total = totals.user + totals.nice + totals.sys + totals.idle + totals.irq;

  return {
    userPercent: ((totals.user / total) * 100).toFixed(2),
    sysPercent: ((totals.sys / total) * 100).toFixed(2),
    idlePercent: ((totals.idle / total) * 100).toFixed(2)
  };
}

// Get recommendations
function getRecommendations() {
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const cpuSpeed = cpus[0].speed;
  const recommendations = [];

  if (cpuCount > 1) {
    recommendations.push('Multi-core CPU detected - suitable for parallel processing');
  }

  if (cpuSpeed > 2000) {
    recommendations.push('High-performance CPU - suitable for intensive tasks');
  }

  if (cpuCount >= 8) {
    recommendations.push('Many cores available - consider using cluster mode');
  }

  return recommendations;
}

// Main display function
function displayCPUInfo() {
  const summary = getCPUSummary();

  console.log('CPU Information:');
  console.log('Model:', summary.model);
  console.log('Speed:', summary.speed, 'MHz');
  console.log('Cores:', summary.count);

  displayCoreDetails();

  const distribution = getCPUTimeDistribution();
  console.log('\nCPU Time Distribution:');
  console.log('User:', distribution.userPercent + '%');
  console.log('System:', distribution.sysPercent + '%');
  console.log('Idle:', distribution.idlePercent + '%');

  const recommendations = getRecommendations();
  if (recommendations.length > 0) {
    console.log('\nRecommendations:');
    recommendations.forEach(rec => console.log('  -', rec));
  }
}

// Run the display
displayCPUInfo();
