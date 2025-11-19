/**
 * Example 4: User Information
 *
 * This example demonstrates how to retrieve user information
 * and important directory paths.
 */

const os = require('os');
const path = require('path');

console.log('=== User Information ===\n');

// Get current user information
const userInfo = os.userInfo();

console.log('Username:', userInfo.username);
console.log('Home Directory:', userInfo.homedir);
console.log('Shell:', userInfo.shell || 'N/A (Windows)');

// UID and GID are only available on Unix-like systems
if (userInfo.uid !== undefined) {
  console.log('UID (User ID):', userInfo.uid);
  console.log('GID (Group ID):', userInfo.gid);
} else {
  console.log('UID/GID: Not available on Windows');
}

console.log('\n=== Directory Information ===\n');

// Get important directories
console.log('Home Directory:', os.homedir());
console.log('Temporary Directory:', os.tmpdir());
console.log('Current Working Directory:', process.cwd());

console.log('\n=== Platform-Specific Paths ===\n');

// Get platform-specific application data path
function getAppDataPath(appName) {
  const platform = os.platform();
  const home = os.homedir();

  switch (platform) {
    case 'win32':
      // Windows: C:\Users\username\AppData\Roaming\appname
      return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), appName);

    case 'darwin':
      // macOS: /Users/username/Library/Application Support/appname
      return path.join(home, 'Library', 'Application Support', appName);

    case 'linux':
      // Linux: /home/username/.config/appname
      return path.join(home, '.config', appName);

    default:
      // Fallback: /home/username/.appname
      return path.join(home, '.' + appName);
  }
}

const appName = 'myapp';
console.log(`App Data Path for '${appName}':`, getAppDataPath(appName));

console.log('\n=== Platform-Specific Config Paths ===\n');

// Get platform-specific configuration paths
function getConfigPaths(appName) {
  const platform = os.platform();
  const home = os.homedir();

  const paths = {
    config: '',
    cache: '',
    logs: ''
  };

  switch (platform) {
    case 'win32':
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      paths.config = path.join(appData, appName, 'config');
      paths.cache = path.join(localAppData, appName, 'cache');
      paths.logs = path.join(localAppData, appName, 'logs');
      break;

    case 'darwin':
      paths.config = path.join(home, 'Library', 'Application Support', appName);
      paths.cache = path.join(home, 'Library', 'Caches', appName);
      paths.logs = path.join(home, 'Library', 'Logs', appName);
      break;

    case 'linux':
      paths.config = path.join(home, '.config', appName);
      paths.cache = path.join(home, '.cache', appName);
      paths.logs = path.join(home, '.local', 'share', appName, 'logs');
      break;

    default:
      paths.config = path.join(home, '.' + appName);
      paths.cache = path.join(home, '.' + appName, 'cache');
      paths.logs = path.join(home, '.' + appName, 'logs');
  }

  return paths;
}

const configPaths = getConfigPaths(appName);
console.log('Configuration Paths:');
console.log('Config:', configPaths.config);
console.log('Cache:', configPaths.cache);
console.log('Logs:', configPaths.logs);

console.log('\n=== Temporary File Handling ===\n');

// Working with temporary directory
const tmpDir = os.tmpdir();
console.log('System Temp Directory:', tmpDir);

// Create app-specific temp path
const appTempPath = path.join(tmpDir, appName);
console.log('App Temp Directory:', appTempPath);

// Create session-specific temp path
const sessionId = Date.now().toString();
const sessionTempPath = path.join(tmpDir, appName, sessionId);
console.log('Session Temp Directory:', sessionTempPath);

console.log('\n=== User Profile Summary ===\n');

// Create comprehensive user profile
const userProfile = {
  user: {
    username: userInfo.username,
    homedir: userInfo.homedir,
    shell: userInfo.shell || 'N/A',
    uid: userInfo.uid || 'N/A',
    gid: userInfo.gid || 'N/A'
  },
  directories: {
    home: os.homedir(),
    temp: os.tmpdir(),
    cwd: process.cwd()
  },
  appPaths: configPaths,
  platform: os.platform()
};

console.log('User Profile:');
console.log(JSON.stringify(userProfile, null, 2));
