/**
 * Example 7: Multi-Tenant Code Execution
 *
 * This example demonstrates:
 * - Tenant isolation strategies
 * - Resource quotas per tenant
 * - Fair scheduling
 * - Tenant-specific contexts
 * - Usage tracking and billing
 */

const vm = require('vm');
const v8 = require('v8');
const { performance } = require('perf_hooks');
const { EventEmitter } = require('events');

console.log('=== Multi-Tenant Code Execution ===\n');

// ============================================================================
// Part 1: Basic Tenant Isolation
// ============================================================================

console.log('Part 1: Basic Tenant Isolation\n');

/**
 * Basic multi-tenant executor
 */
class BasicMultiTenant {
  constructor() {
    this.tenants = new Map();
  }

  /**
   * Create tenant
   */
  createTenant(tenantId, config = {}) {
    if (this.tenants.has(tenantId)) {
      throw new Error(`Tenant ${tenantId} already exists`);
    }

    const tenant = {
      id: tenantId,
      context: vm.createContext({
        console,
        Math,
        JSON,
        Date
      }),
      config,
      stats: {
        executions: 0,
        totalTime: 0,
        errors: 0
      },
      createdAt: Date.now()
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  /**
   * Execute code for tenant
   */
  execute(tenantId, code, timeout = 5000) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const startTime = performance.now();

    try {
      const result = vm.runInContext(code, tenant.context, {
        timeout,
        displayErrors: true
      });

      const duration = performance.now() - startTime;
      tenant.stats.executions++;
      tenant.stats.totalTime += duration;

      return {
        success: true,
        result,
        duration: duration.toFixed(2) + 'ms'
      };
    } catch (error) {
      tenant.stats.errors++;
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get tenant stats
   */
  getTenantStats(tenantId) {
    const tenant = this.tenants.get(tenantId);
    return tenant ? tenant.stats : null;
  }

  /**
   * Remove tenant
   */
  removeTenant(tenantId) {
    return this.tenants.delete(tenantId);
  }
}

// Test basic multi-tenant
console.log('Testing basic multi-tenant:');
const basic = new BasicMultiTenant();

// Create tenants
basic.createTenant('tenant1');
basic.createTenant('tenant2');

// Execute for each tenant
console.log('Tenant 1 execution:');
const result1 = basic.execute('tenant1', 'x = 10; y = 20; x + y');
console.log('  Result:', result1.result, 'Duration:', result1.duration);

console.log('Tenant 2 execution:');
const result2 = basic.execute('tenant2', 'a = 100; b = 200; a * b');
console.log('  Result:', result2.result, 'Duration:', result2.duration);

// Verify isolation
console.log('\nVerifying isolation:');
const check1 = basic.execute('tenant1', 'typeof a'); // Should be undefined
console.log('  Tenant 1 accessing tenant 2 variable:', check1.result);

// ============================================================================
// Part 2: Resource Quotas Per Tenant
// ============================================================================

console.log('\n\nPart 2: Resource Quotas Per Tenant\n');

/**
 * Multi-tenant with resource quotas
 */
class QuotaBasedMultiTenant {
  constructor() {
    this.tenants = new Map();
  }

  /**
   * Create tenant with quotas
   */
  createTenant(tenantId, quotas = {}) {
    const tenant = {
      id: tenantId,
      context: vm.createContext({ console, Math, JSON }),
      quotas: {
        maxExecutionsPerMinute: quotas.maxExecutionsPerMinute || 60,
        maxCPUTime: quotas.maxCPUTime || 1000,
        maxMemoryMB: quotas.maxMemoryMB || 50,
        maxTimeout: quotas.maxTimeout || 5000,
        ...quotas
      },
      usage: {
        executions: [],
        totalCPUTime: 0,
        peakMemory: 0
      },
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        quotaViolations: 0
      }
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  /**
   * Check if tenant can execute
   */
  canExecute(tenant) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Filter recent executions
    tenant.usage.executions = tenant.usage.executions.filter(t => t > oneMinuteAgo);

    // Check rate limit
    if (tenant.usage.executions.length >= tenant.quotas.maxExecutionsPerMinute) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    return { allowed: true };
  }

  /**
   * Execute with quota enforcement
   */
  execute(tenantId, code) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Check if execution is allowed
    const check = this.canExecute(tenant);
    if (!check.allowed) {
      tenant.stats.quotaViolations++;
      throw new Error(`Quota violation: ${check.reason}`);
    }

    const startTime = performance.now();
    const startCPU = process.cpuUsage();
    const startMemory = v8.getHeapStatistics().used_heap_size;

    try {
      const result = vm.runInContext(code, tenant.context, {
        timeout: tenant.quotas.maxTimeout,
        displayErrors: true
      });

      const endTime = performance.now();
      const endCPU = process.cpuUsage(startCPU);
      const endMemory = v8.getHeapStatistics().used_heap_size;

      const cpuTime = (endCPU.user + endCPU.system) / 1000;
      const memoryUsed = (endMemory - startMemory) / 1024 / 1024;

      // Check quotas
      if (cpuTime > tenant.quotas.maxCPUTime) {
        tenant.stats.quotaViolations++;
        throw new Error(`CPU time limit exceeded: ${cpuTime.toFixed(2)}ms`);
      }

      if (memoryUsed > tenant.quotas.maxMemoryMB) {
        tenant.stats.quotaViolations++;
        throw new Error(`Memory limit exceeded: ${memoryUsed.toFixed(2)}MB`);
      }

      // Update usage
      tenant.usage.executions.push(Date.now());
      tenant.usage.totalCPUTime += cpuTime;
      tenant.usage.peakMemory = Math.max(tenant.usage.peakMemory, memoryUsed);

      tenant.stats.totalExecutions++;
      tenant.stats.successfulExecutions++;

      return {
        success: true,
        result,
        resources: {
          cpuTime: cpuTime.toFixed(2) + 'ms',
          memory: memoryUsed.toFixed(2) + 'MB',
          duration: (endTime - startTime).toFixed(2) + 'ms'
        }
      };
    } catch (error) {
      tenant.stats.totalExecutions++;
      tenant.stats.failedExecutions++;

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get tenant usage
   */
  getTenantUsage(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentExecutions = tenant.usage.executions.filter(t => t > oneMinuteAgo).length;

    return {
      executionsLastMinute: `${recentExecutions}/${tenant.quotas.maxExecutionsPerMinute}`,
      totalCPUTime: tenant.usage.totalCPUTime.toFixed(2) + 'ms',
      peakMemory: tenant.usage.peakMemory.toFixed(2) + 'MB',
      ...tenant.stats
    };
  }
}

// Test quota-based multi-tenant
console.log('Testing quota-based multi-tenant:');
const quotaBased = new QuotaBasedMultiTenant();

// Create tenants with different quotas
quotaBased.createTenant('premium', {
  maxExecutionsPerMinute: 100,
  maxCPUTime: 2000,
  maxMemoryMB: 100
});

quotaBased.createTenant('basic', {
  maxExecutionsPerMinute: 10,
  maxCPUTime: 500,
  maxMemoryMB: 20
});

console.log('Premium tenant execution:');
const premiumResult = quotaBased.execute('premium', 'Math.pow(2, 20)');
console.log('  Success:', premiumResult.success);
console.log('  Resources:', premiumResult.resources);

console.log('\nBasic tenant usage:');
console.log(quotaBased.getTenantUsage('basic'));

// ============================================================================
// Part 3: Fair Scheduling
// ============================================================================

console.log('\n\nPart 3: Fair Scheduling\n');

/**
 * Fair scheduler for multi-tenant execution
 */
class FairScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      maxConcurrent: options.maxConcurrent || 5,
      quantumMs: options.quantumMs || 100,
      ...options
    };

    this.tenants = new Map();
    this.queue = [];
    this.running = new Map();
  }

  /**
   * Create tenant
   */
  createTenant(tenantId, priority = 1) {
    const tenant = {
      id: tenantId,
      priority,
      context: vm.createContext({ console, Math, JSON }),
      queue: [],
      executing: false,
      stats: {
        executions: 0,
        totalWaitTime: 0,
        totalExecutionTime: 0
      }
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  /**
   * Submit task for tenant
   */
  async submit(tenantId, code, timeout = 5000) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    return new Promise((resolve, reject) => {
      const task = {
        tenantId,
        code,
        timeout,
        submitTime: Date.now(),
        resolve,
        reject
      };

      this.queue.push(task);
      this.schedule();
    });
  }

  /**
   * Schedule next task
   */
  async schedule() {
    if (this.queue.length === 0) return;
    if (this.running.size >= this.options.maxConcurrent) return;

    // Sort queue by tenant priority and wait time
    this.queue.sort((a, b) => {
      const tenantA = this.tenants.get(a.tenantId);
      const tenantB = this.tenants.get(b.tenantId);
      const waitA = Date.now() - a.submitTime;
      const waitB = Date.now() - b.submitTime;

      // Weighted score: priority * wait time
      const scoreA = tenantA.priority * waitA;
      const scoreB = tenantB.priority * waitB;

      return scoreB - scoreA;
    });

    const task = this.queue.shift();
    await this.executeTask(task);
  }

  /**
   * Execute task
   */
  async executeTask(task) {
    const tenant = this.tenants.get(task.tenantId);
    const waitTime = Date.now() - task.submitTime;

    tenant.stats.totalWaitTime += waitTime;
    this.running.set(task.tenantId, task);

    const startTime = performance.now();

    try {
      const result = vm.runInContext(task.code, tenant.context, {
        timeout: task.timeout,
        displayErrors: true
      });

      const duration = performance.now() - startTime;
      tenant.stats.executions++;
      tenant.stats.totalExecutionTime += duration;

      task.resolve({
        success: true,
        result,
        waitTime: waitTime + 'ms',
        executionTime: duration.toFixed(2) + 'ms'
      });
    } catch (error) {
      task.reject(error);
    } finally {
      this.running.delete(task.tenantId);
      this.schedule(); // Schedule next task
    }
  }

  /**
   * Get scheduler stats
   */
  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      tenants: this.tenants.size,
      capacity: `${this.running.size}/${this.options.maxConcurrent}`
    };
  }

  /**
   * Get tenant stats
   */
  getTenantStats(tenantId) {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return null;

    return {
      ...tenant.stats,
      avgWaitTime: tenant.stats.executions > 0
        ? (tenant.stats.totalWaitTime / tenant.stats.executions).toFixed(2) + 'ms'
        : '0ms',
      avgExecutionTime: tenant.stats.executions > 0
        ? (tenant.stats.totalExecutionTime / tenant.stats.executions).toFixed(2) + 'ms'
        : '0ms'
    };
  }
}

// Test fair scheduler
console.log('Testing fair scheduler:');
const scheduler = new FairScheduler({ maxConcurrent: 2 });

// Create tenants with different priorities
scheduler.createTenant('high-priority', 3);
scheduler.createTenant('low-priority', 1);

(async () => {
  console.log('Submitting tasks...');

  const tasks = [
    scheduler.submit('high-priority', 'Math.sqrt(144)'),
    scheduler.submit('low-priority', 'Math.pow(2, 10)'),
    scheduler.submit('high-priority', 'Math.sqrt(256)'),
    scheduler.submit('low-priority', 'Math.pow(3, 5)')
  ];

  const results = await Promise.all(tasks);
  results.forEach((result, i) => {
    console.log(`  Task ${i + 1}: Wait ${result.waitTime}, Exec ${result.executionTime}`);
  });

  console.log('\nScheduler stats:');
  console.log(scheduler.getStats());

  // ============================================================================
  // Part 4: Usage Tracking and Billing
  // ============================================================================

  console.log('\n\nPart 4: Usage Tracking and Billing\n');

  /**
   * Multi-tenant with billing
   */
  class BillingMultiTenant {
    constructor() {
      this.tenants = new Map();
      this.pricing = {
        perExecution: 0.001, // $0.001 per execution
        perCPUMs: 0.00001,   // $0.00001 per CPU millisecond
        perMBSecond: 0.0001  // $0.0001 per MB-second
      };
    }

    /**
     * Create tenant
     */
    createTenant(tenantId, plan = 'basic') {
      const tenant = {
        id: tenantId,
        plan,
        context: vm.createContext({ console, Math, JSON }),
        usage: {
          executions: 0,
          cpuTime: 0,
          memorySeconds: 0
        },
        billing: {
          totalCost: 0,
          currentPeriodCost: 0,
          periodStart: Date.now()
        },
        history: []
      };

      this.tenants.set(tenantId, tenant);
      return tenant;
    }

    /**
     * Execute and track billing
     */
    execute(tenantId, code, timeout = 5000) {
      const tenant = this.tenants.get(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const startTime = performance.now();
      const startCPU = process.cpuUsage();
      const startMemory = v8.getHeapStatistics().used_heap_size;

      try {
        const result = vm.runInContext(code, tenant.context, {
          timeout,
          displayErrors: true
        });

        const endTime = performance.now();
        const endCPU = process.cpuUsage(startCPU);
        const endMemory = v8.getHeapStatistics().used_heap_size;

        const duration = endTime - startTime;
        const cpuTime = (endCPU.user + endCPU.system) / 1000;
        const memoryUsed = (endMemory - startMemory) / 1024 / 1024;
        const memorySeconds = memoryUsed * (duration / 1000);

        // Calculate cost
        const cost = this.calculateCost({
          executions: 1,
          cpuTime,
          memorySeconds
        });

        // Update usage
        tenant.usage.executions++;
        tenant.usage.cpuTime += cpuTime;
        tenant.usage.memorySeconds += memorySeconds;

        // Update billing
        tenant.billing.totalCost += cost;
        tenant.billing.currentPeriodCost += cost;

        // Record history
        tenant.history.push({
          timestamp: new Date().toISOString(),
          code: code.substring(0, 50),
          duration: duration.toFixed(2),
          cpuTime: cpuTime.toFixed(2),
          memoryUsed: memoryUsed.toFixed(2),
          cost: cost.toFixed(6)
        });

        return {
          success: true,
          result,
          metrics: {
            duration: duration.toFixed(2) + 'ms',
            cpuTime: cpuTime.toFixed(2) + 'ms',
            memory: memoryUsed.toFixed(2) + 'MB'
          },
          cost: '$' + cost.toFixed(6)
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    /**
     * Calculate cost
     */
    calculateCost(usage) {
      return (
        usage.executions * this.pricing.perExecution +
        usage.cpuTime * this.pricing.perCPUMs +
        usage.memorySeconds * this.pricing.perMBSecond
      );
    }

    /**
     * Get billing summary
     */
    getBillingSummary(tenantId) {
      const tenant = this.tenants.get(tenantId);
      if (!tenant) return null;

      return {
        tenantId,
        plan: tenant.plan,
        usage: {
          executions: tenant.usage.executions,
          cpuTime: tenant.usage.cpuTime.toFixed(2) + 'ms',
          memorySeconds: tenant.usage.memorySeconds.toFixed(2) + 'MB-s'
        },
        costs: {
          totalCost: '$' + tenant.billing.totalCost.toFixed(4),
          currentPeriodCost: '$' + tenant.billing.currentPeriodCost.toFixed(4),
          periodStart: new Date(tenant.billing.periodStart).toISOString()
        },
        recentHistory: tenant.history.slice(-5)
      };
    }

    /**
     * Reset billing period
     */
    resetBillingPeriod(tenantId) {
      const tenant = this.tenants.get(tenantId);
      if (tenant) {
        tenant.billing.currentPeriodCost = 0;
        tenant.billing.periodStart = Date.now();
      }
    }
  }

  // Test billing multi-tenant
  console.log('Testing billing multi-tenant:');
  const billing = new BillingMultiTenant();

  billing.createTenant('customer1', 'premium');
  billing.createTenant('customer2', 'basic');

  console.log('Customer 1 executions:');
  for (let i = 0; i < 3; i++) {
    const result = billing.execute('customer1', `Math.pow(2, ${10 + i})`);
    console.log(`  Execution ${i + 1}: Cost ${result.cost}`);
  }

  console.log('\nBilling summary:');
  const summary = billing.getBillingSummary('customer1');
  console.log('  Tenant:', summary.tenantId);
  console.log('  Total executions:', summary.usage.executions);
  console.log('  Total cost:', summary.costs.totalCost);
  console.log('  Current period cost:', summary.costs.currentPeriodCost);

  // ============================================================================
  // Part 5: Complete Multi-Tenant Platform
  // ============================================================================

  console.log('\n\nPart 5: Complete Multi-Tenant Platform\n');

  /**
   * Production multi-tenant platform
   */
  class MultiTenantPlatform {
    constructor(options = {}) {
      this.options = {
        maxConcurrent: options.maxConcurrent || 10,
        enableBilling: options.enableBilling !== false,
        enableMonitoring: options.enableMonitoring !== false,
        ...options
      };

      this.tenants = new Map();
      this.scheduler = new FairScheduler({ maxConcurrent: this.options.maxConcurrent });
    }

    /**
     * Register tenant
     */
    registerTenant(tenantId, config = {}) {
      const tenant = {
        id: tenantId,
        config: {
          plan: config.plan || 'basic',
          quotas: config.quotas || {
            maxExecutionsPerMinute: 60,
            maxCPUTime: 1000,
            maxMemoryMB: 50
          },
          priority: config.priority || 1
        },
        context: vm.createContext({ console, Math, JSON }),
        usage: {
          executions: 0,
          cpuTime: 0,
          memory: 0
        },
        billing: {
          totalCost: 0
        }
      };

      this.tenants.set(tenantId, tenant);
      this.scheduler.createTenant(tenantId, tenant.config.priority);

      console.log(`  [Platform] Tenant ${tenantId} registered (${tenant.config.plan})`);
      return tenant;
    }

    /**
     * Execute for tenant
     */
    async execute(tenantId, code, timeout = 5000) {
      const tenant = this.tenants.get(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      return await this.scheduler.submit(tenantId, code, timeout);
    }

    /**
     * Get platform statistics
     */
    getStats() {
      const tenantStats = Array.from(this.tenants.entries()).map(([id, tenant]) => ({
        id,
        plan: tenant.config.plan,
        executions: tenant.usage.executions,
        cost: tenant.billing.totalCost
      }));

      return {
        totalTenants: this.tenants.size,
        scheduler: this.scheduler.getStats(),
        tenants: tenantStats
      };
    }
  }

  // Test complete platform
  console.log('Testing complete multi-tenant platform:');
  const platform = new MultiTenantPlatform({ maxConcurrent: 3 });

  // Register tenants
  platform.registerTenant('acme-corp', { plan: 'enterprise', priority: 3 });
  platform.registerTenant('startup-inc', { plan: 'basic', priority: 1 });

  console.log('\nExecuting tasks across tenants...');
  const platformTasks = [
    platform.execute('acme-corp', 'Math.sqrt(1024)'),
    platform.execute('startup-inc', 'Math.pow(3, 7)'),
    platform.execute('acme-corp', 'Math.sqrt(2500)')
  ];

  const platformResults = await Promise.all(platformTasks);
  platformResults.forEach((result, i) => {
    console.log(`  Task ${i + 1}: ${result.success ? 'Success' : 'Failed'}`);
  });

  console.log('\nPlatform statistics:');
  const platformStats = platform.getStats();
  console.log('  Total tenants:', platformStats.totalTenants);
  console.log('  Scheduler:', platformStats.scheduler);

  console.log('\n=== Summary: Multi-Tenant Execution ===\n');
  console.log('Features Implemented:');
  console.log('✓ Complete tenant isolation');
  console.log('✓ Per-tenant resource quotas');
  console.log('✓ Fair scheduling with priorities');
  console.log('✓ Usage tracking and billing');
  console.log('✓ Concurrent execution management');
  console.log('✓ Statistics and monitoring');
})();
