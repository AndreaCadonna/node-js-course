/**
 * Exercise 4 Solution: Multi-Tenant Executor
 *
 * A complete multi-tenant code execution platform with:
 * - Complete tenant isolation (separate contexts)
 * - Per-tenant resource quotas
 * - Fair scheduling with priorities
 * - Concurrent execution management
 * - Usage tracking and billing
 * - Queue management
 * - Statistics per tenant
 * - Platform-wide monitoring
 */

const vm = require('vm');
const v8 = require('v8');
const { EventEmitter } = require('events');
const { performance } = require('perf_hooks');

/**
 * MultiTenantExecutor - Manage and execute code for multiple tenants
 */
class MultiTenantExecutor extends EventEmitter {
  constructor(options = {}) {
    super();

    // Platform configuration
    this.maxConcurrent = options.maxConcurrent || 5;
    this.enableBilling = options.enableBilling !== false;

    // Default quotas for tenants
    this.defaultQuotas = {
      maxExecutionsPerMinute: options.maxExecutionsPerMinute || 60,
      maxCPUTime: options.maxCPUTime || 1000, // milliseconds
      maxMemory: options.maxMemory || 50 * 1024 * 1024, // 50MB
      maxConcurrent: options.maxConcurrent || 2,
      maxTimeout: options.maxTimeout || 5000 // milliseconds
    };

    // Pricing model (cost per unit)
    this.pricing = {
      basic: {
        perExecution: 0.001,
        perCPUMillisecond: 0.00001,
        perMBSecond: 0.0001,
        discount: 1.0 // No discount
      },
      premium: {
        perExecution: 0.0008,
        perCPUMillisecond: 0.000008,
        perMBSecond: 0.00008,
        discount: 0.8 // 20% discount
      },
      enterprise: {
        perExecution: 0.0005,
        perCPUMillisecond: 0.000005,
        perMBSecond: 0.00005,
        discount: 0.6 // 40% discount
      }
    };

    // Tenant storage
    this.tenants = new Map();

    // Execution queue and management
    this.executionQueue = [];
    this.currentExecutions = 0;
    this.processingQueue = false;

    // Platform statistics
    this.platformStats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalRevenue: 0,
      startTime: Date.now()
    };
  }

  /**
   * Create a new tenant
   */
  createTenant(tenantId, config = {}) {
    if (this.tenants.has(tenantId)) {
      throw new Error(`Tenant ${tenantId} already exists`);
    }

    const plan = config.plan || 'basic';
    const priority = config.priority || 1;

    // Create isolated VM context for tenant
    const context = vm.createContext({
      console: console,
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      RegExp: RegExp,
      Error: Error,
      Promise: Promise,
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval
    });

    const tenant = {
      id: tenantId,
      plan,
      priority,
      context,
      quotas: { ...this.defaultQuotas },
      active: true,
      createdAt: Date.now(),

      // Usage tracking
      usage: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalCPUTime: 0,
        totalMemory: 0,
        quotaViolations: 0,
        currentPeriodExecutions: 0,
        lastExecutionTime: null
      },

      // Rate limiting
      rateLimit: {
        window: 60000, // 1 minute
        executions: [],
        currentConcurrent: 0
      },

      // Billing
      billing: {
        plan,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        currentPeriodCost: 0,
        totalCost: 0,
        usageBreakdown: {
          executionCosts: 0,
          cpuCosts: 0,
          memoryCosts: 0
        }
      }
    };

    this.tenants.set(tenantId, tenant);

    this.emit('tenant-created', {
      tenantId,
      plan,
      priority
    });

    return {
      tenantId,
      plan,
      priority,
      createdAt: tenant.createdAt
    };
  }

  /**
   * Set tenant quotas
   */
  setTenantQuotas(tenantId, quotas) {
    const tenant = this.getTenantOrThrow(tenantId);

    tenant.quotas = {
      ...tenant.quotas,
      ...quotas
    };

    this.emit('tenant-quotas-updated', {
      tenantId,
      quotas: tenant.quotas
    });
  }

  /**
   * Check if tenant can execute based on rate limits
   */
  canExecute(tenant) {
    if (!tenant.active) {
      return {
        allowed: false,
        reason: 'Tenant is inactive'
      };
    }

    // Check concurrent execution limit
    if (tenant.rateLimit.currentConcurrent >= tenant.quotas.maxConcurrent) {
      return {
        allowed: false,
        reason: `Concurrent execution limit reached (${tenant.quotas.maxConcurrent})`
      };
    }

    // Check rate limit (executions per minute)
    const now = Date.now();
    const windowStart = now - tenant.rateLimit.window;

    // Remove old executions outside the window
    tenant.rateLimit.executions = tenant.rateLimit.executions.filter(
      time => time > windowStart
    );

    if (tenant.rateLimit.executions.length >= tenant.quotas.maxExecutionsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded (${tenant.quotas.maxExecutionsPerMinute} per minute)`
      };
    }

    return {
      allowed: true
    };
  }

  /**
   * Execute code for a tenant
   */
  async execute(tenantId, code, timeout) {
    const tenant = this.getTenantOrThrow(tenantId);

    // Check if execution is allowed
    const canExecute = this.canExecute(tenant);
    if (!canExecute.allowed) {
      return {
        success: false,
        error: canExecute.reason,
        tenantId
      };
    }

    // Create execution task
    const task = {
      tenantId,
      tenant,
      code,
      timeout: timeout || tenant.quotas.maxTimeout,
      priority: tenant.priority,
      createdAt: Date.now(),
      promise: null,
      resolve: null,
      reject: null
    };

    // Create promise for async execution
    task.promise = new Promise((resolve, reject) => {
      task.resolve = resolve;
      task.reject = reject;
    });

    // Add to queue
    this.executionQueue.push(task);

    // Sort queue by priority (higher priority first)
    this.executionQueue.sort((a, b) => b.priority - a.priority);

    // Process queue
    this.processQueue();

    // Wait for execution to complete
    return task.promise;
  }

  /**
   * Process the execution queue
   */
  async processQueue() {
    if (this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    while (this.executionQueue.length > 0 && this.currentExecutions < this.maxConcurrent) {
      const task = this.executionQueue.shift();

      // Check if still allowed (might have changed while waiting)
      const canExecute = this.canExecute(task.tenant);
      if (!canExecute.allowed) {
        task.resolve({
          success: false,
          error: canExecute.reason,
          tenantId: task.tenantId
        });
        continue;
      }

      // Start execution
      this.currentExecutions++;
      task.tenant.rateLimit.currentConcurrent++;
      task.tenant.rateLimit.executions.push(Date.now());

      // Execute asynchronously (don't await here to allow concurrent execution)
      this.executeTask(task.tenant, task)
        .then(result => {
          this.currentExecutions--;
          task.tenant.rateLimit.currentConcurrent--;
          task.resolve(result);

          // Try to process more tasks
          this.processQueue();
        })
        .catch(error => {
          this.currentExecutions--;
          task.tenant.rateLimit.currentConcurrent--;
          task.reject(error);

          // Try to process more tasks
          this.processQueue();
        });
    }

    this.processingQueue = false;
  }

  /**
   * Execute a single task
   */
  async executeTask(tenant, task) {
    const executionRecord = {
      tenantId: tenant.id,
      startTime: Date.now(),
      endTime: null,
      success: false,
      result: null,
      error: null,
      metrics: null
    };

    try {
      // Take resource snapshot before execution
      const beforeSnapshot = this.takeSnapshot();

      // Compile and execute
      const script = new vm.Script(task.code, {
        filename: `tenant-${tenant.id}`,
        displayErrors: true
      });

      const startWall = performance.now();

      const result = script.runInContext(tenant.context, {
        timeout: task.timeout,
        displayErrors: true
      });

      const endWall = performance.now();

      // Take resource snapshot after execution
      const afterSnapshot = this.takeSnapshot();

      // Calculate resource usage
      const usage = this.calculateUsage(beforeSnapshot, afterSnapshot);
      usage.wallTime = endWall - startWall;

      // Update tenant usage statistics
      tenant.usage.totalExecutions++;
      tenant.usage.successfulExecutions++;
      tenant.usage.currentPeriodExecutions++;
      tenant.usage.totalCPUTime += usage.cpuTime;
      tenant.usage.totalMemory += usage.memoryDelta;
      tenant.usage.lastExecutionTime = Date.now();

      // Calculate cost if billing is enabled
      let cost = 0;
      if (this.enableBilling) {
        cost = this.calculateCost(usage, tenant.plan, task.timeout);

        tenant.billing.currentPeriodCost += cost;
        tenant.billing.totalCost += cost;
        tenant.billing.usageBreakdown.executionCosts += this.pricing[tenant.plan].perExecution;
        tenant.billing.usageBreakdown.cpuCosts += (usage.cpuTime / 1000) * this.pricing[tenant.plan].perCPUMillisecond;
        tenant.billing.usageBreakdown.memoryCosts += (usage.memoryDelta / 1024 / 1024) * this.pricing[tenant.plan].perMBSecond * (usage.wallTime / 1000);

        this.platformStats.totalRevenue += cost;
      }

      // Update platform statistics
      this.platformStats.totalExecutions++;
      this.platformStats.successfulExecutions++;

      executionRecord.success = true;
      executionRecord.result = result;
      executionRecord.metrics = usage;
      executionRecord.cost = cost;
      executionRecord.endTime = Date.now();

      this.emit('execution-complete', {
        tenantId: tenant.id,
        success: true,
        duration: executionRecord.endTime - executionRecord.startTime,
        cost
      });

      return {
        success: true,
        result,
        metrics: usage,
        cost,
        tenantId: tenant.id
      };

    } catch (error) {
      // Execution failed
      tenant.usage.totalExecutions++;
      tenant.usage.failedExecutions++;

      this.platformStats.totalExecutions++;
      this.platformStats.failedExecutions++;

      executionRecord.success = false;
      executionRecord.error = error.message;
      executionRecord.endTime = Date.now();

      this.emit('execution-failed', {
        tenantId: tenant.id,
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        tenantId: tenant.id
      };
    }
  }

  /**
   * Take a resource snapshot
   */
  takeSnapshot() {
    const heapStats = v8.getHeapStatistics();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: Date.now(),
      heap: heapStats.used_heap_size,
      cpu: cpuUsage.user + cpuUsage.system
    };
  }

  /**
   * Calculate resource usage
   */
  calculateUsage(before, after) {
    return {
      cpuTime: (after.cpu - before.cpu) / 1000, // Convert microseconds to milliseconds
      memoryDelta: after.heap - before.heap,
      memoryFinal: after.heap,
      wallTime: after.timestamp - before.timestamp
    };
  }

  /**
   * Calculate cost based on usage
   */
  calculateCost(usage, plan, timeout) {
    const pricing = this.pricing[plan] || this.pricing.basic;

    // Per execution cost
    let cost = pricing.perExecution;

    // CPU cost (per millisecond)
    cost += usage.cpuTime * pricing.perCPUMillisecond;

    // Memory cost (per MB-second)
    const memoryMB = usage.memoryDelta / 1024 / 1024;
    const timeSeconds = usage.wallTime / 1000;
    cost += memoryMB * timeSeconds * pricing.perMBSecond;

    // Apply plan discount
    cost *= pricing.discount;

    return cost;
  }

  /**
   * Get tenant usage statistics
   */
  getTenantUsage(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);

    return {
      tenantId,
      totalExecutions: tenant.usage.totalExecutions,
      successfulExecutions: tenant.usage.successfulExecutions,
      failedExecutions: tenant.usage.failedExecutions,
      totalCPUTime: tenant.usage.totalCPUTime,
      totalMemory: tenant.usage.totalMemory,
      currentPeriodExecutions: tenant.usage.currentPeriodExecutions,
      quotaViolations: tenant.usage.quotaViolations,
      lastExecutionTime: tenant.usage.lastExecutionTime,
      averageCPUTime: tenant.usage.totalExecutions > 0
        ? tenant.usage.totalCPUTime / tenant.usage.totalExecutions
        : 0
    };
  }

  /**
   * Get tenant billing information
   */
  getTenantBilling(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);

    return {
      tenantId,
      plan: tenant.billing.plan,
      currentPeriodCost: tenant.billing.currentPeriodCost,
      totalCost: tenant.billing.totalCost,
      periodStart: tenant.billing.currentPeriodStart,
      periodEnd: tenant.billing.currentPeriodEnd,
      usageBreakdown: {
        executionCosts: tenant.billing.usageBreakdown.executionCosts,
        cpuCosts: tenant.billing.usageBreakdown.cpuCosts,
        memoryCosts: tenant.billing.usageBreakdown.memoryCosts
      }
    };
  }

  /**
   * Get platform-wide statistics
   */
  getPlatformStats() {
    const activeTenants = Array.from(this.tenants.values()).filter(t => t.active).length;

    return {
      totalTenants: this.tenants.size,
      activeTenants,
      totalExecutions: this.platformStats.totalExecutions,
      successfulExecutions: this.platformStats.successfulExecutions,
      failedExecutions: this.platformStats.failedExecutions,
      queueLength: this.executionQueue.length,
      concurrentExecutions: this.currentExecutions,
      platformRevenue: this.platformStats.totalRevenue,
      uptime: Date.now() - this.platformStats.startTime
    };
  }

  /**
   * Remove a tenant
   */
  removeTenant(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);

    // Cancel pending tasks for this tenant
    this.executionQueue = this.executionQueue.filter(task => {
      if (task.tenantId === tenantId) {
        task.resolve({
          success: false,
          error: 'Tenant removed',
          tenantId
        });
        return false;
      }
      return true;
    });

    // Remove tenant
    this.tenants.delete(tenantId);

    this.emit('tenant-removed', { tenantId });
  }

  /**
   * Reset billing period for a tenant
   */
  resetBillingPeriod(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);

    // Archive current period (in a real system, this would be persisted)
    const archivedPeriod = {
      start: tenant.billing.currentPeriodStart,
      end: tenant.billing.currentPeriodEnd,
      cost: tenant.billing.currentPeriodCost,
      usageBreakdown: { ...tenant.billing.usageBreakdown }
    };

    // Reset current period
    tenant.billing.currentPeriodStart = Date.now();
    tenant.billing.currentPeriodEnd = Date.now() + 30 * 24 * 60 * 60 * 1000;
    tenant.billing.currentPeriodCost = 0;
    tenant.billing.usageBreakdown = {
      executionCosts: 0,
      cpuCosts: 0,
      memoryCosts: 0
    };

    tenant.usage.currentPeriodExecutions = 0;

    this.emit('billing-period-reset', {
      tenantId,
      archivedPeriod
    });
  }

  /**
   * Get tenant or throw error
   */
  getTenantOrThrow(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }
    return tenant;
  }

  /**
   * List all tenants
   */
  listTenants() {
    return Array.from(this.tenants.values()).map(tenant => ({
      id: tenant.id,
      plan: tenant.plan,
      priority: tenant.priority,
      active: tenant.active,
      totalExecutions: tenant.usage.totalExecutions,
      currentPeriodCost: tenant.billing.currentPeriodCost
    }));
  }

  /**
   * Activate tenant
   */
  activateTenant(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);
    tenant.active = true;
    this.emit('tenant-activated', { tenantId });
  }

  /**
   * Deactivate tenant
   */
  deactivateTenant(tenantId) {
    const tenant = this.getTenantOrThrow(tenantId);
    tenant.active = false;
    this.emit('tenant-deactivated', { tenantId });
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

// Export for reuse
module.exports = MultiTenantExecutor;

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
