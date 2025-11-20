/**
 * Exercise 5: Building a Simple CLI Tool
 *
 * OBJECTIVE:
 * Build a comprehensive command-line tool that combines all child_process concepts.
 *
 * PROJECT: Build a "Task Runner" CLI tool
 * This tool will:
 * - Execute shell commands
 * - Run Node.js scripts in parallel
 * - Stream output in real-time
 * - Handle errors gracefully
 * - Provide progress indicators
 *
 * REQUIREMENTS:
 * 1. Use exec() for simple shell commands
 * 2. Use spawn() for long-running processes with streaming output
 * 3. Use fork() for parallel Node.js task execution
 * 4. Implement comprehensive error handling
 * 5. Provide user-friendly output and progress indication
 * 6. Support configuration from command-line arguments
 *
 * LEARNING GOALS:
 * - Integrating multiple child_process methods
 * - Building a real-world CLI application
 * - Implementing robust error handling
 * - Managing concurrent processes
 * - Providing great user experience
 */

const { exec, spawn, fork } = require('child_process');
const path = require('path');

/**
 * TODO 1: Implement command executor
 *
 * Steps:
 * 1. Create a class CommandExecutor
 * 2. Support different execution modes (exec, spawn, fork)
 * 3. Track running commands
 * 4. Provide status updates
 * 5. Handle termination gracefully
 */
class CommandExecutor {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 30000;
    this.runningProcesses = new Map();
  }

  /**
   * TODO: Execute a shell command using exec
   */
  async executeShellCommand(command, options = {}) {
    // Your code here
    // Use exec() with timeout and error handling
    // Return { success, output, error }
  }

  /**
   * TODO: Spawn a process with streaming output
   */
  async spawnProcess(command, args, options = {}) {
    // Your code here
    // Use spawn() with real-time output
    // Show progress indicators
    // Handle errors
  }

  /**
   * TODO: Fork a Node.js worker
   */
  async forkWorker(scriptPath, data) {
    // Your code here
    // Use fork() to run Node.js script
    // Send data to worker
    // Wait for result
  }

  /**
   * TODO: Execute multiple commands in parallel
   */
  async executeParallel(commands) {
    // Your code here
    // Run multiple commands concurrently
    // Collect all results
    // Handle failures appropriately
  }

  /**
   * TODO: Kill all running processes
   */
  killAll() {
    // Your code here
    // Terminate all running processes
    // Clean up resources
  }
}

/**
 * TODO 2: Implement task configuration parser
 *
 * Steps:
 * 1. Read task configuration (from object or file)
 * 2. Validate task definitions
 * 3. Parse task dependencies
 * 4. Determine execution order
 */
class TaskConfig {
  constructor(config) {
    this.tasks = config.tasks || [];
    this.validate();
  }

  /**
   * TODO: Validate task configuration
   */
  validate() {
    // Your code here
    // Check required fields
    // Validate task types
    // Check for circular dependencies
  }

  /**
   * TODO: Get tasks in execution order
   */
  getExecutionOrder() {
    // Your code here
    // Sort tasks by dependencies
    // Return ordered list
  }
}

/**
 * TODO 3: Implement task runner with progress tracking
 *
 * Steps:
 * 1. Execute tasks in correct order
 * 2. Show progress for each task
 * 3. Display real-time output
 * 4. Handle task failures
 * 5. Generate summary report
 */
class TaskRunner {
  constructor(executor, config) {
    this.executor = executor;
    this.config = config;
    this.results = [];
  }

  /**
   * TODO: Run a single task
   */
  async runTask(task) {
    console.log(`\n▶ Running task: ${task.name}`);
    const startTime = Date.now();

    try {
      let result;

      // Your code here
      // Based on task.type, use appropriate execution method
      // - 'shell': use executeShellCommand
      // - 'spawn': use spawnProcess
      // - 'fork': use forkWorker

      const duration = Date.now() - startTime;
      console.log(`✓ Task completed in ${duration}ms`);

      return {
        task: task.name,
        success: true,
        duration,
        output: result
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ Task failed: ${error.message}`);

      return {
        task: task.name,
        success: false,
        duration,
        error: error.message
      };
    }
  }

  /**
   * TODO: Run all tasks
   */
  async runAll() {
    console.log('═══════════════════════════════════');
    console.log('       Task Runner Started         ');
    console.log('═══════════════════════════════════');

    const tasks = this.config.getExecutionOrder();
    console.log(`\nTotal tasks: ${tasks.length}`);

    // Your code here
    // Run tasks sequentially or in parallel based on dependencies
    // Track results
    // Generate summary

    this.printSummary();
  }

  /**
   * TODO: Print execution summary
   */
  printSummary() {
    console.log('\n═══════════════════════════════════');
    console.log('         Execution Summary         ');
    console.log('═══════════════════════════════════');

    // Your code here
    // Count successes/failures
    // Show total time
    // List failed tasks if any
  }
}

/**
 * TODO 4: Implement CLI interface
 *
 * Steps:
 * 1. Parse command-line arguments
 * 2. Load configuration
 * 3. Initialize components
 * 4. Handle Ctrl+C gracefully
 * 5. Provide help message
 */
class CLI {
  constructor() {
    this.setupSignalHandlers();
  }

  /**
   * TODO: Setup signal handlers
   */
  setupSignalHandlers() {
    // Your code here
    // Handle SIGINT (Ctrl+C)
    // Clean up processes
    // Exit gracefully
  }

  /**
   * TODO: Parse command-line arguments
   */
  parseArgs(args) {
    // Your code here
    // Parse flags (--verbose, --timeout, etc.)
    // Parse task name or config file
    // Return options object
  }

  /**
   * TODO: Show help message
   */
  showHelp() {
    console.log(`
Task Runner - Execute tasks using child processes

Usage:
  node exercise-5.js [options] <task-name>
  node exercise-5.js --config <config-file>

Options:
  --verbose         Show detailed output
  --timeout <ms>    Set timeout for tasks
  --parallel        Run tasks in parallel when possible
  --help            Show this help message

Examples:
  node exercise-5.js build
  node exercise-5.js --verbose test
  node exercise-5.js --config tasks.json
    `);
  }

  /**
   * TODO: Run the CLI
   */
  async run(args) {
    // Your code here
    // Parse arguments
    // Load configuration
    // Create executor and runner
    // Execute tasks
    // Handle errors
  }
}

/**
 * TODO 5: Example task configurations
 *
 * Create sample task configurations for testing
 */
const EXAMPLE_CONFIG = {
  tasks: [
    {
      name: 'install',
      type: 'shell',
      command: 'npm --version',
      description: 'Check npm version'
    },
    {
      name: 'lint',
      type: 'spawn',
      command: 'node',
      args: ['--version'],
      description: 'Check Node.js version'
    },
    {
      name: 'test',
      type: 'fork',
      script: './test-worker.js',
      data: { suite: 'unit' },
      description: 'Run tests',
      dependsOn: ['lint']
    },
    {
      name: 'build',
      type: 'shell',
      command: 'echo "Building project..."',
      description: 'Build project',
      dependsOn: ['test']
    }
  ]
};

/**
 * TODO 6: Main function
 */
async function main() {
  // Quick demo without full CLI
  console.log('=== Task Runner Demo ===\n');

  try {
    // Your code here
    // 1. Create executor
    // const executor = new CommandExecutor({ verbose: true });

    // 2. Create config
    // const config = new TaskConfig(EXAMPLE_CONFIG);

    // 3. Create runner
    // const runner = new TaskRunner(executor, config);

    // 4. Run tasks
    // await runner.runAll();

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // For full CLI:
  // const cli = new CLI();
  // cli.run(process.argv.slice(2));

  // For simple demo:
  // main();
}

module.exports = { CommandExecutor, TaskConfig, TaskRunner, CLI };

/**
 * EXAMPLE WORKER FILE (test-worker.js):
 *
 * ============= test-worker.js =============
 * // Simple test worker
 * process.on('message', (message) => {
 *   console.log('Running tests for:', message.suite);
 *
 *   // Simulate test execution
 *   setTimeout(() => {
 *     process.send({
 *       type: 'result',
 *       passed: 10,
 *       failed: 0,
 *       duration: 1500
 *     });
 *     process.exit(0);
 *   }, 1500);
 * });
 */

/**
 * TESTING YOUR SOLUTION:
 *
 * 1. Create the test-worker.js file
 * 2. Run the demo:
 *    node exercise-5.js
 *
 * 3. Test individual components:
 *    - CommandExecutor with different command types
 *    - TaskConfig with various task definitions
 *    - TaskRunner with sequential and parallel execution
 *    - CLI with different arguments
 *
 * 4. Test error scenarios:
 *    - Invalid commands
 *    - Timeouts
 *    - Failed tasks
 *    - Missing dependencies
 *
 * EXAMPLE OUTPUT:
 * ─────────────────────────────────────
 * ═══════════════════════════════════
 *        Task Runner Started
 * ═══════════════════════════════════
 *
 * Total tasks: 4
 *
 * ▶ Running task: install
 * Executing: npm --version
 * 8.19.2
 * ✓ Task completed in 45ms
 *
 * ▶ Running task: lint
 * Spawning: node --version
 * v18.17.0
 * ✓ Task completed in 32ms
 *
 * ▶ Running task: test
 * Forking: ./test-worker.js
 * Running tests for: unit
 * Tests: 10 passed, 0 failed
 * ✓ Task completed in 1520ms
 *
 * ▶ Running task: build
 * Executing: echo "Building project..."
 * Building project...
 * ✓ Task completed in 28ms
 *
 * ═══════════════════════════════════
 *          Execution Summary
 * ═══════════════════════════════════
 * Tasks completed: 4/4
 * Successes: 4
 * Failures: 0
 * Total time: 1625ms
 * ─────────────────────────────────────
 */

/**
 * LEARNING NOTES:
 *
 * Write down what you learned:
 * - When to use each child_process method?
 * - How to manage multiple concurrent processes?
 * - How to provide good user feedback?
 * - How to handle process cleanup?
 * - How to build a production-ready CLI tool?
 *
 * Key Takeaways:
 * 1. exec() for simple commands with small output
 * 2. spawn() for commands with large output or streaming
 * 3. fork() for Node.js-to-Node.js communication
 * 4. Always implement graceful shutdown
 * 5. Provide clear progress indicators
 * 6. Handle errors at every level
 * 7. Use appropriate timeouts
 * 8. Clean up all resources
 *
 * BONUS CHALLENGES:
 * - Add support for parallel task execution
 * - Implement task dependency resolution
 * - Add configuration file support (JSON/YAML)
 * - Implement task caching
 * - Add colorful output with ANSI codes
 * - Support environment variable substitution
 * - Add watch mode for automatic re-execution
 */
