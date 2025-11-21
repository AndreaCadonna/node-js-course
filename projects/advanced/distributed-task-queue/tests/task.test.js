/**
 * Task Tests
 */

const assert = require('assert');
const Task = require('../src/task');

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

describe('Task', () => {
  it('should create a new task', () => {
    const task = new Task({
      type: 'test',
      payload: { data: 'test' }
    });

    assert.strictEqual(task.type, 'test');
    assert.deepStrictEqual(task.payload, { data: 'test' });
    assert.strictEqual(task.status, Task.STATUS.PENDING);
    assert.strictEqual(task.attempts, 0);
  });

  it('should start a task', () => {
    const task = new Task({ type: 'test' });
    task.start('worker-1');

    assert.strictEqual(task.status, Task.STATUS.PROCESSING);
    assert.strictEqual(task.attempts, 1);
    assert.strictEqual(task.workerId, 'worker-1');
    assert.ok(task.startedAt > 0);
  });

  it('should complete a task', () => {
    const task = new Task({ type: 'test' });
    task.start('worker-1');
    task.complete({ result: 'success' });

    assert.strictEqual(task.status, Task.STATUS.COMPLETED);
    assert.deepStrictEqual(task.result, { result: 'success' });
    assert.strictEqual(task.progress, 100);
    assert.ok(task.completedAt > 0);
  });

  it('should fail a task with retry', () => {
    const task = new Task({ type: 'test', maxAttempts: 3 });
    task.start('worker-1');
    task.fail(new Error('Test error'));

    assert.strictEqual(task.status, Task.STATUS.RETRYING);
    assert.ok(task.error);
    assert.strictEqual(task.error.message, 'Test error');
    assert.ok(task.canRetry());
  });

  it('should fail a task permanently after max attempts', () => {
    const task = new Task({ type: 'test', maxAttempts: 1 });
    task.start('worker-1');
    task.fail(new Error('Test error'));

    assert.strictEqual(task.status, Task.STATUS.FAILED);
    assert.ok(!task.canRetry());
    assert.ok(task.completedAt > 0);
  });

  it('should update task progress', () => {
    const task = new Task({ type: 'test' });
    task.updateProgress(50);

    assert.strictEqual(task.progress, 50);
  });

  it('should throw error for invalid progress', () => {
    const task = new Task({ type: 'test' });

    assert.throws(() => {
      task.updateProgress(150);
    }, /Progress must be between 0 and 100/);
  });

  it('should calculate retry delay with exponential backoff', () => {
    const task = new Task({
      type: 'test',
      retryDelay: 1000,
      retryBackoff: 'exponential'
    });

    task.attempts = 1;
    assert.strictEqual(task.getRetryDelay(), 1000);

    task.attempts = 2;
    assert.strictEqual(task.getRetryDelay(), 2000);

    task.attempts = 3;
    assert.strictEqual(task.getRetryDelay(), 4000);
  });

  it('should calculate retry delay with linear backoff', () => {
    const task = new Task({
      type: 'test',
      retryDelay: 1000,
      retryBackoff: 'linear'
    });

    task.attempts = 1;
    assert.strictEqual(task.getRetryDelay(), 1000);

    task.attempts = 2;
    assert.strictEqual(task.getRetryDelay(), 2000);

    task.attempts = 3;
    assert.strictEqual(task.getRetryDelay(), 3000);
  });

  it('should detect timeout', () => {
    const task = new Task({ type: 'test', timeout: 1000 });
    task.start('worker-1');

    assert.ok(!task.hasTimedOut());

    // Simulate passage of time
    task.startedAt = Date.now() - 2000;
    assert.ok(task.hasTimedOut());
  });

  it('should serialize to JSON', () => {
    const task = new Task({
      type: 'test',
      payload: { data: 'test' },
      priority: 5
    });

    const json = task.toJSON();

    assert.strictEqual(json.type, 'test');
    assert.deepStrictEqual(json.payload, { data: 'test' });
    assert.strictEqual(json.priority, 5);
    assert.ok(json.id);
    assert.ok(json.createdAt);
  });

  it('should deserialize from JSON', () => {
    const original = new Task({
      type: 'test',
      payload: { data: 'test' }
    });

    const json = original.toJSON();
    const restored = Task.fromJSON(json);

    assert.strictEqual(restored.id, original.id);
    assert.strictEqual(restored.type, original.type);
    assert.deepStrictEqual(restored.payload, original.payload);
    assert.strictEqual(restored.status, original.status);
  });

  it('should calculate execution time', () => {
    const task = new Task({ type: 'test' });
    task.start('worker-1');
    task.startedAt = Date.now() - 5000;
    task.complete({ result: 'success' });

    const executionTime = task.getExecutionTime();
    assert.ok(executionTime >= 5000);
  });

  it('should calculate waiting time', () => {
    const task = new Task({ type: 'test' });
    task.createdAt = Date.now() - 10000;
    task.start('worker-1');

    const waitingTime = task.getWaitingTime();
    assert.ok(waitingTime >= 10000);
  });
});

console.log('\n=== Task Tests Complete ===');
