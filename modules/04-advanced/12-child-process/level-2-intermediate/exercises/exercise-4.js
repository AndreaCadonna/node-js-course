/**
 * EXERCISE 4: Signal Handling
 *
 * Difficulty: Intermediate
 * Estimated time: 30-40 minutes
 *
 * OBJECTIVE:
 * Build a process manager that properly handles signals for graceful
 * shutdown with timeout-based escalation.
 *
 * REQUIREMENTS:
 * 1. Start and manage multiple child processes
 * 2. Handle SIGTERM for graceful shutdown
 * 3. Implement timeout-based escalation to SIGKILL
 * 4. Propagate signals to all child processes
 * 5. Wait for all processes to exit before parent exits
 * 6. Track shutdown status for each process
 *
 * INSTRUCTIONS:
 * Implement the ProcessManager class with these methods:
 * - addProcess(command, args): Add a process to manage
 * - shutdown(timeout): Gracefully shut down all processes
 * - forceKillAll(): Force kill all remaining processes
 * - getStatus(): Get status of all processes
 *
 * TESTING:
 * Run: node exercise-4.js
 */

const { spawn } = require('child_process');
const fs = require('fs');

class ProcessManager {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
  }

  /**
   * Add a process to manage
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @returns {Object} Process info
   */
  addProcess(command, args = []) {
    // TODO: Implement this method
    // Hints:
    // 1. Spawn the process
    // 2. Assign it a unique ID
    // 3. Track its state (running, exited, killed)
    // 4. Store process info in this.processes
    // 5. Set up exit handler to update state

    throw new Error('Not implemented');
  }

  /**
   * Gracefully shut down all processes
   * @param {number} timeout - Grace period before force kill (ms)
   * @returns {Promise<Object>} Shutdown summary
   */
  async shutdown(timeout = 5000) {
    // TODO: Implement this method
    // Hints:
    // 1. Set isShuttingDown flag
    // 2. Send SIGTERM to all processes
    // 3. Wait for processes to exit OR timeout
    // 4. Force kill any remaining processes
    // 5. Return summary of shutdown

    throw new Error('Not implemented');
  }

  /**
   * Force kill all remaining processes
   * @returns {number} Number of processes killed
   */
  forceKillAll() {
    // TODO: Implement this method
    // Hints:
    // 1. Find processes still running
    // 2. Send SIGKILL to each
    // 3. Update their state
    // 4. Return count of killed processes

    throw new Error('Not implemented');
  }

  /**
   * Get status of all processes
   * @returns {Array<Object>} Process status array
   */
  getStatus() {
    // TODO: Implement this method
    // Return array of process info including:
    // - id
    // - pid
    // - command
    // - state (running, graceful_exit, killed, etc.)
    // - exitCode
    // - signal

    throw new Error('Not implemented');
  }

  /**
   * Get summary statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const statuses = this.getStatus();
    return {
      total: statuses.length,
      running: statuses.filter(p => p.state === 'running').length,
      exited: statuses.filter(p => p.state === 'exited').length,
      killed: statuses.filter(p => p.state === 'killed').length
    };
  }
}

// ============================================================================
// TEST CODE - DO NOT MODIFY BELOW THIS LINE
// ============================================================================

// Create test processes with different shutdown behaviors
const gracefulWorkerPath = '/tmp/graceful-worker.js';
const gracefulWorkerCode = `
let shutdownInProgress = false;

process.on('SIGTERM', () => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  console.log(\`  [Worker \${process.pid}] Received SIGTERM, shutting down gracefully...\`);

  setTimeout(() => {
    console.log(\`  [Worker \${process.pid}] Cleanup complete, exiting\`);
    process.exit(0);
  }, 1000);
});

// Keep alive
setInterval(() => {}, 1000);

console.log(\`  [Worker \${process.pid}] Started\`);
`;

const slowWorkerPath = '/tmp/slow-worker.js';
const slowWorkerCode = `
process.on('SIGTERM', () => {
  console.log(\`  [Slow Worker \${process.pid}] Received SIGTERM, but taking too long...\`);
  // Takes too long, will be force killed
});

setInterval(() => {}, 1000);

console.log(\`  [Slow Worker \${process.pid}] Started\`);
`;

const ignoringWorkerPath = '/tmp/ignoring-worker.js';
const ignoringWorkerCode = `
// This worker ignores SIGTERM
console.log(\`  [Ignoring Worker \${process.pid}] Started (ignores SIGTERM)\`);
setInterval(() => {}, 1000);
`;

fs.writeFileSync(gracefulWorkerPath, gracefulWorkerCode);
fs.writeFileSync(slowWorkerPath, slowWorkerCode);
fs.writeFileSync(ignoringWorkerPath, ignoringWorkerCode);

async function runTests() {
  console.log('=== Exercise 4: Signal Handling ===\n');

  // Test 1: Add processes
  console.log('Test 1: Add and track processes');
  try {
    const manager = new ProcessManager();

    manager.addProcess('node', [gracefulWorkerPath]);
    manager.addProcess('node', [gracefulWorkerPath]);

    const stats = manager.getStats();
    console.log('  Processes started:', stats);

    if (stats.total === 2 && stats.running === 2) {
      console.log('  ✓ Processes added and tracked\n');
    } else {
      console.log('  ✗ Process tracking incorrect\n');
    }

    await manager.shutdown();
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 2: Graceful shutdown
  console.log('Test 2: Graceful shutdown with compliant workers');
  try {
    const manager = new ProcessManager();

    manager.addProcess('node', [gracefulWorkerPath]);
    manager.addProcess('node', [gracefulWorkerPath]);
    manager.addProcess('node', [gracefulWorkerPath]);

    console.log('  Starting shutdown...\n');

    const summary = await manager.shutdown(3000);

    console.log('\n  Shutdown summary:', summary);

    const stats = manager.getStats();
    if (stats.running === 0 && stats.exited > 0) {
      console.log('  ✓ Graceful shutdown successful\n');
    } else {
      console.log('  ✗ Some processes still running\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 3: Timeout and force kill
  console.log('Test 3: Force kill after timeout');
  try {
    const manager = new ProcessManager();

    manager.addProcess('node', [gracefulWorkerPath]);
    manager.addProcess('node', [slowWorkerPath]);

    console.log('  Starting shutdown with 2 second timeout...\n');

    const summary = await manager.shutdown(2000);

    console.log('\n  Shutdown summary:', summary);

    const status = manager.getStatus();
    const forceKilled = status.filter(p => p.signal === 'SIGKILL').length;

    if (forceKilled > 0) {
      console.log(`  ✓ Force killed ${forceKilled} unresponsive process(es)\n`);
    } else {
      console.log('  ✗ No processes were force killed\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 4: Mixed workers
  console.log('Test 4: Mixed workers (graceful, slow, and ignoring)');
  try {
    const manager = new ProcessManager();

    manager.addProcess('node', [gracefulWorkerPath]);
    manager.addProcess('node', [slowWorkerPath]);
    manager.addProcess('node', [ignoringWorkerPath]);

    console.log('  Starting shutdown with 2 second timeout...\n');

    const summary = await manager.shutdown(2000);

    console.log('\n  Shutdown summary:', summary);

    const stats = manager.getStats();

    if (stats.running === 0) {
      console.log('  ✓ All processes shut down\n');
    } else {
      console.log(`  ✗ ${stats.running} processes still running\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 5: Process status tracking
  console.log('Test 5: Process status tracking');
  try {
    const manager = new ProcessManager();

    const p1 = manager.addProcess('node', [gracefulWorkerPath]);
    const p2 = manager.addProcess('node', [slowWorkerPath]);

    // Let them run briefly
    await new Promise(resolve => setTimeout(resolve, 500));

    const statusBefore = manager.getStatus();
    console.log('  Status before shutdown:');
    statusBefore.forEach(s => {
      console.log(`    Process ${s.id}: ${s.state} (PID ${s.pid})`);
    });

    await manager.shutdown(2000);

    const statusAfter = manager.getStatus();
    console.log('\n  Status after shutdown:');
    statusAfter.forEach(s => {
      console.log(`    Process ${s.id}: ${s.state} (exit code: ${s.exitCode}, signal: ${s.signal})`);
    });

    const allStopped = statusAfter.every(s => s.state !== 'running');

    if (allStopped) {
      console.log('\n  ✓ Status tracking accurate\n');
    } else {
      console.log('\n  ✗ Some processes not marked as stopped\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Cleanup
  fs.unlinkSync(gracefulWorkerPath);
  fs.unlinkSync(slowWorkerPath);
  fs.unlinkSync(ignoringWorkerPath);

  console.log('=== Tests Complete ===');
  console.log('\nHINTS:');
  console.log('- Use child.kill("SIGTERM") for graceful shutdown');
  console.log('- Use child.kill("SIGKILL") for force kill');
  console.log('- Set up setTimeout for timeout escalation');
  console.log('- Track process state in exit event handler');
  console.log('- Use Promise.race() to wait for exit or timeout');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = ProcessManager;
