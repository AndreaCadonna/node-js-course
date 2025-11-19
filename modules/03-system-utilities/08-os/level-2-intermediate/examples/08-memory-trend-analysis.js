/**
 * Example 8: Memory Trend Analysis
 *
 * This example demonstrates how to analyze memory usage
 * trends over time to detect patterns and issues.
 */

const os = require('os');

console.log('=== Memory Trend Analysis ===\n');
console.log('Collecting memory samples for 30 seconds...\n');

class MemoryTrendAnalyzer {
  constructor(sampleInterval = 2000) {
    this.sampleInterval = sampleInterval;
    this.samples = [];
    this.maxSamples = 100;
  }

  start() {
    console.log('Starting memory trend analysis...\n');

    // Take initial sample
    this.takeSample();

    // Set up interval
    this.timer = setInterval(() => {
      this.takeSample();
    }, this.sampleInterval);

    return this;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      console.log('\nAnalysis stopped');
      this.displayAnalysis();
    }
    return this;
  }

  takeSample() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = (used / total) * 100;

    const sample = {
      timestamp: Date.now(),
      total,
      free,
      used,
      usagePercent
    };

    this.samples.push(sample);

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    // Display sample
    const time = new Date(sample.timestamp).toLocaleTimeString();
    const bar = this.createMiniBar(usagePercent);
    console.log(`[${time}] ${bar} ${usagePercent.toFixed(1)}%`);

    return sample;
  }

  createMiniBar(percent) {
    const width = 20;
    const filled = Math.round((percent / 100) * width);
    return '[' + '='.repeat(filled) + ' '.repeat(width - filled) + ']';
  }

  getStatistics() {
    if (this.samples.length === 0) return null;

    const usages = this.samples.map(s => s.usagePercent);
    const avg = usages.reduce((a, b) => a + b, 0) / usages.length;
    const min = Math.min(...usages);
    const max = Math.max(...usages);

    // Calculate standard deviation
    const variance = usages.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / usages.length;
    const stdDev = Math.sqrt(variance);

    return {
      samples: this.samples.length,
      average: avg,
      minimum: min,
      maximum: max,
      range: max - min,
      stdDev,
      current: usages[usages.length - 1]
    };
  }

  detectTrend() {
    if (this.samples.length < 5) {
      return { trend: 'insufficient_data', confidence: 'low' };
    }

    // Use linear regression to detect trend
    const recent = this.samples.slice(-10);
    const usages = recent.map(s => s.usagePercent);

    // Simple trend detection: compare first half to second half
    const midpoint = Math.floor(usages.length / 2);
    const firstHalf = usages.slice(0, midpoint);
    const secondHalf = usages.slice(midpoint);

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = avgSecond - avgFirst;

    let trend = 'stable';
    let confidence = 'medium';

    if (Math.abs(difference) < 1) {
      trend = 'stable';
      confidence = 'high';
    } else if (difference > 2) {
      trend = 'increasing';
      confidence = difference > 5 ? 'high' : 'medium';
    } else if (difference < -2) {
      trend = 'decreasing';
      confidence = difference < -5 ? 'high' : 'medium';
    }

    return {
      trend,
      confidence,
      rate: difference.toFixed(2) + '%',
      message: this.getTrendMessage(trend, difference)
    };
  }

  getTrendMessage(trend, rate) {
    const absRate = Math.abs(rate);

    if (trend === 'stable') {
      return 'Memory usage is stable';
    } else if (trend === 'increasing') {
      if (absRate > 10) {
        return 'Memory usage is rapidly increasing - possible leak';
      } else if (absRate > 5) {
        return 'Memory usage is steadily increasing - monitor closely';
      } else {
        return 'Memory usage is slightly increasing - normal variation';
      }
    } else {
      return 'Memory usage is decreasing - memory being freed';
    }
  }

  detectAnomalies() {
    const stats = this.getStatistics();
    if (!stats) return [];

    const anomalies = [];
    const threshold = stats.stdDev * 2; // 2 standard deviations

    this.samples.forEach((sample, index) => {
      const deviation = Math.abs(sample.usagePercent - stats.average);

      if (deviation > threshold) {
        anomalies.push({
          index,
          timestamp: sample.timestamp,
          usage: sample.usagePercent,
          deviation,
          type: sample.usagePercent > stats.average ? 'spike' : 'drop'
        });
      }
    });

    return anomalies;
  }

  getPrediction() {
    if (this.samples.length < 10) {
      return { available: false, message: 'Insufficient data for prediction' };
    }

    const trend = this.detectTrend();
    const stats = this.getStatistics();

    // Simple linear prediction
    const rate = parseFloat(trend.rate);
    const minutesAhead = 5;
    const samplesAhead = (minutesAhead * 60 * 1000) / this.sampleInterval;
    const predicted = stats.current + (rate * samplesAhead / this.samples.length);

    return {
      available: true,
      predicted: Math.max(0, Math.min(100, predicted)),
      timeframe: `${minutesAhead} minutes`,
      confidence: trend.confidence,
      warning: predicted > 90 ? 'Memory may reach critical levels' : null
    };
  }

  displayAnalysis() {
    console.log('\n═══ Memory Trend Analysis ═══\n');

    // Statistics
    const stats = this.getStatistics();
    if (stats) {
      console.log('Statistics:');
      console.log('  Samples:', stats.samples);
      console.log('  Average:', stats.average.toFixed(2) + '%');
      console.log('  Minimum:', stats.minimum.toFixed(2) + '%');
      console.log('  Maximum:', stats.maximum.toFixed(2) + '%');
      console.log('  Range:', stats.range.toFixed(2) + '%');
      console.log('  Std Dev:', stats.stdDev.toFixed(2) + '%');
      console.log('  Current:', stats.current.toFixed(2) + '%');
      console.log('');
    }

    // Trend
    const trend = this.detectTrend();
    console.log('Trend Analysis:');
    console.log('  Trend:', trend.trend.toUpperCase());
    console.log('  Confidence:', trend.confidence);
    console.log('  Rate:', trend.rate);
    console.log('  Message:', trend.message);
    console.log('');

    // Anomalies
    const anomalies = this.detectAnomalies();
    console.log('Anomalies Detected:', anomalies.length);
    if (anomalies.length > 0) {
      anomalies.slice(0, 3).forEach(anomaly => {
        const time = new Date(anomaly.timestamp).toLocaleTimeString();
        console.log(`  [${time}] ${anomaly.type}: ${anomaly.usage.toFixed(2)}%`);
      });
      if (anomalies.length > 3) {
        console.log(`  ... and ${anomalies.length - 3} more`);
      }
    }
    console.log('');

    // Prediction
    const prediction = this.getPrediction();
    if (prediction.available) {
      console.log('Prediction:');
      console.log('  Timeframe:', prediction.timeframe);
      console.log('  Predicted usage:', prediction.predicted.toFixed(2) + '%');
      console.log('  Confidence:', prediction.confidence);
      if (prediction.warning) {
        console.log('  ⚠️  Warning:', prediction.warning);
      }
    } else {
      console.log('Prediction:', prediction.message);
    }
  }
}

// Create analyzer
const analyzer = new MemoryTrendAnalyzer(2000);

// Start analysis
analyzer.start();

// Stop after 30 seconds
setTimeout(() => {
  analyzer.stop();
}, 30000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  analyzer.stop();
  process.exit(0);
});
