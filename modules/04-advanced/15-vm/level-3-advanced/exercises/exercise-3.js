/**
 * Exercise 3: Implement a Resource Monitor
 *
 * Difficulty: ⭐⭐⭐ Hard
 * Estimated Time: 60-75 minutes
 *
 * Your Task:
 * Build a comprehensive resource monitoring system that tracks CPU time,
 * memory usage, and enforces quotas in real-time.
 *
 * Requirements:
 * 1. Monitor CPU time (user + system)
 * 2. Track memory usage (heap, RSS)
 * 3. Enforce resource quotas
 * 4. Real-time monitoring during execution
 * 5. Generate detailed resource reports
 * 6. Support resource profiling
 * 7. Quota violation detection
 * 8. Historical tracking
 *
 * Methods to implement:
 * - execute(code, quotas): Execute with resource monitoring
 * - startMonitoring(): Start real-time monitoring
 * - stopMonitoring(): Stop monitoring
 * - getUsage(): Get current resource usage
 * - getReport(): Get detailed resource report
 * - setQuotas(quotas): Configure resource limits
 * - profile(code, iterations): Profile code execution
 */

const vm = require('vm');
const v8 = require('v8');
const { performance } = require('perf_hooks');

// TODO: Implement ResourceMonitor class
class ResourceMonitor {
  constructor(options = {}) {
    // TODO: Initialize monitor with:
    // - Default quotas (CPU, memory, timeout)
    // - Monitoring interval
    // - History size limit
  }

  /**
   * Set resource quotas
   * TODO: Configure limits
   */
  setQuotas(quotas) {
    // TODO: Set quotas for:
    // - maxCPUTime (ms)
    // - maxMemory (bytes)
    // - maxTimeout (ms)
  }

  /**
   * Take resource snapshot
   * TODO: Capture current resource state
   */
  snapshot() {
    // TODO: Get heap statistics
    // TODO: Get process memory usage
    // TODO: Get CPU usage
    // TODO: Record timestamp
    // TODO: Return snapshot object
  }

  /**
   * Start real-time monitoring
   * TODO: Begin periodic sampling
   */
  startMonitoring() {
    // TODO: Clear previous snapshots
    // TODO: Start interval to take snapshots
    // TODO: Store snapshots in history
  }

  /**
   * Stop monitoring
   * TODO: Stop sampling
   */
  stopMonitoring() {
    // TODO: Clear monitoring interval
    // TODO: Keep snapshots for analysis
  }

  /**
   * Execute with resource monitoring
   * TODO: Monitor code execution
   */
  execute(code, context, quotas = {}) {
    // TODO: Merge quotas with defaults
    // TODO: Start monitoring
    // TODO: Take before snapshot
    // TODO: Execute code with timeout
    // TODO: Check quotas during execution
    // TODO: Take after snapshot
    // TODO: Stop monitoring
    // TODO: Calculate resource usage
    // TODO: Check if quotas exceeded
    // TODO: Return result with metrics
  }

  /**
   * Calculate resource usage
   * TODO: Compare before/after snapshots
   */
  calculateUsage(before, after) {
    // TODO: Calculate CPU time used
    // TODO: Calculate memory delta
    // TODO: Calculate wall time
    // TODO: Return usage object
  }

  /**
   * Check quota violations
   * TODO: Verify against limits
   */
  checkQuotas(usage, quotas) {
    // TODO: Check CPU time
    // TODO: Check memory usage
    // TODO: Return violations array
  }

  /**
   * Profile code execution
   * TODO: Run multiple times and analyze
   */
  profile(code, context, iterations = 10) {
    // TODO: Execute code N times
    // TODO: Collect metrics for each run
    // TODO: Calculate statistics:
    //   - min, max, avg, median
    //   - CPU time distribution
    //   - Memory usage pattern
    // TODO: Return profile report
  }

  /**
   * Get current usage
   * TODO: Return latest snapshot
   */
  getUsage() {
    // TODO: Take current snapshot
    // TODO: Return formatted usage
  }

  /**
   * Get detailed report
   * TODO: Generate comprehensive report
   */
  getReport() {
    // TODO: Analyze all snapshots
    // TODO: Calculate trends
    // TODO: Identify peaks
    // TODO: Generate summary statistics
    // TODO: Return report object with:
    //   - duration
    //   - snapshotCount
    //   - cpuUsage (total, avg, peak)
    //   - memoryUsage (total, avg, peak)
    //   - quotaViolations
  }

  /**
   * Get monitoring history
   * TODO: Return snapshot history
   */
  getHistory() {
    // TODO: Return array of snapshots
  }

  /**
   * Reset monitor
   * TODO: Clear all state
   */
  reset() {
    // TODO: Clear snapshots
    // TODO: Reset statistics
    // TODO: Stop monitoring
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

function runTests() {
  console.log('Testing Resource Monitor\n');
  console.log('='.repeat(60));

  const monitor = new ResourceMonitor({
    sampleInterval: 50
  });

  const context = vm.createContext({ result: 0, Math });

  // Test 1: Basic execution monitoring
  console.log('\n✓ Test 1: Basic Execution Monitoring');
  monitor.setQuotas({
    maxCPUTime: 1000,
    maxMemory: 50 * 1024 * 1024,
    maxTimeout: 5000
  });

  const result1 = monitor.execute('Math.pow(2, 20)', context);
  console.assert(result1.success === true, 'Should execute successfully');
  console.assert(result1.metrics, 'Should have metrics');
  console.log('  CPU time:', result1.metrics.cpuTime);
  console.log('  Memory:', result1.metrics.memory);

  // Test 2: Quota enforcement
  console.log('\n✓ Test 2: Quota Enforcement');
  monitor.setQuotas({ maxTimeout: 500 });
  const result2 = monitor.execute('while(true) {}', context);
  console.assert(result2.success === false, 'Should timeout');
  console.log('  Timeout enforced');

  // Test 3: Real-time monitoring
  console.log('\n✓ Test 3: Real-time Monitoring');
  monitor.startMonitoring();
  const context2 = vm.createContext({ arrays: [] });
  vm.runInContext(
    'for(let i=0; i<50; i++) arrays.push(new Array(1000).fill(i))',
    context2,
    { timeout: 5000 }
  );
  monitor.stopMonitoring();
  const history = monitor.getHistory();
  console.assert(history.length > 0, 'Should have snapshots');
  console.log('  Snapshots captured:', history.length);

  // Test 4: Resource report
  console.log('\n✓ Test 4: Resource Report');
  const report = monitor.getReport();
  console.assert(report.snapshotCount > 0, 'Should have snapshots');
  console.log('  Duration:', report.duration);
  console.log('  Snapshots:', report.snapshotCount);

  // Test 5: Profiling
  console.log('\n✓ Test 5: Code Profiling');
  const profile = monitor.profile('Math.sqrt(144)', context, 5);
  console.assert(profile.iterations === 5, 'Should run 5 times');
  console.assert(profile.statistics, 'Should have statistics');
  console.log('  Avg time:', profile.statistics.avgCPUTime);

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Uncomment to run tests
// runTests();

console.log(`
Exercise 3: Implement a Resource Monitor

Next Steps:
1. Implement ResourceMonitor class
2. Add snapshot functionality
3. Implement quota checking
4. Add real-time monitoring
5. Implement profiling
6. Generate detailed reports
7. Test with provided cases

Tips:
- Use v8.getHeapStatistics() for memory
- Use process.cpuUsage() for CPU time
- Use performance.now() for wall time
- Sample periodically during execution
- Compare before/after snapshots
- Calculate statistical metrics
- Handle async monitoring carefully

Good luck!
`);
