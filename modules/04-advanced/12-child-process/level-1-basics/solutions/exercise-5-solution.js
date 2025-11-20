/**
 * SOLUTION: Exercise 5 - Building a Simple CLI Tool
 *
 * Production-ready task runner combining all child_process methods.
 */

const { exec, spawn, fork } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Command Executor class
 */
class CommandExecutor {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 30000;
  }

  async executeShellCommand(command, options = {}) {
    if (this.verbose) console.log(`🔧 exec: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: this.timeout,
        ...options
      });

      return { success: true, output: stdout.trim(), error: null };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message
      };
    }
  }

  async spawnProcess(command, args, options = {}) {
    if (this.verbose) console.log(`🚀 spawn: ${command} ${args.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, options);
      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        if (this.verbose) process.stdout.write(chunk);
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: output.trim() });
        } else {
          reject(new Error(`Exit code ${code}: ${errorOutput}`));
        }
      });

      child.on('error', reject);
    });
  }

  async forkWorker(scriptPath, data) {
    if (this.verbose) console.log(`🔱 fork: ${scriptPath}`);

    return new Promise((resolve, reject) => {
      const child = fork(scriptPath, [], { silent: true });

      child.send(data);

      child.on('message', (result) => {
        child.kill();
        resolve({ success: true, output: result });
      });

      child.on('error', (error) => {
        reject(error);
      });

      child.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }
}

/**
 * Task Runner
 */
class TaskRunner {
  constructor(executor, tasks) {
    this.executor = executor;
    this.tasks = tasks;
    this.results = [];
  }

  async runTask(task) {
    console.log(`\n▶ Running: ${task.name}`);
    console.log(`  Description: ${task.description || 'No description'}`);

    const startTime = Date.now();

    try {
      let result;

      switch (task.type) {
        case 'shell':
          result = await this.executor.executeShellCommand(task.command);
          break;

        case 'spawn':
          result = await this.executor.spawnProcess(task.command, task.args || []);
          break;

        case 'fork':
          result = await this.executor.forkWorker(task.script, task.data);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✓ Completed in ${duration}ms`);

      return {
        task: task.name,
        success: true,
        duration,
        output: result.output
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ Failed in ${duration}ms: ${error.message}`);

      return {
        task: task.name,
        success: false,
        duration,
        error: error.message
      };
    }
  }

  async runAll() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║         Task Runner Started                ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`\nTotal tasks: ${this.tasks.length}`);

    for (const task of this.tasks) {
      const result = await this.runTask(task);
      this.results.push(result);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║         Execution Summary                  ║');
    console.log('╚════════════════════════════════════════════╝');

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⏱️  Total time: ${totalTime}ms`);

    if (failed > 0) {
      console.log('\n❌ Failed tasks:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.task}: ${r.error}`));
    }
  }
}

/**
 * Example configuration
 */
const EXAMPLE_TASKS = [
  {
    name: 'check-node',
    type: 'shell',
    command: 'node --version',
    description: 'Check Node.js version'
  },
  {
    name: 'check-npm',
    type: 'spawn',
    command: 'npm',
    args: ['--version'],
    description: 'Check npm version'
  },
  {
    name: 'list-files',
    type: 'shell',
    command: 'ls -la',
    description: 'List directory contents'
  }
];

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║    Task Runner CLI Tool - Solution        ║');
  console.log('╚════════════════════════════════════════════╝');

  const executor = new CommandExecutor({ verbose: true });
  const runner = new TaskRunner(executor, EXAMPLE_TASKS);

  await runner.runAll();

  console.log('\n✨ Task runner demo complete!');
}

if (require.main === module) {
  main();
}

module.exports = { CommandExecutor, TaskRunner };
