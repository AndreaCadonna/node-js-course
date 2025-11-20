/**
 * SOLUTION 4: Signal Handling
 *
 * This solution demonstrates:
 * - Managing multiple child processes
 * - Graceful shutdown with SIGTERM
 * - Timeout-based escalation to SIGKILL
 * - Signal propagation
 * - Process state tracking
 */

const { spawn } = require('child_process');

class ProcessManager {
  constructor() {
    this.processes = [];
    this.isShuttingDown = false;
    this.nextId = 1;
  }

  /**
   * Add a process to manage
   */
  addProcess(command, args = []) {
    const id = this.nextId++;
    const process = spawn(command, args);

    const processInfo = {
      id,
      pid: process.pid,
      command,
      args,
      process,
      state: 'running',
      exitCode: null,
      signal: null
    };

    // Track exit
    process.on('exit', (code, signal) => {
      processInfo.state = signal === 'SIGKILL' ? 'killed' : 'exited';
      processInfo.exitCode = code;
      processInfo.signal = signal;
    });

    this.processes.push(processInfo);
    return processInfo;
  }

  /**
   * Gracefully shut down all processes
   */
  async shutdown(timeout = 5000) {
    this.isShuttingDown = true;

    const startTime = Date.now();
    const summary = {
      gracefulExits: 0,
      forceKilled: 0,
      alreadyExited: 0
    };

    // Send SIGTERM to all running processes
    console.log('  Sending SIGTERM to all processes...');
    this.processes.forEach(p => {
      if (p.state === 'running' && !p.process.killed) {
        p.process.kill('SIGTERM');
      }
    });

    // Wait for processes to exit or timeout
    const deadline = startTime + timeout;

    while (Date.now() < deadline) {
      const runningCount = this.processes.filter(
        p => p.state === 'running'
      ).length;

      if (runningCount === 0) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Force kill any remaining processes
    const remaining = this.processes.filter(p => p.state === 'running');

    if (remaining.length > 0) {
      console.log(`  Timeout reached, force killing ${remaining.length} process(es)...`);
      remaining.forEach(p => {
        if (!p.process.killed) {
          p.process.kill('SIGKILL');
        }
      });

      // Wait a bit for SIGKILL to take effect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate summary
    this.processes.forEach(p => {
      if (p.signal === 'SIGKILL') {
        summary.forceKilled++;
      } else if (p.state === 'exited') {
        summary.gracefulExits++;
      } else if (p.exitCode !== null) {
        summary.alreadyExited++;
      }
    });

    return summary;
  }

  /**
   * Force kill all remaining processes
   */
  forceKillAll() {
    let count = 0;

    this.processes.forEach(p => {
      if (p.state === 'running' && !p.process.killed) {
        p.process.kill('SIGKILL');
        count++;
      }
    });

    return count;
  }

  /**
   * Get status of all processes
   */
  getStatus() {
    return this.processes.map(p => ({
      id: p.id,
      pid: p.pid,
      command: p.command,
      state: p.state,
      exitCode: p.exitCode,
      signal: p.signal
    }));
  }

  /**
   * Get summary statistics
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

module.exports = ProcessManager;

// Demo if run directly
if (require.main === module) {
  const fs = require('fs');

  // Create demo worker
  const demoWorkerPath = '/tmp/demo-signal-worker.js';
  fs.writeFileSync(demoWorkerPath, `
let shutdownInProgress = false;

process.on('SIGTERM', () => {
  if (shutdownInProgress) return;
  shutdownInProgress = true;

  console.log(\`  [Worker \${process.pid}] Shutting down gracefully...\`);

  setTimeout(() => {
    console.log(\`  [Worker \${process.pid}] Cleanup complete\`);
    process.exit(0);
  }, 500);
});

setInterval(() => {}, 1000);
console.log(\`  [Worker \${process.pid}] Started\`);
  `);

  async function demo() {
    console.log('=== Solution 4 Demo ===\n');

    const manager = new ProcessManager();

    console.log('Starting 3 workers...\n');
    manager.addProcess('node', [demoWorkerPath]);
    manager.addProcess('node', [demoWorkerPath]);
    manager.addProcess('node', [demoWorkerPath]);

    // Let them run briefly
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Initiating graceful shutdown...\n');
    const summary = await manager.shutdown(3000);

    console.log('\nShutdown summary:', summary);
    console.log('Final statistics:', manager.getStats());

    fs.unlinkSync(demoWorkerPath);

    console.log('\n=== Demo Complete ===');
  }

  demo().catch(console.error);
}
