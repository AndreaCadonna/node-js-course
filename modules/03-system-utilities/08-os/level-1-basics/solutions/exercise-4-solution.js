/**
 * Solution: Exercise 4 - Cross-Platform Path Helper
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const APP_NAME = 'myapp';

// Get platform-specific paths
function getAppPaths(appName) {
  const platform = os.platform();
  const home = os.homedir();

  const paths = {
    config: '',
    data: '',
    cache: '',
    logs: '',
    temp: path.join(os.tmpdir(), appName)
  };

  switch (platform) {
    case 'win32':
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
      paths.config = path.join(appData, appName);
      paths.data = path.join(localAppData, appName, 'data');
      paths.cache = path.join(localAppData, appName, 'cache');
      paths.logs = path.join(localAppData, appName, 'logs');
      break;

    case 'darwin':
      paths.config = path.join(home, 'Library', 'Application Support', appName);
      paths.data = path.join(home, 'Library', 'Application Support', appName, 'data');
      paths.cache = path.join(home, 'Library', 'Caches', appName);
      paths.logs = path.join(home, 'Library', 'Logs', appName);
      break;

    case 'linux':
      paths.config = path.join(home, '.config', appName);
      paths.data = path.join(home, '.local', 'share', appName);
      paths.cache = path.join(home, '.cache', appName);
      paths.logs = path.join(home, '.local', 'share', appName, 'logs');
      break;

    default:
      const baseDir = path.join(home, '.' + appName);
      paths.config = path.join(baseDir, 'config');
      paths.data = path.join(baseDir, 'data');
      paths.cache = path.join(baseDir, 'cache');
      paths.logs = path.join(baseDir, 'logs');
      break;
  }

  return paths;
}

// Ensure directory exists
function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Display paths
function displayPaths() {
  const platform = os.platform();
  const paths = getAppPaths(APP_NAME);

  console.log('Platform:', platform);
  console.log(`\nApplication Paths for '${APP_NAME}':`);
  console.log('Config :', paths.config);
  console.log('Data   :', paths.data);
  console.log('Cache  :', paths.cache);
  console.log('Logs   :', paths.logs);
  console.log('Temp   :', paths.temp);

  const eolLen = os.EOL.length;
  console.log('\nPlatform-Specific Settings:');
  console.log('Line Ending:', JSON.stringify(os.EOL), `(${eolLen} character${eolLen > 1 ? 's' : ''})`);
  console.log('Path Separator:', path.sep);
}

// Run the display
displayPaths();
