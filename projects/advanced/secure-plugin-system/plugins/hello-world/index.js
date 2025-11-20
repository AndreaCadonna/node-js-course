/**
 * Hello World Plugin
 * Demonstrates basic plugin functionality
 */

// Plugin initialization
function init() {
  console.log('Hello World plugin initialized');
}

// Main execution function (required)
function execute(name = 'World') {
  const greeting = `Hello, ${name}!`;
  console.log(greeting);

  return {
    message: greeting,
    timestamp: __api__.utils.timestamp(),
    plugin: __plugin__.name
  };
}

// Plugin cleanup
function destroy() {
  console.log('Hello World plugin destroyed');
}

// Export functions
module.exports = {
  init,
  execute,
  destroy
};
