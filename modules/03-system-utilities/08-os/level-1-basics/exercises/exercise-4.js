/**
 * Exercise 4: Cross-Platform Path Helper
 *
 * Create a utility that generates platform-appropriate file paths
 * for different types of application data.
 *
 * Requirements:
 * 1. Detect the current platform
 * 2. Generate paths for: config, data, cache, logs, temp
 * 3. Handle Windows, macOS, and Linux specifically
 * 4. Provide fallback for unknown platforms
 * 5. Create a function to ensure directories exist
 * 6. Display the paths in a formatted way
 *
 * Expected Output:
 * Platform: linux
 *
 * Application Paths for 'myapp':
 * Config : /home/username/.config/myapp
 * Data   : /home/username/.local/share/myapp
 * Cache  : /home/username/.cache/myapp
 * Logs   : /home/username/.local/share/myapp/logs
 * Temp   : /tmp/myapp
 *
 * Platform-Specific Settings:
 * Line Ending: \n (1 character)
 * Path Separator: /
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const APP_NAME = 'myapp';

// TODO: Implement the solution here

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
      // TODO: Implement Windows paths
      break;

    case 'darwin':
      // TODO: Implement macOS paths
      break;

    case 'linux':
      // TODO: Implement Linux paths
      break;

    default:
      // TODO: Implement fallback paths
      break;
  }

  return paths;
}

// Ensure directory exists
function ensureDirectory(dirPath) {
  // TODO: Implement this function
}

// Display paths
function displayPaths() {
  // TODO: Implement this function
}

// Run the display
displayPaths();
