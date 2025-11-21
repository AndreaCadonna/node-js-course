// File Monitor - Client Application

class MonitorApp {
  constructor() {
    this.eventSource = null;
    this.paused = false;
    this.changes = [];
    this.maxChanges = 100;

    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupEventSource();
    this.loadInitialData();
  }

  setupElements() {
    this.statusEl = document.getElementById('status');
    this.watchPathInput = document.getElementById('watch-path-input');
    this.watchBtn = document.getElementById('watch-btn');
    this.watchedPathsList = document.getElementById('watched-paths-list');
    this.changesList = document.getElementById('changes-list');
    this.resetBtn = document.getElementById('reset-btn');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.updateFilterBtn = document.getElementById('update-filter-btn');
  }

  setupEventListeners() {
    this.watchBtn.addEventListener('click', () => {
      this.watchPath();
    });

    this.watchPathInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.watchPath();
      }
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetStats();
    });

    this.clearHistoryBtn.addEventListener('click', () => {
      this.clearHistory();
    });

    this.pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });

    this.updateFilterBtn.addEventListener('click', () => {
      this.updateFilter();
    });
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

    this.eventSource.addEventListener('paths', (e) => {
      const paths = JSON.parse(e.data);
      this.updatePaths(paths);
    });

    this.eventSource.addEventListener('filter', (e) => {
      const filter = JSON.parse(e.data);
      this.updateFilterDisplay(filter);
    });

    this.eventSource.addEventListener('change', (e) => {
      const change = JSON.parse(e.data);
      this.addChange(change);
    });

    this.eventSource.addEventListener('watching', (e) => {
      const data = JSON.parse(e.data);
      console.log('Now watching:', data.path);
    });

    this.eventSource.addEventListener('unwatched', (e) => {
      const data = JSON.parse(e.data);
      console.log('Stopped watching:', data.path);
    });

    this.eventSource.addEventListener('error', (e) => {
      console.error('Monitor error:', e);
    });
  }

  updateStatus(connected) {
    this.statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    this.statusEl.className = 'status-indicator' + (connected ? ' connected' : '');
  }

  async loadInitialData() {
    try {
      const [paths, stats, filter] = await Promise.all([
        fetch('/api/paths').then(r => r.json()),
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/filter').then(r => r.json())
      ]);

      this.updatePaths(paths);
      this.updateStats(stats);
      this.updateFilterDisplay(filter);

      // Load history
      const history = await fetch('/api/history?limit=50').then(r => r.json());
      history.reverse().forEach(change => this.addChange(change, false));
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }

  async watchPath() {
    const path = this.watchPathInput.value.trim();

    if (!path) {
      alert('Please enter a path to watch');
      return;
    }

    try {
      const response = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });

      if (response.ok) {
        this.watchPathInput.value = '';
      } else {
        const error = await response.json();
        alert(`Failed to watch path: ${error.error}`);
      }
    } catch (err) {
      alert(`Failed to watch path: ${err.message}`);
    }
  }

  async unwatchPath(path) {
    if (!confirm(`Stop watching ${path}?`)) {
      return;
    }

    try {
      await fetch('/api/unwatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
    } catch (err) {
      alert(`Failed to unwatch path: ${err.message}`);
    }
  }

  updatePaths(paths) {
    if (!paths || paths.length === 0) {
      this.watchedPathsList.innerHTML = '<p class="empty-state">No paths being watched</p>';
      return;
    }

    this.watchedPathsList.innerHTML = paths.map(path => `
      <div class="path-item">
        <span class="path-text">${this.escapeHtml(path)}</span>
        <button class="btn btn-danger" onclick="app.unwatchPath('${this.escapeAttr(path)}')">
          Unwatch
        </button>
      </div>
    `).join('');
  }

  updateStats(stats) {
    document.getElementById('total-changes').textContent = stats.totalChanges || 0;
    document.getElementById('filtered-changes').textContent = stats.filteredChanges || 0;
    document.getElementById('watched-paths').textContent = stats.watchedPaths || 0;
    document.getElementById('tracked-files').textContent = stats.trackedFiles || 0;
    document.getElementById('uptime').textContent = this.formatDuration(stats.uptime);
    document.getElementById('changes-per-sec').textContent = stats.changesPerSecond || '0';

    // Update change types
    const typesEl = document.getElementById('change-types');

    if (!stats.byType || Object.keys(stats.byType).length === 0) {
      typesEl.innerHTML = '<p class="empty-state">No changes yet</p>';
      return;
    }

    typesEl.innerHTML = Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `
        <div class="type-item">
          <span class="type-name">${type}</span>
          <span class="type-count">${count}</span>
        </div>
      `).join('');
  }

  updateFilterDisplay(filter) {
    document.getElementById('filter-hidden').checked = filter.ignoreHidden;

    if (filter.includeExtensions && filter.includeExtensions.length > 0) {
      document.getElementById('filter-include-ext').value = filter.includeExtensions.join(',');
    }

    if (filter.excludeExtensions && filter.excludeExtensions.length > 0) {
      document.getElementById('filter-exclude-ext').value = filter.excludeExtensions.join(',');
    }

    if (filter.changeTypes && filter.changeTypes.length > 0) {
      document.getElementById('filter-change-types').value = filter.changeTypes.join(',');
    }
  }

  async updateFilter() {
    const ignoreHidden = document.getElementById('filter-hidden').checked;
    const includeExt = document.getElementById('filter-include-ext').value;
    const excludeExt = document.getElementById('filter-exclude-ext').value;
    const changeTypes = document.getElementById('filter-change-types').value;

    const filter = {
      ignoreHidden
    };

    if (includeExt.trim()) {
      filter.includeExtensions = includeExt.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (excludeExt.trim()) {
      filter.excludeExtensions = excludeExt.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (changeTypes.trim()) {
      filter.changeTypes = changeTypes.split(',').map(s => s.trim()).filter(Boolean);
    }

    try {
      await fetch('/api/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter)
      });

      alert('Filter updated successfully');
    } catch (err) {
      alert(`Failed to update filter: ${err.message}`);
    }
  }

  addChange(change, animate = true) {
    if (this.paused) return;

    // Remove empty state
    if (this.changesList.querySelector('.empty-state')) {
      this.changesList.innerHTML = '';
    }

    const changeHtml = `
      <div class="change-item ${change.type}">
        <div class="change-header">
          <span class="change-type ${change.type}">${change.type}</span>
          <span class="change-time">${this.formatTime(change.timestamp)}</span>
        </div>
        <div class="change-path">${this.escapeHtml(change.path)}</div>
        ${this.renderChangeDetails(change)}
      </div>
    `;

    this.changesList.insertAdjacentHTML('afterbegin', changeHtml);

    // Limit number of displayed changes
    const items = this.changesList.querySelectorAll('.change-item');
    if (items.length > this.maxChanges) {
      items[items.length - 1].remove();
    }
  }

  renderChangeDetails(change) {
    const details = [];

    if (change.stats) {
      if (change.stats.size !== undefined) {
        details.push(`<div class="change-detail">
          <span class="detail-label">Size:</span>
          <span class="detail-value">${this.formatBytes(change.stats.size)}</span>
        </div>`);
      }

      if (change.stats.isDirectory) {
        details.push(`<div class="change-detail">
          <span class="detail-label">Type:</span>
          <span class="detail-value">Directory</span>
        </div>`);
      }
    }

    if (change.directory) {
      details.push(`<div class="change-detail">
        <span class="detail-label">Directory:</span>
        <span class="detail-value">${this.escapeHtml(change.directory)}</span>
      </div>`);
    }

    if (details.length === 0) return '';

    return `<div class="change-details">${details.join('')}</div>`;
  }

  async resetStats() {
    if (!confirm('Reset all statistics?')) {
      return;
    }

    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (err) {
      alert(`Failed to reset stats: ${err.message}`);
    }
  }

  clearHistory() {
    this.changesList.innerHTML = '<p class="empty-state">No file changes detected yet. Start watching a directory to see changes.</p>';
  }

  togglePause() {
    this.paused = !this.paused;
    this.pauseBtn.textContent = this.paused ? 'Resume' : 'Pause';

    if (this.paused) {
      this.pauseBtn.insertAdjacentHTML('afterend', '<span class="paused-indicator">PAUSED</span>');
    } else {
      const indicator = document.querySelector('.paused-indicator');
      if (indicator) indicator.remove();
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(seconds) {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  escapeAttr(text) {
    return text.replace(/'/g, "\\'");
  }

  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new MonitorApp();
});
