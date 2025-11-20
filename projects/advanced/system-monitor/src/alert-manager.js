/**
 * Alert Manager - Handles alert thresholds and notifications
 *
 * Features:
 * - Configurable thresholds
 * - Alert cooldown to prevent spam
 * - Webhook notifications
 * - Alert history
 */

const { EventEmitter } = require('events');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');

class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.thresholds = options.thresholds || {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 }
    };

    this.webhooks = options.webhooks || [];
    this.cooldownPeriod = options.cooldownPeriod || 300000; // 5 minutes
    this.alertFile = options.alertFile || path.join(__dirname, '../alerts/history.json');

    this.alerts = [];
    this.activeAlerts = new Map(); // metric -> last alert time
    this.alertHistory = [];
  }

  /**
   * Check metrics against thresholds
   */
  checkMetrics(metrics) {
    const alerts = [];

    // Check CPU usage
    if (metrics.cpu && typeof metrics.cpu.usage === 'number') {
      const cpuAlert = this.checkThreshold('cpu', metrics.cpu.usage, metrics.timestamp);
      if (cpuAlert) alerts.push(cpuAlert);
    }

    // Check memory usage
    if (metrics.memory && typeof metrics.memory.usedPercentage === 'number') {
      const memAlert = this.checkThreshold('memory', metrics.memory.usedPercentage, metrics.timestamp);
      if (memAlert) alerts.push(memAlert);
    }

    // Check disk usage (if available)
    if (metrics.disk && typeof metrics.disk.usedPercentage === 'number') {
      const diskAlert = this.checkThreshold('disk', metrics.disk.usedPercentage, metrics.timestamp);
      if (diskAlert) alerts.push(diskAlert);
    }

    // Process alerts
    for (const alert of alerts) {
      this.handleAlert(alert);
    }

    return alerts;
  }

  /**
   * Check a single metric against its thresholds
   */
  checkThreshold(metric, value, timestamp) {
    const thresholds = this.thresholds[metric];
    if (!thresholds) return null;

    // Determine severity
    let severity = null;
    if (value >= thresholds.critical) {
      severity = 'critical';
    } else if (value >= thresholds.warning) {
      severity = 'warning';
    } else {
      // Clear any active alert for this metric
      if (this.activeAlerts.has(metric)) {
        this.activeAlerts.delete(metric);
        return {
          metric,
          severity: 'resolved',
          value,
          timestamp,
          message: `${metric.toUpperCase()} usage returned to normal: ${value}%`
        };
      }
      return null;
    }

    // Check cooldown
    const lastAlertTime = this.activeAlerts.get(metric);
    if (lastAlertTime && (timestamp - lastAlertTime) < this.cooldownPeriod) {
      return null; // Still in cooldown
    }

    // Create alert
    this.activeAlerts.set(metric, timestamp);

    return {
      metric,
      severity,
      value,
      threshold: thresholds[severity],
      timestamp,
      message: `${metric.toUpperCase()} usage ${severity}: ${value}% (threshold: ${thresholds[severity]}%)`
    };
  }

  /**
   * Handle an alert
   */
  async handleAlert(alert) {
    console.log(`[Alert] ${alert.severity.toUpperCase()}: ${alert.message}`);

    // Add to history
    this.alertHistory.push(alert);
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Emit event
    this.emit('alert', alert);

    // Send webhooks
    if (this.webhooks.length > 0) {
      await this.sendWebhooks(alert);
    }

    // Save to file
    await this.saveAlert(alert);
  }

  /**
   * Send alert to webhooks
   */
  async sendWebhooks(alert) {
    const payload = JSON.stringify({
      alert: alert,
      timestamp: new Date(alert.timestamp).toISOString(),
      hostname: require('os').hostname()
    });

    const promises = this.webhooks.map(webhookUrl => {
      return this.sendWebhook(webhookUrl, payload);
    });

    try {
      await Promise.all(promises);
      console.log(`[Alert] Webhooks sent to ${this.webhooks.length} endpoints`);
    } catch (err) {
      console.error('[Alert] Webhook error:', err);
    }
  }

  /**
   * Send single webhook
   */
  sendWebhook(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
      const parsed = url.parse(webhookUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const options = {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode });
          } else {
            reject(new Error(`Webhook failed: ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();

      // Timeout after 5 seconds
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Webhook timeout'));
      });
    });
  }

  /**
   * Save alert to file
   */
  async saveAlert(alert) {
    try {
      const dir = path.dirname(this.alertFile);
      await fs.mkdir(dir, { recursive: true });

      const line = JSON.stringify(alert) + '\n';
      await fs.appendFile(this.alertFile, line);
    } catch (err) {
      console.error('[Alert] Failed to save alert:', err);
    }
  }

  /**
   * Get alert history
   */
  getHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    const now = Date.now();
    const active = [];

    for (const [metric, timestamp] of this.activeAlerts.entries()) {
      active.push({
        metric,
        timestamp,
        age: now - timestamp
      });
    }

    return active;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const byMetric = {};
    const bySeverity = {
      warning: 0,
      critical: 0,
      resolved: 0
    };

    for (const alert of this.alertHistory) {
      // By metric
      if (!byMetric[alert.metric]) {
        byMetric[alert.metric] = 0;
      }
      byMetric[alert.metric]++;

      // By severity
      if (bySeverity[alert.severity] !== undefined) {
        bySeverity[alert.severity]++;
      }
    }

    return {
      total: this.alertHistory.length,
      byMetric,
      bySeverity,
      active: this.activeAlerts.size
    };
  }
}

module.exports = AlertManager;
