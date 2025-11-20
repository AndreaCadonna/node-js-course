// File Upload Service - Client Application

class UploadApp {
  constructor() {
    this.selectedFiles = [];
    this.uploads = new Map();
    this.eventSource = null;

    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.setupEventSource();
    this.loadFiles();
    this.loadStats();
  }

  setupElements() {
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.uploadBtn = document.getElementById('upload-btn');
    this.autoUpload = document.getElementById('auto-upload');
    this.uploadQueue = document.getElementById('upload-queue');
    this.filesList = document.getElementById('files-list');
    this.statusEl = document.getElementById('status');
    this.clearCompletedBtn = document.getElementById('clear-completed-btn');
    this.refreshFilesBtn = document.getElementById('refresh-files-btn');
  }

  setupEventListeners() {
    // Drop zone events
    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('drag-over');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('drag-over');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('drag-over');
      this.handleFiles(Array.from(e.dataTransfer.files));
    });

    // File input
    this.fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    });

    // Upload button
    this.uploadBtn.addEventListener('click', () => {
      this.uploadSelectedFiles();
    });

    // Clear completed button
    this.clearCompletedBtn.addEventListener('click', () => {
      this.clearCompleted();
    });

    // Refresh files button
    this.refreshFilesBtn.addEventListener('click', () => {
      this.loadFiles();
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

    this.eventSource.addEventListener('upload-start', (e) => {
      const data = JSON.parse(e.data);
      console.log('Upload started:', data);
    });

    this.eventSource.addEventListener('upload-progress', (e) => {
      const data = JSON.parse(e.data);
      this.updateProgress(data.uploadId, data.percentage);
    });

    this.eventSource.addEventListener('upload-complete', (e) => {
      const data = JSON.parse(e.data);
      this.markComplete(data.id);
      this.loadFiles();
    });

    this.eventSource.addEventListener('upload-error', (e) => {
      const data = JSON.parse(e.data);
      this.markError(data.uploadId, data.error.message);
    });
  }

  updateStatus(connected) {
    this.statusEl.textContent = connected ? 'Connected' : 'Disconnected';
    this.statusEl.className = 'status-indicator' + (connected ? ' connected' : '');
  }

  handleFiles(files) {
    this.selectedFiles.push(...files);
    this.updateUploadButton();

    if (this.autoUpload.checked) {
      this.uploadFiles(files);
    } else {
      // Just show in queue
      files.forEach(file => {
        this.addToQueue(file, 'pending');
      });
    }
  }

  updateUploadButton() {
    this.uploadBtn.disabled = this.selectedFiles.length === 0;
    this.uploadBtn.textContent = this.selectedFiles.length > 0
      ? `Upload ${this.selectedFiles.length} File(s)`
      : 'Upload Selected Files';
  }

  uploadSelectedFiles() {
    if (this.selectedFiles.length > 0) {
      this.uploadFiles([...this.selectedFiles]);
      this.selectedFiles = [];
      this.updateUploadButton();
    }
  }

  async uploadFiles(files) {
    for (const file of files) {
      await this.uploadFile(file);
    }
  }

  async uploadFile(file) {
    const uploadId = this.generateId();
    this.addToQueue(file, 'uploading', uploadId);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();

      // Track progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = (e.loaded / e.total) * 100;
          this.updateProgress(uploadId, percentage);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          this.markComplete(uploadId);
          this.loadStats();
        } else {
          this.markError(uploadId, 'Upload failed');
        }
      });

      // Handle error
      xhr.addEventListener('error', () => {
        this.markError(uploadId, 'Network error');
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

    } catch (err) {
      this.markError(uploadId, err.message);
    }
  }

  addToQueue(file, status, uploadId = null) {
    const id = uploadId || this.generateId();

    // Remove empty state
    if (this.uploadQueue.querySelector('.empty-state')) {
      this.uploadQueue.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = `upload-item ${status}`;
    item.id = `upload-${id}`;

    item.innerHTML = `
      <div class="upload-header">
        <div class="upload-info">
          <div class="upload-filename">${this.escapeHtml(file.name)}</div>
          <div class="upload-meta">${this.formatBytes(file.size)}</div>
        </div>
        <span class="upload-status ${status}">${status}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">0%</div>
    `;

    this.uploadQueue.insertBefore(item, this.uploadQueue.firstChild);
    this.uploads.set(id, { file, status, element: item });

    return id;
  }

  updateProgress(uploadId, percentage) {
    const upload = this.uploads.get(uploadId);
    if (!upload) return;

    const progressFill = upload.element.querySelector('.progress-fill');
    const progressText = upload.element.querySelector('.progress-text');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${percentage.toFixed(1)}%`;
    }
  }

  markComplete(uploadId) {
    const upload = this.uploads.get(uploadId);
    if (!upload) return;

    upload.status = 'complete';
    upload.element.className = 'upload-item complete';

    const status = upload.element.querySelector('.upload-status');
    if (status) {
      status.className = 'upload-status complete';
      status.textContent = 'complete';
    }

    const progressFill = upload.element.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }

    const progressText = upload.element.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = '100%';
    }
  }

  markError(uploadId, message) {
    const upload = this.uploads.get(uploadId);
    if (!upload) return;

    upload.status = 'error';
    upload.element.className = 'upload-item error';

    const status = upload.element.querySelector('.upload-status');
    if (status) {
      status.className = 'upload-status error';
      status.textContent = 'error';
    }

    const progressText = upload.element.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = message;
    }
  }

  clearCompleted() {
    for (const [id, upload] of this.uploads) {
      if (upload.status === 'complete') {
        upload.element.remove();
        this.uploads.delete(id);
      }
    }

    if (this.uploads.size === 0) {
      this.uploadQueue.innerHTML = '<p class="empty-state">No uploads yet. Select files to begin.</p>';
    }
  }

  async loadFiles() {
    try {
      const response = await fetch('/api/uploads');
      const uploads = await response.json();

      if (uploads.length === 0) {
        this.filesList.innerHTML = '<p class="empty-state">No uploaded files.</p>';
        return;
      }

      this.filesList.innerHTML = uploads
        .filter(u => u.status === 'complete')
        .map(upload => {
          const ext = upload.safeFilename.split('.').pop().toUpperCase();
          return `
            <div class="file-item">
              <div class="file-info">
                <div class="file-icon">${ext}</div>
                <div class="file-details">
                  <div class="file-name">${this.escapeHtml(upload.originalFilename)}</div>
                  <div class="file-meta">
                    ${this.formatBytes(upload.size)} &bull;
                    ${new Date(upload.endTime).toLocaleString()}
                  </div>
                </div>
              </div>
              <div class="file-actions">
                <a href="/uploads/${upload.safeFilename}" class="file-link" target="_blank">
                  View
                </a>
                <button class="btn btn-danger" onclick="app.deleteFile('${upload.id}')">
                  Delete
                </button>
              </div>
            </div>
          `;
        })
        .join('');
    } catch (err) {
      console.error('Failed to load files:', err);
    }
  }

  async deleteFile(uploadId) {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/uploads/${uploadId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        this.loadFiles();
        this.loadStats();
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file');
    }
  }

  async loadStats() {
    try {
      const response = await fetch('/api/stats');
      const stats = await response.json();
      this.updateStats(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  updateStats(stats) {
    document.getElementById('total-uploads').textContent = stats.total || 0;
    document.getElementById('uploading-count').textContent = stats.uploading || 0;
    document.getElementById('complete-count').textContent = stats.complete || 0;
    document.getElementById('error-count').textContent = stats.error || 0;
    document.getElementById('total-size').textContent = this.formatBytes(stats.totalBytes || 0);
    document.getElementById('avg-duration').textContent =
      stats.averageDuration ? `${(stats.averageDuration / 1000).toFixed(2)}s` : '0s';
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new UploadApp();
});
