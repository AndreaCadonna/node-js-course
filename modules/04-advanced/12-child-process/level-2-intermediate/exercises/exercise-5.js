/**
 * EXERCISE 5: Build a Simple Build Tool
 *
 * Difficulty: Intermediate-Advanced
 * Estimated time: 45-60 minutes
 *
 * OBJECTIVE:
 * Create a simple build tool that runs multiple build steps in parallel
 * using child processes, handles failures, and reports progress.
 *
 * REQUIREMENTS:
 * 1. Run multiple build commands in parallel (up to concurrency limit)
 * 2. Track progress of each build step
 * 3. Handle build failures and continue with other steps
 * 4. Collect and display build output
 * 5. Report overall build status and timing
 * 6. Support dependencies between build steps
 *
 * INSTRUCTIONS:
 * Implement the BuildTool class with these methods:
 * - addStep(name, command, args, options): Add a build step
 * - run(): Execute all build steps
 * - getResults(): Get build results for each step
 *
 * Build steps can have:
 * - name: Step identifier
 * - command: Command to execute
 * - args: Command arguments
 * - dependsOn: Array of step names that must complete first
 * - critical: If true, failure stops entire build
 *
 * TESTING:
 * Run: node exercise-5.js
 */

const { spawn } = require('child_process');
const fs = require('fs');

class BuildTool {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;
    this.steps = [];
    this.results = new Map();
    this.running = new Set();
  }

  /**
   * Add a build step
   * @param {string} name - Step name
   * @param {string} command - Command to execute
   * @param {Array<string>} args - Command arguments
   * @param {Object} options - Step options
   * @returns {BuildTool} this for chaining
   */
  addStep(name, command, args = [], options = {}) {
    // TODO: Implement this method
    // Hints:
    // 1. Create step object with name, command, args, and options
    // 2. Store in this.steps array
    // 3. Validate dependencies exist
    // 4. Return this for method chaining

    throw new Error('Not implemented');
  }

  /**
   * Run all build steps
   * @returns {Promise<Object>} Build summary
   */
  async run() {
    // TODO: Implement this method
    // Hints:
    // 1. Execute steps respecting dependencies
    // 2. Limit concurrency to maxConcurrency
    // 3. Handle failures (stop if critical, continue if not)
    // 4. Track timing for each step
    // 5. Return summary with success/failure counts

    throw new Error('Not implemented');
  }

  /**
   * Check if a step can run (dependencies satisfied)
   * @param {Object} step - Build step
   * @returns {boolean} True if step can run
   */
  canRunStep(step) {
    // TODO: Implement this method
    // Check if all dependencies have completed successfully

    throw new Error('Not implemented');
  }

  /**
   * Execute a single build step
   * @param {Object} step - Build step to execute
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step) {
    // TODO: Implement this method
    // Hints:
    // 1. Spawn the process
    // 2. Capture stdout and stderr
    // 3. Track start and end time
    // 4. Handle success and failure
    // 5. Store result in this.results

    throw new Error('Not implemented');
  }

  /**
   * Get build results
   * @returns {Array<Object>} Array of step results
   */
  getResults() {
    // TODO: Return array of results from this.results map

    throw new Error('Not implemented');
  }

  /**
   * Get build summary
   * @returns {Object} Summary statistics
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

// ============================================================================
// TEST CODE - DO NOT MODIFY BELOW THIS LINE
// ============================================================================

// Create test build scripts
const successScriptPath = '/tmp/build-success.sh';
fs.writeFileSync(successScriptPath, `#!/bin/bash
echo "Building $1..."
sleep $2
echo "$1 build complete"
exit 0
`);
fs.chmodSync(successScriptPath, 0o755);

const failScriptPath = '/tmp/build-fail.sh';
fs.writeFileSync(failScriptPath, `#!/bin/bash
echo "Building $1..."
sleep $2
echo "ERROR: $1 build failed!" >&2
exit 1
`);
fs.chmodSync(failScriptPath, 0o755);

async function runTests() {
  console.log('=== Exercise 5: Build a Simple Build Tool ===\n');

  // Test 1: Add build steps
  console.log('Test 1: Add build steps');
  try {
    const builder = new BuildTool();

    builder
      .addStep('compile', successScriptPath, ['frontend', '0.5'])
      .addStep('test', successScriptPath, ['tests', '0.3'])
      .addStep('lint', successScriptPath, ['linter', '0.2']);

    if (builder.steps.length === 3) {
      console.log('  ✓ Build steps added\n');
    } else {
      console.log(`  ✗ Expected 3 steps, got ${builder.steps.length}\n`);
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 2: Run successful build
  console.log('Test 2: Run successful build');
  try {
    const builder = new BuildTool({ maxConcurrency: 2 });

    builder
      .addStep('compile', successScriptPath, ['frontend', '0.5'])
      .addStep('test', successScriptPath, ['tests', '0.3'])
      .addStep('lint', successScriptPath, ['linter', '0.2']);

    console.log('  Running build...\n');

    const summary = await builder.run();

    console.log('\n  Build summary:', summary);

    const results = builder.getResults();
    console.log('  Step results:');
    results.forEach(r => {
      console.log(`    ${r.name}: ${r.success ? 'SUCCESS' : 'FAILED'} (${r.duration}ms)`);
    });

    if (summary.succeeded === 3 && summary.failed === 0) {
      console.log('\n  ✓ All builds succeeded\n');
    } else {
      console.log('\n  ✗ Some builds failed\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 3: Handle build failures
  console.log('Test 3: Handle build failures (non-critical)');
  try {
    const builder = new BuildTool({ maxConcurrency: 2 });

    builder
      .addStep('compile', successScriptPath, ['frontend', '0.3'])
      .addStep('failing-test', failScriptPath, ['tests', '0.2'], { critical: false })
      .addStep('lint', successScriptPath, ['linter', '0.2']);

    console.log('  Running build (one step will fail)...\n');

    const summary = await builder.run();

    console.log('\n  Build summary:', summary);

    if (summary.succeeded === 2 && summary.failed === 1) {
      console.log('  ✓ Handled failures correctly\n');
    } else {
      console.log('  ✗ Failure handling incorrect\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 4: Dependencies between steps
  console.log('Test 4: Build step dependencies');
  try {
    const builder = new BuildTool({ maxConcurrency: 3 });

    builder
      .addStep('install', successScriptPath, ['dependencies', '0.3'])
      .addStep('compile', successScriptPath, ['code', '0.4'], {
        dependsOn: ['install']
      })
      .addStep('test', successScriptPath, ['tests', '0.3'], {
        dependsOn: ['compile']
      });

    console.log('  Running build with dependencies...\n');

    const startTime = Date.now();
    await builder.run();
    const duration = Date.now() - startTime;

    console.log(`\n  Total build time: ${duration}ms`);

    const results = builder.getResults();
    console.log('  Execution order:');
    results.forEach((r, i) => {
      console.log(`    ${i + 1}. ${r.name}`);
    });

    // With dependencies, should execute sequentially
    if (duration >= 900) { // 300 + 400 + 300 = 1000ms minimum
      console.log('  ✓ Dependencies respected\n');
    } else {
      console.log('  ✗ Dependencies might not be respected\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 5: Concurrency limiting
  console.log('Test 5: Concurrency limiting');
  try {
    const builder = new BuildTool({ maxConcurrency: 2 });

    // Add 4 independent steps
    builder
      .addStep('step1', successScriptPath, ['task1', '0.5'])
      .addStep('step2', successScriptPath, ['task2', '0.5'])
      .addStep('step3', successScriptPath, ['task3', '0.5'])
      .addStep('step4', successScriptPath, ['task4', '0.5']);

    console.log('  Running 4 steps with concurrency limit of 2...\n');

    const startTime = Date.now();
    await builder.run();
    const duration = Date.now() - startTime;

    console.log(`\n  Total time: ${duration}ms`);

    // With concurrency 2, should take ~1000ms (2 rounds)
    // Without limiting, would take ~500ms (all parallel)
    if (duration >= 900) {
      console.log('  ✓ Concurrency limited correctly\n');
    } else {
      console.log('  ✗ All steps ran in parallel (concurrency not limited)\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Test 6: Critical failure stops build
  console.log('Test 6: Critical failure stops build');
  try {
    const builder = new BuildTool({ maxConcurrency: 2 });

    builder
      .addStep('compile', successScriptPath, ['code', '0.3'])
      .addStep('critical-step', failScriptPath, ['important', '0.2'], { critical: true })
      .addStep('test', successScriptPath, ['tests', '0.3']);

    console.log('  Running build with critical failure...\n');

    try {
      await builder.run();
    } catch (err) {
      console.log(`  Build stopped: ${err.message}`);
    }

    const summary = builder.getSummary();
    console.log('\n  Build summary:', summary);

    // Not all steps should complete
    if (summary.total < 3) {
      console.log('  ✓ Build stopped on critical failure\n');
    } else {
      console.log('  ✗ Build continued after critical failure\n');
    }
  } catch (error) {
    console.log('  ✗ Test failed:', error.message);
    console.log();
  }

  // Cleanup
  fs.unlinkSync(successScriptPath);
  fs.unlinkSync(failScriptPath);

  console.log('=== Tests Complete ===');
  console.log('\nHINTS:');
  console.log('- Track which steps are running vs waiting');
  console.log('- Check dependencies before starting each step');
  console.log('- Use Promise.all() with limited concurrency');
  console.log('- Collect stdout/stderr for each step');
  console.log('- Handle both success and failure cases');
  console.log('- Measure timing for each step');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = BuildTool;
