/**
 * Example 7: Advanced Cross-Platform Handling
 *
 * This example demonstrates handling platform differences
 * and providing appropriate fallbacks.
 */

const os = require('os');
const path = require('path');

console.log('=== Advanced Cross-Platform Handling ===\n');

class CrossPlatformHelper {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.isMac = this.platform === 'darwin';
    this.isLinux = this.platform === 'linux';
    this.isUnix = !this.isWindows;
  }

  /**
   * Get platform-specific system information
   */
  getSystemInfo() {
    const info = {
      platform: this.platform,
      platformName: this.getPlatformName(),
      type: os.type(),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      features: this.getAvailableFeatures()
    };

    return info;
  }

  getPlatformName() {
    const names = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux',
      'freebsd': 'FreeBSD',
      'openbsd': 'OpenBSD',
      'sunos': 'SunOS',
      'aix': 'AIX'
    };
    return names[this.platform] || this.platform;
  }

  /**
   * Check which OS features are available
   */
  getAvailableFeatures() {
    return {
      loadAverage: this.isUnix,
      userInfo: true,
      cpuInfo: true,
      networkInterfaces: true,
      signals: this.isUnix,
      processGroups: this.isUnix
    };
  }

  /**
   * Get load average with fallback
   */
  getLoadAverage() {
    if (this.isUnix) {
      return {
        available: true,
        values: os.loadavg(),
        interpretation: this.interpretLoad(os.loadavg()[0])
      };
    }

    return {
      available: false,
      message: 'Load average not available on Windows',
      alternative: 'Use Process Monitor or Task Manager for Windows'
    };
  }

  interpretLoad(load) {
    const cpuCount = os.cpus().length;
    const normalized = load / cpuCount;

    if (normalized < 0.7) return 'Normal';
    if (normalized < 1.0) return 'High';
    return 'Critical';
  }

  /**
   * Get user info with platform-specific handling
   */
  getUserInfo() {
    const userInfo = os.userInfo();

    const info = {
      username: userInfo.username,
      homedir: userInfo.homedir
    };

    if (this.isUnix) {
      info.uid = userInfo.uid;
      info.gid = userInfo.gid;
      info.shell = userInfo.shell;
    } else {
      info.note = 'UID/GID/Shell not available on Windows';
    }

    return info;
  }

  /**
   * Get platform-appropriate temp directory
   */
  getTempDirectory() {
    const tmpDir = os.tmpdir();

    return {
      path: tmpDir,
      platform: this.platform,
      note: this.isWindows ?
        'Windows temp typically in %TEMP%' :
        'Unix temp typically /tmp'
    };
  }

  /**
   * Get platform-specific executable extension
   */
  getExecutableExtension() {
    return this.isWindows ? '.exe' : '';
  }

  /**
   * Get platform-specific shell
   */
  getDefaultShell() {
    if (this.isWindows) {
      return process.env.COMSPEC || 'cmd.exe';
    } else if (this.isMac) {
      return process.env.SHELL || '/bin/zsh';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Get platform-specific line endings
   */
  getLineEnding() {
    return {
      eol: os.EOL,
      display: JSON.stringify(os.EOL),
      length: os.EOL.length,
      type: os.EOL === '\r\n' ? 'CRLF (Windows)' : 'LF (Unix)',
      bytes: Buffer.from(os.EOL).toString('hex')
    };
  }

  /**
   * Get platform-specific path separator
   */
  getPathInfo() {
    return {
      separator: path.sep,
      delimiter: path.delimiter,
      example: this.isWindows ?
        'C:\\Users\\username\\file.txt' :
        '/home/username/file.txt'
    };
  }

  /**
   * Detect if running in containerized environment
   */
  isContainerized() {
    // This is a simplified check
    const checks = {
      hasDockerEnv: require('fs').existsSync('/.dockerenv'),
      hasCgroupDocker: false,
      isContainer: false
    };

    try {
      const fs = require('fs');
      if (fs.existsSync('/proc/1/cgroup')) {
        const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
        checks.hasCgroupDocker = cgroup.includes('docker') || cgroup.includes('kubepods');
      }
    } catch (e) {
      // Ignore errors
    }

    checks.isContainer = checks.hasDockerEnv || checks.hasCgroupDocker;

    return checks;
  }

  /**
   * Get comprehensive platform report
   */
  getPlatformReport() {
    return {
      system: this.getSystemInfo(),
      user: this.getUserInfo(),
      paths: {
        temp: this.getTempDirectory(),
        home: os.homedir(),
        separator: this.getPathInfo()
      },
      loadAverage: this.getLoadAverage(),
      lineEnding: this.getLineEnding(),
      shell: {
        default: this.getDefaultShell(),
        executable: this.getExecutableExtension()
      },
      container: this.isContainerized(),
      capabilities: {
        supportsColors: process.stdout.isTTY,
        supportsUnicode: process.stdout.isTTY
      }
    };
  }
}

// Example usage
const helper = new CrossPlatformHelper();

console.log('System Information:');
const sysInfo = helper.getSystemInfo();
console.log('Platform:', sysInfo.platformName, `(${sysInfo.platform})`);
console.log('Type:', sysInfo.type);
console.log('Release:', sysInfo.release);
console.log('Architecture:', sysInfo.arch);
console.log('');

console.log('Available Features:');
Object.entries(sysInfo.features).forEach(([feature, available]) => {
  const status = available ? '✅' : '❌';
  console.log(`${status} ${feature}`);
});
console.log('');

console.log('Load Average:');
const load = helper.getLoadAverage();
if (load.available) {
  console.log('1-min:', load.values[0].toFixed(2), '-', load.interpretation);
  console.log('5-min:', load.values[1].toFixed(2));
  console.log('15-min:', load.values[2].toFixed(2));
} else {
  console.log(load.message);
  console.log('Alternative:', load.alternative);
}
console.log('');

console.log('User Information:');
const userInfo = helper.getUserInfo();
Object.entries(userInfo).forEach(([key, value]) => {
  console.log(`${key}:`, value);
});
console.log('');

console.log('Line Ending:');
const lineEnding = helper.getLineEnding();
console.log('Type:', lineEnding.type);
console.log('Value:', lineEnding.display);
console.log('Length:', lineEnding.length, 'bytes');
console.log('Hex:', lineEnding.bytes);
console.log('');

console.log('Path Information:');
const pathInfo = helper.getPathInfo();
console.log('Separator:', JSON.stringify(pathInfo.separator));
console.log('Delimiter:', JSON.stringify(pathInfo.delimiter));
console.log('Example:', pathInfo.example);
console.log('');

console.log('Container Detection:');
const container = helper.isContainerized();
console.log('Is containerized:', container.isContainer ? 'Yes' : 'No');
console.log('Docker env:', container.hasDockerEnv);
console.log('Cgroup Docker:', container.hasCgroupDocker);
console.log('');

console.log('=== Complete Platform Report ===\n');
const report = helper.getPlatformReport();
console.log(JSON.stringify(report, null, 2));
