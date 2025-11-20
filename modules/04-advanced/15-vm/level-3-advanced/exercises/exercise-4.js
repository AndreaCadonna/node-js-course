/**
 * Exercise 4: Build a Multi-Tenant Executor
 *
 * Difficulty: ⭐⭐⭐⭐ Very Hard
 * Estimated Time: 90-120 minutes
 *
 * Your Task:
 * Build a complete multi-tenant code execution platform that safely runs
 * code from multiple users with proper isolation, resource quotas, and
 * fair scheduling.
 *
 * Requirements:
 * 1. Complete tenant isolation (separate contexts)
 * 2. Per-tenant resource quotas
 * 3. Fair scheduling with priorities
 * 4. Concurrent execution management
 * 5. Usage tracking and billing
 * 6. Queue management
 * 7. Statistics per tenant
 * 8. Platform-wide monitoring
 *
 * Methods to implement:
 * - createTenant(id, config): Register new tenant
 * - execute(tenantId, code): Execute code for tenant
 * - setTenantQuotas(tenantId, quotas): Configure limits
 * - getTenantUsage(tenantId): Get usage statistics
 * - getTenantBilling(tenantId): Get billing info
 * - removeTenant(tenantId): Remove tenant
 * - getPlatformStats(): Get overall statistics
 */

const vm = require('vm');
const v8 = require('v8');
const { EventEmitter } = require('events');

// TODO: Implement MultiTenantExecutor class
class MultiTenantExecutor extends EventEmitter {
  constructor(options = {}) {
    super();
    // TODO: Initialize platform with:
    // - maxConcurrent (max parallel executions)
    // - defaultQuotas (default resource limits)
    // - enableBilling
    // - pricingModel
  }

  /**
   * Create tenant
   * TODO: Register and configure new tenant
   */
  createTenant(tenantId, config = {}) {
    // TODO: Check if tenant exists
    // TODO: Create tenant object:
    //   - id
    //   - plan (basic/premium/enterprise)
    //   - priority
    //   - context (isolated VM context)
    //   - quotas (resource limits)
    //   - usage tracking
    //   - billing info
    // TODO: Store tenant
    // TODO: Emit 'tenant-created' event
  }

  /**
   * Set tenant quotas
   * TODO: Configure resource limits
   */
  setTenantQuotas(tenantId, quotas) {
    // TODO: Get tenant
    // TODO: Update quotas:
    //   - maxExecutionsPerMinute
    //   - maxCPUTime
    //   - maxMemory
    //   - maxConcurrent
    //   - maxTimeout
  }

  /**
   * Check if tenant can execute
   * TODO: Verify quotas and limits
   */
  canExecute(tenant) {
    // TODO: Check rate limit (executions per minute)
    // TODO: Check concurrent execution limit
    // TODO: Check if tenant is active
    // TODO: Return { allowed: boolean, reason?: string }
  }

  /**
   * Execute code for tenant
   * TODO: Queue and execute with isolation
   */
  async execute(tenantId, code, timeout) {
    // TODO: Get tenant or throw error
    // TODO: Check if execution allowed
    // TODO: Create execution task
    // TODO: Add to queue with priority
    // TODO: Wait for execution slot
    // TODO: Execute in tenant's context
    // TODO: Track resources used
    // TODO: Update usage statistics
    // TODO: Calculate billing
    // TODO: Release execution slot
    // TODO: Return result with metrics
  }

  /**
   * Schedule execution
   * TODO: Implement priority queue scheduling
   */
  async scheduleExecution(task) {
    // TODO: Wait for available slot
    // TODO: Execute task
    // TODO: Handle errors
    // TODO: Emit events
  }

  /**
   * Execute task
   * TODO: Run code with monitoring
   */
  async executeTask(tenant, task) {
    // TODO: Record start time
    // TODO: Take resource snapshot
    // TODO: Execute in tenant context
    // TODO: Monitor execution
    // TODO: Track CPU and memory
    // TODO: Check quotas during execution
    // TODO: Take end snapshot
    // TODO: Calculate usage
    // TODO: Update statistics
    // TODO: Return result
  }

  /**
   * Calculate cost
   * TODO: Compute billing based on usage
   */
  calculateCost(usage, plan) {
    // TODO: Apply pricing model:
    //   - Per execution fee
    //   - Per CPU millisecond
    //   - Per MB-second memory
    // TODO: Apply plan discounts
    // TODO: Return cost
  }

  /**
   * Get tenant usage
   * TODO: Return usage statistics
   */
  getTenantUsage(tenantId) {
    // TODO: Get tenant
    // TODO: Return usage object:
    //   - totalExecutions
    //   - successfulExecutions
    //   - failedExecutions
    //   - totalCPUTime
    //   - totalMemory
    //   - currentPeriodExecutions
    //   - quotaViolations
  }

  /**
   * Get tenant billing
   * TODO: Return billing information
   */
  getTenantBilling(tenantId) {
    // TODO: Get tenant
    // TODO: Return billing object:
    //   - plan
    //   - currentPeriodCost
    //   - totalCost
    //   - periodStart
    //   - periodEnd
    //   - usageBreakdown
  }

  /**
   * Get platform statistics
   * TODO: Return platform-wide stats
   */
  getPlatformStats() {
    // TODO: Aggregate stats across tenants
    // TODO: Return object:
    //   - totalTenants
    //   - activeTenants
    //   - totalExecutions
    //   - queueLength
    //   - concurrentExecutions
    //   - platformRevenue
  }

  /**
   * Remove tenant
   * TODO: Clean up tenant resources
   */
  removeTenant(tenantId) {
    // TODO: Get tenant
    // TODO: Cancel pending tasks
    // TODO: Clear context
    // TODO: Remove from storage
    // TODO: Emit 'tenant-removed' event
  }

  /**
   * Reset billing period
   * TODO: Start new billing cycle
   */
  resetBillingPeriod(tenantId) {
    // TODO: Archive current period
    // TODO: Reset current period counters
    // TODO: Update period dates
  }
}

// ============================================================================
// Test Cases - DO NOT MODIFY
// ============================================================================

async function runTests() {
  console.log('Testing Multi-Tenant Executor\n');
  console.log('='.repeat(60));

  const executor = new MultiTenantExecutor({
    maxConcurrent: 3,
    defaultQuotas: {
      maxExecutionsPerMinute: 10,
      maxCPUTime: 1000,
      maxMemory: 50 * 1024 * 1024
    },
    enableBilling: true
  });

  // Test 1: Create tenants
  console.log('\n✓ Test 1: Create Tenants');
  executor.createTenant('tenant1', { plan: 'basic', priority: 1 });
  executor.createTenant('tenant2', { plan: 'premium', priority: 3 });
  console.log('  Tenants created');

  // Test 2: Tenant isolation
  console.log('\n✓ Test 2: Tenant Isolation');
  await executor.execute('tenant1', 'x = 10', 1000);
  const result1 = await executor.execute('tenant1', 'x', 1000);
  const result2 = await executor.execute('tenant2', 'typeof x', 1000);
  console.assert(result1.result === 10, 'Tenant1 should have x');
  console.assert(result2.result === 'undefined', 'Tenant2 should not have x');
  console.log('  Isolation verified');

  // Test 3: Resource quotas
  console.log('\n✓ Test 3: Resource Quotas');
  executor.setTenantQuotas('tenant1', { maxTimeout: 500 });
  const result3 = await executor.execute('tenant1', 'while(true) {}', 1000);
  console.assert(result3.success === false, 'Should timeout');
  console.log('  Quotas enforced');

  // Test 4: Usage tracking
  console.log('\n✓ Test 4: Usage Tracking');
  const usage = executor.getTenantUsage('tenant1');
  console.assert(usage.totalExecutions > 0, 'Should track executions');
  console.log('  Executions:', usage.totalExecutions);

  // Test 5: Billing
  console.log('\n✓ Test 5: Billing');
  const billing = executor.getTenantBilling('tenant1');
  console.assert(billing.plan === 'basic', 'Should track plan');
  console.log('  Plan:', billing.plan);
  console.log('  Cost:', billing.currentPeriodCost);

  // Test 6: Platform stats
  console.log('\n✓ Test 6: Platform Statistics');
  const stats = executor.getPlatformStats();
  console.assert(stats.totalTenants === 2, 'Should have 2 tenants');
  console.log('  Total tenants:', stats.totalTenants);
  console.log('  Total executions:', stats.totalExecutions);

  console.log('\n' + '='.repeat(60));
  console.log('\nAll tests completed!');
}

// Uncomment to run tests
// runTests();

console.log(`
Exercise 4: Build a Multi-Tenant Executor

Next Steps:
1. Implement MultiTenantExecutor class
2. Add tenant management
3. Implement quota enforcement
4. Add fair scheduling
5. Implement billing tracking
6. Test isolation thoroughly
7. Verify quotas work correctly

Tips:
- Use Map for tenant storage
- Create separate VM contexts per tenant
- Implement queue with priorities
- Track resource usage per tenant
- Calculate costs based on usage
- Use events for monitoring
- Handle concurrent execution carefully

Good luck!
`);
