/**
 * Example 5: Resource-Based Scaling Decisions
 *
 * This example demonstrates how to make intelligent scaling
 * decisions based on system resources.
 */

const os = require('os');

console.log('=== Resource-Based Scaling Decisions ===\n');

class ScalingAdvisor {
  constructor() {
    this.cpuCount = os.cpus().length;
    this.totalMemoryGB = os.totalmem() / (1024 ** 3);
  }

  /**
   * Determine optimal worker count for cluster mode
   */
  getOptimalWorkerCount() {
    const freeMemoryGB = os.freemem() / (1024 ** 3);
    const memoryPerWorkerGB = 0.5; // Assume each worker needs 500MB

    // Calculate based on CPU
    const cpuBased = Math.max(1, this.cpuCount - 1); // Leave one for OS

    // Calculate based on available memory
    const memoryBased = Math.floor(freeMemoryGB / memoryPerWorkerGB);

    // Use the more conservative number
    const recommended = Math.min(cpuBased, memoryBased, 8); // Cap at 8

    return {
      recommended,
      cpuBased,
      memoryBased,
      reasoning: this.getWorkerRecommendationReason(recommended, cpuBased, memoryBased)
    };
  }

  getWorkerRecommendationReason(recommended, cpuBased, memoryBased) {
    if (recommended === cpuBased && recommended === memoryBased) {
      return 'CPU and memory constraints align';
    } else if (recommended === cpuBased) {
      return 'Limited by CPU cores';
    } else if (recommended === memoryBased) {
      return 'Limited by available memory';
    } else {
      return 'Capped at maximum recommended workers';
    }
  }

  /**
   * Determine if system can handle additional load
   */
  canScaleUp() {
    const memoryUsage = this.getMemoryUsage();
    const freeMemoryGB = os.freemem() / (1024 ** 3);

    const checks = {
      canScale: true,
      reasons: [],
      metrics: {
        memoryUsage: memoryUsage.toFixed(2) + '%',
        freeMemoryGB: freeMemoryGB.toFixed(2) + ' GB',
        cpuCount: this.cpuCount
      }
    };

    // Check memory
    if (memoryUsage > 80) {
      checks.canScale = false;
      checks.reasons.push('Memory usage too high (>80%)');
    }

    if (freeMemoryGB < 2) {
      checks.canScale = false;
      checks.reasons.push('Insufficient free memory (<2GB)');
    }

    // Check load (Unix-like only)
    if (os.platform() !== 'win32') {
      const loadAvg = os.loadavg()[0];
      const normalizedLoad = loadAvg / this.cpuCount;

      if (normalizedLoad > 0.9) {
        checks.canScale = false;
        checks.reasons.push('CPU load too high (>90%)');
      }

      checks.metrics.load = loadAvg.toFixed(2);
      checks.metrics.normalizedLoad = normalizedLoad.toFixed(2);
    }

    if (checks.canScale) {
      checks.reasons.push('System has capacity for scaling');
    }

    return checks;
  }

  /**
   * Determine if system should scale down
   */
  shouldScaleDown() {
    const memoryUsage = this.getMemoryUsage();
    const checks = {
      shouldScale: false,
      reasons: [],
      confidence: 'low'
    };

    // Check if system is underutilized
    if (memoryUsage < 30) {
      checks.shouldScale = true;
      checks.reasons.push('Low memory usage (<30%)');
    }

    if (os.platform() !== 'win32') {
      const loadAvg = os.loadavg()[0];
      const normalizedLoad = loadAvg / this.cpuCount;

      if (normalizedLoad < 0.2) {
        checks.shouldScale = true;
        checks.reasons.push('Low CPU load (<20%)');
      }
    }

    // Determine confidence
    if (checks.reasons.length >= 2) {
      checks.confidence = 'high';
    } else if (checks.reasons.length === 1) {
      checks.confidence = 'medium';
    }

    return checks;
  }

  /**
   * Get scaling recommendation
   */
  getScalingRecommendation() {
    const scaleUp = this.canScaleUp();
    const scaleDown = this.shouldScaleDown();
    const currentWorkers = 4; // Example current state

    const recommendation = {
      action: 'maintain',
      confidence: 'medium',
      currentWorkers,
      recommendedWorkers: currentWorkers,
      reasoning: []
    };

    if (!scaleUp.canScale && currentWorkers > 1) {
      recommendation.action = 'scale_down';
      recommendation.recommendedWorkers = Math.max(1, currentWorkers - 1);
      recommendation.reasoning = scaleUp.reasons;
      recommendation.confidence = 'high';
    } else if (scaleDown.shouldScale && scaleDown.confidence === 'high') {
      recommendation.action = 'scale_down';
      recommendation.recommendedWorkers = Math.max(1, currentWorkers - 1);
      recommendation.reasoning = scaleDown.reasons;
      recommendation.confidence = scaleDown.confidence;
    } else if (scaleUp.canScale) {
      const optimal = this.getOptimalWorkerCount();
      if (optimal.recommended > currentWorkers) {
        recommendation.action = 'scale_up';
        recommendation.recommendedWorkers = optimal.recommended;
        recommendation.reasoning.push('System has capacity for more workers');
        recommendation.confidence = 'medium';
      }
    }

    return recommendation;
  }

  getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    return ((total - free) / total) * 100;
  }

  /**
   * Get comprehensive scaling analysis
   */
  analyzeScaling() {
    return {
      system: {
        cpus: this.cpuCount,
        totalMemoryGB: this.totalMemoryGB.toFixed(2),
        freeMemoryGB: (os.freemem() / (1024 ** 3)).toFixed(2),
        platform: os.platform()
      },
      workers: this.getOptimalWorkerCount(),
      canScaleUp: this.canScaleUp(),
      shouldScaleDown: this.shouldScaleDown(),
      recommendation: this.getScalingRecommendation()
    };
  }
}

// Example usage
const advisor = new ScalingAdvisor();

console.log('System Resources:');
console.log('CPU Cores:', advisor.cpuCount);
console.log('Total Memory:', advisor.totalMemoryGB.toFixed(2), 'GB');
console.log('Free Memory:', (os.freemem() / (1024 ** 3)).toFixed(2), 'GB');

console.log('\n=== Worker Count Recommendation ===\n');
const workerRec = advisor.getOptimalWorkerCount();
console.log('Recommended Workers:', workerRec.recommended);
console.log('CPU-based:', workerRec.cpuBased);
console.log('Memory-based:', workerRec.memoryBased);
console.log('Reasoning:', workerRec.reasoning);

console.log('\n=== Can Scale Up? ===\n');
const scaleUp = advisor.canScaleUp();
console.log('Can scale:', scaleUp.canScale ? 'Yes ✅' : 'No ❌');
console.log('Reasons:');
scaleUp.reasons.forEach(reason => console.log('  -', reason));

console.log('\n=== Should Scale Down? ===\n');
const scaleDown = advisor.shouldScaleDown();
console.log('Should scale down:', scaleDown.shouldScale ? 'Yes' : 'No');
console.log('Confidence:', scaleDown.confidence);
if (scaleDown.reasons.length > 0) {
  console.log('Reasons:');
  scaleDown.reasons.forEach(reason => console.log('  -', reason));
}

console.log('\n=== Scaling Recommendation ===\n');
const recommendation = advisor.getScalingRecommendation();
console.log('Action:', recommendation.action.toUpperCase());
console.log('Current workers:', recommendation.currentWorkers);
console.log('Recommended workers:', recommendation.recommendedWorkers);
console.log('Confidence:', recommendation.confidence);
if (recommendation.reasoning.length > 0) {
  console.log('Reasoning:');
  recommendation.reasoning.forEach(reason => console.log('  -', reason));
}

console.log('\n=== Complete Analysis ===\n');
const analysis = advisor.analyzeScaling();
console.log(JSON.stringify(analysis, null, 2));
