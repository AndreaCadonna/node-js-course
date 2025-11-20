/**
 * SOLUTION 5: Build a Simple Build Tool
 *
 * This solution demonstrates:
 * - Parallel process execution with concurrency limits
 * - Dependency resolution
 * - Build orchestration
 * - Output collection
 * - Error handling
 */

const { spawn } = require('child_process');

class BuildTool {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;
    this.steps = [];
    this.results = new Map();
    this.running = new Set();
  }

  /**
   * Add a build step
   */
  addStep(name, command, args = [], options = {}) {
    // Validate dependencies
    if (options.dependsOn) {
      options.dependsOn.forEach(dep => {
        if (!this.steps.find(s => s.name === dep)) {
          throw new Error(`Dependency not found: ${dep}`);
        }
      });
    }

    this.steps.push({
      name,
      command,
      args,
      dependsOn: options.dependsOn || [],
      critical: options.critical !== undefined ? options.critical : false
    });

    return this; // For chaining
  }

  /**
   * Run all build steps
   */
  async run() {
    const startTime = Date.now();
    const pending = [...this.steps];
    const completed = new Set();

    while (pending.length > 0 || this.running.size > 0) {
      // Find steps that can run
      const ready = pending.filter(step =>
        this.canRunStep(step, completed) &&
        !this.running.has(step.name)
      );

      // Start steps up to concurrency limit
      const slotsAvailable = this.maxConcurrency - this.running.size;
      const toStart = ready.slice(0, slotsAvailable);

      for (const step of toStart) {
        // Remove from pending
        const index = pending.indexOf(step);
        pending.splice(index, 1);

        // Start execution
        this.running.add(step.name);

        this.executeStep(step)
          .then(result => {
            this.running.delete(step.name);
            this.results.set(step.name, result);
            completed.add(step.name);

            // Check for critical failure
            if (!result.success && step.critical) {
              throw new Error(`Critical build step failed: ${step.name}`);
            }
          })
          .catch(err => {
            this.running.delete(step.name);
            if (step.critical) {
              throw err;
            }
          });
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const duration = Date.now() - startTime;
    const results = this.getResults();

    return {
      success: results.every(r => r.success),
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration
    };
  }

  /**
   * Check if a step can run
   */
  canRunStep(step, completed) {
    // All dependencies must be completed successfully
    return step.dependsOn.every(dep => {
      const result = this.results.get(dep);
      return result && result.success;
    });
  }

  /**
   * Execute a single build step
   */
  async executeStep(step) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const process = spawn(step.command, step.args);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;

        const result = {
          name: step.name,
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          duration
        };

        resolve(result);
      });

      process.on('error', (err) => {
        const duration = Date.now() - startTime;

        resolve({
          name: step.name,
          success: false,
          error: err.message,
          duration
        });
      });
    });
  }

  /**
   * Get build results
   */
  getResults() {
    return Array.from(this.results.values());
  }

  /**
   * Get build summary
   */
  getSummary() {
    const results = this.getResults();
    return {
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration: Math.max(...results.map(r => r.duration || 0))
    };
  }
}

module.exports = BuildTool;

// Demo if run directly
if (require.main === module) {
  const fs = require('fs');

  // Create demo build script
  const buildScriptPath = '/tmp/demo-build.sh';
  fs.writeFileSync(buildScriptPath, `#!/bin/bash
echo "Building $1..."
sleep $2
echo "$1 build complete"
exit 0
  `);
  fs.chmodSync(buildScriptPath, 0o755);

  async function demo() {
    console.log('=== Solution 5 Demo ===\n');

    const builder = new BuildTool({ maxConcurrency: 2 });

    console.log('Adding build steps with dependencies...');
    builder
      .addStep('install', buildScriptPath, ['dependencies', '0.5'])
      .addStep('compile', buildScriptPath, ['code', '0.6'], {
        dependsOn: ['install']
      })
      .addStep('test', buildScriptPath, ['tests', '0.4'], {
        dependsOn: ['compile']
      })
      .addStep('lint', buildScriptPath, ['linter', '0.3']);

    console.log('\nRunning build...\n');

    const summary = await builder.run();

    console.log('\nBuild complete!');
    console.log('Summary:', summary);

    console.log('\nStep results:');
    builder.getResults().forEach(r => {
      console.log(`  ${r.name}: ${r.success ? 'SUCCESS' : 'FAILED'} (${r.duration}ms)`);
    });

    fs.unlinkSync(buildScriptPath);

    console.log('\n=== Demo Complete ===');
  }

  demo().catch(console.error);
}
