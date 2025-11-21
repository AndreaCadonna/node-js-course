// Dashboard Application - Client-side JavaScript
class LogDashboard {
  constructor() {
    this.eventSource = null;
    this.maxBars = 10;
    this.init();
  }

  init() {
    this.setupEventSource();
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventSource() {
    this.eventSource = new EventSource('/api/events');

    this.eventSource.addEventListener('open', () => {
      this.updateStatus(true);
    });

    this.eventSource.addEventListener('error', () => {
      this.updateStatus(false);
    });

    this.eventSource.addEventListener('stats', (e) => {
      const stats = JSON.parse(e.data);
      this.updateStats(stats);
    });

    this.eventSource.addEventListener('alert', (e) => {
      const alert = JSON.parse(e.data);
      this.addAlert(alert);
    });

    this.eventSource.addEventListener('entry', (e) => {
      const entry = JSON.parse(e.data);
      this.addLogEntry(entry);
    });

    this.eventSource.addEventListener('complete', (e) => {
      const stats = JSON.parse(e.data);
      this.updateStats(stats);
    });

    this.eventSource.addEventListener('error', (e) => {
      console.error('EventSource error:', e);
    });
  }

  setupEventListeners() {
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.resetStats();
    });
  }

  async loadInitialData() {
    try {
      const response = await fetch('/api/stats');
      const stats = await response.json();
      this.updateStats(stats);

      const alertsResponse = await fetch('/api/alerts');
      const alerts = await alertsResponse.json();
      this.updateAlerts(alerts);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }

  updateStatus(connected) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    statusEl.className = 'status-indicator' + (connected ? ' connected' : '');
  }

  updateStats(stats) {
    // Update overview stats
    document.getElementById('total-lines').textContent =
      stats.totalLines.toLocaleString();
    document.getElementById('error-count').textContent =
      stats.errorCount.toLocaleString();
    document.getElementById('warn-count').textContent =
      stats.warnCount.toLocaleString();
    document.getElementById('error-rate').textContent =
      stats.errorRate || '0%';
    document.getElementById('duration').textContent =
      this.formatDuration(stats.duration);
    document.getElementById('lines-per-sec').textContent =
      stats.linesPerSecond || '0';

    // Update charts
    this.updateBarChart('status-codes', stats.statusCodes);
    this.updateBarChart('methods', stats.topMethods);
    this.updateBarChart('log-levels', stats.levels);
    this.updateBarChart('top-paths', stats.topPaths, true);
    this.updateList('top-ips', stats.topIps);

    // Update errors
    if (stats.errors && stats.errors.length > 0) {
      this.updateErrors(stats.errors);
    }

    // Update recent logs
    if (stats.recentLogs && stats.recentLogs.length > 0) {
      this.updateRecentLogs(stats.recentLogs);
    }
  }

  updateBarChart(elementId, data, isTopItems = false) {
    const container = document.getElementById(elementId);

    if (!data || (Array.isArray(data) && data.length === 0) ||
        (!Array.isArray(data) && Object.keys(data).length === 0)) {
      container.innerHTML = '<p class="empty-state">No data available</p>';
      return;
    }

    let items;
    if (isTopItems) {
      items = data; // Already in [{ key, value }] format
    } else if (Array.isArray(data)) {
      items = data;
    } else {
      items = Object.entries(data)
        .map(([key, value]) => ({ key, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, this.maxBars);
    }

    const maxValue = Math.max(...items.map(item => item.value));

    container.innerHTML = items.map(item => {
      const percentage = (item.value / maxValue) * 100;
      return `
        <div class="bar-item">
          <span class="bar-label">${this.escapeHtml(item.key)}</span>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%">
              <span class="bar-value">${item.value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateList(elementId, data) {
    const container = document.getElementById(elementId);

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="empty-state">No data available</p>';
      return;
    }

    container.innerHTML = data.map(item => `
      <div class="list-item">
        <span class="list-item-key">${this.escapeHtml(item.key)}</span>
        <span class="list-item-value">${item.value.toLocaleString()}</span>
      </div>
    `).join('');
  }

  updateAlerts(alerts) {
    const container = document.getElementById('alerts');

    if (!alerts || alerts.length === 0) {
      container.innerHTML = '<p class="empty-state">No alerts</p>';
      return;
    }

    container.innerHTML = alerts.slice(0, 20).map(alert => `
      <div class="alert-item">
        <div class="alert-header">
          <span class="alert-pattern">${this.escapeHtml(alert.pattern)}</span>
          <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
        </div>
        <div class="alert-message">
          ${this.escapeHtml(alert.entry.message || alert.entry.raw || '')}
        </div>
      </div>
    `).join('');
  }

  addAlert(alert) {
    const container = document.getElementById('alerts');

    if (container.querySelector('.empty-state')) {
      container.innerHTML = '';
    }

    const alertHtml = `
      <div class="alert-item">
        <div class="alert-header">
          <span class="alert-pattern">${this.escapeHtml(alert.pattern)}</span>
          <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
        </div>
        <div class="alert-message">
          ${this.escapeHtml(alert.entry.message || alert.entry.raw || '')}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('afterbegin', alertHtml);

    // Limit number of displayed alerts
    const alerts = container.querySelectorAll('.alert-item');
    if (alerts.length > 20) {
      alerts[alerts.length - 1].remove();
    }
  }

  updateErrors(errors) {
    const container = document.getElementById('errors');

    if (!errors || errors.length === 0) {
      container.innerHTML = '<p class="empty-state">No errors</p>';
      return;
    }

    container.innerHTML = errors.slice(0, 20).map(error => `
      <div class="error-item">
        <div class="error-time">${this.formatTime(error.timestamp)}</div>
        <div class="error-message">${this.escapeHtml(error.message)}</div>
      </div>
    `).join('');
  }

  updateRecentLogs(logs) {
    const container = document.getElementById('recent-logs');

    if (!logs || logs.length === 0) {
      container.innerHTML = '<p class="empty-state">No logs processed</p>';
      return;
    }

    container.innerHTML = logs.slice(0, 50).map(log => {
      const level = log.level || 'info';
      const levelClass = level.toLowerCase();
      return `
        <div class="log-item ${levelClass}">
          <span class="log-timestamp">${this.formatTime(log.timestamp)}</span>
          <span class="log-level ${level}">${level}</span>
          <span class="log-message">${this.escapeHtml(log.message || log.raw || '')}</span>
        </div>
      `;
    }).join('');
  }

  addLogEntry(entry) {
    const container = document.getElementById('recent-logs');

    if (container.querySelector('.empty-state')) {
      container.innerHTML = '';
    }

    const level = entry.level || 'info';
    const levelClass = level.toLowerCase();
    const logHtml = `
      <div class="log-item ${levelClass}">
        <span class="log-timestamp">${this.formatTime(entry.timestamp)}</span>
        <span class="log-level ${level}">${level}</span>
        <span class="log-message">${this.escapeHtml(entry.message || entry.raw || '')}</span>
      </div>
    `;

    container.insertAdjacentHTML('afterbegin', logHtml);

    // Limit number of displayed logs
    const logs = container.querySelectorAll('.log-item');
    if (logs.length > 50) {
      logs[logs.length - 1].remove();
    }
  }

  async resetStats() {
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        // Clear all displays
        document.getElementById('alerts').innerHTML = '<p class="empty-state">No alerts</p>';
        document.getElementById('errors').innerHTML = '<p class="empty-state">No errors</p>';
        document.getElementById('recent-logs').innerHTML = '<p class="empty-state">No logs processed</p>';
      }
    } catch (err) {
      console.error('Failed to reset stats:', err);
    }
  }

  formatDuration(seconds) {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new LogDashboard();
});
