/**
 * Plugin Tests
 */

const assert = require('assert');
const path = require('path');
const Plugin = require('../src/plugin');

function describe(name, fn) {
  console.log(`\n${name}`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

describe('Plugin', () => {
  it('should create a plugin with valid manifest', () => {
    const plugin = new Plugin({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    assert.strictEqual(plugin.id, 'test-plugin');
    assert.strictEqual(plugin.name, 'Test Plugin');
    assert.strictEqual(plugin.version, '1.0.0');
    assert.strictEqual(plugin.status, Plugin.STATUS.UNLOADED);
  });

  it('should have default permissions', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    assert.ok(Array.isArray(plugin.permissions));
    assert.strictEqual(plugin.permissions.length, 0);
  });

  it('should check permissions correctly', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js',
      permissions: ['fs', 'network']
    }, {
      pluginDir: '/tmp/test'
    });

    assert.ok(plugin.hasPermission('fs'));
    assert.ok(plugin.hasPermission('network'));
    assert.ok(!plugin.hasPermission('crypto'));
  });

  it('should check wildcard permission', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js',
      permissions: ['*']
    }, {
      pluginDir: '/tmp/test'
    });

    assert.ok(plugin.hasPermission('fs'));
    assert.ok(plugin.hasPermission('network'));
    assert.ok(plugin.hasPermission('anything'));
  });

  it('should activate plugin', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    plugin.status = Plugin.STATUS.LOADED;
    plugin.activate();

    assert.strictEqual(plugin.status, Plugin.STATUS.ACTIVE);
    assert.ok(plugin.activatedAt > 0);
  });

  it('should disable plugin', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    plugin.status = Plugin.STATUS.ACTIVE;
    plugin.disable();

    assert.strictEqual(plugin.status, Plugin.STATUS.DISABLED);
  });

  it('should record execution statistics', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    plugin.recordExecution(100, true);
    plugin.recordExecution(200, true);
    plugin.recordExecution(150, false);

    assert.strictEqual(plugin.stats.executions, 3);
    assert.strictEqual(plugin.stats.errors, 1);
    assert.strictEqual(plugin.getAverageExecutionTime(), 150);
    assert.strictEqual(plugin.getErrorRate(), 1 / 3);
  });

  it('should check if plugin is callable', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }, {
      pluginDir: '/tmp/test'
    });

    assert.ok(!plugin.isCallable());

    plugin.status = Plugin.STATUS.ACTIVE;
    plugin.setExports({ execute: () => {} });

    assert.ok(plugin.isCallable());
  });

  it('should serialize to JSON', () => {
    const plugin = new Plugin({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js',
      permissions: ['fs']
    }, {
      pluginDir: '/tmp/test'
    });

    const json = plugin.toJSON();

    assert.strictEqual(json.id, 'test');
    assert.strictEqual(json.name, 'Test');
    assert.strictEqual(json.version, '1.0.0');
    assert.deepStrictEqual(json.permissions, ['fs']);
    assert.ok(json.stats);
  });

  it('should validate manifest schema', () => {
    assert.ok(Plugin.validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      main: 'index.js'
    }));

    assert.throws(() => {
      Plugin.validateManifest({
        name: 'Test',
        version: '1.0.0',
        main: 'index.js'
      });
    }, /Missing required field: id/);

    assert.throws(() => {
      Plugin.validateManifest({
        id: 'test',
        name: 'Test',
        version: 'invalid',
        main: 'index.js'
      });
    }, /Invalid version format/);

    assert.throws(() => {
      Plugin.validateManifest({
        id: 'Test Plugin',
        name: 'Test',
        version: '1.0.0',
        main: 'index.js'
      });
    }, /Invalid id format/);
  });
});

console.log('\n=== Plugin Tests Complete ===');
