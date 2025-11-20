/**
 * Secure Plugin System
 * Main entry point
 */

const PluginManager = require('./plugin-manager');
const Plugin = require('./plugin');
const PluginLoader = require('./plugin-loader');
const PluginAPI = require('./plugin-api');
const Sandbox = require('./sandbox');
const Security = require('./security');

module.exports = {
  PluginManager,
  Plugin,
  PluginLoader,
  PluginAPI,
  Sandbox,
  Security
};
